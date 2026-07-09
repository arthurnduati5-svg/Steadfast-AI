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

describe('Task 032 - Cross-Learner Access Denial Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const learnerRequest = {
    schoolId: 'school_task032_canary_safe',
    actorRole: 'student',
    learnerId: 'learner_001'
  };

  it('GET /activations/:activationId/safe-view should block cross-learner data', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_learner_001/safe-view')
      .query(learnerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/report should block learner access', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_learner_001/report')
      .send(learnerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/control-action should block learner access', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_learner_001/control-action')
      .send({ ...learnerRequest, action: 'pause' });
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('GET /reports/latest should block learner access', async () => {
    const res = await request(app)
      .get('/api/task-032/reports/latest')
      .query(learnerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('GET /diagnostics should block learner access', async () => {
    const res = await request(app)
      .get('/api/task-032/diagnostics')
      .query(learnerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/health-budget should block learner access', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_learner_001/health-budget')
      .send(learnerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/incident-bridge should block learner access', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_learner_001/incident-bridge')
      .send({ ...learnerRequest, incidentType: 'test', incidentSeverity: 'low' });
    expect(res.body.acknowledged).toBe(false);
  });

  it('POST /privacy-boundary/check should block learner access', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send(learnerRequest);
    expect(res.body.ok).toBe(false);
  });

  it('POST /config/approved-school-canary should block learner access', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...learnerRequest, maxCanaryLearners: 25 });
    expect(res.body.blockingIssues).toContain('unknown_approval_role');
  });

  it('cross-learner responses should not expose other learner data', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_learner_001/safe-view')
      .query(learnerRequest);
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('learner_001 details');
    expect(json).not.toContain('raw chat');
  });

  it('learner access to health should be ok but gated', async () => {
    const res = await request(app)
      .get('/api/task-032/health')
      .query(learnerRequest);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('learner role should see own limited safe-view', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_learner_001/safe-view')
      .query({ ...learnerRequest, actorRole: 'student' });
    expect(res.body.blockingIssues).toBeTruthy();
  });
});
