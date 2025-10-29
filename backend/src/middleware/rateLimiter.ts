import { Request, Response, NextFunction } from 'express';
import redis from '../lib/redis';

const RATE_LIMIT = 20; // Max requests per minute
const RATE_LIMIT_WINDOW = 60; // 60 seconds

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const key = `rate:${studentId}`;
    const current = await redis.get(key);

    if (current && parseInt(current) >= RATE_LIMIT) {
      return res.status(429).send({ error: 'Too many requests' });
    }

    const newCurrent = await redis.incr(key);

    if (newCurrent === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    next();
  } catch (error) {
    next(error);
  }
};
