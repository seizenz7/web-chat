/**
 * Conversation Service
 *
 * Handles all business logic for creating and managing conversations.
 * - Create direct message (1:1) conversations
 * - Create group conversations
 * - Manage conversation participants
 * - Retrieve conversation lists and details
 *
 * Key architectural concepts:
 * - Transactions ensure consistency (all-or-nothing updates)
 * - Validation prevents invalid states
 * - Database operations are centralized here, not in routes
 */

import { Transaction } from 'sequelize';
import { getSequelize } from '../database/init';
import {
  User,
  Conversation,
  ConversationParticipant,
  Message,
  MessageStatus,
} from '../database/models/associations';
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logging';

/**
 * ============================
 * TYPE DEFINITIONS
 * ============================
 */

export interface ConversationDto {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  is_active: boolean;
  last_message_at?: Date;
  participant_count: number;
  participants: Array<{
    user_id: string;
    username: string;
    role: 'admin' | 'moderator' | 'member';
    joined_at: Date;
  }>;
  last_message?: {
    id: string;
    sender_id: string;
    sender_username: string;
    content_encrypted: string;
    created_at: Date;
  };
}

/**
 * ============================
 * SERVICE METHODS
 * ============================
 */

/**
 * Create a direct message conversation between two users
 *
 * Workflow:
 * 1. Validate that both users exist
 * 2. Check if a direct message conversation already exists between them
 * 3. Create conversation and add both as participants
 * 4. All in a transaction for consistency
 *
 * @param userId1 First user ID
 * @param userId2 Second user ID
 * @param initiatingUserId The user initiating the conversation
 * @returns The created conversation
 */
export async function createDirectMessage(
  userId1: string,
  userId2: string,
  initiatingUserId: string
): Promise<ConversationDto> {
  const sequelize = getSequelize();
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    // Validate both users exist
    const [user1, user2] = await Promise.all([
      User.findByPk(userId1, { transaction }),
      User.findByPk(userId2, { transaction }),
    ]);

    if (!user1 || !user2) {
      throw new ValidationError('One or both users do not exist');
    }

    // Prevent self-conversations
    if (userId1 === userId2) {
      throw new ValidationError('Cannot create a conversation with yourself');
    }

    // Check if direct message conversation already exists
    const existingConversation = await Conversation.findOne({
      where: { type: 'direct' },
      include: [
        {
          model: ConversationParticipant,
          attributes: ['user_id'],
          where: { user_id: [userId1, userId2] },
          through: { attributes: [] },
        },
      ],
      transaction,
    });

    if (existingConversation) {
      // Return existing conversation
      return formatConversationDto(
        await Conversation.findByPk(existingConversation.id, {
          include: [
            { model: ConversationParticipant, include: [{ model: User }] },
            { model: Message, limit: 1, order: [['created_at', 'DESC']] },
          ],
          transaction,
        })
      );
    }

    // Create new direct message conversation
    const conversation = await Conversation.create(
      {
        type: 'direct',
        created_by: initiatingUserId,
        is_active: true,
        settings: {
          allow_member_invites: false,
          require_admin_approval: false,
          message_retention_days: undefined,
          encryption_enabled: true,
        },
      },
      { transaction }
    );

    // Add both users as participants
    await ConversationParticipant.bulkCreate(
      [
        {
          conversation_id: conversation.id,
          user_id: userId1,
          role: 'member',
          is_active: true,
          joined_at: new Date(),
        },
        {
          conversation_id: conversation.id,
          user_id: userId2,
          role: 'member',
          is_active: true,
          joined_at: new Date(),
        },
      ] as any,
      { transaction }
    );

    await transaction.commit();

    // Fetch and return the complete conversation
    const fullConversation = await Conversation.findByPk(conversation.id, {
      include: [
        { model: ConversationParticipant, include: [{ model: User }] },
        { model: Message, limit: 1, order: [['created_at', 'DESC']] },
      ],
    });

    return formatConversationDto(fullConversation);
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error('Failed to create direct message', {
      userId1,
      userId2,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Create a group conversation
 *
 * Workflow:
 * 1. Validate input (title, participants)
 * 2. Verify all participants exist
 * 3. Create conversation with creator as admin
 * 4. Add all participants
 * 5. All in a transaction for consistency
 *
 * @param params Group creation parameters
 * @returns The created conversation
 */
export async function createGroupConversation(params: {
  title: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  participant_ids: string[];
}): Promise<ConversationDto> {
  const sequelize = getSequelize();
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    // Validation
    if (!params.title || params.title.trim().length === 0) {
      throw new ValidationError('Group title is required');
    }

    if (params.title.length > 255) {
      throw new ValidationError('Group title cannot exceed 255 characters');
    }

    if (!params.participant_ids || params.participant_ids.length === 0) {
      throw new ValidationError('At least one participant is required');
    }

    // Ensure creator is included
    const participantIds = Array.from(new Set([params.created_by, ...params.participant_ids]));

    // Verify all users exist
    const users = await User.findAll({
      where: { id: participantIds },
      transaction,
    });

    if (users.length !== participantIds.length) {
      throw new ValidationError('One or more participants do not exist');
    }

    // Create group conversation
    const conversation = await Conversation.create(
      {
        type: 'group',
        title: params.title.trim(),
        description: params.description,
        avatar_url: params.avatar_url,
        created_by: params.created_by,
        is_active: true,
        settings: {
          allow_member_invites: true,
          require_admin_approval: false,
          message_retention_days: undefined,
          encryption_enabled: true,
        },
      },
      { transaction }
    );

    // Add participants
    const participantRecords = participantIds.map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: userId === params.created_by ? ('admin' as const) : ('member' as const),
      is_active: true,
      joined_at: new Date(),
    }));

    await ConversationParticipant.bulkCreate(participantRecords as any, { transaction });

    await transaction.commit();

    // Fetch and return complete conversation
    const fullConversation = await Conversation.findByPk(conversation.id, {
      include: [
        { model: ConversationParticipant, include: [{ model: User }] },
        { model: Message, limit: 1, order: [['created_at', 'DESC']] },
      ],
    });

    return formatConversationDto(fullConversation);
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error('Failed to create group conversation', {
      title: params.title,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get all conversations for a user
 *
 * Returns conversations sorted by most recent message first
 *
 * @param userId The user ID
 * @param limit Number of conversations to return
 * @param offset Pagination offset
 * @returns Array of conversations
 */
export async function getUserConversations(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  conversations: ConversationDto[];
  total: number;
}> {
  try {
    const { count, rows } = await Conversation.findAndCountAll({
      include: [
        {
          model: ConversationParticipant,
          where: { user_id: userId },
          attributes: ['user_id', 'role', 'joined_at'],
          include: [{ model: User, attributes: ['id', 'username'] }],
        },
        {
          model: Message,
          attributes: ['id', 'sender_id', 'content_encrypted', 'created_at'],
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{ model: User, attributes: ['username'] }],
        },
      ],
      where: { is_active: true },
      order: [['last_message_at', 'DESC']],
      limit,
      offset,
    });

    return {
      conversations: rows.map(formatConversationDto),
      total: count,
    };
  } catch (error) {
    logger.error('Failed to get user conversations', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get conversation by ID
 *
 * @param conversationId The conversation ID
 * @param userId The user requesting (for permission check)
 * @returns The conversation DTO
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<ConversationDto> {
  try {
    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        {
          model: ConversationParticipant,
          include: [{ model: User, attributes: ['id', 'username'] }],
        },
        {
          model: Message,
          attributes: ['id', 'sender_id', 'content_encrypted', 'created_at'],
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{ model: User, attributes: ['username'] }],
        },
      ],
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check if user is a participant
    const isParticipant = conversation.participants?.some((p) => p.user_id === userId);
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    return formatConversationDto(conversation);
  } catch (error) {
    logger.error('Failed to get conversation', {
      conversationId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Add a participant to a group conversation
 *
 * Only admins can add participants to groups
 *
 * @param conversationId The conversation ID
 * @param newUserId The user to add
 * @param requestingUserId The user requesting (must be admin)
 * @returns The updated conversation DTO
 */
export async function addParticipantToConversation(
  conversationId: string,
  newUserId: string,
  requestingUserId: string
): Promise<ConversationDto> {
  const sequelize = getSequelize();
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    const conversation = await Conversation.findByPk(conversationId, { transaction });
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Only group conversations can have participants added
    if (conversation.type !== 'group') {
      throw new ValidationError('Cannot add participants to a direct message');
    }

    // Check if requesting user is admin
    const requestingParticipant = await ConversationParticipant.findOne({
      where: { conversation_id: conversationId, user_id: requestingUserId },
      transaction,
    });

    if (!requestingParticipant || requestingParticipant.role !== 'admin') {
      throw new ForbiddenError('Only admins can add participants');
    }

    // Check if new user exists
    const newUser = await User.findByPk(newUserId, { transaction });
    if (!newUser) {
      throw new ValidationError('User does not exist');
    }

    // Check if user already a participant
    const existingParticipant = await ConversationParticipant.findOne({
      where: { conversation_id: conversationId, user_id: newUserId },
      transaction,
    });

    if (existingParticipant) {
      throw new ConflictError('User is already a participant');
    }

    // Add as member
    await ConversationParticipant.create(
      {
        conversation_id: conversationId,
        user_id: newUserId,
        role: 'member',
        is_active: true,
        joined_at: new Date(),
      } as any,
      { transaction }
    );

    await transaction.commit();

    // Fetch and return updated conversation
    const updatedConversation = await Conversation.findByPk(conversationId, {
      include: [
        { model: ConversationParticipant, include: [{ model: User }] },
        { model: Message, limit: 1, order: [['created_at', 'DESC']] },
      ],
    });

    return formatConversationDto(updatedConversation);
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error('Failed to add participant', {
      conversationId,
      newUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Remove a participant from a conversation
 *
 * Admins can remove anyone, members can only remove themselves
 *
 * @param conversationId The conversation ID
 * @param userIdToRemove The user to remove
 * @param requestingUserId The user requesting
 * @returns The updated conversation DTO
 */
export async function removeParticipantFromConversation(
  conversationId: string,
  userIdToRemove: string,
  requestingUserId: string
): Promise<ConversationDto> {
  const sequelize = getSequelize();
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    const conversation = await Conversation.findByPk(conversationId, { transaction });
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check permissions
    const requestingParticipant = await ConversationParticipant.findOne({
      where: { conversation_id: conversationId, user_id: requestingUserId },
      transaction,
    });

    if (!requestingParticipant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    // Admins can remove anyone, members can only remove themselves
    const isAdmin = requestingParticipant.role === 'admin';
    const isSelfRemoval = requestingUserId === userIdToRemove;

    if (!isAdmin && !isSelfRemoval) {
      throw new ForbiddenError('You can only remove yourself from the conversation');
    }

    // Remove participant
    await ConversationParticipant.destroy({
      where: { conversation_id: conversationId, user_id: userIdToRemove },
      transaction,
    });

    // If last participant removed, deactivate conversation
    const remainingParticipants = await ConversationParticipant.count({
      where: { conversation_id: conversationId },
      transaction,
    });

    if (remainingParticipants === 0) {
      await Conversation.update({ is_active: false }, { where: { id: conversationId }, transaction });
    }

    await transaction.commit();

    const updatedConversation = await Conversation.findByPk(conversationId, {
      include: [
        { model: ConversationParticipant, include: [{ model: User }] },
        { model: Message, limit: 1, order: [['created_at', 'DESC']] },
      ],
    });

    return formatConversationDto(updatedConversation);
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error('Failed to remove participant', {
      conversationId,
      userIdToRemove,
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
 * Format a Conversation model instance into a DTO
 * DTOs (Data Transfer Objects) separate database models from API responses
 * This allows changing the database structure without breaking the API
 */
function formatConversationDto(conversation: any): ConversationDto {
  const lastMessage = conversation.messages?.[0];

  return {
    id: conversation.id,
    type: conversation.type,
    title: conversation.title,
    description: conversation.description,
    avatar_url: conversation.avatar_url,
    created_by: conversation.created_by,
    is_active: conversation.is_active,
    last_message_at: conversation.last_message_at || undefined,
    participant_count: (conversation.participants?.length || 0) as number,
    participants: (conversation.participants || []).map((p: any) => ({
      user_id: p.user_id,
      username: p.user?.username || 'Unknown',
      role: p.role,
      joined_at: p.joined_at,
    })),
    last_message: lastMessage
      ? {
          id: lastMessage.id,
          sender_id: lastMessage.sender_id,
          sender_username: lastMessage.user?.username || 'Unknown',
          content_encrypted: lastMessage.content_encrypted,
          created_at: lastMessage.created_at,
        }
      : undefined,
  };
}
