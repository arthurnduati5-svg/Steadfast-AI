import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../lib/redis';

const RATE_LIMIT = 20; // Max requests per minute
const RATE_LIMIT_WINDOW = 60; // 60 seconds

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const redis = await getRedisClient();

  if (!redis) {
    console.warn('Redis client not available. Bypassing rate limiter.');
    return next();
  }

  try {
    const studentId = (req as Request & { user?: { id?: string } }).user?.id;

    if (!studentId) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const key = `rate:${studentId}`;
    const ttl = await redis.ttl(key);
    const current = await redis.get(key);

    if (current && parseInt(current, 10) >= RATE_LIMIT) {
      if (ttl > 0) {
        res.setHeader('Retry-After', String(ttl));
        res.setHeader('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + ttl));
      }
      return res.status(429).send({ error: 'Too many requests' });
    }

    const newCurrent = await redis.incr(key);

    if (newCurrent === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    next();
  } catch (error) {
    // Fail open on limiter issues to avoid cascading outages.
    console.error('Error in rate limiter:', error);
    next();
  }
};
