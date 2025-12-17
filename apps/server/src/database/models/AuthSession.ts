/**
 * Auth Session Model
 *
 * Manages refresh tokens for JWT authentication.
 * Each session represents one active login from a specific device.
 */

import { DataTypes, Model, UUIDV4 } from 'sequelize';
import bcrypt from 'bcryptjs';
import { getSequelize } from '../init';
import { 
  AuthSessionAttributes, 
  AuthSessionCreationAttributes 
} from './types';

export class AuthSession extends Model<AuthSessionAttributes, AuthSessionCreationAttributes> implements AuthSessionAttributes {
  public id!: string;
  public user_id!: string;
  public refresh_token_hash!: string;
  public device_info!: string;
  public ip_address!: string;
  public expires_at!: Date;
  public revoked_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association methods
  public readonly user?: import('./User').User;

  /**
   * Validate a refresh token against the stored hash
   */
  public async validateRefreshToken(token: string): Promise<boolean> {
    return bcrypt.compare(token, this.refresh_token_hash);
  }

  /**
   * Check if this session is still valid
   */
  public isValid(): boolean {
    const now = new Date();
    return !this.revoked_at && this.expires_at > now;
  }
}

export const initAuthSessionModel = (sequelize: any) => {
  AuthSession.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      refresh_token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Hashed refresh token using bcrypt',
      },
      device_info: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'User agent, device type, browser info',
      },
      ip_address: {
        type: DataTypes.INET,
        allowNull: false,
        comment: 'Client IP address at time of login',
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'When this refresh token expires',
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When this session was manually revoked',
      },
    },
    {
      sequelize: sequelize,
      tableName: 'auth_sessions',
      indexes: [
        // Primary lookup by user for session management
        {
          fields: ['user_id'],
          name: 'idx_auth_sessions_user_id',
        },
        // For cleanup of expired sessions
        {
          fields: ['expires_at'],
          name: 'idx_auth_sessions_expires_at',
        },
        // For checking active sessions
        {
          fields: ['revoked_at'],
          name: 'idx_auth_sessions_revoked_at',
        },
        // Composite index for user session queries
        {
          fields: ['user_id', 'expires_at', 'revoked_at'],
          name: 'idx_auth_sessions_user_valid',
        },
      ],
      hooks: {
        // Hook: Hash refresh token before saving
        beforeCreate: async (session: AuthSession) => {
          if (session.refresh_token_hash && !session.refresh_token_hash.startsWith('$2a$')) {
            // Generate a secure hash of the refresh token
            const saltRounds = 12; // High security for refresh tokens
            session.refresh_token_hash = await bcrypt.hash(session.refresh_token_hash, saltRounds);
          }
        },
        // Hook: Don't allow modifying the token hash after creation
        beforeUpdate: (session: AuthSession) => {
          if (session.changed('refresh_token_hash')) {
            throw new Error('Cannot modify refresh token hash after creation');
          }
        },
      },
    }
  );

  return AuthSession;
};

export default AuthSession;