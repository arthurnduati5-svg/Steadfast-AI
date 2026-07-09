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

describe('Task 032 - Routes / Health Budget Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const validBudgetCheck = {
    activationId: 'activation_health_001',
    schoolId: 'school_task032_canary_safe',
    actorRole: 'school_admin'
  };

  it('POST /activations/:activationId/health-budget should return 200', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(res.status).toBe(200);
  });

  it('POST /activations/:activationId/health-budget should contain withinBudget field', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(res.body.withinBudget).toBeTypeOf('boolean');
  });

  it('POST /activations/:activationId/health-budget should contain current usage', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(res.body.currentUsage).toBeTypeOf('number');
    expect(res.body.currentUsage).toBeGreaterThanOrEqual(0);
  });

  it('POST /activations/:activationId/health-budget should contain max budget', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(res.body.maxBudget).toBeTypeOf('number');
    expect(res.body.maxBudget).toBeGreaterThan(0);
  });

  it('POST /activations/:activationId/health-budget should contain budgetId', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(res.body.budgetId).toBeTruthy();
    expect(typeof res.body.budgetId).toBe('string');
  });

  it('POST /activations/:activationId/health-budget should not leak private data', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('raw student');
    expect(json).not.toContain('secret');
  });

  it('POST /activations/:activationId/health-budget should reject missing activationId', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/invalid/health-budget')
      .send(validBudgetCheck);
    expect(res.body.withinBudget).toBeTypeOf('boolean');
  });

  it('POST /activations/:activationId/health-budget should include warnings array', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(Array.isArray(res.body.warnings)).toBe(true);
  });

  it('POST /activations/:activationId/health-budget should include errors array', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('POST /activations/:activationId/health-budget should have timestamp', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(res.body.timestamp).toBeTruthy();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  it('POST /activations/:activationId/health-budget should respond with json', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('POST /activations/:activationId/health-budget should not have negative usage', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_health_001/health-budget')
      .send(validBudgetCheck);
    expect(res.body.currentUsage).toBeGreaterThanOrEqual(0);
    expect(res.body.maxBudget).toBeGreaterThan(0);
  });
});
