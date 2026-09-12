import {
  type TutorActionDecisionRequest,
} from '../contracts/tutorActionContracts';

export interface TutorActionContext {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  modeSessionId?: string;
  conversationId?: string;
  mode?: string;
  stage?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  requestCategory?: string;
  answerQuality?: string;
  mistakeCategory?: string;
  approvedContextAvailable: boolean;
  deenSensitive: boolean;

  attemptCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;

  masteryLevel?: string;
  masteryStatus?: string;
  profileConfidence: number;
  weakTopicDetected: boolean;
  highHintDependency: boolean;
  repeatedMistakeDetected: boolean;

  hasModeSession: boolean;
  hasProfileData: boolean;
}

export function buildTutorActionContext(
  schoolId: string,
  studentId: string,
  req: TutorActionDecisionRequest,
  safeSignals: {
    attemptCount?: number;
    hintCount?: number;
    stuckCount?: number;
    recoveryCount?: number;
  },
  profileSignals?: {
    masteryLevel?: string;
    masteryStatus?: string;
    profileConfidence?: number;
    weakTopicDetected?: boolean;
    highHintDependency?: boolean;
    repeatedMistakeDetected?: boolean;
  },
): TutorActionContext {
  return {
    schoolId,
    studentId,
    tutorLearnerId: req.modeSessionId,
    modeSessionId: req.modeSessionId,
    conversationId: req.conversationId,
    mode: req.mode,
    stage: req.stage,
    subjectId: req.subjectId,
    topicId: req.topicId,
    skillId: req.skillId,
    requestCategory: req.requestCategory,
    answerQuality: req.answerQuality,
    mistakeCategory: req.mistakeCategory,
    approvedContextAvailable: req.approvedContextAvailable ?? false,
    deenSensitive: req.deenSensitive ?? false,

    attemptCount: safeSignals.attemptCount ?? 0,
    hintCount: safeSignals.hintCount ?? 0,
    stuckCount: safeSignals.stuckCount ?? 0,
    recoveryCount: safeSignals.recoveryCount ?? 0,

    masteryLevel: profileSignals?.masteryLevel,
    masteryStatus: profileSignals?.masteryStatus,
    profileConfidence: profileSignals?.profileConfidence ?? 0,
    weakTopicDetected: profileSignals?.weakTopicDetected ?? false,
    highHintDependency: profileSignals?.highHintDependency ?? false,
    repeatedMistakeDetected: profileSignals?.repeatedMistakeDetected ?? false,

    hasModeSession: !!req.modeSessionId,
    hasProfileData: (profileSignals?.profileConfidence ?? 0) > 0,
  };
}
