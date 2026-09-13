// ─────────────────────────────────────────────────────────────
// Steadfast AI — Mastery Service v1
// Maintains early evidence-based skill mastery snapshots.
// Uses bounded confidence, level mapping, and evidence tracking.
// No one-answer-as-final-mastery.  No 1.0 confidence.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import type {
  SkillMasterySnapshot,
  MasteryLevel,
  MasteryStatus,
  MasteryEvidence,
  PracticeAttempt,
  PracticeOutcome,
  PatchMasteryRequest,
} from './practiceMasteryContracts';
import {
  masteryLevelFromScore,
  clampConfidence,
  computeMasteryConfidenceDelta,
} from './practiceMasteryContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── In-memory fallback store ──
const masteryStore = new Map<string, SkillMasterySnapshot>();
const masteryLookupByKey = new Map<string, string[]>(); // schoolId:studentId -> masteryId[]
const masteryLookupBySkill = new Map<string, string>(); // schoolId:studentId:subject:topic:skillId -> masteryId

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
  return `mst_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

function skillKey(schoolId: string, studentId: string, subject: string, topic: string, skillId: string): string {
  return `${schoolId}:${studentId}:${subject}:${topic}:${skillId}`;
}

function memoryKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

// ── MasteryService ──

export class MasteryService {
  /**
   * Get or create a mastery snapshot for a skill.
   */
  async getOrCreateMasterySnapshot(
    identity: ResolvedTutorIdentity,
    skillInput: {
      subject: string;
      topic: string;
      skillId: string;
      skillLabel: string;
    },
  ): Promise<SkillMasterySnapshot> {
    const key = skillKey(identity.schoolId, identity.studentId, skillInput.subject, skillInput.topic, skillInput.skillId);

    // Check in-memory
    const existingId = masteryLookupBySkill.get(key);
    if (existingId) {
      const existing = masteryStore.get(existingId);
      if (existing) return existing;
    }

    // Try Prisma
    const fromDb = await this._getPrismaMastery(identity, skillInput);
    if (fromDb) return fromDb;

    // Create new
    const now = nowISO();
    const masteryId = generateId();
    const snapshot: SkillMasterySnapshot = {
      masteryId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      subject: skillInput.subject,
      topic: skillInput.topic,
      skillId: skillInput.skillId,
      skillLabel: skillInput.skillLabel,
      level: 'not_started',
      status: 'active',
      confidenceScore: 0,
      evidenceCount: 0,
      attemptCount: 0,
      correctCount: 0,
      partialCount: 0,
      incorrectCount: 0,
      misconceptionCount: 0,
      lastAttemptAt: null,
      lastCorrectAt: null,
      lastIncorrectAt: null,
      nextReviewAt: null,
      reviewIntervalDays: null,
      evidence: [],
      createdAt: now,
      updatedAt: now,
    };

    masteryStore.set(masteryId, snapshot);
    masteryLookupBySkill.set(key, masteryId);
    const mk = memoryKey(identity.schoolId, identity.studentId);
    const existing = masteryLookupByKey.get(mk) || [];
    existing.push(masteryId);
    masteryLookupByKey.set(mk, existing);

    await this._persistPrismaMastery(snapshot);
    return snapshot;
  }

  /**
   * Update mastery from a practice attempt.
   * Returns updated snapshots for all skill IDs in the attempt.
   */
  async updateMasteryFromAttempt(
    identity: ResolvedTutorIdentity,
    attempt: PracticeAttempt,
  ): Promise<SkillMasterySnapshot[]> {
    const skillIds = uniqueStrings(attempt.skillIds);
    const subject = attempt.subject || 'General';
    const topic = attempt.topic || 'General';
    const outcome = attempt.outcome;

    if (skillIds.length === 0) return [];

    const updates: SkillMasterySnapshot[] = [];

    for (const skillId of skillIds) {
      const skillLabel = skillId.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const snapshot = await this.getOrCreateMasterySnapshot(identity, {
        subject,
        topic,
        skillId,
        skillLabel,
      });

      // Compute confidence delta
      const hasPriorCorrect = snapshot.correctCount > 0;
      const delta = computeMasteryConfidenceDelta(outcome, attempt.hintsRequested, hasPriorCorrect);
      const newConfidence = clampConfidence(snapshot.confidenceScore + delta);
      const newLevel = masteryLevelFromScore(newConfidence);

      // Build evidence
      const evidenceEntry: MasteryEvidence = {
        evidenceId: `evd_${snapshot.masteryId}_${snapshot.evidenceCount}`,
        source: 'practice_attempt',
        sourceId: attempt.attemptId,
        summary: `Practice attempt ${attempt.attemptNumber}: ${outcome} on ${topic}`,
        outcome,
        subject: attempt.subject || null,
        topic: attempt.topic || null,
        skillIds: [skillId],
        artifactId: attempt.artifactId || null,
        artifactBlockId: attempt.artifactBlockId || null,
        confidence: delta >= 0 ? 0.3 : 0.5,
        observedAt: nowISO(),
      };

      const now = nowISO();
      const updatedSnapshot: SkillMasterySnapshot = {
        ...snapshot,
        confidenceScore: newConfidence,
        level: newLevel,
        evidenceCount: snapshot.evidenceCount + 1,
        attemptCount: snapshot.attemptCount + 1,
        correctCount: outcome === 'correct' ? snapshot.correctCount + 1 : snapshot.correctCount,
        partialCount: outcome === 'partially_correct' ? snapshot.partialCount + 1 : snapshot.partialCount,
        incorrectCount: outcome === 'incorrect' ? snapshot.incorrectCount + 1 : snapshot.incorrectCount,
        misconceptionCount: attempt.misconceptionSignals.length > 0
          ? snapshot.misconceptionCount + attempt.misconceptionSignals.length
          : snapshot.misconceptionCount,
        lastAttemptAt: now,
        lastCorrectAt: outcome === 'correct' ? now : snapshot.lastCorrectAt,
        lastIncorrectAt: outcome === 'incorrect' ? now : snapshot.lastIncorrectAt,
        evidence: [...snapshot.evidence, evidenceEntry].slice(-50),
        updatedAt: now,
      };

      masteryStore.set(snapshot.masteryId, updatedSnapshot);
      await this._upsertPrismaMastery(updatedSnapshot);
      updates.push(updatedSnapshot);
    }

    return updates;
  }

  /**
   * List mastery snapshots for the learner.
   */
  async listMasterySnapshots(
    identity: ResolvedTutorIdentity,
    options?: {
      subject?: string;
      topic?: string;
      skillId?: string;
      limit?: number;
    },
  ): Promise<SkillMasterySnapshot[]> {
    const limit = options?.limit || 50;

    const fromDb = await this._listPrismaMastery(identity, options);
    if (fromDb && fromDb.length > 0) return fromDb.slice(0, limit);

    // Fallback: in-memory
    const mk = memoryKey(identity.schoolId, identity.studentId);
    const ids = masteryLookupByKey.get(mk) || [];
    const results: SkillMasterySnapshot[] = [];

    for (const mid of ids) {
      const m = masteryStore.get(mid);
      if (!m) continue;
      if (m.status === 'soft_deleted') continue;
      if (options?.subject && m.subject !== options.subject) continue;
      if (options?.topic && m.topic !== options.topic) continue;
      if (options?.skillId && m.skillId !== options.skillId) continue;
      results.push(m);
    }

    results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return results.slice(0, limit);
  }

  /**
   * Update mastery snapshot with Task 011 aggregation result counts.
   * This is needed because patchMasterySnapshot only covers a subset of fields.
   */
  async updateCountsFromAggregation(
    identity: ResolvedTutorIdentity,
    masteryId: string,
    counts: {
      evidenceCount: number;
      attemptCount: number;
      correctCount: number;
      incorrectCount: number;
      level: string;
      confidenceScore: number;
      lastAttemptAt: string;
      lastCorrectAt: string | null;
      lastIncorrectAt: string | null;
    },
  ): Promise<SkillMasterySnapshot> {
    const snapshot = await this._getMasteryInternal(identity, masteryId);
    if (!snapshot) {
      throw new MasteryNotFoundError(masteryId);
    }

    const now = nowISO();
    const updated: SkillMasterySnapshot = {
      ...snapshot,
      evidenceCount: counts.evidenceCount,
      attemptCount: counts.attemptCount,
      correctCount: counts.correctCount,
      incorrectCount: counts.incorrectCount,
      level: counts.level as MasteryLevel,
      confidenceScore: counts.confidenceScore,
      lastAttemptAt: counts.lastAttemptAt,
      lastCorrectAt: counts.lastCorrectAt,
      lastIncorrectAt: counts.lastIncorrectAt,
      updatedAt: now,
    };

    masteryStore.set(masteryId, updated);
    await this._upsertPrismaMastery(updated);
    return updated;
  }

  /**
   * Patch safe fields on a mastery snapshot.
   */
  async patchMasterySnapshot(
    identity: ResolvedTutorIdentity,
    masteryId: string,
    patch: PatchMasteryRequest,
  ): Promise<SkillMasterySnapshot> {
    const snapshot = await this._getMasteryInternal(identity, masteryId);
    if (!snapshot) {
      throw new MasteryNotFoundError(masteryId);
    }

    const now = nowISO();
    const updated: SkillMasterySnapshot = {
      ...snapshot,
      status: patch.status || snapshot.status,
      level: patch.level || snapshot.level,
      confidenceScore: patch.confidenceScore !== undefined ? patch.confidenceScore : snapshot.confidenceScore,
      nextReviewAt: patch.nextReviewAt !== undefined ? patch.nextReviewAt : snapshot.nextReviewAt,
      reviewIntervalDays: patch.reviewIntervalDays !== undefined ? patch.reviewIntervalDays : snapshot.reviewIntervalDays,
      updatedAt: now,
    };

    masteryStore.set(masteryId, updated);
    await this._upsertPrismaMastery(updated);
    return updated;
  }

  /**
   * Soft-delete a mastery snapshot.
   */
  async softDeleteMasterySnapshot(
    identity: ResolvedTutorIdentity,
    masteryId: string,
    reason: string,
  ): Promise<SkillMasterySnapshot> {
    const snapshot = await this._getMasteryInternal(identity, masteryId);
    if (!snapshot) {
      throw new MasteryNotFoundError(masteryId);
    }

    const updated: SkillMasterySnapshot = {
      ...snapshot,
      status: 'soft_deleted',
      updatedAt: nowISO(),
    };

    masteryStore.set(masteryId, updated);
    await this._upsertPrismaMastery(updated);
    return updated;
  }

  /**
   * Internal: get mastery by ID with access check.
   */
  private async _getMasteryInternal(
    identity: ResolvedTutorIdentity,
    masteryId: string,
  ): Promise<SkillMasterySnapshot | null> {
    const mem = masteryStore.get(masteryId);
    if (mem) {
      if (mem.schoolId !== identity.schoolId || mem.studentId !== identity.studentId) return null;
      return mem;
    }
    return this._getPrismaMasteryById(identity, masteryId);
  }

  // ── Prisma helpers ──

  private async _persistPrismaMastery(snapshot: SkillMasterySnapshot): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    try {
      await (prisma as any).skillMasterySnapshot.create({
        data: {
          id: snapshot.masteryId,
          schoolId: snapshot.schoolId,
          studentId: snapshot.studentId,
          subject: snapshot.subject,
          topic: snapshot.topic,
          skillId: snapshot.skillId,
          skillLabel: snapshot.skillLabel,
          level: snapshot.level,
          status: snapshot.status,
          confidenceScore: snapshot.confidenceScore,
          evidenceCount: snapshot.evidenceCount,
          attemptCount: snapshot.attemptCount,
          correctCount: snapshot.correctCount,
          partialCount: snapshot.partialCount,
          incorrectCount: snapshot.incorrectCount,
          misconceptionCount: snapshot.misconceptionCount,
          lastAttemptAt: snapshot.lastAttemptAt ? new Date(snapshot.lastAttemptAt) : null,
          lastCorrectAt: snapshot.lastCorrectAt ? new Date(snapshot.lastCorrectAt) : null,
          lastIncorrectAt: snapshot.lastIncorrectAt ? new Date(snapshot.lastIncorrectAt) : null,
          nextReviewAt: snapshot.nextReviewAt ? new Date(snapshot.nextReviewAt) : null,
          reviewIntervalDays: snapshot.reviewIntervalDays,
          evidence: snapshot.evidence as any,
        },
      });
    } catch {
      // in-memory fallback
    }
  }

  private async _upsertPrismaMastery(snapshot: SkillMasterySnapshot): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    try {
      await (prisma as any).skillMasterySnapshot.upsert({
        where: {
          schoolId_studentId_subject_topic_skillId: {
            schoolId: snapshot.schoolId,
            studentId: snapshot.studentId,
            subject: snapshot.subject,
            topic: snapshot.topic,
            skillId: snapshot.skillId,
          },
        },
        create: {
          id: snapshot.masteryId,
          schoolId: snapshot.schoolId,
          studentId: snapshot.studentId,
          subject: snapshot.subject,
          topic: snapshot.topic,
          skillId: snapshot.skillId,
          skillLabel: snapshot.skillLabel,
          level: snapshot.level,
          status: snapshot.status,
          confidenceScore: snapshot.confidenceScore,
          evidenceCount: snapshot.evidenceCount,
          attemptCount: snapshot.attemptCount,
          correctCount: snapshot.correctCount,
          partialCount: snapshot.partialCount,
          incorrectCount: snapshot.incorrectCount,
          misconceptionCount: snapshot.misconceptionCount,
          lastAttemptAt: snapshot.lastAttemptAt ? new Date(snapshot.lastAttemptAt) : null,
          lastCorrectAt: snapshot.lastCorrectAt ? new Date(snapshot.lastCorrectAt) : null,
          lastIncorrectAt: snapshot.lastIncorrectAt ? new Date(snapshot.lastIncorrectAt) : null,
          nextReviewAt: snapshot.nextReviewAt ? new Date(snapshot.nextReviewAt) : null,
          reviewIntervalDays: snapshot.reviewIntervalDays,
          evidence: snapshot.evidence as any,
        },
        update: {
          level: snapshot.level,
          status: snapshot.status,
          confidenceScore: snapshot.confidenceScore,
          evidenceCount: snapshot.evidenceCount,
          attemptCount: snapshot.attemptCount,
          correctCount: snapshot.correctCount,
          partialCount: snapshot.partialCount,
          incorrectCount: snapshot.incorrectCount,
          misconceptionCount: snapshot.misconceptionCount,
          lastAttemptAt: snapshot.lastAttemptAt ? new Date(snapshot.lastAttemptAt) : null,
          lastCorrectAt: snapshot.lastCorrectAt ? new Date(snapshot.lastCorrectAt) : null,
          lastIncorrectAt: snapshot.lastIncorrectAt ? new Date(snapshot.lastIncorrectAt) : null,
          nextReviewAt: snapshot.nextReviewAt ? new Date(snapshot.nextReviewAt) : null,
          reviewIntervalDays: snapshot.reviewIntervalDays,
          evidence: snapshot.evidence as any,
        },
      });
    } catch {
      // in-memory fallback
    }
  }

  private async _getPrismaMastery(
    identity: ResolvedTutorIdentity,
    skillInput: { subject: string; topic: string; skillId: string },
  ): Promise<SkillMasterySnapshot | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const record = await (prisma as any).skillMasterySnapshot.findUnique({
        where: {
          schoolId_studentId_subject_topic_skillId: {
            schoolId: identity.schoolId,
            studentId: identity.studentId,
            subject: skillInput.subject,
            topic: skillInput.topic,
            skillId: skillInput.skillId,
          },
        },
      });
      if (!record) return null;
      return this._mapPrismaMastery(record);
    } catch {
      return null;
    }
  }

  private async _getPrismaMasteryById(
    identity: ResolvedTutorIdentity,
    masteryId: string,
  ): Promise<SkillMasterySnapshot | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const record = await (prisma as any).skillMasterySnapshot.findUnique({
        where: { id: masteryId },
      });
      if (!record) return null;
      if (record.schoolId !== identity.schoolId || record.studentId !== identity.studentId) return null;
      return this._mapPrismaMastery(record);
    } catch {
      return null;
    }
  }

  private async _listPrismaMastery(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string; topic?: string; skillId?: string; limit?: number },
  ): Promise<SkillMasterySnapshot[] | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const where: Record<string, any> = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        status: { not: 'soft_deleted' },
      };
      if (options?.subject) where.subject = options.subject;
      if (options?.topic) where.topic = options.topic;
      if (options?.skillId) where.skillId = options.skillId;

      const records = await (prisma as any).skillMasterySnapshot.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: options?.limit || 50,
      });
      if (!records || records.length === 0) return null;
      return records.map((r: any) => this._mapPrismaMastery(r));
    } catch {
      return null;
    }
  }

  private _mapPrismaMastery(record: any): SkillMasterySnapshot {
    return {
      masteryId: record.id,
      schoolId: record.schoolId,
      studentId: record.studentId,
      subject: record.subject,
      topic: record.topic,
      skillId: record.skillId,
      skillLabel: record.skillLabel || record.skillId,
      level: (record.level || 'not_started') as MasteryLevel,
      status: (record.status || 'active') as MasteryStatus,
      confidenceScore: typeof record.confidenceScore === 'number' ? record.confidenceScore : 0,
      evidenceCount: record.evidenceCount ?? 0,
      attemptCount: record.attemptCount ?? 0,
      correctCount: record.correctCount ?? 0,
      partialCount: record.partialCount ?? 0,
      incorrectCount: record.incorrectCount ?? 0,
      misconceptionCount: record.misconceptionCount ?? 0,
      lastAttemptAt: record.lastAttemptAt?.toISOString?.() || null,
      lastCorrectAt: record.lastCorrectAt?.toISOString?.() || null,
      lastIncorrectAt: record.lastIncorrectAt?.toISOString?.() || null,
      nextReviewAt: record.nextReviewAt?.toISOString?.() || null,
      reviewIntervalDays: record.reviewIntervalDays ?? null,
      evidence: Array.isArray(record.evidence) ? record.evidence : [],
      createdAt: record.createdAt?.toISOString?.() || nowISO(),
      updatedAt: record.updatedAt?.toISOString?.() || nowISO(),
    };
  }
}

export class MasteryNotFoundError extends Error {
  public code = 'MASTERY_NOT_FOUND';
  public statusCode = 404;
  constructor(masteryId: string) {
    super(`Mastery snapshot not found: ${masteryId}`);
    this.name = 'MasteryNotFoundError';
  }
}

// Singleton
export const masteryService = new MasteryService();

// For testing
export function _clearMasteryStoreForTest(): void {
  masteryStore.clear();
  masteryLookupByKey.clear();
  masteryLookupBySkill.clear();
}
