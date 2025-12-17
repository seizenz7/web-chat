/**
 * User Model
 *
 * Represents users in the chat system.
 * Includes PII protection considerations and proper indexing.
 */

import { DataTypes, Model, UUIDV4 } from 'sequelize';
import { getSequelize } from '../init';
import { 
  UserAttributes, 
  UserCreationAttributes 
} from './types';

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public email!: string;
  public display_name!: string;
  public avatar_url?: string;
  public status?: 'online' | 'offline' | 'away' | 'busy';
  public last_seen_at?: Date;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association methods (defined in associations file)
  public readonly authSessions?: import('./AuthSession').AuthSession[];
  public readonly publicKeys?: import('./UserPublicKey').UserPublicKey[];
  public readonly conversationParticipants?: import('./ConversationParticipant').ConversationParticipant[];
  public readonly sentMessages?: import('./Message').Message[];
  public readonly messageStatuses?: import('./MessageStatus').MessageStatus[];
}

export const initUserModel = (sequelize: any) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z0-9_]+$/, // Only lowercase letters, numbers, and underscores
          len: [3, 50],
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [1, 100],
        },
      },
      avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      status: {
        type: DataTypes.ENUM('online', 'offline', 'away', 'busy'),
        allowNull: true,
        defaultValue: 'offline',
      },
      last_seen_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize: sequelize,
      tableName: 'users',
      indexes: [
        // Critical for authentication lookups
        {
          unique: true,
          fields: ['username'],
          name: 'idx_users_username_unique',
        },
        {
          unique: true,
          fields: ['email'],
          name: 'idx_users_email_unique',
        },
        // Useful for user directory and search
        {
          fields: ['display_name'],
          name: 'idx_users_display_name',
        },
        {
          fields: ['status'],
          name: 'idx_users_status',
        },
        // For user activity queries
        {
          fields: ['last_seen_at'],
          name: 'idx_users_last_seen_at',
        },
      ],
      hooks: {
        // Hook: Normalize email and username before saving
        beforeCreate: (user: User) => {
          if (user.email) {
            user.email = user.email.toLowerCase().trim();
          }
          if (user.username) {
            user.username = user.username.toLowerCase().trim();
          }
        },
        // Hook: Update timestamp when username changes
        beforeUpdate: (user: User) => {
          if (user.email) {
            user.email = user.email.toLowerCase().trim();
          }
          if (user.username) {
            user.username = user.username.toLowerCase().trim();
          }
        },
      },
    }
  );

  return User;
};

export default User;