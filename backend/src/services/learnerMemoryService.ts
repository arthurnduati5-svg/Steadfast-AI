// ─────────────────────────────────────────────────────────────
// Steadfast AI — Durable Learner Memory Service
// Owns durable memory item lifecycle: CRUD, soft-delete, merge,
// confidence scoring, evidence management, expiry handling.
//
// R2 durability rules:
// - When Prisma is available, Prisma is the SOLE authoritative store.
//   Reads never fall back to the in-memory copy; writes go to Prisma
//   and failures propagate (never silently swallowed).
// - The in-memory store is a NON-authoritative fallback used ONLY when
//   Prisma is genuinely unavailable (e.g. isolated unit tests with no DB).
//   In production Prisma is available, so the Map is never authoritative
//   and memory survives process reconstruction.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import type {
  LearnerMemoryItem,
  LearnerMemoryKind,
  LearnerMemoryStatus,
  LearnerMemoryVisibility,
  LearnerMemorySource,
  LearnerMemoryConfidence,
  LearnerMemoryEvidence,
  CreateLearnerMemoryRequest,
  PatchLearnerMemoryRequest,
  DeleteLearnerMemoryRequest,
  LearningEvent,
  LearningEventSource,
  CreateLearningEventRequest,
} from './learnerMemoryContracts';
import {
  computeConfidenceScore,
  confidenceFromScore,
} from './learnerMemoryContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { learningEventService } from './learningEventService';
import { learnerMemoryReducer } from './learnerMemoryReducer';

// ── Non-authoritative in-memory fallback (tests without a DB only) ──
const memoryStore = new Map<string, LearnerMemoryItem>();
const memoryLookupByKey = new Map<string, string[]>(); // schoolId:studentId -> memoryId[]

// ── Prisma availability ──
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

function resetPrismaAvailabilityForTest(): void {
  _prismaAvailable = null;
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

function memoryKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

function isExpired(m: { expiresAt?: string | null }): boolean {
  if (!m.expiresAt) return false;
  return m.expiresAt < nowISO();
}

// Statuses that must NOT be silently resurrected/overwritten by a later event.
function isSuppressedStatus(status: LearnerMemoryStatus): boolean {
  return (
    status === 'soft_deleted' ||
    status === 'school_exited_hold' ||
    status === 'blocked' ||
    status === 'archived' ||
    status === 'expired'
  );
}

function scopeKeyOf(kind: LearnerMemoryKind, subject?: string | null, topic?: string | null): string {
  return `${kind}::${subject?.trim() || ''}::${topic?.trim() || ''}`;
}

// ── LearnerMemoryService ──

export class LearnerMemoryService {
  /**
   * Create a new durable memory item.
   * Requires evidence, tutorUse, and confidence.
   */
  async createLearnerMemory(
    identity: ResolvedTutorIdentity,
    input: CreateLearnerMemoryRequest,
  ): Promise<LearnerMemoryItem> {
    const now = nowISO();
    const memoryId = generateId();

    const confidence: LearnerMemoryConfidence = input.confidence || 'low';
    const confidenceScore = computeConfidenceScore(confidence, 1);

    const evidence: LearnerMemoryEvidence[] = (input.evidence || []).map((e, i) => ({
      evidenceId: `evd_${memoryId}_${i}`,
      eventId: null,
      source: e.source,
      summary: e.summary.trim().slice(0, 1200),
      observedAt: now,
      subject: e.subject?.trim().slice(0, 256) || null,
      topic: e.topic?.trim().slice(0, 256) || null,
      skillIds: uniqueStrings(e.skillIds || []),
      artifactId: e.artifactId?.trim() || null,
      artifactBlockId: e.artifactBlockId?.trim() || null,
      confidence: typeof e.confidence === 'number' ? Math.max(0, Math.min(1, e.confidence)) : 0.5,
      safeQuote: e.safeQuote?.trim().slice(0, 280) || null,
    }));

    const memory: LearnerMemoryItem = {
      memoryId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      kind: input.kind,
      status: 'active',
      visibility: input.visibility || 'system_only',
      subject: input.subject?.trim() || null,
      topic: input.topic?.trim() || null,
      skillIds: uniqueStrings(input.skillIds || []),
      label: input.label.trim().slice(0, 160),
      summary: input.summary.trim().slice(0, 1200),
      tutorUse: input.tutorUse.trim().slice(0, 800),
      evidence,
      confidence,
      confidenceScore,
      firstObservedAt: now,
      lastObservedAt: now,
      observationCount: 1,
      source: evidence[0]?.source || 'tutor_turn',
      sourceEventIds: [],
      artifactIds: uniqueStrings(input.artifactIds || []),
      artifactBlockIds: uniqueStrings(input.artifactBlockIds || []),
      expiresAt: input.expiresAt || null,
      softDeletedAt: null,
      deletedReason: null,
      createdAt: now,
      updatedAt: now,
    };

    const available = await isPrismaAvailable();
    if (available) {
      // Prisma is authoritative. Failures must propagate.
      await (prisma as any).learnerMemoryItem.create({
        data: this._buildCreateData(memory),
      });
      return memory;
    }

    // Non-DB fallback only.
    memoryStore.set(memoryId, memory);
    const key = memoryKey(identity.schoolId, identity.studentId);
    const existing = memoryLookupByKey.get(key) || [];
    existing.push(memoryId);
    memoryLookupByKey.set(key, existing);
    return memory;
  }

  /**
   * List active (non-deleted, non-expired) memory items.
   * When Prisma is available, Prisma is authoritative and the in-memory
   * copy is never consulted.
   */
  async listLearnerMemory(
    identity: ResolvedTutorIdentity,
    options?: {
      kind?: LearnerMemoryKind;
      subject?: string | null;
      topic?: string | null;
      limit?: number;
      includeDeleted?: boolean;
    },
  ): Promise<LearnerMemoryItem[]> {
    const limit = options?.limit || 50;
    const includeDeleted = options?.includeDeleted || false;

    const available = await isPrismaAvailable();
    if (available) {
      const where: Record<string, unknown> = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
      };
      if (options?.kind) where.kind = options.kind;
      if (options?.subject) where.subject = options.subject;
      if (options?.topic) where.topic = options.topic;
      if (!includeDeleted) {
        where.status = {
          notIn: ['soft_deleted', 'expired', 'school_exited_hold', 'blocked', 'archived'],
        };
      }

      const records = await (prisma as any).learnerMemoryItem.findMany({
        where,
        orderBy: { lastObservedAt: 'desc' },
        take: limit,
      });

      let mapped: LearnerMemoryItem[] = (records || []).map((r: any) => this._mapPrismaMemory(r));
      if (!includeDeleted) {
        mapped = mapped.filter((m) => !isExpired(m));
      }
      return mapped.slice(0, limit);
    }

    // Non-DB fallback only.
    const key = memoryKey(identity.schoolId, identity.studentId);
    const memoryIds = memoryLookupByKey.get(key) || [];
    const results: LearnerMemoryItem[] = [];

    for (const memId of memoryIds) {
      const mem = memoryStore.get(memId);
      if (!mem) continue;

      if (!includeDeleted && (
        mem.status === 'soft_deleted' ||
        mem.status === 'expired' ||
        mem.status === 'school_exited_hold' ||
        mem.status === 'blocked' ||
        mem.status === 'archived'
      )) continue;
      if (!includeDeleted && isExpired(mem)) continue;
      if (mem.schoolId !== identity.schoolId) continue;
      if (mem.studentId !== identity.studentId) continue;

      if (options?.kind && mem.kind !== options.kind) continue;
      if (options?.subject && mem.subject !== options.subject) continue;
      if (options?.topic && mem.topic !== options.topic) continue;

      results.push(mem);
    }

    results.sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt));
    return results.slice(0, limit);
  }

  /**
   * Get a single memory item. Prisma is authoritative when available.
   */
  async getLearnerMemory(
    identity: ResolvedTutorIdentity,
    memoryId: string,
  ): Promise<LearnerMemoryItem | null> {
    const available = await isPrismaAvailable();
    if (available) {
      const record = await (prisma as any).learnerMemoryItem.findUnique({ where: { id: memoryId } });
      if (!record) return null;
      if (record.schoolId !== identity.schoolId) return null;
      if (record.studentId !== identity.studentId) return null;
      return this._mapPrismaMemory(record);
    }

    const mem = memoryStore.get(memoryId);
    if (!mem) return null;
    if (mem.schoolId !== identity.schoolId) return null;
    if (mem.studentId !== identity.studentId) return null;
    return mem;
  }

  /**
   * Find a memory by canonical scope identity
   * (schoolId + studentId + kind + subject + topic), including suppressed
   * statuses. Used by the event→memory orchestrator to prevent duplicate or
   * resurrected rows.
   */
  async findMemoryByScope(
    identity: ResolvedTutorIdentity,
    kind: LearnerMemoryKind,
    subject?: string | null,
    topic?: string | null,
  ): Promise<LearnerMemoryItem | null> {
    const available = await isPrismaAvailable();
    if (available) {
      const records = await (prisma as any).learnerMemoryItem.findMany({
        where: {
          schoolId: identity.schoolId,
          studentId: identity.studentId,
          kind,
          subject: subject?.trim() || null,
          topic: topic?.trim() || null,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      if (!records || records.length === 0) return null;
      return this._mapPrismaMemory(records[0]);
    }

    const key = memoryKey(identity.schoolId, identity.studentId);
    const memoryIds = memoryLookupByKey.get(key) || [];
    for (const memId of memoryIds) {
      const mem = memoryStore.get(memId);
      if (!mem) continue;
      if (mem.kind !== kind) continue;
      if ((mem.subject || '') !== (subject?.trim() || '')) continue;
      if ((mem.topic || '') !== (topic?.trim() || '')) continue;
      return mem;
    }
    return null;
  }

  /**
   * Patch safe fields on a memory item.
   */
  async patchLearnerMemory(
    identity: ResolvedTutorIdentity,
    memoryId: string,
    patch: PatchLearnerMemoryRequest,
  ): Promise<LearnerMemoryItem> {
    const current = await this.getLearnerMemory(identity, memoryId);
    if (!current) {
      throw new LearnerMemoryNotFoundError(memoryId);
    }

    const now = nowISO();
    const updated: LearnerMemoryItem = {
      ...current,
      status: patch.status || current.status,
      visibility: patch.visibility || current.visibility,
      label: patch.label?.trim().slice(0, 160) || current.label,
      summary: patch.summary?.trim().slice(0, 1200) || current.summary,
      tutorUse: patch.tutorUse?.trim().slice(0, 800) || current.tutorUse,
      confidence: patch.confidence || current.confidence,
      confidenceScore: patch.confidence
        ? computeConfidenceScore(patch.confidence, current.observationCount)
        : current.confidenceScore,
      expiresAt: patch.expiresAt !== undefined ? patch.expiresAt : current.expiresAt,
      updatedAt: now,
    };

    const available = await isPrismaAvailable();
    if (available) {
      await (prisma as any).learnerMemoryItem.update({
        where: { id: memoryId },
        data: this._buildUpdateData(updated),
      });
      return updated;
    }

    memoryStore.set(memoryId, updated);
    return updated;
  }

  /**
   * Soft-delete a memory item.
   */
  async softDeleteLearnerMemory(
    identity: ResolvedTutorIdentity,
    memoryId: string,
    input: DeleteLearnerMemoryRequest,
  ): Promise<LearnerMemoryItem> {
    const current = await this.getLearnerMemory(identity, memoryId);
    if (!current) {
      throw new LearnerMemoryNotFoundError(memoryId);
    }

    const now = nowISO();
    const updated: LearnerMemoryItem = {
      ...current,
      status: 'soft_deleted',
      softDeletedAt: now,
      deletedReason: input.reason.trim().slice(0, 500),
      updatedAt: now,
    };

    const available = await isPrismaAvailable();
    if (available) {
      await (prisma as any).learnerMemoryItem.update({
        where: { id: memoryId },
        data: this._buildUpdateData(updated),
      });
      return updated;
    }

    memoryStore.set(memoryId, updated);
    return updated;
  }

  /**
   * Merge evidence into an existing memory item.
   * Internal helper used by the reducer/orchestrator.
   */
  async appendEvidenceToLearnerMemory(
    identity: ResolvedTutorIdentity,
    memoryId: string,
    newEvidence: LearnerMemoryEvidence[],
  ): Promise<LearnerMemoryItem> {
    const current = await this.getLearnerMemory(identity, memoryId);
    if (!current) {
      throw new LearnerMemoryNotFoundError(memoryId);
    }

    const now = nowISO();
    const mergedEvidence = [
      ...current.evidence,
      ...newEvidence.map((e) => ({ ...e })),
    ].slice(-50);

    const newCount = current.observationCount + newEvidence.length;
    const newConfidenceScore = computeConfidenceScore(current.confidence, newCount);
    const newConfidence = confidenceFromScore(newConfidenceScore);

    const updated: LearnerMemoryItem = {
      ...current,
      evidence: mergedEvidence,
      confidence: newConfidence,
      confidenceScore: newConfidenceScore,
      observationCount: newCount,
      lastObservedAt: now,
      updatedAt: now,
    };

    const available = await isPrismaAvailable();
    if (available) {
      await (prisma as any).learnerMemoryItem.update({
        where: { id: memoryId },
        data: this._buildUpdateData(updated),
      });
      return updated;
    }

    memoryStore.set(memoryId, updated);
    return updated;
  }

  /**
   * Record a learning event and durably reduce it into LearnerMemoryItem rows.
   *
   * When Prisma is available, the event creation and every memory upsert are
   * wrapped in ONE transaction so a partial failure cannot leave a reported
   * event without its memory (R2.9). When Prisma is unavailable (unit tests
   * with no DB), the non-authoritative in-memory store is used as a fallback.
   *
   * Memory identity is resolved by canonical scope
   * (kind + subject + topic). Repeated observations update the existing row
   * instead of creating duplicates (R2.10). A later event that matches a
   * suppressed (soft-deleted / held / blocked / archived / expired) memory
   * does NOT resurrect it (R2.13).
   */
  async recordLearningEventAndMemory(
    identity: ResolvedTutorIdentity,
    input: CreateLearningEventRequest,
  ): Promise<{
    event: LearningEvent;
    memoryCreated: LearnerMemoryItem[];
    memoryUpdated: LearnerMemoryItem[];
  }> {
    const available = await isPrismaAvailable();
    if (available) {
      return (prisma as any).$transaction(async (tx: any) => {
        const event = learningEventService.buildLearningEvent(identity, input);
        await tx.learningEvent.create({ data: learningEventService.toPrismaCreateData(event) });

        const candidates = learnerMemoryReducer.reduceLearningEventToMemoryCandidates(event);
        const memoryCreated: LearnerMemoryItem[] = [];
        const memoryUpdated: LearnerMemoryItem[] = [];
        const handledScopes = new Set<string>();

        for (const candidate of candidates) {
          const scopeKey = scopeKeyOf(candidate.kind, candidate.subject, candidate.topic);
          if (handledScopes.has(scopeKey)) continue;
          handledScopes.add(scopeKey);

          const existing = await this._findMemoryByScopeInTx(tx, identity, candidate.kind, candidate.subject, candidate.topic);
          if (existing && isSuppressedStatus(existing.status as LearnerMemoryStatus)) {
            // Preserve deletion/hold — do not resurrect or overwrite.
            continue;
          }

          if (existing) {
            const updated = await this._appendEvidenceInTx(tx, identity, existing, candidate.evidence, event.eventId);
            memoryUpdated.push(updated);
          } else {
            const created = await this._createMemoryInTx(tx, identity, candidate, event.eventId);
            memoryCreated.push(created);
          }
        }

        return { event, memoryCreated, memoryUpdated };
      });
    }

    // Non-DB fallback path: mirror the transactional behavior on the Map store.
    const event = await learningEventService.createLearningEvent(identity, input);
    const candidates = learnerMemoryReducer.reduceLearningEventToMemoryCandidates(event);
    const memoryCreated: LearnerMemoryItem[] = [];
    const memoryUpdated: LearnerMemoryItem[] = [];
    const handledScopes = new Set<string>();

    for (const candidate of candidates) {
      const scopeKey = scopeKeyOf(candidate.kind, candidate.subject, candidate.topic);
      if (handledScopes.has(scopeKey)) continue;
      handledScopes.add(scopeKey);

      const existing = await this.findMemoryByScope(identity, candidate.kind, candidate.subject, candidate.topic);
      if (existing && isSuppressedStatus(existing.status)) {
        continue;
      }

      if (existing) {
        const updated = await this.appendEvidenceToLearnerMemory(identity, existing.memoryId, candidate.evidence);
        if (!updated.sourceEventIds.includes(event.eventId)) {
          updated.sourceEventIds = [...updated.sourceEventIds, event.eventId];
        }
        memoryUpdated.push(updated);
      } else {
        const created = await this.createLearnerMemory(identity, {
          kind: candidate.kind,
          visibility: 'system_only',
          subject: candidate.subject || undefined,
          topic: candidate.topic || undefined,
          skillIds: candidate.skillIds,
          label: candidate.label,
          summary: candidate.summary,
          tutorUse: candidate.tutorUse,
          evidence: candidate.evidence.map((e) => ({
            source: e.source,
            summary: e.summary,
            subject: e.subject || undefined,
            topic: e.topic || undefined,
            skillIds: e.skillIds,
            artifactId: e.artifactId || undefined,
            artifactBlockId: e.artifactBlockId || undefined,
            confidence: e.confidence,
            safeQuote: e.safeQuote || undefined,
          })),
          confidence: candidate.confidence,
          artifactIds: candidate.artifactIds,
          artifactBlockIds: candidate.artifactBlockIds,
        });
        created.sourceEventIds = [event.eventId];
        memoryCreated.push(created);
      }
    }

    return { event, memoryCreated, memoryUpdated };
  }

  // ── Prisma persistence helpers (authoritative path) ──

  private _buildCreateData(m: LearnerMemoryItem): Record<string, unknown> {
    return {
      id: m.memoryId,
      schoolId: m.schoolId,
      studentId: m.studentId,
      kind: m.kind,
      status: m.status,
      visibility: m.visibility,
      subject: m.subject,
      topic: m.topic,
      skillIds: m.skillIds as any,
      label: m.label,
      summary: m.summary,
      tutorUse: m.tutorUse,
      evidence: m.evidence as any,
      confidence: m.confidence,
      confidenceScore: m.confidenceScore,
      firstObservedAt: new Date(m.firstObservedAt),
      lastObservedAt: new Date(m.lastObservedAt),
      observationCount: m.observationCount,
      source: m.source,
      sourceEventIds: m.sourceEventIds as any,
      artifactIds: m.artifactIds as any,
      artifactBlockIds: m.artifactBlockIds as any,
      expiresAt: m.expiresAt ? new Date(m.expiresAt) : null,
      softDeletedAt: m.softDeletedAt ? new Date(m.softDeletedAt) : null,
      deletedReason: m.deletedReason,
    };
  }

  private _buildUpdateData(m: LearnerMemoryItem): Record<string, unknown> {
    return {
      kind: m.kind,
      status: m.status,
      visibility: m.visibility,
      subject: m.subject,
      topic: m.topic,
      skillIds: m.skillIds as any,
      label: m.label,
      summary: m.summary,
      tutorUse: m.tutorUse,
      evidence: m.evidence as any,
      confidence: m.confidence,
      confidenceScore: m.confidenceScore,
      lastObservedAt: new Date(m.lastObservedAt),
      observationCount: m.observationCount,
      source: m.source,
      sourceEventIds: m.sourceEventIds as any,
      artifactIds: m.artifactIds as any,
      artifactBlockIds: m.artifactBlockIds as any,
      expiresAt: m.expiresAt ? new Date(m.expiresAt) : null,
      softDeletedAt: m.softDeletedAt ? new Date(m.softDeletedAt) : null,
      deletedReason: m.deletedReason,
    };
  }

  private async _findMemoryByScopeInTx(
    tx: any,
    identity: ResolvedTutorIdentity,
    kind: LearnerMemoryKind,
    subject?: string | null,
    topic?: string | null,
  ): Promise<LearnerMemoryItem | null> {
    const records = await tx.learnerMemoryItem.findMany({
      where: {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        kind,
        subject: subject?.trim() || null,
        topic: topic?.trim() || null,
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    if (!records || records.length === 0) return null;
    return this._mapPrismaMemory(records[0]);
  }

  private async _createMemoryInTx(
    tx: any,
    identity: ResolvedTutorIdentity,
    candidate: ReturnType<typeof learnerMemoryReducer.reduceLearningEventToMemoryCandidates>[number],
    eventId: string,
  ): Promise<LearnerMemoryItem> {
    const now = nowISO();
    const memoryId = generateId();
    const confidence = candidate.confidence || 'low';
    const confidenceScore = computeConfidenceScore(confidence, 1);

    const evidence: LearnerMemoryEvidence[] = candidate.evidence.map((e, i) => ({
      evidenceId: `evd_${memoryId}_${i}`,
      eventId,
      source: e.source,
      summary: e.summary.trim().slice(0, 1200),
      observedAt: now,
      subject: e.subject?.trim().slice(0, 256) || null,
      topic: e.topic?.trim().slice(0, 256) || null,
      skillIds: uniqueStrings(e.skillIds || []),
      artifactId: e.artifactId?.trim() || null,
      artifactBlockId: e.artifactBlockId?.trim() || null,
      confidence: typeof e.confidence === 'number' ? Math.max(0, Math.min(1, e.confidence)) : 0.5,
      safeQuote: e.safeQuote?.trim().slice(0, 280) || null,
    }));

    const memory: LearnerMemoryItem = {
      memoryId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      kind: candidate.kind,
      status: 'active',
      visibility: 'system_only',
      subject: candidate.subject?.trim() || null,
      topic: candidate.topic?.trim() || null,
      skillIds: uniqueStrings(candidate.skillIds || []),
      label: candidate.label.trim().slice(0, 160),
      summary: candidate.summary.trim().slice(0, 1200),
      tutorUse: candidate.tutorUse.trim().slice(0, 800),
      evidence,
      confidence,
      confidenceScore,
      firstObservedAt: now,
      lastObservedAt: now,
      observationCount: 1,
      source: evidence[0]?.source || 'tutor_turn',
      sourceEventIds: [eventId],
      artifactIds: uniqueStrings(candidate.artifactIds || []),
      artifactBlockIds: uniqueStrings(candidate.artifactBlockIds || []),
      expiresAt: null,
      softDeletedAt: null,
      deletedReason: null,
      createdAt: now,
      updatedAt: now,
    };

    await tx.learnerMemoryItem.create({ data: this._buildCreateData(memory) });
    return memory;
  }

  private async _appendEvidenceInTx(
    tx: any,
    identity: ResolvedTutorIdentity,
    existing: LearnerMemoryItem,
    newEvidence: LearnerMemoryEvidence[],
    eventId: string,
  ): Promise<LearnerMemoryItem> {
    const now = nowISO();
    const mergedEvidence = [
      ...existing.evidence,
      ...newEvidence.map((e) => ({ ...e })),
    ].slice(-50);

    const newCount = existing.observationCount + newEvidence.length;
    const newConfidenceScore = computeConfidenceScore(existing.confidence, newCount);
    const newConfidence = confidenceFromScore(newConfidenceScore);

    const sourceEventIds = existing.sourceEventIds.includes(eventId)
      ? existing.sourceEventIds
      : [...existing.sourceEventIds, eventId];

    const updated: LearnerMemoryItem = {
      ...existing,
      evidence: mergedEvidence,
      confidence: newConfidence,
      confidenceScore: newConfidenceScore,
      observationCount: newCount,
      sourceEventIds,
      lastObservedAt: now,
      updatedAt: now,
    };

    await tx.learnerMemoryItem.update({
      where: { id: existing.memoryId },
      data: this._buildUpdateData(updated),
    });
    return updated;
  }

  private _mapPrismaMemory(record: any): LearnerMemoryItem {
    return {
      memoryId: record.id,
      schoolId: record.schoolId,
      studentId: record.studentId,
      kind: record.kind as LearnerMemoryKind,
      status: (record.status || 'active') as LearnerMemoryStatus,
      visibility: (record.visibility || 'system_only') as LearnerMemoryVisibility,
      subject: record.subject ?? null,
      topic: record.topic ?? null,
      skillIds: Array.isArray(record.skillIds) ? record.skillIds : [],
      label: record.label,
      summary: record.summary,
      tutorUse: record.tutorUse,
      evidence: Array.isArray(record.evidence) ? record.evidence : [],
      confidence: (record.confidence || 'low') as LearnerMemoryConfidence,
      confidenceScore: typeof record.confidenceScore === 'number' ? record.confidenceScore : 0.3,
      firstObservedAt: record.firstObservedAt?.toISOString?.() || nowISO(),
      lastObservedAt: record.lastObservedAt?.toISOString?.() || nowISO(),
      observationCount: record.observationCount || 1,
      source: (record.source || 'tutor_turn') as LearnerMemorySource,
      sourceEventIds: Array.isArray(record.sourceEventIds) ? record.sourceEventIds : [],
      artifactIds: Array.isArray(record.artifactIds) ? record.artifactIds : [],
      artifactBlockIds: Array.isArray(record.artifactBlockIds) ? record.artifactBlockIds : [],
      expiresAt: record.expiresAt?.toISOString?.() || null,
      softDeletedAt: record.softDeletedAt?.toISOString?.() || null,
      deletedReason: record.deletedReason ?? null,
      createdAt: record.createdAt?.toISOString?.() || nowISO(),
      updatedAt: record.updatedAt?.toISOString?.() || nowISO(),
    };
  }
}

export class LearnerMemoryNotFoundError extends Error {
  public code = 'MEMORY_NOT_FOUND';
  public statusCode = 404;

  constructor(memoryId: string) {
    super(`Learner memory item not found: ${memoryId}`);
    this.name = 'LearnerMemoryNotFoundError';
  }
}

// Singleton
export const learnerMemoryService = new LearnerMemoryService();

// For testing
export function _clearMemoryStoreForTest(): void {
  memoryStore.clear();
  memoryLookupByKey.clear();
  resetPrismaAvailabilityForTest();
}

// Re-export to keep consumers stable.
export type { LearningEventSource };
