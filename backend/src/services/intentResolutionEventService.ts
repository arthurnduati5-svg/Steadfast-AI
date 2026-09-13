// ─────────────────────────────────────────────────────────────
// Steadfast AI — Intent Resolution Event Service v1
// Optionally audit intent resolutions with bounded summaries.
// No raw full message by default.  Uses in-memory store with
// Prisma persistence when available.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import type {
  TutorIntentResolution,
  IntentResolutionEventRecord,
} from './intentResolverContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── In-memory fallback store ──
const eventStore = new Map<string, IntentResolutionEventRecord>();
const eventLookupByKey = new Map<string, string[]>(); // schoolId:studentId -> eventId[]

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
  return `iev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function memoryKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

// ── IntentResolutionEventService ──

export class IntentResolutionEventService {
  /**
   * Record an intent resolution event with bounded summaries.
   * Does NOT store raw full message by default.
   */
  async recordResolutionEvent(
    identity: ResolvedTutorIdentity,
    resolution: TutorIntentResolution,
    messageSummary?: string | null,
  ): Promise<IntentResolutionEventRecord> {
    const now = nowISO();
    const eventId = generateId();

    // Build bounded evidence summary (not raw evidence)
    const evidenceSummary = resolution.evidence.slice(0, 8).map((e) => ({
      source: e.source,
      signal: e.signal,
      confidence: e.confidence,
    }));

    const record: IntentResolutionEventRecord = {
      eventId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      sessionId: null, // Not persisted in v1 unless session context available
      primaryIntent: resolution.primaryIntent,
      status: resolution.status,
      confidenceScore: resolution.confidenceScore,
      taskKind: resolution.task.taskKind,
      messageSummary: messageSummary?.slice(0, 200) || null,
      evidenceSummary,
      warnings: resolution.warnings.slice(0, 5),
      createdAt: now,
    };

    // In-memory store
    eventStore.set(eventId, record);
    const key = memoryKey(identity.schoolId, identity.studentId);
    const existing = eventLookupByKey.get(key) || [];
    existing.push(eventId);
    eventLookupByKey.set(key, existing);

    // Try Prisma persistence if model exists
    await this._persistPrismaEvent(record);

    return record;
  }

  /**
   * List recent intent resolution events for the learner.
   */
  async listResolutionEvents(
    identity: ResolvedTutorIdentity,
    options?: {
      sessionId?: string;
      primaryIntent?: string;
      limit?: number;
    },
  ): Promise<IntentResolutionEventRecord[]> {
    const limit = options?.limit || 20;

    // Try Prisma first
    const fromDb = await this._listPrismaEvents(identity, options);
    if (fromDb && fromDb.length > 0) return fromDb.slice(0, limit);

    // Fallback: in-memory
    const key = memoryKey(identity.schoolId, identity.studentId);
    const ids = eventLookupByKey.get(key) || [];
    const results: IntentResolutionEventRecord[] = [];

    for (const eid of ids) {
      const r = eventStore.get(eid);
      if (!r) continue;
      if (r.schoolId !== identity.schoolId || r.studentId !== identity.studentId) continue;
      if (options?.sessionId && options.sessionId !== '') continue;
      if (options?.primaryIntent && r.primaryIntent !== options.primaryIntent) continue;
      results.push(r);
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return results.slice(0, limit);
  }

  // ── Prisma persistence ──

  private async _persistPrismaEvent(record: IntentResolutionEventRecord): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    try {
      // Check if the model exists before attempting to write
      await (prisma as any).$queryRaw`SELECT 1 FROM "IntentResolutionEvent" LIMIT 1`;
      await (prisma as any).intentResolutionEvent.create({
        data: {
          id: record.eventId,
          schoolId: record.schoolId,
          studentId: record.studentId,
          sessionId: record.sessionId,
          primaryIntent: record.primaryIntent,
          status: record.status,
          confidenceScore: record.confidenceScore,
          taskKind: record.taskKind,
          messageSummary: record.messageSummary,
          evidenceSummary: record.evidenceSummary as any,
          warnings: record.warnings as any,
        },
      });
    } catch {
      // Model doesn't exist or Prisma unavailable — in-memory copy is sufficient
    }
  }

  private async _listPrismaEvents(
    identity: ResolvedTutorIdentity,
    options?: { sessionId?: string; primaryIntent?: string; limit?: number },
  ): Promise<IntentResolutionEventRecord[] | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const where: Record<string, any> = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
      };
      if (options?.primaryIntent) where.primaryIntent = options.primaryIntent;

      const records = await (prisma as any).intentResolutionEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 20,
      });
      if (!records || records.length === 0) return null;
      return records.map((r: any) => ({
        eventId: r.id,
        schoolId: r.schoolId,
        studentId: r.studentId,
        sessionId: r.sessionId ?? null,
        primaryIntent: r.primaryIntent,
        status: r.status,
        confidenceScore: r.confidenceScore,
        taskKind: r.taskKind,
        messageSummary: r.messageSummary ?? null,
        evidenceSummary: Array.isArray(r.evidenceSummary) ? r.evidenceSummary : [],
        warnings: Array.isArray(r.warnings) ? r.warnings : [],
        createdAt: r.createdAt?.toISOString?.() || nowISO(),
      }));
    } catch {
      return null;
    }
  }
}

// Singleton
export const intentResolutionEventService = new IntentResolutionEventService();

// For testing
export function _clearIntentEventStoreForTest(): void {
  eventStore.clear();
  eventLookupByKey.clear();
}
