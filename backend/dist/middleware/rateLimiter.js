"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const redis_1 = __importDefault(require("../lib/redis"));
const RATE_LIMIT = 20; // Max requests per minute
const RATE_LIMIT_WINDOW = 60; // 60 seconds
const rateLimiter = async (req, res, next) => {
    try {
        // If redisClient is null, bypass rate limiting
        if (!redis_1.default) {
            console.warn('Redis client not available. Bypassing rate limiter.');
            return next();
        }
        const studentId = req.user?.id;
        if (!studentId) {
            return res.status(401).send({ error: "Unauthorized" });
        }
        const key = `rate:${studentId}`;
        const current = await redis_1.default.get(key);
        if (current && parseInt(current) >= RATE_LIMIT) {
            return res.status(429).send({ error: 'Too many requests' });
        }
        const newCurrent = await redis_1.default.incr(key);
        if (newCurrent === 1) {
            await redis_1.default.expire(key, RATE_LIMIT_WINDOW);
        }
        next();
    }
    catch (error) {
        // Log the error but still call next() to avoid blocking the request
        console.error('Error in rate limiter:', error);
        next(error);
    }
};
exports.rateLimiter = rateLimiter;
//# sourceMappingURL=rateLimiter.js.map