import { OpenAI } from 'openai';
import prisma from '../utils/prismaClient';
import { getRedisClient } from './redis';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AnalysisResult {
  type: 'progress' | 'mistake' | 'neutral';
  topic: string;
  details: string; // The specific error or the concept mastered
  confidenceScore: number; // 0-100
  suggestedMasteryLevel?: 'Beginner' | 'Developing' | 'Mastered'; 
  isRecurringWeakness?: boolean; // NEW: Flag for persistent struggle
}

export async function analyzeAndTrackProgress(studentId: string, userMessage: string, aiResponse: string) {
  try {
    const analysis = await analyzeInteraction(userMessage, aiResponse);

    if (analysis.type === 'neutral' || analysis.confidenceScore < 70) return;

    console.log(`[Personalization] Tracking ${analysis.type} for ${studentId}: ${analysis.topic}`);

    // --- PROGRESS LOGIC ---
    if (analysis.type === 'progress') {
      const existingProgress = await prisma.progress.findFirst({
        where: { studentId, topic: analysis.topic }
      });

      let currentMastery = existingProgress ? existingProgress.mastery : 0;
      let masteryIncrement = 0;

      if (analysis.suggestedMasteryLevel === 'Mastered') masteryIncrement = 15;
      else if (analysis.suggestedMasteryLevel === 'Developing') masteryIncrement = 10;
      else masteryIncrement = 5;

      // If they show progress in a known weakness area, boost confidence but keep it "Developing" first
      // This prevents "fake mastery" where they get it right once after failing 5 times.
      if (existingProgress && existingProgress.mastery < 30) {
          masteryIncrement = Math.min(masteryIncrement, 10); // Cap jump if previously weak
      }

      let newMastery = Math.min(currentMastery + masteryIncrement, 100);

      await prisma.progress.upsert({
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
          await prisma.mistake.deleteMany({
              where: { studentId, topic: analysis.topic }
          });
      }

    // --- MISTAKE & WEAKNESS LOGIC ---
    } else if (analysis.type === 'mistake') {
      
      // Check if this is a recurring struggle
      const existingMistake = await prisma.mistake.findFirst({
          where: { studentId, topic: analysis.topic }
      });

      if (existingMistake) {
          // RECURRING WEAKNESS: Increment attempts to signal persistence
          await prisma.mistake.update({
              where: { id: existingMistake.id },
              data: { 
                  attempts: { increment: 1 }, 
                  error: analysis.details // Update with latest specific struggle
              }
          });
          
          // SIGNIFICANT REGRESSION: If they keep failing, lower their mastery score
          const existingProgress = await prisma.progress.findFirst({ where: { studentId, topic: analysis.topic } });
          if (existingProgress) {
              await prisma.progress.update({
                  where: { id: existingProgress.id },
                  data: { mastery: Math.max(existingProgress.mastery - 10, 0) } // Penalty for recurring error
              });
          }

      } else {
          // NEW WEAKNESS
          await prisma.mistake.create({
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
    const redis = await getRedisClient();
    if (redis) {
      await redis.del(`memory:${studentId}`);
    }

  } catch (error) {
    console.error('[Personalization] Engine Error:', error);
  }
}

async function analyzeInteraction(userMsg: string, aiMsg: string): Promise<AnalysisResult> {
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
    if (!content) return { type: 'neutral', topic: '', details: '', confidenceScore: 0 };
    
    return JSON.parse(content) as AnalysisResult;
  } catch (e) {
    console.error('LLM Analysis Failed', e);
    return { type: 'neutral', topic: '', details: '', confidenceScore: 0 };
  }
}