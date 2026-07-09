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

describe('Task 032 - Routes / Safe View Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('GET /activations/:activationId/safe-view should return 200', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    expect(res.status).toBe(200);
  });

  it('GET /activations/:activationId/safe-view should contain activationId', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    expect(res.body.activationId).toBe('activation_safe_001');
  });

  it('GET /activations/:activationId/safe-view should contain state', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    expect(res.body.state).toBeTruthy();
    expect(typeof res.body.state).toBe('string');
  });

  it('GET /activations/:activationId/safe-view should not expose raw student data', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('raw chat');
    expect(json).not.toContain('student email');
    expect(json).not.toContain('phone');
  });

  it('GET /activations/:activationId/safe-view should include canary summary', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    expect(res.body.canarySummary).toBeTruthy();
    expect(res.body.canarySummary.activeLearners).toBeTypeOf('number');
  });

  it('GET /activations/:activationId/safe-view should include gate summaries', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    expect(res.body.gates).toBeTruthy();
    expect(Array.isArray(res.body.gates)).toBe(true);
  });

  it('GET /activations/:activationId/safe-view should not contain answer keys', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('marking scheme');
    expect(json).not.toContain('answer key');
  });

  it('GET /activations/:activationId/safe-view should not contain hidden reasoning', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('hidden reasoning');
    expect(json).not.toContain('provider prompt');
  });

  it('GET /activations/:activationId/safe-view should have timestamp', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    expect(res.body.timestamp).toBeTruthy();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  it('GET /activations/:activationId/safe-view should respond with json', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('GET /activations/:activationId/safe-view should include rollback status', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    expect(res.body.rollbackStatus).toBeTruthy();
    expect(res.body.rollbackStatus.isRolledBack).toBeTypeOf('boolean');
  });

  it('GET /activations/:activationId/safe-view should include health budget info', async () => {
    const res = await request(app)
      .get('/api/task-032/activations/activation_safe_001/safe-view');
    expect(res.body.healthBudget).toBeTruthy();
    expect(res.body.healthBudget.withinBudget).toBe(true);
  });
});
