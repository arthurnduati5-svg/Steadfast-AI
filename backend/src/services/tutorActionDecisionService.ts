import {
  type TutorActionDecision,
  type TutorActionDecisionRequest,
  type TutorActionType,
  type HintLadderLevel,
  type SupportLevel,
  type LearnerNeedCategory,
} from '../contracts/tutorActionContracts';
import { TUTOR_ACTION_TYPES } from '../contracts/tutorActionContracts';
import { buildTutorActionContext, type TutorActionContext } from './tutorActionContextBuilder';
import { classifyLearnerNeed } from './learnerNeedClassifierService';
import { rankActions, type RankingOutput, type ScoredAction } from './tutorActionRankingService';
import { applyHardPolicyOverrides } from './tutorActionPolicyService';

export interface DecisionServiceInput {
  schoolId: string;
  studentId: string;
  request: TutorActionDecisionRequest;
  safeSignals?: {
    attemptCount?: number;
    hintCount?: number;
    stuckCount?: number;
    recoveryCount?: number;
  };
  profileSignals?: {
    masteryLevel?: string;
    masteryStatus?: string;
    profileConfidence?: number;
    weakTopicDetected?: boolean;
    highHintDependency?: boolean;
    repeatedMistakeDetected?: boolean;
  };
}

export function makeTutorActionDecision(input: DecisionServiceInput): TutorActionDecision {
  const ctx = buildTutorActionContext(
    input.schoolId,
    input.studentId,
    input.request,
    input.safeSignals ?? {},
    input.profileSignals ?? {},
  );

  const learnerNeed = classifyLearnerNeed(ctx);

  const ranking = rankActions(ctx, learnerNeed);

  const hardOverride = applyHardPolicyOverrides(ctx);

  const now = new Date().toISOString();

  return {
    schoolId: ctx.schoolId,
    studentId: ctx.studentId,
    tutorLearnerId: ctx.tutorLearnerId,
    modeSessionId: ctx.modeSessionId,
    conversationId: ctx.conversationId,
    mode: ctx.mode,
    stage: ctx.stage,

    selectedAction: ranking.selectedAction,
    rankedActions: ranking.rankedActions,
    hintLevel: ranking.hintLevel as HintLadderLevel | undefined,
    supportLevel: ranking.supportLevel as SupportLevel,
    learnerNeedCategory: learnerNeed,

    answerPolicy: {
      finalAnswerAllowed: false,
      answerKeyRisk: hardOverride.override && ranking.selectedAction === 'block_answer_key_request',
      requiresStudentAttempt: !hardOverride.override,
      requiresSocraticQuestion: !hardOverride.override,
    },

    contentPolicy: {
      approvedContextAvailable: ctx.approvedContextAvailable,
      contentGap: !ctx.approvedContextAvailable,
      deenSensitive: ctx.deenSensitive,
      referralRequired: ranking.selectedAction === 'safe_content_gap_referral' || ranking.selectedAction === 'safe_deen_referral',
    },

    decisionReasonCodes: ranking.reasonCodes,
    safeEvidenceRefs: [],
    confidenceScore: ranking.confidenceScore,

    nextSignalType: mapActionToSignal(ranking.selectedAction),
    nextModeStage: mapActionToStage(ranking.selectedAction),
    createdAt: now,
  };
}

function mapActionToSignal(action: TutorActionType): string | undefined {
  switch (action) {
    case 'ask_student_to_try_first':
    case 'ask_next_question':
    case 'ask_clarifying_question':
    case 'ask_reflection_question':
    case 'ask_teach_back':
      return 'support_action_selected';
    case 'give_attention_hint':
    case 'give_direction_hint':
    case 'rephrase_question':
    case 'simplify_concept':
    case 'break_into_micro_step':
    case 'give_micro_example':
    case 'guided_completion':
      return 'hint_given';
    case 'repair_misconception':
    case 'summarize_progress':
    case 'check_foundation':
    case 'check_readiness':
      return 'support_action_selected';
    case 'recommend_practice':
    case 'recommend_revision':
    case 'recommend_video':
    case 'recommend_course_step':
    case 'recommend_teacher_support':
      return 'support_action_selected';
    case 'continue_current_mode':
      return undefined;
    case 'exit_mode_summary':
      return 'mode_summary_created';
    default:
      return 'support_action_selected';
  }
}

function mapActionToStage(action: TutorActionType): string | undefined {
  switch (action) {
    case 'ask_next_question':
    case 'ask_student_to_try_first':
      return 'attempting';
    case 'give_attention_hint':
    case 'give_direction_hint':
    case 'rephrase_question':
    case 'simplify_concept':
    case 'break_into_micro_step':
    case 'give_micro_example':
    case 'guided_completion':
      return 'hinting';
    case 'repair_misconception':
    case 'check_foundation':
      return 'repairing';
    case 'ask_reflection_question':
    case 'ask_teach_back':
      return 'reflecting';
    case 'summarize_progress':
    case 'exit_mode_summary':
      return 'summarizing';
    default:
      return undefined;
  }
}
