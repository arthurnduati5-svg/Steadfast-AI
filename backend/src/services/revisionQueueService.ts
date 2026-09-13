// ─────────────────────────────────────────────────────────────
// Steadfast AI — Revision Queue Service v1
// Generates evidence-backed revision queue items. Each item
// requires at least one evidence reference. Prioritizes repeated
// mistakes, hint dependency, and failed transfer. No random
// recommendations. No mastery claims from revision completion.
// ─────────────────────────────────────────────────────────────

import type {
  RevisionQueueItem,
  RevisionQueueOutput,
  RevisionQueueItemStatus,
  RevisionPriority,
  RevisionReasonCode,
  RevisionRecommendedAction,
  RevisionDueWindow,
  GenerateRevisionQueueInput,
} from './revisionQueueContracts';

import {
  REASON_PRIORITY_MAP,
  REASON_ACTION_MAP,
  REASON_DUE_WINDOW_MAP,
  REVISION_REASON_LABELS,
} from './revisionQueueContracts';

// ═══════════════════════════════════════════════════════════════
// In-memory store
// ═══════════════════════════════════════════════════════════════

const revisionQueueStore: Map<string, RevisionQueueItem> = new Map();
const learnerQueueMap: Map<string, string[]> = new Map(); // learnerIdHash -> itemId[]

// ═══════════════════════════════════════════════════════════════
// ID Generator
// ═══════════════════════════════════════════════════════════════

let _itemCounter = 0;

function generateItemId(): string {
  _itemCounter += 1;
  const timestamp = Date.now().toString(36);
  const counter = _itemCounter.toString(36);
  return `rev_${timestamp}_${counter}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ═══════════════════════════════════════════════════════════════
// Revision Queue Service
// ═══════════════════════════════════════════════════════════════

export class RevisionQueueService {
  /**
   * Generate revision queue items from evidence events.
   * Each item requires at least one evidence event ID.
   */
  generateRevisionQueue(queueInput: GenerateRevisionQueueInput): RevisionQueueOutput {
    const warnings: string[] = [];
    const items: RevisionQueueItem[] = [];
    const maxItems = queueInput.maxItems || 10;

    if (!queueInput.evidenceEvents || queueInput.evidenceEvents.length === 0) {
      return {
        items: [],
        warnings: ['No evidence events provided. Revision queue cannot be generated.'],
        generatedAt: nowISO(),
      };
    }

    // Analyze evidence events for revision signals
    const mistakePatterns = this._analyzeMistakePatterns(queueInput.evidenceEvents);
    const hintDependency = this._detectHintDependency(queueInput.evidenceEvents);
    const staleEvidence = this._detectStaleEvidence(queueInput.evidenceEvents);
    const transferGaps = this._detectTransferGaps(queueInput.evidenceEvents);
    const weakEvidence = this._detectWeakEvidence(queueInput.evidenceEvents);
    const correctionNeeded = this._detectCorrectionNeeded(queueInput.evidenceEvents);
    const practiceGaps = this._detectPracticeGaps(queueInput.evidenceEvents);

    // Create items from detected signals
    const creationInputs: Array<{
      reasonCode: RevisionReasonCode;
      safeReason: string;
      evidenceEventIds: string[];
      priority: RevisionPriority;
      recommendedAction: RevisionRecommendedAction;
      dueWindow: RevisionDueWindow;
    }> = [];

    // Repeated mistakes
    for (const pattern of mistakePatterns) {
      if (creationInputs.length >= maxItems) break;
      creationInputs.push({
        reasonCode: 'repeated_mistake',
        safeReason: pattern.safeReason,
        evidenceEventIds: pattern.evidenceEventIds,
        priority: pattern.count >= 3 ? 'urgent_learning_gap' : pattern.count >= 2 ? 'high' : 'medium',
        recommendedAction: 'retry_similar_problem',
        dueWindow: pattern.count >= 3 ? 'now' : pattern.count >= 2 ? 'today' : 'this_week',
      });
    }

    // Hint dependency
    if (hintDependency && creationInputs.length < maxItems) {
      creationInputs.push({
        reasonCode: 'hint_dependency',
        safeReason: 'Student relied on high-level hints repeatedly.',
        evidenceEventIds: hintDependency.evidenceEventIds,
        priority: 'high',
        recommendedAction: 'practice_foundation',
        dueWindow: 'now',
      });
    }

    // Stale evidence
    if (staleEvidence && creationInputs.length < maxItems) {
      creationInputs.push({
        reasonCode: 'stale_evidence',
        safeReason: 'Previous evidence of understanding has become stale and should be refreshed.',
        evidenceEventIds: staleEvidence.evidenceEventIds,
        priority: 'medium',
        recommendedAction: 'retry_similar_problem',
        dueWindow: 'this_week',
      });
    }

    // Transfer gaps
    for (const gap of transferGaps) {
      if (creationInputs.length >= maxItems) break;
      creationInputs.push({
        reasonCode: 'failed_transfer',
        safeReason: gap.safeReason,
        evidenceEventIds: gap.evidenceEventIds,
        priority: 'high',
        recommendedAction: 'explain_concept',
        dueWindow: 'today',
      });
    }

    // Weak evidence
    if (weakEvidence && creationInputs.length < maxItems) {
      creationInputs.push({
        reasonCode: 'weak_evidence',
        safeReason: 'Current evidence of understanding is weak. Additional practice recommended.',
        evidenceEventIds: weakEvidence.evidenceEventIds,
        priority: 'medium',
        recommendedAction: 'practice_foundation',
        dueWindow: 'today',
      });
    }

    // Correction needed
    if (correctionNeeded && creationInputs.length < maxItems) {
      creationInputs.push({
        reasonCode: 'correction_needed',
        safeReason: 'Previous work needs correction or refinement.',
        evidenceEventIds: correctionNeeded.evidenceEventIds,
        priority: 'medium',
        recommendedAction: 'correct_previous_step',
        dueWindow: 'today',
      });
    }

    // Practice gaps
    if (practiceGaps && creationInputs.length < maxItems) {
      creationInputs.push({
        reasonCode: 'practice_gap',
        safeReason: 'Insufficient practice evidence to confirm understanding.',
        evidenceEventIds: practiceGaps.evidenceEventIds,
        priority: 'low',
        recommendedAction: 'practice_foundation',
        dueWindow: 'this_week',
      });
    }

    if (creationInputs.length === 0) {
      // Cautious suggestion — no strong revision signal detected
      return {
        items: [],
        warnings: ['No strong revision signals detected from available evidence.'],
        generatedAt: nowISO(),
      };
    }

    // Sort by priority
    creationInputs.sort((a, b) => {
      const pa = Object.keys(REASON_PRIORITY_MAP).indexOf(a.reasonCode);
      const pb = Object.keys(REASON_PRIORITY_MAP).indexOf(b.reasonCode);
      return pa - pb;
    });

    // Create items
    const now = nowISO();
    for (const creationInput of creationInputs.slice(0, maxItems)) {
      const itemId = generateItemId();
      const item: RevisionQueueItem = {
        itemId,
        learnerIdHash: queueInput.learnerIdHash,
        subjectId: creationInput.evidenceEventIds.length > 0 ? undefined : undefined,
        skillId: undefined,
        topicId: undefined,
        priority: creationInput.priority,
        reasonCode: creationInput.reasonCode,
        safeReason: creationInput.safeReason,
        evidenceEventIds: creationInput.evidenceEventIds,
        recommendedAction: creationInput.recommendedAction,
        dueWindow: creationInput.dueWindow,
        status: 'open',
        createdAt: now,
        updatedAt: now,
        rawPrivateDataIncluded: false,
      };

      revisionQueueStore.set(itemId, item);
      items.push(item);
    }

    // Map items to learner
    if (queueInput.learnerIdHash) {
      const existing = learnerQueueMap.get(queueInput.learnerIdHash) || [];
      for (const item of items) {
        existing.push(item.itemId);
      }
      learnerQueueMap.set(queueInput.learnerIdHash, existing);
    }

    return {
      items,
      warnings,
      generatedAt: now,
    };
  }

  /**
   * Get revision queue items for a learner.
   */
  getRevisionQueue(
    learnerIdHash: string,
    options?: {
      status?: RevisionQueueItemStatus;
      limit?: number;
    },
  ): RevisionQueueItem[] {
    const limit = options?.limit || 20;
    const itemIds = learnerQueueMap.get(learnerIdHash) || [];
    const results: RevisionQueueItem[] = [];

    for (const itemId of itemIds) {
      const item = revisionQueueStore.get(itemId);
      if (!item) continue;
      if (options?.status && item.status !== options.status) continue;
      results.push(item);
    }

    // Sort: urgent > high > medium > low, then by createdAt
    results.sort((a, b) => {
      const pa = Object.keys(REASON_PRIORITY_MAP).indexOf(a.reasonCode);
      const pb = Object.keys(REASON_PRIORITY_MAP).indexOf(b.reasonCode);
      if (pa !== pb) return pa - pb;
      return b.createdAt.localeCompare(a.createdAt);
    });

    return results.slice(0, limit);
  }

  /**
   * Update revision queue item status.
   */
  updateItemStatus(
    itemId: string,
    status: RevisionQueueItemStatus,
  ): RevisionQueueItem | null {
    const item = revisionQueueStore.get(itemId);
    if (!item) return null;

    const updated: RevisionQueueItem = {
      ...item,
      status,
      updatedAt: nowISO(),
      completedAt: status === 'completed' ? nowISO() : item.completedAt,
    };

    revisionQueueStore.set(itemId, updated);
    return updated;
  }

  /**
   * Clear store (for testing).
   */
  clearStore(): void {
    revisionQueueStore.clear();
    learnerQueueMap.clear();
  }

  // ── Private analysis methods ──

  /**
   * Analyze evidence events for repeated mistake patterns.
   */
  private _analyzeMistakePatterns(
    events: GenerateRevisionQueueInput['evidenceEvents'],
  ): Array<{ count: number; safeReason: string; evidenceEventIds: string[]; mistakeType?: string }> {
    // Group by mistake type
    const byMistakeType = new Map<string, { events: typeof events; count: number }>();

    for (const event of events) {
      if (event.eventType === 'mistake_signal_observed' || event.eventType === 'correction_observed') {
        const key = event.mistakeType || 'unknown';
        const existing = byMistakeType.get(key);
        if (existing) {
          existing.events.push(event);
          existing.count += 1;
        } else {
          byMistakeType.set(key, { events: [event], count: 1 });
        }
      }
    }

    const patterns: Array<{ count: number; safeReason: string; evidenceEventIds: string[]; mistakeType?: string }> = [];

    for (const [mistakeType, data] of byMistakeType.entries()) {
      if (data.count >= 2) {
        patterns.push({
          count: data.count,
          safeReason: `Repeated ${mistakeType === 'unknown' ? '' : mistakeType + ' '}mistake pattern detected (${data.count} occurrences).`,
          evidenceEventIds: data.events.map((e) => e.eventId),
          mistakeType: mistakeType !== 'unknown' ? mistakeType : undefined,
        });
      }
    }

    return patterns;
  }

  /**
   * Detect hint dependency from evidence events.
   */
  private _detectHintDependency(
    events: GenerateRevisionQueueInput['evidenceEvents'],
  ): { evidenceEventIds: string[] } | null {
    const hintEvents = events.filter(
      (e) => e.eventType === 'hint_given' && e.hintLevel && parseInt(e.hintLevel, 10) >= 5,
    );

    if (hintEvents.length >= 3) {
      // Check if these high-level hints are followed by continued mistakes
      const mistakeAfterHint = events.filter(
        (e) => hintEvents.some((h) => h.createdAt < e.createdAt) &&
          (e.eventType === 'mistake_signal_observed'),
      );

      if (mistakeAfterHint.length >= 1) {
        return {
          evidenceEventIds: [...hintEvents.map((e) => e.eventId), ...mistakeAfterHint.map((e) => e.eventId)],
        };
      }
    }

    return null;
  }

  /**
   * Detect stale evidence.
   */
  private _detectStaleEvidence(
    events: GenerateRevisionQueueInput['evidenceEvents'],
  ): { evidenceEventIds: string[] } | null {
    const staleEvidence = events.filter(
      (e) => e.freshness === 'stale' || e.freshness === 'expired',
    );

    if (staleEvidence.length >= 2) {
      return {
        evidenceEventIds: staleEvidence.map((e) => e.eventId),
      };
    }

    return null;
  }

  /**
   * Detect transfer gaps.
   */
  private _detectTransferGaps(
    events: GenerateRevisionQueueInput['evidenceEvents'],
  ): Array<{ safeReason: string; evidenceEventIds: string[] }> {
    const gaps: Array<{ safeReason: string; evidenceEventIds: string[] }> = [];

    const transferFailures = events.filter(
      (e) => e.eventType === 'transfer_attempt_observed' && e.transferObserved === false,
    );

    for (const failure of transferFailures) {
      gaps.push({
        safeReason: 'Student struggled to apply concept to a different problem context.',
        evidenceEventIds: [failure.eventId],
      });
    }

    return gaps;
  }

  /**
   * Detect weak evidence.
   */
  private _detectWeakEvidence(
    events: GenerateRevisionQueueInput['evidenceEvents'],
  ): { evidenceEventIds: string[] } | null {
    const weakEvents = events.filter(
      (e) => e.evidenceStrength === 'weak' || e.evidenceStrength === 'none',
    );

    if (weakEvents.length >= 3 && events.every((e) => e.sourceQuality === 'real')) {
      return {
        evidenceEventIds: weakEvents.map((e) => e.eventId),
      };
    }

    return null;
  }

  /**
   * Detect correction needed.
   */
  private _detectCorrectionNeeded(
    events: GenerateRevisionQueueInput['evidenceEvents'],
  ): { evidenceEventIds: string[] } | null {
    const mistakesWithoutCorrection = events.filter(
      (e) => e.eventType === 'mistake_signal_observed' && e.correctionObserved !== true,
    );

    if (mistakesWithoutCorrection.length > 0) {
      return {
        evidenceEventIds: mistakesWithoutCorrection.slice(0, 3).map((e) => e.eventId),
      };
    }

    return null;
  }

  /**
   * Detect practice gaps.
   */
  private _detectPracticeGaps(
    events: GenerateRevisionQueueInput['evidenceEvents'],
  ): { evidenceEventIds: string[] } | null {
    const practiceEvents = events.filter(
      (e) => e.eventType === 'practice_attempt_completed',
    );

    if (practiceEvents.length === 0) {
      return {
        evidenceEventIds: events.length > 0 ? [events[0].eventId] : [],
      };
    }

    return null;
  }
}

// Singleton
export const revisionQueueService = new RevisionQueueService();
