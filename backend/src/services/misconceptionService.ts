// ─────────────────────────────────────────────────────────────
// Steadfast AI — Misconception Service v1
// Tracks recurring misconception patterns from practice attempts.
// Deduplicates by normalized label and topic overlap.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import type {
  PracticeMisconceptionSignal,
  PracticeMisconceptionSignalInput,
  PracticeAttempt,
} from './practiceMasteryContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── In-memory fallback store ──
const misconceptionStore = new Map<string, PracticeMisconceptionSignal>();
const misconceptionLookupByKey = new Map<string, string[]>(); // schoolId:studentId -> misconceptionId[]

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

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `mcn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

function memoryKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

// ── MisconceptionService ──

export class MisconceptionService {
  /**
   * Upsert misconceptions from a practice attempt.
   * Deduplicates by normalized label + overlapping topic/skillIds.
   */
  async upsertMisconceptionsFromAttempt(
    identity: ResolvedTutorIdentity,
    attempt: PracticeAttempt,
  ): Promise<PracticeMisconceptionSignal[]> {
    if (attempt.misconceptionSignals.length === 0) return [];

    const results: PracticeMisconceptionSignal[] = [];
    const subject = attempt.subject || 'General';
    const topic = attempt.topic || 'General';

    for (const signal of attempt.misconceptionSignals) {
      const normLabel = normalizeLabel(signal.label);
      const merged = await this._upsertSingleMisconception(identity, signal, normLabel, subject, topic, attempt.attemptId);

      if (merged) {
        // Attach attempt evidence
        if (!merged.evidenceAttemptIds.includes(attempt.attemptId)) {
          merged.evidenceAttemptIds.push(attempt.attemptId);
        }
        merged.lastObservedAt = nowISO();
        merged.observationCount += 1;
        merged.confidenceScore = Math.min(0.95, merged.confidenceScore + 0.05);

        // Merge skill IDs
        if (signal.skillIds && signal.skillIds.length > 0) {
          for (const sid of signal.skillIds) {
            if (!merged.skillIds.includes(sid)) merged.skillIds.push(sid);
          }
        }
        merged.updatedAt = nowISO();

        misconceptionStore.set(merged.misconceptionId, merged);
        await this._upsertPrismaMisconception(merged);
        results.push(merged);
      }
    }

    return results;
  }

  /**
   * Find or create a single misconception by normalized label.
   */
  private async _upsertSingleMisconception(
    identity: ResolvedTutorIdentity,
    signal: PracticeMisconceptionSignalInput,
    normLabel: string,
    subject: string,
    topic: string,
    attemptId: string,
  ): Promise<PracticeMisconceptionSignal | null> {
    // Check in-memory for matching active misconception
    const mk = memoryKey(identity.schoolId, identity.studentId);
    const ids = misconceptionLookupByKey.get(mk) || [];

    for (const mid of ids) {
      const m = misconceptionStore.get(mid);
      if (!m) continue;
      if (m.status !== 'active') continue;
      if (normalizeLabel(m.label) !== normLabel) continue;
      // Check topic overlap
      if (m.topic && topic && m.topic !== topic) continue;
      return { ...m }; // Return mutable copy
    }

    // Try Prisma for existing
    const fromDb = await this._findPrismaMisconception(identity, normLabel, subject, topic);
    if (fromDb) {
      misconceptionStore.set(fromDb.misconceptionId, fromDb);
      if (!ids.includes(fromDb.misconceptionId)) ids.push(fromDb.misconceptionId);
      misconceptionLookupByKey.set(mk, ids);
      return { ...fromDb };
    }

    // Create new
    const now = nowISO();
    const misconception: PracticeMisconceptionSignal = {
      misconceptionId: generateId(),
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      subject,
      topic,
      skillIds: uniqueStrings(signal.skillIds || []),
      label: signal.label.trim().slice(0, 160),
      summary: signal.summary.trim().slice(0, 1200),
      evidenceAttemptIds: [attemptId],
      evidenceMemoryIds: [],
      confidenceScore: typeof signal.confidence === 'number' ? Math.max(0, Math.min(1, signal.confidence)) : 0.3,
      observationCount: 1,
      status: 'active',
      firstObservedAt: now,
      lastObservedAt: now,
      updatedAt: now,
    };

    misconceptionStore.set(misconception.misconceptionId, misconception);
    ids.push(misconception.misconceptionId);
    misconceptionLookupByKey.set(mk, ids);

    await this._persistPrismaMisconception(misconception);
    return misconception;
  }

  /**
   * List misconceptions for the learner.
   */
  async listMisconceptions(
    identity: ResolvedTutorIdentity,
    options?: {
      subject?: string;
      topic?: string;
      status?: string;
      limit?: number;
    },
  ): Promise<PracticeMisconceptionSignal[]> {
    const limit = options?.limit || 50;

    const fromDb = await this._listPrismaMisconceptions(identity, options);
    if (fromDb && fromDb.length > 0) return fromDb.slice(0, limit);

    // Fallback: in-memory
    const mk = memoryKey(identity.schoolId, identity.studentId);
    const ids = misconceptionLookupByKey.get(mk) || [];
    const results: PracticeMisconceptionSignal[] = [];

    for (const mid of ids) {
      const m = misconceptionStore.get(mid);
      if (!m) continue;
      if (m.status === 'soft_deleted') continue;
      if (options?.subject && m.subject !== options.subject) continue;
      if (options?.topic && m.topic !== options.topic) continue;
      if (options?.status && m.status !== options.status) continue;
      results.push(m);
    }

    results.sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt));
    return results.slice(0, limit);
  }

  /**
   * Mark a misconception as improving.
   */
  async markMisconceptionImproving(
    identity: ResolvedTutorIdentity,
    misconceptionId: string,
  ): Promise<PracticeMisconceptionSignal> {
    const m = await this._getMisconceptionInternal(identity, misconceptionId);
    if (!m) {
      throw new MisconceptionNotFoundError(misconceptionId);
    }

    const updated: PracticeMisconceptionSignal = {
      ...m,
      status: 'improving',
      updatedAt: nowISO(),
    };

    misconceptionStore.set(misconceptionId, updated);
    await this._upsertPrismaMisconception(updated);
    return updated;
  }

  /**
   * Mark a misconception as resolved.
   */
  async markMisconceptionResolved(
    identity: ResolvedTutorIdentity,
    misconceptionId: string,
  ): Promise<PracticeMisconceptionSignal> {
    const m = await this._getMisconceptionInternal(identity, misconceptionId);
    if (!m) {
      throw new MisconceptionNotFoundError(misconceptionId);
    }

    const updated: PracticeMisconceptionSignal = {
      ...m,
      status: 'resolved',
      updatedAt: nowISO(),
    };

    misconceptionStore.set(misconceptionId, updated);
    await this._upsertPrismaMisconception(updated);
    return updated;
  }

  private async _getMisconceptionInternal(
    identity: ResolvedTutorIdentity,
    misconceptionId: string,
  ): Promise<PracticeMisconceptionSignal | null> {
    const mem = misconceptionStore.get(misconceptionId);
    if (mem) {
      if (mem.schoolId !== identity.schoolId || mem.studentId !== identity.studentId) return null;
      return mem;
    }
    return this._getPrismaMisconception(identity, misconceptionId);
  }

  // ── Prisma helpers ──

  private async _persistPrismaMisconception(m: PracticeMisconceptionSignal): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    try {
      await (prisma as any).practiceMisconceptionSignal.create({
        data: {
          id: m.misconceptionId,
          schoolId: m.schoolId,
          studentId: m.studentId,
          subject: m.subject,
          topic: m.topic,
          skillIds: m.skillIds as any,
          label: m.label,
          summary: m.summary,
          evidenceAttemptIds: m.evidenceAttemptIds as any,
          evidenceMemoryIds: m.evidenceMemoryIds as any,
          confidenceScore: m.confidenceScore,
          observationCount: m.observationCount,
          status: m.status,
          firstObservedAt: new Date(m.firstObservedAt),
          lastObservedAt: new Date(m.lastObservedAt),
        },
      });
    } catch {
      // in-memory fallback
    }
  }

  private async _upsertPrismaMisconception(m: PracticeMisconceptionSignal): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    try {
      // We use findUnique then update because there's no natural unique constraint besides id
      const existing = await (prisma as any).practiceMisconceptionSignal.findUnique({
        where: { id: m.misconceptionId },
      });
      if (existing) {
        await (prisma as any).practiceMisconceptionSignal.update({
          where: { id: m.misconceptionId },
          data: {
            skillIds: m.skillIds as any,
            label: m.label,
            summary: m.summary,
            evidenceAttemptIds: m.evidenceAttemptIds as any,
            evidenceMemoryIds: m.evidenceMemoryIds as any,
            confidenceScore: m.confidenceScore,
            observationCount: m.observationCount,
            status: m.status,
            lastObservedAt: new Date(m.lastObservedAt),
          },
        });
      } else {
        await this._persistPrismaMisconception(m);
      }
    } catch {
      // in-memory fallback
    }
  }

  private async _findPrismaMisconception(
    identity: ResolvedTutorIdentity,
    normLabel: string,
    subject: string,
    topic: string,
  ): Promise<PracticeMisconceptionSignal | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const records = await (prisma as any).practiceMisconceptionSignal.findMany({
        where: {
          schoolId: identity.schoolId,
          studentId: identity.studentId,
          status: 'active',
        },
        take: 20,
      });
      if (!records || records.length === 0) return null;
      for (const r of records) {
        if (normalizeLabel(r.label) === normLabel) {
          return this._mapPrismaMisconception(r);
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private async _listPrismaMisconceptions(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string; topic?: string; status?: string; limit?: number },
  ): Promise<PracticeMisconceptionSignal[] | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const where: Record<string, any> = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
      };
      if (options?.subject) where.subject = options.subject;
      if (options?.topic) where.topic = options.topic;
      if (options?.status) where.status = options.status;

      const records = await (prisma as any).practiceMisconceptionSignal.findMany({
        where,
        orderBy: { lastObservedAt: 'desc' },
        take: options?.limit || 50,
      });
      if (!records || records.length === 0) return null;
      return records.map((r: any) => this._mapPrismaMisconception(r));
    } catch {
      return null;
    }
  }

  private async _getPrismaMisconception(
    identity: ResolvedTutorIdentity,
    misconceptionId: string,
  ): Promise<PracticeMisconceptionSignal | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const record = await (prisma as any).practiceMisconceptionSignal.findUnique({
        where: { id: misconceptionId },
      });
      if (!record) return null;
      if (record.schoolId !== identity.schoolId || record.studentId !== identity.studentId) return null;
      return this._mapPrismaMisconception(record);
    } catch {
      return null;
    }
  }

  private _mapPrismaMisconception(record: any): PracticeMisconceptionSignal {
    return {
      misconceptionId: record.id,
      schoolId: record.schoolId,
      studentId: record.studentId,
      subject: record.subject ?? null,
      topic: record.topic ?? null,
      skillIds: Array.isArray(record.skillIds) ? record.skillIds : [],
      label: record.label,
      summary: record.summary,
      evidenceAttemptIds: Array.isArray(record.evidenceAttemptIds) ? record.evidenceAttemptIds : [],
      evidenceMemoryIds: Array.isArray(record.evidenceMemoryIds) ? record.evidenceMemoryIds : [],
      confidenceScore: typeof record.confidenceScore === 'number' ? record.confidenceScore : 0.3,
      observationCount: record.observationCount ?? 1,
      status: record.status || 'active',
      firstObservedAt: record.firstObservedAt?.toISOString?.() || nowISO(),
      lastObservedAt: record.lastObservedAt?.toISOString?.() || nowISO(),
      updatedAt: record.updatedAt?.toISOString?.() || nowISO(),
    };
  }
}

export class MisconceptionNotFoundError extends Error {
  public code = 'MISCONCEPTION_NOT_FOUND';
  public statusCode = 404;
  constructor(misconceptionId: string) {
    super(`Misconception not found: ${misconceptionId}`);
    this.name = 'MisconceptionNotFoundError';
  }
}

// Singleton
export const misconceptionService = new MisconceptionService();

// For testing
export function _clearMisconceptionStoreForTest(): void {
  misconceptionStore.clear();
  misconceptionLookupByKey.clear();
}
