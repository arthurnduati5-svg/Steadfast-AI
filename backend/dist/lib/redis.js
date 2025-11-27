"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
let redisClient = null;
try {
    if (process.env.REDIS_URL) {
        redisClient = new ioredis_1.default(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        });
        console.log('Connected to Redis successfully!');
    }
    else {
        console.warn('REDIS_URL not found, Redis client not initialized.');
    }
}
catch (error) {
    console.error('Could not connect to Redis:', error);
}
exports.default = redisClient;
//# sourceMappingURL=redis.js.map