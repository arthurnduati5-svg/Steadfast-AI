import prisma from '../lib/prisma';
import { getRedisClient } from '../lib/redis'; // Corrected import
import pinecone from '../lib/pinecone';
import { buildProfileSummary } from '../utils/buildProfileSummary';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const getEmbedding = async (text) => {
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
    });
    return response.data[0].embedding;
};
export const aiService = {
    chat: async ({ studentId, message, topic }) => {
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: studentId },
            include: { progress: true, mistakes: true, chatSessions: { take: 1, orderBy: { createdAt: 'desc' } } },
        });
        if (!studentProfile) {
            throw new Error('Student profile not found');
        }
        const redisKey = `session:${studentId}`;
        // 1. Retrieve cached context from Redis (last 5 turns)
        let recentChatHistory = [];
        const redis = await getRedisClient();
        if (redis) {
            try {
                const cachedContext = await redis.lRange(redisKey, 0, 4);
                recentChatHistory = cachedContext.map((item) => JSON.parse(item));
            }
            catch (error) {
                console.warn('Redis client available but error during context retrieval.', error);
            }
        }
        else {
            console.warn('Redis client not available for chat context retrieval.');
        }
        // 2. Retrieve long-term context from Pinecone (semantic similarity search)
        let pineconeContext = []; // Use inferred ChatMessage type
        if (topic) {
            const messageEmbedding = await getEmbedding(message);
            if (pinecone) {
                const index = pinecone.index(`student-${studentId}`);
                const queryResponse = await index.query({
                    vector: messageEmbedding,
                    topK: 5,
                    filter: { topic: { '$eq': topic } },
                });
                const chatMessageIds = queryResponse.matches.map((match) => match.id);
                if (chatMessageIds.length > 0) {
                    pineconeContext = await prisma.chatMessage.findMany({
                        where: { id: { in: chatMessageIds } },
                        orderBy: { timestamp: 'asc' },
                    });
                }
            }
            else {
                console.warn('Pinecone client not available. Skipping Pinecone context retrieval.');
            }
        }
        // 3. Fetch recent mistakes and progress from PostgreSQL.
        const recentMistakes = await prisma.mistake.findMany({
            where: { studentId },
            orderBy: { lastSeen: 'desc' },
            take: 5,
        });
        const studentProgress = await prisma.progress.findMany({
            where: { studentId },
            orderBy: { updatedAt: 'desc' },
            take: 5,
        });
        // 4. Build AI system instructions and context
        const profileSummary = buildProfileSummary(studentProfile);
        let systemPrompt = `You are Steadfast Copilot, an AI tutor for student ${studentProfile.name || ''}. `;
        systemPrompt += `You adapt to their behavior, learning pace, and interests. `;
        systemPrompt += `Here\'s what I know about the student: ${profileSummary}. `;
        if (recentMistakes.length > 0) {
            systemPrompt += `\nRecent mistakes to focus on: ${recentMistakes.map((m) => m?.error).join(', ')}. `;
        }
        if (studentProgress.length > 0) {
            systemPrompt += `\nStudent\'s recent progress: ${studentProgress.map((p) => `${p?.subject} - ${p?.topic}: Mastery ${p?.mastery}`).join('; ')}. `;
        }
        if (pineconeContext.length > 0) {
            systemPrompt += `\nRelevant past discussions: ${pineconeContext.map((m) => m?.content).join('\n')}. `;
        }
        ;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...recentChatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: message },
        ];
        // 5. Generate AI response using OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
        });
        const aiResponse = completion.choices[0].message?.content || 'I am sorry, I could not generate a response.';
        // 6. Save response + student message to PostgreSQL.
        let chatSession = studentProfile.chatSessions[0];
        if (!chatSession || !chatSession.isActive || (topic && chatSession.topic !== topic)) {
            chatSession = await prisma.chatSession.create({
                data: {
                    studentId: studentId,
                    topic: topic,
                    isActive: true,
                },
            });
        }
        const newMessage = await prisma.chatMessage.create({
            data: {
                sessionId: chatSession.id,
                role: 'user',
                content: message,
                messageNumber: recentChatHistory.length + 1,
            },
        });
        const newAIResponse = await prisma.chatMessage.create({
            data: {
                sessionId: chatSession.id,
                role: 'assistant',
                content: aiResponse,
                messageNumber: recentChatHistory.length + 2,
            },
        });
        // 7. Store embeddings of the new conversation in Pinecone.
        const conversationEmbedding = await getEmbedding(`${message} ${aiResponse}`);
        if (pinecone) {
            const index = pinecone.index(`student-${studentId}`);
            await index.upsert([
                {
                    id: newMessage.id,
                    values: await getEmbedding(newMessage.content),
                    metadata: { studentId: studentId, topic: chatSession.topic || '', role: 'user' },
                },
                {
                    id: newAIResponse.id,
                    values: await getEmbedding(newAIResponse.content),
                    metadata: { studentId: studentId, topic: chatSession.topic || '', role: 'assistant' },
                },
            ]);
        }
        else {
            console.warn('Pinecone client not available. Skipping Pinecone embeddings update.');
        }
        // 8. Update Redis cache for fast follow-up responses.
        if (redis) {
            try {
                await redis.lPush(redisKey, JSON.stringify({ role: 'assistant', content: aiResponse }));
                await redis.lPush(redisKey, JSON.stringify({ role: 'user', content: message }));
                await redis.lTrim(redisKey, 0, 9); // Keep last 10 messages (5 turns)
                await redis.expire(redisKey, 3600); // Expire after 1 hour of inactivity
            }
            catch (error) {
                console.warn('Redis client available but error during context update.', error);
            }
        }
        else {
            console.warn('Redis client not available for chat context update.');
        }
        return { response: aiResponse };
    },
    // TODO: Implement other AI adaptive logic here (e.g., reinforcing weak topics)
};
//# sourceMappingURL=aiService.js.map