/**
 * Migration: Create Message Status Events Table
 * Created: 2024-12-17
 * 
 * This migration creates the message_statuses table for tracking message delivery states.
 * Supports different status types (sent, delivered, read, reactions).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('message_statuses', {
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
        onDelete: 'CASCADE', // Clean up status when message is deleted
        onUpdate: 'CASCADE',
        comment: 'Foreign key to messages table',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE', // Clean up status when user is deleted
        onUpdate: 'CASCADE',
        comment: 'Foreign key to users table',
      },
      status: {
        type: Sequelize.ENUM('sent', 'delivered', 'read', 'failed', 'reacted'),
        allowNull: false,
        defaultValue: 'sent',
        comment: 'Current status type',
      },
      reaction: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Emoji reaction (max 10 chars for Unicode)',
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When message was delivered to user',
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When user read the message',
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
    await queryInterface.addIndex('message_statuses', {
      fields: ['message_id'],
      name: 'idx_message_statuses_message_id',
    });

    await queryInterface.addIndex('message_statuses', {
      fields: ['user_id'],
      name: 'idx_message_statuses_user_id',
    });

    await queryInterface.addIndex('message_statuses', {
      fields: ['status'],
      name: 'idx_message_statuses_status',
    });

    await queryInterface.addIndex('message_statuses', {
      fields: ['message_id', 'status'],
      name: 'idx_message_statuses_message_status',
    });

    await queryInterface.addIndex('message_statuses', {
      fields: ['user_id', 'status'],
      name: 'idx_message_statuses_user_status',
    });

    await queryInterface.addIndex('message_statuses', {
      fields: ['created_at'],
      name: 'idx_message_statuses_created_at',
    });

    await queryInterface.addIndex('message_statuses', {
      fields: ['delivered_at'],
      name: 'idx_message_statuses_delivered_at',
    });

    await queryInterface.addIndex('message_statuses', {
      fields: ['read_at'],
      name: 'idx_message_statuses_read_at',
    });

    // Unique constraint to prevent duplicate status updates per user per message
    await queryInterface.addIndex('message_statuses', {
      fields: ['message_id', 'user_id'],
      unique: true,
      name: 'idx_message_statuses_message_user_unique',
    });

    await queryInterface.addIndex('message_statuses', {
      fields: ['user_id', 'status', 'created_at'],
      name: 'idx_message_statuses_user_status_time',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_message_id');
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_user_id');
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_status');
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_message_status');
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_user_status');
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_created_at');
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_delivered_at');
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_read_at');
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_message_user_unique');
    await queryInterface.removeIndex('message_statuses', 'idx_message_statuses_user_status_time');

    // Drop the table
    await queryInterface.dropTable('message_statuses');
  },
};