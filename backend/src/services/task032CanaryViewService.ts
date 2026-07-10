import type { Task032CanarySafeView, Task032CanaryViewResult, Task032ActorRole } from '../contracts/task032ControlledCanaryActivationContracts';
import { resolveTask032ActorRole, isTask032AdminOperatorRole } from '../contracts/task032ControlledCanaryActivationContracts';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';

export async function createTask032CanarySafeView(input: {
  activationId: string;
  schoolId: string;
  status: string;
  configuredCohortSize: number;
  safeStage: string;
  healthBudgetStatus: string;
  privacyBoundaryStatus: string;
  rollbackReadinessStatus: string;
  incidentBridgeStatus: string;
  safeToStartTask033: boolean;
  reasonCodes: string[];
  createdAt: string;
}): Promise<Task032CanarySafeView> {
  const view: Task032CanarySafeView = {
    viewId: `view_${input.activationId}_${Date.now()}`,
    activationId: input.activationId,
    schoolId: input.schoolId,
    status: input.status,
    configuredCohortSize: input.configuredCohortSize,
    safeStage: input.safeStage,
    healthBudgetStatus: input.healthBudgetStatus,
    privacyBoundaryStatus: input.privacyBoundaryStatus,
    rollbackReadinessStatus: input.rollbackReadinessStatus,
    incidentBridgeStatus: input.incidentBridgeStatus,
    safeToStartTask033: input.safeToStartTask033,
    reasonCodes: input.reasonCodes,
    createdAt: input.createdAt
  };

  await task032ControlledCanaryActivationRepository.recordSafeView(view);
  return view;
}

export async function getTask032CanarySafeViewByActivationId(activationId: string): Promise<Task032CanarySafeView | null> {
  const views = await task032ControlledCanaryActivationRepository.listSafeViews();
  return views.find(v => v.activationId === activationId) || null;
}

export async function getTask032CanaryView(input: {
  actorRole: string;
  actorHash: string;
  canaryRunId: string;
  cohortId: string;
  canaryState: string;
  eligibleStudentCount: number;
  activatedStudentCount: number;
  activeSessionCount: number;
  requestCount: number;
  successfulRequestCount: number;
  safeDenialCount: number;
  errorCount: number;
  budgetStatus: string;
  controlAvailable: boolean;
  safeEventSummaries: string[];
  teacherHash?: string;
  teacherAssignmentScopes?: string[];
  studentHash?: string;
  needsAttentionCount?: number;
  safeAggregateLearningSignal?: string;
}): Promise<Task032CanaryViewResult> {
  const role = resolveTask032ActorRole(input.actorRole);

  if (role === 'unknown' || role === 'anonymous') {
    return {
      adminSummary: null,
      teacherSummary: null,
      studentStatus: null,
      denied: true,
    };
  }

  if (isTask032AdminOperatorRole(role)) {
    return {
      adminSummary: {
        canaryRunId: input.canaryRunId,
        aggregateMetrics: {
          eligibleStudentCount: input.eligibleStudentCount,
          activatedStudentCount: input.activatedStudentCount,
          activeSessionCount: input.activeSessionCount,
          requestCount: input.requestCount,
          successfulRequestCount: input.successfulRequestCount,
          safeDenialCount: input.safeDenialCount,
          errorCount: input.errorCount,
          needsAttentionCount: input.needsAttentionCount ?? 0,
        },
        controlAvailable: input.controlAvailable,
        safeEventSummaries: input.safeEventSummaries,
        rawPrivateDataExposed: false,
      },
      teacherSummary: null,
      studentStatus: null,
      denied: false,
    };
  }

  if (role === 'teacher') {
    return {
      adminSummary: null,
      teacherSummary: {
        eligibleStudentCount: input.eligibleStudentCount,
        rawChatExposed: false,
        privateMemoryExposed: false,
        safeguardingDetailsExposed: false,
        deenSensitiveTextExposed: false,
        adminControlsVisible: false,
      },
      studentStatus: null,
      denied: false,
    };
  }

  if (role === 'student' || role === 'learner') {
    const available = input.canaryState === 'active';
    const statusLabel = available ? 'available' : input.canaryState;
    return {
      adminSummary: null,
      teacherSummary: null,
      studentStatus: {
        available,
        statusLabel,
        otherStudentsVisible: false,
        monitoringInternalsVisible: false,
        teacherAdminNotesVisible: false,
        reportsVisible: false,
        controlActionsVisible: false,
      },
      denied: false,
    };
  }

  return {
    adminSummary: null,
    teacherSummary: null,
    studentStatus: null,
    denied: true,
  };
}
