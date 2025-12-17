/**
 * Authentication service.
 *
 * This keeps route handlers thin and makes it easier to unit test later.
 */

import crypto from 'crypto';
import { Op } from 'sequelize';

import { User, AuthSession } from '../database/models/associations';
import { config } from '../config';
import {
  ConflictError,
  InvalidTwoFactorCodeError,
  TwoFactorRequiredError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors';
import { encryptString, decryptString } from '../utils/encryption';
import { durationToMs } from '../utils/duration';
import { hashPassword, validatePasswordStrength, verifyPassword } from '../utils/password';
import { createOtpAuthUrl, generateTotpSecret, verifyTotp } from '../utils/totp';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './authTokens';

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  totpEnabled: boolean;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    avatarUrl: user.avatar_url ?? undefined,
    totpEnabled: user.totp_enabled,
  };
}

function getDeviceInfo(userAgent: string | undefined) {
  // You can expand this to parse browser + OS.
  return userAgent || 'unknown';
}

function getIpAddress(ip: string | undefined) {
  return ip || '0.0.0.0';
}

export async function register(params: {
  username: string;
  email: string;
  displayName: string;
  password: string;
  enable2fa?: boolean;
  userAgent?: string;
  ip?: string;
}) {
  const username = params.username.toLowerCase().trim();
  const email = params.email.toLowerCase().trim();

  const strength = validatePasswordStrength(params.password);
  if (!strength.isValid) {
    throw new ValidationError('Password does not meet strength requirements', {
      rules: strength.reasons,
    });
  }

  const existing = await User.findOne({
    where: {
      [Op.or]: [{ username }, { email }],
    },
  });

  if (existing) {
    // Don't leak which one matched unless you want friendlier UX.
    throw new ConflictError('Username or email already in use');
  }

  const passwordHash = await hashPassword(params.password);

  let totpSecret: string | undefined;
  let totpSecretEncrypted: string | undefined;

  if (params.enable2fa) {
    totpSecret = generateTotpSecret();
    totpSecretEncrypted = encryptString(totpSecret, config.secrets.totpEncryptionKey);
  }

  const user = await User.create({
    username,
    email,
    display_name: params.displayName,
    password_hash: passwordHash,
    totp_enabled: Boolean(params.enable2fa),
    totp_secret_encrypted: totpSecretEncrypted,
    is_active: true,
    status: 'offline',
  });

  const { accessToken, refreshToken } = await createSessionAndTokens({
    userId: user.id,
    userAgent: params.userAgent,
    ip: params.ip,
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
    ...(totpSecret
      ? {
          totpSetup: {
            secret: totpSecret,
            otpauthUrl: createOtpAuthUrl({
              issuer: 'PERN Chat',
              accountName: user.email,
              secret: totpSecret,
            }),
          },
        }
      : {}),
  };
}

export async function login(params: {
  identifier: string;
  password: string;
  totpCode?: string;
  userAgent?: string;
  ip?: string;
}) {
  const identifier = params.identifier.toLowerCase().trim();

  const user = await User.findOne({
    where: {
      [Op.or]: [{ email: identifier }, { username: identifier }],
    },
  });

  // Avoid user enumeration: keep errors the same for unknown user vs wrong password.
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (!user.is_active) {
    throw new UnauthorizedError('Account is disabled');
  }

  const ok = await verifyPassword(params.password, user.password_hash);
  if (!ok) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.totp_enabled) {
    if (!params.totpCode) {
      throw new TwoFactorRequiredError();
    }

    if (!user.totp_secret_encrypted) {
      // Misconfiguration / corrupted DB data.
      throw new UnauthorizedError('Two-factor authentication is not available');
    }

    const secretBase32 = decryptString(user.totp_secret_encrypted, config.secrets.totpEncryptionKey);

    const isValid = verifyTotp({ secretBase32, code: params.totpCode, window: 1 });
    if (!isValid) {
      throw new InvalidTwoFactorCodeError();
    }
  }

  const { accessToken, refreshToken } = await createSessionAndTokens({
    userId: user.id,
    userAgent: params.userAgent,
    ip: params.ip,
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
}

export async function refresh(params: { refreshToken: string; userAgent?: string; ip?: string }) {
  let payload: { sub: string; sid: string; typ: 'refresh' };

  try {
    payload = verifyRefreshToken(params.refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (payload.typ !== 'refresh') {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const session = await AuthSession.findByPk(payload.sid);
  if (!session) {
    throw new UnauthorizedError('Session not found');
  }

  if (!session.isValid()) {
    throw new UnauthorizedError('Session expired');
  }

  if (session.user_id !== payload.sub) {
    throw new UnauthorizedError('Invalid session');
  }

  const tokenMatches = await session.validateRefreshToken(params.refreshToken);
  if (!tokenMatches) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Rotate refresh tokens: revoke the old session and create a new one.
  await session.update({ revoked_at: new Date() });

  const { accessToken, refreshToken } = await createSessionAndTokens({
    userId: session.user_id,
    userAgent: params.userAgent,
    ip: params.ip,
  });

  return { accessToken, refreshToken };
}

export async function logout(params: { refreshToken?: string }) {
  if (!params.refreshToken) return;

  try {
    const payload = verifyRefreshToken(params.refreshToken);
    const session = await AuthSession.findByPk(payload.sid);
    if (session) {
      await session.update({ revoked_at: new Date() });
    }
  } catch {
    // Ignore invalid tokens during logout.
  }
}

async function createSessionAndTokens(params: {
  userId: string;
  userAgent?: string;
  ip?: string;
}) {
  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ userId: params.userId, sessionId });

  await AuthSession.create({
    id: sessionId,
    user_id: params.userId,

    // Store the *raw* refresh token here; the model hook hashes it before saving.
    refresh_token_hash: refreshToken,

    device_info: getDeviceInfo(params.userAgent),
    ip_address: getIpAddress(params.ip),
    expires_at: new Date(Date.now() + durationToMs(config.auth.refreshTokenExpiresIn)),
  });

  const accessToken = signAccessToken(params.userId);

  return { accessToken, refreshToken };
}
