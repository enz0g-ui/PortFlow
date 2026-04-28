type Level = "debug" | "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: Level;
  scope: string;
  msg: string;
  [key: string]: unknown;
}

const isProd = process.env.NODE_ENV === "production";
const useJson = process.env.LOG_FORMAT === "json" || isProd;

function emit(entry: LogEntry) {
  if (useJson) {
    const line = JSON.stringify(entry);
    if (entry.level === "error") console.error(line);
    else if (entry.level === "warn") console.warn(line);
    else console.log(line);
    return;
  }
  const prefix = `[${entry.scope}]`;
  const detail = Object.keys(entry).filter(
    (k) => !["ts", "level", "scope", "msg"].includes(k),
  );
  const tail = detail.length
    ? " " +
      detail
        .map((k) => `${k}=${typeof entry[k] === "object" ? JSON.stringify(entry[k]) : entry[k]}`)
        .join(" ")
    : "";
  if (entry.level === "error") console.error(prefix, entry.msg + tail);
  else if (entry.level === "warn") console.warn(prefix, entry.msg + tail);
  else console.log(prefix, entry.msg + tail);
}

export class Logger {
  constructor(private scope: string) {}
  child(scope: string) {
    return new Logger(`${this.scope}.${scope}`);
  }
  info(msg: string, extra?: Record<string, unknown>) {
    emit({ ts: new Date().toISOString(), level: "info", scope: this.scope, msg, ...(extra ?? {}) });
  }
  warn(msg: string, extra?: Record<string, unknown>) {
    emit({ ts: new Date().toISOString(), level: "warn", scope: this.scope, msg, ...(extra ?? {}) });
  }
  error(msg: string, extra?: Record<string, unknown>) {
    emit({ ts: new Date().toISOString(), level: "error", scope: this.scope, msg, ...(extra ?? {}) });
    if (process.env.SENTRY_DSN) {
      reportSentry({ scope: this.scope, msg, extra });
    }
  }
  debug(msg: string, extra?: Record<string, unknown>) {
    if (process.env.LOG_LEVEL !== "debug") return;
    emit({ ts: new Date().toISOString(), level: "debug", scope: this.scope, msg, ...(extra ?? {}) });
  }
}

function reportSentry(payload: {
  scope: string;
  msg: string;
  extra?: Record<string, unknown>;
}) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  fetch(dsn.replace(/^https?:\/\//, "https://").replace(/\/[^/]+$/, "/api/0/envelope/"), {
    method: "POST",
    headers: { "content-type": "application/x-sentry-envelope" },
    body: JSON.stringify({
      timestamp: Date.now() / 1000,
      level: "error",
      logger: payload.scope,
      message: payload.msg,
      extra: payload.extra,
    }),
    signal: AbortSignal.timeout(2000),
  }).catch(() => {
    /* never throw from logger */
  });
}

export const log = new Logger("port-flow");
