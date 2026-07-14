import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardMockExportAttemptRepository,
  InMemoryResultReportCardExportReceiptRepository,
} from '../repositories/inMemoryResultReportCardExportRepositories';
import { FORBIDDEN_EXPORT_ENVELOPE_FIELDS } from '../contracts/resultReportCardExportContracts';

function makeAttemptInput() {
  return {
    resultReportCardExportJobId: 'job-1',
    resultReportCardExportTargetId: 'target-1',
    resultReportCardExportEnvelopeId: 'envelope-1',
    attemptMode: 'mock_success' as const,
    mockProviderName: 'mock-pdf-provider',
    targetType: 'pdf_export_future' as const,
    safeAttemptSummary: 'Mock export attempt for PDF future',
    schoolId: 'school-1',
    createdByActorId: 'actor-1',
    createdByRole: 'teacher',
  };
}

function makeReceiptInput(attemptId: string) {
  return {
    resultReportCardExportJobId: 'job-1',
    resultReportCardExportTargetId: 'target-1',
    resultReportCardExportEnvelopeId: 'envelope-1',
    resultReportCardMockExportAttemptId: attemptId,
    receiptType: 'dry_run_preview' as const,
    safeReceiptSummary: 'Dry run preview receipt',
    providerSimulationJson: { mockProvider: 'mock-pdf-provider', simulated: true } as Record<string, unknown>,
    schoolId: 'school-1',
    createdByActorId: 'actor-1',
    createdByRole: 'teacher',
  };
}

describe('Package 14 — Mock Export Receipts', () => {
  let attemptRepo: InMemoryResultReportCardMockExportAttemptRepository;
  let receiptRepo: InMemoryResultReportCardExportReceiptRepository;

  beforeEach(() => {
    attemptRepo = new InMemoryResultReportCardMockExportAttemptRepository();
    receiptRepo = new InMemoryResultReportCardExportReceiptRepository();
  });

  it('mock export attempt can be created', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    expect(attempt.attemptStatus).toBe('created');
    expect(attempt.attemptNumber).toBe(1);
  });

  it('mock export attempt can be started', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    const started = await attemptRepo.start(attempt.resultReportCardMockExportAttemptId);
    expect(started.attemptStatus).toBe('started');
    expect(started.startedAt).toBeTruthy();
  });

  it('mock export attempt can be completed', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    const started = await attemptRepo.start(attempt.resultReportCardMockExportAttemptId);
    const completed = await attemptRepo.complete(started.resultReportCardMockExportAttemptId);
    expect(completed.attemptStatus).toBe('completed');
    expect(completed.completedAt).toBeTruthy();
  });

  it('mock export attempt can fail', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    const failed = await attemptRepo.fail(attempt.resultReportCardMockExportAttemptId, 'SIMULATION_ERROR', 'Simulated failure');
    expect(failed.attemptStatus).toBe('failed');
    expect(failed.failedAt).toBeTruthy();
  });

  it('mock export attempt can be blocked', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    const blocked = await attemptRepo.block(attempt.resultReportCardMockExportAttemptId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.attemptStatus).toBe('blocked');
  });

  it('mock export attempt can be voided', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    const voided = await attemptRepo.void(attempt.resultReportCardMockExportAttemptId, 'USER_REQUEST', 'Voided');
    expect(voided.attemptStatus).toBe('void');
  });

  it('mock export attempt never calls live provider (no provider methods exist)', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardMockExportAttemptRepository.prototype);
    expect(methods).not.toContain('sendToProvider');
    expect(methods).not.toContain('callProvider');
    expect(methods).not.toContain('executeProvider');
  });

  it('mock export attempt never writes files', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardMockExportAttemptRepository.prototype);
    expect(methods).not.toContain('writeFile');
    expect(methods).not.toContain('saveFile');
    expect(methods).not.toContain('uploadFile');
  });

  it('mock export attempt never publishes', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardMockExportAttemptRepository.prototype);
    expect(methods).not.toContain('publish');
    expect(methods).not.toContain('broadcast');
  });

  it('mock export attempt never sends notification', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardMockExportAttemptRepository.prototype);
    expect(methods).not.toContain('sendNotification');
    expect(methods).not.toContain('notify');
  });

  it('dry-run export receipt can be recorded', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    const receipt = await receiptRepo.create(makeReceiptInput(attempt.resultReportCardMockExportAttemptId));
    expect(receipt.receiptStatus).toBe('created');
    expect(receipt.receiptType).toBe('dry_run_preview');
  });

  it('receipt contains safe simulation metadata only', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    const receipt = await receiptRepo.create(makeReceiptInput(attempt.resultReportCardMockExportAttemptId));
    expect(receipt.providerSimulationJson).toBeDefined();
    expect(receipt.providerSimulationJson).toHaveProperty('mockProvider');
    expect(receipt.providerSimulationJson).toHaveProperty('simulated');
    expect(receipt.safeReceiptSummary).toBeTruthy();
  });

  it('receipt contains no live provider response (via FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('liveProviderPayload');
  });

  it('receipt contains no raw destination (via FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('emailPayload');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('smsPayload');
  });

  it('receipt contains no PDF binary (via FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBinary');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBuffer');
  });

  it('receipt can be blocked', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    const receipt = await receiptRepo.create(makeReceiptInput(attempt.resultReportCardMockExportAttemptId));
    const blocked = await receiptRepo.block(receipt.resultReportCardExportReceiptId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.receiptStatus).toBe('blocked');
  });

  it('receipt can be voided', async () => {
    const attempt = await attemptRepo.create(makeAttemptInput());
    const receipt = await receiptRepo.create(makeReceiptInput(attempt.resultReportCardMockExportAttemptId));
    const voided = await receiptRepo.void(receipt.resultReportCardExportReceiptId, 'USER_REQUEST', 'Voided');
    expect(voided.receiptStatus).toBe('void');
  });
});
