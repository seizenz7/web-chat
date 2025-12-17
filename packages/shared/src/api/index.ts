/**
 * Shared API Utilities
 *
 * Utilities for making API calls and formatting data.
 * Can be used on both frontend and backend.
 */

import { API_ENDPOINTS } from '../constants';
import type { ApiResponse, PaginatedResponse } from '../types';

/**
 * API Client base configuration
 * Use this to ensure consistent behavior across all API calls
 */
export const API_CONFIG = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
} as const;

/**
 * Helper to format API response
 */
export function formatApiResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    status: 'success',
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to format API error response
 */
export function formatApiError(
  error: string,
  statusCode: number = 500
): ApiResponse {
  return {
    status: 'error',
    error,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to format paginated response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number = 1,
  pageSize: number = 10
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

/**
 * Retry utility for failed requests
 * Useful for handling transient failures
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = API_CONFIG.retries,
  delay: number = API_CONFIG.retryDelay
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Export endpoints for easy access
 */
export { API_ENDPOINTS };
