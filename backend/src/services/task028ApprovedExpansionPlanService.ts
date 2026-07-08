import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Task028ApprovedExpansionPlan } from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028ApprovedExpansionPlanInput,
  rejectTask028ForbiddenFields,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

interface LoadApprovedExpansionPlanInput {
  schoolId: string;
  proposalId: string;
  governanceDecisionId: string;
}

export async function loadApprovedExpansionPlan(
  input: LoadApprovedExpansionPlanInput,
): Promise<Task028ApprovedExpansionPlan> {
  const errors = validateTask028ApprovedExpansionPlanInput(input);
  if (errors.length > 0) {
    throw createSafeTask028ValidationError('Invalid input for approved expansion plan.', errors);
  }

  const reportPath = resolve(
    __dirname, '../../../docs/ops/task-027/task-027-pilot-expansion-report.json',
  );

  let raw: string;
  try {
    raw = readFileSync(reportPath, 'utf-8');
  } catch {
    throw createSafeTask028ValidationError('Task 027 expansion report not found.', ['task027_report_not_found']);
  }

  let report: Record<string, unknown>;
  try {
    report = JSON.parse(raw);
  } catch {
    throw createSafeTask028ValidationError('Task 027 expansion report is not valid JSON.', ['task027_report_invalid_json']);
  }

  if (!report.decisionService || (report.decisionService as any).safeToStartTask028 !== true) {
    throw createSafeTask028ValidationError('Task 027 report does not approve expansion.', ['task027_not_approved']);
  }

  const approvedStartWindow =
    (report as any).approvedStartWindow ?? (report as any).generatedAt ?? new Date().toISOString();
  const gitCommit = (report as any).gitCommit ?? 'unknown';

  const plan: Task028ApprovedExpansionPlan = {
    schoolId: input.schoolId,
    proposalId: input.proposalId,
    governanceDecisionId: input.governanceDecisionId,
    pilotRunId: `pilot_${input.schoolId}_${input.proposalId}`,
    expansionScopeLabels: ['controlled_pilot_expansion'],
    approvedCohortIds: [],
    approvedLearnerSafeRefs: [],
    approvedTeacherSafeRefs: [],
    approvedSupportOwnerSafeRefs: [],
    curriculumSourceScopeIds: [],
    deenSourceScopeIds: [],
    operationsMonitoringPlanId: `monitor_${input.schoolId}_${input.proposalId}`,
    pauseRollbackPlanId: `rollback_${input.schoolId}_${input.proposalId}`,
    approvedStartWindow,
    safeConditions: {
      task027AcceptancePassed: true,
      gitCommit,
      reportGeneratedAt: report.generatedAt,
      decisionFinal: report.finalDecision,
      blockingIssues: report.blockingIssues,
    },
  };

  return plan;
}
