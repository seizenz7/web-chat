/**
 * Logging Configuration
 *
 * Winston is a popular Node.js logging library that provides:
 * - Structured logging (JSON format)
 * - Multiple transports (console, file, external services)
 * - Log levels (error, warn, info, debug)
 * - Request/response logging middleware
 *
 * Usage:
 *   logger.info('User created', { userId: 123 });
 *   logger.error('Database error', { error: err.message });
 */

import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Create Winston logger instance
 * Logs to console in development, can be extended to file/external services in production
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Include error stack traces
    winston.format.json()
  ),
  defaultMeta: { service: 'pern-server' },
  transports: [
    // Console output (always visible during development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Colorize output for readability
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),

    // Error file (logs only errors)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),

    // Combined file (all log levels)
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});

/**
 * Express middleware for logging HTTP requests
 *
 * Logs:
 * - Request method and path
 * - Response status code
 * - Response time
 *
 * Example log:
 * GET /api/users 200 45ms
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Hook into res.end to capture status code and response time
  const originalEnd = res.end;

  res.end = function (...args: any[]) {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.path}`;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    };

    // Log based on status code
    if (res.statusCode >= 400) {
      logger.warn(logMessage, logData);
    } else {
      logger.info(logMessage, logData);
    }

    originalEnd.apply(res, args);
  };

  next();
}

export default logger;
