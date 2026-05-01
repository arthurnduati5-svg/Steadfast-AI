import { describe, expect, it } from 'vitest';
import {
  applyStudyOrbitTrackingEvent,
  createEmptyStudyOrbitProgressState,
  detectStudyOrbitReflectionEvidence,
  filterPersistableStudyOrbitTrackingState,
  formatStudyOrbitStageLabel,
} from '@/lib/study-orbit-tracking';

const stageRank: Record<string, number> = {
  orienting: 0,
  attempting: 1,
  reflecting: 2,
  solidifying: 3,
  ready_to_unlock: 4,
};

describe('study orbit tracking', () => {
  it('detects reflection from student language cues', () => {
    const evidence = detectStudyOrbitReflectionEvidence(
      'I realized I was wrong because acid and alkali react to make salt and water, so next time I will check both products.'
    );

    expect(evidence.detected).toBe(true);
    expect(evidence.score).toBeGreaterThanOrEqual(3);
    expect(evidence.triggers).toContain('reasoning_link');
  });

  it('keeps reflection off for short non-metacognitive answers', () => {
    const evidence = detectStudyOrbitReflectionEvidence('salt and water');

    expect(evidence.detected).toBe(false);
    expect(evidence.wordCount).toBeLessThan(6);
  });

  it('advances in guarded steps with evidence and avoids jumps', () => {
    let state = createEmptyStudyOrbitProgressState(1);
    expect(formatStudyOrbitStageLabel(state.stage)).toBe('Orienting');

    state = applyStudyOrbitTrackingEvent(state, { type: 'open_quick_challenge', atMs: 10 });
    expect(state.stage).toBe('attempting');

    const afterStrongCheck = applyStudyOrbitTrackingEvent(state, {
      type: 'check_quick_challenge',
      tone: 'strong',
      draft: 'I realized this works because acid plus alkali gives salt and water.',
      atMs: 2000,
    });
    expect(stageRank[afterStrongCheck.stage] - stageRank[state.stage]).toBeLessThanOrEqual(1);

    const afterTeachBack = applyStudyOrbitTrackingEvent(afterStrongCheck, {
      type: 'check_teach_back',
      tone: 'strong',
      draft: 'I changed my approach because first I identify the products, then I explain why the pattern holds.',
      atMs: 3200,
    });
    expect(stageRank[afterTeachBack.stage]).toBeGreaterThanOrEqual(stageRank['reflecting']);

    const afterKeep = applyStudyOrbitTrackingEvent(afterTeachBack, { type: 'keep_anchor', atMs: 5100 });
    const afterSave = applyStudyOrbitTrackingEvent(afterKeep, { type: 'save_to_revision', atMs: 6200 });
    expect(stageRank[afterSave.stage]).toBeGreaterThanOrEqual(stageRank['solidifying']);

    const afterTransfer = applyStudyOrbitTrackingEvent(afterSave, { type: 'open_similar_question', atMs: 7600 });
    const unlocked = applyStudyOrbitTrackingEvent(afterTransfer, {
      type: 'check_quick_challenge',
      tone: 'strong',
      draft: 'I can apply the same pattern in another question because the products still stay salt and water.',
      atMs: 9200,
    });

    expect(unlocked.stage).toBe('ready_to_unlock');
    expect(unlocked.evidenceScore).toBeGreaterThan(50);
    expect(unlocked.confidenceScore).toBeGreaterThan(55);
  });

  it('uses anti-jitter behavior to avoid dropping stage after a weak attempt', () => {
    let state = createEmptyStudyOrbitProgressState(1);
    state = applyStudyOrbitTrackingEvent(state, { type: 'open_quick_challenge', atMs: 10 });
    state = applyStudyOrbitTrackingEvent(state, {
      type: 'check_quick_challenge',
      tone: 'strong',
      draft: 'I realized because the pattern holds and I can explain it now.',
      atMs: 2000,
    });
    state = applyStudyOrbitTrackingEvent(state, {
      type: 'check_teach_back',
      tone: 'strong',
      draft: 'First identify products, then explain why. I changed my old mistake.',
      atMs: 3200,
    });
    state = applyStudyOrbitTrackingEvent(state, { type: 'keep_explanation', atMs: 5100 });
    state = applyStudyOrbitTrackingEvent(state, { type: 'save_to_revision', atMs: 6200 });

    const baselineRank = stageRank[state.stage];
    const afterRetry = applyStudyOrbitTrackingEvent(state, {
      type: 'check_quick_challenge',
      tone: 'retry',
      draft: 'not sure',
      atMs: 7000,
    });

    expect(stageRank[afterRetry.stage]).toBeGreaterThanOrEqual(baselineRank);
  });

  it('excludes demo ids from persistable tracking snapshots', () => {
    const state = createEmptyStudyOrbitProgressState(1);
    const input = {
      demoCard: state,
      liveCard: { ...state, opens: 2 },
    };

    const persisted = filterPersistableStudyOrbitTrackingState(input, ['demoCard']);
    expect(persisted.demoCard).toBeUndefined();
    expect(persisted.liveCard?.opens).toBe(2);
  });
});
