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

describe('Task 032 - Routes / Runtime Guard Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('POST /runtime-guard/check should pass with admin role', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        activationId: 'act_task032_guard_001'
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /runtime-guard/check should pass with authorized_canary_operator', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'authorized_canary_operator',
        activationId: 'act_task032_guard_002'
      });
    expect(res.body.ok).toBe(true);
    expect(res.body.actorRoleValid).toBe(true);
  });

  it('POST /runtime-guard/check should reject student role', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'student',
        activationId: 'act_task032_guard_003'
      });
    expect(res.body.ok).toBe(false);
    expect(res.body.actorRoleValid).toBe(false);
  });

  it('POST /runtime-guard/check should reject teacher role', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'teacher',
        activationId: 'act_task032_guard_004'
      });
    expect(res.body.ok).toBe(false);
  });

  it('POST /runtime-guard/check should require verified school context', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        actorRole: 'school_admin',
        activationId: 'act_task032_guard_005'
      });
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('missing_school_id');
  });

  it('POST /runtime-guard/check should require task031 proof', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        activationId: 'act_task032_guard_006'
      });
    expect(res.body.task031ProofRequired).toBe(true);
  });

  it('POST /runtime-guard/check should block live AI', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        activationId: 'act_task032_guard_007'
      });
    expect(res.body.noLiveAi).toBe(true);
  });

  it('POST /runtime-guard/check should block live connector writes', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        activationId: 'act_task032_guard_008'
      });
    expect(res.body.noLiveConnector).toBe(true);
  });

  it('POST /runtime-guard/check should block live notifications', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        activationId: 'act_task032_guard_009'
      });
    expect(res.body.noLiveNotification).toBe(true);
  });

  it('POST /runtime-guard/check should block deployment', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        activationId: 'act_task032_guard_010'
      });
    expect(res.body.noDeployment).toBe(true);
  });

  it('POST /runtime-guard/check should block rollout', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        activationId: 'act_task032_guard_011'
      });
    expect(res.body.noRollout).toBe(true);
  });

  it('POST /runtime-guard/check should block observation', async () => {
    const res = await request(app)
      .post('/api/task-032/runtime-guard/check')
      .send({
        schoolId: 'school_task032_canary_safe',
        actorRole: 'school_admin',
        activationId: 'act_task032_guard_012'
      });
    expect(res.body.noObservation).toBe(true);
  });
});
