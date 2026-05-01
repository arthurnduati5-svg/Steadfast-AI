import { runFlow } from '@genkit-ai/flow';
import { getYoutubeTranscriptFlow } from '../flows/get-youtube-transcript';
import { GetYoutubeTranscriptInput, GetYoutubeTranscriptOutput } from './toolSchemas';

export async function getYoutubeTranscriptTool(input: GetYoutubeTranscriptInput): Promise<GetYoutubeTranscriptOutput> {
  const videoId = String(input?.videoId || '').trim();
  if (!videoId || videoId.length < 4) {
    return { error: 'Invalid videoId' };
  }

  try {
    const transcript = await runFlow(getYoutubeTranscriptFlow, { videoId });
    if (!transcript || transcript.startsWith('Could not')) {
      return { error: 'Transcript not available' };
    }
    return { transcript };
  } catch {
    return { error: 'Transcript not available' };
  }
}
