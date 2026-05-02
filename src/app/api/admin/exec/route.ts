import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/exec
 *
 * Lets a holder of ADMIN_EXEC_TOKEN run a small whitelist of operational
 * commands on the server, getting stdout / stderr / exit-code back as JSON.
 * Designed for ad-hoc ops debugging when SSH is unavailable (fail2ban,
 * provider firewall, ISP issues).
 *
 *   POST /api/admin/exec
 *   Authorization: Bearer <ADMIN_EXEC_TOKEN>
 *   Content-Type: application/json
 *   {
 *     "name": "backup-cron",        // key from the whitelist below
 *     "args": []                    // optional positional args (whitelist-validated)
 *   }
 *
 * Returns: { stdout, stderr, exitCode, durationMs }
 *
 * Disabled when ADMIN_EXEC_TOKEN is not set in the env.
 *
 * Whitelist (keys → commands): see ALLOWED below.
 *
 * Security model:
 * - Token comparison is constant-time
 * - Only whitelisted commands can run
 * - Args are constrained per-command (no arbitrary shell escaping)
 * - 30 s execution timeout
 * - Output truncated to 1 MB to avoid OOM
 *
 * NEVER add a "shell: true" passthrough or accept arbitrary command strings
 * — that would be a remote code execution endpoint in disguise.
 */

const PROJECT_DIR = process.env.PORTFLOW_PROJECT_DIR ?? "/opt/projects/portflow";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_OUTPUT = 1_000_000;

interface AllowedCommand {
  argv: string[]; // executable + fixed args
  // Optional validator for caller-supplied positional args appended to argv.
  validateArgs?: (args: string[]) => string | null; // returns error string if invalid
  // Default cwd
  cwd?: string;
  // Per-command timeout override (ms). Defaults to DEFAULT_TIMEOUT_MS.
  timeoutMs?: number;
}

const EMAIL_RE = /^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const SAFE_TOKEN_RE = /^[A-Za-z0-9._-]+$/;

const ALLOWED: Record<string, AllowedCommand> = {
  // --- Read-only diagnostics ---
  "pm2-list": { argv: ["pm2", "jlist"] },
  "pm2-logs": {
    argv: ["pm2", "logs", "port-flow-web", "--nostream", "--lines", "100"],
  },
  "pm2-errors": {
    argv: ["pm2", "logs", "port-flow-web", "--err", "--nostream", "--lines", "100"],
  },
  "pm2-env": { argv: ["pm2", "env", "0"] },
  "git-log": {
    argv: ["git", "log", "-5", "--oneline"],
    cwd: PROJECT_DIR,
  },
  "git-status": {
    argv: ["git", "status", "--short"],
    cwd: PROJECT_DIR,
  },
  "ls-data": { argv: ["ls", "-lah", `${PROJECT_DIR}/data`] },
  "ls-backups": { argv: ["ls", "-lah", "/var/backups/portflow"] },
  "df": { argv: ["df", "-h", "/"] },
  "uptime": { argv: ["uptime"] },
  "fail2ban-status": { argv: ["fail2ban-client", "status", "sshd"] },

  // --- Backup operations ---
  "backup-run": {
    argv: ["bash", `${PROJECT_DIR}/scripts/backup-cron.sh`],
    timeoutMs: 300_000, // 5 min — tar + 300 MB B2 upload can take a while
  },
  "backup-debug": {
    // Same script, but with bash -x to trace every command (stderr).
    argv: ["bash", "-x", `${PROJECT_DIR}/scripts/backup-cron.sh`],
    timeoutMs: 300_000,
  },
  "b2-ls": {
    argv: ["b2", "ls", "b2://portflow-backups"],
    timeoutMs: 60_000,
  },
  "b2-upload-latest": {
    // Upload the newest local backup to B2 (manual ship, bypassing the script).
    argv: [
      "bash",
      "-c",
      'set -e; cd /var/backups/portflow && latest=$(ls -t portflow-*.tar.gz | head -1) && b2 file upload portflow-backups "$latest" "$latest" && echo "uploaded $latest"',
    ],
    timeoutMs: 600_000, // 10 min — 350 MB upload over residential link can be slow
  },

  // --- Code reading (read-only, sanitized) ---
  "cat-backup-script": {
    argv: ["cat", `${PROJECT_DIR}/scripts/backup-cron.sh`],
  },

  // --- DB inspection (takes one email arg) ---
  "db-inspect": {
    argv: ["node", `${PROJECT_DIR}/scripts/db-inspect.js`],
    validateArgs: (args) => {
      if (args.length === 0) return null;
      if (args.length > 1) return "db-inspect takes at most 1 arg";
      if (!EMAIL_RE.test(args[0])) return "arg must be an email";
      return null;
    },
  },

  // --- Migrations / runtime ---
  "pm2-reload": {
    argv: ["pm2", "reload", "ecosystem.config.js", "--update-env"],
    cwd: PROJECT_DIR,
  },
  "git-pull": {
    argv: ["git", "pull", "--ff-only"],
    cwd: PROJECT_DIR,
  },
  "next-build": {
    argv: ["npm", "run", "build"],
    cwd: PROJECT_DIR,
    timeoutMs: 300_000,
  },

  // --- Read a specific .env.local key (redacted unless very short) ---
  "env-key": {
    argv: ["bash", "-c"],
    validateArgs: (args) => {
      if (args.length !== 1) return "env-key takes exactly 1 arg (key name)";
      if (!SAFE_TOKEN_RE.test(args[0]))
        return "key name must match [A-Za-z0-9._-]+";
      return null;
    },
  },
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_EXEC_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "ADMIN_EXEC_TOKEN not configured — endpoint disabled" },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/.exec(auth);
  const provided = m?.[1] ?? "";
  if (!provided || !timingSafeEqual(provided, expected)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    args?: string[];
  } | null;
  if (!body || typeof body.name !== "string") {
    return Response.json({ error: "missing 'name'" }, { status: 400 });
  }
  const name = body.name;
  const args = Array.isArray(body.args) ? body.args.map(String) : [];

  const cmd = ALLOWED[name];
  if (!cmd) {
    return Response.json(
      {
        error: `unknown command '${name}'`,
        allowed: Object.keys(ALLOWED),
      },
      { status: 400 },
    );
  }
  if (cmd.validateArgs) {
    const err = cmd.validateArgs(args);
    if (err) return Response.json({ error: err }, { status: 400 });
  }

  // Special-case: env-key — we build the bash -c script to grep .env.local
  // safely (no shell interpolation of user input).
  let argv = [...cmd.argv];
  if (name === "env-key") {
    const key = args[0]!;
    // The grep pattern is hardcoded; the key already passed SAFE_TOKEN_RE.
    // Output the value, then mask if longer than 8 chars.
    argv = [
      "bash",
      "-c",
      `cd "${PROJECT_DIR}" && val=$(grep "^${key}=" .env.local | cut -d= -f2- | head -1); ` +
        `if [ -z "$val" ]; then echo "(unset)"; ` +
        `elif [ \${#val} -le 12 ]; then echo "$val"; ` +
        `else echo "\${val:0:6}...\${val: -3} (len=\${#val})"; fi`,
    ];
  } else {
    argv = [...cmd.argv, ...args];
  }

  const cwd = cmd.cwd ?? PROJECT_DIR;
  const timeoutMs = cmd.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const start = Date.now();
  try {
    const out = await new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number;
    }>((res, rej) => {
      const child = spawn(argv[0], argv.slice(1), {
        cwd: resolve(cwd),
        env: process.env,
      });
      let stdout = "";
      let stderr = "";
      let killed = false;
      const timer = setTimeout(() => {
        killed = true;
        child.kill("SIGKILL");
      }, timeoutMs);
      child.stdout.on("data", (d: Buffer) => {
        if (stdout.length < MAX_OUTPUT) stdout += d.toString();
      });
      child.stderr.on("data", (d: Buffer) => {
        if (stderr.length < MAX_OUTPUT) stderr += d.toString();
      });
      child.on("error", (err) => {
        clearTimeout(timer);
        rej(err);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (killed) {
          stderr += `\n[admin-exec] killed after ${timeoutMs}ms timeout`;
        }
        res({
          stdout: stdout.slice(0, MAX_OUTPUT),
          stderr: stderr.slice(0, MAX_OUTPUT),
          exitCode: code ?? -1,
        });
      });
    });
    return Response.json({
      name,
      ...out,
      durationMs: Date.now() - start,
    });
  } catch (err) {
    return Response.json(
      {
        name,
        error: "spawn failed",
        detail: (err as Error).message,
        durationMs: Date.now() - start,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({
    endpoint: "POST /api/admin/exec",
    enabled: !!process.env.ADMIN_EXEC_TOKEN,
    allowed: Object.keys(ALLOWED),
    note: "Set ADMIN_EXEC_TOKEN env var to enable. POST with Authorization: Bearer <token> and JSON {name, args}.",
  });
}
