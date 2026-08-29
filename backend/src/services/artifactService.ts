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

/**
 * Production MUST use Prisma as the authoritative artifact/structure store.
 * In-memory Maps are only an authoritative fixture store in isolated test runs
 * (NODE_ENV === 'test') and an optional non-authoritative cache in production
 * AFTER successful durable persistence. A general ephemeral-production flag is
 * intentionally NOT provided — production durability is fail-closed.
 */
export function isTestFallbackAllowed(): boolean {
  return process.env.NODE_ENV === 'test';
}

/** Raised when a required durable persistence operation cannot complete. */
export class ArtifactPersistenceError extends Error {
  public code: string;
  constructor(message: string, code = 'PERSISTENCE_FAILED') {
    super(message);
    this.code = code;
    this.name = 'ArtifactPersistenceError';
  }
}

/** Reset cached Prisma availability probe (test isolation only). */
export function _resetArtifactServicePrismaAvailability(): void {
  _prismaAvailable = null;
}

/**
 * Resolve and authorize a canonical MediaAsset before any artifact may anchor
 * to it. mediaAssetId is only an untrusted locator until the server proves the
 * actual MediaAsset exists and the verified actor owns it. Fails closed.
 */
export async function resolveAuthorizedMediaAsset(
  identity: ResolvedTutorIdentity,
  mediaAssetId: string | null | undefined,
): Promise<{ id: string; userId: string }> {
  if (!mediaAssetId || !mediaAssetId.trim()) {
    throw new ArtifactAccessError('MISSING_MEDIA_ASSET', 'mediaAssetId is required to anchor.', 400);
  }
  const targetId = mediaAssetId.trim();

  const available = await isPrismaAvailable();
  // Without a durable store we can never prove the asset — fail closed.
  if (!available) {
    throw new ArtifactAccessError('MEDIA_ASSET_UNVERIFIABLE', 'Cannot verify MediaAsset without persistent store.', 404);
  }

  const asset = await (prisma as any).mediaAsset?.findUnique?.({ where: { id: targetId } });
  if (!asset) {
    // 404 (not 403) to avoid leaking cross-user existence.
    throw new ArtifactAccessError('MEDIA_ASSET_NOT_FOUND', 'MediaAsset not found.', 404);
  }

  const role = (identity.role || '').toLowerCase();
  if (role === 'student' || role === 'learner') {
    const ownerId = identity.studentId || identity.userId;
    if (asset.userId !== ownerId) {
      throw new ArtifactAccessError('MEDIA_ASSET_FORBIDDEN', 'Not authorized for this MediaAsset.', 404);
    }
  } else if (role === 'teacher' || role === 'admin') {
    // No teacher MediaAsset ownership model may be invented. A teacher role alone
    // must NOT authorize an arbitrary learner's MediaAsset. Fail closed.
    throw new ArtifactAccessError('MEDIA_ASSET_FORBIDDEN', 'Teacher linkage to a learner MediaAsset is not proven.', 404);
  } else {
    throw new ArtifactAccessError('MEDIA_ASSET_FORBIDDEN', 'Unauthorized role for MediaAsset linkage.', 404);
  }

  return { id: asset.id, userId: asset.userId };
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

    // Defect C: mediaAssetId is an untrusted locator until canonical resolution.
    // In production it MUST be verified against the actual MediaAsset + ownership
    // BEFORE the artifact relationship is persisted. Test mode keeps deterministic
    // fixtures without forcing a DB round-trip.
    let resolvedMediaAssetId: string | null = null;
    if (input.mediaAssetId?.trim()) {
      if (isTestFallbackAllowed()) {
        resolvedMediaAssetId = input.mediaAssetId.trim();
      } else {
        const asset = await resolveAuthorizedMediaAsset(identity, input.mediaAssetId.trim());
        resolvedMediaAssetId = asset.id;
      }
    }

    const artifact: LearningArtifact = {
      artifactId: generateId(),
      schoolId: identity.schoolId,
      ownerStudentId: identity.studentId || null,
      ownerTeacherId: identity.role === 'teacher' ? identity.userId || identity.studentId : null,
      classId: input.classId || null,
      mediaAssetId: resolvedMediaAssetId,
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

    const testFallback = isTestFallbackAllowed();
    const available = await isPrismaAvailable();

    // Production fail-closed: without a durable store there is no success.
    if (!available && !testFallback) {
      throw new ArtifactPersistenceError('Prisma persistence unavailable; artifact creation refused in production.');
    }

    // Defect A: production must NOT write an authoritative Map entry first.
    // In test mode the Map is the authoritative fixture store.
    if (testFallback) {
      const storeEntry = { ...artifact, _blocks: [], _questions: [], _answerKeys: [], _workedExamples: [], _diagrams: [] };
      artifactMemoryStore.set(artifact.artifactId, storeEntry);
      artifactLookupByKey.set(`${identity.schoolId}:${identity.studentId}:${artifact.artifactId}`, artifact.artifactId);
    }

    // Durable persistence FIRST. Production failures propagate (no success).
    if (available) {
      await this._upsertPrismaArtifact(artifact, { failClosed: !testFallback });
      // Only after successful durable persistence may an optional cache be updated.
      if (!testFallback) {
        const storeEntry = { ...artifact, _blocks: [], _questions: [], _answerKeys: [], _workedExamples: [], _diagrams: [] };
        artifactMemoryStore.set(artifact.artifactId, storeEntry);
        artifactLookupByKey.set(`${identity.schoolId}:${identity.studentId}:${artifact.artifactId}`, artifact.artifactId);
      }
    }

    return artifact;
  }

  /**
   * Get an artifact by ID with access check.
   */
  async getArtifactForUser(
    identity: ResolvedTutorIdentity,
    artifactId: string,
  ): Promise<LearningArtifact | null> {
    const testFallback = isTestFallbackAllowed();

    // Production: Prisma is authoritative. Do not prefer Map before the database.
    if (!testFallback) {
      const fromDb = await this._getPrismaArtifact(artifactId);
      if (fromDb) {
        await assertArtifactAccess(fromDb, identity);
        return fromDb;
      }
      return null;
    }

    // Test mode: deterministic Map fixtures remain authoritative for isolated runs.
    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) {
      await assertArtifactAccess(memEntry, identity);
      return this._toPublicArtifact(memEntry);
    }

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
    const testFallback = isTestFallbackAllowed();

    // Production: canonical persistent blocks are authoritative. The helper
    // itself distinguishes a legitimate empty set from a persistence failure.
    if (!testFallback) {
      const fromDb = await this._getPrismaBlocks(artifactId);
      return fromDb;
    }

    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) return memEntry._blocks;

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
    const testFallback = isTestFallbackAllowed();
    const available = await isPrismaAvailable();

    // 1. Obtain the current authoritative artifact.
    //    Production MUST derive the authoritative current state from canonical
    //    Prisma. A process-local Map cache can become stale and must never
    //    override durable truth. Test mode keeps the Map as authoritative fixture.
    let current: (LearningArtifact & { _blocks?: ArtifactBlock[]; _questions?: ExtractedQuestion[]; _answerKeys?: AnswerKeyBlock[]; _workedExamples?: WorkedExampleBlock[]; _diagrams?: DiagramBlock[] }) | null;
    if (testFallback) {
      current = artifactMemoryStore.get(artifactId) || null;
      if (!current) {
        current = await this._getPrismaArtifact(artifactId);
      }
    } else {
      current = await this._getPrismaArtifact(artifactId);
    }
    if (!current) {
      throw new Error(`Artifact ${artifactId} not found`);
    }

    // 2. Compute the candidate result WITHOUT mutating authoritative state.
    const tableCount = result.blocks.filter((b) => b.kind === 'table').length;
    const transcriptCount = result.blocks.filter(
      (b) => b.kind === 'transcript' || b.kind === 'transcript_segment',
    ).length;
    const restrictedCount = result.blocks.filter((b) => b.visibility === 'teacher_only').length;

    const incomingContent = result.blocks.map((b) => b.text || '').join('\n');
    const derivedFingerprint = incomingContent ? computeFingerprint(incomingContent) : current.contentFingerprint;

    // R3.14: Failed reparse must not destroy a previously valid projection.
    const previousWasUsable =
      current.parseStatus === 'parsed' || current.parseStatus === 'partial';
    const newIsFailure = result.parseStatus === 'failed' || result.parseStatus === 'unsupported';
    const shouldPreservePrevious = previousWasUsable && newIsFailure && !options?.allowOverwriteOnFailure;

    if (shouldPreservePrevious) {
      const preserved: LearningArtifact = {
        artifactId: current.artifactId,
        schoolId: current.schoolId,
        ownerStudentId: current.ownerStudentId,
        ownerTeacherId: current.ownerTeacherId,
        classId: current.classId,
        mediaAssetId: current.mediaAssetId,
        kind: current.kind,
        accessScope: current.accessScope,
        title: current.title,
        description: current.description,
        originalFileName: current.originalFileName,
        mimeType: current.mimeType,
        sizeBytes: current.sizeBytes,
        source: current.source,
        parseStatus: current.parseStatus,
        structureQuality: current.structureQuality,
        blockCount: current.blockCount,
        questionCount: current.questionCount,
        diagramCount: current.diagramCount,
        answerKeyCount: current.answerKeyCount,
        tableCount: current.tableCount,
        transcriptCount: current.transcriptCount,
        restrictedCount: current.restrictedCount,
        contentFingerprint: current.contentFingerprint,
        curriculumRefs: current.curriculumRefs,
        createdAt: current.createdAt,
        updatedAt: nowISO(),
        parsedAt: current.parsedAt,
        warnings: [...(current.warnings || []), ...result.warnings, 'Reparse failed: previous valid projection preserved.'],
      };
      // Old durable blocks are intentionally NOT replaced. Only a non-destructive
      // warning update is persisted; failure here in production propagates.
      if (available) {
        try {
          if (typeof (prisma as any).learningArtifact?.update === 'function') {
            await (prisma as any).learningArtifact.update({
              where: { id: artifactId },
              data: { warnings: preserved.warnings as any, updatedAt: new Date(preserved.updatedAt) },
            });
          }
        } catch (e) {
          if (!testFallback) throw new ArtifactPersistenceError('Failed to persist reparse-preservation warning.', (e as Error)?.message);
        }
      }
      // Update optional cache (test or after durable write).
      const memEntry = artifactMemoryStore.get(artifactId);
      if (memEntry) {
        memEntry.warnings = preserved.warnings;
        memEntry.updatedAt = preserved.updatedAt;
      }
      return preserved;
    }

    const mergedCurriculumRefs: ArtifactCurriculumRefs = { ...(current.curriculumRefs || {}) };
    if (curriculumRefs && Object.keys(curriculumRefs).length > 0) {
      Object.assign(mergedCurriculumRefs, curriculumRefs, { verified: false, candidate: true });
    }

    const updated: LearningArtifact = {
      artifactId: current.artifactId,
      schoolId: current.schoolId,
      ownerStudentId: current.ownerStudentId,
      ownerTeacherId: current.ownerTeacherId,
      classId: current.classId,
      mediaAssetId: current.mediaAssetId,
      kind: current.kind,
      accessScope: current.accessScope,
      title: current.title,
      description: current.description,
      originalFileName: current.originalFileName,
      mimeType: current.mimeType,
      sizeBytes: current.sizeBytes,
      source: current.source,
      parseStatus: result.parseStatus,
      structureQuality: result.structureQuality,
      blockCount: result.blocks.length,
      questionCount: result.questions.length,
      diagramCount: result.diagrams.length,
      answerKeyCount: result.answerKeys.length,
      tableCount,
      transcriptCount,
      restrictedCount,
      contentFingerprint: derivedFingerprint,
      curriculumRefs: mergedCurriculumRefs,
      createdAt: current.createdAt,
      updatedAt: now,
      parsedAt: now,
      warnings: result.warnings,
    };

    // Production: without a durable store, no successful structured mutation.
    if (!available && !testFallback) {
      throw new ArtifactPersistenceError('Prisma persistence unavailable; parse result not persisted in production.');
    }

    // 3-5. Execute one atomic durable transaction, then update the optional cache.
    if (available) {
      await this._persistParseResult(
        updated,
        result.blocks,
        result.questions,
        result.answerKeys,
        result.workedExamples,
        result.diagrams,
        { failClosed: !testFallback },
      );
    }

    // Only after successful durable persistence may the optional cache be updated.
    const memEntry = artifactMemoryStore.get(artifactId);
    if (memEntry) {
      memEntry.parseStatus = updated.parseStatus;
      memEntry.structureQuality = updated.structureQuality;
      memEntry.blockCount = updated.blockCount;
      memEntry.questionCount = updated.questionCount;
      memEntry.diagramCount = updated.diagramCount;
      memEntry.answerKeyCount = updated.answerKeyCount;
      memEntry.tableCount = updated.tableCount;
      memEntry.transcriptCount = updated.transcriptCount;
      memEntry.restrictedCount = updated.restrictedCount;
      memEntry.contentFingerprint = updated.contentFingerprint;
      memEntry.parsedAt = updated.parsedAt;
      memEntry.updatedAt = updated.updatedAt;
      memEntry.warnings = updated.warnings;
      memEntry.curriculumRefs = updated.curriculumRefs;
      memEntry._blocks = result.blocks;
      memEntry._questions = result.questions;
      memEntry._answerKeys = result.answerKeys;
      memEntry._workedExamples = result.workedExamples;
      memEntry._diagrams = result.diagrams;
    } else if (available) {
      artifactMemoryStore.set(artifactId, {
        ...updated,
        _blocks: result.blocks,
        _questions: result.questions,
        _answerKeys: result.answerKeys,
        _workedExamples: result.workedExamples,
        _diagrams: result.diagrams,
      });
    }

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

    const testFallback = isTestFallbackAllowed();
    const available = await isPrismaAvailable();

    // Defect C: resolve + authorize the canonical MediaAsset BEFORE mutating.
    let resolvedMediaId: string;
    if (testFallback) {
      resolvedMediaId = mediaAssetId; // deterministic fixture; no DB round-trip
    } else {
      const asset = await resolveAuthorizedMediaAsset(identity, mediaAssetId);
      resolvedMediaId = asset.id;
    }

    // Production fail-closed: without durable store, no successful anchor.
    if (!available && !testFallback) {
      throw new ArtifactPersistenceError('Prisma persistence unavailable; media anchor refused in production.');
    }

    if (!testFallback) {
      await prisma.learningArtifact.update({
        where: { id: artifactId },
        data: { mediaAssetId: resolvedMediaId },
      });
      // Update optional cache only after successful durable write.
      const memEntry = artifactMemoryStore.get(artifactId);
      if (memEntry) {
        memEntry.mediaAssetId = resolvedMediaId;
        memEntry.updatedAt = nowISO();
      }
    } else {
      const memEntry = artifactMemoryStore.get(artifactId);
      if (memEntry) {
        memEntry.mediaAssetId = resolvedMediaId;
        memEntry.updatedAt = nowISO();
      }
    }

    return {
      ...artifact,
      mediaAssetId: resolvedMediaId,
      updatedAt: nowISO(),
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

  private async _upsertPrismaArtifact(artifact: LearningArtifact, opts?: { failClosed?: boolean }): Promise<void> {
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
    } catch (e) {
      // Test mode may continue with the in-memory fixture store; production fails closed.
      if (opts?.failClosed) throw new ArtifactPersistenceError('Failed to persist artifact.', (e as Error)?.message);
    }
  }

  private async _getPrismaArtifact(artifactId: string): Promise<LearningArtifact | null> {
    const available = await isPrismaAvailable();
    // DB outage is NOT "resource does not exist". Production fails closed.
    if (!available) {
      if (isTestFallbackAllowed()) return null;
      throw new ArtifactPersistenceError('Prisma persistence unavailable during artifact read.');
    }
    try {
      const record = await prisma.learningArtifact.findUnique({
        where: { id: artifactId },
      });
      // Legitimate absence: query succeeded and returned nothing.
      if (!record) return null;
      return this._mapPrismaArtifact(record);
    } catch (error) {
      // Query failure is NOT "resource does not exist". Production fails closed.
      if (isTestFallbackAllowed()) return null;
      throw new ArtifactPersistenceError('Failed to read artifact from persistence.', (error as Error)?.message);
    }
  }

  private async _getPrismaBlocks(artifactId: string): Promise<ArtifactBlock[]> {
    const available = await isPrismaAvailable();
    // DB outage is NOT "zero blocks". Production fails closed.
    if (!available) {
      if (isTestFallbackAllowed()) return [];
      throw new ArtifactPersistenceError('Prisma persistence unavailable during block read.');
    }
    try {
      const records = await prisma.learningArtifactBlock.findMany({
        where: { artifactId },
        orderBy: { order: 'asc' },
      });
      // Legitimate empty block set: query succeeded and returned zero rows.
      if (!records || records.length === 0) return [];
      return records.map((r: Prisma.LearningArtifactBlockGetPayload<{}>) => this._mapPrismaBlock(r));
    } catch (error) {
      // Query failure is NOT "zero blocks". Production fails closed.
      if (isTestFallbackAllowed()) return [];
      throw new ArtifactPersistenceError('Failed to read artifact blocks from persistence.', (error as Error)?.message);
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
    opts?: { failClosed?: boolean },
  ): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    const write = async (tx: Prisma.TransactionClient): Promise<void> => {
      // Never delete durable old blocks before the replacement can commit.
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
    } catch (e) {
      // Test mode may keep the in-memory fixture; production MUST propagate so a
      // failed transaction never yields a successful { ok: true } with Map-only truth.
      if (opts?.failClosed) throw new ArtifactPersistenceError('Failed to persist parse result transaction.', (e as Error)?.message);
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
