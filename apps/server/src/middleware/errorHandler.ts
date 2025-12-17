/**
 * Express Error Handling Middleware
 *
 * These middleware functions catch errors thrown by controllers/services
 * and format them into proper HTTP responses.
 *
 * Error handling must be defined AFTER all route handlers.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logging';
import { AppError, formatError, isAppError } from '../utils/errors';
import { config } from '../config';

/**
 * 404 Not Found Handler
 *
 * Catches requests that don't match any route.
 * This should be registered AFTER all other route handlers.
 */
export function notFoundHandler(req: Request, res: Response) {
  logger.warn(`Not found: ${req.method} ${req.path}`);

  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: 'Endpoint not found',
    error: `Cannot ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Global Error Handler Middleware
 *
 * Catches all errors thrown in async route handlers or passed via next(error).
 * Formats errors into consistent API responses.
 *
 * This MUST be the last middleware defined (after all routes and other middleware).
 *
 * Usage in a controller:
 *   try {
 *     // do something
 *   } catch (error) {
 *     next(error);  // Pass to error handler
 *   }
 *
 * Or throw directly:
 *   throw new ValidationError('Invalid email');
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Ensure we have a status code
  const statusCode = isAppError(error) ? error.statusCode : 500;

  // Log the error
  const logData = {
    method: req.method,
    path: req.path,
    statusCode,
    error: error.message,
    ...(config.isDev && { stack: error.stack }),
  };

  if (statusCode >= 500) {
    logger.error('Server error', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client error', logData);
  } else {
    logger.info('Error response', logData);
  }

  // Format and send error response
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: error.message,
    ...formatError(error, config.isDev),
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}
