/**
 * Database Integration Script
 * 
 * This script integrates the chat schema with the existing Express server.
 * It should be called during server startup to ensure database connectivity.
 */

import { initializeDatabase } from './init';
import { initializeModels } from './models/associations';

/**
 * Complete database initialization for the Express server
 * This function should be called in your server startup sequence
 */
export const initializeChatDatabase = async () => {
  try {
    console.log('🚀 Initializing chat database...');

    // Initialize Sequelize connection
    const sequelize = await initializeDatabase();
    console.log('✅ Database connection established');

    // Initialize all models and define associations
    const models = initializeModels();
    console.log('✅ Database models and associations initialized');

    // Verify database structure
    await verifyDatabaseStructure(sequelize);
    console.log('✅ Database structure verified');

    return {
      sequelize,
      models,
      isReady: true,
    };
  } catch (error) {
    console.error('❌ Failed to initialize chat database:', error);
    throw error;
  }
};

/**
 * Verify that all expected tables exist in the database
 */
const verifyDatabaseStructure = async (sequelize: any) => {
  const expectedTables = [
    'users',
    'auth_sessions',
    'user_public_keys',
    'conversations',
    'conversation_participants',
    'messages',
    'message_statuses',
    'attachments',
    'audit_logs',
  ];

  const [results] = await sequelize.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  `);

  const existingTables = (results as any[]).map(row => row.table_name);
  
  const missingTables = expectedTables.filter(table => !existingTables.includes(table));
  
  if (missingTables.length > 0) {
    throw new Error(`Missing database tables: ${missingTables.join(', ')}. Run migrations first.`);
  }

  console.log(`✅ All ${expectedTables.length} expected tables exist`);
};

/**
 * Health check function for database connectivity
 */
export const checkDatabaseHealth = async (sequelize: any) => {
  try {
    await sequelize.authenticate();
    
    // Get basic stats
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [conversationCount] = await sequelize.query('SELECT COUNT(*) as count FROM conversations');
    const [messageCount] = await sequelize.query('SELECT COUNT(*) as count FROM messages');
    
    return {
      status: 'healthy',
      connected: true,
      stats: {
        users: (userCount as any[])[0]?.count || 0,
        conversations: (conversationCount as any[])[0]?.count || 0,
        messages: (messageCount as any[])[0]?.count || 0,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Utility function to get database statistics for monitoring
 */
export const getDatabaseStats = async (sequelize: any) => {
  try {
    const queries = {
      users: 'SELECT COUNT(*) as count FROM users',
      conversations: 'SELECT COUNT(*) as count FROM conversations',
      messages: 'SELECT COUNT(*) as count FROM messages',
      activeSessions: 'SELECT COUNT(*) as count FROM auth_sessions WHERE revoked_at IS NULL AND expires_at > NOW()',
      unreadMessages: `
        SELECT COUNT(*) as count 
        FROM message_statuses 
        WHERE status = 'sent'
      `,
      recentMessages: `
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `,
    };

    const results = await Promise.all(
      Object.entries(queries).map(async ([key, query]) => {
        try {
          const [result] = await sequelize.query(query);
          return { [key]: (result as any[])[0]?.count || 0 };
        } catch (error) {
          return { [key]: 0 };
        }
      })
    );

    return Object.assign({}, ...results);
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
};

/**
 * Graceful database shutdown
 */
export const shutdownDatabase = async (sequelize: any) => {
  try {
    await sequelize.close();
    console.log('🔌 Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

export default initializeChatDatabase;