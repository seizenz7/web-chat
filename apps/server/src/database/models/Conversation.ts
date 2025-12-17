/**
 * Conversation Model
 *
 * Represents chat conversations (1:1 direct messages or group chats).
 * Supports conversation settings and metadata.
 */

import { DataTypes, Model, UUIDV4, Op } from 'sequelize';
import { getSequelize } from '../init';
import { 
  ConversationAttributes, 
  ConversationCreationAttributes 
} from './types';

export class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: string;
  public type!: 'direct' | 'group';
  public title?: string;
  public description?: string;
  public avatar_url?: string;
  public created_by!: string;
  public is_active!: boolean;
  public last_message_at?: Date;
  public settings!: {
    allow_member_invites: boolean;
    require_admin_approval: boolean;
    message_retention_days?: number;
    encryption_enabled: boolean;
  };
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association methods
  public readonly participants?: import('./ConversationParticipant').ConversationParticipant[];
  public readonly messages?: import('./Message').Message[];
  public readonly creator?: import('./User').User;
}

export const initConversationModel = (sequelize: any) => {
  Conversation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true, // Null for direct messages
        validate: {
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_message_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      settings: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          allow_member_invites: true,
          require_admin_approval: false,
          message_retention_days: null,
          encryption_enabled: true,
        },
        comment: 'Conversation-specific settings as JSON',
      },
    },
    {
      sequelize: sequelize,
      tableName: 'conversations',
      indexes: [
        // Primary lookup by conversation type
        {
          fields: ['type'],
          name: 'idx_conversations_type',
        },
        // For finding active conversations
        {
          fields: ['is_active'],
          name: 'idx_conversations_is_active',
        },
        // For ordering by recent activity
        {
          fields: ['last_message_at'],
          name: 'idx_conversations_last_message_at',
        },
        // For finding user's conversations (via participants table)
        {
          fields: ['created_by'],
          name: 'idx_conversations_created_by',
        },
        // Composite index for conversation management
        {
          fields: ['type', 'is_active', 'last_message_at'],
          name: 'idx_conversations_type_active_recent',
        },
      ],
      hooks: {
        // Hook: Update last_message_at when new message is added
        // (This will be handled by Message model hook)
        
        // Hook: Set default title for direct messages if not provided
        beforeCreate: (conversation: Conversation) => {
          if (conversation.type === 'direct' && !conversation.title) {
            // Title will be set dynamically based on participants
            conversation.title = 'Direct Message';
          }
        },
      },
    }
  );

  return Conversation;
};

export default Conversation;