'use server';

/**
 * @fileOverview An AI copilot that understands emotions and slang.
 */

import {z} from 'genkit';
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import { runFlow } from '@genkit-ai/flow';
import { webSearchFlow } from './web_search_flow';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EmotionalAICopilotInputSchema = z.object({
  text: z.string().describe('The user input text, potentially including slang and emotional cues.'),
});
export type EmotionalAICopilotInput = z.infer<typeof EmotionalAICopilotInputSchema>;

// New: Define a Zod schema for the video data structure for clear typing.
const VideoDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  channel: z.string().optional(),
});

// Update the output schema to include the optional videoData object.
const EmotionalAICopilotOutputSchema = z.object({
  processedText: z.string().describe('The AI copilot response, adjusted for emotion, slang, and page context.'),
  videoData: VideoDataSchema.optional().describe('Optional: Data for a suggested YouTube video.'),
});
export type EmotionalAICopilotOutput = z.infer<typeof EmotionalAICopilotOutputSchema>;

export async function emotionalAICopilot(input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> {
  return emotionalAICopilotFlow(input);
}

const emotionalAICopilotFlow = async (input: EmotionalAICopilotInput): Promise<EmotionalAICopilotOutput> => {
  console.log(`[AI-DEBUG] STEP 1: Received user input: "${input.text}"`);

  const systemMessage = `You are Steadfast Copilot AI, a friendly, patient, and simple-speaking learning guide for Kenyan students (K–12, Cambridge curriculum). You must always respond like a flexible, intelligent human guide — never like a rigid robot.

Here are the Core Rules for you to follow:
- **CRITICAL RULE:** Your responses must be short, focused on a single, tiny step, and always end with a question to check for understanding.
- **HANDLING CAPABILITY QUESTIONS (e.g., "Can you search YouTube?"):**
    - First, answer directly and positively (e.g., "✅ Yes, I can.").
    - Then, immediately ask for the topic (e.g., "What subject are you learning today?").
- **YOUTUBE VIDEO RULES:**
    - Only use the 'youtube_search' tool if the student explicitly asks for a video on a specific topic.
    - **AFTER SUGGESTING A VIDEO:** You must act as if you are aware of the video's content. If the student asks a question about the video, use your knowledge of the topic (e.g., 'fractions') to provide step-by-step guidance and clarification, just as a good teacher would.
    - **IF THE YOUTUBE TOOL FAILS:** Your first response must be graceful: “I couldn’t fetch YouTube just now 😅 — but here are trusted channels you can check: Khan Academy, CrashCourse, 3Blue1Brown.” Then, immediately offer to teach the topic yourself.
    - **IF THE STUDENT ASKS FOR A VIDEO AGAIN AFTER A FAILURE:** You must recognize this is a repeated request. Do not try the tool again. Respond apologetically and pivot firmly to teaching. Say: "I understand you really want a video, and I'm sorry the search tool isn't working right now. I can't try it again, but I can definitely teach you about [topic] myself. Shall we start with the basics?" This shows you are aware and not a broken robot.
- **PERSONA & GUIDING PRINCIPLES:**
    - You are a 'Guru' in all school subjects.
    - NEVER give the final answer unless the student gets it right.
    - Use relatable Kenyan examples and guide with a step-by-step Hint Ladder (H0-H3).
    - Be aware this is a Muslim school and handle related topics with respect.`;

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: input.text },
  ];

  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'youtube_search',
        description: 'Searches for an educational YouTube video on a specific topic when a student explicitly asks for one.',
        parameters: {
          type: 'object' as const,
          properties: {
            query: {
              type: 'string',
              description: 'The core educational topic to search for, e.g., "fractions", "osmosis".',
            },
          },
          required: ['query'],
        },
      },
    },
  ];

  console.log('[AI-DEBUG] STEP 2: Querying OpenAI model...');
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4o',
    tools: tools,
    tool_choice: 'auto',
  });

  const responseMessage = completion.choices[0].message;
  console.log('[AI-DEBUG] STEP 3: Received raw response from OpenAI:', JSON.stringify(responseMessage, null, 2));

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    console.log('[AI-DEBUG] STEP 4: AI decided to use a tool.');
    const toolCall = responseMessage.tool_calls[0];
    if (toolCall.type === 'function' && toolCall.function.name === 'youtube_search') {
      try {
        const { query } = JSON.parse(toolCall.function.arguments);
        console.log(`[AI-DEBUG] STEP 5: Executing 'youtube_search' with query: "${query}"`);
        
        const { results } = await runFlow(webSearchFlow, { query });
        console.log(`[AI-DEBUG] STEP 6: 'webSearchFlow' returned ${results.length} results.`);

        if (results.length > 0) {
          const video = results[0];
          // New: Return a structured response with videoData
          const finalResponse = { 
            processedText: `Here is a video that might help:`,
            videoData: {
              id: video.id,
              title: video.title,
              channel: video.channel,
            }
          };
          console.log('[AI-DEBUG] STEP 7: Found video. Sending structured video data to frontend.');
          return finalResponse;
        } else {
            const fallbackResponse = { processedText: "I couldn’t find a video for that topic right now 😅 — but I can explain it to you, or suggest some trusted channels like Khan Academy!" };
            console.log('[AI-DEBUG] STEP 7: Search successful but no videos found. Sending fallback.');
            return fallbackResponse;
        }
      } catch (error) {
        console.error('[AI-DEBUG] ERROR during tool execution or webSearchFlow:', error);
        const errorResponse = { processedText: "I couldn’t fetch YouTube just now 😅 — but here are trusted channels you can check: Khan Academy, CrashCourse, 3Blue1Brown. Would you like me to try explaining the topic instead?" };
        console.log('[AI-DEBUG] STEP 7: Error in search flow. Sending error fallback.');
        return errorResponse;
      }
    }
  }

  const finalResponse = { processedText: responseMessage.content || "I'm not sure how to respond to that, but I'm here to help!" };
  console.log(`[AI-DEBUG] STEP 4: AI did not use a tool. Sending text response: "${finalResponse.processedText}"`);
  return finalResponse;
};
