"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSummarizationTask = runSummarizationTask;
exports.runEmbeddingTask = runEmbeddingTask;
exports.runRefreshCacheTask = runRefreshCacheTask;
exports.runPersonalizationTask = runPersonalizationTask;
const openai_1 = require("openai");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const vectorClient_1 = __importDefault(require("../lib/vectorClient"));
const redis_1 = require("../lib/redis");
const personalization_1 = require("../lib/personalization");
require("dotenv/config");
const logger_1 = require("../utils/logger");
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = vectorClient_1.default ? vectorClient_1.default.Index(process.env.PINECONE_INDEX || '') : null;
// --- Background Task Logic ---
/**
 * Summarizes the chat session and updates the topic.
 */
async function runSummarizationTask(sessionId, studentId) {
    try {
        const messages = await prismaClient_1.default.chatMessage.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        });
        if (messages.length === 0)
            return;
        const sessionContent = messages.map((m) => m.content).join('\n');
        const resp = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{
                    role: 'user',
                    content: `Generate a concise, engaging topic (under 5 words) for this chat session history:\n\n${sessionContent}`
                }],
            max_tokens: 20,
        });
        const topic = resp.choices[0]?.message?.content?.trim() || 'Untitled Session';
        await prismaClient_1.default.chatSession.update({ where: { id: sessionId }, data: { topic } });
        if (pineconeIndex) {
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: topic
            });
            const embedding = embeddingResponse.data[0]?.embedding;
            if (embedding) {
                await pineconeIndex.upsert([{
                        id: sessionId,
                        values: embedding,
                        metadata: { studentId, topic, type: 'session_summary' }
                    }]);
            }
        }
        logger_1.logger.info({ sessionId }, '[Task] Summarization complete');
    }
    catch (error) {
        logger_1.logger.error({ sessionId, error: String(error) }, '[Task] Summarization failed');
    }
}
/**
 * Generates and stores embeddings for a chat message and AI response.
 */
async function runEmbeddingTask(sessionId, studentId, message, aiResponse) {
    if (!pineconeIndex)
        return;
    try {
        const [messageEmbedding, aiResponseEmbedding] = await Promise.all([
            openai.embeddings.create({ model: 'text-embedding-ada-002', input: message }),
            openai.embeddings.create({ model: 'text-embedding-ada-002', input: aiResponse }),
        ]);
        await pineconeIndex.upsert([
            {
                id: `${sessionId}-student-${Date.now()}`,
                values: messageEmbedding.data[0].embedding,
                metadata: { studentId, sessionId, role: 'student' }
            },
            {
                id: `${sessionId}-ai-${Date.now()}`,
                values: aiResponseEmbedding.data[0].embedding,
                metadata: { studentId, sessionId, role: 'ai' }
            }
        ]);
        // Auto-update topic if it's still 'New Chat'
        const session = await prismaClient_1.default.chatSession.findUnique({ where: { id: sessionId } });
        if (session?.topic === 'New Chat') {
            await runSummarizationTask(sessionId, studentId);
        }
        logger_1.logger.info({ sessionId }, '[Task] Embeddings stored');
    }
    catch (error) {
        logger_1.logger.error({ sessionId, error: String(error) }, '[Task] Embedding task failed');
    }
}
/**
 * Refreshes the student's profile and history cache in Redis.
 */
async function runRefreshCacheTask(studentId) {
    try {
        const [profile, history] = await Promise.all([
            prismaClient_1.default.studentProfile.findUnique({ where: { userId: studentId } }),
            prismaClient_1.default.chatSession.findMany({ where: { studentId }, take: 5, orderBy: { updatedAt: 'desc' } }),
        ]);
        const redis = await (0, redis_1.getRedisClient)();
        if (redis) {
            await redis.set(`profile:${studentId}`, JSON.stringify(profile));
            await redis.expire(`profile:${studentId}`, 43200); // 12 hours
            await redis.set(`session:history:${studentId}`, JSON.stringify(history));
            await redis.expire(`session:history:${studentId}`, 43200);
            logger_1.logger.info({ studentId }, '[Task] Cache refreshed');
        }
    }
    catch (error) {
        logger_1.logger.error({ studentId, error: String(error) }, '[Task] Cache refresh failed');
    }
}
/**
 * Runs personalization analysis in the background.
 */
async function runPersonalizationTask(studentId, userMessage, aiResponse) {
    try {
        await (0, personalization_1.analyzeAndTrackProgress)(studentId, userMessage, aiResponse);
        logger_1.logger.info({ studentId }, '[Task] Personalization processed');
    }
    catch (error) {
        logger_1.logger.error({ studentId, error: String(error) }, '[Task] Personalization task failed');
    }
}
logger_1.logger.info('[Workers] Background tasks initialized.');
//# sourceMappingURL=index.js.map