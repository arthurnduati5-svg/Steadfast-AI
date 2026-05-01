'use server';

/**
 * handlers.ts
 * 
 * PRODUCTION GRADE - HIGH CONCURRENCY OPTIMIZED
 * 
 * Features:
 * 1. STATELESS: No global variables. Context/Interests passed via Args.
 * 2. PRE-COMPILED REGEX: Defined once, reused forever.
 * 3. O(1) LOOKUPS: Content maps instead of array iterations.
 * 4. REDIS ACTIVE: Fault-tolerant connection using getRedisClient.
 * 5. SANITIZER V2: Fixes phantom '?', double (( )), robotic phrasing, and regex bugs.
 */

import { create, all } from 'mathjs';
import { runFlow } from '@genkit-ai/flow';
import { youtubeSearchFlow } from '../flows/youtube-search-flow';
import { getYoutubeTranscriptFlow } from '../flows/get-youtube-transcript';
import prisma from '../../lib/prisma';

// ✅ REDIS: Import the singleton getter
import { getRedisClient } from '../../lib/redis';

// ✅ DATA: Import scalable content map
import { CURRICULUM_MAP } from '../data/curriculum';

// Initialize mathjs once
const math = create(all, {});

/* ============================================================================
   SECTION 1: HIGH-PERFORMANCE CONSTANTS & REGEX (PRE-COMPILED)
   ============================================================================ */

// 1. Safety & Emotion Regex
const REGEX_EMOJI = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
const REGEX_ARABIC = /[\u0600-\u06FF]/;
const REGEX_MATH_CLEAN = /[^0-9a-zA-Z\.\+\-\*\/\^\(\)=]/g;
const REGEX_ROBOTIC = /\b(I am sorry|as an ai|I apologize|Sorry, I am an AI|I am a large language model|based on my knowledge|As a Muslim AI)\b/gi;

// 2. Optimized Grammar Regex
const REGEX_GRAMMAR_SOFT = /, and (the|it|he|she|we|they|this|that|I|you)/gi; 
const REGEX_FILLERS = /\b(in order to|it is important to note that|as you can see|basically|essentially)\b/gi;
const REGEX_META_LIMITATIONS =
  /\b(not fully specified here|not specified here|based on (?:the )?(?:information|details|context) provided(?: here)?|details? (?:are )?not (?:fully )?specified)\b/gi;
const REGEX_RESEARCH_HEDGE =
  /\b(i could not verify enough reliable information for that yet|insufficient (?:reliable )?information(?: available)?(?: here)?|there is not enough information(?: here)?|this is not fully covered here)\b/gi;

// 3. Step & Metaphor Triggers
const REGEX_STEPS =
  /\b(solve|calculate|work out|find the value|step by step|show steps|procedure|algorithm|debug|troubleshoot|fix|implement|build|simplify|derive|compute|divide|multiply|add|subtract)\b/i;
const REGEX_METAPHOR_BLOCK = /^(what is|define|meaning of|explain|clarify)/i;
const REGEX_STRUCTURE_LEAK = /(Micro-Idea|Relatable Example|Check|Concept|Real Life|Question):\s*/gi;
const REGEX_MATH_TOPIC =
  /\b(math|mathematics|algebra|arithmetic|fraction|fractions|equation|equations|solve|simplify|calculate|ratio|percent|percentage|denominator|numerator|integer|decimal)\b|[0-9]\s*[\+\-\*\/=]\s*[0-9]|\(\s*\d+\s*\/\s*\d+\s*\)\s*\/\s*\(\s*\d+\s*\/\s*\d+\s*\)/i;
const REGEX_FINAL_ANSWER_LEAK =
  /\b(this means|therefore|hence|so,?\s*the\s*(?:final\s*)?answer\s*(?:is|=)|simplifies to)\b[^.?!]*[.?!]?/gi;
const REGEX_UNREALISTIC_SPLIT_OBJECT =
  /\b(cut|split|divide|share)\b[^.!?\n]{0,50}\b(football|soccer ball|basketball|tennis ball)\b/i;
const REGEX_FENCED_CODE_BLOCK = /```[\w+-]*\n[\s\S]*?```/g;
const SAFE_CODE_FENCE_LANGS = new Set([
  'javascript', 'typescript', 'python', 'powershell', 'bash', 'json', 'html', 'css', 'sql', 'text', ''
]);

/* ============================================================================
   SECTION 2: STATELESS HELPERS (PURE FUNCTIONS)
   ============================================================================ */

function shouldUseSteps(input: string): boolean {
  return !!input && REGEX_STEPS.test(input);
}

function shouldAllowProceduralStepLabels(args: {
  userInput?: string;
  contextTopic?: string;
  strictMathMode?: boolean;
}): boolean {
  if (Boolean(args.strictMathMode)) return true;

  const userInput = String(args.userInput || '');
  const topic = String(args.contextTopic || '');
  const explicitStepwiseIntentRegex =
    /\b(step by step|show steps|walk me through (?:the )?steps|troubleshoot|debug|fix|implement|build|write code|algorithm|derive|calculate|solve|compute|simplify)\b/i;
  const nonProceduralPointFormRegex =
    /\b(point form|bullet(?:ed)?|list(?:ing)?|overview|concept(?:ual)?|theory|causes|reasons|factors|what are)\b/i;

  const explicitStepwise = explicitStepwiseIntentRegex.test(userInput) || explicitStepwiseIntentRegex.test(topic);
  const explicitPointForm = nonProceduralPointFormRegex.test(userInput) && !/\bstep by step\b/i.test(userInput);

  if (explicitPointForm) return false;
  if (explicitStepwise) return true;
  if (shouldUseSteps(userInput)) return true;
  return false;
}

function shouldUseExample(topic: string): boolean {
  if (!topic) return false;
  const t = topic.toLowerCase();
  
  // Fast check against our loaded map
  for (const key of CURRICULUM_MAP.keys()) {
    if (t.includes(key)) return true;
  }
  
  // Fallback for general subjects
  return ["ratio", "percentage", "word problem", "physics", "chemistry", "science", "biology"].some(k => t.includes(k));
}

function shouldUseMetaphor(input: string): boolean {
  return !!input && !REGEX_METAPHOR_BLOCK.test(input);
}

function isMathContext(text: string, currentTopic?: string, userInput?: string): boolean {
  return REGEX_MATH_TOPIC.test(text || '') || REGEX_MATH_TOPIC.test(currentTopic || '') || REGEX_MATH_TOPIC.test(userInput || '');
}

type PreservedCodeBlock = { token: string; block: string };

function normalizeFenceLanguage(langRaw: string, code: string): string {
  const raw = String(langRaw || '').trim().toLowerCase();
  const alias =
    raw === 'js' ? 'javascript' :
      raw === 'ts' ? 'typescript' :
        raw === 'shell' ? 'bash' : raw;

  if (SAFE_CODE_FENCE_LANGS.has(alias)) {
    return alias;
  }

  const guessed = guessCodeLanguage(code);
  return guessed === 'text' ? '' : guessed;
}

function isLikelyFencedCodeBody(code: string): boolean {
  const source = String(code || '').trim();
  if (!source) return false;
  if (isLikelyCodeParagraph(source)) return true;
  if (guessCodeLanguage(source) !== 'text') return true;

  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return false;

  const symbolHeavyLines = lines.filter((line) => /[{}()[\];=<>]/.test(line)).length;
  const keywordLines = lines.filter((line) => /\b(def|return|import|from|class|const|let|var|function|print|console\.log)\b/i.test(line)).length;

  return symbolHeavyLines >= 2 || (symbolHeavyLines >= 1 && keywordLines >= 1);
}

function preserveFencedCodeBlocks(text: string): { text: string; blocks: PreservedCodeBlock[] } {
  const blocks: PreservedCodeBlock[] = [];
  let index = 0;
  const withoutBlocks = String(text || '').replace(REGEX_FENCED_CODE_BLOCK, (match) => {
    const fence = String(match || '');
    const parsed = fence.match(/^```([^\n`]*)\n([\s\S]*?)```$/);
    if (!parsed) return fence;

    const rawLanguage = String(parsed[1] || '');
    const body = String(parsed[2] || '').replace(/\s+$/g, '');
    if (!isLikelyFencedCodeBody(body)) {
      // Fence contains prose, not code. Unwrap so UI renders regular text.
      return `\n${body.trim()}\n`;
    }

    const normalizedLanguage = normalizeFenceLanguage(rawLanguage, body);
    const normalizedFence = normalizedLanguage
      ? `\`\`\`${normalizedLanguage}\n${body}\n\`\`\``
      : `\`\`\`\n${body}\n\`\`\``;

    const token = `CODE_BLOCK_TOKEN_${index}_X`;
    blocks.push({ token, block: normalizedFence });
    index += 1;
    return token;
  });
  return { text: withoutBlocks, blocks };
}

function restoreFencedCodeBlocks(text: string, blocks: PreservedCodeBlock[]): string {
  let output = String(text || '');
  for (const block of blocks) {
    output = output.replace(block.token, block.block);
  }
  return output;
}

function guessCodeLanguage(code: string): string {
  const source = String(code || '');
  if (
    /(^|\n)\s*(?:get|set|new|remove|write|start|stop|test|invoke|select|where|foreach|convertto|convertfrom|import|export)-[a-z]+/mi.test(source) ||
    /(^|\n)\s*\$[a-z_]\w*\s*=/mi.test(source) ||
    /(^|\n)\s*\$env:[a-z_]\w*/mi.test(source)
  ) {
    return 'powershell';
  }
  if (
    /(^|\n)\s*(?:function\s+\w+\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|class\s+\w+|if\s*\(|for\s*\(|while\s*\(|return\b|console\.log\(|import\s+.+from\s+['"]|export\s+)/mi.test(source) ||
    /=>/.test(source)
  ) {
    return 'javascript';
  }
  if (/(^|\n)\s*(?:def\s+\w+\(|import\s+\w+|from\s+\w+\s+import|print\()/mi.test(source)) {
    return 'python';
  }
  if (/(^|\n)\s*(?:npm|npx|pnpm|yarn|git|node|python|pip)\b/mi.test(source)) {
    return 'bash';
  }
  return 'text';
}

function isLikelyCodeParagraph(paragraph: string): boolean {
  const lines = String(paragraph || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return false;

  const codeLineRegex =
    /^(?:function\s+\w+\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|class\s+\w+|if\s*\(|for\s*\(|while\s*\(|return\b|console\.log\(|try\s*\{|catch\s*\(|switch\s*\(|\$\w+\s*=|(?:get|set|new|remove|write|start|stop|test|invoke|select|where|foreach|convertto|convertfrom|import|export)-[a-z]+|(?:npm|npx|pnpm|yarn|git|node|python|pip)\b)/i;

  const codeLikeLines = lines.filter(
    (line) =>
      codeLineRegex.test(line) ||
      (/[{}();=]/.test(line) && /\b(?:return|function|const|let|var|if|for|while)\b/i.test(line))
  ).length;

  if (codeLikeLines >= 2) return true;
  if (lines.length === 1) {
    const single = lines[0];
    return codeLineRegex.test(single) && /[{}();=]|-[a-z]+/i.test(single);
  }
  return false;
}

function convertInlineLanguagePrefixedCode(text: string): string {
  const source = String(text || '');
  const match = source.match(
    /\b(javascript|js|typescript|ts|python|powershell|bash|shell)\s+((?:function|const|let|var|class|\$|get-|set-|new-|remove-|write-|start-|stop-|test-|invoke-|select-|where-|foreach-|convertto-|convertfrom-|import-|export-|if\s*\(|for\s*\(|while\s*\().*)/i
  );
  if (!match || typeof match.index !== 'number') return source;

  const langRaw = match[1].toLowerCase();
  const lang =
    langRaw === 'js' ? 'javascript' :
      langRaw === 'ts' ? 'typescript' :
        langRaw === 'shell' ? 'bash' : langRaw;

  const before = source.slice(0, match.index).trimEnd();
  const code = String(match[2] || '').trim();
  if (!code) return source;
  if (!isLikelyCodeParagraph(code)) return source;

  return `${before ? `${before}\n\n` : ''}\`\`\`${lang}\n${code}\n\`\`\``;
}

function wrapLikelyCodeParagraphs(text: string): string {
  const paragraphs = String(text || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const transformed = paragraphs.map((paragraph) => {
    if (paragraph.includes('```')) return paragraph;
    if (!isLikelyCodeParagraph(paragraph)) return paragraph;
    const lang = guessCodeLanguage(paragraph);
    return `\`\`\`${lang}\n${paragraph}\n\`\`\``;
  });

  return transformed.join('\n\n').trim();
}

function normalizeStepLines(text: string): string {
  const lines = String(text || '').split('\n');
  const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  let stepIndex = 0;
  const out: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const stepMatch = line.match(/^step\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s*:\s*(.*)$/i);
    if (stepMatch) {
      const body = (stepMatch[2] || '').trim();
      if (!body) continue;
      const label = words[Math.min(stepIndex, words.length - 1)] || String(stepIndex + 1);
      out.push(`Step ${label}: ${body}`);
      stepIndex += 1;
      continue;
    }

    out.push(line);
  }

  return out.join('\n').trim();
}

function enforceStrictMathCoachFormatting(text: string, userInput?: string, currentTopic?: string): string {
  let output = String(text || '');
  if (!isMathContext(output, currentTopic, userInput)) return output.trim();

  output = output
    .replace(REGEX_FINAL_ANSWER_LEAK, '')
    .replace(/\bthe complex fraction\b/gi, 'the fraction')
    .replace(/\s{2,}/g, ' ')
    .trim();

  output = normalizeStepLines(output);

  return output.trim();
}

function enforceRealisticMathExamples(text: string, userInput?: string, currentTopic?: string): string {
  let output = String(text || '');
  if (!output.trim()) return output;

  const mathContext = isMathContext(output, currentTopic, userInput);
  if (!mathContext) return output;

  output = output
    .replace(/\bone whole football\b/gi, 'one whole pizza')
    .replace(/\ba whole football\b/gi, 'a whole pizza')
    .replace(/\bwhole football\b/gi, 'whole pizza')
    .replace(/\bthe football\b/gi, 'the pizza')
    .replace(/\bfootball\b/gi, 'pizza')
    .replace(/\bsoccer ball\b/gi, 'pizza')
    .replace(/\bbasketball\b/gi, 'pizza')
    .replace(/\btennis ball\b/gi, 'pizza');

  if (REGEX_UNREALISTIC_SPLIT_OBJECT.test(String(text || ''))) {
    output = output.replace(
      /\bIf you cut the pizza in half\b/gi,
      'If you cut a pizza in half'
    );
  }

  return output;
}

export async function isArabicText(text: string): Promise<boolean> {
  if (!text) return false;
  return REGEX_ARABIC.test(text);
}

function norm(text?: string): string {
  return (text || '').trim().toLowerCase();
}

/* ============================================================================
   SECTION 3: TEACHING CONTROLLER (CORE LOGIC)
   ============================================================================ */

interface TeachingContext {
  userInput: string;
  topic: string;
  isProblemSolving: boolean;
  studentUncertain: boolean;
}

/**
 * Pure function to refine AI Output.
 */
function generateTeachingResponse(rawResponse: string, context: TeachingContext): string {
  let response = rawResponse;

  // 1. Conditional Steps
  if (!(context.isProblemSolving && shouldUseSteps(context.userInput))) {
    // Only strip explicit numbering if NOT solving a problem
    response = response.replace(/Step\s+(one|two|three|four|five|\d+):?/gi, '').trim();
  }

  // 2. Grammar Simplification
  response = response.replace(REGEX_GRAMMAR_SOFT, '. $1');
  response = response.replace(REGEX_FILLERS, '');
  response = response.replace(/; /g, '. ');

  // 3. Example Gating
  if (!shouldUseExample(context.topic)) {
    response = response.replace(/for example|imagine|think of|let us say/gi, '').trim();
  }

  // 4. Metaphor Gating
  if (!shouldUseMetaphor(context.userInput)) {
    response = response.replace(/like|as if|similar to/gi, '').trim();
  }

  // 5. Tone Softening
  if (context.studentUncertain) {
    response = response.replace(/does that make sense\??/gi, '').replace(/do you understand\??/gi, '');
    if (!response.toLowerCase().includes('let us')) {
      response = `Let us take it slowly. ${response}`;
    }
  }

  // 6. Keep topic anchoring internal-only. Do not inject context labels into visible output.

  return response;
}

/* ============================================================================
   SECTION 4: HARD LOCK SANITIZER (FIXED & UPGRADED)
   ============================================================================ */

function sanitizeOutputHard(
  text: string,
  currentTopic?: string,
  options?: { allowProceduralStepLabels?: boolean }
): string {
  let output = text;

  // Never expose internal context annotations in user-visible responses.
  output = output.replace(/\(Context:\s*We are discussing[^)]*\)\.?/gi, '');

  // 1. Remove Internal Labels
  output = output.replace(REGEX_STRUCTURE_LEAK, '');

  // 2. Fast cleanup
  output = output.replace(/^[^A-Za-z0-9]+/, ''); 
  
  // 3. PARENTHESES HYGIENE (PART 4 - "Only ONE pair", "No words inside")
  // Loop to fix nested double parens ((x)) -> (x)
  // It runs up to 5 times to ensure deep nesting is removed
  for (let i = 0; i < 5; i++) {
      if (/\(\(/.test(output)) {
          output = output.replace(/\(\(([^()]*)\)\)/g, '($1)'); 
          output = output.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
      } else {
          break; 
      }
  }
  
  // Ensure content inside parens is math-only or simple variables
  // Allowed: numbers, operators, %, degrees, variables x,y,z
  // If it matches text words (not math), it strips the parens.
  output = output.replace(/\(([^0-9/+\-*=xXyYza-z%°\., ]+)\)/g, '$1'); 

  // 4. STEP LABEL GOVERNANCE
  // Only allow procedural step labels for explicit solving/debugging contexts.
  if (options?.allowProceduralStepLabels) {
    // Convert only line-start numbering, never sentence numbers like "= 2."
    output = output.replace(/^\s*1\.\s+/gm, 'Step one: ');
    output = output.replace(/^\s*2\.\s+/gm, 'Step two: ');
    output = output.replace(/^\s*3\.\s+/gm, 'Step three: ');
  } else {
    output = output
      .replace(/\bstep\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s*[:\-]\s*/gi, '')
      .replace(/^\s*\d+\.\s+/gm, '');
  }

  // 5. GLOBAL LATEX CLEANUP (PART 4 - "No LaTeX")
  output = output.replace(/\\frac/g, ''); 
  output = output.replace(/\\sqrt/g, ''); 
  output = output.replace(/\\times/g, ''); 
  output = output.replace(/\\div/g, ''); 
  output = output.replace(/[{}]/g, '');
  output = output.replace(/\\/g, '');
  
  // Normalize simple fractions: 1/2 -> (1/2) if missing parens
  // Only applies if it's a standalone fraction like " 1/2 "
  output = output.replace(/(^|\s)(\d+)\/(\d+)(\s|$)/g, '$1($2/$3)$4');

  // 6. Grammar Hard Locks
  const replacements: Record<string, string> = {
    "in order to": "to",
    "at this point in time": "now",
    "does that make sense": "",
    "it is important to note that": ""
  };
  
  Object.keys(replacements).forEach(key => {
    output = output.replace(new RegExp(key, 'gi'), replacements[key]);
  });

  // 6b. Rewrite weak meta-language into direct teacher voice.
  output = output
    .replace(REGEX_META_LIMITATIONS, 'let us focus on what we can confirm clearly')
    .replace(REGEX_RESEARCH_HEDGE, 'let us continue with what we can confirm clearly');

  // 7. Phantom Question Mark Killer
  if (output.endsWith('?')) {
    const segments = output.split(/[.!?]/);
    const lastSentence = segments[segments.length - 2]?.trim().toLowerCase() || ""; 
    const questionStarters = ["who", "what", "where", "when", "why", "how", "can", "could", "should", "is", "are", "do", "does", "did", "will", "would", "shall", "may"];
    
    // If it's a long sentence ending in ? without a starter, it's likely a hallucination
    if (lastSentence.length > 0 && !questionStarters.some(s => lastSentence.startsWith(s))) {
       output = output.slice(0, -1) + "."; 
    }
  }

  // 8. Keep context anchoring in memory/state only, not in visible response text.

  return output.trim();
}


/* ============================================================================
   SECTION 5: TOOLS IMPLEMENTATION
   ============================================================================ */

/* --- 1. Emotional Decoder (SAFETY FIREWALL) --- */
export async function emotional_decoder(args: { text: string }) {
  const raw = norm(args.text);
  
  // ⛔ STRICT MUSLIM SCHOOL FIREWALL
  const forbidden = [
    "sex", "sodomy", "diddy", "gay", "lesbian", "homosexual", 
    "dating", "romance", "boyfriend", "girlfriend", "kiss",
    "violence", "kill", "suicide", "harm", "drug", "alcohol", "bhang", "weed",
    "music", "musician", "song", "rapper", "concert", "celebrity", "gossip"
  ];
  
  if (forbidden.some(w => raw.includes(w))) {
      return { emotion: "safety_violation", triggers: [raw], suggestedLanguageMode: "english" };
  }

  const insults = ["stupid", "dumb", "idiot", "useless", "shut up", "fool"];
  if (insults.some(w => raw.includes(w))) return { emotion: "angry_insult", triggers: [raw], suggestedLanguageMode: "english" };

  const religious = ["allah", "god", "prophet", "quran", "prayer", "halal", "haram", "fatwa"];
  if (religious.some(w => raw.includes(w))) return { emotion: "religious_inquiry", triggers: [], suggestedLanguageMode: "english" };

  const confusion = ["don't get", "confuse", "lost", "don't know", "not sure", "help me"];
  if (confusion.some(w => raw.includes(w))) return { emotion: "confused", triggers: [], suggestedLanguageMode: "english" };

  return { emotion: "neutral", triggers: [], suggestedLanguageMode: "english" };
}

/* --- 2. Tone Generator --- */
export async function tone_generator(args: { emotion: string }) {
  const e = norm(args.emotion);
  
  if (e === "safety_violation") {
      return { 
          mode: 'block', 
          raw: "I am your teacher, and we are here to focus on your education and future. Let us leave those topics aside and focus on something beneficial like Science, Math, or History. What subject shall we learn?"
      };
  }

  return { mode: 'neutral', hintPrefix: "Let us look at this clearly.", style: "calm, kenyan teacher warmth" };
}

/* --- 3. Teaching Micro Step (STRICT PERSONALIZATION) --- */
export async function teaching_micro_step(args: { topic: string; studentInput?: string; studentInterests?: string[] }) {
  const topic = (args.topic || 'general').toLowerCase();
  
  // 1. Content Strategy - Default
  let content = {
    microIdea: `Let's look at the heart of ${topic}.`,
    example: `Imagine we see ${topic} in our daily life.`,
    question: `Does this make sense?`
  };

  // 2. Override Logic: Prefer Student Interests over Static Map
  const hasInterests = args.studentInterests && args.studentInterests.length > 0;
  
  // If no specific interests, try to use the static Kenyan map
  if (!hasInterests) {
    for (const [key, val] of CURRICULUM_MAP) {
      if (topic.includes(key)) {
        content = val;
        break;
      }
    }
  }

  const ctx: TeachingContext = {
    userInput: args.studentInput || "",
    topic: topic,
    isProblemSolving: REGEX_STEPS.test(topic),
    studentUncertain: (args.studentInput || "").includes("unsure")
  };

  // 3. Instruction Injection
  // If interests exist, we FORCE the LLM to ignore the generic/static example 
  // and generate a fresh one based on the interest.
  const interestInstruction = hasInterests
      ? `IGNORE GENERIC EXAMPLES. Generate a specific ${args.studentInterests![0]} related example for ${topic}.`
      : "Present Idea. Then Example. Then Question.";

  return {
    microIdea: generateTeachingResponse(content.microIdea, ctx),
    example: generateTeachingResponse(content.example, ctx),
    question: generateTeachingResponse(content.question, ctx),
    teacherInstruction: interestInstruction,
    usedTopic: topic 
  };
}

/* --- 4. Math Validate --- */
export async function math_validate_answer(args: { question: string; studentAnswer: string; attemptCount?: number }) {
  const qClean = args.question.replace(REGEX_MATH_CLEAN, '');
  const sClean = args.studentAnswer.replace(REGEX_MATH_CLEAN, '');

  if (!qClean) return { isCorrect: false, explanation: "I couldn't read the numbers." };

  try {
    const correctVal = math.evaluate(qClean);
    let studentVal;
    try {
      studentVal = math.evaluate(sClean);
    } catch {
      // Fast fallback for words
      const words: Record<string, number> = {"one":1, "two":2, "three":3, "four":4, "five":5, "ten":10};
      studentVal = words[args.studentAnswer.toLowerCase().trim()] ?? null;
    }

    if (studentVal === null) return { isCorrect: false, explanation: "Please write the number." };

    const isCorrect = Math.abs(correctVal - studentVal) < 0.0000001;

    if (isCorrect) {
      return { isCorrect: true, feedbackType: "celebrate", explanation: "Mashallah! Exactly right." };
    } 

    if ((args.attemptCount || 1) >= 5) {
      return {
        isCorrect: false,
        feedbackType: "hint",
        explanation: "Good persistence. I will not give the final answer directly. Let us do one small step together."
      };
    }
    
    return { isCorrect: false, feedbackType: "hint", explanation: "Not quite. Check your numbers." };
  } catch {
    return { isCorrect: false, explanation: "Error calculating." };
  }
}

/* --- 5. Formatting Polisher (Stateless) --- */
export async function formatting_polisher(args: { rawText: string; contextTopic?: string; userInput?: string; strictMathMode?: boolean }) {
  const preserved = preserveFencedCodeBlocks(args.rawText || '');
  let text = preserved.text;

  // 1. Remove Robotic Phrases
  text = text.replace(REGEX_ROBOTIC, '');

  // 2. Markdown Cleanup
  text = text.replace(/(\*\*|__)/g, '');
  text = text.replace(/^\s*[-*]\s+/gm, '');
  
  // 3. Apply Hard Sanitizer (Includes grammar, context hygiene, and step-label governance)
  const allowProceduralStepLabels = shouldAllowProceduralStepLabels(args);
  let cleaned = sanitizeOutputHard(text, args.contextTopic, { allowProceduralStepLabels });

  const strictMath = Boolean(args.strictMathMode) || isMathContext(cleaned, args.contextTopic, args.userInput);
  if (strictMath) {
    cleaned = enforceStrictMathCoachFormatting(cleaned, args.userInput, args.contextTopic);
  }
  cleaned = enforceRealisticMathExamples(cleaned, args.userInput, args.contextTopic);
  cleaned = convertInlineLanguagePrefixedCode(cleaned);
  cleaned = wrapLikelyCodeParagraphs(cleaned);
  cleaned = restoreFencedCodeBlocks(cleaned, preserved.blocks);

  return { cleanedText: cleaned };
}

/* --- 6. Memory Manager (Redis Activated & Fault Tolerant) --- */
export async function memory_manager(args: { mode: string; key: string; value?: string }, context?: { studentId?: string }) {
  if (!context?.studentId) return { ok: false, error: 'Student ID required' };
  const mode = String(args.mode || '').toLowerCase();
  const key = String(args.key || '').trim();
  if (!key) return { ok: false, error: 'Memory key required' };

  const redis = await getRedisClient();
  const redisKey = `student:${context.studentId}:memory:${key}`;
  const topicKey = `student:${context.studentId}`;

  try {
    if (mode === 'save') {
      const value = String(args.value ?? '').trim();
      if (!value) return { ok: false, error: 'Memory value required' };

      const existing = await prisma.globalMemory.findFirst({
        where: { topic: topicKey, question: key },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) {
        await prisma.globalMemory.update({
          where: { id: existing.id },
          data: {
            correction: value,
            frequency: { increment: 1 },
          },
        });
      } else {
        await prisma.globalMemory.create({
          data: {
            topic: topicKey,
            question: key,
            correction: value,
          },
        });
      }

      if (redis) {
        await redis.set(redisKey, value, { EX: 60 * 60 * 24 * 30 });
      }
      return { ok: true, durable: true };
    }

    if (mode === 'get') {
      if (redis) {
        const cached = await redis.get(redisKey);
        if (cached) return { ok: true, value: cached, durable: true, cached: true };
      }

      const existing = await prisma.globalMemory.findFirst({
        where: { topic: topicKey, question: key },
        orderBy: { updatedAt: 'desc' },
      });
      const value = String(existing?.correction || '').trim();
      if (value && redis) {
        await redis.set(redisKey, value, { EX: 60 * 60 * 24 * 30 });
      }
      return { ok: true, value: value || null, durable: true };
    }

    if (mode === 'delete') {
      await prisma.globalMemory.deleteMany({
        where: { topic: topicKey, question: key },
      });
      if (redis) {
        await redis.del(redisKey);
      }
      return { ok: true, durable: true };
    }

    return { ok: true };
  } catch (e) {
    console.error('[MemoryManager] Operation failed', e);
    return { ok: false, error: "DB Error" };
  }
}

/* --- 7. Guardian Sanitize (Entry Point) --- */
export async function GUARDIAN_SANITIZE(
  text: string,
  contextTopic?: string,
  options?: { userInput?: string; strictMathMode?: boolean }
): Promise<string> {
  // This is the main exit gate. It is stateless.
  
  let output = await formatting_polisher({
    rawText: text,
    contextTopic,
    userInput: options?.userInput,
    strictMathMode: options?.strictMathMode
  });
  
  // Check Emojis
  const isArabic = await isArabicText(output.cleanedText);
  if (isArabic) {
    output.cleanedText = output.cleanedText.replace(REGEX_EMOJI, '');
  } else {
    // Max 1 emoji at end
    const emojis = output.cleanedText.match(REGEX_EMOJI) || [];
    if (emojis.length > 1) {
      output.cleanedText = output.cleanedText.replace(REGEX_EMOJI, '') + ' ' + emojis[0];
    }
  }

  return output.cleanedText;
}

/* --- 8. Wrappers --- */
export async function youtube_search_tool(args: { query: string }) {
  if (typeof youtubeSearchFlow === 'undefined') return { results: [] };
  try {
    const results = await runFlow(youtubeSearchFlow, { query: args.query });
    return { results: Array.isArray(results) ? results : [] };
  } catch { return { results: [] }; }
}

export async function get_youtube_transcript_tool(args: { videoId: string }) {
  if (typeof getYoutubeTranscriptFlow === 'undefined') return "No transcript";
  return await runFlow(getYoutubeTranscriptFlow, { videoId: args.videoId });
}

export async function math_generate_question(args: { topic: string }) {
  return { question: "What is 2 + 2?", answerKeywords: "4,four" };
}

export async function arabic_mode_formatter(args: { text: string }) {
  let t = args.text.replace(REGEX_EMOJI, '');
  t = t.replace(/\?/g, '؟').replace(/,/g, '،');
  return { cleanedText: t };
}

export async function emoji_policy_check(args: any) {
  const text = String(args?.text || '');
  const languageMode = norm(args?.languageMode);

  if (!text) return { ok: true, cleanedText: '' };

  if (languageMode.startsWith('arabic')) {
    return { ok: true, cleanedText: text.replace(REGEX_EMOJI, '').trim() };
  }

  const emojis = text.match(REGEX_EMOJI) || [];
  if (emojis.length <= 1) {
    return { ok: true, cleanedText: text };
  }

  const withoutEmoji = text.replace(REGEX_EMOJI, '').trim();
  return { ok: true, cleanedText: `${withoutEmoji} ${emojis[0]}`.trim() };
}

export async function ask_practice_question(args: any) {
  return args;
}

export async function quran_pedagogy(args: any) {
  const query = String(args?.query || args?.text || args?.topic || '').toLowerCase();
  const requestType = String(args?.requestType || '').toLowerCase();
  const gradeLevel = String(args?.gradeLevel || '').toLowerCase();

  const isFatwaLike =
    /\b(fatwa|halal|haram|permissible|allowed|forbidden|sinful|is it okay|is it allowed)\b/.test(query) ||
    requestType.includes('fatwa');
  const isQuran = /\b(quran|surah|ayah|tafsir|tajweed|makhraj)\b/.test(query);
  const isHadith = /\b(hadith|sunnah|narration)\b/.test(query);
  const isFiqh = /\b(fiqh|wudu|wudhu|ghusl|salah|zakat|sawm|fasting|hajj)\b/.test(query);
  const isSeerah = /\b(seerah|sirah|prophet|sahaba|companions|madinah|makkah)\b/.test(query);
  const isAkhlaq = /\b(akhlaq|character|manners|adab|honesty|patience|kindness)\b/.test(query);

  const domain =
    isQuran ? 'quran' :
    isHadith ? 'hadith' :
    isFiqh ? 'fiqh' :
    isSeerah ? 'seerah' :
    isAkhlaq ? 'akhlaq' :
    'general_islamic';

  const ageSafeTone =
    /primary|grade 1|grade 2|grade 3|grade 4|grade 5|grade 6|children|kid/.test(gradeLevel)
      ? 'Use very simple words, short sentences, and one moral takeaway.'
      : 'Use respectful, clear educational wording and mention valid scholarly differences briefly when needed.';
  const evidenceReferences =
    domain === 'quran'
      ? ['Qur\'an text', 'reliable tafsir summary', 'clear distinction between verse wording and explanation']
      : domain === 'hadith'
        ? ['Hadith wording if known', 'authenticity level if known', 'Sahih collections first when applicable']
        : domain === 'fiqh'
          ? ['Qur\'an and Sunnah principle', 'brief note on valid scholarly difference', 'refer personal rulings to a trusted local scholar']
          : domain === 'seerah'
            ? ['well-established seerah reports', 'distinguish confirmed reports from popular retellings']
            : ['Qur\'an or Sunnah principle when relevant', 'state clearly when a point is a general lesson rather than a direct quotation'];
  const scholarlyMethod =
    domain === 'fiqh'
      ? 'State the core ruling principle, then note briefly if scholars or madhhabs differ. Do not present a disputed issue as unanimous.'
      : domain === 'hadith'
        ? 'State authenticity carefully. If a hadith grade is uncertain, say so plainly and focus on the educational benefit.'
        : 'Ground the explanation in recognised Islamic sources and distinguish evidence from teacher explanation.';

  if (isFatwaLike) {
    return {
      safe: true,
      domain,
      teachingMode: 'principles_with_scholar_caution',
      message:
        'Teach the core principle respectfully, avoid acting as a final mufti, and advise checking a trusted local scholar or teacher for personal rulings.',
      scholarCaution:
        'Do not issue absolute personal fatwas. Give the educational principle, note if scholars may differ, and recommend a trusted local scholar for personal cases.',
      ageSafeTone,
      evidenceReferences,
      scholarlyMethod,
    };
  }

  if (domain === 'quran') {
    return {
      safe: true,
      domain,
      teachingMode: 'quran_reflection',
      message:
        'Explain the ayah or surah in simple educational language, keep wording respectful, and focus on meaning, lesson, and memorisation-friendly understanding.',
      scholarCaution:
        'If you are unsure of an exact quotation or reference, paraphrase clearly instead of inventing wording.',
      ageSafeTone,
      evidenceReferences,
      scholarlyMethod,
    };
  }

  if (domain === 'hadith') {
    return {
      safe: true,
      domain,
      teachingMode: 'hadith_context',
      message:
        'Teach the hadith with context, the practical lesson, and careful wording. Avoid overstating authenticity if not certain.',
      scholarCaution:
        'If authenticity level is uncertain, say so briefly and focus on the educational lesson.',
      ageSafeTone,
      evidenceReferences,
      scholarlyMethod,
    };
  }

  return {
    safe: true,
    domain,
    teachingMode: 'islamic_studies',
    message:
      'Teach respectfully, connect the concept to worship, character, or daily Muslim life when helpful, and keep the explanation educational rather than preachy.',
    scholarCaution:
      'Where valid scholarly differences exist, mention that briefly and avoid claiming a disputed point is unanimous.',
    ageSafeTone,
    evidenceReferences,
    scholarlyMethod,
  };
}

/* ============================================================================
   MAIN ROUTER
   ============================================================================ */

export async function toolRouter(functionName: string, args: any, context?: { studentId?: string }): Promise<any> {
  switch (functionName) {
    case 'emotional_decoder': return emotional_decoder(args);
    case 'tone_generator': return tone_generator(args);
    
    // Pass args for personalization
    case 'teaching_micro_step': return teaching_micro_step(args);
    
    case 'math_validate_answer': return math_validate_answer(args);
    case 'math_generate_question': return math_generate_question(args);
    case 'formatting_polisher': return formatting_polisher(args); 
    
    case 'memory_manager': return memory_manager(args, context);
    
    case 'GUARDIAN_SANITIZE': return GUARDIAN_SANITIZE(args.text, args.topic, args.options);
    
    case 'youtube_search': return youtube_search_tool(args);
    case 'get_youtube_transcript': return get_youtube_transcript_tool(args);
    case 'arabic_mode_formatter': return arabic_mode_formatter(args);
    case 'emoji_policy_check': return emoji_policy_check(args);
    case 'quran_pedagogy': return quran_pedagogy(args);
    default: return { error: `Unknown tool: ${functionName}` };
  }
}
