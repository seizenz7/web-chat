/**
 * Minimal TOTP implementation (RFC 6238) with Base32 secrets.
 *
 * SECURITY NOTES:
 * - TOTP protects against password reuse + credential stuffing.
 * - It does NOT protect against real-time phishing/MITM (use WebAuthn for that).
 * - Allowing a small time window (+/- 1 step) improves UX but slightly reduces security.
 */

import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) {
      throw new Error('Invalid base32 character');
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  return base32Encode(bytes);
}

export function createOtpAuthUrl(params: {
  issuer: string;
  accountName: string;
  secret: string;
}): string {
  const label = encodeURIComponent(`${params.issuer}:${params.accountName}`);
  const issuer = encodeURIComponent(params.issuer);
  const secret = encodeURIComponent(params.secret);

  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (code % 1_000_000).toString().padStart(6, '0');
  return otp;
}

export function totp(secretBase32: string, nowMs: number = Date.now()): string {
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(nowMs / 1000 / 30);
  return hotp(secret, counter);
}

export function verifyTotp(params: {
  secretBase32: string;
  code: string;
  window?: number;
  nowMs?: number;
}): boolean {
  const { secretBase32, code } = params;
  const window = params.window ?? 1;
  const nowMs = params.nowMs ?? Date.now();

  const normalized = code.replace(/\s+/g, '');
  if (!/^[0-9]{6}$/.test(normalized)) return false;

  const counter = Math.floor(nowMs / 1000 / 30);
  const secret = base32Decode(secretBase32);

  for (let w = -window; w <= window; w++) {
    if (hotp(secret, counter + w) === normalized) {
      return true;
    }
  }

  return false;
}
