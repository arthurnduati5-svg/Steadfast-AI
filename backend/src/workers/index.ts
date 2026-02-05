import { OpenAI } from 'openai';
import prisma from '../utils/prismaClient';
import pinecone from '../lib/vectorClient';
import { getRedisClient } from '../lib/redis';
import { analyzeAndTrackProgress } from '../lib/personalization';
import 'dotenv/config';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone ? pinecone.Index(process.env.PINECONE_INDEX || '') : null;

// --- Background Task Logic ---

/**
 * Summarizes the chat session and updates the topic.
 */
export async function runSummarizationTask(sessionId: string, studentId: string) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' }
    });

    if (messages.length === 0) return;

    const sessionContent = messages.map((m: { content: string }) => m.content).join('\n');

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Generate a concise, engaging topic (under 5 words) for this chat session history:\n\n${sessionContent}`
      }],
      max_tokens: 20,
    });

    const topic = resp.choices[0]?.message?.content?.trim() || 'Untitled Session';
    await prisma.chatSession.update({ where: { id: sessionId }, data: { topic } });

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
    logger.info({ sessionId }, '[Task] Summarization complete');
  } catch (error) {
    logger.error({ sessionId, error: String(error) }, '[Task] Summarization failed');
  }
}

/**
 * Generates and stores embeddings for a chat message and AI response.
 */
export async function runEmbeddingTask(sessionId: string, studentId: string, message: string, aiResponse: string) {
  if (!pineconeIndex) return;

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
    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (session?.topic === 'New Chat') {
      await runSummarizationTask(sessionId, studentId);
    }

    logger.info({ sessionId }, '[Task] Embeddings stored');
  } catch (error) {
    logger.error({ sessionId, error: String(error) }, '[Task] Embedding task failed');
  }
}

/**
 * Refreshes the student's profile and history cache in Redis.
 */
export async function runRefreshCacheTask(studentId: string) {
  try {
    const [profile, history] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: studentId } }),
      prisma.chatSession.findMany({ where: { studentId }, take: 5, orderBy: { updatedAt: 'desc' } }),
    ]);

    const redis = await getRedisClient();
    if (redis) {
      await redis.set(`profile:${studentId}`, JSON.stringify(profile));
      await redis.expire(`profile:${studentId}`, 43200); // 12 hours
      await redis.set(`session:history:${studentId}`, JSON.stringify(history));
      await redis.expire(`session:history:${studentId}`, 43200);
      logger.info({ studentId }, '[Task] Cache refreshed');
    }
  } catch (error) {
    logger.error({ studentId, error: String(error) }, '[Task] Cache refresh failed');
  }
}

/**
 * Runs personalization analysis in the background.
 */
export async function runPersonalizationTask(studentId: string, userMessage: string, aiResponse: string) {
  try {
    await analyzeAndTrackProgress(studentId, userMessage, aiResponse);
    logger.info({ studentId }, '[Task] Personalization processed');
  } catch (error) {
    logger.error({ studentId, error: String(error) }, '[Task] Personalization task failed');
  }
}

logger.info('[Workers] Background tasks initialized.');
