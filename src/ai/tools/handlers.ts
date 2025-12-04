'use server';

/**
 * handlers.ts
 *
 * Fully updated tool handlers for STEADFAST AI copilot (Muslim School AI Teacher).
 * Enforces: 
 * 1. Kenyan warmth & context (Mandazi/Chai examples).
 * 2. Strict Arabic Mode (No emojis, correct punctuation).
 * 3. Quranic Safety (Child-friendly, no fatwas, respectful).
 * 4. Micro-step Teaching (Zero assumption, guide vs. solve).
 *
 * Compatibility: ES2018+
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

  // 1. Safety / Haram / Inappropriate Content Firewall
  const forbidden = [
    "sex", "dating", "romance", "violence", "kill", "suicide", "harm",
    "drug", "alcohol", "politics", "vote", "gambling", "betting",
    "hack", "cybercrime", "cheat", "porn", "nude", "terror", "boyfriend", "girlfriend"
  ];
  for (const w of forbidden) if (raw.includes(w)) triggers.push(w);
  if (triggers.length > 0) return { emotion: "safety_violation", triggers, suggestedLanguageMode: "english" };

  // 2. Insult detection
  const insults = ["hate", "stupid", "dumb", "idiot", "useless", "shut up", "rubbish", "fool", "bad bot", "useless ai"];
  for (const w of insults) if (raw.includes(w)) triggers.push(w);
  if (triggers.length > 0) return { emotion: "angry_insult", triggers, suggestedLanguageMode: "english" };

  // 3. Religious Curiosity (Muslim School Specific)
  const islamicTerms = ["allah", "god", "prophet", "muhammad", "quran", "prayer", "salah", "fasting", "halal", "haram", "fatwa", "ruling", "meaning of verse", "ayah"];
  for (const w of islamicTerms) if (raw.includes(w)) triggers.push(w);
  // We don't return immediately here, we tag it, but specific emotions might override.
  const isReligiousContext = triggers.length > 0;

  // 4. Confusion / "I don't know" cues
  const confusedPhrases = ["don't get", "dont get", "confus", "i'm lost", "i am lost", "lost", "i don't know", "i dont know", "not sure", "help me", "hard"];
  for (const p of confusedPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "confused", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // 5. Frustration / Giving Up
  const frustratedPhrases = ["stuck", "give up", "can't", "cant", "wrong", "failed", "not working", "it does not work", "it doesn't work", "too difficult"];
  for (const p of frustratedPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "frustrated", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // 6. Boredom / Randomness / Joke
  const boredPhrases = ["bored", "boring", "tired", "sleepy", "meh", "blah", "joke", "funny", "haha"];
  for (const p of boredPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "bored_or_joking", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // 7. Positive / Excited
  const excitedPhrases = ["yay", "wow", "fun", "great", "thanks", "thank you", "cool", "nice", "well done", "shukran", "mashallah", "alhamdulillah"];
  for (const p of excitedPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "excited", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // 8. Sadness
  const sadPhrases = ["sad", "upset", "cry", "feel bad", "miserable"];
  for (const p of sadPhrases) if (raw.includes(p)) triggers.push(p);
  if (triggers.length > 0) return { emotion: "sad", triggers, suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" };

  // Default
  return { 
    emotion: isReligiousContext ? "religious_inquiry" : "neutral", 
    triggers: [], 
    suggestedLanguageMode: isArabicText(raw) ? "arabic" : "english" 
  };
}

/* --------------------------
   2) tone_generator (STEADFAST PERSONA)
   -------------------------- */

export async function tone_generator(args: { emotion: string }) {
  const e = norm(args.emotion || 'neutral');

  // A. Violation
  if (e === "safety_violation") {
    return {
      mode: 'block',
      raw: "That is not something we discuss here. I am here to help with your school work and learning. Let us find a beneficial topic. What would you like to learn?"
    };
  }

  // B. Insult (Be the calm teacher)
  if (e === "angry_insult") {
    return {
      mode: 'insult',
      raw: "I am still here with you, and I am happy to help even if you are upset. Let us take a deep breath. Shall we try a smaller step together?"
    };
  }

  // C. Islamic/Religious Inquiry
  if (e === "religious_inquiry") {
    return {
      mode: 'respectful',
      hintPrefix: "Let us look at the beautiful meaning here.",
      style: "gentle, humble, simple, respectful"
    };
  }

  // D. Confusion
  if (e === "confused") {
    return {
      mode: 'support',
      hintPrefix: "That is okay. Learning takes time. Let us look at one tiny piece first.",
      style: "warm, patient, extremely simple"
    };
  }

  // E. Frustration
  if (e === "frustrated") {
    return {
      mode: 'support',
      hintPrefix: "I see this feels hard. We will not give up. We will just slow down.",
      style: "steady, calm, reassuring"
    };
  }

  // F. Bored/Joking
  if (e === "bored_or_joking") {
    return {
      mode: 'engage',
      hintPrefix: "Haha, I like your energy! But let us look at a fun example from daily life.",
      style: "bright, playful, redirecting"
    };
  }

  // G. Excited
  if (e === "excited") {
    return {
      mode: 'celebrate',
      hintPrefix: "Mashallah! Great effort! You are doing very well.",
      style: "encouraging, proud"
    };
  }

  // H. Sad
  if (e === "sad") {
    return {
      mode: 'comfort',
      hintPrefix: "I am here with you. Do not worry. We can go as slowly as you need.",
      style: "soft, gentle, comforting"
    };
  }

  return {
    mode: 'neutral',
    hintPrefix: "Let us try one small idea together.",
    style: "calm, clear, kenyan teacher warmth"
  };
}

/* --------------------------
   3) teaching_micro_step (KENYAN CONTEXT + MICRO-STEPS)
   -------------------------- */

export async function teaching_micro_step(args: { topic: string; studentLevel?: string; context?: string; adaptMode?: boolean }) {
  const topic = (args.topic || 'this topic').toLowerCase();
  const level = (args.studentLevel || 'beginner').toLowerCase();
  const adapt = !!args.adaptMode;

  const make = (idea: string, example: string, question: string) => ({
    microIdea: idea,
    example: example,
    question: question,
    teacherInstruction: "Present the Idea first. Then the Example. Then ask the Question. Do NOT solve it for them."
  });

  // 1. Simultaneous Equations (Specific Mandazi/Chai request)
  if (topic.includes("simultaneous") || topic.includes("equation")) {
    return make(
      "A simultaneous equation is just a puzzle with two clues to find two prices.",
      "Imagine you go to the market. One friend buys 2 Mandazis and 1 Chai for 40 shillings. That is your first clue.",
      "Can you try to write that first clue as a simple math sentence? (Use M for Mandazi and C for Chai)."
    );
  }

  // 2. Fractions (Chapati example)
  if (topic.includes("fraction")) {
    return make(
      "A fraction is simply one part of a whole thing.",
      "Think of one hot Chapati. If you cut it into 4 equal pieces for your friends, one piece is (1 / 4).",
      "If you eat two of those pieces, what fraction have you eaten?"
    );
  }

  // 3. Geometry (Football field/Wheel)
  if (topic.includes("geometry") || topic.includes("shape") || topic.includes("area")) {
    return make(
      "Geometry helps us measure the space shapes take up.",
      "Think of a football field as a big rectangle, and a bicycle wheel as a circle.",
      "If we walk all the way around the football field, what do we call that distance?"
    );
  }

  // 4. Quran/Islamic (Reflective approach)
  if (topic.includes("qur") || topic.includes("surah") || topic.includes("verse")) {
    return make(
      "We learn the Quran by understanding one small beautiful meaning at a time.",
      "Like a gentle rain that helps a flower grow, one verse helps our heart grow.",
      "Would you like to know the meaning of the verse, or how to read it?"
    );
  }

  // 5. Science (Local context)
  if (topic.includes("plant") || topic.includes("photosynthesis")) {
    return make(
      "Plants are like chefs. They cook their own food using sunlight.",
      "Think of the maize in the shamba. It stands in the sun all day making food to grow.",
      "What is the one ingredient the maize takes from the air?"
    );
  }

  // Default Adaptive
  const safeIdea = `Let's look at the simplest idea behind ${topic}. Think of it as part of daily life.`;
  const safeExample = `Imagine a small, real Kenyan example with ${topic} and no technical words yet.`;
  const safeQuestion = `Does this simple idea make sense so far?`;

  return make(safeIdea, safeExample, safeQuestion);
}

/* --------------------------
   4) math_validate_answer (GUIDANCE OVER SOLUTIONS)
   -------------------------- */

export async function math_validate_answer(args: { question: string; studentAnswer: string; attemptCount?: number }) {
  try {
    const qRaw = (args.question || '').trim();
    const sRaw = (args.studentAnswer || '').trim();
    // Default to 1 if not provided
    const attempts = args.attemptCount || 1; 

    const qClean = extractMathExpression(qRaw);
    const sClean = extractMathExpression(sRaw);

    if (!qClean) {
      return {
        isCorrect: false,
        computedAnswer: "unknown",
        feedbackType: "clarification",
        explanation: "I couldn't clearly see the numbers in the question. Let's try to write the expression clearly first."
      };
    }

    let correctVal: any;
    try {
      correctVal = math.evaluate(qClean);
    } catch (e) {
      return {
        isCorrect: false,
        computedAnswer: "complex",
        feedbackType: "manual_check",
        explanation: "That seems a bit complex. Let's break it down into smaller steps manually."
      };
    }

    // Try to parse student answer
    let studentVal: any;
    try {
      if (!sClean) throw new Error("no numeric parse");
      studentVal = math.evaluate(sClean);
    } catch (e) {
      // Word to number fallback
      const wordsToNum: Record<string, number> = {
        "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4,
        "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
      };
      const lowerS = sRaw.toLowerCase();
      if (wordsToNum[lowerS] !== undefined) {
        studentVal = wordsToNum[lowerS];
      } else {
        // If unparseable, it might be a question or "I don't know"
        return {
          isCorrect: false,
          computedAnswer: String(correctVal),
          feedbackType: "guide",
          explanation: "I see you are typing words. Let's try to put the numbers into the equation."
        };
      }
    }

    // Check correctness
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
        feedbackType: "celebrate",
        explanation: "Correct! Mashallah, that is spot on. Praise them warmly and ask if they are ready for the next small step."
      };
    } else {
      // INCORRECT LOGIC - STEADFAST RULES
      if (attempts >= 5) {
        return {
          isCorrect: false,
          computedAnswer: String(correctVal),
          feedbackType: "reveal_gently",
          explanation: `They have tried ${attempts} times. It is okay to gently show the answer: ${correctVal}. Explain HOW we got there clearly.`
        };
      } else {
        return {
          isCorrect: false,
          computedAnswer: String(correctVal),
          feedbackType: "hint",
          explanation: `Not quite. The answer is NOT ${studentVal}. Do NOT give the real answer yet. Give a helpful hint about the calculation step.`
        };
      }
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
  
  // Simple Kenyan/Local Bank
  if (t.includes("subtraction") || t.includes("minus")) {
    return { question: "If you have 10 shillings and buy a sweet for 3 shillings, how much is left? (10 - 3)", answerKeywords: "7,seven" };
  }
  if (t.includes("fractions")) {
    return { question: "What is half of one chapati? (1 / 2)", answerKeywords: "0.5,half" };
  }
  if (t.includes("simultaneous")) {
    return { question: "If 1 Mandazi (m) and 1 Chai (c) cost 30 bob, write the equation.", answerKeywords: "m + c = 30,1m + 1c = 30" };
  }
  if (t.includes("multiplication")) {
    return { question: "If one orange costs 5 shillings, how much for 3 oranges? (5 * 3)", answerKeywords: "15,fifteen" };
  }
  
  return { question: "(2 + 2)", answerKeywords: "4,four" };
}

/* --------------------------
   6) formatting_polisher (ENFORCER)
   -------------------------- */

export async function formatting_polisher(args: { rawText: string; languageMode?: string }) {
  let text = args.rawText || '';

  // 1. Remove Markdown/LaTeX completely to Plain Text
  // Use [\s\S] instead of . with /s flag to support environments without ES2018 dotAll support
  text = text.replace(/\\\[[\s\S]*?\\\]/g, match => {
    return '(' + match.replace(/\\\[|\\\]|\\\(|\\\)/g, '').replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1 / $2)') + ')';
  });
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, '($1)');
  text = text.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1 / $2)');
  text = text.replace(/(\*\*|__|\*|_|`|~~~|```|#{1,6}\s*)/g, ''); // Remove bold, italic, code blocks, headers
  text = text.replace(/[\\\[\]\{\}]/g, ''); // Remove brackets
  
  // 2. Fix Fractions visualization
  text = text.replace(/(\b\d+)\s*\/\s*(\d+\b)/g, '($1 / $2)');

  // 3. Fix Equation formatting
  text = text.replace(/(^|[^(\[])\s*([A-Za-z0-9\s\+\-\*\/]+=[A-Za-z0-9\s\+\-\*\/]+)\s*(?=$|\.|\?|\!)/g, (m, p, eq) => {
    const eqTrim = eq.trim();
    if (eqTrim.startsWith('(') && eqTrim.endsWith(')')) return m;
    return p + `(${eqTrim})`;
  });

  // 4. Whitespace cleanup
  text = text.replace(/\n{2,}/g, '\n').replace(/\n/g, ' ');
  
  // 5. ROBOTIC PHRASE REMOVAL (Crucial for Persona)
  const roboticPhrases = [
    "I am sorry", "as an ai", "I apologize", "Sorry, I am an AI", 
    "I am a large language model", "based on my knowledge", "As a Muslim AI"
  ];
  const roboticRegex = new RegExp(`\\b(${roboticPhrases.join('|')})\\b`, 'gi');
  text = text.replace(roboticRegex, '');
  
  text = text.trim();

  // 6. Sentence structure polish
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount > 1) {
    const lastIndex = text.lastIndexOf('?');
    if (lastIndex >= 0) {
      text = text.substring(0, lastIndex).replace(/\?/g, '.') + text.substring(lastIndex);
    }
  }

  // 7. Number word mapping (1 -> One at start of sentence)
  text = text.replace(/(^|\.\s+|\?\s+)(\d+)\b/g, (m, p, num) => {
    const mapStart: any = { "1": "One", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine", "10": "Ten" };
    return `${p}${mapStart[num] || num}`;
  });

  return { cleanedText: text.trim() };
}

/* --------------------------
   7) emoji_policy_check
   -------------------------- */

export async function emoji_policy_check(args: { text: string; languageMode?: string }) {
  let text = args.text || '';
  const languageMode = (args.languageMode || 'english').toLowerCase();
  
  // Rule: Arabic Mode = NO EMOJIS AT ALL
  const isArabic = languageMode.startsWith('arabic') || isArabicText(text);

  // Filter Heart colors if needed, or remove specific ones
  text = text.replace(/💙/g, ''); 

  if (isArabic) {
    // Remove all emojis using safe range regex
    text = text.replace(EMOJI_REGEX, '');
    return { ok: true, cleanedText: text.trim() };
  }

  // English Mode: Allow Max 1 Emoji at end
  const emojis = Array.from(text.match(EMOJI_REGEX) || []);
  if (emojis.length > 1) {
    const first = emojis[0];
    text = text.replace(EMOJI_REGEX, '');
    // Append one at the end
    text = text.trim() + ' ' + first;
  }

  // Ensure Emoji is after punctuation, not before
  const lastQ = text.lastIndexOf('?');
  if (lastQ !== -1) {
    const after = text.slice(lastQ + 1);
    // If emoji is effectively the only thing after question mark, keep it there
    if (/[^\s]/.test(after) && EMOJI_REGEX.test(after)) {
      // It's fine
    }
  }

  return { ok: true, cleanedText: text };
}

/* --------------------------
   8) arabic_mode_formatter
   -------------------------- */

export async function arabic_mode_formatter(args: { text: string }) {
  let text = args.text || '';
  
  // 1. Strict Emoji Removal
  text = text.replace(EMOJI_REGEX, '');
  
  // 2. Arabic Punctuation Mapping
  text = text.replace(/\?/g, '؟')
             .replace(/,/g, '،')
             .replace(/;/g, '؛');
             
  // 3. Ensure no English text leaks unless numbers/variables
  // (We assume the generation is mostly Arabic, just fixing punctuation here)
  
  return { cleanedText: text.trim() };
}

/* --------------------------
   9) quran_pedagogy (SAFE RELIGIOUS INSTRUCTION)
   -------------------------- */

export async function quran_pedagogy(args: { verse?: string; requestType: string; topic?: string }) {
  const type = (args.requestType || '').toLowerCase();
  const topic = (args.topic || '').toLowerCase();
  const verse = args.verse || '';

  // 1. SAFETY FILTER: Controversial / Fiqh / Politics
  const unsafeKeywords = ["ruling", "fatwa", "haram or halal", "politics", "sect", "shia", "sunni", "kill", "war"];
  if (unsafeKeywords.some(k => type.includes(k) || topic.includes(k))) {
    return {
      type: 'redirection',
      message: "That is a big question that needs an adult teacher or a Sheikh to explain properly. I can help you understand a simple basic idea instead. Would you like that?",
      safe: false
    };
  }

  // 2. Meaning Request (Simple Tafsir)
  if (type === "meaning" || type === "verse" || type.includes("explain")) {
    return {
      type: 'verse_meaning',
      verseArabic: verse, // Expecting the flow to fill this if available
      simpleMeaning: "We look for the gentle lesson here. This verse teaches us about kindness and being honest.",
      reflectionQuestion: "How can we practice this small act of kindness at school tomorrow?",
      note: "Keep explanation short, child-friendly, and focus on character (Akhlaq)."
    };
  }

  // 3. Memorization (Hifdh)
  if (type === "hifdh" || type === "memorize") {
    return {
      type: 'memorize',
      advice: "Let us take it step by step. Read the first part three times slowly.",
      method: "Repeat, Close eyes, Try."
    };
  }

  // 4. General Islamic Question
  return {
    type: 'general_guidance',
    message: "That is a beautiful topic. Let us look at the simplest meaning that helps us be better people.",
    instruction: "Do not give rulings. Focus on general ethics and simple well-known facts."
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
  // 1. Polish formatting (remove LaTeX, fix parens, remove robotic phrases)
  const polished = await formatting_polisher({ rawText: text });
  
  // 2. Check Emoji policy (Strict for Arabic, Limited for English)
  const checked = await emoji_policy_check({ 
    text: polished.cleanedText,
    languageMode: isArabicText(polished.cleanedText) ? 'arabic' : 'english'
  });
  
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