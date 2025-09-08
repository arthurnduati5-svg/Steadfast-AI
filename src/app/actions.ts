'use server';

import { runFlow } from '@genkit-ai/flow';
import {
  emotionalAICopilot,
  EmotionalAICopilotOutput,
} from '@/ai/flows/emotional-ai-copilot';
import { personalizedObjectives } from '@/ai/flows/personalize-daily-objectives';
import { webSearchFlow } from '@/ai/flows/web_search_flow';
import { PersonalizedObjectivesInput } from '@/ai/flows/personalize-daily-objectives';

export async function getAssistantResponse(
  message: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  pathname: string,
  fileDataBase64: { type: string; base64: string } | undefined,
): Promise<EmotionalAICopilotOutput> {
  try {
    const result = await emotionalAICopilot({
      text:
        chatHistory.map((m) => `${m.role}: ${m.content}`).join('\n') +
        '\n' +
        `user: ${message}`,
    });
    return result;
  } catch (error) {
    console.error('Error in emotional AI copilot:', error);
    return {
      processedText:
        "I'm sorry, I'm having trouble connecting right now. Please try again later.",
    };
  }
}

export async function getDailyObjectives(
  studentPerformance: string,
  curriculum: string,
  loggedMisconceptions: string,
): Promise<string[]> {
  try {
    const objectivesInput: PersonalizedObjectivesInput = {
      studentPerformance,
      curriculum,
      loggedMisconceptions,
    };
    const result = await personalizedObjectives(objectivesInput);
    return result.dailyObjectives;
  } catch (error) {
    console.error('Error getting daily objectives:', error);
    return ['Could not load objectives. Please try again later.'];
  }
}

export async function searchYouTube(query: string) {
  try {
    const { results } = await runFlow(webSearchFlow, { query });
    return results;
  } catch (error) {
    console.error('Error in YouTube search flow:', error);
    return [];
  }
}
