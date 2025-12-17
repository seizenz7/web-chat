/**
 * Socket.io Client Service
 *
 * Handles WebSocket connection to the backend for real-time chat.
 *
 * ============================
 * CONNECTION LIFECYCLE
 * ============================
 *
 * 1. Create socket instance with auth token
 * 2. Connect to server
 * 3. Authenticate via handshake
 * 4. Emit 'presence:online' to load conversations
 * 5. Listen for real-time events
 * 6. On disconnect, emit 'presence:offline'
 *
 * ============================
 * MESSAGE FLOW WITH ASCII DIAGRAM
 * ============================
 *
 * REST API (HTTP):
 *   Client                     Server
 *     |                          |
 *     |---POST /messages-------->|
 *     |                     (save to DB)
 *     |<-----200 OK response-----|
 *     |                      return msg
 *
 * Latency: 100-500ms
 * Best for: Critical data that must be persisted
 *
 *
 * WebSocket (Real-time):
 *   Client 1              Server              Client 2
 *     |                     |                     |
 *     |--emit message------>|                     |
 *     |              (save to DB)                 |
 *     |              (emit to all)--emission----->|
 *     |<--ack received--------|                   |
 *     |<-------message-------|                   |
 *
 * Latency: 10-50ms
 * Best for: Real-time collaboration, presence, typing
 *
 */

import io, { Socket as ClientSocket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

/**
 * ============================
 * SOCKET SERVICE INSTANCE
 * ============================
 */

let socket: ClientSocket | null = null;

/**
 * ============================
 * INITIALIZATION
 * ============================
 */

/**
 * Initialize Socket.io connection
 *
 * Must be called after user logs in and has access token
 * This connects to the backend and sets up all event listeners
 */
export function initializeSocket(): ClientSocket {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error('No access token available. User must be logged in.');
  }

  if (socket?.connected) {
    return socket;
  }

  // Create socket connection with authentication
  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth: {
      token: accessToken,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Set up event listeners
  setupEventListeners(socket);

  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket?.connected) {
    socket.emit('presence:offline');
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get socket instance
 */
export function getSocket(): ClientSocket | null {
  return socket;
}

/**
 * ============================
 * EVENT LISTENERS
 * ============================
 */

function setupEventListeners(sock: ClientSocket) {
  const chatStore = useChatStore;

  /**
   * Connection established
   */
  sock.on('connect', () => {
    console.log('✅ Connected to server');
    // Notify server we're online
    sock.emit('presence:online');
  });

  /**
   * Connection lost
   */
  sock.on('disconnect', () => {
    console.log('❌ Disconnected from server');
  });

  /**
   * User presence changed (online/offline)
   *
   * When another participant in your conversation goes online or offline
   */
  sock.on('user:status_changed', (data: { userId: string; status: 'online' | 'offline' }) => {
    console.log(`👤 User ${data.userId} is now ${data.status}`);

    if (data.status === 'online') {
      chatStore.getState().setUserOnline(data.userId, '');
    } else {
      chatStore.getState().setUserOffline(data.userId);
    }
  });

  /**
   * User is typing indicator
   *
   * Shows "User is typing..." in the UI
   * Automatically hides after user stops typing
   */
  sock.on(
    'chat:user_typing',
    (data: {
      userId: string;
      username: string;
      isTyping: boolean;
      conversationId: string;
    }) => {
      chatStore.getState().addTypingUser({
        userId: data.userId,
        username: data.username,
        conversationId: data.conversationId,
        isTyping: data.isTyping,
      });

      // Auto-remove typing indicator after 3 seconds if not renewed
      if (data.isTyping) {
        setTimeout(() => {
          chatStore
            .getState()
            .removeTypingUser(data.userId, data.conversationId);
        }, 3000);
      }
    }
  );

  /**
   * Message received from server
   *
   * This is called when:
   * 1. Another participant sends a message to your conversation
   * 2. Server broadcasts the message to all participants
   *
   * Flow:
   * 1. Message saved to DB on server
   * 2. Emit to all participants in conversation room
   * 3. Update local state and UI
   */
  sock.on(
    'chat:message_received',
    (message: {
      id: string;
      conversation_id: string;
      sender_id: string;
      sender_username: string;
      content_encrypted: string;
      created_at: Date;
      message_type: string;
      is_edited: boolean;
      is_deleted: boolean;
    }) => {
      console.log('💬 Message received:', message.id);

      chatStore.getState().addMessage({
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        sender_username: message.sender_username,
        content_encrypted: message.content_encrypted,
        message_type: message.message_type as any,
        is_edited: message.is_edited,
        is_deleted: message.is_deleted,
        created_at: new Date(message.created_at),
        updated_at: new Date(message.created_at),
      });

      // Auto-mark as delivered
      sock.emit('chat:message_delivered', { messageId: message.id });

      // Auto-mark as read after 2 seconds (could be user-initiated)
      setTimeout(() => {
        sock.emit('chat:message_read', { messageId: message.id });
      }, 2000);
    }
  );

  /**
   * Message status updated
   *
   * Notifies you that your message was delivered or read
   * Shows the checkmarks in the UI
   */
  sock.on(
    'chat:message_status_updated',
    (data: { messageId: string; status: 'delivered' | 'read'; deliveredBy?: string; readBy?: string }) => {
      console.log(`📬 Message ${data.messageId} was ${data.status}`);

      chatStore.getState().updateMessageStatus(data.messageId, {
        message_id: data.messageId,
        user_id: data.deliveredBy || data.readBy || '',
        status_type: data.status,
      });
    }
  );

  /**
   * Socket error
   */
  sock.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  /**
   * Authentication error
   */
  sock.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
  });
}

/**
 * ============================
 * EMIT FUNCTIONS (Client -> Server)
 * ============================
 */

/**
 * Send a message
 *
 * @param conversationId - The conversation ID
 * @param contentEncrypted - The encrypted message content (already encrypted on client)
 * @returns Promise that resolves when server acknowledges
 */
export function sendMessage(
  conversationId: string,
  contentEncrypted: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return new Promise((resolve) => {
    if (!socket) {
      resolve({ success: false, error: 'Socket not connected' });
      return;
    }

    socket.emit('chat:message_send', { conversationId, contentEncrypted }, (response) => {
      resolve(response);
    });
  });
}

/**
 * Send typing indicator
 *
 * Call this in the message input's onChange handler
 *
 * @param conversationId - The conversation ID
 * @param isTyping - Whether user is currently typing
 */
export function sendTypingIndicator(conversationId: string, isTyping: boolean): void {
  if (!socket?.connected) return;

  socket.emit('chat:typing', {
    conversationId,
    isTyping,
  });
}

/**
 * Mark message as delivered
 *
 * Called when client receives a message
 *
 * @param messageId - The message ID
 */
export function markMessageDelivered(messageId: string): void {
  if (!socket?.connected) return;

  socket.emit('chat:message_delivered', { messageId });
}

/**
 * Mark message as read
 *
 * Called when user scrolls the message into view
 *
 * @param messageId - The message ID
 */
export function markMessageRead(messageId: string): void {
  if (!socket?.connected) return;

  socket.emit('chat:message_read', { messageId });
}

/**
 * Emit presence online
 *
 * Tells server user is online and loads their conversations
 */
export function emitPresenceOnline(): void {
  if (!socket?.connected) return;

  socket.emit('presence:online');
}

/**
 * Emit presence offline
 *
 * Tells server user is offline
 */
export function emitPresenceOffline(): void {
  if (!socket?.connected) return;

  socket.emit('presence:offline');
}

/**
 * ============================
 * RECONNECTION HANDLING
 * ============================
 */

/**
 * Ensure socket is connected, reconnect if needed
 */
export function ensureSocketConnected(): void {
  if (!socket) {
    initializeSocket();
  } else if (!socket.connected) {
    socket.connect();
  }
}
