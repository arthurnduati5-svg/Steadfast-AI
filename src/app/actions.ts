'use server';

import { emotionalAICopilot } from '@/ai/flows/emotional-ai-copilot';
import { personalizedObjectives, PersonalizedObjectivesInput } from '@/ai/flows/personalize-daily-objectives';
import { youtubeSearchFlow } from '@/ai/flows/youtube-search-flow';
import { runFlow } from '@genkit-ai/flow';
import type { ConversationState, Message } from '@/lib/types';
// Ensure you have this export available in your project structure
import prisma from '@/lib/prisma';  
import { cookies } from 'next/headers';

/**
 * Helper to save message to DB (mimics backend logic)
 * Includes check to prevent Foreign Key errors if session isn't synced yet.
 */
async function saveMessageToDb(sessionId: string, role: 'user' | 'model', content: string) {
  try {
    if (!sessionId) return;

    // Safety Check: Ensure session exists before inserting message to avoid P2003
    const sessionExists = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { id: true }
    });

    if (!sessionExists) {
        // Session not found in DB yet (likely race condition with API creation).
        // Skip DB write here; frontend API call will handle persistence.
        return; 
    }

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
    // Silently handle DB errors to prevent disrupting the UI stream
    // console.error('Error saving message to DB:', error);
  }
}

/**
 * Helper to update session state
 * Includes check to prevent Record Not Found errors.
 */
async function updateSessionState(sessionId: string, state: ConversationState, topic?: string) {
  try {
    if (!sessionId) return;

    // Safety Check: Ensure session exists to avoid P2025
    const sessionExists = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { id: true }
    });

    if (!sessionExists) return;

    const data: any = { updatedAt: new Date(), metadata: state };
    if (topic) data.topic = topic;
    
    await prisma.chatSession.update({
      where: { id: sessionId },
      data,
    });
  } catch (error) {
    // console.error('Error updating session state:', error);
  }
}

// FETCH MEMORY HELPER
async function fetchStudentMemory() {
  try {
    // Placeholder: In a real implementation, you might fetch from DB using user ID from session/cookies
    return { progress: [], mistakes: [] };
  } catch (e) {
    return { progress: [], mistakes: [] };
  }
}

export async function getAssistantResponse(
  sessionId: string,
  message: string,
  chatHistory: Message[],
  currentState: ConversationState,
  fileDataBase64: { type: string; base64: string } | undefined,
  forceWebSearch: boolean,
  includeVideos: boolean,
  preferences: {
    name?: string;
    gradeLevel?: 'Primary' | 'LowerSecondary' | 'UpperSecondary';
    preferredLanguage?: 'english' | 'swahili' | 'arabic' | 'english_sw';
    interests?: string[];
  },
  // NEW: Accept Memory from the client
  studentMemory: {
    progress: any[];
    mistakes: any[];
  }
) {
  try {
    // 1. Save User Message (Safely)
    if (sessionId) {
        await saveMessageToDb(sessionId, 'user', message);
    }

    // 2. Generate Response using the Brain
    const response = await emotionalAICopilot({
      text: message,
      chatHistory: chatHistory,
      state: currentState,
      preferences: preferences,
      fileData: fileDataBase64,
      forceWebSearch,
      includeVideos,
      // Pass the memory object to the flow
      memory: studentMemory 
    });

    // 3. Save AI Response (Safely)
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