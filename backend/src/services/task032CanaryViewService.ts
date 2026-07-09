import type { Task032CanarySafeView } from '../contracts/task032ControlledCanaryActivationContracts';
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
