type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, string | number | boolean | null | undefined>;

const service = process.env.DD_SERVICE ?? "workshop-edge";
const env = process.env.APP_ENV ?? process.env.DD_ENV ?? "local";

function write(level: LogLevel, message: string, fields: LogFields = {}): void {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service,
    env,
    ...fields,
  });

  if (level === "error" || level === "warn") {
    console.error(payload);
  } else {
    console.log(payload);
  }
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
