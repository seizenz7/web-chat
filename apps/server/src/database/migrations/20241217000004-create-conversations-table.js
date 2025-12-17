/**
 * Migration: Create Conversations Table
 * Created: 2024-12-17
 * 
 * This migration creates the conversations table for managing chat conversations.
 * Supports both direct messages and group chats with flexible settings.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct',
        comment: 'Conversation type: direct message or group chat',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Group conversation name (null for direct messages)',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Group conversation description',
      },
      avatar_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Group avatar URL',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT', // Prevent deleting user who owns conversations
        onUpdate: 'CASCADE',
        comment: 'Foreign key to users table (who created the conversation)',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Is the conversation active',
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of last message (for sorting)',
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          allow_member_invites: true,
          require_admin_approval: false,
          message_retention_days: null,
          encryption_enabled: true,
        },
        comment: 'Conversation-specific settings as JSON',
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
    await queryInterface.addIndex('conversations', {
      fields: ['type'],
      name: 'idx_conversations_type',
    });

    await queryInterface.addIndex('conversations', {
      fields: ['is_active'],
      name: 'idx_conversations_is_active',
    });

    await queryInterface.addIndex('conversations', {
      fields: ['last_message_at'],
      name: 'idx_conversations_last_message_at',
    });

    await queryInterface.addIndex('conversations', {
      fields: ['created_by'],
      name: 'idx_conversations_created_by',
    });

    await queryInterface.addIndex('conversations', {
      fields: ['type', 'is_active', 'last_message_at'],
      name: 'idx_conversations_type_active_recent',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('conversations', 'idx_conversations_type');
    await queryInterface.removeIndex('conversations', 'idx_conversations_is_active');
    await queryInterface.removeIndex('conversations', 'idx_conversations_last_message_at');
    await queryInterface.removeIndex('conversations', 'idx_conversations_created_by');
    await queryInterface.removeIndex('conversations', 'idx_conversations_type_active_recent');

    // Drop the table
    await queryInterface.dropTable('conversations');
  },
};