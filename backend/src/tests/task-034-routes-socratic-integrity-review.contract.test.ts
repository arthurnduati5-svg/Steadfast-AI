import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesSocraticIntegrityReviewContract', () => {
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

  it('POST /sessions/:sessionId/socratic-integrity-review returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/socratic-integrity-review')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/socratic-integrity-review returns default ok:true', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/socratic-integrity-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.socraticGuidancePreserved).toBe(true);
  });

  it('POST /sessions/:sessionId/socratic-integrity-review saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/socratic-integrity-review')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const saved = await task034Repository.getSocraticIntegrityReview();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/socratic-integrity-review rejects final answer bot behavior', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/socratic-integrity-review')
      .set('x-actor-role', 'internal_operator')
      .send({ noFinalAnswerBotBehavior: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('final_answer_bot_behavior_detected');
  });

  it('POST /sessions/:sessionId/socratic-integrity-review rejects cheating prevention failure', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/socratic-integrity-review')
      .set('x-actor-role', 'internal_operator')
      .send({ cheatingPreventionPreserved: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('cheating_prevention_not_preserved');
  });

  it('POST /sessions/:sessionId/socratic-integrity-review rejects missing hint ladder', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/socratic-integrity-review')
      .set('x-actor-role', 'internal_operator')
      .send({ hintLadderPreserved: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('hint_ladder_not_preserved');
  });

  it('POST /sessions/:sessionId/socratic-integrity-review rejects missing teacher escalation', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/socratic-integrity-review')
      .set('x-actor-role', 'internal_operator')
      .send({ teacherEscalationAvailable: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('teacher_escalation_not_available');
  });

  it('POST /sessions/:sessionId/socratic-integrity-review returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/socratic-integrity-review')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });
});
