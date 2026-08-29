// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Service v1
// Owns artifact records, lifecycle, and access checks.
// Uses Prisma when available; falls back to in-memory store.
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import prisma from '../lib/prisma';
import type { Prisma } from '@prisma/client';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type {
  LearningArtifact,
  ArtifactBlock,
  ArtifactBlockKind,
  ArtifactKind,
  ArtifactAccessScope,
  ArtifactParseStatus,
  ArtifactStructureQuality,
  ArtifactSource,
  ArtifactIngestRequest,
  ArtifactParseResponse,
  ArtifactStructureResponse,
  ExtractedQuestion,
  AnswerKeyBlock,
  WorkedExampleBlock,
  DiagramBlock,
  ArtifactProvenance,
  ArtifactCurriculumRefs,
} from './artifactContracts';

// ── In-memory fallback stores ──
const artifactMemoryStore = new Map<string, LearningArtifact & { _blocks: ArtifactBlock[]; _questions: ExtractedQuestion[]; _answerKeys: AnswerKeyBlock[]; _workedExamples: WorkedExampleBlock[]; _diagrams: DiagramBlock[] }>();
const artifactLookupByKey = new Map<string, string>(); // schoolId:studentId:artifactId -> artifactId

// ── Prisma availability ──
let _prismaAvailable: boolean | null = null;

async function isPrismaAvailable(): Promise<boolean> {
  if (_prismaAvailable !== null) return _prismaAvailable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    _prismaAvailable = true;
  } catch {
    _prismaAvailable = false;
  }
  return _prismaAvailable;
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `art_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateBlockId(): string {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function computeFingerprint(content: string): string {
  return createHash('sha256').update(content || '').digest('hex').slice(0, 16);
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

// ── Access Control ──

export class ArtifactAccessError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 403) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ArtifactAccessError';
  }
}

/**
 * Assert the authenticated identity has access to an artifact.
 * Throws ArtifactAccessError (403) or returns silently.
 */
export async function assertArtifactAccess(
  artifact: LearningArtifact,
  identity: ResolvedTutorIdentity,
): Promise<void> {
  const scope = artifact.accessScope;

  // system_public: visible to anyone authenticated
  if (scope === 'system_public') return;

  // school_shared: same school only
  if (scope === 'school_shared') {
    if (artifact.schoolId !== identity.schoolId) {
      throw new ArtifactAccessError(
        'CROSS_SCHOOL_ACCESS_DENIED',
        'Artifact belongs to a different school.',
        404, // Prefer 404 for cross-tenant resources
      );
    }
    return;
  }

  // student_private: owner only
  if (scope === 'student_private') {
    if (!identity.studentId) {
      throw new ArtifactAccessError('UNAUTHENTICATED', 'Authentication required.', 401);
    }
    if (artifact.ownerStudentId !== identity.studentId) {
      throw new ArtifactAccessError(
        'CROSS_STUDENT_ACCESS_DENIED',
        'Artifact belongs to a different student.',
        403,
      );
    }
    return;
  }

  // teacher_to_student: not fully integrated in v1
  if (scope === 'teacher_to_student') {
    // In v1, only the owner teacher can access
    if (identity.role === 'teacher' && artifact.ownerTeacherId === identity.userId) return;
    // If target student mapping is not established, deny
    throw new ArtifactAccessError(
      'SCOPE_NOT_INTEGRATED',
      'Teacher-to-student sharing is not fully integrated in v1.',
      403,
    );
  }

  // class_shared: not fully integrated in v1 (class membership unknown)
  if (scope === 'class_shared') {
    // Allow teacher/admin owners
    if (artifact.ownerTeacherId && identity.role === 'teacher' && artifact.ownerTeacherId === identity.userId) return;
    // For students, we cannot verify class membership in v1
    throw new ArtifactAccessError(
      'SCOPE_NOT_INTEGRATED',
      'Class-level artifact sharing is not integrated in v1.',
      403,
    );
  }

  // Unknown scope — deny
  throw new ArtifactAccessError(
    'UNKNOWN_SCOPE',
    'Artifact has an unknown access scope.',
    403,
  );
}

/**
 * Check if the identity is allowed to access teacher_only restricted blocks.
 * Restricted content is NEVER visible to students, even to the owning student.
 * Teacher access is fail-closed: only verified teacher ownership or same-school
 * school_shared scope is allowed. No request flag can override this.
 */
export function isAnswerKeyAccessAllowed(
  artifact: LearningArtifact,
  identity: ResolvedTutorIdentity,
): boolean {
  if (!identity || !artifact) return false;
  const role = (identity.role || '').toLowerCase();
  // Admin is explicitly allowed
  if (role === 'admin') return true;
  // Teacher who owns the artifact is allowed
  if (role === 'teacher' && artifact.ownerTeacherId && artifact.ownerTeacherId === (identity.userId || identity.studentId)) {
    return true;
  }
  // Teacher in same school accessing a school_shared artifact is allowed
  if (role === 'teacher' && artifact.accessScope === 'school_shared' && artifact.schoolId === identity.schoolId) {
    return true;
  }
  // All other cases (including owner student) are denied for restricted content.
  return false;
}

export function isTeacherRole(identity: ResolvedTutorIdentity): boolean {
  const role = (identity.role || '').toLowerCase();
  return role === 'teacher' || role === 'admin';
}

// ── ArtifactService ──

export class ArtifactService {
  /**
   * Create a new artifact (ingest).
   */
  async createArtifact(
    identity: ResolvedTutorIdentity,
    input: ArtifactIngestRequest,
  ): Promise<LearningArtifact> {
    const now = nowISO();
    const contentText = [input.textContent || '', input.transcriptText || '', input.title || ''].join(' ');
    const fingerprint = computeFingerprint(contentText);

    const artifact: LearningArtifact = {
      artifactId: generateId(),
      schoolId: identity.schoolId,
      ownerStudentId: identity.studentId || null,
      ownerTeacherId: identity.role === 'teacher' ? identity.userId || identity.studentId : null,
      classId: input.classId || null,
      mediaAssetId: input.mediaAssetId?.trim() || null,
      kind: input.kind || 'unknown',
      accessScope: input.accessScope || 'student_private',
      title: input.title?.trim() || 'Untitled Artifact',
      description: input.description?.trim() || null,
      originalFileName: input.originalFileName?.trim() || null,
      mimeType: input.mimeType?.trim() || null,
      sizeBytes: input.sizeBytes ?? null,
      source: 'text_registration',
      parseStatus: 'not_parsed',
      structureQuality: 'unavailable',
      blockCount: 0,
      questionCount: 0,
      diagramCount: 0,
      answerKeyCount: 0,
      tableCount: 0,
      transcriptCount: 0,
      restrictedCount: 0,
      contentFingerprint: fingerprint,
      curriculumRefs: (input.curriculumRefs as LearningArtifact['curriculumRefs']) || {},
      createdAt: now,
      updatedAt: now,
      parsedAt: null,
      warnings: [],
    };

    // Persist to in-memory store
    const storeEntry = { ...artifact, _blocks: [], _questions: [], _answerKeys: [], _workedExamples: [], _diagrams: [] };
    artifactMemoryStore.set(artifact.artifactId, storeEntry);
    artifactLookupByKey.set(`${identity.schoolId}:${identity.studentId}:${artifact.artifactId}`, artifact.artifactId);

    // Try Prisma persistence
    await this._upsertPrismaArtifact(artifact);

    return artifact;
  }

  /**
   * Get an artifact by ID with access check.
   */
  async getArtifactForUser(
    identity: ResolvedTutorIdentity,
    artifactId: string,
  ): Promise<LearningArtifact | null> {
    // Try in-memory first
    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) {
      await assertArtifactAccess(memEntry, identity);
      return this._toPublicArtifact(memEntry);
    }

    // Try Prisma
    const fromDb = await this._getPrismaArtifact(artifactId);
    if (fromDb) {
      await assertArtifactAccess(fromDb, identity);
      return fromDb;
    }

    return null;
  }

  /**
   * Return a sanitized LearningArtifact view of an in-memory store entry,
   * stripping internal underscore-prefixed fields (_blocks, _answerKeys, etc.)
   * so they can never leak into API responses.
   */
  private _toPublicArtifact(memEntry: LearningArtifact & {
    _blocks: ArtifactBlock[];
    _questions: ExtractedQuestion[];
    _answerKeys: AnswerKeyBlock[];
    _workedExamples: WorkedExampleBlock[];
    _diagrams: DiagramBlock[];
  }): LearningArtifact {
    return {
      artifactId: memEntry.artifactId,
      schoolId: memEntry.schoolId,
      ownerStudentId: memEntry.ownerStudentId,
      ownerTeacherId: memEntry.ownerTeacherId,
      classId: memEntry.classId,
      mediaAssetId: memEntry.mediaAssetId,
      kind: memEntry.kind,
      accessScope: memEntry.accessScope,
      title: memEntry.title,
      description: memEntry.description,
      originalFileName: memEntry.originalFileName,
      mimeType: memEntry.mimeType,
      sizeBytes: memEntry.sizeBytes,
      source: memEntry.source,
      parseStatus: memEntry.parseStatus,
      structureQuality: memEntry.structureQuality,
      blockCount: memEntry.blockCount,
      questionCount: memEntry.questionCount,
      diagramCount: memEntry.diagramCount,
      answerKeyCount: memEntry.answerKeyCount,
      tableCount: memEntry.tableCount,
      transcriptCount: memEntry.transcriptCount,
      restrictedCount: memEntry.restrictedCount,
      contentFingerprint: memEntry.contentFingerprint,
      curriculumRefs: memEntry.curriculumRefs,
      createdAt: memEntry.createdAt,
      updatedAt: memEntry.updatedAt,
      parsedAt: memEntry.parsedAt,
      warnings: memEntry.warnings,
    };
  }

  /**
   * Get artifact with blocks and specialized data.
   */
  async getFullArtifact(
    identity: ResolvedTutorIdentity,
    artifactId: string,
  ): Promise<{
    artifact: LearningArtifact;
    blocks: ArtifactBlock[];
    questions: ExtractedQuestion[];
    answerKeys: AnswerKeyBlock[];
    workedExamples: WorkedExampleBlock[];
    diagrams: DiagramBlock[];
  } | null> {
    const artifact = await this.getArtifactForUser(identity, artifactId);
    if (!artifact) return null;

    const blocks = await this.listArtifactBlocks(artifactId);
    const questions = await this._getQuestions(artifactId);
    const answerKeys = await this._getAnswerKeys(artifactId);
    const workedExamples = await this._getWorkedExamples(artifactId);
    const diagrams = await this._getDiagrams(artifactId);

    return { artifact, blocks, questions, answerKeys, workedExamples, diagrams };
  }

  /**
   * List blocks for an artifact.
   */
  async listArtifactBlocks(artifactId: string): Promise<ArtifactBlock[]> {
    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) return memEntry._blocks;

    // Try Prisma
    const fromDb = await this._getPrismaBlocks(artifactId);
    return fromDb || [];
  }

  /**
   * Idempotency check: same MediaAsset + same content fingerprint + same effective
   * structured input → stable projection, no duplicate truth.
   * When not forced, returns true if the existing fingerprint matches the incoming content.
   */
  isReplayWithSameFingerprint(
    existing: LearningArtifact,
    incomingContent: string | null | undefined,
  ): boolean {
    if (!incomingContent) return false;
    const incomingFingerprint = computeFingerprint(incomingContent);
    return incomingFingerprint === existing.contentFingerprint && existing.blockCount > 0 && existing.parseStatus === 'parsed';
  }

  /**
   * Update artifact with parse result.
   * Atomic: artifact row + block replacement happen in one Prisma transaction.
   * Failed reparses MUST NOT destroy the last-known-good projection.
   */
  async updateArtifactParseResult(
    artifactId: string,
    result: {
      parseStatus: ArtifactParseStatus;
      structureQuality: ArtifactStructureQuality;
      blocks: ArtifactBlock[];
      questions: ExtractedQuestion[];
      answerKeys: AnswerKeyBlock[];
      workedExamples: WorkedExampleBlock[];
      diagrams: DiagramBlock[];
      warnings: string[];
    },
    curriculumRefs?: ArtifactCurriculumRefs,
    options?: { allowOverwriteOnFailure?: boolean },
  ): Promise<LearningArtifact> {
    const now = nowISO();
    const memEntry = artifactMemoryStore.get(artifactId);
    if (!memEntry) {
      throw new Error(`Artifact ${artifactId} not found in memory store`);
    }

    // R3.14: Failed reparse must not destroy a previously valid projection.
    // If the new result is a failure and a previous parsed projection exists,
    // keep the previous blocks and only append failure warnings.
    const previousWasUsable =
      memEntry.parseStatus === 'parsed' || memEntry.parseStatus === 'partial';
    const newIsFailure = result.parseStatus === 'failed' || result.parseStatus === 'unsupported';
    const shouldPreservePrevious = previousWasUsable && newIsFailure && !options?.allowOverwriteOnFailure;

    if (shouldPreservePrevious) {
      const preserved: LearningArtifact = {
        artifactId: memEntry.artifactId,
        schoolId: memEntry.schoolId,
        ownerStudentId: memEntry.ownerStudentId,
        ownerTeacherId: memEntry.ownerTeacherId,
        classId: memEntry.classId,
        mediaAssetId: memEntry.mediaAssetId,
        kind: memEntry.kind,
        accessScope: memEntry.accessScope,
        title: memEntry.title,
        description: memEntry.description,
        originalFileName: memEntry.originalFileName,
        mimeType: memEntry.mimeType,
        sizeBytes: memEntry.sizeBytes,
        source: memEntry.source,
        parseStatus: memEntry.parseStatus,
        structureQuality: memEntry.structureQuality,
        blockCount: memEntry.blockCount,
        questionCount: memEntry.questionCount,
        diagramCount: memEntry.diagramCount,
        answerKeyCount: memEntry.answerKeyCount,
        tableCount: memEntry.tableCount,
        transcriptCount: memEntry.transcriptCount,
        restrictedCount: memEntry.restrictedCount,
        contentFingerprint: memEntry.contentFingerprint,
        curriculumRefs: memEntry.curriculumRefs,
        createdAt: memEntry.createdAt,
        updatedAt: nowISO(),
        parsedAt: memEntry.parsedAt,
        warnings: [...memEntry.warnings, ...result.warnings, 'Reparse failed: previous valid projection preserved.'],
      };
      // Preserve in-memory but do not overwrite durable blocks
      memEntry.warnings = preserved.warnings;
      memEntry.updatedAt = preserved.updatedAt;
      return preserved;
    }

    const tableCount = result.blocks.filter((b) => b.kind === 'table').length;
    const transcriptCount = result.blocks.filter(
      (b) => b.kind === 'transcript' || b.kind === 'transcript_segment',
    ).length;
    const restrictedCount = result.blocks.filter((b) => b.visibility === 'teacher_only').length;

    // Recompute content fingerprint from the new blocks' text so replay can be detected.
    const incomingContent = result.blocks.map((b) => b.text || '').join('\n');
    const derivedFingerprint = incomingContent ? computeFingerprint(incomingContent) : memEntry.contentFingerprint;

    // Update the artifact level fields
    memEntry.parseStatus = result.parseStatus;
    memEntry.structureQuality = result.structureQuality;
    memEntry.blockCount = result.blocks.length;
    memEntry.questionCount = result.questions.length;
    memEntry.diagramCount = result.diagrams.length;
    memEntry.answerKeyCount = result.answerKeys.length;
    memEntry.tableCount = tableCount;
    memEntry.transcriptCount = transcriptCount;
    memEntry.restrictedCount = restrictedCount;
    memEntry.contentFingerprint = derivedFingerprint;
    memEntry.parsedAt = now;
    memEntry.updatedAt = now;
    memEntry.warnings = result.warnings;
    if (curriculumRefs && Object.keys(curriculumRefs).length > 0) {
      memEntry.curriculumRefs = {
        ...(memEntry.curriculumRefs || {}),
        ...curriculumRefs,
        verified: false,
        candidate: true,
      };
    }

    // Update the extended fields (blocks, questions, etc.)
    memEntry._blocks = result.blocks;
    memEntry._questions = result.questions;
    memEntry._answerKeys = result.answerKeys;
    memEntry._workedExamples = result.workedExamples;
    memEntry._diagrams = result.diagrams;

    // Build return value
    const updated: LearningArtifact = {
      artifactId: memEntry.artifactId,
      schoolId: memEntry.schoolId,
      ownerStudentId: memEntry.ownerStudentId,
      ownerTeacherId: memEntry.ownerTeacherId,
      classId: memEntry.classId,
      mediaAssetId: memEntry.mediaAssetId,
      kind: memEntry.kind,
      accessScope: memEntry.accessScope,
      title: memEntry.title,
      description: memEntry.description,
      originalFileName: memEntry.originalFileName,
      mimeType: memEntry.mimeType,
      sizeBytes: memEntry.sizeBytes,
      source: memEntry.source,
      parseStatus: memEntry.parseStatus,
      structureQuality: memEntry.structureQuality,
      blockCount: memEntry.blockCount,
      questionCount: memEntry.questionCount,
      diagramCount: memEntry.diagramCount,
      answerKeyCount: memEntry.answerKeyCount,
      tableCount: memEntry.tableCount,
      transcriptCount: memEntry.transcriptCount,
      restrictedCount: memEntry.restrictedCount,
      contentFingerprint: memEntry.contentFingerprint,
      curriculumRefs: memEntry.curriculumRefs,
      createdAt: memEntry.createdAt,
      updatedAt: memEntry.updatedAt,
      parsedAt: memEntry.parsedAt,
      warnings: memEntry.warnings,
    };

    // Try Prisma persistence (atomic within a single transaction when available)
    await this._persistParseResult(updated, result.blocks, result.questions, result.answerKeys, result.workedExamples, result.diagrams);

    return updated;
  }

  /**
   * Anchor a structured artifact to its canonical MediaAsset.
   * Identity/school scope is derived from the verified context, not the body.
   */
  async anchorToMediaAsset(
    identity: ResolvedTutorIdentity,
    artifactId: string,
    mediaAssetId: string,
  ): Promise<LearningArtifact | null> {
    const artifact = await this.getArtifactForUser(identity, artifactId);
    if (!artifact) return null;

    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) {
      memEntry.mediaAssetId = mediaAssetId;
      memEntry.updatedAt = nowISO();
    }

    const available = await isPrismaAvailable();
    if (available) {
      try {
        await prisma.learningArtifact.update({
          where: { id: artifactId },
          data: { mediaAssetId },
        });
      } catch {
        // Prisma unavailable, keep in-memory anchor
      }
    }

    return {
      ...artifact,
      mediaAssetId,
      updatedAt: memEntry?.updatedAt || artifact.updatedAt,
    };
  }

  /**
   * Get artifact structure response.
   * Always returns the student-safe projection: teacher_only blocks and
   * answer keys are excluded unless the verified caller is authorized.
   */
  async getArtifactStructure(
    identity: ResolvedTutorIdentity,
    artifactId: string,
  ): Promise<ArtifactStructureResponse | null> {
    const full = await this.getFullArtifact(identity, artifactId);
    if (!full) return null;
    return this._toSafeStructure(identity, full);
  }

  /**
   * Build a safe parse response from a freshly computed parse result.
   */
  buildSafeParseResponse(
    identity: ResolvedTutorIdentity,
    artifact: LearningArtifact,
    result: {
      blocks: ArtifactBlock[];
      questions: ExtractedQuestion[];
      answerKeys: AnswerKeyBlock[];
      workedExamples: WorkedExampleBlock[];
      diagrams: DiagramBlock[];
      warnings: string[];
    },
  ): ArtifactParseResponse {
    // Student-facing retrieval must NEVER leak restricted content, even for the
    // owning student. Only verified teachers/admins may see teacher_only blocks.
    const includeRestricted = identity.role === 'teacher' || identity.role === 'admin';
    return {
      ok: true,
      artifact,
      blocks: includeRestricted ? result.blocks : result.blocks.filter((b) => b.visibility !== 'teacher_only'),
      extractedQuestions: result.questions,
      answerKeys: includeRestricted ? result.answerKeys : [],
      workedExamples: result.workedExamples,
      diagrams: result.diagrams,
      warnings: result.warnings,
    };
  }

  /**
   * Apply the student-safe projection to a full artifact structure.
   * Restricted blocks and answer keys are removed for non-authorized callers.
   * The projection never hides a restricted block by kind alone — the explicit
   * visibility field drives the filter.
   */
  private _toSafeStructure(
    identity: ResolvedTutorIdentity,
    full: {
      artifact: LearningArtifact;
      blocks: ArtifactBlock[];
      questions: ExtractedQuestion[];
      answerKeys: AnswerKeyBlock[];
      workedExamples: WorkedExampleBlock[];
      diagrams: DiagramBlock[];
    },
  ): ArtifactStructureResponse {
    // Student-facing retrieval must NEVER leak restricted content, even for the
    // owning student. Only verified teachers/admins may see teacher_only blocks.
    const includeRestricted = identity.role === 'teacher' || identity.role === 'admin';
    return {
      ok: true,
      artifact: full.artifact,
      blocks: includeRestricted
        ? full.blocks
        : full.blocks.filter((b) => b.visibility !== 'teacher_only'),
      extractedQuestions: full.questions,
      answerKeys: includeRestricted ? full.answerKeys : [],
      workedExamples: full.workedExamples,
      diagrams: full.diagrams,
    };
  }

  // ── Prisma helpers ──

  private async _upsertPrismaArtifact(artifact: LearningArtifact): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    try {
      await prisma.learningArtifact.upsert({
        where: { id: artifact.artifactId },
        create: {
          id: artifact.artifactId,
          schoolId: artifact.schoolId,
          ownerStudentId: artifact.ownerStudentId,
          ownerTeacherId: artifact.ownerTeacherId,
          classId: artifact.classId,
          mediaAssetId: artifact.mediaAssetId ?? null,
          kind: artifact.kind,
          accessScope: artifact.accessScope,
          title: artifact.title,
          description: artifact.description,
          originalFileName: artifact.originalFileName,
          mimeType: artifact.mimeType,
          sizeBytes: artifact.sizeBytes,
          source: artifact.source,
          parseStatus: artifact.parseStatus,
          structureQuality: artifact.structureQuality,
          contentFingerprint: artifact.contentFingerprint,
          curriculumRefs: (artifact.curriculumRefs || {}) as Prisma.InputJsonValue,
          warnings: artifact.warnings as Prisma.InputJsonValue,
          parsedAt: artifact.parsedAt ? new Date(artifact.parsedAt) : null,
        },
        update: {
          mediaAssetId: artifact.mediaAssetId ?? null,
          parseStatus: artifact.parseStatus,
          structureQuality: artifact.structureQuality,
          blockCount: artifact.blockCount,
          questionCount: artifact.questionCount,
          diagramCount: artifact.diagramCount,
          answerKeyCount: artifact.answerKeyCount,
          tableCount: artifact.tableCount,
          transcriptCount: artifact.transcriptCount,
          contentFingerprint: artifact.contentFingerprint,
          curriculumRefs: (artifact.curriculumRefs || {}) as Prisma.InputJsonValue,
          warnings: artifact.warnings as Prisma.InputJsonValue,
          parsedAt: artifact.parsedAt ? new Date(artifact.parsedAt) : null,
        },
      });
    } catch {
      // Prisma unavailable, continue with in-memory
    }
  }

  private async _getPrismaArtifact(artifactId: string): Promise<LearningArtifact | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const record = await prisma.learningArtifact.findUnique({
        where: { id: artifactId },
      });
      if (!record) return null;
      return this._mapPrismaArtifact(record);
    } catch {
      return null;
    }
  }

  private async _getPrismaBlocks(artifactId: string): Promise<ArtifactBlock[] | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const records = await prisma.learningArtifactBlock.findMany({
        where: { artifactId },
        orderBy: { order: 'asc' },
      });
      if (!records || records.length === 0) return null;
      return records.map((r: Prisma.LearningArtifactBlockGetPayload<{}>) => this._mapPrismaBlock(r));
    } catch {
      return null;
    }
  }

  // Atomic persistence of a parse result: artifact update + block replacement
  // happen within a single Prisma transaction so a failure cannot leave a
  // partially-committed projection.
  private async _persistParseResult(
    artifact: LearningArtifact,
    blocks: ArtifactBlock[],
    questions: ExtractedQuestion[],
    answerKeys: AnswerKeyBlock[],
    workedExamples: WorkedExampleBlock[],
    diagrams: DiagramBlock[],
  ): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    const write = async (tx: Prisma.TransactionClient): Promise<void> => {
      await tx.learningArtifact.upsert({
        where: { id: artifact.artifactId },
        create: {
          id: artifact.artifactId,
          schoolId: artifact.schoolId,
          ownerStudentId: artifact.ownerStudentId,
          ownerTeacherId: artifact.ownerTeacherId,
          classId: artifact.classId,
          mediaAssetId: artifact.mediaAssetId ?? null,
          kind: artifact.kind,
          accessScope: artifact.accessScope,
          title: artifact.title,
          description: artifact.description,
          originalFileName: artifact.originalFileName,
          mimeType: artifact.mimeType,
          sizeBytes: artifact.sizeBytes,
          source: artifact.source,
          parseStatus: artifact.parseStatus,
          structureQuality: artifact.structureQuality,
          contentFingerprint: artifact.contentFingerprint,
          curriculumRefs: (artifact.curriculumRefs || {}) as Prisma.InputJsonValue,
          warnings: artifact.warnings as Prisma.InputJsonValue,
          parsedAt: artifact.parsedAt ? new Date(artifact.parsedAt) : null,
        },
        update: {
          mediaAssetId: artifact.mediaAssetId ?? null,
          parseStatus: artifact.parseStatus,
          structureQuality: artifact.structureQuality,
          blockCount: artifact.blockCount,
          questionCount: artifact.questionCount,
          diagramCount: artifact.diagramCount,
          answerKeyCount: artifact.answerKeyCount,
          tableCount: artifact.tableCount,
          transcriptCount: artifact.transcriptCount,
          contentFingerprint: artifact.contentFingerprint,
          curriculumRefs: (artifact.curriculumRefs || {}) as Prisma.InputJsonValue,
          warnings: artifact.warnings as Prisma.InputJsonValue,
          parsedAt: artifact.parsedAt ? new Date(artifact.parsedAt) : null,
        },
      });

      await tx.learningArtifactBlock.deleteMany({ where: { artifactId: artifact.artifactId } });
      if (blocks.length > 0) {
        await tx.learningArtifactBlock.createMany({
          data: blocks.map((block) => ({
            id: block.blockId,
            artifactId: block.artifactId,
            schoolId: block.schoolId,
            kind: block.kind,
            visibility: block.visibility || 'student',
            order: block.order,
            text: block.text,
            normalizedText: block.normalizedText,
            summary: block.summary,
            pageNumber: block.pageNumber,
            sectionTitle: block.sectionTitle,
            headingPath: block.headingPath as Prisma.InputJsonValue,
            confidence: block.confidence,
            provenance: block.provenance as unknown as Prisma.InputJsonValue,
            educationalTags: block.educationalTags as Prisma.InputJsonValue,
            metadata: block.metadata as Prisma.InputJsonValue,
            contentFingerprint: computeFingerprint(block.text || ''),
          })),
          skipDuplicates: true,
        });
      }
    };

    try {
      if (typeof prisma.$transaction === 'function') {
        await prisma.$transaction(async (tx) => {
          await write(tx);
        });
      } else {
        await write(prisma);
      }
    } catch {
      // Prisma unavailable, in-memory store remains the source of truth
    }
  }

  private _mapPrismaArtifact(record: Prisma.LearningArtifactGetPayload<{}>): LearningArtifact {
    return {
      artifactId: record.id,
      schoolId: record.schoolId,
      ownerStudentId: record.ownerStudentId ?? null,
      ownerTeacherId: record.ownerTeacherId ?? null,
      classId: record.classId ?? null,
      mediaAssetId: record.mediaAssetId ?? null,
      kind: record.kind as ArtifactKind,
      accessScope: record.accessScope as ArtifactAccessScope,
      title: record.title,
      description: record.description ?? null,
      originalFileName: record.originalFileName ?? null,
      mimeType: record.mimeType ?? null,
      sizeBytes: record.sizeBytes ?? null,
      source: (record.source || 'unknown') as ArtifactSource,
      parseStatus: (record.parseStatus || 'not_parsed') as ArtifactParseStatus,
      structureQuality: (record.structureQuality || 'unavailable') as ArtifactStructureQuality,
      blockCount: record.blockCount || 0,
      questionCount: record.questionCount || 0,
      diagramCount: record.diagramCount || 0,
      answerKeyCount: record.answerKeyCount || 0,
      tableCount: record.tableCount || 0,
      transcriptCount: record.transcriptCount || 0,
      restrictedCount: 0,
      contentFingerprint: record.contentFingerprint || '',
      curriculumRefs: (record.curriculumRefs && typeof record.curriculumRefs === 'object' ? record.curriculumRefs : {}) as ArtifactCurriculumRefs,
      createdAt: record.createdAt?.toISOString?.() || nowISO(),
      updatedAt: record.updatedAt?.toISOString?.() || nowISO(),
      parsedAt: record.parsedAt?.toISOString?.() || null,
      warnings: Array.isArray(record.warnings) ? (record.warnings as string[]) : [],
    };
  }

  private _mapPrismaBlock(record: Prisma.LearningArtifactBlockGetPayload<{}>): ArtifactBlock {
    return {
      blockId: record.id,
      artifactId: record.artifactId,
      schoolId: record.schoolId,
      kind: record.kind as ArtifactBlockKind,
      visibility: (record.visibility === 'teacher_only' ? 'teacher_only' : 'student') as ArtifactBlock['visibility'],
      order: record.order,
      text: record.text ?? null,
      normalizedText: record.normalizedText ?? null,
      summary: record.summary ?? null,
      pageNumber: record.pageNumber ?? null,
      sectionTitle: record.sectionTitle ?? null,
      headingPath: Array.isArray(record.headingPath) ? (record.headingPath as unknown as string[]) : [],
      confidence: typeof record.confidence === 'number' ? record.confidence : 0,
      provenance: (record.provenance || {}) as unknown as ArtifactProvenance,
      educationalTags: (record.educationalTags || {}) as unknown as ArtifactBlock['educationalTags'],
      metadata: (record.metadata || {}) as Record<string, unknown>,
    };
  }

  // ── Internal data accessors ──

  private async _getQuestions(artifactId: string): Promise<ExtractedQuestion[]> {
    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) return memEntry._questions;
    return [];
  }

  private async _getAnswerKeys(artifactId: string): Promise<AnswerKeyBlock[]> {
    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) return memEntry._answerKeys;
    return [];
  }

  private async _getWorkedExamples(artifactId: string): Promise<WorkedExampleBlock[]> {
    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) return memEntry._workedExamples;
    return [];
  }

  private async _getDiagrams(artifactId: string): Promise<DiagramBlock[]> {
    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) return memEntry._diagrams;
    return [];
  }
}

// Singleton
export const artifactService = new ArtifactService();

// Export utility for tests
export function _clearArtifactMemoryStoreForTest(): void {
  artifactMemoryStore.clear();
  artifactLookupByKey.clear();
}
