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

describe('Task 032 - Peer Role Denied From All Routes Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const peerRequest = {
    schoolId: 'school_task032_canary_safe',
    actorRole: 'peer'
  };

  it('GET /health should deny peer role', async () => {
    const res = await request(app)
      .get('/api/task-032/health')
      .query(peerRequest);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /config/approved-school-canary should deny peer role', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...peerRequest, maxCanaryLearners: 25 });
    expect(res.body.blockingIssues).toContain('unknown_approval_role');
  });

  it('POST /privacy-boundary/check should deny peer role', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send(peerRequest);
    expect(res.body.ok).toBe(false);
  });

  it('GET /reports/latest should deny peer role', async () => {
    const res = await request(app)
      .get('/api/task-032/reports/latest')
      .query(peerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/control-action should deny peer role', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_peer_001/control-action')
      .send({ ...peerRequest, action: 'pause' });
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/incident-bridge should deny peer role', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_peer_001/incident-bridge')
      .send({ ...peerRequest, incidentType: 'test', incidentSeverity: 'low' });
    expect(res.body.acknowledged).toBe(false);
  });

  it('GET /diagnostics should deny peer role', async () => {
    const res = await request(app)
      .get('/api/task-032/diagnostics')
      .query(peerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/health-budget should deny peer role', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_peer_001/health-budget')
      .send(peerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('GET /activations/:activationId/safe-view should deny peer role', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_peer_001/safe-view')
      .query(peerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/report should deny peer role', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_peer_001/report')
      .send(peerRequest);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /config/approved-school-canary should list peer role as unauthorized', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...peerRequest, approvedByRole: 'peer', maxCanaryLearners: 25 });
    expect(res.body.blockingIssues).toContain('unknown_approval_role');
  });

  it('all peer routes should not leak private data', async () => {
    const res1 = await request(app).get('/api/task-032/health').query(peerRequest);
    const res2 = await request(app).post('/api/task-032/config/approved-school-canary').send(peerRequest);
    const combined = JSON.stringify(res1.body) + JSON.stringify(res2.body);
    expect(combined).not.toContain('raw student');
    expect(combined).not.toContain('Bearer');
  });
});
