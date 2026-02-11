type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  service?: string;
  eventId?: string;
  txHash?: string;
  operation?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

class Logger {
  private serviceName: string;

  constructor(serviceName: string = "lumio-core") {
    this.serviceName = serviceName;
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.serviceName,
        ...context,
      },
    };
  }

  private output(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";

    if (entry.level === "error") {
      console.error(`${prefix} ${entry.message}${contextStr}`);
    } else if (entry.level === "warn") {
      console.warn(`${prefix} ${entry.message}${contextStr}`);
    } else {
      console.log(`${prefix} ${entry.message}${contextStr}`);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development" || process.env.DEBUG) {
      this.output(this.formatEntry("debug", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    this.output(this.formatEntry("info", message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.formatEntry("warn", message, context));
  }

  error(message: string, context?: LogContext): void {
    this.output(this.formatEntry("error", message, context));
  }

  /**
   * Logs the start of a Stellar transaction.
   */
  txStart(operation: string, eventId: string, details?: Record<string, unknown>): void {
    this.info(`TX_START: ${operation}`, {
      operation,
      eventId,
      ...details,
    });
  }

  /**
   * Logs successful completion of a Stellar transaction.
   */
  txSuccess(operation: string, eventId: string, txHash: string, duration?: number): void {
    this.info(`TX_SUCCESS: ${operation}`, {
      operation,
      eventId,
      txHash,
      duration,
    });
  }

  /**
   * Logs a failed Stellar transaction.
   */
  txFailed(operation: string, eventId: string, error: Error, duration?: number): void {
    this.error(`TX_FAILED: ${operation}`, {
      operation,
      eventId,
      error: error.message,
      stack: error.stack,
      duration,
    });
  }

  /**
   * Creates a child logger with additional context.
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }
}

class ChildLogger {
  private parent: Logger;
  private context: LogContext;

  constructor(parent: Logger, context: LogContext) {
    this.parent = parent;
    this.context = context;
  }

  debug(message: string, extra?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...extra });
  }

  info(message: string, extra?: LogContext): void {
    this.parent.info(message, { ...this.context, ...extra });
  }

  warn(message: string, extra?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...extra });
  }

  error(message: string, extra?: LogContext): void {
    this.parent.error(message, { ...this.context, ...extra });
  }
}

// Singleton instance
export const logger = new Logger("lumio-core");

// Service-specific loggers
export const stellarLogger = logger.child({ service: "stellar" });
export const distributionLogger = logger.child({ service: "distribution" });
export const revenueLogger = logger.child({ service: "revenue" });

export { Logger, LogContext, LogLevel };
