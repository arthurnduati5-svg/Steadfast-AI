// src/ai/flows/personalize-daily-objectives.ts
'use server';
/**
 * @fileOverview Generates personalized daily objectives for students based on their performance and the curriculum.
 *
 * - personalizedObjectives - A function that generates personalized daily objectives.
 * - PersonalizedObjectivesInput - The input type for the personalizedObjectives function.
 * - PersonalizedObjectivesOutput - The return type for the personalizedObjectives function.
 */

import {z} from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
  const systemMessage = `You are an AI assistant that creates personalized daily objectives for students.\n\n  Based on the student\'s performance, the curriculum, and any logged misconceptions, create a list of 2-5 daily objectives.\n\n  Student Performance: ${input.studentPerformance}\n  Curriculum: ${input.curriculum}\n  Logged Misconceptions: ${input.loggedMisconceptions}\n\n  Objectives:`;

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemMessage },
    ],
    model: 'gpt-4o',
  });

  const objectivesString = completion.choices[0].message.content || '';
  const dailyObjectives = objectivesString.split('\n').filter(obj => obj.trim() !== '');

  return { dailyObjectives };
};
