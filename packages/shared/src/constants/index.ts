/**
 * Shared Constants
 *
 * Constants that are used in both backend and frontend.
 * Keeps values in sync across the application.
 */

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Health checks
  HEALTH: '/health',
  HEALTH_DEEP: '/health/deep',

  // Examples
  EXAMPLES: '/example',
  EXAMPLE_DETAIL: (id: number) => `/example/${id}`,

  // Users
  USERS: '/users',
  USER_PROFILE: (id: number) => `/users/${id}`,

  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',

  // Jobs
  JOB_STATUS: (jobId: string | number) => `/jobs/${jobId}`,
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 255,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
  NAME_REQUIRED: 'Name is required',
  UNAUTHORIZED: 'You must be logged in to access this resource',
  FORBIDDEN: 'You do not have permission to access this resource',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created',
  UPDATED: 'Successfully updated',
  DELETED: 'Successfully deleted',
  LOGGED_IN: 'Successfully logged in',
  LOGGED_OUT: 'Successfully logged out',
} as const;

/**
 * Default Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Job Queue Names
 */
export const JOB_QUEUES = {
  EMAIL: 'email',
  REPORT: 'report',
  IMAGE: 'image',
} as const;

/**
 * Socket.io Events
 */
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Messages
  MESSAGE: 'message',
  MESSAGE_BROADCAST: 'message_broadcast',

  // Rooms
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',

  // Typing
  TYPING: 'typing',

  // Data updates
  DATA_UPDATE: 'data_update',
} as const;

/**
 * Cache Keys (for Redis/local storage)
 */
export const CACHE_KEYS = {
  USER: 'user',
  AUTH_TOKEN: 'auth_token',
  THEME: 'theme',
} as const;

/**
 * Time Constants (in milliseconds)
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;
