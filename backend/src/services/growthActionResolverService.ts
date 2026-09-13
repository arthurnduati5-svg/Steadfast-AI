import { v4 as uuidv4 } from 'uuid';
import type {
  GrowthActionResolveRequest,
  GrowthActionPlan,
  GrowthActionResolverResult,
  GrowthActionWhyThisNextCode,
  GrowthActionPriorityBucket,
  GrowthActionConfidenceBucket,
  GrowthActionIntent,
  GrowthActionType,
  GrowthActionDestination,
  GrowthLearnerEvidenceSnapshot,
} from '../contracts/growthActionContracts';
import type { LearnerState } from './growthActionLearnerStateService';
import { evaluateRoutingPolicy } from './growthActionRoutingPolicyService';
import { recommendMode } from './growthModeRecommendationService';
import { generateWhyThisNext } from './growthWhyThisNextService';

export interface ResolverInput {
  request: GrowthActionResolveRequest;
  evidence: GrowthLearnerEvidenceSnapshot;
  learnerState: LearnerState;
}

export function resolveGrowthAction(input: ResolverInput): GrowthActionResolverResult {
  const { request, evidence, learnerState } = input;
  const now = new Date().toISOString();

  const routingResult = evaluateRoutingPolicy({
    request,
    evidence,
    learnerState: {
      contentGovernanceState: learnerState.contentGovernanceState,
      deenGovernanceState: learnerState.deenGovernanceState,
    },
  });

  if (!routingResult.allowed) {
    const planId = uuidv4();
    const blockedPlan: GrowthActionPlan = {
      id: planId,
      schoolId: request.schoolId,
      studentId: request.studentId,
      tutorLearnerId: request.tutorLearnerId,
      conversationId: request.conversationId,
      modeSessionId: request.modeSessionId,
      growthIntent: 'no_action_available',
      growthActionType: 'blocked_unsafe_request',
      recommendedDestination: 'none',
      priorityBucket: 'blocked',
      confidenceBucket: 'no_data_yet',
      routingDecision: routingResult.decision,
      whyThisNextCode: mapRoutingDecisionToWhyNextCode(routingResult.decision),
      executionStatus: 'blocked',
      safeReasonCodes: routingResult.reasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      createdAt: now,
      updatedAt: now,
    };

    const whyThisNext = generateWhyThisNext({
      evidence,
      learnerState,
      actionPlan: blockedPlan,
    });

    return {
      actionPlan: blockedPlan,
      whyThisNextDecision: {
        id: whyThisNext.id,
        schoolId: whyThisNext.schoolId,
        studentId: whyThisNext.studentId,
        whyThisNextCode: whyThisNext.whyThisNextCode,
        priorityBucket: whyThisNext.priorityBucket,
        confidenceBucket: whyThisNext.confidenceBucket,
        studentSafeReason: whyThisNext.studentSafeReason,
        teacherSafeReason: whyThisNext.teacherSafeReason,
        evidenceSummary: whyThisNext.evidenceSummary,
        safeReasonCodes: whyThisNext.safeReasonCodes,
        safeEvidenceRefs: whyThisNext.safeEvidenceRefs,
        createdAt: whyThisNext.createdAt,
      },
      routingDecision: routingResult.decision,
      recommendedDestination: 'none',
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      safeReasonCodes: routingResult.reasonCodes,
    };
  }

  const intent = determineIntent(request, evidence, learnerState);
  const modeRec = recommendMode({
    evidence,
    learnerState,
    requestedDestination: request.requestedDestination,
    requestedIntent: request.requestedIntent,
  });
  const actionType = mapIntentToActionType(intent, modeRec.recommendedDestination);
  const whyNextCode = determineWhyNextCode(evidence, learnerState, intent);
  const priorityBucket = determinePriority(evidence, learnerState);
  const confidenceBucket = determineConfidence(evidence, learnerState);

  const planId = uuidv4();
  const actionPlan: GrowthActionPlan = {
    id: planId,
    schoolId: request.schoolId,
    studentId: request.studentId,
    tutorLearnerId: request.tutorLearnerId,
    conversationId: request.conversationId,
    modeSessionId: request.modeSessionId,
    growthIntent: intent,
    growthActionType: actionType,
    recommendedDestination: modeRec.recommendedDestination,
    recommendedMode: modeRec.recommendedMode,
    targetType: request.targetType,
    targetRef: request.targetRef,
    approvedContentRef: request.approvedContentRef,
    contentFingerprint: request.contentFingerprint,
    subjectId: request.subjectId,
    topicId: request.topicId,
    skillId: request.skillId,
    priorityBucket,
    confidenceBucket,
    routingDecision: routingResult.decision,
    whyThisNextCode: whyNextCode,
    executionStatus: 'resolved',
    safeReasonCodes: [...routingResult.reasonCodes, ...modeRec.reasonCodes],
    safeEvidenceRefs: evidence.safeEvidenceRefs,
    createdAt: now,
    updatedAt: now,
  };

  const whyThisNext = generateWhyThisNext({
    evidence,
    learnerState,
    actionPlan,
  });

  return {
    actionPlan,
    whyThisNextDecision: {
      id: whyThisNext.id,
      schoolId: whyThisNext.schoolId,
      studentId: whyThisNext.studentId,
      whyThisNextCode: whyThisNext.whyThisNextCode,
      priorityBucket: whyThisNext.priorityBucket,
      confidenceBucket: whyThisNext.confidenceBucket,
      studentSafeReason: whyThisNext.studentSafeReason,
      teacherSafeReason: whyThisNext.teacherSafeReason,
      evidenceSummary: whyThisNext.evidenceSummary,
      safeReasonCodes: whyThisNext.safeReasonCodes,
      safeEvidenceRefs: whyThisNext.safeEvidenceRefs,
      createdAt: whyThisNext.createdAt,
    },
    routingDecision: routingResult.decision,
    recommendedDestination: modeRec.recommendedDestination,
    recommendedMode: modeRec.recommendedMode,
    safeEvidenceRefs: evidence.safeEvidenceRefs,
    safeReasonCodes: [...routingResult.reasonCodes, ...modeRec.reasonCodes],
  };
}

function determineIntent(
  request: GrowthActionResolveRequest,
  evidence: GrowthLearnerEvidenceSnapshot,
  learnerState: LearnerState,
): GrowthActionIntent {
  if (request.requestedIntent) return request.requestedIntent;

  if (request.requestedDestination === 'exam') return 'start_exam_review';
  if (request.requestedDestination === 'revision') return 'revise_due_item';
  if (request.requestedDestination === 'quiz') return 'start_quiz_check';
  if (request.requestedDestination === 'teach_back') return 'start_teach_back';
  if (request.requestedDestination === 'focus') return 'start_focus_repair';
  if (request.requestedDestination === 'teacher_support') return 'teacher_support_needed';
  if (request.requestedDestination === 'content_gap_referral') return 'safe_content_gap';
  if (request.requestedDestination === 'deen_referral') return 'safe_deen_referral';

  if (evidence.stateQuality === 'no_data_yet') return 'no_action_available';

  if (learnerState.revisionDueState.hasDueItems) return 'revise_due_item';
  if (learnerState.weakTopicState.hasWeakTopics) return 'review_weak_topic';
  if (learnerState.mistakePatternState.hasPatterns) return 'repair_mistake';
  if (learnerState.supportNeedState.hasSupportNeed) return 'teacher_support_needed';

  return 'continue_learning';
}

function mapIntentToActionType(intent: GrowthActionIntent, destination: GrowthActionDestination): GrowthActionType {
  if (intent === 'revise_due_item' || intent === 'review_weak_topic') return 'open_revision_mode';
  if (intent === 'start_quiz_check') return 'start_quiz_mode';
  if (intent === 'start_teach_back') return 'start_teach_back_mode';
  if (intent === 'start_focus_repair') return 'start_focus_mode';
  if (intent === 'start_exam_review') return 'start_exam_mode';
  if (intent === 'teacher_support_needed') return 'recommend_teacher_support';
  if (intent === 'safe_content_gap') return 'safe_content_gap_referral';
  if (intent === 'safe_deen_referral') return 'safe_deen_referral';
  if (intent === 'no_action_available') return 'blocked_unsafe_request';
  return 'continue_current_learning_mode';
}

function determineWhyNextCode(
  evidence: GrowthLearnerEvidenceSnapshot,
  learnerState: LearnerState,
  intent: GrowthActionIntent,
): GrowthActionWhyThisNextCode {
  if (evidence.stateQuality === 'no_data_yet') return 'insufficient_evidence';
  if (learnerState.deenGovernanceState.deenUncertain) return 'deen_uncertainty_detected';
  if (learnerState.contentGovernanceState.contentGap) return 'content_gap_detected';
  if (learnerState.revisionDueState.hasDueItems) return 'due_revision_item';
  if (learnerState.weakTopicState.hasWeakTopics) return 'weak_topic_detected';
  if (learnerState.mistakePatternState.hasPatterns) return 'mistake_pattern_detected';
  if (learnerState.masteryState.status === 'low') return 'low_mastery';
  if (learnerState.masteryState.status === 'medium') return 'partial_mastery';
  if (learnerState.masteryState.status === 'high') return 'strong_mastery_ready_for_challenge';
  return 'insufficient_evidence';
}

function determinePriority(
  evidence: GrowthLearnerEvidenceSnapshot,
  learnerState: LearnerState,
): GrowthActionPriorityBucket {
  if (learnerState.supportNeedState.hasSupportNeed) return 'high';
  if (learnerState.revisionDueState.hasDueItems) return 'high';
  if (learnerState.deenGovernanceState.deenUncertain) return 'teacher_review';
  if (learnerState.contentGovernanceState.contentGap) return 'medium';
  if (learnerState.weakTopicState.hasWeakTopics) return 'medium';
  if (evidence.stateQuality === 'no_data_yet') return 'none';
  return 'low';
}

function determineConfidence(
  evidence: GrowthLearnerEvidenceSnapshot,
  learnerState: LearnerState,
): GrowthActionConfidenceBucket {
  if (evidence.stateQuality === 'no_data_yet') return 'no_data_yet';
  if (evidence.stateQuality === 'partial') return 'low';
  if (evidence.stateQuality === 'sufficient') return 'medium';
  return 'high';
}

function mapRoutingDecisionToWhyNextCode(
  decision: string,
): GrowthActionWhyThisNextCode {
  switch (decision) {
    case 'blocked_answer_key_request': return 'answer_key_request_blocked';
    case 'blocked_model_answer_request': return 'model_answer_request_blocked';
    case 'blocked_unsafe_request': return 'unsafe_request_blocked';
    case 'blocked_missing_content': return 'content_gap_detected';
    case 'blocked_deen_sensitive': return 'deen_uncertainty_detected';
    case 'blocked_no_evidence': return 'insufficient_evidence';
    case 'blocked_missing_identity': return 'insufficient_evidence';
    default: return 'insufficient_evidence';
  }
}
