/**
 * Shared Type Definitions
 *
 * These types are used in both backend and frontend to ensure
 * consistent data structures across the application.
 */

/**
 * User entity
 * Represents a user in the system
 */
export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Example entity
 * Placeholder for demonstrating CRUD operations
 */
export interface Example {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response wrapper
 * All API responses follow this format
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  timestamp?: string;
}

/**
 * Paginated response
 * For endpoints that return lists
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Authentication token
 */
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Auth credentials
 */
export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Socket.io events
 */
export interface SocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}
