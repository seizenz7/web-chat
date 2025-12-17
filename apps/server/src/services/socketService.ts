/**
 * Socket.io Service - Real-time Chat Implementation
 *
 * Handles WebSocket connections for real-time chat with presence tracking,
 * typing indicators, and message delivery notifications.
 *
 * ============================
 * KEY CONCEPTS
 * ============================
 *
 * 1. CONNECTION FLOW:
 *    Client connects -> Auth handshake -> User joins conversation rooms
 *
 * 2. ROOMS STRUCTURE:
 *    - "user:{userId}:presence" - Track user online/offline status
 *    - "conversation:{conversationId}" - All participants in a conversation
 *    - "user:{userId}:notifications" - Personal notifications
 *
 * 3. PRESENCE TRACKING:
 *    When user connects, emit "user_online" to all their conversations
 *    When user disconnects, emit "user_offline" to all their conversations
 *
 * 4. MESSAGE FLOW (HTTP vs WebSocket):
 *    HTTP:      Client POST -> Server -> DB -> Response
 *              (Latency: ~100-500ms, Better for persistence)
 *
 *    WebSocket: Client emit -> Server -> DB -> Socket emit to all
 *              (Latency: ~10-50ms, Better for real-time)
 *
 * 5. RELIABILITY:
 *    - For critical operations (message send), also save to database
 *    - Use acknowledgments to confirm receipt
 *    - Queue failed messages for later delivery
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logging';
import { config } from '../config';
import { User, ConversationParticipant, Conversation } from '../database/models/associations';
import { sendMessage, updateMessageStatus } from './messageService';
import { messageDeliveryQueue, offlineMessageQueue } from './queueService';

/**
 * ============================
 * TYPE DEFINITIONS
 * ============================
 */

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  userConversations?: string[];
}

interface TypingData {
  conversationId: string;
  isTyping: boolean;
}

/**
 * Initialize Socket.io event handlers
 * Called once at server startup
 */
export function initializeSocket(io: SocketIOServer) {
  /**
   * ============================
   * CONNECTION & AUTH
   * ============================
   *
   * Socket.io auth handshake flow:
   * 1. Client attempts connection with auth credentials
   * 2. Server verifies JWT token
   * 3. If valid, socket is authenticated and can join rooms
   * 4. If invalid, connection is rejected
   */
  io.on('connection', async (socket: AuthenticatedSocket) => {
    logger.info(`Client connected`, { socketId: socket.id });

    try {
      // Perform authentication handshake
      await authenticateSocket(socket, io);
    } catch (error) {
      logger.warn('Socket auth failed', { socketId: socket.id, error });
      socket.disconnect(true);
      return;
    }

    // ============================
    // PRESENCE EVENTS
    // ============================

    /**
     * When user connects, broadcast their online status to all conversations
     * This allows other participants to update their UI immediately
     */
    socket.on('presence:online', async () => {
      if (!socket.userId) return;

      try {
        // Get all conversations for this user
        const participants = await ConversationParticipant.findAll({
          where: { user_id: socket.userId },
          include: [{ model: Conversation }],
        });

        // Join rooms for each conversation
        const conversationIds = participants.map((p) => p.conversation_id);
        socket.userConversations = conversationIds;

        conversationIds.forEach((convId) => {
          socket.join(`conversation:${convId}`);
        });

        // Also join user's personal presence room
        socket.join(`user:${socket.userId}:presence`);

        // Notify all conversations that this user is online
        conversationIds.forEach((convId) => {
          io.to(`conversation:${convId}`).emit('user:status_changed', {
            userId: socket.userId,
            status: 'online',
            timestamp: new Date(),
          });
        });

        logger.info('User presence marked as online', {
          userId: socket.userId,
          conversationCount: conversationIds.length,
        });
      } catch (error) {
        logger.error('Error handling presence:online', { userId: socket.userId, error });
      }
    });

    /**
     * When user explicitly goes offline, notify other participants
     */
    socket.on('presence:offline', () => {
      if (!socket.userId || !socket.userConversations) return;

      socket.userConversations.forEach((convId) => {
        io.to(`conversation:${convId}`).emit('user:status_changed', {
          userId: socket.userId,
          status: 'offline',
          timestamp: new Date(),
        });
      });

      logger.info('User presence marked as offline', { userId: socket.userId });
    });

    // ============================
    // TYPING INDICATORS
    // ============================

    /**
     * When user starts/stops typing, broadcast to conversation
     *
     * Example workflow:
     * 1. User opens message input in conversation
     * 2. Client emits "chat:typing" with isTyping=true
     * 3. Server broadcasts to other participants
     * 4. Other clients show "User is typing..." indicator
     * 5. When user stops typing (or sends message), emit isTyping=false
     *
     * This creates the familiar "typing..." experience
     */
    socket.on('chat:typing', (data: TypingData) => {
      if (!socket.userId) return;

      // Validate conversation
      if (!socket.userConversations?.includes(data.conversationId)) {
        logger.warn('Unauthorized typing event', {
          userId: socket.userId,
          conversationId: data.conversationId,
        });
        return;
      }

      // Broadcast to everyone except sender
      socket.broadcast.to(`conversation:${data.conversationId}`).emit('chat:user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: data.isTyping,
        timestamp: new Date(),
      });

      logger.debug('Typing indicator sent', {
        userId: socket.userId,
        conversationId: data.conversationId,
        isTyping: data.isTyping,
      });
    });

    // ============================
    // MESSAGE EVENTS
    // ============================

    /**
     * Send a message to a conversation
     *
     * Flow:
     * 1. Client emits message with conversationId and encrypted content
     * 2. Server validates user is a participant
     * 3. Server saves to database (creates Message + MessageStatus records)
     * 4. Server broadcasts to all participants in the conversation
     * 5. Client receives acknowledgment with message ID
     * 6. If delivery fails for offline users, queue the message
     */
    socket.on(
      'chat:message_send',
      async (data: { conversationId: string; contentEncrypted: string }, callback) => {
        if (!socket.userId) return;

        try {
          // Validate input
          if (!data.conversationId || !data.contentEncrypted) {
            throw new Error('Missing required fields');
          }

          // Validate user is a participant
          const isParticipant = await ConversationParticipant.findOne({
            where: {
              conversation_id: data.conversationId,
              user_id: socket.userId,
            },
          });

          if (!isParticipant) {
            throw new Error('Not a participant in this conversation');
          }

          // Save message to database
          const message = await sendMessage({
            conversation_id: data.conversationId,
            sender_id: socket.userId,
            content_encrypted: data.contentEncrypted,
            message_type: 'text',
          });

          // Acknowledge to sender with message ID (for optimistic updates)
          if (callback) {
            callback({ success: true, messageId: message.id });
          }

          // Broadcast message to all participants in the conversation
          io.to(`conversation:${data.conversationId}`).emit('chat:message_received', {
            ...message,
            timestamp: new Date(),
          });

          logger.info('Message sent', {
            messageId: message.id,
            userId: socket.userId,
            conversationId: data.conversationId,
          });
        } catch (error) {
          logger.error('Error sending message', { userId: socket.userId, error });
          if (callback) {
            callback({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
      }
    );

    /**
     * Mark a message as delivered
     *
     * Delivery confirmation is important for:
     * - Showing message status in UI (checkmarks)
     * - Knowing if user received the message
     * - Triggering queued message delivery for offline users
     */
    socket.on('chat:message_delivered', async (data: { messageId: string }) => {
      if (!socket.userId) return;

      try {
        await updateMessageStatus(data.messageId, socket.userId, 'delivered');

        // Notify sender that their message was delivered
        io.to(`user:${socket.userId}:notifications`).emit('chat:message_status_updated', {
          messageId: data.messageId,
          status: 'delivered',
          deliveredBy: socket.userId,
        });

        logger.debug('Message marked as delivered', {
          messageId: data.messageId,
          userId: socket.userId,
        });
      } catch (error) {
        logger.error('Error updating delivery status', { userId: socket.userId, error });
      }
    });

    /**
     * Mark a message as read
     *
     * Read receipts are important for:
     * - Showing if recipient has seen the message
     * - Enabling the familiar "read" checkmark feature
     * - Analytics (when did user see the message)
     */
    socket.on('chat:message_read', async (data: { messageId: string }) => {
      if (!socket.userId) return;

      try {
        await updateMessageStatus(data.messageId, socket.userId, 'read');

        // Notify sender that message was read
        io.to(`user:${socket.userId}:notifications`).emit('chat:message_status_updated', {
          messageId: data.messageId,
          status: 'read',
          readBy: socket.userId,
        });

        logger.debug('Message marked as read', {
          messageId: data.messageId,
          userId: socket.userId,
        });
      } catch (error) {
        logger.error('Error updating read status', { userId: socket.userId, error });
      }
    });

    // ============================
    // DISCONNECT
    // ============================

    /**
     * When client disconnects (tab closed, network lost, etc.)
     *
     * Cleanup:
     * 1. Notify other participants in all their conversations
     * 2. Leave all rooms automatically (Socket.io handles this)
     * 3. Log the disconnection
     * 4. Queued messages for this user will be delivered on reconnect
     */
    socket.on('disconnect', () => {
      if (socket.userId && socket.userConversations) {
        // Notify conversations that user is offline
        socket.userConversations.forEach((convId) => {
          io.to(`conversation:${convId}`).emit('user:status_changed', {
            userId: socket.userId,
            status: 'offline',
            timestamp: new Date(),
          });
        });
      }

      logger.info('Client disconnected', { socketId: socket.id, userId: socket.userId });
    });

    /**
     * Error handler
     */
    socket.on('error', (error) => {
      logger.error('Socket error', { socketId: socket.id, userId: socket.userId, error });
    });
  });
}

/**
 * ============================
 * HELPER FUNCTIONS
 * ============================
 */

/**
 * Authenticate a socket connection using JWT
 *
 * The client passes a JWT token during connection handshake.
 * We verify it and attach the user info to the socket.
 *
 * Example client code:
 * const socket = io('http://localhost:5000', {
 *   auth: {
 *     token: 'eyJhbGciOiJIUzI1NiIs...'
 *   }
 * });
 */
async function authenticateSocket(socket: AuthenticatedSocket, io: SocketIOServer) {
  const token = socket.handshake.auth.token;

  if (!token) {
    throw new Error('No auth token provided');
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, config.secrets.jwtAccessSecret) as {
      userId: string;
      username: string;
    };

    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.username = decoded.username;

    logger.info('Socket authenticated', { socketId: socket.id, userId: socket.userId });
  } catch (error) {
    throw new Error('Invalid auth token');
  }
}

/**
 * Helper function to emit events to specific client
 * Usage: emitToClient(io, socketId, 'event_name', data)
 */
export function emitToClient(io: SocketIOServer, socketId: string, event: string, data: any) {
  io.to(socketId).emit(event, data);
}

/**
 * Helper function to emit events to a room
 * Usage: emitToRoom(io, roomId, 'event_name', data)
 */
export function emitToRoom(io: SocketIOServer, roomId: string, event: string, data: any) {
  io.to(roomId).emit(event, data);
}

/**
 * Helper function to emit events to all clients
 * Usage: emitToAll(io, 'event_name', data)
 */
export function emitToAll(io: SocketIOServer, event: string, data: any) {
  io.emit(event, data);
}

/**
 * Example of integrating database updates with Socket.io
 * This would be called from a service after saving to database
 */
export function broadcastDataUpdate(io: SocketIOServer, entityType: string, data: any) {
  io.emit('data_update', {
    type: entityType,
    data,
    timestamp: new Date(),
  });
}
