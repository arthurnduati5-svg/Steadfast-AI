import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import type { PilotPostPilotReview, PilotReviewRecommendedDecision } from '../contracts/task026PilotExecutionContracts';

export async function generatePostPilotReview(executionRunId: string): Promise<{
  ok: boolean;
  reviewId?: string;
  safeToStartTask027: boolean;
  recommendedDecision: PilotReviewRecommendedDecision;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, safeToStartTask027: false, recommendedDecision: 'pause_and_fix', blockingIssues: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }

  const runAny = run as any;

  const events = await task026PilotExecutionRepository.listExecutionEvents(executionRunId);
  const feedbacks = await task026PilotExecutionRepository.listFeedbackRecords(executionRunId);
  const signals = await task026PilotExecutionRepository.listSafetySignals(executionRunId);
  const metrics = await task026PilotExecutionRepository.listMetricSnapshots(executionRunId);
  const audits = await task026PilotExecutionRepository.listAuditRecords(executionRunId);

  const blockingIssues: string[] = [];
  const knownLimitations: string[] = [];
  const warnings: string[] = Array.isArray(runAny.warnings) ? runAny.warnings : [];

  // Analyze signals
  const criticalSignals = signals.filter((s: any) => s.severity === 'critical');
  const highSignals = signals.filter((s: any) => s.severity === 'high');
  const openSignals = signals.filter((s: any) => s.status === 'open');
  const deenSignals = signals.filter((s: any) => s.requiresDeenReview);
  const privacySignals = signals.filter((s: any) => s.signalType === 'privacy_scan');

  if (criticalSignals.length > 0) {
    blockingIssues.push(`${criticalSignals.length} critical safety signal(s) unresolved.`);
  }
  if (highSignals.length > 3) {
    blockingIssues.push(`${highSignals.length} high-severity safety signals detected.`);
  }
  if (openSignals.length > 0) {
    warnings.push(`${openSignals.length} safety signal(s) still open.`);
  }
  if (deenSignals.length > 0) {
    blockingIssues.push(`${deenSignals.length} Deen governance signal(s) require review.`);
  }
  if (privacySignals.length > 0) {
    blockingIssues.push(`${privacySignals.length} privacy signal(s) detected.`);
  }

  // Analyze feedback
  const actionRequestedCount = feedbacks.filter((f: any) => f.teacherActionRequested).length;
  const safeguardingCount = feedbacks.filter((f: any) => f.safeguardingRelevant).length;
  const deenFeedbackCount = feedbacks.filter((f: any) => f.deenRelevant).length;

  if (safeguardingCount > 0) {
    blockingIssues.push(`${safeguardingCount} safeguarding-relevant feedback item(s) require review.`);
  }
  if (deenFeedbackCount > 0) {
    blockingIssues.push(`${deenFeedbackCount} Deen-relevant feedback item(s) require review.`);
  }
  if (actionRequestedCount > 5) {
    warnings.push(`${actionRequestedCount} teacher action request(s) pending.`);
  }

  // Analyze execution state
  const runStatus = runAny.status;
  if (runStatus !== 'active' && runStatus !== 'completed') {
    blockingIssues.push(`Execution run is ${runStatus}. Must be completed or active for review.`);
  }

  // Blocking issues from run
  const runBlockingIssues: string[] = Array.isArray(runAny.blockingIssues) ? runAny.blockingIssues : [];
  blockingIssues.push(...runBlockingIssues);

  // Rollback/kill switch history
  const killSwitchAudits = audits.filter((a: any) => a.action === 'kill_switch_engaged');
  const rollbackAudits = audits.filter((a: any) => a.action === 'pilot_rolled_back' || a.action === 'rollback_requested');

  if (killSwitchAudits.length > 0) {
    warnings.push(`Kill switch was engaged ${killSwitchAudits.length} time(s) during pilot.`);
  }
  if (rollbackAudits.length > 0) {
    blockingIssues.push(`Rollback occurred ${rollbackAudits.length} time(s) during pilot.`);
  }

  // Metric analysis
  const latestMetrics = metrics.length > 0 ? metrics[0] as any : null;
  if (latestMetrics) {
    if (latestMetrics.errorCount > 50) {
      warnings.push(`High error count: ${latestMetrics.errorCount}.`);
    }
    if (latestMetrics.blockedSessionStarts > latestMetrics.allowedSessionStarts * 0.5) {
      warnings.push(`High blocked session rate: ${latestMetrics.blockedSessionStarts} blocked vs ${latestMetrics.allowedSessionStarts} allowed.`);
    }
  }

  const uniqueBlocking = [...new Set(blockingIssues)];
  const uniqueWarnings = [...new Set(warnings)];

  // Compute recommended decision
  let recommendedDecision: PilotReviewRecommendedDecision;
  if (criticalSignals.length > 0 || rollbackAudits.length > 0) {
    recommendedDecision = 'rollback_required';
  } else if (uniqueBlocking.length > 0) {
    recommendedDecision = 'pause_and_fix';
  } else if (uniqueWarnings.length > 5) {
    recommendedDecision = 'continue_limited_pilot';
  } else {
    recommendedDecision = 'expand_cautiously';
  }

  const safeToStartTask027 = uniqueBlocking.length === 0 && runStatus !== 'rolled_back' && runStatus !== 'blocked' && runStatus !== 'failed';

  const learningQualitySummary = {
    totalEvents: events.length,
    sessionAllowedCount: events.filter((e: any) => e.eventType === 'pilot_session_start_allowed').length,
    sessionDeniedCount: events.filter((e: any) => e.eventType === 'pilot_session_start_denied').length,
  };

  const safetySummary = {
    totalSignals: signals.length,
    criticalCount: criticalSignals.length,
    highCount: highSignals.length,
    openCount: openSignals.length,
    resolvedCount: signals.filter((s: any) => s.status === 'resolved' || s.status === 'dismissed').length,
  };

  const privacySummary = {
    privacySignals: privacySignals.length,
    safeguardingFeedbackCount: safeguardingCount,
    redactedFeedbackCount: feedbacks.filter((f: any) => f.redactionStatus === 'redacted').length,
  };

  const deenSummary = {
    deenSignals: deenSignals.length,
    deenFeedbackCount: deenFeedbackCount,
    deenReviewRequired: deenSignals.length > 0 || deenFeedbackCount > 0,
  };

  const operationsSummary = {
    totalAudits: audits.length,
    killSwitchEngagements: killSwitchAudits.length,
    rollbacks: rollbackAudits.length,
    errorCount: latestMetrics?.errorCount ?? 0,
    incidentBridgeCount: latestMetrics?.incidentBridgeCount ?? 0,
  };

  const feedbackSummary = {
    total: feedbacks.length,
    actionRequested: actionRequestedCount,
    safeguardingRelevant: safeguardingCount,
    deenRelevant: deenFeedbackCount,
    byType: {} as Record<string, number>,
  };
  for (const f of feedbacks as any[]) {
    feedbackSummary.byType[f.feedbackType] = (feedbackSummary.byType[f.feedbackType] ?? 0) + 1;
  }

  const artifactPaths = [
    `docs/ops/task-026/task-026-pilot-execution-report.json`,
    `docs/ops/task-026/TASK_026_PILOT_EXECUTION_REPORT.md`,
    `docs/ops/task-026/TASK_026_HANDOFF.md`,
  ];

  const review = await task026PilotExecutionRepository.createPostPilotReview({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    status: 'generated',
    safeSummary: `Post-pilot review generated. Decision: ${recommendedDecision}. safeToStartTask027: ${safeToStartTask027}.`,
    learningQualitySummary,
    safetySummary,
    privacySummary,
    deenSummary,
    operationsSummary,
    feedbackSummary,
    recommendedDecision,
    safeToStartNextTask: safeToStartTask027,
    blockingIssues: uniqueBlocking,
    knownLimitations,
    artifactPaths,
  });

  return {
    ok: true,
    reviewId: (review as any).id,
    safeToStartTask027,
    recommendedDecision,
    blockingIssues: uniqueBlocking,
    safeMessage: `Post-pilot review generated. safeToStartTask027: ${safeToStartTask027}`,
  };
}
