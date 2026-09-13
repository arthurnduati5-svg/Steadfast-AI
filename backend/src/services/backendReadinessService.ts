/**
 * Backend Readiness Service
 *
 * Checks whether the backend is ready to serve real traffic.
 * Delegates to existing readiness logic in routes/readiness.ts.
 */

import prisma from '../lib/prisma';
import { getRedisClient } from '../lib/redis';
import { getBackendReadinessConfig } from '../config/backendEnv';
import { validateBackendEnvSchema } from './backendEnvSchema';

export interface BackendReadinessCheck {
  name: string;
  ok: boolean;
  status: string;
  latencyMs?: number;
  required: boolean;
  message: string;
}

export interface BackendReadinessResult {
  ok: boolean;
  status: 'ready' | 'degraded' | 'not_ready';
  timestamp: string;
  checks: BackendReadinessCheck[];
  warnings: string[];
}

async function checkDatabase(timeoutMs = 3000): Promise<BackendReadinessCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>('SELECT 1');
    return {
      name: 'database',
      ok: true,
      status: 'reachable',
      latencyMs: Date.now() - start,
      required: true,
      message: 'ok',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: 'database',
      ok: false,
      status: 'unreachable',
      latencyMs: Date.now() - start,
      required: true,
      message: message.length > 200 ? message.slice(0, 200) : message,
    };
  }
}

async function checkRedis(timeoutMs = 2000): Promise<BackendReadinessCheck> {
  const start = Date.now();
  try {
    const client = await getRedisClient();
    if (!client) {
      return {
        name: 'redis',
        ok: false,
        status: 'not_configured',
        latencyMs: Date.now() - start,
        required: false,
        message: 'Redis URL not configured — caching features unavailable',
      };
    }
    await client.ping();
    return {
      name: 'redis',
      ok: true,
      status: 'reachable',
      latencyMs: Date.now() - start,
      required: false,
      message: 'ok',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: 'redis',
      ok: false,
      status: 'unreachable',
      latencyMs: Date.now() - start,
      required: false,
      message: message.length > 200 ? message.slice(0, 200) : message,
    };
  }
}

function checkAi(): BackendReadinessCheck {
  const config = getBackendReadinessConfig();
  if (config.hasOpenAiKey) {
    return {
      name: 'ai_provider',
      ok: true,
      status: 'configured',
      required: true,
      message: 'OpenAI API key is configured',
    };
  }
  return {
    name: 'ai_provider',
    ok: false,
    status: 'not_configured',
    required: true,
    message: 'OPENAI_API_KEY is not configured — AI features unavailable',
  };
}

function checkEnv(): BackendReadinessCheck {
  const envResult = validateBackendEnvSchema();
  const errors = envResult.issues.filter((i) => i.severity === 'error');
  return {
    name: 'environment',
    ok: errors.length === 0,
    status: errors.length === 0 ? 'valid' : 'invalid',
    required: true,
    message: errors.length > 0
      ? `Missing required env: ${errors.map((e) => e.key).join(', ')}`
      : 'Environment is valid',
  };
}

export async function getBackendReadiness(): Promise<BackendReadinessResult> {
  const [dbCheck, redisCheck, aiCheck, envCheck] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkAi(),
    checkEnv(),
  ]);

  const checks = [envCheck, dbCheck, redisCheck, aiCheck];

  const failedRequired = checks.filter((c) => !c.ok && c.required);
  const failedOptional = checks.filter((c) => !c.ok && !c.required);
  const warnings = failedOptional.map((c) => c.message);

  const allOk = failedRequired.length === 0;
  const status: 'ready' | 'degraded' | 'not_ready' = allOk
    ? warnings.length > 0 ? 'degraded' : 'ready'
    : 'not_ready';

  return {
    ok: allOk,
    status,
    timestamp: new Date().toISOString(),
    checks,
    warnings,
  };
}

// Re-export individual check functions for testing
export { checkDatabase, checkRedis, checkAi, checkEnv };
