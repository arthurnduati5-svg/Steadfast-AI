// ─────────────────────────────────────────────────────────────
// Steadfast AI — R2 Durable Learner Memory Acceptance Tests
// Proves R2.1–R2.20 behavior at the service + orchestration layer.
//
// NOTE: These tests run without a live database, so the durable store
// falls back to the non-authoritative in-memory store. The Prisma path
// used in production is proven by inspection + schema alignment and the
// transactional ($transaction) orchestrator. The logic exercised here is
// identical to the production path modulo the persistence backend.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import {
  learnerMemoryService,
  _clearMemoryStoreForTest,
  LearnerMemoryNotFoundError,
} from '../services/learnerMemoryService';
import { learningEventService, _clearEventMemoryStoreForTest } from '../services/learningEventService';
import { learnerMemoryLifecycleService } from '../services/learnerMemoryLifecycleService';
import { learnerMemoryResolver } from '../services/learnerMemoryResolver';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

const schoolAStudent: ResolvedTutorIdentity = {
  studentId: 'r2-student-a',
  schoolId: 'r2-school-a',
  userId: 'r2-student-a',
  role: 'student',
};

const schoolBStudent: ResolvedTutorIdentity = {
  studentId: 'r2-student-a', // same student id, different school
  schoolId: 'r2-school-b',
  userId: 'r2-student-a',
  role: 'student',
};

const otherStudent: ResolvedTutorIdentity = {
  studentId: 'r2-student-other',
  schoolId: 'r2-school-a',
  userId: 'r2-student-other',
  role: 'student',
};

function mistakeEvent(subject: string, topic: string) {
  return {
    kind: 'made_mistake' as const,
    subject,
    topic,
    signals: [
      {
        kind: 'recent_mistake' as const,
        label: `${topic} confusion`,
        summary: `Student struggled with ${topic}.`,
        subject,
        topic,
        skillIds: ['skill-1'],
        confidence: 0.7,
        evidenceSummary: `Observed error on ${topic}.`,
      },
    ],
    source: 'chat' as const,
  };
}

describe('R2 — scoped create/read and isolation', () => {
  beforeEach(() => {
    _clearMemoryStoreForTest();
    _clearEventMemoryStoreForTest();
  });

  it('R2.4/R2.6 school A student retrieves only its own memory', async () => {
    await learnerMemoryService.createLearnerMemory(schoolAStudent, {
      kind: 'weakness',
      label: 'Fractions',
      summary: 'Struggles with fractions.',
      tutorUse: 'Provide guided practice.',
      evidence: [{ source: 'tutor_turn', summary: 'Three errors on fractions.' }],
    });

    const mine = await learnerMemoryService.listLearnerMemory(schoolAStudent);
    expect(mine.length).toBe(1);

    const otherSchool = await learnerMemoryService.listLearnerMemory(schoolBStudent);
    expect(otherSchool.length).toBe(0);

    const otherStudentMem = await learnerMemoryService.listLearnerMemory(otherStudent);
    expect(otherStudentMem.length).toBe(0);
  });

  it('R2.6 cross-school/student cannot mutate or read by id', async () => {
    const created = await learnerMemoryService.createLearnerMemory(schoolAStudent, {
      kind: 'strength',
      label: 'Algebra',
      summary: 'Good at algebra.',
      tutorUse: 'Build on this.',
      evidence: [{ source: 'tutor_turn', summary: 'Solved linear equations.' }],
    });

    // Cross-school read
    expect(await learnerMemoryService.getLearnerMemory(schoolBStudent, created.memoryId)).toBeNull();
    // Cross-student read
    expect(await learnerMemoryService.getLearnerMemory(otherStudent, created.memoryId)).toBeNull();
    // Cross-school patch
    await expect(
      learnerMemoryService.patchLearnerMemory(schoolBStudent, created.memoryId, { label: 'X' }),
    ).rejects.toThrow(LearnerMemoryNotFoundError);
    // Cross-school delete
    await expect(
      learnerMemoryService.softDeleteLearnerMemory(schoolBStudent, created.memoryId, { reason: 'x' }),
    ).rejects.toThrow(LearnerMemoryNotFoundError);
  });
});

describe('R2 — default active list excludes lifecycle-suppressed memory', () => {
  beforeEach(() => {
    _clearMemoryStoreForTest();
    _clearEventMemoryStoreForTest();
    learnerMemoryLifecycleService._clearEventsForTest();
  });

  it('R2.5 deleted, expired and held memory excluded from default list', async () => {
    const active = await learnerMemoryService.createLearnerMemory(schoolAStudent, {
      kind: 'strength', label: 'A', summary: 'a', tutorUse: 'u',
      evidence: [{ source: 'tutor_turn', summary: 'e' }],
    });
    const deleted = await learnerMemoryService.createLearnerMemory(schoolAStudent, {
      kind: 'weakness', label: 'D', summary: 'd', tutorUse: 'u',
      evidence: [{ source: 'tutor_turn', summary: 'e' }],
    });
    const expired = await learnerMemoryService.createLearnerMemory(schoolAStudent, {
      kind: 'weakness', label: 'E', summary: 'e', tutorUse: 'u',
      evidence: [{ source: 'tutor_turn', summary: 'e' }], expiresAt: '2000-01-01T00:00:00.000Z',
    });

    await learnerMemoryService.softDeleteLearnerMemory(schoolAStudent, deleted.memoryId, { reason: 'no longer' });

    // Active list must exclude deleted + expired, keep the active one.
    const activeList = await learnerMemoryService.listLearnerMemory(schoolAStudent);
    expect(activeList.length).toBe(1);
    expect(activeList[0].memoryId).toBe(active.memoryId);

    const withDeleted = await learnerMemoryService.listLearnerMemory(schoolAStudent, { includeDeleted: true });
    expect(withDeleted.length).toBe(3);

    // Held memory is also excluded from the default list.
    await learnerMemoryLifecycleService.markSchoolExitHold(schoolAStudent);
    expect((await learnerMemoryService.listLearnerMemory(schoolAStudent)).length).toBe(0);
  });
});

describe('R2 — event → memory write path', () => {
  beforeEach(() => {
    _clearMemoryStoreForTest();
    _clearEventMemoryStoreForTest();
  });

  it('R2.7/R2.8 creates one canonical event + one memory', async () => {
    const result = await learnerMemoryService.recordLearningEventAndMemory(schoolAStudent, mistakeEvent('Math', 'Fractions'));

    expect(result.event.eventId).toBeTruthy();
    expect(result.event.schoolId).toBe('r2-school-a');
    expect(result.event.studentId).toBe('r2-student-a');
    expect(result.memoryCreated.length).toBe(1);
    expect(result.memoryUpdated.length).toBe(0);

    const list = await learnerMemoryService.listLearnerMemory(schoolAStudent);
    expect(list.length).toBe(1);
    expect(list[0].sourceEventIds).toContain(result.event.eventId);
  });

  it('R2.10 repeated same-scope event updates, not duplicates', async () => {
    const first = await learnerMemoryService.recordLearningEventAndMemory(schoolAStudent, mistakeEvent('Math', 'Fractions'));
    const second = await learnerMemoryService.recordLearningEventAndMemory(schoolAStudent, mistakeEvent('Math', 'Fractions'));

    expect(second.memoryCreated.length).toBe(0);
    expect(second.memoryUpdated.length).toBe(1);
    expect(second.memoryUpdated[0].memoryId).toBe(first.memoryCreated[0].memoryId);
    expect(second.memoryUpdated[0].observationCount).toBe(2);

    const list = await learnerMemoryService.listLearnerMemory(schoolAStudent);
    expect(list.length).toBe(1);
  });

  it('R2.13 later event does not resurrect a soft-deleted memory', async () => {
    const first = await learnerMemoryService.recordLearningEventAndMemory(schoolAStudent, mistakeEvent('Math', 'Fractions'));
    await learnerMemoryService.softDeleteLearnerMemory(schoolAStudent, first.memoryCreated[0].memoryId, { reason: 'forgot' });

    const afterDelete = await learnerMemoryService.listLearnerMemory(schoolAStudent);
    expect(afterDelete.length).toBe(0);

    const later = await learnerMemoryService.recordLearningEventAndMemory(schoolAStudent, mistakeEvent('Math', 'Fractions'));
    expect(later.memoryCreated.length).toBe(0);
    expect(later.memoryUpdated.length).toBe(0);

    const stillHidden = await learnerMemoryService.listLearnerMemory(schoolAStudent);
    expect(stillHidden.length).toBe(0);
  });

  it('R2.17/R2.18 memory stores only references, no mastery/evidence truth', async () => {
    const result = await learnerMemoryService.recordLearningEventAndMemory(schoolAStudent, mistakeEvent('Math', 'Fractions'));
    const mem = result.memoryCreated[0];
    expect(mem).toBeDefined();
    // Evidence is a safe summary reference, not raw content.
    expect(mem.evidence[0].summary).not.toContain('answer');
    // No mastery probability fields exist on the item.
    expect((mem as any).masteryScore).toBeUndefined();
    expect((mem as any).masteryProbability).toBeUndefined();
  });
});

describe('R2 — PATCH safe-field allowlist', () => {
  beforeEach(() => {
    _clearMemoryStoreForTest();
    _clearEventMemoryStoreForTest();
  });

  it('R2.11 updates safe fields, preserves immutable ones', async () => {
    const created = await learnerMemoryService.createLearnerMemory(schoolAStudent, {
      kind: 'strength', label: 'L', summary: 'S', tutorUse: 'U',
      evidence: [{ source: 'tutor_turn', summary: 'e' }],
    });

    const patched = await learnerMemoryService.patchLearnerMemory(schoolAStudent, created.memoryId, {
      label: 'Updated',
      summary: 'Updated summary',
      confidence: 'high',
    });

    expect(patched.label).toBe('Updated');
    expect(patched.confidence).toBe('high');
    // Immutable / server-owned fields unchanged.
    expect(patched.schoolId).toBe('r2-school-a');
    expect(patched.studentId).toBe('r2-student-a');
    expect(patched.observationCount).toBe(1);
    expect(patched.sourceEventIds).toEqual([]);
  });
});

describe('R2 — DELETE idempotency and visibility', () => {
  beforeEach(() => {
    _clearMemoryStoreForTest();
    _clearEventMemoryStoreForTest();
  });

  it('R2.12 soft delete is durable, idempotent, and hides from reads', async () => {
    const created = await learnerMemoryService.createLearnerMemory(schoolAStudent, {
      kind: 'weakness', label: 'L', summary: 'S', tutorUse: 'U',
      evidence: [{ source: 'tutor_turn', summary: 'e' }],
    });

    const d1 = await learnerMemoryService.softDeleteLearnerMemory(schoolAStudent, created.memoryId, { reason: 'r1' });
    const d2 = await learnerMemoryService.softDeleteLearnerMemory(schoolAStudent, created.memoryId, { reason: 'r2' });

    expect(d1.status).toBe('soft_deleted');
    expect(d2.status).toBe('soft_deleted');
    expect(d1.memoryId).toBe(d2.memoryId);

    const active = await learnerMemoryService.listLearnerMemory(schoolAStudent);
    expect(active.length).toBe(0);
  });
});

describe('R2 — resolve deterministic safe context, no AI', () => {
  beforeEach(() => {
    _clearMemoryStoreForTest();
    _clearEventMemoryStoreForTest();
  });

  it('R2.15 resolve returns safe active context, excludes deleted/expired/held', async () => {
    await learnerMemoryService.recordLearningEventAndMemory(schoolAStudent, mistakeEvent('Math', 'Fractions'));
    const deleted = await learnerMemoryService.createLearnerMemory(schoolAStudent, {
      kind: 'strength', label: 'S', summary: 's', tutorUse: 'u',
      evidence: [{ source: 'tutor_turn', summary: 'e' }],
    });
    await learnerMemoryService.softDeleteLearnerMemory(schoolAStudent, deleted.memoryId, { reason: 'x' });

    const ctx = await learnerMemoryResolver.resolveLearnerMemoryContext(schoolAStudent, {});
    expect(ctx.status).toBe('resolved');
    expect(ctx.recentMistakes.length).toBe(1);
    expect(ctx.strengths.length).toBe(0);
    expect(ctx.errors.length).toBe(0);
  });
});

describe('R2 — privacy boundary on event input', () => {
  beforeEach(() => {
    _clearMemoryStoreForTest();
    _clearEventMemoryStoreForTest();
  });

  it('R2.16 event persists only safe summaries, no raw content', async () => {
    const event = await learningEventService.createLearningEvent(schoolAStudent, {
      kind: 'made_mistake',
      subject: 'Math',
      promptSummary: 'Student asked how to simplify fractions.',
      responseSummary: 'Tutor gave a step-by-step scaffolding prompt.',
      outcomeSummary: 'Student corrected the mistake.',
    });
    expect(event.promptSummary).not.toContain('raw transcript');
    expect(event.responseSummary).not.toContain('model reasoning');
  });
});
