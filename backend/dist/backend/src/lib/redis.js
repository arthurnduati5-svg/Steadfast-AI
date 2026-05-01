"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
const redis_1 = require("redis");
require("dotenv/config");
const logger_1 = require("../utils/logger");
const REDIS_URL = process.env.REDIS_URL;
const REDIS_CONNECT_COOLDOWN_MS = 30000;
const REDIS_MAX_RECONNECT_RETRIES = 5;
const REDIS_RECONNECT_MAX_DELAY_MS = 2000;
const REDIS_CONNECT_TIMEOUT_MS = Math.max(250, Number.parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || '800', 10) || 800);
if (!REDIS_URL) {
    logger_1.logger.warn('REDIS_URL is not defined in environment. Redis features will be disabled.');
}
let isConnecting = false;
let connectPromise = null;
let nextConnectAllowedAt = 0;
let lastCooldownLogAt = 0;
let loggedReady = false;
let loggedConnect = false;
const shouldThrottleCooldownLog = () => Date.now() - lastCooldownLogAt < 5000;
const enterCooldown = (reason) => {
    nextConnectAllowedAt = Date.now() + REDIS_CONNECT_COOLDOWN_MS;
    if (!shouldThrottleCooldownLog()) {
        lastCooldownLogAt = Date.now();
        logger_1.logger.warn(`[Redis] ${reason}. Cooling down for ${Math.round(REDIS_CONNECT_COOLDOWN_MS / 1000)}s.`);
    }
};
function withTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Redis connection timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        promise.then((value) => {
            clearTimeout(timer);
            resolve(value);
        }, (error) => {
            clearTimeout(timer);
            reject(error);
        });
    });
}
// Initialize client if URL is present.
const client = REDIS_URL
    ? (0, redis_1.createClient)({
        url: REDIS_URL,
        disableOfflineQueue: true,
        socket: {
            connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
            family: 4,
            reconnectStrategy: (retries) => {
                // Stop internal reconnect storm; getRedisClient() will retry after cooldown.
                if (retries >= REDIS_MAX_RECONNECT_RETRIES) {
                    enterCooldown('Too many reconnect attempts');
                    return false;
                }
                return Math.min(150 * (retries + 1), REDIS_RECONNECT_MAX_DELAY_MS);
            }
        }
    })
    : null;
if (client) {
    client.on('error', (err) => {
        const message = String(err?.message || '');
        if (message.includes('ECONNRESET') ||
            message.includes('Socket closed') ||
            message.includes('Connection timeout') ||
            message.includes('ETIMEDOUT')) {
            enterCooldown('Redis connectivity error');
            return;
        }
        logger_1.logger.error({ err: message }, '[Redis] Client Error');
    });
    client.on('connect', () => {
        if (!loggedConnect) {
            logger_1.logger.info('[Redis] Connected.');
            loggedConnect = true;
        }
    });
    client.on('ready', () => {
        if (!loggedReady) {
            logger_1.logger.info('[Redis] Ready.');
            loggedReady = true;
        }
        nextConnectAllowedAt = 0;
    });
    client.on('end', () => {
        loggedConnect = false;
        loggedReady = false;
    });
}
async function getRedisClient() {
    if (!client)
        return null;
    if (client.isOpen && client.isReady) {
        return client;
    }
    // Circuit breaker window after repeated failures/timeouts.
    if (Date.now() < nextConnectAllowedAt) {
        return null;
    }
    // Single-flight connect guard for concurrent callers.
    if (isConnecting || connectPromise) {
        return null;
    }
    if (client.isOpen && !client.isReady) {
        return null;
    }
    try {
        isConnecting = true;
        connectPromise = withTimeout(client.connect(), REDIS_CONNECT_TIMEOUT_MS + 150);
        await connectPromise;
        if (client.isOpen && client.isReady) {
            return client;
        }
        return null;
    }
    catch (error) {
        enterCooldown(error instanceof Error ? error.message : 'Connection failed');
        return null;
    }
    finally {
        isConnecting = false;
        connectPromise = null;
    }
}
//# sourceMappingURL=redis.js.map