// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-04: deterministic math evaluation engine
//
// ONE safe, bounded mathematical evaluation layer. No dynamic code
// execution (no eval, no new Function, no VM, no shell). All parsing is
// iterative/bounded with explicit resource limits; malformed or
// adversarial input terminates quickly as INVALID or UNSUPPORTED.
//
// Supported decidable surface:
//   EXACT_TEXT, NUMERIC, RATIONAL, ARITHMETIC, ALGEBRAIC_EQUIVALENCE,
//   LINEAR_EQUATION. Anything else (units, functions, trig, calculus,
//   matrices, multi-variable systems) is UNSUPPORTED — never incorrect.
// ─────────────────────────────────────────────────────────────

export type DeterministicMathStatus = 'CORRECT' | 'INCORRECT' | 'UNSUPPORTED' | 'INVALID';

export type DeterministicMathEvaluator =
  | 'EXACT_TEXT'
  | 'NUMERIC'
  | 'RATIONAL'
  | 'ARITHMETIC'
  | 'ALGEBRAIC_EQUIVALENCE'
  | 'LINEAR_EQUATION'
  | 'NONE';

export interface DeterministicMathResult {
  status: DeterministicMathStatus;
  evaluator: DeterministicMathEvaluator;
  normalizedCandidate?: string;
  normalizedExpected?: string;
  confidence: number;
  reasonCode: string;
  safeSummary?: string;
}

// ── Explicit resource bounds (§14) ──

export const MATH_MAX_EXPRESSION_LENGTH = 500;
export const MATH_MAX_TOKENS = 200;
export const MATH_MAX_PAREN_DEPTH = 20;
export const MATH_MAX_DIGITS_PER_NUMBER = 30;
export const MATH_MAX_EXPONENT_MAGNITUDE = 10;
export const MATH_MAX_RATIONAL_MAGNITUDE = 1000000000;
export const MATH_NUMERIC_TOLERANCE = 1e-9;

export type ServerEvaluationType =
  | 'deterministic_exact'
  | 'deterministic_numeric'
  | 'deterministic_algebraic'
  | 'semantic_deferred';

// ── Normalization ──

export function normalizeMathInput(value: unknown): string {
  return String(value ?? '')
    .replace(/[−–—]/g, '-')
    .replace(/\*\*/g, '^')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function stripAllSpace(s: string): string {
  return s.replace(/\s+/g, '');
}

// ── Units: conservative detection (§10) ──
// A number directly followed by letters (e.g. "5 m", "10kg") or a
// multi-letter word is unit-bearing. A single algebra letter bound by
// implicit multiplication (2x) inside algebraic evaluation is NOT a unit.

const UNIT_SUFFIX_PATTERN = /[0-9][\s]*(mm|cm|km|kg|ms|ft|in|lbs?|meter?s?|kilometer?s?|centimeter?s?|gram?s?|kilos?|seconds?|minutes?|hours?|liters?|litres?|degrees?|°|%|[a-z]{2,})\b/;
const GENERIC_NUMBER_UNIT_PATTERN = /[0-9]\s*[a-df-z]\b/;

export function hasUnitBearing(text: string, allowSingleLetterAlgebra: boolean): boolean {
  const t = normalizeMathInput(text);
  if (!t) return false;
  // A number separated from letters by whitespace is always unit-bearing:
  // implicit multiplication is written attached ("2x", never "2 x").
  if (/[0-9]\s+[a-zA-Z°%]/u.test(t)) return true;
  if (UNIT_SUFFIX_PATTERN.test(t)) return true;
  if (!allowSingleLetterAlgebra && GENERIC_NUMBER_UNIT_PATTERN.test(t)) return true;
  if (/(°|%)/.test(t)) return true;
  return false;
}

// ── Strict numeric shape ──

const NUMERIC_PATTERN = /^[+-]?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/;

export function tryParseStrictNumber(text: string): number | null {
  const cleaned = stripAllSpace(text);
  if (cleaned.length === 0 || cleaned.length > MATH_MAX_EXPRESSION_LENGTH) return null;
  if (!NUMERIC_PATTERN.test(cleaned)) return null;
  const digitCount = (cleaned.match(/\d/g) || []).length;
  if (digitCount > MATH_MAX_DIGITS_PER_NUMBER) return null;
  const expMatch = cleaned.match(/[eE]([+-]?\d+)$/);
  if (expMatch && Math.abs(Number(expMatch[1])) > 308) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function numericEqual(a: number, b: number): boolean {
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= MATH_NUMERIC_TOLERANCE * scale;
}

// ── Exact rational (BigInt reduction) ──

const RATIONAL_PATTERN = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/;

function bigintGcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const r = x % y;
    x = y;
    y = r;
  }
  return x;
}

export function tryParseRational(text: string): { num: bigint; den: bigint } | null {
  const cleaned = stripAllSpace(text);
  const m = RATIONAL_PATTERN.exec(cleaned);
  if (!m) return null;
  if (m[1].replace(/^[+-]/, '').length > 10 || m[2].replace(/^[+-]/, '').length > 10) return null;
  let num: bigint;
  let den: bigint;
  try {
    num = BigInt(m[1]);
    den = BigInt(m[2]);
  } catch {
    return null;
  }
  if (den === 0n) return null;
  const limit = BigInt(MATH_MAX_RATIONAL_MAGNITUDE);
  const abs = (v: bigint): bigint => (v < 0n ? -v : v);
  if (abs(num) > limit || abs(den) > limit) return null;
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const g = bigintGcd(num, den);
  return { num: num / g, den: den / g };
}

export function isZeroDenominatorFraction(text: string): boolean {
  const cleaned = stripAllSpace(text);
  const m = RATIONAL_PATTERN.exec(cleaned);
  if (!m) return false;
  try {
    return BigInt(m[2]) === 0n;
  } catch {
    return false;
  }
}

// ── Bounded expression parser (no code execution) ──

type Token =
  | { kind: 'num'; value: number; raw: string }
  | { kind: 'var'; name: string }
  | { kind: 'op'; op: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'eq' };

function tokenize(input: string): Token[] | null {
  const s = stripAllSpace(input);
  if (s.length === 0 || s.length > MATH_MAX_EXPRESSION_LENGTH) return null;
  const tokens: Token[] = [];
  let i = 0;
  const isDigit = (c: string): boolean => c >= '0' && c <= '9';
  const isLetter = (c: string): boolean => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
  while (i < s.length) {
    if (tokens.length > MATH_MAX_TOKENS) return null;
    const c = s[i];
    if (c === '(') {
      tokens.push({ kind: 'lparen' });
      i += 1;
    } else if (c === ')') {
      tokens.push({ kind: 'rparen' });
      i += 1;
    } else if (c === '=') {
      tokens.push({ kind: 'eq' });
      i += 1;
    } else if (c === '+' || c === '-' || c === '*' || c === '/' || c === '^') {
      tokens.push({ kind: 'op', op: c });
      i += 1;
    } else if (isDigit(c) || c === '.') {
      let j = i;
      while (j < s.length && (isDigit(s[j]) || s[j] === '.')) j += 1;
      if (j < s.length && (s[j] === 'e' || s[j] === 'E')) {
        let k = j + 1;
        if (k < s.length && (s[k] === '+' || s[k] === '-')) k += 1;
        const expStart = k;
        while (k < s.length && isDigit(s[k])) k += 1;
        if (k > expStart) j = k;
      }
      const raw = s.slice(i, j);
      if (!NUMERIC_PATTERN.test(raw)) return null;
      const digitCount = (raw.match(/\d/g) || []).length;
      if (digitCount === 0 || digitCount > MATH_MAX_DIGITS_PER_NUMBER) return null;
      const value = Number(raw);
      if (!Number.isFinite(value)) return null;
      tokens.push({ kind: 'num', value, raw });
      i = j;
    } else if (isLetter(c)) {
      // Multi-letter runs are not part of the supported grammar
      // (functions, units, words) — signal unsupported, not invalid.
      let j = i;
      while (j < s.length && isLetter(s[j])) j += 1;
      const word = s.slice(i, j);
      if (word.length !== 1) return null;
      tokens.push({ kind: 'var', name: word.toLowerCase() });
      i = j;
    } else {
      // Unknown character: caller maps to UNSUPPORTED (not learner error).
      return null;
    }
  }
  if (tokens.length > MATH_MAX_TOKENS) return null;
  return tokens;
}

type AstNode =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'unary'; op: '+' | '-'; expr: AstNode }
  | { kind: 'bin'; op: '+' | '-' | '*' | '/' | '^'; left: AstNode; right: AstNode };

interface ParseState {
  tokens: Token[];
  pos: number;
  depth: number;
  ok: boolean;
  unsupported: boolean;
}

function insertImplicitMultiplication(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    out.push(tokens[i]);
    const cur = tokens[i];
    const nxt = tokens[i + 1];
    if (!nxt) break;
    const curIsValue = cur.kind === 'num' || cur.kind === 'var' || cur.kind === 'rparen';
    const nxtStartsValue = nxt.kind === 'var' || nxt.kind === 'lparen' || nxt.kind === 'num';
    if (curIsValue && nxtStartsValue) {
      // "2 3" (two adjacent numbers) is malformed, not multiplication.
      if (cur.kind === 'num' && nxt.kind === 'num') continue;
      out.push({ kind: 'op', op: '*' });
    }
  }
  return out;
}

function parseExpression(st: ParseState): AstNode | null {
  let node = parseTerm(st);
  if (!st.ok || !node) return node;
  for (;;) {
    const t = st.tokens[st.pos];
    if (t && t.kind === 'op' && (t.op === '+' || t.op === '-')) {
      st.pos += 1;
      const rhs = parseTerm(st);
      if (!st.ok || !rhs) return null;
      node = { kind: 'bin', op: t.op, left: node, right: rhs };
    } else {
      return node;
    }
  }
}

function parseTerm(st: ParseState): AstNode | null {
  let node = parseFactor(st);
  if (!st.ok || !node) return node;
  for (;;) {
    const t = st.tokens[st.pos];
    if (t && t.kind === 'op' && (t.op === '*' || t.op === '/')) {
      st.pos += 1;
      const rhs = parseFactor(st);
      if (!st.ok || !rhs) return null;
      node = { kind: 'bin', op: t.op, left: node, right: rhs };
    } else {
      return node;
    }
  }
}

function parseFactor(st: ParseState): AstNode | null {
  let base = parseUnary(st);
  if (!st.ok || !base) return base;
  const t = st.tokens[st.pos];
  if (t && t.kind === 'op' && t.op === '^') {
    st.pos += 1;
    const exp = parseUnary(st);
    if (!st.ok || !exp) return null;
    // Exponent must be a small integer literal (bounded).
    if (exp.kind !== 'num' || !Number.isInteger(exp.value) || Math.abs(exp.value) > MATH_MAX_EXPONENT_MAGNITUDE) {
      st.ok = false;
      st.unsupported = true;
      return null;
    }
    return { kind: 'bin', op: '^', left: base, right: exp };
  }
  return base;
}

function parseUnary(st: ParseState): AstNode | null {
  const t = st.tokens[st.pos];
  if (t && t.kind === 'op' && (t.op === '+' || t.op === '-')) {
    st.pos += 1;
    const inner = parseUnary(st);
    if (!st.ok || !inner) return null;
    return { kind: 'unary', op: t.op, expr: inner };
  }
  return parsePrimary(st);
}

function parsePrimary(st: ParseState): AstNode | null {
  const t = st.tokens[st.pos];
  if (!t) {
    st.ok = false;
    return null;
  }
  if (t.kind === 'num') {
    st.pos += 1;
    return { kind: 'num', value: t.value };
  }
  if (t.kind === 'var') {
    if (t.name === 'e') {
      st.ok = false;
      return null;
    }
    st.pos += 1;
    return { kind: 'var', name: t.name };
  }
  if (t.kind === 'lparen') {
    if (st.depth >= MATH_MAX_PAREN_DEPTH) {
      st.ok = false;
      st.unsupported = true;
      return null;
    }
    st.depth += 1;
    st.pos += 1;
    const inner = parseExpression(st);
    if (!st.ok || !inner) return null;
    const close = st.tokens[st.pos];
    if (!close || close.kind !== 'rparen') {
      st.ok = false;
      return null;
    }
    st.pos += 1;
    st.depth -= 1;
    return inner;
  }
  st.ok = false;
  return null;
}

export interface ParsedMath {
  ok: boolean;
  unsupported: boolean;
  ast: AstNode | null;
  variables: string[];
}

export function parseMathExpression(input: string): ParsedMath {
  const rawTokens = tokenize(stripAllSpace(normalizeMathInput(input)));
  if (!rawTokens) return { ok: false, unsupported: true, ast: null, variables: [] };
  const tokens = insertImplicitMultiplication(rawTokens);
  if (tokens.length > MATH_MAX_TOKENS) return { ok: false, unsupported: true, ast: null, variables: [] };
  const st: ParseState = { tokens, pos: 0, depth: 0, ok: true, unsupported: false };
  const ast = parseExpression(st);
  if (!st.ok || !ast || st.pos !== tokens.length) {
    return { ok: false, unsupported: st.unsupported || st.pos !== tokens.length, ast: null, variables: [] };
  }
  const vars = new Set<string>();
  const collect = (node: AstNode): void => {
    if (node.kind === 'var') vars.add(node.name);
    else if (node.kind === 'unary') collect(node.expr);
    else if (node.kind === 'bin') {
      collect(node.left);
      collect(node.right);
    }
  };
  collect(ast);
  return { ok: true, unsupported: false, ast, variables: [...vars] };
}

// ── Numeric AST evaluation (constants only) ──

export function evaluateConstantAst(node: AstNode): number | null {
  if (node.kind === 'num') return node.value;
  if (node.kind === 'var') return null;
  if (node.kind === 'unary') {
    const v = evaluateConstantAst(node.expr);
    if (v === null) return null;
    return node.op === '-' ? -v : v;
  }
  const left = evaluateConstantAst(node.left);
  const right = evaluateConstantAst(node.right);
  if (left === null || right === null) return null;
  switch (node.op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      if (right === 0) return null;
      return left / right;
    case '^': {
      const r = Math.pow(left, right);
      return Number.isFinite(r) ? r : null;
    }
    default:
      return null;
  }
}

// ── Polynomial normalization (deterministic, no sampling) ──
// Coefficients [c0, c1, c2]; degree capped at 2.

export type Poly = [number, number, number];

function polyZero(): Poly {
  return [0, 0, 0];
}

function polyAdd(a: Poly, b: Poly): Poly {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function polyNeg(a: Poly): Poly {
  return [-a[0], -a[1], -a[2]];
}

function polyMul(a: Poly, b: Poly): Poly | null {
  const out: Poly = [0, 0, 0];
  for (let i = 0; i <= 2; i += 1) {
    for (let j = 0; j <= 2; j += 1) {
      if (a[i] === 0 || b[j] === 0) continue;
      const k = i + j;
      if (k > 2) return null;
      out[k] += a[i] * b[j];
    }
  }
  return out;
}

function polyPow(base: Poly, exp: number): Poly | null {
  if (!Number.isInteger(exp) || exp < 0 || exp > MATH_MAX_EXPONENT_MAGNITUDE) return null;
  let result: Poly = [1, 0, 0];
  for (let i = 0; i < exp; i += 1) {
    const next = polyMul(result, base);
    if (!next) return null;
    result = next;
  }
  return result;
}

export function astToPoly(node: AstNode, variable: string): Poly | null {
  if (node.kind === 'num') return [node.value, 0, 0];
  if (node.kind === 'var') {
    if (node.name !== variable) return null;
    return [0, 1, 0];
  }
  if (node.kind === 'unary') {
    const inner = astToPoly(node.expr, variable);
    if (!inner) return null;
    return node.op === '-' ? polyNeg(inner) : inner;
  }
  if (node.op === '+' || node.op === '-') {
    const l = astToPoly(node.left, variable);
    const r = astToPoly(node.right, variable);
    if (!l || !r) return null;
    return node.op === '+' ? polyAdd(l, r) : polyAdd(l, polyNeg(r));
  }
  if (node.op === '*') {
    const l = astToPoly(node.left, variable);
    const r = astToPoly(node.right, variable);
    if (!l || !r) return null;
    return polyMul(l, r);
  }
  if (node.op === '/') {
    const r = astToPoly(node.right, variable);
    if (!r || r[1] !== 0 || r[2] !== 0 || r[0] === 0) return null;
    const l = astToPoly(node.left, variable);
    if (!l) return null;
    return [l[0] / r[0], l[1] / r[0], l[2] / r[0]];
  }
  if (node.op === '^') {
    if (node.right.kind !== 'num' || !Number.isInteger(node.right.value)) return null;
    const base = astToPoly(node.left, variable);
    if (!base) return null;
    return polyPow(base, node.right.value);
  }
  return null;
}

function polyEqual(a: Poly, b: Poly): boolean {
  for (let i = 0; i <= 2; i += 1) {
    const scale = Math.max(1, Math.abs(a[i]), Math.abs(b[i]));
    if (Math.abs(a[i] - b[i]) > MATH_NUMERIC_TOLERANCE * scale) return false;
  }
  return true;
}

// ── Comparison entry points ──

function splitSingleEquation(text: string): [string, string] | null {
  const parts = text.split('=');
  if (parts.length !== 2) return null;
  const left = parts[0].trim();
  const right = parts[1].trim();
  if (!left || !right) return null;
  return [left, right];
}

function compareNumeric(candidate: string, expected: string): DeterministicMathResult {
  const c = tryParseStrictNumber(candidate);
  const e = tryParseStrictNumber(expected);
  if (c === null || e === null) {
    return { status: 'UNSUPPORTED', evaluator: 'NUMERIC', confidence: 0.2, reasonCode: 'numeric_shape_unsupported' };
  }
  const equal = numericEqual(c, e);
  return {
    status: equal ? 'CORRECT' : 'INCORRECT',
    evaluator: 'NUMERIC',
    normalizedCandidate: stripAllSpace(candidate),
    normalizedExpected: stripAllSpace(expected),
    confidence: 0.9,
    reasonCode: equal ? 'numeric_match' : 'numeric_mismatch',
    safeSummary: equal ? 'Numeric values match within tolerance.' : 'Numeric values differ beyond tolerance.',
  };
}

function compareRational(candidate: string, expected: string): DeterministicMathResult {
  if (isZeroDenominatorFraction(candidate) || isZeroDenominatorFraction(expected)) {
    return { status: 'INVALID', evaluator: 'RATIONAL', confidence: 0.2, reasonCode: 'fraction_denominator_zero' };
  }
  const cr = tryParseRational(candidate);
  const er = tryParseRational(expected);
  if (cr && er) {
    const equal = cr.num === er.num && cr.den === er.den;
    return {
      status: equal ? 'CORRECT' : 'INCORRECT',
      evaluator: 'RATIONAL',
      normalizedCandidate: `${cr.num.toString()}/${cr.den.toString()}`,
      normalizedExpected: `${er.num.toString()}/${er.den.toString()}`,
      confidence: 0.92,
      reasonCode: equal ? 'rational_match' : 'rational_mismatch',
      safeSummary: equal ? 'Fractions reduce to the same rational.' : 'Fractions reduce to different rationals.',
    };
  }
  // Mixed rational/decimal where the contract permits equivalence.
  const cNum = cr ? Number(cr.num) / Number(cr.den) : tryParseStrictNumber(candidate);
  const eNum = er ? Number(er.num) / Number(er.den) : tryParseStrictNumber(expected);
  if (cNum !== null && eNum !== null && (cr || er)) {
    const equal = numericEqual(cNum, eNum);
    return {
      status: equal ? 'CORRECT' : 'INCORRECT',
      evaluator: 'RATIONAL',
      normalizedCandidate: stripAllSpace(candidate),
      normalizedExpected: stripAllSpace(expected),
      confidence: 0.85,
      reasonCode: equal ? 'rational_numeric_match' : 'rational_numeric_mismatch',
      safeSummary: equal ? 'Rational and numeric forms agree.' : 'Rational and numeric forms differ.',
    };
  }
  return { status: 'UNSUPPORTED', evaluator: 'RATIONAL', confidence: 0.2, reasonCode: 'rational_shape_unsupported' };
}

function compareArithmetic(candidate: string, expected: string): DeterministicMathResult {
  const cp = parseMathExpression(candidate);
  const ep = parseMathExpression(expected);
  if (!cp.ok || !ep.ok || !cp.ast || !ep.ast) {
    if ((!cp.ok && cp.unsupported) || (!ep.ok && ep.unsupported)) {
      return { status: 'UNSUPPORTED', evaluator: 'ARITHMETIC', confidence: 0.2, reasonCode: 'arithmetic_syntax_unsupported' };
    }
    return { status: 'INVALID', evaluator: 'ARITHMETIC', confidence: 0.2, reasonCode: 'arithmetic_malformed' };
  }
  if (cp.variables.length > 0 || ep.variables.length > 0) {
    return { status: 'UNSUPPORTED', evaluator: 'ARITHMETIC', confidence: 0.2, reasonCode: 'arithmetic_variable_unsupported' };
  }
  const cv = evaluateConstantAst(cp.ast);
  const ev = evaluateConstantAst(ep.ast);
  if (cv === null || ev === null || !Number.isFinite(cv) || !Number.isFinite(ev)) {
    return { status: 'INVALID', evaluator: 'ARITHMETIC', confidence: 0.2, reasonCode: 'arithmetic_undefined' };
  }
  const equal = numericEqual(cv, ev);
  return {
    status: equal ? 'CORRECT' : 'INCORRECT',
    evaluator: 'ARITHMETIC',
    normalizedCandidate: stripAllSpace(candidate),
    normalizedExpected: stripAllSpace(expected),
    confidence: 0.88,
    reasonCode: equal ? 'arithmetic_match' : 'arithmetic_mismatch',
    safeSummary: equal ? 'Expressions evaluate to the same value.' : 'Expressions evaluate to different values.',
  };
}

function compareAlgebraic(candidate: string, expected: string): DeterministicMathResult {
  if (candidate.includes('=') || expected.includes('=')) {
    return { status: 'UNSUPPORTED', evaluator: 'ALGEBRAIC_EQUIVALENCE', confidence: 0.2, reasonCode: 'algebraic_equation_unsupported' };
  }
  const cp = parseMathExpression(candidate);
  const ep = parseMathExpression(expected);
  if (!cp.ok || !ep.ok || !cp.ast || !ep.ast) {
    if ((!cp.ok && cp.unsupported) || (!ep.ok && ep.unsupported)) {
      return { status: 'UNSUPPORTED', evaluator: 'ALGEBRAIC_EQUIVALENCE', confidence: 0.2, reasonCode: 'algebraic_syntax_unsupported' };
    }
    return { status: 'INVALID', evaluator: 'ALGEBRAIC_EQUIVALENCE', confidence: 0.2, reasonCode: 'algebraic_malformed' };
  }
  const vars = new Set([...cp.variables, ...ep.variables]);
  if (vars.size === 0) return compareArithmetic(candidate, expected);
  if (vars.size > 1) {
    return { status: 'UNSUPPORTED', evaluator: 'ALGEBRAIC_EQUIVALENCE', confidence: 0.2, reasonCode: 'algebraic_multivariable_unsupported' };
  }
  const variable = [...vars][0];
  const cPoly = astToPoly(cp.ast, variable);
  const ePoly = astToPoly(ep.ast, variable);
  if (!cPoly || !ePoly) {
    return { status: 'UNSUPPORTED', evaluator: 'ALGEBRAIC_EQUIVALENCE', confidence: 0.2, reasonCode: 'algebraic_form_unsupported' };
  }
  const equal = polyEqual(cPoly, ePoly);
  return {
    status: equal ? 'CORRECT' : 'INCORRECT',
    evaluator: 'ALGEBRAIC_EQUIVALENCE',
    normalizedCandidate: stripAllSpace(candidate),
    normalizedExpected: stripAllSpace(expected),
    confidence: 0.86,
    reasonCode: equal ? 'algebraic_match' : 'algebraic_mismatch',
    safeSummary: equal ? 'Expressions are algebraically equivalent.' : 'Expressions are not equivalent.',
  };
}

function equationToLinearForm(side: string, variable: string): { a: number; b: number } | null {
  const parsed = parseMathExpression(side);
  if (!parsed.ok || !parsed.ast) return null;
  if (parsed.variables.length > 1) return null;
  if (parsed.variables.length === 1 && parsed.variables[0] !== variable) return null;
  const poly = astToPoly(parsed.ast, variable);
  if (!poly || poly[2] !== 0) return null;
  return { a: poly[1], b: poly[0] };
}

function compareLinearEquations(candidate: string, expected: string): DeterministicMathResult {
  const cSplit = splitSingleEquation(candidate);
  const eSplit = splitSingleEquation(expected);
  if (!cSplit || !eSplit) {
    return { status: 'UNSUPPORTED', evaluator: 'LINEAR_EQUATION', confidence: 0.2, reasonCode: 'linear_shape_unsupported' };
  }
  const cParsedL = parseMathExpression(cSplit[0]);
  const cParsedR = parseMathExpression(cSplit[1]);
  const eParsedL = parseMathExpression(eSplit[0]);
  const eParsedR = parseMathExpression(eSplit[1]);
  const allVars = new Set<string>();
  for (const p of [cParsedL, cParsedR, eParsedL, eParsedR]) {
    if (!p.ok) {
      return p.unsupported
        ? { status: 'UNSUPPORTED', evaluator: 'LINEAR_EQUATION', confidence: 0.2, reasonCode: 'linear_syntax_unsupported' }
        : { status: 'INVALID', evaluator: 'LINEAR_EQUATION', confidence: 0.2, reasonCode: 'linear_malformed' };
    }
    for (const v of p.variables) allVars.add(v);
  }
  if (allVars.size === 0) return compareArithmetic(candidate.replace('=', '-(') + ')', expected.replace('=', '-(') + ')');
  if (allVars.size > 1) {
    return { status: 'UNSUPPORTED', evaluator: 'LINEAR_EQUATION', confidence: 0.2, reasonCode: 'linear_multivariable_unsupported' };
  }
  const variable = [...allVars][0];
  const cL = equationToLinearForm(cSplit[0], variable);
  const cR = equationToLinearForm(cSplit[1], variable);
  const eL = equationToLinearForm(eSplit[0], variable);
  const eR = equationToLinearForm(eSplit[1], variable);
  if (!cL || !cR || !eL || !eR) {
    return { status: 'UNSUPPORTED', evaluator: 'LINEAR_EQUATION', confidence: 0.2, reasonCode: 'linear_nonlinear_unsupported' };
  }
  // Residual form: (aL - aR) x + (bL - bR) = 0.
  const cA = cL.a - cR.a;
  const cB = cL.b - cR.b;
  const eA = eL.a - eR.a;
  const eB = eL.b - eR.b;
  const nearZero = (n: number): boolean => Math.abs(n) <= MATH_NUMERIC_TOLERANCE * Math.max(1, Math.abs(n));
  const cIdentity = nearZero(cA) && nearZero(cB);
  const eIdentity = nearZero(eA) && nearZero(eB);
  const cContradiction = nearZero(cA) && !nearZero(cB);
  const eContradiction = nearZero(eA) && !nearZero(eB);
  if (cIdentity || eIdentity || cContradiction || eContradiction) {
    if ((cIdentity && eIdentity) || (cContradiction && eContradiction)) {
      return {
        status: 'CORRECT',
        evaluator: 'LINEAR_EQUATION',
        normalizedCandidate: stripAllSpace(candidate),
        normalizedExpected: stripAllSpace(expected),
        confidence: 0.86,
        reasonCode: cIdentity ? 'linear_identity_match' : 'linear_contradiction_match',
        safeSummary: 'Both equations have the same solution set.',
      };
    }
    return {
      status: 'INCORRECT',
      evaluator: 'LINEAR_EQUATION',
      normalizedCandidate: stripAllSpace(candidate),
      normalizedExpected: stripAllSpace(expected),
      confidence: 0.86,
      reasonCode: 'linear_solution_set_mismatch',
      safeSummary: 'The equations do not share the same solution set.',
    };
  }
  // Single-solution: same root x = -b/a → a1*b2 == a2*b1.
  const scale = Math.max(1, Math.abs(cA), Math.abs(cB), Math.abs(eA), Math.abs(eB));
  const cross = Math.abs(cA * eB - eA * cB) / (scale * scale);
  const equal = cross <= MATH_NUMERIC_TOLERANCE;
  return {
    status: equal ? 'CORRECT' : 'INCORRECT',
    evaluator: 'LINEAR_EQUATION',
    normalizedCandidate: stripAllSpace(candidate),
    normalizedExpected: stripAllSpace(expected),
    confidence: 0.86,
    reasonCode: equal ? 'linear_equivalent' : 'linear_not_equivalent',
    safeSummary: equal ? 'Both equations share the same solution.' : 'The equations have different solutions.',
  };
}

// ── Evaluator selection (§4) ──

function inferEvaluator(candidate: string, expected: string): DeterministicMathEvaluator {
  const c = normalizeMathInput(candidate);
  const e = normalizeMathInput(expected);
  if (c.includes('=') || e.includes('=')) return 'LINEAR_EQUATION';
  if (/[a-df-z]/.test(c) || /[a-df-z]/.test(e)) return 'ALGEBRAIC_EQUIVALENCE';
  if (c.includes('/') || e.includes('/')) return 'RATIONAL';
  if (/[+\-*/^()]/.test(c.replace(/^[+-]?/, '')) || /[+\-*/^()]/.test(e.replace(/^[+-]?/, ''))) return 'ARITHMETIC';
  if (tryParseStrictNumber(c) !== null && tryParseStrictNumber(e) !== null) return 'NUMERIC';
  return 'EXACT_TEXT';
}

function evaluatorForServerType(serverType: ServerEvaluationType | null | undefined): DeterministicMathEvaluator | 'DEFER' {
  switch (serverType) {
    case 'deterministic_exact':
      return 'EXACT_TEXT';
    case 'deterministic_numeric':
      return 'NUMERIC';
    case 'deterministic_algebraic':
      return 'ALGEBRAIC_EQUIVALENCE';
    case 'semantic_deferred':
      return 'DEFER';
    default:
      return 'EXACT_TEXT';
  }
}

export interface EvaluateMathArgs {
  candidate: string;
  expected: string;
  serverEvaluationType?: ServerEvaluationType | null;
  acceptableAnswerForms?: string[];
}

function compareWithEvaluator(
  evaluator: DeterministicMathEvaluator,
  candidate: string,
  expected: string,
): DeterministicMathResult {
  switch (evaluator) {
    case 'NUMERIC':
      return compareNumeric(candidate, expected);
    case 'RATIONAL':
      return compareRational(candidate, expected);
    case 'ARITHMETIC':
      return compareArithmetic(candidate, expected);
    case 'ALGEBRAIC_EQUIVALENCE':
      return compareAlgebraic(candidate, expected);
    case 'LINEAR_EQUATION':
      return compareLinearEquations(candidate, expected);
    case 'EXACT_TEXT':
    default: {
      const equal = stripAllSpace(normalizeMathInput(candidate)) === stripAllSpace(normalizeMathInput(expected));
      return {
        status: equal ? 'CORRECT' : 'INCORRECT',
        evaluator: 'EXACT_TEXT',
        normalizedCandidate: stripAllSpace(candidate),
        normalizedExpected: stripAllSpace(expected),
        confidence: 0.95,
        reasonCode: equal ? 'exact_match' : 'exact_mismatch',
        safeSummary: equal ? 'Answers match exactly.' : 'Answers do not match.',
      };
    }
  }
}

/**
 * Authoritative deterministic math comparison. Server-owned evaluation
 * metadata selects the evaluator; client data never weakens it. A
 * candidate is CORRECT when it matches the expected answer or any
 * server-approved acceptable form. Unsupported syntax is UNSUPPORTED
 * (never incorrect); malformed input is INVALID (never misconception
 * proof). No answer material is echoed beyond stripped normalizations
 * held server-side.
 */
export function evaluateMathDeterministically(args: EvaluateMathArgs): DeterministicMathResult {
  const candidateRaw = normalizeMathInput(args.candidate);
  const expectedRaw = normalizeMathInput(args.expected);
  if (!candidateRaw || !expectedRaw) {
    return { status: 'INVALID', evaluator: 'NONE', confidence: 0.2, reasonCode: 'empty_input' };
  }
  if (candidateRaw.length > MATH_MAX_EXPRESSION_LENGTH || expectedRaw.length > MATH_MAX_EXPRESSION_LENGTH) {
    return { status: 'UNSUPPORTED', evaluator: 'NONE', confidence: 0.2, reasonCode: 'input_too_long' };
  }
  // Units gate first: never strip a unit and judge only the number.
  const serverType = args.serverEvaluationType ?? null;
  const allowAlgebraLetter = serverType === 'deterministic_algebraic' || serverType === null || serverType === undefined;
  if (hasUnitBearing(candidateRaw, allowAlgebraLetter) || hasUnitBearing(expectedRaw, allowAlgebraLetter)) {
    return { status: 'UNSUPPORTED', evaluator: 'NONE', confidence: 0.2, reasonCode: 'unit_bearing_unsupported' };
  }

  const forms = [expectedRaw, ...((args.acceptableAnswerForms || []).map(normalizeMathInput).filter(Boolean))];
  const selected = serverType ? evaluatorForServerType(serverType) : null;
  if (selected === 'DEFER') {
    return { status: 'UNSUPPORTED', evaluator: 'NONE', confidence: 0.2, reasonCode: 'semantic_deferred' };
  }

  // Server-typed evaluation: try the authoritative evaluator against the
  // expected answer and every acceptable form. Algebraic server typing
  // additionally admits linear-equation comparison when both sides carry
  // exactly one '='; numeric typing admits rational/arithmetic equivalence.
  const evaluatorsToTry: DeterministicMathEvaluator[] = [];
  if (selected) {
    evaluatorsToTry.push(selected);
    if (selected === 'ALGEBRAIC_EQUIVALENCE') evaluatorsToTry.push('LINEAR_EQUATION');
    if (selected === 'NUMERIC') evaluatorsToTry.push('RATIONAL', 'ARITHMETIC');
    if (selected === 'EXACT_TEXT') evaluatorsToTry.push('NUMERIC', 'RATIONAL', 'ARITHMETIC', 'ALGEBRAIC_EQUIVALENCE', 'LINEAR_EQUATION');
  } else {
    evaluatorsToTry.push(inferEvaluator(candidateRaw, expectedRaw));
  }

  let sawInvalid = false;
  let sawUnsupported = false;
  for (const form of forms) {
    for (const evaluator of evaluatorsToTry) {
      const result = compareWithEvaluator(evaluator, candidateRaw, form);
      // Only a CORRECT verdict escapes early: any approved form matching
      // under any admitted evaluator proves the candidate.
      if (result.status === 'CORRECT') return result;
      if (result.status === 'INVALID') sawInvalid = true;
      if (result.status === 'UNSUPPORTED') sawUnsupported = true;
    }
  }
  // No form matched. Disproof may come from the authoritative evaluator
  // or its admitted dual (algebraic expressions and linear equations are
  // duals of one server contract; numeric/rational/arithmetic are duals
  // of another). Auxiliary evaluators beyond the contract confirm only.
  const primaryEvaluators: DeterministicMathEvaluator[] =
    selected === 'ALGEBRAIC_EQUIVALENCE'
      ? ['ALGEBRAIC_EQUIVALENCE', 'LINEAR_EQUATION']
      : selected === 'NUMERIC'
        ? ['NUMERIC', 'RATIONAL', 'ARITHMETIC']
        : evaluatorsToTry.slice(0, 1);
  for (const evaluator of primaryEvaluators) {
    const disproof = compareWithEvaluator(evaluator, candidateRaw, expectedRaw);
    if (disproof.status === 'INCORRECT') return disproof;
    if (disproof.status === 'INVALID') sawInvalid = true;
  }
  // Malformed input outranks undecidable syntax: it needs clarification,
  // never misconception evidence.
  const fallbackEvaluator = evaluatorsToTry[0];
  if (sawInvalid && !sawUnsupported) {
    return { status: 'INVALID', evaluator: fallbackEvaluator, confidence: 0.2, reasonCode: 'input_malformed' };
  }
  const fallback = compareWithEvaluator(fallbackEvaluator, candidateRaw, expectedRaw);
  if (fallback.status === 'INVALID') return fallback;
  if (sawInvalid) {
    return { status: 'INVALID', evaluator: fallbackEvaluator, confidence: 0.2, reasonCode: 'input_malformed' };
  }
  return fallback.status === 'UNSUPPORTED'
    ? fallback
    : { status: 'UNSUPPORTED', evaluator: fallbackEvaluator, confidence: 0.2, reasonCode: 'no_decidable_match' };
}
