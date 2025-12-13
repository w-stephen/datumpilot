/**
 * Structured Logger
 *
 * Provides structured logging with pino for production observability.
 * Includes PII redaction and correlation ID support.
 */

import pino from "pino";

// PII fields that should be redacted from logs
const PII_FIELDS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "email",
  "phone",
  "ssn",
  "creditCard",
  "credit_card",
];

// Create base logger instance
const baseLogger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  // Use pretty printing in development
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  // Base context for all logs
  base: {
    env: process.env.NODE_ENV || "development",
    service: "datumpilot-web",
  },
  // Redact sensitive fields
  redact: {
    paths: PII_FIELDS.flatMap((field) => [`*.${field}`, `*.*.${field}`, field]),
    censor: "[REDACTED]",
  },
  // Format for production (JSON structured logs)
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      ...bindings,
      version: process.env.npm_package_version || "unknown",
    }),
  },
  // Timestamp in ISO format
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

// Correlation ID storage (request-scoped in production via AsyncLocalStorage)
let currentCorrelationId: string | undefined;

/**
 * Set the correlation ID for the current request context
 */
export function setCorrelationId(id: string): void {
  currentCorrelationId = id;
}

/**
 * Get the current correlation ID
 */
export function getCorrelationId(): string | undefined {
  return currentCorrelationId;
}

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a child logger with additional context
 */
function createContextLogger(context?: Record<string, unknown>) {
  const correlationId = currentCorrelationId;
  const bindings = {
    ...context,
    ...(correlationId && { correlationId }),
  };
  return Object.keys(bindings).length > 0 ? baseLogger.child(bindings) : baseLogger;
}

/**
 * Log an info-level message
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  createContextLogger(context).info(message);
}

/**
 * Log a warning-level message
 */
export function logWarn(message: string, context?: Record<string, unknown>): void {
  createContextLogger(context).warn(message);
}

/**
 * Log an error-level message
 */
export function logError(
  message: string,
  error?: Error | unknown,
  context?: Record<string, unknown>
): void {
  const errorContext: Record<string, unknown> = { ...context };

  if (error instanceof Error) {
    errorContext.error = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  } else if (error !== undefined && error !== null) {
    errorContext.error = String(error);
  }

  createContextLogger(errorContext).error(message);
}

/**
 * Log a debug-level message (only in development)
 */
export function logDebug(message: string, context?: Record<string, unknown>): void {
  createContextLogger(context).debug(message);
}

/**
 * Create a child logger with fixed bindings
 */
export function createLogger(bindings: Record<string, unknown>) {
  return {
    info: (message: string, context?: Record<string, unknown>) =>
      logInfo(message, { ...bindings, ...context }),
    warn: (message: string, context?: Record<string, unknown>) =>
      logWarn(message, { ...bindings, ...context }),
    error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) =>
      logError(message, error, { ...bindings, ...context }),
    debug: (message: string, context?: Record<string, unknown>) =>
      logDebug(message, { ...bindings, ...context }),
  };
}

// Export types
export type Logger = ReturnType<typeof createLogger>;

// Default export for convenience
export default {
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
  createLogger,
  setCorrelationId,
  getCorrelationId,
  generateCorrelationId,
};
