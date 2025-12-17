/**
 * Attachment Model
 *
 * Stores metadata for file attachments.
 * Actual files stored in external storage (S3, etc.).
 * Supports encryption and thumbnail generation.
 */

import { DataTypes, Model, UUIDV4 } from 'sequelize';
import { getSequelize } from '../init';
import { 
  AttachmentAttributes, 
  AttachmentCreationAttributes 
} from './types';

export class Attachment extends Model<AttachmentAttributes, AttachmentCreationAttributes> implements AttachmentAttributes {
  public id!: string;
  public message_id!: string;
  public file_name!: string;
  public file_path!: string;
  public file_size!: number;
  public mime_type!: string;
  public file_hash!: string;
  public thumbnail_path?: string;
  public is_encrypted!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association methods
  public readonly message?: import('./Message').Message;
}

export const initAttachmentModel = (sequelize: any) => {
  Attachment.init(
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
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Original filename',
      },
      file_path: {
        type: DataTypes.STRING(1000),
        allowNull: false,
        comment: 'Storage location (S3 URL, local path, etc.)',
      },
      file_size: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'File size in bytes',
        validate: {
          min: 0,
        },
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'MIME type (image/jpeg, application/pdf, etc.)',
      },
      file_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'SHA-256 hash for integrity checking',
        validate: {
          len: [64, 64], // SHA-256 is always 64 characters in hex
        },
      },
      thumbnail_path: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        comment: 'Thumbnail storage location for images/videos',
      },
      is_encrypted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether file content is encrypted',
      },
    },
    {
      sequelize: sequelize,
      tableName: 'attachments',
      indexes: [
        // Primary lookup by message
        {
          fields: ['message_id'],
          name: 'idx_attachments_message_id',
        },
        // For MIME type filtering
        {
          fields: ['mime_type'],
          name: 'idx_attachments_mime_type',
        },
        // For file size queries (analytics)
        {
          fields: ['file_size'],
          name: 'idx_attachments_file_size',
        },
        // For hash-based duplicate detection
        {
          unique: true,
          fields: ['file_hash'],
          name: 'idx_attachments_file_hash_unique',
        },
        // For file type based queries
        {
          fields: ['is_encrypted'],
          name: 'idx_attachments_is_encrypted',
        },
        // For content type queries
        {
          fields: ['mime_type', 'is_encrypted'],
          name: 'idx_attachments_mime_type_encrypted',
        },
      ],
      hooks: {
        // Hook: Generate file hash if not provided
        beforeCreate: async (attachment: Attachment) => {
          // In a real implementation, you would calculate the hash
          // when the file is uploaded. For now, we'll skip this.
          if (!attachment.file_hash) {
            throw new Error('File hash is required for security');
          }
        },
      },
    }
  );

  return Attachment;
};

export default Attachment;