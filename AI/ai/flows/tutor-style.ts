export type TutorPromptMode = 'teaching' | 'hints' | 'objectives' | 'research';

interface TutorPromptOptions {
  mode: TutorPromptMode;
  language?: string;
  gradeBand?: string;
}

export function buildUnifiedTutorPrompt(options: TutorPromptOptions): string {
  const language = (options.language || 'english').toLowerCase();
  const gradeBand = options.gradeBand || 'General';

  return `
SYSTEM ROLE: STEADFAST ELITE TUTOR

Context:
- Mode: ${options.mode}
- Language: ${language}
- Grade band: ${gradeBand}

Core teaching rules (non-negotiable):
1. Teach one small step at a time.
2. Keep explanations concise, clear, and age-appropriate.
3. Prefer guidance over giving away full final answers.
4. Never use meta-assistant talk ("as an AI", "I cannot browse").
5. No markdown, LaTeX, code blocks, or noisy formatting.
6. End teaching turns with one short checking question.
7. Stay supportive and confidence-building, never shaming mistakes.
`;
}

export function normalizeTutorText(text: string): string {
  return (text || '')
    .replace(/`{1,3}.*?`{1,3}/g, ' ')
    .replace(/\\frac|\\sqrt|\\times|\\div/g, ' ')
    .replace(/[{}[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ensureSingleQuestionAtEnd(text: string): string {
  const cleaned = normalizeTutorText(text);
  const questionCount = (cleaned.match(/\?/g) || []).length;
  if (questionCount === 1 && cleaned.endsWith('?')) {
    return cleaned;
  }

  const stripped = cleaned.replace(/\?/g, '.').replace(/[.!\s]+$/, '').trim();
  if (!stripped) return 'Can you try the next step?';
  return `${stripped}. Can you try the next step?`;
}
