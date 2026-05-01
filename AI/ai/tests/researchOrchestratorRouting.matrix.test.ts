import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@genkit-ai/flow', () => ({
  runFlow: vi.fn(),
}));

vi.mock('../flows/intent-detector', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../flows/intent-detector')>();
  return {
    ...actual,
    detectResearchIntent: vi.fn(),
    detectLearningTurnPlan: actual.detectLearningTurnPlan,
  };
});

vi.mock('../flows/web_search_flow', () => ({
  webSearchFlow: { inputSchema: { type: 'object' }, __name: 'webSearchFlow' },
}));

vi.mock('../flows/general_web_search_flow', () => ({
  generalWebResearchFlow: { inputSchema: { type: 'object' }, __name: 'generalWebResearchFlow' },
}));

vi.mock('../flows/youtube-search-flow', () => ({
  youtubeSearchFlow: { inputSchema: { type: 'object' }, __name: 'youtubeSearchFlow' },
}));

vi.mock('../genkit', () => ({
  ai: {
    generate: vi.fn().mockResolvedValue({ output: { query: 'photosynthesis educational' } }),
  },
}));

import { runFlow } from '@genkit-ai/flow';
import { detectResearchIntent } from '../flows/intent-detector';
import { runResearchOrchestrator } from '../flows/research-orchestrator';
import { webSearchFlow } from '../flows/web_search_flow';
import { generalWebResearchFlow } from '../flows/general_web_search_flow';

const mockedRunFlow = vi.mocked(runFlow);
const mockedDetectIntent = vi.mocked(detectResearchIntent);

describe('Research Orchestrator Routing Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRunFlow.mockImplementation(async (flow: unknown) => {
      if (flow === generalWebResearchFlow) {
        return { mode: 'web_research', reply: 'General web result', sources: [{ sourceName: 'Test', url: 'https://example.com' }] } as any;
      }
      if (flow === webSearchFlow) {
        return { mode: 'teaching', response: 'Teaching continuation' } as any;
      }
      return [] as any;
    });
  });

  it('auto-routes to general web research on freshness-sensitive fact lookup without force mode', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'what is the latest inflation rate in kenya today with sources',
      lastSearchTopic: 'economics',
      forceWebSearch: false,
      chatHistory: [],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      generalWebResearchFlow as any,
      expect.objectContaining({ forceWebSearch: true })
    );
  });

  it('keeps context flow for non-fresh explanatory prompt without force mode', async () => {
    mockedDetectIntent.mockResolvedValue('concept_explanation');

    await runResearchOrchestrator({
      query: 'what is photosynthesis',
      lastSearchTopic: 'biology',
      forceWebSearch: false,
      chatHistory: [],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      webSearchFlow as any,
      expect.objectContaining({ query: 'what is photosynthesis' })
    );
    expect(mockedRunFlow).not.toHaveBeenCalledWith(generalWebResearchFlow as any, expect.anything());
  });

  it('honors explicit no-web instruction even when force mode is enabled', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'do not search the web, explain from context only',
      lastSearchTopic: 'biology',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'Prior context exists.' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      webSearchFlow as any,
      expect.objectContaining({ query: 'do not search the web, explain from context only' })
    );
    expect(mockedRunFlow).not.toHaveBeenCalledWith(generalWebResearchFlow as any, expect.anything());
  });

  it('does not force web for likely follow-up turns in force mode unless explicit lookup signal exists', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'can you explain that part again',
      lastSearchTopic: 'inflation in kenya',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'Inflation was 5.2%' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      webSearchFlow as any,
      expect.objectContaining({ query: 'can you explain that part again' })
    );
  });

  it('forces web when explicit web signal is present in force mode', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'search online latest inflation in kenya',
      lastSearchTopic: 'economics',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'Economics topic active.' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      generalWebResearchFlow as any,
      expect.objectContaining({
        query: expect.stringContaining('search online latest inflation in kenya'),
        forceWebSearch: true
      })
    );
  });

  it('routes to context flow for meta web-mode questions', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'are you searching online right now?',
      lastSearchTopic: 'photosynthesis',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'We are discussing chlorophyll.' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      webSearchFlow as any,
      expect.objectContaining({ query: 'are you searching online right now?' })
    );
  });

  it('keeps fact/deep intents on context flow when force mode is disabled and freshness signal is absent', async () => {
    mockedDetectIntent.mockResolvedValue('deep_research');

    await runResearchOrchestrator({
      query: 'teach me about photosynthesis',
      lastSearchTopic: 'biology',
      forceWebSearch: false,
      chatHistory: [],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      webSearchFlow as any,
      expect.objectContaining({ query: 'teach me about photosynthesis' })
    );
    expect(mockedRunFlow).not.toHaveBeenCalledWith(generalWebResearchFlow as any, expect.anything());
  });
});
