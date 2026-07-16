import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryAdjudicationReadinessRepository,
  InMemoryReviewSessionRepository,
  InMemoryEvidenceBundleRepository,
  InMemoryConflictDeclarationRepository,
  InMemoryReviewerDecisionRepository,
  InMemoryPriorityOverrideRepository,
  InMemoryConsensusRepository,
  InMemoryQueueDispositionRepository,
  InMemoryQualitySampleRepository,
  InMemoryAdjudicationSummaryRepository,
} from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';

describe('Package 26 - School Isolation', () => {
  const schoolA = 'school-a';
  const schoolB = 'school-b';

  describe('Readiness records are isolated by school', () => {
    let repo: InMemoryAdjudicationReadinessRepository;
    beforeEach(() => { repo = new InMemoryAdjudicationReadinessRepository(); });

    it('create records in school_a and school_b, verify listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'p1', queueItemId: 'q1', safeReadinessSummary: 'A', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
      await repo.create({ schoolId: schoolB, studentRef: 's2', resultRecoveryPlanId: 'p2', queueItemId: 'q2', safeReadinessSummary: 'B', sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'teacher' });
      const listA = await repo.listBySchool(schoolA);
      const listB = await repo.listBySchool(schoolB);
      expect(listA).toHaveLength(1);
      expect(listA[0].schoolId).toBe(schoolA);
      expect(listB).toHaveLength(1);
      expect(listB[0].schoolId).toBe(schoolB);
    });
  });

  describe('Review sessions are isolated', () => {
    let repo: InMemoryReviewSessionRepository;
    beforeEach(() => { repo = new InMemoryReviewSessionRepository(); });

    it('listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, queueItemId: 'q1', adjudicationReadinessId: 'r1', reviewerActorId: 'rev1', reviewerRole: 'lead_teacher', safeSessionSummary: 'A', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher' });
      await repo.create({ schoolId: schoolB, queueItemId: 'q2', adjudicationReadinessId: 'r2', reviewerActorId: 'rev2', reviewerRole: 'lead_teacher', safeSessionSummary: 'B', sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'lead_teacher' });
      expect((await repo.listBySchool(schoolA))).toHaveLength(1);
      expect((await repo.listBySchool(schoolB))).toHaveLength(1);
      expect((await repo.listBySchool(schoolA))[0].schoolId).toBe(schoolA);
      expect((await repo.listBySchool(schoolB))[0].schoolId).toBe(schoolB);
    });
  });

  describe('Evidence bundles are isolated', () => {
    let repo: InMemoryEvidenceBundleRepository;
    beforeEach(() => { repo = new InMemoryEvidenceBundleRepository(); });

    it('listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, queueItemId: 'q1', safeEvidenceItems: [], sourceUpdatedAt: { board: '2026-01-01' }, safeBundleSummary: 'A', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
      await repo.create({ schoolId: schoolB, queueItemId: 'q2', safeEvidenceItems: [], sourceUpdatedAt: { board: '2026-01-01' }, safeBundleSummary: 'B', sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'teacher' });
      expect((await repo.listBySchool(schoolA))).toHaveLength(1);
      expect((await repo.listBySchool(schoolB))).toHaveLength(1);
      expect((await repo.listBySchool(schoolA))[0].schoolId).toBe(schoolA);
      expect((await repo.listBySchool(schoolB))[0].schoolId).toBe(schoolB);
    });
  });

  describe('Conflict declarations are isolated', () => {
    let repo: InMemoryConflictDeclarationRepository;
    beforeEach(() => { repo = new InMemoryConflictDeclarationRepository(); });

    it('listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'rev1', reviewerRole: 'teacher', conflictType: 'none_declared', safeDeclarationSummary: 'A', createdByActorId: 'a1', createdByRole: 'teacher' });
      await repo.create({ schoolId: schoolB, queueItemId: 'q2', reviewerActorId: 'rev2', reviewerRole: 'teacher', conflictType: 'none_declared', safeDeclarationSummary: 'B', createdByActorId: 'a2', createdByRole: 'teacher' });
      expect((await repo.listBySchool(schoolA))).toHaveLength(1);
      expect((await repo.listBySchool(schoolB))).toHaveLength(1);
      expect((await repo.listBySchool(schoolA))[0].schoolId).toBe(schoolA);
      expect((await repo.listBySchool(schoolB))[0].schoolId).toBe(schoolB);
    });
  });

  describe('Reviewer decisions are isolated', () => {
    let repo: InMemoryReviewerDecisionRepository;
    beforeEach(() => { repo = new InMemoryReviewerDecisionRepository(); });

    it('listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewSessionId: 's1', reviewerActorId: 'rev1', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', currentPriorityScore: 75, currentPriorityBand: 'high', recommendedPriorityBand: 'high', safeDecisionSummary: 'A', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
      await repo.create({ schoolId: schoolB, queueItemId: 'q2', reviewSessionId: 's2', reviewerActorId: 'rev2', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', currentPriorityScore: 75, currentPriorityBand: 'high', recommendedPriorityBand: 'high', safeDecisionSummary: 'B', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'teacher' });
      expect((await repo.listBySchool(schoolA))).toHaveLength(1);
      expect((await repo.listBySchool(schoolB))).toHaveLength(1);
      expect((await repo.listBySchool(schoolA))[0].schoolId).toBe(schoolA);
      expect((await repo.listBySchool(schoolB))[0].schoolId).toBe(schoolB);
    });
  });

  describe('Priority overrides are isolated', () => {
    let repo: InMemoryPriorityOverrideRepository;
    beforeEach(() => { repo = new InMemoryPriorityOverrideRepository(); });

    it('listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, queueItemId: 'q1', priorityAssessmentId: 'pa-1', currentPriorityScore: 80, currentPriorityBand: 'high', requestedPriorityBand: 'normal', safeOverrideRationale: 'A', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a1', createdByRole: 'teacher' });
      await repo.create({ schoolId: schoolB, queueItemId: 'q2', priorityAssessmentId: 'pa-2', currentPriorityScore: 80, currentPriorityBand: 'high', requestedPriorityBand: 'normal', safeOverrideRationale: 'B', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a2', createdByRole: 'teacher' });
      expect((await repo.listBySchool(schoolA))).toHaveLength(1);
      expect((await repo.listBySchool(schoolB))).toHaveLength(1);
      expect((await repo.listBySchool(schoolA))[0].schoolId).toBe(schoolA);
      expect((await repo.listBySchool(schoolB))[0].schoolId).toBe(schoolB);
    });
  });

  describe('Consensus records are isolated', () => {
    let repo: InMemoryConsensusRepository;
    beforeEach(() => { repo = new InMemoryConsensusRepository(); });

    it('listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, queueItemId: 'q1', primaryDecisionId: 'd1', secondaryDecisionId: 'd2', safeConsensusSummary: 'A', createdByActorId: 'a1', createdByRole: 'lead_teacher' });
      await repo.create({ schoolId: schoolB, queueItemId: 'q2', primaryDecisionId: 'd3', secondaryDecisionId: 'd4', safeConsensusSummary: 'B', createdByActorId: 'a2', createdByRole: 'lead_teacher' });
      expect((await repo.listBySchool(schoolA))).toHaveLength(1);
      expect((await repo.listBySchool(schoolB))).toHaveLength(1);
      expect((await repo.listBySchool(schoolA))[0].schoolId).toBe(schoolA);
      expect((await repo.listBySchool(schoolB))[0].schoolId).toBe(schoolB);
    });
  });

  describe('Queue dispositions are isolated', () => {
    let repo: InMemoryQueueDispositionRepository;
    beforeEach(() => { repo = new InMemoryQueueDispositionRepository(); });

    it('listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, queueItemId: 'q1', dispositionCode: 'retain_in_queue', safeDispositionSummary: 'A', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher' });
      await repo.create({ schoolId: schoolB, queueItemId: 'q2', dispositionCode: 'retain_in_queue', safeDispositionSummary: 'B', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'lead_teacher' });
      expect((await repo.listBySchool(schoolA))).toHaveLength(1);
      expect((await repo.listBySchool(schoolB))).toHaveLength(1);
      expect((await repo.listBySchool(schoolA))[0].schoolId).toBe(schoolA);
      expect((await repo.listBySchool(schoolB))[0].schoolId).toBe(schoolB);
    });
  });

  describe('Quality samples are isolated', () => {
    let repo: InMemoryQualitySampleRepository;
    beforeEach(() => { repo = new InMemoryQualitySampleRepository(); });

    it('listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, queueItemId: 'q1', priorityBand: 'normal', selected: true, bucket: 123, sampleBasisPoints: 5000, policyVersion: 'v1', createdByActorId: 'a1', createdByRole: 'system_job' });
      await repo.create({ schoolId: schoolB, queueItemId: 'q2', priorityBand: 'normal', selected: true, bucket: 456, sampleBasisPoints: 5000, policyVersion: 'v1', createdByActorId: 'a2', createdByRole: 'system_job' });
      expect((await repo.listBySchool(schoolA))).toHaveLength(1);
      expect((await repo.listBySchool(schoolB))).toHaveLength(1);
      expect((await repo.listBySchool(schoolA))[0].schoolId).toBe(schoolA);
      expect((await repo.listBySchool(schoolB))[0].schoolId).toBe(schoolB);
    });
  });

  describe('Adjudication summaries are isolated', () => {
    let repo: InMemoryAdjudicationSummaryRepository;
    beforeEach(() => { repo = new InMemoryAdjudicationSummaryRepository(); });

    it('listBySchool returns only correct records', async () => {
      await repo.create({ schoolId: schoolA, safeSummary: 'A', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin' });
      await repo.create({ schoolId: schoolB, safeSummary: 'B', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'admin' });
      expect((await repo.listBySchool(schoolA))).toHaveLength(1);
      expect((await repo.listBySchool(schoolB))).toHaveLength(1);
      expect((await repo.listBySchool(schoolA))[0].schoolId).toBe(schoolA);
      expect((await repo.listBySchool(schoolB))[0].schoolId).toBe(schoolB);
    });
  });
});
