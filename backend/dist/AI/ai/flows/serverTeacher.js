'use server';
/**
 * serverTeacher.ts
 *
 * FINAL STUDENT-FACING TEXT GENERATOR
 * ---------------------------------------------------
 * - Uses LLM ONLY for structured ideas (never raw text)
 * - Assembles final student-safe plain-text on server
 * - Strict sanitation: no markdown, no LaTeX, no symbols
 * - Uses your existing toolRouter + polisher chain
 */
// export const runtime = 'edge';
import { z } from 'genkit';
import { toolRouter } from '../tools/handlers';
// -------------------------------
// Input & Output Schemas
// -------------------------------
export const TeacherInputSchema = z.object({
    text: z.string(),
    state: z
        .object({
        awaitingPracticeQuestionAnswer: z.boolean().default(false),
        validationAttemptCount: z.number().default(0),
        correctAnswers: z.array(z.string()).default([]),
        lastQuestionAsked: z.string().optional(),
        lastTopic: z.string().optional(),
        studentLevel: z.string().optional(),
        adaptMode: z.string().default('normal'),
    })
        .optional(),
    // preferences is REQUIRED in your actual pipeline
    preferences: z
        .object({
        userId: z.string(),
        preferredLanguage: z.string(),
        interests: z.array(z.string()),
    })
        .optional(),
});
export const TeacherOutputSchema = z.object({
    text: z.string(),
    state: TeacherInputSchema.shape.state,
});
// --------------------------------------
// LAST RESORT SERVER SANITIZER
// Ensures no markdown/latex leaks
// --------------------------------------
function sanitizeHard(s) {
    if (!s)
        return '';
    // Remove latex \(...\), \[...\], \frac{}, etc
    s = s.replace(/\\\(|\\\)|\\\[|\\\]|\\[a-zA-Z]+\{.*?\}/g, '');
    // Remove math mode $...$
    s = s.replace(/\$+[^$]*\$+/g, '');
    // Remove markdown bullets/headings
    s = s.replace(/^\s*[-*+]\s+/gm, '');
    s = s.replace(/^#{1,6}\s*/gm, '');
    // Remove inline code ```
    s = s.replace(/`{1,3}.*?`{1,3}/g, '');
    // Remove remaining markdown symbols
    s = s.replace(/[\\`*_{}\[\]\$]/g, '');
    // Enforce one question mark
    if ((s.match(/\?/g) || []).length > 1) {
        const last = s.lastIndexOf('?');
        s = s.substring(0, last).replace(/\?/g, '.') + s.substring(last);
    }
    return s.trim();
}
// ----------------------------------------
// The FINAL teacher engine
// ----------------------------------------
export default async function serverTeacher(input) {
    let state = input.state ??
        {
            awaitingPracticeQuestionAnswer: false,
            validationAttemptCount: 0,
            correctAnswers: [],
            adaptMode: 'normal',
        };
    const studentLang = input.preferences?.preferredLanguage || 'english';
    const userMsg = input.text.trim();
    // -----------------------
    // 1. EMOTIONAL & TONE ANALYSIS (Persona Layer)
    // -----------------------
    // First, we check how the student is feeling
    const decoderResult = await toolRouter('emotional_decoder', { text: userMsg });
    const toneResult = await toolRouter('tone_generator', { emotion: decoderResult.emotion });
    // If it's a safety violation or an insult, we use the specific persona response immediately
    if (decoderResult.emotion === 'safety_violation' || decoderResult.emotion === 'angry_insult') {
        let response = toneResult.raw;
        response = sanitizeHard(response);
        return { text: response, state };
    }
    // -----------------------
    // 2. TEACHING CONTENT (Logic Layer)
    // -----------------------
    const structured = await toolRouter('teaching_micro_step', {
        topic: userMsg,
        studentLevel: state.studentLevel || 'beginner',
        context: userMsg,
        adaptMode: state.adaptMode === 'challenge',
    });
    // Assemble the parts based on handlers.ts return structure
    const tonePrefix = toneResult.hintPrefix || 'Let us look at this together.';
    const microIdea = structured.microIdea || 'Here is a simple way to think about it.';
    const example = structured.example || '';
    const question = structured.question || 'Does that make sense so far?';
    // -----------------------
    // 3. ASSEMBLE SERVER TEXT
    // -----------------------
    // We combine the Teacher's Emotional Response + The Lesson + The Question
    const draft = `${tonePrefix} ${microIdea} ${example} ${question.endsWith('?') ? question : question + '?'}`;
    // -----------------------
    // 4. POLISHER CHAIN (Enforcement Layer)
    // -----------------------
    let polished = draft;
    // Formatting (removes robotic AI phrases and fixes fraction visuals)
    const p1 = await toolRouter('formatting_polisher', {
        rawText: polished,
        languageMode: studentLang,
    });
    polished = p1.cleanedText ?? polished;
    // Emoji Policy (limits to 1 in English, 0 in Arabic)
    const p2 = await toolRouter('emoji_policy_check', {
        text: polished,
        languageMode: studentLang,
    });
    polished = p2.cleanedText ?? polished;
    // Arabic Mode (fixes punctuation and removes all English bleed)
    const wantsArabic = studentLang.toLowerCase().startsWith('arabic') ||
        /[\u0600-\u06FF]/.test(polished);
    if (wantsArabic) {
        const p3 = await toolRouter('arabic_mode_formatter', { text: polished });
        polished = p3.cleanedText ?? polished;
    }
    // Final hard sanitation to ensure 100% plain text
    polished = sanitizeHard(polished);
    return {
        text: polished,
        state,
    };
}
//# sourceMappingURL=serverTeacher.js.map