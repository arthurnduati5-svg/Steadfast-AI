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

export type TeacherInput = z.infer<typeof TeacherInputSchema>;

export const TeacherOutputSchema = z.object({
  text: z.string(),
  state: TeacherInputSchema.shape.state,
});

export type TeacherOutput = z.infer<typeof TeacherOutputSchema>;

// --------------------------------------
// LAST RESORT SERVER SANITIZER
// Ensures no markdown/latex leaks
// --------------------------------------
function sanitizeHard(s: string): string {
  if (!s) return '';

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
export default async function serverTeacher(
  input: TeacherInput
): Promise<TeacherOutput> {
  let state =
    input.state ??
    ({
      awaitingPracticeQuestionAnswer: false,
      validationAttemptCount: 0,
      correctAnswers: [],
      adaptMode: 'normal',
    } as any);

  const studentLang = input.preferences?.preferredLanguage || 'english';
  const userMsg = input.text.trim().toLowerCase();

  // -----------------------
  // 1. Ask LLM for *structured* pieces only
  // -----------------------
  const structured = await toolRouter('teaching_micro_step', {
    topic: userMsg,
    studentLevel: state.studentLevel || 'beginner',
    context: userMsg,
    adaptMode: state.adaptMode === 'challenge',
  });

  const tone = structured.tone || 'Let us take a small step.';
  const micro = structured.microIdea || 'Here is the simplest idea.';
  const example =
    structured.example || 'Think of a simple Kenyan life example.';
  const question = structured.question || 'Does that make sense?';

  // -----------------------
  // 2. Build server text
  // -----------------------
  const draft = `${tone} ${micro} ${example} ${
    question.endsWith('?') ? question : question + '?'
  }`;

  // -----------------------
  // 3. Polisher chain
  // -----------------------
  let polished = draft;

  const p1 = await toolRouter('formatting_polisher', {
    rawText: polished,
    languageMode: studentLang,
  });
  polished = p1.cleanedText ?? polished;

  const p2 = await toolRouter('emoji_policy_check', {
    text: polished,
    languageMode: studentLang,
  });
  polished = p2.cleanedText ?? polished;

  const wantsArabic =
    studentLang.toLowerCase().startsWith('arabic') ||
    /[\u0600-\u06FF]/.test(polished);

  if (wantsArabic) {
    const p3 = await toolRouter('arabic_mode_formatter', { text: polished });
    polished = p3.cleanedText ?? polished;
  }

  polished = sanitizeHard(polished);

  return {
    text: polished,
    state,
  };
}