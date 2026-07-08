import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import {
  createExpansionProposal,
  getExpansionProposal,
  listExpansionProposals,
} from '../services/task027CohortExpansionProposalService';

const validInput = {
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
};

describe('task027CohortExpansionProposalService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('creates a proposal with a generated id', async () => {
    const result = await createExpansionProposal(validInput);
    expect(result.ok).toBe(true);
    expect(result.proposal).not.toBeNull();
    expect(result.proposal!.id).toBeTruthy();
    expect(typeof result.proposal!.id).toBe('string');
  });

  it('creates proposal with correct schoolId', async () => {
    const result = await createExpansionProposal(validInput);
    expect(result.proposal!.schoolId).toBe('school-1');
  });

  it('creates proposal with correct proposedCohortSize', async () => {
    const result = await createExpansionProposal(validInput);
    expect(result.proposal!.proposedCohortSize).toBe(25);
  });

  it('proposal status is draft (governance-only, no activation)', async () => {
    const result = await createExpansionProposal(validInput);
    expect(result.proposal!.status).toBe('draft');
  });

  it('proposal has no governance blockers initially', async () => {
    const result = await createExpansionProposal(validInput);
    expect(result.proposal!.governanceBlockers).toEqual([]);
  });

  it('proposal has createdAt set', async () => {
    const result = await createExpansionProposal(validInput);
    expect(result.proposal!.createdAt).toBeInstanceOf(Date);
  });

  it('proposal has updatedAt set', async () => {
    const result = await createExpansionProposal(validInput);
    expect(result.proposal!.updatedAt).toBeInstanceOf(Date);
  });

  it('safeMessage confirms governance-only (no activation)', async () => {
    const result = await createExpansionProposal(validInput);
    expect(result.safeMessage).toContain('governance review only, no activation');
  });

  it('rejects missing schoolId', async () => {
    const result = await createExpansionProposal({ ...validInput, schoolId: '' });
    expect(result.ok).toBe(false);
    expect(result.proposal).toBeNull();
    expect(result.blockingIssues).toContain('schoolId is required');
  });

  it('rejects missing pilotRunId', async () => {
    const result = await createExpansionProposal({ ...validInput, pilotRunId: '' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('pilotRunId is required');
  });

  it('rejects non-positive cohort size', async () => {
    const result = await createExpansionProposal({ ...validInput, proposedCohortSize: 0 });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('proposedCohortSize must be a positive number');
  });

  it('rejects missing teacherOwnerSafeRefs', async () => {
    const result = await createExpansionProposal({ ...validInput, teacherOwnerSafeRefs: [] });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('At least one teacher owner safe ref is required');
  });

  it('rejects missing rollbackReadinessPath', async () => {
    const result = await createExpansionProposal({ ...validInput, rollbackReadinessPath: '' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('rollbackReadinessPath is required');
  });

  it('getExpansionProposal returns created proposal by id', async () => {
    const created = await createExpansionProposal(validInput);
    const fetched = await getExpansionProposal(created.proposal!.id);
    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.proposal!.id);
  });

  it('listExpansionProposals returns proposals for school', async () => {
    await createExpansionProposal(validInput);
    await createExpansionProposal({ ...validInput, schoolId: 'school-2' });

    const school1Proposals = await listExpansionProposals('school-1');
    expect(school1Proposals.length).toBe(1);
    expect(school1Proposals[0].schoolId).toBe('school-1');
  });

  it('listExpansionProposals returns empty array for school with no proposals', async () => {
    const proposals = await listExpansionProposals('nonexistent-school');
    expect(proposals).toEqual([]);
  });
});
