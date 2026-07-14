import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardExportSuppressionRepository,
  InMemoryResultReportCardExportRetryPlanRepository,
} from '../repositories/inMemoryResultReportCardExportRepositories';

describe('Package 14 — Suppression and Retry Plans', () => {
  let suppressionRepo: InMemoryResultReportCardExportSuppressionRepository;
  let retryPlanRepo: InMemoryResultReportCardExportRetryPlanRepository;

  beforeEach(() => {
    suppressionRepo = new InMemoryResultReportCardExportSuppressionRepository();
    retryPlanRepo = new InMemoryResultReportCardExportRetryPlanRepository();
  });

  it('suppression can be created for job', async () => {
    const suppression = await suppressionRepo.create({
      resultReportCardExportJobId: 'job-1',
      suppressionReason: 'Policy blocked',
      suppressionScope: 'job',
      safeSuppressionSummary: 'Export job suppressed by policy',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(suppression.suppressionStatus).toBe('active');
    expect(suppression.suppressionScope).toBe('job');
  });

  it('suppression can be created for target', async () => {
    const suppression = await suppressionRepo.create({
      resultReportCardExportJobId: 'job-1',
      resultReportCardExportTargetId: 'target-1',
      suppressionReason: 'Target blocked',
      suppressionScope: 'target',
      safeSuppressionSummary: 'Target suppressed',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(suppression.suppressionStatus).toBe('active');
    expect(suppression.resultReportCardExportTargetId).toBe('target-1');
  });

  it('suppression can be created for envelope', async () => {
    const suppression = await suppressionRepo.create({
      resultReportCardExportJobId: 'job-1',
      resultReportCardExportEnvelopeId: 'envelope-1',
      suppressionReason: 'Envelope blocked',
      suppressionScope: 'envelope',
      safeSuppressionSummary: 'Envelope suppressed',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(suppression.suppressionStatus).toBe('active');
    expect(suppression.resultReportCardExportEnvelopeId).toBe('envelope-1');
  });

  it('suppression blocks unsafe export continuation (status tracking)', async () => {
    const suppression = await suppressionRepo.create({
      resultReportCardExportJobId: 'job-1',
      suppressionReason: 'Unsafe export blocked',
      suppressionScope: 'job',
      safeSuppressionSummary: 'Blocked unsafe export',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(suppression.suppressionStatus).toBe('active');
  });

  it('suppression can be lifted', async () => {
    const suppression = await suppressionRepo.create({
      resultReportCardExportJobId: 'job-1',
      suppressionReason: 'Temporary block',
      suppressionScope: 'job',
      safeSuppressionSummary: 'Temporary suppression',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const lifted = await suppressionRepo.lift(suppression.resultReportCardExportSuppressionId);
    expect(lifted.suppressionStatus).toBe('lifted');
    expect(lifted.liftedAt).toBeTruthy();
  });

  it('suppression can be voided', async () => {
    const suppression = await suppressionRepo.create({
      resultReportCardExportJobId: 'job-1',
      suppressionReason: 'Incorrect suppression',
      suppressionScope: 'job',
      safeSuppressionSummary: 'Void this suppression',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const voided = await suppressionRepo.void(suppression.resultReportCardExportSuppressionId, 'USER_REQUEST', 'Voided by user');
    expect(voided.suppressionStatus).toBe('void');
  });

  it('retry plan can be created for mock attempt', async () => {
    const plan = await retryPlanRepo.create({
      resultReportCardExportJobId: 'job-1',
      resultReportCardMockExportAttemptId: 'attempt-1',
      safeRetrySummary: 'Retry plan for mock attempt',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(plan.retryStatus).toBe('draft');
    expect(plan.retryPolicy).toBe('default');
    expect(plan.maxMockAttempts).toBe(3);
  });

  it('retry plan can be marked planned', async () => {
    const plan = await retryPlanRepo.create({
      resultReportCardExportJobId: 'job-1',
      resultReportCardMockExportAttemptId: 'attempt-1',
      safeRetrySummary: 'Retry plan',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const planned = await retryPlanRepo.markPlanned(plan.resultReportCardExportRetryPlanId);
    expect(planned.retryStatus).toBe('planned');
  });

  it('retry plan can be cancelled', async () => {
    const plan = await retryPlanRepo.create({
      resultReportCardExportJobId: 'job-1',
      resultReportCardMockExportAttemptId: 'attempt-1',
      safeRetrySummary: 'Retry plan',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const cancelled = await retryPlanRepo.cancel(plan.resultReportCardExportRetryPlanId, 'USER_REQUEST', 'Cancelled');
    expect(cancelled.retryStatus).toBe('cancelled');
    expect(cancelled.cancelledAt).toBeTruthy();
  });

  it('retry plan can be exhausted', async () => {
    const plan = await retryPlanRepo.create({
      resultReportCardExportJobId: 'job-1',
      resultReportCardMockExportAttemptId: 'attempt-1',
      safeRetrySummary: 'Retry plan',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const exhausted = await retryPlanRepo.exhaust(plan.resultReportCardExportRetryPlanId, 'MAX_ATTEMPTS', 'Exhausted');
    expect(exhausted.retryStatus).toBe('exhausted');
  });

  it('retry plan can be voided', async () => {
    const plan = await retryPlanRepo.create({
      resultReportCardExportJobId: 'job-1',
      resultReportCardMockExportAttemptId: 'attempt-1',
      safeRetrySummary: 'Retry plan',
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const voided = await retryPlanRepo.void(plan.resultReportCardExportRetryPlanId, 'USER_REQUEST', 'Voided');
    expect(voided.retryStatus).toBe('void');
  });

  it('retry plan does not schedule worker (no worker methods)', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardExportRetryPlanRepository.prototype);
    expect(methods).not.toContain('scheduleWorker');
    expect(methods).not.toContain('scheduleRetry');
    expect(methods).not.toContain('enqueueRetry');
  });

  it('retry plan does not execute retry', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardExportRetryPlanRepository.prototype);
    expect(methods).not.toContain('executeRetry');
    expect(methods).not.toContain('runRetry');
  });

  it('retry plan does not call provider', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardExportRetryPlanRepository.prototype);
    expect(methods).not.toContain('callProvider');
    expect(methods).not.toContain('sendToProvider');
  });
});
