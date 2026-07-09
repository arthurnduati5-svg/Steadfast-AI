import type { Task032CanaryActivationRecord, Task032CanaryActivationStatus } from '../contracts/task032ControlledCanaryActivationContracts';
import { isTask032ValidStateTransition, TASK032_CANARY_STAGE_IDS } from '../contracts/task032ControlledCanaryActivationContracts';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import { v4 as uuidv4 } from 'uuid';

function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function createTask032CanaryActivationRecord(input: { schoolId: string, configuredCohortSize: number }): Promise<Task032CanaryActivationRecord> {
  const activationId = generateId();
  const now = new Date().toISOString();

  const record: Task032CanaryActivationRecord = {
    activationId,
    schoolId: input.schoolId,
    status: 'created',
    configuredCohortSize: input.configuredCohortSize,
    safeStage: 'created',
    healthBudgetStatus: 'not_run',
    privacyBoundaryStatus: 'not_run',
    rollbackReadinessStatus: 'not_run',
    incidentBridgeStatus: 'not_run',
    safeToStartTask033: false,
    reasonCodes: ['activation_record_created'],
    createdAt: now,
    updatedAt: now,
    blockers: []
  };

  await task032ControlledCanaryActivationRepository.createActivationRecord(record);
  return record;
}

export async function advanceTask032CanaryActivationState(activationId: string, nextStatus: Task032CanaryActivationStatus): Promise<Task032CanaryActivationRecord> {
  const record = await task032ControlledCanaryActivationRepository.getActivationRecord(activationId);
  if (!record) throw new Error(`Activation record not found: ${activationId}`);

  if (!isTask032ValidStateTransition(record.status, nextStatus)) {
    throw new Error(`Invalid state transition: ${record.status} -> ${nextStatus}`);
  }

  const updatedRecord: Task032CanaryActivationRecord = {
    ...record,
    status: nextStatus,
    safeStage: nextStatus,
    updatedAt: new Date().toISOString(),
    reasonCodes: [...record.reasonCodes, `transition:${record.status}->${nextStatus}`]
  };

  await task032ControlledCanaryActivationRepository.updateActivationRecord(activationId, updatedRecord);
  return updatedRecord;
}

export async function blockTask032CanaryActivation(activationId: string, blockers: string[]): Promise<Task032CanaryActivationRecord> {
  const record = await task032ControlledCanaryActivationRepository.getActivationRecord(activationId);
  if (!record) throw new Error(`Activation record not found: ${activationId}`);

  const updatedRecord: Task032CanaryActivationRecord = {
    ...record,
    status: 'blocked',
    safeStage: 'blocked',
    updatedAt: new Date().toISOString(),
    blockers: [...record.blockers, ...blockers],
    safeToStartTask033: false,
    reasonCodes: [...record.reasonCodes, 'blocked', ...blockers.map(b => `blocker:${b}`)]
  };

  await task032ControlledCanaryActivationRepository.updateActivationRecord(activationId, updatedRecord);
  return updatedRecord;
}

export async function getTask032CanaryActivationRecord(activationId: string): Promise<Task032CanaryActivationRecord | null> {
  return task032ControlledCanaryActivationRepository.getActivationRecord(activationId);
}
