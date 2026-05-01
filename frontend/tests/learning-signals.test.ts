import { describe, expect, it } from 'vitest';
import type { RevisionItem } from '@/lib/types';
import type { StudyResponseEvaluation, StudyTeachBackEvaluation, StudyToolId } from '@/lib/study-tool-recommendation';
import { buildLearningSignalsSnapshot } from '@/lib/learning-signals';

function buildItem(overrides: Partial<RevisionItem> = {}): RevisionItem {
  return {
    id: 'revision-1',
    title: 'Photosynthesis quick recap',
    summary: 'Photosynthesis uses light energy to make glucose.',
    content: 'Plants use light, carbon dioxide, and water to make glucose and oxygen.',
    contentType: 'explanation',
    createdAt: new Date('2026-04-15T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-15T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function quickResult(score: number, correctness: StudyResponseEvaluation['correctness']): StudyResponseEvaluation {
  return {
    score,
    correctness,
    feedback: '',
  };
}

function teachBackResult(
  correctness: StudyTeachBackEvaluation['correctness'],
  score: number
): StudyTeachBackEvaluation {
  return {
    clarity: correctness === 'strong' ? 'clear' : correctness === 'partial' ? 'developing' : 'unclear',
    correctness,
    score,
    feedback: '',
    missingIdea: null,
    misconception: null,
  };
}

function buildRuntime(overrides: Partial<{
  openedTools: StudyToolId[];
  completedTools: StudyToolId[];
  savedArtifacts: StudyToolId[];
  quickCheckResults: StudyResponseEvaluation[];
  quickCheckCompleted: boolean;
  teachBackResult: StudyTeachBackEvaluation | null;
  transferResult: StudyResponseEvaluation | null;
  responseWordSamples: number[];
  quickDismissCount: number;
  directFeedbackSignals: string[];
  lastMeaningfulEvidenceAt: string | null;
}> = {}) {
  return {
    openedTools: [] as StudyToolId[],
    completedTools: [] as StudyToolId[],
    savedArtifacts: [] as StudyToolId[],
    quickCheckResults: [] as StudyResponseEvaluation[],
    quickCheckCompleted: false,
    teachBackResult: null as StudyTeachBackEvaluation | null,
    transferResult: null as StudyResponseEvaluation | null,
    responseWordSamples: [] as number[],
    quickDismissCount: 0,
    directFeedbackSignals: [] as string[],
    lastMeaningfulEvidenceAt: null as string | null,
    ...overrides,
  };
}

describe('learning signals engine', () => {
  it('keeps tier-1 evidence dominant over tier-3 self-report noise', () => {
    const snapshot = buildLearningSignalsSnapshot({
      item: buildItem({ mastery: 'getting_better' }),
      runtime: buildRuntime({
        openedTools: ['quick_check', 'teach_back'],
        completedTools: ['quick_check', 'teach_back'],
        quickCheckCompleted: true,
        quickCheckResults: [quickResult(86, 'correct'), quickResult(78, 'correct')],
        teachBackResult: teachBackResult('strong', 84),
        transferResult: quickResult(74, 'correct'),
        directFeedbackSignals: ['I am still confused'],
      }),
    });

    expect(snapshot.evidenceSummary.tier1Count).toBeGreaterThan(0);
    expect(snapshot.masteryLabel).not.toBe('still_learning');
    expect(snapshot.nextBestSupport.label.length).toBeGreaterThan(4);
  });

  it('infers support effectiveness patterns from behavior and outcomes', () => {
    const snapshot = buildLearningSignalsSnapshot({
      item: buildItem(),
      runtime: buildRuntime({
        openedTools: ['recall_sheet', 'quick_check', 'quick_check'],
        completedTools: ['quick_check'],
        quickCheckCompleted: true,
        quickCheckResults: [quickResult(81, 'correct')],
      }),
    });

    const recapPattern = snapshot.supportEffectiveness.find((entry) => entry.support === 'review_recap_first');
    expect(recapPattern?.trend).toBe('helpful');
  });

  it('detects high friction when tools are abandoned with shallow responses', () => {
    const snapshot = buildLearningSignalsSnapshot({
      item: buildItem({ mastery: 'still_learning' }),
      runtime: buildRuntime({
        openedTools: ['teach_back', 'quick_check', 'transfer_question'],
        completedTools: [],
        responseWordSamples: [1, 1, 2],
        quickDismissCount: 2,
      }),
    });

    expect(snapshot.frictionLevel).toBe('high');
    expect(snapshot.revisitPriority).toBe('high');
  });

  it('labels a stuck recovery state when negative evidence repeats', () => {
    const snapshot = buildLearningSignalsSnapshot({
      item: buildItem({
        mastery: 'getting_better',
        struggleCount: 4,
        successCount: 0,
        isMistakeBased: true,
      }),
      runtime: buildRuntime({
        teachBackResult: teachBackResult('struggled', 18),
        transferResult: quickResult(22, 'struggled'),
        quickCheckResults: [quickResult(28, 'struggled')],
      }),
    });

    expect(snapshot.recoveryState).toBe('stuck');
    expect(snapshot.nextBestSupport.action).toBe('rescue_weak_pattern');
  });

  it('suppresses direct-feedback prompt when strong evidence already exists', () => {
    const snapshot = buildLearningSignalsSnapshot({
      item: buildItem(),
      runtime: buildRuntime({
        openedTools: ['quick_check', 'teach_back', 'transfer_question'],
        completedTools: ['quick_check', 'teach_back', 'transfer_question'],
        quickCheckCompleted: true,
        quickCheckResults: [quickResult(79, 'correct'), quickResult(82, 'correct')],
        teachBackResult: teachBackResult('strong', 86),
        transferResult: quickResult(76, 'correct'),
      }),
    });

    expect(snapshot.askDirectFeedback).toBe(false);
    expect(snapshot.directFeedbackPrompt).toBeNull();
  });
});

