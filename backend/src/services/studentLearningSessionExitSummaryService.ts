import type {
  StudentLearningSessionRecord,
  StudentLearningSessionMode,
  StudentLearningSessionExitSummary,
  StudentLearningSessionStatus,
  StudentLearningSessionReasonCode,
  StudentLearningSessionSourceTruthStatus,
  StudentLearningSessionConfidenceBucket,
} from '../contracts/studentLearningSessionContracts';
import { SAFE_RESPONSE_FLAGS } from '../contracts/studentLearningSessionContracts';

function calculateDurationBucket(startedAt: string, endedAt: string): string {
  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    if (isNaN(start) || isNaN(end)) return 'unknown';
    const minutes = (end - start) / 60000;
    if (minutes < 5) return 'very_short';
    if (minutes < 15) return 'short';
    if (minutes < 30) return 'medium';
    if (minutes < 60) return 'long';
    return 'very_long';
  } catch {
    return 'unknown';
  }
}

export function buildSessionExitSummary(
  sessionId: string,
  status: StudentLearningSessionStatus,
  startedAt: string,
  endedAt: string,
  modesUsed: StudentLearningSessionMode[],
  safeProgressMarkers: string[],
  safeEvidenceRefs: string[],
  nextRecommendedActionType: string,
  safeReasonCodes: StudentLearningSessionReasonCode[],
  sourceTruthStatus: StudentLearningSessionSourceTruthStatus,
  confidenceBucket: StudentLearningSessionConfidenceBucket,
): StudentLearningSessionExitSummary {
  return {
    sessionId,
    status,
    startedAt,
    endedAt,
    durationBucket: calculateDurationBucket(startedAt, endedAt),
    modesUsed,
    safeProgressMarkers,
    safeEvidenceRefs,
    nextRecommendedActionType,
    safeReasonCodes,
    sourceTruthStatus,
    confidenceBucket,
    privacyFlags: SAFE_RESPONSE_FLAGS,
  };
}

export function buildCompletedSessionSummary(
  record: StudentLearningSessionRecord,
  modesUsed: StudentLearningSessionMode[],
  safeProgressMarkers: string[],
): StudentLearningSessionExitSummary {
  return buildSessionExitSummary(
    record.id,
    'completed',
    record.startedAt.toISOString(),
    (record.endedAt || new Date()).toISOString(),
    modesUsed,
    safeProgressMarkers,
    record.safeEvidenceRefs,
    'start_session',
    record.safeReasonCodes,
    'unknown',
    'not_enough_evidence',
  );
}

export function buildAbandonedSessionSummary(
  record: StudentLearningSessionRecord,
  modesUsed: StudentLearningSessionMode[],
): StudentLearningSessionExitSummary {
  return buildSessionExitSummary(
    record.id,
    'abandoned',
    record.startedAt.toISOString(),
    (record.endedAt || new Date()).toISOString(),
    modesUsed,
    [],
    record.safeEvidenceRefs,
    'start_session',
    record.safeReasonCodes,
    'unknown',
    'not_enough_evidence',
  );
}

export function buildExpiredSessionSummary(
  record: StudentLearningSessionRecord,
  modesUsed: StudentLearningSessionMode[],
): StudentLearningSessionExitSummary {
  return buildSessionExitSummary(
    record.id,
    'expired',
    record.startedAt.toISOString(),
    (record.endedAt || new Date()).toISOString(),
    modesUsed,
    [],
    record.safeEvidenceRefs,
    'start_session',
    record.safeReasonCodes,
    'unknown',
    'not_enough_evidence',
  );
}

export function assertExitSummaryIsSafe(summary: StudentLearningSessionExitSummary): void {
  const forbiddenKeys = [
    'rawText', 'rawMessage', 'rawNote', 'rawQuestion', 'rawAnswer',
    'rawExplanation', 'answerKey', 'modelAnswer', 'markingScheme',
    'correctAnswer', 'hiddenReasoning', 'chainOfThought', 'transcript',
    'teacherOnlyNote', 'safeguardingRawDetail', 'deenSensitivePrivateText',
  ];
  const s = summary as unknown as Record<string, unknown>;
  for (const key of forbiddenKeys) {
    if (key in s && s[key] !== undefined) {
      throw new Error(`Exit summary contains forbidden field: ${key}`);
    }
  }
}
