import type {
  StudentLearningSessionRecord,
  StudentLearningSessionSnapshot,
  StudentLearningSessionResumeContext,
  StudentLearningSessionSourceTruthStatus,
  StudentLearningSessionConfidenceBucket,
} from '../contracts/studentLearningSessionContracts';
import { SAFE_RESPONSE_FLAGS } from '../contracts/studentLearningSessionContracts';
import { buildResumeContextFromSession, buildEmptyResumeContext } from './studentLearningSessionResumeContextService';

function toISOStringSafe(d: Date | string): string {
  if (typeof d === 'string') return d;
  return d.toISOString();
}

export function buildStudentLearningSessionSnapshot(
  record: StudentLearningSessionRecord,
  resumeContext: StudentLearningSessionResumeContext,
  sourceTruthStatus: StudentLearningSessionSourceTruthStatus,
  confidenceBucket: StudentLearningSessionConfidenceBucket,
): StudentLearningSessionSnapshot {
  return {
    sessionId: record.id,
    schoolId: record.schoolId,
    studentId: record.studentId,
    tutorLearnerId: record.tutorLearnerId,
    sessionStatus: record.status,
    sessionStage: record.stage,
    currentMode: record.currentMode,
    allowedTransitions: record.allowedTransitions,
    blockedTransitions: record.blockedTransitions,
    resumeContext,
    safeProgressMarkers: record.safeEvidenceRefs,
    safeReasonCodes: record.safeReasonCodes,
    sourceTruthStatus,
    confidenceBucket,
    privacyFlags: SAFE_RESPONSE_FLAGS,
    updatedAt: toISOStringSafe(record.updatedAt),
  };
}

export function buildLearnerSafeSessionSnapshot(record: StudentLearningSessionRecord): StudentLearningSessionSnapshot {
  const resumeContext = buildResumeContextFromSession(record);
  return {
    sessionId: record.id,
    schoolId: record.schoolId,
    studentId: record.studentId,
    tutorLearnerId: record.tutorLearnerId,
    sessionStatus: record.status,
    sessionStage: record.stage,
    currentMode: record.currentMode,
    allowedTransitions: record.allowedTransitions,
    blockedTransitions: record.blockedTransitions,
    resumeContext,
    safeProgressMarkers: record.safeEvidenceRefs,
    safeReasonCodes: record.safeReasonCodes,
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    privacyFlags: SAFE_RESPONSE_FLAGS,
    updatedAt: toISOStringSafe(record.updatedAt),
  };
}

export function buildEmptySessionSnapshot(): StudentLearningSessionSnapshot {
  const emptyResume = buildEmptyResumeContext();
  return {
    sessionId: '',
    schoolId: '',
    tutorLearnerId: '',
    sessionStatus: 'created',
    sessionStage: 'orienting',
    currentMode: 'none',
    allowedTransitions: [],
    blockedTransitions: [],
    resumeContext: emptyResume,
    safeProgressMarkers: [],
    safeReasonCodes: ['no_existing_session_found'],
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    privacyFlags: SAFE_RESPONSE_FLAGS,
    updatedAt: new Date().toISOString(),
  };
}

export function assertSessionSnapshotIsSafe(snapshot: StudentLearningSessionSnapshot): void {
  const forbiddenKeys = [
    'rawText', 'rawMessage', 'rawNote', 'rawQuestion', 'rawAnswer',
    'rawExplanation', 'answerKey', 'modelAnswer', 'markingScheme',
    'correctAnswer', 'hiddenReasoning', 'chainOfThought', 'transcript',
    'teacherOnlyNote', 'safeguardingRawDetail', 'deenSensitivePrivateText',
  ];
  const snap = snapshot as unknown as Record<string, unknown>;
  for (const key of forbiddenKeys) {
    if (key in snap && snap[key] !== undefined) {
      throw new Error(`Session snapshot contains forbidden field: ${key}`);
    }
  }
}
