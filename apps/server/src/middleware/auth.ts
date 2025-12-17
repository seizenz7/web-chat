/**
 * Access-token authentication middleware.
 *
 * SECURITY NOTES:
 * - We expect the access token in the Authorization header (Bearer).
 * - Access tokens are short-lived; they are kept in memory in the browser.
 * - Refresh tokens live in httpOnly cookies and are exchanged for new access tokens.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';

type AccessTokenPayload = {
  sub: string;
  typ: 'access';
  iat: number;
  exp: number;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing access token'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, config.secrets.jwtAccessSecret) as AccessTokenPayload;
    if (payload.typ !== 'access' || !payload.sub) {
      return next(new UnauthorizedError('Invalid access token'));
    }

    req.auth = { userId: payload.sub };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}
