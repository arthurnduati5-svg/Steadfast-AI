"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
require("dotenv/config");
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
    console.error('REDIS_URL environment variable is not set. Please set it to connect to Redis.');
    process.exit(1);
}
async function checkRedis() {
    console.log(`Checking Redis connection to: ${REDIS_URL?.split('@')[1] || 'URL'}`);
    const client = new ioredis_1.default(REDIS_URL, {
        connectTimeout: 5000,
        maxRetriesPerRequest: 1
    });
    client.on('error', (err) => {
        // console.error('Redis Client Error', err.message);
    });
    try {
        // ioredis connects automatically, but we can wait for ready
        await new Promise((resolve, reject) => {
            client.once('ready', resolve);
            client.once('error', reject);
            // Timeout if not ready in 5s
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });
        console.log('Successfully connected to Redis.');
        const pong = await client.ping();
        console.log(`Redis PING response: ${pong}`);
        await client.quit();
        console.log('Redis client disconnected.');
        process.exit(0);
    }
    catch (err) {
        console.error('Failed to connect or ping Redis:', err.message);
        client.disconnect();
        process.exit(1);
    }
}
checkRedis();
//# sourceMappingURL=checkRedis.js.map