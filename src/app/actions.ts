'use server';

import { emotionalAICopilot } from '@/ai/flows/emotional-ai-copilot';
import { personalizedObjectives, PersonalizedObjectivesInput } from '@/ai/flows/personalize-daily-objectives';
import { youtubeSearchFlow } from '@/ai/flows/youtube-search-flow';
import { runFlow } from '@genkit-ai/flow';
import type { ConversationState, Message } from '@/lib/types';
// Ensure you have this export available
// If prisma is not available in utils, use the path from your backend file:
import prisma from '../lib/prisma';  
// Assuming '@/utils/prismaClient' based on previous context or standard pattern.

/**
 * Helper to save message to DB (mimics backend logic)
 */
async function saveMessageToDb(sessionId: string, role: 'user' | 'model', content: string) {
  try {
    const count = await prisma.chatMessage.count({ where: { sessionId } });
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        timestamp: new Date(),
        messageNumber: count + 1,
      },
    });
  } catch (error) {
    console.error('Error saving message to DB:', error);
  }
}

/**
 * Helper to update session state
 */
async function updateSessionState(sessionId: string, state: ConversationState, topic?: string) {
  try {
    const data: any = { updatedAt: new Date(), metadata: state };
    if (topic) data.topic = topic;
    
    await prisma.chatSession.update({
      where: { id: sessionId },
      data,
    });
  } catch (error) {
    console.error('Error updating session state:', error);
  }
}

export async function getAssistantResponse(
  sessionId: string,
  message: string,
  chatHistory: Message[],
  currentState: ConversationState,
  fileDataBase66: { type: string; base64: string } | undefined,
  forceWebSearch: boolean,
  includeVideos: boolean,
  // Updated: Now accepts the full preferences object
  preferences: {
    name?: string;
    gradeLevel?: 'Primary' | 'LowerSecondary' | 'UpperSecondary';
    preferredLanguage?: 'english' | 'swahili' | 'arabic' | 'english_sw';
    interests?: string[];
  }
) {
  try {
    // 1. Save User Message
    if (sessionId) {
        await saveMessageToDb(sessionId, 'user', message);
    }

    // 2. Generate Response using the Brain
    const response = await emotionalAICopilot({
      text: message,
      chatHistory: chatHistory,
      state: currentState,
      // Pass the preferences object directly to the flow
      preferences: preferences,
      fileData: fileDataBase66,
      forceWebSearch,
      includeVideos,
    });

    // 3. Save AI Response
    if (sessionId) {
        await saveMessageToDb(sessionId, 'model', response.processedText);
        await updateSessionState(sessionId, response.state, response.topic);
    }

    return {
      processedText: response.processedText,
      videoData: response.videoData ?? undefined,
      state: response.state,
      topic: response.topic,
    };
  } catch (err) {
    console.error('[SERVER ACTION BRIDGE ERROR]', err);
    return {
      processedText: 'I am sorry, but something went wrong while processing that. Could you try again?',
      videoData: undefined,
      state: currentState,
      topic: undefined,
    };
  }
}

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
    return ['Review today\'s key concepts.', 'Practice one core problem.'];
  }
}

export async function searchYouTube(query: string) {
  try {
    const results = await runFlow(youtubeSearchFlow, { query });
    return results;
  } catch (error) {
    console.error('[SERVER ACTION BRIDGE ERROR - YouTube]', error);
    return [];
  }
}

export type { ConversationState, Message };