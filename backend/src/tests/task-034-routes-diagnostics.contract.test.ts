import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesDiagnosticsContract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('GET /sessions/:sessionId/diagnostics returns 403 without admin role', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/diagnostics')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('GET /sessions/:sessionId/diagnostics returns diagnostics result', async () => {
    await task034Repository.saveTask033DependencyProof({ ok: true } as any);
    await task034Repository.saveEnvironmentGate({ ok: true } as any);
    await task034Repository.saveLimitedRolloutConfig({ ok: true } as any);
    await task034Repository.saveRolloutCapGate({ ok: true } as any);
    await task034Repository.saveExpandedCohortEligibility({ ok: true } as any);
    await task034Repository.saveStaffReadiness({ ok: true } as any);
    await task034Repository.saveLearnerNoticeReadiness({ ok: true } as any);
    await task034Repository.saveRolloutSession({ sessionId: 'session-001', status: 'created', rolloutStage: 'created' } as any);
    await task034Repository.saveRolloutEvent({ sessionId: 'session-001', eventId: 'evt_1', eventType: 'test', safeSummary: 'test', gateName: 'test', gatePassed: true } as any);
    await task034Repository.saveExpandedRuntimeGuard({ ok: true } as any);
    await task034Repository.saveHealthBudgetEscalation({ ok: true } as any);
    await task034Repository.saveIncidentEscalationBridge({ ok: true } as any);
    await task034Repository.saveRollbackProtection({ ok: true } as any);
    await task034Repository.savePrivacyReview({ ok: true } as any);
    await task034Repository.saveContentGovernanceReview({ ok: true } as any);
    await task034Repository.saveSocraticIntegrityReview({ ok: true } as any);
    await task034Repository.saveDeenBoundaryReview({ ok: true } as any);
    await task034Repository.saveSchoolIdentityReview({ ok: true } as any);
    await task034Repository.saveCrossSchoolDenialReview({ ok: true } as any);
    await task034Repository.appendEvidenceEvent({ sessionId: 'session-001', eventId: 'evt_2', evidenceType: 'test', safeDescription: 'test', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'internal_operator' });
    await task034Repository.saveReport({ verdict: 'PASS' } as any);

    const res = await supertest(app)
      .get('/sessions/session-001/diagnostics')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('session-001');
    expect(res.body).toHaveProperty('ok');
    expect(res.body).toHaveProperty('blockingIssues');
  });

  it('GET /sessions/:sessionId/diagnostics returns ok true when all gates pass', async () => {
    await task034Repository.saveTask033DependencyProof({ ok: true } as any);
    await task034Repository.saveEnvironmentGate({ ok: true } as any);
    await task034Repository.saveLimitedRolloutConfig({ ok: true } as any);
    await task034Repository.saveRolloutCapGate({ ok: true } as any);
    await task034Repository.saveExpandedCohortEligibility({ ok: true } as any);
    await task034Repository.saveStaffReadiness({ ok: true } as any);
    await task034Repository.saveLearnerNoticeReadiness({ ok: true } as any);
    await task034Repository.saveRolloutSession({ sessionId: 'session-002', status: 'created', rolloutStage: 'created' } as any);
    await task034Repository.saveRolloutEvent({ sessionId: 'session-002', eventId: 'evt_1', eventType: 'test', safeSummary: 'test', gateName: 'test', gatePassed: true } as any);
    await task034Repository.saveExpandedRuntimeGuard({ ok: true } as any);
    await task034Repository.saveHealthBudgetEscalation({ ok: true } as any);
    await task034Repository.saveIncidentEscalationBridge({ ok: true } as any);
    await task034Repository.saveRollbackProtection({ ok: true } as any);
    await task034Repository.savePrivacyReview({ ok: true } as any);
    await task034Repository.saveContentGovernanceReview({ ok: true } as any);
    await task034Repository.saveSocraticIntegrityReview({ ok: true } as any);
    await task034Repository.saveDeenBoundaryReview({ ok: true } as any);
    await task034Repository.saveSchoolIdentityReview({ ok: true } as any);
    await task034Repository.saveCrossSchoolDenialReview({ ok: true } as any);
    await task034Repository.saveSafeRolloutReadModel({ rolloutSessionId: 'session-002', status: 'ok' } as any);
    await task034Repository.appendEvidenceEvent({ sessionId: 'session-002', eventId: 'evt_2', evidenceType: 'test', safeDescription: 'test', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'internal_operator' });
    await task034Repository.saveReport({ verdict: 'PASS' } as any);

    const res = await supertest(app)
      .get('/sessions/session-002/diagnostics')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.blockingIssues).toHaveLength(0);
  });

  it('GET /sessions/:sessionId/diagnostics returns diagnosticDetails map', async () => {
    await task034Repository.saveTask033DependencyProof({ ok: true } as any);
    await task034Repository.saveEnvironmentGate({ ok: true } as any);
    await task034Repository.saveLimitedRolloutConfig({ ok: true } as any);
    await task034Repository.saveRolloutCapGate({ ok: true } as any);
    await task034Repository.saveExpandedCohortEligibility({ ok: true } as any);
    await task034Repository.saveStaffReadiness({ ok: true } as any);
    await task034Repository.saveLearnerNoticeReadiness({ ok: true } as any);
    await task034Repository.saveRolloutSession({ sessionId: 'session-003', status: 'created', rolloutStage: 'created' } as any);
    await task034Repository.saveRolloutEvent({ sessionId: 'session-003', eventId: 'evt_1', eventType: 'test', safeSummary: 'test', gateName: 'test', gatePassed: true } as any);
    await task034Repository.saveExpandedRuntimeGuard({ ok: true } as any);
    await task034Repository.saveHealthBudgetEscalation({ ok: true } as any);
    await task034Repository.saveIncidentEscalationBridge({ ok: true } as any);
    await task034Repository.saveRollbackProtection({ ok: true } as any);
    await task034Repository.savePrivacyReview({ ok: true } as any);
    await task034Repository.saveContentGovernanceReview({ ok: true } as any);
    await task034Repository.saveSocraticIntegrityReview({ ok: true } as any);
    await task034Repository.saveDeenBoundaryReview({ ok: true } as any);
    await task034Repository.saveSchoolIdentityReview({ ok: true } as any);
    await task034Repository.saveCrossSchoolDenialReview({ ok: true } as any);
    await task034Repository.appendEvidenceEvent({ sessionId: 'session-003', eventId: 'evt_2', evidenceType: 'test', safeDescription: 'test', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'internal_operator' });
    await task034Repository.saveReport({ verdict: 'PASS' } as any);

    const res = await supertest(app)
      .get('/sessions/session-003/diagnostics')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.diagnosticDetails).toBeDefined();
    expect(res.body.diagnosticDetails.dependencyProof).toEqual({ ok: true });
    expect(res.body.diagnosticDetails.events).toHaveProperty('count');
  });

  it('GET /sessions/:sessionId/diagnostics returns blocking issues when gates fail', async () => {
    await task034Repository.saveTask033DependencyProof({ ok: false } as any);
    await task034Repository.saveEnvironmentGate({ ok: false } as any);
    await task034Repository.saveRolloutSession({ sessionId: 'session-004', status: 'created', rolloutStage: 'created' } as any);
    await task034Repository.saveRolloutEvent({ sessionId: 'session-004', eventId: 'evt_1', eventType: 'test', safeSummary: 'test', gateName: 'test', gatePassed: true } as any);

    const res = await supertest(app)
      .get('/sessions/session-004/diagnostics')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues.length).toBeGreaterThan(0);
  });

  it('GET /sessions/:sessionId/diagnostics saves to repository', async () => {
    await task034Repository.saveTask033DependencyProof({ ok: true } as any);
    await task034Repository.saveEnvironmentGate({ ok: true } as any);
    await task034Repository.saveLimitedRolloutConfig({ ok: true } as any);
    await task034Repository.saveRolloutCapGate({ ok: true } as any);
    await task034Repository.saveExpandedCohortEligibility({ ok: true } as any);
    await task034Repository.saveStaffReadiness({ ok: true } as any);
    await task034Repository.saveLearnerNoticeReadiness({ ok: true } as any);
    await task034Repository.saveRolloutSession({ sessionId: 'session-005', status: 'created', rolloutStage: 'created' } as any);
    await task034Repository.saveRolloutEvent({ sessionId: 'session-005', eventId: 'evt_1', eventType: 'test', safeSummary: 'test', gateName: 'test', gatePassed: true } as any);
    await task034Repository.saveExpandedRuntimeGuard({ ok: true } as any);
    await task034Repository.saveHealthBudgetEscalation({ ok: true } as any);
    await task034Repository.saveIncidentEscalationBridge({ ok: true } as any);
    await task034Repository.saveRollbackProtection({ ok: true } as any);
    await task034Repository.savePrivacyReview({ ok: true } as any);
    await task034Repository.saveContentGovernanceReview({ ok: true } as any);
    await task034Repository.saveSocraticIntegrityReview({ ok: true } as any);
    await task034Repository.saveDeenBoundaryReview({ ok: true } as any);
    await task034Repository.saveSchoolIdentityReview({ ok: true } as any);
    await task034Repository.saveCrossSchoolDenialReview({ ok: true } as any);
    await task034Repository.appendEvidenceEvent({ sessionId: 'session-005', eventId: 'evt_2', evidenceType: 'test', safeDescription: 'test', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'internal_operator' });
    await task034Repository.saveReport({ verdict: 'PASS' } as any);

    await supertest(app)
      .get('/sessions/session-005/diagnostics')
      .set('x-actor-role', 'internal_operator');
    const saved = await task034Repository.getDiagnostics();
    expect(saved).not.toBeNull();
    expect(saved?.sessionId).toBe('session-005');
  });

  it('GET /sessions/:sessionId/diagnostics returns 403 for denied role', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/diagnostics')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });

  it('GET /sessions/:sessionId/diagnostics works with system_admin role', async () => {
    await task034Repository.saveTask033DependencyProof({ ok: true } as any);
    await task034Repository.saveRolloutSession({ sessionId: 'session-006', status: 'created', rolloutStage: 'created' } as any);
    await task034Repository.saveRolloutEvent({ sessionId: 'session-006', eventId: 'evt_1', eventType: 'test', safeSummary: 'test', gateName: 'test', gatePassed: true } as any);

    const res = await supertest(app)
      .get('/sessions/session-006/diagnostics')
      .set('x-actor-role', 'system_admin');
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('session-006');
  });

  it('GET /sessions/:sessionId/diagnostics includes runtime guard field', async () => {
    await task034Repository.saveTask033DependencyProof({ ok: true } as any);
    await task034Repository.saveEnvironmentGate({ ok: true } as any);
    await task034Repository.saveLimitedRolloutConfig({ ok: true } as any);
    await task034Repository.saveRolloutCapGate({ ok: true } as any);
    await task034Repository.saveExpandedCohortEligibility({ ok: true } as any);
    await task034Repository.saveStaffReadiness({ ok: true } as any);
    await task034Repository.saveLearnerNoticeReadiness({ ok: true } as any);
    await task034Repository.saveRolloutSession({ sessionId: 'session-007', status: 'created', rolloutStage: 'created' } as any);
    await task034Repository.saveRolloutEvent({ sessionId: 'session-007', eventId: 'evt_1', eventType: 'test', safeSummary: 'test', gateName: 'test', gatePassed: true } as any);
    await task034Repository.saveExpandedRuntimeGuard({ ok: true } as any);
    await task034Repository.saveHealthBudgetEscalation({ ok: true } as any);
    await task034Repository.saveIncidentEscalationBridge({ ok: true } as any);
    await task034Repository.saveRollbackProtection({ ok: true } as any);
    await task034Repository.savePrivacyReview({ ok: true } as any);
    await task034Repository.saveContentGovernanceReview({ ok: true } as any);
    await task034Repository.saveSocraticIntegrityReview({ ok: true } as any);
    await task034Repository.saveDeenBoundaryReview({ ok: true } as any);
    await task034Repository.saveSchoolIdentityReview({ ok: true } as any);
    await task034Repository.saveCrossSchoolDenialReview({ ok: true } as any);
    await task034Repository.appendEvidenceEvent({ sessionId: 'session-007', eventId: 'evt_2', evidenceType: 'test', safeDescription: 'test', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'internal_operator' });
    await task034Repository.saveReport({ verdict: 'PASS' } as any);

    const res = await supertest(app)
      .get('/sessions/session-007/diagnostics')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.runtimeGuardWorking).toBe(true);
    expect(res.body.healthBudgetWorking).toBe(true);
  });
});
