import { v4 as uuidv4 } from 'uuid';
import type {
  EndToEndLearningLoopRequest,
  EndToEndLearningLoopResult,
  LearningSessionStateRecord,
  TutorModeTransitionDecision,
  SessionContextSnapshot,
} from './studentLearningSessionContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { selectNextMode } from './tutorModeTransitionPolicyService';
import { hydrateSessionContext } from './sessionContextHydrationService';
import { resumeLearnerSession } from './sessionResumeRuntime';
import { writeCheckpoint, recordTransitionEvent } from './sessionProgressCheckpointService';
import { executeMode } from './tutorModeExecutionRouter';

export interface LoopInput {
  identity: ResolvedTutorIdentity;
  request: EndToEndLearningLoopRequest;
  requestId: string;
}

export async function runEndToEndLearningLoop(input: LoopInput): Promise<EndToEndLearningLoopResult> {
  const { identity, request, requestId } = input;

  // Step 1: Resolve or create session
  const resumeDecision = await resumeLearnerSession(
    identity.schoolId,
    identity.studentId,
    identity.userId,
    request.sessionId,
  );

  // Step 2: Hydrate context
  const contextSnapshot: SessionContextSnapshot = await hydrateSessionContext({
    schoolId: identity.schoolId,
    tutorLearnerId: identity.studentId,
    studentId: identity.userId,
    sessionId: resumeDecision.sessionState?.id || request.sessionId,
    subject: request.subject,
    topic: request.topic,
    skillTag: request.skillTag,
  });

  const currentState: LearningSessionStateRecord = contextSnapshot.sessionState;

  // Step 3: Determine mastery/revision/challenge state for policy
  const masteryLevel = (contextSnapshot.masteryState as any)?.level;
  const masteryConfidence = (contextSnapshot.masteryState as any)?.confidenceScore;
  const revisionDue = (contextSnapshot.revisionDue?.length ?? 0) > 0;
  const spacedReviewDue = (contextSnapshot.spacedReviewDue?.length ?? 0) > 0;
  const weakSkills = contextSnapshot.weakSkillState || [];
  const challengeReadiness = (contextSnapshot.adaptiveProfile as any)?.challengeReadinessSignal;
  const remediationNeed = (contextSnapshot.activeRemediationPath as any)?.status === 'active';

  // Step 4: Run transition policy
  const transitionResult = selectNextMode({
    currentMode: currentState.currentMode,
    learnerActionType: request.learnerActionType,
    messageIntent: request.sessionIntent,
    subject: request.subject || currentState.subject,
    topic: request.topic || currentState.topic,
    skillTag: request.skillTag || currentState.skillTag,
    masteryState: {
      level: masteryLevel,
      confidenceScore: masteryConfidence,
    },
    revisionDue,
    spacedReviewDue,
    weakSkillState: weakSkills as any,
    challengeReadiness,
    remediationNeed,
    adaptiveProfile: contextSnapshot.adaptiveProfile as any,
    preferenceSignals: {
      recentTooHardCount: (contextSnapshot.adaptiveProfile as any)?.recentTooHardCount,
      recentTooEasyCount: (contextSnapshot.adaptiveProfile as any)?.recentTooEasyCount,
      recentConfusionCount: (contextSnapshot.adaptiveProfile as any)?.recentConfusionCount,
      recentChallengeRequestCount: (contextSnapshot.adaptiveProfile as any)?.recentChallengeRequestCount,
    },
    academicIntegrityDecision: {
      blockDirectAnswer: true,
      enforceSocratic: true,
    },
  });

  // Step 5: Execute mode
  const executionResult = await executeMode({
    identity,
    mode: transitionResult.nextMode,
    subject: request.subject || currentState.subject,
    topic: request.topic || currentState.topic,
    skillTag: request.skillTag || currentState.skillTag,
    message: request.message,
    attemptText: request.attemptText,
    activeChallengeId: currentState.activeChallengeId,
    activeRemediationPathId: currentState.activeRemediationPathId,
    activeRevisionItemId: currentState.activeRevisionItemId,
    requestId,
  });

  // Step 6: Update session state
  const { updateSessionState } = await import('./studentLearningSessionStateRepository');
  const updatedState: LearningSessionStateRecord = await updateSessionState(currentState.id, {
    status: transitionResult.nextMode === 'session_complete' ? 'completed' :
            transitionResult.nextMode === 'safeguarding_pause' ? 'safeguarding_paused' :
            transitionResult.nextMode === 'session_paused' ? 'paused' : 'active',
    currentMode: transitionResult.nextMode,
    previousMode: currentState.currentMode,
    subject: request.subject || currentState.subject,
    topic: request.topic || currentState.topic,
    skillTag: request.skillTag || currentState.skillTag,
    safeEvidenceRefs: executionResult.evidenceWritten
      ? [...new Set([...currentState.safeEvidenceRefs, `evidence_${Date.now()}`])]
      : currentState.safeEvidenceRefs,
    reasonCodes: transitionResult.reasonCodes,
    privacyMetadata: {
      ...currentState.privacyMetadata,
      ...transitionResult.decision.privacyMetadata,
      lastModeExecuted: transitionResult.nextMode,
    },
  });

  // Step 7: Write checkpoint
  const checkpointWritten = true;
  await writeCheckpoint(updatedState, {
    safeProgressSummary: executionResult.progressSummary || updatedState.safeProgressSummary,
    reasonCodes: transitionResult.reasonCodes,
  });

  // Step 8: Record transition event
  await recordTransitionEvent(
    identity.schoolId,
    identity.studentId,
    currentState.id,
    currentState.currentMode,
    transitionResult.nextMode,
    transitionResult.reasonCodes,
    transitionResult.decision.learnerFacingExplanation,
  );

  // Step 9: Record audit
  const { recordSessionAudit } = await import('./sessionAuditRepository');
  await recordSessionAudit({
    actorId: identity.studentId,
    actorRole: 'learner',
    schoolId: identity.schoolId,
    tutorLearnerId: identity.studentId,
    sessionId: currentState.id,
    previousMode: currentState.currentMode,
    nextMode: transitionResult.nextMode,
    reasonCodes: transitionResult.reasonCodes,
    safeEvidenceRefs: updatedState.safeEvidenceRefs,
    privacyDecision: 'learner_safe',
    deenSensitivityHandled: transitionResult.nextMode === 'deen_safe_support' || transitionResult.nextMode === 'deen_teacher_referral',
    safeguardingBoundaryApplied: transitionResult.nextMode === 'safeguarding_pause',
    createdAt: new Date().toISOString(),
    requestId,
  });

  // Step 10: Build why-this-next explanation
  let whyThisNext: string | undefined;
  try {
    const { buildLearnerRecommendationExplanation } = await import('./learnerWhyThisNextExplanationService');
    const explanation = await buildLearnerRecommendationExplanation(
      identity,
      {
        recommendationType: 'session_step',
        title: `Continue in ${transitionResult.nextMode} mode`,
        reason: transitionResult.decision.learnerFacingExplanation || 'This is the best next step for your learning.',
        primaryAction: { mode: transitionResult.nextMode },
        linkedTopic: request.topic || currentState.topic,
      } as any,
      requestId,
    );
    if (explanation && typeof explanation === 'object' && 'explanationText' in explanation) {
      whyThisNext = (explanation as any).explanationText;
    } else if (typeof explanation === 'string') {
      whyThisNext = explanation;
    } else {
      whyThisNext = transitionResult.decision.learnerFacingExplanation;
    }
  } catch {
    whyThisNext = transitionResult.decision.learnerFacingExplanation;
  }
  if (!whyThisNext) {
    whyThisNext = 'This is the best next step for your learning journey.';
  }

  return {
    sessionState: updatedState,
    mode: transitionResult.nextMode,
    learnerFacingResponse: executionResult.learnerFacingResponse,
    nextRecommendedAction: executionResult.nextRecommendedAction,
    whyThisNext,
    challenge: executionResult.challenge,
    remediationPath: executionResult.remediationPath,
    revisionItem: executionResult.revisionItem,
    progressSummary: executionResult.progressSummary,
    agencyOptions: executionResult.agencyOptions,
    checkpointWritten,
    auditRecorded: true,
    privacyMetadata: {
      ...transitionResult.decision.privacyMetadata,
      sessionId: currentState.id,
      mode: transitionResult.nextMode,
    },
  };
}
