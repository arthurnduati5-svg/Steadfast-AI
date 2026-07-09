import type { Task032CanaryRuntimeGuardInput, Task032CanaryRuntimeGuardResult, Task032ActorRole } from '../contracts/task032ControlledCanaryActivationContracts';
import { isTask032AdminOperatorRole, resolveTask032ActorRole } from '../contracts/task032ControlledCanaryActivationContracts';

export async function runTask032CanaryRuntimeGuard(input: Task032CanaryRuntimeGuardInput): Promise<Task032CanaryRuntimeGuardResult> {
  const blockingIssues: string[] = [];

  const verifiedSchoolContextRequired = !!input.schoolId;
  if (!input.schoolId) blockingIssues.push('missing_school_id');

  const actorRole = resolveTask032ActorRole(input.actorRole as string);
  const actorRoleValid = isTask032AdminOperatorRole(actorRole);
  if (!actorRoleValid) blockingIssues.push('invalid_actor_role_not_admin_operator');

  const task031ProofRequired = true;
  const approvedConfigRequired = true;
  const cohortEligibilityRequired = true;
  const consentAuthorizationReadinessRequired = true;
  const privacyBoundaryRequired = true;
  const healthBudgetRequired = true;
  const rollbackReadinessRequired = true;
  const incidentBridgeRequired = true;
  const noLiveAi = true;
  const noLiveConnector = true;
  const noLiveNotification = true;
  const noDeployment = true;
  const noRollout = true;
  const noObservation = true;

  return {
    ok: blockingIssues.length === 0,
    verifiedSchoolContextRequired,
    adminOperatorActorRequired: true,
    actorRoleValid,
    task031ProofRequired,
    approvedConfigRequired,
    cohortEligibilityRequired,
    consentAuthorizationReadinessRequired,
    privacyBoundaryRequired,
    healthBudgetRequired,
    rollbackReadinessRequired,
    incidentBridgeRequired,
    noLiveAi,
    noLiveConnector,
    noLiveNotification,
    noDeployment,
    noRollout,
    noObservation,
    blockingIssues
  };
}
