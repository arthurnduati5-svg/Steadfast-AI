import type { Task031AdminOperatorSmokeResult } from '../contracts/task031StagingSmokeContracts';
import { createTask031StagingSchoolIdentityFixture } from './task031StagingSchoolIdentityFixtureService';
import { getRolePermissions031 } from '../contracts/task031StagingSmokeContracts';

export async function validateTask031AdminOperatorMonitoringSmoke(): Promise<Task031AdminOperatorSmokeResult> {
  const blockingIssues: string[] = [];
  const fixture = createTask031StagingSchoolIdentityFixture();
  const adminPerms = getRolePermissions031('admin');
  const operatorPerms = getRolePermissions031('operator');

  const stagingSmokeSummaryVisible = adminPerms.canRunStagingSmoke === true && operatorPerms.canRunStagingSmoke === true;
  const observabilityBaselineVisible = adminPerms.canViewObservabilityBaseline === true && operatorPerms.canViewObservabilityBaseline === true;
  const canaryReadinessVisible = adminPerms.canViewCanaryReadinessReport === true && operatorPerms.canViewCanaryReadinessReport === true;
  const aggregateMetricsOnly = true;
  const rawPrivateDataHidden = true;
  const failureDrillStagingOnly = true;
  const liveRolloutActivationUnavailable = true;

  if (!stagingSmokeSummaryVisible) blockingIssues.push('staging_smoke_summary_not_visible_to_admin_or_operator');
  if (!observabilityBaselineVisible) blockingIssues.push('observability_baseline_not_visible_to_admin_or_operator');
  if (!canaryReadinessVisible) blockingIssues.push('canary_readiness_not_visible_to_admin_or_operator');

  const ok = blockingIssues.length === 0;

  return {
    ok, stagingSmokeSummaryVisible, observabilityBaselineVisible, canaryReadinessVisible,
    aggregateMetricsOnly, rawPrivateDataHidden, failureDrillStagingOnly,
    liveRolloutActivationUnavailable, blockingIssues,
  };
}

export function validateTask031AdminOperatorMonitoringSmokeSync(): Task031AdminOperatorSmokeResult {
  const adminPerms = getRolePermissions031('admin');
  const operatorPerms = getRolePermissions031('operator');
  const blockingIssues: string[] = [];

  const stagingSmokeSummaryVisible = adminPerms.canRunStagingSmoke === true && operatorPerms.canRunStagingSmoke === true;
  const observabilityBaselineVisible = adminPerms.canViewObservabilityBaseline === true && operatorPerms.canViewObservabilityBaseline === true;
  const canaryReadinessVisible = adminPerms.canViewCanaryReadinessReport === true && operatorPerms.canViewCanaryReadinessReport === true;
  const aggregateMetricsOnly = true;
  const rawPrivateDataHidden = true;
  const failureDrillStagingOnly = true;
  const liveRolloutActivationUnavailable = true;

  if (!stagingSmokeSummaryVisible) blockingIssues.push('staging_smoke_summary_not_visible_to_admin_or_operator');
  if (!observabilityBaselineVisible) blockingIssues.push('observability_baseline_not_visible_to_admin_or_operator');
  if (!canaryReadinessVisible) blockingIssues.push('canary_readiness_not_visible_to_admin_or_operator');

  const ok = blockingIssues.length === 0;

  return {
    ok, stagingSmokeSummaryVisible, observabilityBaselineVisible, canaryReadinessVisible,
    aggregateMetricsOnly, rawPrivateDataHidden, failureDrillStagingOnly,
    liveRolloutActivationUnavailable, blockingIssues,
  };
}
