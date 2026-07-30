import type {
  MasteryActorContext,
  MasteryTarget,
  NormalizedMasteryEvidence,
  MasteryPolicyConfig,
} from './probabilisticMasteryContracts';

export const FIXTURE_SCHOOL_A = 'fixture-school-alpha';
export const FIXTURE_SCHOOL_B = 'fixture-school-beta';
export const FIXTURE_LEARNER_1 = 'fixture-learner-001';
export const FIXTURE_LEARNER_2 = 'fixture-learner-002';
export const FIXTURE_TARGET_SKILL_A = 'fixture-skill-linear-equations';
export const FIXTURE_TARGET_SKILL_B = 'fixture-skill-quadratic-functions';
export const FIXTURE_CURRICULUM_VERSION = 'fixture-curr-v1';
export const FIXTURE_TARGET_TYPE = 'skill' as const;
export const FIXTURE_SOURCE = 'manual_seed_fixture';

function ts(dateStr: string): Date {
  return new Date(dateStr);
}

export function createActor(schoolId: string, role: 'student' | 'teacher' | 'school_admin' | 'internal_operator' | 'parent' | 'unknown' = 'teacher'): MasteryActorContext {
  return {
    schoolId,
    actorId: `fixture-actor-${schoolId}`,
    actorRole: role,
    learnerId: role === 'teacher' || role === 'student' ? FIXTURE_LEARNER_1 : undefined,
    requestId: 'fixture-request',
    correlationId: 'fixture-correlation',
  };
}

export function createTarget(
  schoolId: string,
  learnerId: string = FIXTURE_LEARNER_1,
  targetNodeId: string = FIXTURE_TARGET_SKILL_A,
): MasteryTarget {
  return {
    schoolId,
    learnerId,
    targetNodeId,
    targetNodeType: FIXTURE_TARGET_TYPE,
    curriculumVersionId: FIXTURE_CURRICULUM_VERSION,
  };
}

export function createEvidence(
  overrides: Partial<NormalizedMasteryEvidence> & { evidenceId: string },
): NormalizedMasteryEvidence {
  return {
    evidenceId: overrides.evidenceId,
    schoolId: overrides.schoolId ?? FIXTURE_SCHOOL_A,
    learnerId: overrides.learnerId ?? FIXTURE_LEARNER_1,
    targetNodeId: overrides.targetNodeId ?? FIXTURE_TARGET_SKILL_A,
    targetNodeType: overrides.targetNodeType ?? FIXTURE_TARGET_TYPE,
    curriculumVersionId: overrides.curriculumVersionId ?? FIXTURE_CURRICULUM_VERSION,
    sourceType: overrides.sourceType ?? FIXTURE_SOURCE,
    outcome: overrides.outcome ?? 1,
    usable: overrides.usable ?? true,
    markingConfidence: overrides.markingConfidence ?? 1,
    integrityRisk: overrides.integrityRisk ?? 0,
    independence: overrides.independence ?? 1,
    hintDependency: overrides.hintDependency ?? 0,
    explanationQuality: overrides.explanationQuality ?? null,
    misconceptionTags: overrides.misconceptionTags ?? [],
    transferSignal: overrides.transferSignal ?? null,
    retentionSignal: overrides.retentionSignal ?? null,
    occurredAt: overrides.occurredAt ?? ts('2026-01-15T10:00:00Z'),
    committedAt: overrides.committedAt ?? ts('2026-01-15T10:00:00Z'),
    policyVersion: overrides.policyVersion ?? 'fixture-policy-v1',
    supersedes: overrides.supersedes ?? null,
  };
}

export function allFixtures(policy: MasteryPolicyConfig): {
  actorA: MasteryActorContext;
  actorB: MasteryActorContext;
  teacherActorA: MasteryActorContext;
  teacherActorB: MasteryActorContext;
  schoolAdminActorA: MasteryActorContext;
  targetA1: MasteryTarget;
  targetA2: MasteryTarget;
  targetB1: MasteryTarget;
  evidence: Record<string, NormalizedMasteryEvidence>;
} {
  const actorA = createActor(FIXTURE_SCHOOL_A);
  const actorB = createActor(FIXTURE_SCHOOL_B);
  const teacherActorA = createActor(FIXTURE_SCHOOL_A, 'teacher');
  const teacherActorB = createActor(FIXTURE_SCHOOL_B, 'teacher');
  const schoolAdminActorA = createActor(FIXTURE_SCHOOL_A, 'school_admin');
  const targetA1 = createTarget(FIXTURE_SCHOOL_A, FIXTURE_LEARNER_1, FIXTURE_TARGET_SKILL_A);
  const targetA2 = createTarget(FIXTURE_SCHOOL_A, FIXTURE_LEARNER_1, FIXTURE_TARGET_SKILL_B);
  const targetB1 = createTarget(FIXTURE_SCHOOL_B, FIXTURE_LEARNER_1, FIXTURE_TARGET_SKILL_A);

  return {
    actorA,
    actorB,
    teacherActorA,
    teacherActorB,
    schoolAdminActorA,
    targetA1,
    targetA2,
    targetB1,
    evidence: {
      noEvidence: createEvidence({ evidenceId: 'no-op' }),
      correct1: createEvidence({ evidenceId: 'fixture-correct-1', outcome: 1, occurredAt: ts('2026-01-15T10:00:00Z'), committedAt: ts('2026-01-15T10:00:00Z') }),
      correct2: createEvidence({ evidenceId: 'fixture-correct-2', outcome: 1, occurredAt: ts('2026-01-16T10:00:00Z'), committedAt: ts('2026-01-16T10:00:00Z') }),
      correct3: createEvidence({ evidenceId: 'fixture-correct-3', outcome: 1, occurredAt: ts('2026-01-17T10:00:00Z'), committedAt: ts('2026-01-17T10:00:00Z') }),
      correct4: createEvidence({ evidenceId: 'fixture-correct-4', outcome: 1, occurredAt: ts('2026-01-18T10:00:00Z'), committedAt: ts('2026-01-18T10:00:00Z') }),
      correct5: createEvidence({ evidenceId: 'fixture-correct-5', outcome: 1, occurredAt: ts('2026-01-19T10:00:00Z'), committedAt: ts('2026-01-19T10:00:00Z') }),
      heavyHintCorrect: createEvidence({
        evidenceId: 'fixture-heavy-hint-correct',
        outcome: 1, hintDependency: 0.9, independence: 0.1,
        occurredAt: ts('2026-01-20T10:00:00Z'), committedAt: ts('2026-01-20T10:00:00Z'),
      }),
      teachBackCorrect: createEvidence({
        evidenceId: 'fixture-teachback-correct',
        outcome: 1, sourceType: 'teach_back', explanationQuality: 'strong', independence: 1,
        occurredAt: ts('2026-01-21T10:00:00Z'), committedAt: ts('2026-01-21T10:00:00Z'),
      }),
      misconceptionEvidence: createEvidence({
        evidenceId: 'fixture-misconception-1',
        outcome: -1, misconceptionTags: ['confuses_variable_and_constant'],
        occurredAt: ts('2026-01-22T10:00:00Z'), committedAt: ts('2026-01-22T10:00:00Z'),
      }),
      highConfidenceIncorrect: createEvidence({
        evidenceId: 'fixture-high-conf-incorrect',
        outcome: -1, markingConfidence: 0.9, independence: 1,
        occurredAt: ts('2026-01-23T10:00:00Z'), committedAt: ts('2026-01-23T10:00:00Z'),
      }),
      lowConfidenceMarking: createEvidence({
        evidenceId: 'fixture-low-conf-mark',
        outcome: 1, markingConfidence: 0.3,
        occurredAt: ts('2026-01-24T10:00:00Z'), committedAt: ts('2026-01-24T10:00:00Z'),
      }),
      highIntegrityRisk: createEvidence({
        evidenceId: 'fixture-high-integrity-risk',
        outcome: 1, integrityRisk: 0.9,
        occurredAt: ts('2026-01-25T10:00:00Z'), committedAt: ts('2026-01-25T10:00:00Z'),
      }),
      retentionEvidence: createEvidence({
        evidenceId: 'fixture-retention-1',
        outcome: 1, retentionSignal: 0.9, sourceType: 'revision_recall',
        occurredAt: ts('2026-02-01T10:00:00Z'), committedAt: ts('2026-02-01T10:00:00Z'),
      }),
      transferEvidence: createEvidence({
        evidenceId: 'fixture-transfer-1',
        outcome: 1, transferSignal: 0.85, sourceType: 'assessment_result',
        occurredAt: ts('2026-02-05T10:00:00Z'), committedAt: ts('2026-02-05T10:00:00Z'),
      }),
      conflictingIncorrect: createEvidence({
        evidenceId: 'fixture-conflict-incorrect',
        outcome: -1,
        occurredAt: ts('2026-02-10T10:00:00Z'), committedAt: ts('2026-02-10T10:00:00Z'),
      }),
      duplicateCorrect: createEvidence({ evidenceId: 'fixture-correct-1', outcome: 1 }),
      supersededEvidence: createEvidence({
        evidenceId: 'fixture-superseded-1',
        outcome: 1, supersedes: null,
        occurredAt: ts('2026-01-14T10:00:00Z'), committedAt: ts('2026-01-14T10:00:00Z'),
      }),
      supersedingEvidence: createEvidence({
        evidenceId: 'fixture-superseding-1',
        outcome: 1, supersedes: 'fixture-superseded-1',
        occurredAt: ts('2026-01-15T10:00:00Z'), committedAt: ts('2026-01-15T10:00:00Z'),
      }),
      decayedEvidence: createEvidence({
        evidenceId: 'fixture-decayed-1',
        outcome: 1, occurredAt: ts('2025-01-01T10:00:00Z'), committedAt: ts('2025-01-01T10:00:00Z'),
      }),
      repeatedMiss1: createEvidence({
        evidenceId: 'fixture-miss-1',
        outcome: -1, occurredAt: ts('2026-03-01T10:00:00Z'), committedAt: ts('2026-03-01T10:00:00Z'),
      }),
      repeatedMiss2: createEvidence({
        evidenceId: 'fixture-miss-2',
        outcome: -1, occurredAt: ts('2026-03-02T10:00:00Z'), committedAt: ts('2026-03-02T10:00:00Z'),
      }),
      repeatedMiss3: createEvidence({
        evidenceId: 'fixture-miss-3',
        outcome: -1, occurredAt: ts('2026-03-03T10:00:00Z'), committedAt: ts('2026-03-03T10:00:00Z'),
      }),
      recoveryEvidence: createEvidence({
        evidenceId: 'fixture-recovery-1',
        outcome: 1, sourceType: 'teach_back', explanationQuality: 'strong',
        occurredAt: ts('2026-03-05T10:00:00Z'), committedAt: ts('2026-03-05T10:00:00Z'),
      }),
      schoolBEvidence: createEvidence({
        evidenceId: 'fixture-school-b-evidence',
        schoolId: FIXTURE_SCHOOL_B,
        targetNodeId: FIXTURE_TARGET_SKILL_A,
      }),
    },
  };
}
