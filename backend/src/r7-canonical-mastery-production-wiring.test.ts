// R7.2 — canonical mastery production wiring (DB-free).
// Proves Revision / Practice / Daily Objectives apply through the shared
// canonicalMasteryRepository with awaited async semantics and preserved
// evidence identity, and that Learning Intelligence reads the same owner.
// No PostgreSQL, no migrations, no schema access.

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

process.env.R4_USE_PRISMA = 'true';

vi.mock('./lib/prisma', () => ({
  default: {
    $queryRawUnsafe: async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('CurriculumVersionRecord')) return [{ id: 'cv1' }];
      if (typeof sql === 'string' && sql.includes('CurriculumTopicRecord')) {
        return [{ id: 'topic1', topic: 'Fractions', subject: 'Math', curriculumVersionId: 'cv1' }];
      }
      if (typeof sql === 'string' && sql.includes('CurriculumSkillRecord')) {
        return [{ id: 'skill1', skill: 'Addition', curriculumVersionId: 'cv1' }];
      }
      if (typeof sql === 'string' && sql.includes('LearningEvidenceCommittedProjection')) return [];
      if (typeof sql === 'string' && sql.includes('PracticeAttempt')) return [];
      return [];
    },
  },
}));

vi.mock('./services/probabilisticMasteryRepository', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./services/probabilisticMasteryRepository')>();
  return { ...actual, canonicalMasteryRepository: new actual.InMemoryMasteryRepository() };
});

import { canonicalMasteryRepository } from './services/probabilisticMasteryRepository';
import {
  applyRevisionEvidenceToCanonicalMastery,
  revisionMasteryRepository,
  __setForceMasteryFailure,
} from './services/revisionCanonicalLearningService';
import { applyPracticeEvidenceToCanonicalMastery } from './services/practiceMasteryCanonicalApply';
import { phase3ObjectiveMasteryService } from './services/phase3ObjectiveMasteryService';
import { getLearningIntelligenceSnapshot } from './services/learningIntelligenceIntegrationService';

function serviceSource(name: string): string {
  const candidates = [
    join(process.cwd(), 'src', 'services', name),
    join(process.cwd(), 'backend', 'src', 'services', name),
  ];
  for (const p of candidates) {
    try {
      return readFileSync(p, 'utf8');
    } catch {
      continue;
    }
  }
  throw new Error(`service source not found: ${name}`);
}

beforeAll(() => {
  __setForceMasteryFailure(false);
});

describe('R7.2 canonical mastery production wiring', () => {
  it('T1 — Revision awaits canonical Mastery via the shared repository', async () => {
    expect(revisionMasteryRepository).toBe(canonicalMasteryRepository);
    const res = await applyRevisionEvidenceToCanonicalMastery({
      schoolId: 'school-t1',
      learnerId: 'learner-t1',
      committedEvidenceId: 'ev-rev-t1',
      targetNodeId: 'skill1',
      targetNodeType: 'skill',
      curriculumVersionId: 'cv1',
      outcome: 1,
      usable: true,
      markingConfidence: 0.9,
      integrityRisk: 0.1,
      independence: 0.9,
      hintDependency: 0.1,
      sourceType: 'revision_recall',
    });
    expect(res.applied).toBe(true);
    // Visible immediately after return: the write was awaited, not fire-and-forget.
    const state = await canonicalMasteryRepository.readState({
      schoolId: 'school-t1',
      learnerId: 'learner-t1',
      targetNodeId: 'skill1',
      targetNodeType: 'skill',
      curriculumVersionId: 'cv1',
    });
    expect(state).not.toBeNull();
    expect(state!.evidenceCount).toBe(1);
  });

  it('T2 — Revision preserves evidence identity + idempotent duplicate', async () => {
    expect(await canonicalMasteryRepository.hasEvidenceBeenApplied('ev-rev-t1')).toBe(true);
    const dup = await applyRevisionEvidenceToCanonicalMastery({
      schoolId: 'school-t1',
      learnerId: 'learner-t1',
      committedEvidenceId: 'ev-rev-t1',
      targetNodeId: 'skill1',
      targetNodeType: 'skill',
      curriculumVersionId: 'cv1',
      outcome: 1,
      usable: true,
      markingConfidence: 0.9,
      integrityRisk: 0.1,
      independence: 0.9,
      hintDependency: 0.1,
      sourceType: 'revision_recall',
    });
    expect(dup.applied).toBe(false);
    const state = await canonicalMasteryRepository.readState({
      schoolId: 'school-t1',
      learnerId: 'learner-t1',
      targetNodeId: 'skill1',
      targetNodeType: 'skill',
      curriculumVersionId: 'cv1',
    });
    expect(state!.evidenceCount).toBe(1);
  });

  it('T3/T4 — Practice awaits canonical Mastery and preserves evidence identity', async () => {
    const res = await applyPracticeEvidenceToCanonicalMastery({
      schoolId: 'school-t3',
      learnerId: 'learner-t3',
      committedEvidenceId: 'ev-prac-t3',
      targetNodeId: 'skill1',
      targetNodeType: 'skill',
      curriculumVersionId: 'cv1',
      outcome: 1,
      usable: true,
      markingConfidence: 0.9,
      integrityRisk: 0.1,
      independence: 0.9,
      hintDependency: 0.1,
      sourceType: 'practice_attempt',
    });
    expect(res.applied).toBe(true);
    expect(await canonicalMasteryRepository.hasEvidenceBeenApplied('ev-prac-t3')).toBe(true);
    const state = await canonicalMasteryRepository.readState({
      schoolId: 'school-t3',
      learnerId: 'learner-t3',
      targetNodeId: 'skill1',
      targetNodeType: 'skill',
      curriculumVersionId: 'cv1',
    });
    expect(state).not.toBeNull();
    expect(state!.evidenceCount).toBe(1);
  });

  it('T5 — Daily Objectives use the shared repository (no production InMemory owner)', async () => {
    expect(phase3ObjectiveMasteryService.getCanonicalRepositoryForTests()).toBe(
      canonicalMasteryRepository,
    );
    for (const f of [
      'revisionCanonicalLearningService.ts',
      'practiceMasteryCanonicalApply.ts',
      'phase3ObjectiveMasteryService.ts',
      'learningIntelligenceIntegrationService.ts',
    ]) {
      expect(serviceSource(f)).not.toContain('new InMemoryMasteryRepository');
      expect(serviceSource(f)).not.toContain('new PrismaMasteryRepository');
    }
  });

  it('T6 — Daily Objective source preserved and application awaited', async () => {
    expect(serviceSource('phase3ObjectiveMasteryService.ts')).toContain(
      "sourceType: 'daily_objective_check'",
    );
    const result = await phase3ObjectiveMasteryService.updateObjectiveMasteryFromEvidence({
      objectiveId: 'obj-t6',
      schoolId: 'school-t6',
      learnerId: 'learner-t6',
      topicId: 'topic1',
      evidenceStrength: 'strong',
      hintUsed: false,
      reasonCodes: ['strong_recent_evidence'],
      evidenceId: 'ev-obj-t6',
    });
    expect(await canonicalMasteryRepository.hasEvidenceBeenApplied('ev-obj-t6')).toBe(true);
    expect(typeof result.newStatus).toBe('string');
  });

  it('T7 — Learning Intelligence awaits durable repository read', async () => {
    await applyPracticeEvidenceToCanonicalMastery({
      schoolId: 'school-t7',
      learnerId: 'learner-t7',
      committedEvidenceId: 'ev-prac-t7',
      targetNodeId: 'skill1',
      targetNodeType: 'skill',
      curriculumVersionId: 'cv1',
      outcome: 1,
      usable: true,
      markingConfidence: 0.9,
      integrityRisk: 0.1,
      independence: 0.9,
      hintDependency: 0.1,
      sourceType: 'practice_attempt',
    });
    const snap = await getLearningIntelligenceSnapshot({
      learnerId: 'learner-t7',
      schoolId: 'school-t7',
      subject: 'Math',
    });
    expect(snap.mastery.available).toBe(true);
    expect(snap.mastery.states.length).toBeGreaterThan(0);
    expect(snap.mastery.states[0]!.targetNodeId).toBe('skill1');
  });

  it('T8 — repository failure does not become success (fail closed)', async () => {
    __setForceMasteryFailure(true);
    try {
      await expect(
        applyRevisionEvidenceToCanonicalMastery({
          schoolId: 'school-t8',
          learnerId: 'learner-t8',
          committedEvidenceId: 'ev-rev-t8',
          targetNodeId: 'skill1',
          targetNodeType: 'skill',
          curriculumVersionId: 'cv1',
          outcome: 1,
          usable: true,
          markingConfidence: 0.9,
          integrityRisk: 0.1,
          independence: 0.9,
          hintDependency: 0.1,
          sourceType: 'revision_recall',
        }),
      ).rejects.toThrow();
    } finally {
      __setForceMasteryFailure(false);
    }
    // No fake mastered state manufactured, no idempotency receipt claimed.
    expect(await canonicalMasteryRepository.hasEvidenceBeenApplied('ev-rev-t8')).toBe(false);
    const state = await canonicalMasteryRepository.readState({
      schoolId: 'school-t8',
      learnerId: 'learner-t8',
      targetNodeId: 'skill1',
      targetNodeType: 'skill',
      curriculumVersionId: 'cv1',
    });
    expect(state).toBeNull();
  });
});
