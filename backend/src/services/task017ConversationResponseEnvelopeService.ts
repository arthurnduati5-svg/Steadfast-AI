import type { EndToEndLearningLoopResult, LearningSessionMode, LearningSessionStatus } from './studentLearningSessionContracts';
import type { TutorConversationResponseEnvelope } from './task017Contracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

export function buildSuccessEnvelope(
  requestId: string,
  correlationId: string,
  loopResult: EndToEndLearningLoopResult,
  streaming: boolean,
  identity: ResolvedTutorIdentity,
): TutorConversationResponseEnvelope {
  return {
    requestId,
    correlationId,
    sessionId: loopResult.sessionState.id,
    status: loopResult.sessionState.status as LearningSessionStatus,
    mode: loopResult.mode,
    sessionState: {
      currentMode: loopResult.sessionState.currentMode,
      previousMode: loopResult.sessionState.previousMode,
      subject: loopResult.sessionState.subject,
      topic: loopResult.sessionState.topic,
      skillTag: loopResult.sessionState.skillTag,
      safeProgressSummary: loopResult.sessionState.safeProgressSummary,
      safeEvidenceRefs: loopResult.sessionState.safeEvidenceRefs,
      reasonCodes: loopResult.sessionState.reasonCodes,
    },
    learnerFacingResponse: loopResult.learnerFacingResponse,
    nextRecommendedAction: loopResult.nextRecommendedAction,
    whyThisNext: loopResult.whyThisNext,
    challenge: loopResult.challenge,
    remediationPath: loopResult.remediationPath,
    revisionItem: loopResult.revisionItem,
    progressSummary: loopResult.progressSummary,
    agencyOptions: loopResult.agencyOptions,
    streaming,
    privacyMetadata: {
      ...loopResult.privacyMetadata,
      dataMinimized: true,
      noRawData: true,
    },
    safetyMetadata: {
      safetyCheckPassed: true,
      deenSensitivityHandled: loopResult.mode === 'deen_safe_support' || loopResult.mode === 'deen_teacher_referral',
      safeguardingBoundaryApplied: loopResult.mode === 'safeguarding_pause',
    },
    createdAt: new Date().toISOString(),
  };
}
