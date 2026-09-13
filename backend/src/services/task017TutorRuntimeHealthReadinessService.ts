import type { TutorRuntimeHealthStatus, TutorRuntimeReadinessStatus } from './task017Contracts';

export function getTutorRuntimeHealth(requestId: string): TutorRuntimeHealthStatus {
  return {
    ok: true,
    status: 'healthy',
    service: 'tutor-conversation-runtime',
    uptimeSec: Math.max(1, Math.round(process.uptime())),
    version: process.env.npm_package_version || 'unknown',
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export async function getTutorRuntimeReadiness(requestId: string): Promise<TutorRuntimeReadinessStatus> {
  const checks: Record<string, { ok: boolean; status: string }> = {
    serverProcess: { ok: true, status: 'alive' },
  };

  const degraded: string[] = [];

  try {
    const { getBackendLiveness } = await import('./backendHealthService');
    const liveness = getBackendLiveness();
    checks.serverProcess = { ok: (liveness as any).status === 'ok' || liveness.status === 'live', status: liveness.status };
  } catch {
    checks.serverProcess = { ok: false, status: 'error' };
    degraded.push('server_process');
  }

  try {
    const { getBackendReadiness } = await import('./backendReadinessService');
    const readiness = await getBackendReadiness();
    checks.prismaClient = { ok: readiness.ok, status: readiness.ok ? 'available' : 'unavailable' };
    if (!readiness.ok) degraded.push('database');
  } catch {
    checks.prismaClient = { ok: false, status: 'error' };
    degraded.push('database');
  }

  try {
    const { validateBackendEnv } = await import('../config/backendEnv');
    const env = validateBackendEnv();
    checks.envConfig = { ok: env.ok, status: env.ok ? 'valid' : 'invalid' };
    if (!env.ok) degraded.push('env');
  } catch {
    checks.envConfig = { ok: false, status: 'error' };
    degraded.push('env');
  }

  try {
    const { runEndToEndLearningLoop } = await import('./endToEndLearningLoopRuntime');
    checks.sessionRuntime = { ok: true, status: 'importable' };
  } catch {
    checks.sessionRuntime = { ok: false, status: 'unavailable' };
    degraded.push('session_runtime');
  }

  try {
    const { TutorConversationApiRuntime } = await import('./task017TutorConversationApiRuntime');
    checks.conversationRuntime = { ok: true, status: 'importable' };
  } catch {
    checks.conversationRuntime = { ok: false, status: 'unavailable' };
    degraded.push('conversation_runtime');
  }

  try {
    const { createStreamEvent } = await import('./task017StreamingEventContractService');
    checks.streamingContract = { ok: true, status: 'importable' };
  } catch {
    checks.streamingContract = { ok: false, status: 'unavailable' };
    degraded.push('streaming_contract');
  }

  const allOk = Object.values(checks).every(c => c.ok);

  return {
    ok: allOk,
    service: 'tutor-conversation-runtime',
    checks,
    degraded,
    timestamp: new Date().toISOString(),
  };
}
