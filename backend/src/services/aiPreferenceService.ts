// backend/src/services/aiPreferenceService.ts

import prisma from '../utils/prismaClient';
import { getRedisClient } from '../lib/redis';

export interface CopilotPreferences {
  userId: string;
  preferredLanguage: string;
  interests: string[];
}

const DEFAULT_LANGUAGE = 'English';
const DEFAULT_INTERESTS: string[] = [];

// This function will fetch a student's preferences or create default ones if none exist
export async function getOrCreateCopilotPreferences(userId: string): Promise<CopilotPreferences> {
  const cacheKey = `copilot:preferences:${userId}`;
  let redis;
  try {
    redis = await getRedisClient();
  } catch (error) {
    console.warn('Redis client not available for aiPreferenceService preferences retrieval.', error);
  }

  try {
    if (redis) {
      const cachedPreferences = await redis.get(cacheKey);
      if (cachedPreferences) {
        return JSON.parse(cachedPreferences);
      }
    }

    let preferences = await prisma.copilotPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = await prisma.copilotPreferences.create({
        data: {
          userId,
          preferredLanguage: DEFAULT_LANGUAGE,
          interests: DEFAULT_INTERESTS,
        },
      });
    }

    const formattedPreferences: CopilotPreferences = {
      userId: preferences.userId,
      preferredLanguage: preferences.preferredLanguage,
      interests: preferences.interests as string[], // Ensure interests is treated as string[]
    };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(formattedPreferences));
      await redis.expire(cacheKey, 1800); // Cache for 30 minutes
    }

    return formattedPreferences;
  } catch (error) {
    console.error(`Error fetching or creating student preferences for userId ${userId}:`, error);
    // Return default preferences in case of a database error
    return {
      userId,
      preferredLanguage: DEFAULT_LANGUAGE,
      interests: DEFAULT_INTERESTS,
    };
  }
}

// This function will format the preferences into a string for the AI prompt
export function formatPreferencesForAI(preferences: CopilotPreferences): string {
  let promptString = `The student's preferred language for interaction is ${preferences.preferredLanguage}.`;

  if (preferences.interests && preferences.interests.length > 0) {
    const interestsList = preferences.interests.join(', ');
    promptString += `\nThey are particularly interested in topics such as: ${interestsList}.`;
    promptString += `\nWhen providing examples or explanations, try to relate them to these interests to make the learning more engaging.`;
  }

  return promptString;
}
