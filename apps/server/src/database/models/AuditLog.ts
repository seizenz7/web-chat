/**
 * Audit Log Model
 *
 * Security audit trail for sensitive operations.
 * Tracks user actions and system changes for compliance and security.
 */

import { DataTypes, Model, UUIDV4 } from 'sequelize';
import { getSequelize } from '../init';
import { 
  AuditLogAttributes, 
  AuditLogCreationAttributes 
} from './types';

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: string;
  public user_id?: string;
  public action!: string;
  public resource_type!: string;
  public resource_id?: string;
  public old_values?: Record<string, any>;
  public new_values?: Record<string, any>;
  public ip_address!: string;
  public user_agent!: string;
  public severity!: 'info' | 'warning' | 'error' | 'security';
  public readonly created_at!: Date;

  // Association methods
  public readonly user?: import('./User').User;
}

export const initAuditLogModel = (sequelize: any) => {
  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'Nullable for system-generated events',
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Action performed (e.g., "user_login", "message_delete")',
        validate: {
          len: [1, 100],
        },
      },
      resource_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Type of resource affected (e.g., "user", "conversation", "message")',
        validate: {
          len: [1, 50],
        },
      },
      resource_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of affected resource (if applicable)',
      },
      old_values: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Previous values (for updates/deletes)',
      },
      new_values: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'New values (for creates/updates)',
      },
      ip_address: {
        type: DataTypes.INET,
        allowNull: false,
        comment: 'Client IP address',
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Client user agent string',
      },
      severity: {
        type: DataTypes.ENUM('info', 'warning', 'error', 'security'),
        allowNull: false,
        defaultValue: 'info',
      },
    },
    {
      sequelize: sequelize,
      tableName: 'audit_logs',
      indexes: [
        // Primary lookup by user (for user activity logs)
        {
          fields: ['user_id'],
          name: 'idx_audit_logs_user_id',
        },
        // For action-based queries
        {
          fields: ['action'],
          name: 'idx_audit_logs_action',
        },
        // For resource-based queries
        {
          fields: ['resource_type'],
          name: 'idx_audit_logs_resource_type',
        },
        // For resource-specific queries
        {
          fields: ['resource_type', 'resource_id'],
          name: 'idx_audit_logs_resource',
        },
        // For severity-based filtering
        {
          fields: ['severity'],
          name: 'idx_audit_logs_severity',
        },
        // For time-based queries
        {
          fields: ['created_at'],
          name: 'idx_audit_logs_created_at',
        },
        // For security event monitoring
        {
          fields: ['severity', 'created_at'],
          name: 'idx_audit_logs_severity_time',
        },
        // For user security monitoring
        {
          fields: ['user_id', 'severity', 'created_at'],
          name: 'idx_audit_logs_user_severity_time',
        },
        // For action tracking
        {
          fields: ['action', 'created_at'],
          name: 'idx_audit_logs_action_time',
        },
      ],
      hooks: {
        // Hook: Automatically set IP address if not provided
        beforeCreate: (log: AuditLog) => {
          if (!log.ip_address && typeof window === 'undefined') {
            // This would be set by middleware in a real implementation
            log.ip_address = '127.0.0.1';
          }
        },
      },
    }
  );

  return AuditLog;
};

export default AuditLog;