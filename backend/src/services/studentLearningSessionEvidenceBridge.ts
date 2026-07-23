import type {
  StudentLearningSessionStatus,
  StudentLearningSessionStage,
  StudentLearningSessionMode,
  StudentLearningSessionReasonCode,
  StudentLearningSessionEvidenceBridgeInput,
  StudentLearningSessionEvidenceBridgeResult,
  StudentLearningSessionExitSummary,
} from '../contracts/studentLearningSessionContracts';

const bridgedEvidence: Map<string, StudentLearningSessionEvidenceBridgeInput> = new Map();

function generateEvidenceRef(): string {
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildSessionEvidenceCandidate(
  sessionId: string,
  schoolId: string,
  studentId: string,
  tutorLearnerId: string,
  subjectId?: string,
  topicId?: string,
  skillId?: string,
  objectiveId?: string,
  sessionStatus?: StudentLearningSessionStatus,
  sessionStage?: StudentLearningSessionStage,
  currentMode?: StudentLearningSessionMode,
  modesUsed?: StudentLearningSessionMode[],
  safeProgressMarkers?: string[],
  safeReasonCodes?: StudentLearningSessionReasonCode[],
  safeEvidenceRefs?: string[],
): StudentLearningSessionEvidenceBridgeInput {
  return {
    sessionId,
    schoolId,
    studentId,
    tutorLearnerId,
    subjectId,
    topicId,
    skillId,
    objectiveId,
    sessionStatus: sessionStatus ?? 'active',
    sessionStage: sessionStage ?? 'orienting',
    currentMode: currentMode ?? 'none',
    modesUsed: modesUsed ?? [],
    safeProgressMarkers: safeProgressMarkers ?? [],
    safeReasonCodes: safeReasonCodes ?? [],
    safeEvidenceRefs: safeEvidenceRefs ?? [],
    createdAt: new Date().toISOString(),
  };
}

export function bridgeSessionMetadataToSafeEvidence(
  input: StudentLearningSessionEvidenceBridgeInput,
): StudentLearningSessionEvidenceBridgeResult {
  const ref = generateEvidenceRef();
  bridgedEvidence.set(ref, input);
  return {
    bridged: true,
    evidenceRef: ref,
    safeReasonCodes: ['session_evidence_bridged'],
  };
}

export function bridgeSessionExitSummaryToSafeEvidence(
  summary: StudentLearningSessionExitSummary,
): StudentLearningSessionEvidenceBridgeResult {
  const ref = generateEvidenceRef();
  bridgedEvidence.set(ref, {
    sessionId: summary.sessionId,
    schoolId: '',
    studentId: '',
    tutorLearnerId: '',
    sessionStatus: summary.status,
    sessionStage: 'orienting',
    currentMode: 'none',
    modesUsed: summary.modesUsed,
    safeProgressMarkers: summary.safeProgressMarkers,
    safeReasonCodes: summary.safeReasonCodes,
    safeEvidenceRefs: summary.safeEvidenceRefs,
    createdAt: new Date().toISOString(),
  });
  return {
    bridged: true,
    evidenceRef: ref,
    safeReasonCodes: ['session_evidence_bridged'],
  };
}

export function assertSessionEvidenceCandidateIsSafe(candidate: StudentLearningSessionEvidenceBridgeInput): void {
  const forbiddenKeys = [
    'rawText', 'rawMessage', 'rawNote', 'rawQuestion', 'rawAnswer',
    'rawExplanation', 'answerKey', 'modelAnswer', 'markingScheme',
    'correctAnswer', 'hiddenReasoning', 'chainOfThought', 'transcript',
    'teacherOnlyNote', 'safeguardingRawDetail', 'deenSensitivePrivateText',
    'rawTranscript', 'aiResponse', 'providerResponse', 'prompt',
  ];
  const c = candidate as unknown as Record<string, unknown>;
  for (const key of forbiddenKeys) {
    if (key in c && c[key] !== undefined) {
      throw new Error(`Evidence candidate contains forbidden field: ${key}`);
    }
  }
}

export function getBridgedEvidence(ref: string): StudentLearningSessionEvidenceBridgeInput | undefined {
  return bridgedEvidence.get(ref);
}

export function clearBridgedEvidenceForTest(): void {
  bridgedEvidence.clear();
}
