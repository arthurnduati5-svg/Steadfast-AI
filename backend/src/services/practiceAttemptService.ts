// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Attempt Service v1
// Records and retrieves practice attempts, integrates with
// Learner Memory, Learning Events, Mastery, Misconceptions,
// and spaced review.  Evidence-based, school-scoped.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import type {
  PracticeAttempt,
  PracticeAttemptKind,
  PracticeAttemptStatus,
  PracticeOutcome,
  MasteryEvidence,
  MasteryEvidenceSource,
  CreatePracticeAttemptRequest,
  PracticeMisconceptionSignalInput,
} from './practiceMasteryContracts';
import {
  clampConfidence,
  computeMasteryConfidenceDelta,
} from './practiceMasteryContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { learningEventService } from './learningEventService';
import { masteryService } from './masteryService';
import { misconceptionService } from './misconceptionService';
import { spacedReviewService } from './spacedReviewService';
import { nextPracticeService } from './nextPracticeService';
import { learnerMemoryService } from './learnerMemoryService';
import { commitPracticeLearningEvidence } from './practiceCanonicalLearningService';

// ── In-memory fallback store ──
const attemptStore = new Map<string, PracticeAttempt>();
const attemptLookupByKey = new Map<string, string[]>(); // schoolId:studentId -> attemptId[]

let _prismaAvailable: boolean | null = null;

async function isPrismaAvailable(): Promise<boolean> {
  if (_prismaAvailable !== null) return _prismaAvailable;
  try {
    await (prisma as any).$queryRaw`SELECT 1`;
    _prismaAvailable = true;
  } catch {
    _prismaAvailable = false;
  }
  return _prismaAvailable;
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

function memoryKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

// ── PracticeAttemptService ──

export class PracticeAttemptService {
  /**
   * Create a practice attempt and propagate to downstream systems.
   */
  async createPracticeAttempt(
    identity: ResolvedTutorIdentity,
    request: CreatePracticeAttemptRequest,
  ): Promise<{
    attempt: PracticeAttempt;
    masteryUpdates: any[];
    memoryUpdates: any[];
    reviewItems: any[];
    recommendations: any[];
    warnings: string[];
  }> {
    const now = nowISO();
    const attemptId = generateId();
    const warnings: string[] = [];

    const outcome = request.outcome || 'not_evaluated';
    const status: PracticeAttemptStatus = outcome === 'not_evaluated' ? 'submitted' : 'evaluated';
    const confidence = typeof request.confidence === 'number' ? clampConfidence(request.confidence) : 0.3;

    // Build evidence array from attempt
    const evidence: MasteryEvidence[] = [
      {
        evidenceId: `evd_${attemptId}_0`,
        source: 'practice_attempt',
        sourceId: attemptId,
        summary: request.promptSummary.slice(0, 200),
        outcome,
        subject: request.subject?.trim() || null,
        topic: request.topic?.trim() || null,
        skillIds: uniqueStrings(request.skillIds || []),
        artifactId: request.artifactId?.trim() || null,
        artifactBlockId: request.artifactBlockId?.trim() || null,
        confidence,
        observedAt: now,
      },
    ];

    // Normalize misconception signals
    const misconceptionSignals: PracticeMisconceptionSignalInput[] = (request.misconceptionSignals || []).map(
      (s) => ({
        label: s.label.trim().slice(0, 160),
        summary: s.summary.trim().slice(0, 1200),
        confidence: typeof s.confidence === 'number' ? Math.max(0, Math.min(1, s.confidence)) : 0.5,
        skillIds: uniqueStrings(s.skillIds || []),
      }),
    );

    const attempt: PracticeAttempt = {
      attemptId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      sessionId: request.sessionId?.trim() || null,
      kind: request.kind,
      status,
      outcome,
      subject: request.subject?.trim() || null,
      topic: request.topic?.trim() || null,
      skillIds: uniqueStrings(request.skillIds || []),
      promptSummary: request.promptSummary.trim().slice(0, 1200),
      learnerAnswerSummary: request.learnerAnswerSummary?.trim().slice(0, 1200) || null,
      expectedAnswerSummary: request.expectedAnswerSummary?.trim().slice(0, 1200) || null,
      feedbackSummary: request.feedbackSummary?.trim().slice(0, 1200) || null,
      artifactId: request.artifactId?.trim() || null,
      artifactBlockId: request.artifactBlockId?.trim() || null,
      sourceQuestionId: request.sourceQuestionId?.trim() || null,
      hintsRequested: request.hintsRequested ?? 0,
      attemptNumber: request.attemptNumber ?? 1,
      timeSpentSeconds: request.timeSpentSeconds ?? null,
      confidence,
      misconceptionSignals,
      evidence,
      createdAt: now,
      evaluatedAt: outcome === 'not_evaluated' ? null : now,
    };

    // In-memory store
    attemptStore.set(attemptId, attempt);
    const key = memoryKey(identity.schoolId, identity.studentId);
    const existing = attemptLookupByKey.get(key) || [];
    existing.push(attemptId);
    attemptLookupByKey.set(key, existing);

    // Try Prisma persistence
    await this._persistPrismaAttempt(attempt);

    // ── R6: join the canonical academic chain ──
    // PracticeAttempt → Learning Evidence (sourceType = practice_attempt) →
    // canonical Mastery (same committed evidence ID) when eligible.
    // Idempotent + concurrency-safe via the durable receipt. Without a trusted
    // server-owned evaluator the evidence is unscored and NO positive mastery
    // is created. Client-supplied outcome is a self-report, not correctness truth.
    try {
      const trustedOutcome =
        outcome === 'correct' || outcome === 'partially_correct' || outcome === 'incorrect'
          ? null // no trusted server evaluator exists yet — never trust client outcome
          : null;
      const canonical = await commitPracticeLearningEvidence({
        schoolId: identity.schoolId,
        learnerId: identity.studentId,
        attemptId,
        clientRequestId: request.sessionId || attemptId,
        subject: request.subject || null,
        topic: request.topic || null,
        curriculumObjectiveId: null,
        curriculumSkillId: null,
        curriculumTopicId: null,
        hintsUsed: request.hintsRequested ?? 0,
        trustedOutcome,
      });
      if (canonical.deduplicated) {
        warnings.push('practice_canonical_deduplicated');
      }
    } catch (err) {
      warnings.push(`Failed to commit canonical practice evidence: ${String(err)}`);
    }

    // ── Write Learning Event ──
    const eventKind = this._outcomeToEventKind(outcome, request.kind);
    try {
      const signals: any[] = [];
      if (outcome === 'correct' || outcome === 'partially_correct') {
        signals.push({
          signalId: `sig_${attemptId}_strength`,
          kind: 'early_mastery_signal',
          label: `Practice outcome: ${outcome}`,
          summary: `Student ${outcome} on ${request.topic || request.subject || 'practice'}.`,
          subject: request.subject?.trim() || null,
          topic: request.topic?.trim() || null,
          skillIds: uniqueStrings(request.skillIds || []),
          confidence: outcome === 'correct' ? 0.3 : 0.15,
          evidenceSummary: request.promptSummary.slice(0, 200),
          artifactId: request.artifactId?.trim() || null,
          artifactBlockId: request.artifactBlockId?.trim() || null,
        });
      } else if (outcome === 'incorrect') {
        signals.push({
          signalId: `sig_${attemptId}_mistake`,
          kind: 'recent_mistake',
          label: `Incorrect practice: ${request.topic || request.subject || 'practice'}`,
          summary: `Student answered incorrectly on ${request.topic || request.subject || 'practice'}.`,
          subject: request.subject?.trim() || null,
          topic: request.topic?.trim() || null,
          skillIds: uniqueStrings(request.skillIds || []),
          confidence: 0.4,
          evidenceSummary: request.promptSummary.slice(0, 200),
          artifactId: request.artifactId?.trim() || null,
          artifactBlockId: request.artifactBlockId?.trim() || null,
        });
      }

      await learningEventService.createLearningEvent(identity, {
        sessionId: request.sessionId || null,
        kind: eventKind,
        subject: request.subject?.trim() || null,
        topic: request.topic?.trim() || null,
        skillIds: uniqueStrings(request.skillIds || []),
        artifactId: request.artifactId?.trim() || null,
        artifactBlockId: request.artifactBlockId?.trim() || null,
        promptSummary: request.promptSummary.trim().slice(0, 1000) || null,
        responseSummary: request.learnerAnswerSummary?.trim().slice(0, 1000) || null,
        outcomeSummary: outcome,
        signals,
        source: 'practice',
      });
    } catch (err) {
      warnings.push(`Failed to create learning event: ${String(err)}`);
    }

    // Track downstream results
    const masteryUpdates: any[] = [];
    const memoryUpdates: any[] = [];
    const reviewItems: any[] = [];
    let recommendations: any[] = [];

    // ── Reduce into Learner Memory (if evaluated with signals) ──
    if (status === 'evaluated') {
      try {
        // Create learning event with signals for memory reducer
        const eventSignals: any[] = [];
        if (outcome === 'correct' || outcome === 'partially_correct') {
          eventSignals.push({
            kind: 'early_mastery_signal' as const,
            label: `Practice outcome: ${outcome}`,
            summary: request.promptSummary.slice(0, 200),
            evidenceSummary: `Student ${outcome} on ${request.topic || request.subject || 'practice'}.`,
            confidence: outcome === 'correct' ? 0.3 : 0.15,
            skillIds: uniqueStrings(request.skillIds || []),
            subject: request.subject?.trim() || undefined,
            topic: request.topic?.trim() || undefined,
            artifactId: request.artifactId?.trim() || undefined,
            artifactBlockId: request.artifactBlockId?.trim() || undefined,
          });
        } else if (outcome === 'incorrect') {
          eventSignals.push({
            kind: 'recent_mistake' as const,
            label: `Incorrect practice: ${request.topic || request.subject || 'practice'}`,
            summary: `Student answered incorrectly`,
            evidenceSummary: request.promptSummary.slice(0, 200),
            confidence: 0.4,
            skillIds: uniqueStrings(request.skillIds || []),
            subject: request.subject?.trim() || undefined,
            topic: request.topic?.trim() || undefined,
            artifactId: request.artifactId?.trim() || undefined,
            artifactBlockId: request.artifactBlockId?.trim() || undefined,
          });
        }

        if (eventSignals.length > 0) {
          const event = await learningEventService.createLearningEvent(identity, {
            sessionId: request.sessionId || null,
            kind: this._outcomeToEventKind(outcome, request.kind),
            subject: request.subject?.trim() || null,
            topic: request.topic?.trim() || null,
            skillIds: uniqueStrings(request.skillIds || []),
            artifactId: request.artifactId?.trim() || null,
            artifactBlockId: request.artifactBlockId?.trim() || null,
            promptSummary: request.promptSummary.trim().slice(0, 1000) || null,
            responseSummary: request.learnerAnswerSummary?.trim().slice(0, 1000) || null,
            outcomeSummary: outcome,
            signals: eventSignals,
            source: 'practice',
          });

          // Run reducer for memory candidates
          const { learnerMemoryReducer } = await import('./learnerMemoryReducer');
          const candidates = learnerMemoryReducer.reduceLearningEventToMemoryCandidates(event);

          for (const candidate of candidates) {
            const existingMemory = await learnerMemoryService.listLearnerMemory(identity, {
              kind: candidate.kind,
              subject: candidate.subject || undefined,
              topic: candidate.topic || undefined,
              limit: 5,
            });

            const matched = existingMemory.find((mem: any) =>
              mem.kind === candidate.kind &&
              mem.subject === candidate.subject &&
              mem.topic === candidate.topic,
            );

            if (matched) {
              const updated = await learnerMemoryService.appendEvidenceToLearnerMemory(
                identity,
                matched.memoryId,
                candidate.evidence,
              );
              memoryUpdates.push(updated);
            } else {
              const created = await learnerMemoryService.createLearnerMemory(identity, {
                kind: candidate.kind,
                visibility: 'system_only',
                subject: candidate.subject || undefined,
                topic: candidate.topic || undefined,
                skillIds: candidate.skillIds,
                label: candidate.label,
                summary: candidate.summary,
                tutorUse: candidate.tutorUse,
                evidence: candidate.evidence.map((e: any) => ({
                  source: e.source as any,
                  summary: e.summary,
                  subject: e.subject || undefined,
                  topic: e.topic || undefined,
                  skillIds: e.skillIds,
                  artifactId: e.artifactId || undefined,
                  artifactBlockId: e.artifactBlockId || undefined,
                  confidence: e.confidence,
                  safeQuote: e.safeQuote || undefined,
                })),
                confidence: candidate.confidence as any,
                artifactIds: candidate.artifactIds,
                artifactBlockIds: candidate.artifactBlockIds,
              });
              memoryUpdates.push(created);
            }
          }
        }
      } catch (err) {
        warnings.push(`Failed to reduce memory signals: ${String(err)}`);
      }
    }

    // ── Update Mastery (only if evaluated and skillIds exist) ──
    if (status === 'evaluated') {
      const skillIds = uniqueStrings(request.skillIds || []);
      if (skillIds.length === 0) {
        warnings.push('mastery_update_skipped_no_skill_ids');
      } else {
        try {
          const updates = await masteryService.updateMasteryFromAttempt(identity, attempt);
          masteryUpdates.push(...updates);
        } catch (err) {
          warnings.push(`Failed to update mastery: ${String(err)}`);
        }
      }

      // ── Update Misconceptions ──
      if (misconceptionSignals.length > 0) {
        try {
          await misconceptionService.upsertMisconceptionsFromAttempt(identity, attempt);
        } catch (err) {
          warnings.push(`Failed to update misconceptions: ${String(err)}`);
        }
      }

      // ── Schedule Review ──
      try {
        const review = await spacedReviewService.scheduleReviewFromAttempt(
          identity,
          attempt,
          masteryUpdates.length > 0 ? masteryUpdates[0] : null,
        );
        if (review) reviewItems.push(review);
      } catch (err) {
        warnings.push(`Failed to schedule review: ${String(err)}`);
      }

      // ── Next Practice Recommendations ──
      try {
        recommendations = await nextPracticeService.recommendNextPractice(identity, {
          sessionId: request.sessionId || null,
          subject: request.subject?.trim() || null,
          topic: request.topic?.trim() || null,
          skillIds: uniqueStrings(request.skillIds || []),
          artifactIds: request.artifactId ? [request.artifactId] : [],
          maxRecommendations: 3,
        });
      } catch (err) {
        warnings.push(`Failed to generate recommendations: ${String(err)}`);
      }
    }

    return {
      attempt,
      masteryUpdates,
      memoryUpdates,
      reviewItems,
      recommendations,
      warnings,
    };
  }

  /**
   * Evaluate a previously submitted practice attempt.
   * Updates status, outcome, evaluatedAt, and propagates to downstream systems.
   */
  async evaluatePracticeAttempt(
    identity: ResolvedTutorIdentity,
    attemptId: string,
    evaluation: {
      outcome: PracticeOutcome;
      feedbackSummary?: string | null;
      confidence?: number;
      hintsRequested?: number;
      misconceptionSignals?: PracticeMisconceptionSignalInput[];
    },
  ): Promise<{
    attempt: PracticeAttempt;
    masteryUpdates: any[];
    memoryUpdates: any[];
    reviewItems: any[];
    recommendations: any[];
    warnings: string[];
  }> {
    const existing = await this.getPracticeAttempt(identity, attemptId);
    if (!existing) {
      throw new Error(`Practice attempt not found: ${attemptId}`);
    }
    if (existing.status !== 'submitted') {
      throw new Error(`Practice attempt ${attemptId} already evaluated (status: ${existing.status})`);
    }

    const now = nowISO();
    const updatedAttempt: PracticeAttempt = {
      ...existing,
      status: 'evaluated',
      outcome: evaluation.outcome,
      evaluatedAt: now,
      feedbackSummary: evaluation.feedbackSummary?.trim().slice(0, 1200) || existing.feedbackSummary,
      confidence: typeof evaluation.confidence === 'number' ? clampConfidence(evaluation.confidence) : existing.confidence,
      hintsRequested: evaluation.hintsRequested ?? existing.hintsRequested,
      misconceptionSignals: evaluation.misconceptionSignals
        ? evaluation.misconceptionSignals.map((s) => ({
            label: s.label.trim().slice(0, 160),
            summary: s.summary.trim().slice(0, 1200),
            confidence: typeof s.confidence === 'number' ? Math.max(0, Math.min(1, s.confidence)) : 0.5,
            skillIds: uniqueStrings(s.skillIds || []),
          }))
        : existing.misconceptionSignals,
    };

    attemptStore.set(attemptId, updatedAttempt);
    await this._persistPrismaAttempt(updatedAttempt);

    // Re-run downstream propagation as if this was a new evaluated attempt
    const downstreamResult = await this._propagateDownstream(identity, updatedAttempt, existing.misconceptionSignals);

    return {
      attempt: updatedAttempt,
      masteryUpdates: downstreamResult.masteryUpdates,
      memoryUpdates: downstreamResult.memoryUpdates,
      reviewItems: downstreamResult.reviewItems,
      recommendations: downstreamResult.recommendations,
      warnings: downstreamResult.warnings,
    };
  }

  /**
   * Propagate a practice attempt to downstream systems (mastery, misconceptions, review).
   */
  private async _propagateDownstream(
    identity: ResolvedTutorIdentity,
    attempt: PracticeAttempt,
    existingSignals: PracticeMisconceptionSignalInput[],
  ): Promise<{
    masteryUpdates: any[];
    memoryUpdates: any[];
    reviewItems: any[];
    recommendations: any[];
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const masteryUpdates: any[] = [];
    const memoryUpdates: any[] = [];
    const reviewItems: any[] = [];
    let recommendations: any[] = [];

    const skillIds = uniqueStrings(attempt.skillIds);
    if (skillIds.length === 0) {
      warnings.push('mastery_update_skipped_no_skill_ids');
    } else {
      try {
        const updates = await masteryService.updateMasteryFromAttempt(identity, attempt);
        masteryUpdates.push(...updates);
      } catch (err) {
        warnings.push(`Failed to update mastery: ${String(err)}`);
      }
    }

    if (attempt.misconceptionSignals.length > 0) {
      try {
        await misconceptionService.upsertMisconceptionsFromAttempt(identity, attempt);
      } catch (err) {
        warnings.push(`Failed to update misconceptions: ${String(err)}`);
      }
    }

    try {
      const review = await spacedReviewService.scheduleReviewFromAttempt(
        identity,
        attempt,
        masteryUpdates.length > 0 ? masteryUpdates[0] : null,
      );
      if (review) reviewItems.push(review);
    } catch (err) {
      warnings.push(`Failed to schedule review: ${String(err)}`);
    }

    try {
      recommendations = await nextPracticeService.recommendNextPractice(identity, {
        sessionId: attempt.sessionId || null,
        subject: attempt.subject || null,
        topic: attempt.topic || null,
        skillIds,
        artifactIds: attempt.artifactId ? [attempt.artifactId] : [],
        maxRecommendations: 3,
      });
    } catch (err) {
      warnings.push(`Failed to generate recommendations: ${String(err)}`);
    }

    return { masteryUpdates, memoryUpdates, reviewItems, recommendations, warnings };
  }

  /**
   * List practice attempts for the authenticated learner.
   */
  async listPracticeAttempts(
    identity: ResolvedTutorIdentity,
    options?: {
      subject?: string;
      topic?: string;
      skillId?: string;
      limit?: number;
    },
  ): Promise<PracticeAttempt[]> {
    const limit = options?.limit || 50;

    // Try Prisma first
    const fromDb = await this._listPrismaAttempts(identity, options);
    if (fromDb && fromDb.length > 0) {
      return fromDb.slice(0, limit);
    }

    // Fallback: in-memory
    const key = memoryKey(identity.schoolId, identity.studentId);
    const attemptIds = attemptLookupByKey.get(key) || [];
    const results: PracticeAttempt[] = [];

    for (const aid of attemptIds) {
      const a = attemptStore.get(aid);
      if (!a) continue;
      if (a.schoolId !== identity.schoolId || a.studentId !== identity.studentId) continue;
      if (options?.subject && a.subject !== options.subject) continue;
      if (options?.topic && a.topic !== options.topic) continue;
      if (options?.skillId && !a.skillIds.includes(options.skillId)) continue;
      results.push(a);
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return results.slice(0, limit);
  }

  /**
   * Get a single practice attempt.
   */
  async getPracticeAttempt(
    identity: ResolvedTutorIdentity,
    attemptId: string,
  ): Promise<PracticeAttempt | null> {
    const mem = attemptStore.get(attemptId);
    if (mem) {
      if (mem.schoolId !== identity.schoolId || mem.studentId !== identity.studentId) return null;
      return mem;
    }
    return this._getPrismaAttempt(identity, attemptId);
  }

  // ── Outcome → Event Kind mapping ──
  private _outcomeToEventKind(
    outcome: PracticeOutcome,
    kind: PracticeAttemptKind,
  ): any {
    if (outcome === 'correct') return 'corrected_mistake';
    if (outcome === 'partially_correct') return 'answered_question';
    if (outcome === 'incorrect') return 'made_mistake';
    if (outcome === 'unclear') return 'answered_question';
    return 'completed_practice';
  }

  // ── Prisma helpers ──

  private async _persistPrismaAttempt(attempt: PracticeAttempt): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    try {
      await (prisma as any).practiceAttempt.create({
        data: {
          id: attempt.attemptId,
          schoolId: attempt.schoolId,
          studentId: attempt.studentId,
          sessionId: attempt.sessionId,
          kind: attempt.kind,
          status: attempt.status,
          outcome: attempt.outcome,
          subject: attempt.subject,
          topic: attempt.topic,
          skillIds: attempt.skillIds as any,
          promptSummary: attempt.promptSummary,
          learnerAnswerSummary: attempt.learnerAnswerSummary,
          expectedAnswerSummary: attempt.expectedAnswerSummary,
          feedbackSummary: attempt.feedbackSummary,
          artifactId: attempt.artifactId,
          artifactBlockId: attempt.artifactBlockId,
          sourceQuestionId: attempt.sourceQuestionId,
          hintsRequested: attempt.hintsRequested,
          attemptNumber: attempt.attemptNumber,
          timeSpentSeconds: attempt.timeSpentSeconds,
          confidence: attempt.confidence,
          misconceptionSignals: attempt.misconceptionSignals as any,
          evidence: attempt.evidence as any,
          evaluatedAt: attempt.evaluatedAt ? new Date(attempt.evaluatedAt) : null,
        },
      });
    } catch {
      // Prisma unavailable — in-memory copy is already stored
    }
  }

  private async _listPrismaAttempts(
    identity: ResolvedTutorIdentity,
    options?: {
      subject?: string;
      topic?: string;
      skillId?: string;
      limit?: number;
    },
  ): Promise<PracticeAttempt[] | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const where: Record<string, any> = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
      };
      if (options?.subject) where.subject = options.subject;
      if (options?.topic) where.topic = options.topic;

      const records = await (prisma as any).practiceAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
      });
      if (!records || records.length === 0) return null;
      return records.map((r: any) => this._mapPrismaAttempt(r));
    } catch {
      return null;
    }
  }

  private async _getPrismaAttempt(
    identity: ResolvedTutorIdentity,
    attemptId: string,
  ): Promise<PracticeAttempt | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const record = await (prisma as any).practiceAttempt.findUnique({
        where: { id: attemptId },
      });
      if (!record) return null;
      if (record.schoolId !== identity.schoolId || record.studentId !== identity.studentId) return null;
      return this._mapPrismaAttempt(record);
    } catch {
      return null;
    }
  }

  private _mapPrismaAttempt(record: any): PracticeAttempt {
    return {
      attemptId: record.id,
      schoolId: record.schoolId,
      studentId: record.studentId,
      sessionId: record.sessionId ?? null,
      kind: record.kind as PracticeAttemptKind,
      status: (record.status || 'submitted') as PracticeAttemptStatus,
      outcome: (record.outcome || 'not_evaluated') as PracticeOutcome,
      subject: record.subject ?? null,
      topic: record.topic ?? null,
      skillIds: Array.isArray(record.skillIds) ? record.skillIds : [],
      promptSummary: record.promptSummary || '',
      learnerAnswerSummary: record.learnerAnswerSummary ?? null,
      expectedAnswerSummary: record.expectedAnswerSummary ?? null,
      feedbackSummary: record.feedbackSummary ?? null,
      artifactId: record.artifactId ?? null,
      artifactBlockId: record.artifactBlockId ?? null,
      sourceQuestionId: record.sourceQuestionId ?? null,
      hintsRequested: record.hintsRequested ?? 0,
      attemptNumber: record.attemptNumber ?? 1,
      timeSpentSeconds: record.timeSpentSeconds ?? null,
      confidence: typeof record.confidence === 'number' ? record.confidence : 0.3,
      misconceptionSignals: Array.isArray(record.misconceptionSignals) ? record.misconceptionSignals : [],
      evidence: Array.isArray(record.evidence) ? record.evidence : [],
      createdAt: record.createdAt?.toISOString?.() || nowISO(),
      evaluatedAt: record.evaluatedAt?.toISOString?.() || null,
    };
  }
}

// Singleton
export const practiceAttemptService = new PracticeAttemptService();

// For testing
export function _clearAttemptStoreForTest(): void {
  attemptStore.clear();
  attemptLookupByKey.clear();
}
