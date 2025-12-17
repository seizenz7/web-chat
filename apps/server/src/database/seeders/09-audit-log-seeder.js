/**
 * Audit Log Seeder
 * 
 * Creates demo audit log entries for security tracking.
 * Tracks user actions and system changes for compliance.
 */

import { sequelize } from './database.js';
import { AuditLog } from '../models/AuditLog.js';

export const AuditLogSeeder = async (users, conversations, messages) => {
  try {
    console.log('  Creating audit logs...');

    const demoAuditLogs = [
      // User authentication events
      {
        userIndex: 0, // Alice
        action: 'user_login',
        resource_type: 'auth',
        severity: 'info',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        userIndex: 1, // Bob
        action: 'user_login',
        resource_type: 'auth',
        severity: 'info',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      },
      {
        userIndex: 2, // Charlie
        action: 'user_login',
        resource_type: 'auth',
        severity: 'info',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      },
      {
        userIndex: 0, // Alice
        action: 'user_logout',
        resource_type: 'auth',
        severity: 'info',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      },

      // Conversation creation events
      {
        userIndex: 0, // Alice
        action: 'conversation_create',
        resource_type: 'conversation',
        resource_id: conversations[3].id, // Coffee Enthusiasts
        new_values: {
          type: 'group',
          title: 'Coffee Enthusiasts',
          description: 'For coffee lovers to share recipes and recommendations',
          member_count: 1,
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      },
      {
        userIndex: 2, // Charlie
        action: 'conversation_create',
        resource_type: 'conversation',
        resource_id: conversations[4].id, // Book Club
        new_values: {
          type: 'group',
          title: 'Book Club',
          description: 'Monthly book discussions and recommendations',
          member_count: 1,
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      },
      {
        userIndex: 1, // Bob
        action: 'conversation_create',
        resource_type: 'conversation',
        resource_id: conversations[5].id, // Project Team Alpha
        new_values: {
          type: 'group',
          title: 'Project Team Alpha',
          description: 'Main project coordination channel',
          member_count: 1,
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      },

      // User joined conversations
      {
        userIndex: 1, // Bob joined Coffee Enthusiasts
        action: 'conversation_join',
        resource_type: 'conversation',
        resource_id: conversations[3].id,
        severity: 'info',
        timestamp: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), // 55 days ago
      },
      {
        userIndex: 2, // Charlie joined Coffee Enthusiasts
        action: 'conversation_join',
        resource_type: 'conversation',
        resource_id: conversations[3].id,
        severity: 'info',
        timestamp: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
      },

      // Message events
      {
        userIndex: 0, // Alice
        action: 'message_create',
        resource_type: 'message',
        resource_id: messages[0].id,
        new_values: {
          message_type: 'text',
          conversation_id: conversations[0].id,
          content_preview: 'Hey Bob! How are you doing today?',
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        userIndex: 1, // Bob
        action: 'message_create',
        resource_type: 'message',
        resource_id: messages[1].id,
        new_values: {
          message_type: 'text',
          conversation_id: conversations[0].id,
          content_preview: 'Hi Alice! I\'m doing great, thanks for asking...',
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 3500000), // 58 minutes ago
      },

      // Message read events
      {
        userIndex: 1, // Bob read Alice's message
        action: 'message_read',
        resource_type: 'message',
        resource_id: messages[0].id,
        severity: 'info',
        timestamp: new Date(Date.now() - 3400000), // 56 minutes ago
      },
      {
        userIndex: 0, // Alice read Bob's message
        action: 'message_read',
        resource_type: 'message',
        resource_id: messages[1].id,
        severity: 'info',
        timestamp: new Date(Date.now() - 3450000), // 57 minutes ago
      },

      // Security events (failed logins, etc.)
      {
        userIndex: null, // Anonymous user
        action: 'login_failed',
        resource_type: 'auth',
        old_values: {
          email: 'attacker@example.com',
        },
        severity: 'warning',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        userIndex: null,
        action: 'login_failed',
        resource_type: 'auth',
        old_values: {
          email: 'unknown@evil.com',
        },
        severity: 'error',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
      },

      // Admin actions
      {
        userIndex: 3, // Diana
        action: 'conversation_update_settings',
        resource_type: 'conversation',
        resource_id: conversations[4].id, // Book Club
        old_values: {
          require_admin_approval: false,
          message_retention_days: null,
        },
        new_values: {
          require_admin_approval: true,
          message_retention_days: 365,
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },

      // File upload events
      {
        userIndex: 0, // Alice
        action: 'attachment_upload',
        resource_type: 'attachment',
        resource_id: null, // Would be set after attachment creation
        new_values: {
          file_name: 'coffee-shop-exterior.jpg',
          file_size: 245760,
          mime_type: 'image/jpeg',
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      },

      // User status changes
      {
        userIndex: 5, // Frida
        action: 'user_status_change',
        resource_type: 'user',
        resource_id: users[5].id,
        old_values: {
          status: 'offline',
        },
        new_values: {
          status: 'online',
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      },
      {
        userIndex: 6, // George
        action: 'user_status_change',
        resource_type: 'user',
        resource_id: users[6].id,
        old_values: {
          status: 'online',
        },
        new_values: {
          status: 'offline',
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      },

      // Key rotation events
      {
        userIndex: 0, // Alice
        action: 'key_rotation',
        resource_type: 'user_public_key',
        severity: 'info',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        userIndex: 1, // Bob
        action: 'key_rotation',
        resource_type: 'user_public_key',
        severity: 'info',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      },

      // System maintenance events
      {
        userIndex: null, // System
        action: 'database_maintenance',
        resource_type: 'system',
        new_values: {
          operation: 'vacuum_analyze',
          tables_processed: ['messages', 'message_statuses', 'audit_logs'],
          duration_seconds: 45,
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
    ];

    const createdAuditLogs = [];

    for (const logData of demoAuditLogs) {
      const user = logData.userIndex !== null ? users[logData.userIndex] : null;
      
      const auditLog = await AuditLog.create({
        user_id: user ? user.id : null,
        action: logData.action,
        resource_type: logData.resource_type,
        resource_id: logData.resource_id || null,
        old_values: logData.old_values || null,
        new_values: logData.new_values || null,
        ip_address: user ? '192.168.1.100' : '203.0.113.1', // Different IP for anonymous events
        user_agent: 'Mozilla/5.0 (compatible; ChatApp/1.0)',
        severity: logData.severity,
        created_at: logData.timestamp,
      });

      createdAuditLogs.push(auditLog);
    }

    console.log(`  ✅ Created ${createdAuditLogs.length} audit log entries`);
    return createdAuditLogs;

  } catch (error) {
    console.error('  ❌ Audit log seeding failed:', error);
    throw error;
  }
};

export default AuditLogSeeder;