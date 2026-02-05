import { createClient, RedisClientType } from 'redis';
import 'dotenv/config';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  logger.warn('REDIS_URL is not defined in environment. Redis features will be disabled.');
}

let isConnecting = false;

// Initialize client if URL is present
const client = REDIS_URL
  ? createClient({
    url: REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 15000,
      family: 4,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.warn('[Redis] Too many reconnect attempts. Cooling down.');
          return 5000;
        }
        return Math.min(retries * 100, 3000);
      }
    }
  })
  : null;

if (client) {
  client.on('error', (err) => {
    if (!err.message.includes('ECONNRESET') && !err.message.includes('Socket closed')) {
      logger.error({ err: err.message }, '[Redis] Client Error');
    }
  });

  client.on('connect', () => logger.info('[Redis] Connected.'));
  client.on('ready', () => logger.info('[Redis] Ready.'));
}

export async function getRedisClient(): Promise<any | null> {
  if (!client) return null;

  if (client.isOpen && client.isReady) {
    return client;
  }

  if (isConnecting) return null;

  try {
    isConnecting = true;
    await client.connect();
    isConnecting = false;
    return client;
  } catch (error) {
    isConnecting = false;
    logger.warn('[Redis] Connection failed. Using Database fallback.');
    return null;
  }
}
