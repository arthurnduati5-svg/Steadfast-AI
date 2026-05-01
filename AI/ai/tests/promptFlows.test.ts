import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Prompt flow consistency', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unmock('openai');
  });

  it('personalizedObjectives returns structured objectives from JSON', async () => {
    const createMock = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              objectives: [
                'Review the key formula for linear equations',
                'Practice two substitution questions',
              ],
            }),
          },
        },
      ],
    });

    vi.doMock('openai', () => ({
      default: class OpenAI {
        chat = { completions: { create: createMock } };
      },
    }));

    const { personalizedObjectives } = await import('../flows/personalize-daily-objectives');
    const result = await personalizedObjectives({
      studentPerformance: 'Needs support in algebra',
      curriculum: 'Linear equations',
      loggedMisconceptions: 'Moves terms with wrong sign',
    });

    expect(result.dailyObjectives.length).toBeGreaterThanOrEqual(2);
    expect(result.dailyObjectives[0].toLowerCase()).toContain('review');
  });

  it('generateAdaptiveHint falls back safely when model output is invalid', async () => {
    const createMock = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: '{"bad":"payload"}',
          },
        },
      ],
    });

    vi.doMock('openai', () => ({
      default: class OpenAI {
        chat = { completions: { create: createMock } };
      },
    }));

    const { generateAdaptiveHint } = await import('../flows/generate-adaptive-hints');
    const result = await generateAdaptiveHint({
      problemDescription: 'Solve 2x + 3 = 11',
      studentProgress: 'I am confused',
      hintLadder: ['Reframe the equation', 'Identify what to isolate', 'Subtract 3 first', 'Then divide by 2'],
      currentHintIndex: 0,
      hintCount: 0,
      attemptsCount: 1,
      masteryLevel: 0.4,
      hintMax: 10,
      attemptThreshold: 3,
      masteryThreshold: 0.25,
      isDailyObjectiveMode: false,
      knowledgeComponentTags: ['ALG_LINEAR'],
    });

    expect(result.hint.length).toBeGreaterThan(5);
    expect(result.hint.endsWith('?')).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
  });
});
