import { Router, Request } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import prisma from '../utils/prismaClient';
import _ from 'lodash';

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
  } catch (error) {
    console.error('Error fetching profile:', error);
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
      preferences: newPreferences, // Use the constructed preferences object
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
  } catch (error) {
    console.error('Error creating/updating profile:', error);
    res.status(500).send({ message: 'Internal server error.' });
  }
});

export default router;
