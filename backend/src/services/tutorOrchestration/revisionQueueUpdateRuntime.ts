import type { RevisionQueueUpdateResult } from './evidenceAndRevisionContracts';
import type { LearningEvidenceWriteResult } from './evidenceAndRevisionContracts';

export interface RevisionUpdateInput {
  requestId: string;
  evidenceResult: LearningEvidenceWriteResult;
  previousMistakes?: number;
  hintsUsedBeforeSuccess?: number;
}

export function updateRevisionQueue(input: RevisionUpdateInput): RevisionQueueUpdateResult {
  const evidence = input.evidenceResult;

  if (!evidence.evidenceWritten) {
    return {
      requestId: input.requestId,
      revisionUpdated: false,
      revisionAction: 'no_update',
      reason: 'No evidence was written for this turn.',
    };
  }

  if (evidence.evidenceType === 'mistake') {
    const repeatedMistake = input.previousMistakes !== undefined && input.previousMistakes >= 2;

    if (repeatedMistake) {
      return {
        requestId: input.requestId,
        revisionUpdated: true,
        revisionAction: 'add_weak_skill',
        skillTag: evidence.skillTag,
        priority: evidence.confidence === 'high' ? 'high' : 'medium',
        reason: `Repeated mistake pattern detected (${input.previousMistakes} previous occurrences) for ${evidence.skillTag}. Added to revision queue.`,
      };
    }

    return {
      requestId: input.requestId,
      revisionUpdated: true,
      revisionAction: 'increase_priority',
      skillTag: evidence.skillTag,
      priority: 'low',
      reason: `New mistake recorded for ${evidence.skillTag}. Monitoring for pattern.`,
    };
  }

  if (evidence.evidenceType === 'hint_used') {
    const heavyHintDependency = input.hintsUsedBeforeSuccess !== undefined && input.hintsUsedBeforeSuccess >= 3;

    if (heavyHintDependency) {
      return {
        requestId: input.requestId,
        revisionUpdated: true,
        revisionAction: 'schedule_review',
        skillTag: evidence.skillTag,
        priority: 'medium',
        reason: `Learner needed ${input.hintsUsedBeforeSuccess} hints for ${evidence.skillTag}. Scheduling review.`,
      };
    }

    return {
      requestId: input.requestId,
      revisionUpdated: true,
      revisionAction: 'no_update',
      reason: 'Hint used - monitoring continued.',
    };
  }

  if (evidence.evidenceType === 'concept_understood' && evidence.confidence === 'high') {
    return {
      requestId: input.requestId,
      revisionUpdated: true,
      revisionAction: 'decrease_priority',
      skillTag: evidence.skillTag,
      priority: 'low',
      reason: `Learner demonstrated understanding of ${evidence.skillTag}. Decreasing revision priority.`,
    };
  }

  if (evidence.evidenceType === 'concept_understood' && evidence.confidence === 'low') {
    return {
      requestId: input.requestId,
      revisionUpdated: true,
      revisionAction: 'no_update',
      reason: 'Concept exposed but understanding not yet confirmed.',
    };
  }

  if (evidence.evidenceType === 'practice_completed') {
    return {
      requestId: input.requestId,
      revisionUpdated: true,
      revisionAction: 'schedule_review',
      skillTag: evidence.skillTag,
      priority: 'low',
      reason: `Practice completed for ${evidence.skillTag}. Schedule spaced review.`,
    };
  }

  if (evidence.evidenceType === 'attempt') {
    return {
      requestId: input.requestId,
      revisionUpdated: false,
      revisionAction: 'no_update',
      reason: 'Attempt recorded - awaiting outcome before revision update.',
    };
  }

  if (evidence.evidenceType === 'revision_needed') {
    return {
      requestId: input.requestId,
      revisionUpdated: true,
      revisionAction: 'add_weak_skill',
      skillTag: evidence.skillTag,
      priority: 'medium',
      reason: `Revision identified as needed for ${evidence.skillTag}. Added to queue.`,
    };
  }

  return {
    requestId: input.requestId,
    revisionUpdated: false,
    revisionAction: 'no_update',
    reason: 'No revision action needed for this turn.',
  };
}
