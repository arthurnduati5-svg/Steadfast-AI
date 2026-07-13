function normalizeQuestionTextForHash(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .toLowerCase();
}

function buildQuestionContentHash(stemSafeText: string, questionType: string): string {
  const normalized = normalizeQuestionTextForHash(stemSafeText);
  let hash = 0;
  const input = `${questionType}:${normalized}`;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
}

export const DuplicateFingerprintService = {
  normalizeQuestionTextForHash,
  buildQuestionContentHash,
};
