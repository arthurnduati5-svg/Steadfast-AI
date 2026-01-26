import { Queue, Worker } from 'bullmq';
import { OpenAI } from 'openai';
import prisma from '../utils/prismaClient';
import pinecone from '../lib/vectorClient';
import { getRedisClient } from '../lib/redis';
import { analyzeAndTrackProgress } from '../lib/personalization'; // Import personalization logic
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone ? pinecone.Index(process.env.PINECONE_INDEX || '') : null;
// --- No-op Queue Implementation for when Redis is unavailable ---
class NoopQueue {
    constructor(name, _opts) {
        this.name = name;
        console.warn(`NoopQueue: Redis is not available. Queue '${this.name}' will not process jobs.`);
    }
    async add(name, data, _opts) {
        console.warn(`NoopQueue: Redis not connected. Job '${name}' for queue '${this.name}' skipped.`);
        return {
            id: 'noop-job-' + Math.random().toString(36).substring(7),
            name,
            data,
        };
    }
    close() { return Promise.resolve(); }
    pause() { return Promise.resolve(); }
    resume() { return Promise.resolve(); }
}
class NoopWorker {
    constructor(name, _processor, _opts) {
        this.name = name;
        console.warn(`NoopWorker: Redis is not available. Worker '${this.name}' will not run.`);
    }
    close() { return Promise.resolve(); }
    on() { return this; } // Mock event listener
}
let redisConnection = null;
// Initialize Redis connection for workers
// Note: In production, we might want to wait or retry, but for now we follow the existing pattern
getRedisClient().then((client) => {
    redisConnection = client;
}).catch((error) => {
    console.error("Failed to initialize Redis client for workers:", error);
});
const redisConfig = redisConnection ? { connection: redisConnection } : undefined;
// --- Summarization Worker ---
export const summarizationQueue = redisConnection ?
    new Queue('summarization-jobs', redisConfig) :
    new NoopQueue('summarization-jobs');
export const summarizationWorker = redisConnection ?
    new Worker('summarization-jobs', async (job) => {
        const { sessionId, studentId } = job.data;
        try {
            const messages = await prisma.chatMessage.findMany({ where: { sessionId }, orderBy: { timestamp: 'asc' } });
            const sessionContent = messages.map((m) => m.content).join(' ');
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
        }
        catch (error) {
            console.error(`Error in summarization worker for session ${sessionId}:`, error);
        }
    }, redisConfig) :
    new NoopWorker('summarization-jobs', async () => { });
// --- Embedding Worker ---
export const embeddingQueue = redisConnection ?
    new Queue('embedding-jobs', redisConfig) :
    new NoopQueue('embedding-jobs');
export const embeddingWorker = redisConnection ?
    new Worker('embedding-jobs', async (job) => {
        const { sessionId, studentId, message, aiResponse } = job.data;
        if (!pineconeIndex)
            return; // Skip if vector DB is not configured
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
        }
        catch (error) {
            console.error(`Error in embedding worker for session ${sessionId}:`, error);
        }
    }, redisConfig) :
    new NoopWorker('embedding-jobs', async () => { });
// --- Refresh Cache Worker ---
export const refreshCacheQueue = redisConnection ?
    new Queue('refresh-cache-jobs', redisConfig) :
    new NoopQueue('refresh-cache-jobs');
export const refreshCacheWorker = redisConnection ?
    new Worker('refresh-cache-jobs', async (job) => {
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
        }
        catch (error) {
            console.error(`Error in refresh cache worker for student ${studentId}:`, error);
        }
    }, redisConfig) :
    new NoopWorker('refresh-cache-jobs', async () => { });
// --- Personalization Engine Worker (NEW) ---
export const personalizationQueue = redisConnection ?
    new Queue('personalization-jobs', redisConfig) :
    new NoopQueue('personalization-jobs');
export const personalizationWorker = redisConnection ?
    new Worker('personalization-jobs', async (job) => {
        const { studentId, userMessage, aiResponse } = job.data;
        try {
            // Analyze and track progress/mistakes
            await analyzeAndTrackProgress(studentId, userMessage, aiResponse);
            console.log(`Personalization processed for student ${studentId}.`);
        }
        catch (error) {
            console.error(`Error in personalization worker for student ${studentId}:`, error);
        }
    }, redisConfig) :
    new NoopWorker('personalization-jobs', async () => { });
//# sourceMappingURL=index.js.map