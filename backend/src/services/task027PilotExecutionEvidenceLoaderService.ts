import {
  Task027PilotExecutionEvidenceInput,
  Task027PilotExecutionEvidenceSummary,
  TASK027_FORBIDDEN_FIELDS,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

type EvidenceSummaryWithExtras = Task027PilotExecutionEvidenceSummary & {
  teacherMonitoringSnapshotSafeSummary?: Record<string, unknown>;
  dailyPilotSummarySafeMetadata?: Record<string, unknown>;
};

export async function loadPilotExecutionEvidence(
  input: Task027PilotExecutionEvidenceInput
): Promise<{
  ok: boolean;
  evidence: Task027PilotExecutionEvidenceSummary | null;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const blockingIssues: string[] = [];

  const raw = await govRepo.getEvidenceSummary(input.schoolId, input.pilotRunId);
  if (!raw) {
    blockingIssues.push(`No pilot execution evidence found for school ${input.schoolId}, pilot ${input.pilotRunId}`);
    return {
      ok: false,
      evidence: null,
      blockingIssues,
      safeMessage: 'Pilot execution evidence not available.',
    };
  }

  const rawSummary = raw.summary ?? raw;
  const forbiddenFound: string[] = [];

  for (const key of Object.keys(rawSummary)) {
    if ((TASK027_FORBIDDEN_FIELDS as readonly string[]).includes(key)) {
      forbiddenFound.push(key);
    }
  }

  if (forbiddenFound.length > 0) {
    blockingIssues.push(`Evidence contains forbidden fields: ${forbiddenFound.join(', ')}`);
    return {
      ok: false,
      evidence: null,
      blockingIssues,
      safeMessage: `Pilot execution evidence rejected: contains forbidden data fields.`,
    };
  }

  const safeSummary: Task027PilotExecutionEvidenceSummary = {
    pilotRunId: rawSummary.pilotRunId ?? input.pilotRunId,
    schoolId: rawSummary.schoolId ?? input.schoolId,
    cohortSafeCount: rawSummary.cohortSafeCount ?? 0,
    sessionsStartedCount: rawSummary.sessionsStartedCount ?? 0,
    sessionsBlockedCount: rawSummary.sessionsBlockedCount ?? 0,
    supportNeededCount: rawSummary.supportNeededCount ?? 0,
    incidentCount: rawSummary.incidentCount ?? 0,
    safeguardingSignalCount: rawSummary.safeguardingSignalCount ?? 0,
    pauseCount: rawSummary.pauseCount ?? 0,
    rollbackCount: rawSummary.rollbackCount ?? 0,
    safeLearningQualitySignals: rawSummary.safeLearningQualitySignals ?? {},
    safeSocraticIntegritySignals: rawSummary.safeSocraticIntegritySignals ?? {},
    safeContentGovernanceSignals: rawSummary.safeContentGovernanceSignals ?? {},
    safeOperationsSignals: rawSummary.safeOperationsSignals ?? {},
  };

  (safeSummary as EvidenceSummaryWithExtras).teacherMonitoringSnapshotSafeSummary =
    (rawSummary as any).teacherMonitoringSnapshotSafeSummary ?? {};
  (safeSummary as EvidenceSummaryWithExtras).dailyPilotSummarySafeMetadata =
    (rawSummary as any).dailyPilotSummarySafeMetadata ?? {};

  return {
    ok: true,
    evidence: safeSummary,
    blockingIssues: [],
    safeMessage: 'Pilot execution evidence loaded and verified successfully.',
  };
}
