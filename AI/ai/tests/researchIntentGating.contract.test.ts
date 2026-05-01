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

describe('Research Intent Gating Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRunFlow.mockImplementation(async (flow: unknown) => {
      if (flow === generalWebResearchFlow) {
        return { mode: 'web_research', reply: 'General web result' } as any;
      }
      if (flow === webSearchFlow) {
        return { mode: 'teaching', response: 'Teaching continuation' } as any;
      }
      return [] as any;
    });
  });

  it('does not auto-search web for clarification follow-up turns in web mode', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'can you explain that part again',
      lastSearchTopic: 'operant conditioning',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'Operant conditioning uses reinforcement.' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      webSearchFlow as any,
      expect.objectContaining({
        query: 'can you explain that part again',
      })
    );
    expect(mockedRunFlow).not.toHaveBeenCalledWith(
      generalWebResearchFlow as any,
      expect.anything()
    );
  });

  it('does trigger web search when the learner explicitly requests online lookup', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'search latest inflation rate in Kenya with sources',
      lastSearchTopic: 'economics',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'Let us verify current numbers.' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      generalWebResearchFlow as any,
      expect.objectContaining({
        query: expect.stringContaining('search latest inflation rate in Kenya with sources'),
        forceWebSearch: true,
      })
    );
  });

  it('keeps meta web-mode questions in teaching flow and avoids unnecessary web search', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'are you searching online right now or explaining from context?',
      lastSearchTopic: 'photosynthesis',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'We are discussing chlorophyll.' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      webSearchFlow as any,
      expect.objectContaining({
        query: 'are you searching online right now or explaining from context?',
      })
    );
    expect(mockedRunFlow).not.toHaveBeenCalledWith(
      generalWebResearchFlow as any,
      expect.anything()
    );
  });

  it('auto-triggers web research for freshness-sensitive lookup queries even without force mode', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'what is the latest inflation rate in kenya today with sources',
      lastSearchTopic: 'economics',
      forceWebSearch: false,
      chatHistory: [{ role: 'assistant', content: 'We can verify current figures.' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      generalWebResearchFlow as any,
      expect.objectContaining({
        query: 'what is the latest inflation rate in kenya today with sources',
        forceWebSearch: true,
      })
    );
  });

  it('keeps normal teaching flow for non-fresh lookup without explicit web signal in non-force mode', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'what is photosynthesis',
      lastSearchTopic: 'biology',
      forceWebSearch: false,
      chatHistory: [{ role: 'assistant', content: 'Plants use sunlight to make food.' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      webSearchFlow as any,
      expect.objectContaining({
        query: 'what is photosynthesis',
      })
    );
    expect(mockedRunFlow).not.toHaveBeenCalledWith(
      generalWebResearchFlow as any,
      expect.anything()
    );
  });

  it('honors explicit no-web instruction even when web mode is enabled', async () => {
    mockedDetectIntent.mockResolvedValue('fact_lookup');

    await runResearchOrchestrator({
      query: 'do not search the web, just explain from context: what is osmosis',
      lastSearchTopic: 'biology',
      forceWebSearch: true,
      chatHistory: [{ role: 'assistant', content: 'We can teach from context.' }],
    });

    expect(mockedRunFlow).toHaveBeenCalledWith(
      webSearchFlow as any,
      expect.objectContaining({
        query: 'do not search the web, just explain from context: what is osmosis',
      })
    );
    expect(mockedRunFlow).not.toHaveBeenCalledWith(
      generalWebResearchFlow as any,
      expect.anything()
    );
  });
});
