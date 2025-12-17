/**
 * Migration: Create User Public Keys Table
 * Created: 2024-12-17
 * 
 * This migration creates the user_public_keys table for end-to-end encryption.
 * Supports key rotation by allowing multiple keys per user.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_public_keys', {
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
        onDelete: 'CASCADE', // Clean up keys when user is deleted
        onUpdate: 'CASCADE',
        comment: 'Foreign key to users table',
      },
      public_key: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
        comment: 'Base64-encoded public key',
      },
      key_type: {
        type: Sequelize.ENUM('encryption', 'signing'),
        allowNull: false,
        defaultValue: 'encryption',
        comment: 'Key purpose (encryption or digital signing)',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Is this the current active key',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Optional key expiration date',
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
    await queryInterface.addIndex('user_public_keys', {
      fields: ['user_id'],
      name: 'idx_user_public_keys_user_id',
    });

    await queryInterface.addIndex('user_public_keys', {
      fields: ['user_id', 'is_active'],
      name: 'idx_user_public_keys_user_active',
    });

    await queryInterface.addIndex('user_public_keys', {
      fields: ['key_type', 'is_active'],
      name: 'idx_user_public_keys_type_active',
    });

    await queryInterface.addIndex('user_public_keys', {
      fields: ['expires_at'],
      name: 'idx_user_public_keys_expires_at',
    });

    await queryInterface.addIndex('user_public_keys', {
      fields: ['user_id', 'key_type', 'is_active'],
      name: 'idx_user_public_keys_user_type_active',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('user_public_keys', 'idx_user_public_keys_user_id');
    await queryInterface.removeIndex('user_public_keys', 'idx_user_public_keys_user_active');
    await queryInterface.removeIndex('user_public_keys', 'idx_user_public_keys_type_active');
    await queryInterface.removeIndex('user_public_keys', 'idx_user_public_keys_expires_at');
    await queryInterface.removeIndex('user_public_keys', 'idx_user_public_keys_user_type_active');

    // Drop the table
    await queryInterface.dropTable('user_public_keys');
  },
};