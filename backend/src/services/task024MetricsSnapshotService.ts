import { task024OpsRepository } from '../repositories/task024OpsRepository';

let requestCount = 0;
let errorCount = 0;
let rateLimitCount = 0;

export function incrementRequestCount(): void {
  requestCount++;
}

export function incrementErrorCount(): void {
  errorCount++;
}

export function incrementRateLimitCount(): void {
  rateLimitCount++;
}

export function getCounts(): { requestCount: number; errorCount: number; rateLimitCount: number } {
  return { requestCount, errorCount, rateLimitCount };
}

export function resetCounts(): void {
  requestCount = 0;
  errorCount = 0;
  rateLimitCount = 0;
}

export async function produceMetricsSnapshot(): Promise<{
  timestamp: string;
  requestCount: number;
  errorCount: number;
  rateLimitCount: number;
  incidentCount: number;
  openIncidentCount: number;
  databaseStatus: string;
  backupStatus: string;
  restoreDrillStatus: string;
  id: string;
}> {
  const totalIncidents = await task024OpsRepository.countIncidents();
  const openIncidents = await task024OpsRepository.countIncidentsByStatus('open');

  const latestBackup = await task024OpsRepository.getLatestBackupCheck();
  const latestRestore = await task024OpsRepository.getLatestRestoreDrill();

  const snapshot = await task024OpsRepository.createMetricSnapshot({
    requestCount,
    errorCount,
    rateLimitCount,
    incidentCount: totalIncidents,
    openIncidentCount: openIncidents,
    databaseStatus: 'checked',
    backupStatus: latestBackup?.lastBackupStatus ?? 'not_checked',
    lastBackupAt: latestBackup?.lastBackupAt ?? undefined,
    restoreDrillStatus: latestRestore?.status ?? 'not_checked',
    lastRestoreDrillAt: latestRestore?.completedAt ?? undefined,
  });

  return {
    timestamp: snapshot.createdAt.toISOString(),
    requestCount: snapshot.requestCount,
    errorCount: snapshot.errorCount,
    rateLimitCount: snapshot.rateLimitCount,
    incidentCount: snapshot.incidentCount,
    openIncidentCount: snapshot.openIncidentCount,
    databaseStatus: snapshot.databaseStatus,
    backupStatus: snapshot.backupStatus,
    restoreDrillStatus: snapshot.restoreDrillStatus,
    id: snapshot.id,
  };
}

export async function getLatestMetricsSummary() {
  return task024OpsRepository.getLatestMetricSnapshot();
}
