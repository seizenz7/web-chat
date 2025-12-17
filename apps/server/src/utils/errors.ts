/**
 * Custom Error Classes
 *
 * Standardized error types for different scenarios.
 * Makes error handling consistent and predictable.
 *
 * Usage:
 *   throw new ValidationError('Email is required', { field: 'email' });
 *   throw new NotFoundError('User not found');
 *   throw new DatabaseError('Query failed');
 */

/**
 * Base application error class
 * All custom errors should extend this
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Validation error (400 Bad Request)
 * Thrown when input data is invalid or incomplete
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

/**
 * Not found error (404 Not Found)
 * Thrown when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Unauthorized error (401 Unauthorized)
 * Thrown when user is not authenticated
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Forbidden error (403 Forbidden)
 * Thrown when user lacks permission for an action
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Database error (500 Internal Server Error)
 * Thrown when a database operation fails
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, details);
  }
}

/**
 * External API error (502 Bad Gateway)
 * Thrown when an external API call fails
 */
export class ExternalAPIError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 502, details);
  }
}

/**
 * Type guard to check if something is an AppError
 * Usage: if (isAppError(error)) { ... }
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Format error for API response
 * Hides implementation details in production
 */
export function formatError(error: any, isDev: boolean = false) {
  if (isAppError(error)) {
    return {
      error: error.message,
      ...(isDev && error.details && { details: error.details }),
      ...(isDev && error.stack && { stack: error.stack }),
    };
  }

  // Unknown error
  return {
    error: isDev ? error.message : 'An unexpected error occurred',
    ...(isDev && error.stack && { stack: error.stack }),
  };
}
