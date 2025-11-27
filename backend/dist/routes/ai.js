"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schoolAuthMiddleware_1 = require("../middleware/schoolAuthMiddleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const vectorClient_1 = __importDefault(require("../lib/vectorClient"));
const openai_1 = require("openai");
const promptBuilder_1 = require("../lib/promptBuilder");
const workers_1 = require("../workers");
const router = (0, express_1.Router)();
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Ensure pineconeIndex is only initialized if pinecone is available
const pineconeIndex = vectorClient_1.default ? vectorClient_1.default.Index(process.env.PINECONE_INDEX || '') : null;
const DEFAULT_CONVERSATION_STATE = {
    researchModeActive: false,
    lastSearchTopic: [],
    awaitingPracticeQuestionInvitationResponse: false,
    activePracticeQuestion: undefined,
    awaitingPracticeQuestionAnswer: false,
    validationAttemptCount: 0,
    lastAssistantMessage: undefined,
    sensitiveContentDetected: false,
    videoSuggested: false,
    usedExamples: [],
};
const getOrCreateStudentProfile = async (studentId) => {
    let profile = await prismaClient_1.default.studentProfile.findUnique({
        where: { userId: studentId },
    });
    if (profile)
        return profile;
    console.log(`[Profile] No profile for ${studentId}. Creating...`);
    const MAIN_SYSTEM_API_URL = process.env.MAIN_SYSTEM_API_URL;
    const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
    let studentData = null;
    if (!MAIN_SYSTEM_API_URL || !INTERNAL_API_KEY) {
        console.warn('[Profile] MAIN_SYSTEM_API_URL or INTERNAL_API_KEY is not configured. Creating default profile.');
        studentData = { name: 'Test Student', email: `${studentId}@example.com`, grade: 'Not specified' };
    }
    else {
        try {
            const response = await fetch(`${MAIN_SYSTEM_API_URL}/api/internal/students/${studentId}`, { headers: { 'x-internal-api-key': INTERNAL_API_KEY } });
            if (response.ok)
                studentData = await response.json();
        }
        catch (error) {
            console.error(`[Profile] Error fetching from main system for ${studentId}:`, error);
        }
    }
    return await prismaClient_1.default.studentProfile.create({
        data: {
            userId: studentId,
            name: studentData?.name || 'Unknown Student',
            email: studentData?.email || 'unknown@example.com',
            gradeLevel: studentData?.grade || 'Not specified',
            profileCompleted: false,
            preferences: {},
            favoriteShows: [],
            topInterests: [], // Add this line
        },
    });
};
// 1. Preload Logic (GET /preload)
router.get('/preload', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const profile = await getOrCreateStudentProfile(studentUserId);
        const lastSession = await prismaClient_1.default.chatSession.findFirst({
            where: { studentId: profile.userId, messages: { some: {} } },
            orderBy: { updatedAt: 'desc' },
            include: { messages: { orderBy: { timestamp: 'asc' } } },
        });
        const history = await prismaClient_1.default.chatSession.findMany({
            where: {
                studentId: profile.userId,
                id: { not: lastSession?.id },
                messages: { some: {} }
            },
            take: 10,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, topic: true, updatedAt: true, createdAt: true },
        });
        res.status(200).send({
            ready: true,
            studentId: studentUserId,
            lastSession: lastSession ? {
                ...lastSession,
                messages: lastSession.messages.map(msg => ({ ...msg, timestamp: msg.timestamp.toISOString() })),
                createdAt: lastSession.createdAt.toISOString(),
                updatedAt: lastSession.updatedAt.toISOString(),
                conversationState: (lastSession.metadata || DEFAULT_CONVERSATION_STATE)
            } : null,
            history: history.map(session => ({
                id: session.id,
                title: session.topic || 'New Chat',
                createdAt: session.createdAt.toISOString(),
                updatedAt: session.updatedAt.toISOString(),
            }))
        });
    }
    catch (error) {
        console.error('[Backend] Error in preload:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// 2. Starting a New Chat (POST /new-session)
router.post('/new-session', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const profile = await getOrCreateStudentProfile(studentUserId);
        // Find the currently active session for this user
        const currentlyActiveSession = await prismaClient_1.default.chatSession.findFirst({
            where: { studentId: profile.userId, isActive: true },
            include: { messages: true }, // Include messages to check if it's empty
        });
        // Deactivate all previous active sessions
        await prismaClient_1.default.chatSession.updateMany({
            where: { studentId: profile.userId, isActive: true },
            data: { isActive: false },
        });
        // If the previously active session had messages, enqueue it for embedding
        if (currentlyActiveSession && currentlyActiveSession.messages.length > 0) {
            console.log(`[new-session] Enqueueing previous session ${currentlyActiveSession.id} for embedding.`);
            // Add to summarization queue (if needed, based on your worker setup)
            if (workers_1.summarizationQueue) {
                workers_1.summarizationQueue.add('summarization-jobs', { sessionId: currentlyActiveSession.id, studentId: studentUserId });
            }
            // Add to embedding queue
            if (workers_1.embeddingQueue) {
                workers_1.embeddingQueue.add('embedding-jobs', {
                    sessionId: currentlyActiveSession.id, studentId: studentUserId,
                    message: '',
                    aiResponse: ''
                });
            }
        }
        const newSession = await prismaClient_1.default.chatSession.create({
            data: {
                studentId: profile.userId,
                topic: 'New Chat',
                isActive: true,
                metadata: DEFAULT_CONVERSATION_STATE,
            },
        });
        res.status(200).send({
            sessionId: newSession.id,
            topic: newSession.topic,
            createdAt: newSession.createdAt.toISOString(),
            updatedAt: newSession.updatedAt.toISOString(),
            conversationState: DEFAULT_CONVERSATION_STATE
        });
    }
    catch (error) {
        console.error('[Backend] Error in new-session:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// 3. Sending a Message (POST /chat)
router.post('/chat', schoolAuthMiddleware_1.schoolAuthMiddleware, rateLimiter_1.rateLimiter, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { message, sessionId, conversationState: frontendConversationState } = req.body;
        if (!sessionId)
            return res.status(400).send({ message: 'Session ID is required.' });
        const session = await prismaClient_1.default.chatSession.findUnique({
            where: { id: sessionId },
            include: { student: true }
        });
        if (!session || session.student.userId !== studentId) {
            return res.status(404).send({ message: 'Session not found.' });
        }
        const currentMessages = await prismaClient_1.default.chatMessage.findMany({ where: { sessionId }, orderBy: { timestamp: 'asc' } });
        const studentMessage = await prismaClient_1.default.chatMessage.create({
            data: { sessionId, role: 'user', content: message, timestamp: new Date(), messageNumber: currentMessages.length + 1 },
        });
        const allSessionMessages = [...currentMessages, studentMessage];
        // FIX: Explicitly typed the messages array and correctly map the roles to satisfy the OpenAI library.
        const messagesForAI = [
            { role: 'system', content: promptBuilder_1.promptBuilder.buildSystemContext(session.student, session, frontendConversationState) },
            ...allSessionMessages.map((msg) => {
                if (msg.role === 'user') {
                    return { role: 'user', content: msg.content };
                }
                // Map all other roles from our DB (e.g., 'model', 'ai') to the 'assistant' role for the API
                return { role: 'assistant', content: msg.content };
            }),
        ];
        const aiCompletion = await openai.chat.completions.create({ model: 'gpt-4o', messages: messagesForAI, temperature: 0.7, max_tokens: 1000 });
        const aiResponse = aiCompletion.choices?.[0]?.message?.content || 'I am sorry, I could not generate a response.';
        const aiMessage = await prismaClient_1.default.chatMessage.create({
            data: { sessionId, role: 'model', content: aiResponse, timestamp: new Date(), messageNumber: allSessionMessages.length + 1 },
        });
        let updatedTopic = session.topic;
        if (session.topic === 'New Chat' && allSessionMessages.length === 1) {
            try {
                console.log(`[Backend] Generating topic for session ${sessionId}...`);
                const topicGenerationPrompt = `Based on the user's first question: "${message}", create a short, descriptive title (4 words max) for this chat. Do not use quotes or the word "chat".`;
                const topicCompletion = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: topicGenerationPrompt }], temperature: 0.4, max_tokens: 20,
                });
                const suggestedTopic = topicCompletion.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '');
                if (suggestedTopic && !['new chat', 'untitled', 'no title'].some(t => suggestedTopic.toLowerCase().includes(t))) {
                    updatedTopic = suggestedTopic;
                    console.log(`[Backend] New topic generated: "${updatedTopic}"`);
                }
            }
            catch (topicError) {
                console.error('[Backend] Error generating topic:', topicError);
            }
        }
        await prismaClient_1.default.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date(), metadata: frontendConversationState, topic: updatedTopic },
        });
        res.status(200).send({
            response: aiResponse,
            messageId: aiMessage.id,
            sessionId: session.id,
            topic: updatedTopic,
            conversationState: frontendConversationState
        });
        // Only add to embedding queue if pinecone is initialized
        if (pineconeIndex) {
            if (workers_1.embeddingQueue)
                workers_1.embeddingQueue.add('embedding-jobs', { sessionId, studentId, message, aiResponse });
        }
    }
    catch (error) {
        console.error('[Backend] Error in AI chat:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// 4. History (GET /history)
router.get('/history', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const profile = await getOrCreateStudentProfile(studentUserId);
        const { page = '1', limit = '10', search } = req.query;
        const pageNum = parseInt(page, 10), limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = { studentId: profile.userId, messages: { some: {} } };
        if (search) {
            whereClause.OR = [
                { topic: { contains: search, mode: 'insensitive' } },
                { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
            ];
        }
        const [history, total] = await prismaClient_1.default.$transaction([
            prismaClient_1.default.chatSession.findMany({ where: whereClause, skip, take: limitNum, orderBy: { updatedAt: 'desc' }, select: { id: true, topic: true, updatedAt: true, createdAt: true } }),
            prismaClient_1.default.chatSession.count({ where: whereClause })
        ]);
        res.status(200).send({
            sessions: history.map(session => ({
                id: session.id,
                title: session.topic || 'New Chat',
                updatedAt: session.updatedAt.toISOString(),
                createdAt: session.createdAt.toISOString(),
            })),
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
    }
    catch (error) {
        console.error('[Backend] Error fetching history:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// 5. Resume Chat (GET /session/:id)
router.get('/session/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const profile = await getOrCreateStudentProfile(studentUserId);
        const sessionId = req.params.id;
        await prismaClient_1.default.chatSession.updateMany({
            where: { studentId: profile.userId, isActive: true, id: { not: sessionId } },
            data: { isActive: false },
        });
        const session = await prismaClient_1.default.chatSession.update({
            where: { id: sessionId, studentId: profile.userId },
            data: { isActive: true },
            include: { messages: { orderBy: { timestamp: 'asc' } } },
        });
        if (!session)
            return res.status(404).send({ message: 'Session not found.' });
        res.status(200).send({
            ...session,
            messages: session.messages.map(msg => ({ ...msg, timestamp: msg.timestamp.toISOString() })),
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString(),
            conversationState: (session.metadata || DEFAULT_CONVERSATION_STATE)
        });
    }
    catch (error) {
        console.error('[Backend] Error resuming chat session:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// 6. Search Past Chats (GET /search)
router.get('/search', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { q: queryParam, mode: modeParam } = req.query;
        const query = queryParam;
        const mode = modeParam || 'hybrid';
        if (!query || typeof query !== 'string') {
            return res.status(400).send({ message: 'Search query (q) is required.' });
        }
        let results = [];
        if (mode === 'keyword' || mode === 'hybrid') {
            const keywordSessions = await prismaClient_1.default.chatSession.findMany({
                where: {
                    studentId,
                    messages: { some: {} },
                    OR: [
                        { topic: { contains: query, mode: 'insensitive' } },
                        { messages: { some: { content: { contains: query, mode: 'insensitive' } } } },
                    ],
                },
                select: { id: true, topic: true, metadata: true, updatedAt: true },
                take: 10,
            });
            results.push(...keywordSessions.map((session) => ({
                id: session.id,
                topic: session.topic,
                summary: session.metadata?.summary || session.topic,
                updatedAt: session.updatedAt,
                source: 'keyword',
                relevance: 0.5,
            })));
        }
        if (mode === 'semantic' || mode === 'hybrid') {
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: query,
            });
            const queryEmbedding = embeddingResponse.data?.[0]?.embedding;
            if (queryEmbedding && pineconeIndex) {
                const pineconeResults = await pineconeIndex.query({
                    vector: queryEmbedding,
                    topK: 10,
                    filter: { studentId: { $eq: studentId }, type: { $eq: 'session_summary' } },
                });
                const semanticSessionIds = pineconeResults.matches?.map((m) => m.id) || [];
                if (semanticSessionIds.length > 0) {
                    const semanticSessions = await prismaClient_1.default.chatSession.findMany({
                        where: { id: { in: semanticSessionIds } },
                        select: { id: true, topic: true, metadata: true, updatedAt: true },
                    });
                    semanticSessions.forEach((session) => {
                        const match = pineconeResults.matches?.find((m) => m.id === session.id);
                        results.push({
                            id: session.id,
                            topic: session.topic,
                            summary: session.metadata?.summary || session.topic,
                            updatedAt: session.updatedAt,
                            source: 'semantic',
                            relevance: match?.score || 0,
                        });
                    });
                }
            }
        }
        const uniqueResults = Array.from(new Map(results.map((item) => [item.id, item])).values());
        uniqueResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
        res.status(200).send(uniqueResults.slice(0, 10));
    }
    catch (error) {
        console.error('Error searching past chats:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// 7. Student and Global Memory Routes
router.get('/memory/student', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const progress = await prismaClient_1.default.progress.findMany({ where: { studentId } });
        const mistakes = await prismaClient_1.default.mistake.findMany({ where: { studentId } });
        res.status(200).send({ progress, mistakes });
    }
    catch (error) {
        console.error('Error fetching student memory:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/memory/global', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const globalMemory = await prismaClient_1.default.globalMemory.findMany();
        res.status(200).send({ globalMemory });
    }
    catch (error) {
        console.error('Error fetching global memory:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/memory/update', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { type, data } = req.body;
        if (type === 'progress') {
            const { subject, topic, mastery } = data;
            // FIX: Reverted to use the 'id' for the where clause, which is more likely to match the schema
            // This avoids the error about the non-existent compound key.
            await prismaClient_1.default.progress.upsert({
                where: { id: data.id || '' },
                update: { subject, topic, mastery },
                create: { studentId, subject, topic, mastery },
            });
        }
        else if (type === 'mistake') {
            const { topic, error, attempts } = data;
            await prismaClient_1.default.mistake.create({
                data: { studentId, topic, error, attempts: attempts || 1 },
            });
        }
        else {
            return res.status(400).send({ message: 'Invalid memory type' });
        }
        res.status(200).send({ message: 'Memory updated successfully' });
    }
    catch (error) {
        console.error('Error updating memory:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// 8. Learning Preferences Routes
router.get('/preferences', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const preferences = await prismaClient_1.default.copilotPreferences.findUnique({
            where: { userId: studentId },
        });
        if (preferences) {
            res.status(200).json({
                preferredLanguage: preferences.preferredLanguage,
                interests: preferences.interests || [], // Ensure it's an array
                lastUpdatedAt: preferences.lastUpdatedAt.toISOString(),
            });
        }
        else {
            // Return default empty preferences
            res.status(200).json({
                preferredLanguage: 'english',
                interests: [],
                lastUpdatedAt: null,
            });
        }
    }
    catch (error) {
        console.error('[Backend] Error fetching preferences:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/preferences/update', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { preferredLanguage, interests } = req.body; // Changed from topInterests to interests
        // Validation (assuming it's done on frontend as well, but good to have a backend check)
        const allowedLanguages = ['english', 'swahili', 'english_sw'];
        if (!preferredLanguage || !allowedLanguages.includes(preferredLanguage)) {
            return res.status(400).json({ message: 'Invalid or missing preferredLanguage.' });
        }
        const allowedInterests = ['Football', 'Farming', 'Cooking', 'Music', 'Coding', 'Drawing', 'Science', 'Nature', 'Animals'];
        if (!Array.isArray(interests) || interests.length > 5 || interests.some((interest) => !allowedInterests.includes(interest))) {
            return res.status(400).json({ message: 'Interests must be an array with up to 5 allowed items.' });
        }
        // Ensure StudentProfile exists (as per previous fix)
        await prismaClient_1.default.studentProfile.upsert({
            where: { userId: studentId },
            update: {},
            create: { userId: studentId, preferredLanguage: 'english', topInterests: [] },
        });
        const updatedPreferences = await prismaClient_1.default.copilotPreferences.upsert({
            where: { userId: studentId },
            update: { preferredLanguage, interests: interests },
            create: { userId: studentId, preferredLanguage, interests: interests },
        });
        res.status(200).json({
            message: 'Preferences updated successfully',
            preferredLanguage: updatedPreferences.preferredLanguage,
            interests: updatedPreferences.interests,
            lastUpdatedAt: updatedPreferences.lastUpdatedAt.toISOString(),
        });
    }
    catch (error) {
        console.error('[Backend] Error updating preferences:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map