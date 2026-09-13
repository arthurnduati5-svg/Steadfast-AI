// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Tutor Runtime Diagnostics Service
// Produces safe operational snapshots of the tutor backend.
// Includes component status, metrics summary, recent incidents,
// and privacy metadata. No raw logs, chats, or prompts.
// ─────────────────────────────────────────────────────────────

import type {
  SafeDiagnosticSnapshot,
  RuntimeStatusCategory,
  TelemetryComponent,
  DiagnosticComponentSummary,
} from '../contracts/task018Contracts';
import { PRIVACY_CLEAN_METADATA } from '../contracts/task018Contracts';
import { checkAllComponents, resolveOverallHealth } from './task018ComponentHealthMonitorService';
import { getMetricsSnapshot } from './task018RuntimeMetricsCollector';
import { getRecentIncidents } from './task018SafeIncidentSummaryService';

export async function getDiagnosticSnapshot(input: {
  requestId: string;
  correlationId: string;
}): Promise<SafeDiagnosticSnapshot> {
  const componentStates = await checkAllComponents();
  const overallHealth = resolveOverallHealth(componentStates);
  const metricsSummary = getMetricsSnapshot();
  const recentIncidents = getRecentIncidents(20);

  const components: DiagnosticComponentSummary[] = componentStates.map((s) => ({
    component: s.component,
    status: s.health as RuntimeStatusCategory,
    health: s.health,
    readiness: s.readiness,
  }));

  return {
    requestId: input.requestId,
    correlationId: input.correlationId,
    status: overallHealth,
    summary: `Runtime ${overallHealth}: ${components.filter((c) => c.status !== 'healthy').length} components degraded`,
    components,
    metricsSummary,
    recentIncidents,
    privacyMetadata: PRIVACY_CLEAN_METADATA,
    generatedAt: new Date().toISOString(),
  };
}

export async function getMinimalDiagnosticStatus(): Promise<{
  status: RuntimeStatusCategory;
  summary: string;
}> {
  const states = await checkAllComponents();
  const health = resolveOverallHealth(states);
  return {
    status: health,
    summary: `Runtime ${health}`,
  };
}
