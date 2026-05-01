import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { GUARDIAN_SANITIZE } from '../tools/handlers';
import {
  applyLanguageOutputRules,
  enforceFoundationalTheoryPacing,
  ensureCompleteSentence,
} from './emotional-ai-copilot.teaching.js';

export function emitChunkedText(text: string, onToken?: (token: string) => void) {
  if (!onToken) return;
  const chunks = text.match(/(\S+\s*)/g) || [text];
  for (const chunk of chunks) {
    onToken(chunk);
  }
}

export function looksIncompleteResponse(text: string): boolean {
  const value = String(text || '').trim();
  if (!value) return false;

  const openParen = (value.match(/\(/g) || []).length;
  const closeParen = (value.match(/\)/g) || []).length;
  if (openParen > closeParen) return true;

  const danglingTailWords = new Set([
    'and', 'or', 'to', 'with', 'for', 'from', 'that', 'which', 'because',
    'when', 'while', 'if', 'then', 'this', 'these', 'those', 'lead', 'leads',
    'can', 'could', 'would', 'should', 'is', 'are', 'was', 'were', 'be', 'being',
    'how', 'why', 'what', 'where', 'who', 'whom', 'whose', 'whether'
  ]);
  const danglingTailWordPattern = `(?:${Array.from(danglingTailWords).join('|')})`;
  const trailingFragmentPattern = new RegExp(`\\s*[^.?!\\n]*\\b${danglingTailWordPattern}\\s*[.!?]?\\s*$`, 'i');
  if (trailingFragmentPattern.test(value)) return true;

  const tailWord = value
    .split(/\s+/)
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z]/g, '') || '';

  if (danglingTailWords.has(tailWord)) return true;

  if (/[.!?]["')\]]?$/.test(value)) return false;
  if (/[:;,\-\(\[]$/.test(value)) return true;
  if (/\*\*$/.test(value)) return true;

  return false;
}

function hasHardCutoffSignal(text: string): boolean {
  const value = String(text || '').trim();
  if (!value) return false;

  const openParen = (value.match(/\(/g) || []).length;
  const closeParen = (value.match(/\)/g) || []).length;
  if (openParen > closeParen) return true;

  if (/[:;,\-\(\[]$/.test(value)) return true;
  if (/\*\*$/.test(value)) return true;

  const lastWord = value
    .split(/\s+/)
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z]/g, '') || '';
  const danglingWords = new Set([
    'and', 'or', 'to', 'with', 'for', 'from', 'that', 'which', 'because',
    'when', 'while', 'if', 'then', 'this', 'these', 'those', 'can', 'could',
    'would', 'should', 'is', 'are', 'was', 'were', 'be', 'being',
    'how', 'why', 'what', 'where', 'who', 'whom', 'whose', 'whether'
  ]);

  if (danglingWords.has(lastWord)) return true;
  if (/[.!?]["')\]]?$/.test(value)) return false;

  return value.length >= 80 && looksIncompleteResponse(value);
}

export function shouldAttemptCompletionRepair(
  text: string,
  isVoiceRealtime: boolean,
  modelLikelyTruncated = false
): boolean {
  const value = String(text || '').trim();
  if (!value || value.length < (isVoiceRealtime ? 56 : 72)) return false;
  if (modelLikelyTruncated) return true;
  return hasHardCutoffSignal(value);
}

function mergeWithOverlap(base: string, tail: string): string {
  const prefix = String(base || '').trimEnd();
  const addition = String(tail || '').trim();
  if (!addition) return prefix;
  if (!prefix) return addition;

  const lowerPrefix = prefix.toLowerCase();
  const lowerAddition = addition.toLowerCase();
  const max = Math.min(160, lowerPrefix.length, lowerAddition.length);
  let overlap = 0;

  for (let i = max; i >= 12; i--) {
    if (lowerPrefix.slice(-i) === lowerAddition.slice(0, i)) {
      overlap = i;
      break;
    }
  }

  const mergedTail = overlap > 0 ? addition.slice(overlap) : addition;
  return `${prefix}${/^\s/.test(mergedTail) ? '' : ' '}${mergedTail}`.trim();
}

function trimTrailingIncompleteClause(text: string): string {
  const value = String(text || '').trim();
  if (!value) return value;
  const danglingTailWords = [
    'and', 'or', 'to', 'with', 'for', 'from', 'that', 'which', 'because',
    'when', 'while', 'if', 'then', 'this', 'these', 'those', 'can', 'could',
    'would', 'should', 'is', 'are', 'was', 'were', 'be', 'being',
    'how', 'why', 'what', 'where', 'who', 'whom', 'whose', 'whether'
  ];
  const danglingTailWordPattern = `(?:${danglingTailWords.join('|')})`;
  const trailingFragmentPattern = new RegExp(`\\s*[^.?!\\n]*\\b${danglingTailWordPattern}\\s*[.!?]?\\s*$`, 'i');
  if (trailingFragmentPattern.test(value)) {
    const withoutFragment = value.replace(trailingFragmentPattern, '').trim();
    if (withoutFragment) {
      return /[.!?]$/.test(withoutFragment) ? withoutFragment : `${withoutFragment}.`;
    }
  }
  const lastPunctuation = Math.max(value.lastIndexOf('.'), value.lastIndexOf('!'), value.lastIndexOf('?'));
  if (lastPunctuation > 0) {
    return value.slice(0, lastPunctuation + 1).trim();
  }
  return value;
}

function enforceSingleQuestionFocus(text: string): string {
  const value = String(text || '').trim();
  if (!value) return value;

  const questionMarkCount = (value.match(/\?/g) || []).length;
  if (questionMarkCount <= 1) return value;

  let seenQuestion = 0;
  let rewritten = '';
  for (const char of value) {
    if (char === '?') {
      seenQuestion += 1;
      rewritten += seenQuestion === 1 ? '?' : '.';
      continue;
    }
    rewritten += char;
  }

  return rewritten
    .replace(/\.\s*\./g, '.')
    .replace(/\.{3,}/g, '.')
    .replace(/\?\./g, '?')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function requestCompletionTail(
  client: OpenAI,
  messages: ChatCompletionMessageParam[],
  partialText: string,
  isVoiceRealtime: boolean
): Promise<string> {
  const partial = String(partialText || '').trim();
  if (!partial) return '';

  const continuationPrompt =
    'Continue exactly from the unfinished response above without repeating previous sentences. ' +
    'Complete the thought in plain text using 1 to 3 short sentences.';

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: isVoiceRealtime ? 160 : 220,
      stream: false,
      messages: [
        ...messages,
        { role: 'assistant', content: partial },
        { role: 'user', content: continuationPrompt },
      ],
    });
    return String(completion.choices?.[0]?.message?.content || '').trim();
  } catch {
    return '';
  }
}

async function ensureCompleteResponse(
  client: OpenAI,
  messages: ChatCompletionMessageParam[],
  initialText: string,
  isVoiceRealtime: boolean
): Promise<string> {
  let completed = String(initialText || '').trim();
  if (!completed) return completed;

  const maxAttempts = isVoiceRealtime ? 3 : 2;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!looksIncompleteResponse(completed) || completed.length < 24) {
      break;
    }
    const tail = await requestCompletionTail(client, messages, completed, isVoiceRealtime);
    if (!tail) break;
    const merged = mergeWithOverlap(completed, tail);
    if (!merged || merged === completed) break;
    completed = merged;
  }

  if (looksIncompleteResponse(completed)) {
    completed = trimTrailingIncompleteClause(completed);
  }

  return completed;
}

export type FinalizeAssistantResponseArgs = {
  client?: OpenAI;
  text: string;
  languageMode: string;
  userInput: string;
  topic?: string;
  strictMathMode: boolean;
  isVoiceRealtime: boolean;
  messagesForCompletion?: ChatCompletionMessageParam[];
  sanitize?: boolean;
  conceptualMicroPacingMode?: boolean;
  conceptualTopic?: string;
  sanitizeText?: (text: string, topic?: string, options?: { userInput?: string; strictMathMode?: boolean }) => Promise<string>;
};

export async function finalizeAssistantResponseText(args: FinalizeAssistantResponseArgs): Promise<string> {
  let output = String(args.text || '').trim();
  if (!output) return output;
  const client = args.client ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const sanitizeText = args.sanitizeText ?? GUARDIAN_SANITIZE;

  const completionMessages =
    Array.isArray(args.messagesForCompletion) && args.messagesForCompletion.length > 0
      ? args.messagesForCompletion
      : undefined;

  if (completionMessages && shouldAttemptCompletionRepair(output, args.isVoiceRealtime)) {
    output = await ensureCompleteResponse(client, completionMessages, output, args.isVoiceRealtime);
  }

  if (args.sanitize) {
    output = await sanitizeText(output, args.topic, {
      userInput: args.userInput,
      strictMathMode: args.strictMathMode
    });
  }

  if (args.conceptualMicroPacingMode) {
    output = enforceFoundationalTheoryPacing(
      output,
      args.userInput,
      args.languageMode,
      args.conceptualTopic
    );
  }

  output = applyLanguageOutputRules(output, args.languageMode);
  output = enforceSingleQuestionFocus(output);

  if (looksIncompleteResponse(output)) {
    output = ensureCompleteSentence(trimTrailingIncompleteClause(output), args.languageMode);
  }

  return String(output || '').trim();
}
