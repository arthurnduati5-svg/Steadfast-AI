import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesPrivacyReviewContract', () => {
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

  it('POST /sessions/:sessionId/privacy-review returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/privacy-review')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/privacy-review returns default ok:true', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/privacy-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.noRawLearnerData).toBe(true);
  });

  it('POST /sessions/:sessionId/privacy-review saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/privacy-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const saved = await task034Repository.getPrivacyReview();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/privacy-review rejects raw learner data', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/privacy-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noRawLearnerData: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('raw_learner_data_exposed');
  });

  it('POST /sessions/:sessionId/privacy-review rejects raw chat exposure', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/privacy-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noRawChat: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('raw_chat_exposed');
  });

  it('POST /sessions/:sessionId/privacy-review rejects answer key exposure', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/privacy-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noAnswerKey: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('answer_key_exposed');
  });

  it('POST /sessions/:sessionId/privacy-review rejects private deen text exposure', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/privacy-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noPrivateDeenText: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('private_deen_text_exposed');
  });

  it('POST /sessions/:sessionId/privacy-review returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/privacy-review')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });
});
