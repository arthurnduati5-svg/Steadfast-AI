import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesIncidentEscalationContract', () => {
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

  it('POST /sessions/:sessionId/incident-escalation returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/incident-escalation')
      .set('x-actor-role', 'student')
      .send({ signals: [], safeSummaries: [] });
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/incident-escalation returns ok when no signals', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/incident-escalation')
      .set('x-actor-role', 'internal_operator')
      .send({ signals: [], safeSummaries: [] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.safeSeverity).toBe('none');
  });

  it('POST /sessions/:sessionId/incident-escalation saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/incident-escalation')
      .set('x-actor-role', 'internal_operator')
      .send({ signals: [], safeSummaries: [] });
    const saved = await task034Repository.getIncidentEscalationBridge();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/incident-escalation detects forbidden alert patterns', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/incident-escalation')
      .set('x-actor-role', 'internal_operator')
      .send({ signals: ['error'], safeSummaries: ['send email notification'] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.rawIncidentDetailsExposed).toBe(true);
  });

  it('POST /sessions/:sessionId/incident-escalation sets pauseRecommended when signals present', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/incident-escalation')
      .set('x-actor-role', 'internal_operator')
      .send({ signals: ['timeout_spike'], safeSummaries: [] });
    expect(res.status).toBe(200);
    expect(res.body.pauseRecommended).toBe(true);
    expect(res.body.operatorReviewRequired).toBe(true);
  });

  it('POST /sessions/:sessionId/incident-escalation rollback and killSwitch always false', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/incident-escalation')
      .set('x-actor-role', 'internal_operator')
      .send({ signals: ['critical'], safeSummaries: [] });
    expect(res.status).toBe(200);
    expect(res.body.rollbackRecommended).toBe(false);
    expect(res.body.killSwitchRecommended).toBe(false);
  });

  it('POST /sessions/:sessionId/incident-escalation no real alerts sent', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/incident-escalation')
      .set('x-actor-role', 'internal_operator')
      .send({ signals: [], safeSummaries: [] });
    expect(res.status).toBe(200);
    expect(res.body.realAlertSent).toBe(false);
    expect(res.body.realEmailSent).toBe(false);
    expect(res.body.webhookCalled).toBe(false);
  });

  it('POST /sessions/:sessionId/incident-escalation returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/incident-escalation')
      .set('x-actor-role', 'learner')
      .send({ signals: [], safeSummaries: [] });
    expect(res.status).toBe(403);
  });
});
