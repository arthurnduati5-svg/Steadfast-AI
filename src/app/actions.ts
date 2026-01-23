'use server';

import { emotionalAICopilot } from '@/ai/flows/emotional-ai-copilot';
import { personalizedObjectives, PersonalizedObjectivesInput } from '@/ai/flows/personalize-daily-objectives';
import { youtubeSearchFlow } from '@/ai/flows/youtube-search-flow';
import { runFlow } from '@genkit-ai/flow';
import type { ConversationState, Message } from '@/lib/types';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

/**
 * Helper to save message to DB (mimics backend logic)
 */
async function saveMessageToDb(sessionId: string, role: 'user' | 'model', content: string) {
  try {
    if (!sessionId) return;

    const sessionExists = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { id: true }
    });

    if (!sessionExists) {
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
    // console.error('Error saving message to DB:', error);
  }
}

/**
 * Helper to update session state and title
 */
async function updateSessionState(sessionId: string, state: ConversationState, topic?: string, title?: string) {
  if (!sessionId) return;
  
  // 🔍 LOGGING: Checking what we are trying to save
  console.log(`[ACTION LOG] Attempting DB Update. ID: ${sessionId}, Title: "${title}"`);

  const data: any = { updatedAt: new Date(), metadata: state };
  
  // ✅ UPDATE TITLE IF PROVIDED
  if (title && title !== "New Chat") {
      data.topic = title; // Map 'title' to 'topic' column
  }
  
  // UPDATE INTERNAL TOPIC (If separate from title)
  if (topic && !title) {
      data.topic = topic;
  }
  
  await prisma.chatSession.update({
    where: { id: sessionId },
    data,
  });
}

// FETCH MEMORY HELPER
async function fetchStudentMemory() {
  try {
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

    // ✅ FETCH CURRENT TITLE TO PASS TO AI
    // This allows the AI to know if it needs to generate a title (if current is 'New Chat')
    let currentTitle = 'New Chat';
    if (sessionId) {
        try {
            const currentSession = await prisma.chatSession.findUnique({
                where: { id: sessionId },
                select: { topic: true }
            });
            if (currentSession?.topic) {
                currentTitle = currentSession.topic;
            }
        } catch (e) {
            // Ignore DB read error, default to New Chat
        }
    }

    // 2. Run AI
    console.log("[ACTION LOG] Calling Emotional AI...");
    const response = await emotionalAICopilot({
      text: message,
      chatHistory: chatHistory,
      state: currentState,
      preferences: preferences,
      fileData: fileDataBase64,
      forceWebSearch,
      includeVideos,
      memory: studentMemory,
      currentTitle: currentTitle,
      studentProfile: {
        name: preferences.name || 'Student', // Ensure name is passed
        gradeLevel: preferences.gradeLevel || 'Primary' // Ensure grade is passed
      }
    });

    console.log(`[ACTION LOG] AI Finished. Suggested Title: "${response.suggestedTitle}"`);

    // 3. Save AI Response & Try Update Title
    if (sessionId) {
        await saveMessageToDb(sessionId, 'model', response.processedText);
        
        // 🛡️ CRITICAL FIX: TRY/CATCH AROUND DB UPDATE
        try {
            await updateSessionState(
                sessionId, 
                response.state, 
                response.topic, 
                response.suggestedTitle 
            );
        } catch (dbError) {
            console.warn("⚠️ [ACTION LOG] DB Write Failed (RLS/Auth). Returning title to Client for fallback save.");
        }
    }

    return {
      processedText: response.processedText,
      videoData: response.videoData ?? undefined,
      state: response.state,
      // ✅ VITAL FIX: Pass suggestedTitle as 'topic' so frontend detects it
      topic: response.suggestedTitle || response.topic,
      suggestedTitle: response.suggestedTitle 
    };
  } catch (err) {
    console.error('[SERVER ACTION FATAL ERROR]', err);
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