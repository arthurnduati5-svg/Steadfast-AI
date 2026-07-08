import { describe, it, expect, beforeEach } from 'vitest';
import { decideExpansion } from '../services/task027PilotExpansionDecisionService';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 028 Approved Expansion Plan Service', () => {
  let proposalId: string;

  beforeEach(async () => {
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository.clearTask026StoresForTests();
    process.env.NODE_ENV = 'test';

    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      status: 'draft',
      proposalName: 'Stage 2 expansion',
      safeSummary: 'Expand to more classes',
      requestedStudentIncrease: 100,
      requestedTeacherIncrease: 10,
      requestedClassIds: ['class-2', 'class-3'],
      requestedSubjectIds: ['Math', 'Science'],
      requestedCurriculumScopes: ['National'],
      requestedYearGroups: ['Year 11'],
      createdByRole: 'admin',
      createdByActorIdHash: 'admin-1',
    });
    proposalId = (proposal as any).id;
  });

  it('should fail when proposal is not found', async () => {
    const result = await decideExpansion('nonexistent', 'admin', 'admin-hash');
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('proposal_not_found');
    expect(result.safeToExpand).toBe(false);
  });

  it('should fail when evidence pack is missing', async () => {
    const handoffPath = path.resolve(__dirname, '../../../docs/ops/task-026/TASK_026_HANDOFF.md');
    const backup = handoffPath + '.bak';
    if (fs.existsSync(handoffPath)) {
      fs.renameSync(handoffPath, backup);
    }
    try {
      const result = await decideExpansion(proposalId, 'admin', 'admin-hash');
      expect(result.ok).toBe(false);
      expect(result.blockingIssues.length).toBeGreaterThan(0);
    } finally {
      if (fs.existsSync(backup)) {
        fs.renameSync(backup, handoffPath);
      }
    }
  });

  it('should fail when risk assessment is missing', async () => {
    await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      dataPoints: [],
      evidenceSummary: 'All clear',
      blockingIssues: [],
    });
    const result = await decideExpansion(proposalId, 'admin', 'admin-hash');
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Risk assessment missing');
  });

  it('should detect blocked subject scope', async () => {
    const proposal2 = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-2', schoolId: 'school-1', proposalName: 'Big expansion',
      safeSummary: 'Too many subjects', createdByRole: 'admin',
      requestedStudentIncrease: 50, requestedTeacherIncrease: 5,
      requestedSubjectIds: Array.from({ length: 31 }, (_, i) => `subj-${i}`),
      requestedClassIds: ['c1'], requestedCurriculumScopes: ['Nat'], requestedYearGroups: ['Y10'],
    });
    const result = await decideExpansion((proposal2 as any).id, 'admin', 'admin-hash');
    expect(result.ok).toBe(false);
  });

  it('should detect blocked year group scope', async () => {
    const proposal3 = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-3', schoolId: 'school-1', proposalName: 'Wide scope',
      safeSummary: 'Too many year groups', createdByRole: 'admin',
      requestedStudentIncrease: 50, requestedTeacherIncrease: 5,
      requestedSubjectIds: ['Math'], requestedClassIds: ['c1'],
      requestedCurriculumScopes: ['Nat'],
      requestedYearGroups: Array.from({ length: 8 }, (_, i) => `Y${i}`),
    });
    const result = await decideExpansion((proposal3 as any).id, 'admin', 'admin-hash');
    expect(result.ok).toBe(false);
  });
});
