// ─────────────────────────────────────────────────────────────
// Steadfast AI — Mastery Resolver v1
// Resolves practice and mastery context for TutorTurnContext.
// Loads snapshots, misconceptions, recent attempts, due reviews,
// and next-practice recommendations.  Bounded and safe.
// ─────────────────────────────────────────────────────────────

import type {
  MasteryPracticeContext,
  MasteryPracticeContextStatus,
  MasteryContextSignal,
  NextPracticeRecommendation,
  ResolveMasteryRequest,
} from './practiceMasteryContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { masteryService } from './masteryService';
import { misconceptionService } from './misconceptionService';
import { practiceAttemptService } from './practiceAttemptService';
import { spacedReviewService } from './spacedReviewService';
import { nextPracticeService } from './nextPracticeService';

function nowISO(): string {
  return new Date().toISOString();
}

// ── MasteryResolver ──

export class MasteryResolver {
  /**
   * Resolve mastery/practice context for TutorTurnContext.
   */
  async resolveMasteryPracticeContext(
    identity: ResolvedTutorIdentity,
    request: ResolveMasteryRequest,
  ): Promise<MasteryPracticeContext> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const resolvedAt = nowISO();

    const maxSignals = request.maxSignals || 8;
    const includeReviewDue = request.includeReviewDue !== false;
    const includeNextPractice = request.includeNextPractice !== false;

    const masteryIdsUsed: string[] = [];
    const attemptIdsUsed: string[] = [];
    const misconceptionIdsUsed: string[] = [];
    const reviewIdsUsed: string[] = [];

    try {
      // ── 1. Load active mastery snapshots ──
      const snapshots = await masteryService.listMasterySnapshots(identity, {
        subject: request.subject || undefined,
        topic: request.topic || undefined,
        limit: 50,
      });

      for (const s of snapshots) masteryIdsUsed.push(s.masteryId);

      // ── 2. Load active misconceptions ──
      const misconceptions = await misconceptionService.listMisconceptions(identity, {
        subject: request.subject || undefined,
        topic: request.topic || undefined,
        limit: 20,
      });

      for (const m of misconceptions) misconceptionIdsUsed.push(m.misconceptionId);

      // ── 3. Load recent practice attempts ──
      const recentAttempts = await practiceAttemptService.listPracticeAttempts(identity, {
        subject: request.subject || undefined,
        topic: request.topic || undefined,
        limit: 20,
      });

      for (const a of recentAttempts) attemptIdsUsed.push(a.attemptId);

      // ── 4. Load due review items ──
      let dueReviews: Awaited<ReturnType<typeof spacedReviewService.listDueReviews>> = [];
      if (includeReviewDue) {
        dueReviews = await spacedReviewService.listDueReviews(identity, {
          subject: request.subject || undefined,
          topic: request.topic || undefined,
          limit: 20,
        });
        for (const r of dueReviews) reviewIdsUsed.push(r.reviewId);
      }

      // ── Determine status ──
      let status: MasteryPracticeContextStatus = 'no_data_yet';
      if (snapshots.length > 0 || misconceptions.length > 0 || recentAttempts.length > 0) {
        status = 'resolved';
      }
      if (errors.length > 0 && (snapshots.length > 0 || misconceptions.length > 0)) {
        status = 'partial';
      }

      // ── Build signal arrays ──
      const masterySignals: MasteryContextSignal[] = snapshots.slice(0, maxSignals).map((s) => ({
        id: s.masteryId,
        label: s.skillLabel,
        summary: `${s.skillLabel}: ${s.level} (conf: ${Math.round(s.confidenceScore * 100)}%, attempts: ${s.attemptCount})`,
        source: `mastery:${s.level}`,
        confidence: s.confidenceScore,
        updatedAt: s.updatedAt,
      }));

      const misconceptionSignals: MasteryContextSignal[] = misconceptions
        .filter((m) => m.status === 'active')
        .slice(0, maxSignals)
        .map((m) => ({
          id: m.misconceptionId,
          label: m.label,
          summary: m.summary,
          source: `misconception:${m.status}`,
          confidence: m.confidenceScore,
          updatedAt: m.lastObservedAt,
        }));

      const recentPracticeSignals: MasteryContextSignal[] = recentAttempts.slice(0, maxSignals).map((a) => ({
        id: a.attemptId,
        label: `Practice: ${a.outcome}`,
        summary: `${a.outcome} on ${a.topic || a.subject || 'practice'} (kind: ${a.kind})`,
        source: `practice:${a.outcome}`,
        confidence: a.outcome === 'correct' ? 0.7 : a.outcome === 'incorrect' ? 0.3 : 0.5,
        updatedAt: a.createdAt,
      }));

      const reviewDueSignals: MasteryContextSignal[] = dueReviews.slice(0, maxSignals).map((r) => ({
        id: r.reviewId,
        label: `Review due: ${r.skillLabel || r.topic}`,
        summary: `Review ${r.skillLabel || r.topic} - due ${r.dueAt} (${r.reason})`,
        source: `review:${r.status}`,
        confidence: r.intervalDays <= 2 ? 0.8 : 0.5,
        updatedAt: r.dueAt,
      }));

      // ── Next practice recommendations ──
      let nextPracticeRecommendations: NextPracticeRecommendation[] = [];
      if (includeNextPractice) {
        try {
          nextPracticeRecommendations = await nextPracticeService.recommendNextPractice(identity, {
            sessionId: request.sessionId || null,
            subject: request.subject || null,
            topic: request.topic || null,
            skillIds: request.skillIds || [],
            artifactIds: request.artifactIds || [],
            maxRecommendations: 3,
          });
        } catch (err) {
          warnings.push(`Failed to generate next practice recommendations: ${String(err)}`);
        }
      }

      return {
        status,
        masterySignals,
        misconceptionSignals,
        recentPracticeSignals,
        reviewDueSignals,
        nextPracticeRecommendations,
        masteryIdsUsed,
        attemptIdsUsed,
        misconceptionIdsUsed,
        reviewIdsUsed,
        warnings,
        errors,
        resolvedAt,
      };
    } catch (err) {
      errors.push(`Mastery resolver failed: ${String(err)}`);
      return {
        status: 'error',
        masterySignals: [],
        misconceptionSignals: [],
        recentPracticeSignals: [],
        reviewDueSignals: [],
        nextPracticeRecommendations: [],
        masteryIdsUsed: [],
        attemptIdsUsed: [],
        misconceptionIdsUsed: [],
        reviewIdsUsed: [],
        warnings,
        errors,
        resolvedAt,
      };
    }
  }
}

// Singleton
export const masteryResolver = new MasteryResolver();
