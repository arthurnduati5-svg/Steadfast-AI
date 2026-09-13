import type { LearningSessionStateRecord, SessionCompletionSummary } from './studentLearningSessionContracts';

const RAW_CONTENT_KEYS = ['rawChat', 'rawPrompt', 'systemPrompt', 'modelDraft', 'providerResponse', 'answerKey', 'solutionSteps', 'privateMemory', 'teacherOnlyNote', 'safeguardingRaw', 'deenSensitiveRawQuestion'];

function stripRawContent(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!RAW_CONTENT_KEYS.includes(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export async function generateSessionCompletionSummary(
  schoolId: string,
  tutorLearnerId: string,
  sessionState: LearningSessionStateRecord,
): Promise<SessionCompletionSummary> {
  const whatWasPracticed: string[] = [];
  const whatImproved: string[] = [];
  const whatNeedsReview: string[] = [];

  if (sessionState.subject) whatWasPracticed.push(sessionState.subject);
  if (sessionState.topic) whatWasPracticed.push(sessionState.topic);
  if (sessionState.skillTag) whatWasPracticed.push(sessionState.skillTag);

  if (sessionState.currentMode === 'challenge' || sessionState.currentMode === 'stretch_challenge') {
    whatImproved.push('Challenging yourself with advanced problems');
  }
  if (sessionState.currentMode === 'revision' || sessionState.currentMode === 'spaced_review') {
    whatImproved.push('Reviewing previous concepts');
  }
  if (sessionState.currentMode === 'remediation') {
    whatImproved.push('Strengthening foundational skills');
  }
  if (sessionState.currentMode === 'attempt_checking' || sessionState.currentMode === 'guided_practice') {
    whatImproved.push('Practice and application');
  }

  if (sessionState.reasonCodes.includes('repeated_mistake') || sessionState.reasonCodes.includes('low_mastery')) {
    whatNeedsReview.push('Repeated mistakes need attention');
  }
  if (sessionState.reasonCodes.includes('revision_due')) {
    whatNeedsReview.push('Revision items are due');
  }

  const nextStep = sessionState.currentMode === 'session_complete'
    ? 'Start a new session to continue learning'
    : `Continue in ${sessionState.currentMode} mode`;

  return {
    sessionId: sessionState.id,
    subject: sessionState.subject,
    topic: sessionState.topic,
    skillTag: sessionState.skillTag,
    whatWasPracticed,
    whatImproved,
    whatNeedsReview,
    nextRecommendedStep: nextStep,
    revisionStatus: sessionState.reasonCodes.includes('revision_due') ? 'due' : 'up_to_date',
    challengeStatus: sessionState.currentMode === 'challenge' || sessionState.currentMode === 'stretch_challenge' ? 'in_progress' : 'available',
    remediationStatus: sessionState.activeRemediationPathId ? 'in_progress' : 'not_needed',
    safeEvidenceCount: sessionState.safeEvidenceRefs.length,
    privacyMetadata: stripRawContent(sessionState.privacyMetadata as Record<string, unknown>),
  };
}
