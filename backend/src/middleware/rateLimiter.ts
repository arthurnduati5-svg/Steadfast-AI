import { Request, Response, NextFunction } from 'express';
import redis from '../lib/redis';

const RATE_LIMIT = 20; // Max requests per minute
const RATE_LIMIT_WINDOW = 60; // 60 seconds

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.currentUser?.userId;

    if (!studentId) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const key = `rate:${studentId}`;
    const current = await redis.get(key);

    if (current && parseInt(current) >= RATE_LIMIT) {
      return res.status(429).send({ error: 'Too many requests' });
    }

    await redis.multi().incr(key).expire(key, RATE_LIMIT_WINDOW).exec();

    next();
  } catch (error) {
    console.error('Error in rate limiter:', error);
    next();
  }
};
