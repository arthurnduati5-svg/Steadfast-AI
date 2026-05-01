import { runFlow } from '@genkit-ai/flow';
import { youtubeSearchFlow } from '../flows/youtube-search-flow';
import { YoutubeSearchInput, YoutubeSearchOutput } from './toolSchemas';

type YoutubeSearchResult = {
  id: string;
  title?: string;
  channel?: string;
  channelTitle?: string;
};

function hasRunnableFlow(flow: unknown): flow is { inputSchema: unknown } {
  return Boolean(flow) && typeof flow === 'object' && 'inputSchema' in (flow as Record<string, unknown>);
}

export async function youtubeSearchTool(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  const query = String(input?.query || '').trim();
  if (!query) {
    return { results: [] };
  }

  try {
    if (!hasRunnableFlow(youtubeSearchFlow)) {
      return { results: [] };
    }
    const max = Math.max(1, Math.min(5, input.maxResults || 3));
    const results = await runFlow(youtubeSearchFlow as any, { query }) as YoutubeSearchResult[];
    return {
      results: results.slice(0, max).map((video: YoutubeSearchResult) => ({
        id: video.id,
        title: video.title || 'Educational Video',
        channel: video.channel || video.channelTitle,
        url: `https://www.youtube.com/watch?v=${video.id}`,
      })),
    };
  } catch {
    return { results: [] };
  }
}
