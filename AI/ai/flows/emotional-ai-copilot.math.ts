import { create, all } from 'mathjs';
import { Message } from '../../lib/types';
import { localizedText } from './emotional-ai-copilot.teaching.js';
import { ExtendedConversationState, MathTopicType } from './emotional-ai-copilot.types.js';

const math = create(all, {});

export function parseToolArguments(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function normalizeCorrectAnswers(raw: string[] | string | undefined): string[] {
  if (Array.isArray(raw)) {
    return raw.map((a) => String(a).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

const EXPLICIT_MATH_INTENT_REGEX =
  /\b(math|mathematics|algebra|arithmetic|fraction|fractions|equation|equations|simplify|solve|calculate|ratio|percent|percentage|denominator|numerator|integer|decimal)\b/i;
const OPERATOR_MATH_REGEX =
  /[0-9]\s*[\+\*\/=]\s*[0-9]|\(\s*\d+\s*\/\s*\d+\s*\)\s*\/\s*\(\s*\d+\s*\/\s*\d+\s*\)/i;
const SUBTRACTION_MATH_REGEX =
  /\b(solve|calculate|work out|evaluate|simplify|find|compute)\b[^.]*\b\d+\s*-\s*\d+\b|\b\d+\s*-\s*\d+\b[^.]*\b(solve|calculate|work out|evaluate|simplify|find|compute)\b/i;
const NON_MATH_RANGE_CONTEXT_REGEX =
  /\b(rate|rating|scale|score|scored|out of|design|poster|logo|brand|appearance|look|looks|style|styled|styled? like|image|picture|photo|poster|banner|flyer|ad|advert|advertisement)\b/i;

function looksLikeRatingRange(text: string): boolean {
  const raw = String(text || '').toLowerCase();
  if (!raw) return false;
  if (!/\b\d+\s*-\s*\d+\b/.test(raw) && !/\b\d+\s*(?:\/|out of)\s*10\b/.test(raw)) return false;
  return NON_MATH_RANGE_CONTEXT_REGEX.test(raw);
}

export function isVisualRatingOrCritiqueInput(text: string): boolean {
  const raw = String(text || '').toLowerCase();
  if (!raw) return false;
  if (looksLikeRatingRange(raw)) return true;
  return /\b(rate|rating|review|critique|feedback|thoughts on|what do you think of|how does this look|how does it look|design|poster|logo|layout|branding|color|colour|visual|aesthetic|image|picture|photo)\b/i.test(raw);
}

export function isMathFocusedInput(text: string, topic?: string): boolean {
  const rawText = String(text || '');
  const rawTopic = String(topic || '');
  const combined = `${rawText} ${rawTopic}`.trim();

  if (!combined) return false;
  if (looksLikeRatingRange(rawText)) return false;
  if (looksLikeRatingRange(combined) && !EXPLICIT_MATH_INTENT_REGEX.test(combined)) return false;

  return (
    EXPLICIT_MATH_INTENT_REGEX.test(combined) ||
    OPERATOR_MATH_REGEX.test(rawText) ||
    SUBTRACTION_MATH_REGEX.test(rawText)
  );
}

export function extractMathExpression(text: string): string | null {
  const raw = String(text || '');
  if (!raw) return null;
  if (looksLikeRatingRange(raw) && !EXPLICIT_MATH_INTENT_REGEX.test(raw)) return null;

  const normalizedRaw = raw.replace(/\u00f7/g, '÷').replace(/[–—]/g, '-');

  const languageFractionDivision = normalizedRaw.match(
    /\(*\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)*\s*(?:÷|divided\s+by|over)\s*\(*\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)*/i
  );
  if (languageFractionDivision?.[0]) {
    return `(${languageFractionDivision[1]}/${languageFractionDivision[2]})/(${languageFractionDivision[3]}/${languageFractionDivision[4]})`;
  }

  const doubledParenFractionDivision = normalizedRaw.match(
    /\(+\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)+\s*(?:÷|divided\s+by|over)\s*\(+\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)+/i
  );
  if (doubledParenFractionDivision?.[0]) {
    return `(${doubledParenFractionDivision[1]}/${doubledParenFractionDivision[2]})/(${doubledParenFractionDivision[3]}/${doubledParenFractionDivision[4]})`;
  }

  const complexFraction = raw.match(/\(\s*\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\s*\)\s*\/\s*\(\s*\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\s*\)/);
  if (complexFraction?.[0]) {
    return complexFraction[0].replace(/\s+/g, '');
  }

  const adjacentFractions = raw.match(
    /\(+\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)+\s*\(+\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)+/
  );
  if (adjacentFractions?.[0]) {
    return `(${adjacentFractions[1]}/${adjacentFractions[2]})/(${adjacentFractions[3]}/${adjacentFractions[4]})`;
  }

  const cleaned = raw.replace(/[^0-9+\-*/().\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;

  const tokenLike = cleaned.split(' ').filter(Boolean).join('');
  const normalizedToken = tokenLike.replace(/[.,;:!?]+$/g, '');
  if (!/[+\-*/]/.test(normalizedToken)) return null;
  if (!/\d/.test(normalizedToken)) return null;
  if (normalizedToken.length < 3 || normalizedToken.length > 80) return null;
  return normalizedToken;
}
export type FractionDivisionParts = {
  n1: string;
  d1: string;
  n2: string;
  d2: string;
};

export function parseFractionDivisionExpression(expression: string): FractionDivisionParts | null {
  const match = String(expression || '').trim().match(
    /^\(*\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)*\s*\/\s*\(*\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)*$/
  );
  if (!match) return null;
  return { n1: match[1], d1: match[2], n2: match[3], d2: match[4] };
}

export function recoverFractionDivisionExpressionFromContext(
  inputText: string,
  state: ExtendedConversationState,
  chatHistory: Message[]
): string | null {
  const candidates: string[] = [
    String(inputText || ''),
    String(state.mathTargetExpression || ''),
    String(state.activePracticeQuestion || ''),
    String(state.lastAssistantMessage || ''),
    ...chatHistory.slice(-12).map((m) => String(m?.content || '')),
  ];

  for (const candidate of candidates) {
    const exp = extractMathExpression(candidate);
    if (!exp) continue;
    if (parseFractionDivisionExpression(exp)) return exp;
  }
  return null;
}

export function evaluateMathExpression(expression: string): string | null {
  const exp = String(expression || '').trim();
  if (!exp) return null;
  try {
    const value = math.evaluate(exp);
    if (typeof value === 'number' && Number.isFinite(value)) {
      const rounded = Math.abs(value) < 1e-10 ? 0 : value;
      return Number.isInteger(rounded) ? String(rounded) : String(Number(rounded.toFixed(6)));
    }
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export function detectMathTopicType(text: string, topic?: string, expression?: string): MathTopicType {
  const combined = `${String(text || '')} ${String(topic || '')} ${String(expression || '')}`.toLowerCase();
  if (/\b(percent|percentage|percentages)\b|%/.test(combined)) return 'percentages';
  if (/\b(equation|equations|equal sign|solve for)\b/.test(combined) || /=/.test(combined)) return 'equations';
  if (/\b(algebra|variable|term|coefficient)\b/.test(combined) || /\b[xyz]\b/.test(combined)) return 'algebra';
  if (/\b(fraction|fractions|numerator|denominator|reciprocal)\b/.test(combined)) return 'fractions';
  if (parseFractionDivisionExpression(expression || '') || /\d+\s*\/\s*\d+/.test(combined)) return 'fractions';
  return 'generic';
}

type SocraticGradeBand = 'primary' | 'secondary';

function getSocraticGradeBand(gradeLevel?: string): SocraticGradeBand {
  const lower = String(gradeLevel || '').toLowerCase();
  if (!lower) return 'secondary';
  if (
    /\b(primary|grade\s*[1-8]|year\s*[1-8]|lower|middle)\b/.test(lower) &&
    !/\bsecondary|high\s*school|form\s*[1-6]|upper\b/.test(lower)
  ) {
    return 'primary';
  }
  return 'secondary';
}

export function getMathWorkedExampleThreshold(gradeLevel?: string): number {
  return getSocraticGradeBand(gradeLevel) === 'primary' ? 6 : 4;
}

export function isDirectAnswerRequest(text: string): boolean {
  const lower = String(text || '').toLowerCase();
  if (!lower) return false;

  if (/\b(just give(?: me)?(?: the)? answer|final answer|answer only|no steps|solve it for me|give me the result|nipe jibu|jibu tu|bila hatua|bila steps)\b/.test(lower)) {
    return true;
  }

  const normalized = lower
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return false;

  const wantsDirectness = /\b(just|only|direct|straight|final)\b/.test(normalized);
  const asksForAnswer = /\b(answer|result|solution|jibu)\b/.test(normalized);
  const asksForNoSteps = /\b(no steps|without steps|bila hatua|bila steps)\b/.test(normalized);

  return (wantsDirectness && asksForAnswer) || asksForNoSteps;
}

export function buildMathNoFinalAnswerSocraticReply(args: {
  expression?: string;
  languageMode: string;
  activeQuestion?: string;
  repeated?: boolean;
  gradeLevel?: string;
}): string {
  const expression = String(args.expression || '').trim() || 'this problem';
  const activeQuestion = String(args.activeQuestion || '').trim();
  const gradeBand = getSocraticGradeBand(args.gradeLevel);
  const checkLine = activeQuestion
    ? `Checkpoint: ${activeQuestion}.`
    : /[()]/.test(expression)
      ? `Checkpoint: in ${expression}, which part should we simplify first?`
      : /[+\-*/]/.test(expression)
        ? `Checkpoint: in ${expression}, what is the first operation we should apply?`
        : `Checkpoint: what is the first small step you can do?`;
  const repeatedLine = args.repeated
    ? (gradeBand === 'primary'
      ? 'Let us try a new simple way so it does not feel repetitive.'
      : 'Let us take a different angle so this does not feel repetitive.')
    : (gradeBand === 'primary'
      ? 'I will not give the final homework answer directly. I will guide you with short steps so you can solve it yourself.'
      : 'I will not provide the final homework answer directly. I will coach your reasoning so you reach it yourself.');

  return localizedText(
    args.languageMode,
    `${repeatedLine}\n${checkLine}`,
    `${args.repeated ? 'Tujaribu mtazamo tofauti ili isitokee marudio yale yale.' : 'Sitatoa jibu la mwisho moja kwa moja. Nitakuongoza hatua kwa hatua ili ujipatie jibu mwenyewe.'}\n${checkLine}`
  );
}

function buildMathBasicsCheckLabel(expression: string, languageMode: string): string {
  return localizedText(
    languageMode,
    `Math basics check for ${expression}`,
    `Ukaguzi wa msingi wa hesabu kwa ${expression}`,
    `Ã™ÂÃ˜Â­Ã˜Âµ Ã˜Â£Ã˜Â³Ã˜Â§Ã˜Â³Ã™Å Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜Â±Ã™Å Ã˜Â§Ã˜Â¶Ã™Å Ã˜Â§Ã˜Âª Ã™â€žÃ™â‚¬ ${expression}`
  );
}

function buildMathRuleCheckLabel(expression: string, languageMode: string): string {
  return localizedText(
    languageMode,
    `Math rule check for ${expression}`,
    `Ukaguzi wa kanuni ya hesabu kwa ${expression}`,
    `Ã™ÂÃ˜Â­Ã˜Âµ Ã™â€šÃ˜Â§Ã˜Â¹Ã˜Â¯Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â±Ã™Å Ã˜Â§Ã˜Â¶Ã™Å Ã˜Â§Ã˜Âª Ã™â€žÃ™â‚¬ ${expression}`
  );
}

export function buildDenominatorQuestionLabel(fraction: string, languageMode: string): string {
  return localizedText(
    languageMode,
    `Denominator of ${fraction}`,
    `Denominator ya ${fraction}`,
    `Ã™â€¦Ã™â€šÃ˜Â§Ã™â€¦ ${fraction}`
  );
}

function buildReciprocalQuestionLabel(fraction: string, languageMode: string): string {
  return localizedText(
    languageMode,
    `Reciprocal of ${fraction}`,
    `Reciprocal ya ${fraction}`,
    `Ã™â€¦Ã™â€šÃ™â€žÃ™Ë†Ã˜Â¨ ${fraction}`
  );
}

function buildRewriteAsMultiplicationQuestionLabel(expression: string, languageMode: string): string {
  return localizedText(
    languageMode,
    `Rewrite ${expression} as multiplication`,
    `Andika upya ${expression} kama kuzidisha`,
    `Ã˜Â£Ã˜Â¹Ã˜Â¯ Ã™Æ’Ã˜ÂªÃ˜Â§Ã˜Â¨Ã˜Â© ${expression} Ã™Æ’Ã˜Â¹Ã™â€¦Ã™â€žÃ™Å Ã˜Â© Ã˜Â¶Ã˜Â±Ã˜Â¨`
  );
}

function buildProductsQuestionLabel(expression: string, languageMode: string): string {
  return localizedText(
    languageMode,
    `Products for ${expression}`,
    `Bidhaa za ${expression}`,
    `Ã™â€ Ã™Ë†Ã˜Â§Ã˜ÂªÃ˜Â¬ ${expression}`
  );
}

function buildSimplifiedFormQuestionLabel(fraction: string, languageMode: string): string {
  return localizedText(
    languageMode,
    `Simplified form of ${fraction}`,
    `Umbo lililorahisishwa la ${fraction}`,
    `Ã˜Â§Ã™â€žÃ˜ÂµÃ™Å Ã˜ÂºÃ˜Â© Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â¨Ã˜Â³Ã˜Â·Ã˜Â© Ã™â€žÃ™â‚¬ ${fraction}`
  );
}

function extractFirstSimpleFraction(expression: string): { fraction: string; numerator: string; denominator: string } | null {
  const match = String(expression || '').match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const numerator = String(match[1] || '').trim();
  const denominator = String(match[2] || '').trim();
  if (!numerator || !denominator) return null;
  return {
    fraction: `${numerator}/${denominator}`,
    numerator,
    denominator,
  };
}

export function buildMathKickoffPrompt(expression: string, languageMode: string, topicType: MathTopicType = 'generic'): string {
  const parts = parseFractionDivisionExpression(expression);
  if (topicType === 'fractions' && parts) {
    return localizedText(
      languageMode,
      `Great question. Before solving, let us lock the basics.\nA fraction has a numerator (top) and denominator (bottom).\nExample: in ${parts.n1}/${parts.d1}, numerator is ${parts.n1} and denominator is ${parts.d1}.\nCheck: in ${parts.n2}/${parts.d2}, which number is the denominator: ${parts.n2} or ${parts.d2}?`,
      `Swali zuri. Kabla ya kusuluhisha, tuanze na msingi.\nFraction ina numerator juu na denominator chini.\nMfano: kwenye ${parts.n1}/${parts.d1}, numerator ni ${parts.n1} na denominator ni ${parts.d1}.\nSwali: kwenye ${parts.n2}/${parts.d2}, denominator ni namba gani: ${parts.n2} au ${parts.d2}?`
    );
  }

  if (topicType === 'fractions') {
    const firstFraction = extractFirstSimpleFraction(expression);
    const fractionLabel = firstFraction?.fraction || '5/8';
    const numeratorLabel = firstFraction?.numerator || '5';
    const denominatorLabel = firstFraction?.denominator || '8';
    return localizedText(
      languageMode,
      `Great question. Before solving, let us lock the basics.\nA fraction has a numerator on top and denominator on bottom.\nCheck: in the fraction ${fractionLabel}, which number is the numerator: ${numeratorLabel} or ${denominatorLabel}?`,
      `Swali zuri. Kabla ya kusuluhisha, tuanze na msingi.\nFraction ina numerator juu na denominator chini.\nSwali: kwenye fraction ${fractionLabel}, numerator ni namba gani: ${numeratorLabel} au ${denominatorLabel}?`
    );
  }

  if (topicType === 'percentages') {
    return localizedText(
      languageMode,
      `Great question. Before solving, let us lock the basics.\nA percent means out of 100.\nCheck: choose the correct meaning of 25%: 25 out of 100 or 25 out of 10?`,
      `Swali zuri. Kabla ya kusuluhisha, tuanze na msingi.\nAsilimia inamaanisha kati ya 100.\nSwali: chagua maana sahihi ya 25%: 25 kati ya 100 au 25 kati ya 10?`
    );
  }

  if (topicType === 'equations') {
    return localizedText(
      languageMode,
      `Great question. Before solving, let us lock the basics.\nAn equation has two sides linked by an equal sign.\nCheck: in 2x + 3 = 11, which symbol shows both sides are equal: = or +?`,
      `Swali zuri. Kabla ya kusuluhisha, tuanze na msingi.\nEquation ina pande mbili zilizounganishwa na alama ya sawa.\nSwali: kwenye 2x + 3 = 11, ni alama gani inaonyesha pande zote ni sawa: = au +?`
    );
  }

  if (topicType === 'algebra') {
    return localizedText(
      languageMode,
      `Great question. Before solving, let us lock the basics.\nIn algebra, a variable is a symbol for an unknown value.\nCheck: in 3x + 2, does x represent an unknown number or the fixed number 3?`,
      `Swali zuri. Kabla ya kusuluhisha, tuanze na msingi.\nKwenye algebra, variable ni alama ya thamani isiyojulikana.\nSwali: kwenye 3x + 2, x inawakilisha namba isiyojulikana au namba maalum 3?`
    );
  }

  const genericChoiceLine = /[()]/.test(expression)
    ? `Check: in ${expression}, do we start inside brackets or outside brackets?`
    : /[\*\/]/.test(expression) && /[\+\-]/.test(expression)
      ? `Check: in ${expression}, which comes first: multiply/divide or add/subtract?`
      : `Check: in ${expression}, do we solve one small operation at a time from left to right: yes or no?`;
  const genericChoiceLineSw = /[()]/.test(expression)
    ? `Swali: kwenye ${expression}, tuanze ndani ya mabano au nje ya mabano?`
    : /[\*\/]/.test(expression) && /[\+\-]/.test(expression)
      ? `Swali: kwenye ${expression}, ni kipi huanza: kuzidisha/kugawanya au kujumlisha/kutoa?`
      : `Swali: kwenye ${expression}, tunafanya operesheni ndogo moja moja kutoka kushoto kwenda kulia: ndio au hapana?`;
  return localizedText(
    languageMode,
    `Great question. We will solve ${expression} slowly and clearly.\nFirst basic rule: identify the operation that controls the expression before calculating.\n${genericChoiceLine}`,
    `Swali zuri. Tutasuluhisha ${expression} polepole na kwa uwazi.\nKanuni ya kwanza: tambua operesheni inayoongoza swali kabla ya kuhesabu.\n${genericChoiceLineSw}`
  );
}

export function getMathKickoffExpectedAnswers(topicType: MathTopicType, expression: string): string[] {
  if (topicType === 'fractions') {
    const parts = parseFractionDivisionExpression(expression);
    if (parts) return [parts.d2];
    const firstFraction = extractFirstSimpleFraction(expression);
    if (firstFraction?.numerator) return [firstFraction.numerator];
    return ['5'];
  }
  if (topicType === 'percentages') return ['25 out of 100', '25/100', '25'];
  if (topicType === 'equations') return ['=', 'equal sign', 'equals sign'];
  if (topicType === 'algebra') return ['unknown value', 'unknown number', 'variable'];
  return [
    'bracket',
    'parenthesis',
    'inside bracket',
    'inside parenthesis',
    'multiply/divide',
    'multiplication',
    'division',
    'one step at a time',
    'left to right',
    'yes'
  ];
}

export function buildMathRetryScaffold(
  question: string,
  attempt: number,
  languageMode: string,
  topicType: MathTopicType = 'generic',
  gradeLevel?: string
): string {
  const gradeBand = getSocraticGradeBand(gradeLevel);
  const topicQuestion =
    topicType === 'fractions'
      ? 'Quick check: in 5/8, is the numerator 5 or 8?'
      : topicType === 'percentages'
        ? 'Quick check: is 25% equal to 25/100 or 100/25?'
        : topicType === 'equations'
          ? 'Quick check: in 2x + 3 = 11, is the balancing symbol "=" or "+"?'
          : topicType === 'algebra'
            ? 'Quick check: in 3x + 2, is x unknown or fixed?'
            : 'Quick check: do we go one operation at a time or do all operations at once?';
  const promptPrimary = attempt <= 1
    ? `Good try. Let us slow down.\nStep one: Read ${question} and name each part before calculating.\n${topicQuestion}`
    : attempt === 2
      ? `Nice effort. Let us make it simpler.\nStep one: Keep only the first operation and ignore the rest for now.\n${topicQuestion}`
      : attempt === 3
        ? `You are improving. Let us check using basics.\nStep one: Use the rule for this operation and write it in plain form.\n${topicQuestion}`
        : `Good persistence.\nStep one: Do one tiny computation only, then stop.\n${topicQuestion}`;
  const promptSecondary = attempt <= 1
    ? `Strong attempt. State the rule for ${question}, then apply only the first operation.\n${topicQuestion}`
    : attempt === 2
      ? `Good reasoning. Isolate one operation, justify why it comes first, then compute it.\n${topicQuestion}`
      : attempt === 3
        ? `You are close. Write the operation order in one short line, then do the next valid step.\n${topicQuestion}`
        : `Keep going. Do not jump to final answer. Show one justified micro-step only.\n${topicQuestion}`;
  const prompt = gradeBand === 'primary' ? promptPrimary : promptSecondary;
  return localizedText(languageMode, prompt, prompt, prompt);
}

export function buildMathWorkedExampleScaffold(
  question: string,
  step: number,
  languageMode: string,
  topicType: MathTopicType = 'generic',
  gradeLevel?: string
): string {
  const gradeBand = getSocraticGradeBand(gradeLevel);
  const checkQuestion =
    topicType === 'fractions'
      ? 'Which fraction rule did we use here: reciprocal, multiply, or simplify?'
      : topicType === 'percentages'
        ? 'Which percent rule did we use here: out-of-100, decimal conversion, or ratio?'
        : topicType === 'equations'
          ? 'Which equation move did we apply here to keep both sides balanced?'
          : topicType === 'algebra'
            ? 'Which algebra move did we apply to the variable term?'
            : 'What is the next small simplification you can do?';
  const safeStep = Math.max(1, Math.min(4, step));
  const textPrimary =
    safeStep === 1
      ? `Worked example (guided):\nStep one: First, rewrite ${question} clearly and label each part.\nCheck: ${checkQuestion}`
      : safeStep === 2
        ? `Worked example (guided):\nStep two: Apply one basic rule to that first part only.\nCheck: ${checkQuestion}`
        : safeStep === 3
          ? `Worked example (guided):\nStep three: Simplify the new expression carefully without jumping.\nCheck: ${checkQuestion}`
          : `Worked example (guided):\nStep four: Stop before the last move and let the learner finish.\nCheck: ${checkQuestion}`;
  const textSecondary =
    safeStep === 1
      ? `Guided reasoning example:\nStep one: Rewrite ${question} in a cleaner form and identify the controlling operation.\nCheck: ${checkQuestion}`
      : safeStep === 2
        ? `Guided reasoning example:\nStep two: Apply one valid operation and justify why it is valid now.\nCheck: ${checkQuestion}`
        : safeStep === 3
          ? `Guided reasoning example:\nStep three: Simplify carefully and verify operation order before moving.\nCheck: ${checkQuestion}`
          : `Guided reasoning example:\nStep four: Stop before the final jump and let the learner complete it.\nCheck: ${checkQuestion}`;
  const text = gradeBand === 'primary' ? textPrimary : textSecondary;
  return localizedText(languageMode, text, text, text);
}

export function buildMathSuccessFeedback(
  question: string,
  languageMode: string,
  topicType: MathTopicType = 'generic',
  gradeLevel?: string
): string {
  const gradeBand = getSocraticGradeBand(gradeLevel);
  const followUp =
    topicType === 'fractions'
      ? 'Before we continue: which fraction rule helped you most in this step?'
      : topicType === 'percentages'
        ? 'Before we continue: which percentage rule helped you most in this step?'
        : topicType === 'equations'
          ? 'Before we continue: which balancing move helped you most in this step?'
          : topicType === 'algebra'
            ? 'Before we continue: which algebra rule helped you most in this step?'
            : 'Before we continue: which rule helped you most in this step?';
  return localizedText(
    languageMode,
    gradeBand === 'primary'
      ? `Excellent effort. Your answer to ${question} is correct.\n${followUp}`
      : `Excellent reasoning. You solved this step in ${question} correctly.\n${followUp}`,
    gradeBand === 'primary'
      ? `Hongera kwa juhudi. Jibu lako la ${question} ni sahihi.\n${followUp}`
      : `Hongera kwa reasoning nzuri. Umesuluhisha hatua hii ya ${question} kwa usahihi.\n${followUp}`,
    gradeBand === 'primary'
      ? `Excellent effort. Your answer to ${question} is correct.\n${followUp}`
      : `Excellent reasoning. You solved this step in ${question} correctly.\n${followUp}`
  );
}

export function detectMathLessonKind(expression: string): 'fraction_division' | 'generic' {
  return parseFractionDivisionExpression(expression) ? 'fraction_division' : 'generic';
}

export type MathLessonStepPayload = {
  prompt: string;
  expectedAnswers: string[];
  activeQuestion: string;
};

function buildMathGenericStep(expression: string, step: number, languageMode: string): MathLessonStepPayload | null {
  const exp = String(expression || '').trim();
  if (!exp) return null;
  const stepOneCheck = /[()]/.test(exp)
    ? `Check: In ${exp}, do we start inside brackets or outside brackets?`
    : /[\*\/]/.test(exp) && /[\+\-]/.test(exp)
      ? `Check: In ${exp}, which comes first: multiply/divide or add/subtract?`
      : `Check: In ${exp}, do we solve one small operation at a time from left to right: yes or no?`;
  const stepOneCheckSw = /[()]/.test(exp)
    ? `Swali: Kwenye ${exp}, tuanze ndani ya mabano au nje ya mabano?`
    : /[\*\/]/.test(exp) && /[\+\-]/.test(exp)
      ? `Swali: Kwenye ${exp}, ni kipi huanza: kuzidisha/kugawanya au kujumlisha/kutoa?`
      : `Swali: Kwenye ${exp}, tunafanya operesheni ndogo moja moja kutoka kushoto kwenda kulia: ndio au hapana?`;

  if (step === 1) {
    const prompt = localizedText(
      languageMode,
      `Great. Before solving, we start with basics.\nStep one: In math, we follow order of operations: brackets first, then powers, then multiply/divide, then add/subtract.\n${stepOneCheck}`,
      `Vizuri. Kabla ya kusuluhisha, tuanze na msingi.\nHatua ya kwanza: Tunafuata mpangilio wa operesheni: mabano kwanza, kisha powers, kisha kuzidisha/kugawanya, halafu kujumlisha/kutoa.\n${stepOneCheckSw}`,
      `Ã™â€¦Ã™â€¦Ã˜ÂªÃ˜Â§Ã˜Â². Ã™â€šÃ˜Â¨Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â­Ã™â€ž Ã™â€ Ã˜Â¨Ã˜Â¯Ã˜Â£ Ã˜Â¨Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã˜Â§Ã˜Â³.\nÃ˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â£Ã™Ë†Ã™â€žÃ™â€°: Ã™â€ Ã˜ÂªÃ˜Â¨Ã˜Â¹ Ã˜ÂªÃ˜Â±Ã˜ÂªÃ™Å Ã˜Â¨ Ã˜Â§Ã™â€žÃ˜Â¹Ã™â€¦Ã™â€žÃ™Å Ã˜Â§Ã˜Âª: Ã˜Â§Ã™â€žÃ˜Â£Ã™â€šÃ™Ë†Ã˜Â§Ã˜Â³ Ã˜Â£Ã™Ë†Ã™â€žÃ˜Â§Ã™â€¹Ã˜Å’ Ã˜Â«Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã˜Â³Ã˜Å’ Ã˜Â«Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â¶Ã˜Â±Ã˜Â¨/Ã˜Â§Ã™â€žÃ™â€šÃ˜Â³Ã™â€¦Ã˜Â©Ã˜Å’ Ã˜Â«Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â¬Ã™â€¦Ã˜Â¹/Ã˜Â§Ã™â€žÃ˜Â·Ã˜Â±Ã˜Â­.\nÃ˜ÂªÃ˜Â­Ã™â€šÃ™â€š: Ã™ÂÃ™Å  ${exp} Ã™â€¦Ã˜Â§ Ã˜Â§Ã™â€žÃ˜Â¬Ã˜Â²Ã˜Â¡ Ã˜Â§Ã™â€žÃ˜Â°Ã™Å  Ã™â€ Ã˜Â¨Ã˜Â¯Ã˜Â£ Ã˜Â¨Ã™â€¡ Ã˜Â£Ã™Ë†Ã™â€žÃ˜Â§Ã™â€¹Ã˜Å¸`
    );
    return {
      prompt,
      expectedAnswers: [
        'bracket',
        'parenthesis',
        'inside bracket',
        'inside parenthesis',
        'multiply/divide',
        'multiplication',
        'division',
        'one step at a time',
        'left to right',
        'yes'
      ],
      activeQuestion: buildMathBasicsCheckLabel(exp, languageMode)
    };
  }

  if (step === 2) {
    const prompt = localizedText(
      languageMode,
      `Nice. One more basic check.\nStep two: We always do one small operation at a time, not everything at once.\nCheck: Which is correct: "one small step at a time" or "do everything at once"?`,
      `Sawa. Tuangalie msingi mmoja zaidi.\nHatua ya pili: Tunafanya operesheni ndogo moja kwa wakati, sio zote kwa pamoja.\nSwali: Kipi ni sahihi: "hatua ndogo moja moja" au "fanya yote kwa pamoja"?`,
      `Ã˜Â¬Ã™Å Ã˜Â¯. Ã™ÂÃ˜Â­Ã˜Âµ Ã˜Â£Ã˜Â³Ã˜Â§Ã˜Â³Ã™Å  Ã˜Â¥Ã˜Â¶Ã˜Â§Ã™ÂÃ™Å .\nÃ˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â«Ã˜Â§Ã™â€ Ã™Å Ã˜Â©: Ã™â€ Ã™â€ Ã™ÂÃ˜Â° Ã˜Â¹Ã™â€¦Ã™â€žÃ™Å Ã˜Â© Ã˜ÂµÃ˜ÂºÃ™Å Ã˜Â±Ã˜Â© Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯Ã˜Â© Ã™ÂÃ™Å  Ã™Æ’Ã™â€ž Ã™â€¦Ã˜Â±Ã˜Â© Ã˜Â¯Ã™Ë†Ã™â€  Ã˜Â§Ã™â€žÃ™â€šÃ™ÂÃ˜Â².\nÃ˜ÂªÃ˜Â­Ã™â€šÃ™â€š: Ã™â€¦Ã˜Â§ Ã˜Â§Ã™â€žÃ™â€šÃ˜Â§Ã˜Â¹Ã˜Â¯Ã˜Â© Ã˜Â§Ã™â€žÃ˜ÂªÃ™Å  Ã˜ÂªÃ™â€¦Ã™â€ Ã˜Â¹Ã™â€ Ã˜Â§ Ã™â€¦Ã™â€  Ã˜ÂªÃ˜Â¬Ã˜Â§Ã™Ë†Ã˜Â² Ã˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â§Ã˜Âª Ã™â€¡Ã™â€ Ã˜Â§Ã˜Å¸`
    );
    return {
      prompt,
      expectedAnswers: ['order of operations', 'bodmas', 'pemdas', 'one step at a time'],
      activeQuestion: buildMathRuleCheckLabel(exp, languageMode)
    };
  }

  return null;
}

function buildMathFractionDivisionStep(
  expression: string,
  step: number,
  languageMode: string,
  finalAnswer?: string | null
): MathLessonStepPayload | null {
  const parts = parseFractionDivisionExpression(expression);
  if (!parts) return null;

  const reciprocal = `${parts.d2}/${parts.n2}`;
  const rewrittenA = `(${parts.n1}/${parts.d1})*(${parts.d2}/${parts.n2})`;
  const rewrittenB = `${parts.n1}/${parts.d1}*${parts.d2}/${parts.n2}`;
  const topProduct = String(Number(parts.n1) * Number(parts.d2));
  const bottomProduct = String(Number(parts.d1) * Number(parts.n2));
  const productFraction = `${topProduct}/${bottomProduct}`;
  const finalExpected = String(finalAnswer || '').trim();

  if (step === 1) {
    const prompt = localizedText(
      languageMode,
      `Great. We start with basics first.\nStep one: A fraction has two parts: top is the numerator, bottom is the denominator.\nExample: in ${parts.n1}/${parts.d1}, numerator is ${parts.n1} and denominator is ${parts.d1}.\nCheck: In ${parts.n2}/${parts.d2}, which number is the denominator: ${parts.n2} or ${parts.d2}?`,
      `Vizuri. Tuanze na msingi kwanza.\nHatua ya kwanza: Sehemu ya juu ya fraction ni numerator, ya chini ni denominator.\nMfano: kwenye ${parts.n1}/${parts.d1}, numerator ni ${parts.n1} na denominator ni ${parts.d1}.\nSwali: Kwenye ${parts.n2}/${parts.d2}, denominator ni namba gani: ${parts.n2} au ${parts.d2}?`,
      `Ã™â€¦Ã™â€¦Ã˜ÂªÃ˜Â§Ã˜Â². Ã™â€ Ã˜Â¨Ã˜Â¯Ã˜Â£ Ã˜Â¨Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã˜Â§Ã˜Â³ Ã˜Â£Ã™Ë†Ã™â€žÃ˜Â§Ã™â€¹.\nÃ˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â£Ã™Ë†Ã™â€žÃ™â€°: Ã˜Â§Ã™â€žÃ™Æ’Ã˜Â³Ã˜Â± Ã™â€žÃ™â€¡ Ã˜Â¬Ã˜Â²Ã˜Â¢Ã™â€ : Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â³Ã˜Â· Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â¹Ã™â€žÃ™â€° Ã™Ë†Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ˜Â§Ã™â€¦ Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã™ÂÃ™â€ž.\nÃ™ÂÃ™Å  ${parts.n1}/${parts.d1} Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â³Ã˜Â· Ã™â€¡Ã™Ë† ${parts.n1} Ã™Ë†Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ˜Â§Ã™â€¦ Ã™â€¡Ã™Ë† ${parts.d1}.\nÃ˜ÂªÃ˜Â­Ã™â€šÃ™â€š: Ã™ÂÃ™Å  ${parts.n1}/${parts.d1} Ã™â€¦Ã˜Â§ Ã™â€¡Ã™Ë† Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â³Ã˜Â·Ã˜Å¸`
    );
    return {
      prompt,
      expectedAnswers: [parts.d2],
      activeQuestion: buildDenominatorQuestionLabel(`${parts.n2}/${parts.d2}`, languageMode)
    };
  }

  if (step === 2) {
    const prompt = localizedText(
      languageMode,
      `Good. Next basic rule.\nStep two: Dividing by a fraction means multiply by its reciprocal.\nFor ${parts.n2}/${parts.d2}, the reciprocal is ${reciprocal}.\nCheck: What is the reciprocal of ${parts.n2}/${parts.d2}?`,
      `Sawa. Sasa kanuni ya pili.\nHatua ya pili: Kugawa kwa fraction ni sawa na kuzidisha kwa reciprocal yake.\nKwa ${parts.n2}/${parts.d2}, reciprocal ni ${reciprocal}.\nSwali: Reciprocal ya ${parts.n2}/${parts.d2} ni ipi?`,
      `Ã˜Â¬Ã™Å Ã˜Â¯. Ã˜Â§Ã™â€žÃ˜Â¢Ã™â€  Ã˜Â§Ã™â€žÃ™â€šÃ˜Â§Ã˜Â¹Ã˜Â¯Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â«Ã˜Â§Ã™â€ Ã™Å Ã˜Â©.\nÃ˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â«Ã˜Â§Ã™â€ Ã™Å Ã˜Â©: Ã˜Â§Ã™â€žÃ™â€šÃ˜Â³Ã™â€¦Ã˜Â© Ã˜Â¹Ã™â€žÃ™â€° Ã™Æ’Ã˜Â³Ã˜Â± Ã˜ÂªÃ˜Â¹Ã™â€ Ã™Å  Ã˜Â§Ã™â€žÃ˜Â¶Ã˜Â±Ã˜Â¨ Ã™ÂÃ™Å  Ã™â€¦Ã™â€šÃ™â€žÃ™Ë†Ã˜Â¨Ã™â€¡.\nÃ™â€žÃ™Æ’Ã˜Â³Ã˜Â± ${parts.n2}/${parts.d2} Ã™Å Ã™Æ’Ã™Ë†Ã™â€  Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ™â€žÃ™Ë†Ã˜Â¨ ${reciprocal}.\nÃ˜ÂªÃ˜Â­Ã™â€šÃ™â€š: Ã™â€¦Ã˜Â§ Ã™â€¦Ã™â€šÃ™â€žÃ™Ë†Ã˜Â¨ ${parts.n2}/${parts.d2}Ã˜Å¸`
    );
    return {
      prompt,
      expectedAnswers: [reciprocal, `${parts.d2} over ${parts.n2}`],
      activeQuestion: buildReciprocalQuestionLabel(`${parts.n2}/${parts.d2}`, languageMode)
    };
  }

  if (step === 3) {
    const prompt = localizedText(
      languageMode,
      `Excellent. Now apply the rule.\nStep three: Rewrite ${expression} as multiplication by the reciprocal.\nIt becomes ${rewrittenA}.\nCheck: Write the rewritten multiplication form.`,
      `Vizuri sana. Sasa tumia kanuni.\nHatua ya tatu: Andika upya ${expression} kama kuzidisha kwa reciprocal.\nInakuwa ${rewrittenA}.\nSwali: Andika umbo hilo jipya la kuzidisha.`,
      `Ã™â€¦Ã™â€¦Ã˜ÂªÃ˜Â§Ã˜Â². Ã˜Â§Ã™â€žÃ˜Â¢Ã™â€  Ã™â€ Ã˜Â·Ã˜Â¨Ã™â€š Ã˜Â§Ã™â€žÃ™â€šÃ˜Â§Ã˜Â¹Ã˜Â¯Ã˜Â©.\nÃ˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â«Ã˜Â§Ã™â€žÃ˜Â«Ã˜Â©: Ã˜Â£Ã˜Â¹Ã˜Â¯ Ã™Æ’Ã˜ÂªÃ˜Â§Ã˜Â¨Ã˜Â© ${expression} Ã™Æ’Ã˜Â¹Ã™â€¦Ã™â€žÃ™Å Ã˜Â© Ã˜Â¶Ã˜Â±Ã˜Â¨ Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ™â€žÃ™Ë†Ã˜Â¨.\nÃ˜ÂªÃ˜ÂµÃ˜Â¨Ã˜Â­ ${rewrittenA}.\nÃ˜ÂªÃ˜Â­Ã™â€šÃ™â€š: Ã˜Â§Ã™Æ’Ã˜ÂªÃ˜Â¨ Ã˜ÂµÃ™Å Ã˜ÂºÃ˜Â© Ã˜Â§Ã™â€žÃ˜Â¶Ã˜Â±Ã˜Â¨ Ã˜Â§Ã™â€žÃ˜Â¬Ã˜Â¯Ã™Å Ã˜Â¯Ã˜Â©.`
    );
    return {
      prompt,
      expectedAnswers: [rewrittenA, rewrittenB],
      activeQuestion: buildRewriteAsMultiplicationQuestionLabel(expression, languageMode)
    };
  }

  if (step === 4) {
    const prompt = localizedText(
      languageMode,
      `Good progress.\nStep four: Multiply numerator by numerator and denominator by denominator.\nFor ${rewrittenA}, you get ${parts.n1}x${parts.d2} on top and ${parts.d1}x${parts.n2} below.\nCheck: What two numbers do you get before simplifying?`,
      `Unaendelea vizuri.\nHatua ya nne: Zidisha numerator kwa numerator na denominator kwa denominator.\nKwa ${rewrittenA}, juu ni ${parts.n1}x${parts.d2} na chini ni ${parts.d1}x${parts.n2}.\nSwali: Ni namba zipi mbili unapata kabla ya kurahisisha?`,
      `Ã˜ÂªÃ™â€šÃ˜Â¯Ã™â€¦ Ã˜Â¬Ã™Å Ã˜Â¯.\nÃ˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â§Ã˜Â¨Ã˜Â¹Ã˜Â©: Ã™â€ Ã˜Â¶Ã˜Â±Ã˜Â¨ Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â³Ã˜Â· Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â³Ã˜Â· Ã™Ë†Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ˜Â§Ã™â€¦ Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ˜Â§Ã™â€¦.\nÃ™ÂÃ™Å  ${rewrittenA} Ã™â€ Ã˜Â­Ã˜ÂµÃ™â€ž Ã˜Â¹Ã™â€žÃ™â€° ${parts.n1}x${parts.d2} Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â¹Ã™â€žÃ™â€° Ã™Ë† ${parts.d1}x${parts.n2} Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã™ÂÃ™â€ž.\nÃ˜ÂªÃ˜Â­Ã™â€šÃ™â€š: Ã™â€¦Ã˜Â§ Ã˜Â§Ã™â€žÃ˜Â¹Ã˜Â¯Ã˜Â¯Ã˜Â§Ã™â€  Ã˜Â§Ã™â€žÃ™â€ Ã˜Â§Ã˜ÂªÃ˜Â¬Ã˜Â§Ã™â€  Ã™â€šÃ˜Â¨Ã™â€ž Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â¨Ã˜Â³Ã™Å Ã˜Â·Ã˜Å¸`
    );
    return {
      prompt,
      expectedAnswers: [`${topProduct} and ${bottomProduct}`, `${topProduct},${bottomProduct}`, productFraction],
      activeQuestion: buildProductsQuestionLabel(rewrittenA, languageMode)
    };
  }

  if (step === 5) {
    const prompt = localizedText(
      languageMode,
      `Almost there.\nStep five: The fraction before simplifying is ${productFraction}.\nNow simplify by dividing top and bottom by the same common factor.\nCheck: What is the simplified fraction?`,
      `Karibu tumemaliza.\nHatua ya tano: Fraction kabla ya kurahisisha ni ${productFraction}.\nSasa rahisisha kwa kugawa juu na chini kwa factor moja ya pamoja.\nSwali: Fraction iliyorahisishwa ni ipi?`,
      `Ã˜Â§Ã™â€šÃ˜ÂªÃ˜Â±Ã˜Â¨Ã™â€ Ã˜Â§ Ã™â€¦Ã™â€  Ã˜Â§Ã™â€žÃ™â€ Ã™â€¡Ã˜Â§Ã™Å Ã˜Â©.\nÃ˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â®Ã˜Â§Ã™â€¦Ã˜Â³Ã˜Â©: Ã˜Â§Ã™â€žÃ™Æ’Ã˜Â³Ã˜Â± Ã™â€šÃ˜Â¨Ã™â€ž Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â¨Ã˜Â³Ã™Å Ã˜Â· Ã™â€¡Ã™Ë† ${productFraction}.\nÃ˜Â§Ã™â€žÃ˜Â¢Ã™â€  Ã™â€ Ã˜Â¨Ã˜Â³Ã˜Â· Ã˜Â¨Ã™â€šÃ˜Â³Ã™â€¦Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â³Ã˜Â· Ã™Ë†Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ˜Â§Ã™â€¦ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â¹Ã˜Â§Ã™â€¦Ã™â€ž Ã™â€¦Ã˜Â´Ã˜ÂªÃ˜Â±Ã™Æ’.\nÃ˜ÂªÃ˜Â­Ã™â€šÃ™â€š: Ã™â€¦Ã˜Â§ Ã˜Â§Ã™â€žÃ™Æ’Ã˜Â³Ã˜Â± Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â¨Ã˜Â³Ã˜Â·Ã˜Å¸`
    );
    const expected = finalExpected ? [finalExpected] : [];
    return {
      prompt,
      expectedAnswers: expected,
      activeQuestion: buildSimplifiedFormQuestionLabel(productFraction, languageMode)
    };
  }

  return null;
}

export function buildMathLessonStep(
  kind: 'fraction_division' | 'generic',
  expression: string,
  step: number,
  languageMode: string,
  finalAnswer?: string | null
): MathLessonStepPayload | null {
  if (kind === 'fraction_division') {
    return buildMathFractionDivisionStep(expression, step, languageMode, finalAnswer);
  }
  return buildMathGenericStep(expression, step, languageMode);
}

export function buildMathFoundationRetryScaffold(
  kind: 'fraction_division' | 'generic',
  expression: string,
  step: number,
  attempt: number,
  languageMode: string
): string {
  if (kind === 'fraction_division') {
    const parts = parseFractionDivisionExpression(expression);
    if (parts && step === 1) {
      return localizedText(
        languageMode,
        `No problem, we go slower.\nStep one recap: In any fraction, top is numerator and bottom is denominator.\nUse this example first: in ${parts.n1}/${parts.d1}, denominator is ${parts.d1}.\nCheck again: In ${parts.n2}/${parts.d2}, is the denominator ${parts.n2} or ${parts.d2}?`,
        `Hakuna shida, twende polepole.\nMuhtasari wa hatua ya kwanza: Kwa fraction yoyote, juu ni numerator na chini ni denominator.\nTumia mfano huu kwanza: kwenye ${parts.n1}/${parts.d1}, denominator ni ${parts.d1}.\nSwali tena: Kwenye ${parts.n2}/${parts.d2}, denominator ni ${parts.n2} au ${parts.d2}?`,
        `Ã™â€žÃ˜Â§ Ã™â€¦Ã˜Â´Ã™Æ’Ã™â€žÃ˜Â©Ã˜Å’ Ã˜Â³Ã™â€ Ã™â€¦Ã˜Â´Ã™Å  Ã˜Â¨Ã˜Â¨Ã˜Â·Ã˜Â¡.\nÃ™â€¦Ã˜Â±Ã˜Â§Ã˜Â¬Ã˜Â¹Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â£Ã™Ë†Ã™â€žÃ™â€°: Ã™ÂÃ™Å  Ã˜Â£Ã™Å  Ã™Æ’Ã˜Â³Ã˜Â±Ã˜Å’ Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â¹Ã™â€žÃ™â€° Ã™â€¡Ã™Ë† Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â³Ã˜Â· Ã™Ë†Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã™ÂÃ™â€ž Ã™â€¡Ã™Ë† Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ˜Â§Ã™â€¦.\nÃ™ÂÃ™Å  ${parts.n1}/${parts.d1} Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â¹Ã™â€žÃ™â€°=${parts.n1} Ã™Ë†Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã™ÂÃ™â€ž=${parts.d1}.\nÃ˜ÂªÃ˜Â­Ã™â€šÃ™â€š Ã™â€¦Ã˜Â±Ã˜Â© Ã˜Â£Ã˜Â®Ã˜Â±Ã™â€°: Ã™â€¦Ã˜Â§ Ã™â€¡Ã™Ë† Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â³Ã˜Â·Ã˜Å¸`
      );
    }
  }

  const attemptLabel = Math.max(1, Number(attempt || 1));
  return localizedText(
    languageMode,
    `Good effort. Let us repeat the basic rule for this step clearly.\nStep one: Focus on one tiny part only, then answer the check question.\nThis is attempt ${attemptLabel}.`,
    `Juhudi nzuri. Turudie kanuni ya msingi ya hatua hii kwa uwazi.\nHatua ya kwanza: Lenga sehemu ndogo moja tu, kisha jibu swali la ukaguzi.\nHii ni jaribio la ${attemptLabel}.`,
    `Ã™â€¦Ã˜Â­Ã˜Â§Ã™Ë†Ã™â€žÃ˜Â© Ã˜Â¬Ã™Å Ã˜Â¯Ã˜Â©. Ã™â€žÃ™â€ Ã™Æ’Ã˜Â±Ã˜Â± Ã˜Â§Ã™â€žÃ™â€šÃ˜Â§Ã˜Â¹Ã˜Â¯Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã˜Â§Ã˜Â³Ã™Å Ã˜Â© Ã™â€žÃ™â€¡Ã˜Â°Ã™â€¡ Ã˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â¨Ã™Ë†Ã˜Â¶Ã™Ë†Ã˜Â­.\nÃ˜Â§Ã™â€žÃ˜Â®Ã˜Â·Ã™Ë†Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â£Ã™Ë†Ã™â€žÃ™â€°: Ã˜Â±Ã™Æ’Ã˜Â² Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â¬Ã˜Â²Ã˜Â¡ Ã˜ÂµÃ˜ÂºÃ™Å Ã˜Â± Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯ Ã˜Â«Ã™â€¦ Ã˜Â£Ã˜Â¬Ã˜Â¨ Ã˜Â³Ã˜Â¤Ã˜Â§Ã™â€ž Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â­Ã™â€šÃ™â€š.\nÃ™â€¡Ã˜Â°Ã™â€¡ Ã™â€¡Ã™Å  Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â­Ã˜Â§Ã™Ë†Ã™â€žÃ˜Â© Ã˜Â±Ã™â€šÃ™â€¦ ${attemptLabel}.`
  );
}

export function isMathClarificationInput(text: string): boolean {
  const lower = String(text || '').toLowerCase();
  if (!lower) return false;
  return /\b(for which|which fraction|what do you mean|which one|clarify|explain that|i do not understand|not clear|no fraction)\b/.test(lower);
}

export function buildMathStepClarification(
  kind: 'fraction_division' | 'generic',
  expression: string,
  step: number,
  languageMode: string
): string {
  if (kind === 'fraction_division') {
    const parts = parseFractionDivisionExpression(expression);
    if (parts && step === 1) {
      return localizedText(
        languageMode,
        `Good question. I am asking about the second fraction: ${parts.n2}/${parts.d2}. In that fraction, tell me the denominator (the bottom number).`,
        `Swali zuri. Nauliza kuhusu fraction ya pili: ${parts.n2}/${parts.d2}. Kwenye fraction hiyo, niambie denominator (namba ya chini).`
      );
    }
    if (parts && step === 2) {
      return localizedText(
        languageMode,
        `Good question. We are still using the second fraction ${parts.n2}/${parts.d2}. I need its reciprocal, which flips top and bottom.`,
        `Swali zuri. Bado tunatumia fraction ya pili ${parts.n2}/${parts.d2}. Nahitaji reciprocal yake, yaani geuza juu na chini.`
      );
    }
  }

  return localizedText(
    languageMode,
    `Good question. I am asking only about the current step, not the whole problem. Let us answer this step first, then we move on.`,
    `Swali zuri. Nauliza kuhusu hatua hii pekee, sio swali lote. Tujibu hatua hii kwanza, kisha tuendelee.`
  );
}

