/**
 * Backend Dependency Check Service
 *
 * Checks whether critical backend dependencies are properly configured.
 * Uses existing Prisma/Redis clients safely without running destructive queries.
 */

import prisma from '../lib/prisma';
import { getRedisClient } from '../lib/redis';
import { getBackendReadinessConfig } from '../config/backendEnv';
import { buildBackendLogEvent, logBackendEvent } from './backendStructuredLoggerService';
import { buildAuditEvent, recordAuditEvent } from './backendAuditEventService';

export interface BackendDependencyCheckResult {
  name: string;
  ok: boolean;
  status: string;
  latencyMs?: number;
  required: boolean;
  configPresent: boolean;
  message: string;
}

export async function runBackendDependencyChecks(options?: {
  timeoutMs?: number;
}): Promise<BackendDependencyCheckResult[]> {
  const timeout = options?.timeoutMs || 5000;
  const start = Date.now();

  const results: BackendDependencyCheckResult[] = [];
  const config = getBackendReadinessConfig();

  // 1. Database (Prisma)
  const dbStart = Date.now();
  try {
    await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>('SELECT 1');
    results.push({
      name: 'database',
      ok: true,
      status: 'reachable',
      latencyMs: Date.now() - dbStart,
      required: true,
      configPresent: false,
      message: 'ok',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push({
      name: 'database',
      ok: false,
      status: 'unreachable',
      latencyMs: Date.now() - dbStart,
      required: true,
      configPresent: false,
      message: msg.length > 200 ? msg.slice(0, 200) : msg,
    });
  }

  // 2. Redis
  const redisStart = Date.now();
  try {
    const client = await getRedisClient();
    if (client) {
      await client.ping();
      results.push({
        name: 'redis',
        ok: true,
        status: 'reachable',
        latencyMs: Date.now() - redisStart,
        required: false,
        configPresent: config.hasRedisUrl,
        message: 'ok',
      });
    } else {
      results.push({
        name: 'redis',
        ok: false,
        status: config.hasRedisUrl ? 'unreachable' : 'not_configured',
        latencyMs: Date.now() - redisStart,
        required: false,
        configPresent: config.hasRedisUrl,
        message: config.hasRedisUrl ? 'Redis URL configured but client unavailable' : 'REDIS_URL not configured',
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push({
      name: 'redis',
      ok: false,
      status: 'unreachable',
      latencyMs: Date.now() - redisStart,
      required: false,
      configPresent: config.hasRedisUrl,
      message: msg.length > 200 ? msg.slice(0, 200) : msg,
    });
  }

  // 3. AI Provider (OpenAI)
  results.push({
    name: 'ai_provider',
    ok: config.hasOpenAiKey,
    status: config.hasOpenAiKey ? 'configured' : 'not_configured',
    required: true,
    configPresent: config.hasOpenAiKey,
    message: config.hasOpenAiKey ? 'OPENAI_API_KEY is configured' : 'OPENAI_API_KEY is not configured',
  });

  // 4. JWT Secret
  results.push({
    name: 'auth',
    ok: config.hasJwtSecret,
    status: config.hasJwtSecret ? 'configured' : 'not_configured',
    required: true,
    configPresent: config.hasJwtSecret,
    message: config.hasJwtSecret ? 'JWT_SECRET is configured' : 'JWT_SECRET is not configured',
  });

  // 5. Pinecone (optional vector/search)
  results.push({
    name: 'vector_search',
    ok: config.hasPineconeKey,
    status: config.hasPineconeKey ? 'configured' : 'not_configured',
    required: false,
    configPresent: config.hasPineconeKey,
    message: config.hasPineconeKey ? 'PINECONE_API_KEY is configured' : 'PINECONE_API_KEY not configured',
  });

  return results;
}

export async function checkBackendDependencies(options?: {
  timeoutMs?: number;
  requestId?: string;
  traceId?: string;
}): Promise<{
  ok: boolean;
  checks: BackendDependencyCheckResult[];
  failures: string[];
  warnings: string[];
}> {
  const checks = await runBackendDependencyChecks(options);
  const failures = checks.filter((c) => !c.ok && c.required).map((c) => `${c.name}: ${c.message}`);
  const warnings = checks.filter((c) => !c.ok && !c.required).map((c) => `${c.name}: ${c.message}`);

  const failedChecks = checks.filter((c) => !c.ok);
  for (const check of failedChecks) {
    const logEvent = buildBackendLogEvent({
      level: check.required ? 'error' : 'warn',
      eventType: 'dependency_check_failed',
      message: `Dependency ${check.name}: ${check.message}`,
      requestId: options?.requestId,
      traceId: options?.traceId,
      durationMs: check.latencyMs,
      errorCode: check.required ? 'DEPENDENCY_DOWN' : 'DEPENDENCY_DEGRADED',
    });
    logBackendEvent(logEvent);

    recordAuditEvent(buildAuditEvent({
      eventType: 'dependency_check_failed',
      requestId: options?.requestId,
      traceId: options?.traceId,
      route: '/api/health/dependencies',
      outcome: check.required ? 'failure' : 'partial',
      safeSummary: `Dependency check failed: ${check.name}`,
      minimumNecessary: true,
    }));
  }

  return {
    ok: failures.length === 0,
    checks,
    failures,
    warnings,
  };
}
