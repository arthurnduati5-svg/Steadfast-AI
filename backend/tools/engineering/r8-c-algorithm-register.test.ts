/**
 * R8-C focused synthetic tests (§45 test design).
 *
 * All fixtures are synthetic. No test depends on current production defects.
 * Each test maps to a required §45 case (T1..T20); extra regression tests
 * pin the delegation-evidence fix and the prose-capability derivation.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  parseLogicRegister,
  parseSectionTable,
  deriveProseCapabilities,
  detectSignals,
  extractFunctions,
  normalizeBody,
  fingerprintBody,
  extractNumericConstants,
  suggestCategory,
  determinismFor,
  complexityFor,
  decideCoverage,
  hasStrongSignal,
  hasAiDelegation,
  groupFingerprints,
  equivalenceVerdict,
  findNoveltyViolations,
  findHandoffViolations,
  findMissingSections,
  buildCoverage,
  renderRegister,
  REQUIRED_SECTIONS,
  type LogicEntry,
} from './r8-c-algorithm-register';

const CRUD_FIXTURE = `
export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
export function toUserDto(row: any) {
  return { id: row.id, name: row.name };
}
`;

const SCORING_FIXTURE = `
const WEIGHTS = { a: 0.5, b: 0.3, c: 0.2 };
export function scoreItem(features: number[]) {
  let score = 0;
  for (let i = 0; i < features.length; i++) {
    score += features[i] * WEIGHTS.a;
  }
  return Math.round(score * 100) / 100;
}
`;

const RANKING_FIXTURE = `
export function topK(items: Array<{ score: number }>, k: number) {
  const filtered = items.filter((i) => i.score > 0);
  const sorted = filtered.sort((a, b) => b.score - a.score);
  return sorted.slice(0, k);
}
`;

const THRESHOLD_FIXTURE = `
const MAX_ATTEMPTS = 3;
export function decideLevel(attempts: number, ratio: number) {
  if (attempts >= MAX_ATTEMPTS && ratio >= 0.75) return 'secure';
  if (ratio >= 0.5) return 'developing';
  return 'emerging';
}
`;

const RETRY_FIXTURE = `
const BASE = 1000;
export function retryDelay(attempt: number) {
  const backoff = BASE * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 100;
  return Math.min(backoff + jitter, 30000);
}
`;

const DEDUPE_FIXTURE = `
export function dedupeIds(ids: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
`;

const GRAPH_FIXTURE = `
export function reachable(adjacency: Map<string, string[]>, start: string): string[] {
  const visited = new Set<string>();
  const out: string[] = [];
  const stack = [start];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (visited.has(node)) continue;
    visited.add(node);
    out.push(node);
    for (const next of adjacency.get(node) || []) stack.push(next);
  }
  return out;
}
`;

const RANDOM_ASSIGN_FIXTURE = `
export function pickVariant(userId: string) {
  const roll = Math.random();
  return roll < 0.5 ? 'a' : 'b';
}
`;

const TIME_WINDOW_FIXTURE = `
const WINDOW_MS = 60000;
export function isInWindow(ts: number, nowMs: number) {
  return nowMs - ts < WINDOW_MS && Date.now() >= ts;
}
`;

const NESTED_FIXTURE = `
export function pairCount(rows: string[]) {
  let n = 0;
  for (const a of rows) {
    for (const b of rows) {
      if (a === b) n++;
    }
  }
  return n;
}
`;

const DB_READ_FIXTURE = `
export async function listRecent(userId: string) {
  return prisma.event.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
}
`;

const MINI_REGISTER = `
# Backend Logic Register

## Some Section

### LOGIC-demo-api-widget

- DOMAIN: demo
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at \`/api/demo\` (1 mount)
- ENTRY ROUTE(S): \`/api/demo\` via \`demoRoutes\` (direct, src/index.ts:1, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: \`src/routes/demo.ts\`
- PRIMARY SERVICE(S): \`src/services/demoService.ts\`, \`src/services/demoContracts.ts\`
- COMPLETENESS: L3

### LOGIC-demo-api-gadget

- DOMAIN: demo
- CAPABILITY STATUS: UNRESOLVED route-group candidate (no downstream boundary proven; not counted as logic)
- CAPABILITY: HTTP capability group mounted at \`/api/gadget\` (1 mount)
- ENTRY ROUTE(S): \`/api/gadget\` via \`gadgetRoutes\` (factory, src/index.ts:2, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service
- COMPLETENESS: L2
`;

describe('r8-c candidate detection (§45 T1-T11)', () => {
  it('T1: plain CRUD function does NOT become an algorithm', () => {
    const s = detectSignals(CRUD_FIXTURE);
    expect(s.loops).toBe(0);
    expect(s.sorts).toBe(0);
    expect(hasStrongSignal(s)).toBe(false);
    const d = decideCoverage({
      hasCurated: false,
      isUnresolved: false,
      hasAiDelegation: false,
      strongSignal: hasStrongSignal(s),
      analyzedFiles: 1,
    });
    expect(d.state).toBe('NO_DISTINCT_ALGORITHM');
  });

  it('T2: weighted scoring function is detected', () => {
    const s = detectSignals(SCORING_FIXTURE);
    expect(s.loops).toBeGreaterThanOrEqual(1);
    expect(s.weightedArith).toBeGreaterThanOrEqual(1);
    expect(suggestCategory(s)).toBe('SCORE_OR_WEIGHTED_SCORE');
    expect(hasStrongSignal(s)).toBe(true);
  });

  it('T3: score + sort + take is classified as ranking/top-K', () => {
    const s = detectSignals(RANKING_FIXTURE);
    expect(s.sorts).toBe(1);
    expect(s.filters).toBe(1);
    expect(suggestCategory(s)).toBe('RANKING_OR_TOP_K');
  });

  it('T4: threshold decision is captured with constants', () => {
    const s = detectSignals(THRESHOLD_FIXTURE);
    expect(s.numericCompares).toBeGreaterThanOrEqual(2);
    const consts = extractNumericConstants(THRESHOLD_FIXTURE);
    expect(consts.some((c) => c.name === 'MAX_ATTEMPTS' && c.kind === 'NAMED_POLICY_CONSTANT')).toBe(true);
    expect(consts.some((c) => c.kind === 'INLINE_MAGIC_CONSTANT')).toBe(true);
    expect(suggestCategory(s)).toBe('DETERMINISTIC_RULE_SET');
  });

  it('T5: retry/backoff logic is classified correctly', () => {
    const s = detectSignals(RETRY_FIXTURE);
    expect(s.retryTokens).toBeGreaterThanOrEqual(1);
    expect(s.mathRandom).toBe(1);
    expect(s.mathExpLogPow).toBe(1);
    expect(suggestCategory(s)).toBe('RETRY_OR_BACKOFF');
    expect(determinismFor(s)).toBe('RANDOMIZED');
  });

  it('T6: Set/Map dedupe is detected', () => {
    const s = detectSignals(DEDUPE_FIXTURE);
    expect(s.mapSetNew).toBe(1);
    expect(s.loops).toBe(1);
    expect(suggestCategory(s)).toBe('DEDUPLICATION');
  });

  it('T7: graph traversal / visited-set behavior is detectable', () => {
    const s = detectSignals(GRAPH_FIXTURE);
    expect(s.graphTokens).toBeGreaterThanOrEqual(1);
    expect(suggestCategory(s)).toBe('GRAPH_TRAVERSAL');
  });

  it('T8: random assignment records nondeterminism', () => {
    const s = detectSignals(RANDOM_ASSIGN_FIXTURE);
    expect(determinismFor(s)).toBe('RANDOMIZED');
  });

  it('T9: time-window calculation records time dependency', () => {
    const s = detectSignals(TIME_WINDOW_FIXTURE);
    expect(s.dateTime).toBeGreaterThanOrEqual(1);
    expect(determinismFor(s)).toBe('DETERMINISTIC_GIVEN_TIME');
  });

  it('T10: nested iteration receives conservative higher-complexity classification', () => {
    const s = detectSignals(NESTED_FIXTURE);
    expect(s.loops).toBe(2);
    const cx = complexityFor(s);
    expect(cx.time).toBe('O(n²)');
    expect(cx.confidence).toBe('LOW');
  });

  it('T11: database call does not receive invented database Big-O', () => {
    const s = detectSignals(DB_READ_FIXTURE);
    expect(s.prismaCalls).toBeGreaterThanOrEqual(1);
    const cx = complexityFor(s);
    expect(cx.time).toBe('DB_QUERY_BOUND');
    expect(cx.time).not.toMatch(/^O\(/);
  });
});

describe('r8-c equivalence, stability, coverage (§45 T12-T16)', () => {
  it('T12: exact normalized body fingerprint generates an exact-duplicate candidate', () => {
    const a = 'export function nowISO() {\n  // comment\n  return new Date().toISOString();\n}\n'.repeat(4);
    const b = 'export function nowISO() { return   new   Date().toISOString(); }\n'.repeat(4);
    expect(normalizeBody(a)).toBe(normalizeBody(b));
    expect(fingerprintBody(a)).toBe(fingerprintBody(b));
    const groups = groupFingerprints([
      { path: 'src/a.ts', name: 'nowISO', line: 1, body: a },
      { path: 'src/b.ts', name: 'nowISO', line: 5, body: b },
    ]);
    expect(groups.length).toBe(1);
    expect(groups[0].members.length).toBe(2);
  });

  it('T13: name similarity alone does NOT generate an algorithm-equivalence verdict', () => {
    expect(
      equivalenceVerdict({
        sameFingerprint: false,
        sameInputOutputShape: false,
        sameOperationSequence: false,
        sameConstants: false,
        nameSimilarityOnly: true,
      }),
    ).toBe('UNRESOLVED');
    expect(
      equivalenceVerdict({
        sameFingerprint: true,
        sameInputOutputShape: true,
        sameOperationSequence: true,
        sameConstants: true,
        nameSimilarityOnly: false,
      }),
    ).toBe('EXACT_DUPLICATE_CANDIDATE');
  });

  it('T14: stable algorithm IDs and deterministic output ordering are proven', () => {
    const fns = extractFunctions(RANKING_FIXTURE + '\n' + DEDUPE_FIXTURE, 'x.ts');
    const again = extractFunctions(RANKING_FIXTURE + '\n' + DEDUPE_FIXTURE, 'x.ts');
    expect(JSON.stringify(fns)).toBe(JSON.stringify(again));
    const lines = fns.map((f) => f.line);
    expect([...lines].sort((a, b) => a - b)).toEqual(lines);
    expect(fingerprintBody(RANKING_FIXTURE)).toBe(fingerprintBody(RANKING_FIXTURE));
  });

  it('T15: all confirmed LOGIC IDs receive an algorithm coverage state', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r8c-'));
    try {
      fs.mkdirSync(path.join(tmp, 'src', 'routes'), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'src', 'services'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'src', 'routes', 'demo.ts'), 'export const r = 1;\n');
      fs.writeFileSync(path.join(tmp, 'src', 'services', 'demoService.ts'), CRUD_FIXTURE);
      const logics = parseLogicRegister(MINI_REGISTER);
      expect(logics.filter((l) => l.confirmed).length).toBe(1);
      const build = buildCoverage(logics, tmp, new Map());
      expect(build.rows.length).toBe(2);
      for (const row of build.rows) {
        expect(['ALGORITHM_PRESENT', 'NO_DISTINCT_ALGORITHM', 'ALGORITHM_DELEGATED', 'UNRESOLVED']).toContain(row.state);
      }
      const confirmed = build.rows.find((r) => r.logicId === 'LOGIC-demo-api-widget')!;
      expect(confirmed.state).toBe('NO_DISTINCT_ALGORITHM');
      expect(confirmed.analyzedFiles).toBe(2);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('T16: unresolved LOGIC IDs remain unresolved', () => {
    const logics = parseLogicRegister(MINI_REGISTER);
    const unresolved = logics.filter((l) => !l.confirmed);
    expect(unresolved.length).toBe(1);
    expect(unresolved[0].id).toBe('LOGIC-demo-api-gadget');
    // Even a curated link must not upgrade R8-B unresolved status.
    const build = buildCoverage(logics, '/nonexistent-root', new Map([['LOGIC-demo-api-gadget', ['ALG-demo-x']]]));
    const row = build.rows.find((r) => r.logicId === 'LOGIC-demo-api-gadget')!;
    expect(row.state).toBe('UNRESOLVED');
    expect(row.recordIds).toEqual(['ALG-demo-x']);
  });
});

describe('r8-c claims, sections, dispositions (§45 T17-T20)', () => {
  it('T17: benchmark claims remain NOT MEASURED IN R8-C without evidence', () => {
    const doc = renderRegister(
      {
        fingerprint: 'sf-test',
        generatedAt: '2026-01-01T00:00:00.000Z',
        gitBranch: 'main',
        gitHead: 'abc',
        logics: [],
        rows: [],
        analyzed: new Map(),
        structuralCandidates: [],
        testEvidence: new Map(),
        benchKind: new Map(),
        maturity: new Map(),
        exactGroups: [],
        benchHitCount: 0,
        testFileCount: 0,
      },
      [],
    );
    expect(doc).toContain('NOT MEASURED IN R8-C');
    expect(doc).toContain('NO_BENCHMARK_EVIDENCE');
  });

  it('T18: novelty and proprietary claims are prohibited', () => {
    expect(findNoveltyViolations('a novel proprietary optimized Tarzan algorithm, unique and superior')).not.toEqual([]);
    expect(findNoveltyViolations('plain deterministic policy with measured behavior')).toEqual([]);
    expect(findNoveltyViolations('Tarzan Algorithm Lab Candidates')).toEqual([]);
  });

  it('T19: destructive final dispositions are prohibited', () => {
    const bad = '- SIGNAL: COMPLETENESS_REVIEW — x\n- SIGNAL: DELETE_MERGE — y\ncleanup: delete the duplicate\n';
    const hits = findHandoffViolations(bad);
    expect(hits.length).toBeGreaterThan(0);
    const good = '- SIGNAL: COMPLETENESS_REVIEW — x\n- SIGNAL: PERFORMANCE_MEASUREMENT — y\n- SIGNAL: NONE — z\n';
    expect(findHandoffViolations(good)).toEqual([]);
  });

  it('T20: required artifact sections are generated', () => {
    const missing = findMissingSections('# Backend Algorithm Register\n');
    expect(missing.length).toBe(REQUIRED_SECTIONS.length - 1);
    const full = REQUIRED_SECTIONS.join('\n');
    expect(findMissingSections(full)).toEqual([]);
  });
});

describe('r8-c regression guards', () => {
  it('config-key mentions and labels never prove AI-lane delegation', () => {
    const commentOnly = detectSignals('// 5. Pinecone (optional vector/search)\nconst ok = config.hasPineconeKey;\n');
    expect(hasAiDelegation(['src/services/backendDependencyCheckService.ts'], commentOnly)).toBe(false);
    const labelOnly = detectSignals("routedBy: 'aiProviderGateway',\n");
    expect(hasAiDelegation(['src/services/aiGateway/tutorSafeResponseAssembler.ts'], labelOnly)).toBe(true);
    const sdkImport = detectSignals("import OpenAI from 'openai';\n");
    expect(hasAiDelegation(['src/services/recapGenerationService.ts'], sdkImport)).toBe(true);
  });

  it('prose-only R8-B capabilities are derived deterministically without inventing LOGIC IDs', () => {
    const md = 'Section | Capabilities\n--- | ---\nAuthentication / Authorization | 1\n';
    const prose = deriveProseCapabilities(md, []);
    expect(prose.length).toBe(1);
    expect(prose[0].id).toBe('PROSE-authentication-authorization-capability');
    expect(prose[0].id.startsWith('LOGIC-')).toBe(false);
    expect(prose[0].confirmed).toBe(true);
    expect(parseSectionTable(md)).toEqual([{ section: 'Authentication / Authorization', count: 1 }]);
  });

  it('register parsing extracts domains, mounts, route modules and services', () => {
    const logics: LogicEntry[] = parseLogicRegister(MINI_REGISTER);
    expect(logics.map((l) => l.id)).toEqual(['LOGIC-demo-api-gadget', 'LOGIC-demo-api-widget']);
    const widget = logics.find((l) => l.id === 'LOGIC-demo-api-widget')!;
    expect(widget.domain).toBe('demo');
    expect(widget.mount).toBe('/api/demo');
    expect(widget.routeModule).toBe('src/routes/demo.ts');
    expect(widget.services).toContain('src/services/demoService.ts');
  });

  it('curated links outrank automation in coverage decisions', () => {
    const d = decideCoverage({
      hasCurated: true,
      isUnresolved: false,
      hasAiDelegation: true,
      strongSignal: true,
      analyzedFiles: 3,
    });
    expect(d.state).toBe('ALGORITHM_PRESENT');
  });

  it('signal counters count every occurrence (no single-match cap)', () => {
    const s = detectSignals(RETRY_FIXTURE);
    expect(s.retryTokens).toBeGreaterThanOrEqual(3);
    const idem = detectSignals('dedupe a; dedupeKey b; fingerprint c; idempotent d;\n');
    expect(idem.idemDedupeTokens).toBe(4);
    const states = detectSignals('currentState targetState transition stateMachine\n');
    expect(states.stateTokens).toBe(4);
  });
});
