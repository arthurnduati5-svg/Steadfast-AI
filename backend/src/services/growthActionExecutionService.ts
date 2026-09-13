import type {
  GrowthActionPlan,
  GrowthActionExecutionResult,
  GrowthActionExecutionStatus,
} from '../contracts/growthActionContracts';
import { assertSafeGrowthActionInput } from './growthActionPrivacyGuard';

export interface ExecutionInput {
  actionPlan: GrowthActionPlan;
  execute: boolean;
  replaceExisting?: boolean;
}

export function executeGrowthAction(input: ExecutionInput): GrowthActionExecutionResult {
  const { actionPlan, execute } = input;

  if (!execute) {
    return {
      success: true,
      executionStatus: 'resolved',
      actionPlanId: actionPlan.id,
      safeMetadata: {
        mode: actionPlan.recommendedMode,
        destination: actionPlan.recommendedDestination,
      },
    };
  }

  if (actionPlan.routingDecision !== 'allowed') {
    return {
      success: false,
      executionStatus: 'blocked',
      actionPlanId: actionPlan.id,
      failureReasonCode: 'routing_policy_blocked',
      safeMetadata: {
        routingDecision: actionPlan.routingDecision,
      },
    };
  }

  if (actionPlan.executionStatus === 'blocked' || actionPlan.executionStatus === 'cancelled') {
    return {
      success: false,
      executionStatus: 'blocked',
      actionPlanId: actionPlan.id,
      failureReasonCode: 'plan_not_executable',
      safeMetadata: {
        planStatus: actionPlan.executionStatus,
      },
    };
  }

  const mode = actionPlan.recommendedMode;
  if (!mode || mode === 'none' || mode === 'content_gap_referral' || mode === 'deen_referral' || mode === 'teacher_support') {
    return {
      success: true,
      executionStatus: 'resolved',
      actionPlanId: actionPlan.id,
      safeMetadata: {
        mode,
        note: 'Mode does not require automated execution. Referral or support mode selected.',
      },
    };
  }

  const modeStarted = attemptStartMode(mode, actionPlan);

  if (!modeStarted) {
    return {
      success: false,
      executionStatus: 'failed',
      actionPlanId: actionPlan.id,
      failureReasonCode: 'mode_start_failed',
      safeMetadata: {
        mode,
      },
    };
  }

  return {
    success: true,
    executionStatus: 'executed',
    actionPlanId: actionPlan.id,
    modeSessionId: `${mode}-${actionPlan.studentId}-${Date.now()}`,
    safeMetadata: {
      mode,
      destination: actionPlan.recommendedDestination,
      startedAt: new Date().toISOString(),
    },
  };
}

function attemptStartMode(mode: string, _actionPlan: GrowthActionPlan): boolean {
  const executableModes = ['revision', 'quiz', 'teach_back', 'focus', 'exam'];
  if (executableModes.includes(mode)) {
    return true;
  }
  return false;
}
