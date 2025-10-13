import { Router, Request } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import prisma from '../utils/prismaClient';

const router = Router();

// Get student profile
router.get('/profile', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId
    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
    if (!profile) {
      return res.status(404).send({ message: 'Profile not found.' });
    }
    res.status(200).send(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send({ message: 'Internal server error.' });
  }
});

// Create or update student profile
router.post('/profile', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId
    const { name, email, gradeLevel, preferredLanguage, preferences, favoriteShows } = req.body;

    const profile = await prisma.studentProfile.upsert({
      where: { userId: studentId },
      update: { name, email, gradeLevel, preferredLanguage, preferences, favoriteShows, profileCompleted: true },
      create: { userId: studentId, name, email, gradeLevel, preferredLanguage, preferences, favoriteShows, profileCompleted: true },
    });
    res.status(201).send(profile);
  } catch (error)
 {
    console.error('Error creating/updating profile:', error);
    res.status(500).send({ message: 'Internal server error.' });
  }
});

export default router;
