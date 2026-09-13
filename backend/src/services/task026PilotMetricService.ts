import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import type { PilotMetricSnapshot } from '../contracts/task026PilotExecutionContracts';

export async function recordMetricSnapshot(input: PilotMetricSnapshot): Promise<{
  ok: boolean;
  snapshotId?: string;
  reasonCodes: string[];
  safeMessage: string;
}> {
  if (!input.executionRunId || !input.pilotProgramId || !input.schoolId) {
    return { ok: false, reasonCodes: ['missing_required_fields'], safeMessage: 'Required fields missing.' };
  }

  const snapshot = await task026PilotExecutionRepository.createMetricSnapshot({
    executionRunId: input.executionRunId,
    pilotProgramId: input.pilotProgramId,
    schoolId: input.schoolId,
    activeSessions: input.activeSessions ?? 0,
    allowedSessionStarts: input.allowedSessionStarts ?? 0,
    blockedSessionStarts: input.blockedSessionStarts ?? 0,
    pilotAccessDeniedCount: input.pilotAccessDeniedCount ?? 0,
    curriculumGateBlockCount: input.curriculumGateBlockCount ?? 0,
    schoolAuthGateBlockCount: input.schoolAuthGateBlockCount ?? 0,
    socraticGateBlockCount: input.socraticGateBlockCount ?? 0,
    deenGateBlockCount: input.deenGateBlockCount ?? 0,
    privacyGateBlockCount: input.privacyGateBlockCount ?? 0,
    aiCallBlockedCount: input.aiCallBlockedCount ?? 0,
    aiCallAllowedCount: input.aiCallAllowedCount ?? 0,
    feedbackCount: input.feedbackCount ?? 0,
    safetySignalCount: input.safetySignalCount ?? 0,
    incidentBridgeCount: input.incidentBridgeCount ?? 0,
    p95LatencyMs: input.p95LatencyMs,
    errorCount: input.errorCount ?? 0,
    metadataSafeJson: input.metadataSafeJson ?? {},
  });

  return {
    ok: true,
    snapshotId: (snapshot as any).id,
    reasonCodes: [],
    safeMessage: 'Metric snapshot recorded.',
  };
}

export async function getLatestMetrics(executionRunId: string): Promise<PilotMetricSnapshot | null> {
  const snapshots = await task026PilotExecutionRepository.listMetricSnapshots(executionRunId);
  if (snapshots.length === 0) return null;
  const latest = snapshots[0] as any;
  return {
    executionRunId: latest.executionRunId,
    pilotProgramId: latest.pilotProgramId,
    schoolId: latest.schoolId,
    activeSessions: latest.activeSessions,
    allowedSessionStarts: latest.allowedSessionStarts,
    blockedSessionStarts: latest.blockedSessionStarts,
    pilotAccessDeniedCount: latest.pilotAccessDeniedCount,
    curriculumGateBlockCount: latest.curriculumGateBlockCount,
    schoolAuthGateBlockCount: latest.schoolAuthGateBlockCount,
    socraticGateBlockCount: latest.socraticGateBlockCount,
    deenGateBlockCount: latest.deenGateBlockCount,
    privacyGateBlockCount: latest.privacyGateBlockCount,
    aiCallBlockedCount: latest.aiCallBlockedCount,
    aiCallAllowedCount: latest.aiCallAllowedCount,
    feedbackCount: latest.feedbackCount,
    safetySignalCount: latest.safetySignalCount,
    incidentBridgeCount: latest.incidentBridgeCount,
    p95LatencyMs: latest.p95LatencyMs,
    errorCount: latest.errorCount,
    metadataSafeJson: latest.metadataSafeJson,
  };
}
