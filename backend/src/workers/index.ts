import { Queue, Worker } from 'bullmq';
import { OpenAI } from 'openai';
import prisma from '../utils/prismaClient';
import pinecone from '../lib/vectorClient';
import redis from '../lib/redis'; // Import the redis instance
import Redis from 'ioredis'; // Import Redis class for type inference if needed, but not for direct use

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX || '');

// Create an ioredis client instance using REDIS_URL for BullMQ connections
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required by BullMQ
});

interface SummarizationJobData {
  sessionId: string;
  studentId: string;
}

interface EmbeddingJobData {
  sessionId: string;
  studentId: string;
  message: string;
  aiResponse: string;
}

interface RefreshCacheJobData {
  studentId: string;
}

// --- Summarization Worker ---
export const summarizationQueue = new Queue<SummarizationJobData>('summarization-jobs', { connection: redisConnection });

export const summarizationWorker = new Worker<SummarizationJobData>('summarization-jobs', async job => {
  const { sessionId, studentId } = job.data;
  console.log(`Summarizing session ${sessionId} for student ${studentId}...`);

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    const sessionContent = messages.map(m => m.content).join(' ');

    const topicResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'user',
                content: `Generate a concise and engaging topic for the following chat session. The topic should be a short, catchy title that reflects the main theme of the conversation. Keep it under 5 words.

Chat Session:
${sessionContent}`
            }
        ],
        max_tokens: 20,
    });
    const topic = topicResponse.choices[0]?.message?.content?.trim() || 'Untitled Session';

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { 
        topic: topic,
      },
    });

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: topic,
    });
    const embedding = embeddingResponse.data[0]?.embedding;

    if (embedding) {
      await pineconeIndex.upsert([
        {
          id: sessionId,
          values: embedding,
          metadata: { studentId, topic: topic, type: 'session_summary' },
        },
      ]);
      console.log(`Session ${sessionId} summarized and embedded.`);
    }
  } catch (error) {
    console.error(`Error in summarization worker for session ${sessionId}:`, error);
  }
}, { connection: redisConnection });


// --- Embedding Worker ---
export const embeddingQueue = new Queue<EmbeddingJobData>('embedding-jobs', { connection: redisConnection });

export const embeddingWorker = new Worker<EmbeddingJobData>('embedding-jobs', async job => {
  const { sessionId, studentId, message, aiResponse } = job.data;
  console.log(`Processing embeddings for session ${sessionId}...`);

  try {
    const [messageEmbedding, aiResponseEmbedding] = await Promise.all([
      openai.embeddings.create({ model: 'text-embedding-ada-002', input: message }),
      openai.embeddings.create({ model: 'text-embedding-ada-002', input: aiResponse }),
    ]);

    const messageVector = {
      id: `${sessionId}-student-${Date.now()}`,
      values: messageEmbedding.data[0].embedding,
      metadata: { studentId, sessionId, role: 'student' },
    };
    const aiResponseVector = {
      id: `${sessionId}-ai-${Date.now()}`,
      values: aiResponseEmbedding.data[0].embedding,
      metadata: { studentId, sessionId, role: 'ai' },
    };

    await pineconeIndex.upsert([messageVector, aiResponseVector]);

    // Potentially update session topic in background if still "Untitled"
    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (session?.topic === 'Untitled') {
      summarizationQueue.add('summarize-on-the-fly', { sessionId, studentId });
    }
    
    console.log(`Embeddings for session ${sessionId} processed and stored.`);
  } catch (error) {
    console.error(`Error in embedding worker for session ${sessionId}:`, error);
  }
}, { connection: redisConnection });

// --- Refresh Cache Worker ---
export const refreshCacheQueue = new Queue<RefreshCacheJobData>('refresh-cache-jobs', { connection: redisConnection });

export const refreshCacheWorker = new Worker<RefreshCacheJobData>('refresh-cache-jobs', async job => {
  const { studentId } = job.data;
  console.log(`Refreshing cache for student ${studentId}...`);

  try {
    const [profile, history] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: studentId },
        select: { userId: true, gradeLevel: true, preferredLanguage: true, preferences: true },
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

    console.log(`Cache refreshed for student ${studentId}.`);
  } catch (error) {
    console.error(`Error in refresh cache worker for student ${studentId}:`, error);
  }
}, { connection: redisConnection });
