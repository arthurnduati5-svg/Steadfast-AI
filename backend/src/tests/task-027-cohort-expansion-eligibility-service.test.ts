import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import { checkExpansionEligibility } from '../services/task027CohortExpansionEligibilityService';

async function seedValidProposal(): Promise<string> {
  const entry = await govRepo.createExpansionProposal({
    schoolId: 'school-1',
    pilotRunId: 'pilot-1',
    proposedCohortSize: 25,
    proposedScopeLabels: ['additional_class'],
    proposedClassOrGradeIds: ['class-2'],
    teacherOwnerSafeRefs: ['teacher-1'],
    supportOwnerSafeRefs: ['support-1'],
    curriculumSourceScopeIds: ['scope-1'],
    startReadinessWindow: '2026-09-01',
    rollbackReadinessPath: '/rollback/path',
  });
  return entry.id;
}

describe('task027CohortExpansionEligibilityService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('returns eligible=true when all criteria pass', async () => {
    const proposalId = await seedValidProposal();

    const result = await checkExpansionEligibility({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.ok).toBe(true);
    expect(result.eligible).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('verifies same school', async () => {
    const proposalId = await seedValidProposal();

    const result = await checkExpansionEligibility({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.sameSchoolVerified).toBe(true);
  });

  it('blocks cross-school learners', async () => {
    const proposalId = await seedValidProposal();

    const result = await checkExpansionEligibility({
      schoolId: 'school-2',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.ok).toBe(false);
    expect(result.eligible).toBe(false);
    expect(result.blockingIssues).toContain('Same verified school: school ID mismatch');
  });

  it('blocks when school ID does not match', async () => {
    const proposalId = await seedValidProposal();

    const result = await checkExpansionEligibility({
      schoolId: 'school-2',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.sameSchoolVerified).toBe(false);
  });

  it('blocks missing curriculum scope', async () => {
    const entry = await govRepo.createExpansionProposal({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      proposedCohortSize: 25,
      proposedScopeLabels: [],
      proposedClassOrGradeIds: [],
      teacherOwnerSafeRefs: ['teacher-1'],
      supportOwnerSafeRefs: ['support-1'],
      curriculumSourceScopeIds: [],
      startReadinessWindow: '2026-09-01',
      rollbackReadinessPath: '/rollback/path',
    });

    const result = await checkExpansionEligibility({
      schoolId: 'school-1',
      proposalId: entry.id,
      pilotRunId: 'pilot-1',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Approved curriculum/source scope: no scope IDs provided');
  });

  it('blocks inadequate teacher coverage', async () => {
    const entry = await govRepo.createExpansionProposal({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      proposedCohortSize: 25,
      proposedScopeLabels: [],
      proposedClassOrGradeIds: [],
      teacherOwnerSafeRefs: [],
      supportOwnerSafeRefs: ['support-1'],
      curriculumSourceScopeIds: ['scope-1'],
      startReadinessWindow: '2026-09-01',
      rollbackReadinessPath: '/rollback/path',
    });

    const result = await checkExpansionEligibility({
      schoolId: 'school-1',
      proposalId: entry.id,
      pilotRunId: 'pilot-1',
    });
    expect(result.teacherCoverageAdequate).toBe(false);
    expect(result.blockingIssues).toContain('Teacher coverage: no teacher owner refs provided');
  });

  it('blocks missing support coverage', async () => {
    const entry = await govRepo.createExpansionProposal({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      proposedCohortSize: 25,
      proposedScopeLabels: [],
      proposedClassOrGradeIds: [],
      teacherOwnerSafeRefs: ['teacher-1'],
      supportOwnerSafeRefs: [],
      curriculumSourceScopeIds: ['scope-1'],
      startReadinessWindow: '2026-09-01',
      rollbackReadinessPath: '/rollback/path',
    });

    const result = await checkExpansionEligibility({
      schoolId: 'school-1',
      proposalId: entry.id,
      pilotRunId: 'pilot-1',
    });
    expect(result.supportCoverageAdequate).toBe(false);
    expect(result.blockingIssues).toContain('Support coverage: no support owner refs provided');
  });

  it('blocks when proposal not found', async () => {
    const result = await checkExpansionEligibility({
      schoolId: 'school-1',
      proposalId: 'nonexistent',
      pilotRunId: 'pilot-1',
    });
    expect(result.ok).toBe(false);
    expect(result.eligible).toBe(false);
    expect(result.blockingIssues).toContain('Proposal nonexistent not found');
  });

  it('reports cohort size within limits', async () => {
    const proposalId = await seedValidProposal();

    const result = await checkExpansionEligibility({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.cohortSizeWithinLimits).toBe(true);
  });

  it('reports safeguarding path exists', async () => {
    const proposalId = await seedValidProposal();

    const result = await checkExpansionEligibility({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.safeguardingPathExists).toBe(true);
  });

  it('reports rollback capacity adequate', async () => {
    const proposalId = await seedValidProposal();

    const result = await checkExpansionEligibility({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.rollbackCapacityAdequate).toBe(true);
  });
});
