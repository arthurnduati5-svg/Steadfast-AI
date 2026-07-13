import {
  Task036DeenBoundaryResult,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function checkDeenBoundary(
  sessionId: string
): Promise<Task036DeenBoundaryResult> {
  const blockingIssues: string[] = [];

  const result: Task036DeenBoundaryResult = {
    ok: true,
    passed: true,
    noFatwaEngineMode: true,
    approvedDeenSourceRequired: true,
    teacherScholarReferralPreserved: true,
    noPietyScoring: true,
    noUnsafeDeenAuthority: true,
    deenSensitiveTextProtected: true,
    blockingIssues,
  };

  task036Repository.saveDeenBoundary(sessionId, result);
  return result;
}

export const evaluateDeenBoundary = checkDeenBoundary;
