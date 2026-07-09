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

describe('Task 032 - Cross-School Access Denial Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const schoolARequest = {
    schoolId: 'school_task032_canary_safe',
    actorRole: 'school_admin'
  };

  const schoolBRequest = {
    schoolId: 'school_task032_other_unsafe',
    actorRole: 'school_admin'
  };

  it('POST /config/approved-school-canary should reject cross-school config', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...schoolBRequest, maxCanaryLearners: 25, allowedClassIds: ['class_001'] });
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /privacy-boundary/check should reject cross-school schoolId', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send(schoolBRequest);
    expect(res.body.ok).toBe(false);
  });

  it('GET /activations/:activationId/safe-view should deny cross-school access', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_cross_001/safe-view')
      .query(schoolBRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/control-action should deny cross-school access', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_cross_001/control-action')
      .send({ ...schoolBRequest, action: 'pause' });
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/incident-bridge should deny cross-school', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_cross_001/incident-bridge')
      .send({ ...schoolBRequest, incidentType: 'test', incidentSeverity: 'low' });
    expect(res.body.acknowledged).toBe(false);
  });

  it('POST /activations/:activationId/health-budget should deny cross-school', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_cross_001/health-budget')
      .send(schoolBRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('GET /diagnostics should deny cross-school access', async () => {
    const res = await request(app)
      .get('/api/task-032/diagnostics')
      .query(schoolBRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/report should deny cross-school', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_cross_001/report')
      .send(schoolBRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('GET /reports/latest should deny cross-school access', async () => {
    const res = await request(app)
      .get('/api/task-032/reports/latest')
      .query(schoolBRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('cross-school responses should not leak approved school data', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_cross_001/safe-view')
      .query(schoolBRequest);
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('raw student');
    expect(json).not.toContain('student email');
  });

  it('approved school admin should still pass own school gates', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send(schoolARequest);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('cross-school access should fail with role check', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send(schoolBRequest);
    expect(res.body.failureReasons).toBeTruthy();
  });
});
