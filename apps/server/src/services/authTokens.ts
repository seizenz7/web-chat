/**
 * JWT token helpers.
 *
 * SECURITY BEST PRACTICES:
 * - Access token: short lived, stored in memory in the browser.
 * - Refresh token: long lived, stored in an httpOnly cookie.
 * - Refresh token rotation: every refresh produces a new refresh token and revokes the old session.
 */

import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { durationToMs } from '../utils/duration';

export type AccessTokenPayload = {
  sub: string;
  typ: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
  typ: 'refresh';
};

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId, typ: 'access' } satisfies AccessTokenPayload, config.secrets.jwtAccessSecret, {
    expiresIn: config.auth.accessTokenExpiresIn,
  });
}

export function signRefreshToken(params: { userId: string; sessionId: string }) {
  return jwt.sign(
    { sub: params.userId, sid: params.sessionId, typ: 'refresh' } satisfies RefreshTokenPayload,
    config.secrets.jwtRefreshSecret,
    {
      expiresIn: config.auth.refreshTokenExpiresIn,
    }
  );
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.secrets.jwtRefreshSecret) as RefreshTokenPayload;
}

export function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(config.auth.refreshCookieName, refreshToken, {
    httpOnly: true,

    // If `secure` is false in production, browsers may refuse to store cookies.
    // Keep it true when deploying behind HTTPS.
    secure: config.isProd,

    // Lax works for same-site requests (localhost ports count as same-site).
    // If you deploy frontend + backend on different sites, you may need SameSite=None; Secure.
    sameSite: 'lax',

    // Restrict where the cookie is sent.
    path: '/api/auth',

    maxAge: durationToMs(config.auth.refreshTokenExpiresIn),
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(config.auth.refreshCookieName, { path: '/api/auth' });
}
