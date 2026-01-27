import { createClient, RedisClientType } from 'redis';
import 'dotenv/config';

const REDIS_URL = process.env.REDIS_URL || "redis://default:IPiAvuqGvjkFPREUfxmIgufgeGXomuiU@nozomi.proxy.rlwy.net:54286";

let clientInstance: RedisClientType | null = null;
let isConnecting = false;

// Initialize client immediately but don't connect yet
const client = createClient({
  url: REDIS_URL,
  // CRITICAL: Fail fast if disconnected. 
  // Don't queue commands in memory (which causes hangs/crashes if Redis is down)
  disableOfflineQueue: true,
  socket: {
    connectTimeout: 15000, // Increased to 15 seconds for remote Railway
    family: 4,            // Force IPv4 to avoid IPv6 issues on Windows
    reconnectStrategy: (retries) => {
      // Exponential backoff: wait longer between retries, max 3 seconds
      // If retries > 10, stop trying for a while (return error) to stop log spam
      if (retries > 10) {
        console.warn('[Redis] Too many reconnect attempts. Cooling down.');
        return 5000;
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Global error handler to prevent crashing the process
client.on('error', (err) => {
  // Suppress the log spam for common connectivity issues
  if (err.message.includes('ECONNRESET') || err.message.includes('Socket closed')) {
    // Silent fail or low-level debug
    // console.debug('[Redis] Connection lost (handled).'); 
  } else {
    console.error('[Redis] Client Error:', err.message);
  }
});

client.on('connect', () => console.log('[Redis] Connected.'));
client.on('ready', () => console.log('[Redis] Ready.'));
client.on('end', () => { /* Connection closed */ });

export async function getRedisClient(): Promise<RedisClientType | null> {
  // If ready, return immediately
  if (client.isOpen && client.isReady) {
    return client as RedisClientType;
  }

  // If already connecting, return null (fallback to DB) rather than queueing
  if (isConnecting) {
    return null;
  }

  try {
    isConnecting = true;
    await client.connect();
    isConnecting = false;
    return client as RedisClientType;
  } catch (error) {
    isConnecting = false;
    // Don't throw. Return null so the app falls back to the Database.
    console.warn('[Redis] Connection failed. Using Database fallback.');
    return null;
  }
}