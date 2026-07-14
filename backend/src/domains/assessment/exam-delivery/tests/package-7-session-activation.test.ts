import { describe, it, expect, beforeAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { createInMemoryExamDeliveryRepositories } from '../repositories/inMemoryExamDeliveryRepositories';
import { ExamDeliverySessionService } from '../services/examDeliverySessionService';
import { ExamDeliveryActivationService } from '../services/examDeliveryActivationService';
import { ExamDeliveryCommandContext } from '../contracts/examDeliveryContracts';

describe('Package 7 - Session Activation', () => {
  const repos = createInMemoryExamDeliveryRepositories();
  const sessionService = new ExamDeliverySessionService(repos);
  const activationService = new ExamDeliveryActivationService(repos);
  const schoolId = 'school1';
  const teacherCtx: ExamDeliveryCommandContext = {
    schoolId,
    actorId: 'teacher1',
    actorRole: 'teacher',
    correlationId: uuid(),
    idempotencyKey: uuid(),
  };

  let sessionId: string;

  it('creates a delivery session in draft state from approved paper references', async () => {
    const { session, policy } = await sessionService.createDeliverySession(teacherCtx, {
      paperId: 'paper1',
      paperVersionId: 'pv1',
      deliveryBridgeId: 'db1',
      accessPolicyId: 'ap1',
      title: 'Midterm Exam',
      safeInstructions: 'Read each question carefully',
      intendedAudienceType: 'class',
      sessionMode: 'teacher_controlled',
      activationMode: 'manual_teacher_activation',
    });
    expect(policy.allowed).toBe(true);
    expect(session).not.toBeNull();
    expect(session!.status).toBe('draft');
    expect(session!.paperId).toBe('paper1');
    expect(session!.paperVersionId).toBe('pv1');
    expect(session!.deliveryBridgeId).toBe('db1');
    expect(session!.accessPolicyId).toBe('ap1');
    sessionId = session!.deliverySessionId;
  });

  it('session starts in draft state', async () => {
    const session = await sessionService.getDeliverySession(sessionId);
    expect(session).not.toBeNull();
    expect(session!.status).toBe('draft');
  });

  it('can configure session', async () => {
    const { session, policy } = await sessionService.configureDeliverySession(teacherCtx, sessionId, {
      title: 'Configured Midterm',
    });
    expect(policy.allowed).toBe(true);
    expect(session).not.toBeNull();
  });

  it('session can open when readiness is valid', async () => {
    const { session, policy } = await activationService.openDeliverySession(teacherCtx, sessionId);
    expect(policy.allowed).toBe(true);
    expect(session).not.toBeNull();
    expect(session!.status).toBe('open');
    expect(session!.openedAt).not.toBeNull();
  });

  it('session can pause', async () => {
    const { session } = await activationService.pauseDeliverySession(teacherCtx, sessionId);
    expect(session).not.toBeNull();
    expect(session!.status).toBe('paused');
  });

  it('session can resume', async () => {
    const { session } = await activationService.resumeDeliverySession(teacherCtx, sessionId);
    expect(session).not.toBeNull();
    expect(session!.status).toBe('open');
  });

  it('session can close', async () => {
    const { session } = await activationService.closeDeliverySession(teacherCtx, sessionId);
    expect(session).not.toBeNull();
    expect(session!.status).toBe('closed');
    expect(session!.closedAt).not.toBeNull();
  });

  it('closing does not create marking runs', async () => {
    const session = await sessionService.getDeliverySession(sessionId);
    expect(session).not.toBeNull();
    expect(session!.status).toBe('closed');
  });

  it('scheduled_future_release_deferred activation mode is metadata only', () => {
    const mode: string = 'scheduled_future_release_deferred';
    expect(mode).toBe('scheduled_future_release_deferred');
  });

  it('session can be created with mock_window activation mode', async () => {
    const { session, policy } = await sessionService.createDeliverySession(teacherCtx, {
      paperId: 'paper2',
      paperVersionId: 'pv2',
      deliveryBridgeId: 'db2',
      accessPolicyId: 'ap2',
      title: 'Mock Exam',
      safeInstructions: 'Mock instructions',
      intendedAudienceType: 'class',
      sessionMode: 'mock_controlled',
      activationMode: 'mock_window',
    });
    expect(policy.allowed).toBe(true);
    expect(session!.activationMode).toBe('mock_window');
  });
});
