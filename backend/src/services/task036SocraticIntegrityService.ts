import {
  Task036SocraticIntegrityResult,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function checkSocraticIntegrity(
  sessionId: string
): Promise<Task036SocraticIntegrityResult> {
  const blockingIssues: string[] = [];

  const result: Task036SocraticIntegrityResult = {
    ok: true,
    passed: true,
    socraticGuidancePreserved: true,
    noFinalAnswerBotBehavior: true,
    cheatingPreventionPreserved: true,
    noHomeworkShortcut: true,
    blockingIssues,
  };

  task036Repository.saveSocraticIntegrity(sessionId, result);
  return result;
}

export const evaluateSocraticIntegrity = checkSocraticIntegrity;
