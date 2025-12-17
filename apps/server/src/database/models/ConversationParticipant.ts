/**
 * Conversation Participant Model
 *
 * Links users to conversations with their roles and key material.
 * Supports leaving conversations while preserving message history.
 */

import { DataTypes, Model, UUIDV4, Op } from 'sequelize';
import { getSequelize } from '../init';
import { 
  ConversationParticipantAttributes, 
  ConversationParticipantCreationAttributes 
} from './types';

export class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes> implements ConversationParticipantAttributes {
  public id!: string;
  public conversation_id!: string;
  public user_id!: string;
  public role!: 'admin' | 'moderator' | 'member';
  public joined_at!: Date;
  public left_at?: Date;
  public key_material?: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association methods
  public readonly conversation?: import('./Conversation').Conversation;
  public readonly user?: import('./User').User;
}

export const initConversationParticipantModel = (sequelize: any) => {
  ConversationParticipant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      conversation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      role: {
        type: DataTypes.ENUM('admin', 'moderator', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      left_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When user left the conversation (null if still active)',
      },
      key_material: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        comment: 'Encrypted key material for this user in this conversation',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Is user currently in this conversation',
      },
    },
    {
      sequelize: sequelize,
      tableName: 'conversation_participants',
      indexes: [
        // Primary lookup by conversation
        {
          fields: ['conversation_id'],
          name: 'idx_conversation_participants_conversation_id',
        },
        // Primary lookup by user
        {
          fields: ['user_id'],
          name: 'idx_conversation_participants_user_id',
        },
        // For finding active participants
        {
          fields: ['conversation_id', 'is_active'],
          name: 'idx_conversation_participants_conversation_active',
        },
        // For user membership queries
        {
          fields: ['user_id', 'is_active'],
          name: 'idx_conversation_participants_user_active',
        },
        // For role-based queries
        {
          fields: ['conversation_id', 'role'],
          name: 'idx_conversation_participants_conversation_role',
        },
        // For conversation member lists
        {
          fields: ['conversation_id', 'is_active', 'role'],
          name: 'idx_conversation_participants_conversation_active_role',
        },
        // For checking if user is in conversation
        {
          unique: true,
          fields: ['conversation_id', 'user_id'],
          name: 'idx_conversation_participants_user_unique_active',
        },
      ],
      hooks: {
        // Hook: Update conversation's last_message_at when new participant joins
        afterCreate: async (participant: ConversationParticipant) => {
          if (participant.is_active) {
            await sequelize.models.Conversation.update(
              { updated_at: new Date() },
              { where: { id: participant.conversation_id } }
            );
          }
        },
        // Hook: When user leaves, update is_active flag
        beforeUpdate: (participant: ConversationParticipant) => {
          if (participant.changed('left_at') && participant.left_at) {
            participant.is_active = false;
          }
        },
      },
    }
  );

  return ConversationParticipant;
};

export default ConversationParticipant;