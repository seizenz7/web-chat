/**
 * Message Service
 *
 * Handles all business logic for messages and delivery status.
 * - Send messages and persist to database
 * - Update message status (sent, delivered, read, reacted)
 * - Retrieve message history
 * - Handle message editing and deletion
 *
 * Key architectural concepts:
 * - Message status tracking allows delivery confirmation
 * - Encryption happens at storage layer (messages are stored encrypted)
 * - Transactions ensure consistency between message and status updates
 */

import { Transaction, Op } from 'sequelize';
import { getSequelize } from '../database/init';
import {
  User,
  Conversation,
  ConversationParticipant,
  Message,
  MessageStatus,
} from '../database/models/associations';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logging';

/**
 * ============================
 * TYPE DEFINITIONS
 * ============================
 */

export interface MessageDto {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  content_encrypted: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'voice';
  reply_to_id?: string;
  metadata?: any;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  status?: {
    delivered_by_users?: string[];
    read_by_users?: string[];
    reactions?: Record<string, string[]>;
  };
}

export interface CreateMessageParams {
  conversation_id: string;
  sender_id: string;
  content_encrypted: string;
  message_type?: 'text' | 'image' | 'file' | 'system' | 'voice';
  reply_to_id?: string;
  metadata?: any;
}

export interface MessageStatusUpdateParams {
  message_id: string;
  user_id: string;
  status_type: 'sent' | 'delivered' | 'read';
}

export interface ReactionParams {
  message_id: string;
  user_id: string;
  emoji: string;
}

/**
 * ============================
 * SERVICE METHODS
 * ============================
 */

/**
 * Send a message
 *
 * Workflow:
 * 1. Validate conversation exists and user is a participant
 * 2. Create message in database
 * 3. Create initial "sent" status for sender
 * 4. Create "pending" status for all other participants
 * 5. All in a transaction for consistency
 *
 * @param params Message creation parameters
 * @returns The created message DTO with initial status
 */
export async function sendMessage(params: CreateMessageParams): Promise<MessageDto> {
  const sequelize = getSequelize();
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    // Validate conversation exists
    const conversation = await Conversation.findByPk(params.conversation_id, {
      transaction,
    });

    if (!conversation) {
      throw new ValidationError('Conversation does not exist');
    }

    // Validate sender is a participant
    const isParticipant = await ConversationParticipant.findOne({
      where: {
        conversation_id: params.conversation_id,
        user_id: params.sender_id,
      },
      transaction,
    });

    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    // Validate content
    if (!params.content_encrypted || params.content_encrypted.trim().length === 0) {
      throw new ValidationError('Message content is required');
    }

    // Create the message
    const message = await Message.create(
      {
        conversation_id: params.conversation_id,
        sender_id: params.sender_id,
        content_encrypted: params.content_encrypted,
        message_type: params.message_type || 'text',
        reply_to_id: params.reply_to_id,
        metadata: params.metadata,
        is_edited: false,
        is_deleted: false,
      },
      { transaction }
    );

    // Get all participants in the conversation
    const participants = await ConversationParticipant.findAll({
      where: { conversation_id: params.conversation_id },
      transaction,
    });

    // Create status records for all participants
    const statusRecords = participants.map((participant) => ({
      message_id: message.id,
      user_id: participant.user_id,
      status: participant.user_id === params.sender_id ? ('sent' as const) : ('pending' as const),
    }));

    await MessageStatus.bulkCreate(statusRecords as any, { transaction });

    await transaction.commit();

    // Fetch and return complete message with status
    const fullMessage = await Message.findByPk(message.id, {
      include: [{ model: User, attributes: ['username'] }],
    });

    return formatMessageDto(fullMessage, statusRecords);
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error('Failed to send message', {
      conversationId: params.conversation_id,
      senderId: params.sender_id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get message history for a conversation
 *
 * Returns messages in chronological order with pagination
 *
 * @param conversationId The conversation ID
 * @param userId The user requesting (for permission check)
 * @param limit Number of messages to return
 * @param offset Pagination offset
 * @returns Array of messages with status
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  messages: MessageDto[];
  total: number;
}> {
  try {
    // Verify user is a participant
    const isParticipant = await ConversationParticipant.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });

    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    // Fetch messages
    const { count, rows } = await Message.findAndCountAll({
      where: {
        conversation_id: conversationId,
        is_deleted: false,
      },
      include: [
        { model: User, attributes: ['username'] },
        { model: MessageStatus, attributes: ['user_id', 'status', 'reaction'] },
      ],
      order: [['created_at', 'ASC']],
      limit,
      offset,
    });

    return {
      messages: rows.map((msg) => formatMessageDto(msg, (msg as any).message_statuses)),
      total: count,
    };
  } catch (error) {
    logger.error('Failed to get conversation messages', {
      conversationId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Update message status
 *
 * Marks a message as delivered or read for a specific user
 * Used for read receipts and delivery confirmations
 *
 * @param messageId The message ID
 * @param userId The user ID
 * @param statusType The new status (sent, delivered, read)
 * @returns The updated message status
 */
export async function updateMessageStatus(
  messageId: string,
  userId: string,
  statusType: 'sent' | 'delivered' | 'read'
): Promise<{ message_id: string; user_id: string; status_type: string }> {
  try {
    // Verify message exists
    const message = await Message.findByPk(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user is a participant in the conversation
    const isParticipant = await ConversationParticipant.findOne({
      where: { conversation_id: message.conversation_id, user_id: userId },
    });

    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    // Update or create status
    const [status] = await MessageStatus.findOrCreate({
      where: { message_id: messageId, user_id: userId },
      defaults: { message_id: messageId, user_id: userId, status: statusType } as any,
    });

    // Update status if it's a progression (delivered > read, but not backwards)
    const statusOrder = { sent: 0, pending: 0, delivered: 1, read: 2, reacted: 2 };
    const currentLevel = statusOrder[(status.status || 'sent') as keyof typeof statusOrder] || 0;
    const newLevel = statusOrder[statusType as keyof typeof statusOrder] || 0;

    if (newLevel > currentLevel) {
      status.status = statusType;
      await status.save();
    }

    logger.debug('Message status updated', { messageId, userId, statusType });

    return {
      message_id: status.message_id,
      user_id: status.user_id,
      status_type: status.status,
    };
  } catch (error) {
    logger.error('Failed to update message status', {
      messageId,
      userId,
      statusType,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Add a reaction to a message
 *
 * @param messageId The message ID
 * @param userId The user ID
 * @param emoji The emoji reaction
 * @returns The updated message status record
 */
export async function addReactionToMessage(messageId: string, userId: string, emoji: string): Promise<any> {
  try {
    // Verify message exists
    const message = await Message.findByPk(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user is a participant
    const isParticipant = await ConversationParticipant.findOne({
      where: { conversation_id: message.conversation_id, user_id: userId },
    });

    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    // Get or create reaction status
    const [status] = await MessageStatus.findOrCreate({
      where: { message_id: messageId, user_id: userId },
      defaults: { message_id: messageId, user_id: userId, status: 'reacted' as const, reaction: emoji } as any,
    });

    // Update emoji if already exists
    if (status.reaction !== emoji) {
      status.reaction = emoji;
      await status.save();
    }

    logger.debug('Reaction added to message', { messageId, userId, emoji });

    return {
      message_id: status.message_id,
      user_id: status.user_id,
      reaction_emoji: status.reaction,
    };
  } catch (error) {
    logger.error('Failed to add reaction', {
      messageId,
      userId,
      emoji,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Edit a message
 *
 * Only the sender can edit their own messages
 * Marks the message as edited
 *
 * @param messageId The message ID
 * @param userId The user ID (must be the sender)
 * @param newContent The new encrypted content
 * @returns The updated message DTO
 */
export async function editMessage(messageId: string, userId: string, newContent: string): Promise<MessageDto> {
  const sequelize = getSequelize();
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    const message = await Message.findByPk(messageId, { transaction });
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Only sender can edit
    if (message.sender_id !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    // Validate new content
    if (!newContent || newContent.trim().length === 0) {
      throw new ValidationError('Message content is required');
    }

    // Update message
    message.content_encrypted = newContent;
    message.is_edited = true;
    await message.save({ transaction });

    await transaction.commit();

    // Fetch and return updated message
    const updatedMessage = await Message.findByPk(messageId, {
      include: [{ model: MessageStatus }],
    });

    return formatMessageDto(updatedMessage, (updatedMessage as any)?.message_statuses);
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error('Failed to edit message', {
      messageId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Delete a message
 *
 * Soft delete - marks the message as deleted but keeps it in the database
 * Only the sender can delete their own messages, admins can delete any
 *
 * @param messageId The message ID
 * @param userId The user ID
 * @returns Confirmation
 */
export async function deleteMessage(messageId: string, userId: string): Promise<{ success: boolean }> {
  const sequelize = getSequelize();
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    const message = await Message.findByPk(messageId, { transaction });
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check permissions
    const isAdmin = await ConversationParticipant.findOne({
      where: {
        conversation_id: message.conversation_id,
        user_id: userId,
        role: 'admin',
      },
      transaction,
    });

    if (message.sender_id !== userId && !isAdmin) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    // Soft delete
    message.is_deleted = true;
    await message.save({ transaction });

    await transaction.commit();

    logger.debug('Message deleted', { messageId, userId });

    return { success: true };
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error('Failed to delete message', {
      messageId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * ============================
 * HELPER FUNCTIONS
 * ============================
 */

/**
 * Format a Message model instance into a DTO
 *
 * This separates the database model from the API response
 * If we change the database structure, the API remains stable
 */
function formatMessageDto(message: any, statuses?: any[]): MessageDto {
  const statusData: Record<string, string[]> = {
    delivered_by_users: [],
    read_by_users: [],
  };
  const reactions: Record<string, string[]> = {};

  if (statuses) {
    statuses.forEach((status: any) => {
      if (status.status === 'delivered') {
        statusData.delivered_by_users.push(status.user_id);
      } else if (status.status === 'read') {
        statusData.read_by_users.push(status.user_id);
      } else if (status.status === 'reacted' && status.reaction) {
        if (!reactions[status.reaction]) {
          reactions[status.reaction] = [];
        }
        reactions[status.reaction].push(status.user_id);
      }
    });
  }

  return {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    sender_username: message.user?.username || 'Unknown',
    content_encrypted: message.content_encrypted,
    message_type: message.message_type,
    reply_to_id: message.reply_to_id,
    metadata: message.metadata,
    is_edited: message.is_edited,
    is_deleted: message.is_deleted,
    created_at: message.created_at,
    updated_at: message.updated_at,
    status: {
      delivered_by_users: statusData.delivered_by_users,
      read_by_users: statusData.read_by_users,
      reactions,
    },
  };
}
