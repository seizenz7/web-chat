/**
 * Message Status Model
 *
 * Tracks message delivery states for each user.
 * Supports different status types (sent, delivered, read, reactions).
 * This table will be heavily written to and read from.
 */

import { DataTypes, Model, UUIDV4, Op } from 'sequelize';
import { getSequelize } from '../init';
import { 
  MessageStatusAttributes, 
  MessageStatusCreationAttributes 
} from './types';

export class MessageStatus extends Model<MessageStatusAttributes, MessageStatusCreationAttributes> implements MessageStatusAttributes {
  public id!: string;
  public message_id!: string;
  public user_id!: string;
  public status!: 'sent' | 'delivered' | 'read' | 'failed' | 'reacted';
  public reaction?: string;
  public delivered_at?: Date;
  public read_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association methods
  public readonly message?: import('./Message').Message;
  public readonly user?: import('./User').User;
}

export const initMessageStatusModel = (sequelize: any) => {
  MessageStatus.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      message_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'messages',
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
      status: {
        type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed', 'reacted'),
        allowNull: false,
        defaultValue: 'sent',
      },
      reaction: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Emoji reaction (max 10 chars for Unicode)',
        validate: {
          len: [1, 10],
        },
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When message was delivered to user',
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When user read the message',
      },
    },
    {
      sequelize: sequelize,
      tableName: 'message_statuses',
      indexes: [
        // Primary lookup by message (for getting all statuses for a message)
        {
          fields: ['message_id'],
          name: 'idx_message_statuses_message_id',
        },
        // Primary lookup by user (for getting user's message statuses)
        {
          fields: ['user_id'],
          name: 'idx_message_statuses_user_id',
        },
        // For status-based queries
        {
          fields: ['status'],
          name: 'idx_message_statuses_status',
        },
        // For reactions lookup
        {
          fields: ['message_id', 'status'],
          name: 'idx_message_statuses_message_status',
        },
        // For unread message queries
        {
          fields: ['user_id', 'status'],
          name: 'idx_message_statuses_user_status',
        },
        // For timestamp-based cleanup
        {
          fields: ['created_at'],
          name: 'idx_message_statuses_created_at',
        },
        // For delivery tracking
        {
          fields: ['delivered_at'],
          name: 'idx_message_statuses_delivered_at',
        },
        // For read tracking
        {
          fields: ['read_at'],
          name: 'idx_message_statuses_read_at',
        },
        // Unique constraint to prevent duplicate status updates
        {
          unique: true,
          fields: ['message_id', 'user_id'],
          name: 'idx_message_statuses_message_user_unique',
        },
        // Composite index for common queries
        {
          fields: ['user_id', 'status', 'created_at'],
          name: 'idx_message_statuses_user_status_time',
        },
      ],
      hooks: {
        // Hook: Set timestamps for status changes
        beforeCreate: (status: MessageStatus) => {
          const now = new Date();
          if (status.status === 'delivered') {
            status.delivered_at = now;
          }
          if (status.status === 'read') {
            status.read_at = now;
            status.delivered_at = status.delivered_at || now;
          }
        },
        // Hook: Update timestamps when status changes
        beforeUpdate: (status: MessageStatus) => {
          if (status.changed('status')) {
            const now = new Date();
            if (status.status === 'delivered' && !status.delivered_at) {
              status.delivered_at = now;
            }
            if (status.status === 'read') {
              status.read_at = now;
              if (!status.delivered_at) {
                status.delivered_at = now;
              }
            }
          }
        },
      },
    }
  );

  return MessageStatus;
};

export default MessageStatus;