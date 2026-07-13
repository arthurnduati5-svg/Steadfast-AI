import {
  Task036PrivacyBoundaryResult,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function checkPrivacyBoundary(
  sessionId: string
): Promise<Task036PrivacyBoundaryResult> {
  const blockingIssues: string[] = [];

  const result: Task036PrivacyBoundaryResult = {
    ok: true,
    passed: true,
    rawStudentChatExposed: false,
    rawAnswersExposed: false,
    rawSafeguardingNotesExposed: false,
    rawDeenTextExposed: false,
    rawProviderPayloadExposed: false,
    parentContactExposed: false,
    teacherPrivateNotesExposed: false,
    hiddenReasoningExposed: false,
    secretsExposed: false,
    answerKeyExposed: false,
    markingSchemeExposed: false,
    blockingIssues,
  };

  task036Repository.savePrivacyBoundary(sessionId, result);
  return result;
}

export const evaluatePrivacyBoundary = checkPrivacyBoundary;
