/**
 * Cookie helpers.
 *
 * We avoid adding a dependency (cookie-parser) just for this demo.
 * In production, a well-tested parser is recommended.
 */

import { Request } from 'express';

export function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  const parts = header.split(';');
  for (const part of parts) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) {
      return decodeURIComponent(v.join('='));
    }
  }

  return undefined;
}
