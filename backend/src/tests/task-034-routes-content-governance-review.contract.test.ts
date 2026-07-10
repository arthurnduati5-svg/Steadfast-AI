import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesContentGovernanceReviewContract', () => {
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

  it('POST /sessions/:sessionId/content-governance-review returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/content-governance-review')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/content-governance-review returns default ok:true', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/content-governance-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.approvedCurriculumSourceRequired).toBe(true);
  });

  it('POST /sessions/:sessionId/content-governance-review saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/content-governance-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const saved = await task034Repository.getContentGovernanceReview();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/content-governance-review rejects invented teaching claim', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/content-governance-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noInventedTeachingClaim: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('invented_teaching_claim_detected');
  });

  it('POST /sessions/:sessionId/content-governance-review rejects answer key leakage', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/content-governance-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noAnswerKeyLeakage: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('answer_key_leakage_detected');
  });

  it('POST /sessions/:sessionId/content-governance-review rejects marking scheme leakage', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/content-governance-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noMarkingSchemeLeakage: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('marking_scheme_leakage_detected');
  });

  it('POST /sessions/:sessionId/content-governance-review rejects teacher only leakage', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/content-governance-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noTeacherOnlyLeakage: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('teacher_only_leakage_detected');
  });

  it('POST /sessions/:sessionId/content-governance-review returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/content-governance-review')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });
});
