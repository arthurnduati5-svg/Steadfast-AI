import type {
  RevisionScheduleInput,
  RevisionScheduleDecision,
  RevisionPriority,
  RevisionReason,
} from './task011Contracts';
import { masteryReviewScheduleService } from '../masteryReviewScheduleService';
import { spacedReviewService } from '../spacedReviewService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const scheduledSkills = new Set<string>();

function computePriorityAndReason(
  masteryLevel: string,
  confidenceScore: number,
  mistakeCount: number,
  independentSuccessCount: number,
): { priority: RevisionPriority; reason: RevisionReason } {
  if (mistakeCount >= 3 && independentSuccessCount === 0) {
    return { priority: 'high', reason: 'repeated_mistake' };
  }
  if (mistakeCount >= 1 && independentSuccessCount === 0) {
    return { priority: 'high', reason: 'urgent_review' };
  }
  if (masteryLevel === 'not_started' || masteryLevel === 'emerging') {
    return { priority: 'medium', reason: 'partial_understanding' };
  }
  if (masteryLevel === 'developing') {
    return { priority: 'medium', reason: 'recent_struggle' };
  }
  if (masteryLevel === 'secure') {
    return { priority: 'low', reason: 'maintenance' };
  }
  if (masteryLevel === 'strong') {
    return { priority: 'none', reason: 'no_signal' };
  }
  return { priority: 'none', reason: 'no_signal' };
}

function computeIntervalDays(priority: RevisionPriority, masteryLevel: string): number {
  if (priority === 'high') return 1;
  if (priority === 'medium') return 3;
  if (priority === 'low') {
    if (masteryLevel === 'secure') return 14;
    if (masteryLevel === 'strong') return 30;
    return 7;
  }
  return 30;
}

export class RevisionSchedulingRuntime {
  async scheduleRevision(
    identity: ResolvedTutorIdentity,
    input: RevisionScheduleInput,
  ): Promise<RevisionScheduleDecision> {
    const now = new Date();
    const { priority, reason } = computePriorityAndReason(
      input.currentMasteryLevel,
      input.confidenceScore,
      input.mistakeCount,
      input.independentSuccessCount,
    );

    let intervalDays = computeIntervalDays(priority, input.currentMasteryLevel);

    if (input.mistakeCount >= 3) {
      intervalDays = Math.min(intervalDays, 1);
    } else if (input.independentSuccessCount >= 3) {
      intervalDays = Math.max(intervalDays, 7);
    }

    try {
      const confLevel: 'low' | 'medium' | 'high' =
        input.confidenceScore >= 0.7 ? 'high' : input.confidenceScore >= 0.4 ? 'medium' : 'low';
      const computedInterval = masteryReviewScheduleService.computeReviewIntervalDays(
        input.currentMasteryLevel as any,
        confLevel,
      );
      intervalDays = computedInterval ?? intervalDays;
    } catch {
      // Fallback to default interval calculation
    }

    intervalDays = Math.max(1, Math.min(intervalDays, 90));

    let nextReviewAt: string;
    let shouldSchedule = priority !== 'none';
    let duplicatePrevented = false;

    if (shouldSchedule) {
      const skillKey = `${identity.schoolId}:${identity.studentId}:${input.skillId}`;
      if (scheduledSkills.has(skillKey)) {
        duplicatePrevented = true;
      } else {
        scheduledSkills.add(skillKey);
      }

      const dueDate = addDays(now, intervalDays);
      nextReviewAt = dueDate.toISOString();

      if (!duplicatePrevented) {
        try {
          await spacedReviewService.scheduleReviewFromAttempt(
            identity,
            {
              attemptId: `rev_${input.skillId}_${nowISO()}`,
              schoolId: identity.schoolId,
              studentId: identity.studentId,
              subject: input.subject,
              topic: input.topic,
              skillIds: [input.skillId],
              outcome: 'not_evaluated',
              hintsRequested: 0,
              confidence: input.confidenceScore,
              createdAt: nowISO(),
              status: 'submitted',
              kind: 'review_prompt',
              promptSummary: `Scheduled revision for ${input.skillLabel}`,
              learnerAnswerSummary: null,
              expectedAnswerSummary: null,
              feedbackSummary: null,
              evidence: [],
              misconceptionSignals: [],
              attemptNumber: 0,
            } as any,
            null,
          );
        } catch {
          // Non-blocking
        }
      }
    } else {
      nextReviewAt = addDays(now, intervalDays).toISOString();
    }

    return {
      skillId: input.skillId,
      priority,
      reason,
      nextReviewAt,
      intervalDays,
      shouldSchedule,
      duplicatePrevented,
    };
  }

  _clearForTest(): void {
    scheduledSkills.clear();
  }
}

export const revisionSchedulingRuntime = new RevisionSchedulingRuntime();
