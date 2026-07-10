import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';

describe('Task034RoutesHealthContract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  it('GET /health returns 200 with status ok', async () => {
    const res = await supertest(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('task034-controlled-limited-rollout');
  });

  it('GET /health includes a timestamp', async () => {
    const res = await supertest(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /health returns valid ISO timestamp', async () => {
    const res = await supertest(app).get('/health');
    expect(res.status).toBe(200);
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('GET /health returns expected body shape', async () => {
    const res = await supertest(app).get('/health');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['service', 'status', 'timestamp']);
  });

  it('GET /health works without auth headers', async () => {
    const res = await supertest(app).get('/health').set('x-actor-role', 'anonymous');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
