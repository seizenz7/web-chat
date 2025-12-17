/**
 * Custom Error Classes
 *
 * Standardized error types for different scenarios.
 * Makes error handling consistent and predictable.
 *
 * SECURITY NOTE (for beginners):
 * - We intentionally keep error responses structured.
 * - We avoid leaking sensitive details (stack traces, DB errors) in production.
 */

/**
 * Base application error class
 * All custom errors should extend this
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any,
    public code?: string
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
    super(message, 400, details, 'VALIDATION_ERROR');
  }
}

/**
 * Not found error (404 Not Found)
 * Thrown when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, undefined, 'NOT_FOUND');
  }
}

/**
 * Unauthorized error (401 Unauthorized)
 * Thrown when user is not authenticated
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, details, 'UNAUTHORIZED');
  }
}

/**
 * Two-factor required (401)
 * Used when a user has TOTP enabled but didn't provide a code.
 */
export class TwoFactorRequiredError extends AppError {
  constructor(message: string = 'Two-factor authentication code required') {
    super(message, 401, undefined, 'TOTP_REQUIRED');
  }
}

/**
 * Invalid two-factor code (401)
 */
export class InvalidTwoFactorCodeError extends AppError {
  constructor(message: string = 'Invalid two-factor authentication code') {
    super(message, 401, undefined, 'TOTP_INVALID');
  }
}

/**
 * Forbidden error (403 Forbidden)
 * Thrown when user lacks permission for an action
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 403, details, 'FORBIDDEN');
  }
}

/**
 * Conflict error (409 Conflict)
 * Thrown when a resource already exists (e.g. duplicate email)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', details?: any) {
    super(message, 409, details, 'CONFLICT');
  }
}

/**
 * Too many requests (429)
 * Thrown by rate limiting middleware
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, details, 'RATE_LIMITED');
  }
}

/**
 * Database error (500 Internal Server Error)
 * Thrown when a database operation fails
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, details, 'DATABASE_ERROR');
  }
}

/**
 * External API error (502 Bad Gateway)
 * Thrown when an external API call fails
 */
export class ExternalAPIError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 502, details, 'EXTERNAL_API_ERROR');
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
      ...(error.code && { code: error.code }),
      ...(error.details && { details: error.details }),
      ...(isDev && error.stack && { stack: error.stack }),
    };
  }

  // Unknown error
  return {
    error: isDev ? error.message : 'An unexpected error occurred',
    ...(isDev && error.stack && { stack: error.stack }),
  };
}
