# Chat Application Database Schema

This document describes the complete Sequelize database schema for the chat application, including migrations, seed data, and integration with the existing PERN stack.

## 📋 Table of Contents

- [Schema Overview](#schema-overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Setup Instructions](#setup-instructions)
- [Database Commands](#database-commands)
- [Security Considerations](#security-considerations)
- [Scalability Considerations](#scalability-considerations)
- [Integration with Existing System](#integration-with-existing-system)

## 📊 Schema Overview

The chat schema consists of 9 interconnected tables that support:

- **User Management**: Authentication, sessions, and public keys
- **Conversations**: 1:1 direct messages and group chats
- **Messaging**: Encrypted message content with metadata
- **Status Tracking**: Delivery, read receipts, and reactions
- **File Attachments**: Metadata for files stored externally
- **Audit Trail**: Security and compliance logging

### Core Entities

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User identities | PII storage, presence status |
| `auth_sessions` | Refresh token management | Hashed tokens, device tracking |
| `user_public_keys` | E2E encryption keys | Key rotation support |
| `conversations` | Chat conversations | Group/DM types, settings |
| `conversation_participants` | User-conversation links | Roles, key material |
| `messages` | Chat messages | Encrypted content, threading |
| `message_statuses` | Delivery tracking | Read receipts, reactions |
| `attachments` | File metadata | External storage, hashing |
| `audit_logs` | Security audit trail | Compliance tracking |

## 🔗 Entity Relationship Diagram

```
users ────┬─────────────────────┬──────────────────┬────────────────┐
          │                     │                  │                │
   auth_sessions            user_public_keys    conversations    audit_logs
          │                     │                  │                │
          └─────┬───────────────┘                  │                │
                │                                  │                │
         conversation_participants              messages          │
                │                                  │                │
                └─────────┬───────────────┬────────┘                │
                          │               │                          │
                    message_status    attachments                   │
                          │                                           │
                          └───────────────────────────────────────────┘
```

### Relationship Types

- **1:Many**: User → Messages, Conversations → Messages
- **Many:Many**: Users ↔ Conversations (via conversation_participants)
- **Self-Reference**: Messages → Messages (reply threading)
- **1:1**: Message → Attachment (optional)

## 🚀 Setup Instructions

### Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL is running
2. **Environment Variables**: Set up database connection
3. **Dependencies**: Install required packages

### Database Configuration

Set up environment variables in `/home/engine/project/apps/server/.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pern_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pern_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Optional: SSL for production
DB_SSL=false
```

### Installation Steps

1. **Install Dependencies**:
   ```bash
   cd /home/engine/project/apps/server
   npm install
   ```

2. **Run Migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Seed Database** (optional, for demo data):
   ```bash
   npm run seed
   ```

## 💾 Database Commands

### Migration Commands

```bash
# Run pending migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Undo all migrations (dangerous!)
npm run db:migrate:undo:all

# Reset database (drop all tables and recreate)
npm run db:reset
```

### Seeding Commands

```bash
# Run all seeders
npm run seed

# Or using sequelize-cli
npm run db:seed

# Undo all seeders
npm run db:seed:undo

# Run specific seeder
npx sequelize-cli db:seed --seed 01-user-seeder.js
```

### Manual Database Operations

```bash
# Generate a new migration
npx sequelize-cli migration:generate --name add-new-field

# Generate a new seeder
npx sequelize-cli seed:generate --name demo-users

# Run specific migration
npx sequelize-cli db:migrate --to 20241217000001-create-users-table.js
```

## 🔒 Security Considerations

### 1. Data Encryption

- **Message Content**: Encrypted at application level before storage
- **File Attachments**: Can be encrypted depending on configuration
- **Refresh Tokens**: Hashed using bcrypt (cost factor: 12)
- **Key Material**: Encrypted per user per conversation

### 2. Access Control

- **User Isolation**: Users can only access their own conversations
- **Role-Based Permissions**: Admin, Moderator, Member roles
- **Session Management**: Device tracking and session revocation
- **Audit Trail**: All sensitive operations are logged

### 3. Data Privacy

- **PII Protection**: Sensitive data should be encrypted at rest
- **Data Retention**: Configurable message retention policies
- **Soft Deletes**: Messages preserved for conversation integrity
- **IP Tracking**: All actions logged with IP and user agent

### 4. Compliance Considerations

- **GDPR Compliance**: User data export/deletion capabilities
- **Data Retention**: Automated cleanup of old messages
- **Audit Logs**: Non-editable trail for security incidents
- **Access Logging**: Comprehensive activity tracking

## 📈 Scalability Considerations

### 1. Database Optimization

#### Indexing Strategy
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_messages_conversation_created_at 
ON messages (conversation_id, created_at) WHERE is_deleted = false;

CREATE INDEX CONCURRENTLY idx_message_statuses_user_status_time 
ON message_statuses (user_id, status, created_at);
```

#### Query Optimization
- **Pagination**: Always use cursor-based pagination on large tables
- **Read Replicas**: Use for message queries, write master for all operations
- **Connection Pooling**: Sequelize configured with optimal pool settings

### 2. Partitioning Strategy

#### Messages Table Partitioning
```sql
-- Partition by conversation_id for large datasets
CREATE TABLE messages_2024 PARTITION OF messages
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Or by date for time-based queries
CREATE TABLE messages_y2024m12 PARTITION OF messages
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

#### Message Status Partitioning
```sql
-- Partition message statuses by month for retention
CREATE TABLE message_statuses_2024_12 PARTITION OF message_statuses
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

### 3. Caching Strategy

#### Redis Caching
- **User Sessions**: Cache authentication status
- **Conversation Lists**: Cache user conversation summaries
- **Message Caches**: Cache recent messages per conversation
- **Presence Status**: Cache online/offline status

### 4. Performance Monitoring

#### Key Metrics to Track
- Query execution times
- Index usage statistics
- Connection pool utilization
- Cache hit rates

#### Monitoring Queries
```sql
-- Slow query analysis
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Index usage
SELECT relname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 5. Scaling Patterns

#### Horizontal Scaling
- **Read Replicas**: Multiple read-only databases for message queries
- **Sharding**: Partition by user_id or conversation_id
- **Microservices**: Split into auth, messaging, and notification services

#### Vertical Scaling
- **Connection Pooling**: Optimize database connections
- **Query Optimization**: Regular performance tuning
- **Hardware Optimization**: SSD storage, more RAM

## 🔗 Integration with Existing System

### 1. Express Server Integration

#### Update `/home/engine/project/apps/server/src/index.ts`:
```typescript
// Add database initialization
import { initializeDatabase, initializeModels } from './database/init';

// Initialize database before starting server
const startServer = async () => {
  try {
    // Initialize database connection
    const sequelize = await initializeDatabase();
    
    // Initialize all models and associations
    initializeModels();
    
    console.log('✅ Database initialized successfully');
    
    // Start Express server
    const httpServer = createServer(app);
    // ... rest of server startup
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

### 2. Middleware Integration

#### Authentication Middleware:
```typescript
import jwt from 'jsonwebtoken';
import { config } from './config';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, config.secrets.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};
```

#### Audit Logging Middleware:
```typescript
import { AuditLog } from './database/models/AuditLog';

export const auditLog = (action: string, resourceType: string) => {
  return async (req: any, res: any, next: any) => {
    // Log the action after successful request
    res.on('finish', () => {
      if (res.statusCode < 400) {
        AuditLog.create({
          user_id: req.user?.id,
          action,
          resource_type: resourceType,
          resource_id: req.params.id,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          severity: 'info',
        });
      }
    });
    next();
  };
};
```

### 3. Socket.io Integration

#### Message Broadcasting:
```typescript
import { initializeSocket } from './services/socketService';
import { Message } from './database/models/Message';

io.on('connection', (socket) => {
  socket.on('send_message', async (data) => {
    try {
      // Save message to database
      const message = await Message.create({
        conversation_id: data.conversationId,
        sender_id: data.senderId,
        content_encrypted: data.encryptedContent,
        message_type: data.type,
      });

      // Broadcast to conversation participants
      socket.to(data.conversationId).emit('new_message', {
        id: message.id,
        content: data.encryptedContent,
        sender_id: data.senderId,
        created_at: message.created_at,
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
});
```

### 4. Queue System Integration

#### Message Processing Queue:
```typescript
import Queue from 'bull';
import { MessageStatus } from './database/models/MessageStatus';

const messageQueue = new Queue('message processing', {
  redis: config.redis,
});

// Process message delivery
messageQueue.process('delivery', async (job) => {
  const { messageId, userId, status } = job.data;
  
  await MessageStatus.upsert({
    message_id: messageId,
    user_id: userId,
    status: status,
    delivered_at: status === 'delivered' ? new Date() : null,
    read_at: status === 'read' ? new Date() : null,
  });
});

// Add delivery job
await messageQueue.add('delivery', {
  messageId: 'msg-123',
  userId: 'user-456',
  status: 'delivered',
});
```

## 🧪 Testing the Schema

### 1. Verify Database Setup

```bash
# Connect to database
psql $DATABASE_URL

# Check tables exist
\dt

# Verify indexes
\di

# Check sample data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM messages;
```

### 2. Test Model Associations

```typescript
// Test user relationships
const user = await User.findByPk('user-id', {
  include: [
    { model: AuthSession, as: 'authSessions' },
    { model: UserPublicKey, as: 'publicKeys' },
    { model: ConversationParticipant, as: 'conversationParticipants' },
  ],
});

// Test conversation relationships
const conversation = await Conversation.findByPk('conversation-id', {
  include: [
    { model: Message, as: 'messages' },
    { model: ConversationParticipant, as: 'participants' },
  ],
});
```

### 3. Performance Testing

```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM messages 
WHERE conversation_id = 'conv-123' 
ORDER BY created_at DESC 
LIMIT 50;

-- Test index usage
EXPLAIN ANALYZE SELECT * FROM users 
WHERE username = 'alice';
```

## 📝 Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| 20241217000001 | 2024-12-17 | Create users table |
| 20241217000002 | 2024-12-17 | Create auth_sessions table |
| 20241217000003 | 2024-12-17 | Create user_public_keys table |
| 20241217000004 | 2024-12-17 | Create conversations table |
| 20241217000005 | 2024-12-17 | Create conversation_participants table |
| 20241217000006 | 2024-12-17 | Create messages table |
| 20241217000007 | 2024-12-17 | Create message_statuses table |
| 20241217000008 | 2024-12-17 | Create attachments table |
| 20241217000009 | 2024-12-17 | Create audit_logs table |

## 🐛 Troubleshooting

### Common Issues

1. **Migration Failures**:
   ```bash
   # Check migration status
   npx sequelize-cli db:migrate:status
   
   # Undo failed migration
   npx sequelize-cli db:migrate:undo
   ```

2. **Connection Issues**:
   ```bash
   # Test database connection
   npx sequelize-cli db:migrate:status
   ```

3. **Permission Errors**:
   ```bash
   # Check database user permissions
   psql -c "\\du"
   ```

### Performance Issues

1. **Slow Queries**:
   - Check for missing indexes
   - Use `EXPLAIN ANALYZE` to identify bottlenecks
   - Consider query optimization

2. **Connection Pool Exhaustion**:
   - Increase pool size in configuration
   - Check for connection leaks
   - Monitor connection usage

## 🔄 Future Enhancements

### Planned Features

1. **Message Reactions**: Enhanced emoji reactions
2. **Voice Messages**: Audio message support
3. **Message Search**: Full-text search capabilities
4. **Push Notifications**: Integration with notification services
5. **File Sharing**: Enhanced file upload and sharing
6. **Message Threading**: Reply-to-thread functionality

### Schema Evolution

- **Versioned Migrations**: Support schema version upgrades
- **Data Migration Tools**: Automated data transformation
- **Backup Strategies**: Automated database backups
- **Monitoring Dashboards**: Real-time database health monitoring

## 📚 Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Database Security Best Practices](https://owasp.org/www-project-cheat-sheets/cheatsheets/Authentication_Cheat_Sheet.html)
- [Real-time Messaging Patterns](https://www.patterns.dev/posts/websocket/)

---

**Note**: This schema is designed for a production-ready chat application with proper security, scalability, and compliance considerations. Always test thoroughly in a staging environment before deploying to production.