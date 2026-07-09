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

describe('Task 032 - Routes / Dependency Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('POST /dependency/task031/check should return 200', async () => {
    const res = await request(app).post('/api/task-032/dependency/task031/check');
    expect(res.status).toBe(200);
  });

  it('POST /dependency/task031/check should return ok boolean', async () => {
    const res = await request(app).post('/api/task-032/dependency/task031/check');
    expect(typeof res.body.ok).toBe('boolean');
  });

  it('POST /dependency/task031/check should return task031ReportFound', async () => {
    const res = await request(app).post('/api/task-032/dependency/task031/check');
    expect(typeof res.body.task031ReportFound).toBe('boolean');
  });

  it('POST /dependency/task031/check should return safeToStartTask032', async () => {
    const res = await request(app).post('/api/task-032/dependency/task031/check');
    expect(typeof res.body.safeToStartTask032).toBe('boolean');
  });

  it('POST /dependency/task031/check should return blockingIssues array', async () => {
    const res = await request(app).post('/api/task-032/dependency/task031/check');
    expect(Array.isArray(res.body.blockingIssues)).toBe(true);
  });

  it('POST /dependency/task031/check should return safeToStartTask033', async () => {
    const res = await request(app).post('/api/task-032/dependency/task031/check');
    expect(typeof res.body.safeToStartTask033).toBe('boolean');
  });

  it('POST /dependency/task031/check should return backendBuildPassed', async () => {
    const res = await request(app).post('/api/task-032/dependency/task031/check');
    expect(typeof res.body.backendBuildPassed).toBe('boolean');
  });

  it('POST /dependency/task031/check should not expose private data', async () => {
    const res = await request(app).post('/api/task-032/dependency/task031/check');
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('password');
    expect(json).not.toContain('secret');
    expect(json).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  });
});
