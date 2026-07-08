import { describe, it, expect } from 'vitest';
import { checkMonitoringGateReadiness } from '../services/task025MonitoringGateReadinessService';

describe('checkMonitoringGateReadiness', () => {
  it('returns monitoring_ready when all inputs are true', async () => {
    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: true,
      incidentDrillAvailable: true,
      backupRestoreDrillAvailable: true,
      operationalPrivacyScanAvailable: true,
      pauseSignalPathDefined: true,
      rollbackSignalPathDefined: true,
      readinessDiagnosticsSafeMetadataOnly: true,
    });
    expect(result.monitoringStatus).toBe('monitoring_ready');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toContain('confirmed');
  });

  it('returns monitoring_blocked when Task 024 monitoring is missing', async () => {
    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: false,
      incidentDrillAvailable: true,
      backupRestoreDrillAvailable: true,
      operationalPrivacyScanAvailable: true,
      pauseSignalPathDefined: true,
      rollbackSignalPathDefined: true,
      readinessDiagnosticsSafeMetadataOnly: true,
    });
    expect(result.monitoringStatus).toBe('monitoring_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toContain('Task 024 monitoring');
  });

  it('returns monitoring_blocked when incident drill is missing', async () => {
    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: true,
      incidentDrillAvailable: false,
      backupRestoreDrillAvailable: true,
      operationalPrivacyScanAvailable: true,
      pauseSignalPathDefined: true,
      rollbackSignalPathDefined: true,
      readinessDiagnosticsSafeMetadataOnly: true,
    });
    expect(result.monitoringStatus).toBe('monitoring_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('Incident drill');
  });

  it('returns monitoring_blocked when backup/restore drill is missing', async () => {
    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: true,
      incidentDrillAvailable: true,
      backupRestoreDrillAvailable: false,
      operationalPrivacyScanAvailable: true,
      pauseSignalPathDefined: true,
      rollbackSignalPathDefined: true,
      readinessDiagnosticsSafeMetadataOnly: true,
    });
    expect(result.monitoringStatus).toBe('monitoring_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('Backup and restore drill');
  });

  it('returns monitoring_blocked when pause signal path is missing', async () => {
    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: true,
      incidentDrillAvailable: true,
      backupRestoreDrillAvailable: true,
      operationalPrivacyScanAvailable: true,
      pauseSignalPathDefined: false,
      rollbackSignalPathDefined: true,
      readinessDiagnosticsSafeMetadataOnly: true,
    });
    expect(result.monitoringStatus).toBe('monitoring_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('Pause signal path');
  });

  it('returns monitoring_blocked when rollback signal path is missing', async () => {
    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: true,
      incidentDrillAvailable: true,
      backupRestoreDrillAvailable: true,
      operationalPrivacyScanAvailable: true,
      pauseSignalPathDefined: true,
      rollbackSignalPathDefined: false,
      readinessDiagnosticsSafeMetadataOnly: true,
    });
    expect(result.monitoringStatus).toBe('monitoring_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('Rollback signal path');
  });

  it('returns monitoring_blocked when diagnostics are not safe metadata only', async () => {
    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: true,
      incidentDrillAvailable: true,
      backupRestoreDrillAvailable: true,
      operationalPrivacyScanAvailable: true,
      pauseSignalPathDefined: true,
      rollbackSignalPathDefined: true,
      readinessDiagnosticsSafeMetadataOnly: false,
    });
    expect(result.monitoringStatus).toBe('monitoring_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toContain('diagnostics');
  });

  it('returns monitoring_blocked with all blockers when everything is false', async () => {
    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: false,
      incidentDrillAvailable: false,
      backupRestoreDrillAvailable: false,
      operationalPrivacyScanAvailable: false,
      pauseSignalPathDefined: false,
      rollbackSignalPathDefined: false,
      readinessDiagnosticsSafeMetadataOnly: false,
    });
    expect(result.monitoringStatus).toBe('monitoring_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(7);
    expect(result.safeBlockers.filter((b) => b.severity === 'high')).toHaveLength(6);
    expect(result.safeBlockers.filter((b) => b.severity === 'medium')).toHaveLength(1);
  });
});
