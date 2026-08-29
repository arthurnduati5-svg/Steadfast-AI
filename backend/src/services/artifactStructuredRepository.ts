// ─────────────────────────────────────────────────────────────
// Steadfast AI — Structured Artifact Repository v1
// Thin adapter over the canonical durable structured storage:
//   StructuredArtifactRepository
//     -> canonical artifactService / Prisma
//     -> LearningArtifact + LearningArtifactBlock
// Production never consults a second Map authority. In-memory mirrors are
// retained ONLY for isolated deterministic test runs (NODE_ENV === 'test').
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import prisma from '../lib/prisma';
import { artifactService, isTestFallbackAllowed, ArtifactPersistenceError } from './artifactService';
import type {
  StructuredArtifactRecord,
  ArtifactStructuredBlock,
  ArtifactQuestionBlock,
  ArtifactScope,
  ArtifactParseStatus,
  ArtifactRepositoryListOptions,
  ArtifactTopicSkillMapping,
} from './artifactUnderstandingContracts';
import type {
  LearningArtifact,
  ArtifactBlock,
  ExtractedQuestion,
  AnswerKeyBlock,
} from './artifactContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function computeFingerprint(content: string): string {
  return createHash('sha256').update(content || '').digest('hex').slice(0, 16);
}

// Production Prisma availability probe (independent of artifactService cache).
let _prismaAvailable: boolean | null = null;
async function isPrismaAvailable(): Promise<boolean> {
  if (_prismaAvailable !== null) return _prismaAvailable;
  try {
    await (prisma as any).$queryRaw`SELECT 1`;
    _prismaAvailable = true;
  } catch {
    _prismaAvailable = false;
  }
  return _prismaAvailable;
}

/** Test-isolation helper: reset cached availability probe. */
export function _resetStructuredRepositoryPrismaAvailability(): void {
  _prismaAvailable = null;
}

// ── In-memory mirrors (TEST-ONLY; never a production authority) ──
const structuredRecordMirror = new Map<string, StructuredArtifactRecord>();
const blockMirror = new Map<string, ArtifactStructuredBlock[]>();
const questionMirror = new Map<string, ArtifactQuestionBlock[]>();

export class StructuredArtifactRepository {
  /**
   * Upsert a structured artifact record.
   * Production: canonical LearningArtifact via Prisma (fail closed on failure).
   * Test mode: deterministic Map mirror.
   */
  async upsertStructuredArtifact(record: StructuredArtifactRecord): Promise<StructuredArtifactRecord> {
    const now = nowISO();
    const updated: StructuredArtifactRecord = {
      ...record,
      updatedAt: now,
      createdAt: record.createdAt || now,
    };
    const testFallback = isTestFallbackAllowed();
    const available = await isPrismaAvailable();

    if (testFallback) {
      structuredRecordMirror.set(record.artifactId, updated);
    }

    if (available) {
      try {
        await (prisma as any).learningArtifact.upsert({
          where: { id: record.artifactId },
          create: {
            id: record.artifactId,
            schoolId: record.scope.schoolId || 'unknown_school',
            ownerStudentId: record.scope.studentId || null,
            classId: record.scope.classId || null,
            kind: this._reverseMapKind(record.artifactType),
            accessScope: 'student_private',
            title: 'Structured artifact',
            source: 'text_registration',
            contentFingerprint: computeFingerprint(record.artifactId),
            parseStatus: this._reverseMapParseStatus(record.parseStatus),
            structureQuality: 'high',
          },
          update: {
            parseStatus: this._reverseMapParseStatus(record.parseStatus),
            blockCount: record.structuredBlockCount,
            questionCount: record.questionCount,
            answerKeyCount: record.answerKeyCount,
            diagramCount: record.diagramCount,
          },
        });
      } catch (e) {
        if (!testFallback) throw new ArtifactPersistenceError('Failed to upsert structured artifact.', (e as Error)?.message);
      }
    } else if (!testFallback) {
      // Production must not silently succeed from a Map mirror.
      throw new ArtifactPersistenceError('Prisma persistence unavailable; structured artifact upsert refused in production.');
    }
    return updated;
  }

  /**
   * Get a structured artifact record.
   * Production: canonical persistent state only (never the test mirror).
   * Test mode: mirror first, then canonical fallback.
   */
  async getStructuredArtifact(scope: ArtifactScope): Promise<StructuredArtifactRecord | null> {
    const artifactId = scope.artifactId;
    const testFallback = isTestFallbackAllowed();
    if (!testFallback) {
      return this._loadFromExisting(artifactId);
    }
    const mirrored = structuredRecordMirror.get(artifactId);
    if (mirrored) {
      const blocks = blockMirror.get(artifactId) || [];
      const questions = questionMirror.get(artifactId) || [];
      return {
        ...mirrored,
        structuredBlockCount: blocks.length || mirrored.structuredBlockCount,
        questionCount: questions.length || mirrored.questionCount,
      };
    }
    return this._loadFromExisting(artifactId);
  }

  /**
   * Upsert artifact blocks into canonical LearningArtifactBlock storage.
   * Production: durable Prisma write (fail closed). Test mode: Map mirror.
   */
  async upsertArtifactBlocks(
    scope: ArtifactScope,
    blocks: ArtifactStructuredBlock[],
  ): Promise<ArtifactStructuredBlock[]> {
    const key = scope.artifactId;
    const stored = blocks.map((b) => ({ ...b, artifactId: key }));
    const testFallback = isTestFallbackAllowed();
    const available = await isPrismaAvailable();

    if (testFallback) {
      blockMirror.set(key, stored);
    }

    if (available) {
      try {
        await (prisma as any).$transaction(async (tx: any) => {
          await tx.learningArtifactBlock.deleteMany({ where: { artifactId: key } });
          if (stored.length > 0) {
            await tx.learningArtifactBlock.createMany({
              data: stored.map((b) => ({
                id: b.id,
                artifactId: key,
                schoolId: scope.schoolId || b.provenance?.artifactId || 'unknown_school',
                kind: b.blockType,
                visibility: b.visibility === 'teacher_visible' ? 'teacher_only' : 'student',
                order: b.orderIndex,
                text: b.text,
                normalizedText: b.safeText || b.text,
                confidence: b.confidence === 'high' ? 0.9 : b.confidence === 'medium' ? 0.6 : 0.3,
                provenance: b.provenance as any,
                educationalTags: { topic: b.topic, skillId: b.skillId } as any,
                metadata: b.metadata as any,
                contentFingerprint: computeFingerprint(b.text),
              })),
              skipDuplicates: true,
            });
          }
        });
      } catch (e) {
        if (!testFallback) throw new ArtifactPersistenceError('Failed to persist artifact blocks.', (e as Error)?.message);
      }
    } else if (!testFallback) {
      throw new ArtifactPersistenceError('Prisma persistence unavailable; block upsert refused in production.');
    }
    return stored;
  }

  /**
   * List artifact blocks. Production reads canonical persistent blocks (through
   * artifactService); test mode reads the mirror.
   */
  async listArtifactBlocks(
    scope: ArtifactScope,
    options?: ArtifactRepositoryListOptions,
  ): Promise<ArtifactStructuredBlock[]> {
    const key = scope.artifactId;
    const testFallback = isTestFallbackAllowed();

    if (!testFallback) {
      const fromService = await artifactService.listArtifactBlocks(key);
      const translated: ArtifactStructuredBlock[] = (fromService || []).map((b, idx) => ({
        id: b.blockId,
        artifactId: b.artifactId,
        blockType: this._mapBlockKind(b.kind),
        visibility: b.visibility === 'teacher_only' ? 'teacher_visible' : 'learner_visible',
        pageNumber: b.pageNumber || null,
        locationLabel: b.sectionTitle || null,
        sectionPath: b.headingPath || [],
        text: b.text || '',
        safeText: b.visibility === 'teacher_only' ? '[REDACTED — teacher only]' : (b.text || ''),
        rawTextRef: null,
        orderIndex: b.order ?? idx,
        confidence: this._mapConfidence(b.confidence),
        safetyFlags: [],
        provenance: {
          artifactId: b.artifactId,
          blockId: b.blockId,
          fileName: null,
          mimeType: null,
          pageNumber: b.pageNumber || null,
          locationLabel: b.sectionTitle || null,
          parserSource: 'artifactService',
          extractionMethod: (b.provenance as any)?.extractionMethod || 'unknown',
          extractedAt: (b.provenance as any)?.extractedAt || nowISO(),
          confidence: this._mapConfidence(b.confidence),
          warnings: [],
        },
        metadata: (b.metadata as Record<string, unknown>) || {},
      }));
      return this._applyBlockFilters(translated, options);
    }

    const stored = blockMirror.get(key);
    if (stored && stored.length > 0) {
      return this._applyBlockFilters(stored, options);
    }
    const fromService = await artifactService.listArtifactBlocks(key);
    if (fromService && fromService.length > 0) {
      const translated: ArtifactStructuredBlock[] = fromService.map((b, idx) => ({
        id: b.blockId,
        artifactId: b.artifactId,
        blockType: this._mapBlockKind(b.kind),
        visibility: b.visibility === 'teacher_only' ? 'teacher_visible' : 'learner_visible',
        pageNumber: b.pageNumber || null,
        locationLabel: b.sectionTitle || null,
        sectionPath: b.headingPath || [],
        text: b.text || '',
        safeText: b.visibility === 'teacher_only' ? '[REDACTED — teacher only]' : (b.text || ''),
        rawTextRef: null,
        orderIndex: b.order ?? idx,
        confidence: this._mapConfidence(b.confidence),
        safetyFlags: [],
        provenance: {
          artifactId: b.artifactId,
          blockId: b.blockId,
          fileName: null,
          mimeType: null,
          pageNumber: b.pageNumber || null,
          locationLabel: b.sectionTitle || null,
          parserSource: 'artifactService',
          extractionMethod: (b.provenance as any)?.extractionMethod || 'unknown',
          extractedAt: (b.provenance as any)?.extractedAt || nowISO(),
          confidence: this._mapConfidence(b.confidence),
          warnings: [],
        },
        metadata: (b.metadata as Record<string, unknown>) || {},
      }));
      return this._applyBlockFilters(translated, options);
    }
    return stored ? this._applyBlockFilters(stored, options) : [];
  }

  /**
   * Upsert artifact questions. Production persists them as canonical question
   * blocks (no dedicated question table is invented). Test mode: Map mirror.
   */
  async upsertArtifactQuestions(
    scope: ArtifactScope,
    questions: ArtifactQuestionBlock[],
  ): Promise<ArtifactQuestionBlock[]> {
    const key = scope.artifactId;
    const stored = questions.map((q) => ({ ...q, artifactId: key }));
    const testFallback = isTestFallbackAllowed();
    const available = await isPrismaAvailable();

    if (testFallback) {
      questionMirror.set(key, stored);
    }

    if (available) {
      try {
        await (prisma as any).$transaction(async (tx: any) => {
          await tx.learningArtifactBlock.deleteMany({ where: { artifactId: key, kind: 'question' } });
          if (stored.length > 0) {
            await tx.learningArtifactBlock.createMany({
              data: stored.map((q) => ({
                id: q.questionId,
                artifactId: key,
                schoolId: scope.schoolId || 'unknown_school',
                kind: 'question',
                visibility: 'student',
                order: 0,
                text: q.questionText,
                normalizedText: q.safeQuestionText || q.questionText,
                confidence: q.confidence === 'high' ? 0.9 : q.confidence === 'medium' ? 0.6 : 0.3,
                provenance: (q.metadata as any)?.provenance || {},
                metadata: q.metadata as any,
                contentFingerprint: computeFingerprint(q.questionText),
              })),
              skipDuplicates: true,
            });
          }
        });
      } catch (e) {
        if (!testFallback) throw new ArtifactPersistenceError('Failed to persist artifact questions.', (e as Error)?.message);
      }
    } else if (!testFallback) {
      throw new ArtifactPersistenceError('Prisma persistence unavailable; question upsert refused in production.');
    }
    return stored;
  }

  /**
   * List artifact questions. Production derives from canonical question blocks;
   * test mode reads the mirror.
   */
  async listArtifactQuestions(
    scope: ArtifactScope,
    options?: ArtifactRepositoryListOptions,
  ): Promise<ArtifactQuestionBlock[]> {
    const key = scope.artifactId;
    const testFallback = isTestFallbackAllowed();
    if (!testFallback) {
      const fromService = await artifactService.listArtifactBlocks(key);
      const qBlocks = (fromService || []).filter((b) => b.kind === 'question');
      return qBlocks.map((b) => ({
        questionId: b.blockId,
        artifactId: b.artifactId,
        parentBlockId: null,
        questionNumber: null,
        questionText: b.text || '',
        safeQuestionText: b.visibility === 'teacher_only' ? '[REDACTED — teacher only]' : (b.normalizedText || b.text || ''),
        questionType: 'open' as any,
        choices: [],
        requiresDiagram: false,
        requiresTable: false,
        topic: ((b.educationalTags as any)?.topic as string) || null,
        skillId: ((b.educationalTags as any)?.skillId as string) || null,
        skillLabel: null,
        difficulty: null,
        answerKeyRef: null,
        learnerCanSeeAnswer: b.visibility !== 'teacher_only',
        confidence: this._mapConfidence(b.confidence),
        location: b.sectionTitle || null,
        metadata: (b.metadata as Record<string, unknown>) || {},
      }));
    }
    const stored = questionMirror.get(key) || [];
    if (options?.blockTypes && options.blockTypes.length > 0) {
      const wanted = new Set(options.blockTypes);
      if (!wanted.has('question')) return [];
    }
    if (typeof options?.limit === 'number') return stored.slice(0, options.limit);
    return stored;
  }

  /**
   * Mark parse status. Production: canonical Prisma update (fail closed).
   * Test mode: mirror.
   */
  async markArtifactParseStatus(
    scope: ArtifactScope,
    status: ArtifactParseStatus,
    warnings: string[],
  ): Promise<void> {
    const testFallback = isTestFallbackAllowed();
    const available = await isPrismaAvailable();
    if (testFallback) {
      const existing = structuredRecordMirror.get(scope.artifactId);
      if (existing) {
        structuredRecordMirror.set(scope.artifactId, { ...existing, parseStatus: status, parserWarnings: warnings, updatedAt: nowISO() });
      }
    }
    if (available) {
      try {
        await (prisma as any).learningArtifact?.update?.({
          where: { id: scope.artifactId },
          data: { parseStatus: this._reverseMapParseStatus(status), warnings: warnings as any },
        });
      } catch (e) {
        if (!testFallback) throw new ArtifactPersistenceError('Failed to mark parse status.', (e as Error)?.message);
      }
    } else if (!testFallback) {
      throw new ArtifactPersistenceError('Prisma persistence unavailable; parse status update refused in production.');
    }
  }

  /**
   * Soft delete structured artifact. Production prunes canonical blocks (fail
   * closed). Test mode clears mirrors.
   */
  async softDeleteStructuredArtifact(
    scope: ArtifactScope,
    _reason: string,
  ): Promise<void> {
    const testFallback = isTestFallbackAllowed();
    const available = await isPrismaAvailable();
    if (testFallback) {
      structuredRecordMirror.delete(scope.artifactId);
      blockMirror.delete(scope.artifactId);
      questionMirror.delete(scope.artifactId);
    }
    if (available) {
      try {
        await (prisma as any).$transaction(async (tx: any) => {
          await tx.learningArtifactBlock.deleteMany({ where: { artifactId: scope.artifactId } });
          await tx.learningArtifact.update({ where: { id: scope.artifactId }, data: { parseStatus: 'not_parsed' } });
        });
      } catch (e) {
        if (!testFallback) throw new ArtifactPersistenceError('Failed to delete structured artifact.', (e as Error)?.message);
      }
    } else if (!testFallback) {
      throw new ArtifactPersistenceError('Prisma persistence unavailable; delete refused in production.');
    }
  }

  /**
   * Load structured data from existing canonical artifact storage.
   */
  private async _loadFromExisting(artifactId: string): Promise<StructuredArtifactRecord | null> {
    try {
      const existing = await (prisma as any).learningArtifact.findUnique({
        where: { id: artifactId },
      });
      if (!existing) return null;

      return {
        artifactId: existing.id,
        scope: {
          artifactId: existing.id,
          schoolId: existing.schoolId || null,
          studentId: existing.ownerStudentId || null,
          classId: existing.classId || null,
        },
        artifactType: this._mapKind(existing.kind),
        fileName: existing.originalFileName || null,
        mimeType: existing.mimeType || null,
        storageRef: null,
        parseStatus: this._mapParseStatus(existing.parseStatus),
        sourceTrustStatus: 'student_uploaded',
        rawTextAvailable: false,
        structuredBlockCount: existing.blockCount || 0,
        questionCount: existing.questionCount || 0,
        answerKeyCount: existing.answerKeyCount || 0,
        diagramCount: existing.diagramCount || 0,
        workedExampleCount: 0,
        theoremBlockCount: 0,
        learningObjectiveCount: 0,
        topicMappings: [],
        parserWarnings: Array.isArray(existing.warnings) ? existing.warnings : [],
        safetyFlags: [],
        createdAt: existing.createdAt?.toISOString?.() || nowISO(),
        updatedAt: existing.updatedAt?.toISOString?.() || nowISO(),
      };
    } catch {
      return null;
    }
  }

  private _mapKind(kind: string): import('./artifactUnderstandingContracts').ArtifactType {
    const kindMap: Record<string, import('./artifactUnderstandingContracts').ArtifactType> = {
      pdf: 'pdf',
      image: 'image',
      worksheet: 'worksheet',
      transcript: 'transcript',
      notes: 'notes',
      document: 'text_document',
      text: 'text_document',
      slide_deck: 'slide_deck',
      spreadsheet: 'spreadsheet',
    };
    return kindMap[kind] || 'unknown';
  }

  private _mapParseStatus(status: string): ArtifactParseStatus {
    const statusMap: Record<string, ArtifactParseStatus> = {
      not_parsed: 'queued',
      parsing: 'parsing',
      parsed: 'parsed',
      partial: 'parsed_with_warnings',
      failed: 'failed',
      unsupported: 'blocked',
    };
    return statusMap[status] || 'failed';
  }

  private _reverseMapKind(type: string): string {
    const m: Record<string, string> = {
      pdf: 'pdf',
      image: 'image',
      worksheet: 'worksheet',
      transcript: 'transcript',
      notes: 'notes',
      text_document: 'text',
      slide_deck: 'slide_deck',
      spreadsheet: 'worksheet',
      unknown: 'unknown',
    };
    return m[type] || 'unknown';
  }

  private _reverseMapParseStatus(status: string): string {
    const m: Record<string, string> = {
      queued: 'not_parsed',
      parsing: 'parsing',
      parsed: 'parsed',
      parsed_with_warnings: 'partial',
      failed: 'failed',
      blocked: 'unsupported',
    };
    return m[status] || 'not_parsed';
  }

  private _mapBlockKind(kind: string): import('./artifactUnderstandingContracts').ArtifactBlockType {
    const allowed: Record<string, any> = {
      section: 'section', paragraph: 'paragraph', question: 'question', answer_key: 'answer_key',
      diagram: 'diagram', table: 'table', transcript_segment: 'transcript_segment', transcript: 'transcript_segment',
      marking_scheme: 'answer_key', rubric: 'teacher_note', teacher_note: 'teacher_note',
      theorem: 'theorem', definition: 'definition', title: 'title', heading: 'heading', unknown: 'unknown',
    };
    return (allowed[kind] || 'unknown') as import('./artifactUnderstandingContracts').ArtifactBlockType;
  }

  private _mapConfidence(v: number | string): import('./artifactUnderstandingContracts').ArtifactExtractionConfidence {
    if (typeof v === 'string') {
      if (v === 'high' || v === 'medium' || v === 'low') return v as any;
      return 'low';
    }
    if (typeof v === 'number') {
      if (v >= 0.7) return 'high';
      if (v >= 0.45) return 'medium';
      return 'low';
    }
    return 'low';
  }

  private _applyBlockFilters(
    blocks: ArtifactStructuredBlock[],
    options?: ArtifactRepositoryListOptions,
  ): ArtifactStructuredBlock[] {
    let out = [...blocks];
    if (options?.blockTypes && options.blockTypes.length > 0) {
      const wanted = new Set(options.blockTypes);
      out = out.filter((b) => wanted.has(b.blockType));
    }
    if (options?.visibilities && options.visibilities.length > 0) {
      const wanted = new Set(options.visibilities);
      out = out.filter((b) => wanted.has(b.visibility));
    }
    if (typeof options?.pageMin === 'number') {
      out = out.filter((b) => (b.pageNumber ?? 0) >= options.pageMin!);
    }
    if (typeof options?.pageMax === 'number') {
      out = out.filter((b) => (b.pageNumber ?? 0) <= options.pageMax!);
    }
    const offset = options?.offset || 0;
    const limit = options?.limit;
    if (offset) out = out.slice(offset);
    if (typeof limit === 'number') out = out.slice(0, limit);
    return out;
  }
}

// Singleton
export const structuredArtifactRepository = new StructuredArtifactRepository();

export function _clearStructuredRepositoryMirrorForTest(): void {
  structuredRecordMirror.clear();
  blockMirror.clear();
  questionMirror.clear();
}
