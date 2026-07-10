import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesRollbackProtectionContract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
    task034Repository.saveRolloutSession({ sessionId: 'session-001', status: 'created', rolloutStage: 'created' } as any);
  });

  it('POST /sessions/:sessionId/rollback-protection returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/rollback-protection')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/rollback-protection returns default ok:true', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/rollback-protection')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.rollbackAvailable).toBe(true);
    expect(res.body.pauseAvailable).toBe(true);
  });

  it('POST /sessions/:sessionId/rollback-protection saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/rollback-protection')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const saved = await task034Repository.getRollbackProtection();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/rollback-protection rejects when rollback unavailable', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/rollback-protection')
      .set('x-actor-role', 'internal_operator')
      .send({ rollbackAvailable: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('rollback_not_available');
  });

  it('POST /sessions/:sessionId/rollback-protection rejects when kill switch unavailable', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/rollback-protection')
      .set('x-actor-role', 'internal_operator')
      .send({ killSwitchAvailable: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('kill_switch_not_available');
  });

  it('POST /sessions/:sessionId/rollback-protection rejects invalid rollback plan', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/rollback-protection')
      .set('x-actor-role', 'internal_operator')
      .send({ rollbackPlanValid: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('rollback_plan_not_valid');
  });

  it('POST /sessions/:sessionId/rollback-protection checks audit preservation', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/rollback-protection')
      .set('x-actor-role', 'internal_operator')
      .send({ safeAuditPreservedOnRollback: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('safe_audit_not_preserved_on_rollback');
  });

  it('POST /sessions/:sessionId/rollback-protection returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/rollback-protection')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });
});
