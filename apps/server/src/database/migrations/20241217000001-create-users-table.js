/**
 * Migration: Create Users Table
 * Created: 2024-12-17
 * 
 * This migration creates the central users table for the chat application.
 * Includes proper indexing for authentication and user lookups.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique username (lowercase, alphanumeric + underscores)',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Unique email address (lowercase)',
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "User's display name (can contain special characters)",
      },
      avatar_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Profile picture URL',
      },
      status: {
        type: Sequelize.ENUM('online', 'offline', 'away', 'busy'),
        allowNull: true,
        defaultValue: 'offline',
        comment: 'Current presence status',
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last activity timestamp',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Account status (can be deactivated)',
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
    await queryInterface.addIndex('users', {
      fields: ['username'],
      unique: true,
      name: 'idx_users_username_unique',
    });

    await queryInterface.addIndex('users', {
      fields: ['email'],
      unique: true,
      name: 'idx_users_email_unique',
    });

    await queryInterface.addIndex('users', {
      fields: ['display_name'],
      name: 'idx_users_display_name',
    });

    await queryInterface.addIndex('users', {
      fields: ['status'],
      name: 'idx_users_status',
    });

    await queryInterface.addIndex('users', {
      fields: ['last_seen_at'],
      name: 'idx_users_last_seen_at',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('users', 'idx_users_username_unique');
    await queryInterface.removeIndex('users', 'idx_users_email_unique');
    await queryInterface.removeIndex('users', 'idx_users_display_name');
    await queryInterface.removeIndex('users', 'idx_users_status');
    await queryInterface.removeIndex('users', 'idx_users_last_seen_at');

    // Drop the table
    await queryInterface.dropTable('users');
  },
};