import type { Task034ExpandedMonitoringSnapshot } from '../contracts/task034ControlledRolloutContracts';

export function generateExpandedMonitoringSnapshot(
  overrides?: Partial<Task034ExpandedMonitoringSnapshot>,
): Task034ExpandedMonitoringSnapshot {
  const defaultSnapshot: Task034ExpandedMonitoringSnapshot = {
    rolloutRunId: 'rollout_run_task034_safe',
    schoolId: 'school_task034_limited_rollout_safe',
    tenantId: 'tenant_task034_limited_rollout_safe',
    cohortId: 'cohort_task034_limited_rollout_safe',
    generatedAt: new Date().toISOString(),
    windowStart: new Date(Date.now() - 3600000).toISOString(),
    windowEnd: new Date().toISOString(),
    eligibleStudentCount: 400,
    approvedRolloutStudentCount: 80,
    activeRolloutStudentCount: 80,
    rolloutPercent: 20,
    sessionCount: 160,
    successfulSessionCount: 158,
    safeDenialCount: 2,
    errorCount: 0,
    schoolAuthDenialCount: 0,
    rolloutMembershipDenialCount: 0,
    curriculumGateDenialCount: 0,
    sourceGateDenialCount: 0,
    socraticGateDenialCount: 0,
    deenGateDenialCount: 0,
    privacyGateDenialCount: 0,
    aiBeforeGateBlockCount: 0,
    memoryBeforeGateBlockCount: 0,
    teacherAcknowledgementCount: 3,
    studentNoticeReadyCount: 80,
    studentSafeFeedbackCount: 20,
    incidentSignalCount: 0,
    p50LatencyMs: 450,
    p95LatencyMs: 1200,
    pauseActive: false,
    killSwitchActive: false,
    rollbackActive: false,
    openRolloutPerformed: false,
    schoolWideRolloutPerformed: false,
    hundredPercentRolloutPerformed: false,
    rawPrivateDataExposed: false,
    safeEventSummaries: [
      'Controlled limited rollout active with 80 approved students',
      'All runtime gates passing',
      'No privacy incidents detected',
      'Staff acknowledgements recorded',
    ],
  };

  return { ...defaultSnapshot, ...overrides };
}
