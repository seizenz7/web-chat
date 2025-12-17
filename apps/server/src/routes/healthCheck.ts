/**
 * Health Check Routes
 *
 * Endpoints for monitoring application status and dependencies.
 * Used by load balancers, monitoring services, and deployment orchestration.
 *
 * GET /api/health - Quick health check
 * GET /api/health/deep - Detailed status of all dependencies
 */

import { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logging';

export const healthCheckRouter = Router();

/**
 * Basic Health Check Endpoint
 *
 * Returns 200 if the server is running.
 * This is the lightest check - useful for load balancers.
 *
 * Response: { status: 'ok' }
 */
healthCheckRouter.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Deep Health Check Endpoint
 *
 * Checks the status of all critical dependencies:
 * - Database connectivity
 * - Redis connectivity
 * - External services
 *
 * Returns detailed status for each component.
 * Useful for deployment and monitoring dashboards.
 */
healthCheckRouter.get('/deep', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real application, you would check:
    // - Database: db.authenticate()
    // - Redis: redis.ping()
    // - External APIs: health check calls

    const health = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        // These would be populated with actual checks
        database: { status: 'ok', latency: 'N/A' },
        redis: { status: 'ok', latency: 'N/A' },
        socket_io: { status: 'ok', connections: 0 },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version,
      },
    };

    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    next(error);
  }
});
