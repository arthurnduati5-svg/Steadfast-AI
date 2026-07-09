import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import task032Router from '../routes/task032ControlledCanaryActivationRoutes';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/task-032', task032Router);
  return app;
}

describe('Task 032 - Routes / Activation Lifecycle Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('POST /activations should create activation record', async () => {
    const res = await request(app)
      .post('/api/task-032/activations')
      .send({ schoolId: 'school_task032_canary_safe', configuredCohortSize: 25 });
    expect(res.status).toBe(200);
    expect(res.body.activationId).toBeTruthy();
    expect(res.body.status).toBe('created');
  });

  it('POST /activations should set safeStage to created', async () => {
    const res = await request(app)
      .post('/api/task-032/activations')
      .send({ schoolId: 'school_task032_canary_safe', configuredCohortSize: 25 });
    expect(res.body.safeStage).toBe('created');
  });

  it('GET /activations/:id should retrieve activation record', async () => {
    const createRes = await request(app)
      .post('/api/task-032/activations')
      .send({ schoolId: 'school_task032_canary_safe', configuredCohortSize: 25 });
    const activationId = createRes.body.activationId;

    const getRes = await request(app).get(`/api/task-032/activations/${activationId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.activationId).toBe(activationId);
  });

  it('GET /activations/:id should return 404 for unknown id', async () => {
    const res = await request(app).get('/api/task-032/activations/unknown_activation');
    expect(res.status).toBe(404);
  });

  it('POST /activations/:id/activate-internal should run full lifecycle', async () => {
    const createRes = await request(app)
      .post('/api/task-032/activations')
      .send({ schoolId: 'school_task032_canary_safe', configuredCohortSize: 25 });
    const activationId = createRes.body.activationId;

    const activateRes = await request(app)
      .post(`/api/task-032/activations/${activationId}/activate-internal`)
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        config: {
          schoolId: 'school_task032_canary_safe',
          approvedByRole: 'school_admin',
          activationMode: 'internal_controlled_activation',
          maxCanaryLearners: 25,
          allowedClassIds: ['class_task032_safe_001'],
          allowedSubjectIds: ['subject_task032_safe_math_001'],
          allowedCohortIds: ['cohort_task032_safe_001'],
          canaryStartWindow: '2026-06-01T00:00:00Z',
          canaryEndWindow: '2026-06-30T23:59:59Z',
          rollbackPolicyId: 'rollback_001',
          incidentPolicyId: 'incident_001',
          privacyBoundaryId: 'privacy_001',
          healthBudgetId: 'budget_001',
          consentAuthorizationPolicyId: 'consent_001',
          sourceGovernancePolicyId: 'source_001',
          deenBoundaryPolicyId: 'deen_001',
          socraticIntegrityPolicyId: 'socratic_001'
        },
        environmentInput: {
          environmentType: 'controlled_canary',
          activationMode: 'internal_controlled_activation',
          dataMode: 'approved_canary_fixture',
          sideEffectMode: 'internal_state_only',
          productionDeploymentRequested: false,
          liveNotificationRequested: false,
          liveAiRequested: false,
          liveSchoolConnectorRequested: false,
          productionMutationRequested: false,
          canaryObservationRequested: false,
          rolloutRequested: false,
          schoolWideLaunchRequested: false,
          backendFreezeRequested: false
        }
      });
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.safeToStartTask033).toBe(true);
  });

  it('POST /activations/:id/activate-internal should set status activated_internal', async () => {
    const createRes = await request(app)
      .post('/api/task-032/activations')
      .send({ schoolId: 'school_task032_canary_safe', configuredCohortSize: 25 });
    const activationId = createRes.body.activationId;

    const activateRes = await request(app)
      .post(`/api/task-032/activations/${activationId}/activate-internal`)
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        config: {
          schoolId: 'school_task032_canary_safe',
          approvedByRole: 'school_admin',
          activationMode: 'internal_controlled_activation',
          maxCanaryLearners: 25,
          allowedClassIds: ['class_task032_safe_001'],
          allowedSubjectIds: ['subject_task032_safe_math_001'],
          allowedCohortIds: ['cohort_task032_safe_001'],
          canaryStartWindow: '2026-06-01T00:00:00Z',
          canaryEndWindow: '2026-06-30T23:59:59Z',
          rollbackPolicyId: 'rollback_001',
          incidentPolicyId: 'incident_001',
          privacyBoundaryId: 'privacy_001',
          healthBudgetId: 'budget_001',
          consentAuthorizationPolicyId: 'consent_001',
          sourceGovernancePolicyId: 'source_001',
          deenBoundaryPolicyId: 'deen_001',
          socraticIntegrityPolicyId: 'socratic_001'
        },
        environmentInput: {
          environmentType: 'controlled_canary',
          activationMode: 'internal_controlled_activation',
          dataMode: 'approved_canary_fixture',
          sideEffectMode: 'internal_state_only',
          productionDeploymentRequested: false,
          liveNotificationRequested: false,
          liveAiRequested: false,
          liveSchoolConnectorRequested: false,
          productionMutationRequested: false,
          canaryObservationRequested: false,
          rolloutRequested: false,
          schoolWideLaunchRequested: false,
          backendFreezeRequested: false
        }
      });
    expect(activateRes.body.status).toBe('activated_internal');
  });

  it('POST /activations/:id/control-action should pause activated canary', async () => {
    const createRes = await request(app)
      .post('/api/task-032/activations')
      .send({ schoolId: 'school_task032_canary_safe', configuredCohortSize: 25 });
    const activationId = createRes.body.activationId;

    const controlRes = await request(app)
      .post(`/api/task-032/activations/${activationId}/control-action`)
      .send({ action: 'pause_internal_canary', actorRole: 'school_admin', schoolId: 'school_task032_canary_safe' });
    expect(controlRes.status).toBe(200);
    expect(controlRes.body.ok).toBe(true);
    expect(controlRes.body.nextStatus).toBe('paused');
  });

  it('POST /activations/:id/control-action should resume paused canary', async () => {
    const createRes = await request(app)
      .post('/api/task-032/activations')
      .send({ schoolId: 'school_task032_canary_safe', configuredCohortSize: 25 });
    const activationId = createRes.body.activationId;

    await request(app)
      .post(`/api/task-032/activations/${activationId}/control-action`)
      .send({ action: 'pause_internal_canary', actorRole: 'school_admin', schoolId: 'school_task032_canary_safe' });

    const resumeRes = await request(app)
      .post(`/api/task-032/activations/${activationId}/control-action`)
      .send({ action: 'resume_internal_canary', actorRole: 'school_admin', schoolId: 'school_task032_canary_safe' });
    expect(resumeRes.body.ok).toBe(true);
    expect(resumeRes.body.nextStatus).toBe('activated_internal');
  });

  it('POST /activations/:id/control-action should enable kill switch', async () => {
    const createRes = await request(app)
      .post('/api/task-032/activations')
      .send({ schoolId: 'school_task032_canary_safe', configuredCohortSize: 25 });
    const activationId = createRes.body.activationId;

    const killRes = await request(app)
      .post(`/api/task-032/activations/${activationId}/control-action`)
      .send({ action: 'enable_internal_kill_switch', actorRole: 'school_admin', schoolId: 'school_task032_canary_safe' });
    expect(killRes.body.ok).toBe(true);
    expect(killRes.body.nextStatus).toBe('kill_switch_enabled');
  });

  it('POST /activations/:id/control-action should request rollback', async () => {
    const createRes = await request(app)
      .post('/api/task-032/activations')
      .send({ schoolId: 'school_task032_canary_safe', configuredCohortSize: 25 });
    const activationId = createRes.body.activationId;

    const rollbackRes = await request(app)
      .post(`/api/task-032/activations/${activationId}/control-action`)
      .send({ action: 'request_internal_rollback', actorRole: 'school_admin', schoolId: 'school_task032_canary_safe' });
    expect(rollbackRes.body.ok).toBe(true);
    expect(rollbackRes.body.nextStatus).toBe('rollback_requested');
  });

  it('GET /diagnostics should return diagnostics', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.status).toBe(200);
    expect(res.body.routeMountStatus).toBe('mounted');
  });
});
