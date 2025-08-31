'use server';

import { emotionalAICopilot } from '@/ai/flows/emotional-ai-copilot';
import { personalizedObjectives } from '@/ai/flows/personalize-daily-objectives';
// The generateAdaptiveHint flow and its input type are no longer needed as the emotionalAICopilot handles all guidance.
// import { generateAdaptiveHint } from '@/ai/flows/generate-adaptive-hints';
// import { GenerateAdaptiveHintInput } from '@/ai/flows/generate-adaptive-hints';
import { PersonalizedObjectivesInput } from '@/ai/flows/personalize-daily-objectives';


export async function getAssistantResponse(
  message: string,
  chatHistory: {role: 'user' | 'assistant', content: string}[],
  pathname: string,
  // All hint-related parameters are removed as emotionalAICopilot now handles this internally.
  fileDataBase64: { type: string; base64: string } | undefined,
): Promise<string> {
  // The isHintRequest logic is no longer needed as emotionalAICopilot will decide how to respond.
  // For simplicity, multimodal input is currently only handled by emotionalAICopilot.

  try {
    // Pass the message, pathname, and fileDataBase64 to the emotionalAICopilot.
    // The chat history can be included in the 'text' to provide context to the AI.
    // The AI's prompt in emotionalAICopilot.ts is now designed to handle the full conversation context.
    const result = await emotionalAICopilot({ 
      text: chatHistory.map(m => `${m.role}: ${m.content}`).join('\n') + '\n' + `user: ${message}`,
      pathname,
      fileDataBase64 
    });
    return result.processedText;
  } catch (error) {
    console.error('Error in emotional AI copilot:', error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
}

export async function getDailyObjectives(
  // Parameters for personalizedObjectives - these should come from your application's state/database
  studentPerformance: string,
  curriculum: string,
  loggedMisconceptions: string,
): Promise<string[]> {
  try {
    const objectivesInput: PersonalizedObjectivesInput = {
      studentPerformance, // This should be the actual student's performance
      curriculum, // This should be the actual curriculum
      loggedMisconceptions, // This should be the actual logged misconceptions for the student
    };
    const result = await personalizedObjectives(objectivesInput);
    return result.dailyObjectives;
  } catch (error) {
    console.error('Error getting daily objectives:', error);
    return [
      'Could not load objectives. Please try again later.',
    ];
  }
}
