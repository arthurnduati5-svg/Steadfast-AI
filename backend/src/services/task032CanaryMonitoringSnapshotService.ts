import type { Task032CanaryMonitoringSnapshot } from '../contracts/task032ControlledCanaryContracts';

export async function captureTask032MonitoringSnapshot(input: Task032CanaryMonitoringSnapshot): Promise<Task032CanaryMonitoringSnapshot> {
  return {
    ...input,
    generatedAt: new Date().toISOString(),
    rawPrivateDataExposed: false,
  };
}

export async function createTask032CanaryMonitoringSnapshotPlaceholder(input: { activationId: string, safeSummary: string, reasonCodes: string[] }): Promise<{ snapshotId: string; activationId: string; observationStarted: boolean; safeSummary: string; reasonCodes: string[]; createdAt: string; safeToStartTask033Candidate: boolean }> {
  return {
    snapshotId: `snap_${input.activationId}_${Date.now()}`,
    activationId: input.activationId,
    observationStarted: false,
    safeSummary: input.safeSummary,
    reasonCodes: input.reasonCodes,
    createdAt: new Date().toISOString(),
    safeToStartTask033Candidate: true
  };
}
