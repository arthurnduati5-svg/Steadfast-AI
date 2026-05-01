import type { Message } from '../../lib/types';
import type { ExtendedConversationState } from './emotional-ai-copilot.types.js';

type FoundationalTeachingModeArgs = {
  userText: string;
  chatHistory: Message[];
  strictMathMode: boolean;
  forceWebSearch?: boolean;
  languageMode: string;
};

type ConceptualMicroPacingModeArgs = {
  userText: string;
  state: ExtendedConversationState;
  strictMathMode: boolean;
  forceWebSearch?: boolean;
  languageMode: string;
  foundationalTeachingMode: boolean;
};

function normalizeWhitespace(text: string): string {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeAnswer(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\bover\b/g, '/')
    .replace(/\b(the|a|an|answer|its|it is|is|are)\b/g, ' ')
    .replace(/[^a-z0-9/%=+./ -]/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumberish(value: string): number | null {
  const normalized = normalizeAnswer(value);
  if (!normalized) return null;

  if (/^-?\d+(?:\.\d+)?%$/.test(normalized)) {
    return Number(normalized.slice(0, -1)) / 100;
  }

  if (/^-?\d+(?:\.\d+)?\/-?\d+(?:\.\d+)?$/.test(normalized)) {
    const [left, right] = normalized.split('/').map(Number);
    if (!Number.isFinite(left) || !Number.isFinite(right) || right === 0) return null;
    return left / right;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return Number(normalized);
  }

  return null;
}

function splitSentences(text: string): string[] {
  const matches = normalizeWhitespace(text).match(/[^.!?\n]+(?:[.!?]+|$)/g);
  return (matches || []).map((part) => part.trim()).filter(Boolean);
}

function looksLikeConceptualPrompt(text: string): boolean {
  const lower = String(text || '').trim().toLowerCase();
  if (!lower) return false;

  if (/\b(search|look up|video|youtube|latest|current|news|price|solve|calculate|equation|fraction|quiz|practice|test me)\b/.test(lower)) {
    return false;
  }

  return /\b(teach me|walk me through|take me through|help me understand|i want to learn|learn about|introduction to|intro to|basics of|explain|explain to me|what is|what are|how does|why does|why do|how do|can you explain)\b/.test(lower);
}

export function localizedText(
  languageMode: string,
  english: string,
  swahili?: string,
  arabic?: string
): string {
  const mode = String(languageMode || 'english').toLowerCase();

  if (mode === 'swahili') {
    return String(swahili || english || '').trim();
  }

  if (mode === 'arabic') {
    return String(arabic || english || '').trim();
  }

  if (mode === 'english_sw') {
    const en = String(english || '').trim();
    const sw = String(swahili || '').trim();
    return sw && sw !== en ? `${en}\n\n${sw}`.trim() : en;
  }

  if (mode === 'arabic_english') {
    const en = String(english || '').trim();
    const ar = String(arabic || '').trim();
    return ar && ar !== en ? `${en}\n\n${ar}`.trim() : en;
  }

  return String(english || '').trim();
}

export function buildGenericPracticeSuccessFeedback(topic: string, languageMode: string): string {
  const safeTopic = String(topic || 'this topic').trim() || 'this topic';
  return localizedText(
    languageMode,
    `Excellent. You understand ${safeTopic}. Ready for the next step?`,
    `Vizuri sana. Umeelewa ${safeTopic}. Uko tayari kwa hatua inayofuata?`
  );
}

export function buildGenericPracticeRetryFeedback(attempt: number, languageMode: string): string {
  if (attempt > 1) {
    return localizedText(
      languageMode,
      "Let us take it slowly. Let's count together.",
      'Twende polepole. Tuhesabu pamoja.'
    );
  }

  return localizedText(
    languageMode,
    "Good try, but let's look closer.",
    'Jaribio zuri, lakini tuangalie kwa makini zaidi.'
  );
}

export function buildFallbackPracticeQuestion(languageMode: string): string {
  return localizedText(
    languageMode,
    'a short revision question',
    'swali fupi la marudio'
  );
}

export function buildPracticeChallengeReply(question: string, languageMode: string): string {
  return localizedText(
    languageMode,
    `Here is a small challenge: ${question}`,
    `Hili hapa swali dogo la mazoezi: ${question}`
  );
}

export function buildGreetingText(languageMode: string, studentName: string, interests: string[]): string {
  const safeName = String(studentName || 'friend').trim() || 'friend';
  const firstInterest = interests.find(Boolean);

  if (String(languageMode || '').toLowerCase() === 'arabic') {
    return firstInterest
      ? `Hello ${safeName}. We can start with ${firstInterest}.`
      : `Hello ${safeName}. How can I help you study today?`;
  }

  if (String(languageMode || '').toLowerCase() === 'swahili') {
    return firstInterest
      ? `Habari ${safeName}, tunaweza kuanza na ${firstInterest}.`
      : `Habari ${safeName}, ungependa tusome nini leo?`;
  }

  const base = `Hello ${safeName}, how can I help you study today?`;
  return firstInterest ? `${base} We can start with ${firstInterest}.` : base;
}

export function extractTheoryTopicFromInput(text: string): string {
  const raw = normalizeWhitespace(text);
  if (!raw) return '';

  let topic = raw
    .replace(/^(?:please\s+)?(?:can you\s+)?(?:help me understand|teach me|walk me through|take me through|i want to learn about|i want to learn|learn about|introduction to|intro to|basics of|explain|explain to me|tell me about|what is|what are|how does|how do|why does|why do)\s+/i, '')
    .replace(/^(?:the|a|an)\s+/i, '')
    .replace(/[?.!]+$/g, '')
    .trim();

  if (!topic) {
    topic = raw.replace(/[?.!]+$/g, '').trim();
  }

  return topic;
}

export function isConceptualContinuation(text: string): boolean {
  const lower = normalizeWhitespace(text).toLowerCase();
  if (!lower) return false;

  if (looksLikeConceptualPrompt(lower)) return false;

  if (/\b(stop|new topic|change topic|switch topic|search|look up|quiz|practice)\b/.test(lower)) {
    return false;
  }

  if (/^(yes|ok|okay|continue|go on|next|more|proceed)\b/.test(lower)) return true;
  if (/\b(tell me more|another example|one more example|explain more|continue please|what next|why|how|and then)\b/.test(lower)) return true;

  const words = lower.split(/\s+/).filter(Boolean);
  return words.length <= 8 && /\b(this|that|it|those|these|part|point)\b/.test(lower);
}

export function shouldExitConceptualMode(text: string): boolean {
  const lower = normalizeWhitespace(text).toLowerCase();
  if (!lower) return false;

  return /\b(stop|enough|thats enough|that is enough|i understand|got it|thanks|thank you|new topic|another topic|change topic|switch topic|lets do something else)\b/.test(lower);
}

export function shouldUseFoundationalTeachingMode(args: FoundationalTeachingModeArgs): boolean {
  if (args.strictMathMode || args.forceWebSearch) return false;

  const lower = normalizeWhitespace(args.userText).toLowerCase();
  if (!lower) return false;

  if (isConceptualContinuation(lower)) return false;

  return looksLikeConceptualPrompt(lower);
}

export function shouldUseConceptualMicroPacingMode(args: ConceptualMicroPacingModeArgs): boolean {
  if (args.strictMathMode || args.forceWebSearch) return false;
  if (shouldExitConceptualMode(args.userText)) return false;
  if (args.foundationalTeachingMode) return true;
  if (args.state?.conceptualLessonModeActive && args.state?.conceptualTopic) return true;
  return Boolean(args.state?.conceptualTopic) && isConceptualContinuation(args.userText);
}

export function validateAnswer(input: string, correctAnswers: string[]): boolean {
  const normalizedInput = normalizeAnswer(input);
  if (!normalizedInput) return false;

  const inputNumber = parseNumberish(normalizedInput);

  return (correctAnswers || []).some((answer) => {
    const normalizedAnswer = normalizeAnswer(answer);
    if (!normalizedAnswer) return false;

    if (normalizedInput === normalizedAnswer) return true;

    const answerNumber = parseNumberish(normalizedAnswer);
    if (inputNumber !== null && answerNumber !== null && Math.abs(inputNumber - answerNumber) < 1e-9) {
      return true;
    }

    if (normalizedAnswer.length >= 3) {
      if (normalizedInput.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedInput)) {
        return true;
      }
    }

    const expectedTokens = normalizedAnswer.split(' ').filter(Boolean);
    if (expectedTokens.length > 1 && expectedTokens.every((token) => normalizedInput.includes(token))) {
      return true;
    }

    return false;
  });
}

export function ensureCompleteSentence(text: string, languageMode: string): string {
  const normalized = normalizeWhitespace(text).replace(/[:;,\-(/[\]]+\s*$/g, '').trim();
  if (!normalized) return normalized;
  if (/[.!?]["')\]]?$/.test(normalized)) return normalized;

  const punctuation = String(languageMode || '').toLowerCase() === 'arabic' ? '.' : '.';
  return `${normalized}${punctuation}`;
}

function stripMarkdownSyntax(text: string): string {
  let output = String(text || '');
  if (!output) return output;

  output = output.replace(/```[^\n`]*\n([\s\S]*?)```/g, (_match, body: string) => `\n${String(body || '').trim()}\n`);
  output = output.replace(/`([^`]+)`/g, '$1');
  output = output.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  output = output.replace(/^\s*>\s?/gm, '');
  output = output.replace(/^\s*[-*+]\s+/gm, '');
  output = output.replace(/^\s*\d+\.\s+/gm, '');
  output = output.replace(/^\s*([-*_])\1{2,}\s*$/gm, '');
  output = output.replace(/(\*\*|__|~~)/g, '');
  output = output.replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2');
  output = output.replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, '$1$2');
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  output = output.replace(/\\([`*_{}\[\]()#+\-.!])/g, '$1');

  return output;
}

function normalizeLatexToPlainText(text: string): string {
  const normalizeMathBody = (body: string): string => {
    let math = String(body || '');
    for (let i = 0; i < 6; i += 1) {
      const next = math.replace(/\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2');
      if (next === math) break;
      math = next;
    }
    math = math
      .replace(/\\sqrt\s*\{([^{}]+)\}/g, 'sqrt($1)')
      .replace(/\\(?:left|right)\s*/g, '')
      .replace(/\\cdot|\\times/g, '*')
      .replace(/\\div/g, '/')
      .replace(/\\text\s*\{([^{}]+)\}/g, '$1')
      .replace(/\\(?:begin|end)\{[^{}]*\}/g, '')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return math;
  };

  let output = String(text || '');
  if (!output) return output;
  output = output.replace(/\$\$([\s\S]*?)\$\$/g, (_match, body: string) => normalizeMathBody(body));
  output = output.replace(/\$([^$\n]+)\$/g, (_match, body: string) => normalizeMathBody(body));
  output = output.replace(/\\\(([\s\S]*?)\\\)/g, (_match, body: string) => normalizeMathBody(body));
  output = output.replace(/\\\[([\s\S]*?)\\\]/g, (_match, body: string) => normalizeMathBody(body));
  output = normalizeMathBody(output);
  return output;
}

function collapseRedundantParentheses(text: string): string {
  let output = String(text || '');
  if (!output) return output;
  for (let i = 0; i < 6; i += 1) {
    const next = output.replace(/\(\s*\(([^()]{1,160})\)\s*\)/g, '($1)');
    if (next === output) break;
    output = next;
  }
  return output.replace(/\(\s*\)/g, '');
}

function normalizeBrackets(text: string): string {
  let output = String(text || '');
  if (!output) return output;
  output = output.replace(/\{([^{}]+)\}/g, '$1');
  output = output.replace(/\[([^[\]]+)\]/g, '($1)');
  output = output.replace(/[{}\[\]]/g, '');
  return output;
}

function balanceParentheses(text: string): string {
  const value = String(text || '');
  if (!value) return value;
  const chars = value.split('');
  const openIndexes: number[] = [];
  const keep = new Array(chars.length).fill(true);

  for (let i = 0; i < chars.length; i += 1) {
    if (chars[i] === '(') {
      openIndexes.push(i);
      continue;
    }
    if (chars[i] === ')') {
      if (openIndexes.length === 0) {
        keep[i] = false;
      } else {
        openIndexes.pop();
      }
    }
  }

  while (openIndexes.length > 0) {
    const idx = openIndexes.pop();
    if (typeof idx === 'number') keep[idx] = false;
  }

  return chars.filter((_char, idx) => keep[idx]).join('');
}

export function applyLanguageOutputRules(text: string, languageMode: string): string {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return normalized;

  let output = normalized;
  output = stripMarkdownSyntax(output);
  output = normalizeLatexToPlainText(output);
  output = normalizeBrackets(output);
  output = collapseRedundantParentheses(output);
  output = balanceParentheses(output);
  output = normalizeWhitespace(output)
    .replace(/[ \t]+([,.;!?])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();

  if (String(languageMode || '').toLowerCase() === 'english') {
    return output;
  }

  return output;
}

export function enforceFoundationalTheoryPacing(
  text: string,
  userInput: string,
  languageMode: string,
  conceptualTopic?: string
): string {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return normalized;

  const sentences = splitSentences(normalized);
  if (sentences.length <= 4 && normalized.length <= 700) {
    return normalized;
  }

  const safeTopic = String(conceptualTopic || extractTheoryTopicFromInput(userInput) || 'this topic').trim();
  const checkpoint = localizedText(
    languageMode,
    `Reply with continue and I will teach the next step about ${safeTopic}.`,
    `Jibu kwa continue nami nitafundisha hatua inayofuata kuhusu ${safeTopic}.`
  );

  return `${sentences.slice(0, 4).join(' ')}\n\n${checkpoint}`.trim();
}
