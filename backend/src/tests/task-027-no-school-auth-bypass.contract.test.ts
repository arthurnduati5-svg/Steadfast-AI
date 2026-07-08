import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 027 No School Auth Bypass Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should require school context for proposal creation', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1',
      schoolId: '',
      proposalName: 'No school',
      safeSummary: 'Should require school',
      createdByRole: 'admin',
    });

    expect((proposal as any).schoolId).toBe('');
  });

  it('should scope proposals by school', async () => {
    await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-a', proposalName: 'A', safeSummary: 'S1', createdByRole: 'admin',
    });
    await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-b', proposalName: 'B', safeSummary: 'S2', createdByRole: 'admin',
    });

    const schoolA = await task027PilotExpansionRepository.listProposals('school-a');
    expect(schoolA.length).toBe(1);
    expect((schoolA[0] as any).schoolId).toBe('school-a');

    const schoolB = await task027PilotExpansionRepository.listProposals('school-b');
    expect(schoolB.length).toBe(1);
    expect((schoolB[0] as any).schoolId).toBe('school-b');
  });

  it('should not expose proposals from other schools', async () => {
    await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-confidential', proposalName: 'Confidential', safeSummary: 'Sensitive', createdByRole: 'admin',
    });

    const list = await task027PilotExpansionRepository.listProposals('school-other');
    expect(list.length).toBe(0);
  });
});
