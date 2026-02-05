import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';
import prisma from '../utils/prismaClient';
import { getRedisClient } from '../lib/redis';
import pinecone from '../lib/vectorClient';
import { OpenAI } from 'openai';
import { runSummarizationTask, runEmbeddingTask, runPersonalizationTask } from '../workers';
import { ConversationState } from '../lib/types';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// ✅ IMPORT THE BRAIN & PREFERENCE SERVICE
import { emotionalAICopilot } from '@/ai/flows/emotional-ai-copilot';
import { getOrCreateCopilotPreferences } from '../services/aiPreferenceService';
import { logger } from '../utils/logger';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone ? pinecone.Index(process.env.PINECONE_INDEX || '') : null;

// Configure multer for audio uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `audio-${Date.now()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// 📉 SPECIALIZED RATE LIMITERS (Limited Per Student ID, not IP, to support School NAT)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 requests per minute per student
  keyGenerator: (req: any) => (req.user?.id || req.ip || 'anon').toString(),
  message: { message: 'AI processing limit reached. Please wait a minute.' },
  validate: { default: false }
});

const sttLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  keyGenerator: (req: any) => (req.user?.id || req.ip || 'anon').toString(),
  message: { message: 'Too many voice-to-text requests. Please slow down.' },
  validate: { default: false }
});

const ttsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  keyGenerator: (req: any) => (req.user?.id || req.ip || 'anon').toString(),
  message: { message: 'Too many text-to-voice requests. Please slow down.' },
  validate: { default: false }
});

type AuthedRequest = Request & { user?: any };

const DEFAULT_CONVERSATION_STATE: ConversationState = {
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
const generateTopicInBackground = async (sessionId: string, firstMessage: string) => {
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
  } catch (error) {
    console.error(`[Background] Topic generation failed for ${sessionId}`, error);
  }
};

// ✅ ROBUST PROFILE GETTER (UPSERT)
const getOrCreateStudentProfile = async (studentId: string) => {
  try {
    const redis = await getRedisClient();
    const cacheKey = `profile:${studentId}`;

    if (redis) {
      try {
        const cachedProfile = await redis.get(cacheKey);
        if (cachedProfile) return JSON.parse(cachedProfile);
      } catch (err) { console.warn('[Profile] Redis read failed', err); }
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

    if (redis) await redis.set(cacheKey, JSON.stringify(profile), { EX: 86400 });
    return profile;

  } catch (dbError) {
    console.error(`[Profile] CRITICAL DB ERROR for ${studentId}:`, dbError);
    throw dbError;
  }
};

// ============================================================================
// 1. PRELOAD LOGIC (GET /preload)
// ============================================================================
router.get('/preload', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  logger.info({ userId: req.user?.id }, '[API] /preload hit');
  try {
    const studentUserId = req.user!.id;

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
        messages: lastSession.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
          videoData: (msg.metadata as any)?.videoData
        })),
        createdAt: lastSession.createdAt.toISOString(),
        updatedAt: lastSession.updatedAt.toISOString(),
        conversationState: (lastSession.metadata as any || DEFAULT_CONVERSATION_STATE)
      } : null,
      history: filteredHistory.map((session: any) => ({
        id: session.id,
        title: session.topic || 'New Chat',
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        firstMessage: session.messages[0]?.content || null,
      }))
    });

  } catch (error) {
    console.error('[Backend] CRITICAL 500 in /preload:', error);
    res.status(500).send({ message: 'Internal server error', details: String(error) });
  }
});

// ============================================================================
// 2. NEW SESSION (POST /new-session)
// ============================================================================
router.post('/new-session', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;

    await getOrCreateStudentProfile(studentUserId);

    try {
      await prisma.chatSession.updateMany({
        where: { studentId: studentUserId, isActive: true },
        data: { isActive: false },
      });
    } catch (e) { console.warn('[New Session] Archive warning:', e); }

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

  } catch (error) {
    console.error('[Backend] Error in /new-session:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ============================================================================
// 3. CHAT ROUTE (POST /chat) - VIDEO & TITLE PERSISTENCE
// ============================================================================
router.post('/chat', schoolAuthMiddleware, aiLimiter, async (req: AuthedRequest, res: Response) => {
  const isStreaming = req.query.stream === 'true';
  logger.info({ userId: req.user?.id, sessionId: req.body.sessionId, isStreaming }, '[API] /chat hit');
  try {
    const studentId = req.user!.id;
    const { message, sessionId, conversationState } = req.body;

    if (!sessionId) return res.status(400).send({ message: 'Session ID is required.' });

    await getOrCreateStudentProfile(studentId);

    // 🔒 CACHE CHECK (Semantic/Exact Match)
    const normalizedMsg = message.trim().toLowerCase().replace(/[?.,!]/g, '');
    const cacheKey = `ai_cache:${normalizedMsg}`;
    const redis = await getRedisClient();

    if (redis && !isStreaming) {
      const cachedResponse = await redis.get(cacheKey);
      if (cachedResponse) {
        logger.info({ userId: studentId, message: normalizedMsg }, '[Cache] HIT - Returning instant response');
        const parsed = JSON.parse(cachedResponse);
        return res.status(200).send({
          ...parsed,
          cached: true
        });
      }
    }

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

    if (isStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
    }

    let fullAiResponse = '';

    const aiResult = await emotionalAICopilot({
      text: message,
      chatHistory: session.messages.map(m => ({
        id: m.id,
        role: m.role as "user" | "model",
        content: m.content,
        timestamp: m.timestamp
      })),
      state: conversationState || DEFAULT_CONVERSATION_STATE,
      studentProfile: {
        name: session.student.name || 'Student',
        gradeLevel: session.student.gradeLevel || 'Primary'
      },
      preferences: {
        preferredLanguage: preferences.preferredLanguage as any,
        interests: preferences.interests
      },
      memory: { progress: [], mistakes: [] },
      currentTitle: session.topic || undefined,
      onToken: isStreaming ? (token: string) => {
        fullAiResponse += token;
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      } : undefined
    });

    // If it was streaming, the fullAiResponse will be populated via onToken
    // If it wasn't, we use aiResult.processedText
    const finalContent = isStreaming ? fullAiResponse : aiResult.processedText;

    // Write AI Response with Metadata
    const savedAiMsg = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'model',
        content: finalContent,
        timestamp: new Date(),
        messageNumber: session.messages.length + 2,
        metadata: {
          video: aiResult.videoData,
          sources: aiResult.sources,
          suggestedTitle: aiResult.suggestedTitle
        }
      }
    });

    // 4. Update Session Metadata & Title (CRITICAL FIX)
    try {
      if (aiResult.suggestedTitle && aiResult.suggestedTitle !== 'New Chat') {
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { topic: aiResult.suggestedTitle, updatedAt: new Date(), metadata: aiResult.state as any }
        });
      } else {
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { updatedAt: new Date(), metadata: aiResult.state as any }
        });
      }
    } catch (e) {
      logger.warn({ sessionId, error: String(e) }, '[Backend] Session metadata update failed');
    }

    // 5. CACHE STORE
    if (redis && finalContent.length > 10 && finalContent.length < 2000) {
      const cacheData = {
        message: finalContent,
        videoData: aiResult.videoData,
        sources: aiResult.sources,
        state: aiResult.state,
        suggestedTitle: aiResult.suggestedTitle
      };
      await redis.set(cacheKey, JSON.stringify(cacheData), { EX: 86400 }); // Cache for 24h
    }

    if (isStreaming) {
      res.write(`data: ${JSON.stringify({
        type: 'done',
        metadata: {
          messageId: savedAiMsg.id,
          sessionId: session.id,
          topic: aiResult.suggestedTitle || session.topic,
          state: aiResult.state,
          video: aiResult.videoData,
          sources: aiResult.sources
        }
      })}\n\n`);
      res.end();
      return;
    }

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
    // Background Tasks (Fire and Forget)
    if (session.messages.length === 0 && session.topic === 'New Chat') {
      generateTopicInBackground(sessionId, message);
    }
    if (pineconeIndex) {
      runEmbeddingTask(sessionId, studentId, message, aiResult.processedText);
    }
    runPersonalizationTask(studentId, message, aiResult.processedText);

  } catch (error) {
    console.error('[Backend] Error in /chat:', error);
    res.status(500).send({ message: 'Internal server error', details: String(error) });
  }
});

// --- HELPER ROUTES ---

router.post('/message', schoolAuthMiddleware, rateLimiter, async (req: AuthedRequest, res: Response) => {
  try {
    const { message, sessionId, conversationState } = req.body;
    if (!sessionId) return res.status(400).send({ message: 'Session ID required.' });

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
  } catch (error) {
    console.error('[Backend] Error saving message:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ✅ SESSION PATCH (HARD DEBUG VERSION WITH DETAILED LOGS)
router.patch('/session/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const curSessionId = req.params.id;
  try {
    const studentUserId = req.user!.id;
    const { title } = req.body;

    logger.info({ sessionId: curSessionId, userId: studentUserId, title }, '[BACKEND PATCH] Starting Title Update');

    // 1. Verify Session Exists & Belongs to User
    const existingSession = await prisma.chatSession.findFirst({
      where: { id: curSessionId, studentId: studentUserId }
    });

    if (!existingSession) {
      logger.error({ sessionId: curSessionId, userId: studentUserId }, '[BACKEND PATCH] ERROR: Session NOT FOUND or NOT OWNED');
      return res.status(404).send({ message: 'Session not found.' });
    }

    logger.info({ sessionId: curSessionId, userId: studentUserId, title }, '[BACKEND PATCH] ✅ Session found. Current Title: "' + existingSession.topic + '". Attempting DB Write...');

    // 2. Perform Update (Hard Error if fails)
    const updated = await prisma.chatSession.update({
      where: { id: curSessionId },
      data: { topic: title, updatedAt: new Date() },
    });

    logger.info({ sessionId: curSessionId, newTitle: updated.topic }, '[BACKEND PATCH] ✅ Success! DB Updated');
    res.status(200).json({ message: 'Session updated', session: updated });

  } catch (error) {
    logger.error({ sessionId: curSessionId, error: String(error) }, '[BACKEND PATCH] 💥 CRITICAL DB ERROR');
    res.status(500).send({ message: 'Internal server error', error: String(error) });
  }
});

router.get('/history', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const { page = '1', limit = '10', search } = req.query;
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { studentId: studentUserId, messages: { some: {} } };
    if (search) {
      whereClause.OR = [
        { topic: { contains: search as string, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search as string, mode: 'insensitive' } } } },
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
        runSummarizationTask(s.id, studentUserId);
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
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/session/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    prisma.chatSession.updateMany({
      where: { studentId: studentUserId, isActive: true, id: { not: req.params.id } },
      data: { isActive: false },
    }).catch(e => { });

    const session = await prisma.chatSession.update({
      where: { id: req.params.id, studentId: studentUserId },
      data: { isActive: true },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    if (!session) return res.status(404).send({ message: 'Session not found.' });

    res.status(200).send({
      ...session,
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
        // ✅ RETURN SAVED VIDEO DATA
        videoData: (msg.metadata as any)?.videoData
      })),
      conversationState: (session.metadata as any || DEFAULT_CONVERSATION_STATE)
    });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/session/:id/delete', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const { count } = await prisma.chatSession.deleteMany({
      where: { id: req.params.id, studentId: req.user!.id }
    });
    if (count === 0) return res.status(404).send({ message: 'Session not found' });
    res.status(200).send({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/search', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { q: query, mode = 'hybrid' } = req.query as any;
    if (!query) return res.status(400).send({ message: 'Query required' });

    let results: any[] = [];
    const promises = [];

    if (mode === 'keyword' || mode === 'hybrid') {
      promises.push(
        prisma.chatSession.findMany({
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
        }).then(sess => sess.map(s => ({ ...s, source: 'keyword', relevance: 0.5 })))
      );
    }

    if ((mode === 'semantic' || mode === 'hybrid') && pineconeIndex) {
      promises.push(
        openai.embeddings.create({ model: 'text-embedding-ada-002', input: query })
          .then(async (emb) => {
            const vec = emb.data[0].embedding;
            const matches = await pineconeIndex.query({
              vector: vec, topK: 10, filter: { studentId: { $eq: studentId } }
            });
            const ids = matches.matches?.map(m => m.id) || [];
            if (ids.length === 0) return [];
            const sessions = await prisma.chatSession.findMany({ where: { id: { in: ids } }, select: { id: true, topic: true, updatedAt: true } });
            return sessions.map(s => ({ ...s, source: 'semantic', relevance: 0.8 }));
          })
      );
    }

    const searchResults = await Promise.all(promises);
    const unique = Array.from(new Map(searchResults.flat().map(item => [item.id, item])).values());
    res.status(200).send(unique.slice(0, 10));

  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/preferences', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  logger.debug({ userId: req.user?.id }, '[API] /preferences hit');
  try {
    const prefs = await getOrCreateCopilotPreferences(req.user!.id);
    res.status(200).json(prefs);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching preferences', details: String(error) });
  }
});

router.post('/preferences/update', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { preferredLanguage, interests } = req.body;

    await prisma.copilotPreferences.upsert({
      where: { userId: studentId },
      update: { preferredLanguage, interests: interests as Prisma.JsonArray },
      create: { userId: studentId, preferredLanguage, interests: interests as Prisma.JsonArray },
    });

    const redis = await getRedisClient();
    if (redis) await redis.del(`copilot:preferences:${studentId}`);

    res.status(200).json({ message: 'Preferences updated' });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/memory/student', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const redis = await getRedisClient();
    if (redis) {
      const cached = await redis.get(`memory:${studentId}`);
      if (cached) return res.status(200).send(JSON.parse(cached));
    }
    const [progress, mistakes] = await Promise.all([
      prisma.progress.findMany({ where: { studentId } }),
      prisma.mistake.findMany({ where: { studentId } })
    ]);
    if (redis) await redis.set(`memory:${studentId}`, JSON.stringify({ progress, mistakes }), { EX: 3600 });
    res.status(200).send({ progress, mistakes });
  } catch (e) { res.status(500).send({ message: 'Error' }); }
});

router.post('/memory/update', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const { type, data } = req.body;
    const studentId = req.user!.id;
    if (type === 'progress') {
      await prisma.progress.upsert({ where: { id: data.id || 'new' }, create: { ...data, studentId }, update: data });
    } else if (type === 'mistake') {
      await prisma.mistake.create({ data: { ...data, studentId } });
    }
    const redis = await getRedisClient();
    if (redis) await redis.del(`memory:${studentId}`);
    res.status(200).send({ message: 'Updated' });
  } catch (e) { res.status(500).send({ message: 'Error' }); }
});

// ============================================================================
// 🎯 CONVERSATIONAL VOICE ENDPOINT (STT -> AI STREAM -> SENTENCE TTS)
// ============================================================================
router.post('/voice-chat', schoolAuthMiddleware, sttLimiter, upload.single('audio'), async (req: AuthedRequest, res: Response) => {
  logger.info({ userId: req.user?.id }, '[API] /voice-chat hit');

  if (!req.file) return res.status(400).send({ message: 'Audio required' });
  const audioFilePath = req.file.path;

  try {
    const studentId = req.user!.id;
    const { sessionId, conversationState } = req.body;

    // 1. STT - Transcribe User Audio
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'en',
    });
    fs.unlinkSync(audioFilePath);

    const userText = transcription.text;
    logger.info({ userText }, '[VoiceChat] User Transcribed');

    // 2. Prep Stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send original transcription to UI
    res.write(`data: ${JSON.stringify({ type: 'transcription', content: userText })}\n\n`);

    const [session, preferences] = await Promise.all([
      prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          student: { select: { name: true, gradeLevel: true, userId: true } },
          messages: { orderBy: { timestamp: 'asc' }, take: 10 } // Short history for voice speed
        }
      }),
      getOrCreateCopilotPreferences(studentId)
    ]);

    if (!session) throw new Error('Session not found');

    let fullAiResponse = '';
    let sentenceBuffer = '';

    // Function to Synthesize and Stream Audio Chunk
    const synthAndStream = async (text: string) => {
      try {
        const mp3 = await openai.audio.speech.create({ model: 'tts-1', voice: 'alloy', input: text });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        res.write(`data: ${JSON.stringify({ type: 'audio', content: buffer.toString('base64') })}\n\n`);
      } catch (e) {
        logger.error({ error: String(e) }, '[VoiceChat] TTS Chunk Error');
      }
    };

    // 3. AI Stream + Sentence Buffer TTS
    const aiResult = await emotionalAICopilot({
      text: userText,
      chatHistory: session.messages.map(m => ({ id: m.id, role: m.role as any, content: m.content, timestamp: m.timestamp })),
      state: JSON.parse(conversationState || '{}'),
      studentProfile: { name: session.student.name || 'Student', gradeLevel: session.student.gradeLevel || 'Primary' },
      preferences: { preferredLanguage: preferences.preferredLanguage as any, interests: preferences.interests },
      memory: { progress: [], mistakes: [] },
      currentTitle: session.topic || undefined,
      onToken: (token: string) => {
        fullAiResponse += token;
        sentenceBuffer += token;

        // Push token to UI for text rendering
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);

        // Check for sentence end
        if (/[.!?\n]/.test(token) && sentenceBuffer.trim().length > 10) {
          const sentence = sentenceBuffer.trim();
          sentenceBuffer = '';
          synthAndStream(sentence); // Fire and forget synthesis
        }
      }
    });

    // Handle remaining sentence
    if (sentenceBuffer.trim().length > 0) {
      await synthAndStream(sentenceBuffer.trim());
    }

    // 4. Persistence (Post-Stream)
    await prisma.chatMessage.createMany({
      data: [
        { sessionId, role: 'user', content: userText, timestamp: new Date(), messageNumber: session.messages.length + 1 },
        { sessionId, role: 'model', content: fullAiResponse, timestamp: new Date(), messageNumber: session.messages.length + 2 }
      ]
    });

    res.write(`data: ${JSON.stringify({ type: 'done', state: aiResult.state })}\n\n`);
    res.end();

  } catch (error) {
    if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
    logger.error({ error: String(error) }, '[VoiceChat] Fatal Error');
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Voice processing failed' })}\n\n`);
      res.end();
    }
  }
});
router.post('/stt', schoolAuthMiddleware, sttLimiter, upload.single('audio'), async (req: AuthedRequest, res: Response) => {
  logger.info({ userId: req.user?.id }, '[STT BACKEND] 🎤 STT request');
  try {
    if (!req.file) {
      logger.error('[STT BACKEND] ❌ No audio file provided in request');
      return res.status(400).send({ message: 'No audio file provided' });
    }

    const audioFilePath = req.file.path;
    logger.debug({ path: audioFilePath, size: req.file.size, mimetype: req.file.mimetype }, '[STT BACKEND] 📁 Audio file received');

    try {
      // Use OpenAI Whisper to transcribe the audio
      logger.debug('[STT BACKEND] 📡 Sending to OpenAI Whisper...');
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
        language: 'en', // You can make this dynamic based on user preferences
      });

      logger.info({ transcriptionText: transcription.text }, '[STT BACKEND] ✅ Transcription success');

      // Clean up the uploaded file
      fs.unlinkSync(audioFilePath);

      res.status(200).json({ text: transcription.text });
    } catch (error: any) {
      // Clean up the file if transcription fails
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
      }
      logger.error({ error: error.response?.data || error.message }, '[STT BACKEND] ❌ Transcription error');
      res.status(500).send({ message: 'Failed to transcribe audio' });
    }
  } catch (error) {
    logger.error({ error: String(error) }, '[STT BACKEND] Error:');
    res.status(500).send({ message: 'Internal server error', details: String(error) });
  }
});

// ============================================================================
// TEXT-TO-SPEECH ENDPOINT (OpenAI TTS with "alloy" voice)
// ============================================================================
router.post('/tts', schoolAuthMiddleware, ttsLimiter, async (req: AuthedRequest, res: Response) => {
  logger.info({ userId: req.user?.id }, '[TTS BACKEND] 🎯 TTS request');
  try {
    const { text } = req.body;
    logger.debug({ textLength: text?.length, textPreview: text?.substring(0, 50) }, '[TTS BACKEND] 📝 Request body');

    if (!text || typeof text !== 'string') {
      logger.error('[TTS BACKEND] ❌ Invalid text parameter');
      return res.status(400).send({ message: 'Text is required' });
    }

    logger.debug({ apiKeyExists: !!process.env.OPENAI_API_KEY, apiKeyPreview: process.env.OPENAI_API_KEY?.substring(0, 20) + '...' }, '[TTS BACKEND] OpenAI API Key info');

    // Use OpenAI TTS with the "alloy" voice
    logger.debug('[TTS BACKEND] 📡 Sending request to OpenAI TTS...');
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    logger.debug('[TTS BACKEND] ✅ Received response from OpenAI');

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    logger.debug({ bufferSize: buffer.length }, '[TTS BACKEND] 📦 Buffer created');

    if (buffer.length === 0) {
      logger.error('[TTS BACKEND] ❌ Generated audio buffer is empty!');
      return res.status(500).send({ message: 'Generated empty audio' });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });

    console.log('[TTS BACKEND] ✅ Sending audio buffer to client...');
    res.send(buffer);
    console.log('[TTS BACKEND] 🎵 TTS audio sent successfully!');
  } catch (error: any) {
    console.error('[TTS BACKEND] ❌ Error in TTS endpoint:', error);
    console.error('[TTS BACKEND] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      response: error.response?.data
    });
    res.status(500).send({ message: 'Failed to generate speech', error: error.message });
  }
});

export default router;