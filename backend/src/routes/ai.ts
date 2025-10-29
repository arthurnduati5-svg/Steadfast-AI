
import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';
import prisma from '../utils/prismaClient';
import redis from '../lib/redis';
import pinecone from '../lib/vectorClient';
import { OpenAI } from 'openai';
import { promptBuilder } from '../lib/promptBuilder';
import { summarizationQueue, embeddingQueue } from '../workers';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX || '');

// Helper: typed Request with user
type AuthedRequest = Request & { user?: any };

// --- NEW HELPER FUNCTION ---
const getOrCreateStudentProfile = async (studentId: string) => {
  let profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
  });

  if (profile) {
    console.log(`[Profile] Found existing profile for student: ${studentId}`);
    return profile;
  }

  console.log(`[Profile] No profile found for student: ${studentId}. Attempting to create...`);

  const MAIN_SYSTEM_API_URL = process.env.MAIN_SYSTEM_API_URL;
  const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

  let studentData = null;
  let shouldCreateDefaultProfile = false;

  if (!MAIN_SYSTEM_API_URL || !INTERNAL_API_KEY) {
    console.warn('[Profile] MAIN_SYSTEM_API_URL or INTERNAL_API_KEY is not configured. Creating profile with default data.');
    shouldCreateDefaultProfile = true;
  } else {
    try {
      const sanitizedUrl = MAIN_SYSTEM_API_URL.endsWith('/') ? MAIN_SYSTEM_API_URL.slice(0, -1) : MAIN_SYSTEM_API_URL;
      const response = await fetch(`${sanitizedUrl}/api/internal/students/${studentId}`, {
        method: 'GET',
        headers: {
          'x-internal-api-key': INTERNAL_API_KEY,
        },
      });

      if (response.status === 404) {
        const errorBody = await response.json(); // Attempt to parse the 404 response
        if (errorBody && errorBody.message === "Student not found.") {
          console.warn(`[Profile] Student ${studentId} not found in main system (404, message: \"Student not found.\"). Creating profile with default data.`);
          shouldCreateDefaultProfile = true;
        } else {
          // It's a 404 but with an unexpected message, re-throw or handle differently
          console.error(`[Profile] Unexpected 404 from main system for student ${studentId}:`, errorBody);
          throw new Error(`Failed to fetch student data from main system. Status: ${response.status}`);
        }
      } else if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[Profile] Error from main system: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Failed to fetch student data from main system. Status: ${response.status}`);
      }

      if (response.ok) {
        studentData = await response.json();
      }

    } catch (error) {
      console.error(`[Profile] Error during main system API call for student ${studentId}:`, error);
      // If there's a network error or other fetch-related issue, we still want to indicate a problem
      throw new Error('Could not reach main system API to get student data.');
    }
  }

  // Create profile using fetched data or default values if studentData is null/404
  try {
    profile = await prisma.studentProfile.create({
      data: {
        userId: studentId,
        name: shouldCreateDefaultProfile ? 'Test Student' : studentData?.name || 'Unknown Student',
        email: shouldCreateDefaultProfile ? `${studentId}@example.com` : studentData?.email || 'unknown@example.com',
        gradeLevel: shouldCreateDefaultProfile ? 'Not specified' : studentData?.grade || 'Not specified',
        profileCompleted: false,
        preferences: {},
        favoriteShows: [],
      },
    });

    console.log(`[Profile] Successfully created new profile for student: ${studentId}`);
    return profile;
  } catch (createError) {
    console.error(`[Profile] Critical error creating profile for student ${studentId} in Prisma:`, createError);
    throw new Error('Could not create student profile in database.');
  }
};
// --- END OF HELPER FUNCTION ---

// 1. Preload Logic (GET /preload)
router.get('/preload', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const profile = await getOrCreateStudentProfile(studentUserId);
    const studentProfileId = profile.userId; // Correct ID for relations

    if (!process.env.PINECONE_INDEX) {
      console.warn('PINECONE_INDEX environment variable is not set. Pinecone warm-up will be skipped.');
    }

    const [lastSession, history] = await Promise.all([
      prisma.chatSession.findFirst({
        where: { studentId: studentProfileId, isActive: true },
        include: { messages: { take: 20, orderBy: { timestamp: 'desc' } } },
      }),
      prisma.chatSession.findMany({
        where: { studentId: studentProfileId },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, topic: true, updatedAt: true, messages: { take: 1, orderBy: { timestamp: 'desc' } } },
      }),
    ]);

    // Reverse the messages in lastSession to be in ascending order for the client
    if (lastSession && lastSession.messages) {
      lastSession.messages.reverse();
    }

    await redis.set(`profile:${studentUserId}`, JSON.stringify(profile), 'EX', 43200);
    await redis.set(`session:history:${studentUserId}`, JSON.stringify(history), 'EX', 43200);
    if (lastSession) {
      await redis.set(`session:active:${studentUserId}`, JSON.stringify(lastSession), 'EX', 3600);
    }
    await redis.set(`state:ready:${studentUserId}`, 'true', 'EX', 3600);

    // Async warm-up is fire-and-forget
    if (process.env.PINECONE_INDEX) {
      (async () => {
        try {
          const queryEmbeddingResponse = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: 'Recent learning sessions' });
          const queryEmbedding = queryEmbeddingResponse.data?.[0]?.embedding;

          if (queryEmbedding) {
            const pineconeResults = await pineconeIndex.query({
              vector: queryEmbedding,
              topK: 3,
              filter: { studentId: { $eq: studentUserId } },
            });
            const semanticRecent = pineconeResults.matches?.map((match: any) => ({ id: match.id, topic: (match.metadata as any)?.topic })) || [];
            await redis.set(`semantic:recent:${studentUserId}`, JSON.stringify(semanticRecent), 'EX', 3600);
          }
          console.log(`Async warm-up for student ${studentUserId} completed.`);
        } catch (error) {
          console.error('Error during Pinecone async warm-up:', error);
        }
      })();
    }

    res.status(200).send({ ready: true, studentId: studentUserId, lastSession: lastSession || null, history: history || [] });

  } catch (error) {
    console.error('Error in preload:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Other routes remain the same...

// 2. Starting a New Chat (POST /new-session)
router.post('/new-session', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const profile = await getOrCreateStudentProfile(studentUserId);
    const studentProfileId = profile.userId; // Correct ID for relations

    const activeSessionKey = `session:active:${studentUserId}`;
    const existingActiveSession = await redis.get(activeSessionKey);

    if (existingActiveSession) {
      const session = JSON.parse(existingActiveSession);
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { isActive: false, endTime: new Date() },
      });

      summarizationQueue.add('summarize-session', { sessionId: session.id, studentId: studentUserId });

      await redis.del(activeSessionKey);
    }

    const newSession = await prisma.chatSession.create({
      data: { studentId: studentProfileId, topic: 'Untitled', isActive: true },
    });

    await redis.set(
      activeSessionKey,
      JSON.stringify({
        id: newSession.id,
        messages: [],
        topic: 'Untitled',
        sessionSummary: null,
      }),
      'EX',
      3600,
    );

    res.status(200).send({ sessionId: newSession.id });
  } catch (error) {
    console.error('Error in new-session:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 3. Sending a Message (POST /chat)
router.post('/chat', schoolAuthMiddleware, rateLimiter, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { message, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).send({ message: 'Session ID is required.' });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { student: true }
    });

    if (!session || session.student.userId !== studentId) {
        return res.status(404).send({ message: 'Session not found or does not belong to the user.' });
    }

    const currentMessages = await prisma.chatMessage.findMany({ 
      where: { sessionId }, 
      orderBy: { timestamp: 'asc' },
      take: 20,
    });

    const nextMessageNumber = (currentMessages?.length || 0) + 1;

    const studentMessage = await prisma.chatMessage.create({
      data: { 
        sessionId: session.id, 
        role: 'student', 
        content: message, 
        timestamp: new Date(), 
        messageNumber: nextMessageNumber 
      },
    });

    const messagesForAI: any[] = [
      { role: 'system', content: promptBuilder.buildSystemContext(session.student, session) },
      ...currentMessages.map((msg: any) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message }
    ];

    const aiCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messagesForAI,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = aiCompletion.choices?.[0]?.message?.content || 'I am sorry, I could not generate a response.';

    const aiMessageNumber = nextMessageNumber + 1;
    const aiMessage = await prisma.chatMessage.create({
      data: { 
        sessionId: session.id, 
        role: 'ai', 
        content: aiResponse, 
        timestamp: new Date(), 
        messageNumber: aiMessageNumber 
      },
    });

    res.status(200).send({ response: aiResponse, messageId: aiMessage.id, sessionId: session.id });

    embeddingQueue.add('embed-message', { sessionId, studentId, message, aiResponse });

    await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});


// 4. History (GET /history)
router.get('/history', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentUserId }});
    if (!profile) {
      return res.status(404).send({ message: 'Profile not found.' });
    }
    const studentProfileId = profile.userId;

    const { page = '1', limit = '10', search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { studentId: studentProfileId };
    if (search) {
      whereClause.OR = [
        { topic: { contains: search as string, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search as string, mode: 'insensitive' } } } },
      ];
    }

    const [history, total] = await prisma.$transaction([
        prisma.chatSession.findMany({
            where: whereClause,
            skip: skip,
            take: limitNum,
            orderBy: { updatedAt: 'desc' },
            include: { 
              _count: {
                select: { messages: true }
              }
            },
        }),
        prisma.chatSession.count({ where: whereClause })
    ]);

    res.status(200).send({
        sessions: history.map((session) => ({
            id: session.id,
            topic: session.topic,
            updatedAt: session.updatedAt,
            messageCount: session._count.messages,
        })),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});


// 5. Resume Chat (GET /session/:id)
router.get('/session/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentUserId }});
    if (!profile) {
      return res.status(404).send({ message: 'Profile not found.' });
    }
    const studentProfileId = profile.userId;

    const sessionId = req.params.id;

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    if (!session || session.studentId !== studentProfileId) {
      return res.status(404).send({ message: 'Session not found or not owned by student.' });
    }

    await prisma.chatSession.updateMany({
      where: {
        studentId: studentProfileId,
        isActive: true,
        id: { not: sessionId },
      },
      data: { isActive: false },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { isActive: true },
    });

    await redis.set(
      `session:active:${studentUserId}`,
      JSON.stringify({
        id: session.id,
        messages: session.messages,
        topic: session.topic,
        sessionSummary: (session.metadata as any)?.summary || session.topic,
      }),
      'EX',
      3600,
    );

    res.status(200).send({ messages: session.messages, topic: session.topic, id: session.id });
  } catch (error) {
    console.error('Error resuming chat session:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 6. Search Past Chats (GET /search?q=fractions&mode=hybrid)
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

      if (queryEmbedding) {
        const pineconeResults = await pineconeIndex.query({
          vector: queryEmbedding,
          topK: 10,
          filter: {
            studentId: { $eq: studentId },
            type: { $eq: 'session_summary' },
          },
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

  // Student and global memory routes (from original ai.ts)
  router.get('/memory/student', schoolAuthMiddleware, async (req: Request, res) => {
    try {
      const studentId = req.user!.id;
      const progress = await prisma.progress.findMany({ where: { studentId } });
      const mistakes = await prisma.mistake.findMany({ where: { studentId } });
      res.status(200).send({ progress, mistakes });
    } catch (error) {
      console.error('Error fetching student memory:', error);
      res.status(500).send({ message: 'Internal server error' });
    }
  });
  router.get('/memory/global', schoolAuthMiddleware, async (req: Request, res) => {
    try {
      const globalMemory = await prisma.globalMemory.findMany();
      res.status(200).send({ globalMemory });
    } catch (error) {
      console.error('Error fetching global memory:', Error);
      res.status(500).send({ message: 'Internal server error' });
    }
  });
  router.post('/memory/update', schoolAuthMiddleware, async (req: Request, res) => {
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
        await prisma.mistake.upsert({
          where: { id: data.id || '' },
          update: { topic, error, attempts: { increment: attempts || 1 }, lastSeen: new Date() },
          create: { studentId, topic, error, attempts: attempts || 1 },
        });
      } else {
        return res.status(400).send({ message: 'Invalid memory type' });
      }
      res.status(200).send({ message: 'Memory updated successfully' });
    } catch (error) {
      console.error('Error updating memory:', error);
      res.status(500).send({ message: 'Internal server error' });
    }
  });

export default router;
