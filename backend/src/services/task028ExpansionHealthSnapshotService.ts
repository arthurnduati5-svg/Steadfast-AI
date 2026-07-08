import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { EXPANSION_HEALTH_STATUSES, nowISO } from '../contracts/task028ExpansionExecutionContracts';
import type { ExpansionHealthSnapshotInput, ExpansionHealthStatus } from '../contracts/task028ExpansionExecutionContracts';

export interface HealthSnapshotResult {
  ok: boolean;
  snapshotId?: string;
  healthStatus: ExpansionHealthStatus;
  reasonCodes: string[];
  safeMessage: string;
}

export async function createHealthSnapshot(input: ExpansionHealthSnapshotInput): Promise<HealthSnapshotResult> {
  if (!input.executionRunId || !input.pilotProgramId || !input.schoolId) {
    return { ok: false, healthStatus: 'critical', reasonCodes: ['missing_required_fields'], safeMessage: 'Required fields missing.' };
  }

  const healthStatus = classifyHealth(input);

  const snapshot = await task028ExpansionExecutionRepository.createHealthSnapshot({
    executionRunId: input.executionRunId,
    stageId: input.stageId,
    pilotProgramId: input.pilotProgramId,
    schoolId: input.schoolId,
    activeExpandedSessions: input.activeExpandedSessions ?? 0,
    allowedExpandedSessionStarts: input.allowedExpandedSessionStarts ?? 0,
    blockedExpandedSessionStarts: input.blockedExpandedSessionStarts ?? 0,
    schoolAuthBlocks: input.schoolAuthBlocks ?? 0,
    cohortScopeBlocks: input.cohortScopeBlocks ?? 0,
    curriculumGateBlocks: input.curriculumGateBlocks ?? 0,
    socraticGateBlocks: input.socraticGateBlocks ?? 0,
    deenGateBlocks: input.deenGateBlocks ?? 0,
    privacyGateBlocks: input.privacyGateBlocks ?? 0,
    aiCallBlocks: input.aiCallBlocks ?? 0,
    memoryAccessBlocks: input.memoryAccessBlocks ?? 0,
    evidenceWriteBlocks: input.evidenceWriteBlocks ?? 0,
    feedbackCount: input.feedbackCount ?? 0,
    oversightItemCount: input.oversightItemCount ?? 0,
    interventionCount: input.interventionCount ?? 0,
    incidentBridgeCount: input.incidentBridgeCount ?? 0,
    errorCount: input.errorCount ?? 0,
    p95LatencyMs: input.p95LatencyMs,
    safeSummary: input.safeSummary || 'Health snapshot recorded.',
    metadataSafeJson: {
      ...(input.metadataSafeJson ?? {}),
      healthStatus,
      timestamp: nowISO(),
    },
  });

  return {
    ok: true,
    snapshotId: (snapshot as any).id,
    healthStatus,
    reasonCodes: healthStatus === 'critical' ? ['critical_health'] : healthStatus === 'degraded' ? ['degraded_health'] : healthStatus === 'watch' ? ['watch_health'] : [],
    safeMessage: `Health snapshot recorded. Status: ${healthStatus}.`,
  };
}

export function classifyHealth(input: ExpansionHealthSnapshotInput): ExpansionHealthStatus {
  if (input.privacyGateBlocks > 0 || input.deenGateBlocks > 0) {
    return 'critical';
  }

  if (input.aiCallBlocks > 0) {
    return 'critical';
  }

  if (input.socraticGateBlocks > 0) {
    if (input.socraticGateBlocks > 5) return 'critical';
    return 'degraded';
  }

  if (input.errorCount > 100 || input.blockedExpandedSessionStarts > 200) {
    return 'critical';
  }

  if (input.errorCount > 50 || input.blockedExpandedSessionStarts > 100) {
    return 'degraded';
  }

  if (input.errorCount > 20 || input.blockedExpandedSessionStarts > 50 || input.p95LatencyMs && input.p95LatencyMs > 5000) {
    return 'watch';
  }

  if (input.curriculumGateBlocks > 0 || input.schoolAuthBlocks > 0) {
    if (input.curriculumGateBlocks > 10 || input.schoolAuthBlocks > 10) return 'degraded';
    return 'watch';
  }

  return 'healthy';
}

export { EXPANSION_HEALTH_STATUSES };
