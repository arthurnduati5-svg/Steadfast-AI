import { createClient } from 'redis';
import 'dotenv/config';

type RedisRuntimeState = {
  client: ReturnType<typeof createClient> | null;
  listenersAttached: boolean;
  isConnecting: boolean;
  connectPromise: Promise<unknown> | null;
  nextConnectAllowedAt: number;
  lastCooldownLogAt: number;
  loggedReady: boolean;
  loggedConnect: boolean;
};

type RedisGlobal = {
  __steadfastRedisState?: RedisRuntimeState;
};

const REDIS_URL = process.env.REDIS_URL;
const REDIS_CONNECT_COOLDOWN_MS = 30000;
const REDIS_MAX_RECONNECT_RETRIES = 5;
const REDIS_RECONNECT_MAX_DELAY_MS = 2000;
const REDIS_CONNECT_TIMEOUT_MS = Math.max(
  250,
  Number.parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || '800', 10) || 800
);

const redisGlobal = globalThis as typeof globalThis & RedisGlobal;

function createInitialState(): RedisRuntimeState {
  const client = REDIS_URL
    ? createClient({
        url: REDIS_URL,
        disableOfflineQueue: true,
        socket: {
          connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
          reconnectStrategy: (retries) => {
            if (retries >= REDIS_MAX_RECONNECT_RETRIES) {
              return false;
            }
            return Math.min(150 * (retries + 1), REDIS_RECONNECT_MAX_DELAY_MS);
          },
        },
      })
    : null;

  return {
    client,
    listenersAttached: false,
    isConnecting: false,
    connectPromise: null,
    nextConnectAllowedAt: 0,
    lastCooldownLogAt: 0,
    loggedReady: false,
    loggedConnect: false,
  };
}

const state = redisGlobal.__steadfastRedisState || createInitialState();
if (!redisGlobal.__steadfastRedisState) {
  redisGlobal.__steadfastRedisState = state;
}

const shouldThrottleCooldownLog = () => Date.now() - state.lastCooldownLogAt < 5000;
const enterCooldown = (reason: string) => {
  state.nextConnectAllowedAt = Date.now() + REDIS_CONNECT_COOLDOWN_MS;
  if (!shouldThrottleCooldownLog()) {
    state.lastCooldownLogAt = Date.now();
    console.warn(`[Redis] ${reason}. Cooling down for ${Math.round(REDIS_CONNECT_COOLDOWN_MS / 1000)}s.`);
  }
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Redis connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

if (!REDIS_URL) {
  console.warn('[Redis] REDIS_URL not configured. Redis-backed optimizations are disabled.');
}

if (state.client && !state.listenersAttached) {
  state.listenersAttached = true;

  state.client.on('error', (err) => {
    const message = String(err?.message || '');
    if (
      message.includes('ECONNRESET') ||
      message.includes('Socket closed') ||
      message.includes('Connection timeout') ||
      message.includes('ETIMEDOUT')
    ) {
      enterCooldown('Redis connectivity error');
      return;
    }
    console.error('[Redis] Client Error:', message);
  });

  state.client.on('connect', () => {
    if (!state.loggedConnect) {
      console.log('[Redis] Connected.');
      state.loggedConnect = true;
    }
  });

  state.client.on('ready', () => {
    if (!state.loggedReady) {
      console.log('[Redis] Ready.');
      state.loggedReady = true;
    }
    state.nextConnectAllowedAt = 0;
  });

  state.client.on('end', () => {
    state.loggedConnect = false;
    state.loggedReady = false;
  });
}

export async function getRedisClient(): Promise<ReturnType<typeof createClient> | null> {
  const client = state.client;
  if (!client) return null;

  if (client.isOpen && client.isReady) {
    return client;
  }

  if (Date.now() < state.nextConnectAllowedAt) {
    return null;
  }

  if (state.isConnecting || state.connectPromise) {
    return null;
  }

  if (client.isOpen && !client.isReady) {
    return null;
  }

  try {
    state.isConnecting = true;
    state.connectPromise = withTimeout(client.connect(), REDIS_CONNECT_TIMEOUT_MS + 150);
    await state.connectPromise;
    if (client.isOpen && client.isReady) {
      return client;
    }
    return null;
  } catch (error) {
    enterCooldown(error instanceof Error ? error.message : 'Connection failed');
    return null;
  } finally {
    state.isConnecting = false;
    state.connectPromise = null;
  }
}
