import {
  Task027CohortExpansionProposalInput,
  Task027CohortExpansionProposal,
  TASK027_BLOCKER_TYPES,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

export async function createExpansionProposal(
  input: Task027CohortExpansionProposalInput
): Promise<{
  ok: boolean;
  proposal: Task027CohortExpansionProposal | null;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const blockingIssues: string[] = [];

  if (!input.schoolId) {
    blockingIssues.push('schoolId is required');
  }
  if (!input.pilotRunId) {
    blockingIssues.push('pilotRunId is required');
  }
  if (!input.proposedCohortSize || input.proposedCohortSize <= 0) {
    blockingIssues.push('proposedCohortSize must be a positive number');
  }
  if (!input.teacherOwnerSafeRefs || input.teacherOwnerSafeRefs.length === 0) {
    blockingIssues.push('At least one teacher owner safe ref is required');
  }
  if (!input.rollbackReadinessPath) {
    blockingIssues.push('rollbackReadinessPath is required');
  }

  if (blockingIssues.length > 0) {
    return {
      ok: false,
      proposal: null,
      blockingIssues,
      safeMessage: 'Expansion proposal creation blocked due to validation failures.',
    };
  }

  const now = new Date();
  const proposal: Task027CohortExpansionProposal = {
    id: '',
    ...input,
    status: 'draft',
    governanceBlockers: [],
    createdAt: now,
    updatedAt: now,
  };

  const saved = await govRepo.createExpansionProposal(input);
  proposal.id = saved.id;

  return {
    ok: true,
    proposal,
    blockingIssues: [],
    safeMessage: `Expansion proposal ${proposal.id} created successfully (governance review only, no activation).`,
  };
}

export async function getExpansionProposal(proposalId: string): Promise<any> {
  return govRepo.getExpansionProposal(proposalId);
}

export async function listExpansionProposals(schoolId: string): Promise<any[]> {
  return govRepo.listExpansionProposalsForSchool(schoolId);
}
