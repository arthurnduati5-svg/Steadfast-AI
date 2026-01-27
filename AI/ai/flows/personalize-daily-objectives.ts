// src/ai/flows/personalize-daily-objectives.ts
'use server';
/**
 * @fileOverview Generates personalized daily objectives for students based on their performance and the curriculum.
 *
 * - personalizedObjectives - A function that generates personalized daily objectives.
 * - PersonalizedObjectivesInput - The input type for the personalizedObjectives function.
 * - PersonalizedObjectivesOutput - The return type for the personalizedObjectives function.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds
});

const PersonalizedObjectivesInputSchema = z.object({
  studentPerformance: z.string().describe('The student\u2019s recent academic performance data.'),
  curriculum: z.string().describe('The curriculum for the current lesson or day.'),
  loggedMisconceptions: z.string().describe('Any misconceptions the student has demonstrated.'),
});
export type PersonalizedObjectivesInput = z.infer<typeof PersonalizedObjectivesInputSchema>;

const PersonalizedObjectivesOutputSchema = z.object({
  dailyObjectives: z.array(
    z.string().describe('A list of 2-5 personalized daily objectives for the student.')
  ).describe('An array of personalized daily objectives'),
});
export type PersonalizedObjectivesOutput = z.infer<typeof PersonalizedObjectivesOutputSchema>;

export async function personalizedObjectives(input: PersonalizedObjectivesInput): Promise<PersonalizedObjectivesOutput> {
  return personalizedObjectivesFlow(input);
}

const personalizedObjectivesFlow = async (input: PersonalizedObjectivesInput): Promise<PersonalizedObjectivesOutput> => {
  const systemMessage = `You are **Steadfast Copilot AI**, a supportive and insightful teacher for Kenyan students.
Your task is to create a short, personalized list of daily objectives to help a student focus their learning for the day.
The objectives should be clear, encouraging, and directly related to their recent performance, the curriculum, and any misconceptions they have.

Keep the objectives:
- **Action-oriented:** Start with a verb (e.g., "Review," "Practice," "Explain").
- **Specific:** Clearly state the topic or skill to work on.
- **Positive and encouraging:** Frame the objectives in a way that builds confidence.
- **Concise:** Generate between 2 to 4 objectives.

Here is the student's information:
- **Student Performance:** ${input.studentPerformance}
- **Today's Curriculum:** ${input.curriculum}
- **Logged Misconceptions:** ${input.loggedMisconceptions}

Based on this, create a list of daily objectives.`;

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemMessage },
    ],
    model: 'gpt-4o-mini',
  });

  const objectivesString = completion.choices[0].message.content || '';
  const dailyObjectives = objectivesString.split('\n').filter(obj => obj.trim() !== '');

  return { dailyObjectives };
};
