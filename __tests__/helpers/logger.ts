import type {
  LogContext,
  LogEntry,
  LogSink,
  MonitoringAdapter,
} from "@/libraries/logger";

type LoggerModule = typeof import("@/libraries/logger");

function loadLoggerModule(): LoggerModule {
  return require("@/libraries/logger") as LoggerModule;
}

export class MemoryLogSink implements LogSink {
  public entries: LogEntry[] = [];
  public rendered: string[] = [];

  write(entry: LogEntry, rendered: string): void {
    this.entries.push(entry);
    this.rendered.push(rendered);
  }
}

export class MemoryMonitoringAdapter implements MonitoringAdapter {
  public exceptions: Array<{ error: Error; context?: LogContext }> = [];
  public messages: Array<{ message: string; context?: LogContext }> = [];

  captureException(error: Error, context?: LogContext): void {
    this.exceptions.push({ error, context });
  }

  captureMessage(message: string, context?: LogContext): void {
    this.messages.push({ message, context });
  }
}

let currentLogSink: MemoryLogSink | null = null;
let currentMonitoringAdapter: MemoryMonitoringAdapter | null = null;

export function installTestLoggerAdapters(): {
  sink: MemoryLogSink;
  monitoringAdapter: MemoryMonitoringAdapter;
} {
  currentLogSink = new MemoryLogSink();
  currentMonitoringAdapter = new MemoryMonitoringAdapter();

  const loggerModule = loadLoggerModule();
  loggerModule.setLogSinks([currentLogSink]);
  loggerModule.setMonitoringAdapter(currentMonitoringAdapter);

  return {
    sink: currentLogSink,
    monitoringAdapter: currentMonitoringAdapter,
  };
}

export function resetTestLoggerState(): void {
  currentLogSink = null;
  currentMonitoringAdapter = null;
  loadLoggerModule().resetLoggerState();
}

export function getLoggedEntries(): LogEntry[] {
  return currentLogSink?.entries ?? [];
}

export function getCapturedExceptions(): Array<{
  error: Error;
  context?: LogContext;
}> {
  return currentMonitoringAdapter?.exceptions ?? [];
}

export function getCapturedMessages(): Array<{
  message: string;
  context?: LogContext;
}> {
  return currentMonitoringAdapter?.messages ?? [];
}
