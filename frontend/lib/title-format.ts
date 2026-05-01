const SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'in',
  'nor',
  'of',
  'on',
  'or',
  'the',
  'to',
  'via',
  'vs',
]);

function formatToken(token: string, isFirst: boolean, isLast: boolean): string {
  if (!token) return token;

  // Keep acronyms and mixed alphanumeric codes as-is (AI, GPT-4, API).
  if (/^[A-Z0-9][A-Z0-9-]*$/.test(token) && /[A-Z]/.test(token)) {
    return token;
  }

  const lower = token.toLowerCase();
  if (!isFirst && !isLast && SMALL_WORDS.has(lower)) {
    return lower;
  }

  return lower.replace(/(^[a-z])|([-_/][a-z])/g, (match) => match.toUpperCase());
}

export function formatChatListTitle(rawTitle: string): string {
  const cleaned = String(rawTitle || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const parts = cleaned.split(' ');
  return parts
    .map((token, index) => formatToken(token, index === 0, index === parts.length - 1))
    .join(' ');
}

