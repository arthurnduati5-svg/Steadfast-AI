import {
  Task036LaunchWindowInput,
  Task036LaunchWindowResult,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function validateLaunchWindow(
  input: Task036LaunchWindowInput
): Promise<Task036LaunchWindowResult> {
  const blockingIssues: string[] = [];

  const now = new Date();
  const startAt = new Date(input.approvedStartAt);
  const endAt = new Date(input.approvedEndAt);

  const isExpired = now > endAt;
  const isOpenEnded = !input.approvedEndAt || input.approvedEndAt === '';
  const isWithinApprovedTime = !isExpired && !isOpenEnded && now >= startAt && now <= endAt;
  const hasRollbackPlan = !!input.rollbackPlanId;
  const hasPausePlan = !!input.pausePlanId;
  const hasKillSwitch = !!input.killSwitchId;

  if (isExpired) blockingIssues.push('launch_window_expired');
  if (isOpenEnded) blockingIssues.push('launch_window_open_ended');
  if (!isWithinApprovedTime) blockingIssues.push('outside_approved_time');
  if (!hasRollbackPlan) blockingIssues.push('missing_rollback_plan');
  if (!hasPausePlan) blockingIssues.push('missing_pause_plan');
  if (!hasKillSwitch) blockingIssues.push('missing_kill_switch');
  if (!input.launchWindowId) blockingIssues.push('missing_launch_window_id');
  if (!input.schoolId) blockingIssues.push('missing_school_id');
  if (!input.tenantId) blockingIssues.push('missing_tenant_id');

  const passed = blockingIssues.length === 0;

  const result: Task036LaunchWindowResult = {
    ok: passed,
    passed,
    launchWindowId: input.launchWindowId,
    schoolId: input.schoolId,
    tenantId: input.tenantId,
    approvedStartAt: input.approvedStartAt,
    approvedEndAt: input.approvedEndAt,
    approvalReferenceId: input.approvalReferenceId,
    rollbackPlanId: input.rollbackPlanId,
    pausePlanId: input.pausePlanId,
    killSwitchId: input.killSwitchId,
    operatorId: input.operatorId,
    isExpired,
    isOpenEnded,
    isWithinApprovedTime,
    hasRollbackPlan,
    hasPausePlan,
    hasKillSwitch,
    blockingIssues,
  };

  task036Repository.saveLaunchWindow(input.launchWindowId, result);
  return result;
}

export const evaluateLaunchWindow = validateLaunchWindow;
