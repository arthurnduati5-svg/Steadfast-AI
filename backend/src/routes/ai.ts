import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';
import prisma from '../utils/prismaClient';
import { getRedisClient } from '../lib/redis';
import pinecone from '../lib/vectorClient';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { promptBuilder } from '../lib/promptBuilder';
import { summarizationQueue, embeddingQueue, personalizationQueue } from '../workers'; 
import { ChatSession, UserProfile, ConversationState } from '../lib/types';
import { Prisma } from '@prisma/client';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone ? pinecone.Index(process.env.PINECONE_INDEX || '') : null;

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

const getOrCreateStudentProfile = async (studentId: string) => {
  const redis = await getRedisClient();
  const cacheKey = `profile:${studentId}`;

  if (redis) {
    try {
      const cachedProfile = await redis.get(cacheKey);
      if (cachedProfile) {
        console.log(`[Profile] Cache HIT for ${studentId}`);
        return JSON.parse(cachedProfile);
      }
    } catch (err) {
      console.warn('[Profile] Redis read failed, falling back to DB.');
    }
  }

  console.log(`[Profile] Fetching from DB for ${studentId}...`);
  let profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
  });

  if (profile) {
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(profile), { EX: 86400 });
      } catch (err) {
        console.warn('[Profile] Failed to cache profile:', err);
      }
    }
    return profile;
  }

  console.log(`[Profile] No profile found. Creating...`);
  const MAIN_SYSTEM_API_URL = process.env.MAIN_SYSTEM_API_URL;
  const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
  let studentData = null;
  if (!MAIN_SYSTEM_API_URL || !INTERNAL_API_KEY) {
    console.warn('[Profile] MAIN_SYSTEM_API_URL or INTERNAL_API_KEY is not configured. Creating default profile.');
    studentData = { name: 'Test Student', email: `${studentId}@example.com`, grade: 'Not specified' };
  } else {
    try {
      const response = await fetch(`${MAIN_SYSTEM_API_URL}/api/internal/students/${studentId}`, { headers: { 'x-internal-api-key': INTERNAL_API_KEY } });
      if (response.ok) studentData = await response.json();
    } catch (error) {
      console.error(`[Profile] Error fetching from main system for ${studentId}:`, error);
    }
  }

  const newProfile = await prisma.studentProfile.create({
    data: {
      userId: studentId,
      name: studentData?.name || 'Unknown Student',
      email: studentData?.email || 'unknown@example.com',
      gradeLevel: studentData?.grade || 'Not specified',
      profileCompleted: false,
      preferences: {},
      favoriteShows: [],
      topInterests: [],
    },
  });

  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(newProfile), { EX: 86400 });
    } catch (err) {
      console.warn('[Profile] Failed to cache new profile:', err);
    }
  }

  return newProfile;
};

// 1. Preload Logic (GET /preload)
router.get('/preload', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const profile = await getOrCreateStudentProfile(studentUserId);

    const lastSession = await prisma.chatSession.findFirst({
      where: { studentId: profile.userId, messages: { some: {} } },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    const history = await prisma.chatSession.findMany({
      where: { 
        studentId: profile.userId, 
        id: { not: lastSession?.id },
        messages: { some: {} }
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: { 
        messages: {
          orderBy: { timestamp: 'asc' },
          take: 1,
        },
      },
    });

    res.status(200).send({
      ready: true,
      studentId: studentUserId,
      lastSession: lastSession ? { 
        ...lastSession, 
        messages: lastSession.messages.map(msg => ({...msg, timestamp: msg.timestamp.toISOString()})), 
        createdAt: lastSession.createdAt.toISOString(),
        updatedAt: lastSession.updatedAt.toISOString(),
        conversationState: (lastSession.metadata as any || DEFAULT_CONVERSATION_STATE) as ConversationState 
      } : null,
      history: history.map(session => ({
        id: session.id,
        title: session.topic || 'New Chat',
        createdAt: session.createdAt.toISOString(), 
        updatedAt: session.updatedAt.toISOString(),
        firstMessage: session.messages[0]?.content || null,
      }))
    });

  } catch (error) {
    console.error('[Backend] Error in preload:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 2. Starting a New Chat (POST /new-session)
router.post('/new-session', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const profile = await getOrCreateStudentProfile(studentUserId);

    const currentlyActiveSession = await prisma.chatSession.findFirst({
      where: { studentId: profile.userId, isActive: true },
      include: { messages: true }, 
    });
    
    await prisma.chatSession.updateMany({
      where: { studentId: profile.userId, isActive: true },
      data: { isActive: false },
    });

    if (currentlyActiveSession && currentlyActiveSession.messages.length > 0) {
      console.log(`[new-session] Enqueueing previous session ${currentlyActiveSession.id} for embedding.`);
      if (summarizationQueue) {
        summarizationQueue.add('summarization-jobs', { sessionId: currentlyActiveSession.id, studentId: studentUserId });
      }
      if (embeddingQueue) {
        embeddingQueue.add('embedding-jobs', {
          sessionId: currentlyActiveSession.id, studentId: studentUserId,
          message: '',
          aiResponse: ''
        });
      }
    }

    const newSession = await prisma.chatSession.create({
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

  } catch (error) {
    console.error('[Backend] Error in new-session:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 3. Sending a Message (POST /chat)
router.post('/chat', schoolAuthMiddleware, rateLimiter, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { message, sessionId, conversationState: frontendConversationState } = req.body;

    if (!sessionId) return res.status(400).send({ message: 'Session ID is required.' });

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { student: true }
    });

    if (!session || session.student.userId !== studentId) {
        return res.status(404).send({ message: 'Session not found.' });
    }

    const currentMessages = await prisma.chatMessage.findMany({ where: { sessionId }, orderBy: { timestamp: 'asc' } });

    const studentMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: message, timestamp: new Date(), messageNumber: currentMessages.length + 1 },
    });

    const allSessionMessages = [...currentMessages, studentMessage];

    const messagesForAI: ChatCompletionMessageParam[] = [
      { role: 'system', content: promptBuilder.buildSystemContext(session.student, session, frontendConversationState) },
      ...allSessionMessages.map((msg): ChatCompletionMessageParam => {
        if (msg.role === 'user') {
          return { role: 'user', content: msg.content };
        }
        return { role: 'assistant', content: msg.content };
      }),
    ];

    const aiCompletion = await openai.chat.completions.create({ model: 'gpt-4o', messages: messagesForAI, temperature: 0.7, max_tokens: 1000 });
    const aiResponse = aiCompletion.choices?.[0]?.message?.content || 'I am sorry, I could not generate a response.';
    
    const aiMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'model', content: aiResponse, timestamp: new Date(), messageNumber: allSessionMessages.length + 1 },
    });

    let updatedTopic = session.topic;
    if (session.topic === 'New Chat' && allSessionMessages.length === 1) { 
      try {
        console.log(`[Backend] Generating topic for session ${sessionId}...`);
        const topicGenerationPrompt = `Based on the user's first question: "${message}", create a short, descriptive title (4 words max) for this chat. Do not use quotes or the word "chat".`;
        const topicCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: topicGenerationPrompt }],
          temperature: 0.4,
          max_tokens: 20,
        });
        const suggestedTopic = topicCompletion.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '');
        if (suggestedTopic && !['new chat', 'untitled', 'no title'].some(t => suggestedTopic.toLowerCase().includes(t))) {
          updatedTopic = suggestedTopic;
          console.log(`[Backend] New topic generated: "${updatedTopic}"`);
        }
      } catch (topicError) {
        console.error('[Backend] Error generating topic:', topicError);
      }
    }

    await prisma.chatSession.update({
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

    if (pineconeIndex && embeddingQueue) {
      embeddingQueue.add('embedding-jobs', { sessionId, studentId, message, aiResponse });
    }
    if (personalizationQueue) {
      personalizationQueue.add('personalization-jobs', { studentId, userMessage: message, aiResponse });
    }

  } catch (error) {
    console.error('[Backend] Error in AI chat:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Route for saving single message
router.post('/message', schoolAuthMiddleware, rateLimiter, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { message, sessionId, conversationState: frontendConversationState } = req.body;

    if (!sessionId) {
        return res.status(400).send({ message: 'Session ID is required.' });
    }

    const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, studentId }, 
    });

    if (!session) {
        return res.status(404).send({ message: 'Session not found.' });
    }

    const messageNumber = await prisma.chatMessage.count({ where: { sessionId } });
    await prisma.chatMessage.create({
      data: { 
        sessionId, 
        role: message.role, 
        content: message.content, 
        timestamp: new Date(message.timestamp), 
        messageNumber: messageNumber + 1 
      },
    });
    
    await prisma.chatSession.update({
        where: { id: sessionId },
        data: { metadata: frontendConversationState, updatedAt: new Date() },
    });

    if (message.role === 'model' && personalizationQueue) {
       const lastUserMsg = await prisma.chatMessage.findFirst({
         where: { sessionId, role: 'user' },
         orderBy: { timestamp: 'desc' }
       });
       
       if (lastUserMsg) {
         personalizationQueue.add('personalization-jobs', { 
           studentId, 
           userMessage: lastUserMsg.content, 
           aiResponse: message.content 
         });
       }
    }

    res.status(200).send({ message: 'Message saved' });
  } catch (error) {
    console.error('[Backend] Error in saving message:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ✅ CRITICAL: UPDATED SESSION PATCH ROUTE (Fixes Title Saving)
router.patch('/session/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
    try {
      const studentUserId = req.user!.id;
      const sessionId = req.params.id;
      const { title } = req.body; 

      console.log(`[Backend] PATCH /session/${sessionId} - Updating Title: "${title}"`);

      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, studentId: studentUserId },
      });
      
      if (!session) {
        return res.status(404).send({ message: 'Session not found.' });
      }

      const dataToUpdate: any = {
        updatedAt: new Date(),
      };
      
      if (title) {
        dataToUpdate.topic = title; // 'topic' column holds the title
      }

      const updatedSession = await prisma.chatSession.update({
        where: { id: sessionId },
        data: dataToUpdate,
      });

      console.log(`[Backend] Session updated successfully. New Topic: "${updatedSession.topic}"`);

      res.status(200).json({
        message: 'Session updated successfully',
        session: updatedSession,
      });
    } catch (error) {
      console.error('[Backend] Error updating session:', error);
      res.status(500).send({ message: 'Internal server error' });
    }
});

// 4. History (GET /history)
router.get('/history', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const profile = await getOrCreateStudentProfile(studentUserId);
    const { page = '1', limit = '10', search } = req.query;
    const pageNum = parseInt(page as string, 10), limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { studentId: profile.userId, messages: { some: {} } };
    if (search) {
      whereClause.OR = [
        { topic: { contains: search as string, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search as string, mode: 'insensitive' } } } },
      ];
    }

    const [history, total] = await prisma.$transaction([
        prisma.chatSession.findMany({ 
            where: whereClause, 
            skip, 
            take: limitNum, 
            orderBy: { updatedAt: 'desc' }, 
            include: { 
                messages: {
                    orderBy: { timestamp: 'asc' },
                    take: 1
                }
            } 
        }),
        prisma.chatSession.count({ where: whereClause })
    ]);

    res.status(200).send({
        sessions: history.map(session => ({
            id: session.id,
            title: session.topic || 'New Chat',
            updatedAt: session.updatedAt.toISOString(),
            createdAt: session.createdAt.toISOString(),
            firstMessage: session.messages[0]?.content || null
        })),
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('[Backend] Error fetching history:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 5. Resume Chat (GET /session/:id)
router.get('/session/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const profile = await getOrCreateStudentProfile(studentUserId);
    const sessionId = req.params.id;

    await prisma.chatSession.updateMany({
      where: { studentId: profile.userId, isActive: true, id: { not: sessionId } },
      data: { isActive: false },
    });

    const session = await prisma.chatSession.update({
      where: { id: sessionId, studentId: profile.userId },
      data: { isActive: true },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    if (!session) return res.status(404).send({ message: 'Session not found.' });

    res.status(200).send({
      ...session,
      messages: session.messages.map(msg => ({ ...msg, timestamp: msg.timestamp.toISOString() })),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      conversationState: (session.metadata as any || DEFAULT_CONVERSATION_STATE) as ConversationState
    });
  } catch (error) {
    console.error('[Backend] Error resuming chat session:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 6. Delete Chat (POST /session/:id/delete)
router.post('/session/:id/delete', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const sessionId = req.params.id;

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) return res.status(404).send({ message: 'Session not found.' });
    
    const profile = await getOrCreateStudentProfile(studentUserId);
    if (session.studentId !== profile.userId) {
        return res.status(403).send({ message: 'Unauthorized to delete this session.' });
    }

    await prisma.chatMessage.deleteMany({
      where: { sessionId: sessionId },
    });

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    res.status(200).send({ message: 'Session deleted successfully.' });
  } catch (error) {
    console.error('[Backend] Error deleting session:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 7. Search Past Chats (GET /search)
router.get('/search', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { q: queryParam, mode: modeParam } = req.query as any;
    const query = queryParam as string;
    const mode = (modeParam as string) || 'hybrid';

    if (!query || typeof query !== 'string') {
      return res.status(400).send({ message: 'Search query (q) is required.' });
    }

    let results: any[] = [];

    if (mode === 'keyword' || mode === 'hybrid') {
      const keywordSessions = await prisma.chatSession.findMany({
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

      results.push(
        ...keywordSessions.map((session) => ({
          id: session.id,
          topic: session.topic,
          summary: (session.metadata as any)?.summary || session.topic,
          updatedAt: session.updatedAt,
          source: 'keyword',
          relevance: 0.5,
        })),
      );
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

        const semanticSessionIds = pineconeResults.matches?.map((m: any) => m.id) || [];
        if (semanticSessionIds.length > 0) {
          const semanticSessions = await prisma.chatSession.findMany({
            where: { id: { in: semanticSessionIds } },
            select: { id: true, topic: true, metadata: true, updatedAt: true },
          });

          semanticSessions.forEach((session) => {
            const match = pineconeResults.matches?.find((m: any) => m.id === session.id);
            results.push({
              id: session.id,
              topic: session.topic,
              summary: (session.metadata as any)?.summary || session.topic,
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
  } catch (error) {
    console.error('Error searching past chats:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 8. Memory Routes
router.get('/memory/student', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    
    const redis = await getRedisClient();
    const cacheKey = `memory:${studentId}`;
    if (redis) {
      try {
        const cachedMemory = await redis.get(cacheKey);
        if (cachedMemory) return res.status(200).send(JSON.parse(cachedMemory));
      } catch (e) { console.warn('[Memory] Redis read failed', e); }
    }

    const progress = await prisma.progress.findMany({ where: { studentId } });
    const mistakes = await prisma.mistake.findMany({ where: { studentId } });
    const memoryData = { progress, mistakes };

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(memoryData), { EX: 3600 });
      } catch (e) { console.warn('[Memory] Redis write failed', e); }
    }

    res.status(200).send(memoryData);
  } catch (error) {
    console.error('Error fetching student memory:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/memory/global', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const globalMemory = await prisma.globalMemory.findMany();
    res.status(200).send({ globalMemory });
  } catch (error) {
    console.error('Error fetching global memory:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/memory/update', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { type, data } = req.body;
    
    if (type === 'progress') {
      const { subject, topic, mastery } = data;
      await prisma.progress.upsert({
        where: { id: data.id || '' },
        update: { subject, topic, mastery },
        create: { studentId, subject, topic, mastery },
      });
    } else if (type === 'mistake') {
      const { topic, error, attempts } = data;
      await prisma.mistake.create({
        data: { studentId, topic, error, attempts: attempts || 1 },
      });
    } else {
      return res.status(400).send({ message: 'Invalid memory type' });
    }

    const redis = await getRedisClient();
    if (redis) {
      try {
        await redis.del(`memory:${studentId}`);
      } catch (e) { console.warn('[Memory] Redis invalidation failed', e); }
    }

    res.status(200).send({ message: 'Memory updated successfully' });
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 9. Preferences Routes
router.get('/preferences', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const preferences = await prisma.copilotPreferences.findUnique({ where: { userId: studentId } });

    if (preferences) {
      res.status(200).json({
        preferredLanguage: preferences.preferredLanguage,
        interests: preferences.interests || [],
        lastUpdatedAt: preferences.lastUpdatedAt.toISOString(),
      });
    } else {
      res.status(200).json({ preferredLanguage: 'english', interests: [], lastUpdatedAt: null });
    }
  } catch (error) {
    console.error('[Backend] Error fetching preferences:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/preferences/update', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { preferredLanguage, interests } = req.body; 

    const allowedLanguages = ['english', 'swahili', 'english_sw'];
    if (!preferredLanguage || !allowedLanguages.includes(preferredLanguage)) {
      return res.status(400).json({ message: 'Invalid or missing preferredLanguage.' });
    }

    await prisma.studentProfile.upsert({
      where: { userId: studentId },
      update: {},
      create: { userId: studentId, preferredLanguage: 'english', topInterests: [] },
    });

    const updatedPreferences = await prisma.copilotPreferences.upsert({
      where: { userId: studentId },
      update: { preferredLanguage, interests: interests as Prisma.JsonArray },
      create: { userId: studentId, preferredLanguage, interests: interests as Prisma.JsonArray },
    });

    const redis = await getRedisClient();
    if (redis) {
      try {
        await redis.del(`profile:${studentId}`);
      } catch (redisError) {
        console.error('[Profile] Error invalidating Redis cache:', redisError);
      }
    }

    res.status(200).json({
      message: 'Preferences updated successfully',
      preferredLanguage: updatedPreferences.preferredLanguage,
      interests: updatedPreferences.interests,
      lastUpdatedAt: updatedPreferences.lastUpdatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Backend] Error updating preferences:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

export default router;