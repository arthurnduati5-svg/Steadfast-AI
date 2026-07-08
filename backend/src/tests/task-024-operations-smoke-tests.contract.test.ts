import { describe, it, expect } from 'vitest';
import { getOperationalHealth } from '../services/task024OperationalHealthAggregator';
import { produceMetricsSnapshot } from '../services/task024MetricsSnapshotService';
import { redactObject, scanForLeaks } from '../services/task024RedactionAndLeakDetectionService';
import { injectSignal, clearSignals } from '../services/task024IncidentDetectionService';
import { classifySignal } from '../services/task024IncidentClassificationService';
import { createIncidentResponsePlan } from '../services/task024IncidentResponseWorkflowService';
import { evaluateBackupReadiness } from '../services/task024BackupReadinessService';
import { runRestoreDrill } from '../services/task024RestoreDrillService';
import { verifyDataIntegrity } from '../services/task024DataIntegrityVerificationService';
import type { IncidentSignal } from '../contracts/task024OperationsContracts';

describe('task024OperationsSmokeTests', () => {
  it('SMOKE 1: operations health returns safe status', async () => {
    const health = await getOperationalHealth('smoke-test-1');
    expect(health.overallStatus).toBeDefined();
    expect(typeof health.overallStatus).toBe('string');
    expect(Array.isArray(health.components)).toBe(true);
    const serialized = JSON.stringify(health);
    const leakCheck = scanForLeaks(serialized);
    expect(leakCheck.hasLeak).toBe(false);
  });

  it('SMOKE 2: telemetry redacts secret-like payload', () => {
    const payload: Record<string, unknown> = {
      component: 'database',
      databaseUrl: 'postgresql://admin:secret123@prod-db.example.com:5432/mydb',
      apiKey: 'sk-abc123def456ghi789jkl012',
      bearerToken: 'Bearer eyJhbGciOiJIUzI1NiJ9.dGVzdA',
      privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA\n-----END RSA PRIVATE KEY-----',
      nested: {
        connectionString: 'mysql://root:pass@host:3306/db',
        email: 'admin@steadfast-ai.com',
      },
      safeField: 'this should remain visible',
    };
    const redacted = redactObject(payload);
    expect(redacted.databaseUrl).toBe('[REDACTED]');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.bearerToken).toBe('[REDACTED]');
    expect(redacted.privateKey).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).connectionString).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).email).toBe('[REDACTED]');
    expect(redacted.safeField).toBe('this should remain visible');
  });

  it('SMOKE 3: incident detector creates critical incident for database unavailable signal', () => {
    clearSignals();
    const signal: IncidentSignal = {
      source: 'IncidentDetectionService',
      component: 'Database',
      signalType: 'database_unavailable',
      detectedAt: new Date().toISOString(),
      safeSummary: 'Database unavailable signal injected for test',
    };
    injectSignal(signal);
    const classified = classifySignal(signal);
    expect(classified.severity).toBe('critical');
    expect(classified.category).toBe('database');
    expect(classified.status).toBe('detected');
  });

  it('SMOKE 4: incident response plan includes safe containment and recovery steps', async () => {
    const plan = await createIncidentResponsePlan(
      'inc_smoke4_critical',
      'database',
      'sev1_major_learning_or_identity_outage',
      'database_admin',
    );
    expect(Array.isArray(plan.containmentSteps)).toBe(true);
    expect(plan.containmentSteps.length).toBeGreaterThan(0);
    expect(Array.isArray(plan.mitigationSteps)).toBe(true);
    expect(plan.mitigationSteps.length).toBeGreaterThan(0);
    expect(plan.incidentId).toBe('inc_smoke4_critical');
    const serialized = JSON.stringify(plan);
    const leakCheck = scanForLeaks(serialized);
    expect(leakCheck.hasLeak).toBe(false);
  });

  it('SMOKE 5: backup readiness returns safe masked result', async () => {
    const result = await evaluateBackupReadiness();
    expect(result.status).toBeDefined();
    expect(typeof result.status).toBe('string');
    expect(typeof result.safeSummary).toBe('string');
    expect(typeof result.scopeDefined).toBe('boolean');
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/postgres:\/\/|mysql:\/\/|mongodb:\/\//i);
  });

  it('SMOKE 6: restore drill runs isolated/simulated validation without destructive command', async () => {
    const result = await runRestoreDrill({ useTestFixture: true, fixtureName: 'test_fixture_default' });
    expect(result.destructiveCommandExecuted).toBe(false);
    expect(result.realProductionDataOverwritten).toBe(false);
    expect(result.manualApprovalBeforeRestore).toBe(true);
    expect(result.drillType).toBe('test_fixture_restore');
  });

  it('SMOKE 7: data integrity checker returns counts/statuses only', async () => {
    const results = await verifyDataIntegrity({ useTestFixtures: true });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(typeof r.recordCount).toBe('number');
      expect(typeof r.accessible).toBe('boolean');
      expect(Array.isArray(r.issues)).toBe(true);
      const serialized = JSON.stringify(r);
      const leakCheck = scanForLeaks(serialized);
      expect(leakCheck.hasLeak).toBe(false);
    }
  });

  it('SMOKE 8: operational health includes task021/022/023 readiness components', async () => {
    const health = await getOperationalHealth('smoke-test-8');
    const componentNames = health.components.map((c) => c.component);
    const hasRelevantComponent = componentNames.some(
      (name) =>
        name === 'school_integration' ||
        name === 'content_governance' ||
        name === 'deployment_readiness',
    );
    expect(hasRelevantComponent).toBe(true);
  });

  it('SMOKE 9: outputs pass no-secret/no-private-data scan', async () => {
    const health = await getOperationalHealth('smoke-test-9');
    const backupResult = await evaluateBackupReadiness();
    const drillResult = await runRestoreDrill({ useTestFixture: true });
    const integrityResults = await verifyDataIntegrity({ useTestFixtures: true });
    const snapshotResult = await produceMetricsSnapshot();

    const healthStr = JSON.stringify(health);
    const backupStr = JSON.stringify(backupResult);
    const drillStr = JSON.stringify(drillResult);
    const integrityStr = JSON.stringify(integrityResults);
    const snapshotStr = JSON.stringify(snapshotResult);

    const allOutputs = [healthStr, backupStr, drillStr, integrityStr, snapshotStr].join('\n');
    const leakCheck = scanForLeaks(allOutputs);
    expect(leakCheck.hasLeak).toBe(false);
  });

  it('SMOKE 10: metrics snapshot returns aggregate counts only', async () => {
    const snapshot = await produceMetricsSnapshot();
    expect(typeof snapshot.requestCount).toBe('number');
    expect(typeof snapshot.errorCount).toBe('number');
    expect(typeof snapshot.rateLimitCount).toBe('number');
    expect(typeof snapshot.incidentCount).toBe('number');
    expect(typeof snapshot.openIncidentCount).toBe('number');
    expect(typeof snapshot.timestamp).toBe('string');
    const serialized = JSON.stringify(snapshot);
    const leakCheck = scanForLeaks(serialized);
    expect(leakCheck.hasLeak).toBe(false);
  });
});
