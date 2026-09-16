/**
 * R8-H candidate equivalence: daily-learning-feed dedupe + rank pipeline.
 *
 * Proves the optimized implementation (precomputed dedupe-rank table,
 * single-parse dueAt decoration) preserves exact baseline semantics:
 * same surviving items, same ordering, same tie-breaking, same
 * first-wins dedupe with rank replacement, same dueAt/missing branches.
 */
import { describe, it, expect } from 'vitest';
import { Phase3DailyLearningFeedRankingService } from '../services/phase3DailyLearningFeedRankingService';
import type { Phase3DailyLearningFeedItem } from '../contracts/phase3DailyLearningFeedContracts';

const svc = new Phase3DailyLearningFeedRankingService();

let seq = 0;
function item(overrides: Partial<Phase3DailyLearningFeedItem>): Phase3DailyLearningFeedItem {
  seq += 1;
  return {
    feedItemId: `r8h-fi-${seq}`,
    schoolId: 'r8h-school',
    studentId: 'r8h-student',
    objectiveId: `r8h-obj-${seq}`,
    itemType: 'objective_check',
    priority: 'medium',
    title: 'r8h item',
    safeDescription: 'r8h',
    learnerSafeReason: 'r8h',
    nextAction: 'no_action_needed',
    sourceTruthStatus: 'verified',
    safeEvidenceRefs: [],
    safeReasonCodes: [],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  };
}

function orderOf(items: Phase3DailyLearningFeedItem[]): string[] {
  return svc.rankDailyLearningFeedItems(items).map((i) => i.feedItemId);
}

describe('r8h daily-feed equivalence', () => {
  it('empty input ranks to empty', () => {
    expect(svc.rankDailyLearningFeedItems([])).toEqual([]);
  });

  it('single item survives unchanged', () => {
    const only = item({ feedItemId: 'only' });
    expect(svc.rankDailyLearningFeedItems([only])).toEqual([only]);
  });

  it('dedupe keeps lowest DEDUPE_ORDER rank per objective (first-wins otherwise)', () => {
    const a = item({ feedItemId: 'a', objectiveId: 'o1', itemType: 'review_ready' });
    const b = item({ feedItemId: 'b', objectiveId: 'o1', itemType: 'teacher_support' });
    // teacher_support (index 3) outranks review_ready (index 11).
    expect(orderOf([a, b])).toEqual(['b']);
    expect(orderOf([b, a])).toEqual(['b']);
  });

  it('identical duplicates keep the first occurrence', () => {
    const a = item({ feedItemId: 'a', objectiveId: 'o1', itemType: 'objective_check' });
    const b = item({ feedItemId: 'b', objectiveId: 'o1', itemType: 'objective_check' });
    const ranked = svc.rankDailyLearningFeedItems([a, b]);
    expect(ranked.map((i) => i.feedItemId)).toEqual(['a']);
  });

  it('urgent precedes high precedes medium precedes low', () => {
    const low = item({ feedItemId: 'low', objectiveId: 'o1', priority: 'low' });
    const urgent = item({ feedItemId: 'urgent', objectiveId: 'o2', priority: 'urgent' });
    const medium = item({ feedItemId: 'medium', objectiveId: 'o3', priority: 'medium' });
    const high = item({ feedItemId: 'high', objectiveId: 'o4', priority: 'high' });
    expect(orderOf([low, urgent, medium, high])).toEqual(['urgent', 'high', 'medium', 'low']);
  });

  it('dueAt ordering: earlier first; present before missing; missing falls to createdAt desc', () => {
    const nodue = item({ feedItemId: 'nodue', objectiveId: 'o1', priority: 'medium', createdAt: '2026-03-05T00:00:00.000Z' });
    const late = item({ feedItemId: 'late', objectiveId: 'o2', priority: 'medium', dueAt: '2026-06-01T00:00:00.000Z' });
    const early = item({ feedItemId: 'early', objectiveId: 'o3', priority: 'medium', dueAt: '2026-01-01T00:00:00.000Z' });
    expect(orderOf([nodue, late, early])).toEqual(['early', 'late', 'nodue']);
  });

  it('ties on priority+type+dueAt break by createdAt descending', () => {
    const older = item({ feedItemId: 'older', objectiveId: 'o1', createdAt: '2026-03-01T00:00:00.000Z' });
    const newer = item({ feedItemId: 'newer', objectiveId: 'o2', createdAt: '2026-03-09T00:00:00.000Z' });
    expect(orderOf([older, newer])).toEqual(['newer', 'older']);
  });

  it('already-sorted and reverse-sorted inputs produce the same order', () => {
    const mk = () => [
      item({ feedItemId: 's-low', objectiveId: 'so1', priority: 'low' }),
      item({ feedItemId: 's-high', objectiveId: 'so2', priority: 'high' }),
      item({ feedItemId: 's-urgent', objectiveId: 'so3', priority: 'urgent' }),
    ];
    const fwd = mk();
    const ranked = svc.rankDailyLearningFeedItems(fwd).map((i) => i.feedItemId);
    expect(ranked).toEqual(['s-urgent', 's-high', 's-low']);
    const rev = [...fwd].reverse();
    expect(svc.rankDailyLearningFeedItems(rev).map((i) => i.feedItemId)).toEqual(ranked);
  });

  it('all-tie input preserves input order (stable sort)', () => {
    const mk = (id: string) => item({ feedItemId: id, objectiveId: `t-${id}`, priority: 'medium', itemType: 'objective_check' });
    const input = [mk('t1'), mk('t2'), mk('t3'), mk('t4')];
    expect(orderOf(input)).toEqual(['t1', 't2', 't3', 't4']);
  });

  it('malformed dueAt behaves as baseline NaN comparison (no throw, deterministic)', () => {
    const bad = item({ feedItemId: 'bad', objectiveId: 'o1', priority: 'medium', dueAt: 'not-a-date' });
    const good = item({ feedItemId: 'good', objectiveId: 'o2', priority: 'medium', dueAt: '2026-01-01T00:00:00.000Z' });
    const first = orderOf([bad, good]);
    const second = orderOf([good, bad]);
    // Both-present branch compares NaN vs number -> NaN -> V8 treats as 0:
    // input order preserved in both cases.
    expect(first).toEqual(['bad', 'good']);
    expect(second).toEqual(['good', 'bad']);
  });

  it('does not mutate the input array', () => {
    const a = item({ feedItemId: 'a', objectiveId: 'o1', priority: 'low' });
    const b = item({ feedItemId: 'b', objectiveId: 'o2', priority: 'urgent' });
    const input = [a, b];
    svc.rankDailyLearningFeedItems(input);
    expect(input.map((i) => i.feedItemId)).toEqual(['a', 'b']);
  });

  it('large duplicate-heavy input collapses to one item per objective', () => {
    const input: Phase3DailyLearningFeedItem[] = [];
    for (let i = 0; i < 5000; i++) {
      input.push(item({ feedItemId: `bulk-${i}`, objectiveId: `bulk-obj-${i % 500}` }));
    }
    const ranked = svc.rankDailyLearningFeedItems(input);
    expect(ranked).toHaveLength(500);
    expect(new Set(ranked.map((i) => i.objectiveId)).size).toBe(500);
  });

  it('limitFeedItems still slices after ranking', () => {
    const input = [
      item({ feedItemId: 'l1', objectiveId: 'lo1', priority: 'low' }),
      item({ feedItemId: 'l2', objectiveId: 'lo2', priority: 'urgent' }),
    ];
    const ranked = svc.rankDailyLearningFeedItems(input);
    expect(svc.limitFeedItems(ranked, 1).map((i) => i.feedItemId)).toEqual(['l2']);
  });
});
