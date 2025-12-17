/**
 * Migration: Create Messages Table
 * Created: 2024-12-17
 * 
 * This migration creates the messages table for storing chat messages.
 * Content is encrypted for end-to-end security with support for different message types.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id',
        },
        onDelete: 'CASCADE', // Delete messages when conversation is deleted
        onUpdate: 'CASCADE',
        comment: 'Foreign key to conversations table',
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL', // Keep messages even if user is deleted
        onUpdate: 'CASCADE',
        comment: 'Foreign key to users table (message sender)',
      },
      content_encrypted: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
        comment: 'Base64-encoded encrypted message content',
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'file', 'system', 'voice'),
        allowNull: false,
        defaultValue: 'text',
        comment: 'Message content type',
      },
      reply_to_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'messages',
          key: 'id',
        },
        onDelete: 'SET NULL', // Keep messages even if parent is deleted
        onUpdate: 'CASCADE',
        comment: 'Self-reference for threaded/reply messages',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional message metadata (file info, duration, etc.)',
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Has this message been edited',
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Soft delete flag - preserves message in DB for conversation integrity',
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
    await queryInterface.addIndex('messages', {
      fields: ['conversation_id'],
      name: 'idx_messages_conversation_id',
    });

    await queryInterface.addIndex('messages', {
      fields: ['conversation_id', 'created_at'],
      name: 'idx_messages_conversation_created_at',
    });

    await queryInterface.addIndex('messages', {
      fields: ['sender_id'],
      name: 'idx_messages_sender_id',
    });

    await queryInterface.addIndex('messages', {
      fields: ['reply_to_id'],
      name: 'idx_messages_reply_to_id',
    });

    await queryInterface.addIndex('messages', {
      fields: ['message_type'],
      name: 'idx_messages_message_type',
    });

    await queryInterface.addIndex('messages', {
      fields: ['is_deleted'],
      name: 'idx_messages_is_deleted',
    });

    await queryInterface.addIndex('messages', {
      fields: ['conversation_id', 'is_deleted'],
      name: 'idx_messages_conversation_not_deleted',
    });

    await queryInterface.addIndex('messages', {
      fields: ['conversation_id', 'created_at', 'is_deleted'],
      name: 'idx_messages_conversation_recent_not_deleted',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('messages', 'idx_messages_conversation_id');
    await queryInterface.removeIndex('messages', 'idx_messages_conversation_created_at');
    await queryInterface.removeIndex('messages', 'idx_messages_sender_id');
    await queryInterface.removeIndex('messages', 'idx_messages_reply_to_id');
    await queryInterface.removeIndex('messages', 'idx_messages_message_type');
    await queryInterface.removeIndex('messages', 'idx_messages_is_deleted');
    await queryInterface.removeIndex('messages', 'idx_messages_conversation_not_deleted');
    await queryInterface.removeIndex('messages', 'idx_messages_conversation_recent_not_deleted');

    // Drop the table
    await queryInterface.dropTable('messages');
  },
};