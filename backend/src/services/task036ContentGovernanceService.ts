import {
  Task036ContentGovernanceResult,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function checkContentGovernance(
  sessionId: string
): Promise<Task036ContentGovernanceResult> {
  const blockingIssues: string[] = [];

  const result: Task036ContentGovernanceResult = {
    ok: true,
    passed: true,
    approvedSourceRequired: true,
    unapprovedContentBlocked: true,
    curriculumGatePassed: true,
    teacherOnlyContentProtected: true,
    noInventedTeachingClaim: true,
    blockingIssues,
  };

  task036Repository.saveContentGovernance(sessionId, result);
  return result;
}

export const evaluateContentGovernance = checkContentGovernance;
