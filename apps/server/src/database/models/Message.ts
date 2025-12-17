/**
 * Message Model
 *
 * Core messaging table with support for different message types.
 * Content is encrypted for end-to-end security.
 */

import { DataTypes, Model, UUIDV4, Op } from 'sequelize';
import { getSequelize } from '../init';
import { 
  MessageAttributes, 
  MessageCreationAttributes 
} from './types';

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public conversation_id!: string;
  public sender_id!: string;
  public content_encrypted!: string;
  public message_type!: 'text' | 'image' | 'file' | 'system' | 'voice';
  public reply_to_id?: string;
  public metadata?: {
    file_size?: number;
    mime_type?: string;
    duration?: number;
    system_event?: string;
  };
  public is_edited!: boolean;
  public is_deleted!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association methods
  public readonly conversation?: import('./Conversation').Conversation;
  public readonly sender?: import('./User').User;
  public readonly reply_to?: import('./Message').Message;
  public readonly status_events?: import('./MessageStatus').MessageStatus[];
  public readonly attachments?: import('./Attachment').Attachment[];
}

export const initMessageModel = (sequelize: any) => {
  Message.init(
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
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      content_encrypted: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: 'Base64-encoded encrypted message content',
      },
      message_type: {
        type: DataTypes.ENUM('text', 'image', 'file', 'system', 'voice'),
        allowNull: false,
        defaultValue: 'text',
      },
      reply_to_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'messages',
          key: 'id',
        },
        comment: 'Self-reference for threaded/reply messages',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Additional message metadata (file info, duration, etc.)',
      },
      is_edited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Soft delete flag - preserves message in DB for conversation integrity',
      },
    },
    {
      sequelize: sequelize,
      tableName: 'messages',
      indexes: [
        // Primary conversation lookup (most common query)
        {
          fields: ['conversation_id'],
          name: 'idx_messages_conversation_id',
        },
        // For fetching messages in chronological order
        {
          fields: ['conversation_id', 'created_at'],
          name: 'idx_messages_conversation_created_at',
        },
        // For sender queries
        {
          fields: ['sender_id'],
          name: 'idx_messages_sender_id',
        },
        // For message thread/reply queries
        {
          fields: ['reply_to_id'],
          name: 'idx_messages_reply_to_id',
        },
        // For message type filtering
        {
          fields: ['message_type'],
          name: 'idx_messages_message_type',
        },
        // For deleted message cleanup (periodic maintenance)
        {
          fields: ['is_deleted'],
          name: 'idx_messages_is_deleted',
        },
        // For conversation activity updates
        {
          fields: ['conversation_id', 'is_deleted'],
          name: 'idx_messages_conversation_not_deleted',
        },
        // For recent message queries
        {
          fields: ['conversation_id', 'created_at', 'is_deleted'],
          name: 'idx_messages_conversation_recent_not_deleted',
        },
      ],
      hooks: {
        // Hook: Update conversation's last_message_at when new message is created
        afterCreate: async (message: Message) => {
          await sequelize.models.Conversation.update(
            { last_message_at: message.created_at },
            { where: { id: message.conversation_id } }
          );
        },
        // Hook: Update conversation's updated_at when message is edited
        beforeUpdate: (message: Message) => {
          if (message.changed('content_encrypted')) {
            // This will trigger afterUpdate hook below
          }
        },
        afterUpdate: async (message: Message) => {
          if (message.changed('content_encrypted')) {
            await sequelize.models.Conversation.update(
              { updated_at: new Date() },
              { where: { id: message.conversation_id } }
            );
          }
        },
      },
    }
  );

  return Message;
};

export default Message;