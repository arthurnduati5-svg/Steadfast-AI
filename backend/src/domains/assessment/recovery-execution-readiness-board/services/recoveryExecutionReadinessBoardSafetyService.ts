import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardPolicyDecision } from '../contracts';
import { RECOVERY_EXECUTION_READINESS_BOARD_POLICIES } from '../policies/recoveryExecutionReadinessBoardPolicyDefinitions';

export class RecoveryExecutionReadinessBoardSafetyService {
  private checkPolicy(policyName: string, context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    const policy = RECOVERY_EXECUTION_READINESS_BOARD_POLICIES[policyName];
    if (!policy) return { allowed: false, reason: 'Policy not found', requiredRole: 'none', policyFamily: policyName };
    if (policy.allowedRoles.includes(context.actorRole)) {
      return { allowed: true, reason: `${context.actorRole} is allowed by ${policyName}`, requiredRole: context.actorRole, policyFamily: policyName };
    }
    return { allowed: false, reason: `${context.actorRole} is blocked by ${policyName}`, requiredRole: 'none', blockedReason: 'Role not in allowed list', policyFamily: policyName };
  }

  checkNoLiveBoardAction(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_BOARD_ACTION', context);
  }

  checkNoLiveAuthorization(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_AUTHORIZATION', context);
  }

  checkNoLiveExecution(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_EXECUTION', context);
  }

  checkNoLiveClosure(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_CLOSURE', context);
  }

  checkNoLiveActivation(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_ACTIVATION', context);
  }

  checkNoLiveCompletion(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_COMPLETION', context);
  }

  checkNoLiveAssignment(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_ASSIGNMENT', context);
  }

  checkNoLiveNotification(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_NOTIFICATION', context);
  }

  checkNoPortalPublish(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_PORTAL_PUBLISH', context);
  }

  checkNoScoreMutation(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_SCORE_MUTATION', context);
  }

  checkNoMasteryMutation(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_MASTERY_MUTATION', context);
  }

  checkNoRegradeExecution(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_REGRADE_EXECUTION', context);
  }

  checkNoGeneratedQuestion(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_GENERATED_QUESTION', context);
  }

  checkNoAINarrative(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_AI_NARRATIVE', context);
  }

  checkNoOCR(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_OCR', context);
  }

  checkNoPDF(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_PDF', context);
  }

  checkNoExternalSync(context: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardPolicyDecision {
    return this.checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_NO_EXTERNAL_SYNC', context);
  }
}
