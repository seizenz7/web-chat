/**
 * Password utilities.
 *
 * SECURITY NOTES:
 * - Always hash passwords with a slow password hashing function (bcrypt/argon2/scrypt).
 * - Never log passwords.
 * - Validate password strength server-side (client-side checks are UX only).
 */

import bcrypt from 'bcryptjs';

export const PASSWORD_RULES = {
  minLength: 12,
  maxLength: 128,
} as const;

export function validatePasswordStrength(password: string) {
  const reasons: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    reasons.push(`Must be at least ${PASSWORD_RULES.minLength} characters.`);
  }

  if (password.length > PASSWORD_RULES.maxLength) {
    reasons.push(`Must be at most ${PASSWORD_RULES.maxLength} characters.`);
  }

  if (!/[a-z]/.test(password)) reasons.push('Must include a lowercase letter.');
  if (!/[A-Z]/.test(password)) reasons.push('Must include an uppercase letter.');
  if (!/[0-9]/.test(password)) reasons.push('Must include a number.');
  if (!/[^A-Za-z0-9]/.test(password)) reasons.push('Must include a symbol (punctuation).');

  if (/\s/.test(password)) reasons.push('Must not include spaces.');

  return {
    isValid: reasons.length === 0,
    reasons,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
