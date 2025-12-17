/**
 * Simple AES-256-GCM encryption helper for secrets-at-rest.
 *
 * SECURITY NOTES:
 * - Never store a raw TOTP secret in plaintext in your DB.
 * - AES-GCM provides confidentiality + integrity (auth tag).
 * - In production you should rotate keys and use a KMS (AWS KMS, GCP KMS, Vault).
 */

import crypto from 'crypto';

const VERSION = 'v1';

function deriveKey(keyMaterial: string): Buffer {
  // Derive a fixed 32-byte key.
  // In production, prefer a real KDF (scrypt/argon2) if the input isn't already high entropy.
  return crypto.createHash('sha256').update(keyMaterial).digest();
}

export function encryptString(plaintext: string, keyMaterial: string): string {
  const key = deriveKey(keyMaterial);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
}

export function decryptString(payload: string, keyMaterial: string): string {
  const [version, ivB64, tagB64, ciphertextB64] = payload.split(':');
  if (version !== VERSION || !ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error('Invalid encrypted payload format');
  }

  const key = deriveKey(keyMaterial);
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
