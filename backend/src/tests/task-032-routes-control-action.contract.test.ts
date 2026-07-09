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

describe('Task 032 - Routes / Control Action Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const validAction = {
    schoolId: 'school_task032_canary_safe',
    actorRole: 'school_admin',
    action: 'pause'
  };

  it('POST /activations/:activationId/control-action should return 200 for pause', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send(validAction);
    expect(res.status).toBe(200);
  });

  it('POST /activations/:activationId/control-action should contain action field', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send(validAction);
    expect(res.body.action).toBe('pause');
  });

  it('POST /activations/:activationId/control-action should contain status', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send(validAction);
    expect(res.body.status).toBeTruthy();
    expect(typeof res.body.status).toBe('string');
  });

  it('POST /activations/:activationId/control-action should return new state', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send(validAction);
    expect(res.body.newState).toBeTruthy();
    expect(typeof res.body.newState).toBe('string');
  });

  it('POST /activations/:activationId/control-action should accept resume action', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send({ ...validAction, action: 'resume' });
    expect(res.status).toBe(200);
    expect(res.body.action).toBe('resume');
  });

  it('POST /activations/:activationId/control-action should accept kill-switch action', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send({ ...validAction, action: 'kill-switch' });
    expect(res.status).toBe(200);
    expect(res.body.action).toBe('kill-switch');
  });

  it('POST /activations/:activationId/control-action should not leak private data', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send(validAction);
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('raw student');
    expect(json).not.toContain('Bearer');
  });

  it('POST /activations/:activationId/control-action should have timestamp', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send(validAction);
    expect(res.body.timestamp).toBeTruthy();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  it('POST /activations/:activationId/control-action should respond with json', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send(validAction);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('POST /activations/:activationId/control-action should reject invalid action', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send({ ...validAction, action: 'invalid_action' });
    expect(res.status).toBe(200);
    expect(res.body.blockingIssues).toBeTruthy();
  });

  it('POST /activations/:activationId/control-action should include activationId', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send(validAction);
    expect(res.body.activationId).toBe('activation_ctrl_001');
  });

  it('POST /activations/:activationId/control-action should reject missing action', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_ctrl_001/control-action')
      .send({ ...validAction, action: undefined });
    expect(res.body.blockingIssues).toBeTruthy();
  });
});
