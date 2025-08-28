'use server';

/**
 * @fileOverview Generates adaptive hints for students based on their current problem and progress.
 *
 * - generateAdaptiveHint - A function that generates adaptive hints.
 * - GenerateAdaptiveHintInput - The input type for the generateAdaptiveHint function.
 * - GenerateAdaptiveHintOutput - The return type for the generateAdaptiveHint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAdaptiveHintInputSchema = z.object({
  problemDescription: z.string().describe('The description of the problem the student is working on.'),
  studentProgress: z.string().describe('The current progress of the student in solving the problem.'),
  hintLadder: z.array(z.string()).describe('An array of hints, ordered from least to most helpful.'),
  currentHintIndex: z.number().describe('The index of the current hint being given to the student.'),
});
export type GenerateAdaptiveHintInput = z.infer<typeof GenerateAdaptiveHintInputSchema>;

const GenerateAdaptiveHintOutputSchema = z.object({
  hint: z.string().describe('The adaptive hint generated for the student.'),
  nextHintIndex: z.number().describe('The index of the next hint to be given to the student.'),
});
export type GenerateAdaptiveHintOutput = z.infer<typeof GenerateAdaptiveHintOutputSchema>;

export async function generateAdaptiveHint(input: GenerateAdaptiveHintInput): Promise<GenerateAdaptiveHintOutput> {
  return generateAdaptiveHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAdaptiveHintPrompt',
  input: {schema: GenerateAdaptiveHintInputSchema},
  output: {schema: GenerateAdaptiveHintOutputSchema},
  prompt: `You are an AI assistant helping students learn by providing adaptive hints.

  The student is working on the following problem:
  {{problemDescription}}

  The student's current progress is:
  {{studentProgress}}

  Here is a ladder of hints, from least to most helpful:
  {{#each hintLadder}}
  {{@index}}. {{this}}
  {{/each}}

  The student is currently on hint index: {{currentHintIndex}}

  Your task is to provide the next hint in the ladder, or reframe the current hint if appropriate.
  If the student is doing well, provide a less helpful hint.
  If the student is struggling, provide a more helpful hint.
  If the student is completely stuck, provide a partial solution.

  Return the hint and the index of the next hint to be given.
  `,
});

const generateAdaptiveHintFlow = ai.defineFlow(
  {
    name: 'generateAdaptiveHintFlow',
    inputSchema: GenerateAdaptiveHintInputSchema,
    outputSchema: GenerateAdaptiveHintOutputSchema,
  },
  async input => {
    let nextHintIndex = input.currentHintIndex;
    if (input.studentProgress.toLowerCase().includes('stuck')) {
      nextHintIndex = Math.min(input.hintLadder.length - 1, nextHintIndex + 1);
    } else if (input.studentProgress.toLowerCase().includes('doing well')) {
      nextHintIndex = Math.max(0, nextHintIndex - 1);
    }
    const {output} = await prompt({...input, currentHintIndex: nextHintIndex});
    return {
      hint: output!.hint,
      nextHintIndex: nextHintIndex,
    };
  }
);
