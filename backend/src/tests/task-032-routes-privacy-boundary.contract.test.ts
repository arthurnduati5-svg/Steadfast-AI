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

describe('Task 032 - Routes / Privacy Boundary Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('POST /privacy-boundary/check should pass with valid schoolId', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /privacy-boundary/check should block raw learner profiles', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.rawLearnerProfilesBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block real emails', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.realEmailsBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block real phone numbers', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.realPhoneNumbersBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block parent contact data', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.parentContactDataBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block raw chat', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.rawChatBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block raw student answers', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.rawStudentAnswersBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block safeguarding raw notes', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.safeguardingRawNotesBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block private Deen text', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.privateDeenTextBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block answer keys', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.answerKeysBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block provider prompts/responses', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.providerPromptsResponsesBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should block hidden reasoning', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ schoolId: 'school_task032_canary_safe', actorRole: 'school_admin' });
    expect(res.body.hiddenReasoningBlocked).toBe(true);
  });

  it('POST /privacy-boundary/check should reject missing schoolId', async () => {
    const res = await request(app)
      .post('/api/task-032/privacy-boundary/check')
      .send({ actorRole: 'school_admin' });
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('missing_school_id');
  });
});
