"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schoolAuthMiddleware_1 = require("../middleware/schoolAuthMiddleware");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const redis_1 = __importDefault(require("../lib/redis")); // Corrected import
const router = (0, express_1.Router)();
// Get student profile
router.get('/profile', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const profile = await prismaClient_1.default.studentProfile.findUnique({ where: { userId: studentId } });
        if (!profile) {
            return res.status(404).send({ message: 'Profile not found. It will be created on first interaction.' });
        }
        res.status(200).send(profile);
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
});
// Create or Update student profile with safe merging
router.post('/profile', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { preferredLanguage, topInterests, favoriteShows, ...otherData } = req.body;
        const existingProfile = await prismaClient_1.default.studentProfile.findUnique({
            where: { userId: studentId },
        });
        // Prepare preferences JSON
        const newPreferences = {
            ...(existingProfile?.preferences || {}),
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
        const profile = await prismaClient_1.default.studentProfile.upsert({
            where: { userId: studentId },
            update: updatePayload,
            create: createPayload,
        });
        res.status(200).send(profile);
    }
    catch (error) {
        console.error('Error creating/updating profile:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
});
// GET /api/copilot/preferences
router.get('/copilot/preferences', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    const userId = req.user.id;
    const cacheKey = `copilot:preferences:${userId}`;
    try {
        // Check cache first
        if (redis_1.default) {
            const cachedPreferences = await redis_1.default.get(cacheKey);
            if (cachedPreferences) {
                return res.status(200).json(JSON.parse(cachedPreferences));
            }
        }
        // If not in cache, fetch from DB
        const preferences = await prismaClient_1.default.copilotPreferences.findUnique({
            where: { userId },
        });
        if (preferences) {
            // Store in cache for 30 minutes
            if (redis_1.default) {
                await redis_1.default.set(cacheKey, JSON.stringify(preferences), 'EX', 1800);
            }
            return res.status(200).json(preferences);
        }
        else {
            // Return default empty preferences
            return res.status(200).json({
                preferredLanguage: 'english',
                interests: [],
                lastUpdatedAt: null,
            });
        }
    }
    catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});
// POST /api/copilot/preferences
router.post('/copilot/preferences', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { preferredLanguage, interests } = req.body;
    const cacheKey = `copilot:preferences:${userId}`;
    // Validation
    const allowedLanguages = ['english', 'swahili', 'english_sw'];
    if (!preferredLanguage || !allowedLanguages.includes(preferredLanguage)) {
        return res.status(400).json({ message: 'Invalid or missing preferredLanguage.' });
    }
    const allowedInterests = ['Football', 'Farming', 'Cooking', 'Music', 'Coding', 'Drawing', 'Science', 'Nature', 'Animals'];
    if (!Array.isArray(interests) || interests.length > 5 || interests.some((interest) => !allowedInterests.includes(interest))) {
        return res.status(400).json({ message: 'Interests must be an array with up to 5 allowed items.' });
    }
    try {
        // Ensure a StudentProfile exists before upserting CopilotPreferences
        await prismaClient_1.default.studentProfile.upsert({
            where: { userId },
            update: {},
            create: { userId, preferredLanguage: 'english', topInterests: [] }, // Create with defaults if not exists
        });
        const updatedPreferences = await prismaClient_1.default.copilotPreferences.upsert({
            where: { userId },
            update: { preferredLanguage, interests: interests },
            create: { userId, preferredLanguage, interests: interests },
        });
        // Update cache
        if (redis_1.default) {
            await redis_1.default.set(cacheKey, JSON.stringify(updatedPreferences), 'EX', 1800);
        }
        res.status(200).json({
            message: 'Preferences saved successfully',
            ...updatedPreferences,
        });
    }
    catch (error) {
        console.error('Error saving preferences:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});
// DELETE /api/copilot/preferences
router.delete('/copilot/preferences', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    const userId = req.user.id;
    const cacheKey = `copilot:preferences:${userId}`;
    try {
        await prismaClient_1.default.copilotPreferences.delete({
            where: { userId },
        });
        // Remove from cache
        if (redis_1.default) {
            await redis_1.default.del(cacheKey);
        }
        res.status(200).json({ message: 'Preferences cleared successfully' });
    }
    catch (error) {
        // If the record doesn't exist, prisma throws an error. We can ignore it.
        if (error.code === 'P2025') {
            return res.status(200).json({ message: 'Preferences cleared successfully' });
        }
        console.error('Error deleting preferences:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});
exports.default = router;
//# sourceMappingURL=profile.js.map