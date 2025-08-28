// src/ai/flows/personalize-daily-objectives.ts
'use server';
/**
 * @fileOverview Generates personalized daily objectives for students based on their performance and the curriculum.
 *
 * - personalizedObjectives - A function that generates personalized daily objectives.
 * - PersonalizedObjectivesInput - The input type for the personalizedObjectives function.
 * - PersonalizedObjectivesOutput - The return type for the personalizedObjectives function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const prompt = ai.definePrompt({
  name: 'personalizedObjectivesPrompt',
  input: {schema: PersonalizedObjectivesInputSchema},
  output: {schema: PersonalizedObjectivesOutputSchema},
  prompt: `You are an AI assistant that creates personalized daily objectives for students.

  Based on the student's performance, the curriculum, and any logged misconceptions, create a list of 2-5 daily objectives.

  Student Performance: {{{studentPerformance}}}
  Curriculum: {{{curriculum}}}
  Logged Misconceptions: {{{loggedMisconceptions}}}

  Objectives:`,
});

const personalizedObjectivesFlow = ai.defineFlow(
  {
    name: 'personalizedObjectivesFlow',
    inputSchema: PersonalizedObjectivesInputSchema,
    outputSchema: PersonalizedObjectivesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
