type LogLevel = "info" | "warn" | "error";

type LogValue = string | number | boolean | null | undefined;
type LogContext = Record<string, LogValue | LogValue[]>;

const sensitiveKeyPattern = /token|secret|password|cookie|authorization|csrf|content|chunk/i;

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }

  return Object.entries(context).reduce<LogContext>((safeContext, [key, value]) => {
    if (sensitiveKeyPattern.test(key)) {
      safeContext[key] = "[redacted]";
      return safeContext;
    }

    safeContext[key] = value;
    return safeContext;
  }, {});
}

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: import.meta.env.DEV ? error.stack : undefined,
    };
  }

  return {
    errorMessage: typeof error === "string" ? error : "Unknown error",
  };
}

function writeLog(level: LogLevel, event: string, context?: LogContext) {
  const payload = {
    level,
    event,
    context: sanitizeContext(context),
    timestamp: new Date().toISOString(),
  };

  if (level === "error") {
    console.error("[client]", payload);
    return;
  }

  if (level === "warn") {
    console.warn("[client]", payload);
    return;
  }

  if (import.meta.env.DEV) {
    console.info("[client]", payload);
  }
}

export const clientLogger = {
  info(event: string, context?: LogContext) {
    writeLog("info", event, context);
  },

  warn(event: string, context?: LogContext) {
    writeLog("warn", event, context);
  },

  error(event: string, error: unknown, context?: LogContext) {
    writeLog("error", event, {
      ...context,
      ...serializeError(error),
    });
  },
};
