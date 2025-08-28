'use server';

import { emotionalAICopilot } from '@/ai/flows/emotional-ai-copilot';
import { personalizedObjectives } from '@/ai/flows/personalize-daily-objectives';
import { generateAdaptiveHint } from '@/ai/flows/generate-adaptive-hints';

export async function getAssistantResponse(message: string, chatHistory: {role: 'user' | 'assistant', content: string}[]): Promise<string> {
  const isHintRequest = /hint|stuck|help/i.test(message);

  if (isHintRequest) {
    try {
      const result = await generateAdaptiveHint({
        problemDescription: 'Student is working on Algebra 1, solving linear equations like "2x - 5 = 11".',
        studentProgress: `Previous conversation: ${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nCurrent query: ${message}`,
        hintLadder: [
          'Remember to perform the same operation on both sides to keep the equation balanced. What should be the first step?',
          'Think about isolating the term with the variable (x) first. How can you undo the subtraction of 5?',
          'Try adding 5 to both sides of the equation. What does that give you?',
          'After adding 5 to both sides, you get 2x = 16. What is the final step to solve for x?',
          'Divide both sides by 2 to find the value of x. The answer is x = 8.'
        ],
        currentHintIndex: 0,
      });
      return result.hint;
    } catch (error) {
      console.error('Error generating adaptive hint:', error);
      return 'I had trouble generating a hint. Could you try rephrasing your question?';
    }
  }

  try {
    const result = await emotionalAICopilot({ text: message });
    return result.processedText;
  } catch (error) {
    console.error('Error in emotional AI copilot:', error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
}

export async function getDailyObjectives(): Promise<string[]> {
  try {
    const result = await personalizedObjectives({
      studentPerformance: 'Student is excelling in basic algebra but struggles with word problems and applying concepts.',
      curriculum: 'Today’s lesson is on applying linear equations to real-world scenarios.',
      loggedMisconceptions: 'Difficulty in translating written descriptions into mathematical equations.',
    });
    return result.dailyObjectives;
  } catch (error) {
    console.error('Error getting daily objectives:', error);
    return [
      'Could not load objectives. Please try again later.',
    ];
  }
}
