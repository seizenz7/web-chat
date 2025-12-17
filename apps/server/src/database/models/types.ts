/**
 * Chat Application Database Schema
 *
 * ERD (Entity Relationship Diagram):
 *
 *  users ────┬─────────────────────┬──────────────────┬────────────────┐
 *           │                     │                  │                │
 *    auth_sessions            user_public_keys    conversations    audit_logs
 *           │                     │                  │                │
 *           └─────┬───────────────┘                  │                │
 *                 │                                  │                │
 *          conversation_participants              messages          │
 *                 │                                  │                │
 *                 └─────────┬───────────────┬────────┘                │
 *                           │               │                          │
 *                     message_status    attachments                   │
 *                           │                                           │
 *                           └───────────────────────────────────────────┘
 *
 * SECURITY CONSIDERATIONS:
 * - PII (Personally Identifiable Information) should be encrypted at rest
 * - Message content is encrypted using end-to-end encryption
 * - Refresh tokens are hashed using bcrypt
 * - Audit trails track all sensitive operations
 *
 * SCALING CONSIDERATIONS:
 * - Messages table will be partitioned by conversation_id for large datasets
 * - Message status events table will be partitioned by date
 * - Composite indexes on frequently queried columns (user_id, conversation_id, timestamps)
 * - Read replicas for message queries, write master for all operations
 *
 * CASCADE DELETES:
 * - Deleting a conversation removes all participants, messages, and status events
 * - Deleting a user invalidates all their refresh tokens but preserves messages
 * - Messages are soft-deleted to preserve conversation history
 */

/**
 * 1. USERS TABLE
 * 
 * Central identity table for all users in the system
 * Stores essential user information with PII considerations
 */
export interface UserAttributes {
  id: string; // UUID primary key
  username: string; // Unique username (lowercase, alphanumeric + underscores)
  email: string; // Unique email address (lowercase)

  // bcrypt hash of the user's password (never sent to clients)
  password_hash: string;

  // Optional TOTP-based 2FA
  totp_enabled: boolean;
  totp_secret_encrypted?: string;

  display_name: string; // User's display name (can contain special characters)
  avatar_url?: string; // Profile picture URL
  status?: 'online' | 'offline' | 'away' | 'busy'; // Current presence status
  last_seen_at?: Date; // Last activity timestamp
  is_active: boolean; // Account status (can be deactivated)
  created_at: Date;
  updated_at: Date;
}

/**
 * 2. AUTH_SESSIONS TABLE
 * 
 * Manages refresh tokens for JWT authentication
 * One active session per user per device/app
 */
export interface AuthSessionAttributes {
  id: string; // UUID primary key
  user_id: string; // Foreign key to users
  refresh_token_hash: string; // Hashed refresh token
  device_info: string; // User agent, device type, etc.
  ip_address: string; // Client IP address
  expires_at: Date; // Token expiration
  revoked_at?: Date; // When session was revoked
  created_at: Date;
  updated_at: Date;
}

/**
 * 3. USER_PUBLIC_KEYS TABLE
 * 
 * Stores public keys for end-to-end encryption
 * Each user can have multiple keys (key rotation)
 */
export interface UserPublicKeyAttributes {
  id: string; // UUID primary key
  user_id: string; // Foreign key to users
  public_key: string; // Base64-encoded public key
  key_type: 'encryption' | 'signing'; // Key purpose
  is_active: boolean; // Is this the current active key
  expires_at?: Date; // Optional key expiration
  created_at: Date;
  updated_at: Date;
}

/**
 * 4. CONVERSATIONS TABLE
 * 
 * Represents chat conversations (1:1 or group)
 * Supports both direct messages and group chats
 */
export interface ConversationAttributes {
  id: string; // UUID primary key
  type: 'direct' | 'group'; // Conversation type
  title?: string; // Group conversation name (null for direct messages)
  description?: string; // Group description
  avatar_url?: string; // Group avatar
  created_by: string; // Foreign key to users (who created the conversation)
  is_active: boolean; // Is the conversation active
  last_message_at?: Date; // Timestamp of last message
  settings: {
    // JSON blob for conversation-specific settings
    allow_member_invites: boolean;
    require_admin_approval: boolean;
    message_retention_days?: number;
    encryption_enabled: boolean;
  };
  created_at: Date;
  updated_at: Date;
}

/**
 * 5. CONVERSATION_PARTICIPANTS TABLE
 * 
 * Links users to conversations with their roles and permissions
 * Also stores per-participant encryption key material
 */
export interface ConversationParticipantAttributes {
  id: string; // UUID primary key
  conversation_id: string; // Foreign key to conversations
  user_id: string; // Foreign key to users
  role: 'admin' | 'moderator' | 'member'; // Permission level in conversation
  joined_at: Date; // When user joined
  left_at?: Date; // When user left (null if still active)
  key_material?: string; // Encrypted key material for this user
  is_active: boolean; // Is user currently in conversation
  created_at: Date;
  updated_at: Date;
}

/**
 * 6. MESSAGES TABLE
 * 
 * Core messaging table with support for different message types
 * Content is encrypted for end-to-end security
 */
export interface MessageAttributes {
  id: string; // UUID primary key
  conversation_id: string; // Foreign key to conversations
  sender_id: string; // Foreign key to users
  content_encrypted: string; // Base64-encoded encrypted content
  message_type: 'text' | 'image' | 'file' | 'system' | 'voice'; // Message content type
  reply_to_id?: string; // For threaded conversations (self-reference)
  metadata?: {
    // Additional message metadata as JSON
    file_size?: number; // For attachments
    mime_type?: string;
    duration?: number; // For voice messages
    system_event?: string; // For system messages
  };
  is_edited: boolean; // Has this message been edited
  is_deleted: boolean; // Soft delete flag
  created_at: Date;
  updated_at: Date;
}

/**
 * 7. MESSAGE_STATUS EVENTS TABLE
 * 
 * Tracks message delivery states for each user
 * Supports different status types (sent, delivered, read, reactions)
 */
export interface MessageStatusAttributes {
  id: string; // UUID primary key
  message_id: string; // Foreign key to messages
  user_id: string; // Foreign key to users
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'reacted'; // Current status
  reaction?: string; // Emoji reaction if status is 'reacted'
  delivered_at?: Date; // Timestamp of delivery
  read_at?: Date; // Timestamp of read
  created_at: Date;
  updated_at: Date;
}

/**
 * 8. ATTACHMENTS TABLE
 * 
 * Stores metadata for file attachments
 * Actual files stored in external storage (S3, etc.)
 */
export interface AttachmentAttributes {
  id: string; // UUID primary key
  message_id: string; // Foreign key to messages
  file_name: string; // Original filename
  file_path: string; // Storage location (URL or path)
  file_size: number; // File size in bytes
  mime_type: string; // MIME type
  file_hash: string; // SHA-256 hash for integrity checking
  thumbnail_path?: string; // For images/videos
  is_encrypted: boolean; // Whether file is encrypted
  created_at: Date;
  updated_at: Date;
}

/**
 * 9. AUDIT_LOGS TABLE
 * 
 * Security audit trail for sensitive operations
 * Tracks user actions and system changes
 */
export interface AuditLogAttributes {
  id: string; // UUID primary key
  user_id?: string; // Foreign key to users (optional for system events)
  action: string; // Action performed
  resource_type: string; // Type of resource affected
  resource_id?: string; // ID of affected resource
  old_values?: Record<string, any>; // Previous values (for updates)
  new_values?: Record<string, any>; // New values (for creates/updates)
  ip_address: string; // Client IP
  user_agent: string; // Client user agent
  severity: 'info' | 'warning' | 'error' | 'security'; // Log level
  created_at: Date;
}

// Type definitions for Sequelize models
export type UserCreationAttributes = Omit<UserAttributes, 'id' | 'created_at' | 'updated_at'>;
export type AuthSessionCreationAttributes = Omit<AuthSessionAttributes, 'id' | 'created_at' | 'updated_at'>;
export type UserPublicKeyCreationAttributes = Omit<UserPublicKeyAttributes, 'id' | 'created_at' | 'updated_at'>;
export type ConversationCreationAttributes = Omit<ConversationAttributes, 'id' | 'created_at' | 'updated_at'>;
export type ConversationParticipantCreationAttributes = Omit<ConversationParticipantAttributes, 'id' | 'created_at' | 'updated_at'>;
export type MessageCreationAttributes = Omit<MessageAttributes, 'id' | 'created_at' | 'updated_at'>;
export type MessageStatusCreationAttributes = Omit<MessageStatusAttributes, 'id' | 'created_at' | 'updated_at'>;
export type AttachmentCreationAttributes = Omit<AttachmentAttributes, 'id' | 'created_at' | 'updated_at'>;
export type AuditLogCreationAttributes = Omit<AuditLogAttributes, 'id' | 'created_at'>;