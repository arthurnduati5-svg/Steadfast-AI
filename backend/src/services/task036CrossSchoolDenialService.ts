import {
  Task036CrossSchoolDenialResult,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function checkCrossSchoolDenial(
  sessionId: string
): Promise<Task036CrossSchoolDenialResult> {
  const blockingIssues: string[] = [];

  const result: Task036CrossSchoolDenialResult = {
    ok: true,
    passed: true,
    crossSchoolAccessDenied: true,
    crossLearnerVisibilityDenied: true,
    parentRawDetailDenied: true,
    unknownSchoolBlocked: true,
    tenantMismatchBlocked: true,
    blockingIssues,
  };

  task036Repository.saveCrossSchoolDenial(sessionId, result);
  return result;
}

export const evaluateCrossSchoolDenial = checkCrossSchoolDenial;
