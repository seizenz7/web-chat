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
import { initializeSocket } from './services/socketService';
import { initializeQueues } from './services/queueService';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Create HTTP server for Socket.io compatibility
const httpServer = createServer(app);

// Initialize Socket.io for real-time communication
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
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
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
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
 *
 * Routes map HTTP paths to request handlers (controllers)
 * Pattern: app.METHOD(path, handler)
 * - GET: Fetch data
 * - POST: Create data
 * - PUT/PATCH: Update data
 * - DELETE: Remove data
 */

app.use('/api/health', healthCheckRouter);
app.use('/api/example', exampleRouter);

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'PERN Stack API',
    version: '1.0.0',
    documentation: '/api/docs',
    services: {
      health: '/api/health',
      examples: '/api/example',
    },
  });
});

/**
 * ============================
 * ERROR HANDLING MIDDLEWARE
 * ============================
 *
 * These must come AFTER all route definitions.
 * They handle requests that didn't match any route,
 * and catch errors from controllers/services.
 */

app.use(notFoundHandler);
app.use(errorHandler);

/**
 * ============================
 * SOCKET.IO REAL-TIME SETUP
 * ============================
 *
 * Socket.io handles WebSocket connections for features like:
 * - Real-time notifications
 * - Live chat
 * - Collaborative editing
 * - Live data updates
 */

initializeSocket(io);

/**
 * ============================
 * JOB QUEUE SETUP
 * ============================
 *
 * Bull runs background jobs asynchronously:
 * - Sending emails
 * - Processing images
 * - Batch operations
 * - Scheduled tasks
 *
 * Jobs are queued in Redis and processed by workers.
 */

initializeQueues();

/**
 * ============================
 * SERVER START
 * ============================
 */

const PORT = process.env.SERVER_PORT || 5000;
const HOST = process.env.SERVER_HOST || '0.0.0.0';

// Start listening on HTTP server (also handles WebSocket)
httpServer.listen(PORT, HOST as any, () => {
  logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
  logger.info(`📊 Health check: http://${HOST}:${PORT}/api/health`);
  logger.info(`🌐 Socket.io ready for connections`);
  logger.info(`📦 Job queues initialized with Redis`);
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
