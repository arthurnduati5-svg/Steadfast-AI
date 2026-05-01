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
    generate: vi.fn().mockResolvedValue({ output: { query: 'mocked educational query' } }),
  },
}));

import { runFlow } from '@genkit-ai/flow';
import { detectResearchIntent } from '../flows/intent-detector';
import { runResearchOrchestrator } from '../flows/research-orchestrator';
import { webSearchFlow } from '../flows/web_search_flow';
import { generalWebResearchFlow } from '../flows/general_web_search_flow';

const mockedRunFlow = vi.mocked(runFlow);
const mockedDetectIntent = vi.mocked(detectResearchIntent);

describe('Research context continuity deep routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRunFlow.mockImplementation(async (flow: unknown) => {
      if (flow === generalWebResearchFlow) {
        return { mode: 'web_research', reply: 'Web research result' } as any;
      }
      if (flow === webSearchFlow) {
        return { mode: 'teaching', response: 'Context continuation' } as any;
      }
      return [] as any;
    });
  });

  it('switches from web lookup to in-context follow-up in a multi-turn sequence', async () => {
    mockedDetectIntent
      .mockResolvedValueOnce('fact_lookup')
      .mockResolvedValueOnce('clarification');

    await runResearchOrchestrator({
      query: 'what is the latest inflation rate in kenya today',
      lastSearchTopic: 'economics',
      forceWebSearch: false,
      chatHistory: [],
    });

    await runResearchOrchestrator({
      query: 'can you explain that trend simply for grade 8',
      lastSearchTopic: 'inflation in kenya',
      forceWebSearch: false,
      chatHistory: [{ role: 'assistant', content: 'Inflation trend summary from sources.' }],
    });

    expect(mockedRunFlow).toHaveBeenNthCalledWith(
      1,
      generalWebResearchFlow as any,
      expect.objectContaining({ query: 'what is the latest inflation rate in kenya today', forceWebSearch: true })
    );
    expect(mockedRunFlow).toHaveBeenNthCalledWith(
      2,
      webSearchFlow as any,
      expect.objectContaining({ query: 'can you explain that trend simply for grade 8' })
    );
  });

  it('stays in context for force-mode meta/follow-up turns but triggers web when explicit lookup appears', async () => {
    mockedDetectIntent
      .mockResolvedValueOnce('fact_lookup')
      .mockResolvedValueOnce('clarification')
      .mockResolvedValueOnce('fact_lookup');

    await runResearchOrchestrator({
      query: 'are you searching online right now?',
      lastSearchTopic: 'photosynthesis',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'We discussed chlorophyll basics.' }],
    });

    await runResearchOrchestrator({
      query: 'okay continue from that',
      lastSearchTopic: 'photosynthesis',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'We discussed chlorophyll basics.' }],
    });

    await runResearchOrchestrator({
      query: 'search online latest research updates about photosynthesis efficiency',
      lastSearchTopic: 'photosynthesis',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'We discussed chlorophyll basics.' }],
    });

    expect(mockedRunFlow).toHaveBeenNthCalledWith(
      1,
      webSearchFlow as any,
      expect.objectContaining({ query: 'are you searching online right now?' })
    );
    expect(mockedRunFlow).toHaveBeenNthCalledWith(
      2,
      webSearchFlow as any,
      expect.objectContaining({ query: 'okay continue from that' })
    );
    expect(mockedRunFlow).toHaveBeenNthCalledWith(
      3,
      generalWebResearchFlow as any,
      expect.objectContaining({ query: 'search online latest research updates about photosynthesis efficiency', forceWebSearch: true })
    );
  });

  it('honors explicit no-web instruction even across topic change and force mode', async () => {
    mockedDetectIntent
      .mockResolvedValueOnce('fact_lookup')
      .mockResolvedValueOnce('fact_lookup');

    await runResearchOrchestrator({
      query: 'new topic latest exchange rate kes to usd today',
      lastSearchTopic: 'biology',
      forceWebSearch: true,
      chatHistory: [],
    });

    await runResearchOrchestrator({
      query: 'do not search the web, explain exchange rates from context only',
      lastSearchTopic: 'exchange rate',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'Current exchange rates can change daily.' }],
    });

    expect(mockedRunFlow).toHaveBeenNthCalledWith(
      1,
      generalWebResearchFlow as any,
      expect.objectContaining({ query: 'new topic latest exchange rate kes to usd today', forceWebSearch: true })
    );
    expect(mockedRunFlow).toHaveBeenNthCalledWith(
      2,
      webSearchFlow as any,
      expect.objectContaining({ query: 'do not search the web, explain exchange rates from context only' })
    );
  });
});
