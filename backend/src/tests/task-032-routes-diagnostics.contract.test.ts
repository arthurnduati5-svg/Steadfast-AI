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

describe('Task 032 - Routes / Diagnostics Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('GET /diagnostics should return 200', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.status).toBe(200);
  });

  it('GET /diagnostics should contain service status map', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.body.services).toBeTruthy();
    expect(typeof res.body.services).toBe('object');
  });

  it('GET /diagnostics should list all gates with status', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.body.gates).toBeTruthy();
    expect(Array.isArray(res.body.gates)).toBe(true);
  });

  it('GET /diagnostics should include runtime guard status', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.body.runtimeGuard).toBeTruthy();
    expect(res.body.runtimeGuard.active).toBeTypeOf('boolean');
  });

  it('GET /diagnostics should include privacy boundary status', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.body.privacyBoundary).toBeTruthy();
    expect(res.body.privacyBoundary.enabled).toBe(true);
  });

  it('GET /diagnostics should include activation state', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.body.activationState).toBeTruthy();
    expect(typeof res.body.activationState).toBe('string');
  });

  it('GET /diagnostics should not contain raw student data', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('raw student');
    expect(json).not.toContain('real email');
    expect(json).not.toContain('Bearer');
  });

  it('GET /diagnostics should have timestamp', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.body.timestamp).toBeTruthy();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  it('GET /diagnostics should respond within 1000ms', async () => {
    const start = Date.now();
    await request(app).get('/api/task-032/diagnostics');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  it('GET /diagnostics should use content-type application/json', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('GET /diagnostics should include health budget status', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.body.healthBudget).toBeTruthy();
    expect(res.body.healthBudget.withinBudget).toBeTypeOf('boolean');
  });

  it('GET /diagnostics should include cohort eligibility summary', async () => {
    const res = await request(app).get('/api/task-032/diagnostics');
    expect(res.body.cohortEligibility).toBeTruthy();
    expect(res.body.cohortEligibility.passed).toBeTypeOf('boolean');
  });
});
