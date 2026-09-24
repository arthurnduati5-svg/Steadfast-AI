// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-02: durable PracticeProblem authority
//
// ONE backend-owned PracticeProblem authority. PostgreSQL is the sole
// production authority (provisioned "PracticeProblem" table, see prisma
// migration 20260925000000_pp02_practice_problem_authority).
//
// Durability law (mirrors PP-01 check/version stores):
//   - Production reads/writes the provisioned table. No request-time
//     CREATE TABLE: a missing table is a persistence failure, not DDL.
//   - Database/table/read/write failure in production THROWS
//     PracticeProblemError('PROBLEM_PERSISTENCE_FAILED'). Never silently
//     falls back to memory in production.
//   - Process memory exists ONLY behind
//     __enablePracticeProblemMemoryForTest, an explicit injected test
//     double used solely by focused PP-02 tests that run with Prisma
//     mocked unavailable. Production never enables it.
//   - Insert-only versioning: issued versions are never mutated in place.
//     Validation transitions (PROPOSED→VALIDATING→READY|REJECTED|
//     REQUIRES_SEMANTIC_VALIDATION) and retire flags are the only updates.
//   - No model calls. Deterministic validation only; anything that cannot
//     be proven valid is held (REQUIRES_SEMANTIC_VALIDATION) or rejected,
//     never fabricated READY.
// ─────────────────────────────────────────────────────────────

import prisma from '../../lib/prisma';
import {
  PRACTICE_PROBLEM_MATERIAL_FIELDS,
  toPracticeProblemLearnerProjection,
  PracticeProblemError,
  type PracticeProblemEvaluationType,
  type PracticeProblemRecord,
  type PracticeProblemSourceType,
  type PracticeProblemValidationStatus,
  type PracticeProblemValidationVerdict,
  type ProposePracticeProblemInput,
} from './practiceProblemContracts';

const SUPPORTED_SOURCES: readonly PracticeProblemSourceType[] = [
  'QUESTION_BANK',
  'TUTOR_GENERATED',
  'ARTIFACT_DERIVED',
  'VIDEO_DERIVED',
  'REVISION_DERIVED',
];

const SUPPORTED_EVALUATION_TYPES: readonly PracticeProblemEvaluationType[] = [
  'deterministic_exact',
  'deterministic_numeric',
  'deterministic_algebraic',
  'semantic_deferred',
];

const MAX_PROMPT_LENGTH = 2000;
const MIN_PROMPT_LENGTH = 8;
const MAX_RESOURCES = 20;
const MAX_RESOURCE_LENGTH = 120;

// ── Explicit test seam ONLY (focused PP-02 tests, Prisma mocked) ──
// Null in production: any database failure then throws instead of
// succeeding from memory.
let testMemory: Map<string, PracticeProblemRecord> | null = null;

/**
 * Install an explicit in-memory test double. Focused PP-02 tests only.
 * Never called by production code; never inferred from a DB failure.
 */
export function __enablePracticeProblemMemoryForTest(): void {
  if (!testMemory) testMemory = new Map<string, PracticeProblemRecord>();
}

export function __resetPracticeProblemMemoryForTest(): void {
  if (testMemory) testMemory.clear();
}

/**
 * Remove the in-memory test double entirely (back to production-like null).
 * Proves fail-closed behavior: with no double and no database, every
 * durable operation throws PROBLEM_PERSISTENCE_FAILED.
 */
export function __disablePracticeProblemMemoryForTest(): void {
  testMemory = null;
}

function versionKey(problemId: string, problemVersion: number): string {
  return `${problemId}::v${problemVersion}`;
}

function nowISO(now?: () => string): string {
  return now ? now() : new Date().toISOString();
}

function persistenceFailure(operation: string, cause: unknown): PracticeProblemError {
  return new PracticeProblemError(
    'PROBLEM_PERSISTENCE_FAILED',
    `PracticeProblem store ${operation} failed; failing closed — no memory fallback. Cause: ${String((cause as Error)?.message || cause)}`,
  );
}

function freezeRecord(record: PracticeProblemRecord): PracticeProblemRecord {
  const frozen: PracticeProblemRecord = {
    ...record,
    allowedResources: Object.freeze([...record.allowedResources]) as string[],
    acceptableAnswerForms: Object.freeze([...record.acceptableAnswerForms]) as string[],
  };
  return Object.freeze(frozen);
}

function copyRecord(record: PracticeProblemRecord): PracticeProblemRecord {
  return {
    ...record,
    allowedResources: [...record.allowedResources],
    acceptableAnswerForms: [...record.acceptableAnswerForms],
  };
}

// ── Deterministic validation (pure, no I/O, no models) ──

export interface ProblemValidationReport {
  verdict: PracticeProblemValidationVerdict;
  reasons: string[];
}

function normalize(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, '').toLowerCase();
}

function tryParseNumeric(text: string): number | null {
  const cleaned = text.replace(/\s+/g, '').replace(/,/g, '');
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Deterministic problem validation (§8). Pure function: school/source
 * scope, non-empty prompt, supported representation, valid source
 * reference, evaluation contract, protected-answer separation,
 * expected-answer consistency where provable, curriculum reference shape,
 * allowed resources, answer-key leakage. Anything that cannot be proven
 * valid is held or rejected — never fabricated READY.
 */
export function validateProblemDeterministically(
  record: Pick<
    PracticeProblemRecord,
    | 'schoolId'
    | 'sourceType'
    | 'sourceRef'
    | 'prompt'
    | 'evaluationType'
    | 'evaluationPlan'
    | 'expectedAnswer'
    | 'acceptableAnswerForms'
    | 'curriculumVersionId'
    | 'curriculumObjectiveId'
    | 'curriculumSkillId'
    | 'allowedResources'
  >,
): ProblemValidationReport {
  const invalid: string[] = [];
  const hold: string[] = [];

  if (!record.schoolId || !record.schoolId.trim()) {
    invalid.push('school scope missing');
  }
  if (!SUPPORTED_SOURCES.includes(record.sourceType)) {
    invalid.push(`unsupported source type: ${String(record.sourceType)}`);
  }
  const sourceRef = (record.sourceRef || '').trim();
  if (!sourceRef) {
    invalid.push('source reference missing');
  } else if (record.sourceType === 'QUESTION_BANK') {
    const parts = sourceRef.split(':').map((p) => p.trim()).filter(Boolean);
    if (parts.length !== 2) {
      invalid.push('QUESTION_BANK sourceRef must reference an exact governed version as "questionId:questionVersionId"');
    }
  }
  const prompt = (record.prompt || '').trim();
  if (!prompt) {
    invalid.push('prompt empty');
  } else {
    if (prompt.length < MIN_PROMPT_LENGTH) invalid.push('prompt too short; missing information');
    if (prompt.length > MAX_PROMPT_LENGTH) invalid.push('prompt exceeds supported representation length');
    if (/\[insert|todo|fixme|xxx|\?\?\?/i.test(prompt)) invalid.push('prompt contains placeholder/broken markers');
  }
  if (!SUPPORTED_EVALUATION_TYPES.includes(record.evaluationType)) {
    invalid.push(`unsupported evaluation type: ${String(record.evaluationType)}`);
  }
  const plan = (record.evaluationPlan || '').trim();
  const expected = (record.expectedAnswer || '').trim();
  const isDeterministic = record.evaluationType !== 'semantic_deferred';
  if (isDeterministic) {
    if (!expected) invalid.push('deterministic evaluation requires a server-owned expected answer');
    if (!plan) invalid.push('evaluation contract missing: evaluationPlan required');
  } else {
    if (!plan) invalid.push('evaluation contract missing: evaluationPlan required even when deferred');
    if (!expected) hold.push('no expected answer yet; held for semantic validation, never READY by default');
  }
  if (expected) {
    // Protected-answer separation: the learner prompt must not expose it.
    const strippedExpected = normalize(expected);
    if (strippedExpected.length >= 2 && normalize(prompt).includes(strippedExpected)) {
      invalid.push('answer accidentally exposed in learner prompt');
    }
    // Expected-answer consistency where existing deterministic validators
    // can prove it.
    if (record.evaluationType === 'deterministic_numeric' && tryParseNumeric(expected) === null) {
      invalid.push('numeric evaluation contract is provably broken: expected answer is not numeric');
    }
    if (record.evaluationType === 'deterministic_algebraic') {
      const sides = expected.split('=');
      if (sides.length < 2 || !sides.every((s) => s.trim())) {
        invalid.push('algebraic evaluation contract is provably broken: expected answer is not an equation');
      }
    }
  }
  if (!expected && record.acceptableAnswerForms && record.acceptableAnswerForms.length > 0) {
    hold.push('acceptable answer forms without an expected answer; held for semantic validation');
  }
  for (const [label, value] of [
    ['curriculumVersionId', record.curriculumVersionId],
    ['curriculumObjectiveId', record.curriculumObjectiveId],
    ['curriculumSkillId', record.curriculumSkillId],
  ] as const) {
    if (value !== null && value !== undefined && String(value).trim() === '') {
      invalid.push(`curriculum reference malformed: ${label} blank`);
    }
  }
  if (!Array.isArray(record.allowedResources)) {
    invalid.push('allowed resources must be a list');
  } else {
    if (record.allowedResources.length > MAX_RESOURCES) invalid.push('allowed resources exceed supported count');
    for (const resource of record.allowedResources) {
      if (typeof resource !== 'string' || !resource.trim() || resource.trim().length > MAX_RESOURCE_LENGTH) {
        invalid.push('allowed resources contain an invalid entry');
        break;
      }
    }
  }

  if (invalid.length > 0) return { verdict: 'invalid', reasons: invalid };
  if (hold.length > 0) return { verdict: 'needs_semantic_review', reasons: hold };
  return { verdict: 'valid', reasons: ['deterministic validation passed'] };
}

// ── Durable row mapping ──

const PROBLEM_COLUMNS = [
  'problemId',
  'problemVersion',
  'schoolId',
  'sourceType',
  'sourceRef',
  'sourceVersion',
  'subject',
  'topic',
  'subtopic',
  'gradeBand',
  'prompt',
  'allowedResources',
  'curriculumVersionId',
  'curriculumObjectiveId',
  'curriculumSkillId',
  'evaluationType',
  'evaluationPlan',
  'expectedAnswer',
  'acceptableAnswerForms',
  'validationStatus',
  'createdAt',
  'validatedAt',
  'retiredAt',
] as const;

function mapRowToRecord(row: Record<string, unknown>): PracticeProblemRecord {
  const parseJsonStrings = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  const iso = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof (value as { toISOString?: unknown }).toISOString === 'function') {
      return (value as { toISOString: () => string }).toISOString();
    }
    return String(value);
  };
  return {
    problemId: String(row.problemId),
    problemVersion: Number(row.problemVersion),
    schoolId: String(row.schoolId),
    sourceType: String(row.sourceType) as PracticeProblemSourceType,
    sourceRef: String(row.sourceRef),
    sourceVersion: (row.sourceVersion as string | null) ?? null,
    subject: (row.subject as string | null) ?? null,
    topic: (row.topic as string | null) ?? null,
    subtopic: (row.subtopic as string | null) ?? null,
    gradeBand: (row.gradeBand as string | null) ?? null,
    prompt: String(row.prompt),
    allowedResources: parseJsonStrings(row.allowedResources),
    curriculumVersionId: (row.curriculumVersionId as string | null) ?? null,
    curriculumObjectiveId: (row.curriculumObjectiveId as string | null) ?? null,
    curriculumSkillId: (row.curriculumSkillId as string | null) ?? null,
    evaluationType: String(row.evaluationType) as PracticeProblemEvaluationType,
    evaluationPlan: (row.evaluationPlan as string | null) ?? null,
    expectedAnswer: (row.expectedAnswer as string | null) ?? null,
    acceptableAnswerForms: parseJsonStrings(row.acceptableAnswerForms),
    validationStatus: String(row.validationStatus) as PracticeProblemValidationStatus,
    createdAt: iso(row.createdAt) || new Date().toISOString(),
    validatedAt: iso(row.validatedAt),
    retiredAt: iso(row.retiredAt),
  };
}

function recordToColumns(record: PracticeProblemRecord): unknown[] {
  return [
    record.problemId,
    record.problemVersion,
    record.schoolId,
    record.sourceType,
    record.sourceRef,
    record.sourceVersion ?? null,
    record.subject ?? null,
    record.topic ?? null,
    record.subtopic ?? null,
    record.gradeBand ?? null,
    record.prompt,
    JSON.stringify(record.allowedResources),
    record.curriculumVersionId ?? null,
    record.curriculumObjectiveId ?? null,
    record.curriculumSkillId ?? null,
    record.evaluationType,
    record.evaluationPlan ?? null,
    record.expectedAnswer ?? null,
    JSON.stringify(record.acceptableAnswerForms),
    record.validationStatus,
    record.createdAt,
    record.validatedAt ?? null,
    record.retiredAt ?? null,
  ];
}

async function readDurableVersion(
  problemId: string,
  problemVersion: number,
): Promise<PracticeProblemRecord | null> {
  const rows = await (prisma as unknown as {
    $queryRawUnsafe: (sql: string, ...args: unknown[]) => Promise<Record<string, unknown>[]>;
  }).$queryRawUnsafe(
    `SELECT * FROM "PracticeProblem" WHERE "problemId" = $1 AND "problemVersion" = $2 LIMIT 1`,
    problemId,
    problemVersion,
  );
  if (!rows[0]) return null;
  return mapRowToRecord(rows[0]);
}

async function readDurableLatestVersion(problemId: string): Promise<PracticeProblemRecord | null> {
  const rows = await (prisma as unknown as {
    $queryRawUnsafe: (sql: string, ...args: unknown[]) => Promise<Record<string, unknown>[]>;
  }).$queryRawUnsafe(
    `SELECT * FROM "PracticeProblem" WHERE "problemId" = $1 ORDER BY "problemVersion" DESC LIMIT 1`,
    problemId,
  );
  if (!rows[0]) return null;
  return mapRowToRecord(rows[0]);
}

async function writeDurableRecord(record: PracticeProblemRecord): Promise<void> {
  const placeholders = PROBLEM_COLUMNS.map((_, i) => `$${i + 1}`).join(',');
  await (prisma as unknown as {
    $executeRawUnsafe: (sql: string, ...args: unknown[]) => Promise<unknown>;
  }).$executeRawUnsafe(
    `INSERT INTO "PracticeProblem" (${PROBLEM_COLUMNS.map((c) => `"${c}"`).join(',')}) VALUES (${placeholders})`,
    ...recordToColumns(record),
  );
}

async function updateDurableStatus(
  problemId: string,
  problemVersion: number,
  status: PracticeProblemValidationStatus,
  validatedAt: string | null,
): Promise<void> {
  await (prisma as unknown as {
    $executeRawUnsafe: (sql: string, ...args: unknown[]) => Promise<unknown>;
  }).$executeRawUnsafe(
    `UPDATE "PracticeProblem" SET "validationStatus" = $3, "validatedAt" = $4 WHERE "problemId" = $1 AND "problemVersion" = $2`,
    problemId,
    problemVersion,
    status,
    validatedAt,
  );
}

async function updateDurableRetiredAt(problemId: string, problemVersion: number, retiredAt: string): Promise<void> {
  await (prisma as unknown as {
    $executeRawUnsafe: (sql: string, ...args: unknown[]) => Promise<unknown>;
  }).$executeRawUnsafe(
    `UPDATE "PracticeProblem" SET "retiredAt" = $3 WHERE "problemId" = $1 AND "problemVersion" = $2`,
    problemId,
    problemVersion,
    retiredAt,
  );
}

function rememberInTestDouble(record: PracticeProblemRecord): void {
  if (testMemory) testMemory.set(versionKey(record.problemId, record.problemVersion), freezeRecord(record));
}

// ── Authority ──

export interface PracticeProblemStoreOptions {
  now?: () => string;
}

function buildProposedRecord(input: ProposePracticeProblemInput, problemVersion: number, opts?: PracticeProblemStoreOptions): PracticeProblemRecord {
  const problemId = (input.problemId || '').trim();
  const schoolId = (input.schoolId || '').trim();
  if (!problemId) throw new PracticeProblemError('PROBLEM_SOURCE_INVALID', 'problemId is required.');
  if (!schoolId) throw new PracticeProblemError('PROBLEM_SCOPE_MISMATCH', 'school scope is required.');
  if (!SUPPORTED_SOURCES.includes(input.sourceType)) {
    throw new PracticeProblemError('PROBLEM_SOURCE_INVALID', `unsupported source type: ${String(input.sourceType)}`);
  }
  if (!(input.sourceRef || '').trim()) {
    throw new PracticeProblemError('PROBLEM_SOURCE_INVALID', 'sourceRef is required.');
  }
  if (!SUPPORTED_EVALUATION_TYPES.includes(input.evaluationType)) {
    throw new PracticeProblemError('PROBLEM_EVALUATION_INVALID', `unsupported evaluation type: ${String(input.evaluationType)}`);
  }
  if (!(input.prompt || '').trim()) {
    throw new PracticeProblemError('PROBLEM_EVALUATION_INVALID', 'prompt is required.');
  }
  return {
    problemId,
    problemVersion,
    schoolId,
    sourceType: input.sourceType,
    sourceRef: input.sourceRef.trim(),
    sourceVersion: input.sourceVersion?.trim() || null,
    subject: input.subject?.trim() || null,
    topic: input.topic?.trim() || null,
    subtopic: input.subtopic?.trim() || null,
    gradeBand: input.gradeBand?.trim() || null,
    prompt: input.prompt.trim().slice(0, MAX_PROMPT_LENGTH),
    allowedResources: [...(input.allowedResources || [])],
    curriculumVersionId: input.curriculumVersionId?.trim() || null,
    curriculumObjectiveId: input.curriculumObjectiveId?.trim() || null,
    curriculumSkillId: input.curriculumSkillId?.trim() || null,
    evaluationType: input.evaluationType,
    evaluationPlan: input.evaluationPlan?.trim() || null,
    expectedAnswer: input.expectedAnswer?.trim() || null,
    acceptableAnswerForms: [...(input.acceptableAnswerForms || [])],
    validationStatus: 'PROPOSED',
    createdAt: nowISO(opts?.now),
    validatedAt: null,
    retiredAt: null,
  };
}

export const practiceProblemStore = {
  /**
   * Propose a new problem (version 1). Authoring misuse (duplicate id,
   * malformed input) throws PracticeProblemError; database failure throws
   * PROBLEM_PERSISTENCE_FAILED — never a silent memory success.
   */
  async proposeProblem(input: ProposePracticeProblemInput, opts?: PracticeProblemStoreOptions): Promise<PracticeProblemRecord> {
    const record = buildProposedRecord(input, 1, opts);
    try {
      const existing = await readDurableLatestVersion(record.problemId);
      if (existing) throw new PracticeProblemError('PROBLEM_PERSISTENCE_FAILED', `problemId already exists: ${record.problemId}; use createNextVersion for material changes.`);
      await writeDurableRecord(record);
      rememberInTestDouble(record);
      return copyRecord(record);
    } catch (cause) {
      if (cause instanceof PracticeProblemError && cause.code !== 'PROBLEM_PERSISTENCE_FAILED') throw cause;
      if (testMemory) {
        if (testMemory.has(versionKey(record.problemId, 1))) {
          throw new PracticeProblemError('PROBLEM_PERSISTENCE_FAILED', `problemId already exists: ${record.problemId}; use createNextVersion for material changes.`);
        }
        rememberInTestDouble(record);
        return copyRecord(record);
      }
      if (cause instanceof PracticeProblemError) throw cause;
      throw persistenceFailure('propose', cause);
    }
  },

  /**
   * Run deterministic validation and advance the lifecycle:
   * PROPOSED|VALIDATING → VALIDATING → READY | REJECTED |
   * REQUIRES_SEMANTIC_VALIDATION. Terminal READY/REJECTED states never
   * revalidate in place; fixes require a new version.
   */
  async validateProblem(
    problemId: string,
    problemVersion: number,
    opts?: PracticeProblemStoreOptions,
  ): Promise<{ record: PracticeProblemRecord; verdict: PracticeProblemValidationVerdict; reasons: string[] }> {
    const loaded = await this.loadVersion(problemId, problemVersion);
    if (loaded.validationStatus === 'REJECTED') {
      throw new PracticeProblemError(
        'PROBLEM_REJECTED',
        `version ${problemVersion} of ${problemId} was rejected; material fixes require a new version.`,
      );
    }
    if (loaded.validationStatus === 'READY') {
      throw new Error(`version ${problemVersion} of ${problemId} is already READY; material fixes require a new version.`);
    }
    const report = validateProblemDeterministically(loaded);
    const nextStatus: PracticeProblemValidationStatus =
      report.verdict === 'valid' ? 'READY' : report.verdict === 'invalid' ? 'REJECTED' : 'REQUIRES_SEMANTIC_VALIDATION';
    const validatedAt = nextStatus === 'READY' ? nowISO(opts?.now) : null;
    const updated: PracticeProblemRecord = { ...loaded, validationStatus: nextStatus, validatedAt };
    try {
      await updateDurableStatus(problemId, problemVersion, nextStatus, validatedAt);
      rememberInTestDouble(updated);
      return { record: copyRecord(updated), verdict: report.verdict, reasons: report.reasons };
    } catch (cause) {
      if (testMemory) {
        rememberInTestDouble(updated);
        return { record: copyRecord(updated), verdict: report.verdict, reasons: report.reasons };
      }
      throw persistenceFailure('validate', cause);
    }
  },

  /**
   * Create a new immutable version. Material and non-material changes alike
   * produce a new version; issued versions are never mutated in place. Old
   * attempts keep pointing at their original version.
   */
  async createNextVersion(
    problemId: string,
    changes: Partial<
      Pick<
        PracticeProblemRecord,
        | 'prompt'
        | 'expectedAnswer'
        | 'acceptableAnswerForms'
        | 'evaluationPlan'
        | 'evaluationType'
        | 'curriculumVersionId'
        | 'curriculumObjectiveId'
        | 'curriculumSkillId'
        | 'allowedResources'
        | 'subject'
        | 'topic'
        | 'subtopic'
        | 'gradeBand'
        | 'sourceVersion'
      >
    >,
    opts?: PracticeProblemStoreOptions,
  ): Promise<PracticeProblemRecord> {
    const latest = await this.loadLatestVersion(problemId);
    const next: PracticeProblemRecord = {
      ...copyRecord(latest),
      prompt: changes.prompt !== undefined ? changes.prompt.trim().slice(0, MAX_PROMPT_LENGTH) : latest.prompt,
      expectedAnswer: changes.expectedAnswer !== undefined ? changes.expectedAnswer?.trim() || null : latest.expectedAnswer,
      acceptableAnswerForms: changes.acceptableAnswerForms !== undefined ? [...changes.acceptableAnswerForms] : [...latest.acceptableAnswerForms],
      evaluationPlan: changes.evaluationPlan !== undefined ? changes.evaluationPlan?.trim() || null : latest.evaluationPlan,
      evaluationType: changes.evaluationType ?? latest.evaluationType,
      curriculumVersionId: changes.curriculumVersionId !== undefined ? changes.curriculumVersionId?.trim() || null : latest.curriculumVersionId,
      curriculumObjectiveId: changes.curriculumObjectiveId !== undefined ? changes.curriculumObjectiveId?.trim() || null : latest.curriculumObjectiveId,
      curriculumSkillId: changes.curriculumSkillId !== undefined ? changes.curriculumSkillId?.trim() || null : latest.curriculumSkillId,
      allowedResources: changes.allowedResources !== undefined ? [...changes.allowedResources] : [...latest.allowedResources],
      subject: changes.subject !== undefined ? changes.subject?.trim() || null : latest.subject,
      topic: changes.topic !== undefined ? changes.topic?.trim() || null : latest.topic,
      subtopic: changes.subtopic !== undefined ? changes.subtopic?.trim() || null : latest.subtopic,
      gradeBand: changes.gradeBand !== undefined ? changes.gradeBand?.trim() || null : latest.gradeBand,
      sourceVersion: changes.sourceVersion !== undefined ? changes.sourceVersion?.trim() || null : latest.sourceVersion,
      problemVersion: latest.problemVersion + 1,
      validationStatus: 'PROPOSED',
      createdAt: nowISO(opts?.now),
      validatedAt: null,
      retiredAt: null,
    };
    try {
      await writeDurableRecord(next);
      rememberInTestDouble(next);
      return copyRecord(next);
    } catch (cause) {
      if (testMemory) {
        rememberInTestDouble(next);
        return copyRecord(next);
      }
      throw persistenceFailure('version', cause);
    }
  },

  /** Load an exact version. Throws explicit PP-02 codes; never synthesizes. */
  async loadVersion(problemId: string, problemVersion: number): Promise<PracticeProblemRecord> {
    const id = (problemId || '').trim();
    if (!id) throw new PracticeProblemError('PROBLEM_NOT_FOUND', 'problemId is required.');
    if (!Number.isInteger(problemVersion) || problemVersion < 1) {
      throw new PracticeProblemError('PROBLEM_VERSION_NOT_FOUND', `invalid problemVersion: ${String(problemVersion)}`);
    }
    try {
      const durable = await readDurableVersion(id, problemVersion);
      if (durable) {
        rememberInTestDouble(durable);
        return copyRecord(durable);
      }
      if (testMemory) {
        const held = testMemory.get(versionKey(id, problemVersion));
        if (held) return copyRecord(held);
        // Exact version absent: distinguish unknown problem from unknown
        // version only from durable/test truth, never by guessing.
        for (const heldRecord of testMemory.values()) {
          if (heldRecord.problemId === id) {
            throw new PracticeProblemError('PROBLEM_VERSION_NOT_FOUND', `version ${problemVersion} of ${id} does not exist.`);
          }
        }
      }
      // Durable truth has no such version. Without test-double evidence of
      // sibling versions, report not found (never invent a version).
      throw new PracticeProblemError('PROBLEM_NOT_FOUND', `practice problem not found: ${id} v${problemVersion}`);
    } catch (cause) {
      if (cause instanceof PracticeProblemError) throw cause;
      if (testMemory) {
        const held = testMemory.get(versionKey(id, problemVersion));
        if (held) return copyRecord(held);
        for (const heldRecord of testMemory.values()) {
          if (heldRecord.problemId === id) {
            throw new PracticeProblemError('PROBLEM_VERSION_NOT_FOUND', `version ${problemVersion} of ${id} does not exist.`);
          }
        }
        throw new PracticeProblemError('PROBLEM_NOT_FOUND', `practice problem not found: ${id} v${problemVersion}`);
      }
      throw persistenceFailure('read', cause);
    }
  },

  /** Load the latest version of a problem (any status). */
  async loadLatestVersion(problemId: string): Promise<PracticeProblemRecord> {
    const id = (problemId || '').trim();
    if (!id) throw new PracticeProblemError('PROBLEM_NOT_FOUND', 'problemId is required.');
    try {
      const durable = await readDurableLatestVersion(id);
      if (durable) {
        rememberInTestDouble(durable);
        return copyRecord(durable);
      }
      if (testMemory) {
        let best: PracticeProblemRecord | null = null;
        for (const heldRecord of testMemory.values()) {
          if (heldRecord.problemId === id && (!best || heldRecord.problemVersion > best.problemVersion)) {
            best = heldRecord;
          }
        }
        if (best) return copyRecord(best);
        throw new PracticeProblemError('PROBLEM_NOT_FOUND', `practice problem not found: ${id}`);
      }
      throw new PracticeProblemError('PROBLEM_NOT_FOUND', `practice problem not found: ${id}`);
    } catch (cause) {
      if (cause instanceof PracticeProblemError) throw cause;
      if (testMemory) {
        let best: PracticeProblemRecord | null = null;
        for (const heldRecord of testMemory.values()) {
          if (heldRecord.problemId === id && (!best || heldRecord.problemVersion > best.problemVersion)) {
            best = heldRecord;
          }
        }
        if (best) return copyRecord(best);
        throw new PracticeProblemError('PROBLEM_NOT_FOUND', `practice problem not found: ${id}`);
      }
      throw persistenceFailure('read', cause);
    }
  },

  /**
   * Issuance gate: resolve the exact server-owned version for a school.
   * Only READY, unretired versions are issued. Every failure is an
   * explicit PP-02 code; invalid problems never become learner-negative
   * evidence because they never reach the checker.
   */
  async resolveReadyProblem(args: {
    problemId: string;
    problemVersion: number;
    schoolId: string;
  }): Promise<PracticeProblemRecord> {
    const record = await this.loadVersion(args.problemId, args.problemVersion);
    if (record.schoolId !== args.schoolId) {
      throw new PracticeProblemError('PROBLEM_SCOPE_MISMATCH', 'practice problem belongs to a different school scope.');
    }
    if (record.retiredAt) {
      throw new PracticeProblemError('PROBLEM_NOT_READY', `version ${record.problemVersion} of ${record.problemId} is retired.`);
    }
    if (record.validationStatus === 'REJECTED') {
      throw new PracticeProblemError('PROBLEM_REJECTED', `version ${record.problemVersion} of ${record.problemId} was rejected and must never be issued.`);
    }
    if (record.validationStatus !== 'READY') {
      throw new PracticeProblemError(
        'PROBLEM_NOT_READY',
        `version ${record.problemVersion} of ${record.problemId} is ${record.validationStatus}; only READY problems may be issued.`,
      );
    }
    return record;
  },

  /** Retire a version so it can no longer be issued. History is preserved. */
  async retireProblem(problemId: string, problemVersion: number, opts?: PracticeProblemStoreOptions): Promise<PracticeProblemRecord> {
    const loaded = await this.loadVersion(problemId, problemVersion);
    const retiredAt = nowISO(opts?.now);
    const updated: PracticeProblemRecord = { ...loaded, retiredAt };
    try {
      await updateDurableRetiredAt(problemId, problemVersion, retiredAt);
      rememberInTestDouble(updated);
      return copyRecord(updated);
    } catch (cause) {
      if (testMemory) {
        rememberInTestDouble(updated);
        return copyRecord(updated);
      }
      throw persistenceFailure('retire', cause);
    }
  },

  /** Learner-safe projection helper (re-exported for authority/runtime). */
  toLearnerProjection: toPracticeProblemLearnerProjection,

  /** Material-field list for version-law enforcement/tests. */
  materialFields: PRACTICE_PROBLEM_MATERIAL_FIELDS,

  async resetForTest(): Promise<void> {
    __resetPracticeProblemMemoryForTest();
    try {
      await (prisma as unknown as { $executeRawUnsafe: (sql: string) => Promise<unknown> }).$executeRawUnsafe(
        `DELETE FROM "PracticeProblem"`,
      );
    } catch {
      // Table may not exist in pure in-memory test runs.
    }
  },
};
