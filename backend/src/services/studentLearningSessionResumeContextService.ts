import type {
  StudentLearningSessionMode,
  StudentLearningSessionStage,
  StudentLearningSessionReasonCode,
  StudentLearningSessionConfidenceBucket,
  StudentLearningSessionSourceTruthStatus,
  StudentLearningSessionResumeContext,
  StudentLearningSessionRecord,
  StudentLearningSessionModeState,
} from '../contracts/studentLearningSessionContracts';

export function buildSafeResumeContext(
  sessionId: string,
  currentMode: StudentLearningSessionMode,
  sessionStage: StudentLearningSessionStage,
  safeTopicLabel?: string,
  safeSkillLabel?: string,
  lastSafeActionLabel?: string,
  nextSuggestedActionType?: string,
  safeReasonCodes?: StudentLearningSessionReasonCode[],
  safeEvidenceRefs?: string[],
  confidenceBucket?: StudentLearningSessionConfidenceBucket,
  sourceTruthStatus?: StudentLearningSessionSourceTruthStatus,
  lastActiveAt?: string,
): StudentLearningSessionResumeContext {
  return {
    sessionId,
    currentMode,
    sessionStage,
    safeTopicLabel,
    safeSkillLabel,
    lastSafeActionLabel,
    nextSuggestedActionType,
    safeReasonCodes: safeReasonCodes ?? [],
    safeEvidenceRefs: safeEvidenceRefs ?? [],
    confidenceBucket: confidenceBucket ?? 'not_enough_evidence',
    sourceTruthStatus: sourceTruthStatus ?? 'unknown',
    lastActiveAt,
    status: 'sufficient',
  };
}

function toISOStringSafe(d: Date | string | undefined): string | undefined {
  if (!d) return undefined;
  if (typeof d === 'string') return d;
  return d.toISOString();
}

export function buildResumeContextFromSession(record: StudentLearningSessionRecord): StudentLearningSessionResumeContext {
  return {
    sessionId: record.id,
    currentMode: record.currentMode,
    sessionStage: record.stage,
    safeReasonCodes: record.safeReasonCodes,
    safeEvidenceRefs: record.safeEvidenceRefs,
    confidenceBucket: 'not_enough_evidence',
    sourceTruthStatus: 'unknown',
    lastActiveAt: toISOStringSafe(record.lastActiveAt),
    status: 'sufficient',
  };
}

export function buildResumeContextFromEvidence(
  sessionId: string,
  currentMode: StudentLearningSessionMode,
  sessionStage: StudentLearningSessionStage,
  safeEvidenceRefs: string[],
  safeReasonCodes: StudentLearningSessionReasonCode[],
): StudentLearningSessionResumeContext {
  return {
    sessionId,
    currentMode,
    sessionStage,
    safeEvidenceRefs,
    safeReasonCodes,
    confidenceBucket: safeEvidenceRefs.length > 0 ? 'medium' : 'not_enough_evidence',
    sourceTruthStatus: 'unknown',
    status: safeEvidenceRefs.length > 0 ? 'sufficient' : 'insufficient',
  };
}

export function buildResumeContextFromModeState(modeState: StudentLearningSessionModeState): StudentLearningSessionResumeContext {
  return {
    sessionId: '',
    currentMode: modeState.mode,
    sessionStage: 'orienting',
    safeReasonCodes: modeState.safeReasonCodes as StudentLearningSessionReasonCode[],
    safeEvidenceRefs: modeState.safeEvidenceRefs,
    confidenceBucket: 'not_enough_evidence',
    sourceTruthStatus: 'unknown',
    status: 'insufficient',
  };
}

export function buildEmptyResumeContext(): StudentLearningSessionResumeContext {
  return {
    sessionId: '',
    currentMode: 'none',
    sessionStage: 'orienting',
    safeReasonCodes: ['not_enough_safe_session_context'],
    safeEvidenceRefs: [],
    confidenceBucket: 'not_enough_evidence',
    sourceTruthStatus: 'unknown',
    status: 'insufficient',
  };
}

export function assertResumeContextIsSafe(context: StudentLearningSessionResumeContext): void {
  const forbiddenKeys = [
    'rawText', 'rawMessage', 'rawNote', 'rawQuestion', 'rawAnswer',
    'rawExplanation', 'answerKey', 'modelAnswer', 'markingScheme',
    'correctAnswer', 'hiddenReasoning', 'chainOfThought', 'transcript',
    'teacherOnlyNote', 'safeguardingRawDetail', 'deenSensitivePrivateText',
  ];
  const ctx = context as unknown as Record<string, unknown>;
  for (const key of forbiddenKeys) {
    if (key in ctx && ctx[key] !== undefined) {
      throw new Error(`Resume context contains forbidden field: ${key}`);
    }
  }
}
