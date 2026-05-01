"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateCopilotPreferences = getOrCreateCopilotPreferences;
exports.formatPreferencesForAI = formatPreferencesForAI;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const redis_1 = require("../lib/redis");
const DEFAULT_LANGUAGE = 'english';
const DEFAULT_INTERESTS = [];
/**
 * Fetches Copilot Preferences with intelligent caching.
 * FIX: Ignores "empty" cache hits to force a DB refresh if interests are missing.
 */
async function getOrCreateCopilotPreferences(userId) {
    const cacheKey = `copilot:preferences:${userId}`;
    let redis;
    try {
        redis = await (0, redis_1.getRedisClient)();
    }
    catch (error) {
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
        let preferences = await prismaClient_1.default.copilotPreferences.findUnique({
            where: { userId },
        });
        // 3. Create Default if missing
        if (!preferences) {
            preferences = await prismaClient_1.default.copilotPreferences.create({
                data: {
                    userId,
                    preferredLanguage: DEFAULT_LANGUAGE,
                    interests: DEFAULT_INTERESTS,
                },
            });
        }
        const result = {
            userId: preferences.userId,
            preferredLanguage: preferences.preferredLanguage,
            interests: preferences.interests || [],
        };
        // 4. Update Redis (Short TTL for freshness during active sessions)
        if (redis) {
            await redis.set(cacheKey, JSON.stringify(result), { EX: 300 }); // 5 minutes cache
        }
        return result;
    }
    catch (error) {
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
function formatPreferencesForAI(preferences) {
    let promptString = `The student's preferred language is ${preferences.preferredLanguage}.`;
    if (preferences.interests && preferences.interests.length > 0) {
        const interestsList = preferences.interests.join(', ');
        promptString += `\nThey love: ${interestsList}.`;
        promptString += `\nINSTRUCTION: You MUST relate examples to these interests.`;
    }
    else {
        promptString += `\nINSTRUCTION: Use general relatable Kenyan examples (Mandazi, Matatu).`;
    }
    return promptString;
}
//# sourceMappingURL=aiPreferenceService.js.map