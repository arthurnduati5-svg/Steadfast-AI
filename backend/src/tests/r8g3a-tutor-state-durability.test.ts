import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// R8-G.3A Tutor Core — TutorState durability proof.
// Global vitest setup mocks ../lib/prisma as unavailable, so every
// Prisma probe fails: this exercises the fallback/fail-closed branches
// with zero real-database executions.
import {
  getTutorStateForLearner,
  upsertTutorStateForLearner,
  _clearMemoryStoreForTest,
} from '../services/tutorStateService';

const IDENTITY = { studentId: 'stu-r8g3a', schoolId: 'sch-r8g3a' } as any;

function baseState(): any {
  return {
    id: '',
    studentId: 'stu-r8g3a',
    schoolId: 'sch-r8g3a',
    sessionId: null,
    activeSubject: 'math',
    activeTopic: null,
    activeSkillIds: [],
    activeArtifactIds: [],
    activeVideoId: null,
    learningMode: 'learn',
    primaryLanguage: 'en',
    supportLanguage: null,
    stateQuality: 'resolved',
    evidence: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastResolvedAt: null,
    stateVersion: 1,
  };
}

describe('R8-G.3A tutor-state durability default', () => {
  beforeEach(() => {
    delete process.env.TUTORSTATE_REQUIRE_DURABLE;
    delete process.env.TUTORSTATE_ALLOW_MEMORY_FALLBACK;
    _clearMemoryStoreForTest();
  });

  afterEach(() => {
    delete process.env.TUTORSTATE_REQUIRE_DURABLE;
    delete process.env.TUTORSTATE_ALLOW_MEMORY_FALLBACK;
    _clearMemoryStoreForTest();
  });

  it('dev/test mode preserves explicit in-memory injection (no behavior break)', async () => {
    const saved = await upsertTutorStateForLearner(IDENTITY, baseState());
    expect(saved.activeSubject).toBe('math');
    const read = await getTutorStateForLearner(IDENTITY);
    expect(read.activeSubject).toBe('math');
  });

  it('strict mode fails closed on write when the database is unreachable', async () => {
    process.env.TUTORSTATE_REQUIRE_DURABLE = '1';
    await expect(upsertTutorStateForLearner(IDENTITY, baseState())).rejects.toThrow(
      /persistence failed/i,
    );
  });

  it('strict mode fails closed on read when the database is unreachable', async () => {
    process.env.TUTORSTATE_REQUIRE_DURABLE = '1';
    await expect(getTutorStateForLearner(IDENTITY)).rejects.toThrow(
      /persistence unavailable/i,
    );
  });

  it('strict mode never serves volatile memory as canonical truth', async () => {
    // Seed memory while injection is allowed, then go strict.
    await upsertTutorStateForLearner(IDENTITY, baseState());
    process.env.TUTORSTATE_REQUIRE_DURABLE = '1';
    await expect(getTutorStateForLearner(IDENTITY)).rejects.toThrow(
      /persistence unavailable/i,
    );
  });
});
