/**
 * Conversation Participant Seeder
 * 
 * Creates links between users and conversations with their roles.
 * Simulates realistic conversation memberships.
 */

import { sequelize } from './database.js';
import { ConversationParticipant } from '../models/ConversationParticipant.js';

export const ConversationParticipantSeeder = async (users, conversations) => {
  try {
    console.log('  Creating conversation participants...');

    const demoParticipants = [
      // Direct Message: Alice & Bob
      {
        id: '950e8400-e29b-41d4-a716-446655440000',
        conversation_id: conversations[0].id, // Alice-Bob DM
        user_id: users[0].id, // Alice
        role: 'member',
        joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440001',
        conversation_id: conversations[0].id, // Alice-Bob DM
        user_id: users[1].id, // Bob
        role: 'member',
        joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        is_active: true,
      },

      // Direct Message: Bob & Charlie
      {
        id: '950e8400-e29b-41d4-a716-446655440002',
        conversation_id: conversations[1].id, // Bob-Charlie DM
        user_id: users[1].id, // Bob
        role: 'member',
        joined_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440003',
        conversation_id: conversations[1].id, // Bob-Charlie DM
        user_id: users[2].id, // Charlie
        role: 'member',
        joined_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        is_active: true,
      },

      // Direct Message: Diana & Helen
      {
        id: '950e8400-e29b-41d4-a716-446655440004',
        conversation_id: conversations[2].id, // Diana-Helen DM
        user_id: users[3].id, // Diana
        role: 'member',
        joined_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440005',
        conversation_id: conversations[2].id, // Diana-Helen DM
        user_id: users[7].id, // Helen
        role: 'member',
        joined_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        is_active: true,
      },

      // Coffee Enthusiasts Group (6 members)
      {
        id: '950e8400-e29b-41d4-a716-446655440010',
        conversation_id: conversations[3].id, // Coffee Enthusiasts
        user_id: users[0].id, // Alice (admin)
        role: 'admin',
        joined_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440011',
        conversation_id: conversations[3].id,
        user_id: users[1].id, // Bob
        role: 'member',
        joined_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440012',
        conversation_id: conversations[3].id,
        user_id: users[2].id, // Charlie
        role: 'moderator',
        joined_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440013',
        conversation_id: conversations[3].id,
        user_id: users[5].id, // Frida
        role: 'member',
        joined_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440014',
        conversation_id: conversations[3].id,
        user_id: users[6].id, // George
        role: 'member',
        joined_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440015',
        conversation_id: conversations[3].id,
        user_id: users[7].id, // Helen
        role: 'member',
        joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        is_active: true,
      },

      // Book Club (5 members)
      {
        id: '950e8400-e29b-41d4-a716-446655440020',
        conversation_id: conversations[4].id, // Book Club
        user_id: users[2].id, // Charlie (admin)
        role: 'admin',
        joined_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440021',
        conversation_id: conversations[4].id,
        user_id: users[3].id, // Diana
        role: 'member',
        joined_at: new Date(Date.now() - 115 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440022',
        conversation_id: conversations[4].id,
        user_id: users[4].id, // Edgar
        role: 'member',
        joined_at: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440023',
        conversation_id: conversations[4].id,
        user_id: users[6].id, // George
        role: 'moderator',
        joined_at: new Date(Date.now() - 105 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440024',
        conversation_id: conversations[4].id,
        user_id: users[7].id, // Helen
        role: 'member',
        joined_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        is_active: true,
      },

      // Project Team Alpha (4 members)
      {
        id: '950e8400-e29b-41d4-a716-446655440030',
        conversation_id: conversations[5].id, // Project Team Alpha
        user_id: users[1].id, // Bob (admin)
        role: 'admin',
        joined_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440031',
        conversation_id: conversations[5].id,
        user_id: users[0].id, // Alice
        role: 'member',
        joined_at: new Date(Date.now() - 88 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440032',
        conversation_id: conversations[5].id,
        user_id: users[5].id, // Frida
        role: 'moderator',
        joined_at: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440033',
        conversation_id: conversations[5].id,
        user_id: users[6].id, // George
        role: 'member',
        joined_at: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
        is_active: true,
      },

      // Weekend Adventures (4 members)
      {
        id: '950e8400-e29b-41d4-a716-446655440040',
        conversation_id: conversations[6].id, // Weekend Adventures
        user_id: users[5].id, // Frida (admin)
        role: 'admin',
        joined_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440041',
        conversation_id: conversations[6].id,
        user_id: users[0].id, // Alice
        role: 'member',
        joined_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440042',
        conversation_id: conversations[6].id,
        user_id: users[3].id, // Diana
        role: 'member',
        joined_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440043',
        conversation_id: conversations[6].id,
        user_id: users[7].id, // Helen
        role: 'member',
        joined_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        is_active: true,
      },

      // Code Review Circle (3 members)
      {
        id: '950e8400-e29b-41d4-a716-446655440050',
        conversation_id: conversations[7].id, // Code Review Circle
        user_id: users[6].id, // George (admin)
        role: 'admin',
        joined_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440051',
        conversation_id: conversations[7].id,
        user_id: users[1].id, // Bob
        role: 'member',
        joined_at: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        is_active: true,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440052',
        conversation_id: conversations[7].id,
        user_id: users[5].id, // Frida
        role: 'member',
        joined_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        is_active: true,
      },

      // Old Project (inactive, 2 members left)
      {
        id: '950e8400-e29b-41d4-a716-446655440060',
        conversation_id: conversations[8].id, // Old Project
        user_id: users[1].id, // Bob (admin)
        role: 'admin',
        joined_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        left_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Left 60 days ago
        is_active: false,
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440061',
        conversation_id: conversations[8].id,
        user_id: users[0].id, // Alice (still active, admin now)
        role: 'admin',
        joined_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        is_active: true, // Still active participant
      },
    ];

    // Create participants using bulkCreate
    const createdParticipants = await ConversationParticipant.bulkCreate(demoParticipants, {
      validate: true,
      individualHooks: false,
    });

    console.log(`  ✅ Created ${createdParticipants.length} conversation participants`);
    return createdParticipants;

  } catch (error) {
    console.error('  ❌ Conversation participant seeding failed:', error);
    throw error;
  }
};

export default ConversationParticipantSeeder;