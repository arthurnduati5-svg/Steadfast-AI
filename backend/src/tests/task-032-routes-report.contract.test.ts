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

describe('Task 032 - Routes / Report Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('GET /reports/latest should return 200 with report object', async () => {
    const res = await request(app).get('/api/task-032/reports/latest');
    expect(res.status).toBe(200);
    expect(res.body).toBeTypeOf('object');
  });

  it('GET /reports/latest should contain task032Identity', async () => {
    const res = await request(app).get('/api/task-032/reports/latest');
    expect(res.body.task032Identity).toBeTruthy();
    expect(res.body.task032Identity.taskName).toContain('Controlled');
  });

  it('GET /reports/latest should contain gatesSummary', async () => {
    const res = await request(app).get('/api/task-032/reports/latest');
    expect(res.body.gatesSummary).toBeTruthy();
    expect(Array.isArray(res.body.gatesSummary)).toBe(true);
  });

  it('GET /reports/latest should have safeToStartTask033 field', async () => {
    const res = await request(app).get('/api/task-032/reports/latest');
    expect(res.body.safeToStartTask033).toBeTypeOf('boolean');
  });

  it('GET /reports/latest should contain finalDecision', async () => {
    const res = await request(app).get('/api/task-032/reports/latest');
    expect(res.body.finalDecision).toBeTruthy();
    expect(typeof res.body.finalDecision).toBe('string');
  });

  it('GET /reports/latest should contain blockingIssues array', async () => {
    const res = await request(app).get('/api/task-032/reports/latest');
    expect(Array.isArray(res.body.blockingIssues)).toBe(true);
  });

  it('GET /reports/latest should not leak raw private data', async () => {
    const res = await request(app).get('/api/task-032/reports/latest');
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('raw student');
    expect(json).not.toContain('raw chat');
    expect(json).not.toContain('Bearer');
  });

  it('GET /reports/latest should respond with content-type json', async () => {
    const res = await request(app).get('/api/task-032/reports/latest');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('POST /activations/:activationId/report should return 200 for valid activation', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_test_001/report');
    expect(res.status).toBe(200);
    expect(res.body.reportGenerated).toBe(true);
  });

  it('POST /activations/:activationId/report should contain scenarioRun flag', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_test_001/report');
    expect(res.body.scenarioRun).toBeTypeOf('boolean');
  });

  it('POST /activations/:activationId/report should not expose secrets', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_test_001/report');
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('secret');
    expect(json).not.toContain('password');
    expect(json).not.toContain('Bearer');
  });
});
