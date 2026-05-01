import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { ai } from '../genkit';
import { GUARDIAN_SANITIZE } from '../tools/handlers';
import { getOrCreateFlow } from './flow-singleton';

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
  gradeHint: z.enum(['Primary', 'LowerSecondary', 'UpperSecondary']).optional(),
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

const PracticePayloadSchema = z.object({
  question: z.string().min(4),
  answers: z.array(z.string().min(1)).min(1).max(5),
});

function clean(text: string): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function normalizeAnswer(value: string): string {
  return clean(value.toLowerCase().replace(/[^\w\s./-]/g, ' '));
}

function uniqAnswers(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = normalizeAnswer(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function looksAffirmative(text: string): boolean {
  return /^(yes|ok|okay|sure|go on|teach me|continue|ready|lets try|let's try)\b/i.test(text.trim());
}

function looksConfused(text: string): boolean {
  return /\b(confused|not sure|don't understand|do not understand|lost|hard)\b/i.test(text);
}

function includesWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i').test(haystack);
}

function isPracticeAnswerCorrect(studentAnswer: string, acceptedAnswers: string[]): boolean {
  const normalizedStudent = normalizeAnswer(studentAnswer);
  if (!normalizedStudent) return false;

  return acceptedAnswers.some((answer) => {
    const normalizedExpected = normalizeAnswer(answer);
    if (!normalizedExpected) return false;
    if (normalizedStudent === normalizedExpected) return true;
    if (normalizedStudent.includes(normalizedExpected)) return true;
    return includesWord(normalizedStudent, normalizedExpected);
  });
}

async function generatePracticeQuestion(topic: string, gradeHint?: 'Primary' | 'LowerSecondary' | 'UpperSecondary') {
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
    const response = await ai.generate({
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
  } catch {
    // Fall back to deterministic defaults below.
  }

  return {
    question: `In one sentence, what is the main idea of ${topic}?`,
    answers: uniqAnswers([topic, 'main idea']),
  };
}

async function generateTeachingTurn(
  query: string,
  opts: { topic?: string; summary?: string; gradeHint?: 'Primary' | 'LowerSecondary' | 'UpperSecondary'; simplify?: boolean }
): Promise<string> {
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

  const result = await ai.generate({ model: 'openai/gpt-4o-mini', prompt });
  return GUARDIAN_SANITIZE(clean(result.text), opts.topic);
}

export const webSearchFlow = getOrCreateFlow('webSearchFlow', () => defineFlow(
  {
    name: 'webSearchFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const {
      query,
      chatHistory,
      searchResultSummary,
      awaitingPracticeQuestion,
      awaitingPracticeAnswer,
      correctAnswers = [],
      attempts,
      gradeHint,
    } = input;

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
          response: await GUARDIAN_SANITIZE(clean(practice.question), topic),
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
        response: await GUARDIAN_SANITIZE('Close. Try once more in one short sentence.'),
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

    const fallback = await ai.generate({ model: 'openai/gpt-4o-mini', prompt: fallbackPrompt });
    return {
      response: await GUARDIAN_SANITIZE(clean(fallback.text), input.lastSearchTopic),
    };
  }
));
