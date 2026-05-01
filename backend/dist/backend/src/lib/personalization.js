"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeAndTrackProgress = analyzeAndTrackProgress;
const openai_1 = require("openai");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const redis_1 = require("./redis");
const logger_1 = require("../utils/logger");
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function analyzeAndTrackProgress(studentId, userMessage, aiResponse) {
    try {
        const analysis = await analyzeInteraction(userMessage, aiResponse);
        if (analysis.type === 'neutral' || analysis.confidenceScore < 70)
            return;
        logger_1.logger.info({ type: analysis.type, studentId, topic: analysis.topic }, '[Personalization] Tracking interaction');
        // --- PROGRESS LOGIC ---
        if (analysis.type === 'progress') {
            const existingProgress = await prismaClient_1.default.progress.findFirst({
                where: { studentId, topic: analysis.topic }
            });
            let currentMastery = existingProgress ? existingProgress.mastery : 0;
            let masteryIncrement = 0;
            if (analysis.suggestedMasteryLevel === 'Mastered')
                masteryIncrement = 15;
            else if (analysis.suggestedMasteryLevel === 'Developing')
                masteryIncrement = 10;
            else
                masteryIncrement = 5;
            // If they show progress in a known weakness area, boost confidence but keep it "Developing" first
            // This prevents "fake mastery" where they get it right once after failing 5 times.
            if (existingProgress && existingProgress.mastery < 30) {
                masteryIncrement = Math.min(masteryIncrement, 10); // Cap jump if previously weak
            }
            let newMastery = Math.min(currentMastery + masteryIncrement, 100);
            await prismaClient_1.default.progress.upsert({
                where: { id: existingProgress?.id || `new-${Date.now()}` },
                update: { mastery: newMastery }, // REMOVED lastReviewed
                create: {
                    studentId,
                    subject: 'General',
                    topic: analysis.topic,
                    mastery: masteryIncrement,
                    // REMOVED lastReviewed
                }
            });
            // If they mastered a topic that was a mistake record, we can optionally resolve/delete the mistake
            if (newMastery > 80) {
                await prismaClient_1.default.mistake.deleteMany({
                    where: { studentId, topic: analysis.topic }
                });
            }
            // --- MISTAKE & WEAKNESS LOGIC ---
        }
        else if (analysis.type === 'mistake') {
            // Check if this is a recurring struggle
            const existingMistake = await prismaClient_1.default.mistake.findFirst({
                where: { studentId, topic: analysis.topic }
            });
            if (existingMistake) {
                // RECURRING WEAKNESS: Increment attempts to signal persistence
                await prismaClient_1.default.mistake.update({
                    where: { id: existingMistake.id },
                    data: {
                        attempts: { increment: 1 },
                        error: analysis.details // Update with latest specific struggle
                    }
                });
                // SIGNIFICANT REGRESSION: If they keep failing, lower their mastery score
                const existingProgress = await prismaClient_1.default.progress.findFirst({ where: { studentId, topic: analysis.topic } });
                if (existingProgress) {
                    await prismaClient_1.default.progress.update({
                        where: { id: existingProgress.id },
                        data: { mastery: Math.max(existingProgress.mastery - 10, 0) } // Penalty for recurring error
                    });
                }
            }
            else {
                // NEW WEAKNESS
                await prismaClient_1.default.mistake.create({
                    data: {
                        studentId,
                        topic: analysis.topic,
                        error: analysis.details,
                        attempts: 1
                    }
                });
            }
        }
        // 3. Invalidate Redis Cache
        const redis = await (0, redis_1.getRedisClient)();
        if (redis) {
            await redis.del(`memory:${studentId}`);
        }
    }
    catch (error) {
        logger_1.logger.error({ studentId, error: String(error) }, '[Personalization] Engine Error');
    }
}
async function analyzeInteraction(userMsg, aiMsg) {
    const systemPrompt = `
    You are an expert educational analyst. Analyze the student's latest message.

    Tasks:
    1. Identify the specific micro-topic (e.g. "Fractions").
    2. Determine Performance:
       - **PROGRESS**: Answered correctly / understood concept.
       - **MISTAKE**: Wrong answer / confusion.
       - **NEUTRAL**: Chat/Greeting.
    3. If PROGRESS, estimate Mastery (Beginner/Developing/Mastered).
    4. If MISTAKE, check for **Recurring Weakness indicators**:
       - Does the student say "I still don't get it", "I forgot", or repeat a previous error?
       - If yes, flag 'isRecurringWeakness' as true.

    Return JSON:
    {
      "type": "progress" | "mistake" | "neutral",
      "topic": "Micro-Topic Name",
      "details": "Summary of the specific struggle or success",
      "confidenceScore": 0-100,
      "suggestedMasteryLevel": "Beginner" | "Developing" | "Mastered" (null if mistake),
      "isRecurringWeakness": boolean
    }
  `;
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Student: "${userMsg}"\nAI Teacher: "${aiMsg}"` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
        });
        const content = completion.choices[0].message.content;
        if (!content)
            return { type: 'neutral', topic: '', details: '', confidenceScore: 0 };
        return JSON.parse(content);
    }
    catch (e) {
        logger_1.logger.error({ error: String(e) }, 'LLM Analysis Failed');
        return { type: 'neutral', topic: '', details: '', confidenceScore: 0 };
    }
}
//# sourceMappingURL=personalization.js.map