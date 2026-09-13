// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learner Memory Lifecycle Service v1
// Owns school membership exit/rejoin behavior, batch lifecycle
// operations, and explicit lifecycle state transitions.
// ─────────────────────────────────────────────────────────────

import type {
  LearnerMemoryItem,
  LearnerMemoryStatus,
  LearnerMemoryKind,
} from './learnerMemoryContracts';
import { learnerMemoryService } from './learnerMemoryService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Lifecycle Event Types ──

export interface MemoryLifecycleEvent {
  eventId: string;
  kind: 'exit_school' | 'rejoin_school' | 'bulk_soft_delete' | 'bulk_archive' | 'bulk_block' | 'memory_expired';
  schoolId: string;
  studentId: string;
  memoryIds: string[];
  previousStatus: string;
  newStatus: string;
  reason: string;
  createdAt: string;
}

let lifecycleEventCounter = 0;
function generateLifecycleId(): string {
  lifecycleEventCounter += 1;
  return `lce_${Date.now()}_${lifecycleEventCounter}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ── LearnerMemoryLifecycleService ──

export class LearnerMemoryLifecycleService {
  private events: MemoryLifecycleEvent[] = [];

  /**
   * Get recent lifecycle events for a student.
   */
  getLifecycleEventsForStudent(schoolId: string, studentId: string, limit = 20): MemoryLifecycleEvent[] {
    return this.events
      .filter((e) => e.schoolId === schoolId && e.studentId === studentId)
      .slice(-limit);
  }

  /**
   * When a student exits a school:
   * 1. Active school-scoped memory becomes school_exited_hold.
   * 2. It must not influence future active tutoring in that school.
   * 3. It must not appear in learner-visible memory for that school.
   * 4. Returns count of affected memory items.
   */
  async markSchoolExitHold(
    identity: ResolvedTutorIdentity,
    reason = 'Student exited school.',
  ): Promise<{ count: number; memoryIds: string[] }> {
    const memoryIds: string[] = [];
    const allMemory = await learnerMemoryService.listLearnerMemory(identity, {
      limit: 200,
      includeDeleted: false,
    });

    for (const mem of allMemory) {
      if (mem.status !== ('active' as LearnerMemoryStatus)) continue;
      if (mem.status === ('school_exited_hold' as LearnerMemoryStatus)) continue;
      if (mem.status === ('soft_deleted' as LearnerMemoryStatus)) continue;

      try {
        await learnerMemoryService.patchLearnerMemory(identity, mem.memoryId, {
          status: 'school_exited_hold' as LearnerMemoryStatus,
        });
        memoryIds.push(mem.memoryId);
      } catch {
        // Skip individual failures — continue
      }
    }

    this._recordEvent({
      kind: 'exit_school',
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      memoryIds,
      previousStatus: 'active',
      newStatus: 'school_exited_hold',
      reason,
    });

    return { count: memoryIds.length, memoryIds };
  }

  /**
   * When a student rejoins the same school:
   * 1. Held memory must not auto-restore silently unless policy allows.
   * 2. Restore is explicit through this service.
   * 3. Restored memory preserves audit metadata.
   * 4. Old memory may be downgraded to medium confidence.
   */
  async restoreAfterSchoolRejoin(
    identity: ResolvedTutorIdentity,
    options?: {
      restoreAll?: boolean;
      restoreRecentDays?: number;
      restoreKinds?: LearnerMemoryKind[];
      reason?: string;
    },
  ): Promise<{ count: number; memoryIds: string[] }> {
    const memoryIds: string[] = [];
    const reason = options?.reason || 'Student rejoined school — explicit memory restoration.';
    const recently = options?.restoreRecentDays
      ? new Date(Date.now() - options.restoreRecentDays * 86400000).toISOString()
      : null;

    const allMemory = await learnerMemoryService.listLearnerMemory(identity, {
      limit: 200,
      includeDeleted: true, // Include held memory that's hidden from normal list
    });

    // Note: school_exited_hold memory won't appear in normal listLearnerMemory calls
    // because it filters by `notIn: ['soft_deleted', 'expired']`. We handle this
    // by making the lifecycle service work directly with the raw store.
    // For Prisma-based access, we query directly.

    const eligibleMemory = allMemory.filter(
      (mem) => mem.status === 'school_exited_hold',
    );

    for (const mem of eligibleMemory) {
      if (options?.restoreKinds && !options.restoreKinds.includes(mem.kind)) continue;
      if (recently && mem.lastObservedAt < recently) continue;
      if (!options?.restoreAll && recently === null) {
        // By default, only restore memory from the last 90 days
        const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
        if (mem.lastObservedAt < ninetyDaysAgo) continue;
      }

      try {
        await learnerMemoryService.patchLearnerMemory(identity, mem.memoryId, {
          status: 'active',
          confidence: 'medium', // Downgrade to medium on rejoin
        });
        memoryIds.push(mem.memoryId);
      } catch {
        // Skip individual failures
      }
    }

    this._recordEvent({
      kind: 'rejoin_school',
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      memoryIds,
      previousStatus: 'school_exited_hold',
      newStatus: 'active',
      reason,
    });

    return { count: memoryIds.length, memoryIds };
  }

  /**
   * Soft-delete all memory for a student/school scope.
   * Called when a student is removed from a school.
   */
  async softDeleteMemoryForSchool(
    identity: ResolvedTutorIdentity,
    reason = 'Student removed from school.',
  ): Promise<{ count: number; memoryIds: string[] }> {
    const memoryIds: string[] = [];
    const allMemory = await learnerMemoryService.listLearnerMemory(identity, {
      limit: 200,
      includeDeleted: false,
    });

    for (const mem of allMemory) {
      if (mem.status === 'soft_deleted') continue;

      try {
        await learnerMemoryService.patchLearnerMemory(identity, mem.memoryId, {
          status: 'soft_deleted' as any,
        });
        memoryIds.push(mem.memoryId);
      } catch {
        // Skip individual failures
      }
    }

    this._recordEvent({
      kind: 'bulk_soft_delete',
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      memoryIds,
      previousStatus: 'active',
      newStatus: 'soft_deleted',
      reason,
    });

    return { count: memoryIds.length, memoryIds };
  }

  /**
   * Archive old/superseded memory.
   */
  async archiveOldMemory(
    identity: ResolvedTutorIdentity,
    options?: {
      olderThanDays?: number;
      memoryIds?: string[];
      reason?: string;
    },
  ): Promise<{ count: number; memoryIds: string[] }> {
    const memoryIds: string[] = [];
    const olderThan = options?.olderThanDays ?? 180;
    const cutoff = new Date(Date.now() - olderThan * 86400000).toISOString();
    const reason = options?.reason || 'Memory superseded by newer observations.';

    const allMemory = await learnerMemoryService.listLearnerMemory(identity, {
      limit: 200,
      includeDeleted: false,
    });

    const targetMemory = options?.memoryIds
      ? allMemory.filter((m) => options.memoryIds!.includes(m.memoryId))
      : allMemory.filter((m) => m.lastObservedAt <= cutoff && m.status === 'active');

    for (const mem of targetMemory) {
      if (mem.status === 'archived' || mem.status === 'soft_deleted') continue;

      try {
        await learnerMemoryService.patchLearnerMemory(identity, mem.memoryId, {
          status: 'archived' as LearnerMemoryStatus,
        });
        memoryIds.push(mem.memoryId);
      } catch {
        // Skip individual failures
      }
    }

    this._recordEvent({
      kind: 'bulk_archive',
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      memoryIds,
      previousStatus: 'active',
      newStatus: 'archived',
      reason,
    });

    return { count: memoryIds.length, memoryIds };
  }

  /**
   * Block unsafe memory.
   */
  async blockMemory(
    identity: ResolvedTutorIdentity,
    memoryIds: string[],
    reason = 'Memory contains unsafe content.',
  ): Promise<{ count: number }> {
    let count = 0;
    for (const memoryId of memoryIds) {
      try {
        await learnerMemoryService.patchLearnerMemory(identity, memoryId, {
          status: 'blocked' as LearnerMemoryStatus,
        });
        count += 1;
      } catch {
        // Skip individual failures
      }
    }

    this._recordEvent({
      kind: 'bulk_block',
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      memoryIds,
      previousStatus: 'active',
      newStatus: 'blocked',
      reason,
    });

    return { count };
  }

  // ── Private helpers ──

  private _recordEvent(input: {
    kind: MemoryLifecycleEvent['kind'];
    schoolId: string;
    studentId: string;
    memoryIds: string[];
    previousStatus: string;
    newStatus: string;
    reason: string;
  }): void {
    const event: MemoryLifecycleEvent = {
      eventId: generateLifecycleId(),
      ...input,
      createdAt: nowISO(),
    };
    this.events.push(event);
  }

  /**
   * Clear lifecycle events (for testing).
   */
  _clearEventsForTest(): void {
    this.events = [];
  }
}

// Singleton
export const learnerMemoryLifecycleService = new LearnerMemoryLifecycleService();
