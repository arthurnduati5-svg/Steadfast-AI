import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesDeenBoundaryReviewContract', () => {
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

  it('POST /sessions/:sessionId/deen-boundary-review returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/deen-boundary-review')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/deen-boundary-review returns default ok:true', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/deen-boundary-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.notAFatwaEngine).toBe(true);
  });

  it('POST /sessions/:sessionId/deen-boundary-review saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/deen-boundary-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const saved = await task034Repository.getDeenBoundaryReview();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/deen-boundary-review rejects fatwa engine behavior', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/deen-boundary-review')
      .set('x-actor-role', 'internal_operator')
      .send({ notAFatwaEngine: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('fatwa_engine_detected');
  });

  it('POST /sessions/:sessionId/deen-boundary-review rejects piety scoring', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/deen-boundary-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noPietyScoring: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('piety_scoring_detected');
  });

  it('POST /sessions/:sessionId/deen-boundary-review rejects raw safeguarding exposure', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/deen-boundary-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noRawSafeguardingExposure: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('raw_safeguarding_exposure_detected');
  });

  it('POST /sessions/:sessionId/deen-boundary-review rejects unsafe authority claim', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/deen-boundary-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noUnsafeAuthorityClaim: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('unsafe_authority_claim_detected');
  });

  it('POST /sessions/:sessionId/deen-boundary-review returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/deen-boundary-review')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });
});
