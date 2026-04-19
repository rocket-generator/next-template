export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFormat = "auto" | "json" | "pretty";
export type LogContext = Record<string, unknown>;

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  event: string;
  message: string;
  context?: LogContext;
  error?: SerializedError;
}

export interface LogOptions {
  context?: LogContext;
  error?: unknown;
  capture?: boolean;
}

export interface MonitoringAdapter {
  captureException(error: Error, context?: LogContext): void;
  captureMessage?(message: string, context?: LogContext): void;
  setUser?(user: LogContext): void;
  setTags?(tags: LogContext): void;
  addBreadcrumb?(breadcrumb: LogContext): void;
}

export interface LogSink {
  write(entry: LogEntry, rendered: string): void;
}

export interface Logger {
  debug(event: string, message: string, options?: LogOptions): void;
  info(event: string, message: string, options?: LogOptions): void;
  warn(event: string, message: string, options?: LogOptions): void;
  error(event: string, message: string, options?: LogOptions): void;
  child(context: LogContext): Logger;
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const REDACTED = "[redacted]";
const UNSERIALIZABLE = "[unserializable]";
const CIRCULAR = "[circular]";
const MAX_DEPTH = 5;
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "cookie",
  "secret",
  "secretAccessKey",
  "accessKeyId",
  "apiKey",
  "clientSecret",
  "refreshToken",
]);

const noopMonitoringAdapter: MonitoringAdapter = {
  captureException: () => undefined,
};

class ConsoleLogSink implements LogSink {
  write(entry: LogEntry, rendered: string): void {
    if (typeof console === "undefined") {
      return;
    }

    const target =
      entry.level === "debug"
        ? console.debug
        : entry.level === "info"
        ? console.info
        : entry.level === "warn"
        ? console.warn
        : console.error;

    target.call(console, rendered);
  }
}

let logSinks: LogSink[] = [new ConsoleLogSink()];
let monitoringAdapter: MonitoringAdapter = noopMonitoringAdapter;

function getEnvValue(name: string): string | undefined {
  if (typeof process === "undefined") {
    return undefined;
  }

  return process.env?.[name];
}

function hasOwnEntries(value: LogContext | undefined): value is LogContext {
  return value !== undefined && Object.keys(value).length > 0;
}

function resolveLogLevel(): LogLevel {
  const value = getEnvValue("LOG_LEVEL");

  if (
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error"
  ) {
    return value;
  }

  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[resolveLogLevel()];
}

export function resolveLogFormat(
  format?: LogFormat
): Exclude<LogFormat, "auto"> {
  const value = format ?? getEnvValue("LOG_FORMAT") ?? "auto";

  if (value === "json" || value === "pretty") {
    return value;
  }

  return getEnvValue("NODE_ENV") === "production" ? "json" : "pretty";
}

function serializeUnknown(
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (depth > MAX_DEPTH) {
    return `[max-depth:${MAX_DEPTH}]`;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "undefined") {
    return undefined;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeUnknown(item, depth + 1, seen));
  }

  if (typeof value === "function" || typeof value === "symbol") {
    return UNSERIALIZABLE;
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return CIRCULAR;
  }

  seen.add(value);

  const serialized: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (SENSITIVE_KEYS.has(key)) {
      serialized[key] = REDACTED;
      continue;
    }

    const normalized = serializeUnknown(nestedValue, depth + 1, seen);
    if (normalized !== undefined) {
      serialized[key] = normalized;
    }
  }

  seen.delete(value);
  return serialized;
}

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }

  const sanitized = serializeUnknown(context, 0, new WeakSet());

  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) {
    return undefined;
  }

  return sanitized as LogContext;
}

function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }

  return {
    name: "Error",
    message:
      typeof error === "string"
        ? error
        : error === undefined
        ? "Unknown error"
        : String(error),
  };
}

function toCaptureError(error: unknown, message: string): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    typeof error === "string"
      ? error
      : error === undefined
      ? message
      : String(error)
  );
}

export function formatLogEntry(entry: LogEntry, format?: LogFormat): string {
  const resolvedFormat = resolveLogFormat(format);

  if (resolvedFormat === "json") {
    return JSON.stringify(entry);
  }

  const segments = [
    `${entry.timestamp}`,
    `[${entry.level.toUpperCase()}]`,
    `${entry.scope}`,
    `${entry.event}`,
    `${entry.message}`,
  ];

  if (entry.context) {
    segments.push(JSON.stringify(entry.context));
  }

  if (entry.error) {
    segments.push(JSON.stringify(entry.error));
  }

  return segments.join(" ");
}

function writeEntry(entry: LogEntry): void {
  const rendered = formatLogEntry(entry);
  for (const sink of logSinks) {
    sink.write(entry, rendered);
  }
}

function createMonitoringContext(entry: LogEntry): LogContext {
  return {
    scope: entry.scope,
    event: entry.event,
    message: entry.message,
    ...(entry.context ?? {}),
  };
}

function maybeCapture(
  entry: LogEntry,
  options: LogOptions | undefined,
  rawError: unknown
): void {
  const context = createMonitoringContext(entry);

  if (entry.level === "error") {
    monitoringAdapter.captureException(
      toCaptureError(rawError, entry.message),
      context
    );
    return;
  }

  if (entry.level === "warn" && options?.capture === true) {
    if (monitoringAdapter.captureMessage) {
      monitoringAdapter.captureMessage(entry.message, context);
      return;
    }

    monitoringAdapter.captureException(
      toCaptureError(rawError, entry.message),
      context
    );
  }
}

function logWithScope(
  scope: string,
  defaultContext: LogContext | undefined,
  level: LogLevel,
  event: string,
  message: string,
  options?: LogOptions
): void {
  if (!shouldLog(level)) {
    return;
  }

  const context = sanitizeContext({
    ...(defaultContext ?? {}),
    ...(options?.context ?? {}),
  });
  const serializedError =
    options?.error !== undefined ? serializeError(options.error) : undefined;
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    event,
    message,
    ...(hasOwnEntries(context) ? { context } : {}),
    ...(serializedError ? { error: serializedError } : {}),
  };

  writeEntry(entry);
  maybeCapture(entry, options, options?.error);
}

export function createLogger(
  scope: string,
  defaultContext?: LogContext
): Logger {
  return {
    debug(event, message, options) {
      logWithScope(scope, defaultContext, "debug", event, message, options);
    },
    info(event, message, options) {
      logWithScope(scope, defaultContext, "info", event, message, options);
    },
    warn(event, message, options) {
      logWithScope(scope, defaultContext, "warn", event, message, options);
    },
    error(event, message, options) {
      logWithScope(scope, defaultContext, "error", event, message, options);
    },
    child(context) {
      return createLogger(scope, {
        ...(defaultContext ?? {}),
        ...context,
      });
    },
  };
}

export function setLogSinks(sinks: LogSink[]): void {
  logSinks = [...sinks];
}

export function setMonitoringAdapter(adapter: MonitoringAdapter): void {
  monitoringAdapter = adapter;
}

export function resetLoggerState(): void {
  logSinks = [new ConsoleLogSink()];
  monitoringAdapter = noopMonitoringAdapter;
}
