import {
  Task027LearningQualityReviewInput,
  Task027LearningQualityReviewResult,
  Task027PilotExecutionEvidenceSummary,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

const MAX_ACCEPTABLE_BLOCKED_RATE = 0.15;
const MAX_ACCEPTABLE_SUPPORT_RATE = 0.25;

export async function reviewLearningQuality(
  input: Task027LearningQualityReviewInput
): Promise<Task027LearningQualityReviewResult> {
  const blockingIssues: string[] = [];
  const recommendations: string[] = [];

  const { evidenceSummary } = input;
  const totalSessions = evidenceSummary.sessionsStartedCount || 1;

  if (!evidenceSummary.safeLearningQualitySignals || Object.keys(evidenceSummary.safeLearningQualitySignals).length === 0) {
    blockingIssues.push('Learning quality evidence missing');
  }

  const blockedRate = evidenceSummary.sessionsBlockedCount / totalSessions;
  if (blockedRate > MAX_ACCEPTABLE_BLOCKED_RATE) {
    blockingIssues.push(
      `Blocked session rate ${(blockedRate * 100).toFixed(1)}% exceeds ${(MAX_ACCEPTABLE_BLOCKED_RATE * 100).toFixed(0)}% without review`
    );
    recommendations.push('Review blocked sessions to identify root cause');
  }

  const supportRate = evidenceSummary.supportNeededCount / totalSessions;
  if (supportRate > MAX_ACCEPTABLE_SUPPORT_RATE) {
    blockingIssues.push(
      `Support-needed rate ${(supportRate * 100).toFixed(1)}% exceeds ${(MAX_ACCEPTABLE_SUPPORT_RATE * 100).toFixed(0)}% without review`
    );
    recommendations.push('Review support needs and adjust scaffolding');
  }

  const teacherSnapshot = (evidenceSummary as any).teacherMonitoringSnapshotSafeSummary as Record<string, unknown> | undefined;
  if (teacherSnapshot && Object.keys(teacherSnapshot).length > 0) {
    if ((teacherSnapshot as any).unresolvedFeedback) {
      blockingIssues.push('Teacher safe feedback unresolved');
      recommendations.push('Resolve teacher feedback before expansion');
    }
  }

  const dailyMetadata = (evidenceSummary as any).dailyPilotSummarySafeMetadata as Record<string, unknown> | undefined;
  if (dailyMetadata && Object.keys(dailyMetadata).length > 0) {
    if ((dailyMetadata as any).learnerFeedbackUnresolved) {
      blockingIssues.push('Learner safe feedback unresolved');
      recommendations.push('Resolve learner feedback before expansion');
    }
  }

  if (
    !evidenceSummary.safeSocraticIntegritySignals ||
    Object.keys(evidenceSummary.safeSocraticIntegritySignals).length === 0
  ) {
    blockingIssues.push('Socratic integrity not proven');
    recommendations.push('Collect Socratic integrity evidence before expansion');
  }

  if (
    !evidenceSummary.safeContentGovernanceSignals ||
    Object.keys(evidenceSummary.safeContentGovernanceSignals).length === 0
  ) {
    blockingIssues.push('Content governance not proven');
    recommendations.push('Collect content governance evidence before expansion');
  }

  const ok = blockingIssues.length === 0;
  const reviewStatus = ok ? 'passed' : 'blocked';
  const safeSummary = ok
    ? 'Learning quality review passed all checks.'
    : `Learning quality review blocked: ${blockingIssues.join('; ')}.`;

  if (ok) {
    recommendations.push('Pilot learning quality is satisfactory for expansion consideration');
  }

  return {
    ok,
    reviewStatus,
    safeSummary,
    blockingIssues,
    recommendations,
  };
}
