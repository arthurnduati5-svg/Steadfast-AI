import { createClient, RedisClientType } from 'redis';
import 'dotenv/config';

const REDIS_URL = process.env.REDIS_URL || "redis://default:BTBiyWPQQzFYUFHDZrjnmNhRdnuQoLRd@caboose.proxy.rlwy.net:44313";

let clientInstance: RedisClientType | null = null;
let clientPromise: Promise<RedisClientType> | null = null;

async function connectRedis(): Promise<RedisClientType> {
  console.log(`Redis: Attempting to connect to ${REDIS_URL}`);
  const client = createClient({
    url: REDIS_URL,
  });

  client.on('error', async (err) => {
    console.error('Redis Client Error:', err);
    // If a critical error occurs, reset client instance to allow reconnection
    if (clientInstance && clientInstance.isOpen) {
      try {
        await clientInstance.disconnect();
      } catch (e) {
        console.error('Error disconnecting problematic Redis client:', e);
      }
    }
    clientInstance = null;
    clientPromise = null; // Clear the promise to allow new connection attempts
  });

  try {
    await client.connect();
    console.log('Redis: Successfully connected!');
    clientInstance = client as RedisClientType;
    return clientInstance;
  } catch (err) {
    console.error('Redis: Failed to connect:', err);
    if (client.isOpen) {
      await client.disconnect();
    }
    throw err; // Re-throw the error so callers can handle it
  }
}

export async function getRedisClient(): Promise<RedisClientType | null> {
  return null; // Temporarily disable Redis
}
