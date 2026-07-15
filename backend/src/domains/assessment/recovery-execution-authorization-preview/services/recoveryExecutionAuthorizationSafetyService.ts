import { RecoveryExecutionAuthorizationPreviewPolicyDefinitions } from '../policies/recoveryExecutionAuthorizationPreviewPolicyDefinitions';

export class RecoveryExecutionAuthorizationSafetyService {
  assertNoLiveAuthorization(actorRole: string): boolean {
    const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check(
      'RECOVERY_EXECUTION_NO_LIVE_AUTHORIZATION',
      actorRole,
    );
    if (decision.denied) {
      throw new Error(`Safety check failed: no_live_authorization - ${decision.reasonCodes.join(', ')}`);
    }
    return true;
  }

  assertNoLiveExecution(actorRole: string): boolean {
    const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check(
      'RECOVERY_EXECUTION_NO_LIVE_EXECUTION',
      actorRole,
    );
    if (decision.denied) {
      throw new Error(`Safety check failed: no_live_execution - ${decision.reasonCodes.join(', ')}`);
    }
    return true;
  }

  assertNoLiveClosure(actorRole: string): boolean {
    const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check(
      'RECOVERY_EXECUTION_NO_LIVE_CLOSURE',
      actorRole,
    );
    if (decision.denied) {
      throw new Error(`Safety check failed: no_live_closure - ${decision.reasonCodes.join(', ')}`);
    }
    return true;
  }

  assertNoLiveActivation(actorRole: string): boolean {
    const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check(
      'RECOVERY_EXECUTION_NO_LIVE_ACTIVATION',
      actorRole,
    );
    if (decision.denied) {
      throw new Error(`Safety check failed: no_live_activation - ${decision.reasonCodes.join(', ')}`);
    }
    return true;
  }

  assertNoScoreMutation(actorRole: string): boolean {
    const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check(
      'RECOVERY_EXECUTION_NO_SCORE_MUTATION',
      actorRole,
    );
    if (decision.denied) {
      throw new Error(`Safety check failed: no_score_mutation - ${decision.reasonCodes.join(', ')}`);
    }
    return true;
  }

  assertNoMasteryMutation(actorRole: string): boolean {
    const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check(
      'RECOVERY_EXECUTION_NO_MASTERY_MUTATION',
      actorRole,
    );
    if (decision.denied) {
      throw new Error(`Safety check failed: no_mastery_mutation - ${decision.reasonCodes.join(', ')}`);
    }
    return true;
  }
}
