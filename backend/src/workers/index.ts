import { Queue, Worker, Job } from 'bullmq';
import { OpenAI } from 'openai';
import prisma from '../utils/prismaClient';
import pinecone from '../lib/vectorClient';
import { getRedisClient } from '../lib/redis';
import { RedisClientType } from 'redis';
import { analyzeAndTrackProgress } from '../lib/personalization'; // Import personalization logic

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone ? pinecone.Index(process.env.PINECONE_INDEX || '') : null;

// --- Job Data Interfaces ---
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

// NEW: Personalization Job Data
interface PersonalizationJobData {
  studentId: string;
  userMessage: string;
  aiResponse: string;
}

// --- No-op Queue Implementation for when Redis is unavailable ---
class NoopQueue<DataType = any, ResultType = any, NameType extends string = string> {
  name: string;
  constructor(name: string, _opts?: any) {
    this.name = name;
    console.warn(`NoopQueue: Redis is not available. Queue '${this.name}' will not process jobs.`);
  }
  
  async add(name: NameType, data: DataType, _opts?: any): Promise<Job<DataType, ResultType, NameType>> {
    console.warn(`NoopQueue: Redis not connected. Job '${name}' for queue '${this.name}' skipped.`);
    return {
      id: 'noop-job-' + Math.random().toString(36).substring(7),
      name,
      data,
    } as unknown as Job<DataType, ResultType, NameType>;
  }

  close() { return Promise.resolve(); }
  pause() { return Promise.resolve(); }
  resume() { return Promise.resolve(); }
}

class NoopWorker<T> {
  name: string;
  constructor(name: string, _processor: (job: any) => Promise<any>, _opts?: any) {
    this.name = name;
    console.warn(`NoopWorker: Redis is not available. Worker '${this.name}' will not run.`);
  }
  close() { return Promise.resolve(); }
  on() { return this; } // Mock event listener
}

let redisConnection: RedisClientType | null = null;

// Initialize Redis connection for workers
// Note: In production, we might want to wait or retry, but for now we follow the existing pattern
getRedisClient().then((client: RedisClientType | null) => {
  redisConnection = client;
}).catch((error: any) => {
  console.error("Failed to initialize Redis client for workers:", error);
});

const redisConfig = redisConnection ? { connection: redisConnection } : undefined;

// --- Summarization Worker ---
export const summarizationQueue = redisConnection ? 
  new Queue<SummarizationJobData, any, 'summarization-jobs'>('summarization-jobs', redisConfig) :
  new NoopQueue<SummarizationJobData, any, 'summarization-jobs'>('summarization-jobs');

export const summarizationWorker = redisConnection ? 
  new Worker<SummarizationJobData>('summarization-jobs', async job => {
    const { sessionId, studentId } = job.data;
    try {
      const messages = await prisma.chatMessage.findMany({ where: { sessionId }, orderBy: { timestamp: 'asc' } });
      const sessionContent = messages.map((m: { content: string }) => m.content).join(' ');

      const topicResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Generate a concise, engaging topic (under 5 words) for this chat session:\n\n${sessionContent}` }],
        max_tokens: 20,
      });
      const topic = topicResponse.choices[0]?.message?.content?.trim() || 'Untitled Session';

      await prisma.chatSession.update({ where: { id: sessionId }, data: { topic } });

      if (pineconeIndex) {
        const embeddingResponse = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: topic });
        const embedding = embeddingResponse.data[0]?.embedding;

        if (embedding) {
          await pineconeIndex.upsert([{ id: sessionId, values: embedding, metadata: { studentId, topic, type: 'session_summary' } }]);
          console.log(`Session ${sessionId} summarized and embedded.`);
        }
      }
    } catch (error) {
      console.error(`Error in summarization worker for session ${sessionId}:`, error);
    }
  }, redisConfig) :
  new NoopWorker<SummarizationJobData>('summarization-jobs', async () => {});


// --- Embedding Worker ---
export const embeddingQueue = redisConnection ? 
  new Queue<EmbeddingJobData, any, 'embedding-jobs'>('embedding-jobs', redisConfig) :
  new NoopQueue<EmbeddingJobData, any, 'embedding-jobs'>('embedding-jobs');

export const embeddingWorker = redisConnection ? 
  new Worker<EmbeddingJobData>('embedding-jobs', async job => {
    const { sessionId, studentId, message, aiResponse } = job.data;
    if (!pineconeIndex) return; // Skip if vector DB is not configured

    try {
      const [messageEmbedding, aiResponseEmbedding] = await Promise.all([
        openai.embeddings.create({ model: 'text-embedding-ada-002', input: message }),
        openai.embeddings.create({ model: 'text-embedding-ada-002', input: aiResponse }),
      ]);

      const messageVector = { id: `${sessionId}-student-${Date.now()}`, values: messageEmbedding.data[0].embedding, metadata: { studentId, sessionId, role: 'student' } };
      const aiResponseVector = { id: `${sessionId}-ai-${Date.now()}`, values: aiResponseEmbedding.data[0].embedding, metadata: { studentId, sessionId, role: 'ai' } };

      await pineconeIndex.upsert([messageVector, aiResponseVector]);

      const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
      if (session?.topic === 'New Chat') { // Changed 'Untitled' to 'New Chat' to match default
        summarizationQueue.add('summarization-jobs', { sessionId, studentId });
      }
      
      console.log(`Embeddings for session ${sessionId} processed and stored.`);
    } catch (error) {
      console.error(`Error in embedding worker for session ${sessionId}:`, error);
    }
  }, redisConfig) :
  new NoopWorker<EmbeddingJobData>('embedding-jobs', async () => {});

// --- Refresh Cache Worker ---
export const refreshCacheQueue = redisConnection ? 
  new Queue<RefreshCacheJobData, any, 'refresh-cache-jobs'>('refresh-cache-jobs', redisConfig) :
  new NoopQueue<RefreshCacheJobData, any, 'refresh-cache-jobs'>('refresh-cache-jobs');

export const refreshCacheWorker = redisConnection ? 
  new Worker<RefreshCacheJobData>('refresh-cache-jobs', async job => {
    const { studentId } = job.data;
    try {
      const [profile, history] = await Promise.all([
        prisma.studentProfile.findUnique({ where: { userId: studentId }, select: { userId: true, gradeLevel: true, preferredLanguage: true, preferences: true } }),
        prisma.chatSession.findMany({ where: { studentId }, take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, topic: true, updatedAt: true } }),
      ]);

      const redis = await getRedisClient();
      if (redis) {
        await redis.set(`profile:${studentId}`, JSON.stringify(profile));
        await redis.expire(`profile:${studentId}`, 43200);
        await redis.set(`session:history:${studentId}`, JSON.stringify(history));
        await redis.expire(`session:history:${studentId}`, 43200);
        console.log(`Cache refreshed for student ${studentId}.`);
      }
    } catch (error) {
      console.error(`Error in refresh cache worker for student ${studentId}:`, error);
    }
  }, redisConfig) :
  new NoopWorker<RefreshCacheJobData>('refresh-cache-jobs', async () => {});

// --- Personalization Engine Worker (NEW) ---
export const personalizationQueue = redisConnection ? 
  new Queue<PersonalizationJobData, any, 'personalization-jobs'>('personalization-jobs', redisConfig) :
  new NoopQueue<PersonalizationJobData, any, 'personalization-jobs'>('personalization-jobs');

export const personalizationWorker = redisConnection ? 
  new Worker<PersonalizationJobData>('personalization-jobs', async job => {
    const { studentId, userMessage, aiResponse } = job.data;
    try {
      // Analyze and track progress/mistakes
      await analyzeAndTrackProgress(studentId, userMessage, aiResponse);
      console.log(`Personalization processed for student ${studentId}.`);
    } catch (error) {
      console.error(`Error in personalization worker for student ${studentId}:`, error);
    }
  }, redisConfig) :
  new NoopWorker<PersonalizationJobData>('personalization-jobs', async () => {});