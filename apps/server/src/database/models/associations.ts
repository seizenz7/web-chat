/**
 * Database Model Associations
 *
 * Defines all relationships between models for Sequelize ORM.
 * This creates the logical structure that supports our chat application.
 */

import { DataTypes } from 'sequelize';
import { getSequelize } from '../init';

// Import all model initializers
import { initUserModel, User } from './User';
import { initAuthSessionModel, AuthSession } from './AuthSession';
import { initUserPublicKeyModel, UserPublicKey } from './UserPublicKey';
import { initConversationModel, Conversation } from './Conversation';
import { initConversationParticipantModel, ConversationParticipant } from './ConversationParticipant';
import { initMessageModel, Message } from './Message';
import { initMessageStatusModel, MessageStatus } from './MessageStatus';
import { initAttachmentModel, Attachment } from './Attachment';
import { initAuditLogModel, AuditLog } from './AuditLog';

/**
 * Initialize all models and define their associations
 * This function should be called during application startup
 */
export const initializeModels = () => {
  const sequelize = getSequelize();

  // Initialize all models first
  const UserModel = initUserModel(sequelize);
  const AuthSessionModel = initAuthSessionModel(sequelize);
  const UserPublicKeyModel = initUserPublicKeyModel(sequelize);
  const ConversationModel = initConversationModel(sequelize);
  const ConversationParticipantModel = initConversationParticipantModel(sequelize);
  const MessageModel = initMessageModel(sequelize);
  const MessageStatusModel = initMessageStatusModel(sequelize);
  const AttachmentModel = initAttachmentModel(sequelize);
  const AuditLogModel = initAuditLogModel(sequelize);

  // Define associations
  // ===================

  /**
   * USER ASSOCIATIONS
   */

  // User -> Auth Sessions (1:Many)
  // A user can have multiple active sessions (different devices)
  UserModel.hasMany(AuthSessionModel, {
    foreignKey: 'user_id',
    as: 'authSessions',
    onDelete: 'RESTRICT', // Prevent deleting user with active sessions
    onUpdate: 'CASCADE',
  });

  AuthSessionModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // User -> Public Keys (1:Many)
  // A user can have multiple public keys (for key rotation)
  UserModel.hasMany(UserPublicKeyModel, {
    foreignKey: 'user_id',
    as: 'publicKeys',
    onDelete: 'CASCADE', // Clean up keys when user is deleted
    onUpdate: 'CASCADE',
  });

  UserPublicKeyModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // User -> Conversation Participants (1:Many)
  // A user can participate in multiple conversations
  UserModel.hasMany(ConversationParticipantModel, {
    foreignKey: 'user_id',
    as: 'conversationParticipants',
    onDelete: 'RESTRICT', // Prevent deleting user who owns conversations
    onUpdate: 'CASCADE',
  });

  ConversationParticipantModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // User -> Messages (1:Many)
  // A user can send many messages
  UserModel.hasMany(MessageModel, {
    foreignKey: 'sender_id',
    as: 'sentMessages',
    onDelete: 'SET NULL', // Keep messages even if user is deleted
    onUpdate: 'CASCADE',
  });

  MessageModel.belongsTo(UserModel, {
    foreignKey: 'sender_id',
    as: 'sender',
  });

  // User -> Message Statuses (1:Many)
  // Track delivery status for each user's messages
  UserModel.hasMany(MessageStatusModel, {
    foreignKey: 'user_id',
    as: 'messageStatuses',
    onDelete: 'CASCADE', // Clean up status when user is deleted
    onUpdate: 'CASCADE',
  });

  MessageStatusModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // User -> Audit Logs (1:Many)
  // Track user actions for security
  UserModel.hasMany(AuditLogModel, {
    foreignKey: 'user_id',
    as: 'auditLogs',
    onDelete: 'SET NULL', // Keep audit logs even if user is deleted
    onUpdate: 'CASCADE',
  });

  AuditLogModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user',
  });

  /**
   * CONVERSATION ASSOCIATIONS
   */

  // Conversation -> Participants (1:Many)
  // A conversation can have multiple participants
  ConversationModel.hasMany(ConversationParticipantModel, {
    foreignKey: 'conversation_id',
    as: 'participants',
    onDelete: 'CASCADE', // Clean up participants when conversation is deleted
    onUpdate: 'CASCADE',
  });

  ConversationParticipantModel.belongsTo(ConversationModel, {
    foreignKey: 'conversation_id',
    as: 'conversation',
  });

  // Conversation -> Messages (1:Many)
  // A conversation can have many messages
  ConversationModel.hasMany(MessageModel, {
    foreignKey: 'conversation_id',
    as: 'messages',
    onDelete: 'CASCADE', // Delete messages when conversation is deleted
    onUpdate: 'CASCADE',
  });

  MessageModel.belongsTo(ConversationModel, {
    foreignKey: 'conversation_id',
    as: 'conversation',
  });

  // Conversation -> Creator (Many:1)
  // Track who created each conversation
  ConversationModel.belongsTo(UserModel, {
    foreignKey: 'created_by',
    as: 'creator',
  });

  /**
   * MESSAGE ASSOCIATIONS
   */

  // Message -> Status Events (1:Many)
  // A message can have status updates for each participant
  MessageModel.hasMany(MessageStatusModel, {
    foreignKey: 'message_id',
    as: 'statusEvents',
    onDelete: 'CASCADE', // Clean up status when message is deleted
    onUpdate: 'CASCADE',
  });

  MessageStatusModel.belongsTo(MessageModel, {
    foreignKey: 'message_id',
    as: 'message',
  });

  // Message -> Attachments (1:Many)
  // A message can have multiple attachments (rare, but possible)
  MessageModel.hasMany(AttachmentModel, {
    foreignKey: 'message_id',
    as: 'attachments',
    onDelete: 'CASCADE', // Delete attachments when message is deleted
    onUpdate: 'CASCADE',
  });

  AttachmentModel.belongsTo(MessageModel, {
    foreignKey: 'message_id',
    as: 'message',
  });

  // Message -> Reply (Self-reference)
  // Messages can reply to other messages (threading)
  MessageModel.hasMany(MessageModel, {
    foreignKey: 'reply_to_id',
    as: 'replies',
    onDelete: 'SET NULL', // Keep messages even if parent is deleted
    onUpdate: 'CASCADE',
  });

  MessageModel.belongsTo(MessageModel, {
    foreignKey: 'reply_to_id',
    as: 'replyTo',
  });

  /**
   * INDEXES AND PERFORMANCE CONSIDERATIONS
   * ======================================
   * 
   * The models include comprehensive indexes for:
   * 1. User lookups (username, email)
   * 2. Conversation queries (participants, recent messages)
   * 3. Message queries (conversation_id + created_at for pagination)
   * 4. Status tracking (user_id + status + timestamp)
   * 5. Audit trails (user_id + action + timestamp)
   * 
   * For scale considerations:
   * - Messages table will benefit from partitioning by conversation_id
   * - Message status events will benefit from partitioning by date
   * - Read replicas can be used for message queries
   * - Write master handles all operations
   */

  /**
   * SECURITY CONSIDERATIONS
   * =======================
   * 
   * 1. CASCADE STRATEGY:
   *    - User deletion: RESTRICT (prevent orphaned conversations)
   *    - Conversation deletion: CASCADE (clean up all related data)
   *    - Message deletion: SOFT DELETE (preserve conversation history)
   *    - User deletion: SET NULL (keep audit logs and messages)
   * 
   * 2. DATA ENCRYPTION:
   *    - Message content is encrypted at the application level
   *    - File attachments can be encrypted
   *    - Refresh tokens are hashed with bcrypt
   * 
   * 3. AUDIT TRAIL:
   *    - All sensitive operations are logged
   *    - IP addresses and user agents are tracked
   *    - Before/after values are captured for updates
   */

  // Return all initialized models
  return {
    User: UserModel,
    AuthSession: AuthSessionModel,
    UserPublicKey: UserPublicKeyModel,
    Conversation: ConversationModel,
    ConversationParticipant: ConversationParticipantModel,
    Message: MessageModel,
    MessageStatus: MessageStatusModel,
    Attachment: AttachmentModel,
    AuditLog: AuditLogModel,
  };
};

// Export all model classes and initializer
export {
  User,
  AuthSession,
  UserPublicKey,
  Conversation,
  ConversationParticipant,
  Message,
  MessageStatus,
  Attachment,
  AuditLog,
};

export {
  initUserModel,
  initAuthSessionModel,
  initUserPublicKeyModel,
  initConversationModel,
  initConversationParticipantModel,
  initMessageModel,
  initMessageStatusModel,
  initAttachmentModel,
  initAuditLogModel,
};