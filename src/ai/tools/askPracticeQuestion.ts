import { AskPracticeQuestionInput, AskPracticeQuestionOutput } from './toolSchemas';

export async function askPracticeQuestionTool(input: AskPracticeQuestionInput): Promise<AskPracticeQuestionOutput> {
  if (!input || typeof input.question !== 'string' || !Array.isArray(input.correctAnswers) || input.correctAnswers.length === 0) {
    throw new Error('Invalid askPracticeQuestion input: question and correctAnswers required.');
  }
  const normalized = input.correctAnswers.map(a => String(a).trim().toLowerCase()).filter(Boolean);
  // Log audit note, idempotent operation
  return { asked: true, normalizedCorrectAnswers: normalized };
}
