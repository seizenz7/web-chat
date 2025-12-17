/**
 * Database Demo Script
 * 
 * This script demonstrates the chat database functionality.
 * Run it after setting up the database with migrations and seeds.
 */

import { initializeChatDatabase } from './integration';
import { config } from '../../config';

const demo = async () => {
  try {
    console.log('🎯 Chat Database Demo');
    console.log('====================');

    // Initialize database
    const { sequelize, models } = await initializeChatDatabase();
    console.log('✅ Database initialized\n');

    // Demo 1: Get user with relationships
    console.log('📋 Demo 1: User with relationships');
    console.log('----------------------------------');
    const user = await models.User.findOne({
      where: { username: 'alice_wonderland' },
      include: [
        { model: models.AuthSession, as: 'authSessions' },
        { model: models.UserPublicKey, as: 'publicKeys' },
        { model: models.ConversationParticipant, as: 'conversationParticipants' },
      ],
    });

    if (user) {
      console.log(`👤 User: ${user.display_name} (@${user.username})`);
      console.log(`🔑 Public Keys: ${user.publicKeys?.length || 0}`);
      console.log(`💬 Active Conversations: ${user.conversationParticipants?.filter(p => p.is_active).length || 0}`);
      console.log(`🔐 Active Sessions: ${user.authSessions?.filter(s => s.isValid()).length || 0}`);
    }
    console.log('');

    // Demo 2: Get conversation with messages
    console.log('📋 Demo 2: Conversation with messages');
    console.log('-------------------------------------');
    const conversation = await models.Conversation.findOne({
      where: { type: 'group' },
      include: [
        { model: models.Message, as: 'messages', limit: 5, order: [['created_at', 'DESC']] },
        { model: models.ConversationParticipant, as: 'participants' },
      ],
    });

    if (conversation) {
      console.log(`💬 Conversation: ${conversation.title} (${conversation.type})`);
      console.log(`👥 Participants: ${conversation.participants?.length || 0}`);
      console.log(`📨 Recent Messages: ${conversation.messages?.length || 0}`);
      
      if (conversation.messages && conversation.messages.length > 0) {
        const latestMessage = conversation.messages[0];
        console.log(`🕒 Latest Message: ${latestMessage.created_at}`);
        console.log(`📝 Type: ${latestMessage.message_type}`);
      }
    }
    console.log('');

    // Demo 3: Message status tracking
    console.log('📋 Demo 3: Message status tracking');
    console.log('----------------------------------');
    const messageStatus = await models.MessageStatus.findAll({
      limit: 10,
      include: [
        { model: models.User, as: 'user' },
        { model: models.Message, as: 'message' },
      ],
    });

    console.log(`📊 Total Message Status Events: ${messageStatus.length}`);
    const statusBreakdown = messageStatus.reduce((acc, status) => {
      acc[status.status] = (acc[status.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log('');

    // Demo 4: Database statistics
    console.log('📋 Demo 4: Database statistics');
    console.log('------------------------------');
    const stats = await sequelize.getQueryInterface().describeTable('users');
    console.log('👥 Users table columns:', Object.keys(stats).length);
    
    const conversationStats = await sequelize.getQueryInterface().describeTable('conversations');
    console.log('💬 Conversations table columns:', Object.keys(conversationStats).length);
    
    const messageStats = await sequelize.getQueryInterface().describeTable('messages');
    console.log('📨 Messages table columns:', Object.keys(messageStats).length);
    console.log('');

    // Demo 5: Security audit log
    console.log('📋 Demo 5: Security audit log');
    console.log('-----------------------------');
    const auditLogs = await models.AuditLog.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
    });

    console.log(`📋 Recent audit entries: ${auditLogs.length}`);
    auditLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} (${log.severity}) - ${log.created_at}`);
    });
    console.log('');

    console.log('🎉 Demo completed successfully!');
    console.log('\n💡 To explore more:');
    console.log('   - Check the database directly: psql $DATABASE_URL');
    console.log('   - Run migrations: npm run db:migrate');
    console.log('   - Seed demo data: npm run seed');
    console.log('   - View documentation: src/database/CHAT_SCHEMA_DOCUMENTATION.md');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure PostgreSQL is running');
    console.log('   2. Check DATABASE_URL environment variable');
    console.log('   3. Run migrations: npm run db:migrate');
    console.log('   4. Seed demo data: npm run seed');
  }
};

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo()
    .then(() => {
      console.log('\n✅ Demo completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

export default demo;