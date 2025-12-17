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

  // Conversations (Chat)
  CONVERSATIONS: '/conversations',
  CONVERSATION_DETAIL: (id: string) => `/conversations/${id}`,
  CONVERSATIONS_DIRECT: '/conversations/direct',
  CONVERSATIONS_GROUP: '/conversations/group',
  CONVERSATION_PARTICIPANTS: (id: string) => `/conversations/${id}/participants`,
  CONVERSATION_PARTICIPANT_REMOVE: (convId: string, userId: string) =>
    `/conversations/${convId}/participants/${userId}`,

  // Messages (Chat)
  MESSAGES: '/messages',
  CONVERSATION_MESSAGES: (conversationId: string) => `/messages/${conversationId}`,
  MESSAGE_STATUS: (messageId: string) => `/messages/${messageId}/status`,
  MESSAGE_REACTIONS: (messageId: string) => `/messages/${messageId}/reactions`,

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
 *
 * Real-time chat events for Socket.io communication
 */
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Presence Events
  // Emitted by client to indicate online/offline status
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',
  USER_STATUS_CHANGED: 'user:status_changed',

  // Typing Events
  // Used for "User is typing..." indicators
  CHAT_TYPING: 'chat:typing',
  CHAT_USER_TYPING: 'chat:user_typing',

  // Message Events
  CHAT_MESSAGE_SEND: 'chat:message_send',
  CHAT_MESSAGE_RECEIVED: 'chat:message_received',
  CHAT_MESSAGE_EDITED: 'chat:message_edited',
  CHAT_MESSAGE_DELETED: 'chat:message_deleted',

  // Message Status Events
  CHAT_MESSAGE_DELIVERED: 'chat:message_delivered',
  CHAT_MESSAGE_READ: 'chat:message_read',
  CHAT_MESSAGE_STATUS_UPDATED: 'chat:message_status_updated',

  // Reaction Events
  CHAT_REACTION_ADDED: 'chat:reaction_added',
  CHAT_REACTION_REMOVED: 'chat:reaction_removed',

  // Legacy events (kept for compatibility)
  MESSAGE: 'message',
  MESSAGE_BROADCAST: 'message_broadcast',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  TYPING: 'typing',
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
