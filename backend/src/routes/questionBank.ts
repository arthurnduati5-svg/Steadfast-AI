import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AssessmentCommandEnforcementService } from '../domains/assessment/assessmentCommandEnforcementService';
import { AssessmentPolicyRegistry } from '../domains/assessment/policies/assessmentPolicyRegistry';
import { AssessmentIdempotencyService } from '../domains/assessment/idempotency/assessmentIdempotencyService';
import { AssessmentAuditService } from '../domains/assessment/audit/assessmentAuditService';
import { InMemoryIdempotencyRepository, InMemoryAuditWriter } from '../domains/assessment/repositories/inMemoryAssessmentRepositories';
import { GovernedQuestionCommandService } from '../domains/assessment/question-bank/services/governedQuestionCommandService';
import { QuestionIngestionService } from '../domains/assessment/question-bank/services/questionIngestionService';
import { QuestionApprovalService } from '../domains/assessment/question-bank/services/questionApprovalService';
import { QuestionDuplicateCandidateService } from '../domains/assessment/question-bank/services/questionDuplicateCandidateService';
import { QuestionExposureHoldService } from '../domains/assessment/question-bank/services/questionExposureHoldService';

import {
  InMemoryQuestionBankItemRepository,
  InMemoryQuestionVersionRepository,
  InMemoryQuestionPartVersionRepository,
  InMemoryQuestionAssetVersionRepository,
  InMemoryAnswerKeyVersionRepository,
  InMemoryRubricVersionRepository,
  InMemoryQuestionObjectiveMappingRepository,
  InMemoryQuestionSourceRecordRepository,
  InMemoryQuestionGovernanceRepository,
  InMemoryQuestionApprovalRequestRepository,
  InMemoryQuestionApprovalRecordRepository,
  InMemoryQuestionIngestionBatchRepository,
  InMemoryQuestionIngestionCandidateRepository,
  InMemoryQuestionDuplicateCandidateRepository,
  InMemoryQuestionExposureHoldRepository,
} from '../domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories';

import { extractMockAssessmentActorContext, createSafeResponseEnvelope } from '../domains/assessment/question-bank/services/extractMockAssessmentActorContext';

const router = Router();

const policyRegistry = new AssessmentPolicyRegistry();
const idempotencyRepo = new InMemoryIdempotencyRepository();
const auditWriter = new InMemoryAuditWriter();
const idempotencyService = new AssessmentIdempotencyService(idempotencyRepo);
const auditService = new AssessmentAuditService(auditWriter);
const enforcementService = new AssessmentCommandEnforcementService({
  policyRegistry,
  idempotencyService,
  auditService,
});

const questionBankItemRepo = new InMemoryQuestionBankItemRepository();
const questionVersionRepo = new InMemoryQuestionVersionRepository();
const questionPartVersionRepo = new InMemoryQuestionPartVersionRepository();
const questionAssetVersionRepo = new InMemoryQuestionAssetVersionRepository();
const answerKeyVersionRepo = new InMemoryAnswerKeyVersionRepository();
const rubricVersionRepo = new InMemoryRubricVersionRepository();
const questionObjectiveMappingRepo = new InMemoryQuestionObjectiveMappingRepository();
const questionSourceRecordRepo = new InMemoryQuestionSourceRecordRepository();
const questionGovernanceRepo = new InMemoryQuestionGovernanceRepository();

const governedQuestionCommandService = new GovernedQuestionCommandService({
  enforcementService,
  questionBankItemRepository: questionBankItemRepo,
  questionVersionRepository: questionVersionRepo,
  questionPartVersionRepository: questionPartVersionRepo,
  questionAssetVersionRepository: questionAssetVersionRepo,
  answerKeyVersionRepository: answerKeyVersionRepo,
  rubricVersionRepository: rubricVersionRepo,
  questionObjectiveMappingRepository: questionObjectiveMappingRepo,
  questionSourceRecordRepository: questionSourceRecordRepo,
  questionGovernanceRepository: questionGovernanceRepo,
});

const approvalRequestRepo = new InMemoryQuestionApprovalRequestRepository();
const approvalRecordRepo = new InMemoryQuestionApprovalRecordRepository();

const approvalService = new QuestionApprovalService(
  enforcementService,
  approvalRequestRepo,
  approvalRecordRepo,
  questionBankItemRepo,
  questionVersionRepo,
);

const ingestionBatchRepo = new InMemoryQuestionIngestionBatchRepository();
const ingestionCandidateRepo = new InMemoryQuestionIngestionCandidateRepository();

const ingestionService = new QuestionIngestionService(
  enforcementService,
  ingestionBatchRepo,
  ingestionCandidateRepo,
  governedQuestionCommandService,
);

const duplicateCandidateRepo = new InMemoryQuestionDuplicateCandidateRepository();
const exposureHoldRepo = new InMemoryQuestionExposureHoldRepository();

const duplicateCandidateService = new QuestionDuplicateCandidateService(
  enforcementService,
  duplicateCandidateRepo,
);

const exposureHoldService = new QuestionExposureHoldService(
  enforcementService,
  exposureHoldRepo,
);

function getRequestId(req: Request): string {
  return String((req as any).requestId || req.headers['x-request-id'] || randomUUID());
}

function getCorrelationId(req: Request): string {
  return String(req.headers['x-correlation-id'] || req.body?.correlationId || randomUUID());
}

function getIdempotencyKey(req: Request): string {
  return String(req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '');
}

function safeHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      const requestId = getRequestId(req);
      const correlationId = getCorrelationId(req);
      const message = err.message || 'UNKNOWN_SAFE_ERROR';

      let status = 500;
      let errorCode = 'UNKNOWN_SAFE_ERROR';

      if (message.startsWith('SCHOOL_CONTEXT_REQUIRED')) { status = 400; errorCode = 'SCHOOL_CONTEXT_REQUIRED'; }
      else if (message.startsWith('VALIDATION_FAILED')) { status = 400; errorCode = 'VALIDATION_FAILED'; }
      else if (message.startsWith('POLICY_BLOCKED')) { status = 403; errorCode = 'POLICY_BLOCKED'; }
      else if (message.startsWith('NOT_FOUND')) { status = 404; errorCode = 'NOT_FOUND'; }
      else if (message.startsWith('INVALID_STATE')) { status = 409; errorCode = 'INVALID_STATE'; }
      else if (message.startsWith('IDEMPOTENCY_CONFLICT')) { status = 409; errorCode = 'IDEMPOTENCY_CONFLICT'; }
      else if (message.startsWith('VERSION_CONFLICT')) { status = 409; errorCode = 'VERSION_CONFLICT'; }
      else if (message.startsWith('AUTH_REQUIRED')) { status = 401; errorCode = 'AUTH_REQUIRED'; }
      else if (message.startsWith('APPROVED_SOURCE_REQUIRED')) { status = 400; errorCode = 'APPROVED_SOURCE_REQUIRED'; }
      else if (message.startsWith('FORBIDDEN_FIELD')) { status = 403; errorCode = 'FORBIDDEN_FIELD'; }
      else if (message.startsWith('DEPENDENCY_UNAVAILABLE')) { status = 503; errorCode = 'DEPENDENCY_UNAVAILABLE'; }

      res.status(status).json(createSafeResponseEnvelope({
        ok: false,
        requestId,
        correlationId,
        safeMessage: message.replace(/^[A-Z_]+:\s*/, ''),
        reasonCode: message.split(':')[0] || 'UNKNOWN_SAFE_ERROR',
        errorCode,
      }));
    }
  };
}

function buildCommandContext(context: ReturnType<typeof extractMockAssessmentActorContext>) {
  return context;
}

// POST /api/question-bank/drafts
router.post('/drafts', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.createQuestionDraft({
    context,
    commandType: 'question:draft:create',
    commandFingerprint: `draft:${context.schoolId}:${Date.now()}`,
    body: {
      schoolId: context.schoolId,
      subjectId: req.body.subjectId,
      topicId: req.body.topicId,
      skillId: req.body.skillId,
      curriculumVersionId: req.body.curriculumVersionId,
      primaryObjectiveId: req.body.primaryObjectiveId,
      sourceType: req.body.sourceType || 'teacher_created',
      securityClass: req.body.securityClass || 'practice_safe',
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to create draft', reasonCode: 'DRAFT_CREATION_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.questionId,
    status: 'draft_created',
    safeMessage: 'Question draft created',
    data: { questionId: result.data.questionId },
  }));
}));

// POST /api/question-bank/versions
router.post('/versions', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.createQuestionVersionDraft({
    context,
    commandType: 'question:version:create',
    commandFingerprint: `version:${req.body.questionId}:${Date.now()}`,
    body: {
      questionId: req.body.questionId,
      stemSafeText: req.body.stemSafeText,
      questionType: req.body.questionType,
      difficultyBand: req.body.difficultyBand || 'recall',
      language: req.body.language || 'English',
      studentSafeExplanation: req.body.studentSafeExplanation || '',
      teacherExplanation: req.body.teacherExplanation || '',
      estimatedTimeSeconds: req.body.estimatedTimeSeconds || 120,
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to create version', reasonCode: 'VERSION_CREATION_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.questionVersionId,
    status: 'version_created',
    safeMessage: 'Question version created',
    data: { questionVersionId: result.data.questionVersionId },
  }));
}));

// POST /api/question-bank/parts
router.post('/parts', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.attachQuestionPartDraft({
    context,
    commandType: 'question:part:attach',
    commandFingerprint: `part:${req.body.questionVersionId}:${Date.now()}`,
    body: {
      questionVersionId: req.body.questionVersionId,
      partKey: req.body.partKey,
      partOrder: req.body.partOrder,
      promptSafeText: req.body.promptSafeText,
      marksAvailable: req.body.marksAvailable || 0,
      expectedWorkingVisibility: req.body.expectedWorkingVisibility ?? true,
      studentInputMode: req.body.studentInputMode || 'text',
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to create part', reasonCode: 'PART_CREATION_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.questionPartVersionId,
    status: 'part_created',
    safeMessage: 'Question part created',
  }));
}));

// POST /api/question-bank/assets
router.post('/assets', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.attachQuestionAssetDraft({
    context,
    commandType: 'question:asset:attach',
    commandFingerprint: `asset:${req.body.questionVersionId}:${Date.now()}`,
    body: {
      questionVersionId: req.body.questionVersionId,
      assetType: req.body.assetType,
      assetRef: req.body.assetRef,
      assetFingerprint: req.body.assetFingerprint || '',
      studentVisible: req.body.studentVisible ?? true,
      teacherOnly: req.body.teacherOnly ?? false,
      altText: req.body.altText || '',
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to create asset', reasonCode: 'ASSET_CREATION_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.assetVersionId,
    status: 'asset_created',
    safeMessage: 'Question asset created',
  }));
}));

// POST /api/question-bank/answer-keys
router.post('/answer-keys', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.attachAnswerKeyDraft({
    context,
    commandType: 'question:answer_key:attach',
    commandFingerprint: `answer_key:${req.body.questionVersionId}:${Date.now()}`,
    body: {
      questionVersionId: req.body.questionVersionId,
      answerKeySafeRef: req.body.answerKeySafeRef,
      correctAnswerSummary: req.body.correctAnswerSummary,
      markingNotesTeacherOnly: req.body.markingNotesTeacherOnly || '',
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to create answer key', reasonCode: 'ANSWER_KEY_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.answerKeyVersionId,
    status: 'answer_key_created',
    safeMessage: 'Answer key created',
  }));
}));

// POST /api/question-bank/rubrics
router.post('/rubrics', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.attachRubricDraft({
    context,
    commandType: 'question:rubric:attach',
    commandFingerprint: `rubric:${req.body.questionVersionId}:${Date.now()}`,
    body: {
      questionVersionId: req.body.questionVersionId,
      rubricPublicSummary: req.body.rubricPublicSummary || '',
      rubricInternal: req.body.rubricInternal || '',
      marksTotal: req.body.marksTotal || 0,
      criteriaJson: req.body.criteriaJson || '[]',
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to create rubric', reasonCode: 'RUBRIC_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.rubricVersionId,
    status: 'rubric_created',
    safeMessage: 'Rubric created',
  }));
}));

// POST /api/question-bank/objective-mappings
router.post('/objective-mappings', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.mapQuestionToObjective({
    context,
    commandType: 'question:objective:map',
    commandFingerprint: `mapping:${req.body.questionVersionId}:${Date.now()}`,
    body: {
      questionVersionId: req.body.questionVersionId,
      objectiveId: req.body.objectiveId,
      objectiveVersionId: req.body.objectiveVersionId,
      mappingStrength: req.body.mappingStrength || 'primary',
      mappingReason: req.body.mappingReason || '',
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to create mapping', reasonCode: 'MAPPING_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.mappingId,
    status: 'mapping_created',
    safeMessage: 'Objective mapping created',
  }));
}));

// POST /api/question-bank/source-records
router.post('/source-records', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.recordQuestionSource({
    context,
    commandType: 'question:source:record',
    commandFingerprint: `source:${req.body.questionVersionId}:${Date.now()}`,
    body: {
      questionId: req.body.questionId,
      questionVersionId: req.body.questionVersionId,
      sourceType: req.body.sourceType,
      sourceRef: req.body.sourceRef || '',
      approvedSourceId: req.body.approvedSourceId || null,
      importBatchId: req.body.importBatchId || null,
      safeSummary: req.body.safeSummary || '',
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to create source record', reasonCode: 'SOURCE_RECORD_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.sourceRecordId,
    status: 'source_record_created',
    safeMessage: 'Source record created',
  }));
}));

// POST /api/question-bank/curriculum-validity
router.post('/curriculum-validity', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.checkCurriculumValidity({
    context,
    commandType: 'question:curriculum:check_validity',
    commandFingerprint: `validity:${req.body.questionVersionId}:${Date.now()}`,
    body: {
      questionVersionId: req.body.questionVersionId,
      schoolId: context.schoolId,
      curriculumVersionId: req.body.curriculumVersionId,
      objectiveIds: req.body.objectiveIds || [],
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to check validity', reasonCode: 'VALIDITY_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.questionVersionId,
    status: 'curriculum_validity_saved',
    safeMessage: 'Curriculum validity saved',
  }));
}));

// POST /api/question-bank/usage-eligibility
router.post('/usage-eligibility', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.checkUsageEligibility({
    context,
    commandType: 'question:usage:check_eligibility',
    commandFingerprint: `eligibility:${req.body.questionVersionId}:${Date.now()}`,
    body: {
      questionVersionId: req.body.questionVersionId,
      usageMode: req.body.usageMode,
      questionStatus: req.body.questionStatus,
      securityClass: req.body.securityClass,
      hasContentSafetyReview: req.body.hasContentSafetyReview ?? false,
      oralPolicyConfigured: req.body.oralPolicyConfigured ?? false,
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to check eligibility', reasonCode: 'ELIGIBILITY_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.questionVersionId,
    status: 'usage_eligibility_saved',
    safeMessage: 'Usage eligibility saved',
  }));
}));

// POST /api/question-bank/submit-approval
router.post('/submit-approval', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await governedQuestionCommandService.submitQuestionForApproval({
    context,
    commandType: 'question:approval:submit',
    commandFingerprint: `submit_approval:${req.body.questionVersionId}:${Date.now()}`,
    body: {
      questionId: req.body.questionId,
      questionVersionId: req.body.questionVersionId,
    },
  });

  if (!result.ok) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to submit for approval', reasonCode: 'SUBMIT_APPROVAL_FAILED' }));
    return;
  }

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: req.body.questionVersionId,
    status: 'submitted_for_approval',
    safeMessage: 'Question submitted for approval',
  }));
}));

// POST /api/question-bank/ingestion/batches
router.post('/ingestion/batches', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const batch = await ingestionService.createIngestionBatch({
    schoolId: context.schoolId,
    sourceType: req.body.sourceType,
    approvedSourceId: req.body.approvedSourceId,
    importBatchRef: req.body.importBatchRef,
    safeSummary: req.body.safeSummary || '',
    context,
  });

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: batch.ingestionBatchId,
    status: 'batch_created',
    safeMessage: 'Ingestion batch created',
    data: { ingestionBatchId: batch.ingestionBatchId },
  }));
}));

// POST /api/question-bank/ingestion/candidates
router.post('/ingestion/candidates', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const candidate = await ingestionService.addManualCandidate({
    ingestionBatchId: req.body.ingestionBatchId,
    schoolId: context.schoolId,
    candidateType: req.body.candidateType,
    stemSafeText: req.body.stemSafeText,
    questionType: req.body.questionType,
    subjectId: req.body.subjectId,
    topicId: req.body.topicId,
    skillId: req.body.skillId,
    curriculumVersionId: req.body.curriculumVersionId,
    primaryObjectiveId: req.body.primaryObjectiveId,
    approvedSourceId: req.body.approvedSourceId,
    sourceRef: req.body.sourceRef || '',
    safeMetadataJson: req.body.safeMetadataJson,
    context,
  });

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: candidate.candidateId,
    status: 'candidate_created',
    safeMessage: 'Ingestion candidate created',
    data: { candidateId: candidate.candidateId, contentHash: candidate.contentHash },
  }));
}));

// POST /api/question-bank/ingestion/candidates/:candidateId/validate
router.post('/ingestion/candidates/:candidateId/validate', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const candidate = await ingestionService.validateCandidate(req.params.candidateId, context);

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: candidate.candidateId,
    status: 'candidate_validated',
    safeMessage: `Candidate status: ${candidate.status}`,
  }));
}));

// POST /api/question-bank/ingestion/candidates/:candidateId/accept
router.post('/ingestion/candidates/:candidateId/accept', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await ingestionService.acceptCandidateAsQuestionDraft(req.params.candidateId, context);

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.item.questionId,
    status: 'candidate_accepted',
    safeMessage: 'Candidate accepted as draft question',
    data: { questionId: result.item.questionId },
  }));
}));

// POST /api/question-bank/ingestion/candidates/:candidateId/reject
router.post('/ingestion/candidates/:candidateId/reject', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const candidate = await ingestionService.rejectCandidate(
    req.params.candidateId,
    req.body.reasonCode || 'manual_rejection',
    context,
  );

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: candidate.candidateId,
    status: 'candidate_rejected',
    safeMessage: `Candidate rejected: ${candidate.rejectedReasonCode}`,
  }));
}));

// GET /api/question-bank/ingestion/batches/:batchId/candidates
router.get('/ingestion/batches/:batchId/candidates', safeHandler(async (req, res) => {
  const candidates = await ingestionService.listBatchCandidates(req.params.batchId);

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: getCorrelationId(req),
    status: 'candidates_listed',
    safeMessage: `${candidates.length} candidates found`,
    data: candidates.map(c => ({
      candidateId: c.candidateId,
      status: c.status,
      candidateType: c.candidateType,
      questionType: c.questionType,
      contentHash: c.contentHash,
      createdAt: c.createdAt,
    })),
  }));
}));

// POST /api/question-bank/approval-requests
router.post('/approval-requests', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const approvalRequest = await approvalService.createApprovalRequest({
    schoolId: context.schoolId,
    questionId: req.body.questionId,
    questionVersionId: req.body.questionVersionId,
    requestReason: req.body.requestReason || '',
    context,
  });

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: approvalRequest.approvalRequestId,
    status: 'approval_request_created',
    safeMessage: 'Approval request created',
    data: { approvalRequestId: approvalRequest.approvalRequestId },
  }));
}));

// GET /api/question-bank/approval-requests/pending
router.get('/approval-requests/pending', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const pending = await approvalService.listPendingApprovalRequests(context.schoolId);

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    status: 'pending_approval_requests',
    safeMessage: `${pending.length} pending requests`,
    data: pending.map(r => ({
      approvalRequestId: r.approvalRequestId,
      questionId: r.questionId,
      questionVersionId: r.questionVersionId,
      status: r.status,
      requestedByActorId: r.requestedByActorId,
      createdAt: r.createdAt,
    })),
  }));
}));

// POST /api/question-bank/approval-requests/:approvalRequestId/decision
router.post('/approval-requests/:approvalRequestId/decision', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const approvalRequest = await approvalRequestRepo.findById(req.params.approvalRequestId);
  if (!approvalRequest) { res.status(404).json({ ok: false, errorCode: 'NOT_FOUND' }); return; }

  const record = await approvalService.recordApprovalDecision({
    approvalRequestId: req.params.approvalRequestId,
    schoolId: context.schoolId,
    questionId: approvalRequest.questionId,
    questionVersionId: approvalRequest.questionVersionId,
    decision: req.body.decision,
    decisionReason: req.body.decisionReason || '',
    reasonCodes: req.body.reasonCodes,
    context,
  });

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: record.approvalRecordId,
    status: `decision_${record.decision}`,
    safeMessage: `Approval decision recorded: ${record.decision}`,
  }));
}));

// POST /api/question-bank/duplicate-candidates
router.post('/duplicate-candidates', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const candidate = await duplicateCandidateService.recordDuplicateCandidate({
    schoolId: context.schoolId,
    sourceQuestionVersionId: req.body.sourceQuestionVersionId,
    candidateQuestionVersionId: req.body.candidateQuestionVersionId,
    contentHash: req.body.contentHash,
    similarityReason: req.body.similarityReason || '',
    context,
  });

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: candidate.duplicateCandidateId,
    status: 'duplicate_candidate_recorded',
    safeMessage: 'Duplicate candidate recorded',
  }));
}));

// POST /api/question-bank/duplicate-candidates/:duplicateCandidateId/resolve
router.post('/duplicate-candidates/:duplicateCandidateId/resolve', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const candidate = await duplicateCandidateService.resolveDuplicateCandidate({
    duplicateCandidateId: req.params.duplicateCandidateId,
    status: req.body.status,
    resolutionReason: req.body.resolutionReason || '',
    context,
  });

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: candidate.duplicateCandidateId,
    status: 'duplicate_candidate_resolved',
    safeMessage: `Duplicate candidate resolved: ${candidate.status}`,
  }));
}));

// POST /api/question-bank/exposure-holds
router.post('/exposure-holds', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const hold = await exposureHoldService.placeExposureHold({
    schoolId: context.schoolId,
    questionId: req.body.questionId,
    questionVersionId: req.body.questionVersionId,
    holdType: req.body.holdType,
    reasonCode: req.body.reasonCode || '',
    safeSummary: req.body.safeSummary || '',
    context,
  });

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: hold.exposureHoldId,
    status: 'exposure_hold_placed',
    safeMessage: 'Exposure hold placed',
  }));
}));

// POST /api/question-bank/exposure-holds/:exposureHoldId/release
router.post('/exposure-holds/:exposureHoldId/release', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const hold = await exposureHoldService.releaseExposureHold({
    exposureHoldId: req.params.exposureHoldId,
    releaseReason: req.body.releaseReason || '',
    context,
  });

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: hold.exposureHoldId,
    status: 'exposure_hold_released',
    safeMessage: 'Exposure hold released',
  }));
}));

// GET /api/question-bank/questions/:questionId/exposure-holds
router.get('/questions/:questionId/exposure-holds', safeHandler(async (req, res) => {
  const holds = await exposureHoldService.listActiveHoldsForQuestion(req.params.questionId);

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: getCorrelationId(req),
    status: 'exposure_holds_listed',
    safeMessage: `${holds.length} active holds`,
    data: holds.map(h => ({
      exposureHoldId: h.exposureHoldId,
      holdType: h.holdType,
      status: h.status,
      reasonCode: h.reasonCode,
      createdAt: h.createdAt,
    })),
  }));
}));

// GET /api/question-bank/questions/:questionId
router.get('/questions/:questionId', safeHandler(async (req, res) => {
  const item = await questionBankItemRepo.findById(req.params.questionId);
  if (!item) { res.status(404).json({ ok: false, errorCode: 'NOT_FOUND' }); return; }

  const context = extractMockAssessmentActorContext(req);
  const isStudent = context.actorRole === 'student';
  const isParent = context.actorRole === 'parent';

  const safeData: Record<string, unknown> = {
    questionId: item.questionId,
    status: item.status,
    subjectId: item.subjectId,
    topicId: item.topicId,
    skillId: item.skillId,
    sourceType: item.sourceType,
    createdAt: item.createdAt,
  };

  if (!isStudent && !isParent) {
    safeData.currentVersionId = item.currentVersionId;
    safeData.createdByActorId = item.createdByActorId;
  }

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: item.questionId,
    status: 'question_found',
    data: safeData,
  }));
}));

// GET /api/question-bank/questions/:questionId/versions
router.get('/questions/:questionId/versions', safeHandler(async (req, res) => {
  const versions = await questionVersionRepo.findByQuestionId(req.params.questionId);

  const context = extractMockAssessmentActorContext(req);
  const safeVersions = versions.map(v => ({
    questionVersionId: v.questionVersionId,
    versionNumber: v.versionNumber,
    status: v.status,
    questionType: v.questionType,
    difficultyBand: v.difficultyBand,
    language: v.language,
    createdAt: v.createdAt,
  }));

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: getCorrelationId(req),
    status: 'versions_listed',
    safeMessage: `${safeVersions.length} versions found`,
    data: safeVersions,
  }));
}));

// GET /api/question-bank/versions/:questionVersionId
router.get('/versions/:questionVersionId', safeHandler(async (req, res) => {
  const version = await questionVersionRepo.findById(req.params.questionVersionId);
  if (!version) { res.status(404).json({ ok: false, errorCode: 'NOT_FOUND' }); return; }

  const context = extractMockAssessmentActorContext(req);
  const isStudentParent = context.actorRole === 'student' || context.actorRole === 'parent';

  const safeData: Record<string, unknown> = {
    questionVersionId: version.questionVersionId,
    versionNumber: version.versionNumber,
    status: version.status,
    stemSafeText: version.stemSafeText,
    questionType: version.questionType,
    difficultyBand: version.difficultyBand,
    language: version.language,
    studentSafeExplanation: version.studentSafeExplanation,
    estimatedTimeSeconds: version.estimatedTimeSeconds,
    createdAt: version.createdAt,
  };

  if (!isStudentParent) {
    safeData.teacherExplanation = version.teacherExplanation;
  }

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: version.questionVersionId,
    status: 'version_found',
    data: safeData,
  }));
}));

export default router;
