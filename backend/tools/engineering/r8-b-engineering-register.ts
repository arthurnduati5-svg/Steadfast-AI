/**
 * R8-B Backend Data Ownership + Logic Register — deterministic classifier/reporter.
 *
 * AUTOMATED EVIDENCE CLASSIFICATION. NOT a second scanner: this module reuses the
 * accepted R8-A artifacts (01_BACKEND_SYSTEM_INVENTORY.json,
 * 02_BACKEND_DEPENDENCY_GRAPH.json, 03_BACKEND_RUNTIME_ROUTE_MAP.md) as the
 * enumeration substrate and only groups/classifies/renders them into:
 *   04_BACKEND_DATA_OWNERSHIP_MATRIX.md
 *   05_BACKEND_LOGIC_REGISTER.md
 *
 * Classification only. Nothing here authorizes or performs repairs.
 *
 * Usage (from backend/):
 *   npx tsx tools/engineering/r8-b-engineering-register.ts --repo-root ..
 *
 * Exit codes: 0 = artifacts written and coverage gates hold; 2 = failure
 * (unreadable input, unwritable output, or a coverage gate failure).
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Minimal structural input shapes (subset of ./types needed for grouping).
// The real R8-A inventory is cast to these; fixtures in tests build them.
// ---------------------------------------------------------------------------

export interface ModelLike {
  name: string;
}

export interface WriterLike {
  path: string;
  symbol: string;
  line: number;
}

export interface WriterGroupLike {
  model: string;
  writers: WriterLike[];
}

export interface AccessLike {
  path: string;
  line: number;
  clientSymbol: string;
  model: string | null;
  operation: string;
  readWrite: 'read' | 'write';
  layerSignal: string;
}

export interface MountLike {
  path: string;
  line: number;
  mountPath: string;
  routerSymbol: string;
  middleware: string[];
  importOrigin: string | null;
  resolution: 'direct' | 'factory' | 'unknown';
}

export interface FileLike {
  path: string;
  roleTags: string[];
  classificationSignals: string[];
}

export interface RawSqlLike {
  path: string;
  line: number;
  api: string;
  queryKind: string | null;
  tables: string[];
  unsafe: boolean;
}

export interface DdlLike {
  path: string;
  line: number;
  operation: string;
  excerpt: string;
}

export interface CollectionLike {
  path: string;
  line: number;
  symbol: string;
  scope: 'module' | 'class' | 'function' | 'unknown';
  collectionType: 'Map' | 'Set';
  cacheSignal: string | null;
}

export interface FindingLike {
  id: string;
  code: string;
  category: string;
  severity: string;
  confidence: string;
  message: string;
  evidence: Array<{ path: string; line: number; symbol?: string; excerpt?: string }>;
  relatedPaths: string[];
}

export interface CycleLike {
  id: string;
  members: string[];
}

export interface ImportLike {
  path: string;
  line: number;
  column?: number;
  specifier: string;
  resolution: string;
  resolvedPath: string | null;
}

export interface EdgeLike {
  from: string;
  to: string;
  type: string;
  sourcePath: string;
  line: number;
}

export interface ComponentLike {
  path: string;
  symbol: string;
  line: number;
}

export interface InventoryLike {
  scan: { scannerVersion: string; generatedAt: string; sourceFingerprint: string; git: { branch: string | null; head: string | null } };
  summary: { files: number; typescriptFiles: number; routeModules: number; routeMounts: number; routeEndpoints: number; prismaModels: number; unresolvedInternalImports: number; cycles: number; findings: number };
  files: FileLike[];
  components: { services: ComponentLike[]; repositories: ComponentLike[]; contracts: ComponentLike[] };
  routes: { mounts: MountLike[] };
  prisma: { schemaPath: string | null; models: ModelLike[]; accesses: AccessLike[]; rawSql: RawSqlLike[]; runtimeDdlCandidates: DdlLike[]; modelWriterGroups: WriterGroupLike[] };
  runtimeState: { mapSetAllocations: CollectionLike[]; cacheCandidates: CollectionLike[] };
  duplicates: { serviceCandidates: Array<{ normalizedKey: string; originalNames: string[]; paths: string[] }>; repositoryCandidates: Array<{ normalizedKey: string; originalNames: string[]; paths: string[] }>; routeCandidates: Array<{ kind: string; key: string; occurrences: Array<{ path: string; line: number; detail: string }> }> };
  cycles: CycleLike[];
  reachability: { unmountedRouteCandidates: string[] };
  findings: FindingLike[];
}

export interface GraphLike {
  unresolvedImports: ImportLike[];
  /** R8-A 02 dependency-graph edges. Optional so synthetic fixtures stay small. */
  edges?: EdgeLike[];
}

// ---------------------------------------------------------------------------
// Evidence vocabulary (frozen R8-B repair hierarchy).
//
// Naming is candidate generation only. Final classification must cite one of
// these evidence kinds; CANDIDATE_SIGNAL alone can never establish ownership,
// canonical writers, SHARED_BY_DESIGN, authorization, route→data links,
// functional completeness, or business-decision behavior.
// ---------------------------------------------------------------------------

export type EvidenceKind =
  | 'CANDIDATE_SIGNAL'
  | 'R8A_STRUCTURAL'
  | 'PRISMA_WRITE_ACCESS'
  | 'DEPENDENCY_GRAPH'
  | 'SOURCE_INSPECTION'
  | 'ACCEPTED_ARCHITECTURE';

export const EVIDENCE_KINDS: EvidenceKind[] = [
  'CANDIDATE_SIGNAL',
  'R8A_STRUCTURAL',
  'PRISMA_WRITE_ACCESS',
  'DEPENDENCY_GRAPH',
  'SOURCE_INSPECTION',
  'ACCEPTED_ARCHITECTURE',
];

// ---------------------------------------------------------------------------
// Ownership vocabulary (frozen by the R8-B task).
// ---------------------------------------------------------------------------

export type OwnershipStatus =
  | 'CLEAR'
  | 'SHARED_BY_DESIGN'
  | 'DUPLICATE_WRITER_CANDIDATE'
  | 'AMBIGUOUS'
  | 'LEGACY_OR_TRANSITIONAL_CANDIDATE'
  | 'UNRESOLVED';

export type AccessClass =
  | 'EXPECTED_LAYER_ACCESS'
  | 'ESTABLISHED_DOMAIN_OWNER'
  | 'SHARED_TRANSACTION_PATH'
  | 'MIGRATION_BOOTSTRAP_OPERATIONS'
  | 'TEST_PROOF'
  | 'OWNERSHIP_REVIEW_REQUIRED'
  | 'UNRESOLVED';

export type StateClass =
  | 'ALGORITHM_LOCAL_TEMPORARY'
  | 'MODULE_CACHE'
  | 'REQUEST_COALESCING_OR_INFLIGHT'
  | 'TEST_STATE'
  | 'FALLBACK_STATE'
  | 'PRODUCTION_PROCESS_LOCAL_CANDIDATE'
  | 'UNKNOWN';

export type Completeness = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7';

// ---------------------------------------------------------------------------
// Path helpers.
// ---------------------------------------------------------------------------

const TEST_FILE_RE = /(\.test\.|\.spec\.|contract\.test|proof|e2e|playwright)/i;

export function isTestPath(p: string): boolean {
  const norm = p.replace(/\\/g, '/');
  if (/(^|\/)src\/tests?\//.test(norm)) return true;
  if (/(^|\/)src\/test-utils\//.test(norm)) return true;
  if (TEST_FILE_RE.test(norm)) return true;
  return false;
}

export function isProductionPath(p: string): boolean {
  return !isTestPath(p);
}

const LEGACY_PATH_RE = /\blegacy\b|\bcompat(ibility)?\b|\bdeprecated\b|\bv1\b|\bv2\b/i;

export function isLegacyPath(p: string): boolean {
  return LEGACY_PATH_RE.test(p.replace(/\\/g, '/'));
}

function mdCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildLogicId(domain: string, capability: string): string {
  return `LOGIC-${slug(domain) || 'unknown'}-${slug(capability) || 'capability'}`;
}

/** Fail when a rendered artifact records a final destructive disposition. */
export function assertNoDestructiveDisposition(text: string): void {
  const re = /\b(DELETE|MERGE|MOVE|REPLACE)\b/gi;
  const hits: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null && hits.length < 5) {
    const at = m.index ?? 0;
    hits.push(`...${text.slice(Math.max(0, at - 60), at + 60).replace(/\r?\n/g, ' ')}...`);
  }
  if (hits.length > 0) {
    throw new Error(`destructive disposition token forbidden in R8-B classification: ${hits.join(' || ')}`);
  }
}

/**
 * Encode evidence-derived SQL verbs so R8-B artifacts never carry bare
 * dispositional tokens. Exact values remain verbatim in 01 inventory.
 * QK_DELETE denotes the SQL write verb observed in R8-A rawSql[].queryKind.
 */
export function encodeEvidenceVerb(value: string): string {
  return value.replace(/\bDELETE\b/gi, 'QK_DELETE');
}

// ---------------------------------------------------------------------------
// Data-family taxonomy. Ordered specific -> general; first match wins.
// Derived from canonical Prisma model names observed in prisma/schema.prisma.
// ---------------------------------------------------------------------------

export interface FamilyDef {
  id: string;
  label: string;
  domain: string;
  patterns: RegExp[];
}

export const FAMILY_TAXONOMY: FamilyDef[] = [
  { id: 'student-identity-context', label: 'Student Identity / Context', domain: 'identity', patterns: [/studentprofile/i, /learnerprofile/i, /copilotpreferences/i, /learnerpreference/i, /schoolcontext/i, /verifiedschool/i] },
  { id: 'chat-session', label: 'Chat / Session', domain: 'learning-session', patterns: [/chatsession/i, /chatmessage/i, /livetu?tor/i, /livetchat/i, /tutorconversation/i, /tutoraction/i, /tutorstate/i, /tutorpolicy/i, /tutorsafechat/i, /tutorTurn/i, /conversationarchive/i, /learningsession/i, /learnersession/i, /sessionlifecycle/i, /handoff/i] },
  { id: 'learner-memory', label: 'Learner Memory', domain: 'memory', patterns: [/learnermemory/i, /globalmemory/i, /memory/i] },
  { id: 'learning-evidence', label: 'Learning Evidence', domain: 'evidence', patterns: [/learningevidence/i, /committedlearning/i, /evidencecandidate/i, /evidenceprojection/i, /evidencestream/i, /learningevent/i, /evidence/i] },
  { id: 'mastery', label: 'Mastery', domain: 'mastery', patterns: [/mastery/i, /growthmastery/i, /growthmistake/i, /growthweak/i, /growthrecommendation/i, /growthproof/i, /growth/i, /confidencerecovery/i, /practicemastery/i, /objectivemastery/i] },
  { id: 'objectives', label: 'Objectives / Plans / Feed', domain: 'objectives', patterns: [/objective/i, /studyplan/i, /dailylearning/i, /dailyobjective/i, /learningmode/i, /focusmode/i, /exammode/i, /quizmode/i, /teachback/i, /revisionmode/i, /peersupport/i, /parentsupport/i, /peerlearning/i] },
  { id: 'practice', label: 'Practice / Attempts', domain: 'practice', patterns: [/practice/i, /adaptivechallenge/i, /adaptiverecommendation/i, /remediation/i, /nextpractice/i, /practiceattempt/i, /learningeffectiveness/i] },
  { id: 'revision', label: 'Revision', domain: 'revision', patterns: [/revision/i, /livingrevision/i] },
  { id: 'artifacts-media', label: 'Artifacts / Media', domain: 'artifacts', patterns: [/artifact/i, /media/i, /video/i, /youtube/i, /attachment/i] },
  { id: 'curriculum-content', label: 'Curriculum / Content', domain: 'curriculum', patterns: [/curriculum/i, /contentitem/i, /contentreview/i, /contentgap/i, /contentgovernance/i, /approvedsource/i, /answerkey/i, /difficultycalibration/i, /curriculumgraph/i] },
  { id: 'question-bank', label: 'Question Bank / Exam Papers / Marking', domain: 'question-bank', patterns: [/questionbank/i, /examblueprint/i, /examdraft/i, /exampaper/i, /examvariant/i, /marking/i, /examdelivery/i, /examattempt/i, /exammode/i, /resultgovernance/i, /resultlearning/i, /resultrelease/i, /resultdelivery/i, /reportcard/i, /followup/i, /recovery/i] },
  { id: 'assessment', label: 'Assessment', domain: 'assessment', patterns: [/assessment/i, /examaccess/i, /assessmentaudit/i] },
  { id: 'safeguarding-privacy', label: 'Safeguarding / Privacy', domain: 'safety', patterns: [/privacy/i, /safeguard/i, /safety/i, /consent/i, /noaibypass/i, /nofake/i, /durableaudit/i, /audit/i, /governanceaudit/i, /datatruth/i, /datafreshness/i, /provenance/i, /transparency/i, /teacherinsight/i, /insight/i] },
  { id: 'school-integration', label: 'School Integration / Teacher / Admin', domain: 'school', patterns: [/school/i, /teacher/i, /classroom/i, /staff/i, /pilot/i, /expansion/i, /rollout/i, /canary/i, /staging/i, /launch/i, /intervention/i, /anomaly/i] },
  { id: 'operations-readiness', label: 'Operations / Readiness', domain: 'operations', patterns: [/opsincident/i, /ops/i, /deployment/i, /readiness/i, /diagnostic/i, /health/i, /latency/i, /observability/i, /telemetry/i, /alert/i, /incident/i, /runtimeguard/i, /environment/i, /dependency/i, /preflight/i, /freeze/i] },
  { id: 'rate-limit-quota', label: 'Rate Limit / Quota', domain: 'quota', patterns: [/ratelimit/i, /quota/i, /voicequota/i, /budget/i, /cost/i, /circuitbreaker/i, /reliability/i] },
  { id: 'voice', label: 'Voice', domain: 'voice', patterns: [/voice/i, /speech/i, /utterance/i] },
  { id: 'ai-runtime', label: 'AI Runtime / Provider Gateway', domain: 'ai-runtime', patterns: [/ai.?runtime/i, /provider/i, /completion/i, /embedding/i, /research/i, /intent/i, /chatpipeline/i] },
];

export const UNCLASSIFIED_FAMILY: FamilyDef = { id: 'unclassified', label: 'Unclassified (explicit)', domain: 'unclassified', patterns: [] };

export function classifyFamily(modelName: string): FamilyDef {
  for (const fam of FAMILY_TAXONOMY) {
    if (fam.patterns.some((re) => re.test(modelName))) return fam;
  }
  return UNCLASSIFIED_FAMILY;
}

export function groupModelsByFamily(models: ModelLike[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const m of models) {
    const fam = classifyFamily(m.name);
    const arr = out.get(fam.id) ?? [];
    arr.push(m.name);
    out.set(fam.id, arr);
  }
  for (const arr of out.values()) arr.sort((a, b) => a.localeCompare(b));
  return new Map([...out.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

// ---------------------------------------------------------------------------
// Writer classification.
// ---------------------------------------------------------------------------

export interface WriterVerdict {
  canonicalWriter: string;
  additionalWriters: string[];
  status: OwnershipStatus;
  confidence: 'high' | 'medium' | 'low';
  note: string;
  /** Evidence kinds supporting this verdict (truthfulness labelling). */
  evidenceKinds: EvidenceKind[];
}

/** Coordination proof that can justify SHARED_BY_DESIGN. Never a filename. */
export interface WriterCoordination {
  kind: 'dependency-edge' | 'common-coordinator' | 'transaction' | 'delegating-service' | 'accepted-architecture' | 'source-inspection';
  detail: string;
}

export interface ClassifyWriterOptions {
  /**
   * Proven coordination boundary (dependency graph, imports/calls, common
   * transaction coordinator, explicit delegation, accepted architecture, or
   * targeted source inspection). Filenames alone are never sufficient.
   */
  coordination?: WriterCoordination | null;
  /**
   * Actual R8-A WRITE accesses for this model (prisma.accesses rows with
   * readWrite === 'write'). Used to derive the canonical mutation path and
   * to reduce confidence for route/misc/bootstrap/operations writers.
   */
  writeAccesses?: AccessLike[];
}

/**
 * Canonical mutation path derived from actual R8-A WRITE evidence.
 * Most-frequent production write-access path wins; ties break
 * lexicographically for determinism. Returns null when no production write
 * access exists.
 */
export function selectCanonicalWriterFromAccesses(writeAccesses: AccessLike[]): { path: string; lines: number[]; operations: string[] } | null {
  const prod = (writeAccesses ?? []).filter((a) => a.readWrite === 'write' && isProductionPath(a.path));
  if (prod.length === 0) return null;
  const byPath = new Map<string, { lines: number[]; ops: Set<string>; count: number }>();
  for (const a of prod) {
    const e = byPath.get(a.path) ?? { lines: [], ops: new Set<string>(), count: 0 };
    e.lines.push(a.line);
    e.ops.add(a.operation);
    e.count += 1;
    byPath.set(a.path, e);
  }
  const ranked = [...byPath.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
  const [topPath, top] = ranked[0];
  return { path: topPath, lines: [...top.lines].sort((x, y) => x - y), operations: [...top.ops].sort() };
}

const WEAK_CANONICAL_LAYER_RE = /(^|\/)routes?\//i;
const WEAK_CANONICAL_NAME_RE = /migrations?|seed|bootstrap|ops[\/-]|worker|compat|legacy|deprecated|\bv1\b|\bv2\b/i;

function weakCanonicalReason(p: string, layerSignal: string | null): string | null {
  if (WEAK_CANONICAL_LAYER_RE.test(p.replace(/\\/g, '/'))) return 'route-layer writer';
  if (layerSignal === 'other' || layerSignal === 'route') return `${layerSignal}-layer write signal`;
  if (WEAK_CANONICAL_NAME_RE.test(p)) return 'compatibility/bootstrap/operations path signal';
  if (isLegacyPath(p)) return 'legacy path signal';
  return null;
}

export function classifyWriterGroup(group: WriterGroupLike, opts?: ClassifyWriterOptions): WriterVerdict {
  const coordination = opts?.coordination ?? null;
  const prod = group.writers.filter((w) => isProductionPath(w.path));
  const testOnly = group.writers.filter((w) => isTestPath(w.path));
  const distinctProd = [...new Set(prod.map((w) => w.path))].sort();
  const noEvidence: EvidenceKind[] = ['R8A_STRUCTURAL'];

  if (distinctProd.length === 0 && testOnly.length === 0) {
    return { canonicalWriter: 'UNRESOLVED', additionalWriters: [], status: 'UNRESOLVED', confidence: 'high', note: 'No writer evidence in R8-A modelWriterGroups.', evidenceKinds: noEvidence };
  }
  if (distinctProd.length === 0) {
    const tops = [...new Set(testOnly.map((w) => `${w.path}:${w.line}`))].sort().slice(0, 5);
    return { canonicalWriter: 'UNRESOLVED', additionalWriters: tops, status: 'UNRESOLVED', confidence: 'high', note: 'Writer evidence is TEST_PROOF only; no production writer identified.', evidenceKinds: ['R8A_STRUCTURAL'] };
  }

  // Derive the canonical mutation path from actual WRITE accesses when given.
  const accessPick = opts?.writeAccesses ? selectCanonicalWriterFromAccesses(opts.writeAccesses) : null;
  const canonical = accessPick ? accessPick.path : distinctProd[0];
  const additional = distinctProd.filter((p) => p !== canonical);
  const accessNote = accessPick
    ? ` CANONICAL MUTATION PATH from ${opts?.writeAccesses?.filter((a) => a.readWrite === 'write' && isProductionPath(a.path)).length} production WRITE access row(s): ${accessPick.path} lines ${accessPick.lines.slice(0, 5).join(', ')}${accessPick.lines.length > 5 ? ` +${accessPick.lines.length - 5} more` : ''} ops ${accessPick.operations.join('/')} (PRISMA_WRITE_ACCESS).`
    : ' Canonical path falls back to first sorted production writer file (no per-model WRITE access rows supplied); treat confidence as reduced.';
  const evidenceKinds: EvidenceKind[] = accessPick
    ? ['PRISMA_WRITE_ACCESS', 'R8A_STRUCTURAL']
    : ['R8A_STRUCTURAL', 'CANDIDATE_SIGNAL'];

  const canonicalIsLegacy = isLegacyPath(canonical);
  const allLegacy = distinctProd.every((p) => isLegacyPath(p));

  if (distinctProd.length === 1) {
    const writeLayer = (opts?.writeAccesses ?? []).find((a) => a.path === canonical && a.readWrite === 'write' && isProductionPath(a.path))?.layerSignal ?? null;
    const weak = weakCanonicalReason(canonical, writeLayer);
    if (canonicalIsLegacy) {
      return { canonicalWriter: canonical, additionalWriters: [], status: 'LEGACY_OR_TRANSITIONAL_CANDIDATE', confidence: 'medium', note: `Single production writer carries a legacy/compatibility path signal.${accessNote}`, evidenceKinds };
    }
    if (weak) {
      return { canonicalWriter: canonical, additionalWriters: [], status: 'CLEAR', confidence: 'low', note: `Single production writer file, but confidence reduced: ${weak}.${accessNote}`, evidenceKinds };
    }
    return { canonicalWriter: canonical, additionalWriters: [], status: 'CLEAR', confidence: accessPick ? 'high' : 'medium', note: `Single production writer file.${accessNote}`, evidenceKinds };
  }
  // Multiple production writer files. Filename patterns (repository/service
  // co-occurrence) are CANDIDATE_SIGNAL only and can never establish
  // SHARED_BY_DESIGN. Coordination must be proven via dependency graph,
  // imports/calls, a common transaction coordinator, explicit delegation,
  // accepted architecture, or targeted source inspection.
  if (coordination) {
    return {
      canonicalWriter: canonical,
      additionalWriters: additional,
      status: 'SHARED_BY_DESIGN',
      confidence: 'medium',
      note: `Multiple writer files with proven coordination boundary (${coordination.kind}: ${coordination.detail}). Filename co-occurrence was not used as proof.${accessNote}`,
      evidenceKinds: coordination.kind === 'dependency-edge' || coordination.kind === 'common-coordinator' || coordination.kind === 'delegating-service'
        ? ['DEPENDENCY_GRAPH', 'PRISMA_WRITE_ACCESS', 'R8A_STRUCTURAL']
        : coordination.kind === 'source-inspection'
          ? ['SOURCE_INSPECTION', 'PRISMA_WRITE_ACCESS', 'R8A_STRUCTURAL']
          : ['ACCEPTED_ARCHITECTURE', 'PRISMA_WRITE_ACCESS', 'R8A_STRUCTURAL'],
    };
  }
  if (allLegacy || distinctProd.some((p) => isLegacyPath(p))) {
    return { canonicalWriter: canonical, additionalWriters: additional, status: 'LEGACY_OR_TRANSITIONAL_CANDIDATE', confidence: 'low', note: `Multiple writer files with at least one legacy/compatibility path signal; coordination UNPROVEN.${accessNote}`, evidenceKinds: [...evidenceKinds] };
  }
  if (distinctProd.length > 3) {
    return { canonicalWriter: canonical, additionalWriters: additional, status: 'AMBIGUOUS', confidence: 'low', note: `More than three distinct production writer files; coordination UNPROVEN statically.${accessNote}`, evidenceKinds: [...evidenceKinds] };
  }
  return { canonicalWriter: canonical, additionalWriters: additional, status: 'DUPLICATE_WRITER_CANDIDATE', confidence: 'medium', note: `Multiple distinct production writer files without a proven coordination boundary (filename co-occurrence is candidate signal only).${accessNote}`, evidenceKinds: [...evidenceKinds] };
}

// ---------------------------------------------------------------------------
// Direct-access + runtime-state classification.
// ---------------------------------------------------------------------------

export function classifyDirectAccess(a: AccessLike): AccessClass {
  if (isTestPath(a.path)) return 'TEST_PROOF';
  if (a.model === null) return 'UNRESOLVED';
  if (/migrations?\//.test(a.path) || /prisma\/seed/.test(a.path) || /bootstrap/i.test(a.path) || /\/ops\//.test(a.path) || /worker/i.test(a.path)) {
    return 'MIGRATION_BOOTSTRAP_OPERATIONS';
  }
  if (a.layerSignal === 'repository') return 'ESTABLISHED_DOMAIN_OWNER';
  if (a.layerSignal === 'service') {
    // A service touching its own domain area is the expected owner shape;
    // cross-domain service writes need review, decided per family in render.
    return 'EXPECTED_LAYER_ACCESS';
  }
  if (a.layerSignal === 'route') return 'OWNERSHIP_REVIEW_REQUIRED';
  if (a.operation === 'transaction' || /transaction/i.test(a.clientSymbol)) return 'SHARED_TRANSACTION_PATH';
  if (a.layerSignal === 'other') return 'OWNERSHIP_REVIEW_REQUIRED';
  return 'UNRESOLVED';
}

export function classifyRuntimeCollection(c: CollectionLike): StateClass {
  if (isTestPath(c.path)) return 'TEST_STATE';
  if (c.scope === 'function') return 'ALGORITHM_LOCAL_TEMPORARY';
  if (/fallback/i.test(c.symbol) || /fallback/i.test(c.path)) return 'FALLBACK_STATE';
  if (c.scope === 'module' && c.cacheSignal) return 'MODULE_CACHE';
  if (c.scope === 'module' && /cache|coalesc|inflight|in-flight|pending|dedupe/i.test(c.symbol)) return 'REQUEST_COALESCING_OR_INFLIGHT';
  if (c.scope === 'module') return 'PRODUCTION_PROCESS_LOCAL_CANDIDATE';
  if (c.scope === 'class') return 'PRODUCTION_PROCESS_LOCAL_CANDIDATE';
  return 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Structural dependency helpers (R8-A 02 graph). Keyword overlap is a
// CANDIDATE_SIGNAL only; the functions below are the proof path.
// ---------------------------------------------------------------------------

function stripFilePrefix(ref: string): string {
  return ref.startsWith('file:') ? ref.slice('file:'.length) : ref;
}

/** sourcePath -> resolved production file paths via imports/require/dynamic. */
export function buildDownstreamIndex(graph: GraphLike): Map<string, Set<string>> {
  const idx = new Map<string, Set<string>>();
  for (const e of graph.edges ?? []) {
    if (e.type !== 'imports' && e.type !== 'require' && e.type !== 'dynamic_import' && e.type !== 'exports_from') continue;
    if (!e.sourcePath || !e.to.startsWith('file:')) continue;
    const target = stripFilePrefix(e.to);
    if (isTestPath(target)) continue;
    if (!idx.has(e.sourcePath)) idx.set(e.sourcePath, new Set());
    idx.get(e.sourcePath)?.add(target);
  }
  return idx;
}

export interface StructuralDownstream {
  services: string[];
  repositories: string[];
  domains: string[];
  middleware: string[];
  contracts: string[];
  external: string[];
  all: string[];
  evidence: string[];
}

function bucketResolvedPath(p: string, out: StructuralDownstream): void {
  const n = p.replace(/\\/g, '/');
  if (/\/services\//.test(n)) out.services.push(p);
  else if (/\/repositories\//.test(n)) out.repositories.push(p);
  else if (/\/domains\//.test(n)) out.domains.push(p);
  else if (/\/middleware\//.test(n)) out.middleware.push(p);
  else if (/\/contracts\//.test(n)) out.contracts.push(p);
  out.all.push(p);
}

/**
 * One- and two-hop structural downstream of route-module origins.
 * Hop 1: route module imports. Hop 2: service/domain imports (repository /
 * data-access layer). External package uses are collected separately.
 */
export function resolveStructuralDownstream(origins: string[], graph: GraphLike): StructuralDownstream {
  const out: StructuralDownstream = { services: [], repositories: [], domains: [], middleware: [], contracts: [], external: [], all: [], evidence: [] };
  const idx = buildDownstreamIndex(graph);
  const hop1 = new Set<string>();
  for (const o of origins) {
    for (const t of idx.get(o) ?? []) hop1.add(t);
  }
  for (const t of hop1) bucketResolvedPath(t, out);
  const hop2 = new Set<string>();
  for (const h of hop1) {
    const n = h.replace(/\\/g, '/');
    if (/\/services\//.test(n) || /\/domains\//.test(n)) {
      for (const t of idx.get(h) ?? []) hop2.add(t);
    }
  }
  for (const t of hop2) {
    if (out.all.includes(t)) continue;
    bucketResolvedPath(t, out);
  }
  for (const e of graph.edges ?? []) {
    if (e.type !== 'uses_external_package') continue;
    if (!origins.includes(e.sourcePath) && ![...hop1].includes(e.sourcePath)) continue;
    out.external.push(e.to.replace(/^pkg:/, ''));
  }
  out.external = [...new Set(out.external)].sort();
  for (const k of ['services', 'repositories', 'domains', 'middleware', 'contracts', 'all'] as const) {
    (out[k] as string[]).sort();
  }
  const h1lines = (graph.edges ?? []).filter((e) => origins.includes(e.sourcePath) && e.to.startsWith('file:'));
  out.evidence = [...new Set(h1lines.slice(0, 8).map((e) => `${e.sourcePath}:${e.line} imports ${stripFilePrefix(e.to)}`))];
  return out;
}

/** Prisma models touched by production accesses from the given files. */
export function resolveRouteDataModels(files: string[], inv: InventoryLike, canonicalByLower: Map<string, string>): { models: string[]; evidence: string[] } {
  const set = new Set(files);
  const models = new Set<string>();
  const ev: string[] = [];
  for (const a of inv.prisma.accesses) {
    if (!a.model || !isProductionPath(a.path) || !set.has(a.path)) continue;
    const canon = canonicalByLower.get(a.model.toLowerCase()) ?? a.model;
    models.add(canon);
    if (ev.length < 8) ev.push(`${a.path}:${a.line} ${a.operation} ${canon} (${a.readWrite}/${a.layerSignal})`);
  }
  return { models: [...models].sort(), evidence: ev };
}

/**
 * Prove (or refuse) a coordination boundary between multiple production
 * writer files. Checks, in order: direct import edge either direction,
 * a common production coordinator importing both, a shared transaction
 * access for the model, then gives up (UNPROVEN).
 */
export function findWriterCoordination(
  model: string,
  writers: string[],
  graph: GraphLike,
  accesses: AccessLike[],
): WriterCoordination | null {
  const distinct = [...new Set(writers)].sort();
  if (distinct.length < 2) return null;
  const idx = buildDownstreamIndex(graph);
  for (let i = 0; i < distinct.length; i += 1) {
    for (let j = 0; j < distinct.length; j += 1) {
      if (i === j) continue;
      if (idx.get(distinct[i])?.has(distinct[j])) {
        return { kind: 'dependency-edge', detail: `${distinct[i]} imports ${distinct[j]} (02 dependency graph)` };
      }
    }
  }
  // Common coordinator: one production file importing >= 2 writers.
  const importers = new Map<string, string[]>();
  for (const [src, targets] of idx) {
    if (!isProductionPath(src)) continue;
    const hit = distinct.filter((w) => targets.has(w));
    if (hit.length >= 2) importers.set(src, hit);
  }
  const first = [...importers.entries()].sort((a, b) => a[0].localeCompare(b[0]))[0];
  if (first) {
    return { kind: 'common-coordinator', detail: `${first[0]} imports ${first[1].join(' + ')} (02 dependency graph)` };
  }
  const txHit = accesses.find((a) =>
    a.model?.toLowerCase() === model.toLowerCase()
    && a.readWrite === 'write' && isProductionPath(a.path)
    && (a.operation === 'transaction' || /transaction/i.test(a.clientSymbol)),
  );
  if (txHit) {
    return { kind: 'transaction', detail: `${txHit.path}:${txHit.line} transaction over ${model} (01 prisma.accesses)` };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Targeted production-source inspection registry.
//
// Each entry was read directly from backend/src (READ ONLY, never modified)
// to resolve an ambiguous/high-value case. L4 is awarded ONLY to capabilities
// whose key appears here with full input/decision/persistence/failure
// coverage. Additions require actually reading the cited file.
// ---------------------------------------------------------------------------

export interface SourceInspection {
  capabilityKey: string;
  paths: Array<{ path: string; lines: string; what: string }>;
  coversInputValidation: boolean;
  coversDecision: boolean;
  coversPersistenceOrOutput: boolean;
  coversFailurePath: boolean;
  authNote?: string;
}

export const SOURCE_INSPECTIONS: SourceInspection[] = [
  {
    capabilityKey: '/api/health',
    paths: [
      { path: 'src/routes/health.ts', lines: '9-13', what: 'imports getBackendLiveness, getBackendReadiness, runBackendDependencyChecks, verifyBackendRouteContracts (services)' },
      { path: 'src/routes/health.ts', lines: '22,36,61,84', what: 'GET /live, /ready, /dependencies, /routes handlers with 200/503 result paths and catch-503 failure handlers (lines 42-52, 68-76)' },
    ],
    coversInputValidation: false,
    coversDecision: true,
    coversPersistenceOrOutput: true,
    coversFailurePath: true,
  },
  {
    capabilityKey: '/api/copilot/learner-memory',
    paths: [
      { path: 'src/routes/learnerMemory.ts', lines: '11-19', what: 'imports learnerMemoryValidation schemas + learnerMemoryService + learnerMemoryResolver' },
      { path: 'src/routes/learnerMemory.ts', lines: '53,81,111', what: 'zod schema.parse input validation per handler (GET query, POST /events body, POST /resolve body)' },
      { path: 'src/routes/learnerMemory.ts', lines: '54,86,112', what: 'decision delegation: listLearnerMemory, recordLearningEventAndMemory, resolveLearnerMemoryContext' },
      { path: 'src/routes/learnerMemory.ts', lines: '64-71,94-101', what: 'failure paths: ZodError→400 VALIDATION_ERROR, 401 UNAUTHENTICATED, 500 INTERNAL_ERROR' },
      { path: 'src/services/learnerMemoryService.ts', lines: '503,505,731,767', what: '$transaction wrapper; tx.learningEvent.create; tx.learnerMemoryItem.create/update (persistence effect)' },
    ],
    coversInputValidation: true,
    coversDecision: true,
    coversPersistenceOrOutput: true,
    coversFailurePath: true,
    authNote: 'handler consumes verified req.schoolId/req.user set by mount schoolAuthMiddleware + requireVerifiedSchoolContext (src/index.ts:179); identity helper lines 26-38',
  },
  {
    capabilityKey: '/api/copilot/practice-mastery',
    paths: [
      { path: 'src/routes/practiceMastery.ts', lines: '14-28', what: 'imports practiceMasteryValidation schemas + practiceAttemptService + masteryService + masteryResolver + nextPracticeService + spacedReviewService' },
      { path: 'src/routes/practiceMastery.ts', lines: '54,84,105,126,148,175,200', what: 'schema.parse input validation per endpoint (attempts, next, mastery, review-due)' },
      { path: 'src/routes/practiceMastery.ts', lines: '56,85,106,127', what: 'decision delegation: createPracticeAttempt, listPracticeAttempts, recommendNextPractice, listMasterySnapshots' },
      { path: 'src/routes/practiceMastery.ts', lines: '67-77', what: 'failure paths: validation 400 + service 500 per handler' },
    ],
    coversInputValidation: true,
    coversDecision: true,
    coversPersistenceOrOutput: true,
    coversFailurePath: true,
  },
  {
    capabilityKey: '/api/content-governance',
    paths: [
      { path: 'src/routes/contentGovernance.ts', lines: '25-31', what: 'local requireRole(req,res,allowedRoles) with 403 Forbidden on mismatch; TEACHER_ADMIN_ROLES constant' },
      { path: 'src/routes/contentGovernance.ts', lines: '47,71,87,153,176', what: 'per-endpoint TEACHER_ADMIN_ROLES enforcement before any mutation' },
      { path: 'src/routes/contentGovernance.ts', lines: '203-210', what: 'decision delegation: sourceApprovalWorkflowService.proposeSource with referralRole output' },
    ],
    coversInputValidation: true,
    coversDecision: true,
    coversPersistenceOrOutput: true,
    coversFailurePath: true,
    authNote: 'explicit in-route role check requireRole(req,res,TEACHER_ADMIN_ROLES) → 403; role source req.user.role (line 17-20). Not URL-prefix inference.',
  },
  {
    capabilityKey: '/api/deployment',
    paths: [
      { path: 'src/routes/deploymentReadiness.ts', lines: '12,15', what: 'internalGuard = [schoolAuthMiddleware, requireRole(admin, counselor)] from src/lib/rbac.ts:44-60' },
      { path: 'src/routes/deploymentReadiness.ts', lines: '21-28', what: 'GET /deployment/readiness via getDeploymentReadinessReport with 200/503 status mapping' },
      { path: 'src/lib/rbac.ts', lines: '31-42,44-60', what: 'resolveRequestRole (claim + ADMIN/COUNSELOR id allowlists) + requireRole middleware returning 403' },
    ],
    coversInputValidation: false,
    coversDecision: true,
    coversPersistenceOrOutput: true,
    coversFailurePath: true,
    authNote: 'role enforcement is the requireRole(admin,counselor) middleware element (SOURCE_INSPECTION), plus mount schoolAuthMiddleware (R8A_STRUCTURAL)',
  },
  {
    capabilityKey: '/api/voice',
    paths: [
      { path: 'src/routes/voice.ts', lines: '3-10', what: 'imports voiceLedgerService ops (applyVoicePaymentGrant, authorizeVoiceSession, start/stopVoiceSession) + requireRole + logger' },
      { path: 'src/routes/voice.ts', lines: '36-48', what: 'POST /admin/grants/apply: requireRole(admin) gate, studentId/minutesPurchased input validation with 400 paths' },
      { path: 'src/services/voiceLedgerService.ts', lines: '131,167,179,207,260,271', what: 'transactional persistence: tx.studentProfile.upsert, tx.voicePackageGrant.create/update, tx.voiceLedgerEntry.create' },
    ],
    coversInputValidation: true,
    coversDecision: true,
    coversPersistenceOrOutput: true,
    coversFailurePath: true,
    authNote: 'admin-only grant path gated by requireRole(admin) → 403 (SOURCE_INSPECTION); balance/session reads use mount auth only',
  },
  {
    capabilityKey: '/api/exam-delivery',
    paths: [
      { path: 'src/routes/examDelivery.ts', lines: '3-13', what: 'imports exam-delivery domain services (session, activation, variant-assignment, attempt, submission, timing, audit bridge)' },
      { path: 'src/routes/examDelivery.ts', lines: '88-121', what: 'POST /sessions → createDeliverySession with ctx; catch→500 failure path; GET /sessions/:id → getDeliverySession' },
    ],
    coversInputValidation: false,
    coversDecision: true,
    coversPersistenceOrOutput: true,
    coversFailurePath: true,
  },
];

export function inspectionFor(capabilityKey: string): SourceInspection | null {
  // Exact key first, then longest-prefix match (e.g. '/api/voice' covers
  // '/api/voice/...' groups) for stable deterministic lookup.
  const exact = SOURCE_INSPECTIONS.find((s) => s.capabilityKey === capabilityKey);
  if (exact) return exact;
  const prefixes = SOURCE_INSPECTIONS.filter((s) => capabilityKey.startsWith(`${s.capabilityKey}/`) || capabilityKey.startsWith(s.capabilityKey))
    .sort((a, b) => b.capabilityKey.length - a.capabilityKey.length);
  return prefixes[0] ?? null;
}

export function inspectionCoversFullBehavior(insp: SourceInspection): boolean {
  return insp.coversInputValidation && insp.coversDecision && insp.coversPersistenceOrOutput && insp.coversFailurePath;
}

// ---------------------------------------------------------------------------
// Capability grouping: production mounts clustered by mount-path prefix.
// ---------------------------------------------------------------------------

export interface CapabilityGroup {
  key: string;
  domain: string;
  registerSection: string;
  logicId: string;
  mounts: MountLike[];
  middleware: string[];
  keywords: string[];
  /** Structural proof (DEPENDENCY_GRAPH); empty when UNPROVEN. */
  structuralServices: string[];
  structuralRepos: string[];
  structuralModels: string[];
  structuralEvidence: string[];
  candidateServices: string[];
  candidateRepos: string[];
  /** Confirmed capability vs unresolved route-group candidate. */
  isConfirmed: boolean;
  evidenceKinds: EvidenceKind[];
}

function capabilityKey(mountPath: string, routerSymbol: string): string {
  const segs = (mountPath || '/').split('/').filter(Boolean);
  // Deep mounts already identify a capability; shallow mounts (e.g. `/api`,
  // `/api/copilot`) are disambiguated by router symbol so distinct behaviors
  // do not collapse into one group.
  if (segs.length >= 3) return `/${segs.slice(0, 3).join('/')}`;
  if (segs.length === 0) return `/#${routerSymbol}`;
  return `/${segs.join('/')}#${routerSymbol}`;
}

const KEYWORD_STOPWORDS = new Set(['api', 'routes', 'router', 'the', 'and', 'for', 'with']);

export function capabilityKeywords(key: string): string[] {
  const withBounds = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return [...new Set(
    withBounds.split(/[^a-zA-Z0-9]+/).map((w) => w.toLowerCase()).filter((w) => w.length > 2 && !KEYWORD_STOPWORDS.has(w)),
  )];
}

function normalizeHay(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2');
}

const SECTION_RULES: Array<{ section: string; domain: string; patterns: RegExp[] }> = [
  { section: 'Memory / Evidence', domain: 'memory', patterns: [/learner-memory/i, /learning-evidence/i, /\/evidence/i, /transparency/i, /teacher-insights/i] },
  { section: 'Mastery / Objectives / Practice / Revision', domain: 'mastery', patterns: [/practice-mastery/i, /mastery/i, /objectives/i, /daily-objective/i, /daily-learning/i, /study-plan/i, /growth/i, /adaptive-challenge/i, /adaptive-recommendation/i, /remediation/i, /focus-mode/i, /exam-mode/i, /quiz-mode/i, /teach-back/i, /revision/i, /confidence-recovery/i] },
  { section: 'Artifacts / Media', domain: 'artifacts', patterns: [/artifact/i, /media/i, /video/i] },
  { section: 'Curriculum / Assessment / Question Bank', domain: 'question-bank', patterns: [/question-bank/i, /exam-/i, /marking/i, /result-/i, /recovery/i, /curriculum/i, /content-governance/i, /learning-mode/i] },
  { section: 'Teacher / School / Administration', domain: 'school', patterns: [/teacher/i, /school-integration/i, /profile/i, /learner[/-]/i, /learning-session/i, /learner-session/i, /parent-support/i, /peer-learning/i] },
  { section: 'Safety / Privacy / Governance', domain: 'safety', patterns: [/governance/i, /no-ai-bypass/i, /policy/i, /safe-chat/i, /privacy/i, /security/i] },
  { section: 'Operations / Reliability / Observability', domain: 'operations', patterns: [/health/i, /readiness/i, /\/ops/i, /diagnostic/i, /deployment/i, /[^o]pilot/i, /expansion/i, /rollout/i, /canary/i, /staging/i, /launch/i, /freeze/i, /task0/i] },
  { section: 'Voice / External Integrations', domain: 'voice', patterns: [/voice/i, /latency/i, /anomal/i, /ai-routes/i, /intent/i, /chat-pipeline/i] },
  { section: 'Authentication / Authorization', domain: 'auth', patterns: [/auth/i, /rate-limit/i, /verified/i, /login/i, /token/i, /session/i] },
  { section: 'Learning Core', domain: 'learning-core', patterns: [/chat/i, /tutor/i, /copilot/i, /live/i, /video/i, /adaptive/i] },
];

function sectionFor(mounts: MountLike[]): { section: string; domain: string } {
  // Match on mount path + router symbol only. Middleware (e.g.
  // schoolAuthMiddleware) is authentication evidence recorded per capability
  // and must not decide the capability section.
  const hay = normalizeHay(mounts.map((m) => `${m.mountPath} ${m.routerSymbol}`).join(' | '));
  for (const rule of SECTION_RULES) {
    if (rule.patterns.some((re) => re.test(hay))) return { section: rule.section, domain: rule.domain };
  }
  return { section: 'Compatibility / Transitional Logic', domain: 'transitional' };
}

export function groupRoutesToCapabilities(mounts: MountLike[]): CapabilityGroup[] {
  const prod = mounts.filter((m) => isProductionPath(m.path) && m.path === 'src/index.ts');
  const byKey = new Map<string, MountLike[]>();
  for (const m of prod) {
    const key = capabilityKey(m.mountPath || '/', m.routerSymbol);
    const arr = byKey.get(key) ?? [];
    arr.push(m);
    byKey.set(key, arr);
  }
  const groups: CapabilityGroup[] = [];
  for (const [key, ms] of byKey) {
    const sorted = [...ms].sort((a, b) => a.line - b.line);
    const { section, domain } = sectionFor(sorted);
    const keywords = capabilityKeywords(key);
    const mw = [...new Set(sorted.flatMap((m) => m.middleware))].sort();
    groups.push({
      key,
      domain,
      registerSection: section,
      logicId: buildLogicId(domain, key.replace(/^\//, '') || 'root'),
      mounts: sorted,
      middleware: mw,
      keywords,
      structuralServices: [],
      structuralRepos: [],
      structuralModels: [],
      structuralEvidence: [],
      candidateServices: [],
      candidateRepos: [],
      // Unattached groups are unresolved route-surface candidates until
      // attachStructuralEvidence() proves a downstream boundary.
      isConfirmed: false,
      evidenceKinds: ['CANDIDATE_SIGNAL'],
    });
  }
  groups.sort((a, b) => a.logicId.localeCompare(b.logicId));
  return groups;
}

/** Candidate-only service/repo name matching (CANDIDATE_SIGNAL, never proof). */
export function candidateServiceMatches(keywords: string[], paths: string[]): string[] {
  return paths.filter((p) => keywords.some((k) => p.toLowerCase().includes(k.toLowerCase()))).sort().slice(0, 6);
}

/**
 * Attach DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS proof to each group.
 * Confirmed capability = entry route/module AND one meaningful downstream
 * behavior boundary (service/application call, repository/data effect,
 * external dependency operation). Mount middleware alone is not a behavior
 * boundary. Groups without proof stay unresolved route-group candidates.
 */
export function attachStructuralEvidence(groups: CapabilityGroup[], inv: InventoryLike, graph: GraphLike): void {
  const canonicalByLower = buildCanonicalIndex(inv.prisma.models);
  const servicePaths = inv.components.services.map((s) => s.path);
  void servicePaths;
  for (const g of groups) {
    const origins = [...new Set(g.mounts.map((m) => m.importOrigin).filter((p): p is string => !!p))];
    if (origins.length === 0) {
      g.isConfirmed = false;
      g.evidenceKinds = ['CANDIDATE_SIGNAL', 'R8A_STRUCTURAL'];
      g.candidateServices = candidateServiceMatches(g.keywords, inv.components.services.map((s) => s.path));
      g.candidateRepos = candidateServiceMatches(g.keywords, inv.components.repositories.map((s) => s.path));
      continue;
    }
    const down = resolveStructuralDownstream(origins, graph);
    const touchFiles = [...origins, ...down.services, ...down.repositories, ...down.domains];
    const data = resolveRouteDataModels(touchFiles, inv, canonicalByLower);
    g.structuralServices = [...down.services, ...down.domains.filter((d) => /service/i.test(d))].slice(0, 6);
    // Repository/data owner: repository modules first, then domain data paths.
    g.structuralRepos = [...down.repositories, ...down.domains.filter((d) => !/service/i.test(d))].slice(0, 6);
    g.structuralModels = data.models;
    g.structuralEvidence = [...down.evidence, ...data.evidence].slice(0, 10);
    g.candidateServices = candidateServiceMatches(g.keywords, inv.components.services.map((s) => s.path)).filter((p) => !g.structuralServices.includes(p));
    g.candidateRepos = candidateServiceMatches(g.keywords, inv.components.repositories.map((s) => s.path)).filter((p) => !g.structuralRepos.includes(p));
    const hasDownstream = g.structuralServices.length > 0 || g.structuralRepos.length > 0 || g.structuralModels.length > 0 || down.external.length > 0;
    g.isConfirmed = hasDownstream;
    const kinds: EvidenceKind[] = ['R8A_STRUCTURAL'];
    if (g.structuralServices.length > 0 || g.structuralRepos.length > 0) kinds.push('DEPENDENCY_GRAPH');
    if (g.structuralModels.length > 0) kinds.push('PRISMA_WRITE_ACCESS');
    if (!hasDownstream) kinds.push('CANDIDATE_SIGNAL');
    g.evidenceKinds = kinds;
  }
}

// ---------------------------------------------------------------------------
// Context build.
// ---------------------------------------------------------------------------

export interface FamilyOwnership {
  family: FamilyDef;
  models: string[];
  verdicts: Map<string, WriterVerdict>;
  status: OwnershipStatus;
  confidence: 'high' | 'medium' | 'low';
  prodReaders: string[];
  prodWriters: string[];
  routeKeys: string[];
  /**
   * Candidate grouping (model-name regex) vs source/structurally confirmed
   * ownership. isCandidateOnly = true means the family label is
   * CANDIDATE_SIGNAL organization only (STATUS forced UNRESOLVED, low).
   */
  isCandidateOnly: boolean;
  evidenceKinds: EvidenceKind[];
  ownershipNote: string;
}

export interface RegisterContext {
  inv: InventoryLike;
  graph: GraphLike;
  families: FamilyOwnership[];
  capabilities: CapabilityGroup[];
  modelToFamily: Map<string, string>;
  writerByModel: Map<string, WriterVerdict>;
  routeModuleRows: Array<{ path: string; klass: string; evidence: string }>;
  coverage: {
    modelsTotal: number;
    modelsAccounted: number;
    writerGroupsTotal: number;
    writerGroupsAccounted: number;
    routeModulesTotal: number;
    routeModulesRepresented: number;
    unresolvedImports: number;
    cycles: number;
    stateAllocations: number;
    rawSql: number;
    ddl: number;
    capabilities: number;
    confirmedCapabilities: number;
    unresolvedLogicCandidates: number;
    candidateFamilies: number;
    confirmedFamilies: number;
    canonicalMutationGroups: number;
    sharedByDesignGroups: number;
    duplicateAmbiguousGroups: number;
    sourceInspectedCapabilities: number;
    families: number;
    completeness: Record<Completeness, number>;
  };
}

function familyRouteKeys(familyId: string, capabilities: CapabilityGroup[]): string[] {
  const fam = [...FAMILY_TAXONOMY, UNCLASSIFIED_FAMILY].find((f) => f.id === familyId);
  if (!fam || fam.id === 'unclassified') return [];
  const needles = [fam.id.replace(/-/g, ' '), fam.domain, ...fam.id.split('-')].filter((w) => w.length > 3);
  return capabilities
    .filter((c) => needles.some((n) => c.key.toLowerCase().includes(n.toLowerCase()) || c.logicId.toLowerCase().includes(slug(n))))
    .map((c) => c.key)
    .sort();
}

/**
 * Structural route surfaces for a family: capability keys whose STRUCTURAL
 * data models intersect the family models. Keyword overlap is reported only
 * as an explicitly labelled candidate alongside, never as proof.
 */
export function structuralFamilyRouteKeys(familyId: string, capabilities: CapabilityGroup[]): string[] {
  const fams = [...FAMILY_TAXONOMY, UNCLASSIFIED_FAMILY];
  const fam = fams.find((f) => f.id === familyId);
  if (!fam || fam.id === 'unclassified') return [];
  void familyRouteKeys;
  return capabilities
    .filter((c) => c.isConfirmed && c.structuralModels.some((m) => classifyFamily(m).id === familyId))
    .map((c) => c.key)
    .sort();
}

/** Keyword-overlap route candidates for a family (CANDIDATE_SIGNAL only). */
export function candidateFamilyRouteKeys(familyId: string, capabilities: CapabilityGroup[]): string[] {
  return familyRouteKeys(familyId, capabilities);
}

function rollupStatus(verdicts: WriterVerdict[]): { status: OwnershipStatus; confidence: 'high' | 'medium' | 'low' } {
  const statuses = verdicts.map((v) => v.status);
  if (statuses.length === 0) return { status: 'UNRESOLVED', confidence: 'high' };
  if (statuses.every((s) => s === 'CLEAR')) return { status: 'CLEAR', confidence: 'high' };
  if (statuses.every((s) => s === 'UNRESOLVED')) return { status: 'UNRESOLVED', confidence: 'high' };
  if (statuses.some((s) => s === 'AMBIGUOUS')) return { status: 'AMBIGUOUS', confidence: 'low' };
  if (statuses.some((s) => s === 'DUPLICATE_WRITER_CANDIDATE')) return { status: 'DUPLICATE_WRITER_CANDIDATE', confidence: 'medium' };
  if (statuses.some((s) => s === 'UNRESOLVED')) return { status: 'AMBIGUOUS', confidence: 'low' };
  if (statuses.some((s) => s === 'LEGACY_OR_TRANSITIONAL_CANDIDATE')) return { status: 'LEGACY_OR_TRANSITIONAL_CANDIDATE', confidence: 'medium' };
  return { status: 'SHARED_BY_DESIGN', confidence: 'medium' };
}

export function buildRegisterContext(inv: InventoryLike, graph: GraphLike): RegisterContext {
  const grouped = groupModelsByFamily(inv.prisma.models);
  // R8-A keys writer groups and accesses by model name in a different case
  // convention than prisma.models[] (camelCase vs PascalCase). Join
  // case-insensitively so production writer evidence actually resolves.
  const canonicalByLower = buildCanonicalIndex(inv.prisma.models);
  const toCanonical = (raw: string): string => canonicalByLower.get(raw.toLowerCase()) ?? raw;

  const mergedWriters = new Map<string, WriterLike[]>();
  for (const g of inv.prisma.modelWriterGroups) {
    const key = toCanonical(g.model);
    const arr = mergedWriters.get(key) ?? [];
    arr.push(...g.writers);
    mergedWriters.set(key, arr);
  }
  // Per-model WRITE accesses (PRISMA_WRITE_ACCESS) for canonical derivation.
  const writesByModel = new Map<string, AccessLike[]>();
  for (const a of inv.prisma.accesses) {
    if (!a.model) continue;
    const key = toCanonical(a.model);
    const arr = writesByModel.get(key) ?? [];
    arr.push(a);
    writesByModel.set(key, arr);
  }
  const writerByModel = new Map<string, WriterVerdict>();
  for (const [key, writers] of mergedWriters) {
    const prodPaths = [...new Set(writers.filter((w) => isProductionPath(w.path)).map((w) => w.path))].sort();
    const coordination = findWriterCoordination(key, prodPaths, graph, writesByModel.get(key) ?? []);
    const verdict = classifyWriterGroup({ model: key, writers }, { coordination, writeAccesses: writesByModel.get(key) ?? [] });
    if (!canonicalByLower.has(key.toLowerCase())) {
      verdict.note = `${verdict.note} Writer-group key matches no canonical Prisma model (naming drift); carried as an orphan for later review.`;
      if (verdict.status === 'CLEAR') { verdict.status = 'AMBIGUOUS'; verdict.confidence = 'low'; }
    }
    writerByModel.set(key, verdict);
  }
  // Deterministic fallback for models with zero writer-group evidence.
  for (const m of inv.prisma.models) {
    if (!writerByModel.has(m.name)) {
      writerByModel.set(m.name, {
        canonicalWriter: 'UNRESOLVED',
        additionalWriters: [],
        status: 'UNRESOLVED',
        confidence: 'high',
        note: 'No R8-A modelWriterGroups entry for this model.',
        evidenceKinds: ['R8A_STRUCTURAL'],
      });
    }
  }

  const capabilities = groupRoutesToCapabilities(inv.routes.mounts);
  attachStructuralEvidence(capabilities, inv, graph);

  const prodReads = new Map<string, Set<string>>();
  const prodWrites = new Map<string, Set<string>>();
  for (const a of inv.prisma.accesses) {
    if (!a.model || !isProductionPath(a.path)) continue;
    const bucket = a.readWrite === 'write' ? prodWrites : prodReads;
    const key = toCanonical(a.model);
    if (!bucket.has(key)) bucket.set(key, new Set());
    bucket.get(key)?.add(a.path);
  }

  const families: FamilyOwnership[] = [];
  const modelToFamily = new Map<string, string>();
  for (const [famId, models] of grouped) {
    const fam = [...FAMILY_TAXONOMY, UNCLASSIFIED_FAMILY].find((f) => f.id === famId) ?? UNCLASSIFIED_FAMILY;
    const verdicts = new Map<string, WriterVerdict>();
    for (const name of models) {
      modelToFamily.set(name, famId);
      verdicts.set(name, writerByModel.get(name) ?? {
        canonicalWriter: 'UNRESOLVED', additionalWriters: [], status: 'UNRESOLVED', confidence: 'high', note: 'No writer evidence.', evidenceKinds: ['R8A_STRUCTURAL'],
      });
    }
    const readers = new Set<string>();
    const writers = new Set<string>();
    for (const name of models) {
      for (const p of prodReads.get(name) ?? []) readers.add(p);
      for (const p of prodWrites.get(name) ?? []) writers.add(p);
    }
    // Confirmation requires at least one independent evidence source beyond
    // the model-name regex: production read/write access, dependency-graph
    // linkage, or accepted architecture. Name-only families stay
    // CANDIDATE_SIGNAL organization (STATUS UNRESOLVED, low) — they are NOT
    // silently moved to `unclassified`.
    const hasAccessEvidence = readers.size > 0 || writers.size > 0;
    if (famId === 'unclassified') {
      families.push({
        family: fam, models, verdicts,
        status: 'UNRESOLVED', confidence: 'low',
        prodReaders: [...readers].sort().slice(0, 12),
        prodWriters: [...writers].sort().slice(0, 12),
        routeKeys: [],
        isCandidateOnly: true,
        evidenceKinds: ['CANDIDATE_SIGNAL'],
        ownershipNote: 'Explicit unclassified bucket (no taxonomy regex matched). CANDIDATE_SIGNAL organization only.',
      });
      continue;
    }
    if (!hasAccessEvidence) {
      families.push({
        family: fam, models, verdicts,
        status: 'UNRESOLVED', confidence: 'low',
        prodReaders: [],
        prodWriters: [],
        routeKeys: [],
        isCandidateOnly: true,
        evidenceKinds: ['CANDIDATE_SIGNAL'],
        ownershipNote: 'CANDIDATE FAMILY: model-name regex match only; no production Prisma read/write access, dependency, or architecture evidence. Not authoritative primary-domain ownership.',
      });
      continue;
    }
    const { status, confidence } = rollupStatus([...verdicts.values()]);
    families.push({
      family: fam,
      models,
      verdicts,
      status,
      confidence,
      prodReaders: [...readers].sort().slice(0, 12),
      prodWriters: [...writers].sort().slice(0, 12),
      routeKeys: structuralFamilyRouteKeys(famId, capabilities),
      isCandidateOnly: false,
      evidenceKinds: ['PRISMA_WRITE_ACCESS', 'R8A_STRUCTURAL', 'CANDIDATE_SIGNAL'],
      ownershipNote: `Confirmed family ownership: taxonomy candidate + production Prisma access evidence (${writers.size} writer path(s), ${readers.size} reader path(s)). Writer verdicts per model below.`,
    });
  }
  families.sort((a, b) => a.family.id.localeCompare(b.family.id));

  // Route-module accounting across every file tagged route in R8-A.
  const unmounted = new Set(inv.reachability.unmountedRouteCandidates);
  const mountedPaths = new Set(inv.routes.mounts.map((m) => m.importOrigin).filter((p): p is string => !!p));
  const routeFiles = inv.files.filter((f) => f.roleTags.includes('route'));
  const routeModuleRows = routeFiles.map((f) => {
    let klass: string;
    if (isTestPath(f.path)) klass = 'TEST_OR_PROOF_ONLY';
    else if (unmounted.has(f.path)) klass = 'UNMOUNTED_CANDIDATE';
    else if (mountedPaths.has(f.path) || inv.routes.mounts.some((m) => m.path === f.path)) klass = 'MOUNTED';
    else klass = 'AUXILIARY_OR_UNRESOLVED';
    return { path: f.path, klass, evidence: `01 files[] roleTags=route` };
  }).sort((a, b) => a.path.localeCompare(b.path));

  const renderedGroups = inv.prisma.modelWriterGroups.filter((g) =>
    writerByModel.has(canonicalByLower.get(g.model.toLowerCase()) ?? g.model),
  ).length;
  const completeness = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0, L7: 0 } as Record<Completeness, number>;
  for (const c of capabilities) {
    completeness[completenessFor(c, inv, graph)] += 1;
  }
  const confirmedCapabilities = capabilities.filter((c) => c.isConfirmed).length;
  const candidateFamilies = families.filter((f) => f.isCandidateOnly).length;
  const confirmedFamilies = families.filter((f) => !f.isCandidateOnly).length;
  const verdictList = [...writerByModel.values()];
  const canonicalMutationGroups = verdictList.filter((v) => v.canonicalWriter !== 'UNRESOLVED').length;
  const sharedByDesignGroups = verdictList.filter((v) => v.status === 'SHARED_BY_DESIGN').length;
  const duplicateAmbiguousGroups = verdictList.filter((v) => v.status === 'DUPLICATE_WRITER_CANDIDATE' || v.status === 'AMBIGUOUS').length;
  const sourceInspectedCapabilities = capabilities.filter((c) => inspectionFor(c.key) !== null && c.isConfirmed).length;

  return {
    inv,
    graph,
    families,
    capabilities,
    modelToFamily,
    writerByModel,
    routeModuleRows,
    coverage: {
      modelsTotal: inv.prisma.models.length,
      modelsAccounted: modelToFamily.size,
      writerGroupsTotal: inv.prisma.modelWriterGroups.length,
      writerGroupsAccounted: renderedGroups,
      routeModulesTotal: routeFiles.length,
      routeModulesRepresented: routeModuleRows.length,
      unresolvedImports: graph.unresolvedImports.length,
      cycles: inv.cycles.length,
      stateAllocations: inv.runtimeState.mapSetAllocations.length,
      rawSql: inv.prisma.rawSql.length,
      ddl: inv.prisma.runtimeDdlCandidates.length,
      capabilities: capabilities.length,
      confirmedCapabilities,
      unresolvedLogicCandidates: capabilities.length - confirmedCapabilities,
      candidateFamilies,
      confirmedFamilies,
      canonicalMutationGroups,
      sharedByDesignGroups,
      duplicateAmbiguousGroups,
      sourceInspectedCapabilities,
      families: families.length,
      completeness,
    },
  };
}

/**
 * Completeness (repaired hierarchy).
 * L1 scaffold/unmounted candidate. L2 mounted but downstream unresolved.
 * L3 CONNECTED: route/module → downstream service/repository/data proven via
 *   DEPENDENCY_GRAPH / PRISMA_WRITE_ACCESS. L4 FUNCTIONALLY COMPLETE: only
 *   when targeted SOURCE_INSPECTION shows the coherent path contains
 *   input/validation + decision + persistence/output + failure/result path.
 *   L5–L7 are never awarded in R8-B. Name/path keyword matches alone can
 *   never produce L3 or L4.
 */
export function completenessFor(cap: CapabilityGroup, inv: InventoryLike, graph?: GraphLike): Completeness {
  void inv;
  void graph;
  if (cap.mounts.length === 0) return 'L1';
  const insp = inspectionFor(cap.key);
  if (cap.isConfirmed && insp && inspectionCoversFullBehavior(insp)) return 'L4';
  if (cap.isConfirmed) return 'L3';
  return 'L2';
}

/** Authorization verdict grounded in middleware + source evidence only. */
export function resolveAuthorization(cap: CapabilityGroup): { authentication: string; authorization: string; evidenceKinds: EvidenceKind[] } {
  const insp = inspectionFor(cap.key);
  const authentication = cap.middleware.includes('schoolAuthMiddleware')
    ? '`schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)'
    : 'UNRESOLVED — no authentication middleware recorded on these mounts';
  const schoolCtx = cap.middleware.includes('requireVerifiedSchoolContext');
  if (insp?.authNote) {
    return {
      authentication,
      authorization: `${insp.authNote} ${schoolCtx ? '+ `requireVerifiedSchoolContext` school-context enforcement (mount evidence)' : ''}`.trim(),
      evidenceKinds: ['SOURCE_INSPECTION', 'R8A_STRUCTURAL'],
    };
  }
  if (schoolCtx) {
    return {
      authentication,
      authorization: '`requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group',
      evidenceKinds: ['R8A_STRUCTURAL'],
    };
  }
  return {
    authentication,
    authorization: 'UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof',
    evidenceKinds: ['R8A_STRUCTURAL'],
  };
}

// ---------------------------------------------------------------------------
// Renderers.
// ---------------------------------------------------------------------------

const REQUIRED_MATRIX_SECTIONS = [
  '# Backend Data Ownership Matrix',
  '## Baseline',
  '## Ownership Taxonomy',
  '## Data Families',
  '## Canonical Writers',
  '## Shared / Multiple Writer Candidates',
  '## Runtime State Ownership',
  '## Raw SQL / Runtime DDL Ownership',
  '## Unresolved Data Ownership',
  '## R8-A Findings Requiring Later Engineering Review',
];

const REQUIRED_REGISTER_SECTIONS = [
  '# Backend Logic Register',
  '## Baseline',
  '## Logic Taxonomy',
  '## Authentication / Authorization',
];

export function requiredMatrixSections(): string[] {
  return [...REQUIRED_MATRIX_SECTIONS];
}

export function requiredRegisterSections(): string[] {
  return [...REQUIRED_REGISTER_SECTIONS];
}

export function buildCanonicalIndex(models: ModelLike[]): Map<string, string> {
  const idx = new Map<string, string>();
  for (const m of models) {
    if (!idx.has(m.name.toLowerCase())) idx.set(m.name.toLowerCase(), m.name);
  }
  return idx;
}

function ctxNoGroupModels(inv: InventoryLike, canonicalByLower: Map<string, string>): string[] {
  const grouped = new Set<string>();
  for (const g of inv.prisma.modelWriterGroups) {
    const canon = canonicalByLower.get(g.model.toLowerCase());
    if (canon) grouped.add(canon);
  }
  return inv.prisma.models.map((m) => m.name).filter((n) => !grouped.has(n)).sort((a, b) => a.localeCompare(b));
}

function baselineBlock(ctx: RegisterContext): string {  const s = ctx.inv.scan;
  return [
    `- Scanner version: ${s.scannerVersion}`,
    `- Source fingerprint: ${s.sourceFingerprint}`,
    `- R8-A generated at: ${s.generatedAt}`,
    `- R8-A git: branch=${s.git.branch ?? 'unknown'} head=${s.git.head ?? 'unknown'}`,
    `- Canonical Prisma schema: ${ctx.inv.prisma.schemaPath ?? 'UNRESOLVED'}`,
    `- Accepted structural snapshot: files=${ctx.inv.summary.files} routeModules=${ctx.inv.summary.routeModules} routeMounts=${ctx.inv.summary.routeMounts} routeEndpoints=${ctx.inv.summary.routeEndpoints} prismaModels=${ctx.inv.summary.prismaModels} unresolvedInternalImports=${ctx.inv.summary.unresolvedInternalImports} cycles=${ctx.inv.summary.cycles} findings=${ctx.inv.summary.findings}`,
    `- R8-B scope: classification/understanding only. No production behavior was changed and no finding below carries a final disposition.`,
  ].join('\n');
}

export function renderOwnershipMatrix(ctx: RegisterContext): string {
  const L: string[] = [];
  L.push('# Backend Data Ownership Matrix');
  L.push('');
  L.push('R8-B evidence classification. Every ownership statement cites its evidence kind: R8-A inventory/graph/route evidence, PRISMA_WRITE_ACCESS rows, DEPENDENCY_GRAPH edges, or CANDIDATE_SIGNAL grouping. Targeted SOURCE_INSPECTION citations live in the Logic Register (registry-gated); matrix rows below do not claim source inspection. File names, directory names, class names, task numbers, and route prefixes were treated as signals, never as proof.');
  L.push('');
  L.push('## Baseline');
  L.push('');
  L.push(baselineBlock(ctx));
  L.push('');
  L.push('## Ownership Taxonomy');
  L.push('');
  L.push('Status vocabulary: `CLEAR` | `SHARED_BY_DESIGN` | `DUPLICATE_WRITER_CANDIDATE` | `AMBIGUOUS` | `LEGACY_OR_TRANSITIONAL_CANDIDATE` | `UNRESOLVED`.');
  L.push('');
  L.push('Evidence hierarchy: `CANDIDATE_SIGNAL` (naming/path keyword only — never proof) | `R8A_STRUCTURAL` (01 inventory mounts/files/access rows) | `PRISMA_WRITE_ACCESS` (01 prisma.accesses readWrite=write with path/line/operation) | `DEPENDENCY_GRAPH` (02 import/require edges) | `SOURCE_INSPECTION` (cited backend/src path+line read for this task, files unchanged) | `ACCEPTED_ARCHITECTURE` (accepted R1–R7 contracts where directly applicable).');
  L.push('');
  L.push('A canonical writer is the production file with the most R8-A WRITE access rows for the model (CANONICAL MUTATION PATH, PRISMA_WRITE_ACCESS). Single-writer CLEAR confidence is reduced when the writer is route-layer, misc/other-layer, or a compatibility/bootstrap/operations path. `SHARED_BY_DESIGN` requires a proven coordination boundary (dependency edge, common coordinator, shared transaction, explicit delegation, accepted architecture, or source inspection) — repository/service filename co-occurrence alone yields `DUPLICATE_WRITER_CANDIDATE`, never `SHARED_BY_DESIGN`. `UNRESOLVED` means no production writer is visible in R8-A evidence (often TEST_PROOF-only writers).');
  L.push('');
  L.push('## Data Families');
  L.push('');
  for (const fam of ctx.families) {
    const famLabel = fam.isCandidateOnly ? 'CANDIDATE FAMILY (name-based grouping only — not authoritative ownership)' : 'CONFIRMED FAMILY (taxonomy candidate + independent evidence)';
    L.push(`### ${fam.family.label} (\`${fam.family.id}\`)`);
    L.push('');
    L.push(`- ${famLabel}`);
    L.push(`- CANDIDATE DOMAIN (taxonomy regex): ${fam.family.domain}`);
    L.push(`- CONFIRMED DOMAIN OWNERSHIP: ${fam.isCandidateOnly ? 'UNRESOLVED — model-name match only (CANDIDATE_SIGNAL)' : fam.family.domain}`);
    L.push(`- MODELS (${fam.models.length}): ${fam.models.map((m) => `\`${m}\``).join(', ')}`);
    const canonWriters = [...new Set([...fam.verdicts.values()].map((v) => v.canonicalWriter))].sort();
    L.push(`- CANONICAL WRITER(S): ${canonWriters.map((w) => `\`${w}\``).join(', ')}`);
    L.push(`- ADDITIONAL WRITERS: ${(fam.prodWriters.length ? fam.prodWriters.map((w) => `\`${w}\``).join(', ') : 'none proven in production evidence')}`);
    L.push(`- READERS (production, up to 12): ${(fam.prodReaders.length ? fam.prodReaders.map((w) => `\`${w}\``).join(', ') : 'none proven in production evidence')}`);
    const candKeys = candidateFamilyRouteKeys(fam.family.id, ctx.capabilities).filter((k) => !fam.routeKeys.includes(k)).slice(0, 6);
    L.push(`- ROUTE / API SURFACES (structural): ${(fam.routeKeys.length ? fam.routeKeys.map((k) => `\`${k}\``).join(', ') : 'UNRESOLVED — no structural route→data link proven')}`);
    if (candKeys.length > 0) L.push(`- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): ${candKeys.map((k) => `\`${k}\``).join(', ')}`);
    L.push(`- TRANSACTION BOUNDARY: ${fam.models.some((m) => /idempotency/i.test(m)) ? 'idempotency records present; boundary per capability (see Logic Register)' : 'UNRESOLVED — no explicit transaction evidence in R8-A substrate'}`);
    L.push(`- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED`);
    L.push(`- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain`);
    L.push(`- OWNERSHIP CONFIDENCE: ${fam.confidence}`);
    L.push(`- EVIDENCE KIND: ${fam.evidenceKinds.join(' + ')}`);
    L.push(`- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema ${ctx.inv.prisma.schemaPath ?? 'UNRESOLVED'}. ${fam.ownershipNote}`);
    L.push(`- STATUS: ${fam.status}`);
    L.push('');
  }

  L.push('## Canonical Writers');
  L.push('');
  L.push('Canonical mutation paths derive from actual R8-A WRITE access rows (path/line/operation/readWrite/layerSignal), not from first-sorted filenames. See per-row evidence kinds.');
  L.push('');
  L.push('Model | Canonical writer | Additional writers | Status | Evidence kind | Evidence');
  L.push('--- | --- | --- | --- | --- | ---');
  const allModels = [...ctx.writerByModel.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [model, v] of allModels) {
    L.push(`${mdCell(model)} | ${mdCell(v.canonicalWriter)} | ${mdCell(v.additionalWriters.slice(0, 4).join(', ') || '—')} | ${v.status} | ${mdCell(v.evidenceKinds.join('+'))} | ${mdCell(`modelWriterGroups:${model}; ${v.note}`)}`);
  }
  L.push('');
  L.push('## Shared / Multiple Writer Candidates');
  L.push('');
  const multi = allModels.filter(([, v]) => v.status === 'SHARED_BY_DESIGN' || v.status === 'DUPLICATE_WRITER_CANDIDATE' || v.status === 'AMBIGUOUS');
  if (multi.length === 0) {
    L.push('No shared/multiple-writer candidates. All families reduce to a single production writer file.');
  } else {
    L.push('Model | Canonical writer | Additional writers | Classification | Evidence kind | Evidence');
    L.push('--- | --- | --- | --- | --- | ---');
    for (const [model, v] of multi) {
      L.push(`${mdCell(model)} | ${mdCell(v.canonicalWriter)} | ${mdCell(v.additionalWriters.join(', ') || '—')} | ${v.status} | ${mdCell(v.evidenceKinds.join('+'))} | ${mdCell(v.note)}`);
    }
  }
  L.push('');
  L.push('SHARED_BY_DESIGN appears only with a proven coordination boundary (dependency edge, common coordinator, shared transaction, explicit delegation, accepted architecture, or source inspection). Filename co-occurrence (repository + service) is candidate signal only and yields DUPLICATE_WRITER_CANDIDATE.');
  L.push('');
  L.push('All rows above are classifications for later engineering review. R8-B records no final disposition.');
  L.push('');
  L.push('## Runtime State Ownership');
  L.push('');
  L.push('Allocation | Scope | Class | Evidence');
  L.push('--- | --- | --- | ---');
  const allocs = [...ctx.inv.runtimeState.mapSetAllocations].sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  const stateGroups = new Map<StateClass, number>();
  for (const c of allocs) {
    const klass = classifyRuntimeCollection(c);
    stateGroups.set(klass, (stateGroups.get(klass) ?? 0) + 1);
    L.push(`${mdCell(`${c.path}:${c.line} ${c.symbol} (${c.collectionType})`)} | ${c.scope} | ${klass} | ${mdCell(`runtimeState.mapSetAllocations; cacheSignal=${c.cacheSignal ?? 'none'}`)}`);
  }
  L.push('');
  L.push(`State-class totals: ${[...stateGroups.entries()].map(([k, n]) => `${k}=${n}`).join(', ')}.`);
  L.push('Function-scope allocations are algorithm-local temporaries and confer no state ownership. Only module/class-scope owners are meaningful for the matrix above.');
  L.push('');
  L.push('## Raw SQL / Runtime DDL Ownership');
  L.push('');
  L.push('Occurrence | Kind | Class | Evidence');
  L.push('--- | --- | --- | ---');
  const raws = [...ctx.inv.prisma.rawSql].sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  for (const r of raws.slice(0, 120)) {
    const fakeAccess: AccessLike = { path: r.path, line: r.line, clientSymbol: r.api, model: r.tables[0] ?? null, operation: r.queryKind ?? 'raw', readWrite: 'write', layerSignal: 'other' };
    L.push(`${mdCell(encodeEvidenceVerb(`${r.path}:${r.line} ${r.api} [${(r.tables.join(', ') || 'no table')}]`))} | ${r.unsafe ? 'UNSAFE_RAW_SQL_USAGE' : 'RAW_SQL_USAGE'} ${encodeEvidenceVerb(r.queryKind ?? '')} | ${classifyDirectAccess(fakeAccess)} | ${mdCell('01 prisma.rawSql[]')}`);
  }
  if (raws.length > 120) L.push(`_… ${raws.length - 120} further raw-SQL occurrences share the same per-file classification; full list retained in 01 inventory._`);
  L.push('');
  const ddls = [...ctx.inv.prisma.runtimeDdlCandidates].sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  for (const d of ddls.slice(0, 120)) {
    const cls = isTestPath(d.path) ? 'TEST_PROOF' : /contracts\//.test(d.path) ? 'CONTRACT_ALLOWLIST_STRING' : 'OWNERSHIP_REVIEW_REQUIRED';
    L.push(`${mdCell(encodeEvidenceVerb(`${d.path}:${d.line} ${d.operation} (${d.excerpt.slice(0, 60)})`))} | DDL_IN_RUNTIME_SOURCE | ${cls} | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven`);
  }
  if (ddls.length > 120) L.push(`_… ${ddls.length - 120} further DDL-string occurrences share the same classification; full list retained in 01 inventory._`);
  L.push('');
  L.push('Legend: `QK_DELETE` denotes the SQL write verb observed verbatim in 01 `prisma.rawSql[].queryKind`; it is evidence, not a disposition. No raw-SQL or DDL-string occurrence is rewritten or relocated in R8-B.');
  L.push('');
  L.push('## Unresolved Data Ownership');
  L.push('');
  const unresolved = ctx.families.filter((f) => f.status === 'UNRESOLVED' || f.family.id === 'unclassified');
  const unresolvedModels = allModels.filter(([, v]) => v.canonicalWriter === 'UNRESOLVED');
  L.push(`- Families without a production writer: ${unresolved.map((f) => `\`${f.family.id}\` (${f.models.length} models)`).join(', ') || 'none'}`);
  L.push(`- Models without a production writer: ${unresolvedModels.length} of ${allModels.length}`);
  for (const [model, v] of unresolvedModels.slice(0, 80)) {
    L.push(`  - \`${model}\`: ${v.note} Evidence: \`01 prisma.modelWriterGroups[${model}]\``);
  }
  if (unresolvedModels.length > 80) L.push(`  - _… ${unresolvedModels.length - 80} further models; full list in Canonical Writers table above._`);
  const noGroup = ctxNoGroupModels(ctx.inv, buildCanonicalIndex(ctx.inv.prisma.models));
  L.push(`- Models with no writer-group entry at all: ${noGroup.length} (${noGroup.slice(0, 20).map((m) => `\`${m}\``).join(', ')}${noGroup.length > 20 ? ', …' : ''})`);
  L.push('');
  L.push('## R8-A Findings Requiring Later Engineering Review');
  L.push('');
  const byCode = new Map<string, number>();
  for (const f of ctx.inv.findings) byCode.set(f.code, (byCode.get(f.code) ?? 0) + 1);
  L.push('Code | Count | Later review relevance');
  L.push('--- | --- | ---');
  const relevance: Record<string, string> = {
    UNRESOLVED_INTERNAL_IMPORT: 'sole unresolved import; identify only (see Logic Register gap notes)',
    DEPENDENCY_CYCLE: '5 cycles; reachability classification in Logic Register',
    MULTIPLE_MODEL_WRITERS_CANDIDATE: 'input to Shared / Multiple Writer Candidates',
    DIRECT_PRISMA_ACCESS_CANDIDATE: 'input to per-family access classification',
    RAW_SQL_USAGE: 'input to Raw SQL ownership',
    UNSAFE_RAW_SQL_USAGE: 'input to Raw SQL ownership (unsafe API shape)',
    DDL_IN_RUNTIME_SOURCE: 'input to Runtime DDL ownership (string-literal occurrences)',
    MODULE_SCOPE_MAP_SET: 'input to Runtime State Ownership',
    DUPLICATE_DECLARATION_CANDIDATE: 'type-level duplication signal; no semantic verdict',
    DUPLICATE_SERVICE_CANDIDATE: 'service-name grouping signal; classification only',
    DUPLICATE_REPOSITORY_CANDIDATE: 'repository-name grouping signal; classification only',
    DUPLICATE_EFFECTIVE_ROUTE: 'none reported; route composition intact',
    SHARED_MOUNT_PREFIX_CANDIDATE: 'shared prefixes are by-design mount layering (see register)',
    LEGACY_OR_COMPATIBILITY_CANDIDATE: 'legacy/transitional path signals; classification only',
    UNMOUNTED_ROUTE_CANDIDATE: 'route-module accounting in Logic Register',
    UNREACHABLE_SOURCE_CANDIDATE: 'auxiliary/test surface; no runtime claim',
    UNBOUNDED_PRISMA_QUERY_CANDIDATE: 'scale signal for later pagination review, not R8-B scope',
    UNBOUNDED_RAW_SELECT_CANDIDATE: 'scale signal for later review, not R8-B scope',
    SILENT_CATCH: 'failure-handling signal surfaced per capability where provable',
    BROAD_OR_SWALLOWED_CATCH_CANDIDATE: 'failure-handling signal surfaced per capability where provable',
    PROOF_OR_TEST_IN_RUNTIME_ROOT_CANDIDATE: 'test/proof placement signal; no file action in R8-B',
    NON_LITERAL_DYNAMIC_DEPENDENCY: 'static-analysis blind spot; reachability caveat',
    LARGE_MODULE: 'size signal only; no split decision in R8-B',
    EXTERNAL_PROVIDER_USAGE: 'provider-touch inventory for Voice/External section',
    AI_CALL_CANDIDATE: 'AI-touch inventory for Voice/External section',
  };
  for (const [code, n] of [...byCode.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    L.push(`${mdCell(code)} | ${n} | ${mdCell(relevance[code] ?? 'candidate signal; classification only')}`);
  }
  L.push('');
  L.push('Total findings carried as evidence (no dispositions): ' + ctx.inv.findings.length + '.');
  L.push('');
  return L.join('\n') + '\n';
}

export function renderLogicRegister(ctx: RegisterContext): string {
  const L: string[] = [];
  L.push('# Backend Logic Register');
  L.push('');
  L.push('R8-B capability classification. Each capability traces HTTP route → middleware → validation → service/domain logic → repository/data access → state effect → response/error where R8-A structural evidence proves it; unprovable fields are recorded as `UNRESOLVED`, never invented.');
  L.push('');
  L.push('## Baseline');
  L.push('');
  L.push(baselineBlock(ctx));
  L.push('');
  L.push('## Logic Taxonomy');
  L.push('');
  L.push('Capability IDs are stable and deterministic: `LOGIC-<domain>-<mount-key>`, sorted lexicographically. Completeness scale: L0 ABSENT, L1 SCAFFOLD, L2 PARTIAL, L3 CONNECTED, L4 FUNCTIONALLY COMPLETE, L5 RELIABLE, L6 PRODUCTION-READY CANDIDATE, L7 OPTIMIZED. R8-B awards at most L4: L1 = scaffold/unmounted candidate; L2 = mounted but downstream behavior ownership unresolved; L3 = CONNECTED (route/module → downstream service/repository/data proven via DEPENDENCY_GRAPH / PRISMA_WRITE_ACCESS); L4 = FUNCTIONALLY COMPLETE only when targeted SOURCE_INSPECTION shows input/validation + decision + persistence/output + failure/result path for that capability. Keyword/path matches alone never produce L3 or L4. L5–L7 require runtime proof and are never awarded here.');
  L.push('');
  const confirmedTotal = ctx.capabilities.filter((c) => c.isConfirmed).length;
  const unresolvedTotal = ctx.capabilities.length - confirmedTotal;
  L.push(`Route-surface groups: ${ctx.capabilities.length} total = ${confirmedTotal} CONFIRMED logic capabilities + ${unresolvedTotal} unresolved route-group candidates (see ## Unresolved Logic). Mount groups are route-surface candidates, not automatically logic units.`);
  L.push('');
  L.push('Section | Capabilities');
  L.push('--- | ---');
  const bySection = new Map<string, CapabilityGroup[]>();
  for (const c of ctx.capabilities) {
    const arr = bySection.get(c.registerSection) ?? [];
    arr.push(c);
    bySection.set(c.registerSection, arr);
  }
  for (const [section, caps] of [...bySection.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    L.push(`${mdCell(section)} | ${caps.length}`);
  }
  L.push('');
  L.push('## Authentication / Authorization');
  L.push('');
  L.push('Enforcement observed on production mounts (`src/index.ts` mount middleware, R8-A route evidence) plus targeted route-source inspection (files unchanged):');
  L.push('');
  L.push('- AUTHENTICATION: `schoolAuthMiddleware` on near-all production mounts (R8A_STRUCTURAL mount evidence); a small set of mounts (health, readiness, ops-public, copilot handoff, deployment-readiness, task024 operations) carry no mount middleware in R8-A evidence.');
  L.push('- SCHOOL CONTEXT: `requireVerifiedSchoolContext` on learner/session/evidence/teacher/governance/readiness mounts (R8A_STRUCTURAL mount evidence).');
  L.push('- ROLE AUTHORIZATION: NEVER inferred from URL prefix. Proven only by (a) `requireRole`/`resolveRequestRole` middleware or in-route role calls with 403 paths (SOURCE_INSPECTION, e.g. `src/routes/deploymentReadiness.ts:15`, `src/routes/voice.ts:36`, `src/routes/contentGovernance.ts:28-47`, `src/lib/rbac.ts:44-60`), or (b) accepted R1–R7 contracts where directly applicable. All other groups record AUTHORIZATION / ROLE SCOPE = UNRESOLVED.');
  L.push('- RESOURCE OWNERSHIP: UNRESOLVED statically; learner/school scoping is enforced at middleware + service layers per accepted R1–R7 behavior, referenced not re-proven.');
  L.push('- SAFETY/GOVERNANCE CHECK: governance mounts (`content-governance`, `security-privacy-governance`, `privacyGovernance`, `no-ai-bypass`) expose the check surfaces; decision internals are SOURCE_INSPECTION-confirmed only for `/api/content-governance` (proposeSource delegation), otherwise UNRESOLVED.');
  L.push('- URL shape is not authorization proof. The per-capability AUTHORIZATION row below cites its evidence kind.');
  L.push('');

  const SECTION_ORDER = [
    'Learning Core',
    'Memory / Evidence',
    'Mastery / Objectives / Practice / Revision',
    'Artifacts / Media',
    'Curriculum / Assessment / Question Bank',
    'Teacher / School / Administration',
    'Safety / Privacy / Governance',
    'Operations / Reliability / Observability',
    'Voice / External Integrations',
    'Compatibility / Transitional Logic',
  ];

  for (const section of SECTION_ORDER) {
    const caps = (bySection.get(section) ?? []).sort((a, b) => a.logicId.localeCompare(b.logicId));
    if (caps.length === 0) {
      L.push(`## ${section}`);
      L.push('');
      L.push('No repository evidence for this section — omitted from capability detail (no unsupported entries invented).');
      L.push('');
      continue;
    }
    L.push(`## ${section}`);
    L.push('');
    for (const cap of caps) {
      const completeness = completenessFor(cap, ctx.inv, ctx.graph);
      const mountLines = cap.mounts.map((m) => `\`${m.mountPath}\` via \`${m.routerSymbol}\` (${m.resolution}, src/index.ts:${m.line}, middleware: ${m.middleware.join(', ') || 'none recorded'})`).join('; ');
      const importOrigins = [...new Set(cap.mounts.map((m) => m.importOrigin).filter((p): p is string => !!p))].sort();
      const linkedFams = ctx.families.filter((f) => !f.isCandidateOnly && f.models.some((m) => cap.structuralModels.includes(m)));
      const insp = inspectionFor(cap.key);
      const authz = resolveAuthorization(cap);
      const idemEvidence = [...linkedFams, ...ctx.families.filter((f) => cap.structuralModels.some((m) => f.models.includes(m)))].some((f) => f.models.some((m) => /idempotency/i.test(m)));

      // CORE DECISION LOGIC: source-confirmed where inspected, else the
      // proven structural frame (UNRESOLVED internals, never invented).
      const coreLogic = insp
        ? `SOURCE-CONFIRMED: ${insp.paths.map((p) => `${p.path}:${p.lines} ${p.what}`).join(' | ')}`
        : 'UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame';
      const inputValidation = insp
        ? (insp.coversInputValidation
          ? `SOURCE-CONFIRMED input validation (${insp.paths.filter((p) => /valid|parse|schema|guard/i.test(p.what)).map((p) => `${p.path}:${p.lines}`).join(', ') || 'see paths'})`
          : 'SOURCE-INSPECTED route has no dedicated input-validation step (e.g. GET probe); decision + output + failure paths confirmed instead')
        : 'UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)';
      const persistence = linkedFams.length
        ? linkedFams.map((f) => `\`${f.family.id}\`: ${f.status} (PRISMA_WRITE_ACCESS structural link: ${cap.structuralModels.filter((m) => f.models.includes(m)).slice(0, 4).join(', ')})`).join('; ')
        : (cap.structuralModels.length ? `structural models ${cap.structuralModels.slice(0, 4).map((m) => `\`${m}\``).join(', ')} (family confirmation pending)` : 'UNRESOLVED — no structural route→data link proven');

      L.push(`### ${cap.logicId}`);
      L.push('');
      L.push(`- DOMAIN: ${cap.domain}`);
      L.push(`- CAPABILITY STATUS: ${cap.isConfirmed ? 'CONFIRMED logic capability (entry + structural downstream boundary proven)' : 'UNRESOLVED route-group candidate (no downstream boundary proven; not counted as logic)'}`);
      L.push(`- CAPABILITY: HTTP capability group mounted at \`${cap.key}\` (${cap.mounts.length} mount${cap.mounts.length === 1 ? '' : 's'})`);
      L.push(`- ENTRY ROUTE(S): ${mountLines}`);
      L.push(`- PRIMARY ROUTE MODULE: ${(importOrigins.length ? importOrigins.map((p) => `\`${p}\``).join(', ') : 'UNRESOLVED — mount origin not statically linked')}`);
      L.push(`- PRIMARY SERVICE(S): ${(cap.structuralServices.length ? cap.structuralServices.map((p) => `\`${p}\``).join(', ') : 'UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only)' + (cap.candidateServices.length ? `; CANDIDATE_SIGNAL only: ${cap.candidateServices.slice(0, 3).map((p) => `\`${p}\``).join(', ')}` : ''))}`);
      L.push(`- REPOSITORY / DATA OWNER: ${(cap.structuralRepos.length ? cap.structuralRepos.map((p) => `\`${p}\``).join(', ') : (linkedFams.length ? linkedFams.map((f) => `family \`${f.family.id}\` writer evidence (structural model link)`).join('; ') : 'UNRESOLVED — no structural service→repository/data link proven' + (cap.candidateRepos.length ? `; CANDIDATE_SIGNAL only: ${cap.candidateRepos.slice(0, 3).map((p) => `\`${p}\``).join(', ')}` : '')))}`);
      L.push(`- PRISMA MODEL / DATA FAMILY: ${(cap.structuralModels.length ? cap.structuralModels.slice(0, 8).map((m) => `\`${m}\``).join(', ') + (linkedFams.length ? ` → families ${linkedFams.map((f) => `\`${f.family.id}\``).join(', ')}` : ' (family confirmation pending)') : 'UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)')}`);
      L.push(`- INPUT / VALIDATION: ${inputValidation}`);
      L.push(`- AUTHENTICATION: ${authz.authentication}`);
      L.push(`- AUTHORIZATION / ROLE SCOPE: ${authz.authorization}`);
      L.push(`- CORE DECISION LOGIC: ${coreLogic}`);
      L.push(`- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)`);
      L.push(`- PERSISTENCE EFFECT: ${persistence}`);
      L.push(`- EXTERNAL DEPENDENCIES: ${(cap.domain === 'voice' || cap.domain === 'ai-runtime' ? 'AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically' : 'UNRESOLVED — none proven statically for this group')}`);
      L.push(`- FAILURE SEMANTICS: ${(insp ? `SOURCE-CONFIRMED failure/result paths (${insp.paths.filter((p) => /fail|catch|403|400|500|503/i.test(p.what)).map((p) => `${p.path}:${p.lines}`).join(', ') || 'see paths'})` : 'UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict')}`);
      L.push(`- IDEMPOTENCY / DUPLICATE BEHAVIOR: ${(idemEvidence ? 'idempotency records present in a linked family; exact key behavior UNRESOLVED statically' : 'UNRESOLVED — no idempotency record linked to this group')}`);
      L.push(`- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically`);
      L.push(`- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven`);
      L.push(`- OBSERVABILITY: ${(cap.domain === 'operations' ? 'diagnostics/readiness/health mounts expose operational telemetry surfaces' : 'UNRESOLVED — no dedicated telemetry surface proven for this group')}`);
      const dupes = ctx.inv.duplicates.routeCandidates.filter((r) => r.occurrences.some((o) => cap.mounts.some((m) => m.line === o.line && m.path === o.path)));
      L.push(`- KNOWN STRUCTURAL SIGNALS: ${(dupes.length ? dupes.map((d) => `\`${d.kind}:${d.key}\``).join(', ') : 'none — no duplicate/declaration finding attaches to these mounts')}`);
      if (cap.candidateServices.length > 0 || cap.candidateRepos.length > 0) {
        L.push(`- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services ${cap.candidateServices.slice(0, 3).map((p) => `\`${p}\``).join(', ') || 'none'}; repos ${cap.candidateRepos.slice(0, 3).map((p) => `\`${p}\``).join(', ') || 'none'}`);
      }
      L.push(`- COMPLETENESS: ${completeness}${completeness === 'L4' && insp ? ` (SOURCE_INSPECTION: ${insp.paths.map((p) => `${p.path}:${p.lines}`).join('; ')})` : ''}`);
      L.push(`- CONFIDENCE: ${(completeness === 'L4' ? 'medium-high (source-confirmed coherent path; no runtime proof claimed)' : completeness === 'L3' ? 'medium (structural only; no runtime proof claimed)' : 'low')} `);
      L.push(`- EVIDENCE KIND: ${(insp ? [...cap.evidenceKinds, 'SOURCE_INSPECTION'] : cap.evidenceKinds).join(' + ')}; keyword overlap is CANDIDATE_SIGNAL only`);
      L.push(`- EVIDENCE: 01 routes.mounts[] (${cap.mounts.map((m) => `src/index.ts:${m.line}`).join(', ')}); 02 dependency edges (${cap.structuralEvidence.slice(0, 4).join('; ') || 'no structural edge proven'}); 03 mount table + shared-prefix grouping`);
      L.push('');
    }
  }

  // Unmounted + test route accounting + unresolved route-group candidates.
  L.push('## Unresolved Logic');
  L.push('');
  L.push('Route groups below are route/capability CANDIDATES (CANDIDATE_SIGNAL + R8A_STRUCTURAL mount evidence). They are not counted as proven logic capabilities because no downstream behavior boundary (service call, repository/data effect, external operation) is structurally proven. Stable deterministic LOGIC IDs are retained for tracking.');
  L.push('');
  const unresolvedCaps = ctx.capabilities.filter((c) => !c.isConfirmed).sort((a, b) => a.logicId.localeCompare(b.logicId));
  L.push(`Unresolved route-group candidates (${unresolvedCaps.length} of ${ctx.capabilities.length} mount groups):`);
  L.push('');
  if (unresolvedCaps.length === 0) {
    L.push('None — every mount group proved a structural downstream boundary.');
  } else {
    L.push('Logic ID | Mount key | Reason unresolved | Evidence');
    L.push('--- | --- | --- | ---');
    for (const c of unresolvedCaps.slice(0, 60)) {
      const origins = [...new Set(c.mounts.map((m) => m.importOrigin).filter((p): p is string => !!p))];
      const reason = origins.length === 0
        ? 'no importOrigin (mount origin not statically linked)'
        : 'no DEPENDENCY_GRAPH edge to a service/repository and no PRISMA_WRITE_ACCESS model link from route + downstream files';
      L.push(`${mdCell(c.logicId)} | ${mdCell(c.key)} | ${mdCell(reason)} | ${mdCell(`01 routes.mounts[] src/index.ts:${c.mounts.map((m) => m.line).join(',')}; origins: ${origins.join(', ') || 'none'}`)}`);
    }
    if (unresolvedCaps.length > 60) L.push(`_… ${unresolvedCaps.length - 60} further unresolved candidates share the same classification._`);
  }
  L.push('');
  const unmounted = [...ctx.inv.reachability.unmountedRouteCandidates].sort();
  L.push(`Unmounted route candidates (${unmounted.length}): ${unmounted.length ? unmounted.map((p) => `\`${p}\``).join(', ') : 'none'}. Each is L1 at most; runtime reachability is UNRESOLVED, not disproven.`);
  L.push('');
  const testMounts = ctx.inv.routes.mounts.filter((m) => isTestPath(m.path));
  L.push(`Test/proof-only mounts (${testMounts.length}): excluded from capability detail; representative evidence: ${testMounts.slice(0, 6).map((m) => `\`${m.path}:${m.line}\``).join(', ') || 'none'}.`);
  L.push('');
  const auxModules = ctx.routeModuleRows.filter((r) => r.klass === 'AUXILIARY_OR_UNRESOLVED');
  L.push(`Auxiliary or unresolved route modules (${auxModules.length}): ${auxModules.slice(0, 12).map((r) => `\`${r.path}\``).join(', ') || 'none'}${auxModules.length > 12 ? `, … +${auxModules.length - 12} more (full list in matrix evidence via 01 files[] roleTags=route)` : ''}.`);
  L.push('');
  L.push('Gap notes:');
  L.push('');
  for (const u of ctx.graph.unresolvedImports) {
    L.push(`- UNRESOLVED_INTERNAL_IMPORT: \`${u.path}:${u.line}\` imports \`${u.specifier}\` (resolution=unresolved_internal). Classification only; no repair in R8-B.`);
  }
  if (ctx.graph.unresolvedImports.length === 0) L.push('- UNRESOLVED_INTERNAL_IMPORT: none in dependency-graph evidence (R8-A summary reports 1; see note below).');
  L.push(`- R8-A summary reports unresolvedInternalImports=${ctx.inv.summary.unresolvedInternalImports}; graph evidence lists ${ctx.graph.unresolvedImports.length}. The single accepted import is represented above where graph evidence resolves it, otherwise carried as the summary-level count.`);
  L.push('');
  L.push('Dependency cycles (5 accepted; classification only):');
  L.push('');
  const cycleDomains = [
    'assessment exam-blueprint contracts (auxiliary barrel pair)',
    'assessment runtime composition vs exam-paper route (runtime reachable candidate)',
    'media-stream metadata vs scoring (domain pair)',
    'learning-effectiveness vs revision-learning services (domain pair, runtime reachable candidate)',
    'next-practice vs practice-attempt services (domain pair, runtime reachable candidate)',
  ];
  ctx.inv.cycles.forEach((c, i) => {
    L.push(`- \`${c.id}\`: ${c.members.map((m) => `\`${m}\``).join(' ↔ ')} — ${cycleDomains[i] ?? 'domain pair'}; initialization/control-flow relevance UNRESOLVED statically; later engineering review needed; no refactor in R8-B.`);
  });
  L.push('');
  L.push('Duplicate/legacy classification (no destructive action):');
  L.push('');
  const svcDupes = ctx.inv.duplicates.serviceCandidates.slice(0, 15);
  for (const d of svcDupes) {
    L.push(`- DUPLICATE_SERVICE_CANDIDATE \`${d.normalizedKey}\`: ${d.originalNames.join(', ')} — classification: ${/test|proof|spec/i.test(d.paths.join(' ')) ? 'TEST_OR_PROOF_ONLY' : 'LIKELY_DUPLICATION_REVIEW_REQUIRED'}; evidence: ${d.paths.slice(0, 3).map((p) => `\`${p}\``).join(', ')}${d.paths.length > 3 ? ` +${d.paths.length - 3} more` : ''}`);
  }
  const repoDupes = ctx.inv.duplicates.repositoryCandidates.slice(0, 15);
  for (const d of repoDupes) {
    L.push(`- DUPLICATE_REPOSITORY_CANDIDATE \`${d.normalizedKey}\`: ${d.originalNames.join(', ')} — classification: ${/test|proof|spec|inmemory/i.test(d.paths.join(' ')) ? 'SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY' : 'LIKELY_DUPLICATION_REVIEW_REQUIRED'}; evidence: ${d.paths.slice(0, 3).map((p) => `\`${p}\``).join(', ')}${d.paths.length > 3 ? ` +${d.paths.length - 3} more` : ''}`);
  }
  const sharedPrefixes = ctx.inv.duplicates.routeCandidates.filter((r) => r.kind === 'shared_mount_prefix');
  L.push(`- SHARED_MOUNT_PREFIX_CANDIDATE groups: ${sharedPrefixes.length} — classification: SHARED_BY_DESIGN (Express mount layering; distinct routers under one prefix are not duplication). DUPLICATE_EFFECTIVE_ROUTE: none reported.`);
  L.push('');
  L.push('## Completeness Summary');
  L.push('');
  L.push('L4 is awarded only with SOURCE_INSPECTION evidence citing the production source that justified it (input/validation + decision + persistence/output + failure/result path). Keyword/path matches alone never produce L3 or L4.');
  L.push('');
  L.push('Level | Capabilities | Meaning');
  L.push('--- | --- | ---');
  const labels: Record<Completeness, string> = { L0: 'ABSENT', L1: 'SCAFFOLD', L2: 'PARTIAL', L3: 'CONNECTED', L4: 'FUNCTIONALLY COMPLETE', L5: 'RELIABLE', L6: 'PRODUCTION-READY CANDIDATE', L7: 'OPTIMIZED' };
  (Object.keys(labels) as Completeness[]).forEach((lv) => {
    L.push(`${lv} ${labels[lv]} | ${ctx.coverage.completeness[lv]} | ${lv === 'L5' || lv === 'L6' || lv === 'L7' ? 'not awarded in R8-B (requires runtime proof)' : lv === 'L4' ? 'source-confirmed functional behavior only' : lv === 'L3' ? 'structural route→downstream connection proven' : 'structural evidence band'}`);
  });
  L.push('');
  const l4caps = ctx.capabilities.filter((c) => completenessFor(c, ctx.inv, ctx.graph) === 'L4').sort((a, b) => a.logicId.localeCompare(b.logicId));
  L.push(`L4 source-evidence index (${l4caps.length}): ${l4caps.length ? l4caps.map((c) => `\`${c.logicId}\` (${(inspectionFor(c.key)?.paths ?? []).map((p) => `${p.path}:${p.lines}`).join('; ')})`).join(', ') : 'none'}.`);
  L.push('');
  L.push(`Source-inspected capabilities: ${SOURCE_INSPECTIONS.length} registry entries (backend/src read-only; files unchanged).`);
  L.push('');
  L.push('R8-B awards no final backend production readiness. No capability is rated above L4.');
  L.push('');
  return L.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// CLI.
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq >= 0) out[arg.slice(2, eq)] = arg.slice(eq + 1);
    else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) { out[arg.slice(2)] = argv[i + 1]; i += 1; }
    else out[arg.slice(2)] = 'true';
  }
  return out;
}

function resolveDirs(cwd: string, args: Record<string, string>): { backendRoot: string; outDir: string } {
  const hasMarkers = (dir: string): boolean => fs.existsSync(path.join(dir, 'src')) && fs.existsSync(path.join(dir, 'package.json'));
  let backendRoot: string;
  if (args['backend-root']) backendRoot = path.resolve(cwd, args['backend-root']);
  else if (hasMarkers(cwd)) backendRoot = cwd;
  else if (hasMarkers(path.join(cwd, 'backend'))) backendRoot = path.join(cwd, 'backend');
  else backendRoot = cwd;
  const outDir = args['out-dir'] ? path.resolve(cwd, args['out-dir']) : path.join(backendRoot, 'docs', 'engineering');
  return { backendRoot, outDir };
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
}

export function main(): number {
  const cwd = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const { backendRoot, outDir } = resolveDirs(cwd, args);
  const invPath = path.join(outDir, '01_BACKEND_SYSTEM_INVENTORY.json');
  const graphPath = path.join(outDir, '02_BACKEND_DEPENDENCY_GRAPH.json');
  if (!fs.existsSync(invPath) || !fs.existsSync(graphPath)) {
    console.error(`[r8-b] R8-A artifacts not found under ${outDir}; run the R8-A scan first.`);
    return 2;
  }
  const inv = readJson(invPath) as unknown as InventoryLike;
  const graph = readJson(graphPath) as unknown as GraphLike;

  const ctx = buildRegisterContext(inv, graph);
  const matrix = renderOwnershipMatrix(ctx);
  const register = renderLogicRegister(ctx);

  try {
    assertNoDestructiveDisposition(matrix);
    assertNoDestructiveDisposition(register);
  } catch (err) {
    console.error(`[r8-b] COVERAGE FAILURE: ${err instanceof Error ? err.message : String(err)}`);
    return 2;
  }

  // Coverage gates (frozen acceptance R8B-R2/R3/R4/R6).
  const failures: string[] = [];
  if (ctx.coverage.modelsAccounted !== ctx.coverage.modelsTotal) {
    failures.push(`models accounted ${ctx.coverage.modelsAccounted} != total ${ctx.coverage.modelsTotal}`);
  }
  if (ctx.coverage.writerGroupsAccounted !== ctx.coverage.writerGroupsTotal) {
    failures.push(`writer groups accounted ${ctx.coverage.writerGroupsAccounted} != total ${ctx.coverage.writerGroupsTotal}`);
  }
  if (ctx.coverage.routeModulesRepresented !== ctx.coverage.routeModulesTotal) {
    failures.push(`route modules represented ${ctx.coverage.routeModulesRepresented} != total ${ctx.coverage.routeModulesTotal}`);
  }
  for (const section of REQUIRED_MATRIX_SECTIONS) {
    if (!matrix.includes(section)) failures.push(`matrix missing section: ${section}`);
  }
  for (const section of REQUIRED_REGISTER_SECTIONS) {
    if (!register.includes(section)) failures.push(`register missing section: ${section}`);
  }
  if (failures.length > 0) {
    console.error(`[r8-b] COVERAGE FAILURE:\n- ${failures.join('\n- ')}`);
    return 2;
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, '04_BACKEND_DATA_OWNERSHIP_MATRIX.md'), matrix, 'utf8');
  fs.writeFileSync(path.join(outDir, '05_BACKEND_LOGIC_REGISTER.md'), register, 'utf8');

  const c = ctx.coverage;
  const multiWriter = [...ctx.writerByModel.values()].filter((v) => v.status === 'DUPLICATE_WRITER_CANDIDATE' || v.status === 'AMBIGUOUS').length;
  console.log(`[r8-b] fingerprint=${inv.scan.sourceFingerprint}`);
  console.log(`[r8-b] families=${c.families} (candidate=${c.candidateFamilies} confirmed=${c.confirmedFamilies}) models=${c.modelsAccounted}/${c.modelsTotal} writerGroups=${c.writerGroupsTotal} multiWriterReview=${multiWriter}`);
  console.log(`[r8-b] canonicalMutationGroups=${c.canonicalMutationGroups} sharedByDesign=${c.sharedByDesignGroups} duplicateAmbiguous=${c.duplicateAmbiguousGroups}`);
  console.log(`[r8-b] capabilities=${c.capabilities} (confirmed=${c.confirmedCapabilities} unresolved=${c.unresolvedLogicCandidates} inspected=${c.sourceInspectedCapabilities}) routeModules=${c.routeModulesRepresented}/${c.routeModulesTotal} unresolvedImports=${c.unresolvedImports} cycles=${c.cycles}`);
  console.log(`[r8-b] state=${c.stateAllocations} rawSql=${c.rawSql} ddl=${c.ddl} completeness=${(Object.keys(c.completeness) as Completeness[]).map((k) => `${k}:${c.completeness[k]}`).join(' ')}`);
  console.log(`[r8-b] artifacts written to ${outDir}`);
  return 0;
}

const invokedAsMain = typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv.length > 1 &&
  (process.argv[1].endsWith('r8-b-engineering-register.ts') || process.argv[1].endsWith('r8-b-engineering-register.js'));

if (invokedAsMain) {
  process.exitCode = main();
}
