import prisma from '../utils/prismaClient';
import { getRedisClient } from '../lib/redis';

export interface CopilotPreferences {
  userId: string;
  preferredLanguage: string;
  interests: string[];
}

const DEFAULT_LANGUAGE = 'English';
const DEFAULT_INTERESTS: string[] = [];

/**
 * Fetches Copilot Preferences with intelligent caching.
 * FIX: Ignores "empty" cache hits to force a DB refresh if interests are missing.
 */
export async function getOrCreateCopilotPreferences(userId: string): Promise<CopilotPreferences> {
  const cacheKey = `copilot:preferences:${userId}`;
  let redis;
  try {
    redis = await getRedisClient();
  } catch (error) {
    console.warn('Redis client not available for aiPreferenceService.', error);
  }

  try {
    // 1. Try Redis Cache
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // SMART CACHE: Only return if it actually has data. 
        // If cached interests are empty, maybe DB has newer ones? Let's check DB.
        if (parsed.interests && parsed.interests.length > 0) {
            return parsed;
        }
      }
    }

    // 2. Fetch from Database
    let preferences = await prisma.copilotPreferences.findUnique({
      where: { userId },
    });

    // 3. Create Default if missing
    if (!preferences) {
      preferences = await prisma.copilotPreferences.create({
        data: {
          userId,
          preferredLanguage: DEFAULT_LANGUAGE,
          interests: DEFAULT_INTERESTS,
        },
      });
    }

    const result: CopilotPreferences = {
      userId: preferences.userId,
      preferredLanguage: preferences.preferredLanguage,
      interests: (preferences.interests as string[]) || [], 
    };

    // 4. Update Redis (Short TTL for freshness during active sessions)
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result), { EX: 300 }); // 5 minutes cache
    }

    return result;

  } catch (error) {
    console.error(`Error fetching preferences for userId ${userId}:`, error);
    // Safe Fallback
    return {
      userId,
      preferredLanguage: DEFAULT_LANGUAGE,
      interests: DEFAULT_INTERESTS,
    };
  }
}

/**
 * Formats preferences into a string instruction for the AI System Prompt.
 */
export function formatPreferencesForAI(preferences: CopilotPreferences): string {
  let promptString = `The student's preferred language is ${preferences.preferredLanguage}.`;

  if (preferences.interests && preferences.interests.length > 0) {
    const interestsList = preferences.interests.join(', ');
    promptString += `\nThey love: ${interestsList}.`;
    promptString += `\nINSTRUCTION: You MUST relate examples to these interests.`;
  } else {
    promptString += `\nINSTRUCTION: Use general relatable Kenyan examples (Mandazi, Matatu).`;
  }

  return promptString;
}