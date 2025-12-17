/**
 * Very small in-memory rate limiter.
 *
 * SECURITY NOTES:
 * - Rate limiting helps mitigate brute-force password guessing and credential stuffing.
 * - In-memory limits reset on server restart and don't work across multiple instances.
 * - In production, prefer a shared store (Redis) or a gateway/WAF rate limiter.
 */

import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../utils/errors';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix: string;
  keyGenerator?: (req: Request) => string;
};

type Bucket = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix, keyGenerator } = options;

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();

    const key = `${keyPrefix}:${keyGenerator ? keyGenerator(req) : req.ip}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);

      return next(
        new TooManyRequestsError('Too many requests. Please try again later.', {
          retryAfterSeconds,
        })
      );
    }

    next();
  };
}
