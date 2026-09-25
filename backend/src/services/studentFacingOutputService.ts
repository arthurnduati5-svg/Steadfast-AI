// ─────────────────────────────────────────────────────────────
// Steadfast AI — Student-Facing Output Gate v1
// (STEADFAST-CHAT-BACKEND-DURABILITY-V1)
//
// One backend-owned deterministic boundary gate for student-facing tutor
// output. It runs before tutor output is streamed, persisted, or returned
// non-streaming:
//   • outside programming code, obvious raw LaTeX becomes readable text;
//   • unsafe raw HTML is rejected/removed instead of persisted;
//   • real fenced programming code is preserved byte-for-byte (backslashes,
//     braces, brackets, asterisks, punctuation, language syntax).
//
// This is NOT a second AI tutor formatter: it is a pure, deterministic
// server-boundary safety/formatting gate. The streaming gate is stateful
// and only emits finalized chunks; for a completed stream the invariant
//   concatenated emitted assistant content == canonical persisted content
// holds by construction (release boundaries never split a construct).
// ─────────────────────────────────────────────────────────────

// ── LaTeX symbol table (prose-safe Unicode) ──

const LATEX_SYMBOL_MAP: Array<[RegExp, string]> = [
  [/\\times\b/g, '×'],
  [/\\cdot\b/g, '·'],
  [/\\div\b/g, '÷'],
  [/\\pm\b/g, '±'],
  [/\\mp\b/g, '∓'],
  [/\\leq\b/g, '≤'],
  [/\\le\b/g, '≤'],
  [/\\geq\b/g, '≥'],
  [/\\ge\b/g, '≥'],
  [/\\neq\b/g, '≠'],
  [/\\ne\b/g, '≠'],
  [/\\approx\b/g, '≈'],
  [/\\equiv\b/g, '≡'],
  [/\\rightarrow\b/g, '→'],
  [/\\to\b/g, '→'],
  [/\\leftarrow\b/g, '←'],
  [/\\Rightarrow\b/g, '⇒'],
  [/\\infty\b/g, '∞'],
  [/\\degree\b/g, '°'],
];

/** Commands whose single brace argument is rendered as plain text. */
const TEXTUAL_COMMANDS = ['text', 'mathrm', 'mathbf', 'mathit', 'textbf', 'operatorname', 'overline', 'underline', 'bar'];

function readBalancedGroup(text: string, openBraceIndex: number): { content: string; endIndex: number } | null {
  if (text[openBraceIndex] !== '{') return null;
  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\') {
      i += 1; // skip escaped character
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return { content: text.slice(openBraceIndex + 1, i), endIndex: i };
      }
    }
  }
  return null; // unbalanced → incomplete construct
}

/**
 * Converts \frac{a}{b} → (a)/(b) handling both groups and nested content.
 * Repeatedly rewrites the FIRST \frac whose two brace groups are fully
 * present, so nested groups resolve on subsequent passes.
 */
function convertFractions(text: string): string {
  let current = text;
  for (;;) {
    const start = current.indexOf('\\frac');
    if (start === -1) break;
    let cursor = start + '\\frac'.length;
    while (current[cursor] === ' ') cursor += 1;
    const first = readBalancedGroup(current, cursor);
    if (!first) break;
    let after = first.endIndex + 1;
    while (current[after] === ' ') after += 1;
    const second = readBalancedGroup(current, after);
    if (!second) break;
    current = `${current.slice(0, start)}(${first.content})/(${second.content})${current.slice(second.endIndex + 1)}`;
  }
  return current;
}

function convertRoots(text: string): string {
  let current = text;
  for (;;) {
    const start = current.indexOf('\\sqrt');
    if (start === -1) break;
    let cursor = start + '\\sqrt'.length;
    let index: string | null = null;
    if (current[cursor] === '[') {
      const close = current.indexOf(']', cursor + 1);
      if (close === -1) break;
      index = current.slice(cursor + 1, close);
      cursor = close + 1;
    }
    while (current[cursor] === ' ') cursor += 1;
    const group = readBalancedGroup(current, cursor);
    if (!group) break;
    const rendered = index ? `${index}-th root (${group.content})` : `√(${group.content})`;
    current = current.slice(0, start) + rendered + current.slice(group.endIndex + 1);
  }
  return current;
}

/**
 * Removes math delimiters, keeping their content:
 * \( x \) → x, \[ x \] → x, $$ x $$ → x, $ x $ → x.
 * Single-$ unwrapping requires an internal LaTeX hint so currency
 * ("$5 and $10") is never mangled.
 */
function unwrapMathDelimiters(text: string): string {
  let current = text
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  current = current.replace(/\$([^$\n]+)\$/g, (match, content: string) => {
    if (/[\\^_]/.test(content)) return content;
    return match;
  });
  return current;
}

function convertLatexSymbols(text: string): string {
  let current = text;
  for (const [pattern, replacement] of LATEX_SYMBOL_MAP) {
    current = current.replace(pattern, replacement);
  }
  // spacing commands and \left/\right fences
  current = current.replace(/\\left\b|\\right\b/g, '');
  current = current.replace(/\\[,;:! ]/g, ' ');
  return current;
}

/** Strips leftover raw backslash-commands so no raw LaTeX remains in prose. */
function stripLeftoverLatexCommands(text: string): string {
  let current = text;
  // \command{arg} → arg
  current = current.replace(/\\([a-zA-Z]+)\s*\{([^{}]*)\}/g, '$2');
  // remaining bare \command tokens are dropped (raw commands must not survive)
  current = current.replace(/\\[a-zA-Z]+/g, ' ');
  return current.replace(/[ \t]{2,}/g, ' ');
}

/** Removes unsafe raw HTML from prose. */
function stripUnsafeHtml(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<[^>]*>/g, '');
}

/** Splits raw text into prose / fenced-code segments. */
function splitByFences(text: string): Array<{ isCode: boolean; content: string }> {
  const segments: Array<{ isCode: boolean; content: string }> = [];
  let cursor = 0;
  for (;;) {
    const open = text.indexOf('```', cursor);
    if (open === -1) {
      segments.push({ isCode: false, content: text.slice(cursor) });
      break;
    }
    if (open > cursor) segments.push({ isCode: false, content: text.slice(cursor, open) });
    const close = text.indexOf('```', open + 3);
    if (close === -1) {
      // unterminated fence: treat the remainder as code until proven otherwise
      segments.push({ isCode: true, content: text.slice(open) });
      break;
    }
    segments.push({ isCode: true, content: text.slice(open, close + 3) });
    cursor = close + 3;
  }
  return segments;
}

function convertProseSegment(prose: string): string {
  let out = stripUnsafeHtml(prose);
  out = convertFractions(out);
  out = convertRoots(out);
  out = unwrapMathDelimiters(out);
  out = convertLatexSymbols(out);
  out = stripLeftoverLatexCommands(out);
  return out;
}

/**
 * Canonical finalization for complete tutor output.
 */
export function finalizeStudentFacingOutput(raw: string): string {
  if (typeof raw !== 'string' || raw.length === 0) return '';
  const segments = splitByFences(raw);
  return segments
    .map((segment) => {
      if (segment.isCode) return segment.content;
      // protect inline code spans before prose conversion
      const parts: Array<{ isCode: boolean; content: string }> = [];
      let cursor = 0;
      const inlinePattern = /`[^`\n]*`/g;
      let match: RegExpExecArray | null;
      while ((match = inlinePattern.exec(segment.content)) !== null) {
        if (match.index > cursor) parts.push({ isCode: false, content: segment.content.slice(cursor, match.index) });
        parts.push({ isCode: true, content: match[0] });
        cursor = match.index + match[0].length;
      }
      parts.push({ isCode: false, content: segment.content.slice(cursor) });
      return parts.map((part) => (part.isCode ? part.content : convertProseSegment(part.content))).join('');
    })
    .join('');
}

// ── Stateful streaming gate ──

const LATEX_COMMAND_PATTERN = /\\[a-zA-Z]+/;

/**
 * Stateful streaming gate. push(chunk) returns only safe finalized text;
 * flush() finalizes the remainder. For a completed stream:
 *   concat(push(...), flush()) === finalizeStudentFacingOutput(full input)
 */
export interface StreamingStudentFacingGate {
  push(chunk: string): string;
  flush(): string;
}

export function createStreamingStudentFacingGate(): StreamingStudentFacingGate {
  let pending = '';
  // Whether emitted output so far ends with a space/tab. A space/tab run
  // split across releases must collapse exactly as the whole-string
  // canonicalization does, so a release may not start with more whitespace
  // when emission already ends with it.
  let emittedEndsWithSpace = false;

  const findReleasableLength = (text: string): number => {
    let i = 0;
    while (i < text.length) {
      // fenced code: release only complete fences, unconverted
      if (text.startsWith('```', i)) {
        const close = text.indexOf('```', i + 3);
        if (close === -1) return i;
        i = close + 3;
        continue;
      }
      const ch = text[i];

      if (ch === '\\') {
        const rest = text.slice(i);
        // \( … \) and \[ … \] regions must be complete before release
        const openMath = rest.match(/^\\([([])/);
        if (openMath) {
          const closer = openMath[1] === '(' ? '\\)' : '\\]';
          const closeIndex = text.indexOf(closer, i + 2);
          if (closeIndex === -1) return i;
          i = closeIndex + 2;
          continue;
        }
        const commandMatch = rest.match(/^\\([a-zA-Z]+)/);
        if (commandMatch) {
          const command = commandMatch[1];
          let afterCommand = i + commandMatch[0].length;
          if (command === 'frac') {
            // need two balanced groups
            while (text[afterCommand] === ' ') afterCommand += 1;
            const first = readBalancedGroup(text, afterCommand);
            if (!first) return i;
            let nextCursor = first.endIndex + 1;
            while (text[nextCursor] === ' ') nextCursor += 1;
            const second = readBalancedGroup(text, nextCursor);
            if (!second) return i;
            i = second.endIndex + 1;
            continue;
          }
          if (command === 'sqrt') {
            while (text[afterCommand] === ' ') afterCommand += 1;
            if (text[afterCommand] === '[') {
              const closeBracket = text.indexOf(']', afterCommand + 1);
              if (closeBracket === -1) return i;
              afterCommand = closeBracket + 1;
            }
            while (text[afterCommand] === ' ') afterCommand += 1;
            const group = readBalancedGroup(text, afterCommand);
            if (!group) return i;
            i = group.endIndex + 1;
            continue;
          }
          if (TEXTUAL_COMMANDS.includes(command)) {
            while (text[afterCommand] === ' ') afterCommand += 1;
            const group = readBalancedGroup(text, afterCommand);
            if (group) {
              i = group.endIndex + 1;
              continue;
            }
            return i;
          }
          // symbol / bare command: complete once its letters end. Letters
          // running to the end of pending may continue in the next chunk,
          // so hold instead of releasing a possibly partial command.
          if (afterCommand >= text.length) return i;
          // An unknown \command{arg} unit must not split: the prose
          // canonicalization rewrites it to `arg`, so hold an incomplete
          // trailing group and release a complete one atomically.
          let argCursor = afterCommand;
          while (text[argCursor] === ' ') argCursor += 1;
          if (text[argCursor] === '{') {
            const argGroup = readBalancedGroup(text, argCursor);
            if (!argGroup) return i;
            i = argGroup.endIndex + 1;
            continue;
          }
          i = afterCommand;
          continue;
        }
        // escaped punctuation like \( handled above; other escapes are complete.
        // A trailing lone backslash may start a command that continues in
        // the next chunk — hold it instead of splitting the construct.
        if (i + 1 >= text.length) return i;
        i += 2;
        continue;
      }

      if (ch === '$') {
        const isDisplay = text.startsWith('$$', i);
        const closer = isDisplay ? '$$' : '$';
        const closeIndex = text.indexOf(closer, i + closer.length);
        if (closeIndex === -1) return i;
        if (!isDisplay) {
          const content = text.slice(i + 1, closeIndex);
          // currency-like spans without a LaTeX hint are released as-is
          if (!/[\\^_]/.test(content)) {
            i = closeIndex + 1;
            continue;
          }
        }
        i = closeIndex + closer.length;
        continue;
      }

      if (ch === '<') {
        const closeAngle = text.indexOf('>', i + 1);
        if (closeAngle === -1) return i; // possible tag — hold until resolved
        i = closeAngle + 1;
        continue;
      }

      if (ch === '`') {
        // Disambiguate inline spans from fences: a backtick run of 2+ is
        // fence-involved (or a fence split across chunks) and must never be
        // treated as an inline-span delimiter — hold until resolved. A
        // single trailing backtick may extend into a fence — hold as well.
        let runEnd = i;
        while (text[runEnd] === '`') runEnd += 1;
        const runLength = runEnd - i;
        if (runLength !== 1 || runEnd >= text.length) return i;
        // Single delimiter with following content: find an isolated
        // single-backtick closer. A closer inside a fence run (or no
        // closer yet) means hold.
        const closeBacktick = text.indexOf('`', runEnd);
        if (closeBacktick === -1) return i; // possible inline code span — hold
        if (text[closeBacktick + 1] === '`' || text[closeBacktick - 1] === '`') return i;
        i = closeBacktick + 1;
        continue;
      }

      i += 1;
    }
    return text.length;
  };

  return {
    push(chunk: string): string {
      if (typeof chunk !== 'string' || chunk.length === 0) return '';
      pending += chunk;
      const releasable = findReleasableLength(pending);
      if (releasable <= 0) return '';
      const released = pending.slice(0, releasable);
      pending = pending.slice(releasable);
      let finalized = finalizeStudentFacingOutput(released);
      // A space/tab run split across the release boundary must collapse
      // exactly as the whole-string canonicalization does: when emitted
      // output already ends with a space, pending may not start with more.
      if (/[ \t]$/.test(finalized) && /^[ \t]/.test(pending)) {
        pending = pending.replace(/^[ \t]+/, '');
      }
      if (emittedEndsWithSpace) {
        finalized = finalized.replace(/^[ \t]+/, '');
      }
      emittedEndsWithSpace = /[ \t]$/.test(finalized) || (finalized === '' && emittedEndsWithSpace);
      return finalized;
    },
    flush(): string {
      let remainder = finalizeStudentFacingOutput(pending);
      pending = '';
      if (emittedEndsWithSpace) {
        remainder = remainder.replace(/^[ \t]+/, '');
      }
      emittedEndsWithSpace = false;
      return remainder;
    },
  };
}
