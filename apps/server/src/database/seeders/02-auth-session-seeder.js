/**
 * Auth Session Seeder
 * 
 * Creates demo authentication sessions for users.
 * Each session represents a login from a specific device.
 */

import bcrypt from 'bcryptjs';
import { sequelize } from './database.js';
import { AuthSession } from '../models/AuthSession.js';

export const AuthSessionSeeder = async (users) => {
  try {
    console.log('  Creating auth sessions...');

    // Create demo refresh tokens
    const demoTokens = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example1',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example2',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example3',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example4',
    ];

    // Hash the tokens
    const hashedTokens = await Promise.all(
      demoTokens.map(token => bcrypt.hash(token, 12))
    );

    const demoSessions = [
      {
        id: '650e8400-e29b-41d4-a716-446655440000',
        user_id: users[0].id, // Alice
        refresh_token_hash: hashedTokens[0],
        device_info: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36',
        ip_address: '192.168.1.100',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440001',
        user_id: users[1].id, // Bob
        refresh_token_hash: hashedTokens[1],
        device_info: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        ip_address: '192.168.1.101',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440002',
        user_id: users[2].id, // Charlie
        refresh_token_hash: hashedTokens[2],
        device_info: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/14.1.1 Safari/605.1.15',
        ip_address: '192.168.1.102',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Revoked 1 day ago
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440003',
        user_id: users[3].id, // Diana
        refresh_token_hash: hashedTokens[3],
        device_info: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36',
        ip_address: '192.168.1.103',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    // Create sessions using bulkCreate
    const createdSessions = await AuthSession.bulkCreate(demoSessions, {
      validate: true,
      individualHooks: false,
    });

    console.log(`  ✅ Created ${createdSessions.length} auth sessions`);
    return createdSessions;

  } catch (error) {
    console.error('  ❌ Auth session seeding failed:', error);
    throw error;
  }
};

export default AuthSessionSeeder;