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

describe('Task 032 - Routes / Environment Preflight Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const validEnvInput = {
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
  };

  it('POST /environment/preflight should pass with valid inputs', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send(validEnvInput);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.passed).toBe(true);
  });

  it('POST /environment/preflight should reject production_uncontrolled', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send({ ...validEnvInput, environmentType: 'production_uncontrolled' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.environmentTypeValid).toBe(false);
  });

  it('POST /environment/preflight should reject live_external_activation', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send({ ...validEnvInput, activationMode: 'live_external_activation' });
    expect(res.status).toBe(200);
    expect(res.body.activationModeValid).toBe(false);
  });

  it('POST /environment/preflight should reject raw_live_student_payload data mode', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send({ ...validEnvInput, dataMode: 'raw_live_student_payload' });
    expect(res.status).toBe(200);
    expect(res.body.dataModeValid).toBe(false);
  });

  it('POST /environment/preflight should reject send_notifications side effect', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send({ ...validEnvInput, sideEffectMode: 'send_notifications' });
    expect(res.status).toBe(200);
    expect(res.body.sideEffectModeValid).toBe(false);
  });

  it('POST /environment/preflight should block production deployment when requested', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send({ ...validEnvInput, productionDeploymentRequested: true });
    expect(res.body.productionDeploymentBlocked).toBe(true);
    expect(res.body.blockingIssues).toContain('production_deployment_requested');
  });

  it('POST /environment/preflight should block live AI when requested', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send({ ...validEnvInput, liveAiRequested: true });
    expect(res.body.liveAiBlocked).toBe(true);
    expect(res.body.blockingIssues).toContain('live_ai_requested');
  });

  it('POST /environment/preflight should block broad_rollout activation mode', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send({ ...validEnvInput, activationMode: 'broad_rollout' });
    expect(res.body.activationModeValid).toBe(false);
  });

  it('POST /environment/preflight should block school-wide launch when requested', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send({ ...validEnvInput, schoolWideLaunchRequested: true });
    expect(res.body.schoolWideLaunchBlocked).toBe(true);
  });

  it('POST /environment/preflight should block canary observation when requested', async () => {
    const res = await request(app)
      .post('/api/task-032/environment/preflight')
      .send({ ...validEnvInput, canaryObservationRequested: true });
    expect(res.body.canaryObservationBlocked).toBe(true);
  });
});
