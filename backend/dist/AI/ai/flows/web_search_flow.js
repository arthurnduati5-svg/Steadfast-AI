"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSearchFlow = void 0;
const flow_1 = require("@genkit-ai/flow");
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
const handlers_1 = require("../tools/handlers");
const flow_singleton_1 = require("./flow-singleton");
const teachingSystemPrompt = `
SYSTEM ROLE: ELITE PRIVATE TUTOR

You are STEADFAST, a warm, professional tutor.
Teach one small step at a time and check understanding before moving on.

RULES:
1. Keep answers concise and student-friendly.
2. Explain one concept layer at a time.
3. End with one short checking question when teaching.
4. No meta-talk about tools or system limits.
5. No markdown labels.
`;
const InputSchema = zod_1.z.object({
    query: zod_1.z.string(),
    chatHistory: zod_1.z.array(zod_1.z.object({ role: zod_1.z.string(), content: zod_1.z.string() })).optional().default([]),
    lastSearchTopic: zod_1.z.string().optional(),
    searchResultSummary: zod_1.z.string().optional(),
    awaitingPracticeQuestion: zod_1.z.boolean().default(false),
    awaitingPracticeAnswer: zod_1.z.boolean().default(false),
    correctAnswers: zod_1.z.array(zod_1.z.string()).optional(),
    attempts: zod_1.z.number().default(0),
    forceWebSearch: zod_1.z.boolean().default(false).optional(),
    gradeHint: zod_1.z.enum(['Primary', 'LowerSecondary', 'UpperSecondary']).optional(),
});
const OutputSchema = zod_1.z.object({
    response: zod_1.z.string(),
    awaitingPracticeQuestion: zod_1.z.boolean().optional(),
    awaitingPracticeAnswer: zod_1.z.boolean().optional(),
    correctAnswers: zod_1.z.array(zod_1.z.string()).optional(),
    attempts: zod_1.z.number().optional(),
    lastSearchTopic: zod_1.z.string().optional(),
    searchResultSummary: zod_1.z.string().optional(),
});
const PracticePayloadSchema = zod_1.z.object({
    question: zod_1.z.string().min(4),
    answers: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(5),
});
function clean(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
}
function normalizeAnswer(value) {
    return clean(value.toLowerCase().replace(/[^\w\s./-]/g, ' '));
}
function uniqAnswers(values) {
    const out = [];
    const seen = new Set();
    for (const value of values) {
        const normalized = normalizeAnswer(value);
        if (!normalized || seen.has(normalized))
            continue;
        seen.add(normalized);
        out.push(normalized);
    }
    return out;
}
function looksAffirmative(text) {
    return /^(yes|ok|okay|sure|go on|teach me|continue|ready|lets try|let's try)\b/i.test(text.trim());
}
function looksConfused(text) {
    return /\b(confused|not sure|don't understand|do not understand|lost|hard)\b/i.test(text);
}
function includesWord(haystack, needle) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i').test(haystack);
}
function isPracticeAnswerCorrect(studentAnswer, acceptedAnswers) {
    const normalizedStudent = normalizeAnswer(studentAnswer);
    if (!normalizedStudent)
        return false;
    return acceptedAnswers.some((answer) => {
        const normalizedExpected = normalizeAnswer(answer);
        if (!normalizedExpected)
            return false;
        if (normalizedStudent === normalizedExpected)
            return true;
        if (normalizedStudent.includes(normalizedExpected))
            return true;
        return includesWord(normalizedStudent, normalizedExpected);
    });
}
async function generatePracticeQuestion(topic, gradeHint) {
    const prompt = `
Topic: "${topic}"
Grade band: "${gradeHint || 'General'}"

Create one short formative check question.
Return strict JSON only:
{"question":"...","answers":["...","..."]}

Rules:
- Question must be answerable in one line.
- Answers should include acceptable variants (max 3).
- Keep language age-appropriate for the grade band.
`;
    try {
        const response = await genkit_1.ai.generate({
            model: 'openai/gpt-4o-mini',
            prompt,
            output: { format: 'json' },
        });
        const parsed = PracticePayloadSchema.safeParse(response.output);
        if (parsed.success) {
            return {
                question: clean(parsed.data.question),
                answers: uniqAnswers(parsed.data.answers),
            };
        }
    }
    catch {
        // Fall back to deterministic defaults below.
    }
    return {
        question: `In one sentence, what is the main idea of ${topic}?`,
        answers: uniqAnswers([topic, 'main idea']),
    };
}
async function generateTeachingTurn(query, opts) {
    const prompt = `
${teachingSystemPrompt}

Student question: "${query}"
Active topic: "${opts.topic || 'general'}"
Grade band: "${opts.gradeHint || 'General'}"
Verified context: "${opts.summary || 'none'}"
Simplify mode: ${opts.simplify ? 'true' : 'false'}

TASK:
- If verified context exists, use it as the anchor.
- Teach one key idea only.
- Use 3-5 sentences.
- End with one short checking question.
`;
    const result = await genkit_1.ai.generate({ model: 'openai/gpt-4o-mini', prompt });
    return (0, handlers_1.GUARDIAN_SANITIZE)(clean(result.text), opts.topic);
}
exports.webSearchFlow = (0, flow_singleton_1.getOrCreateFlow)('webSearchFlow', () => (0, flow_1.defineFlow)({
    name: 'webSearchFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
}, async (input) => {
    const { query, chatHistory, searchResultSummary, awaitingPracticeQuestion, awaitingPracticeAnswer, correctAnswers = [], attempts, gradeHint, } = input;
    if (searchResultSummary && !awaitingPracticeQuestion && !awaitingPracticeAnswer) {
        const response = await generateTeachingTurn(query, {
            topic: input.lastSearchTopic,
            summary: searchResultSummary,
            gradeHint,
        });
        return {
            response,
            awaitingPracticeQuestion: true,
            lastSearchTopic: input.lastSearchTopic || query,
            searchResultSummary,
        };
    }
    if (awaitingPracticeQuestion) {
        if (looksAffirmative(query)) {
            const topic = input.lastSearchTopic || 'this topic';
            const practice = await generatePracticeQuestion(topic, gradeHint);
            return {
                response: await (0, handlers_1.GUARDIAN_SANITIZE)(clean(practice.question), topic),
                awaitingPracticeQuestion: false,
                awaitingPracticeAnswer: true,
                correctAnswers: practice.answers,
                attempts: 0,
                lastSearchTopic: topic,
                searchResultSummary,
            };
        }
        const response = await generateTeachingTurn(query, {
            topic: input.lastSearchTopic,
            summary: searchResultSummary,
            gradeHint,
            simplify: looksConfused(query),
        });
        return {
            response,
            awaitingPracticeQuestion: true,
            lastSearchTopic: input.lastSearchTopic,
            searchResultSummary,
        };
    }
    if (awaitingPracticeAnswer) {
        const normalizedAnswers = uniqAnswers(correctAnswers);
        const isCorrect = isPracticeAnswerCorrect(query, normalizedAnswers);
        if (isCorrect) {
            const topic = input.lastSearchTopic || 'this concept';
            const response = await generateTeachingTurn('Student answered correctly', {
                topic,
                summary: searchResultSummary,
                gradeHint,
            });
            return {
                response,
                awaitingPracticeAnswer: false,
                awaitingPracticeQuestion: false,
                attempts: 0,
                lastSearchTopic: topic,
            };
        }
        if (attempts >= 2) {
            const response = await generateTeachingTurn(query, {
                topic: input.lastSearchTopic,
                summary: searchResultSummary,
                gradeHint,
                simplify: true,
            });
            return {
                response,
                awaitingPracticeAnswer: false,
                attempts: 0,
                lastSearchTopic: input.lastSearchTopic,
            };
        }
        return {
            response: await (0, handlers_1.GUARDIAN_SANITIZE)('Close. Try once more in one short sentence.'),
            awaitingPracticeAnswer: true,
            attempts: attempts + 1,
            correctAnswers: normalizedAnswers,
            lastSearchTopic: input.lastSearchTopic,
        };
    }
    const recentHistory = chatHistory
        .slice(-6)
        .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
        .join('\n');
    const fallbackPrompt = `
${teachingSystemPrompt}

Active topic: "${input.lastSearchTopic || 'General Chat'}"
Recent history:
${recentHistory}

Student input: "${query}"

Rules:
- If student says yes/continue, move to the next small layer on the active topic.
- If student sounds confused, simplify.
- Keep it concise and end with one checking question.
`;
    const fallback = await genkit_1.ai.generate({ model: 'openai/gpt-4o-mini', prompt: fallbackPrompt });
    return {
        response: await (0, handlers_1.GUARDIAN_SANITIZE)(clean(fallback.text), input.lastSearchTopic),
    };
}));
//# sourceMappingURL=web_search_flow.js.map