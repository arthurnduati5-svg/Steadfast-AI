import { Router, Request } from 'express'; // Import Request
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import prisma from '../utils/prismaClient';
import redis from '../lib/redis';
import pinecone from '../lib/vectorClient';
import { OpenAI } from 'openai';
import { promptBuilder } from '../lib/promptBuilder';
import { summarizationQueue, embeddingQueue } from '../workers';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX || '');

// 1. Preload Logic (GET /preload)
router.get('/preload', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId

    const [profile, lastSession, history] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: studentId },
        select: { userId: true, gradeLevel: true, preferredLanguage: true, preferences: true },
      }),
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

    (async () => {
      try {
        const queryEmbeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: "Recent learning sessions",
        });
        const queryEmbedding = queryEmbeddingResponse.data[0]?.embedding;
        
        if (queryEmbedding) {
          const pineconeResults = await pineconeIndex.query({
            vector: queryEmbedding,
            topK: 3,
            filter: { studentId: { '$eq': studentId } },
          });
          const semanticRecent = pineconeResults.matches?.map(match => ({
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

// 2. Starting a New Chat (POST /new-session)
router.post('/new-session', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId

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
      data: { studentId, topic: "Untitled", isActive: true },
    });

    await redis.set(activeSessionKey, JSON.stringify({
      id: newSession.id,
      messages: [],
      topic: "Untitled",
      sessionSummary: null,
    }), 'EX', 3600);

    res.status(200).send({ sessionId: newSession.id });
  } catch (error) {
    console.error('Error in new-session:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 3. Sending a Message (POST /chat)
router.post('/chat', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId
    const { message } = req.body;

    const profileString = await redis.get(`profile:${studentId}`);
    const sessionString = await redis.get(`session:active:${studentId}`);

    if (!profileString || !sessionString) {
      return res.status(400).send({ message: 'Profile or active session not found in cache. Please preload.' });
    }

    const profile = JSON.parse(profileString);
    const session = JSON.parse(sessionString);
    const sessionId = session.id;

    const studentMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'student', content: message, timestamp: new Date(), messageNumber: session.messages.length + 1 }
    });
    session.messages.push(studentMessage);

    const systemContext = promptBuilder.buildSystemContext(profile, session);
    const semanticCache = await redis.get(`semantic:recent:${studentId}`);
    const relatedTopics = semanticCache ? JSON.parse(semanticCache) : [];
    
    const messagesForAI: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContext },
      ...session.messages.slice(-10).map((msg: any) => ({ role: msg.role, content: msg.content })),
    ];
    if (relatedTopics.length > 0) {
      messagesForAI.push({ role: 'system', content: `Previous related topics: ${relatedTopics.map((t: any) => t.topic).join(', ')}` });
    }

    const aiCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messagesForAI,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = aiCompletion.choices[0]?.message?.content || 'I am sorry, I could not generate a response.';

    const aiMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'ai', content: aiResponse, timestamp: new Date(), messageNumber: session.messages.length + 1 }
    });
    session.messages.push(aiMessage);

    await redis.set(`session:active:${studentId}`, JSON.stringify({
      ...session,
      messages: session.messages.slice(-10),
    }), 'EX', 3600);

    res.status(200).send({ response: aiResponse });

    embeddingQueue.add('embed-message', { sessionId, studentId, message, aiResponse });
    
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 4. History (GET /history)
router.get('/history', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId
    const history = await prisma.chatSession.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, topic: true, metadata: true, updatedAt: true },
    });

    res.status(200).send(history.map(session => ({
      id: session.id,
      topic: session.topic,
      summary: (session.metadata as any)?.summary || session.topic,
      updatedAt: session.updatedAt,
    })));
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 5. Resume Chat (GET /session/:id)
router.get('/session/:id', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId
    const sessionId = req.params.id;

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId, studentId },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    if (!session) {
      return res.status(404).send({ message: 'Session not found or not owned by student.' });
    }

    await redis.set(`session:active:${studentId}`, JSON.stringify({
      id: session.id,
      messages: session.messages,
      topic: session.topic,
      sessionSummary: (session.metadata as any)?.summary || session.topic,
    }), 'EX', 3600);

    res.status(200).send({ messages: session.messages, topic: session.topic });
  } catch (error) {
    console.error('Error resuming chat session:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// 6. Search Past Chats (GET /search?q=fractions&mode=hybrid)
router.get('/search', schoolAuthMiddleware, async (req: Request, res) => {
  try {
    const studentId = req.user!.id; // UPDATED: Changed from req.currentUser.userId
    const { q: query, mode = 'hybrid' } = req.query;

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
      results.push(...keywordSessions.map(session => ({
        id: session.id,
        topic: session.topic,
        summary: (session.metadata as any)?.summary || session.topic,
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
      const queryEmbedding = embeddingResponse.data[0]?.embedding;

      if (queryEmbedding) {
        const pineconeResults = await pineconeIndex.query({
          vector: queryEmbedding,
          topK: 10,
          filter: {
            studentId: { '$eq': studentId },
            type: { '$eq': 'session_summary' },
          },
        });

        const semanticSessionIds = pineconeResults.matches?.map(match => match.id) || [];
        if (semanticSessionIds.length > 0) {
          const semanticSessions = await prisma.chatSession.findMany({
            where: { id: { in: semanticSessionIds } },
            select: { id: true, topic: true, metadata: true, updatedAt: true },
          });

          semanticSessions.forEach(session => {
            const match = pineconeResults.matches?.find(m => m.id === session.id);
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

    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
    uniqueResults.sort((a, b) => b.relevance - a.relevance);

    res.status(200).send(uniqueResults.slice(0, 10));
  } catch (error) {
    console.error('Error searching past chats:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

export default router;
