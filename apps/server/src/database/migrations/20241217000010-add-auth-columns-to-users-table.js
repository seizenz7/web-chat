/**
 * Migration: Add Auth Columns to Users Table
 *
 * Adds:
 * - password_hash (bcrypt)
 * - totp_enabled
 * - totp_secret_encrypted (AES-GCM encrypted)
 */

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) Password hash
    // We add as nullable first so this migration can run against an existing DB.
    await queryInterface.addColumn('users', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'bcrypt hash of the user password',
    });

    // Backfill any existing rows with a demo password.
    // In a real production migration you would force password reset instead.
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE password_hash IS NULL"
    );

    if (rows.length > 0) {
      const hash = await bcrypt.hash('demo123', 12);
      await queryInterface.sequelize.query(
        'UPDATE users SET password_hash = :hash WHERE password_hash IS NULL',
        { replacements: { hash } }
      );
    }

    // Now enforce NOT NULL.
    await queryInterface.changeColumn('users', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: 'bcrypt hash of the user password',
    });

    // 2) TOTP
    await queryInterface.addColumn('users', 'totp_enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether user has enabled TOTP-based 2FA',
    });

    await queryInterface.addColumn('users', 'totp_secret_encrypted', {
      type: Sequelize.STRING(1024),
      allowNull: true,
      comment: 'Encrypted TOTP secret seed (AES-256-GCM)',
    });

    await queryInterface.addIndex('users', {
      fields: ['totp_enabled'],
      name: 'idx_users_totp_enabled',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_totp_enabled');

    await queryInterface.removeColumn('users', 'totp_secret_encrypted');
    await queryInterface.removeColumn('users', 'totp_enabled');
    await queryInterface.removeColumn('users', 'password_hash');
  },
};
