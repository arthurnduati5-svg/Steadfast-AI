import type { TutorActionDecision } from '../contracts/tutorActionContracts';
import { FORBIDDEN_TUTOR_ACTION_FIELDS } from '../contracts/tutorActionContracts';
import { redactForbiddenFields } from './tutorActionPrivacyGuard';

export interface SafeTutorActionDecisionResponse {
  id?: string;
  mode?: string;
  stage?: string;
  selectedAction: string;
  hintLevel?: string;
  supportLevel: string;
  learnerNeedCategory: string;
  rankedActions: Array<{
    action: string;
    score: number;
    reasonCodes: string[];
  }>;
  answerPolicy: {
    finalAnswerAllowed: boolean;
    answerKeyRisk: boolean;
    requiresStudentAttempt: boolean;
    requiresSocraticQuestion: boolean;
  };
  contentPolicy: {
    approvedContextAvailable: boolean;
    contentGap: boolean;
    deenSensitive: boolean;
    referralRequired: boolean;
  };
  decisionReasonCodes: string[];
  safeEvidenceRefs: string[];
  confidenceScore: number;
  nextSignalType?: string;
  nextModeStage?: string;
  createdAt: string;
}

export function buildSafeDecisionResponse(decision: TutorActionDecision): SafeTutorActionDecisionResponse {
  const safe = redactForbiddenFields(decision as unknown as Record<string, unknown>);

  return {
    id: typeof safe.id === 'string' ? safe.id : undefined,
    mode: typeof safe.mode === 'string' ? safe.mode : undefined,
    stage: typeof safe.stage === 'string' ? safe.stage : undefined,
    selectedAction: String(safe.selectedAction ?? ''),
    hintLevel: typeof safe.hintLevel === 'string' ? safe.hintLevel : undefined,
    supportLevel: String(safe.supportLevel ?? 'low'),
    learnerNeedCategory: String(safe.learnerNeedCategory ?? 'no_data_yet'),
    rankedActions: Array.isArray(safe.rankedActions) ? safe.rankedActions.map((r: any) => ({
      action: String(r?.action ?? ''),
      score: Number(r?.score ?? 0),
      reasonCodes: Array.isArray(r?.reasonCodes) ? r.reasonCodes : [],
    })) : [],
    answerPolicy: safe.answerPolicy && typeof safe.answerPolicy === 'object'
      ? safe.answerPolicy as any
      : { finalAnswerAllowed: false, answerKeyRisk: false, requiresStudentAttempt: true, requiresSocraticQuestion: true },
    contentPolicy: safe.contentPolicy && typeof safe.contentPolicy === 'object'
      ? safe.contentPolicy as any
      : { approvedContextAvailable: false, contentGap: false, deenSensitive: false, referralRequired: false },
    decisionReasonCodes: Array.isArray(safe.decisionReasonCodes) ? safe.decisionReasonCodes : [],
    safeEvidenceRefs: Array.isArray(safe.safeEvidenceRefs) ? safe.safeEvidenceRefs : [],
    confidenceScore: typeof safe.confidenceScore === 'number' ? safe.confidenceScore : 0,
    nextSignalType: typeof safe.nextSignalType === 'string' ? safe.nextSignalType : undefined,
    nextModeStage: typeof safe.nextModeStage === 'string' ? safe.nextModeStage : undefined,
    createdAt: String(safe.createdAt ?? new Date().toISOString()),
  };
}

export function buildSafeHintLadderStateResponse(state: {
  id?: string;
  schoolId: string;
  studentId: string;
  currentHintLevel: string;
  hintCount: number;
  lastHintAt?: string;
  stuckCount: number;
  recoveryCount: number;
  status: string;
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: state.id,
    currentHintLevel: state.currentHintLevel,
    hintCount: state.hintCount,
    lastHintAt: state.lastHintAt,
    stuckCount: state.stuckCount,
    recoveryCount: state.recoveryCount,
    status: state.status,
    safeEvidenceRefs: state.safeEvidenceRefs,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
}
