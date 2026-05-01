"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const redis_1 = require("../lib/redis");
const RATE_LIMIT = 20; // Max requests per minute
const RATE_LIMIT_WINDOW = 60; // 60 seconds
const rateLimiter = async (req, res, next) => {
    const redis = await (0, redis_1.getRedisClient)();
    if (!redis) {
        console.warn('Redis client not available. Bypassing rate limiter.');
        return next();
    }
    try {
        const studentId = req.user?.id;
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
    }
    catch (error) {
        // Fail open on limiter issues to avoid cascading outages.
        console.error('Error in rate limiter:', error);
        next();
    }
};
exports.rateLimiter = rateLimiter;
//# sourceMappingURL=rateLimiter.js.map