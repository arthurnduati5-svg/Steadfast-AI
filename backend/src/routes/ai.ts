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

  console.log(`[Profile] No profile found for student: ${studentId}. Creating new profile...`);

  const MAIN_SYSTEM_API_URL = process.env.MAIN_SYSTEM_API_URL;
  const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

  if (!MAIN_SYSTEM_API_URL || !INTERNAL_API_KEY) {
    throw new Error('MAIN_SYSTEM_API_URL or INTERNAL_API_KEY is not configured in .env');
  }

  try {
    // THE FIX: Programmatically remove trailing slash to make the code resilient
    const sanitizedUrl = MAIN_SYSTEM_API_URL.endsWith('/') ? MAIN_SYSTEM_API_URL.slice(0, -1) : MAIN_SYSTEM_API_URL;
    const response = await fetch(`${sanitizedUrl}/api/internal/students/${studentId}`, {
      method: 'GET',
      headers: {
        'x-internal-api-key': INTERNAL_API_KEY,
      },
    });

    if (!response.ok) {
      // Log the actual error from the main system for better debugging
      const errorBody = await response.text();
      console.error(`[Profile] Error from main system: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch student data from main system. Status: ${response.status}`);
    }

    const studentData = await response.json();

    profile = await prisma.studentProfile.create({
      data: {
        userId: studentData.id,
        name: studentData.name,
        email: studentData.email,
        gradeLevel: studentData.grade || 'Not specified',
        profileCompleted: false,
      },
    });

    console.log(`[Profile] Successfully created new profile for student: ${studentId}`);
    return profile;
  } catch (error) {
    console.error(`[Profile] Critical error creating profile for student ${studentId}:`, error);
    throw new Error('Could not get or create student profile.');
  }
};
// --- END OF HELPER FUNCTION ---

// 1. Preload Logic (GET /preload)
router.get('/preload', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const profile = await getOrCreateStudentProfile(studentId);

    const [lastSession, history] = await Promise.all([
      prisma.chatSession.findFirst({
        where: { studentId, isActive: true },
        include: { messages: { take: 5, orderBy: { timestamp: 'desc' } } },
      }),
      prisma.chatSession.findMany({
        where: { studentId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, topic: true, updatedAt: true },
      }),
    ]);

    await redis.set(`profile:${studentId}`, JSON.stringify(profile), 'EX', 43200);
    await redis.set(`session:history:${studentId}`, JSON.stringify(history), 'EX', 43200);
    if (lastSession) {
      await redis.set(`session:active:${studentId}`, JSON.stringify(lastSession), 'EX', 3600);
    }
    await redis.set(`state:ready:${studentId}`, 'true', 'EX', 3600);

    // Async warm-up
    (async () => {
      try {
        const queryEmbeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: 'Recent learning sessions',
        });
        const queryEmbedding = queryEmbeddingResponse.data?.[0]?.embedding;

        if (queryEmbedding) {
          const pineconeResults = await pineconeIndex.query({
            vector: queryEmbedding,
            topK: 3,
            filter: { studentId: { $eq: studentId } },
          });
          const semanticRecent =
            pineconeResults.matches?.map((match: any) => ({
              id: match.id,
              topic: (match.metadata as any)?.topic,
            })) || [];
          await redis.set(`semantic:recent:${studentId}`, JSON.stringify(semanticRecent), 'EX', 3600);
        }
        console.log(`Async warm-up for student ${studentId} completed.`);
      } catch (error) {
        console.error('Error during Pinecone async warm-up:', error);
      }
    })();

    res.status(200).send({ ready: true, studentId, lastSession: lastSession?.id || null });
  } catch (error) {
    console.error('Error in preload:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Other routes remain the same...

// 2. Starting a New Chat (POST /new-session)
router.post('/new-session', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;

    const activeSessionKey = `session:active:${studentId}`;
    const existingActiveSession = await redis.get(activeSessionKey);

    if (existingActiveSession) {
      const session = JSON.parse(existingActiveSession);
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { isActive: false, endTime: new Date() },
      });

      summarizationQueue.add('summarize-session', { sessionId: session.id, studentId });

      await redis.del(activeSessionKey);
    }

    const newSession = await prisma.chatSession.create({
      data: { studentId, topic: 'Untitled', isActive: true },
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
router.post('/chat', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { message } = req.body;

    const profileString = await redis.get(`profile:${studentId}`);
    const sessionString = await redis.get(`session:active:${studentId}`);

    if (!profileString || !sessionString) {
      return res.status(400).send({ message: 'Profile or active session not found in cache. Please preload.' });
    }

    const profile = JSON.parse(profileString);
    const session = JSON.parse(sessionString);
    const sessionId = session.id;

    const nextMessageNumber = (session.messages?.length || 0) + 1;

    const studentMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'student', content: message, timestamp: new Date(), messageNumber: nextMessageNumber },
    });

    // keep local session.messages array updated
    session.messages = session.messages || [];
    session.messages.push(studentMessage);

    const systemContext = promptBuilder.buildSystemContext(profile, session);
    const semanticCache = await redis.get(`semantic:recent:${studentId}`);
    const relatedTopics = semanticCache ? JSON.parse(semanticCache) : [];

    const messagesForAI: any[] = [
      { role: 'system', content: systemContext },
      ...session.messages.slice(-10).map((msg: any) => ({ role: msg.role, content: msg.content })),
    ];

    if (relatedTopics.length > 0) {
      messagesForAI.push({
        role: 'system',
        content: `Previous related topics: ${relatedTopics.map((t: any) => t.topic).join(', ')}`,
      });
    }

    const aiCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messagesForAI,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = aiCompletion.choices?.[0]?.message?.content || 'I am sorry, I could not generate a response.';

    const aiMessageNumber = (session.messages?.length || 0) + 1;
    const aiMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'ai', content: aiResponse, timestamp: new Date(), messageNumber: aiMessageNumber },
    });

    session.messages.push(aiMessage);

    await redis.set(
      `session:active:${studentId}`,
      JSON.stringify({
        ...session,
        messages: session.messages.slice(-10),
      }),
      'EX',
      3600,
    );

    res.status(200).send({ response: aiResponse });

    // Fire-and-forget embedding job
    embeddingQueue.add('embed-message', { sessionId, studentId, message, aiResponse });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 4. History (GET /history)
router.get('/history', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const history = await prisma.chatSession.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, topic: true, metadata: true, updatedAt: true },
    });

    res.status(200).send(
      history.map((session) => ({
        id: session.id,
        topic: session.topic,
        summary: (session.metadata as any)?.summary || session.topic,
        updatedAt: session.updatedAt,
      })),
    );
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 5. Resume Chat (GET /session/:id)
router.get('/session/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const sessionId = req.params.id;

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    // ensure session belongs to student
    if (!session || session.studentId !== studentId) {
      return res.status(404).send({ message: 'Session not found or not owned by student.' });
    }

    await redis.set(
      `session:active:${studentId}`,
      JSON.stringify({
        id: session.id,
        messages: session.messages,
        topic: session.topic,
        sessionSummary: (session.metadata as any)?.summary || session.topic,
      }),
      'EX',
      3600,
    );

    res.status(200).send({ messages: session.messages, topic: session.topic });
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
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId
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
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId
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
