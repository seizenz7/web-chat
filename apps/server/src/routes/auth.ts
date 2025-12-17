/**
 * Auth Routes
 *
 * Endpoints:
 * - POST /api/auth/register
 * - POST /api/auth/login
 * - GET  /api/auth/me
 * - POST /api/auth/refresh
 * - POST /api/auth/logout
 */

import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';

import { config } from '../config';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { User } from '../database/models/associations';
import { isAppError, UnauthorizedError, ValidationError } from '../utils/errors';
import { getCookie } from '../utils/cookies';
import { clearRefreshCookie, setRefreshCookie } from '../services/authTokens';
import * as authService from '../services/authService';

export const authRouter = Router();

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).pattern(/^[a-z0-9_]+$/).required(),
  email: Joi.string().email().max(255).required(),
  displayName: Joi.string().min(1).max(100).required(),
  password: Joi.string().min(12).max(128).required(),
  enable2fa: Joi.boolean().default(false),
});

const loginSchema = Joi.object({
  identifier: Joi.string().min(3).max(255).required(),
  password: Joi.string().min(1).max(128).required(),
  totpCode: Joi.string().optional(),
});

/**
 * POST /api/auth/register
 */
authRouter.post(
  '/register',
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'auth:register' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.message, { details: error.details });
      }

      const result = await authService.register({
        username: value.username,
        email: value.email,
        displayName: value.displayName,
        password: value.password,
        enable2fa: value.enable2fa,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });

      setRefreshCookie(res, result.refreshToken);

      res.status(201).json({
        status: 'success',
        message: 'Registered successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          ...(result.totpSetup ? { totpSetup: result.totpSetup } : {}),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/login
 */
authRouter.post(
  '/login',
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'auth:login' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.message, { details: error.details });
      }

      const result = await authService.login({
        identifier: value.identifier,
        password: value.password,
        totpCode: value.totpCode,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });

      setRefreshCookie(res, result.refreshToken);

      res.json({
        status: 'success',
        message: 'Logged in successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/auth/me
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.auth!.userId);
    if (!user) {
      // If the user was deleted, the access token should be considered invalid.
      throw new UnauthorizedError('User not found');
    }

    res.json({
      status: 'success',
      data: {
        user: authService.toPublicUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 */
authRouter.post(
  '/refresh',
  rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'auth:refresh' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const raw = getCookie(req, config.auth.refreshCookieName);
      if (!raw) {
        throw new UnauthorizedError('Missing refresh token');
      }

      const result = await authService.refresh({
        refreshToken: raw,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });

      setRefreshCookie(res, result.refreshToken);

      res.json({
        status: 'success',
        message: 'Token refreshed',
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      if (isAppError(err) && err.statusCode === 401) {
        clearRefreshCookie(res);
      }
      next(err);
    }
  }
);

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookieToken = getCookie(req, config.auth.refreshCookieName);
    await authService.logout({ refreshToken: cookieToken });

    clearRefreshCookie(res);

    res.json({
      status: 'success',
      message: 'Logged out',
    });
  } catch (err) {
    next(err);
  }
});
