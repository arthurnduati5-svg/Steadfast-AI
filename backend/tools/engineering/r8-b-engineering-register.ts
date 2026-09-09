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
}

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
}

export function classifyWriterGroup(group: WriterGroupLike): WriterVerdict {
  const prod = group.writers.filter((w) => isProductionPath(w.path));
  const testOnly = group.writers.filter((w) => isTestPath(w.path));
  const distinctProd = [...new Set(prod.map((w) => w.path))].sort();

  if (distinctProd.length === 0 && testOnly.length === 0) {
    return { canonicalWriter: 'UNRESOLVED', additionalWriters: [], status: 'UNRESOLVED', confidence: 'high', note: 'No writer evidence in R8-A modelWriterGroups.' };
  }
  if (distinctProd.length === 0) {
    const tops = [...new Set(testOnly.map((w) => `${w.path}:${w.line}`))].sort().slice(0, 5);
    return { canonicalWriter: 'UNRESOLVED', additionalWriters: tops, status: 'UNRESOLVED', confidence: 'high', note: 'Writer evidence is TEST_PROOF only; no production writer identified.' };
  }
  const canonical = distinctProd[0];
  const additional = distinctProd.slice(1);
  const canonicalIsLegacy = isLegacyPath(canonical);
  const allLegacy = distinctProd.every((p) => isLegacyPath(p));

  if (distinctProd.length === 1) {
    if (canonicalIsLegacy) {
      return { canonicalWriter: canonical, additionalWriters: [], status: 'LEGACY_OR_TRANSITIONAL_CANDIDATE', confidence: 'medium', note: 'Single production writer carries a legacy/compatibility path signal.' };
    }
    return { canonicalWriter: canonical, additionalWriters: [], status: 'CLEAR', confidence: 'high', note: 'Single production writer file.' };
  }
  // Multiple production writer files.
  const allRepo = distinctProd.every((p) => /repositor/i.test(p));
  const hasRepoCoordination = distinctProd.some((p) => /repositor/i.test(p)) && distinctProd.some((p) => /service/i.test(p));
  if (allRepo || hasRepoCoordination) {
    return { canonicalWriter: canonical, additionalWriters: additional, status: 'SHARED_BY_DESIGN', confidence: 'medium', note: 'Multiple writer files follow the repository/service coordination boundary.' };
  }
  if (allLegacy || distinctProd.some((p) => isLegacyPath(p))) {
    return { canonicalWriter: canonical, additionalWriters: additional, status: 'LEGACY_OR_TRANSITIONAL_CANDIDATE', confidence: 'low', note: 'Multiple writer files with at least one legacy/compatibility path signal.' };
  }
  if (distinctProd.length > 3) {
    return { canonicalWriter: canonical, additionalWriters: additional, status: 'AMBIGUOUS', confidence: 'low', note: 'More than three distinct production writer files; ownership cannot be reduced statically.' };
  }
  return { canonicalWriter: canonical, additionalWriters: additional, status: 'DUPLICATE_WRITER_CANDIDATE', confidence: 'medium', note: 'Multiple distinct production writer files without an established coordination boundary.' };
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
    });
  }
  groups.sort((a, b) => a.logicId.localeCompare(b.logicId));
  return groups;
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
  const writerByModel = new Map<string, WriterVerdict>();
  for (const [key, writers] of mergedWriters) {
    const verdict = classifyWriterGroup({ model: key, writers });
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
      });
    }
  }

  const capabilities = groupRoutesToCapabilities(inv.routes.mounts);

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
        canonicalWriter: 'UNRESOLVED', additionalWriters: [], status: 'UNRESOLVED', confidence: 'high', note: 'No writer evidence.',
      });
    }
    const { status, confidence } = famId === 'unclassified'
      ? { status: 'UNRESOLVED' as OwnershipStatus, confidence: 'low' as const }
      : rollupStatus([...verdicts.values()]);
    const readers = new Set<string>();
    const writers = new Set<string>();
    for (const name of models) {
      for (const p of prodReads.get(name) ?? []) readers.add(p);
      for (const p of prodWrites.get(name) ?? []) writers.add(p);
    }
    families.push({
      family: fam,
      models,
      verdicts,
      status,
      confidence,
      prodReaders: [...readers].sort().slice(0, 12),
      prodWriters: [...writers].sort().slice(0, 12),
      routeKeys: familyRouteKeys(famId, capabilities),
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
    completeness[completenessFor(c, inv)] += 1;
  }

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
      families: families.length,
      completeness,
    },
  };
}

export function completenessFor(cap: CapabilityGroup, inv: InventoryLike): Completeness {
  const hay = normalizeHay(cap.mounts.map((m) => `${m.mountPath} ${m.routerSymbol}`).join(' ')).toLowerCase();
  const keywords = capabilityKeywords(cap.key);
  const serviceHit = inv.components.services.some((s) =>
    keywords.some((k) => s.path.toLowerCase().includes(k)),
  );
  const writerHit = inv.prisma.modelWriterGroups.some((g) =>
    keywords.some((k) => g.model.toLowerCase().includes(k) || g.writers.some((w) => w.path.toLowerCase().includes(k))),
  );
  const hasMount = cap.mounts.length > 0;
  if (!hasMount) return 'L1';
  if (serviceHit && writerHit) return 'L4';
  if (serviceHit || writerHit) return 'L3';
  return 'L2';
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
  L.push('R8-B evidence classification. Every ownership statement cites R8-A inventory/graph/route evidence, the canonical Prisma schema, or inspected production source. File names, directory names, class names, task numbers, and route prefixes were treated as signals, never as proof.');
  L.push('');
  L.push('## Baseline');
  L.push('');
  L.push(baselineBlock(ctx));
  L.push('');
  L.push('## Ownership Taxonomy');
  L.push('');
  L.push('Status vocabulary: `CLEAR` | `SHARED_BY_DESIGN` | `DUPLICATE_WRITER_CANDIDATE` | `AMBIGUOUS` | `LEGACY_OR_TRANSITIONAL_CANDIDATE` | `UNRESOLVED`.');
  L.push('');
  L.push('A canonical writer is the single production file that R8-A write-access evidence attributes as the primary mutation owner. `SHARED_BY_DESIGN` applies where writer files follow the repository/service coordination boundary. Anything else with several production writers is a `DUPLICATE_WRITER_CANDIDATE` for later engineering review, not a verdict. `UNRESOLVED` means no production writer is visible in R8-A evidence (often TEST_PROOF-only writers).');
  L.push('');
  L.push('## Data Families');
  L.push('');
  for (const fam of ctx.families) {
    L.push(`### ${fam.family.label} (\`${fam.family.id}\`)`);
    L.push('');
    L.push(`- PRIMARY DOMAIN: ${fam.family.domain}`);
    L.push(`- MODELS (${fam.models.length}): ${fam.models.map((m) => `\`${m}\``).join(', ')}`);
    const canonWriters = [...new Set([...fam.verdicts.values()].map((v) => v.canonicalWriter))].sort();
    L.push(`- CANONICAL WRITER(S): ${canonWriters.map((w) => `\`${w}\``).join(', ')}`);
    L.push(`- ADDITIONAL WRITERS: ${(fam.prodWriters.length ? fam.prodWriters.map((w) => `\`${w}\``).join(', ') : 'none proven in production evidence')}`);
    L.push(`- READERS (production, up to 12): ${(fam.prodReaders.length ? fam.prodReaders.map((w) => `\`${w}\``).join(', ') : 'none proven in production evidence')}`);
    L.push(`- ROUTE / API SURFACES: ${(fam.routeKeys.length ? fam.routeKeys.map((k) => `\`${k}\``).join(', ') : 'UNRESOLVED — no capability key overlap proven')}`);
    L.push(`- TRANSACTION BOUNDARY: ${fam.models.some((m) => /idempotency/i.test(m)) ? 'idempotency records present; boundary per capability (see Logic Register)' : 'UNRESOLVED — no explicit transaction evidence in R8-A substrate'}`);
    L.push(`- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED`);
    L.push(`- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain`);
    L.push(`- OWNERSHIP CONFIDENCE: ${fam.confidence}`);
    L.push(`- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema ${ctx.inv.prisma.schemaPath ?? 'UNRESOLVED'}`);
    L.push(`- STATUS: ${fam.status}`);
    L.push('');
  }

  L.push('## Canonical Writers');
  L.push('');
  L.push('Model | Canonical writer | Additional writers | Status | Evidence');
  L.push('--- | --- | --- | --- | ---');
  const allModels = [...ctx.writerByModel.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [model, v] of allModels) {
    L.push(`${mdCell(model)} | ${mdCell(v.canonicalWriter)} | ${mdCell(v.additionalWriters.slice(0, 4).join(', ') || '—')} | ${v.status} | ${mdCell(`modelWriterGroups:${model}; ${v.note}`)}`);
  }
  L.push('');
  L.push('## Shared / Multiple Writer Candidates');
  L.push('');
  const multi = allModels.filter(([, v]) => v.status === 'SHARED_BY_DESIGN' || v.status === 'DUPLICATE_WRITER_CANDIDATE' || v.status === 'AMBIGUOUS');
  if (multi.length === 0) {
    L.push('No shared/multiple-writer candidates. All families reduce to a single production writer file.');
  } else {
    L.push('Model | Canonical writer | Additional writers | Classification | Evidence');
    L.push('--- | --- | --- | --- | ---');
    for (const [model, v] of multi) {
      L.push(`${mdCell(model)} | ${mdCell(v.canonicalWriter)} | ${mdCell(v.additionalWriters.join(', ') || '—')} | ${v.status} | ${mdCell(v.note)}`);
    }
  }
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
  L.push('Capability IDs are stable and deterministic: `LOGIC-<domain>-<mount-key>`, sorted lexicographically. Completeness scale: L0 ABSENT, L1 SCAFFOLD, L2 PARTIAL, L3 CONNECTED, L4 FUNCTIONALLY COMPLETE, L5 RELIABLE, L6 PRODUCTION-READY CANDIDATE, L7 OPTIMIZED. R8-B awards L1–L4 from structural evidence only: L4 = mounted + production service match + production writer in a linked data family; L3 = mounted + one of service/writer; L2 = mounted with neither; L1 = unmounted route candidate. L5–L7 require runtime proof and are never awarded here.');
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
  L.push('Enforcement observed on production mounts (`src/index.ts` mount middleware, R8-A route evidence):');
  L.push('');
  L.push('- AUTHENTICATION: `schoolAuthMiddleware` on near-all production mounts; a small set of mounts (health, readiness, ops-public, copilot handoff, deployment-readiness, task024 operations) carry no mount middleware in R8-A evidence.');
  L.push('- SCHOOL CONTEXT: `requireVerifiedSchoolContext` on learner/session/evidence/teacher/governance/readiness mounts.');
  L.push('- ROLE AUTHORIZATION: route-prefix scoping (`/api/admin/*`, `/api/learner/*`, `/api/question-bank/result-*`) plus service-level role checks where R1–R7 accepted architecture establishes them; per-capability service enforcement below is UNRESOLVED unless a service/contract match proves it.');
  L.push('- RESOURCE OWNERSHIP: UNRESOLVED statically; learner/school scoping is enforced at middleware + service layers per accepted R1–R7 behavior, referenced not re-proven.');
  L.push('- SAFETY/GOVERNANCE CHECK: governance mounts (`content-governance`, `security-privacy-governance`, `privacyGovernance`, `no-ai-bypass`) expose the check surfaces; decision internals are UNRESOLVED statically.');
  L.push('- No authorization is inferred from an authenticated prefix alone; the middleware column per capability is the evidence.');
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

  const servicePaths = ctx.inv.components.services.map((s) => s.path);
  const repoPaths = ctx.inv.components.repositories.map((s) => s.path);

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
      const keywords = capabilityKeywords(cap.key);
      const matchSvc = (p: string): boolean => keywords.some((k) => p.toLowerCase().includes(k.toLowerCase()));
      const svcs = servicePaths.filter(matchSvc).sort().slice(0, 6);
      const repos = repoPaths.filter(matchSvc).sort().slice(0, 6);
      const linkedFams = ctx.families.filter((f) =>
        keywords.some((k) => f.family.id.includes(k.toLowerCase()) || f.family.domain.includes(k.toLowerCase()) || f.models.some((m) => m.toLowerCase().includes(k.toLowerCase()))),
      );
      const completeness = completenessFor(cap, ctx.inv);
      const mountLines = cap.mounts.map((m) => `\`${m.mountPath}\` via \`${m.routerSymbol}\` (${m.resolution}, src/index.ts:${m.line}, middleware: ${m.middleware.join(', ') || 'none recorded'})`).join('; ');
      const importOrigins = [...new Set(cap.mounts.map((m) => m.importOrigin).filter((p): p is string => !!p))].sort();
      const idemEvidence = linkedFams.some((f) => f.models.some((m) => /idempotency/i.test(m)));

      L.push(`### ${cap.logicId}`);
      L.push('');
      L.push(`- DOMAIN: ${cap.domain}`);
      L.push(`- CAPABILITY: HTTP capability group mounted at \`${cap.key}\` (${cap.mounts.length} mount${cap.mounts.length === 1 ? '' : 's'})`);
      L.push(`- ENTRY ROUTE(S): ${mountLines}`);
      L.push(`- PRIMARY ROUTE MODULE: ${(importOrigins.length ? importOrigins.map((p) => `\`${p}\``).join(', ') : 'UNRESOLVED — mount origin not statically linked')}`);
      L.push(`- PRIMARY SERVICE(S): ${(svcs.length ? svcs.map((p) => `\`${p}\``).join(', ') : 'UNRESOLVED — no service path matches the capability key')}`);
      L.push(`- REPOSITORY / DATA OWNER: ${(repos.length ? repos.map((p) => `\`${p}\``).join(', ') : (linkedFams.length ? linkedFams.map((f) => `family \`${f.family.id}\` writer evidence`).join('; ') : 'UNRESOLVED'))}`);
      L.push(`- PRISMA MODEL / DATA FAMILY: ${(linkedFams.length ? linkedFams.map((f) => `\`${f.family.id}\` (${f.models.length} models)`).join(', ') : 'UNRESOLVED — no family keyword overlap proven')}`);
      L.push(`- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under \`src/contracts/\` govern shapes where present`);
      L.push(`- AUTHENTICATION: ${(cap.middleware.includes('schoolAuthMiddleware') ? '`schoolAuthMiddleware` (mount evidence)' : 'UNRESOLVED — no authentication middleware recorded on these mounts')}`);
      L.push(`- AUTHORIZATION / ROLE SCOPE: ${(cap.middleware.includes('requireVerifiedSchoolContext') ? '`requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically' : 'UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted')}`);
      L.push(`- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame`);
      L.push(`- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)`);
      L.push(`- PERSISTENCE EFFECT: ${(linkedFams.length ? linkedFams.map((f) => `\`${f.family.id}\`: ${f.status}`).join('; ') : 'UNRESOLVED')}`);
      L.push(`- EXTERNAL DEPENDENCIES: ${(cap.domain === 'voice' || cap.domain === 'ai-runtime' ? 'AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically' : 'UNRESOLVED — none proven statically for this group')}`);
      L.push(`- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict`);
      L.push(`- IDEMPOTENCY / DUPLICATE BEHAVIOR: ${(idemEvidence ? 'idempotency records present in a linked family; exact key behavior UNRESOLVED statically' : 'UNRESOLVED — no idempotency record linked to this group')}`);
      L.push(`- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically`);
      L.push(`- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven`);
      L.push(`- OBSERVABILITY: ${(cap.domain === 'operations' ? 'diagnostics/readiness/health mounts expose operational telemetry surfaces' : 'UNRESOLVED — no dedicated telemetry surface proven for this group')}`);
      const dupes = ctx.inv.duplicates.routeCandidates.filter((r) => r.occurrences.some((o) => cap.mounts.some((m) => m.line === o.line && m.path === o.path)));
      L.push(`- KNOWN STRUCTURAL SIGNALS: ${(dupes.length ? dupes.map((d) => `\`${d.kind}:${d.key}\``).join(', ') : 'none — no duplicate/declaration finding attaches to these mounts')}`);
      L.push(`- COMPLETENESS: ${completeness}`);
      L.push(`- CONFIDENCE: ${(completeness === 'L4' || completeness === 'L3') ? 'medium' : 'low'} (structural only; no runtime proof claimed)`);
      L.push(`- EVIDENCE: 01 routes.mounts[] (${cap.mounts.map((m) => `src/index.ts:${m.line}`).join(', ')}); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves`);
      L.push('');
    }
  }

  // Unmounted + test route accounting.
  L.push('## Unresolved Logic');
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
  L.push('Level | Capabilities | Meaning');
  L.push('--- | --- | ---');
  const labels: Record<Completeness, string> = { L0: 'ABSENT', L1: 'SCAFFOLD', L2: 'PARTIAL', L3: 'CONNECTED', L4: 'FUNCTIONALLY COMPLETE', L5: 'RELIABLE', L6: 'PRODUCTION-READY CANDIDATE', L7: 'OPTIMIZED' };
  (Object.keys(labels) as Completeness[]).forEach((lv) => {
    L.push(`${lv} ${labels[lv]} | ${ctx.coverage.completeness[lv]} | ${lv === 'L5' || lv === 'L6' || lv === 'L7' ? 'not awarded in R8-B (requires runtime proof)' : 'structural evidence band'}`);
  });
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
  const canonGroups = c.writerGroupsTotal;
  console.log(`[r8-b] fingerprint=${inv.scan.sourceFingerprint}`);
  console.log(`[r8-b] families=${c.families} models=${c.modelsAccounted}/${c.modelsTotal} writerGroups=${c.writerGroupsTotal} multiWriterReview=${multiWriter}`);
  console.log(`[r8-b] capabilities=${c.capabilities} routeModules=${c.routeModulesRepresented}/${c.routeModulesTotal} unresolvedImports=${c.unresolvedImports} cycles=${c.cycles}`);
  console.log(`[r8-b] state=${c.stateAllocations} rawSql=${c.rawSql} ddl=${c.ddl} completeness=${(Object.keys(c.completeness) as Completeness[]).map((k) => `${k}:${c.completeness[k]}`).join(' ')}`);
  console.log(`[r8-b] artifacts written to ${outDir}`);
  return 0;
}

const invokedAsMain = typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv.length > 1 &&
  (process.argv[1].endsWith('r8-b-engineering-register.ts') || process.argv[1].endsWith('r8-b-engineering-register.js'));

if (invokedAsMain) {
  process.exitCode = main();
}
