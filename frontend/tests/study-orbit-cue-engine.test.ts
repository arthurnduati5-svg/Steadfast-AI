import { describe, expect, it } from 'vitest';
import {
  buildStudyOrbitLineupSignal,
  buildStudyOrbitStageSentence,
  getStudyOrbitStageStepIndex,
  getStudyOrbitStageSteps,
  selectStudyOrbitPrimaryCue,
} from '@/lib/study-orbit-cue-engine';

describe('study orbit cue engine', () => {
  it('selects stage-aligned primary cue', () => {
    const cue = selectStudyOrbitPrimaryCue({
      stage: 'attempting',
      focusLine: 'Notice the reactants first.',
      checkLine: 'What are the two products of neutralisation?',
      anchorLine: 'Acid + alkali = salt + water.',
      whyNowLine: 'You struggled on naming products yesterday.',
      reflectionLine: 'No reflection signal yet.',
      unlockLine: 'Answer one quick check to unlock the next layer.',
    });

    expect(cue.kind).toBe('check');
    expect(cue.label).toBe('Check');
  });

  it('collapses near-duplicate secondary cues', () => {
    const cue = selectStudyOrbitPrimaryCue({
      stage: 'solidifying',
      focusLine: 'Pattern first: acid + alkali = salt + water.',
      checkLine: 'Pattern first: acid + alkali = salt + water.',
      anchorLine: 'Pattern first: acid + alkali = salt + water.',
      whyNowLine: 'Same line repeated for testing.',
      reflectionLine: 'Same line repeated for testing.',
      unlockLine: 'Next unlock depends on this pattern.',
    });

    expect(cue.kind).toBe('memory_anchor');
    expect(cue.secondaryValue).not.toBe('Pattern first: acid + alkali = salt + water.');
  });

  it('returns compact lineup signals', () => {
    const signal = buildStudyOrbitLineupSignal({
      isNext: true,
      position: 0,
      stage: 'attempting',
      weakAssist: false,
      checkLine: 'Try one quick check question.',
      unlockLine: 'Then apply it differently.',
      nextMove: 'Apply it differently in another case.',
    });

    expect(signal.kicker).toBe('Next');
    expect(signal.purpose).toBe('apply it differently');
  });

  it('exposes stage strip helpers and readable stage sentence', () => {
    const steps = getStudyOrbitStageSteps();
    expect(steps).toHaveLength(5);
    expect(getStudyOrbitStageStepIndex('reflecting')).toBe(2);
    expect(buildStudyOrbitStageSentence('ready_to_unlock')).toMatch(/ready/i);
  });
});
