import { describe, it, expect, beforeEach } from 'vitest';
import { Task031StagingSmokeCanaryReadinessRepository } from '../repositories/task031StagingSmokeCanaryReadinessRepository';

describe('Task 031 - Repository', () => {
  let repo: Task031StagingSmokeCanaryReadinessRepository;

  beforeEach(async () => {
    repo = new Task031StagingSmokeCanaryReadinessRepository();
  });

  it('should record and get latest task030 dependency proof', async () => {
    const proof = {
      ok: true,
      reportFound: true,
      taskId: '030',
      safeToStartTask031: true,
      finalDecision: 'PASS',
      blockingIssuesEmpty: true,
      verificationExitCodeZero: true,
      stagingRehearsalResultFound: true,
      stagingRehearsalSafeToStartTask031: true,
      handoffConsistent: true,
      proofLoaded: true,
      blockingIssues: [],
    };
    await repo.recordTask030DependencyProof(proof);
    const latest = await repo.getLatestTask030DependencyProof();
    expect(latest).not.toBeNull();
    expect(latest!.ok).toBe(true);
    expect(latest!.taskId).toBe('030');
  });

  it('should return null when no task030 proof exists', async () => {
    const latest = await repo.getLatestTask030DependencyProof();
    expect(latest).toBeNull();
  });

  it('should record and list environment gates', async () => {
    const gate = {
      ok: true,
      stagingSmokeEnabled: true,
      noLiveStudentsEnabled: true,
      syntheticSchoolIdentityEnabled: true,
      nodeEnvClassification: 'development',
      databaseUrlClassification: 'safe',
      redisUrlClassification: 'safe',
      rawDatabaseUrlExposed: false,
      rawRedisUrlExposed: false,
      productionLikeBlocked: false,
      blockingIssues: [],
    };
    await repo.recordEnvironmentGate(gate);
    const gates = await repo.listEnvironmentGates();
    expect(gates).toHaveLength(1);
    expect(gates[0].ok).toBe(true);
  });

  it('should record and list no-live-student guard results', async () => {
    const guard = {
      ok: true,
      liveStudentEmailDetected: false,
      liveStudentNameDetected: false,
      livePhoneNumberDetected: false,
      realRosterDetected: false,
      rawStudentChatUsed: false,
      privateLearnerMemoryUsed: false,
      productionCohortModified: false,
      productionDatabaseTouched: false,
      liveProductionRolloutPerformed: false,
      blockingIssues: [],
    };
    await repo.recordNoLiveStudentGuard(guard);
    const results = await repo.listNoLiveStudentGuardResults();
    expect(results).toHaveLength(1);
    expect(results[0].ok).toBe(true);
  });

  it('should record, get, and list synthetic fixtures', async () => {
    const fixture = { fixtureId: 'fixture_001', schoolId: 'school_task031_staging_safe' };
    await repo.recordSyntheticStagingSchoolFixture(fixture);
    const found = await repo.getSyntheticStagingSchoolFixture('fixture_001');
    expect(found).not.toBeNull();
    expect(found!.fixtureId).toBe('fixture_001');
    const list = await repo.listSyntheticStagingSchoolFixtures();
    expect(list).toHaveLength(1);
  });

  it('should return null for unknown fixture', async () => {
    const found = await repo.getSyntheticStagingSchoolFixture('nonexistent');
    expect(found).toBeNull();
  });

  it('should record, get, and list role matrices', async () => {
    const matrix = { matrixId: 'matrix_001', roles: ['admin', 'operator'] };
    await repo.recordRoleMatrix(matrix);
    const found = await repo.getRoleMatrix('matrix_001');
    expect(found).not.toBeNull();
    expect(found!.matrixId).toBe('matrix_001');
  });

  it('should create, get, update, and list smoke runs', async () => {
    const run = { runId: 'run_001', status: 'created' };
    await repo.createSmokeRun(run);
    const found = await repo.getSmokeRun('run_001');
    expect(found).not.toBeNull();
    expect(found!.status).toBe('created');

    await repo.updateSmokeRun('run_001', { status: 'running' });
    const updated = await repo.getSmokeRun('run_001');
    expect(updated!.status).toBe('running');

    const list = await repo.listSmokeRuns();
    expect(list).toHaveLength(1);
  });

  it('should return null for nonexistent smoke run', async () => {
    const found = await repo.getSmokeRun('nonexistent');
    expect(found).toBeNull();
  });

  it('should record and list smoke stage results', async () => {
    await repo.recordSmokeStageResult('run_001', { stageId: 'env-check', ok: true });
    await repo.recordSmokeStageResult('run_001', { stageId: 'smoke', ok: true });
    const results = await repo.listSmokeStageResults('run_001');
    expect(results).toHaveLength(2);
    expect(results[0].stageId).toBe('env_check');
  });

  it('should return empty array for smoke stage results without a run', async () => {
    const results = await repo.listSmokeStageResults('nonexistent');
    expect(results).toEqual([]);
  });

  it('should record evidence events and list them by runId', async () => {
    const event = { runId: 'run_001', eventId: 'evt_001', safeSummary: 'test' };
    await repo.recordEvidenceEvent(event as any);
    const events = await repo.listEvidenceEvents('run_001');
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('evt_001');
  });

  it('should return empty evidence list for unknown run', async () => {
    const events = await repo.listEvidenceEvents('nonexistent');
    expect(events).toEqual([]);
  });

  it('should record and list diagnostics', async () => {
    const diag = { task030ProofStatus: 'loaded' } as any;
    await repo.recordDiagnostics(diag);
    const list = await repo.listDiagnostics();
    expect(list).toHaveLength(1);
    expect(list[0].task030ProofStatus).toBe('loaded');
  });

  it('should record, list, and get latest report', async () => {
    const report = { taskId: '031', verdict: 'PASS' } as any;
    await repo.recordReport(report);
    const list = await repo.listReports();
    expect(list).toHaveLength(1);
    const latest = await repo.getLatestReport();
    expect(latest).not.toBeNull();
    expect(latest!.verdict).toBe('PASS');
  });

  it('should return null for latest report when none exist', async () => {
    const latest = await repo.getLatestReport();
    expect(latest).toBeNull();
  });

  it('should clear all stores on clearTask031StoresForTests', async () => {
    await repo.recordReport({ taskId: '031' } as any);
    await repo.recordDiagnostics({} as any);
    await repo.recordEvidenceEvent({ runId: 'r1', eventId: 'e1' } as any);
    await repo.createSmokeRun({ runId: 'r1' });
    await repo.recordEnvironmentGate({ ok: true } as any);
    await repo.recordNoLiveStudentGuard({ ok: true } as any);
    await repo.recordBackendRouteSmoke({ ok: true } as any);
    await repo.recordOperationsConsoleSmoke({ ok: true } as any);

    await repo.clearTask031StoresForTests();

    expect(await repo.listReports()).toEqual([]);
    expect(await repo.listDiagnostics()).toEqual([]);
    expect(await repo.listEvidenceEvents('r1')).toEqual([]);
    expect(await repo.listSmokeRuns()).toEqual([]);
    expect(await repo.listEnvironmentGates()).toEqual([]);
    expect(await repo.listNoLiveStudentGuardResults()).toEqual([]);
  });
});