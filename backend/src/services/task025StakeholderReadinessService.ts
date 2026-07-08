import type {
  Task025StakeholderReadinessInput,
  Task025StakeholderReadinessStatus,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export interface StakeholderReadinessResult {
  stakeholderStatus: Task025StakeholderReadinessStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  teacherCount: number;
  adminCount: number;
  supportStaffCount: number;
  safeguardingOwnerAssigned: boolean;
}

export async function evaluateStakeholderReadiness(
  input: Task025StakeholderReadinessInput,
): Promise<StakeholderReadinessResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!input.teacherIds || input.teacherIds.length === 0) {
    blockers.push({
      type: 'teacher_workflow',
      severity: 'high',
      safeDescription: 'No teachers identified for pilot stakeholder readiness.',
      requiredAction: 'Identify at least one teacher for the pilot.',
    });
  }

  if (!input.adminIds || input.adminIds.length === 0) {
    blockers.push({
      type: 'admin_acceptance',
      severity: 'high',
      safeDescription: 'No admins identified for pilot stakeholder readiness.',
      requiredAction: 'Identify at least one admin for pilot oversight.',
    });
  }

  const safeguardingAssigned = !!input.safeguardingOwnerId && input.safeguardingOwnerId.trim() !== '';
  if (!safeguardingAssigned) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'No safeguarding owner identified.',
      requiredAction: 'Assign a safeguarding escalation owner.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const status: Task025StakeholderReadinessStatus = hasHighBlocker ? 'stakeholder_blocked' : 'stakeholder_ready';
  const riskLevel: Task025RiskLevel = hasHighBlocker ? 'high' : 'low';

  return {
    stakeholderStatus: status,
    riskLevel,
    safeSummary: hasHighBlocker
      ? `Stakeholder readiness has ${blockers.length} blocker(s).`
      : `Stakeholder readiness confirmed: ${input.teacherIds.length} teacher(s), ${input.adminIds.length} admin(s), ${(input.supportStaffIds || []).length} support staff.`,
    safeBlockers: blockers,
    teacherCount: input.teacherIds.length,
    adminCount: input.adminIds.length,
    supportStaffCount: (input.supportStaffIds || []).length,
    safeguardingOwnerAssigned: safeguardingAssigned,
  };
}
