/**
 * Migration: Create Conversation Participants Table
 * Created: 2024-12-17
 * 
 * This migration creates the conversation_participants linking table.
 * Links users to conversations with their roles and key material.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversation_participants', {
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
        onDelete: 'CASCADE', // Clean up participants when conversation is deleted
        onUpdate: 'CASCADE',
        comment: 'Foreign key to conversations table',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT', // Prevent deleting user who owns conversations
        onUpdate: 'CASCADE',
        comment: 'Foreign key to users table',
      },
      role: {
        type: Sequelize.ENUM('admin', 'moderator', 'member'),
        allowNull: false,
        defaultValue: 'member',
        comment: 'User permission level in conversation',
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When user joined the conversation',
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When user left the conversation (null if still active)',
      },
      key_material: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        comment: 'Encrypted key material for this user in this conversation',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Is user currently in this conversation',
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
    await queryInterface.addIndex('conversation_participants', {
      fields: ['conversation_id'],
      name: 'idx_conversation_participants_conversation_id',
    });

    await queryInterface.addIndex('conversation_participants', {
      fields: ['user_id'],
      name: 'idx_conversation_participants_user_id',
    });

    await queryInterface.addIndex('conversation_participants', {
      fields: ['conversation_id', 'is_active'],
      name: 'idx_conversation_participants_conversation_active',
    });

    await queryInterface.addIndex('conversation_participants', {
      fields: ['user_id', 'is_active'],
      name: 'idx_conversation_participants_user_active',
    });

    await queryInterface.addIndex('conversation_participants', {
      fields: ['conversation_id', 'role'],
      name: 'idx_conversation_participants_conversation_role',
    });

    await queryInterface.addIndex('conversation_participants', {
      fields: ['conversation_id', 'is_active', 'role'],
      name: 'idx_conversation_participants_conversation_active_role',
    });

    // Unique constraint to prevent duplicate active memberships
    await queryInterface.addIndex('conversation_participants', {
      fields: ['conversation_id', 'user_id'],
      unique: true,
      name: 'idx_conversation_participants_user_unique_active',
      where: {
        is_active: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('conversation_participants', 'idx_conversation_participants_conversation_id');
    await queryInterface.removeIndex('conversation_participants', 'idx_conversation_participants_user_id');
    await queryInterface.removeIndex('conversation_participants', 'idx_conversation_participants_conversation_active');
    await queryInterface.removeIndex('conversation_participants', 'idx_conversation_participants_user_active');
    await queryInterface.removeIndex('conversation_participants', 'idx_conversation_participants_conversation_role');
    await queryInterface.removeIndex('conversation_participants', 'idx_conversation_participants_conversation_active_role');
    await queryInterface.removeIndex('conversation_participants', 'idx_conversation_participants_user_unique_active');

    // Drop the table
    await queryInterface.dropTable('conversation_participants');
  },
};