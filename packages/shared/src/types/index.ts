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

/**
 * ============================
 * CHAT-SPECIFIC TYPES
 * ============================
 */

/**
 * Conversation entity
 */
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  is_active: boolean;
  last_message_at?: Date;
  participant_count: number;
  participants: ConversationParticipant[];
  last_message?: Message;
}

/**
 * Conversation Participant
 */
export interface ConversationParticipant {
  user_id: string;
  username: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: Date;
}

/**
 * Message entity
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  content_encrypted: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'voice';
  reply_to_id?: string;
  metadata?: Record<string, any>;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  status?: MessageStatus;
}

/**
 * Message Status tracking
 */
export interface MessageStatus {
  delivered_by_users: string[];
  read_by_users: string[];
  reactions?: Record<string, string[]>;
}

/**
 * Presence information
 */
export interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  conversationIds: string[];
}

/**
 * Typing indicator
 */
export interface TypingIndicator {
  userId: string;
  username: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: Date;
}
