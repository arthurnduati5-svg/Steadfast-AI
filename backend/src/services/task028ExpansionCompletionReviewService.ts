import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type { Task028ExpansionCompletionReview } from '../contracts/task028ControlledExpansionExecutionContracts';
import { nowISO } from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028ExpansionCompletionReviewInput,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

interface OldCompletionReviewResult {
  ok: boolean;
  reviewId: string;
  safeToStartTask029: boolean;
  safeMessage: string;
  reasonCodes: string[];
}

async function buildCompletionReviewData(runId: string, schoolId: string): Promise<{
  run: any; reviewId: string; safeToStartTask029: boolean; remainingBlockers: string[];
  safeExecutionSummary: string; safeLearningQualitySummary: string;
  safeTeacherOversightSummary: string; safeInterventionSummary: string; safeIncidentSummary: string;
  privacyBoundaryStatus: string; safeguardingBoundaryStatus: string;
  deenContentBoundaryStatus: string; socraticIntegrityStatus: string; rollbackReadinessStatus: string;
}> {
  const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
  if (!run) throw createSafeTask028ValidationError('Execution run not found.', ['execution_run_not_found']);
  const runAny = run as any;

  if (schoolId && runAny.schoolId !== schoolId) {
    throw createSafeTask028ValidationError('School ID mismatch.', ['school_mismatch']);
  }

  const stages = await task028ExpansionExecutionRepository.listStagesByRun(runId);
  const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(runId);
  const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(runId);
  const healthSnapshots = await task028ExpansionExecutionRepository.listHealthSnapshots(runId);
  const interventions = await task028ExpansionExecutionRepository.listInterventionRecords(runId);
  const audits = await task028ExpansionExecutionRepository.listAuditRecords(runId);

  const remainingBlockers: string[] = [];

  const criticalOversight = oversightItems.filter((o: any) => o.severity === 'critical' && o.status === 'open');
  if (criticalOversight.length > 0) remainingBlockers.push(`${criticalOversight.length} unresolved critical oversight item(s).`);

  const highOversight = oversightItems.filter((o: any) => o.severity === 'high' && o.status === 'open');
  if (highOversight.length > 3) remainingBlockers.push(`${highOversight.length} unresolved high-severity oversight items.`);

  const privacyItems = oversightItems.filter((o: any) => o.requiresPrivacyReview && o.status === 'open');
  if (privacyItems.length > 0) remainingBlockers.push(`${privacyItems.length} unresolved privacy review item(s).`);

  const deenItems = oversightItems.filter((o: any) => o.requiresDeenReview && o.status === 'open');
  if (deenItems.length > 0) remainingBlockers.push(`${deenItems.length} unresolved Deen governance item(s).`);

  const socraticItems = oversightItems.filter((o: any) => o.requiresSocraticReview && o.status === 'open');
  if (socraticItems.length > 0) remainingBlockers.push(`${socraticItems.length} unresolved Socratic quality item(s).`);

  const curriculumItems = oversightItems.filter((o: any) => o.requiresCurriculumReview && o.status === 'open');
  if (curriculumItems.length > 0) remainingBlockers.push(`${curriculumItems.length} unresolved curriculum/source item(s).`);

  const allStagesPassed = stages.length > 0 && stages.every((s: any) => s.status === 'completed');
  if (!allStagesPassed && stages.length > 0) {
    const nonCompleted = stages.filter((s: any) => s.status !== 'completed').map((s: any) => `stage_${s.stageNumber}_${s.status}`);
    remainingBlockers.push(`Not all stages completed: ${nonCompleted.join(', ')}`);
  }

  const hasCriticalHealth = healthSnapshots.some((h: any) => (h as any).metadataSafeJson?.healthStatus === 'critical');
  if (hasCriticalHealth) remainingBlockers.push('Critical health status detected during execution.');

  const rollbackRecords = audits.filter((a: any) => a.action === 'rollback_executed' || a.action === 'rollback_completed');
  const rollbackPathProven = rollbackRecords.length > 0;

  const allGatesSafe = stages.length > 0 && criticalOversight.length === 0 && privacyItems.length === 0
    && deenItems.length === 0 && socraticItems.length === 0 && curriculumItems.length === 0
    && rollbackPathProven && !hasCriticalHealth;

  const reviewId = `cr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const safeToStartTask029 = allGatesSafe;

  return {
    run: runAny, reviewId, safeToStartTask029, remainingBlockers,
    safeExecutionSummary: `Run ${runId} for school ${schoolId} completed with status ${runAny.status}. ${stages.length} stages, ${participants.length} participants.`,
    safeLearningQualitySummary: `${stages.filter((s: any) => s.status === 'completed').length}/${stages.length} stages completed. ${participants.filter((p: any) => p.activationStatus === 'active').length} active participants.`,
    safeTeacherOversightSummary: `${oversightItems.filter((o: any) => o.requiresTeacherReview).length} teacher review items.`,
    safeInterventionSummary: `${interventions.length} interventions recorded.`,
    safeIncidentSummary: `${oversightItems.filter((o: any) => o.severity === 'high' || o.severity === 'critical').length} incidents.`,
    privacyBoundaryStatus: oversightItems.filter((o: any) => o.requiresPrivacyReview && o.status === 'open').length === 0 ? 'passed' : 'blocked',
    safeguardingBoundaryStatus: oversightItems.filter((o: any) => o.severity === 'critical' && o.status === 'open').length === 0 ? 'passed' : 'blocked',
    deenContentBoundaryStatus: oversightItems.filter((o: any) => o.requiresDeenReview && o.status === 'open').length === 0 ? 'passed' : 'blocked',
    socraticIntegrityStatus: oversightItems.filter((o: any) => o.requiresSocraticReview && o.status === 'open').length === 0 ? 'passed' : 'blocked',
    rollbackReadinessStatus: rollbackPathProven ? 'proven' : 'not_proven',
  };
}

export async function generateCompletionReview(
  executionRunId: string,
): Promise<OldCompletionReviewResult> {
  try {
    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    if (!run) {
      return { ok: false, reviewId: '', safeToStartTask029: false, safeMessage: 'Execution run not found.', reasonCodes: ['execution_run_not_found'] };
    }
    const schoolId = (run as any).schoolId;
    const data = await buildCompletionReviewData(executionRunId, schoolId);

    await task028ExpansionExecutionRepository.createCompletionReview({
      executionRunId,
      pilotProgramId: data.run.pilotProgramId,
      schoolId,
      safeSummary: `Completion review generated. safeToStartTask029: ${data.safeToStartTask029}. Blockers: ${data.remainingBlockers.length}.`,
      recommendedDecision: data.safeToStartTask029 ? 'ready_for_larger_school_rollout' : 'do_not_expand_further',
      safeToStartNextTask: data.safeToStartTask029,
      blockingIssues: data.remainingBlockers,
    });

    return {
      ok: true,
      reviewId: data.reviewId,
      safeToStartTask029: data.safeToStartTask029,
      safeMessage: `Completion review generated. safeToStartTask029: ${data.safeToStartTask029}. Blockers: ${data.remainingBlockers.length}.`,
      reasonCodes: [],
    };
  } catch (err: any) {
    return { ok: false, reviewId: '', safeToStartTask029: false, safeMessage: err?.safeMessage || 'Completion review failed.', reasonCodes: err?.reasonCodes || ['completion_review_failed'] };
  }
}

export async function generateControlledExpansionCompletionReview(
  runId: string,
  schoolId: string,
): Promise<Task028ExpansionCompletionReview> {
  const errors = validateTask028ExpansionCompletionReviewInput({ runId, schoolId });
  if (errors.length > 0) throw createSafeTask028ValidationError('Invalid completion review input.', errors);

  const data = await buildCompletionReviewData(runId, schoolId);

  const review: Task028ExpansionCompletionReview = {
    runId,
    schoolId,
    runStatus: data.run.status,
    safeExecutionSummary: data.safeExecutionSummary,
    safeLearningQualitySummary: data.safeLearningQualitySummary,
    safeTeacherOversightSummary: data.safeTeacherOversightSummary,
    safeInterventionSummary: data.safeInterventionSummary,
    safeIncidentSummary: data.safeIncidentSummary,
    privacyBoundaryStatus: data.privacyBoundaryStatus,
    safeguardingBoundaryStatus: data.safeguardingBoundaryStatus,
    deenContentBoundaryStatus: data.deenContentBoundaryStatus,
    socraticIntegrityStatus: data.socraticIntegrityStatus,
    rollbackReadinessStatus: data.rollbackReadinessStatus,
    safeToStartTask029: data.safeToStartTask029,
    remainingBlockers: data.remainingBlockers,
    generatedAt: nowISO(),
  };

  await task028ExpansionExecutionRepository.createCompletionReview({
    executionRunId: runId,
    pilotProgramId: data.run.pilotProgramId,
    schoolId,
    safeSummary: `Completion review generated. safeToStartTask029: ${data.safeToStartTask029}. Blockers: ${data.remainingBlockers.length}.`,
    recommendedDecision: data.safeToStartTask029 ? 'ready_for_larger_school_rollout' : 'do_not_expand_further',
    safeToStartNextTask: data.safeToStartTask029,
    blockingIssues: data.remainingBlockers,
  });

  return review;
}
