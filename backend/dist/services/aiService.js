"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.getEmbedding = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const redis_1 = __importDefault(require("../lib/redis")); // Changed import to redisClient
const pinecone_1 = __importDefault(require("../lib/pinecone"));
const buildProfileSummary_1 = require("../utils/buildProfileSummary");
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
const getEmbedding = async (text) => {
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
    });
    return response.data[0].embedding;
};
exports.getEmbedding = getEmbedding;
exports.aiService = {
    chat: async ({ studentId, message, topic }) => {
        const studentProfile = await prisma_1.default.studentProfile.findUnique({
            where: { userId: studentId },
            include: { progress: true, mistakes: true, chatSessions: { take: 1, orderBy: { createdAt: 'desc' } } },
        });
        if (!studentProfile) {
            throw new Error('Student profile not found');
        }
        const redisKey = `session:${studentId}`;
        // 1. Retrieve cached context from Redis (last 5 turns)
        let recentChatHistory = [];
        if (redis_1.default) {
            const cachedContext = await redis_1.default.lrange(redisKey, 0, 4);
            recentChatHistory = cachedContext.map(item => JSON.parse(item));
        }
        else {
            console.warn('Redis client not available. Skipping cached context retrieval.');
        }
        // 2. Retrieve long-term context from Pinecone (semantic similarity search)
        let pineconeContext = []; // Use inferred ChatMessage type
        if (topic) {
            const messageEmbedding = await (0, exports.getEmbedding)(message);
            if (pinecone_1.default) {
                const index = pinecone_1.default.index(`student-${studentId}`);
                const queryResponse = await index.query({
                    vector: messageEmbedding,
                    topK: 5,
                    filter: { topic: { '$eq': topic } },
                });
                const chatMessageIds = queryResponse.matches.map((match) => match.id);
                if (chatMessageIds.length > 0) {
                    pineconeContext = await prisma_1.default.chatMessage.findMany({
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
        const recentMistakes = await prisma_1.default.mistake.findMany({
            where: { studentId },
            orderBy: { lastSeen: 'desc' },
            take: 5,
        });
        const studentProgress = await prisma_1.default.progress.findMany({
            where: { studentId },
            orderBy: { updatedAt: 'desc' },
            take: 5,
        });
        // 4. Build AI system instructions and context
        const profileSummary = (0, buildProfileSummary_1.buildProfileSummary)(studentProfile);
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
            chatSession = await prisma_1.default.chatSession.create({
                data: {
                    studentId: studentId,
                    topic: topic,
                    isActive: true,
                },
            });
        }
        const newMessage = await prisma_1.default.chatMessage.create({
            data: {
                sessionId: chatSession.id,
                role: 'user',
                content: message,
                messageNumber: recentChatHistory.length + 1,
            },
        });
        const newAIResponse = await prisma_1.default.chatMessage.create({
            data: {
                sessionId: chatSession.id,
                role: 'assistant',
                content: aiResponse,
                messageNumber: recentChatHistory.length + 2,
            },
        });
        // 7. Store embeddings of the new conversation in Pinecone.
        const conversationEmbedding = await (0, exports.getEmbedding)(`${message} ${aiResponse}`);
        if (pinecone_1.default) {
            const index = pinecone_1.default.index(`student-${studentId}`);
            await index.upsert([
                {
                    id: newMessage.id,
                    values: await (0, exports.getEmbedding)(newMessage.content),
                    metadata: { studentId: studentId, topic: chatSession.topic || '', role: 'user' },
                },
                {
                    id: newAIResponse.id,
                    values: await (0, exports.getEmbedding)(newAIResponse.content),
                    metadata: { studentId: studentId, topic: chatSession.topic || '', role: 'assistant' },
                },
            ]);
        }
        else {
            console.warn('Pinecone client not available. Skipping Pinecone embeddings update.');
        }
        // 8. Update Redis cache for fast follow-up responses.
        if (redis_1.default) {
            await redis_1.default.lpush(redisKey, JSON.stringify({ role: 'assistant', content: aiResponse }));
            await redis_1.default.lpush(redisKey, JSON.stringify({ role: 'user', content: message }));
            await redis_1.default.ltrim(redisKey, 0, 9); // Keep last 10 messages (5 turns)
            await redis_1.default.expire(redisKey, 3600); // Expire after 1 hour of inactivity
        }
        else {
            console.warn('Redis client not available. Skipping Redis cache update.');
        }
        return { response: aiResponse };
    },
    // TODO: Implement other AI adaptive logic here (e.g., reinforcing weak topics)
};
//# sourceMappingURL=aiService.js.map