import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardExportJobRepository,
  InMemoryResultReportCardExportTargetRepository,
  InMemoryResultReportCardExportEnvelopeRepository,
  InMemoryResultReportCardMockExportAttemptRepository,
  InMemoryResultReportCardExportReceiptRepository,
  InMemoryResultReportCardExportSuppressionRepository,
  InMemoryResultReportCardExportRetryPlanRepository,
  InMemoryResultReportCardArchiveManifestRepository,
  InMemoryResultReportCardExportAuditRepository,
  InMemoryResultReportCardExportIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardExportRepositories';

function makeCreateInput() {
  return {
    resultReportCardAssemblyId: 'assembly-1',
    resultReportCardAudienceProjectionId: 'projection-1',
    resultReportCardReviewId: 'review-1',
    resultReportCardExportIntentId: 'intent-1',
    resultReportCardRenderManifestId: 'manifest-1',
    resultReleasePacketId: 'packet-1',
    studentRef: 'student-1',
    paperId: 'paper-1',
    paperVersionId: 'paper-v1',
    deliverySessionId: 'session-1',
    exportJobMode: 'mock_export_only' as const,
    exportJobPurpose: 'standard-report-card',
    safeExportJobSummary: 'Test export job for student-1',
    schoolId: 'school-1',
    createdByActorId: 'actor-1',
    createdByRole: 'teacher',
  };
}

describe('Package 14 — Export Job Lifecycle', () => {
  let jobRepo: InMemoryResultReportCardExportJobRepository;
  let targetRepo: InMemoryResultReportCardExportTargetRepository;
  let envelopeRepo: InMemoryResultReportCardExportEnvelopeRepository;
  let attemptRepo: InMemoryResultReportCardMockExportAttemptRepository;
  let receiptRepo: InMemoryResultReportCardExportReceiptRepository;
  let suppressionRepo: InMemoryResultReportCardExportSuppressionRepository;
  let retryPlanRepo: InMemoryResultReportCardExportRetryPlanRepository;
  let archiveManifestRepo: InMemoryResultReportCardArchiveManifestRepository;

  beforeEach(() => {
    jobRepo = new InMemoryResultReportCardExportJobRepository();
    targetRepo = new InMemoryResultReportCardExportTargetRepository();
    envelopeRepo = new InMemoryResultReportCardExportEnvelopeRepository();
    attemptRepo = new InMemoryResultReportCardMockExportAttemptRepository();
    receiptRepo = new InMemoryResultReportCardExportReceiptRepository();
    suppressionRepo = new InMemoryResultReportCardExportSuppressionRepository();
    retryPlanRepo = new InMemoryResultReportCardExportRetryPlanRepository();
    archiveManifestRepo = new InMemoryResultReportCardArchiveManifestRepository();
  });

  it('can create export job from intent inputs', async () => {
    const job = await jobRepo.create(makeCreateInput());
    expect(job).toBeDefined();
    expect(job.resultReportCardExportJobId).toBeTruthy();
    expect(job.exportJobStatus).toBe('draft');
    expect(job.schoolId).toBe('school-1');
    expect(job.studentRef).toBe('student-1');
  });

  it('missing assembly is NOT blocked at repository level (validation is service-level)', async () => {
    const input = { ...makeCreateInput(), resultReportCardAssemblyId: '' };
    const job = await jobRepo.create(input);
    expect(job).toBeDefined();
    expect(job.resultReportCardAssemblyId).toBe('');
  });

  it('wrong school scope is blocked by filtering (list-only)', async () => {
    const job = await jobRepo.create(makeCreateInput());
    const wrongSchoolJobs = await jobRepo.listBySchool('school-99');
    expect(wrongSchoolJobs).toHaveLength(0);
    const sameSchoolJobs = await jobRepo.listBySchool('school-1');
    expect(sameSchoolJobs.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> validated -> queued_mock -> mock_exported -> receipt_recorded -> archive_manifest_ready', async () => {
    const job = await jobRepo.create(makeCreateInput());
    expect(job.exportJobStatus).toBe('draft');

    const validated = await jobRepo.updateStatus(job.resultReportCardExportJobId, { status: 'validated', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Validated' });
    expect(validated.exportJobStatus).toBe('validated');
    expect(validated.validatedAt).toBeTruthy();

    const queued = await jobRepo.updateStatus(validated.resultReportCardExportJobId, { status: 'queued_mock', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Queued mock' });
    expect(queued.exportJobStatus).toBe('queued_mock');
    expect(queued.queuedAt).toBeTruthy();

    const mockExported = await jobRepo.updateStatus(queued.resultReportCardExportJobId, { status: 'mock_exported', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Mock exported' });
    expect(mockExported.exportJobStatus).toBe('mock_exported');
    expect(mockExported.completedAt).toBeTruthy();

    const receiptRecorded = await jobRepo.updateStatus(mockExported.resultReportCardExportJobId, { status: 'receipt_recorded', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Receipt recorded' });
    expect(receiptRecorded.exportJobStatus).toBe('receipt_recorded');

    const archiveReady = await jobRepo.updateStatus(receiptRecorded.resultReportCardExportJobId, { status: 'archive_manifest_ready', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Archive manifest ready' });
    expect(archiveReady.exportJobStatus).toBe('archive_manifest_ready');
  });

  it('block, cancel, void transitions', async () => {
    const job = await jobRepo.create(makeCreateInput());

    const blocked = await jobRepo.block(job.resultReportCardExportJobId, 'POLICY_BLOCKED', 'Blocked by policy');
    expect(blocked.exportJobStatus).toBe('blocked');
    expect(blocked.blockedAt).toBeTruthy();

    const newJob = await jobRepo.create({ ...makeCreateInput(), resultReportCardAssemblyId: 'assembly-2' });
    const cancelled = await jobRepo.cancel(newJob.resultReportCardExportJobId, 'USER_REQUEST', 'Cancelled by user');
    expect(cancelled.exportJobStatus).toBe('cancelled');
    expect(cancelled.cancelledAt).toBeTruthy();

    const voided = await jobRepo.void(newJob.resultReportCardExportJobId, 'USER_REQUEST', 'Voided');
    expect(voided.exportJobStatus).toBe('void');
    expect(voided.voidedAt).toBeTruthy();
  });

  it('job does not send or publish anything (no live export methods exist)', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardExportJobRepository.prototype);
    expect(methods).not.toContain('publish');
    expect(methods).not.toContain('send');
    expect(methods).not.toContain('execute');
    expect(methods).not.toContain('deliver');
  });

  it('job does not generate PDF (no PDF methods)', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardExportJobRepository.prototype);
    expect(methods).not.toContain('generatePdf');
    expect(methods).not.toContain('createPdf');
    expect(methods).not.toContain('exportPdf');
    expect(methods).not.toContain('pdfBinary');
  });

  it('job does not change scores', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardExportJobRepository.prototype);
    expect(methods).not.toContain('updateScore');
    expect(methods).not.toContain('overrideScore');
    expect(methods).not.toContain('mutateResult');
  });

  it('job does not mutate Package 13 records (only operates on its own)', async () => {
    const job = await jobRepo.create(makeCreateInput());
    const updated = await jobRepo.update(job.resultReportCardExportJobId, { safeExportJobSummary: 'Updated summary' });
    expect(updated.safeExportJobSummary).toBe('Updated summary');
    expect(updated.resultReportCardAssemblyId).toBe('assembly-1');
    expect(updated).not.toHaveProperty('assemblyStatus');
    expect(updated).not.toHaveProperty('reviewStatus');
  });
});
