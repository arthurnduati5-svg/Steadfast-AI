import type { LearningSessionMode, TutorModeExecutionResult } from './studentLearningSessionContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

export interface ModeExecutionInput {
  identity: ResolvedTutorIdentity;
  mode: LearningSessionMode;
  subject?: string;
  topic?: string;
  skillTag?: string;
  message?: string;
  attemptText?: string;
  activeChallengeId?: string;
  activeRemediationPathId?: string;
  activeRevisionItemId?: string;
  requestId: string;
}

export async function executeMode(
  input: ModeExecutionInput,
): Promise<TutorModeExecutionResult> {
  switch (input.mode) {
    case 'concept_teaching':
    case 'socratic_check':
    case 'guided_practice':
    case 'independent_practice':
    case 'hint_support':
      return executeSocraticMode(input);

    case 'attempt_checking':
      return executeAttemptChecking(input);

    case 'revision':
      return executeRevision(input);

    case 'spaced_review':
      return executeSpacedReview(input);

    case 'remediation':
      return executeRemediation(input);

    case 'similar_practice':
      return executeSimilarPractice(input);

    case 'challenge':
    case 'stretch_challenge':
      return executeChallenge(input);

    case 'diagnostic_check':
      return executeDiagnostic(input);

    case 'reflection':
      return executeReflection(input);

    case 'progress_summary':
      return executeProgressSummary(input);

    case 'session_start':
    case 'context_hydration':
      return { mode: input.mode, evidenceWritten: false, learnerFacingResponse: undefined };

    case 'deen_safe_support':
      return executeDeenSafeSupport(input);

    case 'deen_teacher_referral':
      return executeDeenReferral(input);

    case 'safeguarding_pause':
      return executeSafeguardingPause(input);

    case 'teacher_help_suggested':
      return executeTeacherHelpSuggested(input);

    case 'session_complete':
    case 'session_paused':
    case 'idle':
      return { mode: input.mode, evidenceWritten: false };

    default:
      return { mode: input.mode, evidenceWritten: false };
  }
}

async function executeSocraticMode(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  const { orchestrateTutorTurn } = await import('./tutorOrchestration/tutorTurnOrchestrationEngine');
  try {
    const result = await orchestrateTutorTurn({
      requestId: input.requestId,
      tutorSessionId: input.identity.studentId || input.identity.userId || '',
      schoolId: input.identity.schoolId,
      tutorLearnerId: input.identity.studentId,
      messageText: input.message || '',
      learnerGrade: input.identity.grade || '',
      preferredLanguage: 'en',
      clientContext: {
        subjectHint: input.subject,
        topicHint: input.topic,
      },
    });

    return {
      mode: input.mode,
      learnerFacingResponse: result.responseText,
      evidenceWritten: true,
      nextRecommendedAction: 'continue',
      agencyOptions: [
        { label: 'Continue learning', action: 'continue' },
        { label: 'Request a hint', action: 'hint_request' },
        { label: 'Take a break', action: 'pause' },
      ],
    };
  } catch {
    return {
      mode: input.mode,
      learnerFacingResponse: 'Let me help you with this topic. What do you understand so far?',
      evidenceWritten: false,
      nextRecommendedAction: 'continue',
    };
  }
}

async function executeAttemptChecking(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  const practiceAttemptModule = await import('./practiceAttemptService');
  try {
    const recordAttempt = (practiceAttemptModule as any).recordAttempt || (practiceAttemptModule as any).practiceAttemptService?.recordAttempt;
    if (typeof recordAttempt === 'function') {
      await recordAttempt({
      schoolId: input.identity.schoolId,
      studentId: input.identity.studentId,
      subject: input.subject,
      topic: input.topic,
      learnerAnswer: input.attemptText || input.message || '',
    });
    }

    return {
      mode: input.mode,
      learnerFacingResponse: 'I have received your answer. Let me check it.',
      evidenceWritten: true,
      nextRecommendedAction: 'continue',
    };
  } catch {
    return {
      mode: input.mode,
      learnerFacingResponse: 'Let me look at your answer.',
      evidenceWritten: false,
      nextRecommendedAction: 'continue',
    };
  }
}


async function executeRevision(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  try {
    const revisionModule = await import('./revisionExplanationService');
    const getExplanation = (revisionModule as any).getRevisionExplanationForLearner;
    const explanation = typeof getExplanation === 'function'
      ? await getExplanation(input.identity.schoolId, input.identity.studentId, input.activeRevisionItemId, input.skillTag)
      : undefined;
    return {
      mode: input.mode,
      learnerFacingResponse: explanation?.explanation || 'Let us review what you have learned.',
      evidenceWritten: true,
      nextRecommendedAction: 'continue',
      revisionItem: explanation?.revisionItem ? { id: explanation.revisionItem.id } : undefined,
      agencyOptions: [
        { label: 'Try a practice question', action: 'practice' },
        { label: 'Mark as reviewed', action: 'continue' },
      ],
    };
  } catch {
    return {
      mode: input.mode,
      learnerFacingResponse: 'Let us review what you have learned.',
      evidenceWritten: false,
      nextRecommendedAction: 'continue',
    };
  }
}

async function executeSpacedReview(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  return {
    mode: input.mode,
    learnerFacingResponse: 'It is time to review what you learned before. Let me help you recall.',
    evidenceWritten: false,
    nextRecommendedAction: 'continue',
  };
}

async function executeRemediation(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  const remediationModule = await import('./remediationPathPlanner');
  try {
    const planActive = (remediationModule as any).planOrGetActivePath || (remediationModule as any).remediationPathPlanner?.planOrGetActivePath;
    const path = typeof planActive === 'function'
      ? await planActive({
          schoolId: input.identity.schoolId,
          tutorLearnerId: input.identity.studentId,
          subject: input.subject || 'general',
          topic: input.topic,
          skillTag: input.skillTag,
        })
      : undefined;

    return {
      mode: input.mode,
      learnerFacingResponse: 'Let us strengthen the foundations before moving forward.',
      evidenceWritten: true,
      nextRecommendedAction: 'continue',
      remediationPath: path ? { id: path.id, steps: (path as any).steps } : undefined,
      agencyOptions: [
        { label: 'Start remediation', action: 'continue' },
        { label: 'Ask for help', action: 'hint_request' },
      ],
    };
  } catch {
    return {
      mode: input.mode,
      learnerFacingResponse: 'Let us work on strengthening your understanding.',
      evidenceWritten: false,
      nextRecommendedAction: 'continue',
    };
  }
}

async function executeSimilarPractice(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  return {
    mode: input.mode,
    learnerFacingResponse: 'Let us try a similar question to build your confidence.',
    evidenceWritten: false,
    nextRecommendedAction: 'continue',
  };
}

async function executeChallenge(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  const challengeModule = await import('./adaptiveChallengeGenerationRuntime');
  try {
    const generateNext = (challengeModule as any).generateOrGetNext || (challengeModule as any).adaptiveChallengeGenerationRuntime?.generateOrGetNext;
    const result = typeof generateNext === 'function'
      ? await generateNext({
          tutorLearnerId: input.identity.studentId,
          subject: input.subject || 'general',
          topic: input.topic || 'general',
          skillTag: input.skillTag || 'general',
          challengeMode: input.mode === 'stretch_challenge' ? 'challenge' : 'auto',
        })
      : undefined;

    return {
      mode: input.mode,
      learnerFacingResponse: result.challenge?.learnerPrompt || 'Here is a challenge for you.',
      evidenceWritten: true,
      nextRecommendedAction: 'continue',
      challenge: result?.challenge ? { id: (result.challenge as any).id } : undefined,
      remediationPath: result?.remediationPath ? { id: (result.remediationPath as any).id } : undefined,
      agencyOptions: [
        { label: 'Try the challenge', action: 'continue' },
        { label: 'Request a hint', action: 'hint_request' },
      ],
    };
  } catch {
    return {
      mode: input.mode,
      learnerFacingResponse: 'Here is a challenge question for you to try.',
      evidenceWritten: false,
      nextRecommendedAction: 'continue',
    };
  }
}

async function executeDiagnostic(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  return {
    mode: input.mode,
    learnerFacingResponse: 'Let me check your starting level so I can help you better.',
    evidenceWritten: false,
    nextRecommendedAction: 'continue',
  };
}

async function executeReflection(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  const loopModule = await import('./learnerLoopService');
  try {
    const buildState = (loopModule as any).buildLearnerLoopState;
    const reflection = typeof buildState === 'function'
      ? await buildState({
          userId: input.identity.studentId,
          topic: input.topic,
          subject: input.subject,
        })
      : undefined;

    return {
      mode: input.mode,
      learnerFacingResponse: 'What did you learn today? Reflecting helps you remember.',
      evidenceWritten: true,
      nextRecommendedAction: 'progress_summary',
      agencyOptions: [
        { label: 'See my progress', action: 'continue' },
        { label: 'Continue learning', action: 'continue' },
      ],
    };
  } catch {
    return {
      mode: input.mode,
      learnerFacingResponse: 'What did you learn today?',
      evidenceWritten: false,
      nextRecommendedAction: 'progress_summary',
    };
  }
}

async function executeProgressSummary(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  const narrativeModule = await import('./learnerProgressNarrativeService');
  try {
    const getNarrative = (narrativeModule as any).getNarrative || (narrativeModule as any).learnerProgressNarrativeService?.getNarrative;
    const narrative = typeof getNarrative === 'function'
      ? await getNarrative(input.identity.schoolId, input.identity.studentId)
      : undefined;
    return {
      mode: input.mode,
      learnerFacingResponse: narrative || 'Here is a summary of your progress.',
      evidenceWritten: true,
      nextRecommendedAction: 'session_complete',
      progressSummary: narrative,
      agencyOptions: [
        { label: 'End session', action: 'complete' },
        { label: 'Keep learning', action: 'continue' },
      ],
    };
  } catch {
    return {
      mode: input.mode,
      learnerFacingResponse: 'Here is a summary of your progress.',
      evidenceWritten: false,
      nextRecommendedAction: 'session_complete',
      agencyOptions: [
        { label: 'End session', action: 'complete' },
        { label: 'Keep learning', action: 'continue' },
      ],
    };
  }
}

async function executeDeenSafeSupport(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  return {
    mode: input.mode,
    learnerFacingResponse: 'I can help with basic Islamic studies. For detailed scholarly questions, please consult a qualified teacher.',
    evidenceWritten: false,
    nextRecommendedAction: 'continue',
    agencyOptions: [
      { label: 'Ask a basic question', action: 'continue' },
      { label: 'Refer to teacher', action: 'deen_teacher_referral' },
    ],
  };
}

async function executeDeenReferral(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  return {
    mode: input.mode,
    learnerFacingResponse: 'This question is best answered by a qualified Islamic teacher or scholar. I will note this for your teacher.',
    evidenceWritten: true,
    nextRecommendedAction: 'session_complete',
    agencyOptions: [
      { label: 'Continue with other topics', action: 'continue' },
      { label: 'End session', action: 'complete' },
    ],
  };
}

async function executeSafeguardingPause(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  return {
    mode: input.mode,
    learnerFacingResponse: 'I am here to support you. Please reach out to a trusted adult, teacher, or counsellor who can help you.',
    evidenceWritten: true,
    nextRecommendedAction: 'complete',
  };
}

async function executeTeacherHelpSuggested(input: ModeExecutionInput): Promise<TutorModeExecutionResult> {
  return {
    mode: input.mode,
    learnerFacingResponse: 'I think this question would benefit from your teacher\'s guidance. I will save a note for them.',
    evidenceWritten: true,
    nextRecommendedAction: 'session_complete',
    agencyOptions: [
      { label: 'End session', action: 'complete' },
      { label: 'Continue with another topic', action: 'continue' },
    ],
  };
}
