import { describe, expect, it, vi } from 'vitest';
import { executeGrowthActionPlan } from '@/lib/growth-action-routing';
import type { GrowthActionPlan, RevisionItem } from '@/lib/types';

function makeRevisionItem(overrides: Partial<RevisionItem> = {}): RevisionItem {
  return {
    id: overrides.id || 'rev-1',
    title: overrides.title || 'Linear equations',
    summary: overrides.summary || 'Balance both sides first.',
    content: overrides.content || 'x + 2 = 7',
    contentType: overrides.contentType || 'note',
    topic: overrides.topic || 'Linear equations',
    subtopic: overrides.subtopic || 'Balancing both sides',
    subject: overrides.subject || 'math',
    createdAt: overrides.createdAt || '2026-04-09T09:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-04-09T09:30:00.000Z',
    ...overrides,
  };
}

function createHandlers() {
  return {
    onOpenRevisionItem: vi.fn(),
    onOpenMediaItem: vi.fn(),
    onOpenPrompt: vi.fn(),
    onDestinationChange: vi.fn(),
    onMediaModeChange: vi.fn(),
    onGrowthSectionChange: vi.fn(),
  };
}

describe('growth action routing integration', () => {
  it('opens revision item when destination is revision and target item exists', () => {
    const revisionItems = [
      makeRevisionItem({ id: 'rev-linear', topic: 'Linear equations' }),
      makeRevisionItem({ id: 'rev-fractions', topic: 'Fractions' }),
    ];
    const handlers = createHandlers();
    const plan: GrowthActionPlan = {
      intent: 'review_recap',
      destination: 'revision',
      revisionItemId: 'rev-fractions',
      topic: 'Fractions',
    };

    const result = executeGrowthActionPlan(plan, revisionItems, handlers);

    expect(result.executed).toBe(true);
    expect(result.destination).toBe('revision');
    expect(result.targetItemId).toBe('rev-fractions');
    expect(handlers.onOpenRevisionItem).toHaveBeenCalledWith(revisionItems[1]);
    expect(handlers.onDestinationChange).not.toHaveBeenCalled();
  });

  it('opens media target using resolved media mode when target item exists', () => {
    const revisionItems = [makeRevisionItem({ id: 'rev-chem', topic: 'Neutralisation' })];
    const handlers = createHandlers();
    const plan: GrowthActionPlan = {
      intent: 'open_creative_stream',
      destination: 'media',
      mediaMode: 'creative_stream',
      topic: 'Neutralisation',
    };

    const result = executeGrowthActionPlan(plan, revisionItems, handlers);

    expect(result.executed).toBe(true);
    expect(result.destination).toBe('media');
    expect(result.targetItemId).toBe('rev-chem');
    expect(handlers.onOpenMediaItem).toHaveBeenCalledWith(revisionItems[0], 'creative_stream');
    expect(handlers.onDestinationChange).not.toHaveBeenCalled();
  });

  it('opens media workspace and applies mode when no revision target is found', () => {
    const handlers = createHandlers();
    const plan: GrowthActionPlan = {
      intent: 'open_study_stream',
      destination: 'media',
      mediaMode: 'study_stream',
      topic: 'Unmatched topic',
    };

    const result = executeGrowthActionPlan(plan, [], handlers);

    expect(result.executed).toBe(true);
    expect(result.destination).toBe('media');
    expect(result.targetItemId).toBeNull();
    expect(handlers.onMediaModeChange).toHaveBeenCalledWith('study_stream');
    expect(handlers.onDestinationChange).toHaveBeenCalledWith('media');
    expect(handlers.onOpenMediaItem).not.toHaveBeenCalled();
  });

  it('starts a new session with fallback prompt and growth composer intent', () => {
    const handlers = createHandlers();
    const plan: GrowthActionPlan = {
      intent: 'quiz_me',
      destination: 'new_session',
      topic: 'Cell division',
      prompt: null,
    };

    const result = executeGrowthActionPlan(plan, [], handlers);

    expect(result.executed).toBe(true);
    expect(result.destination).toBe('new_session');
    expect(result.prompt).toContain('Quiz me on Cell division');
    expect(handlers.onOpenPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Quiz me on Cell division'),
      'growth_quiz_me'
    );
  });

  it('uses learning-signals context in new-session prompt when available on the target revision item', () => {
    const handlers = createHandlers();
    const revisionItems = [
      makeRevisionItem({
        id: 'rev-circles',
        topic: 'Circle theorems',
        metadata: {
          studyTools: {
            learningSignals: {
              version: 1,
              masteryLabel: 'getting_better',
              confidenceTrendEstimate: 'up',
              misconceptionRisk: 'medium',
              supportEffectiveness: [],
              nextBestSupport: {
                action: 'compare_table',
                label: 'Open compare table',
                reason: 'Similar theorem patterns are still mixing.',
                toolId: 'compare_table',
              },
              revisitPriority: 'medium',
              recoveryState: 'recovering',
              teachBackQuality: 'partial',
              transferReadiness: 'developing',
              recallStrength: 'medium',
              frictionLevel: 'low',
              lastMeaningfulEvidenceAt: '2026-04-15T09:00:00.000Z',
              coachNote: 'Recovery is visible; run one contrast pass.',
              evidenceSummary: {
                tier1Count: 3,
                tier2Count: 2,
                tier3Count: 0,
                tier1Weight: 30,
                tier2Weight: 8,
                tier3Weight: 0,
                positiveEvidenceCount: 4,
                negativeEvidenceCount: 1,
                uncertainty: 'medium',
              },
              askDirectFeedback: false,
              directFeedbackPrompt: null,
            },
          },
        },
      }),
    ];
    const plan: GrowthActionPlan = {
      intent: 'quiz_me',
      destination: 'new_session',
      topic: 'Circle theorems',
      prompt: '',
      revisionItemId: 'rev-circles',
    };

    const result = executeGrowthActionPlan(plan, revisionItems, handlers);

    expect(result.prompt).toContain('Next best support: Open compare table');
    expect(result.prompt).toContain('Recovery is visible');
  });

  it('keeps user in growth and focuses the mapped section', () => {
    const handlers = createHandlers();
    const plan: GrowthActionPlan = {
      intent: 'continue_plan',
      destination: 'growth',
      topic: 'Quadratics',
    };

    const result = executeGrowthActionPlan(plan, [], handlers);

    expect(result.executed).toBe(true);
    expect(result.destination).toBe('growth');
    expect(handlers.onDestinationChange).toHaveBeenCalledWith('growth');
    expect(handlers.onGrowthSectionChange).toHaveBeenCalledWith('study_plans');
  });
});
