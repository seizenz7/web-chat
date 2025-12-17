/**
 * Migration: Create Auth Sessions Table
 * Created: 2024-12-17
 * 
 * This migration creates the auth_sessions table for managing refresh tokens.
 * Each session represents one active login from a specific device.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auth_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT', // Prevent deleting user with active sessions
        onUpdate: 'CASCADE',
        comment: 'Foreign key to users table',
      },
      refresh_token_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Hashed refresh token using bcrypt',
      },
      device_info: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'User agent, device type, browser info',
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: false,
        comment: 'Client IP address at time of login',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When this refresh token expires',
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this session was manually revoked',
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
    await queryInterface.addIndex('auth_sessions', {
      fields: ['user_id'],
      name: 'idx_auth_sessions_user_id',
    });

    await queryInterface.addIndex('auth_sessions', {
      fields: ['expires_at'],
      name: 'idx_auth_sessions_expires_at',
    });

    await queryInterface.addIndex('auth_sessions', {
      fields: ['revoked_at'],
      name: 'idx_auth_sessions_revoked_at',
    });

    await queryInterface.addIndex('auth_sessions', {
      fields: ['user_id', 'expires_at', 'revoked_at'],
      name: 'idx_auth_sessions_user_valid',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('auth_sessions', 'idx_auth_sessions_user_id');
    await queryInterface.removeIndex('auth_sessions', 'idx_auth_sessions_expires_at');
    await queryInterface.removeIndex('auth_sessions', 'idx_auth_sessions_revoked_at');
    await queryInterface.removeIndex('auth_sessions', 'idx_auth_sessions_user_valid');

    // Drop the table
    await queryInterface.dropTable('auth_sessions');
  },
};