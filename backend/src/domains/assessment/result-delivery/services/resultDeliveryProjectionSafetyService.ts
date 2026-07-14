import type {
  ResultDeliverySafeEnvelope,
  ResultDeliveryCommandContext,
  ResultDeliveryJobStatus,
} from '../contracts/resultDeliveryContracts';
import type {
  ResultDeliveryTeacherProjection,
  ResultDeliveryAdminProjection,
  ResultDeliveryStudentSafeProjection,
  ResultDeliveryParentBoundaryProjection,
} from '../contracts/resultDeliveryProjectionContracts';
import type { ResultDeliveryJobPreview } from '../contracts/resultDeliveryJobContracts';
import type { ResultDeliveryAttemptPreview } from '../contracts/resultDeliveryAttemptContracts';
import type { ResultDeliveryReceiptPreview } from '../contracts/resultDeliveryReceiptContracts';
import type {
  ResultDeliveryJobRepository,
  ResultDeliveryChannelEnvelopeRepository,
  ResultDeliveryAttemptRepository,
  ResultDeliveryReceiptRepository,
} from '../contracts/resultDeliveryRepositoryContracts';

const FORBIDDEN_IN_STUDENT_PARENT: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade',
  'scoreBeforeFinalization', 'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
  'liveProviderPayload', 'providerSecret', 'apiKey', 'pdfBinary', 'portalPayload', 'notificationPayload',
  'rawMasteryDelta', 'beforeStateJson', 'afterStateJson', 'deltaJson',
];

function envelope(ctx: ResultDeliveryCommandContext, overrides: Partial<ResultDeliverySafeEnvelope>): ResultDeliverySafeEnvelope {
  return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
}

export class ResultDeliveryProjectionSafetyService {
  constructor(
    private jobRepo: ResultDeliveryJobRepository,
    private envelopeRepo: ResultDeliveryChannelEnvelopeRepository,
    private attemptRepo: ResultDeliveryAttemptRepository,
    private receiptRepo: ResultDeliveryReceiptRepository,
  ) {}

  async toTeacherProjection(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.schoolId !== ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });

    const projection: ResultDeliveryTeacherProjection = {
      resultDeliveryJobId: job.resultDeliveryJobId,
      studentRef: job.studentRef,
      audienceType: job.audienceType,
      deliveryChannel: job.deliveryChannel,
      jobStatus: job.jobStatus,
      safeJobSummary: job.safeJobSummary,
      allowedFields: job.allowedFieldsJson ? Object.keys(job.allowedFieldsJson) : [],
      blockedFields: job.blockedFieldsJson ? Object.keys(job.blockedFieldsJson) : [],
      summarySafe: true,
      answerKeySafe: true,
      rubricSafe: true,
      rawAnswerSafe: true,
      teacherOnlySafe: true,
      hiddenReasoningSafe: true,
      unreleasedGradeSafe: true,
      providerPayloadSafe: true,
      assessmentDataPresent: true,
    };
    return envelope(ctx, { safeMessage: 'Teacher projection generated', data: projection });
  }

  async toAdminProjection(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.schoolId !== ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });

    const envelopes = await this.envelopeRepo.listByDeliveryJobId(ctx.schoolId, jobId);
    const attempts = await this.attemptRepo.listByDeliveryJobId(ctx.schoolId, jobId);
    const receipts = await this.receiptRepo.listByDeliveryJobId(ctx.schoolId, jobId);

    const projection: ResultDeliveryAdminProjection = {
      resultDeliveryJobId: job.resultDeliveryJobId,
      studentRef: job.studentRef,
      audienceType: job.audienceType,
      deliveryChannel: job.deliveryChannel,
      jobStatus: job.jobStatus,
      safeJobSummary: job.safeJobSummary,
      allowedFields: job.allowedFieldsJson ? Object.keys(job.allowedFieldsJson) : [],
      blockedFields: job.blockedFieldsJson ? Object.keys(job.blockedFieldsJson) : [],
      envelopeCount: envelopes.length,
      attemptCount: attempts.length,
      receiptCount: receipts.length,
      mockMode: job.jobMode,
      assessmentDataPresent: true,
    };
    return envelope(ctx, { safeMessage: 'Admin projection generated', data: projection });
  }

  async toStudentSafeProjection(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const projection: ResultDeliveryStudentSafeProjection = {
      resultDeliveryJobId: job.resultDeliveryJobId,
      studentRef: job.studentRef,
      safeSubject: '',
      safePreview: '',
      jobStatus: job.jobStatus,
      safeJobSummary: job.safeJobSummary,
      hasApprovedSummary: false,
      hasApprovedSnapshot: false,
    };
    return envelope(ctx, { safeMessage: 'Student-safe projection generated', data: projection });
  }

  async toParentBoundaryProjection(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const projection: ResultDeliveryParentBoundaryProjection = {
      resultDeliveryJobId: job.resultDeliveryJobId,
      studentRef: job.studentRef,
      safeSubject: '',
      safePreview: '',
      jobStatus: job.jobStatus,
      safeJobSummary: job.safeJobSummary,
      hasApprovedSummary: false,
      boundaryEnforced: true,
      teacherOnlyFieldsRemoved: true,
    };
    return envelope(ctx, { safeMessage: 'Parent boundary projection generated', data: projection });
  }

  async toDeliveryJobPreview(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const preview: ResultDeliveryJobPreview = {
      resultDeliveryJobId: job.resultDeliveryJobId,
      schoolId: job.schoolId,
      studentRef: job.studentRef,
      audienceType: job.audienceType,
      deliveryChannel: job.deliveryChannel,
      jobStatus: job.jobStatus,
      jobMode: job.jobMode,
      safeJobSummary: job.safeJobSummary,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
    return envelope(ctx, { safeMessage: 'Delivery job preview generated', data: preview });
  }

  async toDeliveryAttemptPreview(ctx: ResultDeliveryCommandContext, attemptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return envelope(ctx, { ok: false, safeMessage: 'Attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const preview: ResultDeliveryAttemptPreview = {
      resultDeliveryAttemptId: attempt.resultDeliveryAttemptId,
      deliveryChannel: attempt.deliveryChannel,
      attemptStatus: attempt.attemptStatus,
      attemptMode: attempt.attemptMode,
      mockProviderName: attempt.mockProviderName,
      safeAttemptSummary: attempt.safeAttemptSummary,
      attemptNumber: attempt.attemptNumber,
      createdAt: attempt.createdAt,
    };
    return envelope(ctx, { safeMessage: 'Delivery attempt preview generated', data: preview });
  }

  async toDeliveryReceiptPreview(ctx: ResultDeliveryCommandContext, receiptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const receipt = await this.receiptRepo.getById(receiptId);
    if (!receipt) return envelope(ctx, { ok: false, safeMessage: 'Receipt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const preview: ResultDeliveryReceiptPreview = {
      resultDeliveryReceiptId: receipt.resultDeliveryReceiptId,
      receiptType: receipt.receiptType,
      receiptStatus: receipt.receiptStatus,
      safeReceiptSummary: receipt.safeReceiptSummary,
      createdAt: receipt.createdAt,
    };
    return envelope(ctx, { safeMessage: 'Delivery receipt preview generated', data: preview });
  }

  async assertNoAnswerKeyLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['answerKeySafeRef'] || payload['answerKeyText'] || payload['correctAnswerSummary']) return envelope(ctx, { ok: false, safeMessage: 'Answer key leakage detected', reasonCode: 'ANSWER_KEY_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No answer key leakage' });
  }

  async assertNoRubricLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['rubricInternal'] || payload['rubricText'] || payload['rawRubric']) return envelope(ctx, { ok: false, safeMessage: 'Rubric leakage detected', reasonCode: 'RUBRIC_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No rubric leakage' });
  }

  async assertNoRawStudentAnswerLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['rawStudentAnswer']) return envelope(ctx, { ok: false, safeMessage: 'Raw student answer leakage detected', reasonCode: 'RAW_STUDENT_ANSWER_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No raw student answer leakage' });
  }

  async assertNoTeacherOnlyLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['markingNotesTeacherOnly'] || payload['teacherOnlyNotes']) return envelope(ctx, { ok: false, safeMessage: 'Teacher-only leakage detected', reasonCode: 'TEACHER_ONLY_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No teacher-only leakage' });
  }

  async assertNoHiddenReasoningLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['hiddenReasoning'] || payload['chainOfThought'] || payload['selectionReasonInternal']) return envelope(ctx, { ok: false, safeMessage: 'Hidden reasoning leakage detected', reasonCode: 'HIDDEN_REASONING_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No hidden reasoning leakage' });
  }

  async assertNoUnreleasedGradeLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['unreleasedScore'] || payload['unreleasedGrade'] || payload['scoreBeforeFinalization'] || payload['finalGradeBeforeRelease']) return envelope(ctx, { ok: false, safeMessage: 'Unreleased grade leakage detected', reasonCode: 'UNRELEASED_GRADE_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No unreleased grade leakage' });
  }

  async assertNoParentDeliveryPayloadLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['parentDeliveryPayload']) return envelope(ctx, { ok: false, safeMessage: 'Parent delivery payload leakage detected', reasonCode: 'PARENT_DELIVERY_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No parent delivery payload leakage' });
  }

  async assertNoStudentDeliveryPayloadLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['studentDeliveryPayload']) return envelope(ctx, { ok: false, safeMessage: 'Student delivery payload leakage detected', reasonCode: 'STUDENT_DELIVERY_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No student delivery payload leakage' });
  }

  async assertNoPortalPayloadLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['portalPayload']) return envelope(ctx, { ok: false, safeMessage: 'Portal payload leakage detected', reasonCode: 'PORTAL_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No portal payload leakage' });
  }

  async assertNoNotificationPayloadLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['notificationPayload']) return envelope(ctx, { ok: false, safeMessage: 'Notification payload leakage detected', reasonCode: 'NOTIFICATION_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No notification payload leakage' });
  }

  async assertNoPdfPayloadLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['pdfBinary']) return envelope(ctx, { ok: false, safeMessage: 'PDF payload leakage detected', reasonCode: 'PDF_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No PDF payload leakage' });
  }

  async assertNoRawMasteryDeltaLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['rawMasteryDelta']) return envelope(ctx, { ok: false, safeMessage: 'Raw mastery delta leakage detected', reasonCode: 'RAW_MASTERY_DELTA_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No raw mastery delta leakage' });
  }

  async assertNoProviderPayloadLeakage(ctx: ResultDeliveryCommandContext, payload: Record<string, unknown>): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['liveProviderPayload'] || payload['providerSecret'] || payload['apiKey']) return envelope(ctx, { ok: false, safeMessage: 'Provider payload leakage detected', reasonCode: 'PROVIDER_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No provider payload leakage' });
  }
}
