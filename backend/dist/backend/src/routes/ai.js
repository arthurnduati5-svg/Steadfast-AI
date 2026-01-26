import { Router } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';
import prisma from '../utils/prismaClient';
import { getRedisClient } from '../lib/redis';
import pinecone from '../lib/vectorClient';
import { OpenAI } from 'openai';
import { embeddingQueue, personalizationQueue } from '../workers';
// ✅ IMPORT THE BRAIN & PREFERENCE SERVICE
import { emotionalAICopilot } from '@/ai/flows/emotional-ai-copilot';
import { getOrCreateCopilotPreferences } from '../services/aiPreferenceService';
const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone ? pinecone.Index(process.env.PINECONE_INDEX || '') : null;
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
// --- HELPER: BACKGROUND TOPIC GENERATOR ---
const generateTopicInBackground = async (sessionId, firstMessage) => {
    try {
        const topicCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Summarize this in 3-5 words for a title (no quotes): "${firstMessage}"` }],
            temperature: 0.3,
            max_tokens: 15,
        });
        const suggestedTopic = topicCompletion.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '');
        if (suggestedTopic) {
            await prisma.chatSession.update({
                where: { id: sessionId },
                data: { topic: suggestedTopic }
            });
        }
    }
    catch (error) {
        console.error(`[Background] Topic generation failed for ${sessionId}`, error);
    }
};
// ✅ ROBUST PROFILE GETTER (UPSERT)
const getOrCreateStudentProfile = async (studentId) => {
    try {
        const redis = await getRedisClient();
        const cacheKey = `profile:${studentId}`;
        if (redis) {
            try {
                const cachedProfile = await redis.get(cacheKey);
                if (cachedProfile)
                    return JSON.parse(cachedProfile);
            }
            catch (err) {
                console.warn('[Profile] Redis read failed', err);
            }
        }
        const profile = await prisma.studentProfile.upsert({
            where: { userId: studentId },
            update: {},
            create: {
                userId: studentId,
                name: 'Student',
                email: `${studentId}@school.com`,
                gradeLevel: 'Primary',
                profileCompleted: false,
                preferences: {},
                favoriteShows: [],
                topInterests: [],
            },
        });
        if (redis)
            await redis.set(cacheKey, JSON.stringify(profile), { EX: 86400 });
        return profile;
    }
    catch (dbError) {
        console.error(`[Profile] CRITICAL DB ERROR for ${studentId}:`, dbError);
        throw dbError;
    }
};
// ============================================================================
// 1. PRELOAD LOGIC (GET /preload)
// ============================================================================
router.get('/preload', schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        await getOrCreateStudentProfile(studentUserId);
        const [lastSession, history] = await Promise.all([
            prisma.chatSession.findFirst({
                where: { studentId: studentUserId, messages: { some: {} } },
                orderBy: { updatedAt: 'desc' },
                include: { messages: { orderBy: { timestamp: 'asc' } } },
            }),
            prisma.chatSession.findMany({
                where: { studentId: studentUserId, messages: { some: {} } },
                take: 10,
                orderBy: { updatedAt: 'desc' },
                include: { messages: { orderBy: { timestamp: 'asc' }, take: 1 } },
            })
        ]);
        const filteredHistory = history.filter(h => h.id !== lastSession?.id);
        res.status(200).send({
            ready: true,
            studentId: studentUserId,
            lastSession: lastSession ? {
                ...lastSession,
                messages: lastSession.messages.map((msg) => ({
                    ...msg,
                    timestamp: msg.timestamp.toISOString(),
                    videoData: msg.metadata?.videoData
                })),
                createdAt: lastSession.createdAt.toISOString(),
                updatedAt: lastSession.updatedAt.toISOString(),
                conversationState: (lastSession.metadata || DEFAULT_CONVERSATION_STATE)
            } : null,
            history: filteredHistory.map((session) => ({
                id: session.id,
                title: session.topic || 'New Chat',
                createdAt: session.createdAt.toISOString(),
                updatedAt: session.updatedAt.toISOString(),
                firstMessage: session.messages[0]?.content || null,
            }))
        });
    }
    catch (error) {
        console.error('[Backend] CRITICAL 500 in /preload:', error);
        res.status(500).send({ message: 'Internal server error', details: String(error) });
    }
});
// ============================================================================
// 2. NEW SESSION (POST /new-session)
// ============================================================================
router.post('/new-session', schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        await getOrCreateStudentProfile(studentUserId);
        try {
            await prisma.chatSession.updateMany({
                where: { studentId: studentUserId, isActive: true },
                data: { isActive: false },
            });
        }
        catch (e) {
            console.warn('[New Session] Archive warning:', e);
        }
        const newSession = await prisma.chatSession.create({
            data: {
                studentId: studentUserId,
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
        console.error('[Backend] Error in /new-session:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// ============================================================================
// 3. CHAT ROUTE (POST /chat) - VIDEO & TITLE PERSISTENCE
// ============================================================================
router.post('/chat', schoolAuthMiddleware, rateLimiter, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { message, sessionId, conversationState } = req.body;
        if (!sessionId)
            return res.status(400).send({ message: 'Session ID is required.' });
        await getOrCreateStudentProfile(studentId);
        const [session, preferences] = await Promise.all([
            prisma.chatSession.findUnique({
                where: { id: sessionId },
                include: {
                    student: { select: { name: true, gradeLevel: true, userId: true } },
                    messages: { orderBy: { timestamp: 'asc' }, take: 30 }
                }
            }),
            getOrCreateCopilotPreferences(studentId)
        ]);
        if (!session || session.student.userId !== studentId) {
            return res.status(404).send({ message: 'Session not found.' });
        }
        await prisma.chatMessage.create({
            data: { sessionId, role: 'user', content: message, timestamp: new Date(), messageNumber: session.messages.length + 1 },
        });
        const aiResult = await emotionalAICopilot({
            text: message,
            chatHistory: session.messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp
            })),
            state: conversationState || DEFAULT_CONVERSATION_STATE,
            studentProfile: {
                name: session.student.name || 'Student',
                gradeLevel: session.student.gradeLevel || 'Primary'
            },
            preferences: {
                preferredLanguage: preferences.preferredLanguage,
                interests: preferences.interests
            },
            memory: { progress: [], mistakes: [] },
            currentTitle: session.topic || undefined
        });
        // Write AI Response with Metadata
        const savedAiMsg = await prisma.chatMessage.create({
            data: {
                sessionId,
                role: 'model',
                content: aiResult.processedText,
                timestamp: new Date(),
                messageNumber: session.messages.length + 2,
                metadata: aiResult.videoData ? { videoData: aiResult.videoData } : undefined
            },
        });
        // 4. Update Session Metadata & Title (CRITICAL FIX)
        const updateData = {
            metadata: aiResult.state,
            updatedAt: new Date(),
        };
        // Only update title if the AI suggested a new one AND it wasn't already set
        if (aiResult.suggestedTitle && session.topic === 'New Chat') {
            updateData.topic = aiResult.suggestedTitle;
        }
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: updateData
        });
        res.status(200).send({
            response: aiResult.processedText,
            messageId: savedAiMsg.id,
            sessionId: session.id,
            topic: aiResult.suggestedTitle || session.topic,
            conversationState: aiResult.state,
            videoData: aiResult.videoData
        });
        // Background Tasks
        if (session.messages.length === 0 && session.topic === 'New Chat') {
            generateTopicInBackground(sessionId, message);
        }
        if (pineconeIndex && embeddingQueue) {
            embeddingQueue.add('embedding-jobs', { sessionId, studentId, message, aiResponse: aiResult.processedText });
        }
        if (personalizationQueue) {
            personalizationQueue.add('personalization-jobs', { studentId, userMessage: message, aiResponse: aiResult.processedText });
        }
    }
    catch (error) {
        console.error('[Backend] Error in /chat:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// --- HELPER ROUTES ---
router.post('/message', schoolAuthMiddleware, rateLimiter, async (req, res) => {
    try {
        const { message, sessionId, conversationState } = req.body;
        if (!sessionId)
            return res.status(400).send({ message: 'Session ID required.' });
        const count = await prisma.chatMessage.count({ where: { sessionId } });
        await Promise.all([
            prisma.chatMessage.create({
                data: { sessionId, role: message.role, content: message.content, timestamp: new Date(message.timestamp), messageNumber: count + 1 },
            }),
            prisma.chatSession.update({
                where: { id: sessionId },
                data: { metadata: conversationState, updatedAt: new Date() },
            })
        ]);
        res.status(200).send({ message: 'Message saved' });
    }
    catch (error) {
        console.error('[Backend] Error saving message:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// ✅ SESSION PATCH (HARD DEBUG VERSION WITH DETAILED LOGS)
router.patch('/session/:id', schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const { title } = req.body;
        const sessionId = req.params.id;
        console.log(`[BACKEND PATCH] 🚀 Starting Title Update. Session: ${sessionId} | User: ${studentUserId}`);
        console.log(`[BACKEND PATCH] New Title Received: "${title}"`);
        // 1. Verify Session Exists & Belongs to User
        const existingSession = await prisma.chatSession.findFirst({
            where: { id: sessionId, studentId: studentUserId }
        });
        if (!existingSession) {
            console.error(`[BACKEND PATCH] ❌ ERROR: Session NOT FOUND or NOT OWNED by user ${studentUserId}`);
            return res.status(404).send({ message: 'Session not found.' });
        }
        console.log(`[BACKEND PATCH] ✅ Session found. Current Title: "${existingSession.topic}". Attempting DB Write...`);
        // 2. Perform Update (Hard Error if fails)
        const updated = await prisma.chatSession.update({
            where: { id: sessionId },
            data: { topic: title, updatedAt: new Date() },
        });
        console.log(`[BACKEND PATCH] ✅ Success! DB Updated. New Title Stored: "${updated.topic}"`);
        res.status(200).json({ message: 'Session updated', session: updated });
    }
    catch (error) {
        console.error('[BACKEND PATCH] 💥 CRITICAL DB ERROR:', error);
        res.status(500).send({ message: 'Internal server error', error: String(error) });
    }
});
router.get('/history', schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const { page = '1', limit = '10', search } = req.query;
        const pageNum = parseInt(page), limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = { studentId: studentUserId, messages: { some: {} } };
        if (search) {
            whereClause.OR = [
                { topic: { contains: search, mode: 'insensitive' } },
                { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
            ];
        }
        const [total, history] = await Promise.all([
            prisma.chatSession.count({ where: whereClause }),
            prisma.chatSession.findMany({
                where: whereClause, skip, take: limitNum, orderBy: { updatedAt: 'desc' },
                include: { messages: { orderBy: { timestamp: 'asc' }, take: 1 } }
            })
        ]);
        // SELF-HEALING HISTORY: Rename old "New Chat" sessions using first message
        const sessionsWithTitles = await Promise.all(history.map(async (s) => {
            let title = s.topic || 'New Chat';
            if (title === 'New Chat' && s.messages.length > 0) {
                const firstMsg = s.messages[0].content;
                const smartTitle = firstMsg.split(' ').slice(0, 5).join(' ') + (firstMsg.length > 30 ? '...' : '');
                await prisma.chatSession.update({ where: { id: s.id }, data: { topic: smartTitle } });
                title = smartTitle;
            }
            return {
                id: s.id,
                title: title,
                updatedAt: s.updatedAt.toISOString(),
                createdAt: s.createdAt.toISOString(),
                firstMessage: s.messages[0]?.content || null
            };
        }));
        res.status(200).send({
            sessions: sessionsWithTitles,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/session/:id', schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        prisma.chatSession.updateMany({
            where: { studentId: studentUserId, isActive: true, id: { not: req.params.id } },
            data: { isActive: false },
        }).catch(e => { });
        const session = await prisma.chatSession.update({
            where: { id: req.params.id, studentId: studentUserId },
            data: { isActive: true },
            include: { messages: { orderBy: { timestamp: 'asc' } } },
        });
        if (!session)
            return res.status(404).send({ message: 'Session not found.' });
        res.status(200).send({
            ...session,
            messages: session.messages.map((msg) => ({
                ...msg,
                timestamp: msg.timestamp.toISOString(),
                // ✅ RETURN SAVED VIDEO DATA
                videoData: msg.metadata?.videoData
            })),
            conversationState: (session.metadata || DEFAULT_CONVERSATION_STATE)
        });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/session/:id/delete', schoolAuthMiddleware, async (req, res) => {
    try {
        const { count } = await prisma.chatSession.deleteMany({
            where: { id: req.params.id, studentId: req.user.id }
        });
        if (count === 0)
            return res.status(404).send({ message: 'Session not found' });
        res.status(200).send({ message: 'Session deleted' });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/search', schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { q: query, mode = 'hybrid' } = req.query;
        if (!query)
            return res.status(400).send({ message: 'Query required' });
        let results = [];
        const promises = [];
        if (mode === 'keyword' || mode === 'hybrid') {
            promises.push(prisma.chatSession.findMany({
                where: {
                    studentId,
                    messages: { some: {} },
                    OR: [
                        { topic: { contains: query, mode: 'insensitive' } },
                        { messages: { some: { content: { contains: query, mode: 'insensitive' } } } }
                    ]
                },
                select: { id: true, topic: true, updatedAt: true },
                take: 10
            }).then(sess => sess.map(s => ({ ...s, source: 'keyword', relevance: 0.5 }))));
        }
        if ((mode === 'semantic' || mode === 'hybrid') && pineconeIndex) {
            promises.push(openai.embeddings.create({ model: 'text-embedding-ada-002', input: query })
                .then(async (emb) => {
                const vec = emb.data[0].embedding;
                const matches = await pineconeIndex.query({
                    vector: vec, topK: 10, filter: { studentId: { $eq: studentId } }
                });
                const ids = matches.matches?.map(m => m.id) || [];
                if (ids.length === 0)
                    return [];
                const sessions = await prisma.chatSession.findMany({ where: { id: { in: ids } }, select: { id: true, topic: true, updatedAt: true } });
                return sessions.map(s => ({ ...s, source: 'semantic', relevance: 0.8 }));
            }));
        }
        const searchResults = await Promise.all(promises);
        const unique = Array.from(new Map(searchResults.flat().map(item => [item.id, item])).values());
        res.status(200).send(unique.slice(0, 10));
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/preferences', schoolAuthMiddleware, async (req, res) => {
    try {
        const prefs = await getOrCreateCopilotPreferences(req.user.id);
        res.status(200).json(prefs);
    }
    catch (error) {
        res.status(500).send({ message: 'Error fetching preferences' });
    }
});
router.post('/preferences/update', schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { preferredLanguage, interests } = req.body;
        await prisma.copilotPreferences.upsert({
            where: { userId: studentId },
            update: { preferredLanguage, interests: interests },
            create: { userId: studentId, preferredLanguage, interests: interests },
        });
        const redis = await getRedisClient();
        if (redis)
            await redis.del(`copilot:preferences:${studentId}`);
        res.status(200).json({ message: 'Preferences updated' });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/memory/student', schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const redis = await getRedisClient();
        if (redis) {
            const cached = await redis.get(`memory:${studentId}`);
            if (cached)
                return res.status(200).send(JSON.parse(cached));
        }
        const [progress, mistakes] = await Promise.all([
            prisma.progress.findMany({ where: { studentId } }),
            prisma.mistake.findMany({ where: { studentId } })
        ]);
        if (redis)
            await redis.set(`memory:${studentId}`, JSON.stringify({ progress, mistakes }), { EX: 3600 });
        res.status(200).send({ progress, mistakes });
    }
    catch (e) {
        res.status(500).send({ message: 'Error' });
    }
});
router.post('/memory/update', schoolAuthMiddleware, async (req, res) => {
    try {
        const { type, data } = req.body;
        const studentId = req.user.id;
        if (type === 'progress') {
            await prisma.progress.upsert({ where: { id: data.id || 'new' }, create: { ...data, studentId }, update: data });
        }
        else if (type === 'mistake') {
            await prisma.mistake.create({ data: { ...data, studentId } });
        }
        const redis = await getRedisClient();
        if (redis)
            await redis.del(`memory:${studentId}`);
        res.status(200).send({ message: 'Updated' });
    }
    catch (e) {
        res.status(500).send({ message: 'Error' });
    }
});
export default router;
//# sourceMappingURL=ai.js.map