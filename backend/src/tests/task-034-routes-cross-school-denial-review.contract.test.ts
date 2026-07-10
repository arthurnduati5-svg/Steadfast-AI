import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesCrossSchoolDenialReviewContract', () => {
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

  it('POST /sessions/:sessionId/cross-school-denial-review returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/cross-school-denial-review')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/cross-school-denial-review returns default ok:true', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/cross-school-denial-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.crossSchoolAttemptsBlocked).toBe(true);
  });

  it('POST /sessions/:sessionId/cross-school-denial-review saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/cross-school-denial-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const saved = await task034Repository.getCrossSchoolDenialReview();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/cross-school-denial-review rejects unblocked attempts', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/cross-school-denial-review')
      .set('x-actor-role', 'internal_operator')
      .send({ crossSchoolAttemptsBlocked: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('cross_school_attempts_not_blocked');
  });

  it('POST /sessions/:sessionId/cross-school-denial-review rejects school A context visible to school B', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/cross-school-denial-review')
      .set('x-actor-role', 'internal_operator')
      .send({ schoolAContextNotVisibleToSchoolB: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('school_a_context_visible_to_school_b');
  });

  it('POST /sessions/:sessionId/cross-school-denial-review rejects inter-school learner visibility', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/cross-school-denial-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noInterSchoolLearnerVisibility: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('inter_school_learner_visibility_detected');
  });

  it('POST /sessions/:sessionId/cross-school-denial-review rejects teacher data leakage', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/cross-school-denial-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noInterSchoolTeacherDataLeakage: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('inter_school_teacher_data_leakage_detected');
  });

  it('POST /sessions/:sessionId/cross-school-denial-review returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/cross-school-denial-review')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });
});
