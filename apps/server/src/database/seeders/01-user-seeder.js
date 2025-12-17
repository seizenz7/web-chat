/**
 * User Seeder
 * 
 * Creates demo users with realistic data for testing the chat application.
 * Includes various user types and statuses.
 */

import bcrypt from 'bcryptjs';
import { sequelize } from './database.js';
import { User } from '../models/User.js';

export const UserSeeder = async () => {
  try {
    console.log('  Creating users...');

    // Define demo users
    const demoUsers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'alice_wonderland',
        email: 'alice@example.com',
        display_name: 'Alice Wonderland',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
        status: 'online',
        last_seen_at: new Date(),
        is_active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'bob_marley',
        email: 'bob@example.com',
        display_name: 'Bob Marley',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        status: 'online',
        last_seen_at: new Date(Date.now() - 300000), // 5 minutes ago
        is_active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        username: 'charlie_brown',
        email: 'charlie@example.com',
        display_name: 'Charlie Brown',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        status: 'away',
        last_seen_at: new Date(Date.now() - 1800000), // 30 minutes ago
        is_active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        username: 'diana_princess',
        email: 'diana@example.com',
        display_name: 'Princess Diana',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        status: 'busy',
        last_seen_at: new Date(Date.now() - 600000), // 10 minutes ago
        is_active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        username: 'edgar_allan',
        email: 'edgar@example.com',
        display_name: 'Edgar Allan Poe',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        status: 'offline',
        last_seen_at: new Date(Date.now() - 86400000), // 1 day ago
        is_active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        username: 'frida_kahlo',
        email: 'frida@example.com',
        display_name: 'Frida Kahlo',
        avatar_url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150&h=150&fit=crop&crop=face',
        status: 'online',
        last_seen_at: new Date(),
        is_active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        username: 'george_orwell',
        email: 'george@example.com',
        display_name: 'George Orwell',
        avatar_url: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face',
        status: 'offline',
        last_seen_at: new Date(Date.now() - 7200000), // 2 hours ago
        is_active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        username: 'helen_troy',
        email: 'helen@example.com',
        display_name: 'Helen of Troy',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
        status: 'online',
        last_seen_at: new Date(),
        is_active: true,
      },
    ];

    // Hash passwords for demonstration (in real app, users would set their own)
    const hashedPassword = await bcrypt.hash('demo123', 12);
    console.log('    Generated demo password hash');

    const demoUsersWithAuth = demoUsers.map((u) => ({
      ...u,
      password_hash: hashedPassword,
      totp_enabled: false,
      totp_secret_encrypted: null,
    }));

    // Create users using bulkCreate
    const createdUsers = await User.bulkCreate(demoUsersWithAuth, {
      validate: true,
      individualHooks: false, // Disable hooks for bulk insert for performance
    });

    console.log(`  ✅ Created ${createdUsers.length} users`);
    return createdUsers;

  } catch (error) {
    console.error('  ❌ User seeding failed:', error);
    throw error;
  }
};

export default UserSeeder;