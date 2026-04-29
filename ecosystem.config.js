const { readFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");

function loadDotenv(file) {
  const p = resolve(__dirname, file);
  if (!existsSync(p)) return {};
  const out = {};
  for (const raw of readFileSync(p, "utf-8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const dotenv = {
  ...loadDotenv(".env"),
  ...loadDotenv(".env.production"),
  ...loadDotenv(".env.local"),
};

module.exports = {
  apps: [
    {
      name: "port-flow-web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        ...dotenv,
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "1G",
      autorestart: true,
      watch: false,
    },
  ],
};
