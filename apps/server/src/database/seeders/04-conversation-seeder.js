/**
 * Conversation Seeder
 * 
 * Creates demo conversations including direct messages and group chats.
 * Mix of conversation types for realistic testing.
 */

import { sequelize } from './database.js';
import { Conversation } from '../models/Conversation.js';

export const ConversationSeeder = async (users) => {
  try {
    console.log('  Creating conversations...');

    const demoConversations = [
      // Direct Messages
      {
        id: '850e8400-e29b-41d4-a716-446655440000',
        type: 'direct',
        title: null, // Will be set dynamically based on participants
        created_by: users[0].id, // Alice
        is_active: true,
        last_message_at: new Date(Date.now() - 1800000), // 30 minutes ago
        settings: {
          allow_member_invites: false,
          require_admin_approval: false,
          message_retention_days: null,
          encryption_enabled: true,
        },
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440001',
        type: 'direct',
        title: null,
        created_by: users[1].id, // Bob
        is_active: true,
        last_message_at: new Date(Date.now() - 900000), // 15 minutes ago
        settings: {
          allow_member_invites: false,
          require_admin_approval: false,
          message_retention_days: null,
          encryption_enabled: true,
        },
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440002',
        type: 'direct',
        title: null,
        created_by: users[3].id, // Diana
        is_active: true,
        last_message_at: new Date(Date.now() - 3600000), // 1 hour ago
        settings: {
          allow_member_invites: false,
          require_admin_approval: false,
          message_retention_days: null,
          encryption_enabled: true,
        },
      },

      // Group Chats
      {
        id: '850e8400-e29b-41d4-a716-446655440010',
        type: 'group',
        title: 'Coffee Enthusiasts',
        description: 'For coffee lovers to share recipes and recommendations',
        created_by: users[0].id, // Alice
        is_active: true,
        last_message_at: new Date(Date.now() - 300000), // 5 minutes ago
        settings: {
          allow_member_invites: true,
          require_admin_approval: false,
          message_retention_days: null,
          encryption_enabled: true,
        },
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440011',
        type: 'group',
        title: 'Book Club',
        description: 'Monthly book discussions and recommendations',
        created_by: users[2].id, // Charlie
        is_active: true,
        last_message_at: new Date(Date.now() - 7200000), // 2 hours ago
        settings: {
          allow_member_invites: false,
          require_admin_approval: true,
          message_retention_days: 365, // Keep messages for 1 year
          encryption_enabled: true,
        },
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440012',
        type: 'group',
        title: 'Project Team Alpha',
        description: 'Main project coordination channel',
        created_by: users[1].id, // Bob
        is_active: true,
        last_message_at: new Date(Date.now() - 60000), // 1 minute ago
        settings: {
          allow_member_invites: true,
          require_admin_approval: false,
          message_retention_days: null,
          encryption_enabled: true,
        },
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440013',
        type: 'group',
        title: 'Weekend Adventures',
        description: 'Planning weekend activities and trips',
        created_by: users[5].id, // Frida
        is_active: true,
        last_message_at: new Date(Date.now() - 1800000), // 30 minutes ago
        settings: {
          allow_member_invites: true,
          require_admin_approval: false,
          message_retention_days: null,
          encryption_enabled: true,
        },
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440014',
        type: 'group',
        title: 'Code Review Circle',
        description: 'Peer code reviews and programming discussions',
        created_by: users[6].id, // George
        is_active: true,
        last_message_at: new Date(Date.now() - 10800000), // 3 hours ago
        settings: {
          allow_member_invites: true,
          require_admin_approval: true,
          message_retention_days: null,
          encryption_enabled: true,
        },
      },

      // Inactive conversation for testing
      {
        id: '850e8400-e29b-41d4-a716-446655440020',
        type: 'group',
        title: 'Old Project',
        description: 'Completed project archive',
        created_by: users[1].id, // Bob
        is_active: false, // Inactive
        last_message_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        settings: {
          allow_member_invites: false,
          require_admin_approval: false,
          message_retention_days: 90,
          encryption_enabled: true,
        },
      },
    ];

    // Create conversations using bulkCreate
    const createdConversations = await Conversation.bulkCreate(demoConversations, {
      validate: true,
      individualHooks: false,
    });

    console.log(`  ✅ Created ${createdConversations.length} conversations`);
    return createdConversations;

  } catch (error) {
    console.error('  ❌ Conversation seeding failed:', error);
    throw error;
  }
};

export default ConversationSeeder;