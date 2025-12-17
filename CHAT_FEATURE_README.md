# Real-Time Chat Feature - Implementation Guide

This document provides a complete guide to the real-time chat implementation, including setup, usage, and architecture details for beginners and experienced developers.

## Quick Start

### 1. Prerequisites

- Backend running: `yarn workspace @pern/server dev`
- Frontend running: `yarn workspace @pern/client dev`
- PostgreSQL and Redis running via Docker

### 2. Create a Chat Conversation (REST API)

```bash
# Create a direct message with another user
curl -X POST http://localhost:5000/api/conversations/direct \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "other-user-uuid"}'

# Create a group conversation
curl -X POST http://localhost:5000/api/conversations/group \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project Team",
    "participant_ids": ["user1-uuid", "user2-uuid"]
  }'
```

### 3. Send a Message (REST API)

```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conversation-uuid",
    "content_encrypted": "base64-encoded-encrypted-content"
  }'
```

### 4. Real-Time Communication (WebSocket)

```typescript
import { initializeSocket, sendMessage } from './services/socketService';

// Initialize socket connection
const socket = initializeSocket();

// Socket will emit events when connected
socket.on('user:status_changed', (data) => {
  console.log(`User ${data.userId} is ${data.status}`);
});

// Send message and get real-time confirmation
await sendMessage('conversation-uuid', 'encrypted-content');

// Listen for incoming messages
socket.on('chat:message_received', (message) => {
  console.log('New message:', message);
  // Auto-mark as read
  socket.emit('chat:message_read', { messageId: message.id });
});

// Show typing indicator
socket.emit('chat:typing', {
  conversationId: 'conversation-uuid',
  isTyping: true
});
```

## Architecture Overview

### Backend Structure

```
apps/server/src/
├── services/
│   ├── conversationService.ts  - Business logic for conversations
│   ├── messageService.ts       - Business logic for messages
│   ├── socketService.ts        - WebSocket handlers
│   └── queueService.ts         - Bull queue configuration
├── routes/
│   ├── conversations.ts        - REST endpoints for conversations
│   ├── messages.ts             - REST endpoints for messages
│   └── auth.ts                 - Authentication
├── database/
│   ├── models/                 - Sequelize models
│   ├── migrations/             - Database migrations
│   └── seeders/                - Seed data
└── __tests__/
    ├── socketService.test.ts   - WebSocket tests
    └── messageService.test.ts  - Message logic tests
```

### Frontend Structure

```
apps/client/src/
├── stores/
│   ├── chatStore.ts            - Zustand state for chat
│   └── authStore.ts            - Authentication state
├── services/
│   └── socketService.ts        - Socket.io client wrapper
├── components/
│   ├── ConversationList.tsx    - List of conversations
│   ├── ChatWindow.tsx          - Message view and composer
│   └── MessageComposer.tsx     - Message input
└── pages/
    └── ChatPage.tsx            - Main chat page
```

## Key Concepts Explained

### 1. Conversations (1:1 and Group)

A conversation is a container for messages between users.

**Direct Message (1:1):**
```typescript
// Create between two specific users
await createDirectMessage(userId1, userId2, initiatingUserId);

// Type: 'direct'
// Participants: Always exactly 2 users
// Title: Auto-generated or custom
```

**Group Conversation:**
```typescript
// Create with multiple users
await createGroupConversation({
  title: "Development Team",
  participant_ids: ['user1', 'user2', 'user3'],
  created_by: initiatingUserId
});

// Type: 'group'
// Participants: 2 or more users
// Title: Required
// Roles: admin, moderator, member
```

### 2. Messages

Messages are encrypted at rest and transmitted securely.

**Creating a Message:**
```typescript
const message = await sendMessage({
  conversation_id: 'conv-123',
  sender_id: 'user-456',
  content_encrypted: 'base64-encoded-encrypted-content',
  message_type: 'text' // or 'image', 'file', 'voice'
});

// Returns: Message object with initial statuses
```

**Message Encryption:**
- Client encrypts message with recipient's public key
- Stored encrypted in database
- Only recipient can decrypt with their private key
- Even database admins can't read messages

### 3. Message Statuses

Track delivery and read receipts.

```
sent (initial)
    ↓
delivered (recipient received)
    ↓
read (recipient opened)
```

Also supports reactions:
```typescript
await addReactionToMessage(messageId, userId, '😂');
```

### 4. Presence Tracking

Shows who's online/offline.

**Client Side:**
```typescript
// When user opens chat
socket.emit('presence:online');

// When user closes chat or goes offline
socket.emit('presence:offline');
```

**Server Side:**
```typescript
// Broadcasts to all participants
socket.broadcast.to(`conversation:${convId}`).emit('user:status_changed', {
  userId: 'user-123',
  status: 'online',  // or 'offline'
  timestamp: new Date()
});
```

**UI Display:**
```typescript
// Show green dot for online users
const status = useChatStore(state => 
  state.userPresenceById[userId]?.status
);

return <div className={status === 'online' ? 'bg-green' : 'bg-gray'} />;
```

### 5. Typing Indicators

"User is typing..." feature.

**Client Side:**
```typescript
// When user starts typing
sendTypingIndicator(conversationId, true);

// When user stops typing or sends message
sendTypingIndicator(conversationId, false);
```

**Server Side:**
```typescript
socket.on('chat:typing', (data) => {
  // Broadcast to others except sender
  socket.broadcast.to(`conversation:${data.conversationId}`).emit(
    'chat:user_typing',
    {
      userId: socket.userId,
      isTyping: data.isTyping,
      timestamp: new Date()
    }
  );
});
```

**UI Display:**
```typescript
// Show typing users
const typingUsers = useChatStore(state =>
  state.typingUsersInConversation.filter(u => u.isTyping)
);

return (
  <div>
    {typingUsers.map(u => (
      <span key={u.userId}>{u.username} is typing...</span>
    ))}
  </div>
);
```

### 6. Optimistic Updates

Instant UI feedback before server confirmation.

**Pattern:**
```typescript
// 1. Generate temporary ID
const tempId = 'temp-' + Date.now();

// 2. Add message to local state immediately
useChatStore.setState(state => ({
  messagesById: {
    ...state.messagesById,
    [tempId]: {
      id: tempId,
      sender_id: userId,
      content_encrypted: content,
      created_at: new Date()
    }
  }
}));

// 3. Send to server
const response = await sendMessage(conversationId, content);

// 4. Update with real ID when confirmed
if (response.success) {
  useChatStore.setState(state => ({
    // Replace temp ID with real ID
  }));
}
```

**Why?**
- User sees message instantly (feels responsive)
- Server confirms it was saved
- If fails, show error and remove from UI
- Much better UX than waiting for server

### 7. Bull Queues for Reliability

Ensures messages aren't lost if recipient is offline.

**How it works:**
```
User A sends message to User B (who's offline)
        ↓
Message saved to database
        ↓
User B status checked
        ↓
B is offline → Add to Redis queue
        ↓
User B comes online
        ↓
Server fetches queued messages
        ↓
Delivers all queued messages
        ↓
User B receives all messages instantly
```

**Configuration:**
```typescript
export const messageDeliveryQueue = new Queue('message_delivery', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

messageDeliveryQueue.add(job, {
  attempts: 3,           // Retry 3 times
  backoff: {
    type: 'exponential',
    delay: 2000           // Start with 2 second delay
  }
});
```

## API Reference

### REST Endpoints

#### Conversations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/conversations/direct` | Create 1:1 chat |
| POST | `/api/conversations/group` | Create group chat |
| GET | `/api/conversations` | List user's conversations |
| GET | `/api/conversations/:id` | Get conversation details |
| POST | `/api/conversations/:id/participants` | Add user to group |
| DELETE | `/api/conversations/:id/participants/:userId` | Remove user from group |

#### Messages

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/messages/:conversationId` | Get message history |
| POST | `/api/messages` | Send message |
| PATCH | `/api/messages/:messageId` | Edit message |
| DELETE | `/api/messages/:messageId` | Delete message |
| POST | `/api/messages/:messageId/status` | Mark as delivered/read |
| POST | `/api/messages/:messageId/reactions` | Add reaction emoji |

### WebSocket Events

#### Client → Server (Emit)

| Event | Data | Purpose |
|-------|------|---------|
| `presence:online` | - | User comes online |
| `presence:offline` | - | User goes offline |
| `chat:message_send` | `{ conversationId, contentEncrypted }` | Send message |
| `chat:message_delivered` | `{ messageId }` | Mark delivered |
| `chat:message_read` | `{ messageId }` | Mark read |
| `chat:typing` | `{ conversationId, isTyping }` | Typing indicator |

#### Server → Client (Listen)

| Event | Data | Purpose |
|-------|------|---------|
| `user:status_changed` | `{ userId, status, timestamp }` | User online/offline |
| `chat:message_received` | `{ id, sender_id, content_encrypted, ... }` | New message |
| `chat:message_status_updated` | `{ messageId, status, ... }` | Delivery/read status |
| `chat:user_typing` | `{ userId, username, isTyping, timestamp }` | Typing indicator |

## State Management (Zustand)

### Store Structure

```typescript
interface ChatState {
  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;
  
  // Messages (normalized for efficiency)
  messagesById: Record<string, Message>;
  messageIdsInConversation: string[];
  
  // Status
  messageStatusesById: Record<string, MessageStatus[]>;
  
  // Presence
  userPresenceById: Record<string, UserPresence>;
  
  // Typing
  typingUsersInConversation: TypingUser[];
  
  // UI state
  optimisticMessageIds: Set<string>;
  isSendingMessage: boolean;
  messageError: string | null;
  
  // Actions
  addMessage: (message) => void;
  updateMessageStatus: (messageId, status) => void;
  setUserOnline: (userId) => void;
  // ... etc
}
```

### Using the Store

```typescript
// Get state
const messages = useChatStore(state => 
  state.messageIdsInConversation.map(id => state.messagesById[id])
);

// Subscribe to changes
const unsubscribe = useChatStore.subscribe(
  state => state.isSendingMessage,
  (isSending) => console.log('Sending:', isSending)
);

// Update state
useChatStore.setState({ currentConversationId: 'conv-123' });

// Use in component
function ChatWindow() {
  const messages = useChatStore(selectCurrentConversationMessages);
  const typing = useChatStore(state => state.typingUsersInConversation);
  
  return (
    <div>
      {messages.map(m => <Message key={m.id} message={m} />)}
      {typing.length > 0 && <TypingIndicator users={typing} />}
    </div>
  );
}
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ValidationError` | Missing/invalid fields | Check input data |
| `NotFoundError` | Resource doesn't exist | Verify ID is correct |
| `ForbiddenError` | No permission | User not a participant |
| `ConflictError` | Duplicate resource | Conversation already exists |

### Handling in Code

```typescript
try {
  await sendMessage(conversationId, content);
} catch (error) {
  if (error instanceof ValidationError) {
    // Show validation error to user
    showNotification('Invalid message');
  } else if (error instanceof ForbiddenError) {
    // User not in conversation
    showNotification('You cannot send messages in this conversation');
  } else {
    // Unknown error
    showNotification('Failed to send message');
  }
}
```

## Offline Support

### How It Works

1. **While Online:**
   - Messages sent immediately via Socket.io
   - Real-time updates received
   - Stored in local Zustand cache

2. **Going Offline:**
   - Socket.io detects disconnect
   - Emit `presence:offline` event
   - Messages added to offline queue
   - UI shows offline badge

3. **While Offline:**
   - User types in message input
   - Click "Send" → saved to localStorage
   - Show "Pending delivery" status
   - UI allows composing but blocks submission

4. **Coming Back Online:**
   - Socket.io reconnects automatically
   - Server fetches queued messages for user
   - Emit `presence:online` event
   - Deliver all queued messages
   - Update UI with missing messages

### Implementation

```typescript
// Monitor connection status
socket.on('disconnect', () => {
  useChatStore.setState({ isOnline: false });
});

socket.on('reconnect', () => {
  useChatStore.setState({ isOnline: true });
  // Fetch missed messages
  fetchNewMessages();
  // Send queued messages
  sendQueuedMessages();
});

// UI feedback
function MessageComposer() {
  const isOnline = useChatStore(state => state.isOnline);
  
  return (
    <form>
      <input placeholder="Message..." />
      <button disabled={!isOnline}>
        {isOnline ? 'Send' : 'Offline'}
      </button>
    </form>
  );
}
```

## Testing

### Running Tests

```bash
# Backend tests
yarn workspace @pern/server test

# Frontend tests (when added)
yarn workspace @pern/client test
```

### Writing Tests

**Backend Test Example:**
```typescript
describe('sendMessage', () => {
  test('should successfully send a message', async () => {
    const message = await sendMessage({
      conversation_id: 'conv-123',
      sender_id: 'user-456',
      content_encrypted: 'content'
    });
    
    expect(message.id).toBeDefined();
    expect(message.sender_id).toBe('user-456');
  });
  
  test('should reject if user is not a participant', async () => {
    await expect(sendMessage({
      conversation_id: 'conv-123',
      sender_id: 'random-user',
      content_encrypted: 'content'
    })).rejects.toThrow(ForbiddenError);
  });
});
```

## Performance Considerations

### 1. Message Pagination

Fetch 50 messages at a time to avoid loading huge histories:
```typescript
GET /api/messages/conv-123?limit=50&offset=0
```

### 2. Connection Pooling

PostgreSQL connection pool prevents exhaustion:
```typescript
sequelize = new Sequelize(url, {
  pool: {
    max: 5,      // Max connections
    min: 2,      // Min connections
    acquire: 30000,
    idle: 10000
  }
});
```

### 3. Indexing

Fast lookups with proper indexes:
```sql
-- Messages in conversation
CREATE INDEX idx_messages_conversation_created_at 
ON messages(conversation_id, created_at DESC);

-- Find user's conversations
CREATE INDEX idx_participants_user_conversation 
ON conversation_participants(user_id, conversation_id);
```

### 4. Caching

Redis caches frequently accessed data:
```typescript
// Cache conversation list
await redis.set(`user:${userId}:conversations`, JSON.stringify(convs), 'EX', 3600);

// Cache online status
await redis.set(`user:${userId}:presence`, 'online', 'EX', 86400);
```

## Troubleshooting

### Socket Connection Fails

**Problem:** "Connection refused"

**Solutions:**
1. Check backend is running: `yarn workspace @pern/server dev`
2. Check auth token is valid
3. Check CORS configuration
4. Check Socket.io port (default 5000)

### Messages Not Sending

**Problem:** Send button does nothing

**Solutions:**
1. Check Socket.io is connected
2. Check user is a conversation participant
3. Check message content isn't empty
4. Check browser console for errors

### Presence Not Updating

**Problem:** Can't see online status

**Solutions:**
1. Check `presence:online` event is emitted on load
2. Check other user's socket is connected
3. Check no errors in server logs
4. Try refreshing page

### Performance Issues

**Problem:** Chat is slow

**Solutions:**
1. Check message pagination (limit results)
2. Check database indexes are created
3. Check Redis is running
4. Check network latency with browser devtools

## Next Steps

1. **Build UI Components**: Create React components for chat UI
2. **Add File Uploads**: Support image/file sharing
3. **Voice Messages**: Record and send audio
4. **Encryption**: Implement E2E encryption
5. **Search**: Full-text search of messages
6. **Notifications**: Push notifications for new messages
7. **Calls**: Video/audio calling

## Additional Resources

- `CHAT_ARCHITECTURE.md` - Deep dive into architecture
- Database schema docs in `apps/server/src/database/CHAT_SCHEMA_DOCUMENTATION.md`
- API examples in route files (`apps/server/src/routes/conversations.ts`, etc.)
- Socket.io docs: https://socket.io/docs/
- Zustand docs: https://github.com/pmndrs/zustand
- Bull queue docs: https://github.com/OptimalBits/bull

## Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the architecture documentation
3. Check error messages in browser/server console
4. Review the test files for usage examples
