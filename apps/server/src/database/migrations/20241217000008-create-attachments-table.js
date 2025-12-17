/**
 * Migration: Create Attachments Table
 * Created: 2024-12-17
 * 
 * This migration creates the attachments table for storing file metadata.
 * Actual files stored in external storage (S3, etc.).
 * Supports encryption and thumbnail generation.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attachments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      message_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id',
        },
        onDelete: 'CASCADE', // Delete attachments when message is deleted
        onUpdate: 'CASCADE',
        comment: 'Foreign key to messages table',
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Original filename',
      },
      file_path: {
        type: Sequelize.STRING(1000),
        allowNull: false,
        comment: 'Storage location (S3 URL, local path, etc.)',
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'File size in bytes',
        validate: {
          min: 0,
        },
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'MIME type (image/jpeg, application/pdf, etc.)',
      },
      file_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'SHA-256 hash for integrity checking',
        validate: {
          len: [64, 64], // SHA-256 is always 64 characters in hex
        },
      },
      thumbnail_path: {
        type: Sequelize.STRING(1000),
        allowNull: true,
        comment: 'Thumbnail storage location for images/videos',
      },
      is_encrypted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether file content is encrypted',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes for performance
    await queryInterface.addIndex('attachments', {
      fields: ['message_id'],
      name: 'idx_attachments_message_id',
    });

    await queryInterface.addIndex('attachments', {
      fields: ['mime_type'],
      name: 'idx_attachments_mime_type',
    });

    await queryInterface.addIndex('attachments', {
      fields: ['file_size'],
      name: 'idx_attachments_file_size',
    });

    // Unique constraint to prevent duplicate files
    await queryInterface.addIndex('attachments', {
      fields: ['file_hash'],
      unique: true,
      name: 'idx_attachments_file_hash_unique',
    });

    await queryInterface.addIndex('attachments', {
      fields: ['is_encrypted'],
      name: 'idx_attachments_is_encrypted',
    });

    await queryInterface.addIndex('attachments', {
      fields: ['mime_type', 'is_encrypted'],
      name: 'idx_attachments_mime_type_encrypted',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('attachments', 'idx_attachments_message_id');
    await queryInterface.removeIndex('attachments', 'idx_attachments_mime_type');
    await queryInterface.removeIndex('attachments', 'idx_attachments_file_size');
    await queryInterface.removeIndex('attachments', 'idx_attachments_file_hash_unique');
    await queryInterface.removeIndex('attachments', 'idx_attachments_is_encrypted');
    await queryInterface.removeIndex('attachments', 'idx_attachments_mime_type_encrypted');

    // Drop the table
    await queryInterface.dropTable('attachments');
  },
};