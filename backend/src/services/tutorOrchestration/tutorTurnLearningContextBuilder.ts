import type { TutorTurnOrchestrationInput } from './tutorOrchestrationContracts';

export interface SafeLearningContext {
  requestId: string;
  messageText: string;
  learnerGrade?: string;
  learnerAge?: number;
  clientContext?: {
    displayMode?: 'widget' | 'fullscreen';
    activeSchoolPage?: string;
    subjectHint?: string;
    topicHint?: string;
  };
  safeMemorySummary?: unknown;
  curriculumContext?: unknown;
  subjectModuleDirective?: unknown;
  deenPolicyContext?: unknown;
  safeRecentTurnSummaries?: Array<{
    role: 'learner' | 'assistant' | 'system';
    safeSummary: string;
  }>;
  policyPacket?: unknown;
}

export function buildSafeLearningContext(input: TutorTurnOrchestrationInput): SafeLearningContext {
  return {
    requestId: input.requestId,
    messageText: input.messageText,
    learnerGrade: input.learnerGrade,
    learnerAge: input.learnerAge,
    clientContext: input.clientContext ? {
      displayMode: input.clientContext.displayMode,
      activeSchoolPage: input.clientContext.activeSchoolPage,
      subjectHint: input.clientContext.subjectHint,
      topicHint: input.clientContext.topicHint,
    } : undefined,
  };
}

export function enrichLearningContextWithPolicy(
  context: SafeLearningContext,
  policyPacket: unknown,
): SafeLearningContext {
  return {
    ...context,
    policyPacket,
  };
}

export function enrichLearningContextWithCurriculum(
  context: SafeLearningContext,
  curriculumContext: unknown,
  subjectModuleDirective: unknown,
): SafeLearningContext {
  return {
    ...context,
    curriculumContext,
    subjectModuleDirective,
  };
}

export function enrichLearningContextWithDeenPolicy(
  context: SafeLearningContext,
  deenPolicyContext: unknown,
): SafeLearningContext {
  return {
    ...context,
    deenPolicyContext,
  };
}

export function enrichLearningContextWithMemory(
  context: SafeLearningContext,
  safeMemorySummary: unknown,
): SafeLearningContext {
  return {
    ...context,
    safeMemorySummary,
  };
}

export function enrichLearningContextWithRecentTurns(
  context: SafeLearningContext,
  safeRecentTurnSummaries: Array<{
    role: 'learner' | 'assistant' | 'system';
    safeSummary: string;
  }>,
): SafeLearningContext {
  return {
    ...context,
    safeRecentTurnSummaries,
  };
}
