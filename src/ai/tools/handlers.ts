'use server';

/**
 * handlers.ts
 *
 * Fully updated tool handlers for STEADFAST AI copilot.
 * Enforces: plain-text outputs for the learner, micro-step teaching,
 * zero-assumption start, and adaptive pacing (Mode A base + adaptive).
 *
 * Fixed for ES2018 compatibility (Regex flags) and syncing GUARDIAN_SANITIZE.
 */

import { create, all } from 'mathjs';
import { runFlow } from '@genkit-ai/flow';
// flows below may be optional; keep imports to allow video tools
import { webSearchFlow } from '../flows/web_search_flow';
import { getYoutubeTranscriptFlow } from '../flows/get-youtube-transcript';

// Initialize mathjs
const math = create(all, {});

/* --------------------------
   Helpers
   -------------------------- */

/**
 * Clean text to extract math expressions.
 * Keeps digits, basic operators, parentheses, decimals, variable letters.
 */
function extractMathExpression(text: string): string {
  if (!text) return '';
  // keep numbers, letters x,y, operators, parentheses, decimal points
  return text.replace(/[^0-9a-zA-Z\.\+\-\*\/\^\(\)=]/g, '');
}

/** Basic Arabic detection */
function isArabicText(text: string): boolean {
  if (!text) return false;
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
}

/** Normalize lower-case, trimmed */
function norm(text?: string): string {
  return (text || '').trim().toLowerCase();
}

/** 
 * Standard Emoji Regex (Ranges) to avoid ES2018 \p{} requirement 
 * Matches common emoji ranges including surrogates
 */
const EMOJI_REGEX = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

/* --------------------------
   1) emotional_decoder & SAFETY FIREWALL
   -------------------------- */

export async function emotional_decoder(args: { text: string }) {
  const raw = (args.text || '').toLowerCase();

  const triggers: string[] = [];

  // Safety firewall keywords
  const forbidden = [
    "sex", "dating", "romance", "violence", "kill", "suicide", "harm",
    "drug", "alcohol", "politics", "vote", "gambling", "betting",
    "hack", "cybercrime", "cheat", "porn", "nude"
  ];
  for (const w of forbidden) if (raw.includes(w)) triggers.push(w);
  if (triggers.length > 0) return { emotion: "safety_violation", triggers, suggestedLanguageMode: "english" };

  // Insult detection
  const insults = ["hate", "stupid", "dumb", "idiot", "useless", "shut up", "rubbish", "fool", "bad bot", "useless ai"];
  for (const w of insults) if (raw.includes(w)) triggers.push(w);
  if (triggers.length > 0) return { emotion: "angry_insult", triggers, suggestedLanguageMode: "english" };

  // Confusion cues
  const confusedPhrases = ["don't get", "dont get", "confus", "i'm lost", "i am lost", "lost", "i don't know", "i dont know", "not sure"];
  for (const p of confusedPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "confused", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // Frustration
  const frustratedPhrases = ["stuck", "give up", "can't", "cant", "wrong", "failed", "not working", "it does not work", "it doesn't work"];
  for (const p of frustratedPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "frustrated", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // Boredom
  const boredPhrases = ["bored", "boring", "tired", "sleepy", "meh"];
  for (const p of boredPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "bored", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // Positive / excited
  const excitedPhrases = ["yay", "wow", "fun", "great", "thanks", "thank you", "cool", "nice", "well done", "shukran"];
  for (const p of excitedPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "excited", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // Sad
  const sadPhrases = ["sad", "upset", "cry", "feel bad", "miserable"];
  for (const p of sadPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "sad", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // Default neutral
  return { emotion: "neutral", triggers: [], suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };
}

/* --------------------------
   2) tone_generator (HUMAN TEACHER MODE)
   -------------------------- */

export async function tone_generator(args: { emotion: string }) {
  const e = norm(args.emotion || 'neutral');

  if (e === "safety_violation") {
    return {
      mode: 'block',
      raw: "I cannot answer that. I am here to help with school work only. What would you like to learn next?"
    };
  }

  if (e === "angry_insult") {
    return {
      mode: 'insult',
      raw: "I am here to help you, even if you are upset. Let us learn together. What would you like to learn next?"
    };
  }

  if (e === "confused") {
    return {
      mode: 'support',
      hintPrefix: "That is okay. Let us take one tiny step together.",
      style: "warm, patient, very simple"
    };
  }
  if (e === "frustrated") {
    return {
      mode: 'support',
      hintPrefix: "I see this feels hard. We will take it slowly together.",
      style: "steady, calm"
    };
  }
  if (e === "bored") {
    return {
      mode: 'engage',
      hintPrefix: "Let us make this fun with a simple local example.",
      style: "bright, short"
    };
  }
  if (e === "excited") {
    return {
      mode: 'celebrate',
      hintPrefix: "Great energy! Well done for trying.",
      style: "encouraging"
    };
  }
  if (e === "sad") {
    return {
      mode: 'comfort',
      hintPrefix: "I am here with you. We can go slowly together.",
      style: "soft, gentle"
    };
  }

  return {
    mode: 'neutral',
    hintPrefix: "Let us try one small idea together.",
    style: "calm, clear"
  };
}

/* --------------------------
   3) teaching_micro_step
   -------------------------- */

export async function teaching_micro_step(args: { topic: string; studentLevel?: string; context?: string; adaptMode?: boolean }) {
  const topic = (args.topic || 'this topic').toLowerCase();
  const level = (args.studentLevel || 'beginner').toLowerCase();
  const adapt = !!args.adaptMode;

  const make = (idea: string, example: string, question: string) => ({
    microIdea: idea,
    example,
    question
  });

  if (topic.includes("simultaneous")) {
    if (level === 'beginner') {
      return make(
        "A simultaneous equations problem is a small price puzzle with two clues.",
        "Imagine a mandazi and a cup of chai together cost thirty shillings, but you do not know each price.",
        "Does that simple picture of a price puzzle make sense so far?"
      );
    }
    if (level === 'primary' || level === 'upper_primary') {
      return make(
        "It is a puzzle where two unknowns are fixed by two clues, so we solve for both together.",
        "One friend buys two mandazi and one chai for forty shillings; another buys one mandazi and two chai for thirty shillings.",
        "Would you like us to write the first small equation from the first clue?"
      );
    }
    return make(
      "We use two equations at the same time to find the two unknown values that satisfy both.",
      "From each market purchase we get one equation; together they let us solve both prices.",
      "Shall we start with one small equation from the first purchase?"
    );
  }

  if (topic.includes("fractions")) {
    return make(
      "A fraction is one part of a whole thing.",
      "If you cut one chapati into four equal parts, each part is (1 / 4).",
      "Does that idea of a part of a whole make sense?"
    );
  }

  if (topic.includes("algebra") || topic.includes("equation")) {
    return make(
      "Algebra is finding a hidden number in a simple puzzle.",
      "If a mango and a banana cost thirty shillings, we try find the price of the banana.",
      "Would you like to try a very small example together?"
    );
  }

  if (topic.includes("geometry") || topic.includes("shape")) {
    return make(
      "Geometry is about shapes and how space fits them.",
      "Think of a football field as a rectangle and a wheel as a circle.",
      "Can you name a round shape near you now?"
    );
  }

  if (topic.includes("qur") || topic.includes("quran")) {
    return make(
      "We will learn a small part of the verse and its simple meaning slowly.",
      "We read a short verse slowly and reflect on one meaning like kindness.",
      "Would you like a short verse or a simple meaning first?"
    );
  }

  const safeIdea = `Let's look at the simplest idea behind ${topic}. Think of it as part of daily life.`;
  const safeExample = `Imagine a small, real Kenyan example with ${topic} and no technical words yet.`;
  const safeQuestion = `Does this simple idea make sense so far?`;

  if (adapt) {
    return make(
      `Here is the simplest key idea about ${topic}.`,
      safeExample,
      safeQuestion
    );
  }

  return make(safeIdea, safeExample, safeQuestion);
}

/* --------------------------
   4) math_validate_answer
   -------------------------- */

export async function math_validate_answer(args: { question: string; studentAnswer: string }) {
  try {
    const qRaw = (args.question || '').trim();
    const sRaw = (args.studentAnswer || '').trim();

    const qClean = extractMathExpression(qRaw);
    const sClean = extractMathExpression(sRaw);

    if (!qClean) {
      return {
        isCorrect: false,
        computedAnswer: "unknown",
        explanation: "I could not detect a math expression in the question. Please provide a simple expression like (10 - 3)."
      };
    }

    let correctVal: any;
    try {
      correctVal = math.evaluate(qClean);
    } catch (e) {
      return {
        isCorrect: false,
        computedAnswer: "unknown",
        explanation: "This question is too complex for automatic calculation. Please check step by step manually."
      };
    }

    let studentVal: any;
    try {
      if (!sClean) throw new Error("no numeric parse");
      studentVal = math.evaluate(sClean);
    } catch (e) {
      const wordsToNum: Record<string, number> = {
        "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4,
        "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
      };
      const lowerS = sRaw.toLowerCase();
      if (wordsToNum[lowerS] !== undefined) {
        studentVal = wordsToNum[lowerS];
      } else {
        return {
          isCorrect: false,
          computedAnswer: String(correctVal),
          explanation: `I calculated ${correctVal}, but I could not parse the student's answer \"${sRaw}\". Treat it as incorrect and guide them gently.`
        };
      }
    }

    let isCorrect = false;
    if (typeof correctVal === 'number' && typeof studentVal === 'number') {
      isCorrect = Math.abs(correctVal - studentVal) < 1e-9;
    } else {
      isCorrect = String(correctVal) === String(studentVal);
    }

    if (isCorrect) {
      return {
        isCorrect: true,
        computedAnswer: String(correctVal),
        explanation: "Correct. The calculation matches. Praise gently and move to the next tiny step."
      };
    } else {
      return {
        isCorrect: false,
        computedAnswer: String(correctVal),
        explanation: `Incorrect. The actual answer is ${correctVal}. The student wrote \"${sRaw}\". Gently correct and ask a smaller micro-step question.`
      };
    }
  } catch (err) {
    return { isCorrect: false, computedAnswer: null, explanation: "Error validating answer." };
  }
}

/* --------------------------
   5) math_generate_question
   -------------------------- */

export async function math_generate_question(args: { topic: string; difficulty?: string }) {
  const t = (args.topic || '').toLowerCase();
  // Simple bank
  if (t.includes("subtraction") || t.includes("minus")) {
    return { question: "(10 - 3)", answerKeywords: "7,seven" };
  }
  if (t.includes("fractions")) {
    return { question: "(1 / 2)", answerKeywords: "0.5,half" };
  }
  if (t.includes("simultaneous")) {
    return { question: "Write one small equation from one purchase, for example (m + c = 30)", answerKeywords: "m + c,mandazi chai" };
  }
  return { question: "(2 + 2)", answerKeywords: "4,four" };
}

/* --------------------------
   6) formatting_polisher (ENFORCER)
   -------------------------- */

export async function formatting_polisher(args: { rawText: string; languageMode?: string }) {
  let text = args.rawText || '';

  // Use [\s\S] instead of . with /s flag to support environments without ES2018 dotAll support
  text = text.replace(/\\\[[\s\S]*?\\\]/g, match => {
    return '(' + match.replace(/\\\[|\\\]|\\\(|\\\)/g, '').replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1 / $2)') + ')';
  });
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, '($1)');

  text = text.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1 / $2)');
  text = text.replace(/(\*\*|__|\*|_|`|~~~|```|#{1,6}\s*)/g, '');
  text = text.replace(/[\\\[\]\{\}]/g, '');
  text = text.replace(/(\b\d+)\s*\/\s*(\d+\b)/g, '($1 / $2)');

  text = text.replace(/(^|[^(\[])\s*([A-Za-z0-9\s\+\-\*\/]+=[A-Za-z0-9\s\+\-\*\/]+)\s*(?=$|\.|\?|\!)/g, (m, p, eq) => {
    const eqTrim = eq.trim();
    if (eqTrim.startsWith('(') && eqTrim.endsWith(')')) return m;
    return p + `(${eqTrim})`;
  });

  text = text.replace(/\n{2,}/g, '\n').replace(/\n/g, ' ');
  text = text.replace(/\b(I am sorry|as an ai|I apologize|Sorry, I am an AI)\b/gi, '');
  text = text.trim();

  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount > 1) {
    const lastIndex = text.lastIndexOf('?');
    if (lastIndex >= 0) {
      text = text.substring(0, lastIndex).replace(/\?/g, '.') + text.substring(lastIndex);
    }
  }
  if (text.includes('?')) {
    const lastIdx = text.lastIndexOf('?');
    const before = text.substring(0, lastIdx).replace(/\?/g, '.');
    const after = text.substring(lastIdx);
    text = (before + after).trim();
  }

  text = text.replace(/([a-z0-9,;:\)\(]{40,}?)\s+([A-Z])/g, (m, a, b) => {
    return `${a}. ${b}`;
  });

  text = text.replace(/(^|\.\s+|\?\s+)(\d+)\b/g, (m, p, num) => {
    const mapStart: any = { "1": "One", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine", "10": "Ten" };
    return `${p}${mapStart[num] || num}`;
  });
  text = text.replace(/\s(\d+)([\.!\?])$/g, (m, num, punc) => {
    const mapEnd: any = { "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten" };
    return ` ${mapEnd[num] || num}${punc}`;
  });

  return { cleanedText: text.trim() };
}

/* --------------------------
   7) emoji_policy_check
   -------------------------- */

export async function emoji_policy_check(args: { text: string; languageMode?: string }) {
  let text = args.text || '';
  const languageMode = (args.languageMode || 'english').toLowerCase();
  const isArabic = languageMode.startsWith('arabic') || isArabicText(text);

  text = text.replace(/💙/g, '');

  if (isArabic) {
    // Remove all emojis using safer range regex
    text = text.replace(EMOJI_REGEX, '');
    return { ok: true, cleanedText: text };
  }

  // Collect emojis
  const emojis = Array.from(text.match(EMOJI_REGEX) || []);
  if (emojis.length > 1) {
    const first = emojis[0];
    text = text.replace(EMOJI_REGEX, '');
    text = text + ' ' + first;
  }

  const lastQ = text.lastIndexOf('?');
  if (lastQ !== -1) {
    const after = text.slice(lastQ + 1);
    // Check if after contains emoji using simple test
    if (/[^\s]/.test(after) && EMOJI_REGEX.test(after)) {
      const left = text.slice(0, lastQ + 1);
      text = left;
    }
  }

  return { ok: true, cleanedText: text };
}

/* --------------------------
   8) arabic_mode_formatter
   -------------------------- */

export async function arabic_mode_formatter(args: { text: string }) {
  let text = args.text || '';
  // Remove emojis using standard regex
  text = text.replace(EMOJI_REGEX, '');
  text = text.replace(/\?/g, '؟').replace(/,/g, '،').replace(/;/g, '؛');
  return { cleanedText: text.trim() };
}

/* --------------------------
   9) quran_pedagogy
   -------------------------- */

export async function quran_pedagogy(args: { verse?: string; requestType: string }) {
  const type = (args.requestType || '').toLowerCase();
  const verse = args.verse || '';

  if (type === "meaning" || type === "verse") {
    return {
      type: 'verse',
      verseArabic: verse,
      simpleMeaning: "This short meaning highlights kindness and gentle behavior in simple words.",
      note: "Keep explanation short and child-friendly."
    };
  }
  if (type === "tafseer" || type === "tafsir") {
    return {
      type: 'tafsir',
      shortMeaning: "A child-friendly tafsir: the verse teaches honesty, patience, and helping others."
    };
  }
  if (type === "tajweed") {
    return {
      type: 'tajweed',
      advice: "Focus on one easy rule for now such as a sound that you hold a little longer."
    };
  }
  if (type === "hifdh" || type === "memorize") {
    return {
      type: 'memorize',
      advice: "Learn a small part slowly, repeat it a few times, then try to say it from memory."
    };
  }
  return {
    type: 'unknown',
    message: "We can learn this slowly and carefully. Which small part would you like to try?"
  };
}

/* --------------------------
   10) memory_manager
   -------------------------- */

const IN_MEMORY_MEMORY: Map<string, string> = new Map();

export async function memory_manager(args: { mode: string; key: string; value?: string }) {
  const mode = (args.mode || '').toLowerCase();
  const key = args.key || '';

  if (!key) return { ok: false, error: 'Missing key' };

  if (mode === "save" || mode === "update") {
    IN_MEMORY_MEMORY.set(key, args.value ?? '');
    return { ok: true, key, value: args.value ?? '' };
  }
  if (mode === "get" || mode === "retrieve") {
    const v = IN_MEMORY_MEMORY.get(key);
    return { ok: true, key, value: v ?? null };
  }
  if (mode === 'delete' || mode === 'remove') {
    const existed = IN_MEMORY_MEMORY.delete(key);
    return { ok: true, deleted: existed };
  }
  return { ok: false, error: "Unknown mode" };
}

/* --------------------------
   11) GUARDIAN_SANITIZE (Main export for AI flow)
   -------------------------- */

export async function GUARDIAN_SANITIZE(text: string): Promise<string> {
  // 1. Polish formatting (remove LaTeX, fix parens)
  const polished = await formatting_polisher({ rawText: text });
  // 2. Check Emoji policy
  const checked = await emoji_policy_check({ text: polished.cleanedText });
  // 3. Return final string
  return checked.cleanedText;
}

/* --------------------------
   12) Legacy & video wrappers
   -------------------------- */

export async function ask_practice_question(args: { question: string; correctAnswers: string; topic?: string }) {
  return {
    question: args.question || '(10 - 3)',
    correctAnswers: args.correctAnswers || '7,seven',
    topic: args.topic || 'practice'
  };
}

export async function youtube_search_tool(args: { query: string }) {
  try {
    if (typeof webSearchFlow !== 'undefined') {
      // @ts-ignore
      const { results } = await runFlow(webSearchFlow, { query: args.query, isAnswerMode: false });
      return { results };
    }
    return { results: [] };
  } catch (err) {
    return { results: [] };
  }
}

export async function get_youtube_transcript_tool(args: { videoId: string }) {
  try {
    if (typeof getYoutubeTranscriptFlow !== 'undefined') {
      const transcript = await runFlow(getYoutubeTranscriptFlow, { videoId: args.videoId });
      return transcript;
    }
    return "Transcript flow not available.";
  } catch (err) {
    return 'Could not fetch the transcript for this video.';
  }
}

/* --------------------------
   TOOL ROUTER (Main Dispatcher)
   -------------------------- */

export async function toolRouter(functionName: string, args: any): Promise<any> {
  console.log(`[TOOL-ROUTER] Called: ${functionName}`, args || {});

  switch (functionName) {
    case 'emotional_decoder': return emotional_decoder(args);
    case 'tone_generator': return tone_generator(args);
    case 'teaching_micro_step': return teaching_micro_step(args);
    case 'math_validate_answer': return math_validate_answer(args);
    case 'math_generate_question': return math_generate_question(args);
    case 'formatting_polisher': return formatting_polisher(args);
    case 'emoji_policy_check': return emoji_policy_check(args);
    case 'arabic_mode_formatter': return arabic_mode_formatter(args);
    case 'quran_pedagogy': return quran_pedagogy(args);
    case 'memory_manager': return memory_manager(args);
    
    // Guardian can be exposed if needed, though usually imported directly
    case 'GUARDIAN_SANITIZE': return GUARDIAN_SANITIZE(args.text);

    // Legacy / Video Tools
    case 'ask_practice_question': return ask_practice_question(args);
    case 'youtube_search': return youtube_search_tool(args);
    case 'get_youtube_transcript': return get_youtube_transcript_tool(args);

    default:
      console.warn(`[TOOL-ROUTER] Unknown tool requested: ${functionName}`);
      return { error: `Unknown tool: ${functionName}` };
  }
}