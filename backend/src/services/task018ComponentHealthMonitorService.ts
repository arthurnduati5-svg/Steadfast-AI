// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Component Health Monitor Service
// Provides component-level health and readiness checks.
// All components return safe status without raw internals.
// ─────────────────────────────────────────────────────────────

import type {
  ComponentHealthState,
  ComponentHealthStatus,
  ComponentReadinessStatus,
  TelemetryComponent,
} from '../contracts/task018Contracts';

const COMPONENTS: TelemetryComponent[] = [
  'conversation_api',
  'streaming_runtime',
  'session_runtime',
  'learning_loop_runtime',
  'evidence_pipeline',
  'ai_gateway',
  'prisma_client',
  'audit_runtime',
  'idempotency_runtime',
  'policy_guards',
  'deen_boundary',
  'safeguarding_boundary',
];

const DEFAULT_TIMEOUT_MS = 3000;

type ComponentCheck = () => Promise<{ health: ComponentHealthStatus; readiness: ComponentReadinessStatus; latencyMs: number; message: string }>;

const checkRegistry = new Map<TelemetryComponent, ComponentCheck>();

export function registerComponentCheck(
  component: TelemetryComponent,
  check: ComponentCheck,
): void {
  checkRegistry.set(component, check);
}

function createDefaultCheck(
  component: TelemetryComponent,
): ComponentCheck {
  return async () => ({
    health: 'healthy' as ComponentHealthStatus,
    readiness: 'ready' as ComponentReadinessStatus,
    latencyMs: 0,
    message: `${component} enabled`,
  });
}

export async function checkComponentHealth(
  component: TelemetryComponent,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ComponentHealthState> {
  const check = checkRegistry.get(component) || createDefaultCheck(component);

  try {
    const result = await Promise.race([
      check(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs),
      ),
    ]);

    return {
      component,
      health: result.health,
      readiness: result.readiness,
      lastCheckedMs: Date.now(),
      latencyMs: result.latencyMs,
      safeMessage: result.message,
    };
  } catch {
    return {
      component,
      health: 'unavailable',
      readiness: 'not_ready',
      lastCheckedMs: Date.now(),
      safeMessage: `${component} check failed`,
    };
  }
}

export async function checkAllComponents(
  timeoutMs?: number,
): Promise<ComponentHealthState[]> {
  const results = await Promise.all(
    COMPONENTS.map((c) => checkComponentHealth(c, timeoutMs)),
  );
  return results;
}

export function resolveOverallHealth(
  states: ComponentHealthState[],
): 'healthy' | 'degraded' | 'unavailable' {
  const hasUnavailable = states.some((s) => s.health === 'unavailable');
  const hasDegraded = states.some((s) => s.health === 'degraded');

  if (hasUnavailable) return 'unavailable';
  if (hasDegraded) return 'degraded';
  return 'healthy';
}

export function getRegisteredComponents(): TelemetryComponent[] {
  return [...COMPONENTS];
}
