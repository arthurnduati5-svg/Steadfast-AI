// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Runtime Readiness Gate Service
// Determines if the tutor backend is ready to serve requests.
// Does not call live external AI providers unless explicitly
// configured for a safe readiness probe.
// ─────────────────────────────────────────────────────────────

import type {
  OperationReadinessCheck,
  OperationReadinessResponse,
  ComponentReadinessStatus,
  TelemetryComponent,
} from '../contracts/task018Contracts';

interface ReadinessProbe {
  component: TelemetryComponent;
  required: boolean;
  probe: () => Promise<{ ok: boolean; message: string; latencyMs?: number }>;
}

const probes: ReadinessProbe[] = [];

export function registerReadinessProbe(probe: ReadinessProbe): void {
  probes.push(probe);
}

function resolveReadinessStatus(ok: boolean, required: boolean): ComponentReadinessStatus {
  if (ok) return 'ready';
  return required ? 'not_ready' : 'degraded';
}

export async function getRuntimeReadiness(
  requestId: string,
): Promise<OperationReadinessResponse> {
  if (probes.length === 0) {
    return {
      ready: true,
      status: 'ready',
      checks: [],
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  const results = await Promise.all(
    probes.map(async (probe) => {
      try {
        const result = await probe.probe();
        return {
          component: probe.component,
          status: resolveReadinessStatus(result.ok, probe.required),
          safeMessage: result.message,
          required: probe.required,
          latencyMs: result.latencyMs,
        } satisfies OperationReadinessCheck;
      } catch {
        return {
          component: probe.component,
          status: resolveReadinessStatus(false, probe.required),
          safeMessage: `${probe.component} probe failed`,
          required: probe.required,
        } satisfies OperationReadinessCheck;
      }
    }),
  );

  const failedRequired = results.filter((r) => r.status === 'not_ready');
  const degraded = results.filter((r) => r.status === 'degraded');
  const allReady = failedRequired.length === 0;

  return {
    ready: allReady,
    status: allReady
      ? degraded.length > 0 ? 'degraded' : 'ready'
      : 'not_ready',
    checks: results,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function clearReadinessProbesForTests(): void {
  probes.length = 0;
}
