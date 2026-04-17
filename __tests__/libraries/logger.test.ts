import type { LogEntry } from "@/libraries/logger";
import {
  getCapturedExceptions,
  getCapturedMessages,
  getLoggedEntries,
  installTestLoggerAdapters,
  resetTestLoggerState,
} from "../helpers/logger";

type LoggerModule = typeof import("@/libraries/logger");

const loadLoggerModule = (): LoggerModule =>
  require("@/libraries/logger") as LoggerModule;

describe("logger", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
    };
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FORMAT;
  });

  afterEach(() => {
    resetTestLoggerState();
    process.env = originalEnv;
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).EdgeRuntime;
  });

  it("should drop debug and info when LOG_LEVEL=warn", () => {
    process.env.LOG_LEVEL = "warn";

    const loggerModule = loadLoggerModule();
    installTestLoggerAdapters();

    const logger = loggerModule.createLogger("test_scope");

    logger.debug("test.debug", "debug message");
    logger.info("test.info", "info message");
    logger.warn("test.warn", "warn message");
    logger.error("test.error", "error message");

    expect(getLoggedEntries().map((entry) => entry.level)).toEqual([
      "warn",
      "error",
    ]);
  });

  it("should emit every level when LOG_LEVEL=debug", () => {
    process.env.LOG_LEVEL = "debug";

    const loggerModule = loadLoggerModule();
    installTestLoggerAdapters();

    const logger = loggerModule.createLogger("test_scope");

    logger.debug("test.debug", "debug message");
    logger.info("test.info", "info message");
    logger.warn("test.warn", "warn message");
    logger.error("test.error", "error message");

    expect(getLoggedEntries().map((entry) => entry.level)).toEqual([
      "debug",
      "info",
      "warn",
      "error",
    ]);
  });

  it("should merge child context and keep the parent scope", () => {
    const loggerModule = loadLoggerModule();
    installTestLoggerAdapters();

    const logger = loggerModule.createLogger("storage", {
      operation: "upload",
      requestId: "parent-request",
    });
    const childLogger = logger.child({
      requestId: "child-request",
      key: "avatars/user-1",
    });

    childLogger.info("storage.upload.started", "upload started");

    expect(getLoggedEntries()).toHaveLength(1);
    expect(getLoggedEntries()[0]).toEqual(
      expect.objectContaining({
        scope: "storage",
        event: "storage.upload.started",
        message: "upload started",
        context: {
          operation: "upload",
          requestId: "child-request",
          key: "avatars/user-1",
        },
      })
    );
  });

  it("should redact nested sensitive values recursively", () => {
    const loggerModule = loadLoggerModule();
    installTestLoggerAdapters();

    const logger = loggerModule.createLogger("auth");

    logger.info("auth.signin.failed", "signin failed", {
      context: {
        userId: "user-1",
        credentials: {
          password: "super-secret",
          nested: {
            token: "token-value",
          },
        },
        headers: {
          authorization: "Bearer token",
        },
      },
    });

    expect(getLoggedEntries()[0]?.context).toEqual({
      userId: "user-1",
      credentials: {
        password: "[redacted]",
        nested: {
          token: "[redacted]",
        },
      },
      headers: {
        authorization: "[redacted]",
      },
    });
  });

  it("should serialize errors and capture them automatically for error logs", () => {
    const loggerModule = loadLoggerModule();
    installTestLoggerAdapters();

    const logger = loggerModule.createLogger("workflow_repository");
    const error = new Error("workflow failed");

    logger.error("workflow.run.failed", "workflow failed", {
      context: {
        workflowId: "wf-1",
      },
      error,
    });

    expect(getLoggedEntries()[0]).toEqual(
      expect.objectContaining({
        level: "error",
        error: expect.objectContaining({
          name: "Error",
          message: "workflow failed",
          stack: expect.any(String),
        }),
      })
    );
    expect(getCapturedExceptions()).toHaveLength(1);
    expect(getCapturedExceptions()[0]).toEqual(
      expect.objectContaining({
        error,
        context: expect.objectContaining({
          scope: "workflow_repository",
          event: "workflow.run.failed",
          workflowId: "wf-1",
        }),
      })
    );
  });

  it("should not capture warnings unless capture is explicitly enabled", () => {
    const loggerModule = loadLoggerModule();
    installTestLoggerAdapters();

    const logger = loggerModule.createLogger("email");

    logger.warn("email.deprecated_env", "deprecated env used");
    logger.warn("email.delivery.delayed", "delivery delayed", {
      capture: true,
      context: {
        recipientDomain: "example.com",
      },
    });

    expect(getCapturedExceptions()).toHaveLength(0);
    expect(getCapturedMessages()).toEqual([
      {
        message: "delivery delayed",
        context: expect.objectContaining({
          scope: "email",
          event: "email.delivery.delayed",
          recipientDomain: "example.com",
        }),
      },
    ]);
  });

  it("should not fail when the default noop monitoring adapter is used", () => {
    const loggerModule = loadLoggerModule();
    loggerModule.resetLoggerState();
    loggerModule.setLogSinks([]);

    const logger = loggerModule.createLogger("noop_scope");

    expect(() => {
      logger.error("noop_scope.error", "noop monitoring");
    }).not.toThrow();
  });

  it("should resolve LOG_FORMAT=auto to json in production and pretty otherwise", () => {
    process.env.LOG_FORMAT = "auto";

    const loggerModule = loadLoggerModule();
    const entry: LogEntry = {
      timestamp: "2026-04-18T00:00:00.000Z",
      level: "info",
      scope: "test_scope",
      event: "test.event",
      message: "hello",
      context: {
        userId: "user-1",
      },
    };

    process.env = {
      ...process.env,
      NODE_ENV: "production",
    };
    expect(loggerModule.formatLogEntry(entry)).toBe(JSON.stringify(entry));

    process.env = {
      ...process.env,
      NODE_ENV: "development",
    };
    expect(loggerModule.formatLogEntry(entry)).toContain("[INFO]");
  });

  it("should be importable in browser-like and edge-like environments", () => {
    (globalThis as Record<string, unknown>).window = {};
    (globalThis as Record<string, unknown>).EdgeRuntime = "edge-runtime";

    expect(() => loadLoggerModule()).not.toThrow();
  });
});
