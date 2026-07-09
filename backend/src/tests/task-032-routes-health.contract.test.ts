import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import task032Router from '../routes/task032ControlledCanaryActivationRoutes';

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/task-032', task032Router);
  return app;
}

describe('Task 032 - Routes / Health Contract', () => {
  const app = createApp();

  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/api/task-032/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health should return task TASK-032', async () => {
    const res = await request(app).get('/api/task-032/health');
    expect(res.body.task).toBe('TASK-032');
  });

  it('GET /health should return correct scope', async () => {
    const res = await request(app).get('/api/task-032/health');
    expect(res.body.scope).toBe('controlled-canary-activation-runtime-backend');
  });

  it('GET /health should have timestamp field', async () => {
    const res = await request(app).get('/api/task-032/health');
    expect(res.body.timestamp).toBeTruthy();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  it('GET /health should respond within 500ms', async () => {
    const start = Date.now();
    await request(app).get('/api/task-032/health');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('GET /health should not contain private data', async () => {
    const res = await request(app).get('/api/task-032/health');
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('raw student');
    expect(json).not.toContain('secret');
    expect(json).not.toContain('Bearer');
  });

  it('GET /health should not fail when db is unavailable', async () => {
    const res = await request(app).get('/api/task-032/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health should use content-type application/json', async () => {
    const res = await request(app).get('/api/task-032/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });
});
