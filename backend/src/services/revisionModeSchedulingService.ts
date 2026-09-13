import {
  RevisionScheduleResult,
} from '../contracts/revisionModeContracts';

export interface SchedulingInput {
  recallStrengthBucket: string;
  readinessSignal: string;
  mistakeCategory?: string;
  attemptCount: number;
  usedHint: boolean;
  currentIntervalBucket?: string;
  lastReviewedAt?: Date;
  priorityBucket?: string;
  teacherAssigned?: boolean;
  teacherDueAt?: Date;
}

export function calculateNextReview(input: SchedulingInput): RevisionScheduleResult {
  const { recallStrengthBucket, readinessSignal, attemptCount, teacherAssigned, teacherDueAt } = input;

  if (teacherAssigned && teacherDueAt) {
    return {
      nextReviewIntervalBucket: 'teacher_review',
      nextReviewAt: teacherDueAt,
      scheduleReasonCodes: ['teacher_assigned_priority'],
    };
  }

  if (recallStrengthBucket === 'not_attempted') {
    return {
      nextReviewIntervalBucket: 'same_session_retry',
      nextReviewAt: new Date(Date.now() + 5 * 60 * 1000),
      scheduleReasonCodes: ['low_confidence'],
    };
  }

  if (recallStrengthBucket === 'weak') {
    if (attemptCount >= 3) {
      return {
        nextReviewIntervalBucket: 'teacher_review',
        scheduleReasonCodes: ['low_confidence'],
      };
    }
    const minutes = input.priorityBucket === 'high' ? 30 : 60;
    return {
      nextReviewIntervalBucket: 'later_today',
      nextReviewAt: new Date(Date.now() + minutes * 60 * 1000),
      scheduleReasonCodes: ['weak_topic_detected'],
    };
  }

  if (recallStrengthBucket === 'emerging') {
    const hours = input.priorityBucket === 'high' ? 4 : 24;
    return {
      nextReviewIntervalBucket: 'tomorrow',
      nextReviewAt: new Date(Date.now() + hours * 60 * 60 * 1000),
      scheduleReasonCodes: ['weak_topic_detected'],
    };
  }

  if (recallStrengthBucket === 'stable') {
    return {
      nextReviewIntervalBucket: 'one_week',
      nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      scheduleReasonCodes: [],
    };
  }

  if (recallStrengthBucket === 'strong') {
    if (input.priorityBucket === 'high') {
      return {
        nextReviewIntervalBucket: 'one_week',
        nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        scheduleReasonCodes: [],
      };
    }
    return {
      nextReviewIntervalBucket: 'two_weeks',
      nextReviewAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      scheduleReasonCodes: [],
    };
  }

  if (readinessSignal === 'content_gap') {
    return {
      nextReviewIntervalBucket: 'content_gap',
      scheduleReasonCodes: ['content_gap_detected'],
    };
  }

  if (readinessSignal === 'deen_referral') {
    return {
      nextReviewIntervalBucket: 'deen_referral',
      scheduleReasonCodes: ['deen_uncertainty_detected'],
    };
  }

  return {
    nextReviewIntervalBucket: 'none',
    scheduleReasonCodes: [],
  };
}
