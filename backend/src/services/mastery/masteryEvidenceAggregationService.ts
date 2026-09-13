import type {
  MasteryAggregationInput,
  MasteryAggregationResult,
  MasterySignalLevel,
} from './task011Contracts';
import { masteryService } from '../masteryService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function computeMasteryLevel(
  evidenceCount: number,
  independentCorrectCount: number,
  hintDependentCorrectCount: number,
  incorrectCount: number,
  confidenceScore: number,
): MasterySignalLevel {
  if (evidenceCount === 0) return 'not_started';

  const totalCorrect = independentCorrectCount + hintDependentCorrectCount;
  const totalAttempts = totalCorrect + incorrectCount;

  if (totalAttempts === 0) return 'not_started';

  const ratio = totalCorrect / totalAttempts;

  if (ratio <= 0.2 || confidenceScore < 0.1) return 'not_started';

  if (independentCorrectCount >= 5 && ratio >= 0.85 && confidenceScore >= 0.7) return 'strong';

  if (evidenceCount >= 3 && ratio >= 0.75 && confidenceScore >= 0.5) return 'secure';

  if (evidenceCount >= 2 && ratio >= 0.5 && confidenceScore >= 0.3) return 'developing';

  if (evidenceCount >= 1 && ratio >= 0.2) return 'emerging';

  return 'not_started';
}

export class MasteryEvidenceAggregationService {
  async aggregateEvidenceFromAttempt(
    identity: ResolvedTutorIdentity,
    input: MasteryAggregationInput,
  ): Promise<{
    result: MasteryAggregationResult | null;
    fakeMasteryPrevented: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const now = nowISO();

    try {
      const snapshot = await masteryService.getOrCreateMasterySnapshot(identity, {
        subject: input.subject,
        topic: input.topic,
        skillId: input.skillId,
        skillLabel: input.skillLabel,
      });

      if (!snapshot) {
        const result: MasteryAggregationResult = {
          schoolId: identity.schoolId,
          studentId: identity.studentId,
          subject: input.subject,
          topic: input.topic,
          skillId: input.skillId,
          skillLabel: input.skillLabel,
          level: 'not_started',
          confidenceScore: 0,
          evidenceCount: 0,
          attemptCount: 1,
          correctCount: 0,
          incorrectCount: 0,
          independentCorrectCount: 0,
          hintDependentCorrectCount: 0,
          lastAttemptAt: now,
          lastCorrectAt: null,
          lastIncorrectAt: null,
          nextReviewAt: null,
          fakeMasteryPrevented: false,
        };
        return { result, fakeMasteryPrevented: false, warnings };
      }

      const isCorrect = input.outcome === 'correct' || input.outcome === 'partially_correct';
      const isIndependent = input.hintLevel === 0;
      const isIncorrect = input.outcome === 'incorrect';
      const evidenceCount = (snapshot.evidenceCount || 0) + 1;
      const attemptCount = (snapshot.attemptCount || 0) + 1;
      const correctCount = (snapshot.correctCount || 0) + (isCorrect ? 1 : 0);
      const incorrectCount = (snapshot.incorrectCount || 0) + (isIncorrect ? 1 : 0);

      let independentCorrectCount = 0;
      let hintedCorrectCount = 0;
      if (isCorrect && isIndependent) independentCorrectCount = (snapshot.correctCount || 0) + 1;
      else if (isCorrect && !isIndependent) hintedCorrectCount = (snapshot.correctCount || 0) + 1;
      else {
        independentCorrectCount = snapshot.correctCount || 0;
        hintedCorrectCount = snapshot.correctCount || 0;
      }

      let confidenceScore = Math.max(0.05, Math.min(0.95, input.confidence));

      if (isCorrect && isIndependent) confidenceScore = Math.min(0.95, confidenceScore + 0.05);
      else if (isCorrect && !isIndependent) confidenceScore = Math.min(0.85, confidenceScore + 0.02);
      else if (input.outcome === 'partially_correct') confidenceScore = Math.max(0.05, confidenceScore + 0.01);
      else if (isIncorrect) confidenceScore = Math.max(0.05, confidenceScore - 0.06);

      const rawLevel = computeMasteryLevel(evidenceCount, independentCorrectCount, hintedCorrectCount, incorrectCount, confidenceScore);

      const wouldBeSecure = evidenceCount >= 3 && (independentCorrectCount + hintedCorrectCount) >= 3 && confidenceScore >= 0.5;
      const isBelowSecure = rawLevel === 'emerging' || rawLevel === 'developing' || rawLevel === 'not_started';
      const fakeMasteryPrevented = isBelowSecure && wouldBeSecure;

      const effectiveLevel: MasterySignalLevel =
        fakeMasteryPrevented ? 'developing' : rawLevel;

      const result: MasteryAggregationResult = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        subject: input.subject,
        topic: input.topic,
        skillId: input.skillId,
        skillLabel: input.skillLabel,
        level: effectiveLevel,
        confidenceScore,
        evidenceCount,
        attemptCount,
        correctCount,
        incorrectCount,
        independentCorrectCount,
        hintDependentCorrectCount: hintedCorrectCount,
        lastAttemptAt: now,
        lastCorrectAt: isCorrect ? now : snapshot.lastCorrectAt ?? null,
        lastIncorrectAt: isIncorrect ? now : snapshot.lastIncorrectAt ?? null,
        nextReviewAt: snapshot.nextReviewAt ?? null,
        fakeMasteryPrevented,
      };

      try {
        await masteryService.updateCountsFromAggregation(
          identity,
          snapshot.masteryId,
          {
            evidenceCount,
            attemptCount,
            correctCount,
            incorrectCount,
            level: effectiveLevel,
            confidenceScore,
            lastAttemptAt: now,
            lastCorrectAt: isCorrect ? now : snapshot.lastCorrectAt ?? null,
            lastIncorrectAt: isIncorrect ? now : snapshot.lastIncorrectAt ?? null,
          },
        );
      } catch {
        warnings.push('Failed to persist aggregation result to mastery store');
      }

      return { result, fakeMasteryPrevented, warnings };
    } catch (err) {
      warnings.push(`Failed to aggregate mastery evidence: ${String(err)}`);
      return { result: null, fakeMasteryPrevented: false, warnings };
    }
  }
}

export const masteryEvidenceAggregationService = new MasteryEvidenceAggregationService();
