import winston from 'winston';
import path from 'path';

/**
 * Logger Configuration
 * Centralized logging system using Winston
 */

const logDir = process.env.LOG_DIR || './logs';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Create the logger
const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (info: any) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    })
  );
}

// Create stream for Morgan (HTTP request logging)
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;

/**
 * Security Logger
 * Specialized logger for security events
 */
export const securityLogger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

/**
 * Audit Logger
 * Specialized logger for audit trail
 */
export const auditLogger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

/**
 * Helper functions for common logging scenarios
 */
export const logError = (message: string, error?: Error | unknown) => {
  if (error instanceof Error) {
    logger.error(`${message}: ${error.message}`, { stack: error.stack });
  } else {
    logger.error(message, { error });
  }
};

export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  logger.info(message, meta);
};

export const logWarning = (message: string, meta?: Record<string, unknown>) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(message, meta);
  }
};

export const logSecurity = (
  event: string,
  userId?: string,
  meta?: Record<string, unknown>
) => {
  securityLogger.info(event, { userId, ...meta });
};

export const logAudit = (
  action: string,
  userId: string,
  resource: string,
  meta?: Record<string, unknown>
) => {
  auditLogger.info(`${action} on ${resource}`, { userId, resource, ...meta });
};
