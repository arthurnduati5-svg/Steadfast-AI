'use server';
/**
 * @fileOverview Generates personalized daily objectives for students based on performance signals.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { buildUnifiedTutorPrompt, normalizeTutorText } from './tutor-style';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
});

const PersonalizedObjectivesInputSchema = z.object({
  studentPerformance: z.string().describe('The student\'s recent academic performance data.'),
  curriculum: z.string().describe('The curriculum for the current lesson or day.'),
  loggedMisconceptions: z.string().describe('Any misconceptions the student has demonstrated.'),
});
export type PersonalizedObjectivesInput = z.infer<typeof PersonalizedObjectivesInputSchema>;

const PersonalizedObjectivesOutputSchema = z.object({
  dailyObjectives: z
    .array(z.string().describe('A list of 2-5 personalized daily objectives for the student.'))
    .describe('An array of personalized daily objectives'),
});
export type PersonalizedObjectivesOutput = z.infer<typeof PersonalizedObjectivesOutputSchema>;

const ObjectivesPayloadSchema = z.object({
  objectives: z.array(z.string().min(4)).min(2).max(5),
});

function fallbackObjectives(input: PersonalizedObjectivesInput): PersonalizedObjectivesOutput {
  const curriculumTopic = normalizeTutorText(input.curriculum || 'today\'s topic');
  return {
    dailyObjectives: [
      `Review the key concept from ${curriculumTopic} in your own words.`,
      `Practice one targeted question and explain each step clearly.`,
      `Correct one misconception from yesterday and state the right rule.`,
    ],
  };
}

function sanitizeObjectives(values: string[]): string[] {
  const cleaned = values
    .map((value) => normalizeTutorText(value))
    .filter(Boolean)
    .map((value) => (/[.!?]$/.test(value) ? value : `${value}.`));
  const deduped = Array.from(new Set(cleaned));
  return deduped.slice(0, 5);
}

export async function personalizedObjectives(input: PersonalizedObjectivesInput): Promise<PersonalizedObjectivesOutput> {
  return personalizedObjectivesFlow(input);
}

const personalizedObjectivesFlow = async (
  input: PersonalizedObjectivesInput
): Promise<PersonalizedObjectivesOutput> => {
  const basePrompt = buildUnifiedTutorPrompt({ mode: 'objectives', language: 'english' });

  const systemMessage = `
${basePrompt}

Create personalized daily learning objectives.
Return strict JSON only:
{"objectives":["...","..."]}

Rules:
- 2 to 4 objectives.
- Each objective starts with a verb.
- Be specific to curriculum and misconceptions.
- Keep each objective short, clear, and encouraging.

Student signals:
- Performance: ${input.studentPerformance}
- Curriculum: ${input.curriculum}
- Misconceptions: ${input.loggedMisconceptions}
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemMessage }],
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content || '';
    if (!raw) return fallbackObjectives(input);

    const parsed = ObjectivesPayloadSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return fallbackObjectives(input);
    }

    const objectives = sanitizeObjectives(parsed.data.objectives);
    if (objectives.length < 2) {
      return fallbackObjectives(input);
    }

    return { dailyObjectives: objectives };
  } catch {
    return fallbackObjectives(input);
  }
};

