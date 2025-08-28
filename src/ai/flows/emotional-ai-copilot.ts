'use server';

/**
 * @fileOverview An AI copilot that understands emotions and slang.
 *
 * - emotionalAICopilot - A function that processes user input with emotional and slang awareness.
 * - EmotionalAICopilotInput - The input type for the emotionalAICopilot function.
 * - EmotionalAICopilotOutput - The return type for the emotionalAICopilot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmotionalAICopilotInputSchema = z.object({
  text: z.string().describe('The user input text, potentially including slang and emotional cues.'),
  pathname: z.string().describe("The current page the user is on. Use this to understand the student's context."),
});
export type EmotionalAICopilotInput = z.infer<typeof EmotionalAICopilotInputSchema>;

const EmotionalAICopilotOutputSchema = z.object({
  processedText: z.string().describe('The AI copilot response, adjusted for emotion, slang, and page context.'),
});
export type EmotionalAICopilotOutput = z.infer<typeof EmotionalAICopilotOutputSchema>;

export async function emotionalAICopilot(input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> {
  return emotionalAICopilotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emotionalAICopilotPrompt',
  input: {schema: EmotionalAICopilotInputSchema},
  output: {schema: EmotionalAICopilotOutputSchema},
  prompt: `You are an AI copilot for a student. You are context-aware and act as a helpful partner, not just a generic chatbot.

  The student is currently on the '{{pathname}}' page of the school system. Your response should be tailored to this context. For example, if they are on the '/assignments' page, your help should be related to assignments.

  Analyze the student's input for emotional content (frustration, excitement, confusion, etc.) and adjust your response accordingly to ensure empathy and understanding.

  Also, interpret any slang or non-standard language to provide an accurate and helpful response that addresses the student's underlying needs.

  Input: {{{text}}}`, 
});

const emotionalAICopilotFlow = ai.defineFlow(
  {
    name: 'emotionalAICopilotFlow',
    inputSchema: EmotionalAICopilotInputSchema,
    outputSchema: EmotionalAICopilotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
