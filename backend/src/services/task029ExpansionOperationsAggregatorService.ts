import type {
  Task029OperationsDashboard,
  ExpansionOperationsRole,
  Task029StageOperationsSummary,
  Task029HealthOperationsSummary,
  Task029SafeAuditEvent,
  Task029InterventionQueueOperationsSummary,
  Task029IncidentOperationsSummary,
  Task029RollbackCommandResult,
  Task029CompletionReviewSummary,
  Task029LearnerOwnStatus,
} from '../contracts/task029ExpansionOperationsContracts';
import { resolveExpansionOpsRole, getRolePermissionsList } from '../contracts/task029ExpansionOperationsContracts';
import { loadTask028ProofForTask029, type Task029ProofLoaderResult } from './task029Task028ProofLoaderService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

export interface AggregatorResult<T> {
  ok: boolean;
  data: T | null;
  blockingIssues: string[];
  safeMessage: string;
}

export async function getOperationsDashboard(
  actorRole: string,
  executionRunId?: string,
): Promise<AggregatorResult<Task029OperationsDashboard>> {
  const role = resolveExpansionOpsRole(actorRole);
  const permissions = getRolePermissionsList(role);

  const proofResult = await loadTask028ProofForTask029();
  const blockingIssues: string[] = [...proofResult.blockingIssues];

  const emptyDashboard: Record<string, unknown> = {
    schoolId: '',
    task028ProofStatus: { ok: proofResult.ok, safeToStartTask029: proofResult.proofStatus.safeToStartTask029, blockingIssues },
    runStatus: 'unavailable',
    cohortSafeCounts: { approved: 0, active: 0, blocked: 0, rolledBack: 0 },
    stageSafeCounts: { total: 0, active: 0, paused: 0, completed: 0 },
    healthRiskLevel: 'unknown',
    operationsRiskLevel: 'unknown',
    privacyRiskLevel: 'unknown',
    safeguardingRiskLevel: 'unknown',
    contentGovernanceRiskLevel: 'unknown',
    deenContentRiskLevel: 'unknown',
    socraticRiskLevel: 'unknown',
    interventionQueueCounts: { total: 0, open: 0, critical: 0 },
    incidentCounts: { total: 0, open: 0, critical: 0 },
    rollbackReadinessStatus: 'unknown',
    teacherOversightCounts: { assigned: 0, reviewNeeded: 0 },
    safeNextActionLabels: [],
    allowedControlActions: [],
    blockedControlActions: [],
    lastAuditEventAt: '',
    generatedAt: new Date().toISOString(),
  };

  if (!proofResult.ok) {
    return {
      ok: false,
      data: emptyDashboard as unknown as Task029OperationsDashboard,
      blockingIssues,
      safeMessage: proofResult.safeMessage,
    };
  }

  if (!executionRunId) {
    return {
      ok: true,
      data: emptyDashboard as unknown as Task029OperationsDashboard,
      blockingIssues,
      safeMessage: 'No execution run ID provided. Dashboard shows proof status only.',
    };
  }

  try {
    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    const runAny = run as any;

    const stages = await task028ExpansionExecutionRepository.listStagesByRun(executionRunId);
    const stageSummary: Task029StageOperationsSummary[] = (stages as any[]).map((s: any) => ({
      stageId: s.id || '',
      stageNumber: s.stageNumber,
      status: s.status,
      plannedSafeLearnerCount: s.plannedStudentCount ?? 0,
      activeSafeLearnerCount: s.activatedStudentCount ?? 0,
      blockedSafeLearnerCount: 0,
      safeSubjectScopeCount: Array.isArray(s.allowedSubjectIds) ? s.allowedSubjectIds.length : 0,
      safeCurriculumScopeCount: Array.isArray(s.allowedCurriculumScopes) ? s.allowedCurriculumScopes.length : 0,
      startedAt: s.startedAt || '',
      pausedAt: s.pausedAt || '',
      completedAt: s.completedAt || '',
      safeSummary: s.safeSummary || '',
    }));

    const healthSnapshots = await task028ExpansionExecutionRepository.listHealthSnapshots(executionRunId);
    const latestHealth = healthSnapshots.length > 0 ? (healthSnapshots[0] as any) : null;

    const healthSummary: Task029HealthOperationsSummary = latestHealth ? {
      latestHealthStatus: latestHealth.healthClassification || 'unknown',
      operationsRiskLevel: latestHealth.operationsRiskLevel || 'unknown',
      privacyRiskLevel: latestHealth.privacyRiskLevel || 'unknown',
      safeguardingRiskLevel: latestHealth.safeguardingRiskLevel || 'unknown',
      contentGovernanceRiskLevel: latestHealth.contentGovernanceRiskLevel || 'unknown',
      deenContentRiskLevel: latestHealth.deenContentRiskLevel || 'unknown',
      socraticRiskLevel: latestHealth.socraticRiskLevel || 'unknown',
      blockedAccessCount: latestHealth.blockedExpandedSessionStarts ?? 0,
      supportNeededCount: latestHealth.oversightItemCount ?? 0,
      interventionCount: latestHealth.interventionCount ?? 0,
      incidentCount: latestHealth.incidentBridgeCount ?? 0,
      rollbackReadinessStatus: latestHealth.rollbackReadinessStatus || 'unknown',
      recommendedControlAction: latestHealth.recommendedControlAction || 'none',
      safeReasonCodes: latestHealth.reasonCodes || [],
    } : {
      latestHealthStatus: 'unknown', operationsRiskLevel: 'unknown', privacyRiskLevel: 'unknown',
      safeguardingRiskLevel: 'unknown', contentGovernanceRiskLevel: 'unknown',
      deenContentRiskLevel: 'unknown', socraticRiskLevel: 'unknown',
      blockedAccessCount: 0, supportNeededCount: 0, interventionCount: 0, incidentCount: 0,
      rollbackReadinessStatus: 'unknown', recommendedControlAction: 'none', safeReasonCodes: [],
    };

    const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(executionRunId);
    const oversightItemsAny = oversightItems as any[];

    const audits = await task028ExpansionExecutionRepository.listAuditRecords(executionRunId);
    const auditsAny = audits as any[];

    const interventions = await task028ExpansionExecutionRepository.listInterventionRecords(executionRunId);
    const interventionsAny = interventions as any[];

    const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(executionRunId);
    const participantsAny = participants as any[];

    const cohortActive = participantsAny.filter((p: any) => p.activationStatus === 'active').length;
    const cohortBlocked = participantsAny.filter((p: any) => p.activationStatus === 'blocked').length;
    const cohortRolledBack = participantsAny.filter((p: any) => p.activationStatus === 'rolled_back').length;

    const stageActive = stageSummary.filter((s) => s.status === 'active').length;
    const stagePaused = stageSummary.filter((s) => s.status === 'paused').length;
    const stageCompleted = stageSummary.filter((s) => s.status === 'completed').length;

    const interventionOpen = interventionsAny.filter((iv: any) => iv.status === 'requested' || iv.status === 'open').length;
    const interventionCritical = interventionsAny.filter((iv: any) => iv.reasonCodes?.includes('critical')).length;

    const dashboard: Task029OperationsDashboard = {
      schoolId: runAny.schoolId || '',
      expansionRunId: executionRunId,
      task028ProofStatus: { ok: proofResult.ok, safeToStartTask029: proofResult.proofStatus.safeToStartTask029, blockingIssues },
      runStatus: runAny.status || 'unknown',
      cohortSafeCounts: {
        approved: participantsAny.length,
        active: cohortActive,
        blocked: cohortBlocked,
        rolledBack: cohortRolledBack,
      },
      stageSafeCounts: {
        total: stageSummary.length,
        active: stageActive,
        paused: stagePaused,
        completed: stageCompleted,
      },
      healthRiskLevel: latestHealth?.healthClassification || 'unknown',
      operationsRiskLevel: latestHealth?.operationsRiskLevel || 'unknown',
      privacyRiskLevel: latestHealth?.privacyRiskLevel || 'unknown',
      safeguardingRiskLevel: latestHealth?.safeguardingRiskLevel || 'unknown',
      contentGovernanceRiskLevel: latestHealth?.contentGovernanceRiskLevel || 'unknown',
      deenContentRiskLevel: latestHealth?.deenContentRiskLevel || 'unknown',
      socraticRiskLevel: latestHealth?.socraticRiskLevel || 'unknown',
      interventionQueueCounts: {
        total: interventionsAny.length,
        open: interventionOpen,
        critical: interventionCritical,
      },
      incidentCounts: { total: 0, open: 0, critical: 0 },
      rollbackReadinessStatus: latestHealth?.rollbackReadinessStatus || 'unknown',
      teacherOversightCounts: {
        assigned: oversightItemsAny.filter((o: any) => o.assignedRole === 'teacher').length,
        reviewNeeded: oversightItemsAny.filter((o: any) => o.status === 'open').length,
      },
      safeNextActionLabels: [],
      allowedControlActions: [],
      blockedControlActions: [],
      lastAuditEventAt: auditsAny.length > 0 ? (auditsAny[0].createdAt || auditsAny[0].timestamp || '') : '',
      generatedAt: new Date().toISOString(),
    };

    return { ok: true, data: dashboard, blockingIssues, safeMessage: 'Dashboard loaded.' };
  } catch (err: unknown) {
    blockingIssues.push('dashboard_aggregation_failed');
    return {
      ok: false,
      data: { ...emptyDashboard, blockingIssues } as unknown as Task029OperationsDashboard,
      blockingIssues,
      safeMessage: 'Failed to aggregate dashboard data.',
    };
  }
}

export async function getStudentOwnStatusView(
  actorIdHash: string,
  executionRunId?: string,
): Promise<AggregatorResult<Task029LearnerOwnStatus>> {
  const defaultView: Task029LearnerOwnStatus = {
    learnerSafeRef: actorIdHash,
    schoolId: '',
    expansionRunId: executionRunId || '',
    isInApprovedExpandedCohort: false,
    accessStatus: 'unavailable',
    pauseStatus: 'none',
    rollbackStatus: 'none',
    safeMessage: 'Expanded pilot access is not available for your account.',
    nextSafeActionLabel: 'Continue with your normal Steadfast learning space.',
    supportAvailable: false,
  };

  if (!executionRunId) {
    return { ok: true, data: defaultView, blockingIssues: [], safeMessage: 'No execution run context.' };
  }

  try {
    const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(executionRunId);
    const participantsAny = participants as any[];
    const matched = participantsAny.find((p: any) => p.actorIdHash === actorIdHash);

    if (!matched) {
      return {
        ok: true,
        data: {
          ...defaultView,
          accessStatus: 'not_in_cohort',
          safeMessage: 'Your account is not part of the current expanded pilot cohort.',
          nextSafeActionLabel: 'Continue with your normal Steadfast learning space.',
        },
        blockingIssues: [],
        safeMessage: 'Student is not in the expanded cohort.',
      };
    }

    const activationStatus = matched.activationStatus || 'pending';
    const available = activationStatus === 'active';

    const statusMessages: Record<string, string> = {
      active: 'Expanded pilot access is available for your account.',
      pending: 'Your expanded pilot access is pending activation.',
      blocked: 'Expanded pilot access is blocked for your account.',
      rolled_back: 'The expanded pilot has been rolled back.',
    };

    return {
      ok: true,
      data: {
        learnerSafeRef: actorIdHash,
        schoolId: matched.schoolId || '',
        expansionRunId: executionRunId,
        isInApprovedExpandedCohort: available,
        accessStatus: activationStatus,
        pauseStatus: 'none',
        rollbackStatus: activationStatus === 'rolled_back' ? 'rolled_back' : 'none',
        safeMessage: statusMessages[activationStatus] || 'Expanded pilot access status retrieved.',
        nextSafeActionLabel: available
          ? 'You can access the expanded learning features when starting a new session.'
          : 'Continue with your normal Steadfast learning space.',
        supportAvailable: !available,
      },
      blockingIssues: [],
      safeMessage: statusMessages[activationStatus] || 'Student status retrieved.',
    };
  } catch {
    return { ok: true, data: defaultView, blockingIssues: [], safeMessage: 'Could not retrieve student status.' };
  }
}
