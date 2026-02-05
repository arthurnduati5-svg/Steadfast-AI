
import { Router, Request } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import prisma from '../utils/prismaClient';
import _ from 'lodash';
import { getRedisClient } from '../lib/redis'; // Corrected import
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();

// Get student profile
router.get('/profile', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id;
    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
    if (!profile) {
      return res.status(404).send({ message: 'Profile not found. It will be created on first interaction.' });
    }
    res.status(200).send(profile);
  } catch (error: any) {
    logger.error({ error: error.message, userId: req.user?.id }, 'Error fetching profile');
    res.status(500).send({ message: 'Internal server error.' });
  }
});

// Create or Update student profile with safe merging
router.post('/profile', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id;
    const { preferredLanguage, topInterests, favoriteShows, ...otherData } = req.body;

    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    // Prepare preferences JSON
    const newPreferences = {
      ...(existingProfile?.preferences as object || {}),
      ...otherData.preferences, // Merge any other preferences if sent directly
      topInterests: topInterests || [], // Ensure topInterests is an array within preferences
    };

    // For updates, we merge new data onto existing data.
    const updatePayload = {
      ...otherData,
      preferredLanguage: preferredLanguage || existingProfile?.preferredLanguage,
      favoriteShows: favoriteShows || existingProfile?.favoriteShows || [],
      preferences: newPreferences,
      profileCompleted: true,
    };

    // For creates, use the request data, ensuring defaults for JSON fields.
    const createPayload = {
      userId: studentId,
      ...otherData,
      preferredLanguage: preferredLanguage || null,
      favoriteShows: favoriteShows || [],
      preferences: newPreferences,
      profileCompleted: true,
    };

    const profile = await prisma.studentProfile.upsert({
      where: { userId: studentId },
      update: updatePayload,
      create: createPayload,
    });

    res.status(200).send(profile);
  } catch (error: any) {
    console.error('Error creating/updating profile:', error);
    res.status(500).send({ message: 'Internal server error.' });
  }
});

// GET /api/copilot/preferences
router.get('/copilot/preferences', schoolAuthMiddleware, async (req: Request, res) => {
  const userId = req.user!.id;
  const cacheKey = `copilot:preferences:${userId}`;

  logger.debug({ userId }, '[Backend] Fetching preferences');

  let redis;
  try {
    redis = await getRedisClient();
  } catch (error) {
    logger.warn({ error: String(error) }, 'Redis client not available for preferences retrieval');
  }

  try {
    // Check cache first
    if (redis) {
      const cachedPreferences = await redis.get(cacheKey);
      if (cachedPreferences) {
        logger.debug({ userId }, '[Backend] Preferences found in cache');
        return res.status(200).json(JSON.parse(cachedPreferences));
      }
    }

    // If not in cache, fetch from DB
    const preferences = await prisma.copilotPreferences.findUnique({
      where: { userId },
    });

    if (preferences) {
      logger.debug({ userId }, '[Backend] Preferences found in DB');
      // Store in cache for 30 minutes
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(preferences));
        await redis.expire(cacheKey, 1800); // Set expiration separately
      }
      return res.status(200).json(preferences);
    } else {
      logger.info({ userId }, '[Backend] No preferences found, returning defaults');
      // Return default empty preferences
      return res.status(200).json({
        preferredLanguage: 'english',
        interests: [],
        lastUpdatedAt: null,
      });
    }
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/copilot/preferences
router.post('/copilot/preferences', schoolAuthMiddleware, async (req: Request, res) => {
  const userId = req.user!.id;
  const { preferredLanguage, interests, topInterests } = req.body; // Destructure both interests and topInterests
  const cacheKey = `copilot:preferences:${userId}`;

  // Use topInterests if interests is not provided or is empty
  const interestsToSave = (interests && interests.length > 0) ? interests : topInterests || [];

  console.log(`[Backend] Attempting to save preferences for userId: ${userId}`);
  console.log(`[Backend] Received preferredLanguage: ${preferredLanguage}, interests:`, interestsToSave);

  // Validation
  const allowedLanguages = ['english', 'swahili', 'english_sw', 'arabic']; // Added 'arabic'
  if (!preferredLanguage || !allowedLanguages.includes(preferredLanguage)) {
    console.error(`[Backend] Invalid or missing preferredLanguage: ${preferredLanguage}`);
    return res.status(400).json({ message: 'Invalid or missing preferredLanguage.' });
  }

  // Updated allowedInterests to match frontend's predefinedInterests
  const allowedInterests = [
    'Football', 'Farming', 'Cooking', 'Music', 'Coding', 'Drawing', 'Science', 'Nature', 'Animals',
    'Writing', 'Camping', 'Beauty', 'Painting', 'Basketball', 'Photography', 'Swimming', 'Technology'
  ];

  if (!Array.isArray(interestsToSave) || interestsToSave.length > 5 || interestsToSave.some((interest: string) => !allowedInterests.includes(interest))) {
    console.error(`[Backend] Invalid interests received:`, interestsToSave);
    return res.status(400).json({ message: 'Interests must be an array with up to 5 allowed items.' });
  }

  try {
    // Ensure a StudentProfile exists before upserting CopilotPreferences
    await prisma.studentProfile.upsert({
      where: { userId },
      update: {},
      create: { userId, preferredLanguage: 'english', topInterests: [] }, // Create with defaults if not exists
    });

    const updatedPreferences = await prisma.copilotPreferences.upsert({
      where: { userId },
      update: { preferredLanguage, interests: interestsToSave as Prisma.JsonArray },
      create: { userId, preferredLanguage, interests: interestsToSave as Prisma.JsonArray },
    });

    console.log(`[Backend] Preferences successfully saved for userId: ${userId}`, updatedPreferences);

    // Update cache
    let redis;
    try {
      redis = await getRedisClient();
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(updatedPreferences));
        await redis.expire(cacheKey, 1800); // Set expiration separately
        console.log(`[Backend] Preferences cached for userId: ${userId}`);
      }
    } catch (error) {
      console.warn('Redis client not available for preferences update.', error);
    }

    res.status(200).json({
      message: 'Preferences saved successfully',
      ...updatedPreferences,
    });
  } catch (error: any) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/copilot/preferences
router.delete('/copilot/preferences', schoolAuthMiddleware, async (req: Request, res) => {
  const userId = req.user!.id;
  const cacheKey = `copilot:preferences:${userId}`;

  try {
    await prisma.copilotPreferences.delete({
      where: { userId },
    });

    // Remove from cache
    let redis;
    try {
      redis = await getRedisClient();
      if (redis) {
        await redis.del(cacheKey);
      }
    } catch (error) {
      console.warn('Redis client not available for cache deletion.', error);
    }

    res.status(200).json({ message: 'Preferences cleared successfully' });
  } catch (error: any) {
    // If the record doesn't exist, prisma throws an error. We can ignore it.
    if (error.code === 'P2025') {
      return res.status(200).json({ message: 'Preferences cleared successfully' });
    }
    console.error('Error deleting preferences:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


export default router;
