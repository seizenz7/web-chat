/**
 * PERN Stack Backend - Express Server Entry Point
 *
 * This file initializes the Express server with:
 * - Middleware setup (CORS, parsing, logging, error handling)
 * - Route registration
 * - WebSocket (Socket.io) configuration
 * - Database connection
 * - Job queue (Bull) initialization
 *
 * The server runs on the port specified in .env (default: 5000)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { config } from './config';
import { logger, requestLogger } from './utils/logging';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { healthCheckRouter } from './routes/healthCheck';
import { exampleRouter } from './routes/example';
import { authRouter } from './routes/auth';
import { conversationRouter } from './routes/conversations';
import { messageRouter } from './routes/messages';
import { initializeSocket } from './services/socketService';
import { initializeQueues } from './services/queueService';
import { initializeChatDatabase } from './database/integration';

// Load environment variables from .env file
dotenv.config();

const app = express();

// If you're behind a proxy (Render/Heroku/Nginx), this makes req.ip work correctly.
app.set('trust proxy', 1);

// Create HTTP server for Socket.io compatibility
const httpServer = createServer(app);

// Initialize Socket.io for real-time communication
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

/**
 * ============================
 * MIDDLEWARE SETUP
 * ============================
 *
 * Middleware functions process requests in the order they're registered.
 * Each middleware can modify the request, response, or pass control to the next.
 */

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security

// CORS middleware - Allow requests from frontend
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing middleware - Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware - Log all incoming requests
app.use(requestLogger);

/**
 * ============================
 * ROUTE SETUP
 * ============================
 */

app.use('/api/health', healthCheckRouter);
app.use('/api/example', exampleRouter);
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'PERN Stack API',
    version: '1.0.0',
    documentation: '/api/docs',
    services: {
      health: '/api/health',
      examples: '/api/example',
      auth: '/api/auth',
      conversations: '/api/conversations',
      messages: '/api/messages',
    },
  });
});

/**
 * ============================
 * ERROR HANDLING MIDDLEWARE
 * ============================
 *
 * These must come AFTER all route definitions.
 */

app.use(notFoundHandler);
app.use(errorHandler);

/**
 * ============================
 * SOCKET.IO REAL-TIME SETUP
 * ============================
 */

initializeSocket(io);

/**
 * ============================
 * JOB QUEUE SETUP
 * ============================
 */

initializeQueues();

/**
 * ============================
 * SERVER START
 * ============================
 */

const PORT = config.server.port;
const HOST = config.server.host;

async function bootstrap() {
  // Ensure DB + Sequelize models are ready before accepting traffic.
  await initializeChatDatabase();

  // Start listening on HTTP server (also handles WebSocket)
  httpServer.listen(PORT, HOST as any, () => {
    logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
    logger.info(`📊 Health check: http://${HOST}:${PORT}/api/health`);
    logger.info(`🔐 Auth API: http://${HOST}:${PORT}/api/auth`);
    logger.info(`🌐 Socket.io ready for connections`);
    logger.info(`📦 Job queues initialized with Redis`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
