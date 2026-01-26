import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { ai } from '../genkit';
import { GUARDIAN_SANITIZE } from '../tools/handlers';
/* ======================================================
   1. STRICT TEACHING PERSONA (MICRO-LEARNING)
====================================================== */
const teachingSystemPrompt = `
SYSTEM ROLE: ELITE PRIVATE TUTOR

You are STEADFAST, a warm, professional Kenyan teacher.
You teach students from elite backgrounds who expect clarity, precision, and a step-by-step approach.

**YOUR TEACHING METHOD (MICRO-LEARNING):**
1. **ONE IDEA PER TURN:** Never explain a whole topic at once. Teach one layer, check understanding, then move deeper.
2. **ADAPTABILITY:** 
   - If the student understands (says "Yes", "Okay", "Go on"): Move to the next concept (e.g., "Great! Now let's look at the two types...").
   - If the student is confused: Simplify. Use a relatable Kenyan analogy (e.g., farming, business).
3. **TONE:** Professional, encouraging, and never patronizing.
4. **NO LABELS:** Speak naturally. Never say "Guiding Question:".
5. **NO META-TALK:** Never mention sources or AI limitations.

**GREETING RULE:**
- If the user says "hi/hello", generate a UNIQUE, classy, warm greeting. Never repeat "Hello! How can I assist you...".
`;
/* ======================================================
   2. SCHEMAS
====================================================== */
const InputSchema = z.object({
    query: z.string(),
    chatHistory: z.array(z.object({ role: z.string(), content: z.string() })).optional().default([]),
    lastSearchTopic: z.string().optional(),
    searchResultSummary: z.string().optional(),
    awaitingPracticeQuestion: z.boolean().default(false),
    awaitingPracticeAnswer: z.boolean().default(false),
    correctAnswers: z.array(z.string()).optional(),
    attempts: z.number().default(0),
    forceWebSearch: z.boolean().default(false).optional(),
});
const OutputSchema = z.object({
    response: z.string(),
    awaitingPracticeQuestion: z.boolean().optional(),
    awaitingPracticeAnswer: z.boolean().optional(),
    correctAnswers: z.array(z.string()).optional(),
    attempts: z.number().optional(),
    lastSearchTopic: z.string().optional(),
    searchResultSummary: z.string().optional(),
});
function clean(text) { return text.replace(/\s+/g, ' ').trim(); }
/* ======================================================
   4. PRACTICE QUESTION GENERATOR
====================================================== */
async function generatePracticeQuestion(topic) {
    const prompt = `Topic: "${topic}". Generate 1 simple practice question and answer. Format: QUESTION: ... ANSWERS: a,b`;
    const res = await ai.generate({ model: 'openai/gpt-4o', prompt });
    const qMatch = res.text.match(/QUESTION:\s*(.*)/);
    const aMatch = res.text.match(/ANSWERS:\s*(.*)/);
    return {
        question: qMatch?.[1] ?? `What is a key fact about ${topic}?`,
        answers: aMatch ? aMatch[1].split(',').map(a => a.trim().toLowerCase()) : [],
    };
}
/* ======================================================
   FLOW IMPLEMENTATION
====================================================== */
export const webSearchFlow = defineFlow({
    name: 'webSearchFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
}, async (input) => {
    const { query, chatHistory, searchResultSummary, awaitingPracticeQuestion, awaitingPracticeAnswer, correctAnswers = [], attempts } = input;
    // 1. TEACH NEW CONTENT (INITIAL RESEARCH)
    if (searchResultSummary && !awaitingPracticeQuestion && !awaitingPracticeAnswer) {
        const prompt = `
      Verified Fact: "${searchResultSummary}"
      
      TASK: Teach this concept.
      - **10% Rule:** Teach only the definition. No deep details yet.
      - **Length:** 3-5 sentences.
      - End with a natural checking question.
      `;
        const res = await ai.generate({ model: 'openai/gpt-4o', prompt: `${teachingSystemPrompt}\n${prompt}` });
        return {
            response: await GUARDIAN_SANITIZE(clean(res.text)),
            awaitingPracticeQuestion: true,
            lastSearchTopic: input.lastSearchTopic,
            searchResultSummary,
        };
    }
    // 2. PRACTICE CONFIRMATION
    if (awaitingPracticeQuestion) {
        if (/^(yes|ok|sure|go on|teach me|continue)/i.test(query)) {
            const pq = await generatePracticeQuestion(input.lastSearchTopic || 'this topic');
            return {
                response: await GUARDIAN_SANITIZE(clean(pq.question)),
                awaitingPracticeQuestion: false,
                awaitingPracticeAnswer: true,
                correctAnswers: pq.answers,
                attempts: 0,
                lastSearchTopic: input.lastSearchTopic,
                searchResultSummary,
            };
        }
        // If student says "I don't understand" or similar
        const prompt = `Student said: "${query}". They might be confused or want to move on. Respond helpfully. If confused, simplify the previous concept.`;
        const res = await ai.generate({ model: 'openai/gpt-4o', prompt: `${teachingSystemPrompt}\n${prompt}` });
        return { response: await GUARDIAN_SANITIZE(clean(res.text)), awaitingPracticeQuestion: false };
    }
    // 3. ANSWER VALIDATION
    if (awaitingPracticeAnswer) {
        const normalized = query.toLowerCase();
        const isCorrect = correctAnswers.some(a => normalized.includes(a));
        if (isCorrect) {
            const res = await ai.generate({ model: 'openai/gpt-4o', prompt: `${teachingSystemPrompt} Student correct. Briefly explain why. Ask if ready for next concept.` });
            return { response: await GUARDIAN_SANITIZE(clean(res.text)), awaitingPracticeAnswer: false };
        }
        if (attempts >= 2) {
            return { response: await GUARDIAN_SANITIZE('Good effort. Let me explain simply.'), awaitingPracticeAnswer: false, lastSearchTopic: input.lastSearchTopic };
        }
        return { response: await GUARDIAN_SANITIZE('Almost. Try again.'), awaitingPracticeAnswer: true, attempts: attempts + 1, correctAnswers };
    }
    // 4. FALLBACK / CHAT LOGIC (THE "BRAIN" FOR YES/NO)
    const recentHistory = chatHistory.slice(-4).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const fallbackResponse = await ai.generate({
        model: 'openai/gpt-4o',
        prompt: `${teachingSystemPrompt}
       
       ACTIVE TOPIC: "${input.lastSearchTopic || 'General Chat'}"
       RECENT HISTORY:
       ${recentHistory}
       
       STUDENT INPUT: "${query}"
       
       TASK:
       - If Input is "Yes/Okay/Go on": TEACH THE NEXT CONCEPT related to "${input.lastSearchTopic}". Do not define "Yes".
       - If Input is "No/Confused": Explain the PREVIOUS concept simpler.
       - If greeting: Warm, unique greeting.
       - NO LABELS.
       `
    });
    return { response: await GUARDIAN_SANITIZE(clean(fallbackResponse.text)) };
});
//# sourceMappingURL=web_search_flow.js.map