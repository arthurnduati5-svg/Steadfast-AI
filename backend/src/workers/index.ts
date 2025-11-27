import { Queue, Worker, Job } from 'bullmq';
import { OpenAI } from 'openai';
import prisma from '../utils/prismaClient';
import pinecone from '../lib/vectorClient';
import { getRedisClient } from '../lib/redis'; // Corrected import
import { RedisClientType } from 'redis'; // Import RedisClientType

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX || '');

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

// --- No-op Queue Implementation for when Redis is unavailable ---
// This class now correctly mimics the generic structure of bullmq's Queue
class NoopQueue<DataType = any, ResultType = any, NameType extends string = string> {
  name: string;
  constructor(name: string, _opts?: any) {
    this.name = name;
    console.warn(`NoopQueue: Redis is not available. Queue '${this.name}' will not process jobs.`);
  }
  
  async add(name: NameType, data: DataType, _opts?: any): Promise<Job<DataType, ResultType, NameType>> {
    console.warn(`NoopQueue: Redis not connected. Job '${name}' for queue '${this.name}' skipped.`);
    // Return a simple mock object that satisfies the Job interface for type-checking.
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
}

let redisConnection: RedisClientType | null = null;

getRedisClient().then((client: RedisClientType | null) => {
  redisConnection = client;
}).catch((error: any) => {
  console.error("Failed to initialize Redis client for workers:", error);
  // redisConnection will remain null, so Noop queues/workers will be used.
});

// --- Summarization Worker ---
export const summarizationQueue = redisConnection ? 
  new Queue<SummarizationJobData, any, 'summarization-jobs'>('summarization-jobs', { connection: redisConnection }) :
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

      const embeddingResponse = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: topic });
      const embedding = embeddingResponse.data[0]?.embedding;

      if (embedding) {
        await pineconeIndex.upsert([{ id: sessionId, values: embedding, metadata: { studentId, topic, type: 'session_summary' } }]);
        console.log(`Session ${sessionId} summarized and embedded.`);
      }
    } catch (error) {
      console.error(`Error in summarization worker for session ${sessionId}:`, error);
    }
  }, { connection: redisConnection }) :
  new NoopWorker<SummarizationJobData>('summarization-jobs', async () => {});


// --- Embedding Worker ---
export const embeddingQueue = redisConnection ? 
  new Queue<EmbeddingJobData, any, 'embedding-jobs'>('embedding-jobs', { connection: redisConnection }) :
  new NoopQueue<EmbeddingJobData, any, 'embedding-jobs'>('embedding-jobs');

export const embeddingWorker = redisConnection ? 
  new Worker<EmbeddingJobData>('embedding-jobs', async job => {
    const { sessionId, studentId, message, aiResponse } = job.data;
    try {
      const [messageEmbedding, aiResponseEmbedding] = await Promise.all([
        openai.embeddings.create({ model: 'text-embedding-ada-002', input: message }),
        openai.embeddings.create({ model: 'text-embedding-ada-002', input: aiResponse }),
      ]);

      const messageVector = { id: `${sessionId}-student-${Date.now()}`, values: messageEmbedding.data[0].embedding, metadata: { studentId, sessionId, role: 'student' } };
      const aiResponseVector = { id: `${sessionId}-ai-${Date.now()}`, values: aiResponseEmbedding.data[0].embedding, metadata: { studentId, sessionId, role: 'ai' } };

      await pineconeIndex.upsert([messageVector, aiResponseVector]);

      const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
      if (session?.topic === 'Untitled') {
        summarizationQueue.add('summarization-jobs', { sessionId, studentId });
      }
      
      console.log(`Embeddings for session ${sessionId} processed and stored.`);
    } catch (error) {
      console.error(`Error in embedding worker for session ${sessionId}:`, error);
    }
  }, { connection: redisConnection }) :
  new NoopWorker<EmbeddingJobData>('embedding-jobs', async () => {});

// --- Refresh Cache Worker ---
export const refreshCacheQueue = redisConnection ? 
  new Queue<RefreshCacheJobData, any, 'refresh-cache-jobs'>('refresh-cache-jobs', { connection: redisConnection }) :
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
      } else {
        console.warn('Redis client not available. Skipping cache refresh.');
      }
    } catch (error) {
      console.error(`Error in refresh cache worker for student ${studentId}:`, error);
    }
  }, { connection: redisConnection }) :
  new NoopWorker<RefreshCacheJobData>('refresh-cache-jobs', async () => {});
