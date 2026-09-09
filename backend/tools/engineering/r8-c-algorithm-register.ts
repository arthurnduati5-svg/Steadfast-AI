/**
 * R8-C Backend Algorithm Register — deterministic discovery / classifier / reporter.
 *
 * AUTOMATED ALGORITHM DISCOVERY + EVIDENCE CLASSIFICATION. This module reuses the
 * accepted R8-A/R8-B artifacts (01_BACKEND_SYSTEM_INVENTORY.json,
 * 02_BACKEND_DEPENDENCY_GRAPH.json, 05_BACKEND_LOGIC_REGISTER.md) as the
 * enumeration substrate, analyzes the production source set already connected by
 * R8-B, merges source-verified curated algorithm records, and renders:
 *   06_BACKEND_ALGORITHM_REGISTER.md
 *
 * Truth mapping only. This tool MUST NOT modify production source, execute
 * application behavior, benchmark, rewrite algorithms, call providers, change
 * database state, or perform AI analysis.
 *
 * Usage (from backend/):
 *   npx tsx tools/engineering/r8-c-algorithm-register.ts --repo-root ..
 *
 * Exit codes: 0 = register written and all coverage gates hold; 2 = failure
 * (unreadable input, unwritable output, or a coverage/evidence gate failure).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import * as ts from 'typescript';

// ---------------------------------------------------------------------------
// Frozen R8-C vocabulary (§10, §11, §14, §15, §28, §29, §30, §38).
// ---------------------------------------------------------------------------

export const ACCEPTED_SOURCE_FINGERPRINT =
  'sf-7fc842778ef56aaf2cb3563a4eef107fb4154790ec8407ccac9f56049d0656b0';
export const EXPECTED_CONFIRMED_LOGIC = 103;
export const EXPECTED_UNRESOLVED_LOGIC = 7;

export const ALGORITHM_CATEGORIES = [
  'DETERMINISTIC_RULE_SET',
  'STATE_MACHINE',
  'SCORE_OR_WEIGHTED_SCORE',
  'RANKING_OR_TOP_K',
  'SELECTION_OR_FILTERING',
  'SEARCH_OR_RETRIEVAL',
  'GRAPH_TRAVERSAL',
  'PROBABILITY_OR_INFERENCE',
  'SCHEDULING_OR_PRIORITY',
  'DECAY_OR_RETENTION',
  'AGGREGATION_OR_REDUCTION',
  'SIMILARITY_OR_MATCHING',
  'DEDUPLICATION',
  'IDEMPOTENCY',
  'HASH_OR_FINGERPRINT',
  'RANDOMIZATION_OR_ASSIGNMENT',
  'RATE_LIMIT_OR_QUOTA',
  'RETRY_OR_BACKOFF',
  'CIRCUIT_BREAKER',
  'BATCHING_OR_CHUNKING',
  'PAGINATION_OR_CURSOR',
  'CACHE_OR_COALESCING',
  'CONCURRENCY_COORDINATION',
  'RECONCILIATION',
  'PARSING_OR_TRANSFORMATION',
  'LIBRARY_DELEGATED',
  'OTHER_NONTRIVIAL',
] as const;

export const IMPLEMENTATION_CLASSES = [
  'STANDARD_METHOD',
  'STANDARD_LIBRARY_DELEGATED',
  'EXTERNAL_LIBRARY_DELEGATED',
  'PROJECT_DETERMINISTIC_POLICY',
  'PROJECT_HEURISTIC',
  'CUSTOM_IMPLEMENTATION_CANDIDATE',
  'UNRESOLVED',
] as const;

export const COVERAGE_STATES = [
  'ALGORITHM_PRESENT',
  'NO_DISTINCT_ALGORITHM',
  'ALGORITHM_DELEGATED',
  'UNRESOLVED',
] as const;

export const COMPLEXITY_CONFIDENCES = ['HIGH', 'MEDIUM', 'LOW', 'UNRESOLVED'] as const;

export const DETERMINISM_VALUES = [
  'DETERMINISTIC',
  'DETERMINISTIC_GIVEN_TIME',
  'DETERMINISTIC_GIVEN_CONFIG',
  'RANDOMIZED',
  'EXTERNAL_NONDETERMINISTIC',
  'UNRESOLVED',
] as const;

export const ALLOWED_HANDOFF_SIGNALS = [
  'COMPLETENESS_REVIEW',
  'PERFORMANCE_MEASUREMENT',
  'RELIABILITY_REVIEW',
  'DUPLICATION_REVIEW',
  'STRUCTURAL_CONSOLIDATION_REVIEW',
  'NAMING_REVIEW',
  'DEAD_CODE_REVIEW',
  'NONE',
] as const;

export const REQUIRED_SECTIONS = [
  '# Backend Algorithm Register',
  '## Baseline',
  '## Method and Evidence Law',
  '## Coverage Summary',
  '## Algorithm Taxonomy',
  '## Critical Algorithm Index',
  '## Authentication / Authorization',
  '## Learning Core',
  '## Memory / Evidence',
  '## Mastery / Objectives / Practice / Revision',
  '## Artifacts / Media',
  '## Curriculum / Assessment / Question Bank',
  '## Teacher / School / Administration',
  '## Safety / Privacy / Governance',
  '## Operations / Reliability / Observability',
  '## Voice / External Integrations',
  '## Data Structures and Complexity Hotspots',
  '## Time-Dependent Algorithms',
  '## Database-Bound Algorithms',
  '## Retry / Rate-Limit / Concurrency Algorithms',
  '## Duplicate / Parallel Algorithm Candidates',
  '## External / Library-Delegated Algorithms',
  '## Existing Test and Benchmark Evidence',
  '## Tarzan Algorithm Lab Candidates',
  '## Unresolved Algorithms',
  '## R8-D / R8-E / R8-F Handoff Signals',
] as const;

/** §23: prohibited claims. Word-boundary patterns; the register must not use these. */
export const NOVELTY_PATTERNS: RegExp[] = [
  /\bnovel\b/i,
  /\bproprietary\b/i,
  /\bpatentable\b/i,
  /\bworld-first\b/i,
  /\bsuperior\b/i,
  /\bstate-of-the-art\b/i,
  /\boptimized\b/i,
  /\bunique\b/i,
  /\btarzan algorithm(?! lab)\b/i,
];

// ---------------------------------------------------------------------------
// Types.
// ---------------------------------------------------------------------------

export interface LogicEntry {
  id: string;
  domain: string;
  confirmed: boolean;
  mount: string;
  routeModule: string | null;
  services: string[];
  completeness: string;
}

export interface Signals {
  loops: number;
  sorts: number;
  filters: number;
  maps: number;
  reduces: number;
  minmax: number;
  numericCompares: number;
  weightedArith: number;
  mathExpLogPow: number;
  dateTime: number;
  mathRandom: number;
  randomUUID: number;
  mapSetNew: number;
  hashDigest: number;
  prismaCalls: number;
  rawSql: number;
  tryCatch: number;
  awaits: number;
  switches: number;
  returns: number;
  aiProviderRefs: number;
  rateLimitLibRefs: number;
  jwtLibRefs: number;
  stateTokens: number;
  retryTokens: number;
  idemDedupeTokens: number;
  reconcileTokens: number;
  transactions: number;
  throwCount: number;
  graphTokens: number;
}

export interface FnInfo {
  name: string;
  line: number;
  endLine: number;
  body: string;
}

export interface CoverageInput {
  hasCurated: boolean;
  isUnresolved: boolean;
  hasAiDelegation: boolean;
  strongSignal: boolean;
  analyzedFiles: number;
}

export interface CoverageDecision {
  state: (typeof COVERAGE_STATES)[number];
  reason: string;
}

export interface CuratedAlgorithm {
  id: string;
  domain: string;
  logicIds: string[];
  linkageKind: 'R8B_STRUCTURAL' | 'CURATED_AFFINITY';
  linkageNote: string;
  capability: string;
  purpose: string;
  path: string;
  symbol: string;
  lines: string;
  category: (typeof ALGORITHM_CATEGORIES)[number];
  tags: string[];
  implClass: (typeof IMPLEMENTATION_CLASSES)[number];
  inputs: string;
  outputs: string;
  dataStructures: string[];
  method: string;
  params: string[];
  determinism: (typeof DETERMINISM_VALUES)[number];
  randomness: string;
  stateRead: string;
  stateWrite: string;
  deps: string[];
  timeCx: string;
  spaceCx: string;
  ioCx: string;
  cxConfidence: (typeof COMPLEXITY_CONFIDENCES)[number];
  scaleDriver: string;
  bound: string;
  invariants: string[];
  edgeCases: string;
  failure: string;
  concurrency: string;
  secPrivacy: string;
  duplication: string;
  baseline: string;
  r8e: 'P0' | 'P1' | 'P2' | 'NONE' | 'UNRESOLVED';
  r8eReason: string;
  risks: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceKind: string;
}

export interface CoverageRow {
  logicId: string;
  domain: string;
  confirmed: boolean;
  state: string;
  reason: string;
  analyzedFiles: number;
  functionsEvaluated: number;
  recordIds: string[];
}

export interface TestEvidence {
  kind:
    | 'DIRECT_BEHAVIOR_TEST'
    | 'INDIRECT_INTEGRATION_TEST'
    | 'CONTRACT_ONLY'
    | 'NO_TEST_EVIDENCE_FOUND';
  refs: string[];
}

// ---------------------------------------------------------------------------
// Pure helpers: register parsing (§4 substrate).
// ---------------------------------------------------------------------------

const LOGIC_HEADER_RE = /^### (LOGIC-\S+)\s*$/;

function bullet(md: string, field: string): string | null {
  const re = new RegExp(`^- ${field}:\\s*(.*)$`, 'm');
  const m = md.match(re);
  return m ? m[1].trim() : null;
}

function backtickPaths(fragment: string | null): string[] {
  if (!fragment || fragment.startsWith('UNRESOLVED')) return [];
  const out: string[] = [];
  const re = /`([^`]+)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fragment)) !== null) {
    const p = m[1].trim();
    if (/^src\/.+\.ts$/.test(p)) out.push(p);
  }
  return [...new Set(out)];
}

/** Parse 05_BACKEND_LOGIC_REGISTER.md into deterministic LOGIC entries. */
export function parseLogicRegister(md: string): LogicEntry[] {  const entries: LogicEntry[] = [];
  const lines = md.split('\n');
  let current: string[] | null = null;
  let currentId: string | null = null;
  const flush = () => {
    if (currentId && current) {
      const body = current.join('\n');
      const status = bullet(body, 'CAPABILITY STATUS') || '';
      const domain = bullet(body, 'DOMAIN') || 'UNRESOLVED';
      const capability = bullet(body, 'CAPABILITY') || '';
      const mountMatch = capability.match(/mounted at `([^`]+)`/);
      const routeModule = backtickPaths(bullet(body, 'PRIMARY ROUTE MODULE'))[0] || null;
      const services = backtickPaths(bullet(body, 'PRIMARY SERVICE\\(S\\)'));
      const completeness = bullet(body, 'COMPLETENESS') || 'UNRESOLVED';
      entries.push({
        id: currentId,
        domain,
        confirmed: status.includes('CONFIRMED'),
        mount: mountMatch ? mountMatch[1] : 'UNRESOLVED',
        routeModule,
        services,
        completeness,
      });
    }
  };
  for (const line of lines) {
    const h = line.match(LOGIC_HEADER_RE);
    if (h) {
      flush();
      currentId = h[1];
      current = [];
    } else if (current) {
      current.push(line);
    }
  }
  flush();
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return entries;
}

/** Section-table row: R8-B capability counts per document section. */
export interface SectionCount {
  section: string;
  count: number;
}

/** Parse the `Section | Capabilities` table in 05_BACKEND_LOGIC_REGISTER.md. */
export function parseSectionTable(md: string): SectionCount[] {
  const out: SectionCount[] = [];
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.trim() === 'Section | Capabilities');
  if (start < 0) return out;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('## ')) break;
    if (/^---/.test(line)) continue;
    const m = line.match(/^(.+?)\s*\|\s*(\d+)\s*$/);
    if (m) out.push({ section: m[1].trim(), count: Number(m[2]) });
  }
  return out;
}

export const SECTION_TO_LOGIC_DOMAIN: Record<string, string> = {
  'Artifacts / Media': 'artifacts',
  'Authentication / Authorization': 'auth',
  'Curriculum / Assessment / Question Bank': 'question-bank',
  'Learning Core': 'learning-core',
  'Mastery / Objectives / Practice / Revision': 'mastery',
  'Memory / Evidence': 'memory',
  'Operations / Reliability / Observability': 'operations',
  'Safety / Privacy / Governance': 'safety',
  'Teacher / School / Administration': 'school',
  'Voice / External Integrations': 'voice',
};

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Derive prose-only capabilities: section-table counts minus sectioned LOGIC
 * headers. R8-B counts Authentication / Authorization as a capability with no
 * LOGIC header (109 headers vs 110 route-surface groups). Synthetic IDs are
 * deterministic, PROSE- namespaced (never LOGIC-), and documented.
 */
export function deriveProseCapabilities(md: string, entries: LogicEntry[]): LogicEntry[] {
  const table = parseSectionTable(md);
  const out: LogicEntry[] = [];
  for (const row of table) {
    const domain = SECTION_TO_LOGIC_DOMAIN[row.section];
    if (!domain) continue;
    // Section-table counts cover confirmed + unresolved headers alike.
    const sectioned = entries.filter((e) => e.domain === domain).length;
    const shortfall = row.count - sectioned;
    for (let k = 0; k < shortfall; k++) {
      out.push({
        id: shortfall === 1 ? `PROSE-${slug(row.section)}-capability` : `PROSE-${slug(row.section)}-capability-${k + 1}`,
        domain,
        confirmed: true,
        mount: 'mount-global (cross-cutting prose capability)',
        routeModule: null,
        services: [],
        completeness: 'PROSE',
      });
    }
  }
  out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return out;
}

// ---------------------------------------------------------------------------
// Pure helpers: signal detection (§44 candidate signals).
// ---------------------------------------------------------------------------

function count(re: RegExp, text: string): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

const G = (src: string) => src;

/** Detect algorithm-candidate signals in a source fragment (file or function body). */
export function detectSignals(text: string): Signals {
  const code = G(text);
  return {
    loops: count(/\bfor\s*\(|\bwhile\s*\(|\bdo\s*\{|\.forEach\s*\(/g, code),
    sorts: count(/\.sort\s*\(/g, code),
    filters: count(/\.filter\s*\(/g, code),
    maps: count(/\.map\s*\(/g, code),
    reduces: count(/\.reduce\s*\(/g, code),
    minmax: count(/Math\.(min|max)\s*\(/g, code),
    numericCompares: count(/[><]=?\s*\d+(\.\d+)?|\b\d+(\.\d+)?\s*[><]|[><]=?\s*[A-Z][A-Z0-9_]*/g, code),
    weightedArith: count(/\*\s*0\.\d+|\bweight\b|\bWEIGHT/g, code),
    mathExpLogPow: count(/Math\.(exp|log|pow|sqrt)\s*\(/g, code),
    dateTime: count(/Date\.now\s*\(|new Date\s*\(/g, code),
    mathRandom: count(/Math\.random\s*\(/g, code),
    randomUUID: count(/randomUUID\s*\(/g, code),
    mapSetNew: count(/new (Map|Set)\s*[<(]/g, code),
    hashDigest: count(/createHash|\.digest\s*\(|createHmac/g, code),
    prismaCalls: count(/\bprisma\.\w+|tx\.\w+|findMany|findFirst|findUnique|\.create\s*\(|\.update\s*\(|\.upsert\s*\(|\.aggregate\s*\(/g, code),
    rawSql: count(/\$queryRaw|\$executeRaw|\$transaction/g, code),
    tryCatch: count(/\btry\s*\{/g, code),
    awaits: count(/\bawait\b/g, code),
    switches: count(/\bswitch\s*\(/g, code),
    returns: count(/\breturn\b/g, code),
    aiProviderRefs: count(/from\s+['"]openai['"]|pinecone\s*\.\s*index\s*\(|callProvider\s*\(|aiProviderGateway\s*[.(]/gi, code),
    rateLimitLibRefs: count(/express-rate-limit|rateLimit\s*\(/g, code),
    jwtLibRefs: count(/jsonwebtoken|jwt\.(verify|sign)/g, code),
    stateTokens: count(/stateMachine|StateMachine|currentState|targetState|transition/gi, code),
    retryTokens: count(/retry|backoff|attempt/gi, code),
    idemDedupeTokens: count(/idempoten|dedupeKey|dedupe|fingerprint/gi, code),
    reconcileTokens: count(/reconcil|RosterDiff|conflict/gi, code),
    transactions: count(/\$transaction/g, code),
    throwCount: count(/\bthrow\b/g, code),
    graphTokens: count(/visited|adjacency|neighbors|neighbours|\btraverse\b|\bbfs\b|\bdfs\b|topological/gi, code),
  };
}

export function mergeSignals(list: Signals[]): Signals {
  const zero: Signals = {
    loops: 0, sorts: 0, filters: 0, maps: 0, reduces: 0, minmax: 0,
    numericCompares: 0, weightedArith: 0, mathExpLogPow: 0, dateTime: 0,
    mathRandom: 0, randomUUID: 0, mapSetNew: 0, hashDigest: 0, prismaCalls: 0,
    rawSql: 0, tryCatch: 0, awaits: 0, switches: 0, returns: 0, aiProviderRefs: 0,
    rateLimitLibRefs: 0, jwtLibRefs: 0, stateTokens: 0, retryTokens: 0,
    idemDedupeTokens: 0, reconcileTokens: 0, transactions: 0, throwCount: 0, graphTokens: 0,
  };
  for (const s of list) {
    for (const k of Object.keys(zero) as Array<keyof Signals>) zero[k] += s[k];
  }
  return zero;
}

/** Strong-signal rule: conservative promotion to structural candidate (never proof). */
export function hasStrongSignal(s: Signals): boolean {
  return (
    s.sorts >= 1 ||
    s.mathExpLogPow >= 1 ||
    s.weightedArith >= 1 ||
    s.hashDigest >= 1 ||
    s.switches >= 4 ||
    s.numericCompares >= 5 ||
    (s.mapSetNew >= 1 && s.loops >= 1) ||
    (s.filters >= 1 && s.maps >= 1 && s.sorts >= 1) ||
    (s.stateTokens >= 3 && s.switches >= 1) ||
    (s.retryTokens >= 3 && (s.dateTime >= 1 || s.mathRandom >= 1))
  );
}

/** AI-lane delegation markers: aiGateway-owned paths or provider-SDK import/call shapes.
 *  Mere mentions (comments, config-key checks, contract-type imports, labels)
 *  never prove delegation. */
export function hasAiDelegation(paths: string[], s: Signals): boolean {
  if (s.aiProviderRefs >= 1) return true;
  return paths.some((p) => p.includes('/aiGateway/'));
}

// ---------------------------------------------------------------------------
// Pure helpers: function extraction (TypeScript AST; regex fallback).
// ---------------------------------------------------------------------------

/** Extract named function-like units with stable line spans. Never throws. */
export function extractFunctions(source: string, _filePath: string): FnInfo[] {
  const out: FnInfo[] = [];
  try {
    const sf = ts.createSourceFile('unit.ts', source, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      const named = (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isGetAccessorDeclaration(node) ||
        ts.isSetAccessorDeclaration(node)
      );
      const fnExpr =
        ts.isFunctionExpression(node) || ts.isArrowFunction(node);
      if (named) {
        const nameNode = (node as ts.FunctionDeclaration).name;
        const name =
          (nameNode && nameNode.text) ||
          (ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)
            ? node.name.getText(sf)
            : 'anonymous');
        const start = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        const end = sf.getLineAndCharacterOfPosition(node.getEnd());
        out.push({
          name,
          line: start.line + 1,
          endLine: end.line + 1,
          body: node.getText(sf),
        });
      } else if (fnExpr) {
        const parent = node.parent;
        let name = 'anonymous';
        if (parent && (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent))) {
          name = parent.name.getText(sf);
        }
        const start = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        const end = sf.getLineAndCharacterOfPosition(node.getEnd());
        const body = node.getText(sf);
        if (body.length >= 40) {
          out.push({ name, line: start.line + 1, endLine: end.line + 1, body });
        }
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(sf, visit);
  } catch {
    // Fallback: whole-file single unit (never manufacture function boundaries).
    out.push({ name: '(file)', line: 1, endLine: source.split('\n').length, body: source });
  }
  out.sort((a, b) => a.line - b.line || (a.name < b.name ? -1 : 1));
  return out;
}

// ---------------------------------------------------------------------------
// Pure helpers: normalization + fingerprinting (§22).
// ---------------------------------------------------------------------------

/** Normalize a body for equivalence evidence: strip comments/whitespace. */
export function normalizeBody(body: string): string {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Stable sha256 fingerprint of a normalized body (first 16 hex chars). */
export function fingerprintBody(body: string): string {
  return crypto.createHash('sha256').update(normalizeBody(body)).digest('hex').slice(0, 16);
}

/** Group function units by fingerprint; groups with >1 member are candidates. */
export function groupFingerprints(
  units: Array<{ path: string; name: string; line: number; body: string }>,
): Array<{ fingerprint: string; members: Array<{ path: string; name: string; line: number }> }> {
  const groups = new Map<string, Array<{ path: string; name: string; line: number }>>();
  for (const u of units) {
    if (u.body.length < 120) continue;
    const fp = fingerprintBody(u.body);
    const list = groups.get(fp) || [];
    list.push({ path: u.path, name: u.name, line: u.line });
    groups.set(fp, list);
  }
  const out: Array<{ fingerprint: string; members: Array<{ path: string; name: string; line: number }> }> = [];
  for (const [fingerprint, members] of groups) {
    if (members.length > 1) {
      members.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : a.line - b.line));
      out.push({ fingerprint, members });
    }
  }
  out.sort((a, b) => (a.fingerprint < b.fingerprint ? -1 : 1));
  return out;
}

/**
 * Equivalence verdict from structural evidence only.
 * Name similarity alone NEVER produces an equivalence verdict (§21, §45.13).
 */
export function equivalenceVerdict(input: {
  sameFingerprint: boolean;
  sameInputOutputShape: boolean;
  sameOperationSequence: boolean;
  sameConstants: boolean;
  nameSimilarityOnly: boolean;
}): string {
  if (input.nameSimilarityOnly) return 'UNRESOLVED';
  if (input.sameFingerprint) return 'EXACT_DUPLICATE_CANDIDATE';
  if (input.sameInputOutputShape && input.sameOperationSequence && input.sameConstants) {
    return 'PARALLEL_VARIANT_CANDIDATE';
  }
  return 'UNRESOLVED';
}

// ---------------------------------------------------------------------------
// Pure helpers: constants (§17), category suggestion, determinism, complexity.
// ---------------------------------------------------------------------------

export interface NumericConstant {
  name: string;
  value: string;
  kind: 'NAMED_POLICY_CONSTANT' | 'INLINE_MAGIC_CONSTANT' | 'UNRESOLVED';
}

/** Extract module-level numeric constants plus capped comparison literals. */
export function extractNumericConstants(text: string): NumericConstant[] {
  const out: NumericConstant[] = [];
  const named = text.match(/^(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(-?\d+(?:\.\d+)?)/gm);
  if (named) {
    for (const line of named.slice(0, 40)) {
      const m = line.match(/const\s+([A-Za-z0-9_]+)\s*=\s*(-?\d+(?:\.\d+)?)/);
      if (m) out.push({ name: m[1], value: m[2], kind: 'NAMED_POLICY_CONSTANT' });
    }
  }
  const inline = text.match(/[><]=?\s*\d+(\.\d+)?/g) || [];
  const seen = new Set<string>();
  for (const lit of inline.slice(0, 20)) {
    if (!seen.has(lit)) {
      seen.add(lit);
      out.push({ name: '(inline comparison)', value: lit, kind: 'INLINE_MAGIC_CONSTANT' });
    }
  }
  return out;
}

/** Suggest a primary category from signals (candidate only; curator decides). */
export function suggestCategory(s: Signals): string {
  if (s.sorts >= 1 && (s.filters >= 1 || s.weightedArith >= 1 || s.numericCompares >= 2)) return 'RANKING_OR_TOP_K';
  if (s.retryTokens >= 2 && s.mathRandom >= 1) return 'RETRY_OR_BACKOFF';
  if (s.hashDigest >= 1) return 'HASH_OR_FINGERPRINT';
  if ((s.idemDedupeTokens >= 2 && s.mapSetNew >= 1) || (s.idemDedupeTokens >= 1 && s.mapSetNew >= 1 && s.loops >= 1)) {
    return 'DEDUPLICATION';
  }
  if (s.idemDedupeTokens >= 2) return 'IDEMPOTENCY';
  if (s.stateTokens >= 3) return 'STATE_MACHINE';
  if (s.rateLimitLibRefs >= 1 || (s.retryTokens >= 1 && s.dateTime >= 1)) return 'RATE_LIMIT_OR_QUOTA';
  if (s.reconcileTokens >= 2) return 'RECONCILIATION';
  if (s.weightedArith >= 1 || s.mathExpLogPow >= 1) return 'SCORE_OR_WEIGHTED_SCORE';
  if (s.mathExpLogPow >= 1 && s.dateTime >= 1) return 'DECAY_OR_RETENTION';
  if (s.sorts >= 1 || s.switches >= 3) return 'SELECTION_OR_FILTERING';
  if (s.graphTokens >= 1 && (s.loops >= 1 || s.mapSetNew >= 1)) return 'GRAPH_TRAVERSAL';
  if (s.numericCompares >= 3) return 'DETERMINISTIC_RULE_SET';
  if (s.loops >= 1 && s.mapSetNew >= 1) return 'SEARCH_OR_RETRIEVAL';
  if (s.loops >= 1) return 'AGGREGATION_OR_REDUCTION';
  if (s.prismaCalls >= 1 && s.loops === 0) return 'OTHER_NONTRIVIAL';
  return 'OTHER_NONTRIVIAL';
}

/** Determinism classification from signals (§18). */
export function determinismFor(s: Signals): string {
  if (s.mathRandom >= 1 || s.randomUUID >= 1) return 'RANDOMIZED';
  if (s.dateTime >= 1) return 'DETERMINISTIC_GIVEN_TIME';
  if (s.prismaCalls >= 1 || s.rawSql >= 1) return 'EXTERNAL_NONDETERMINISTIC';
  if (s.aiProviderRefs >= 1) return 'EXTERNAL_NONDETERMINISTIC';
  if (s.loops === 0 && s.switches === 0 && s.numericCompares === 0) return 'UNRESOLVED';
  return 'DETERMINISTIC';
}

export interface ComplexityEstimate {
  time: string;
  space: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNRESOLVED';
}

/**
 * Conservative static complexity (§14, §15). Database/provider work is NEVER
 * given an invented Big-O: it is DB_QUERY_BOUND / NETWORK_BOUND / PROVIDER_BOUND.
 */
export function complexityFor(s: Signals): ComplexityEstimate {
  const nested = s.loops >= 2;
  if (s.prismaCalls >= 1 || s.rawSql >= 1) {
    if (nested) return { time: 'O(n²)', space: 'O(n)', confidence: 'LOW' };
    if (s.loops >= 1) return { time: 'O(n)', space: 'O(n)', confidence: 'MEDIUM' };
    return { time: 'DB_QUERY_BOUND', space: 'O(1)', confidence: 'MEDIUM' };
  }
  if (s.aiProviderRefs >= 1) {
    return { time: 'PROVIDER_BOUND', space: 'UNRESOLVED', confidence: 'LOW' };
  }
  if (nested) return { time: 'O(n²)', space: 'O(n)', confidence: 'LOW' };
  if (s.sorts >= 1) return { time: 'O(n log n)', space: 'O(n)', confidence: 'MEDIUM' };
  if (s.loops >= 1) return { time: 'O(n)', space: 'O(n)', confidence: 'HIGH' };
  if (s.switches >= 1 || s.numericCompares >= 1 || s.returns >= 1) {
    return { time: 'O(1)', space: 'O(1)', confidence: 'HIGH' };
  }
  return { time: 'UNRESOLVED', space: 'UNRESOLVED', confidence: 'UNRESOLVED' };
}

/** Coverage decision rule (§30). Pure and deterministic. */
export function decideCoverage(input: CoverageInput): CoverageDecision {
  if (input.isUnresolved) {
    return {
      state: 'UNRESOLVED',
      reason: 'R8-B unresolved route-group candidate; no downstream boundary proven — status preserved, not upgraded.',
    };
  }
  if (input.hasCurated) {
    return {
      state: 'ALGORITHM_PRESENT',
      reason: 'Source-verified curated algorithm record linked below.',
    };
  }
  if (input.hasAiDelegation) {
    return {
      state: 'ALGORITHM_DELEGATED',
      reason: 'Analyzed sources delegate the decision to the AI lane / provider SDK; backend owns the boundary only.',
    };
  }
  if (input.analyzedFiles === 0) {
    return {
      state: 'UNRESOLVED',
      reason: 'Linked production sources unavailable to the analyzer; candidate noted for R8-D review.',
    };
  }
  if (input.strongSignal) {
    return {
      state: 'UNRESOLVED',
      reason: 'Structural algorithm signals present but no source-verified record; structural candidate for R8-D review.',
    };
  }
  return {
    state: 'NO_DISTINCT_ALGORITHM',
    reason: 'Analyzed sources show wiring/CRUD/policy-boolean behavior with no qualifying non-trivial computation.',
  };
}

// ---------------------------------------------------------------------------
// Pure helpers: document constraints (§23 novelty, §42 handoff, §38 sections).
// ---------------------------------------------------------------------------

/** Return novelty-claim violations found in a document. Empty = clean. */
export function findNoveltyViolations(doc: string): string[] {
  const hits: string[] = [];
  for (const re of NOVELTY_PATTERNS) {
    const m = doc.match(new RegExp(re.source, 'gi'));
    if (m) hits.push(`${re.source}: ${m.length} occurrence(s)`);
  }
  return hits;
}

/** Handoff section may only carry allowed review signals (§42). */
export function findHandoffViolations(handoffText: string): string[] {
  const problems: string[] = [];
  const lines = handoffText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- SIGNAL:')) continue;
    const signal = trimmed.slice('- SIGNAL:'.length).trim().split(/\s/)[0];
    if (!(ALLOWED_HANDOFF_SIGNALS as readonly string[]).includes(signal)) {
      problems.push(`disallowed handoff signal: ${signal}`);
    }
  }
  const forbidden = /\b(delete|merge|move|replace|rewrite|optimiz\w+)\b/i;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- SIGNAL:') && !trimmed.startsWith('#') && forbidden.test(trimmed)) {
      const m = trimmed.match(forbidden);
      if (m && !/measurement/i.test(trimmed)) problems.push(`destructive disposition token: ${m[0]} in: ${trimmed.slice(0, 80)}`);
    }
  }
  return problems;
}

/** Verify every required section heading is present. */
export function findMissingSections(doc: string): string[] {
  return REQUIRED_SECTIONS.filter((s) => !doc.includes(s));
}

// ---------------------------------------------------------------------------
// Curated source-verified algorithm records (§13 contract).
// Every record below was verified against its cited production source body.
// Prior-art status is uniformly NOT RESEARCHED IN R8-C (§23, §24).
// ---------------------------------------------------------------------------

const NOT_RESEARCHED = 'NOT RESEARCHED IN R8-C';
const NOT_MEASURED = 'NOT MEASURED IN R8-C';

export const CURATED_ALGORITHMS: CuratedAlgorithm[] = [
  {
    id: 'ALG-safety-task020-auth-jwt-claim-extract',
    domain: 'safety',
    logicIds: ['LOGIC-safety-api-task020-security-privacy-governance', 'PROSE-authentication-authorization-capability'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'schoolAuthMiddleware is mount-global (R8-A mount evidence, src/index.ts); closest confirmed owning capability is the security/privacy governance runtime. Affinity linkage only.',
    capability: 'Bearer-token authentication and identity-claim normalization for backend mounts',
    purpose: 'Prove caller identity from JWT and derive a normalized user/role/school triple without trusting URL shape.',
    path: 'src/middleware/schoolAuthMiddleware.ts',
    symbol: 'readBearerToken/extractUserId/extractSchoolId/extractRole',
    lines: '18-77',
    category: 'DETERMINISTIC_RULE_SET',
    tags: ['PARSING_OR_TRANSFORMATION'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'Authorization header string; decoded JWT payload (jsonwebtoken). Configured secrets JWT_SECRET / COPILOT_JWT_SECRET / COPILOT_PUBLIC_KEY.',
    outputs: 'userId string; schoolId string|undefined; normalized role (admin|counselor|student|teacher|school_admin|raw-lowercased).',
    dataStructures: ['plain objects', 'Array (roles list scan)'],
    method: 'Ordered claim extraction: Bearer prefix check and slice; candidate-key cascade (userId|studentId|id|sub; schoolId|school_id|orgId|organizationId); role allow-list normalization with roles-array fallback. Signature verification itself delegated to jsonwebtoken (see schoolAuthBridgeService.ts:1 import).',
    params: ['JWT_SECRET / COPILOT_JWT_SECRET / COPILOT_PUBLIC_KEY (CONFIGURED_VALUE)', 'Bearer prefix literal (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none in this unit',
    stateRead: 'process.env secrets only',
    stateWrite: 'none (attaches claims to request object)',
    deps: ['EXTERNAL_LIBRARY_DELEGATED: jsonwebtoken verify (library-dependent complexity)'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O',
    cxConfidence: 'HIGH',
    scaleDriver: 'per-request; workload grows with request rate only',
    bound: 'BOUNDED',
    invariants: ['never derive identity from URL shape', 'at least one auth key configured or boot fails (lines 22-26)', 'unknown roles pass through lowercased, never escalated'],
    edgeCases: 'missing/expired token; string payload; absent school claim; roles array vs scalar',
    failure: 'fail-closed at boot with no keys; per-request failures reject with 401 paths downstream',
    concurrency: 'stateless pure functions; safe under concurrent requests',
    secPrivacy: 'SECURITY_SENSITIVE AUTHORIZATION_SENSITIVE PRIVACY_SENSITIVE: identity spoofing would break school isolation',
    duplication: 'SINGLE_IMPLEMENTATION (claim tables live here only)',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Authentication/authorization correctness gates every learner-data boundary.',
    risks: ['SECURITY_SENSITIVE', 'AUTHORIZATION_SENSITIVE', 'PRIVACY_SENSITIVE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task) + R8A_STRUCTURAL mount evidence',
  },
  {
    id: 'ALG-mastery-practicemastery-spaced-review-interval',
    domain: 'mastery',
    logicIds: ['LOGIC-mastery-api-copilot-practice-mastery'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Spaced-review planning serves practice/mastery revision; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Spaced-review interval planning per skill',
    purpose: 'Compute when a skill must next be reviewed from priority, mastery level, mistakes and independent successes.',
    path: 'src/services/mastery/spacedReviewPlanner.ts',
    symbol: 'SpacedReviewPlanner.planReview',
    lines: '24-63',
    category: 'SCHEDULING_OR_PRIORITY',
    tags: ['DECAY_OR_RETENTION'],
    implClass: 'PROJECT_HEURISTIC',
    inputs: 'priority (high|medium|low|none); masteryLevel; confidenceScore; mistakeCount; independentSuccessCount.',
    outputs: 'SpacedReviewPlan { intervalDays, dueAt ISO, priority, reason }.',
    dataStructures: ['Record<RevisionPriority, number> lookup table'],
    method: 'Priority base interval, then ordered overrides: secure/strong mastery floors via max(); mistake>=3 collapses to 1 day; success>=5 stretches into [14,60]; final clamp to [1,90]; dueAt = now + intervalDays.',
    params: ['DEFAULT_INTERVALS high=1/medium=3/low=7/none=30 (NAMED_POLICY_CONSTANT)', 'SECURE_MAINTENANCE_INTERVAL=14 (NAMED_POLICY_CONSTANT)', 'STRONG_MAINTENANCE_INTERVAL=30 (NAMED_POLICY_CONSTANT)', 'mistakeCount>=3, successCount>=5, clamp [1,90] (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none',
    stateRead: 'none (pure function of params)',
    stateWrite: 'none',
    deps: ['none'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O; batch wrapper planBatchReviews maps O(n) over items',
    cxConfidence: 'HIGH',
    scaleDriver: 'number of skills planned per call (batch map)',
    bound: 'BOUNDED (interval clamped [1,90])',
    invariants: ['intervalDays always within [1,90]', 'secure/strong mastery never reviewed sooner than maintenance floor', '3+ mistakes force next-day review'],
    edgeCases: 'unknown priority falls back to 7; zero counts skip overrides',
    failure: 'no failure path (pure); invalid input degrades to defaults',
    concurrency: 'stateless; safe',
    secPrivacy: 'none directly; learning-outcome sensitive',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Drives revision timing and therefore mastery outcomes; interval quality is heuristic and unmeasured.',
    risks: ['MASTERY_SENSITIVITY', 'ACADEMIC_CORRECTNESS', 'TIME_SENSITIVE', 'MAGIC_CONSTANTS'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-mastery-practicemastery-evidence-level-ladder',
    domain: 'mastery',
    logicIds: ['LOGIC-mastery-api-copilot-practice-mastery'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Evidence aggregation feeds the practice/mastery snapshot; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Mastery-level inference from attempt evidence',
    purpose: 'Map accumulated evidence counts, correctness ratio and confidence into a mastery ladder level.',
    path: 'src/services/mastery/masteryEvidenceAggregationService.ts',
    symbol: 'computeMasteryLevel',
    lines: '13-40',
    category: 'DETERMINISTIC_RULE_SET',
    tags: ['PROBABILITY_OR_INFERENCE'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'evidenceCount; independentCorrectCount; hintDependentCorrectCount; incorrectCount; confidenceScore.',
    outputs: 'MasterySignalLevel (not_started|emerging|developing|secure|strong).',
    dataStructures: ['scalars only'],
    method: 'Ordered threshold ladder evaluated top-down: zero-evidence guard; correctness ratio; anti-inflation floor (ratio<=0.2 or confidence<0.1 blocks progress); strong (5 independent, 0.85, 0.7); secure (3 evidence, 0.75, 0.5); developing (2, 0.5, 0.3); emerging (1, 0.2).',
    params: ['ratio floors 0.2/0.5/0.75/0.85 (INLINE_MAGIC_CONSTANT)', 'evidence floors 1/2/3/5 (INLINE_MAGIC_CONSTANT)', 'confidence floors 0.1/0.3/0.5/0.7 (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'snapshot counters passed in',
    stateWrite: 'none in this unit (caller persists)',
    deps: ['none'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O in this unit; caller performs bounded snapshot read/write',
    cxConfidence: 'HIGH',
    scaleDriver: 'per-attempt; constant work',
    bound: 'BOUNDED',
    invariants: ['no evidence yields not_started', 'low ratio or confidence can never promote', 'ladder order is total: first match wins'],
    edgeCases: 'totalAttempts=0; hint-only correct counts toward ratio but not independence',
    failure: 'no failure path (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'learning-outcome sensitive; no PII handling in unit',
    duplication: 'SINGLE_IMPLEMENTATION (distinct from masteryScoringService ladder; different level vocabulary — DOMAIN_SPECIFIC_VARIANT, equivalence UNPROVEN)',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Directly decides reported mastery; anti-inflation thresholds need correctness proof under scale.',
    risks: ['MASTERY_SENSITIVITY', 'ACADEMIC_CORRECTNESS', 'MAGIC_CONSTANTS', 'DUPLICATION_CANDIDATE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-mastery-practicemastery-next-practice-priority',
    domain: 'mastery',
    logicIds: ['LOGIC-mastery-api-copilot-practice-mastery'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Next-practice recommendation serves practice/mastery flow; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Next-practice recommendation cascade',
    purpose: 'Decide what the tutor should do next from misconceptions, recent attempts and review state.',
    path: 'src/services/nextPracticeService.ts',
    symbol: 'NextPracticeService.recommendNextPractice',
    lines: '36-121',
    category: 'SELECTION_OR_FILTERING',
    tags: ['SCHEDULING_OR_PRIORITY'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'ResolvedTutorIdentity; NextPracticeRequest (subject/topic/skillIds/artifactIds). Live reads: active misconceptions (limit 5), recent attempts (limit 10).',
    outputs: 'NextPracticeRecommendation[] with action/priority/difficulty/source/evidence links.',
    dataStructures: ['Array scan with find()', 'Set (uniqueStrings dedupe)'],
    method: 'Documented 7-step priority cascade: active misconception > recent incorrect > review due > developing > proficient > strong > no-data fallback. Earlier steps suppress later ones (misconception presence blocks reteach branch).',
    params: ['misconception limit=5 (INLINE_MAGIC_CONSTANT)', 'attempt window limit=10 (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'recommendationId uses Math.random identity suffix (lines 26-28); decision path unaffected',
    stateRead: 'misconception + attempt stores via services',
    stateWrite: 'none',
    deps: ['masteryService, misconceptionService, spacedReviewService, practiceAttemptService (internal)'],
    timeCx: 'O(n) over bounded windows (n<=10)',
    spaceCx: 'O(n)',
    ioCx: 'database: two bounded reads (limits 5 and 10); network: none',
    cxConfidence: 'HIGH',
    scaleDriver: 'bounded windows; constant per call',
    bound: 'BOUNDED',
    invariants: ['misconception remediation precedes reteach', 'no-data input yields clarifying question, never a blind advance'],
    edgeCases: 'empty misconceptions and attempts; partially_correct vs incorrect branching',
    failure: 'service read failures propagate as exceptions (no silent fallback in verified prefix)',
    concurrency: 'read-only assembly; safe',
    secPrivacy: 'scoped by ResolvedTutorIdentity (school/student)',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Governs the learning path after every attempt; cascade order errors directly change outcomes.',
    risks: ['MASTERY_SENSITIVITY', 'ACADEMIC_CORRECTNESS', 'RANDOMNESS_SENSITIVE'],
    confidence: 'MEDIUM',
    evidenceKind: 'SOURCE_INSPECTION (this task, verified prefix lines 36-121)',
  },
  {
    id: 'ALG-mastery-practicemastery-score-threshold-ladder',
    domain: 'mastery',
    logicIds: ['LOGIC-mastery-api-copilot-practice-mastery'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Mastery scoring serves practice/mastery flow; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Mastery-level derivation with regression guard',
    purpose: 'Derive a bounded mastery level from attempt history while detecting regression and blocking one-shot mastery.',
    path: 'src/services/masteryScoringService.ts',
    symbol: 'MasteryScoringService.deriveMasteryLevel',
    lines: '20-80',
    category: 'DETERMINISTIC_RULE_SET',
    tags: ['PROBABILITY_OR_INFERENCE'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'attemptCount; correctCount; incorrectCount; streakIncorrect. Threshold table MASTERY_LEVEL_THRESHOLDS (6 rows).',
    outputs: 'MasteryLevel (unknown|introduced|emerging|developing|proficient|mastered|regressing|needs_remediation).',
    dataStructures: ['threshold table Array (reverse scan)'],
    method: 'Guards first (zero attempts; zero evaluated), regression check (streak>=3 with history), remediation check, then reverse table scan: first row whose minAttempts/minCorrectRatio/maxIncorrectStreak all hold wins.',
    params: ['MASTERY_LEVEL_THRESHOLDS rows: (0,0,99) (1,0.5,2) (2,0.4,3) (3,0.5,2) (5,0.7,1) (8,0.85,0) (NAMED_POLICY_CONSTANT)', 'regression gate streak>=3/attempts>=5/ratio>=0.5 (INLINE_MAGIC_CONSTANT)', 'remediation gate streak>=2/ratio<0.4 (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'counters passed in',
    stateWrite: 'none in this unit',
    deps: ['none'],
    timeCx: 'O(T), T=6 table rows',
    spaceCx: 'O(1)',
    ioCx: 'no I/O in this unit',
    cxConfidence: 'HIGH',
    scaleDriver: 'constant per call',
    bound: 'BOUNDED',
    invariants: ['never mastered from one correct answer (minAttempts=8, streak 0)', 'regression detectable only with history>=5'],
    edgeCases: 'all-incorrect history; hint-inflated correct counts handled upstream',
    failure: 'no failure path (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'learning-outcome sensitive',
    duplication: 'DOMAIN_SPECIFIC_VARIANT vs computeMasteryLevel (different level vocabulary; equivalence UNPROVEN)',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Core mastery truth with anti-inflation guarantees; threshold table needs correctness proof.',
    risks: ['MASTERY_SENSITIVITY', 'ACADEMIC_CORRECTNESS', 'MAGIC_CONSTANTS', 'DUPLICATION_CANDIDATE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-mastery-practicemastery-score-compute',
    domain: 'mastery',
    logicIds: ['LOGIC-mastery-api-copilot-practice-mastery'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Display-score derivation for mastery reporting; domain affinity only.',
    capability: 'Mastery display-score computation',
    purpose: 'Convert a mastery level plus confidence into a capped 0-100 score.',
    path: 'src/services/masteryScoringService.ts',
    symbol: 'MasteryScoringService.computeScore',
    lines: '101-119',
    category: 'SCORE_OR_WEIGHTED_SCORE',
    tags: [],
    implClass: 'PROJECT_HEURISTIC',
    inputs: 'level (8 states); confidence (low|medium|high).',
    outputs: 'integer score 0-100.',
    dataStructures: ['Record lookup tables (baseScore, confMultiplier)'],
    method: 'Base score per level (0/15/30/50/70/90/25/10) times confidence multiplier (0.8/1.0/1.1), rounded and capped at 100.',
    params: ['baseScore table (INLINE_MAGIC_CONSTANT)', 'confMultiplier 0.8/1.0/1.1 (INLINE_MAGIC_CONSTANT)', 'cap 100 (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'none',
    stateWrite: 'none',
    deps: ['none'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O',
    cxConfidence: 'HIGH',
    scaleDriver: 'constant per call',
    bound: 'BOUNDED',
    invariants: ['output always within [0,100]', 'regressing/needs_remediation score below emerging'],
    edgeCases: 'unknown level defaults to 0 via fallback',
    failure: 'no failure path (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'reported-score sensitive (learner-facing)',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Derived display score; the level decision (P0 ladder above) owns correctness, but score mapping shapes learner/teacher perception.',
    risks: ['ACADEMIC_CORRECTNESS', 'MAGIC_CONSTANTS'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-mastery-growth-topic-inference-signal-count',
    domain: 'mastery',
    logicIds: ['LOGIC-mastery-api-phase3-growth-page'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Topic mastery inference feeds growth reporting; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Topic mastery-state inference from learning-effect events',
    purpose: 'Infer a topic label and next step from bounded recent learning-effect signals plus progress/mistake snapshots.',
    path: 'src/services/masteryInferenceService.ts',
    symbol: 'getTopicMasteryState/buildNextBestStep',
    lines: '61-129',
    category: 'AGGREGATION_OR_REDUCTION',
    tags: ['PROBABILITY_OR_INFERENCE', 'SELECTION_OR_FILTERING'],
    implClass: 'PROJECT_HEURISTIC',
    inputs: 'userId/topic/subject. Reads: latest progress row, latest mistake row, last 40 learning-effect events.',
    outputs: 'TopicMasteryState|null with label and next-best-step string.',
    dataStructures: ['Set (positive/negative signal vocabularies)', 'Array filter/count passes'],
    method: 'Three parallel bounded reads; Set-membership counting of positive vs negative event types over ≤40 events; rate thresholds pick remediation vs confirmation next steps (0.34 repeated-mistake, 0.45 support-dependence).',
    params: ['take=40 events (INLINE_MAGIC_CONSTANT)', 'repeatedMistakeRate>=0.34 (INLINE_MAGIC_CONSTANT)', 'supportDependenceLevel>=0.45 (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'progress, mistake, learningEffectEvent tables',
    stateWrite: 'none (ensureLearningEffectEventTable DDL guard may create)',
    deps: ['prisma (bounded reads)'],
    timeCx: 'O(n), n<=40 events, plus fixed signal-vocabulary Sets',
    spaceCx: 'O(n)',
    ioCx: 'database: 3 bounded queries (2 findFirst + 1 findMany take 40); network: none',
    cxConfidence: 'HIGH',
    scaleDriver: 'fixed window of 40 events per call',
    bound: 'BOUNDED',
    invariants: ['empty topic returns null (no inference without subject)', 'fixed signal vocabularies bound classification'],
    edgeCases: 'no events; mixed signals; missing progress row',
    failure: 'UNRESOLVED statically beyond verified prefix',
    concurrency: 'read-only inference; safe',
    secPrivacy: 'scoped by userId; learner-data sensitive',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Produces the mastery label learners and teachers see; rate-threshold quality is heuristic.',
    risks: ['MASTERY_SENSITIVITY', 'ACADEMIC_CORRECTNESS', 'MAGIC_CONSTANTS', 'DATABASE_HOTSPOT_CANDIDATE'],
    confidence: 'MEDIUM',
    evidenceKind: 'SOURCE_INSPECTION (this task, verified prefix lines 61-129)',
  },
  {
    id: 'ALG-mastery-dailyfeed-feed-rank-dedupe',
    domain: 'mastery',
    logicIds: ['LOGIC-mastery-api-phase3-daily-learning-feed'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Feed ranking serves the daily-learning-feed capability; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Daily-learning-feed dedupe, priority derivation and ranking',
    purpose: 'Collapse duplicate objective items, derive urgency-aware priorities, and order the learner feed.',
    path: 'src/services/phase3DailyLearningFeedRankingService.ts',
    symbol: 'Phase3DailyLearningFeedRankingService.rankDailyLearningFeedItems/dedupeFeedItemsByObjective/sortFeedItemsForLearner/deriveFeedItemPriority',
    lines: '14-176',
    category: 'RANKING_OR_TOP_K',
    tags: ['DEDUPLICATION', 'SCHEDULING_OR_PRIORITY'],
    implClass: 'PROJECT_HEURISTIC',
    inputs: 'Phase3DailyLearningFeedItem[] (objectiveId, itemType, priority, dueAt, createdAt).',
    outputs: 'deduped, priority-sorted, optionally sliced feed array.',
    dataStructures: ['Map<objectiveId, item> (dedupe)', 'priority/type order Record tables', 'Array sort (library)'],
    method: 'Map-collapse per objective keeping the lowest DEDUPE_ORDER rank; priority derivation switch with due-date escalation (overdue => urgent/high); stable multi-key sort priority => type => dueAt => createdAt desc; optional slice limit.',
    params: ['PHASE3_DAILY_LEARNING_FEED_DEDUPE_ORDER table (NAMED_POLICY_CONSTANT)', 'priorityOrder urgent=0/high=1/medium=2/low=3/blocked=0 (NAMED_POLICY_CONSTANT)', 'typeOrder 12-entry table (NAMED_POLICY_CONSTANT)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none',
    stateRead: 'none (pure over input array)',
    stateWrite: 'none',
    deps: ['none (library sort delegated)'],
    timeCx: 'application CPU: O(n log n) sort + O(n) dedupe; database: none in unit',
    spaceCx: 'O(n)',
    ioCx: 'no I/O in unit',
    cxConfidence: 'MEDIUM',
    scaleDriver: 'number of feed items per learner per day',
    bound: 'BOUNDED in practice by daily item volume; no explicit cap in unit — POTENTIALLY_UNBOUNDED input noted',
    invariants: ['one item per objective survives dedupe', 'urgent always precedes lower priorities'],
    edgeCases: 'unknown itemType/priority fall back to 99/9; missing dueAt handled by comparator branches',
    failure: 'no failure path (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'learner feed content; scoped upstream',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'User-facing daily ordering; sort/dedupe cost grows with feed size and priority-table quality is heuristic.',
    risks: ['TIME_SENSITIVE', 'SCALE_SENSITIVE', 'UNBOUNDED_DATA'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-mastery-confidencerecovery-mismatch-rank-dedupe',
    domain: 'mastery',
    logicIds: ['LOGIC-mastery-api-phase3-confidence-recovery'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Mismatch ranking serves confidence-recovery flow; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Confidence-mismatch dedupe and priority ranking',
    purpose: 'Collapse duplicate mismatch detections and order them for recovery follow-up.',
    path: 'src/services/phase3ConfidenceMismatchDetectionService.ts',
    symbol: 'rankConfidenceMismatches/dedupeConfidenceMismatches',
    lines: '186-218',
    category: 'RANKING_OR_TOP_K',
    tags: ['DEDUPLICATION'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'Phase3ConfidenceMismatch[] (studentId, mismatchType, objectiveId).',
    outputs: 'deduped, priority-sorted mismatch array.',
    dataStructures: ['Set<string> composite key (student-mismatch-objective)', 'priority Record table', 'Array sort (library)'],
    method: 'Set-key dedupe (first occurrence wins); fixed numeric priority table (source_required=0 … none=7, unknown=99); ascending numeric sort.',
    params: ['priority table 0-7 + 99 fallback (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'none',
    stateWrite: 'none',
    deps: ['none (library sort delegated)'],
    timeCx: 'application CPU: O(n log n) sort + O(n) dedupe',
    spaceCx: 'O(n)',
    ioCx: 'no I/O in unit',
    cxConfidence: 'HIGH',
    scaleDriver: 'number of detected mismatches per evaluation',
    bound: 'BOUNDED in practice; small fixed type vocabulary',
    invariants: ['dedupe key is total over (student, type, objective)', 'escalation types (0) always surface first'],
    edgeCases: 'unknown mismatchType sorts last (99)',
    failure: 'no failure path (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'learner confidence data; scoped upstream',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Orders recovery follow-ups learners see; small unit but user-facing and policy-table driven.',
    risks: ['ACADEMIC_CORRECTNESS', 'MAGIC_CONSTANTS'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-mastery-dailyobjective-idempotency-settle',
    domain: 'mastery',
    logicIds: ['LOGIC-mastery-api-phase3-daily-objective-checks'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Completion idempotency serves the daily-objective-check capability; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Daily-objective-check completion idempotency and settlement',
    purpose: 'Guarantee exactly-once settlement of a check session across retries, races and partial failures.',
    path: 'src/services/phase3DailyObjectiveCheckCompletionService.ts',
    symbol: 'idempotencyStore/idempotencyKeyForSession/getIdempotencyRecord/upsertIdempotencyRecord',
    lines: '25-115',
    category: 'IDEMPOTENCY',
    tags: ['CONCURRENCY_COORDINATION', 'RECONCILIATION'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'checkSessionId (+ school/student context); IdempotencyRecord checkpoints (weakSignalRef, completion state).',
    outputs: 'settled completion result; completed retries return the prior result without duplication.',
    dataStructures: ['module Map<string, IdempotencyRecord> (fast path)', 'prisma DailyObjectiveCheckCompletionIdempotencyRecord (durable path, upsert by idempotencyKey)'],
    method: 'Stable key per session; check-before-act on read path and before ownership acquisition; checkpointed multi-step settlement with reconcile-on-version-conflict reload; already-completed retries short-circuit to stored result.',
    params: ['key = session-scoped stable string (NAMED policy: idempotencyKeyForSession)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none in verified unit',
    stateRead: 'module Map + durable idempotency table',
    stateWrite: 'checkpoints + final record (Map and Prisma upsert/update)',
    deps: ['prisma (findUnique/upsert/update on idempotency record)'],
    timeCx: 'O(1) map operations',
    spaceCx: 'O(k) module entries; durable rows O(sessions)',
    ioCx: 'database: bounded idempotency reads/writes per settlement (DB_QUERY_BOUND); network: none',
    cxConfidence: 'HIGH',
    scaleDriver: 'number of concurrent settlements per session',
    bound: 'BOUNDED per session; module Map growth across sessions is a MEMORY_HOTSPOT_CANDIDATE for R8-E',
    invariants: ['same checkSessionId yields one settlement', 'completed work is never duplicated on retry', 'lost races reconcile by reload, not overwrite'],
    edgeCases: 'version conflict mid-settlement; weak-signal partial state; retry after completion',
    failure: 'conflicts resolve via reload-and-reconcile; failures leave checkpoints for resume',
    concurrency: 'CONCURRENCY_SENSITIVE: check-then-act guarded by durable upsert + reconcile loop',
    secPrivacy: 'scoped by school/student keys',
    duplication: 'SINGLE_IMPLEMENTATION (idempotency pattern recurs in marking-invocation and roster intake as DOMAIN_SPECIFIC_VARIANTs — equivalence UNPROVEN)',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Exactly-once settlement guards evidence/mastery writes against duplication under retry and concurrency.',
    risks: ['DATA_INTEGRITY', 'CONCURRENCY_SENSITIVE', 'RETRY_IDEMPOTENCY', 'MEMORY_HOTSPOT_CANDIDATE'],
    confidence: 'MEDIUM',
    evidenceKind: 'SOURCE_INSPECTION (this task, symbol/line evidence via structural grep + R8-B service linkage)',
  },
  {
    id: 'ALG-artifacts-artifacts-media-stream-rank-score',
    domain: 'artifacts',
    logicIds: ['LOGIC-artifacts-api-copilot-artifacts'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Media-stream scoring serves artifact/media recommendation; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Media-stream weighted relevance scoring',
    purpose: 'Score a media asset against learner context so the best study/creative asset can be selected.',
    path: 'src/media-stream/scoring.ts',
    symbol: 'computeMediaStreamScore',
    lines: '65-149',
    category: 'SCORE_OR_WEIGHTED_SCORE',
    tags: ['DECAY_OR_RETENTION', 'SIMILARITY_OR_MATCHING'],
    implClass: 'PROJECT_HEURISTIC',
    inputs: 'MediaAsset (topic/subject/kind/scores/trust/language/duration/completion/helpfulness) + MediaStreamRankingContext (activeTopic, weakTopics, preferences, exam/focus mode).',
    outputs: 'rounded integer score.',
    dataStructures: ['normalized topic strings (substring match)', 'scalar accumulators'],
    method: 'Base 20 plus ~20 additive boosts: recommended score passthrough, exponential recency decay, completion/helpfulness, active/weak topic matches (+34/+36), kind preference, source-trust table, transcript/language/level/need matches, exam/focus bonuses, creative-mode external-source and clamped composite terms.',
    params: ['base=20 (INLINE_MAGIC_CONSTANT)', 'topic boosts 34/36, exam 24, recency 22*exp(-days/18) (INLINE_MAGIC_CONSTANT)', 'trust table 16/14/10/6/2 (INLINE_MAGIC_CONSTANT)', 'creative clamp weights 16/16/14/10/18 (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none',
    stateRead: 'none',
    stateWrite: 'none',
    deps: ['./metadata getMediaKindGroup (require)', './validation helpers (internal)'],
    timeCx: 'O(w), w = weak-topic count (small); else O(1)',
    spaceCx: 'O(w)',
    ioCx: 'no I/O in unit',
    cxConfidence: 'MEDIUM',
    scaleDriver: 'weak-topic list length; number of assets scored per request (caller-side loop)',
    bound: 'BOUNDED per asset; corpus scan bound lives with caller (UNRESOLVED here)',
    invariants: ['score is a pure function of (asset, ctx) at time t', 'study/creative branches are exclusive'],
    edgeCases: 'missing metadata degrades each term to neutral; unparseable dates yield zero recency',
    failure: 'no failure path (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'topic/subject matching over learner context; scoped upstream',
    duplication: 'DOMAIN_SPECIFIC_VARIANT vs computeStudyStreamScore (study layer extends this base; equivalence UNPROVEN, consolidation FORBIDDEN in R8-C)',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Core recommendation quality function; ~20 heuristic weights unmeasured and caller-side corpus size unknown.',
    risks: ['MAGIC_CONSTANTS', 'SCALE_SENSITIVE', 'TIME_SENSITIVE', 'DUPLICATION_CANDIDATE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-artifacts-artifacts-study-stream-rank-score',
    domain: 'artifacts',
    logicIds: ['LOGIC-artifacts-api-copilot-artifacts'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Study-stream scoring serves artifact/media recommendation; domain affinity only.',
    capability: 'Study-stream revision-aware ranking score',
    purpose: 'Extend the base media score with revision-lane signals (due-now, needs-attention, spacing) for study ranking.',
    path: 'src/media-stream/scoring.ts',
    symbol: 'computeStudyStreamScore',
    lines: '168-221',
    category: 'RANKING_OR_TOP_K',
    tags: ['SCORE_OR_WEIGHTED_SCORE', 'SCHEDULING_OR_PRIORITY'],
    implClass: 'PROJECT_HEURISTIC',
    inputs: 'MediaAsset + context extended with dueNow/needsAttention/continue/recent revision id sets, seed topics, active revision id.',
    outputs: 'rounded integer score.',
    dataStructures: ['4 revision-id Sets (O(1) membership)', 'scalar accumulators'],
    method: 'Base study-mode score plus revision boosts: +18 revision link, +56 active item, +34 due-now, +30 needs-attention, +18 continue, +10 recent; interaction/completion caps; spacing boost; -18 penalty for context-free non-revision items.',
    params: ['revision boosts 56/34/30/18/18/10 (INLINE_MAGIC_CONSTANT)', 'interaction cap 8, completion cap 6 (INLINE_MAGIC_CONSTANT)', 'spacing windows [1.5,8]/[8,21]/<0.35 days (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none',
    stateRead: 'none',
    stateWrite: 'none',
    deps: ['computeMediaStreamScore (same file)', './metadata (internal)'],
    timeCx: 'O(n) over bounded revision-id sets + base score',
    spaceCx: 'O(n)',
    ioCx: 'no I/O in unit',
    cxConfidence: 'HIGH',
    scaleDriver: 'revision-set sizes per learner',
    bound: 'BOUNDED per asset',
    invariants: ['revision-linked items dominate context-free items', 'penalty applies only when no signal matches'],
    edgeCases: 'empty revision sets; duration 0 skips duration bonus',
    failure: 'no failure path (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'revision linkage over learner data; scoped upstream',
    duplication: 'DOMAIN_SPECIFIC_VARIANT vs computeMediaStreamScore (layered extension, not duplicate)',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Final study ordering function; revision-boost magnitudes are heuristic and drive what learners open.',
    risks: ['MAGIC_CONSTANTS', 'TIME_SENSITIVE', 'DUPLICATION_CANDIDATE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-artifacts-artifacts-recency-decay',
    domain: 'artifacts',
    logicIds: ['LOGIC-artifacts-api-copilot-artifacts'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Recency term consumed by media scoring; domain affinity only.',
    capability: 'Exponential recency boost',
    purpose: 'Convert asset age into a decaying relevance bonus.',
    path: 'src/media-stream/scoring.ts',
    symbol: 'getRecencyBoost',
    lines: '37-42',
    category: 'DECAY_OR_RETENTION',
    tags: [],
    implClass: 'PROJECT_HEURISTIC',
    inputs: 'updatedAt ISO string|null.',
    outputs: 'integer bonus 0..22.',
    dataStructures: ['scalars only'],
    method: 'Age in days from Date.now; bonus = max(0, round(22 * exp(-days/18))); unparseable date yields 0.',
    params: ['amplitude 22, time constant 18 days (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none',
    stateRead: 'system clock',
    stateWrite: 'none',
    deps: ['none'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O',
    cxConfidence: 'HIGH',
    scaleDriver: 'constant per call',
    bound: 'BOUNDED output [0,22]',
    invariants: ['monotone non-increasing in age', 'never negative'],
    edgeCases: 'future dates clamp to 0 days (full bonus); null input yields 0',
    failure: 'no failure path (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'none',
    duplication: 'SINGLE_IMPLEMENTATION (getStudySpacingBoost is a separate windowed variant — DOMAIN_SPECIFIC_VARIANT, equivalence UNPROVEN)',
    baseline: 'UNRESOLVED',
    r8e: 'P2',
    r8eReason: 'Tiny pure function; decay shape worth confirming once against engagement data, not on a critical path.',
    risks: ['TIME_SENSITIVE', 'MAGIC_CONSTANTS'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-artifacts-artifacts-content-fingerprint',
    domain: 'artifacts',
    logicIds: ['LOGIC-artifacts-api-copilot-artifacts'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Fingerprinting underpins artifact identity and replay checks; domain affinity only.',
    capability: 'SHA-256 content fingerprint (16-hex truncation)',
    purpose: 'Derive a stable short identity for artifact content used by dedupe and replay detection.',
    path: 'src/services/artifactService.ts',
    symbol: 'computeFingerprint',
    lines: '130-132',
    category: 'HASH_OR_FINGERPRINT',
    tags: ['DEDUPLICATION'],
    implClass: 'STANDARD_LIBRARY_DELEGATED',
    inputs: 'content string (empty-safe).',
    outputs: '16-char hex digest.',
    dataStructures: ['string buffer (library)'],
    method: 'crypto.createHash(sha256).update(content||"").digest(hex).slice(0,16). Twin implementations exist in artifactParserService.ts:30 and artifactStructuredRepository.ts:39.',
    params: ['sha256 algorithm + 16-char truncation (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'none',
    stateWrite: 'none',
    deps: ['EXTERNAL_LIBRARY_DELEGATED: node crypto sha256 (library-dependent complexity)'],
    timeCx: 'O(n) in content bytes (library)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O',
    cxConfidence: 'MEDIUM',
    scaleDriver: 'artifact content size',
    bound: 'BOUNDED output; input size bounded by upload/parse limits upstream (UNRESOLVED here)',
    invariants: ['same content yields same fingerprint (empty-safe)', 'truncation is fixed width'],
    edgeCases: 'empty/null content fingerprints to hash of empty string',
    failure: 'no failure path (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'fingerprints are content-derived identifiers, not secrets; no raw content stored by this unit',
    duplication: 'PARALLEL_VARIANT_CANDIDATE across artifactService / artifactParserService / artifactStructuredRepository (same sha256-hex-slice shape; normalized bodies differ by symbol/signature so analyzer fingerprints do not confirm exact duplication; behavioral equivalence UNPROVEN)',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Identity primitive for dedupe/idempotency; the 16-hex truncation collision margin deserves one measurement, not redesign.',
    risks: ['DATA_INTEGRITY', 'DUPLICATION_CANDIDATE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-artifacts-artifacts-replay-idempotency',
    domain: 'artifacts',
    logicIds: ['LOGIC-artifacts-api-copilot-artifacts'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Replay guard protects artifact truth; domain affinity only.',
    capability: 'Artifact re-parse replay guard',
    purpose: 'Decide whether an incoming re-parse is a same-content replay that must not disturb stored truth.',
    path: 'src/services/artifactService.ts',
    symbol: 'isReplayWithSameFingerprint',
    lines: '476-483',
    category: 'IDEMPOTENCY',
    tags: ['DEDUPLICATION'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'existing LearningArtifact (contentFingerprint, blockCount, parseStatus); incomingContent string.',
    outputs: 'boolean replay verdict.',
    dataStructures: ['scalar comparison'],
    method: 'Recompute fingerprint of incoming content; replay iff fingerprints match AND blockCount>0 AND parseStatus is parsed. Empty content is never a replay.',
    params: ['blockCount>0, status==parsed gate (INLINE policy)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'existing artifact row passed in',
    stateWrite: 'none in this unit (caller skips write on true)',
    deps: ['computeFingerprint (same module)'],
    timeCx: 'O(n) in incoming content bytes (hash)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O in unit',
    cxConfidence: 'MEDIUM',
    scaleDriver: 're-parse content size',
    bound: 'BOUNDED per call',
    invariants: ['failed/partial projections can never be confirmed as replays', 'empty content never matches'],
    edgeCases: 'fingerprint collision (sha256-truncated; accepted risk, unmeasured)',
    failure: 'false verdict falls through to guarded update path (last-known-good preserved per updateArtifactParseResult)',
    concurrency: 'pure predicate; safe',
    secPrivacy: 'none in unit',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Guards stored artifact truth against re-parse corruption; paired with the atomic update path.',
    risks: ['DATA_INTEGRITY', 'RETRY_IDEMPOTENCY'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-artifacts-artifacts-media-dedupe-key',
    domain: 'artifacts',
    logicIds: ['LOGIC-artifacts-api-copilot-artifacts'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Media-asset dedupe key supports idempotent ingestion; domain affinity only.',
    capability: 'Media-asset dedupe-key derivation and lookup',
    purpose: 'Give each ingested media asset a stable identity so re-ingestion resolves to one row.',
    path: 'src/services/mediaAssetService.ts',
    symbol: 'buildMediaAssetDedupeKey',
    lines: '330-336',
    category: 'DEDUPLICATION',
    tags: ['HASH_OR_FINGERPRINT', 'IDEMPOTENCY'],
    implClass: 'STANDARD_LIBRARY_DELEGATED',
    inputs: 'ordered string parts (ids, urls, titles).',
    outputs: 'sha1 hex digest; consumed by findMediaAssetByDedupeKey with a partial uniqueness constraint on (userId, dedupeKey).',
    dataStructures: ['normalized joined string', 'database uniqueness constraint (raw SQL lines 388-390)'],
    method: 'Trim/lowercase/filter/join with | separator, then sha1 hex. Lookup and insert paths key on (userId, dedupeKey) with WHERE dedupeKey IS NOT NULL.',
    params: ['separator | (INLINE_MAGIC_CONSTANT)', 'sha1 algorithm choice (project decision; non-security dedupe use)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'MediaAsset rows by key',
    stateWrite: 'dedupeKey column on insert',
    deps: ['EXTERNAL_LIBRARY_DELEGATED: node crypto sha1', 'prisma raw SQL for table/index (runtime DDL guard)'],
    timeCx: 'O(n) in parts length (library)',
    spaceCx: 'O(1)',
    ioCx: 'database: bounded keyed lookup/insert (DB_QUERY_BOUND); network: none',
    cxConfidence: 'MEDIUM',
    scaleDriver: 'ingestion volume per user',
    bound: 'BOUNDED output; key space per user',
    invariants: ['normalization order is fixed (case/space-insensitive identity)', 'null key never collides (partial index)'],
    edgeCases: 'all-empty parts yield hash of empty string; separator collision across part splits (accepted, unmeasured)',
    failure: 'DB failure surfaces to caller; no silent double-insert (constraint)',
    concurrency: 'uniqueness constraint is the arbiter under races',
    secPrivacy: 'key components may include user content; digest is not reversible by this unit',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Ingestion identity primitive; separator-collision margin and index behavior under volume deserve measurement.',
    risks: ['DATA_INTEGRITY', 'RETRY_IDEMPOTENCY', 'DATABASE_HOTSPOT_CANDIDATE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-artifacts-videoaware-external-video-dedupe',
    domain: 'artifacts',
    logicIds: ['LOGIC-artifacts-api-copilot-videorecommendationroutes'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'External candidate merge serves video recommendation; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Cross-provider external video candidate merge with quality preference',
    purpose: 'Merge YouTube/Vimeo candidate lists into one deduped set keeping the stronger record per video.',
    path: 'src/services/externalVideoCandidateService.ts',
    symbol: 'dedupeCandidates',
    lines: '38-56',
    category: 'DEDUPLICATION',
    tags: ['CACHE_OR_COALESCING'],
    implClass: 'PROJECT_HEURISTIC',
    inputs: 'ExternalVideoCandidate[] from parallel provider fetches (merged at line 101).',
    outputs: 'deduped candidate array.',
    dataStructures: ['Map<sourceType:sourceVideoId, candidate>', 'SERVICE_CACHE Map with TTL (lines 61-63)'],
    method: 'Single pass keyed on stable provider id; on collision keep the higher composite (educationalConfidence + clarityScore + 0.25 captions bonus). Served behind a TTL cache keyed on normalized request (limit default 12).',
    params: ['captions bonus 0.25 (INLINE_MAGIC_CONSTANT)', 'default limit 12 (INLINE_MAGIC_CONSTANT)', 'SERVICE_CACHE_TTL_MS (NAMED_POLICY_CONSTANT)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none in this unit',
    stateRead: 'SERVICE_CACHE module Map',
    stateWrite: 'SERVICE_CACHE module Map',
    deps: ['provider fetchers (YouTube/Vimeo; network-bound, not decomposed here)'],
    timeCx: 'O(n) single pass',
    spaceCx: 'O(n)',
    ioCx: 'network: provider-bound fan-out (callers); cache short-circuits repeats within TTL',
    cxConfidence: 'HIGH',
    scaleDriver: 'candidates per provider per request; request rate vs TTL',
    bound: 'BOUNDED per request by provider limits; cache is module-local (MEMORY_HOTSPOT_CANDIDATE for R8-E)',
    invariants: ['one record per stable video id', 'quality comparison is total and deterministic'],
    edgeCases: 'empty merge yields noticed empty deck (line 102); single-provider degradation noticed (line 105)',
    failure: 'provider failure degrades to partial deck with notices, not an exception (verified lines 100-107)',
    concurrency: 'module cache shared across requests; TTL check-then-use is best-effort (UNRESOLVED ordering under race)',
    secPrivacy: 'external provider data; no learner PII in key',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Provider-cost and latency hinge on this merge + cache; TTL and quality-weight behavior unmeasured.',
    risks: ['NETWORK_COST', 'PROVIDER_COST', 'MEMORY_HOTSPOT_CANDIDATE', 'MAGIC_CONSTANTS'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-voice-voice-ledger-billing-quota',
    domain: 'voice',
    logicIds: ['LOGIC-voice-api-voice-voiceroutes'],
    linkageKind: 'R8B_STRUCTURAL',
    linkageNote: 'R8-B SOURCE_INSPECTION confirms route voice.ts:3-10,36-48 with voiceLedgerService transactional persistence (05 lines 3205-3222).',
    capability: 'Voice quota ledger: authorize, bill and settle voice sessions',
    purpose: 'Enforce per-student voice time quotas with auditable double-entry style ledger updates.',
    path: 'src/services/voiceLedgerService.ts',
    symbol: 'computeBilledSeconds/consumeFromGrants/ensureStudentRowLocked/getCurrentBalanceInTx',
    lines: '105-213',
    category: 'RATE_LIMIT_OR_QUOTA',
    tags: ['CONCURRENCY_COORDINATION', 'RECONCILIATION'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'studentId; session usage; listening/tts seconds; billing mode (LISTENING_ONLY|LISTENING_PLUS_TTS from VOICE_BILL_MODE).',
    outputs: 'billedSeconds; remainingSeconds; mode; stopReason; timeExhausted flag.',
    dataStructures: ['grant rows ordered (grantedAt, id)', 'ledger entries (last-10 read)', 'row lock via SELECT FOR UPDATE (line 144)'],
    method: 'Ceil-to-int non-negative billing; FIFO consumption oldest-grant-first with partial deduction; row lock + grant aggregate + dev-bootstrap guard inside one Prisma transaction; last-10 ledger tail for display.',
    params: ['SERVER_BILLING_GRACE_SECONDS default 1 (CONFIGURED_VALUE)', 'VOICE_DEV_BOOTSTRAP_MINUTES default 10 non-production (CONFIGURED_VALUE)', 'ceil rounding (project policy)', 'last-10 ledger tail take=10 (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC_GIVEN_CONFIG',
    randomness: 'none',
    stateRead: 'StudentProfile, VoicePackageGrant, VoiceLedgerEntry, VoiceSessionUsage',
    stateWrite: 'grant deductions, ledger entries, session rows — all inside $transaction',
    deps: ['prisma ($transaction, aggregate, raw FOR UPDATE lock)'],
    timeCx: 'application CPU: O(g), g = active grants (FIFO loop)',
    spaceCx: 'O(g)',
    ioCx: 'database: one transaction with N statements (aggregate + findMany + updates + creates); query plans UNRESOLVED — DB_QUERY_BOUND',
    cxConfidence: 'MEDIUM',
    scaleDriver: 'active grants per student; session stop rate',
    bound: 'BOUNDED per student by grant volume; ledger tail fixed at 10',
    invariants: ['balance never negative (max(0,…))', 'consumption order is FIFO by (grantedAt, id)', 'every deduction pairs with a ledger entry carrying balanceAfterSeconds'],
    edgeCases: 'zero/negative usage bills 0; expired grants excluded (expiresAt null or future); dev bootstrap only when no entries exist',
    failure: 'transactional: partial billing cannot persist; lock contention surfaces to caller',
    concurrency: 'CONCURRENCY_SENSITIVE: FOR UPDATE row lock + transactional deduction is the correctness mechanism',
    secPrivacy: 'student quota data; admin grant path requireRole(admin) per R8-B inspection',
    duplication: 'SINGLE_IMPLEMENTATION (voice CLEAR writer family per R8-B)',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Money-like quota correctness under concurrency; FIFO + lock behavior needs reliability proof.',
    risks: ['DATA_INTEGRITY', 'CONCURRENCY_SENSITIVE', 'DATABASE_HOTSPOT_CANDIDATE', 'AUTHORIZATION_SENSITIVE'],
    confidence: 'HIGH',
    evidenceKind: 'R8B_SOURCE_INSPECTION + SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-voice-airoutes-express-rate-limit',
    domain: 'voice',
    logicIds: ['LOGIC-voice-api-copilot-airoutes'],
    linkageKind: 'R8B_STRUCTURAL',
    linkageNote: 'R8-B mount evidence records rateLimitMiddleware on /api/copilot aiRoutes (05 line 3055); limiters verified in ai-middleware.ts:24-46 and redis middleware rateLimiter.ts.',
    capability: 'AI/voice route rate limiting (library + redis counter)',
    purpose: 'Cap per-user AI, speech-to-text, text-to-speech and general request rates to bound provider cost and abuse.',
    path: 'src/routes/ai/ai-middleware.ts',
    symbol: 'aiLimiter/sttLimiter/ttsLimiter',
    lines: '24-46',
    category: 'RATE_LIMIT_OR_QUOTA',
    tags: [],
    implClass: 'EXTERNAL_LIBRARY_DELEGATED',
    inputs: 'request identity (req.user.id or ip); per-limiter window and max.',
    outputs: 'allow with headers or 429 with wait message.',
    dataStructures: ['library-owned counters; redis key rate:{studentId} with TTL (second implementation)'],
    method: 'express-rate-limit fixed windows: AI 30/min, STT 15/min, TTS 20/min keyed user-or-ip. Parallel project implementation rateLimiter.ts: redis INCR with 60s expiry, limit 20/min, Retry-After headers, fail-open on redis outage (lines 42-44).',
    params: ['windowMs=60000 all (INLINE_MAGIC_CONSTANT)', 'max 30/15/20 (INLINE_MAGIC_CONSTANT)', 'redis RATE_LIMIT=20, WINDOW=60s (INLINE_MAGIC_CONSTANT)', 'keyGenerator user-or-ip (project policy)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none',
    stateRead: 'library counters / redis key',
    stateWrite: 'library counters / redis INCR+EXPIRE',
    deps: ['EXTERNAL_LIBRARY_DELEGATED: express-rate-limit (library-dependent complexity)', 'redis via getRedisClient (second implementation)'],
    timeCx: 'library-dependent / UNRESOLVED',
    spaceCx: 'UNRESOLVED',
    ioCx: 'redis: O(1) counter ops per request (second implementation); network: none in unit',
    cxConfidence: 'LOW',
    scaleDriver: 'request rate per user/ip; redis key cardinality',
    bound: 'window-bounded counters; redis keys expire (60s)',
    invariants: ['limits are per identity, not global', 'redis outage fails open (availability over enforcement — recorded, not judged)'],
    edgeCases: 'missing user id => 401 in redis path, anon-ip key in library path (DIVERGENT identity handling noted for R8-E)',
    failure: 'fail-open on limiter error (lines 42-44)',
    concurrency: 'redis INCR is atomic; library counters are process-local (multi-instance fan-out UNRESOLVED)',
    secPrivacy: 'keyed on user id; Retry-After headers only',
    duplication: 'PARALLEL_VARIANT_CANDIDATE: two rate-limit mechanisms (library trio + redis middleware) with divergent identity/fail behavior — equivalence UNPROVEN, consolidation FORBIDDEN in R8-C',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Provider-cost and abuse boundary; dual mechanisms and fail-open/multi-instance behavior need reliability review.',
    risks: ['PROVIDER_COST', 'NETWORK_COST', 'SCALE_SENSITIVE', 'MAGIC_CONSTANTS', 'DUPLICATION_CANDIDATE', 'SECURITY_SENSITIVE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task) + R8A_STRUCTURAL mount evidence',
  },
  {
    id: 'ALG-operations-reliability-ai-retry-backoff-jitter',
    domain: 'operations',
    logicIds: ['LOGIC-operations-api-task024-operations-readiness'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'AI reliability runtime underpins operations readiness posture; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'AI provider retry delay and retry gate',
    purpose: 'Decide whether a failed provider call may retry and how long to wait, without retry storms.',
    path: 'src/services/aiRuntimeRetryPolicyService.ts',
    symbol: 'calculateRetryDelayMs/decideAiRetry',
    lines: '8-107',
    category: 'RETRY_OR_BACKOFF',
    tags: ['DETERMINISTIC_RULE_SET'],
    implClass: 'STANDARD_METHOD',
    inputs: 'attempt; baseDelayMs; maxDelayMs; jitterRatio; retryAfterMs; error category; retryable; budgetAllowed; circuitState; operationIdempotent.',
    outputs: 'AiRetryDecision { shouldRetry, reason, attempt, maxAttempts, delayMs? }.',
    dataStructures: ['scalars only'],
    method: 'Ordered gate: budget => circuit-open => max-attempts => retryable => idempotent-safety; delay = min(cap, jitter(base * 2^(attempt-1))) with symmetric uniform jitter; Retry-After header honored when sane (<120s).',
    params: ['DEFAULT_BASE_DELAY_MS=1000 (NAMED_POLICY_CONSTANT)', 'DEFAULT_MAX_DELAY_MS=30000 (NAMED_POLICY_CONSTANT)', 'DEFAULT_JITTER_RATIO=0.25 (NAMED_POLICY_CONSTANT)', 'DEFAULT_MAX_ATTEMPTS=3 (NAMED_POLICY_CONSTANT)', 'retryAfter sanity cap 120000ms (INLINE_MAGIC_CONSTANT)'],
    determinism: 'RANDOMIZED',
    randomness: 'Math.random symmetric jitter around base (line 10); delay distribution uniform ±25%; no seed; reproducibility UNRESOLVED',
    stateRead: 'none in unit (caller supplies attempt/circuit/budget)',
    stateWrite: 'none',
    deps: ['none (Math only)'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O; caller loop bounded by maxAttempts with awaits between',
    cxConfidence: 'HIGH',
    scaleDriver: 'attempt count (≤3); provider failure rate (caller loop)',
    bound: 'BOUNDED attempts and capped delay',
    invariants: ['never retries on open circuit, exhausted budget, or non-idempotent ops', 'delay never exceeds maxDelayMs', 'idempotent=false forces single attempt upstream (reliability service line 102)'],
    edgeCases: 'retryAfterMs 0/negative/huge falls back to exponential; attempt>=max refuses',
    failure: 'refusal reasons are terminal codes (budget_exceeded/circuit_open/max_attempts/non_retryable/not_idempotent)',
    concurrency: 'stateless; safe (attempt counting owned by caller loop)',
    secPrivacy: 'none in unit',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'exponential backoff with jitter (conventional method; exact identity UNRESOLVED per §11)',
    r8e: 'P0',
    r8eReason: 'Retry/idempotency gate for every provider call; jitter distribution and storm behavior need proof.',
    risks: ['RETRY_IDEMPOTENCY', 'PROVIDER_COST', 'RANDOMNESS_SENSITIVE', 'TIME_SENSITIVE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-operations-reliability-ai-circuit-breaker',
    domain: 'operations',
    logicIds: ['LOGIC-operations-api-task024-operations-readiness'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'AI reliability runtime underpins operations readiness posture; domain affinity only.',
    capability: 'AI provider circuit breaker with half-open probing',
    purpose: 'Stop calling failing providers fast and probe recovery without manual intervention.',
    path: 'src/services/aiRuntimeCircuitBreakerService.ts',
    symbol: 'getOrCreateBreaker/beforeAiProviderCall',
    lines: '5-80',
    category: 'CIRCUIT_BREAKER',
    tags: ['STATE_MACHINE', 'CACHE_OR_COALESCING'],
    implClass: 'STANDARD_METHOD',
    inputs: 'provider; operation; nowMs (injectable); CircuitBreakerConfig (DEFAULT_CIRCUIT_BREAKER_CONFIG).',
    outputs: '{ allowed, snapshot, reason: allowed|circuit_open|half_open_probe_allowed }.',
    dataStructures: ['module Map<provider:operation, CircuitBreakerEntry> (R8-A runtime-state class: module cache)', 'entry { state, failureCount, successCount, openedAt, halfOpenProbeCount, lastFailureCategory }'],
    method: 'Closed allows; open blocks until cooldownMs elapses then flips to half_open with probe counter reset; half-open admits bounded probes (verified prefix through line 80; success/failure recording continues to line 174).',
    params: ['DEFAULT_CIRCUIT_BREAKER_CONFIG cooldownMs/thresholds (NAMED_POLICY_CONSTANT, contracts file)', 'key = provider:operation (project policy)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none',
    stateRead: 'module breakers Map',
    stateWrite: 'module breakers Map (state flips, counters)',
    deps: ['contracts/aiRuntimeCircuitBreakerContracts (config)', 'contracts/aiRuntimeReliabilityContracts (types)'],
    timeCx: 'O(1) map operations',
    spaceCx: 'O(k) breaker entries',
    ioCx: 'no I/O in unit',
    cxConfidence: 'HIGH',
    scaleDriver: 'provider×operation cardinality (small fixed set)',
    bound: 'BOUNDED key space; counters reset on transitions',
    invariants: ['open never allows before cooldown', 'half-open always resets probe count on entry', 'nowMs injectable for deterministic tests'],
    edgeCases: 'unknown provider creates closed breaker on first use; clock skew affects cooldown only',
    failure: 'closed on virgin keys (fail-open initial); probe failures re-open (per record/failure paths past line 80, UNRESOLVED detail here)',
    concurrency: 'single-process Map; multi-instance coherence UNRESOLVED (R8-E reliability review)',
    secPrivacy: 'none in unit',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'circuit breaker with half-open probe (conventional method; exact identity UNRESOLVED per §11)',
    r8e: 'P1',
    r8eReason: 'Standard reliability shape but process-local state; multi-instance and threshold behavior need reliability review.',
    risks: ['RETRY_IDEMPOTENCY', 'TIME_SENSITIVE', 'CONCURRENCY_SENSITIVE', 'MEMORY_HOTSPOT_CANDIDATE'],
    confidence: 'MEDIUM',
    evidenceKind: 'SOURCE_INSPECTION (this task, verified prefix lines 5-80)',
  },
  {
    id: 'ALG-operations-reliability-ai-rate-limit-window',
    domain: 'operations',
    logicIds: ['LOGIC-operations-api-task024-operations-readiness'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'AI reliability runtime underpins operations readiness posture; domain affinity only.',
    capability: 'Sliding-window AI rate-limit guard (student/school/provider)',
    purpose: 'Enforce per-minute quotas at three scopes before provider calls are admitted.',
    path: 'src/services/aiRuntimeRateLimitGuardService.ts',
    symbol: 'checkAiRateLimit/recordAiRateLimitUsage/pruneWindow',
    lines: '21-107',
    category: 'RATE_LIMIT_OR_QUOTA',
    tags: ['CACHE_OR_COALESCING'],
    implClass: 'STANDARD_METHOD',
    inputs: 'actorType/actorId/schoolId/provider/operation; nowMs (injectable).',
    outputs: '{ allowed, reason, retryAfterMs? }.',
    dataStructures: ['module Map<key, RateWindow> with timestamps number[] (R8-A runtime-state class: module cache)', 'key = scope:id(sliding 60s window)'],
    method: 'Three-scope check (student => school => provider), each prune-then-count over a 60s window; usage recorded as timestamp pushes only after admission upstream; test reset clears the Map.',
    params: ['WINDOW_MS=60000 (NAMED_POLICY_CONSTANT)', 'student 30/min, school 500/min, provider 1000/min (NAMED_POLICY_CONSTANT)', 'retryAfterMs = WINDOW_MS on refuse (project policy)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none',
    stateRead: 'module windows Map',
    stateWrite: 'module windows Map (push/prune)',
    deps: ['none'],
    timeCx: 'O(w) filter scan per scope check, w = events in window',
    spaceCx: 'O(w) timestamps per key',
    ioCx: 'no I/O in unit',
    cxConfidence: 'MEDIUM',
    scaleDriver: 'request rate × key cardinality; prune cost grows with w',
    bound: 'POTENTIALLY_UNBOUNDED timestamp arrays under burst (prune only on check) — flagged UNBOUNDED_DATA for R8-E',
    invariants: ['refuse reasons name the exact scope', 'counts always reflect the trailing 60s at check time'],
    edgeCases: 'missing actorId/schoolId skips that scope (provider scope always applies)',
    failure: 'no failure path (pure memory ops)',
    concurrency: 'single-process Map; check/record split across two calls (TOCTOU window UNRESOLVED — R8-E reliability review)',
    secPrivacy: 'keyed on actor/school ids; counts only',
    duplication: 'SINGLE_IMPLEMENTATION (distinct mechanism from express/redis limiters — DOMAIN_SPECIFIC_VARIANT for AI runtime)',
    baseline: 'fixed/sliding window counter (conventional method; exact identity UNRESOLVED per §11)',
    r8e: 'P1',
    r8eReason: 'Abuse/cost boundary on the AI path; window-memory growth and check/record race need measurement.',
    risks: ['SCALE_SENSITIVE', 'MEMORY_HOTSPOT_CANDIDATE', 'UNBOUNDED_DATA', 'CONCURRENCY_SENSITIVE', 'PROVIDER_COST', 'MAGIC_CONSTANTS'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-operations-canary-state-transition',
    domain: 'operations',
    logicIds: ['LOGIC-operations-api-task032-controlled-canary-activation'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Canary state machine names match the task032 capability mount; R8-B structural service link UNRESOLVED, name+domain affinity only.',
    capability: 'Controlled-canary activation state transition gate',
    purpose: 'Admit or block canary lifecycle transitions with role and path guards, recording an auditable transition.',
    path: 'src/services/task032CanaryActivationStateMachine.ts',
    symbol: 'transitionTask032CanaryState',
    lines: '16-66',
    category: 'STATE_MACHINE',
    tags: ['DETERMINISTIC_RULE_SET'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'currentState; targetState; actorRole; actorHash; reasonCode. Allowed-transition table ALLOWED_CANARY_STATE_TRANSITIONS + isAllowedTransition (contracts:618-622).',
    outputs: 'Task032StateTransition { from/to, allowed, blockingIssues[], reasonCode, timestamp, safeSummary }.',
    dataStructures: ['blockingIssues string[] accumulator', 'allowed-transition lookup table'],
    method: 'Table lookup plus ordered role guards (unknown/student/teacher blocked) and activation-path guard (active only from armed|paused); any issue blocks with first-issue reason code; terminal states per table (UNRESOLVED detail — table body not inspected here).',
    params: ['role allow-list admin|operator (project policy)', 'activation sources armed|paused (project policy)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none (timestamp only)',
    stateRead: 'transition table (static)',
    stateWrite: 'none in this unit (caller persists via Service twin — DUPLICATE_SERVICE_CANDIDATE per R8-B line 3267, coverage UNRESOLVED)',
    deps: ['contracts/task032ControlledCanaryContracts (table + types)'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O in unit',
    cxConfidence: 'HIGH',
    scaleDriver: 'constant per transition',
    bound: 'BOUNDED',
    invariants: ['blocked transitions carry machine-readable blockingIssues', 'student/teacher can never transition', 'allowed transitions always recorded with actor hash + reason'],
    edgeCases: 'rollback_in_progress from kill_switch_active explicitly permitted branch (lines 45-47)',
    failure: 'blocking is data, not exception (allowed=false + reasons)',
    concurrency: 'pure evaluation; persistence ordering owned by caller service',
    secPrivacy: 'AUTHORIZATION_SENSITIVE: rollout control; actor hashed not raw',
    duplication: 'PARALLEL_VARIANT_CANDIDATE vs task032CanaryActivationStateMachineService and task034ControlledRolloutStateMachine pair (R8-B lines 3267/3271) — equivalence UNPROVEN',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Rollout safety gate with role enforcement; table completeness and twin-service divergence need proof.',
    risks: ['AUTHORIZATION_SENSITIVE', 'DATA_INTEGRITY', 'SECURITY_SENSITIVE', 'DUPLICATION_CANDIDATE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-operations-shared-pagination-cursor',
    domain: 'operations',
    logicIds: ['LOGIC-operations-api-ops-diagnostics'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Shared pagination primitive consumed by operational/audit read surfaces (e.g. durableAuditRepository.ts:126-190 cursor usage); domain affinity only.',
    capability: 'Bounded cursor/offset pagination parsing and metadata',
    purpose: 'Clamp client pagination input and describe page position so list endpoints cannot request unbounded pages.',
    path: 'src/services/apiPaginationService.ts',
    symbol: 'parsePaginationInput/buildPaginationMeta',
    lines: '15-63',
    category: 'PAGINATION_OR_CURSOR',
    tags: ['DETERMINISTIC_RULE_SET'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'ApiPaginationInput { limit?, cursor?, offset?, sort? }.',
    outputs: 'parse result (limit, cursor, offset, sort) or typed error; meta { limit, hasMore, nextCursor?, totalCount? }.',
    dataStructures: ['scalars only'],
    method: 'Default-then-clamp: limit defaults 20, rejects non-finite/<1, caps at MAX; cursor/offset/sort type-checked; offset defaults 0; floor applied to limit.',
    params: ['DEFAULT_PAGINATION_LIMIT=20 (NAMED_POLICY_CONSTANT)', 'MAX_PAGINATION_LIMIT=100 (NAMED_POLICY_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'none',
    stateWrite: 'none',
    deps: ['contracts/apiPaginationContracts (types + constants)'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O in unit; callers pair with take/limit + cursor+skip:1 queries (durableAuditRepository pattern)',
    cxConfidence: 'HIGH',
    scaleDriver: 'constant per request; page size capped at 100',
    bound: 'BOUNDED (limit ≤ 100 enforced)',
    invariants: ['limit always within [1,100] on success', 'invalid input is a typed error, never a silent clamp (except floor)'],
    edgeCases: 'non-numeric/NaN/Infinite limits rejected; cursor must be string; negative offset rejected',
    failure: 'typed { ok:false, error } results',
    concurrency: 'stateless; safe',
    secPrivacy: 'bounds data-exfiltration page size; no content handling',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P2',
    r8eReason: 'Small shared guard; worth a contract test but not a measurement campaign.',
    risks: ['SCALE_SENSITIVE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-school-schoolintegration-roster-reconcile',
    domain: 'school',
    logicIds: ['LOGIC-school-api-task021-school-integration'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Roster reconciliation names match the task021 capability; R8-B structural service link UNRESOLVED, name+domain affinity only.',
    capability: 'Roster-diff reconciliation into identity-mapping decisions',
    purpose: 'Turn an external roster diff into safe per-entry mapping actions without losing learning history.',
    path: 'src/services/task021RosterReconciliationService.ts',
    symbol: 'reconcileRosterDiff/makeReconciliationDecision',
    lines: '19-90',
    category: 'RECONCILIATION',
    tags: ['DETERMINISTIC_RULE_SET'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'RosterDiffEntry[] (category: new|unchanged|inactivated|reactivated|…); schoolId.',
    outputs: 'ReconciliationResult { decisions[], appliedCount, quarantinedCount, skipCount } with per-decision reasonCodes + preserveHistory flags.',
    dataStructures: ['Array scan + switch dispatch', 'counter accumulators'],
    method: 'Single pass: category switch maps to create/update/reactivate/inactivate/quarantine/skip with safe summaries; history-preserving categories set preserveHistory=true; counts accumulated by action class.',
    params: ['category vocabulary (project policy, contracts file)', 'preserveHistory per category (project policy)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'diff entries passed in (identity mapping updates delegated to task021SchoolIdentityMappingService)',
    stateWrite: 'none in this unit (caller applies via runtime + durable bridge)',
    deps: ['task021SchoolIdentityMappingService, logger (internal)'],
    timeCx: 'O(n) single pass over entries',
    spaceCx: 'O(n) decisions',
    ioCx: 'no I/O in unit; caller performs per-entry persistence (DB_QUERY_BOUND, batching UNRESOLVED)',
    cxConfidence: 'HIGH',
    scaleDriver: 'roster batch size (whole-school syncs)',
    bound: 'POTENTIALLY_UNBOUNDED input (school-size rosters) — flagged for R8-E batching review',
    invariants: ['unchanged entries always skip with history preserved', 'inactivation preserves history (never deletes)', 'every decision carries reasonCodes + safeSummary'],
    edgeCases: 'unknown categories (tail past line 90, UNRESOLVED here); empty batch yields zero counts',
    failure: 'no failure path in unit (pure); application errors owned by caller runtime',
    concurrency: 'pure decision; application ordering owned by processRosterSync runtime',
    secPrivacy: 'student identity mapping; school-scoped; summaries are safe (no raw PII in verified prefix)',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'School-size identity writes; category coverage and caller batching need correctness proof.',
    risks: ['DATA_INTEGRITY', 'PRIVACY_SENSITIVE', 'UNBOUNDED_DATA', 'SCALE_SENSITIVE'],
    confidence: 'MEDIUM',
    evidenceKind: 'SOURCE_INSPECTION (this task, verified prefix lines 19-90)',
  },
  {
    id: 'ALG-school-schoolintegration-roster-dryrun-conflict-scan',
    domain: 'school',
    logicIds: ['LOGIC-school-api-task021-school-integration'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Dry-run conflict scan serves school-integration intake; name+domain affinity only.',
    capability: 'Roster-sync dry-run conflict scan',
    purpose: 'Preview a roster payload for duplicate ids and school-scope mismatches before any write.',
    path: 'src/services/rosterSyncDryRunService.ts',
    symbol: 'performRosterSyncDryRun',
    lines: '9-70',
    category: 'SELECTION_OR_FILTERING',
    tags: ['DEDUPLICATION', 'RECONCILIATION'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'RosterSyncInput { schoolId, students[], teachers[], classes[] }.',
    outputs: 'RosterSyncDryRunResult { conflicts[] (type, externalId, severity, safeDetails), summary, warnings }.',
    dataStructures: ['3 Sets (seenStudentIds, seenTeacherIds, seenClassIds)', 'conflicts Array'],
    method: 'Three linear passes (students, teachers, classes): Set-membership duplicate detection plus per-record schoolId equality check; every hit appends a high-severity typed conflict with safe details.',
    params: ['severity high for duplicates and school mismatches (project policy)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none (randomUUID import at line 7 is for result ids, not decisions)',
    stateRead: 'none (pure over input)',
    stateWrite: 'none (dry-run by contract)',
    deps: ['contracts/schoolSystemBridgeContracts (types)', 'crypto randomUUID (ids only)'],
    timeCx: 'O(n) three passes',
    spaceCx: 'O(n) Sets + conflicts',
    ioCx: 'no I/O (dry-run)',
    cxConfidence: 'HIGH',
    scaleDriver: 'roster payload size',
    bound: 'POTENTIALLY_UNBOUNDED input (whole-school payloads) — flagged for R8-E',
    invariants: ['dry-run never writes', 'duplicate and school-mismatch are always high severity', 'conflict order is input order (deterministic)'],
    edgeCases: 'empty lists; cross-school records; repeated ids across batches (batch-scoped only)',
    failure: 'no failure path in unit (pure)',
    concurrency: 'stateless; safe',
    secPrivacy: 'processes raw roster PII in memory; outputs use safeDetails only',
    duplication: 'SINGLE_IMPLEMENTATION (complements reconcileRosterDiff: preview vs apply — DOMAIN_SPECIFIC_VARIANT pair, equivalence UNPROVEN)',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Last gate before school-size identity writes; scan completeness and PII handling need proof.',
    risks: ['DATA_INTEGRITY', 'PRIVACY_SENSITIVE', 'UNBOUNDED_DATA', 'SCALE_SENSITIVE', 'MEMORY_HOTSPOT_CANDIDATE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-school-learnerrecommendation-priority-policy',
    domain: 'school',
    logicIds: ['LOGIC-school-api-learner-learnerrecommendationroutes'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Recommendation priority policy serves learner-recommendation surfaces; R8-B structural route link UNRESOLVED, name+domain affinity only.',
    capability: 'Learner-recommendation type priority and reason policy',
    purpose: 'Fix the display order and explanation contract for every learner recommendation type.',
    path: 'src/services/learnerTransparencyContracts.ts',
    symbol: 'RECOMMENDATION_TYPE_PRIORITY/getRecommendationPriority',
    lines: '172-183',
    category: 'SCHEDULING_OR_PRIORITY',
    tags: ['DETERMINISTIC_RULE_SET'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'LearnerRecommendationType (10 types).',
    outputs: 'priority 1-10 + reason policy (reasonCode, templates, confidenceLabel).',
    dataStructures: ['Record-type lookup tables (priority + reason policy)'],
    method: 'Total-order table: revision_due=1, mistake/spaced-review=2, foundation=3, mastery/continue=4, similar=5, teacher_help=6, challenge=7, deen_referral=8. Accessor getRecommendationPriority (line 308) reads the table.',
    params: ['priority values 1-8 over 10 types (NAMED_POLICY_CONSTANT)', 'reason templates per type (project policy content)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'none (static tables)',
    stateWrite: 'none',
    deps: ['none'],
    timeCx: 'O(1) table lookup',
    spaceCx: 'O(1)',
    ioCx: 'no I/O',
    cxConfidence: 'HIGH',
    scaleDriver: 'constant per recommendation',
    bound: 'BOUNDED (10-type vocabulary)',
    invariants: ['every known type has exactly one priority and one reason policy', 'revision/mistake signals outrank challenge content'],
    edgeCases: 'unknown type lookup behavior UNRESOLVED (accessor past line 308 not inspected here)',
    failure: 'no failure path in table',
    concurrency: 'static; safe',
    secPrivacy: 'templates are student-facing; deen-referral type is sensitivity-relevant',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'User-facing order of learning guidance; priority-table quality shapes what learners do next.',
    risks: ['ACADEMIC_CORRECTNESS', 'MAGIC_CONSTANTS'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-safety-tutorpolicy-generation-policy-gate',
    domain: 'safety',
    logicIds: ['LOGIC-safety-api-copilot-tutorpolicyevaluateroutes'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Generation policy gate serves tutor-policy evaluation; R8-B structural route link UNRESOLVED, name+domain affinity only.',
    capability: 'Ordered generation-policy gate (block/refer/clarify/safety/integrity)',
    purpose: 'Decide whether the tutor may generate, in which safe mode, before any provider call.',
    path: 'src/services/aiGateway/generationPolicyGate.ts',
    symbol: 'evaluateGenerationPolicy',
    lines: '10-70',
    category: 'DETERMINISTIC_RULE_SET',
    tags: ['STATE_MACHINE'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'SafeGenerationRequest.policyPacket { decision, blockReasons, safety flags, academicIntegrity, noFinalAnswer }.',
    outputs: 'GenerationPolicyResult { allowedToGenerate, generationMode, blockedReason?, safeFallbackMessage? }.',
    dataStructures: ['ordered if-chain (priority-encoded)', 'safe fallback message strings'],
    method: 'Priority-ordered gate: block => refer => clarify_first => seriousRisk => safeguardingCandidate => direct-answer-without-attempt (hint_only) => final-answer-blocked (attempt? feedback : hint_only). First match wins; every refusal carries a student-safe fallback.',
    params: ['decision vocabulary block|refer|clarify_first (project policy)', 'fallback message strings (project policy content)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'none (pure over packet)',
    stateWrite: 'none',
    deps: ['safeGenerationContracts (types; internal)'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O in unit; sits before provider calls (EXTERNAL boundary)',
    cxConfidence: 'HIGH',
    scaleDriver: 'per generation request; constant',
    bound: 'BOUNDED',
    invariants: ['block-class decisions always refuse with a safe message', 'direct answers require a learner attempt present', 'ordering is total: safety precedes integrity'],
    edgeCases: 'missing blockReasons degrades to unknown label; absent attempt forces hint_only',
    failure: 'refusal is data (no exception); tail past line 70 UNRESOLVED here',
    concurrency: 'stateless; safe',
    secPrivacy: 'SECURITY_SENSITIVE PRIVACY_SENSITIVE: safeguarding and safety routing; fallback wording is policy content',
    duplication: 'SINGLE_IMPLEMENTATION (sibling policy gates — tutorTurnRuntimePolicyGate, no-ai-bypass — are DOMAIN_SPECIFIC_VARIANTs, equivalence UNPROVEN)',
    baseline: 'UNRESOLVED',
    r8e: 'P0',
    r8eReason: 'Safety/academic-integrity enforcement before generation; gate-order errors have safeguarding consequences.',
    risks: ['SECURITY_SENSITIVE', 'PRIVACY_SENSITIVE', 'ACADEMIC_CORRECTNESS', 'ASSESSMENT_INTEGRITY', 'DUPLICATION_CANDIDATE'],
    confidence: 'MEDIUM',
    evidenceKind: 'SOURCE_INSPECTION (this task, verified prefix lines 10-70)',
  },
  {
    id: 'ALG-questionbank-markinginvocation-batch-mark-sweep',
    domain: 'question-bank',
    logicIds: ['LOGIC-question-bank-api-question-bank-marking-invocation'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Service names match the marking-invocation capability mount; the R8-B capability stays UNRESOLVED (no importOrigin) — this record proves the procedure, not the route link.',
    capability: 'Deterministic marking batch sweep with per-item failure isolation',
    purpose: 'Mark all deterministic-mode batch items while isolating failures and tracking batch lifecycle.',
    path: 'src/domains/assessment/marking-invocation/services/deterministicMarkingInvocationService.ts',
    symbol: 'DeterministicMarkingInvocationService.executeDeterministicBatch',
    lines: '14-56',
    category: 'BATCHING_OR_CHUNKING',
    tags: ['STATE_MACHINE', 'SELECTION_OR_FILTERING'],
    implClass: 'PROJECT_DETERMINISTIC_POLICY',
    inputs: 'markingBatchId; markingRunId; policy defaults MARKING_INVOCATION_POLICY_DEFAULTS.',
    outputs: '{ batch (running|completed + timestamps), markedItems[], failedItems[] }.',
    dataStructures: ['filtered item Array', 'marked/failed accumulator Arrays'],
    method: 'Policy gate first (missingDecision may POLICY_BLOCK); filter items to deterministic|rubric_deterministic modes; sequential per-item execution with try/catch isolation (failures marked failed with timestamp, batch continues); batch flips to completed only when failedItems is empty.',
    params: ['itemMode vocabulary deterministic|rubric_deterministic|unsupported_deferred (project policy)', 'completion rule: zero failures (project policy)'],
    determinism: 'DETERMINISTIC_GIVEN_TIME',
    randomness: 'none',
    stateRead: 'batch + item repositories (in-memory default; prisma twins exist)',
    stateWrite: 'item statuses, batch lifecycle timestamps',
    deps: ['markingInvocationPolicyDefinitions, repository contracts (internal); in-memory vs prisma repository twins (SHARED_BY_DESIGN per R8-B)'],
    timeCx: 'O(b) sequential items, b = batch size',
    spaceCx: 'O(b) accumulators',
    ioCx: 'database: O(b) repository reads/writes via injected repos (DB_QUERY_BOUND); network: none',
    cxConfidence: 'MEDIUM',
    scaleDriver: 'batch size; per-item execution cost',
    bound: 'POTENTIALLY_UNBOUNDED batch size — flagged for R8-E chunking review',
    invariants: ['non-deterministic modes are never marked here (filtered + guarded)', 'completed requires zero failures', 'failed items keep timestamps, batch stays running'],
    edgeCases: 'missing batch throws NOT_FOUND; unsupported items route to markUnsupportedItemDeferred (skip, not fail)',
    failure: 'per-item isolation: one failure cannot fail the sweep; policy block aborts before any write',
    concurrency: 'sequential loop; parallel marking UNRESOLVED (no concurrency here — safe but slow at scale)',
    secPrivacy: 'ASSESSMENT_INTEGRITY sensitive: marking outcomes; audit via repository writes',
    duplication: 'SHARED_CANONICAL_UTILITY pattern for repos (in-memory/prisma twins by design)',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Assessment pipeline sweep; batch-size scaling and per-item cost unmeasured (correctness of mode gating already policy-clear).',
    risks: ['ASSESSMENT_INTEGRITY', 'SCALE_SENSITIVE', 'UNBOUNDED_DATA', 'DATABASE_HOTSPOT_CANDIDATE', 'CPU_HOTSPOT_CANDIDATE'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
  {
    id: 'ALG-mastery-growth-video-effectiveness-score',
    domain: 'mastery',
    logicIds: ['LOGIC-artifacts-api-video-learning-analytics-videolearninganalyticsroutes'],
    linkageKind: 'CURATED_AFFINITY',
    linkageNote: 'Effectiveness scoring serves video-learning analytics consumed by growth reporting; R8-B structural route link UNRESOLVED, domain affinity only.',
    capability: 'Video-effectiveness weighted scoring with learner-count confidence',
    purpose: 'Score whether a video actually improves learning (not just gets watched) and gate continued recommendation.',
    path: 'src/services/videoEffectivenessScoringService.ts',
    symbol: 'calculateScore/scoreVideoEffectiveness',
    lines: '26-52',
    category: 'SCORE_OR_WEIGHTED_SCORE',
    tags: ['AGGREGATION_OR_REDUCTION'],
    implClass: 'PROJECT_HEURISTIC',
    inputs: 'Six rates (open, meaningful-progress, reflection, practice-completion, improvement, no-weakness) + totalLearners.',
    outputs: '{ score 0..1 (2dp), confidence low|medium|high } + shouldContinueRecommending downstream.',
    dataStructures: ['WEIGHTS record (sums to 1.0)', 'scalars'],
    method: 'Convex combination with weights 0.05/0.10/0.15/0.25/0.30/0.15 (improvement dominant; passive open-rate minimal by design); confidence by learner count (<3 low, <10 medium, else high); zero learners short-circuits to 0/low.',
    params: ['WEIGHTS 0.05/0.10/0.15/0.25/0.30/0.15 (NAMED_POLICY_CONSTANT)', 'confidence cutoffs 3/10 learners (INLINE_MAGIC_CONSTANT)'],
    determinism: 'DETERMINISTIC',
    randomness: 'none',
    stateRead: 'aggregated analytics events passed in',
    stateWrite: 'none in unit',
    deps: ['videoLearningAnalyticsContracts (types; internal)'],
    timeCx: 'O(1)',
    spaceCx: 'O(1)',
    ioCx: 'no I/O in unit; aggregation upstream is event-count bounded (UNRESOLVED here)',
    cxConfidence: 'HIGH',
    scaleDriver: 'constant per video scoring call',
    bound: 'BOUNDED output [0,1]',
    invariants: ['weights sum to 1.0 (convex)', 'no data yields 0/low with explicit warnings, never a mid score', 'watch rate alone cannot produce high effectiveness'],
    edgeCases: 'totalLearners=0; all-zero rates',
    failure: 'no failure path (pure); insufficient-data warnings are data',
    concurrency: 'stateless; safe',
    secPrivacy: 'aggregated counts only in unit; no learner rows',
    duplication: 'SINGLE_IMPLEMENTATION',
    baseline: 'UNRESOLVED',
    r8e: 'P1',
    r8eReason: 'Decides which videos keep being recommended; weight quality and confidence cutoffs are heuristic.',
    risks: ['ACADEMIC_CORRECTNESS', 'MAGIC_CONSTANTS'],
    confidence: 'HIGH',
    evidenceKind: 'SOURCE_INSPECTION (this task)',
  },
];

// ---------------------------------------------------------------------------
// Repository IO + evidence search (deterministic, read-only).
// ---------------------------------------------------------------------------

export interface InventoryFile {
  path: string;
  roleTags?: string[];
}

function normalizeRepoPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^(backend|Backend)\//, '');
}

function isProductionSource(p: string): boolean {
  if (!p.endsWith('.ts')) return false;
  if (p.includes('/tests/') || p.includes('__generated__') || p.includes('/dist/')) return false;
  if (p.includes('.test.') || p.includes('.contract.') || p.includes('.spec.')) return false;
  if (p.includes('node_modules')) return false;
  return true;
}

function isTestFile(p: string, roleTags?: string[]): boolean {
  if (!p.endsWith('.ts')) return false;
  if (p.includes('node_modules') || p.includes('/dist/') || p.includes('__generated__')) return false;
  if ((roleTags || []).includes('test') || (roleTags || []).includes('proof_candidate')) return true;
  return p.includes('/tests/') || p.includes('.test.') || p.includes('.contract.') || p.includes('.spec.');
}

function camelToKebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function stemsFor(record: CuratedAlgorithm): string[] {
  const out = new Set<string>();
  const base = record.path.split('/').pop()!.replace(/\.ts$/, '');
  out.add(base);
  out.add(camelToKebab(base));
  out.add(base.toLowerCase());
  for (const part of record.symbol.split('/')) {
    const token = part.replace(/\(.*$/, '').trim();
    if (token && token.length >= 3 && token !== 'anonymous') {
      out.add(token);
      out.add(camelToKebab(token));
    }
  }
  return [...out];
}

export interface TestCorpus {
  files: Array<{ rel: string; content: string }>;
}

export function buildTestCorpus(backendRoot: string, inventoryFiles: InventoryFile[]): TestCorpus {
  const rels = new Set<string>();
  for (const f of inventoryFiles) {
    const rel = normalizeRepoPath(f.path);
    if (isTestFile(rel, f.roleTags)) rels.add(rel);
  }
  const sorted = [...rels].sort();
  const files: Array<{ rel: string; content: string }> = [];
  for (const rel of sorted) {
    const abs = path.join(backendRoot, rel);
    try {
      const stat = fs.statSync(abs);
      if (!stat.isFile() || stat.size > 200 * 1024) continue;
      files.push({ rel, content: fs.readFileSync(abs, 'utf8') });
    } catch {
      continue;
    }
  }
  return { files };
}

/** Classify existing test evidence for a record from the corpus (§25). */
export function findTestEvidence(record: CuratedAlgorithm, corpus: TestCorpus): TestEvidence {
  const stems = stemsFor(record);
  const symbolTokens = record.symbol
    .split('/')
    .map((p) => p.replace(/\(.*$/, '').trim())
    .filter((t) => t.length >= 3);
  const direct: string[] = [];
  const indirect: string[] = [];
  const contractOnly: string[] = [];
  for (const f of corpus.files) {
    const hay = f.content;
    const hitStem = stems.some((s) => hay.includes(s));
    const hitSymbol = symbolTokens.some((t) => hay.includes(t));
    if (!hitStem && !hitSymbol) continue;
    const hasExpect = hay.includes('expect(');
    if (hitSymbol && hasExpect) direct.push(f.rel);
    else if (hitSymbol || hitStem) {
      if (f.rel.includes('.contract.')) contractOnly.push(f.rel);
      else indirect.push(f.rel);
    }
  }
  direct.sort();
  indirect.sort();
  contractOnly.sort();
  if (direct.length > 0) return { kind: 'DIRECT_BEHAVIOR_TEST', refs: direct.slice(0, 5) };
  if (indirect.length > 0) return { kind: 'INDIRECT_INTEGRATION_TEST', refs: indirect.slice(0, 5) };
  if (contractOnly.length > 0) return { kind: 'CONTRACT_ONLY', refs: contractOnly.slice(0, 5) };
  return { kind: 'NO_TEST_EVIDENCE_FOUND', refs: [] };
}

export interface BenchHit {
  rel: string;
  line: number;
}

/** Repository-wide benchmark-mention scan (§26). Evidence only, never measurement. */
export function collectBenchmarkHits(backendRoot: string, inventoryFiles: InventoryFile[]): BenchHit[] {
  const hits: BenchHit[] = [];
  const rels = new Set<string>();
  for (const f of inventoryFiles) {
    const rel = normalizeRepoPath(f.path);
    if (!rel.endsWith('.ts')) continue;
    if (rel.includes('node_modules') || rel.includes('/dist/') || rel.includes('__generated__')) continue;
    rels.add(rel);
  }
  for (const rel of [...rels].sort()) {
    const abs = path.join(backendRoot, rel);
    try {
      const stat = fs.statSync(abs);
      if (!stat.isFile() || stat.size > 200 * 1024) continue;
      const content = fs.readFileSync(abs, 'utf8');
      const lines = content.split('\n');
      lines.forEach((ln, i) => {
        if (/benchmark/i.test(ln)) hits.push({ rel, line: i + 1 });
      });
    } catch {
      continue;
    }
  }
  return hits;
}

export function findBenchmarkEvidence(record: CuratedAlgorithm, hits: BenchHit[]): string {
  const stems = stemsFor(record).map((s) => s.toLowerCase());
  const hit = hits.some((h) => stems.some((s) => h.rel.toLowerCase().includes(s)));
  return hit ? 'BENCHMARK_EVIDENCED' : 'NO_BENCHMARK_EVIDENCE';
}

// ---------------------------------------------------------------------------
// Coverage build.
// ---------------------------------------------------------------------------

export interface AnalyzedFile {
  rel: string;
  signals: Signals;
  functionCount: number;
}

export interface CoverageBuild {
  rows: CoverageRow[];
  analyzed: Map<string, AnalyzedFile>;
  structuralCandidates: Array<{ logicId: string; files: string[]; signals: string[] }>;
}

function signalSummary(s: Signals): string[] {
  const names: Array<[string, number]> = [
    ['loops', s.loops], ['sort', s.sorts], ['filter+map', s.filters + s.maps],
    ['reduce', s.reduces], ['min/max', s.minmax], ['threshold-compare', s.numericCompares],
    ['weighted-arith', s.weightedArith], ['exp/log/pow', s.mathExpLogPow],
    ['clock', s.dateTime], ['random', s.mathRandom + s.randomUUID],
    ['Map/Set', s.mapSetNew], ['hash', s.hashDigest], ['prisma', s.prismaCalls],
    ['raw-sql', s.rawSql], ['switch', s.switches], ['state-tokens', s.stateTokens],
    ['retry-tokens', s.retryTokens], ['idempotency/dedupe', s.idemDedupeTokens],
    ['reconcile', s.reconcileTokens], ['transaction', s.transactions], ['graph', s.graphTokens],
  ];
  return names.filter(([, n]) => n > 0).map(([k, n]) => `${k}×${n}`);
}

export function buildCoverage(
  logics: LogicEntry[],
  backendRoot: string,
  curatedByLogic: Map<string, string[]>,
): CoverageBuild {
  const analyzed = new Map<string, AnalyzedFile>();
  const readFile = (rel: string): AnalyzedFile | null => {
    const cached = analyzed.get(rel);
    if (cached) return cached;
    if (!isProductionSource(rel)) return null;
    const abs = path.join(backendRoot, rel);
    let content: string;
    try {
      const stat = fs.statSync(abs);
      if (!stat.isFile() || stat.size > 500 * 1024) return null;
      content = fs.readFileSync(abs, 'utf8');
    } catch {
      return null;
    }
    const info: AnalyzedFile = {
      rel,
      signals: detectSignals(content),
      functionCount: extractFunctions(content, rel).length,
    };
    analyzed.set(rel, info);
    return info;
  };

  const rows: CoverageRow[] = [];
  const structuralCandidates: CoverageBuild['structuralCandidates'] = [];
  const sorted = [...logics].sort((a, b) => (a.id < b.id ? -1 : 1));
  for (const logic of sorted) {
    const recordIds = curatedByLogic.get(logic.id) || [];
    const candidateRels = [...new Set([...(logic.routeModule ? [logic.routeModule] : []), ...logic.services])].sort();
    const files: AnalyzedFile[] = [];
    for (const rel of candidateRels) {
      const info = readFile(rel);
      if (info) files.push(info);
    }
    const merged = mergeSignals(files.map((f) => f.signals));
    const decision = decideCoverage({
      hasCurated: recordIds.length > 0,
      isUnresolved: !logic.confirmed,
      hasAiDelegation: hasAiDelegation(files.map((f) => f.rel), merged),
      strongSignal: hasStrongSignal(merged),
      analyzedFiles: files.length,
    });
    let reason = decision.reason;
    if (!logic.confirmed && recordIds.length > 0) {
      reason += ` Source-verified procedure(s) ${recordIds.join(', ')} recorded without changing R8-B logic status.`;
    }
    if (!logic.confirmed && files.length === 0) {
      reason += ' (mount origin not statically linked; no analyzable source set)';
    }
    if (logic.confirmed && decision.state === 'UNRESOLVED' && files.length > 0) {
      structuralCandidates.push({
        logicId: logic.id,
        files: files.slice(0, 4).map((f) => f.rel),
        signals: signalSummary(merged).slice(0, 8),
      });
    }
    rows.push({
      logicId: logic.id,
      domain: logic.domain,
      confirmed: logic.confirmed,
      state: decision.state,
      reason,
      analyzedFiles: files.length,
      functionsEvaluated: files.reduce((n, f) => n + f.functionCount, 0),
      recordIds,
    });
  }
  structuralCandidates.sort((a, b) => (a.logicId < b.logicId ? -1 : 1));
  return { rows, analyzed, structuralCandidates };
}

// ---------------------------------------------------------------------------
// Lab + handoff classification (deterministic rules, documented in Method).
// ---------------------------------------------------------------------------

export function labClass(record: CuratedAlgorithm): string {
  if (
    record.implClass === 'STANDARD_METHOD' ||
    record.implClass === 'STANDARD_LIBRARY_DELEGATED' ||
    record.implClass === 'EXTERNAL_LIBRARY_DELEGATED'
  ) {
    return 'STANDARD_METHOD_KEEP';
  }
  if (record.r8e === 'NONE') return 'NO_LAB_VALUE';
  if (record.r8e === 'P2') return 'MEASURE_FIRST';
  if (record.r8e === 'UNRESOLVED') return 'UNRESOLVED';
  return 'LAB_RESEARCH_CANDIDATE';
}

export function handoffFor(record: CuratedAlgorithm): string[] {
  const out = new Set<string>();
  if (/DUPLICATION_CANDIDATE|EXACT_DUPLICATE|PARALLEL_VARIANT/.test(record.duplication)) {
    out.add('DUPLICATION_REVIEW');
  }
  if (record.r8e === 'P0' || record.r8e === 'P1') out.add('PERFORMANCE_MEASUREMENT');
  if (/CONCURRENCY_SENSITIVE|RETRY_IDEMPOTENCY|TIME_SENSITIVE/.test(record.risks.join(' '))) {
    out.add('RELIABILITY_REVIEW');
  }
  if (record.implClass === 'PROJECT_DETERMINISTIC_POLICY' && record.r8e === 'P0') {
    out.add('COMPLETENESS_REVIEW');
  }
  if (out.size === 0) out.add('NONE');
  return [...out].sort();
}

// ---------------------------------------------------------------------------
// Rendering (§38 required format).
// ---------------------------------------------------------------------------

export interface RenderContext {
  fingerprint: string;
  generatedAt: string;
  gitBranch: string | null;
  gitHead: string | null;
  logics: LogicEntry[];
  rows: CoverageRow[];
  analyzed: Map<string, AnalyzedFile>;
  structuralCandidates: Array<{ logicId: string; files: string[]; signals: string[] }>;
  testEvidence: Map<string, TestEvidence>;
  benchKind: Map<string, string>;
  maturity: Map<string, string[]>;
  exactGroups: Array<{ fingerprint: string; members: Array<{ path: string; name: string; line: number }> }>;
  benchHitCount: number;
  testFileCount: number;
}

function esc(s: string): string {
  return s.replace(/\|/g, '\\|');
}

function renderRecord(r: CuratedAlgorithm, ctx: RenderContext): string {
  const te = ctx.testEvidence.get(r.id) || { kind: 'NO_TEST_EVIDENCE_FOUND', refs: [] };
  const bk = ctx.benchKind.get(r.id) || 'NO_BENCHMARK_EVIDENCE';
  const mat = ctx.maturity.get(r.id) || ['SOURCE_CONFIRMED'];
  const L: string[] = [];
  L.push(`### ${r.id}`);
  L.push('');
  L.push(`DOMAIN`);
  L.push('');
  L.push(`${r.domain}`);
  L.push('');
  L.push(`LINKED LOGIC ID(S)`);
  L.push('');
  L.push(`${r.logicIds.join(', ')} (linkage: ${r.linkageKind} — ${r.linkageNote})`);
  L.push('');
  L.push(`CAPABILITY`);
  L.push('');
  L.push(`${r.capability}`);
  L.push('');
  L.push(`PURPOSE / PROBLEM`);
  L.push('');
  L.push(`${r.purpose}`);
  L.push('');
  L.push(`SOURCE`);
  L.push(`- path: \`${r.path}\``);
  L.push(`- symbol: \`${r.symbol}\``);
  L.push(`- relevant lines: ${r.lines}`);
  L.push('');
  L.push(`PRIMARY CATEGORY`);
  L.push('');
  L.push(`${r.category}`);
  L.push('');
  L.push(`SECONDARY TAGS`);
  L.push('');
  L.push(r.tags.length > 0 ? r.tags.join(', ') : 'none');
  L.push('');
  L.push(`IMPLEMENTATION CLASS`);
  L.push('');
  L.push(`${r.implClass}`);
  L.push('');
  L.push(`INPUTS`);
  L.push('');
  L.push(`${r.inputs}`);
  L.push('');
  L.push(`OUTPUTS`);
  L.push('');
  L.push(`${r.outputs}`);
  L.push('');
  L.push(`DATA STRUCTURES`);
  L.push('');
  for (const d of r.dataStructures) L.push(`- ${d}`);
  L.push('');
  L.push(`DECISION / COMPUTATION METHOD`);
  L.push('');
  L.push(`${r.method}`);
  L.push('');
  L.push(`KEY PARAMETERS`);
  L.push(...r.params.map((p) => `- ${p}`));
  L.push('');
  L.push(`DETERMINISM`);
  L.push('');
  L.push(`${r.determinism}`);
  L.push('');
  L.push(`RANDOMNESS / SEED BEHAVIOR`);
  L.push('');
  L.push(`${r.randomness}`);
  L.push('');
  L.push(`STATE READ`);
  L.push('');
  L.push(`${r.stateRead}`);
  L.push('');
  L.push(`STATE WRITE`);
  L.push('');
  L.push(`${r.stateWrite}`);
  L.push('');
  L.push(`EXTERNAL / LIBRARY DEPENDENCIES`);
  L.push(r.deps.length > 0 ? r.deps.map((d) => `- ${d}`).join('\n') : 'none');
  L.push('');
  L.push(`THEORETICAL TIME COMPLEXITY`);
  L.push('');
  L.push(`${r.timeCx}`);
  L.push('');
  L.push(`THEORETICAL SPACE COMPLEXITY`);
  L.push('');
  L.push(`${r.spaceCx}`);
  L.push('');
  L.push(`I/O / DATABASE / NETWORK COMPLEXITY`);
  L.push('');
  L.push(`${r.ioCx}`);
  L.push('');
  L.push(`COMPLEXITY CONFIDENCE`);
  L.push('');
  L.push(`${r.cxConfidence}`);
  L.push('');
  L.push(`SCALE DRIVER`);
  L.push('');
  L.push(`${r.scaleDriver}`);
  L.push('');
  L.push(`BOUND STATUS`);
  L.push('');
  L.push(`${r.bound}`);
  L.push('');
  L.push(`CORRECTNESS INVARIANTS`);
  L.push(...r.invariants.map((v) => `- ${v}`));
  L.push('');
  L.push(`EDGE CASES`);
  L.push('');
  L.push(`${r.edgeCases}`);
  L.push('');
  L.push(`FAILURE BEHAVIOR`);
  L.push('');
  L.push(`${r.failure}`);
  L.push('');
  L.push(`CONCURRENCY / ORDERING ASSUMPTIONS`);
  L.push('');
  L.push(`${r.concurrency}`);
  L.push('');
  L.push(`SECURITY / PRIVACY IMPLICATIONS`);
  L.push('');
  L.push(`${r.secPrivacy}`);
  L.push('');
  L.push(`DUPLICATION / EQUIVALENCE STATUS`);
  L.push('');
  L.push(`${r.duplication}`);
  L.push('');
  L.push(`KNOWN BASELINE`);
  L.push('');
  L.push(`${r.baseline}`);
  L.push('');
  L.push(`PRIOR-ART STATUS`);
  L.push('');
  L.push(NOT_RESEARCHED);
  L.push('');
  L.push(`TEST EVIDENCE`);
  L.push('');
  L.push(`${te.kind}${te.refs.length > 0 ? `: ${te.refs.map((x) => `\`${x}\``).join(', ')}` : ''}`);
  L.push('');
  L.push(`BENCHMARK EVIDENCE`);
  L.push('');
  L.push(`${bk}`);
  L.push('');
  L.push(`MEASURED PERFORMANCE`);
  L.push('');
  L.push(NOT_MEASURED);
  L.push('');
  L.push(`MATURITY EVIDENCE`);
  L.push('');
  L.push(mat.join(', '));
  L.push('');
  L.push(`R8-E BENCHMARK PRIORITY`);
  L.push('');
  L.push(`${r.r8e} — ${r.r8eReason}`);
  L.push('');
  L.push(`RISK FLAGS`);
  L.push('');
  L.push(r.risks.join(', '));
  L.push('');
  L.push(`CONFIDENCE`);
  L.push('');
  L.push(`${r.confidence}`);
  L.push('');
  L.push(`EVIDENCE KIND`);
  L.push('');
  L.push(`${r.evidenceKind}`);
  L.push('');
  return L.join('\n');
}

export function renderRegister(ctx: RenderContext, records: CuratedAlgorithm[]): string {
  const sorted = [...records].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const byId = new Map(sorted.map((r) => [r.id, r]));
  void byId;
  const rows = [...ctx.rows].sort((a, b) => (a.logicId < b.logicId ? -1 : 1));
  const confirmed = rows.filter((r) => r.confirmed);
  const unresolved = rows.filter((r) => !r.confirmed);
  const countState = (s: string) => rows.filter((r) => r.state === s).length;

  const catCount = new Map<string, number>();
  const implCount = new Map<string, number>();
  for (const r of sorted) {
    catCount.set(r.category, (catCount.get(r.category) || 0) + 1);
    implCount.set(r.implClass, (implCount.get(r.implClass) || 0) + 1);
  }
  const priCount = { P0: 0, P1: 0, P2: 0, NONE: 0, UNRESOLVED: 0 };
  for (const r of sorted) priCount[r.r8e] += 1;

  const L: string[] = [];
  L.push('# Backend Algorithm Register');
  L.push('');
  L.push('R8-C evidence-backed register of non-trivial computation inside the Steadfast backend. Truth mapping only: no optimization, no refactoring, no benchmarks, no novelty claims, no dispositions.');
  L.push('');
  L.push('## Baseline');
  L.push('');
  L.push(`- Scanner source fingerprint: \`${ctx.fingerprint}\` (accepted R8-A fingerprint \`${ACCEPTED_SOURCE_FINGERPRINT}\`)`);
  L.push(`- R8-A accepted structural snapshot: files=5398 typescriptFiles=5319 routeModules=134 routeMounts=167 routeEndpoints=3312 prismaModels=432 unresolvedInternalImports=1 cycles=5 findings=9610`);
  L.push(`- Accepted R8-B baseline: data families=17 (15 confirmed), Prisma models=432/432, writer groups=154/154, canonical mutation groups=139, route-surface groups=110, confirmed logic capabilities=103, unresolved logic candidates=7, route modules=134/134, completeness L2=7 L3=99 L4=4`);
  L.push(`- Inventory git: branch=${ctx.gitBranch || 'UNRESOLVED'} head=${ctx.gitHead || 'UNRESOLVED'}`);
  L.push(`- R8-C generated at: ${ctx.generatedAt}`);
  L.push(`- Production source files analyzed: ${ctx.analyzed.size}`);
  L.push(`- Test files scanned for evidence: ${ctx.testFileCount}; benchmark-mention hits repository-wide: ${ctx.benchHitCount}`);
  L.push(`- R8-C scope: classification/understanding only. No production behavior was changed and no finding below carries a final disposition.`);
  L.push('');
  L.push('## Method and Evidence Law');
  L.push('');
  L.push('- Substrate: accepted R8-B confirmed LOGIC IDs with their linked route/service files (05_BACKEND_LOGIC_REGISTER.md); R8-A dependency/structural evidence; R8-B data-family ownership; existing focused tests.');
  L.push('- Source-of-truth hierarchy: (1) production source body, (2) R8-B logic/data ownership, (3) R8-A structural evidence, (4) focused tests, (5) architecture docs, (6) labelled inference. Names alone never prove an algorithm.');
  L.push('- Automated pass: for each confirmed LOGIC, the linked production route module + primary services were read (tests, generated code, dist, node_modules excluded). Per-file signals follow §44 (loops, sort/filter/map/reduce, min/max, threshold compares, weighted arithmetic, exp/log/pow, clock, random, Map/Set, hash, prisma/raw-SQL, switch, state/retry/idempotency/reconcile tokens). Functions were extracted via the TypeScript compiler API for counting and fingerprinting.');
  L.push('- Coverage rule (deterministic, see decideCoverage): curated source-verified link => ALGORITHM_PRESENT; R8-B unresolved => UNRESOLVED (preserved, never upgraded); AI-lane/provider markers (aiGateway-owned paths or provider-SDK import/call shapes; comments, config checks, contract-type imports and labels never count) without backend decision logic => ALGORITHM_DELEGATED; strong signals without inspection => UNRESOLVED structural candidate for R8-D; otherwise NO_DISTINCT_ALGORITHM (a valid finding, not a failure).');
  L.push('- Detailed records: only source-verified curated procedures (30). Structural candidates are listed with file/symbol/signal evidence in Unresolved Algorithms, never promoted without inspection.');
  L.push('- Complexity is theoretical/static only with HIGH/MEDIUM/LOW/UNRESOLVED confidence. Database work is DB_QUERY_BOUND with bounded/unbounded, filter, take/limit, ordering and query counts where visible; query-plan complexity is never inferred from Prisma syntax. Provider work is PROVIDER_BOUND.');
  L.push('- Fingerprints normalize whitespace/comments (sha256, 16 hex) and are duplication evidence only, never final equivalence.');
  L.push('- Test evidence: corpus search for symbol/module references; DIRECT requires symbol + expect() in the same file. Benchmark evidence: repository-wide benchmark-mention scan. Measured performance is uniformly NOT MEASURED IN R8-C.');
  L.push('- Prior art was NOT researched in R8-C; novelty/superiority claims are prohibited and gated.');
  L.push('- The Authentication / Authorization capability is prose-only in R8-B (section-table count 1, no LOGIC header); it is carried as PROSE-authentication-authorization-capability with identical coverage semantics and never invents a LOGIC ID.');
  L.push('');
  L.push('## Coverage Summary');
  L.push('');
  L.push(`- Confirmed R8-B logic capabilities accounted: ${confirmed.length} / ${EXPECTED_CONFIRMED_LOGIC}`);
  L.push(`- Unresolved R8-B logic candidates represented: ${unresolved.length} / ${EXPECTED_UNRESOLVED_LOGIC}`);
  L.push(`- ALGORITHM_PRESENT: ${countState('ALGORITHM_PRESENT')} | NO_DISTINCT_ALGORITHM: ${countState('NO_DISTINCT_ALGORITHM')} | ALGORITHM_DELEGATED: ${countState('ALGORITHM_DELEGATED')} | UNRESOLVED: ${countState('UNRESOLVED')}`);
  L.push(`- Confirmed algorithm records: ${sorted.length} | Structural candidates for R8-D: ${ctx.structuralCandidates.length} | Exact-duplicate fingerprint groups: ${ctx.exactGroups.length}`);
  L.push(`- R8-E queue: P0=${priCount.P0} P1=${priCount.P1} P2=${priCount.P2}`);
  L.push('');
  L.push('Logic ID | Domain | Coverage | Records / Notes');
  L.push('--- | --- | --- | ---');
  for (const r of rows) {
    const rec = r.recordIds.length > 0 ? r.recordIds.join(', ') : '—';
    L.push(`${r.logicId} | ${r.domain} | ${r.state} | ${esc(rec)}`);
  }
  L.push('');
  L.push('## Algorithm Taxonomy');
  L.push('');
  L.push('Primary category distribution (curated records):');
  L.push('');
  for (const [cat, n] of [...catCount.entries()].sort()) L.push(`- ${cat}: ${n}`);
  L.push('');
  L.push('Implementation-class distribution (curated records):');
  L.push('');
  for (const [cls, n] of [...implCount.entries()].sort()) L.push(`- ${cls}: ${n}`);
  L.push('');
  L.push('## Critical Algorithm Index');
  L.push('');
  L.push('Algorithm ID | Domain | Purpose | Category | Source | Complexity | Bound | Risk flags | Test evidence | Benchmark | R8-E');
  L.push('--- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---');
  for (const r of sorted) {
    const te = ctx.testEvidence.get(r.id) || { kind: 'NO_TEST_EVIDENCE_FOUND', refs: [] };
    const bk = ctx.benchKind.get(r.id) || 'NO_BENCHMARK_EVIDENCE';
    L.push(`${r.id} | ${r.domain} | ${esc(r.purpose)} | ${r.category} | \`${r.path}:${r.lines}\` | ${esc(r.timeCx)} (${r.cxConfidence}) | ${esc(r.bound)} | ${esc(r.risks.join('+'))} | ${te.kind} | ${bk} | ${r.r8e}`);
  }
  L.push('');

  const domains: Array<{ heading: string; key: string }> = [
    { heading: '## Authentication / Authorization', key: '__auth__' },
    { heading: '## Learning Core', key: 'learning-core' },
    { heading: '## Memory / Evidence', key: 'memory' },
    { heading: '## Mastery / Objectives / Practice / Revision', key: 'mastery' },
    { heading: '## Artifacts / Media', key: 'artifacts' },
    { heading: '## Curriculum / Assessment / Question Bank', key: 'question-bank' },
    { heading: '## Teacher / School / Administration', key: 'school' },
    { heading: '## Safety / Privacy / Governance', key: 'safety' },
    { heading: '## Operations / Reliability / Observability', key: 'operations' },
    { heading: '## Voice / External Integrations', key: 'voice' },
  ];
  for (const d of domains) {
    L.push(d.heading);
    L.push('');
    if (d.key === '__auth__') {
      L.push('Authentication is enforced mount-globally via schoolAuthMiddleware (R8-A mount evidence) with school-context and role layers; there is no standalone auth LOGIC capability in R8-B. The source-verified procedure is recorded under Safety / Privacy / Governance (ALG-safety-task020-auth-jwt-claim-extract) and referenced here without duplication.');
      L.push('');
      continue;
    }
    const recs = sorted.filter((r) => r.domain === d.key);
    if (recs.length === 0) {
      L.push('No source-verified independent algorithm record in this domain. Evaluated capabilities and their states appear below; unsupported detail is omitted rather than invented.');
      L.push('');
    }
    for (const r of recs) L.push(renderRecord(r, ctx));
    const capRows = rows.filter((x) => x.domain === (d.key === 'school' ? 'school' : d.key));
    if (capRows.length > 0) {
      L.push(`Evaluated capabilities in this domain (${capRows.length}):`);
      L.push('');
      L.push('Logic ID | Coverage | Records');
      L.push('--- | --- | ---');
      for (const c of capRows) {
        L.push(`${c.logicId} | ${c.state} | ${esc(c.recordIds.join(', ') || '—')}`);
      }
      L.push('');
    }
  }

  L.push('## Data Structures and Complexity Hotspots');
  L.push('');
  L.push('Structures observed across records: Array scans, Map/Set membership and dedupe tables, priority/order lookup Records, threshold tables, sliding-window timestamp arrays, FIFO grant orderings, revision-id Sets, ledger/decision accumulators, module-local caches (Map), Prisma relations with take/limit/cursor.');
  L.push('');
  L.push('Algorithm ID | Time | Space | I/O | Confidence | Hotspot flags');
  L.push('--- | --- | --- | --- | --- | ---');
  for (const r of sorted) {
    const hot = r.risks.filter((x) => /HOTSPOT|SCALE_SENSITIVE|UNBOUNDED|CONCURRENCY/.test(x)).join('+') || '—';
    L.push(`${r.id} | ${esc(r.timeCx)} | ${esc(r.spaceCx)} | ${esc(r.ioCx)} | ${r.cxConfidence} | ${esc(hot)}`);
  }
  L.push('');
  L.push('R8-A runtime-state note: module-local Maps/Sets in this register (circuit breakers, rate windows, idempotency store, service cache) are algorithm coordination state, not data ownership; the exhaustive 1,246-allocation enumeration remains 01_BACKEND_SYSTEM_INVENTORY.json.');
  L.push('');

  L.push('## Time-Dependent Algorithms');
  L.push('');
  for (const r of sorted.filter((x) => x.determinism === 'DETERMINISTIC_GIVEN_TIME' || x.determinism === 'RANDOMIZED')) {
    L.push(`- \`${r.id}\` (${r.determinism}): clock source Date.now/new Date (server-local); randomness: ${r.randomness}`);
  }
  L.push('');
  L.push('Timezone assumptions: none visible in inspected units (ISO strings, epoch millis). Deterministic-test clock support: nowMs injectable in circuit-breaker and rate-guard units; other units read the live clock. No time behavior was repaired in R8-C.');
  L.push('');

  L.push('## Database-Bound Algorithms');
  L.push('');
  for (const r of sorted.filter((x) => /database/i.test(x.ioCx))) {
    L.push(`- \`${r.id}\`: ${r.ioCx}`);
  }
  L.push('');
  const prismaFiles = [...ctx.analyzed.values()].filter((f) => f.signals.prismaCalls > 0).length;
  const rawFiles = [...ctx.analyzed.values()].filter((f) => f.signals.rawSql > 0).length;
  L.push(`Analyzer counts over the R8-B-linked source set: files with Prisma calls=${prismaFiles}, files with raw-SQL/transaction markers=${rawFiles}. No query-plan complexity is inferred; all database work is DB_QUERY_BOUND. No pagination, index, or SQL change was made in R8-C.`);
  L.push('');

  L.push('## Retry / Rate-Limit / Concurrency Algorithms');
  L.push('');
  for (const r of sorted.filter((x) => /RETRY|RATE_LIMIT|CIRCUIT_BREAKER|CONCURRENCY|IDEMPOTENCY|PAGINATION/.test(x.category) || /CONCURRENCY_COORDINATION/.test(x.tags.join(' ')))) {
    L.push(`- \`${r.id}\` [${r.category}]: ${r.purpose} (R8-E ${r.r8e})`);
  }
  L.push('');

  L.push('## Duplicate / Parallel Algorithm Candidates');
  L.push('');
  L.push('Exact-duplicate fingerprint groups (normalized bodies, evidence only):');
  L.push('');
  if (ctx.exactGroups.length === 0) {
    L.push('- none found in the analyzed production source set');
  } else {
    L.push(`- ${ctx.exactGroups.length} group(s) total; first 15 shown. Groups are predominantly small route/service helpers (error envelopes, identity extractors); R8-D must separate trivial-helper repetition from algorithmic duplication. All remain candidates; equivalence UNPROVEN.`);
    for (const g of ctx.exactGroups.slice(0, 15)) {
      L.push(`- fp=${g.fingerprint}: ${g.members.map((m) => `\`${m.path}:${m.line} (${m.name})\``).join(', ')} => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)`);
    }
  }
  L.push('');
  L.push('Curated parallel/exact-duplicate assessments (candidates, never verdicts; no consolidation in R8-C):');
  L.push('');
  for (const r of sorted.filter((x) => /CANDIDATE/.test(x.duplication))) {
    L.push(`- \`${r.id}\`: ${r.duplication}`);
  }
  L.push('');
  L.push('R8-B duplication context (05_BACKEND_LOGIC_REGISTER.md gap notes): DUPLICATE_SERVICE_CANDIDATE pairs (task032 canary twin, task034 rollout twin, task033/034/035 review-service triples, diagnostics quad) and inMemory/prisma repository twins (SHARED_BY_DESIGN test doubles) are carried as review input, not re-decided here.');
  L.push('');

  L.push('## External / Library-Delegated Algorithms');
  L.push('');
  L.push('Backend owns the boundary; library internals are not reverse-engineered.');
  L.push('');
  for (const r of sorted.filter((x) => /DELEGATED/.test(x.implClass))) {
    L.push(`- \`${r.id}\` [${r.implClass}]: ${r.purpose} — deps: ${r.deps.join('; ')}`);
  }
  const delegatedCaps = rows.filter((x) => x.state === 'ALGORITHM_DELEGATED');
  if (delegatedCaps.length > 0) {
    L.push('');
    L.push('Capabilities at the EXTERNAL / AI-LANE DECISION BOUNDARY (algorithm decomposition stops here):');
    L.push('');
    for (const c of delegatedCaps) L.push(`- ${c.logicId}: ${esc(c.reason)}`);
  }
  L.push('');

  L.push('## Existing Test and Benchmark Evidence');
  L.push('');
  L.push(`Test corpus: ${ctx.testFileCount} files. Benchmark mentions repository-wide: ${ctx.benchHitCount}.`);
  L.push('');
  const benchFound = [...ctx.benchKind.values()].filter((b) => b === 'BENCHMARK_EVIDENCED').length;
  L.push('Benchmark vocabulary: BENCHMARK_EVIDENCED | NO_BENCHMARK_EVIDENCE. PERFORMANCE_TEST_ONLY would require a located performance harness referencing the unit. '
    + `Repository scan: benchmark evidence for ${benchFound} record(s); all other records are NO_BENCHMARK_EVIDENCE and every measured-performance field is NOT MEASURED IN R8-C.`);
  L.push('');
  L.push('Algorithm ID | Test evidence | Benchmark evidence | Measured | Maturity');
  L.push('--- | --- | --- | --- | ---');
  for (const r of sorted) {
    const te = ctx.testEvidence.get(r.id) || { kind: 'NO_TEST_EVIDENCE_FOUND', refs: [] };
    const bk = ctx.benchKind.get(r.id) || 'NO_BENCHMARK_EVIDENCE';
    const mat = ctx.maturity.get(r.id) || ['SOURCE_CONFIRMED'];
    L.push(`${r.id} | ${te.kind}${te.refs.length > 0 ? ` (${te.refs.length} file(s))` : ''} | ${bk} | ${NOT_MEASURED} | ${mat.join('+')}`);
  }
  L.push('');

  L.push('## Tarzan Algorithm Lab Candidates');
  L.push('');
  L.push('No invention, no novelty, no branding. Classification only: what is worth later measurement and why.');
  L.push('');
  for (const r of sorted) {
    const lab = labClass(r);
    L.push(`- \`${r.id}\` => ${lab}`);
    if (lab === 'LAB_RESEARCH_CANDIDATE') {
      L.push(`  - problem: ${r.purpose}`);
      L.push(`  - current method: ${r.method}`);
      L.push(`  - why measurement may matter: ${r.r8eReason}`);
      L.push(`  - strong known baseline: UNRESOLVED (source does not identify one)`);
      L.push(`  - required future benchmark: ${r.r8eReason}`);
    } else if (lab === 'MEASURE_FIRST') {
      L.push(`  - required future benchmark: ${r.r8eReason}`);
    }
  }
  L.push('');

  L.push('## Unresolved Algorithms');
  L.push('');
  L.push('Preserved R8-B unresolved logic candidates (status NOT upgraded):');
  L.push('');
  L.push('Logic ID | Mount | Note');
  L.push('--- | --- | ---');
  for (const u of unresolved) {
    const logic = ctx.logics.find((x) => x.id === u.logicId);
    const rec = u.recordIds.length > 0 ? ` procedure recorded (${u.recordIds.join(', ')}) without status change` : ' no procedure claimed';
    L.push(`${u.logicId} | ${esc(logic?.mount || 'UNRESOLVED')} | UNRESOLVED CAPABILITY;${rec}`);
  }
  L.push('');
  L.push(`Structural candidates for R8-D review (${ctx.structuralCandidates.length}): signals present, inspection pending.`);
  L.push('');
  if (ctx.structuralCandidates.length > 0) {
    L.push('Logic ID | Top files | Top signals');
    L.push('--- | --- | ---');
    for (const c of ctx.structuralCandidates.slice(0, 40)) {
      L.push(`${c.logicId} | ${esc(c.files.join(', '))} | ${esc(c.signals.join(', '))}`);
    }
    L.push('');
  }
  L.push('Further unknowns carried explicitly (not hidden): provider/library internals behind delegation boundaries; Prisma query-plan complexity; twin-service behavioral divergence (task032/task034 state machines); module-Map growth under burst (rate guard, idempotency store, service cache); multi-instance coherence of process-local limiters/breakers; batch-size bounds for roster and marking sweeps; caller-side corpus sizes for scoring loops.');
  L.push('');

  L.push('## R8-D / R8-E / R8-F Handoff Signals');
  L.push('');
  L.push('Allowed signals only: COMPLETENESS_REVIEW, PERFORMANCE_MEASUREMENT, RELIABILITY_REVIEW, DUPLICATION_REVIEW, STRUCTURAL_CONSOLIDATION_REVIEW, NAMING_REVIEW, DEAD_CODE_REVIEW, NONE. No action is taken in R8-C.');
  L.push('');
  for (const r of sorted) {
    for (const s of handoffFor(r)) {
      L.push(`- SIGNAL: ${s} — ${r.id} (${r.r8e}; ${r.category})`);
    }
  }
  for (const u of unresolved) {
    L.push(`- SIGNAL: COMPLETENESS_REVIEW — ${u.logicId} (UNRESOLVED CAPABILITY)`);
  }
  for (const c of ctx.structuralCandidates.slice(0, 40)) {
    L.push(`- SIGNAL: COMPLETENESS_REVIEW — ${c.logicId} (structural candidate)`);
  }
  L.push('');
  return L.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

function argValue(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

export function run(repoRootArg: string | null): { exitCode: number; errors: string[]; stats: Record<string, unknown> } {
  const errors: string[] = [];
  const fail = (m: string) => errors.push(m);
  const cwd = process.cwd();
  const repoRoot = path.resolve(cwd, repoRootArg || '..');
  const backendRoot = path.join(repoRoot, 'backend');
  const engDir = path.join(backendRoot, 'docs', 'engineering');
  const invPath = path.join(engDir, '01_BACKEND_SYSTEM_INVENTORY.json');
  const regPath = path.join(engDir, '05_BACKEND_LOGIC_REGISTER.md');
  const outPath = path.join(engDir, '06_BACKEND_ALGORITHM_REGISTER.md');

  let inventory: {
    scan: { sourceFingerprint: string; git: { branch: string | null; head: string | null } };
    files: InventoryFile[];
  };
  try {
    inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  } catch (e) {
    return { exitCode: 2, errors: [`cannot read inventory: ${invPath}: ${String(e)}`], stats: {} };
  }
  let registerMd: string;
  try {
    registerMd = fs.readFileSync(regPath, 'utf8');
  } catch (e) {
    return { exitCode: 2, errors: [`cannot read logic register: ${regPath}: ${String(e)}`], stats: {} };
  }

  if (inventory.scan.sourceFingerprint !== ACCEPTED_SOURCE_FINGERPRINT) {
    fail(`source fingerprint mismatch: got ${inventory.scan.sourceFingerprint}, accepted ${ACCEPTED_SOURCE_FINGERPRINT}`);
  }

  const logics = parseLogicRegister(registerMd);
  const prose = deriveProseCapabilities(registerMd, logics);
  const allLogics = [...logics, ...prose].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const confirmedCount = allLogics.filter((l) => l.confirmed).length;
  const unresolvedCount = allLogics.filter((l) => !l.confirmed).length;
  if (confirmedCount !== EXPECTED_CONFIRMED_LOGIC) {
    fail(`confirmed logic count ${confirmedCount} != ${EXPECTED_CONFIRMED_LOGIC}`);
  }
  if (unresolvedCount !== EXPECTED_UNRESOLVED_LOGIC) {
    fail(`unresolved logic count ${unresolvedCount} != ${EXPECTED_UNRESOLVED_LOGIC}`);
  }
  const logicIds = new Set(allLogics.map((l) => l.id));

  // Curated validation: linkage, source evidence, vocab.
  const curatedByLogic = new Map<string, string[]>();
  const seenAlgIds = new Set<string>();
  for (const r of CURATED_ALGORITHMS) {
    if (seenAlgIds.has(r.id)) fail(`duplicate algorithm id: ${r.id}`);
    seenAlgIds.add(r.id);
    for (const lid of r.logicIds) {
      if (!logicIds.has(lid)) fail(`${r.id}: unknown logic id ${lid}`);
      const list = curatedByLogic.get(lid) || [];
      list.push(r.id);
      curatedByLogic.set(lid, list);
    }
    if (!(ALGORITHM_CATEGORIES as readonly string[]).includes(r.category)) fail(`${r.id}: bad category`);
    if (!(IMPLEMENTATION_CLASSES as readonly string[]).includes(r.implClass)) fail(`${r.id}: bad impl class`);
    if (!(COMPLEXITY_CONFIDENCES as readonly string[]).includes(r.cxConfidence)) fail(`${r.id}: bad confidence`);
    if (!(DETERMINISM_VALUES as readonly string[]).includes(r.determinism)) fail(`${r.id}: bad determinism`);
    if (!['P0', 'P1', 'P2', 'NONE', 'UNRESOLVED'].includes(r.r8e)) fail(`${r.id}: bad R8-E priority`);
    if (!/^ALG-[a-z0-9-]+-[a-z0-9-]+-[a-z0-9-]+$/.test(r.id)) fail(`${r.id}: id shape`);
    if (r.risks.length === 0) fail(`${r.id}: risks empty`);
    const abs = path.join(backendRoot, r.path);
    if (!fs.existsSync(abs)) {
      fail(`${r.id}: source missing: ${r.path}`);
      continue;
    }
    const content = fs.readFileSync(abs, 'utf8');
    const symbolTokens = r.symbol
      .split('/')
      .flatMap((p) => p.split('.'))
      .map((t) => t.replace(/\(.*$/, '').trim())
      .filter((t) => t.length >= 2);
    const missing = symbolTokens.filter((t) => !content.includes(t));
    if (missing.length > 0) fail(`${r.id}: symbol(s) not found in ${r.path}: ${missing.join(', ')}`);
  }

  const build = buildCoverage(allLogics, backendRoot, curatedByLogic);
  if (build.rows.length !== allLogics.length) fail('coverage row count mismatch');

  // Duplicate fingerprinting over analyzed production units.
  const units: Array<{ path: string; name: string; line: number; body: string }> = [];
  for (const [rel] of [...build.analyzed.entries()].sort()) {
    try {
      const content = fs.readFileSync(path.join(backendRoot, rel), 'utf8');
      for (const fn of extractFunctions(content, rel)) {
        units.push({ path: rel, name: fn.name, line: fn.line, body: fn.body });
      }
    } catch {
      continue;
    }
  }
  const exactGroups = groupFingerprints(units);

  // Evidence search.
  const corpus = buildTestCorpus(backendRoot, inventory.files || []);
  const benchHits = collectBenchmarkHits(backendRoot, inventory.files || []);
  const testEvidence = new Map<string, TestEvidence>();
  const benchKind = new Map<string, string>();
  const maturity = new Map<string, string[]>();
  for (const r of CURATED_ALGORITHMS) {
    const te = findTestEvidence(r, corpus);
    testEvidence.set(r.id, te);
    const bk = findBenchmarkEvidence(r, benchHits);
    benchKind.set(r.id, bk);
    const mat = ['SOURCE_CONFIRMED'];
    if (te.kind === 'DIRECT_BEHAVIOR_TEST' || te.kind === 'INDIRECT_INTEGRATION_TEST') mat.push('TEST_EVIDENCED');
    if (bk === 'BENCHMARK_EVIDENCED') mat.push('BENCHMARK_EVIDENCED');
    maturity.set(r.id, mat);
  }

  const ctx: RenderContext = {
    fingerprint: inventory.scan.sourceFingerprint,
    generatedAt: new Date().toISOString(),
    gitBranch: inventory.scan.git.branch,
    gitHead: inventory.scan.git.head,
    logics: allLogics,
    rows: build.rows,
    analyzed: build.analyzed,
    structuralCandidates: build.structuralCandidates,
    testEvidence,
    benchKind,
    maturity,
    exactGroups,
    benchHitCount: benchHits.length,
    testFileCount: corpus.files.length,
  };

  const doc = renderRegister(ctx, CURATED_ALGORITHMS);
  const doc2 = renderRegister({ ...ctx, generatedAt: ctx.generatedAt }, CURATED_ALGORITHMS);
  if (doc !== doc2) fail('non-deterministic render');

  for (const s of findMissingSections(doc)) fail(`missing section: ${s}`);
  for (const v of findNoveltyViolations(doc)) fail(`novelty violation: ${v}`);
  const handoffStart = doc.indexOf('## R8-D / R8-E / R8-F Handoff Signals');
  const handoffText = handoffStart >= 0 ? doc.slice(handoffStart) : '';
  for (const v of findHandoffViolations(handoffText)) fail(`handoff violation: ${v}`);

  const stateCount = (s: string) => build.rows.filter((r) => r.state === s).length;
  const functionsEvaluated = [...build.analyzed.values()].reduce((n, f) => n + f.functionCount, 0);
  const catDist: Record<string, number> = {};
  const implDist: Record<string, number> = {};
  for (const r of CURATED_ALGORITHMS) {
    catDist[r.category] = (catDist[r.category] || 0) + 1;
    implDist[r.implClass] = (implDist[r.implClass] || 0) + 1;
  }
  const parallelVariants = CURATED_ALGORITHMS.filter((r) => /PARALLEL_VARIANT|EXACT_DUPLICATE/.test(r.duplication)).length;
  const stats: Record<string, unknown> = {
    sourceFingerprint: inventory.scan.sourceFingerprint,
    backendSourceFilesAnalyzed: build.analyzed.size,
    functionsEvaluated,
    algorithmCandidatesGenerated: build.structuralCandidates.length + CURATED_ALGORITHMS.length,
    confirmedLogicAccounted: `${confirmedCount}/${EXPECTED_CONFIRMED_LOGIC}`,
    unresolvedLogicRepresented: `${unresolvedCount}/${EXPECTED_UNRESOLVED_LOGIC}`,
    confirmedAlgorithms: CURATED_ALGORITHMS.length,
    noDistinctAlgorithm: stateCount('NO_DISTINCT_ALGORITHM'),
    delegatedAlgorithms: stateCount('ALGORITHM_DELEGATED'),
    unresolvedStates: stateCount('UNRESOLVED'),
    presentStates: stateCount('ALGORITHM_PRESENT'),
    categoryDistribution: catDist,
    implementationDistribution: implDist,
    exactDuplicateGroups: exactGroups.length,
    parallelVariantCandidates: parallelVariants,
    p0: CURATED_ALGORITHMS.filter((r) => r.r8e === 'P0').length,
    p1: CURATED_ALGORITHMS.filter((r) => r.r8e === 'P1').length,
    p2: CURATED_ALGORITHMS.filter((r) => r.r8e === 'P2').length,
    bounded: CURATED_ALGORITHMS.filter((r) => !/POTENTIALLY_UNBOUNDED/.test(r.bound)).length,
    potentiallyUnbounded: CURATED_ALGORITHMS.filter((r) => /POTENTIALLY_UNBOUNDED/.test(r.bound)).length,
    databaseBound: CURATED_ALGORITHMS.filter((r) => /database/i.test(r.ioCx)).length,
    timeDependent: CURATED_ALGORITHMS.filter((r) => r.determinism === 'DETERMINISTIC_GIVEN_TIME').length,
    randomized: CURATED_ALGORITHMS.filter((r) => r.determinism === 'RANDOMIZED').length,
    directBehaviorTests: [...testEvidence.values()].filter((t) => t.kind === 'DIRECT_BEHAVIOR_TEST').length,
    indirectTests: [...testEvidence.values()].filter((t) => t.kind === 'INDIRECT_INTEGRATION_TEST').length,
    contractOnly: [...testEvidence.values()].filter((t) => t.kind === 'CONTRACT_ONLY').length,
    noLocatedTests: [...testEvidence.values()].filter((t) => t.kind === 'NO_TEST_EVIDENCE_FOUND').length,
    benchmarkEvidenced: [...benchKind.values()].filter((b) => b === 'BENCHMARK_EVIDENCED').length,
    noBenchmarkEvidence: [...benchKind.values()].filter((b) => b === 'NO_BENCHMARK_EVIDENCE').length,
    productionFilesChanged: 0,
  };

  if (errors.length > 0) return { exitCode: 2, errors, stats };
  try {
    fs.writeFileSync(outPath, doc, 'utf8');
  } catch (e) {
    return { exitCode: 2, errors: [`cannot write register: ${outPath}: ${String(e)}`], stats };
  }
  // Deterministic re-read check: file content must equal rendered doc.
  const reread = fs.readFileSync(outPath, 'utf8');
  if (reread !== doc) return { exitCode: 2, errors: ['post-write content mismatch'], stats };
  return { exitCode: 0, errors: [], stats };
}

const invokedDirectly =
  typeof process !== 'undefined' &&
  !!process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('r8-c-algorithm-register.ts');

if (invokedDirectly) {
  const result = run(argValue('--repo-root'));
  console.log(JSON.stringify(result.stats, null, 2));
  if (result.errors.length > 0) {
    for (const e of result.errors) console.error(`R8-C ERROR: ${e}`);
    process.exit(2);
  }
}
