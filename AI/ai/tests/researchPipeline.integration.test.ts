import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../flows/intent-detector', () => ({
  detectResearchIntent: vi.fn(),
  heuristicResearchIntent: vi.fn(),
}));

vi.mock('../genkit', () => ({
  ai: {
    generate: vi.fn(),
  },
  serperSearchTool: vi.fn(),
}));

import { emotionalAICopilot } from '../flows/emotional-ai-copilot';
import { detectResearchIntent, heuristicResearchIntent } from '../flows/intent-detector';
import { ai, serperSearchTool } from '../genkit';

const mockedDetectIntent = vi.mocked(detectResearchIntent);
const mockedHeuristicIntent = vi.mocked(heuristicResearchIntent);
const mockedGenerate = vi.mocked(ai.generate);
const mockedSerper = vi.mocked(serperSearchTool);

describe('Research pipeline integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps clarification/continuation turns fast and in-context', async () => {
    mockedHeuristicIntent.mockReturnValue('dialogue_continuation');
    mockedGenerate.mockResolvedValue({
      text: 'Let us focus on one idea first. What part is still unclear?',
    } as any);

    const result = await emotionalAICopilot({
      text: 'okay continue',
      chatHistory: [],
      state: {
        researchModeActive: true,
        lastSearchTopic: ['fractions'],
        awaitingPracticeQuestionInvitationResponse: false,
        awaitingPracticeQuestionAnswer: false,
        validationAttemptCount: 0,
        sensitiveContentDetected: false,
        videoSuggested: false,
        usedExamples: [],
        conversationState: 'awaiting_practice_response',
      } as any,
      studentProfile: { name: 'Test Student', gradeLevel: 'Primary' },
      preferences: { preferredLanguage: 'english', interests: ['football'] },
      currentTitle: 'Fractions Chat',
    });

    expect(result.processedText.trim().length).toBeGreaterThan(16);
  });

  it('routes emotionalAICopilot -> orchestrator -> generalWebResearchFlow for fact lookup', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    mockedGenerate
      .mockResolvedValueOnce({
        output: { queries: ['latest nasa artemis update'] },
        text: '{"queries":["latest nasa artemis update"]}',
      } as any)
      .mockResolvedValueOnce({
        output: { facts: ['NASA is running Artemis missions to return humans to the Moon.'] },
        text: '{"facts":["NASA is running Artemis missions to return humans to the Moon."]}',
      } as any)
      .mockResolvedValueOnce({
        text: 'NASA is running Artemis missions focused on returning astronauts to the Moon. Does that make sense?',
      } as any);

    mockedSerper.mockResolvedValue({
      results: [
        {
          title: 'NASA Artemis',
          link: 'https://www.nasa.gov/artemis/',
          snippet: 'NASA Artemis program updates.',
        },
      ],
    } as any);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/html' },
        text: async () =>
          '<html><body>NASA Artemis is the Moon exploration program that will return humans to the lunar surface.</body></html>',
      })
    );

    const result = await emotionalAICopilot({
      text: 'search latest nasa artemis update',
      chatHistory: [],
      state: {
        researchModeActive: true,
        lastSearchTopic: ['space'],
        awaitingPracticeQuestionInvitationResponse: false,
        awaitingPracticeQuestionAnswer: false,
        validationAttemptCount: 0,
        sensitiveContentDetected: false,
        videoSuggested: false,
        usedExamples: [],
      },
      studentProfile: { name: 'Test Student', gradeLevel: 'UpperSecondary' },
      preferences: { preferredLanguage: 'english', interests: ['science'] },
      currentTitle: 'Space Chat',
      forceWebSearch: true,
    });

    expect(result.processedText.toLowerCase()).toContain('artemis');
    expect((result.sources || []).length).toBeGreaterThan(0);
    expect(mockedSerper).toHaveBeenCalled();
  });
});
