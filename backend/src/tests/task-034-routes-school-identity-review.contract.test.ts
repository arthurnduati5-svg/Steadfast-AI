import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesSchoolIdentityReviewContract', () => {
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

  it('POST /sessions/:sessionId/school-identity-review returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/school-identity-review')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/school-identity-review returns default ok:true', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/school-identity-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.verifiedSchoolIdentityRequired).toBe(true);
  });

  it('POST /sessions/:sessionId/school-identity-review saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/school-identity-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const saved = await task034Repository.getSchoolIdentityReview();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/school-identity-review rejects unknown school', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/school-identity-review')
      .set('x-actor-role', 'internal_operator')
      .send({ unknownSchoolDenied: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('unknown_school_not_denied');
  });

  it('POST /sessions/:sessionId/school-identity-review rejects cross school access', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/school-identity-review')
      .set('x-actor-role', 'internal_operator')
      .send({ crossSchoolAccessDenied: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('cross_school_access_not_denied');
  });

  it('POST /sessions/:sessionId/school-identity-review rejects missing actor role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/school-identity-review')
      .set('x-actor-role', 'internal_operator')
      .send({ actorRoleRequired: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('actor_role_not_required');
  });

  it('POST /sessions/:sessionId/school-identity-review rejects session before school context', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/school-identity-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noSessionBeforeSchoolContext: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('session_allowed_before_school_context');
  });

  it('POST /sessions/:sessionId/school-identity-review returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/school-identity-review')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });
});
