import { describe, it, expect } from 'vitest';
import { getOperationalHealth } from '../services/task024OperationalHealthAggregator';
import { produceMetricsSnapshot } from '../services/task024MetricsSnapshotService';
import { evaluateBackupReadiness } from '../services/task024BackupReadinessService';
import { runRestoreDrill } from '../services/task024RestoreDrillService';
import { verifyDataIntegrity } from '../services/task024DataIntegrityVerificationService';
import { runHardeningChecklist } from '../services/task024OperationalHardeningChecklistService';
import { scanForLeaks } from '../services/task024RedactionAndLeakDetectionService';

describe('task024NoSecretLeak', () => {
  it('getOperationalHealth output contains no database URLs, API keys, or tokens', async () => {
    const health = await getOperationalHealth('no-leak-test');
    const serialized = JSON.stringify(health);
    const result = scanForLeaks(serialized);
    expect(result.hasLeak).toBe(false);
  });

  it('evaluateBackupReadiness output does not contain raw database URL', async () => {
    const result = await evaluateBackupReadiness();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/postgres:\/\/|mysql:\/\/|mongodb:\/\//i);
    const leakCheck = scanForLeaks(serialized);
    expect(leakCheck.hasLeak).toBe(false);
  });

  it('runRestoreDrill output does not contain secrets', async () => {
    const result = await runRestoreDrill({ useTestFixture: true });
    const serialized = JSON.stringify(result);
    const leakCheck = scanForLeaks(serialized);
    expect(leakCheck.hasLeak).toBe(false);
  });

  it('verifyDataIntegrity output does not contain raw data leaks', async () => {
    const results = await verifyDataIntegrity({ useTestFixtures: true });
    const serialized = JSON.stringify(results);
    const leakCheck = scanForLeaks(serialized);
    expect(leakCheck.hasLeak).toBe(false);
  });

  it('produceMetricsSnapshot output does not contain secrets', async () => {
    const snapshot = await produceMetricsSnapshot();
    const serialized = JSON.stringify(snapshot);
    const leakCheck = scanForLeaks(serialized);
    expect(leakCheck.hasLeak).toBe(false);
  });

  it('runHardeningChecklist output does not contain secrets', async () => {
    const result = await runHardeningChecklist();
    const serialized = JSON.stringify(result);
    const leakCheck = scanForLeaks(serialized);
    expect(leakCheck.hasLeak).toBe(false);
  });

  it('all service outputs collectively pass no-secret scan', async () => {
    const health = await getOperationalHealth('no-leak-batch');
    const backupResult = await evaluateBackupReadiness();
    const drillResult = await runRestoreDrill({ useTestFixture: true });
    const integrityResults = await verifyDataIntegrity({ useTestFixtures: true });
    const snapshot = await produceMetricsSnapshot();
    const hardeningResult = await runHardeningChecklist();

    const allOutputs = [
      JSON.stringify(health),
      JSON.stringify(backupResult),
      JSON.stringify(drillResult),
      JSON.stringify(integrityResults),
      JSON.stringify(snapshot),
      JSON.stringify(hardeningResult),
    ].join('\n');

    const leakCheck = scanForLeaks(allOutputs);
    expect(leakCheck.hasLeak).toBe(false);
  });

  it('scanForLeaks detects known secret patterns in positive control strings', () => {
    expect(scanForLeaks('postgres://user:pass@host:5432/db').hasLeak).toBe(true);
    expect(scanForLeaks('sk-abc123def456ghi789jkl012mno345').hasLeak).toBe(true);
    expect(scanForLeaks('Bearer eyJhbGciOiJIUzI1NiJ9.token').hasLeak).toBe(true);
    expect(scanForLeaks('-----BEGIN RSA PRIVATE KEY-----\nABCDEF\n-----END RSA PRIVATE KEY-----').hasLeak).toBe(true);
    expect(scanForLeaks('safe plain text').hasLeak).toBe(false);
  });
});
