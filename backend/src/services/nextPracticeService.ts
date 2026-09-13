// ─────────────────────────────────────────────────────────────
// Steadfast AI — Next Practice Service v1
// Decides what the tutor should do next based on evidence.
// Decision policy: misconception > incorrect attempt > review due
// > developing mastery > proficient > strong > no data.
// ─────────────────────────────────────────────────────────────

import type {
  NextPracticeRecommendation,
  PracticeRecommendationAction,
  RecommendationPriority,
  SuggestedDifficulty,
  RecommendationSource,
  NextPracticeRequest,
} from './practiceMasteryContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { masteryService } from './masteryService';
import { misconceptionService } from './misconceptionService';
import { spacedReviewService } from './spacedReviewService';
import { practiceAttemptService } from './practiceAttemptService';

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

// ── NextPracticeService ──

export class NextPracticeService {
  /**
   * Recommend the next practice action for the learner.
   * Decision policy:
   *   1. Active misconception → remediate (high)
   *   2. Recent incorrect attempt → reteach/practice_similar (high/medium)
   *   3. Review due → review (medium/high)
   *   4. Developing mastery → practice_similar (medium)
   *   5. Proficient mastery → increase_difficulty (medium)
   *   6. Strong mastery → advance (low/medium)
   *   7. No data → ask_clarifying_question (medium)
   */
  async recommendNextPractice(
    identity: ResolvedTutorIdentity,
    request: NextPracticeRequest,
  ): Promise<NextPracticeRecommendation[]> {
    const recommendations: NextPracticeRecommendation[] = [];
    const now = nowISO();

    const subject = request.subject || null;
    const topic = request.topic || null;
    const skillIds = uniqueStrings(request.skillIds || []);
    const artifactIds = uniqueStrings(request.artifactIds || []);

    // ── 1. Check active misconceptions ──
    const misconceptions = await misconceptionService.listMisconceptions(identity, {
      subject: subject || undefined,
      topic: topic || undefined,
      status: 'active',
      limit: 5,
    });

    if (misconceptions.length > 0) {
      const mcn = misconceptions[0];
      recommendations.push({
        recommendationId: generateId(),
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        action: 'remediate',
        subject: mcn.subject || subject,
        topic: mcn.topic || topic || undefined,
        skillIds: mcn.skillIds,
        reason: `Active misconception: ${mcn.label}. Address directly with simpler example and guided practice.`,
        priority: 'high',
        suggestedDifficulty: 'easy',
        source: 'misconception_signal',
        evidenceIds: [],
        attemptIds: mcn.evidenceAttemptIds,
        memoryIds: mcn.evidenceMemoryIds,
        masteryIds: [],
        artifactIds,
        tutorInstruction: `The student has a recurring misconception: "${mcn.label}". Address this directly with a simpler example and guided practice. Do not advance to new material until this pattern improves.`,
        createdAt: now,
      });
    }

    // ── 2. Check recent incorrect attempts ──
    const recentAttempts = await practiceAttemptService.listPracticeAttempts(identity, {
      subject: subject || undefined,
      topic: topic || undefined,
      limit: 10,
    });

    const recentIncorrect = recentAttempts.find(
      (a) => a.outcome === 'incorrect' || a.outcome === 'partially_correct',
    );

    if (recentIncorrect && misconceptions.length === 0) {
      const action: PracticeRecommendationAction =
        recentIncorrect.outcome === 'incorrect' ? 'reteach' : 'practice_similar';
      recommendations.push({
        recommendationId: generateId(),
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        action,
        subject: recentIncorrect.subject || subject,
        topic: recentIncorrect.topic || topic || undefined,
        skillIds: recentIncorrect.skillIds,
        reason: `Recent ${recentIncorrect.outcome} attempt on ${recentIncorrect.topic || recentIncorrect.subject || 'practice'}. ${
          action === 'reteach' ? 'Reteach with scaffolded steps.' : 'Practice a similar problem.'
        }`,
        priority: 'high',
        suggestedDifficulty: 'medium',
        source: 'practice_attempt',
        evidenceIds: recentIncorrect.evidence.map((e) => e.evidenceId),
        attemptIds: [recentIncorrect.attemptId],
        memoryIds: [],
        masteryIds: [],
        artifactIds: recentIncorrect.artifactId ? [recentIncorrect.artifactId] : artifactIds,
        tutorInstruction: `The student's most recent attempt was ${recentIncorrect.outcome} on ${recentIncorrect.topic || 'the topic'}. ${
          action === 'reteach'
            ? 'Reteach the concept with clear scaffolded steps before moving on.'
            : 'Suggest a similar problem and monitor for the same error pattern.'
        }`,
        createdAt: now,
      });
    }

    // ── 3. Check due reviews ──
    if (recommendations.length === 0) {
      const dueReviews = await spacedReviewService.listDueReviews(identity, {
        subject: subject || undefined,
        topic: topic || undefined,
        limit: 5,
      });

      if (dueReviews.length > 0) {
        const due = dueReviews[0];
        recommendations.push({
          recommendationId: generateId(),
          schoolId: identity.schoolId,
          studentId: identity.studentId,
          action: 'review',
          subject: due.subject || subject,
          topic: due.topic || topic || undefined,
          skillIds: [due.skillId],
          reason: `Spaced review due for ${due.skillLabel || due.topic} (${due.reason}). Scheduled ${due.intervalDays} day${due.intervalDays !== 1 ? 's' : ''} ago.`,
          priority: due.intervalDays <= 2 ? 'high' : 'medium',
          suggestedDifficulty: 'medium',
          source: 'spaced_review',
          evidenceIds: [],
          attemptIds: [],
          memoryIds: [],
          masteryIds: due.masteryId ? [due.masteryId] : [],
          artifactIds,
          tutorInstruction: `The student has a review due for ${due.skillLabel || due.topic}. Spend a few minutes reviewing the core concept. Ask one or two recall questions to check retention before moving deeper.`,
          createdAt: now,
        });
      }
    }

    // ── 4. Check mastery levels ──
    if (recommendations.length === 0) {
      const snapshots = await masteryService.listMasterySnapshots(identity, {
        subject: subject || undefined,
        topic: topic || undefined,
        limit: 10,
      });

      if (snapshots.length > 0) {
        // Find the lowest mastery snapshot
        const lowest = [...snapshots].sort((a, b) => a.confidenceScore - b.confidenceScore)[0];

        if (lowest.level === 'developing' || lowest.level === 'emerging') {
          recommendations.push({
            recommendationId: generateId(),
            schoolId: identity.schoolId,
            studentId: identity.studentId,
            action: 'practice_similar',
            subject: lowest.subject,
            topic: lowest.topic,
            skillIds: [lowest.skillId],
            reason: `Skill "${lowest.skillLabel}" is still ${lowest.level} (confidence: ${Math.round(lowest.confidenceScore * 100)}%). Practice similar problems to build confidence.`,
            priority: 'medium',
            suggestedDifficulty: 'medium',
            source: 'mastery_snapshot',
            evidenceIds: [],
            attemptIds: [],
            memoryIds: [],
            masteryIds: [lowest.masteryId],
            artifactIds,
            tutorInstruction: `The student's "${lowest.skillLabel}" skill is at ${lowest.level} level (${Math.round(lowest.confidenceScore * 100)}% confidence). Suggest one or two similar practice problems to reinforce understanding before advancing.`,
            createdAt: now,
          });
        } else if (lowest.level === 'proficient') {
          recommendations.push({
            recommendationId: generateId(),
            schoolId: identity.schoolId,
            studentId: identity.studentId,
            action: 'increase_difficulty',
            subject: lowest.subject,
            topic: lowest.topic,
            skillIds: [lowest.skillId],
            reason: `Skill "${lowest.skillLabel}" is proficient (confidence: ${Math.round(lowest.confidenceScore * 100)}%). Increase difficulty slightly to challenge the student.`,
            priority: 'medium',
            suggestedDifficulty: 'hard',
            source: 'mastery_snapshot',
            evidenceIds: [],
            attemptIds: [],
            memoryIds: [],
            masteryIds: [lowest.masteryId],
            artifactIds,
            tutorInstruction: `The student shows proficiency in "${lowest.skillLabel}" (${Math.round(lowest.confidenceScore * 100)}%). Present a slightly harder problem to stretch their understanding.`,
            createdAt: now,
          });
        } else if (lowest.level === 'strong') {
          recommendations.push({
            recommendationId: generateId(),
            schoolId: identity.schoolId,
            studentId: identity.studentId,
            action: 'advance',
            subject: lowest.subject,
            topic: lowest.topic,
            skillIds: [lowest.skillId],
            reason: `Skill "${lowest.skillLabel}" is strong (confidence: ${Math.round(lowest.confidenceScore * 100)}%). Ready to advance to next concept.`,
            priority: 'low',
            suggestedDifficulty: 'adaptive',
            source: 'mastery_snapshot',
            evidenceIds: [],
            attemptIds: [],
            memoryIds: [],
            masteryIds: [lowest.masteryId],
            artifactIds,
            tutorInstruction: `The student has strong mastery of "${lowest.skillLabel}" (${Math.round(lowest.confidenceScore * 100)}%). Advance to the next related concept. Optionally do one quick warm-up check first.`,
            createdAt: now,
          });
        }
      }
    }

    // ── 5. No data ──
    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: generateId(),
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        action: 'ask_clarifying_question',
        subject: subject || undefined,
        topic: topic || undefined,
        skillIds: skillIds,
        reason: 'No practice or mastery data available yet for this learner. Start with a diagnostic question to assess current understanding.',
        priority: 'medium',
        suggestedDifficulty: 'unknown',
        source: 'combined',
        evidenceIds: [],
        attemptIds: [],
        memoryIds: [],
        masteryIds: [],
        artifactIds,
        tutorInstruction: 'No practice data exists yet for this learner. Ask a clarifying question or diagnostic prompt to assess their current understanding and establish a baseline.',
        createdAt: now,
      });
    }

    // Bound to maxRecommendations
    const maxRecs = request.maxRecommendations || 3;
    return recommendations.slice(0, maxRecs);
  }
}

// Singleton
export const nextPracticeService = new NextPracticeService();
