# Real-Time Chat Architecture Guide

This document explains the architecture of the real-time chat system implemented in this project, with focus on beginner-friendly explanations and architectural patterns.

## Table of Contents

1. [Overview](#overview)
2. [HTTP vs WebSocket](#http-vs-websocket)
3. [Message Flow Architecture](#message-flow-architecture)
4. [System Components](#system-components)
5. [Database Design](#database-design)
6. [API Reference](#api-reference)
7. [WebSocket Events](#websocket-events)
8. [State Management](#state-management)
9. [Error Handling & Resilience](#error-handling--resilience)

## Overview

The chat system is built on a **distributed architecture** with the following layers:

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React + Zustand)             │
│  ┌──────────────────────────────────────────────┐  │
│  │ Chat Components (ConversationList, ChatWindow) │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Socket.io Client (Real-time events)         │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Zustand Store (State management)            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           ↓ HTTP + WebSocket ↓
┌─────────────────────────────────────────────────────┐
│           Backend (Express + Node.js)               │
│  ┌──────────────────────────────────────────────┐  │
│  │ REST Routes (Conversations, Messages)        │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Socket.io Server (Real-time handler)        │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Business Services (conversationService, etc) │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Bull Queues (Message delivery, offline buff)│  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           ↓ Transactions ↓
┌─────────────────────────────────────────────────────┐
│    PostgreSQL Database + Redis Cache               │
│  ┌──────────────────────────────────────────────┐  │
│  │ Tables: users, conversations, messages,      │  │
│  │         message_statuses, etc.               │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Redis: Queues, Sessions, Caching            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## HTTP vs WebSocket

### HTTP Protocol (Request-Response Model)

**How it works:**
```
Client                           Server
  |                                |
  |--1. Send Request "GET /data"-->|
  |                          (wait for request)
  |<-2. Send Response with data----|
  |                              (done)
```

**Characteristics:**
- ✅ **Stateless**: Server doesn't remember past requests
- ✅ **Simple**: Built into all browsers, easy to implement
- ✅ **Reliable**: Every request gets a response (or timeout)
- ❌ **Latency**: Round-trip takes 100-500ms
- ❌ **Overhead**: Headers sent with every request
- ❌ **One-way**: Client must initiate, server only responds

**Use cases:**
- Fetching static data
- Creating/updating records
- File uploads
- Traditional form submissions
- When occasional updates are fine

**Example:**
```typescript
// REST API call
const response = await fetch('/api/messages', {
  method: 'POST',
  body: JSON.stringify({ content: 'Hello' })
});
// Total time: ~200ms from click to update
```

### WebSocket Protocol (Bidirectional Persistent Connection)

**How it works:**
```
Client                           Server
  |                                |
  |--1. Establish connection------->|
  |                            (connection open)
  |<-2. Connected------------------|
  |                                |
  |--3. Send "user_typing"-------->|
  |                        (process event)
  |<-4. Broadcast to others--------|
  |                                |
  |--5. Send "message"------------>|
  |                        (save to DB)
  |<-6. Broadcast to all-----------|
  |                                |
  | (connection stays open, fast two-way communication)
```

**Characteristics:**
- ✅ **Real-time**: 10-50ms latency
- ✅ **Bidirectional**: Server can send without request
- ✅ **Efficient**: Single connection, no header overhead per message
- ✅ **Interactive**: Perfect for collaboration, presence, typing
- ❌ **Stateful**: Server must maintain connection state
- ❌ **More complex**: Requires handling reconnection, heartbeat

**Use cases:**
- Chat messages
- Presence (online/offline)
- Typing indicators
- Notifications
- Real-time collaboration
- Live dashboards

**Example:**
```typescript
// WebSocket communication
socket.emit('chat:message_send', { content: 'Hello' }, (response) => {
  // Callback called immediately (~50ms) with acknowledgment
});

// Server can emit to us anytime
socket.on('chat:message_received', (message) => {
  // Instant notification without polling
});
```

### Comparison Table

| Aspect | HTTP | WebSocket |
|--------|------|-----------|
| Latency | 100-500ms | 10-50ms |
| Connection | New for each request | Persistent |
| Direction | Client → Server only | Bidirectional |
| Overhead | High (headers) | Low |
| Use Case | Data persistence | Real-time updates |
| Complexity | Simple | More complex |
| Server Load | High (many connections) | Medium (persistent) |

### Hybrid Approach (Used in This Project)

We use **both** protocols strategically:

1. **REST for critical operations**: 
   - Creating conversations (saved immediately)
   - Sending messages (persisted reliably)
   - Fetching history (full data)

2. **WebSocket for real-time features**:
   - Typing indicators (fast broadcast)
   - Presence updates (instant notification)
   - Message notifications (immediate delivery)
   - Status changes (read/delivered receipts)

**Why both?**
- HTTP ensures data is persisted (survives disconnects)
- WebSocket ensures users see updates instantly
- Together they provide **reliable AND responsive** experience

## Message Flow Architecture

### Scenario 1: Sending a Message (Complete Flow)

```
User A Interface                    Server                      User B Interface
        |                             |                                |
        |                             |                                |
    1. User types "Hello"             |                                |
    2. Click Send                     |                                |
        |                             |                                |
        |--- HTTP POST /messages ---->|                                |
        |   (message data)            |                                |
        |                    3. Validate permission                    |
        |                    4. Encrypt if needed                      |
        |                    5. Save to Database:                      |
        |                       - Insert into messages table           |
        |                       - Create message_status records        |
        |                    6. Update conversation's                  |
        |                       last_message_at timestamp              |
        |                             |                                |
        |<--- 201 Created with ID ----|                                |
        |   (messageId: "msg123")      |                                |
        |                             |                                |
    6. Update local state         7. Emit via Socket.io                |
       (show message in list)          |                                |
    7. Show checkmark (sent)           |                                |
       (optimistic update)         8. Broadcast to all in              |
        |                          conversation room:                  |
        |                          `chat:message_received`             |
        |                             |                                |
        |                             |---> Emit to User B's session---|
        |                             |                                |
        |                       9. User B receives event           Receive event
        |                          & stores in local cache         callback(msg)
        |                             |                                |
        |                             |                    Update state
        |                             |                    Add message to list
        |                             |                    Show in real-time
        |                             |                    Auto-mark delivered
        |                             |                                |
        |                             |<--- Socket: delivered ------- |
        |                          (updates DB status)                 |
        |                             |                                |
    8. Emit "delivered" via       10. Broadcast status to all          |
       Socket                         in conversation              11. Show double
    9. Show double checkmark          |                                 checkmark
       (delivery confirmed)           |                                 
        |                             |                                |
```

**Key Points:**
- HTTP POST for initial persistence (reliable)
- Socket.io broadcast for real-time delivery (fast)
- Optimistic updates on client (feel instant)
- Server confirmation via Socket.io (confirm reality)

### Scenario 2: Handling Offline User

```
User A                    Server (Redis + Queue)              User B (Offline)
  |                              |                                  |
  |--POST /messages -->|--Save to DB                                |
  |                   |--Check if User B online?                    |
  |                   |   (not online, add to queue)                |
  |                   |                                              |
  |<--- 201 Created --|                                              |
  |                   |                                              |
  | (Message saved,   |-- Queue Job Waiting --                      |
  |  but User B       |  ("deliver message to B") --                |
  |  is offline)      |                                              |
  |                   |                                              |
  |                   |                          User B reconnects
  |                   |                                  |
  |                   |                          Emit: presence:online
  |                   |                                  |
  |                   |<-- Check offline queue -- |
  |                   |                              |
  |                   |-- Find queued messages --|
  |                   |-- Emit all to User B ---|
  |                   |                          |
  |<-- No notification|                   Receive all queued messages
  |                   |                   Show in UI (they appear!)
  |                   |                          |
```

**Key Points:**
- Messages persisted in DB even if recipient offline
- Queued in Redis for retry
- Auto-delivered when user comes back online
- No message loss

### Scenario 3: Real-Time Typing Indicator

```
User A                           Server                        User B
  |                                |                              |
  |                         (A types in message box)              |
  |-- Socket: chat:typing -------->|                              |
  |   isTyping: true              |                              |
  |                         (broadcast to room)                   |
  |                                |---> Emit user_typing ------> |
  |                                |                              |
  |                                |                    Show "User A is typing..."
  |                                |                              |
  |                         (A continues typing, keep emitting)   |
  |                                |                              |
  |-- Socket: chat:typing -------->|                              |
  |   isTyping: true              |                              |
  |   (after 1 second idle)        |---> Emit user_typing ------> |
  |                                |                    Delay auto-hide
  |                                |                              |
  |                         (A stops typing OR sends message)     |
  |                                |                              |
  |-- Socket: chat:typing -------->|                              |
  |   isTyping: false             |                              |
  |                                |---> Emit user_typing ------> |
  |                                |                              |
  |                                |                    Hide "typing..."
  |                                |                              |
```

**Key Points:**
- Super low latency (10-50ms)
- Not persisted to database (doesn't need to be)
- Only via WebSocket (polling would be inefficient)
- Auto-hides after 3 seconds for UX

## System Components

### Backend Components

#### 1. **conversationService**
Handles conversation business logic:
```typescript
// Create direct message (1:1)
await createDirectMessage(user1Id, user2Id, initiatingUserId);

// Create group chat
await createGroupConversation({
  title: "Project Team",
  participant_ids: [user1, user2, user3],
  created_by: currentUserId
});

// Get conversations for user
const { conversations, total } = await getUserConversations(userId, limit, offset);
```

**Transactions:** All operations use database transactions to ensure consistency
- If adding participants fails, conversation isn't created
- Atomic: all-or-nothing approach

#### 2. **messageService**
Handles message business logic:
```typescript
// Send message
const message = await sendMessage({
  conversation_id: convId,
  sender_id: userId,
  content_encrypted: encryptedContent,
  message_type: 'text'
});

// Update status
await updateMessageStatus(messageId, userId, 'read');

// Add reaction
await addReactionToMessage(messageId, userId, '😂');
```

**Status Tracking:**
- `sent`: Message created by sender
- `delivered`: Recipient received message
- `read`: Recipient viewed message
- Progression is one-way: sent → delivered → read

#### 3. **socketService**
Handles real-time WebSocket events:
```typescript
// Auth handshake
socket.on('connection', async (socket) => {
  await authenticateSocket(socket);  // Verify JWT token
});

// Presence
socket.on('presence:online', async () => { /* ... */ });

// Messages
socket.on('chat:message_send', async (data, callback) => { /* ... */ });

// Typing
socket.on('chat:typing', (data) => { /* ... */ });
```

#### 4. **queueService**
Handles background jobs via Bull + Redis:
```typescript
// Message delivery queue
messageDeliveryQueue.add({ messageId, userId }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});

// Offline message queue
offlineMessageQueue.add({ userId, messages }, {
  attempts: 5
});
```

### Frontend Components

#### 1. **useChatStore (Zustand)**
Normalized state management:
```typescript
const { conversations, messagesById, messageIdsInConversation } = useChatStore();

// Update state
useChatStore.setState(state => ({
  messagesById: { ...state.messagesById, [msgId]: updatedMsg }
}));
```

**Why Normalized?**
- Efficient lookups: O(1) instead of O(n)
- Easy updates: Just update the value
- Prevents duplication

#### 2. **socketService (Frontend)**
Wraps Socket.io client for chat:
```typescript
initializeSocket();  // Connect with auth

sendMessage(conversationId, content);
markMessageRead(messageId);
sendTypingIndicator(conversationId, isTyping);
```

#### 3. **Components**
React components for UI:
- `ConversationList`: Shows all conversations
- `ChatWindow`: Shows messages for current conversation
- `MessageComposer`: Input and send message
- `TypingIndicator`: Shows who's typing
- `PresenceIndicator`: Shows online status

## Database Design

### Tables

#### users
- `id`: UUID primary key
- `username`: Unique username
- `email`: Unique email
- `password_hash`: Bcrypt hashed password
- `display_name`: Display name
- `avatar_url`: Profile picture

#### conversations
- `id`: UUID primary key
- `type`: 'direct' or 'group'
- `title`: Null for DMs, required for groups
- `created_by`: Reference to creator
- `is_active`: Soft delete flag
- `last_message_at`: Denormalized for sorting
- `settings`: JSONB for configuration

#### conversation_participants
- `conversation_id`: Reference to conversation
- `user_id`: Reference to user
- `role`: 'admin', 'moderator', 'member'
- `joined_at`: When user joined
- Composite primary key: (conversation_id, user_id)

#### messages
- `id`: UUID primary key
- `conversation_id`: Reference to conversation
- `sender_id`: Reference to sender
- `content_encrypted`: Base64 encrypted content
- `message_type`: 'text', 'image', 'file', 'system', 'voice'
- `is_deleted`: Soft delete flag
- `is_edited`: Edit flag

#### message_statuses
- `id`: UUID primary key
- `message_id`: Reference to message
- `user_id`: Reference to user
- `status_type`: 'sent', 'delivered', 'read', 'reaction'
- `reaction_emoji`: Optional emoji if reaction

### Indexing Strategy

```sql
-- For fast message lookups in conversation
CREATE INDEX idx_messages_conversation_created_at 
ON messages(conversation_id, created_at DESC);

-- For finding user's conversations
CREATE INDEX idx_participants_user_conversation 
ON conversation_participants(user_id, conversation_id);

-- For status updates
CREATE INDEX idx_message_status_message_user 
ON message_statuses(message_id, user_id);
```

### Encryption

- Messages are encrypted with client's public key
- Stored encrypted in database (encrypted at rest)
- Only decrypted on client with user's private key
- End-to-end encryption: only intended recipient can read

## API Reference

### REST Endpoints

#### Conversations

```
POST /api/conversations/direct
  Request: { "user_id": "uuid" }
  Response: { "id": "...", "type": "direct", "participants": [...] }

POST /api/conversations/group
  Request: { "title": "...", "participant_ids": [...] }
  Response: { "id": "...", "type": "group", ... }

GET /api/conversations
  Query: ?limit=50&offset=0
  Response: { "conversations": [...], "total": 150 }

GET /api/conversations/:conversationId
  Response: { "id": "...", "participants": [...], "last_message": {...} }

POST /api/conversations/:conversationId/participants
  Request: { "user_id": "uuid" }
  Response: { "id": "...", "participants": [...] }

DELETE /api/conversations/:conversationId/participants/:userId
  Response: { "id": "...", "participants": [...] }
```

#### Messages

```
GET /api/messages/:conversationId
  Query: ?limit=50&offset=0
  Response: { "messages": [...], "total": 500 }

POST /api/messages
  Request: { "conversation_id": "...", "content_encrypted": "..." }
  Response: { "id": "...", "sender_id": "...", "created_at": "..." }

PATCH /api/messages/:messageId
  Request: { "content_encrypted": "..." }
  Response: { "id": "...", "is_edited": true, ... }

DELETE /api/messages/:messageId
  Response: { "success": true }

POST /api/messages/:messageId/status
  Request: { "status_type": "delivered|read" }
  Response: { "message_id": "...", "status_type": "delivered" }

POST /api/messages/:messageId/reactions
  Request: { "emoji": "😂" }
  Response: { "message_id": "...", "reaction_emoji": "😂" }
```

## WebSocket Events

### Client → Server (Emit)

```typescript
// Presence
socket.emit('presence:online');          // User comes online
socket.emit('presence:offline');         // User goes offline

// Messages
socket.emit('chat:message_send', 
  { conversationId: "...", contentEncrypted: "..." },
  callback  // Receives { success, messageId }
);

// Status
socket.emit('chat:message_delivered', { messageId: "..." });
socket.emit('chat:message_read', { messageId: "..." });

// Typing
socket.emit('chat:typing', { conversationId: "...", isTyping: true });
```

### Server → Client (On/Listen)

```typescript
// Presence
socket.on('user:status_changed', (data) => {
  // { userId, status: 'online'|'offline', timestamp }
});

// Messages
socket.on('chat:message_received', (message) => {
  // { id, sender_id, content_encrypted, created_at, ... }
});

// Typing
socket.on('chat:user_typing', (data) => {
  // { userId, username, isTyping, timestamp }
});

// Status
socket.on('chat:message_status_updated', (data) => {
  // { messageId, status: 'delivered'|'read', deliveredBy/readBy }
});
```

## State Management

### Frontend State with Zustand

The Zustand store separates concerns:

**Domain State** (business data):
- `conversations`: List of user's conversations
- `messagesById`: Normalized message cache
- `userPresenceById`: Online status of users

**UI State** (UI concerns):
- `conversationLoading`: Loading conversations
- `messageError`: Error fetching messages
- `isSendingMessage`: Sending message in progress
- `optimisticMessageIds`: Messages sent but not confirmed

**Why Separate?**
- UI state can be cleared without affecting data
- Makes testing easier
- Clear separation of concerns
- Easier to reason about what affects what

### Selectors (Efficiency)

Instead of subscribing to entire store:
```typescript
// ❌ Bad: Re-renders on ANY state change
const messages = useChatStore(state => state.messageIdsInConversation);

// ✅ Good: Only re-renders when these specific messages change
const messages = useChatStore(state => 
  state.messageIdsInConversation.map(id => state.messagesById[id])
);

// ✅ Better: Use a selector to prevent re-rendering
const selector = (state) => 
  state.messageIdsInConversation.map(id => state.messagesById[id]);
const messages = useChatStore(selector);
```

## Error Handling & Resilience

### Network Errors

**Problem**: Network fails, message not sent
**Solution**:
```typescript
try {
  await sendMessage(conversationId, content);
} catch (error) {
  // Save to local queue
  unsyncedMessages.push({ conversationId, content });
  // Show error UI
  showNotification('Offline - will send when online');
  // Retry when online
  window.addEventListener('online', retryUnsyncedMessages);
}
```

### Offline User Delivery

**Problem**: Recipient offline when message sent
**Solution**:
1. Message saved to database immediately
2. Added to Redis queue for retry
3. When recipient comes online:
   - Server notifies them
   - Client fetches queued messages
   - Auto-delivered

### WebSocket Reconnection

**Problem**: Network drops, WebSocket disconnects
**Solution**:
```typescript
socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('reconnect', () => {
  // Re-establish presence
  socket.emit('presence:online');
  // Fetch missed messages
  fetchNewMessages();
});
```

### Database Transactions

**Problem**: Partial failures (e.g., create message but fail to update status)
**Solution**:
```typescript
const transaction = await sequelize.transaction();
try {
  await Message.create({ ... }, { transaction });
  await MessageStatus.bulkCreate([...], { transaction });
  await Conversation.update({ ... }, { transaction });
  await transaction.commit();  // All or nothing
} catch (error) {
  await transaction.rollback();  // Undo everything
  throw error;
}
```

### Duplicate Prevention

**Problem**: Message sent twice due to retry
**Solution**:
- Idempotent IDs: Use same ID for retry
- Database unique constraints prevent duplicates
- Check before insert

```typescript
const existing = await Message.findByPk(messageId);
if (!existing) {
  await Message.create({ id: messageId, ... });
}
```

## Performance Considerations

### Message Pagination

Fetch 50 messages at a time to avoid loading entire history:
```typescript
GET /api/messages/conv123?limit=50&offset=0    // First 50
GET /api/messages/conv123?limit=50&offset=50   // Next 50
```

### Presence Optimization

Don't broadcast for every minor status change:
- Throttle to once per connection
- Use rooms instead of individual broadcasts
- Aggregate status changes

### Message Delivery Queuing

Don't retry immediately (hammers server):
```typescript
messageDeliveryQueue.add(job, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000  // Start at 2s, exponentially increase
  }
});
```

### Database Indexing

Essential indexes for performance:
```sql
-- Message lookup (most common query)
CREATE INDEX idx_messages_conversation_created_at 
ON messages(conversation_id, created_at DESC);

-- Find user's conversations
CREATE INDEX idx_participants_user 
ON conversation_participants(user_id);
```

## Conclusion

This chat architecture provides:
- ✅ **Real-time communication** via WebSocket
- ✅ **Reliable delivery** via database persistence + queues
- ✅ **Offline support** via offline buffering
- ✅ **Efficient state** via Zustand normalized stores
- ✅ **Responsive UI** via optimistic updates
- ✅ **Scalable design** via separation of concerns
- ✅ **Production-ready** error handling

The hybrid HTTP + WebSocket approach balances reliability with responsiveness, providing the best user experience for a modern chat application.
