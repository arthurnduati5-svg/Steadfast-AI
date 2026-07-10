import type { Task034LearnerNoticeReadinessInput, Task034LearnerNoticeReadinessResult } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

export function evaluateTask034LearnerNoticeReadiness(
  input: Task034LearnerNoticeReadinessInput,
): Task034LearnerNoticeReadinessResult {
  const blockingIssues: string[] = [];

  const noticeFields: [string, boolean][] = [
    ['noticeIsCalm', input.noticeIsCalm],
    ['noticeIsAgeAppropriate', input.noticeIsAgeAppropriate],
    ['noticeIsNonAlarming', input.noticeIsNonAlarming],
    ['noticeMentionsThinkingFirst', input.noticeMentionsThinkingFirst],
    ['noticeMentionsTeacherSupport', input.noticeMentionsTeacherSupport],
    ['noInternalRolloutDetails', input.noInternalRolloutDetails],
    ['noRiskScores', input.noRiskScores],
    ['noPrivateComparisons', input.noPrivateComparisons],
    ['noPietyScore', input.noPietyScore],
    ['noClassmateComparison', input.noClassmateComparison],
    ['noRawIncidentDetail', input.noRawIncidentDetail],
    ['noAnswerArtifact', input.noAnswerArtifact],
  ];

  for (const [name, value] of noticeFields) {
    if (!value) blockingIssues.push(`${name}_not_passed`);
  }

  const result: Task034LearnerNoticeReadinessResult = {
    ok: blockingIssues.length === 0,
    noticeIsCalm: input.noticeIsCalm,
    noticeIsAgeAppropriate: input.noticeIsAgeAppropriate,
    noticeIsNonAlarming: input.noticeIsNonAlarming,
    noticeMentionsThinkingFirst: input.noticeMentionsThinkingFirst,
    noticeMentionsTeacherSupport: input.noticeMentionsTeacherSupport,
    noInternalRolloutDetails: input.noInternalRolloutDetails,
    noRiskScores: input.noRiskScores,
    noPrivateComparisons: input.noPrivateComparisons,
    noPietyScore: input.noPietyScore,
    noClassmateComparison: input.noClassmateComparison,
    noRawIncidentDetail: input.noRawIncidentDetail,
    noAnswerArtifact: input.noAnswerArtifact,
    noticeNotActuallySent: true,
    blockingIssues,
  };

  task034Repository.saveLearnerNoticeReadiness(result);
  return result;
}
