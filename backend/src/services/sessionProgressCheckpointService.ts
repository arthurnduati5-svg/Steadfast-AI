import { updateSessionState } from './studentLearningSessionStateRepository';
import { appendSessionEvent } from './studentLearningSessionEventRepository';
import type {
  LearningSessionStateRecord,
  SessionCheckpoint,
  LearningSessionMode,
  TutorModeTransitionReasonCode,
} from './studentLearningSessionContracts';

export async function writeCheckpoint(
  state: LearningSessionStateRecord,
  options?: {
    lastCompletedMode?: LearningSessionMode;
    safeProgressSummary?: string;
    reasonCodes?: TutorModeTransitionReasonCode[];
  },
): Promise<LearningSessionStateRecord> {
  const updated = await updateSessionState(state.id, {
    status: state.status,
    currentMode: state.currentMode,
    previousMode: state.previousMode,
    safeProgressSummary: options?.safeProgressSummary ?? state.safeProgressSummary,
    reasonCodes: options?.reasonCodes ?? state.reasonCodes,
    privacyMetadata: {
      ...state.privacyMetadata,
      lastCheckpointAt: new Date().toISOString(),
      lastCompletedMode: options?.lastCompletedMode || state.currentMode,
    },
  });

  return updated;
}

export function buildCheckpointFromState(
  state: LearningSessionStateRecord,
  options?: {
    lastCompletedMode?: LearningSessionMode;
  },
): SessionCheckpoint {
  return {
    sessionId: state.id,
    currentMode: state.currentMode,
    previousMode: state.previousMode,
    lastCompletedMode: options?.lastCompletedMode ?? state.currentMode,
    subject: state.subject,
    topic: state.topic,
    skillTag: state.skillTag,
    activeChallengeId: state.activeChallengeId,
    activeRemediationPathId: state.activeRemediationPathId,
    activeRevisionItemId: state.activeRevisionItemId,
    supportLevel: state.supportLevel,
    difficultyLevel: state.difficultyLevel,
    safeProgressSummary: state.safeProgressSummary,
    safeEvidenceRefs: state.safeEvidenceRefs,
    reasonCodes: state.reasonCodes,
    privacyMetadata: state.privacyMetadata,
    updatedAt: new Date().toISOString(),
  };
}

export async function recordTransitionEvent(
  schoolId: string,
  tutorLearnerId: string,
  sessionId: string,
  previousMode: LearningSessionMode | undefined,
  nextMode: LearningSessionMode,
  reasonCodes: TutorModeTransitionReasonCode[],
  safeSummary?: string,
): Promise<void> {
  await appendSessionEvent({
    schoolId,
    tutorLearnerId,
    sessionId,
    eventType: 'mode_transition',
    previousMode,
    nextMode,
    safeEventSummary: safeSummary || `Transition from ${previousMode || 'none'} to ${nextMode}`,
    reasonCodes,
    privacyMetadata: {},
  });
}
