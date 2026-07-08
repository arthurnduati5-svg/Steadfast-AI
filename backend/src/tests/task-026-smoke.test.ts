import { describe, it, expect, beforeEach } from 'vitest';
import { checkTask025ReadinessDependency } from '../services/task026Task025ReadinessDependencyService';
import { checkTask024OperationsDependency } from '../services/task026Task024OperationsDependencyService';
import { checkGovernanceContinuity } from '../services/task026GovernanceDependencyService';
import { evaluateGate } from '../services/task026PilotExecutionGateService';
import { evaluateCohortScope } from '../services/task026CohortExecutionScopeService';
import { evaluateLearnerAccess } from '../services/task026LearnerAccessGateService';
import { getTeacherMonitoringSnapshot } from '../services/task026TeacherMonitoringBridgeService';
import { recordEvidenceEvent } from '../services/task026PilotEvidenceLedgerService';
import { recordSafeguardingSignal } from '../services/task026SafeguardingEscalationRuntimeService';
import { recordIncident } from '../services/task026IncidentWatchService';
import { generateDailySummary } from '../services/task026DailyPilotSummaryService';
import { getSupportQueueMetadata } from '../services/task026SupportQueueMetadataService';
import { getDiagnostics } from '../services/task026ExecutionDiagnosticsService';
import { recordAuditEvent } from '../services/task026ExecutionAuditService';
import { generateReport } from '../services/task026ExecutionReportService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026Smoke', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('checkTask025ReadinessDependency exists and returns expected shape', async () => {
    const result = await checkTask025ReadinessDependency({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result).toHaveProperty('gate');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('reasonCodes');
    expect(result).toHaveProperty('safeMessage');
  });

  it('checkTask024OperationsDependency exists and returns expected shape', async () => {
    const result = await checkTask024OperationsDependency({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result).toHaveProperty('gate');
    expect(result).toHaveProperty('status');
  });

  it('checkGovernanceContinuity exists and returns array', async () => {
    const result = await checkGovernanceContinuity({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin' });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('evaluateGate exists and returns expected shape', async () => {
    const result = await evaluateGate({ runId: 'r1', schoolId: 's1', actorRole: 'school_admin', action: 'activate_run' });
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('gateResults');
    expect(typeof result.allowed).toBe('boolean');
  });

  it('evaluateCohortScope exists and returns expected shape', async () => {
    const result = await evaluateCohortScope({ schoolId: 's1', cohortId: 'c1', cohortSize: 20, teacherOwnerId: 't1', supportOwnerId: 's1', approvedCurriculumScopeIds: [], approvedSourceScopeIds: [] });
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('reasonCodes');
    expect(result).toHaveProperty('safeMessage');
  });

  it('evaluateLearnerAccess exists and returns expected shape', async () => {
    const result = await evaluateLearnerAccess({ schoolId: 's1', learnerId: 'l1', cohortId: 'c1', pilotRunId: 'r1', requestedContentType: 'learning' });
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('status');
  });

  it('getTeacherMonitoringSnapshot exists and returns expected shape', async () => {
    const result = await getTeacherMonitoringSnapshot({ schoolId: 's1', teacherId: 't1', pilotRunId: 'r1' });
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('cohortSafeCount');
  });

  it('recordEvidenceEvent exists and returns expected shape', async () => {
    const result = await recordEvidenceEvent({ schoolId: 's1', pilotRunId: 'r1', eventType: 'session_started', actorRole: 'learner', safeSummary: 'test' });
    expect(result).toHaveProperty('ok');
    expect(typeof result.ok).toBe('boolean');
  });

  it('recordSafeguardingSignal exists and returns expected shape', async () => {
    const result = await recordSafeguardingSignal({ schoolId: 's1', pilotRunId: 'r1', signalType: 'concerning_learner_behavior', severity: 'low', source: 'system', safeSummary: 'test', requiresPause: false, requiresHumanReview: false });
    expect(result).toHaveProperty('recorded');
    expect(result).toHaveProperty('signalId');
  });

  it('recordIncident exists and returns expected shape', async () => {
    const result = await recordIncident({ schoolId: 's1', pilotRunId: 'r1', severity: 'low', category: 'test', safeSummary: 'test' });
    expect(result).toHaveProperty('recorded');
    expect(result).toHaveProperty('incidentId');
  });

  it('generateDailySummary exists and returns expected shape', async () => {
    const result = await generateDailySummary({ pilotRunId: 'r1', schoolId: 's1' });
    expect(result).toHaveProperty('ok');
    expect(typeof result.ok).toBe('boolean');
  });

  it('getSupportQueueMetadata exists and returns expected shape', async () => {
    const result = await getSupportQueueMetadata('r1', 's1');
    expect(result).toHaveProperty('ok');
    expect(typeof result.ok).toBe('boolean');
  });

  it('getDiagnostics exists and returns expected shape', async () => {
    const result = await getDiagnostics('r1', 's1');
    expect(result).toHaveProperty('ok');
  });

  it('recordAuditEvent exists and returns expected shape', async () => {
    const result = await recordAuditEvent({ schoolId: 's1', actorRole: 'admin', action: 'run_created', safeSummary: 'test' });
    expect(result).toHaveProperty('ok');
    expect(result).toHaveProperty('event');
  });

  it('generateReport exists and returns expected shape', async () => {
    const result = await generateReport('r1', { schoolId: 's1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result).toHaveProperty('ok');
    expect(result).toHaveProperty('report');
  });
});
