'use server';

import { runFlow } from '@genkit-ai/flow';
import { emotionalAICopilot } from '@/ai/flows/emotional-ai-copilot';
import { personalizedObjectives, PersonalizedObjectivesInput } from '@/ai/flows/personalize-daily-objectives';
import { youtubeSearchFlow } from '@/ai/flows/youtube-search-flow';
import type { ConversationState, Message } from '@/lib/types';

/**
 * getAssistantResponse()
 * The main bridge for the Chat UI -> Emotional AI Copilot.
 */
export async function getAssistantResponse(
  message: string,
  chatHistory: Message[],
  currentState: ConversationState,
  fileDataBase66: { type: string; base64: string } | undefined,
  forceWebSearch: boolean,
  includeVideos: boolean,
  gradeHint: 'Primary' | 'LowerSecondary' | 'UpperSecondary',
  languageHint: 'english' | 'english_sw' | 'swahili' | 'arabic',
) {
  try {
    const response = await emotionalAICopilot({
      text: message,
      chatHistory: chatHistory,
      state: currentState,
      preferences: {
        gradeLevel: gradeHint,
        preferredLanguage: languageHint,
      },
      fileData: fileDataBase66,
      forceWebSearch,
      includeVideos,
    });

    return {
      processedText: response.processedText,
      videoData: response.videoData ?? undefined,
      state: response.state,
      topic: response.topic,
    };
  } catch (err) {
    console.error('[SERVER ACTION BRIDGE ERROR - Copilot]', err);
    return {
      processedText: 'I am sorry, but something went wrong while processing that. Could you try again?',
      videoData: undefined,
      state: currentState,
      topic: undefined,
    };
  }
}

/**
 * getDailyObjectives()
 * Bridge for the Daily Objectives component.
 * Restored to fix the import error in daily-objectives.tsx.
 */
export async function getDailyObjectives(
  studentPerformance: string,
  curriculum: string,
  loggedMisconceptions: string
) {
  try {
    const objectivesInput: PersonalizedObjectivesInput = {
      studentPerformance,
      curriculum,
      loggedMisconceptions,
    };
    const result = await personalizedObjectives(objectivesInput);
    return result.dailyObjectives;
  } catch (err) {
    console.error('[SERVER ACTION BRIDGE ERROR - Objectives]', err);
    // Return a safe fallback so the UI doesn't crash
    return ['Review today\'s key concepts.', 'Practice one core problem.'];
  }
}

/**
 * searchYouTube()
 * Bridge for YouTube search functionality (if used by other components).
 */
export async function searchYouTube(query: string) {
  try {
    const results = await runFlow(youtubeSearchFlow, { query });
    return results;
  } catch (error) {
    console.error('[SERVER ACTION BRIDGE ERROR - YouTube]', error);
    return [];
  }
}

// Re-export types so client components can import them from this bridge
export type { ConversationState, Message };