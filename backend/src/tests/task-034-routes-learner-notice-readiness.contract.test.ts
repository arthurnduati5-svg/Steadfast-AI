import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesLearnerNoticeReadinessContract', () => {
  let app: express.Express;
  const validInput = {
    noticeIsCalm: true,
    noticeIsAgeAppropriate: true,
    noticeIsNonAlarming: true,
    noticeMentionsThinkingFirst: true,
    noticeMentionsTeacherSupport: true,
    noInternalRolloutDetails: true,
    noRiskScores: true,
    noPrivateComparisons: true,
    noPietyScore: true,
    noClassmateComparison: true,
    noRawIncidentDetail: true,
    noAnswerArtifact: true,
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('POST /learner-notice/readiness returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/learner-notice/readiness')
      .set('x-actor-role', 'student')
      .send(validInput);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /learner-notice/readiness returns 200 with valid input', async () => {
    const res = await supertest(app)
      .post('/learner-notice/readiness')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.noticeIsCalm).toBe(true);
    expect(res.body.noticeIsAgeAppropriate).toBe(true);
  });

  it('POST /learner-notice/readiness saves to repository', async () => {
    await supertest(app)
      .post('/learner-notice/readiness')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    const saved = await task034Repository.getLearnerNoticeReadiness();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /learner-notice/readiness rejects non-calm notice', async () => {
    const res = await supertest(app)
      .post('/learner-notice/readiness')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, noticeIsCalm: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('noticeIsCalm_not_passed');
  });

  it('POST /learner-notice/readiness rejects internal rollout details exposure', async () => {
    const res = await supertest(app)
      .post('/learner-notice/readiness')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, noInternalRolloutDetails: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('noInternalRolloutDetails_not_passed');
  });

  it('POST /learner-notice/readiness rejects piety score presence', async () => {
    const res = await supertest(app)
      .post('/learner-notice/readiness')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, noPietyScore: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('noPietyScore_not_passed');
  });

  it('POST /learner-notice/readiness sets noticeNotActuallySent', async () => {
    const res = await supertest(app)
      .post('/learner-notice/readiness')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.noticeNotActuallySent).toBe(true);
  });

  it('POST /learner-notice/readiness returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/learner-notice/readiness')
      .set('x-actor-role', 'learner')
      .send(validInput);
    expect(res.status).toBe(403);
  });
});
