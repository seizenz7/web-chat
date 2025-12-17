/**
 * Migration: Create Audit Logs Table
 * Created: 2024-12-17
 * 
 * This migration creates the audit_logs table for security audit trails.
 * Tracks user actions and system changes for compliance and security.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL', // Keep audit logs even if user is deleted
        onUpdate: 'CASCADE',
        comment: 'Nullable for system-generated events',
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Action performed (e.g., "user_login", "message_delete")',
      },
      resource_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of resource affected (e.g., "user", "conversation", "message")',
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'ID of affected resource (if applicable)',
      },
      old_values: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Previous values (for updates/deletes)',
      },
      new_values: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'New values (for creates/updates)',
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: false,
        comment: 'Client IP address',
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Client user agent string',
      },
      severity: {
        type: Sequelize.ENUM('info', 'warning', 'error', 'security'),
        allowNull: false,
        defaultValue: 'info',
        comment: 'Log severity level',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes for performance
    await queryInterface.addIndex('audit_logs', {
      fields: ['user_id'],
      name: 'idx_audit_logs_user_id',
    });

    await queryInterface.addIndex('audit_logs', {
      fields: ['action'],
      name: 'idx_audit_logs_action',
    });

    await queryInterface.addIndex('audit_logs', {
      fields: ['resource_type'],
      name: 'idx_audit_logs_resource_type',
    });

    await queryInterface.addIndex('audit_logs', {
      fields: ['resource_type', 'resource_id'],
      name: 'idx_audit_logs_resource',
    });

    await queryInterface.addIndex('audit_logs', {
      fields: ['severity'],
      name: 'idx_audit_logs_severity',
    });

    await queryInterface.addIndex('audit_logs', {
      fields: ['created_at'],
      name: 'idx_audit_logs_created_at',
    });

    await queryInterface.addIndex('audit_logs', {
      fields: ['severity', 'created_at'],
      name: 'idx_audit_logs_severity_time',
    });

    await queryInterface.addIndex('audit_logs', {
      fields: ['user_id', 'severity', 'created_at'],
      name: 'idx_audit_logs_user_severity_time',
    });

    await queryInterface.addIndex('audit_logs', {
      fields: ['action', 'created_at'],
      name: 'idx_audit_logs_action_time',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_user_id');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_action');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_resource_type');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_resource');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_severity');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_created_at');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_severity_time');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_user_severity_time');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_action_time');

    // Drop the table
    await queryInterface.dropTable('audit_logs');
  },
};