/**
 * Main Database Seed Script
 * 
 * This script runs all seeders to populate the database with demo data.
 * Run with: npm run seed
 */

import { sequelize } from './seeders/database.js';
import { UserSeeder } from './seeders/01-user-seeder.js';
import { AuthSessionSeeder } from './seeders/02-auth-session-seeder.js';
import { UserPublicKeySeeder } from './seeders/03-user-public-key-seeder.js';
import { ConversationSeeder } from './seeders/04-conversation-seeder.js';
import { ConversationParticipantSeeder } from './seeders/05-conversation-participant-seeder.js';
import { MessageSeeder } from './seeders/06-message-seeder.js';
import { MessageStatusSeeder } from './seeders/07-message-status-seeder.js';
import { AttachmentSeeder } from './seeders/08-attachment-seeder.js';
import { AuditLogSeeder } from './seeders/09-audit-log-seeder.js';

/**
 * Run all seeders in the correct order to maintain referential integrity
 * Each seeder should be designed to run independently as well
 */
const runSeeders = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Run seeders in dependency order
    console.log('👥 Creating users...');
    const users = await UserSeeder();
    
    console.log('🔐 Creating auth sessions...');
    const authSessions = await AuthSessionSeeder(users);
    
    console.log('🔑 Creating public keys...');
    const publicKeys = await UserPublicKeySeeder(users);
    
    console.log('💬 Creating conversations...');
    const conversations = await ConversationSeeder(users);
    
    console.log('👥 Creating conversation participants...');
    const participants = await ConversationParticipantSeeder(users, conversations);
    
    console.log('📨 Creating messages...');
    const messages = await MessageSeeder(users, conversations);
    
    console.log('✅ Creating message statuses...');
    const messageStatuses = await MessageStatusSeeder(users, messages);
    
    console.log('📎 Creating attachments...');
    const attachments = await AttachmentSeeder(messages);
    
    console.log('📋 Creating audit logs...');
    const auditLogs = await AuditLogSeeder(users, conversations, messages);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`
📊 Seeding Summary:
   👥 Users: ${users.length}
   🔐 Auth Sessions: ${authSessions.length}
   🔑 Public Keys: ${publicKeys.length}
   💬 Conversations: ${conversations.length}
   👥 Participants: ${participants.length}
   📨 Messages: ${messages.length}
   ✅ Message Statuses: ${messageStatuses.length}
   📎 Attachments: ${attachments.length}
   📋 Audit Logs: ${auditLogs.length}
    `);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeders()
    .then(() => {
      console.log('✅ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export default runSeeders;