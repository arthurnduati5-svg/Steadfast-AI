/**
 * R8-C focused synthetic tests (§45 test design + R8-C evidence-grounding repair).
 *
 * All fixtures are synthetic. No test depends on current production defects.
 * Each test maps to a required §45 case (T1..T20); T21..T35 prove the grounded
 * test/benchmark evidence repair (same-block invocation+assertion, structural
 * reachability, contract separation, benchmark harness grounding, ordering,
 * and full 30-record classification).
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
  findTestEvidence,
  classifyBenchmarkEvidence,
  parseTestBlocks,
  targetAlternatives,
  CURATED_ALGORITHMS,
  REQUIRED_SECTIONS,
  type LogicEntry,
  type CuratedAlgorithm,
  type TestCorpus,
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

describe('r8-c evidence grounding repair (T21-T35, synthetic fixtures only)', () => {
  function stubRecord(symbol: string, recordPath: string): CuratedAlgorithm {
    return {
      id: 'ALG-synthetic-grounding-probe',
      domain: 'synthetic',
      logicIds: [],
      linkageKind: 'CURATED_AFFINITY',
      linkageNote: 'synthetic',
      capability: 'synthetic',
      purpose: 'synthetic',
      path: recordPath,
      symbol,
      lines: '1-10',
      category: 'DETERMINISTIC_RULE_SET',
      tags: [],
      implClass: 'PROJECT_DETERMINISTIC_POLICY',
      inputs: 'synthetic',
      outputs: 'synthetic',
      dataStructures: [],
      method: 'synthetic',
      params: [],
      determinism: 'DETERMINISTIC',
      randomness: 'none',
      stateRead: 'none',
      stateWrite: 'none',
      deps: [],
      timeCx: 'O(1)',
      spaceCx: 'O(1)',
      ioCx: 'no I/O',
      cxConfidence: 'HIGH',
      scaleDriver: 'synthetic',
      bound: 'BOUNDED',
      invariants: [],
      edgeCases: 'synthetic',
      failure: 'synthetic',
      concurrency: 'synthetic',
      secPrivacy: 'synthetic',
      duplication: 'SINGLE_IMPLEMENTATION',
      baseline: 'UNRESOLVED',
      r8e: 'P2',
      r8eReason: 'synthetic',
      risks: ['MAGIC_CONSTANTS'],
      confidence: 'HIGH',
      evidenceKind: 'SYNTHETIC',
    };
  }

  function corpusOf(files: Array<{ rel: string; content: string }>): TestCorpus {
    return { files };
  }

  it('T21: symbol imported/mentioned + unrelated expect() in same file does NOT become DIRECT', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const content = `import { computeScore } from '../services/scoringService';
import { helperFn } from '../services/helperService';
describe('unrelated', () => {
  it('tests another function', () => {
    const other = helperFn(1);
    expect(other).toBe(1);
  });
});
`;
    const te = findTestEvidence(record, corpusOf([{ rel: 'src/tests/t21-probe.test.ts', content }]));
    expect(te.kind).not.toBe('DIRECT_BEHAVIOR_TEST');
  });

  it('T22: symbol appears only in a comment does not become evidence', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const content = `// computeScore does great things for scoringService
describe('comments', () => {
  it('checks one', () => {
    expect(1).toBe(1);
  });
});
`;
    const blocks = parseTestBlocks(content);
    expect(blocks.length).toBe(1);
    const te = findTestEvidence(record, corpusOf([{ rel: 'src/tests/t22-probe.test.ts', content }]));
    expect(te.kind).toBe('NO_TEST_EVIDENCE_FOUND');
  });

  it('T23: symbol imported but never invoked does not become direct evidence', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const content = `import { computeScore } from '../services/scoringService';
describe('import only', () => {
  it('does something else', () => {
    const x = 1;
    expect(x).toBe(1);
  });
});
`;
    const te = findTestEvidence(record, corpusOf([{ rel: 'src/tests/t23-probe.test.ts', content }]));
    expect(te.kind).not.toBe('DIRECT_BEHAVIOR_TEST');
    expect(te.kind).toBe('NO_TEST_EVIDENCE_FOUND');
  });

  it('T24: direct function invocation + assertion on returned result in same block => DIRECT', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const content = `import { computeScore } from '../services/scoringService';
describe('scoring', () => {
  it('scores the input', () => {
    const result = computeScore({ a: 1 });
    expect(result).toBe(5);
  });
});
`;
    const te = findTestEvidence(record, corpusOf([{ rel: 'src/tests/t24-probe.test.ts', content }]));
    expect(te.kind).toBe('DIRECT_BEHAVIOR_TEST');
    expect(te.refs.length).toBeGreaterThan(0);
    expect(te.refs[0]).toContain('src/tests/t24-probe.test.ts');
    expect(te.refs[0]).toContain('scores the input');
  });

  it('T25: class instance method invocation + assertion in same block => DIRECT', () => {
    const record = stubRecord(
      'MasteryScoringService.deriveMasteryLevel',
      'src/services/masteryScoringService.ts',
    );
    const content = `import { MasteryScoringService } from '../services/masteryScoringService';
describe('mastery', () => {
  it('derives the level', () => {
    const service = new MasteryScoringService();
    const result = service.deriveMasteryLevel(5, 0.9, 0);
    expect(result).toBe('mastered');
  });
});
`;
    const te = findTestEvidence(record, corpusOf([{ rel: 'src/tests/t25-probe.test.ts', content }]));
    expect(te.kind).toBe('DIRECT_BEHAVIOR_TEST');
    expect(te.refs[0]).toContain('derives the level');
  });

  it('singleton receiver imported from the target module + same-block assertion => DIRECT', () => {
    const record = stubRecord(
      'MasteryScoringService.deriveMasteryLevel',
      'src/services/masteryScoringService.ts',
    );
    const content = `import { masteryScoringService } from '../services/masteryScoringService';
describe('mastery singleton', () => {
  it('derives via singleton', () => {
    const level = masteryScoringService.deriveMasteryLevel(8, 7, 1, 0);
    expect(level).toBe('mastered');
  });
});
`;
    const invFiles = [{ path: 'src/services/masteryScoringService.ts' }];
    const te = findTestEvidence(
      record,
      corpusOf([{ rel: 'src/tests/singleton-probe.test.ts', content }]),
      undefined,
      undefined,
      invFiles,
    );
    expect(te.kind).toBe('DIRECT_BEHAVIOR_TEST');
    expect(te.refs[0]).toContain('derives via singleton');
  });

  it('T26: direct invocation in one block and unrelated assertion in another block does NOT become direct', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const content = `import { computeScore } from '../services/scoringService';
describe('split', () => {
  it('invokes without asserting', () => {
    computeScore({ a: 1 });
  });
  it('asserts without invoking', () => {
    expect(1).toBe(1);
  });
});
`;
    const te = findTestEvidence(record, corpusOf([{ rel: 'src/tests/t26-probe.test.ts', content }]));
    expect(te.kind).not.toBe('DIRECT_BEHAVIOR_TEST');
    expect(te.kind).toBe('NO_TEST_EVIDENCE_FOUND');
  });

  it('T27: higher-level invocation + assertion + structural dependency => INDIRECT', () => {
    const record = stubRecord('recommendNextPractice', 'src/services/nextPracticeService.ts');
    const content = `import { runHigher } from '../services/higherService';
describe('flow', () => {
  it('flows through higher service', async () => {
    const out = await runHigher({ x: 1 });
    expect(out.ok).toBe(true);
  });
});
`;
    const prodIndex = new Map<string, string[]>([
      ['src/services/higherService.ts', ['src/services/nextPracticeService.ts']],
      ['src/services/nextPracticeService.ts', []],
    ]);
    const invFiles = [{ path: 'src/services/higherService.ts' }, { path: 'src/services/nextPracticeService.ts' }];
    const te = findTestEvidence(
      record,
      corpusOf([{ rel: 'src/tests/t27-probe.test.ts', content }]),
      prodIndex,
      undefined,
      invFiles,
    );
    expect(te.kind).toBe('INDIRECT_INTEGRATION_TEST');
    expect(te.refs[0]).toContain('flows through higher service');
    expect(te.refs[0]).toContain('nextPracticeService.ts');
  });

  it('T28: higher-level invocation without structural dependency proof does NOT become indirect', () => {
    const record = stubRecord('recommendNextPractice', 'src/services/nextPracticeService.ts');
    const content = `import { runHigher } from '../services/higherService';
describe('flow', () => {
  it('flows without proof', async () => {
    const out = await runHigher({ x: 1 });
    expect(out.ok).toBe(true);
  });
});
`;
    const prodIndex = new Map<string, string[]>([
      ['src/services/higherService.ts', []],
      ['src/services/nextPracticeService.ts', []],
    ]);
    const invFiles = [{ path: 'src/services/higherService.ts' }, { path: 'src/services/nextPracticeService.ts' }];
    const te = findTestEvidence(
      record,
      corpusOf([{ rel: 'src/tests/t28-probe.test.ts', content }]),
      prodIndex,
      undefined,
      invFiles,
    );
    expect(te.kind).not.toBe('INDIRECT_INTEGRATION_TEST');
    expect(te.kind).toBe('NO_TEST_EVIDENCE_FOUND');
  });

  it('T29: contract/static shape assertion => CONTRACT_ONLY, not direct', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const content = `import { computeScore, SCORE_TABLE } from '../services/scoringService';
describe('shape', () => {
  it('exposes the contract', () => {
    expect(typeof computeScore).toBe('function');
    expect(SCORE_TABLE).toMatchObject({ a: expect.any(Number) });
  });
});
`;
    const te = findTestEvidence(record, corpusOf([{ rel: 'src/tests/t29-probe.test.ts', content }]));
    expect(te.kind).toBe('CONTRACT_ONLY');
  });

  it('T30: mere file/stem/name similarity never proves evidence', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const content = `describe('similar names', () => {
  it('checks one', () => {
    expect(1).toBe(1);
  });
});
`;
    const te = findTestEvidence(record, corpusOf([{ rel: 'src/tests/scoring-service.test.ts', content }]));
    expect(te.kind).toBe('NO_TEST_EVIDENCE_FOUND');
  });

  it('T31: comment containing benchmark does not produce BENCHMARK_EVIDENCED', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const files = [
      { rel: 'src/bench/scoring.bench.ts', content: '// benchmark for computeScore\nconst x = 1;\n' },
    ];
    expect(classifyBenchmarkEvidence(record, files)).toBe('NO_BENCHMARK_EVIDENCE');
  });

  it('T32: benchmark file that never invokes target does not produce benchmark evidence', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const files = [
      {
        rel: 'src/bench/scoring.bench.ts',
        content: `import { bench } from 'vitest';
import { otherFn } from '../services/otherService';
bench('other work', () => {
  otherFn(1);
});
`,
      },
    ];
    expect(classifyBenchmarkEvidence(record, files)).toBe('NO_BENCHMARK_EVIDENCE');
  });

  it('T33: actual target invocation inside a supported benchmark harness can produce BENCHMARK_EVIDENCED', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const files = [
      {
        rel: 'src/bench/scoring.bench.ts',
        content: `import { bench } from 'vitest';
import { computeScore } from '../services/scoringService';
bench('scores inputs', () => {
  computeScore({ a: 1 });
});
`,
      },
    ];
    expect(classifyBenchmarkEvidence(record, files)).toBe('BENCHMARK_EVIDENCED');
  });

  it('T34: deterministic evidence ordering and auditable reference rendering', () => {
    const record = stubRecord('computeScore', 'src/services/scoringService.ts');
    const mk = (name: string) => `import { computeScore } from '../services/scoringService';
describe('ordering', () => {
  it('${name}', () => {
    const result = computeScore(1);
    expect(result).toBeDefined();
  });
});
`;
    const corpus = corpusOf([
      { rel: 'src/tests/z-second.test.ts', content: mk('second block') },
      { rel: 'src/tests/a-first.test.ts', content: mk('first block') },
    ]);
    const first = findTestEvidence(record, corpus);
    const second = findTestEvidence(record, corpus);
    expect(first.kind).toBe('DIRECT_BEHAVIOR_TEST');
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.refs.length).toBe(2);
    expect(first.refs[0] < first.refs[1]).toBe(true);
    for (const ref of first.refs) {
      expect(ref).toContain('::"');
      expect(ref).toContain('::L');
    }
    void targetAlternatives;
  });

  it('T35: all 30 curated algorithms receive exactly one final test-evidence classification', () => {
    expect(CURATED_ALGORITHMS.length).toBe(30);
    const kinds = new Set(['DIRECT_BEHAVIOR_TEST', 'INDIRECT_INTEGRATION_TEST', 'CONTRACT_ONLY', 'NO_TEST_EVIDENCE_FOUND']);
    const seen = new Set<string>();
    let direct = 0;
    let indirect = 0;
    let contract = 0;
    let none = 0;
    for (const r of CURATED_ALGORITHMS) {
      expect(seen.has(r.id)).toBe(false);
      seen.add(r.id);
      const te = findTestEvidence(r, { files: [] });
      expect(kinds.has(te.kind)).toBe(true);
      if (te.kind === 'DIRECT_BEHAVIOR_TEST') direct += 1;
      else if (te.kind === 'INDIRECT_INTEGRATION_TEST') indirect += 1;
      else if (te.kind === 'CONTRACT_ONLY') contract += 1;
      else none += 1;
    }
    expect(direct + indirect + contract + none).toBe(30);
  });
});
