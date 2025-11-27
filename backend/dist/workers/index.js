"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshCacheWorker = exports.refreshCacheQueue = exports.embeddingWorker = exports.embeddingQueue = exports.summarizationWorker = exports.summarizationQueue = void 0;
const bullmq_1 = require("bullmq");
const openai_1 = require("openai");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const vectorClient_1 = __importDefault(require("../lib/vectorClient"));
const redis_1 = __importDefault(require("../lib/redis"));
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = vectorClient_1.default.Index(process.env.PINECONE_INDEX || '');
// --- No-op Queue Implementation for when Redis is unavailable ---
// This class now correctly mimics the generic structure of bullmq's Queue
class NoopQueue {
    constructor(name, _opts) {
        this.name = name;
        console.warn(`NoopQueue: Redis is not available. Queue '${this.name}' will not process jobs.`);
    }
    async add(name, data, _opts) {
        console.warn(`NoopQueue: Redis not connected. Job '${name}' for queue '${this.name}' skipped.`);
        // Return a simple mock object that satisfies the Job interface for type-checking.
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
}
// --- Summarization Worker ---
exports.summarizationQueue = redis_1.default ?
    new bullmq_1.Queue('summarization-jobs', { connection: redis_1.default }) :
    new NoopQueue('summarization-jobs');
exports.summarizationWorker = redis_1.default ?
    new bullmq_1.Worker('summarization-jobs', async (job) => {
        const { sessionId, studentId } = job.data;
        try {
            const messages = await prismaClient_1.default.chatMessage.findMany({ where: { sessionId }, orderBy: { timestamp: 'asc' } });
            const sessionContent = messages.map((m) => m.content).join(' ');
            const topicResponse = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: `Generate a concise, engaging topic (under 5 words) for this chat session:\n\n${sessionContent}` }],
                max_tokens: 20,
            });
            const topic = topicResponse.choices[0]?.message?.content?.trim() || 'Untitled Session';
            await prismaClient_1.default.chatSession.update({ where: { id: sessionId }, data: { topic } });
            const embeddingResponse = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: topic });
            const embedding = embeddingResponse.data[0]?.embedding;
            if (embedding) {
                await pineconeIndex.upsert([{ id: sessionId, values: embedding, metadata: { studentId, topic, type: 'session_summary' } }]);
                console.log(`Session ${sessionId} summarized and embedded.`);
            }
        }
        catch (error) {
            console.error(`Error in summarization worker for session ${sessionId}:`, error);
        }
    }, { connection: redis_1.default }) :
    new NoopWorker('summarization-jobs', async () => { });
// --- Embedding Worker ---
exports.embeddingQueue = redis_1.default ?
    new bullmq_1.Queue('embedding-jobs', { connection: redis_1.default }) :
    new NoopQueue('embedding-jobs');
exports.embeddingWorker = redis_1.default ?
    new bullmq_1.Worker('embedding-jobs', async (job) => {
        const { sessionId, studentId, message, aiResponse } = job.data;
        try {
            const [messageEmbedding, aiResponseEmbedding] = await Promise.all([
                openai.embeddings.create({ model: 'text-embedding-ada-002', input: message }),
                openai.embeddings.create({ model: 'text-embedding-ada-002', input: aiResponse }),
            ]);
            const messageVector = { id: `${sessionId}-student-${Date.now()}`, values: messageEmbedding.data[0].embedding, metadata: { studentId, sessionId, role: 'student' } };
            const aiResponseVector = { id: `${sessionId}-ai-${Date.now()}`, values: aiResponseEmbedding.data[0].embedding, metadata: { studentId, sessionId, role: 'ai' } };
            await pineconeIndex.upsert([messageVector, aiResponseVector]);
            const session = await prismaClient_1.default.chatSession.findUnique({ where: { id: sessionId } });
            if (session?.topic === 'Untitled') {
                exports.summarizationQueue.add('summarization-jobs', { sessionId, studentId });
            }
            console.log(`Embeddings for session ${sessionId} processed and stored.`);
        }
        catch (error) {
            console.error(`Error in embedding worker for session ${sessionId}:`, error);
        }
    }, { connection: redis_1.default }) :
    new NoopWorker('embedding-jobs', async () => { });
// --- Refresh Cache Worker ---
exports.refreshCacheQueue = redis_1.default ?
    new bullmq_1.Queue('refresh-cache-jobs', { connection: redis_1.default }) :
    new NoopQueue('refresh-cache-jobs');
exports.refreshCacheWorker = redis_1.default ?
    new bullmq_1.Worker('refresh-cache-jobs', async (job) => {
        const { studentId } = job.data;
        try {
            const [profile, history] = await Promise.all([
                prismaClient_1.default.studentProfile.findUnique({ where: { userId: studentId }, select: { userId: true, gradeLevel: true, preferredLanguage: true, preferences: true } }),
                prismaClient_1.default.chatSession.findMany({ where: { studentId }, take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, topic: true, updatedAt: true } }),
            ]);
            if (redis_1.default) {
                await redis_1.default.set(`profile:${studentId}`, JSON.stringify(profile), 'EX', 43200);
                await redis_1.default.set(`session:history:${studentId}`, JSON.stringify(history), 'EX', 43200);
                console.log(`Cache refreshed for student ${studentId}.`);
            }
            else {
                console.warn('Redis client not available. Skipping cache refresh.');
            }
        }
        catch (error) {
            console.error(`Error in refresh cache worker for student ${studentId}:`, error);
        }
    }, { connection: redis_1.default }) :
    new NoopWorker('refresh-cache-jobs', async () => { });
//# sourceMappingURL=index.js.map