import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryCasePriorityEngineService } from '../services/recoveryCasePriorityEngineService';
import type { RecoveryCaseQueueCandidate } from '../contracts/recoveryCaseQueueContracts';

function makeCandidate(overrides: Partial<RecoveryCaseQueueCandidate>): RecoveryCaseQueueCandidate {
  return {
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    boardSnapshotId: 'snap-1',
    boardCardId: 'card-1',
    priorityAssessmentId: 'pa-1',
    fairnessCheckId: null,
    priorityBand: 'normal',
    riskRank: 'low',
    totalScore: 0,
    triageDecision: 'queued',
    ...overrides,
  };
}

describe('Package 25 - Stable Ranking and Tie-Break', () => {
  let engine: RecoveryCasePriorityEngineService;

  beforeEach(() => {
    engine = new RecoveryCasePriorityEngineService();
  });

  it('higher score first', () => {
    const items = [
      makeCandidate({ studentRef: 'A', totalScore: 30, boardCardId: 'card-a', riskRank: 'low' }),
      makeCandidate({ studentRef: 'B', totalScore: 50, boardCardId: 'card-b', riskRank: 'low' }),
      makeCandidate({ studentRef: 'C', totalScore: 10, boardCardId: 'card-c', riskRank: 'low' }),
    ];
    const ranked = engine.applyStableTieBreaks(items);
    expect(ranked[0].studentRef).toBe('B');
    expect(ranked[1].studentRef).toBe('A');
    expect(ranked[2].studentRef).toBe('C');
  });

  it('equal scores: higher risk rank first (critical > high > medium > low > none)', () => {
    const items = [
      makeCandidate({ studentRef: 'A', totalScore: 50, riskRank: 'low', boardCardId: 'card-a' }),
      makeCandidate({ studentRef: 'B', totalScore: 50, riskRank: 'critical', boardCardId: 'card-b' }),
      makeCandidate({ studentRef: 'C', totalScore: 50, riskRank: 'medium', boardCardId: 'card-c' }),
    ];
    const ranked = engine.applyStableTieBreaks(items);
    expect(ranked[0].studentRef).toBe('B');
    expect(ranked[1].studentRef).toBe('C');
    expect(ranked[2].studentRef).toBe('A');
  });

  it('equal scores and risk: lexicographically smaller boardCardId first', () => {
    const items = [
      makeCandidate({ studentRef: 'A', totalScore: 50, riskRank: 'high', boardCardId: 'z-card' }),
      makeCandidate({ studentRef: 'B', totalScore: 50, riskRank: 'high', boardCardId: 'a-card' }),
      makeCandidate({ studentRef: 'C', totalScore: 50, riskRank: 'high', boardCardId: 'm-card' }),
    ];
    const ranked = engine.applyStableTieBreaks(items);
    expect(ranked[0].boardCardId).toBe('a-card');
    expect(ranked[1].boardCardId).toBe('m-card');
    expect(ranked[2].boardCardId).toBe('z-card');
  });

  it('all equal: deterministic ordering via boardCardId', () => {
    const items = [
      makeCandidate({ studentRef: 'A', totalScore: 25, riskRank: 'none', boardCardId: 'delta' }),
      makeCandidate({ studentRef: 'B', totalScore: 25, riskRank: 'none', boardCardId: 'alpha' }),
      makeCandidate({ studentRef: 'C', totalScore: 25, riskRank: 'none', boardCardId: 'gamma' }),
    ];
    const ranked = engine.applyStableTieBreaks(items);
    expect(ranked[0].boardCardId).toBe('alpha');
    expect(ranked[1].boardCardId).toBe('delta');
    expect(ranked[2].boardCardId).toBe('gamma');
  });

  it('no random ordering (calling sort twice produces same result)', () => {
    const items = [
      makeCandidate({ studentRef: 'X', totalScore: 40, riskRank: 'medium', boardCardId: 'card-x' }),
      makeCandidate({ studentRef: 'Y', totalScore: 60, riskRank: 'low', boardCardId: 'card-y' }),
      makeCandidate({ studentRef: 'Z', totalScore: 40, riskRank: 'high', boardCardId: 'card-z' }),
    ];
    const ranked1 = engine.applyStableTieBreaks(items);
    const ranked2 = engine.applyStableTieBreaks(items);
    expect(ranked1.map(i => i.studentRef)).toEqual(ranked2.map(i => i.studentRef));
  });

  it('3+ items with mixed tie-break scenarios ranks correctly', () => {
    const items = [
      makeCandidate({ studentRef: 'A', totalScore: 90, riskRank: 'critical', boardCardId: 'card-1' }),
      makeCandidate({ studentRef: 'B', totalScore: 90, riskRank: 'high', boardCardId: 'card-2' }),
      makeCandidate({ studentRef: 'C', totalScore: 80, riskRank: 'critical', boardCardId: 'card-3' }),
      makeCandidate({ studentRef: 'D', totalScore: 90, riskRank: 'critical', boardCardId: 'card-0' }),
      makeCandidate({ studentRef: 'E', totalScore: 70, riskRank: 'high', boardCardId: 'card-5' }),
    ];
    const ranked = engine.applyStableTieBreaks(items);
    expect(ranked[0].studentRef).toBe('D');
    expect(ranked[1].studentRef).toBe('A');
    expect(ranked[2].studentRef).toBe('B');
    expect(ranked[3].studentRef).toBe('C');
    expect(ranked[4].studentRef).toBe('E');
  });

  it('rankQueueCandidates assigns correct ranks', () => {
    const items = [
      makeCandidate({ studentRef: 'A', totalScore: 40, riskRank: 'low', boardCardId: 'card-a' }),
      makeCandidate({ studentRef: 'B', totalScore: 60, riskRank: 'high', boardCardId: 'card-b' }),
    ];
    const result = engine.rankQueueCandidates(items);
    expect(result.rankedCount).toBe(2);
    expect(result.items[0].studentRef).toBe('B');
    expect(result.items[1].studentRef).toBe('A');
  });

  it('rankQueueCandidates handles empty list', () => {
    const result = engine.rankQueueCandidates([]);
    expect(result.rankedCount).toBe(0);
    expect(result.items).toHaveLength(0);
  });
});
