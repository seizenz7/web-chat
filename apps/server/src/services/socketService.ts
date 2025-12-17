/**
 * Socket.io Service
 *
 * Handles real-time bidirectional communication between server and clients.
 *
 * Common use cases:
 * - Live notifications (user A gets notified immediately when user B follows them)
 * - Chat messages (instant message delivery)
 * - Collaborative features (shared editing, live cursors)
 * - Live dashboards (real-time data updates)
 *
 * How it works:
 * 1. Client connects via WebSocket, gets assigned a socket.id
 * 2. Server and client can emit named events to each other
 * 3. Client can join "rooms" to receive broadcasts to groups
 * 4. When client disconnects, cleanup happens automatically
 *
 * Usage pattern:
 *   Server -> Client: io.emit('event_name', data)
 *   Client -> Server: socket.on('event_name', handler)
 *   Client -> Server: socket.emit('event_name', data)
 *   Server -> Client: socket.on('event_name', handler)
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logging';

/**
 * Initialize Socket.io event handlers
 * Called once at server startup
 */
export function initializeSocket(io: SocketIOServer) {
  /**
   * Connection handler
   * Triggered when a new client connects
   */
  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected`, { socketId: socket.id });

    /**
     * Example: Handle custom events from client
     * In a real app, you would:
     * - Save to database
     * - Broadcast to other clients
     * - Trigger side effects (emails, jobs, etc.)
     */
    socket.on('message', (data) => {
      logger.debug('Message received', { socketId: socket.id, data });

      // Broadcast to all connected clients
      io.emit('message', {
        from: socket.id,
        content: data.content,
        timestamp: new Date(),
      });
    });

    /**
     * Example: Join a room
     * Rooms allow targeted broadcasts to subsets of clients
     * Useful for: chat rooms, collaborative documents, shared games
     */
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      logger.debug('Client joined room', { socketId: socket.id, roomId });

      // Notify others in the room
      socket.broadcast.to(roomId).emit('user_joined', {
        userId: socket.id,
        timestamp: new Date(),
      });
    });

    /**
     * Example: Leave a room
     */
    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      logger.debug('Client left room', { socketId: socket.id, roomId });

      // Notify others in the room
      socket.broadcast.to(roomId).emit('user_left', {
        userId: socket.id,
        timestamp: new Date(),
      });
    });

    /**
     * Example: Typing indicator
     * Useful for chat apps to show when someone is typing
     */
    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      socket.broadcast.to(data.roomId).emit('typing', {
        userId: socket.id,
        isTyping: data.isTyping,
      });
    });

    /**
     * Disconnect handler
     * Triggered when client disconnects (closes tab, network error, etc.)
     */
    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
      // In a real app, you might:
      // - Update user status in database
      // - Notify other users
      // - Clean up resources
    });

    /**
     * Error handler
     */
    socket.on('error', (error) => {
      logger.error('Socket error', { socketId: socket.id, error });
    });
  });
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
