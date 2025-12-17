/**
 * User Public Key Model
 *
 * Stores public keys for end-to-end encryption.
 * Supports key rotation by allowing multiple keys per user.
 */

import { DataTypes, Model, UUIDV4 } from 'sequelize';
import { getSequelize } from '../init';
import { 
  UserPublicKeyAttributes, 
  UserPublicKeyCreationAttributes 
} from './types';

export class UserPublicKey extends Model<UserPublicKeyAttributes, UserPublicKeyCreationAttributes> implements UserPublicKeyAttributes {
  public id!: string;
  public user_id!: string;
  public public_key!: string;
  public key_type!: 'encryption' | 'signing';
  public is_active!: boolean;
  public expires_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association methods
  public readonly user?: import('./User').User;
}

export const initUserPublicKeyModel = (sequelize: any) => {
  UserPublicKey.init(
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
      public_key: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: 'Base64-encoded public key',
        validate: {
          notEmpty: true,
        },
      },
      key_type: {
        type: DataTypes.ENUM('encryption', 'signing'),
        allowNull: false,
        defaultValue: 'encryption',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Optional key expiration date',
      },
    },
    {
      sequelize: sequelize,
      tableName: 'user_public_keys',
      indexes: [
        // Primary lookup by user
        {
          fields: ['user_id'],
          name: 'idx_user_public_keys_user_id',
        },
        // For finding active keys
        {
          fields: ['user_id', 'is_active'],
          name: 'idx_user_public_keys_user_active',
        },
        // For key rotation queries
        {
          fields: ['key_type', 'is_active'],
          name: 'idx_user_public_keys_type_active',
        },
        // For cleanup of expired keys
        {
          fields: ['expires_at'],
          name: 'idx_user_public_keys_expires_at',
        },
        // Composite index for active user keys
        {
          fields: ['user_id', 'key_type', 'is_active'],
          name: 'idx_user_public_keys_user_type_active',
        },
      ],
      hooks: {
        // Hook: Ensure only one active key per type per user
        afterCreate: async (key: UserPublicKey) => {
          if (key.is_active) {
            await UserPublicKey.update(
              { is_active: false },
              {
                where: {
                  user_id: key.user_id,
                  key_type: key.key_type,
                  id: { [sequelize.Sequelize.Op.ne]: key.id },
                },
              }
            );
          }
        },
        // Hook: Ensure only one active key per type per user on update
        beforeUpdate: async (key: UserPublicKey) => {
          if (key.changed('is_active') && key.is_active) {
            await UserPublicKey.update(
              { is_active: false },
              {
                where: {
                  user_id: key.user_id,
                  key_type: key.key_type,
                  id: { [sequelize.Sequelize.Op.ne]: key.id },
                },
              }
            );
          }
        },
      },
    }
  );

  return UserPublicKey;
};

export default UserPublicKey;