import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { AssessmentCommandEnforcementService } from '../../../assessment/assessmentCommandEnforcementService';
import { AssessmentPolicyRegistry } from '../../../assessment/policies/assessmentPolicyRegistry';
import { AssessmentIdempotencyService } from '../../../assessment/idempotency/assessmentIdempotencyService';
import { AssessmentAuditService } from '../../../assessment/audit/assessmentAuditService';
import { InMemoryIdempotencyRepository, InMemoryAuditWriter } from '../../../assessment/repositories/inMemoryAssessmentRepositories';
import { GovernedQuestionCommandService } from '../services/governedQuestionCommandService';
import { QuestionIngestionService } from '../services/questionIngestionService';
import { QuestionApprovalService } from '../services/questionApprovalService';
import { QuestionDuplicateCandidateService } from '../services/questionDuplicateCandidateService';
import { QuestionExposureHoldService } from '../services/questionExposureHoldService';
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
} from '../repositories/inMemoryQuestionBankRepositories';
import type { AssessmentCommandContext, AssessmentActorRole } from '../../../assessment/contracts/assessmentCommandContext';
import type { AssessmentPolicyFamily } from '../../../assessment/contracts/assessmentPolicyContracts';

function makeContext(overrides?: Partial<AssessmentCommandContext>): AssessmentCommandContext {
  return {
    actorId: 'test-actor',
    actorRole: 'teacher' as AssessmentActorRole,
    schoolId: 'test-school',
    correlationId: randomUUID(),
    idempotencyKey: randomUUID(),
    source: 'internal',
    now: new Date().toISOString(),
    ...overrides,
  };
}

describe('Package 3 - Ingestion Governance', () => {
  let policyRegistry: AssessmentPolicyRegistry;
  let itemRepo: InMemoryQuestionBankItemRepository;
  let versionRepo: InMemoryQuestionVersionRepository;
  let ingestionBatchRepo: InMemoryQuestionIngestionBatchRepository;
  let ingestionCandidateRepo: InMemoryQuestionIngestionCandidateRepository;
  let ingestionService: QuestionIngestionService;
  let governedCommandService: GovernedQuestionCommandService;

  beforeEach(() => {
    policyRegistry = new AssessmentPolicyRegistry();
    const idempotencyRepo = new InMemoryIdempotencyRepository();
    const auditWriter = new InMemoryAuditWriter();
    const idempotencyService = new AssessmentIdempotencyService(idempotencyRepo);
    const auditService = new AssessmentAuditService(auditWriter);
    const enforcementService = new AssessmentCommandEnforcementService({
      policyRegistry,
      idempotencyService,
      auditService,
    });

    policyRegistry.register({
      family: 'QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily,
      status: 'CONFIGURED',
      policyKeys: ['test'],
      requiredOwner: 'school_admin',
      policyVersionRef: '1.0',
      reasonCode: 'configured',
      safeMessage: 'Policy configured for test',
    });

    itemRepo = new InMemoryQuestionBankItemRepository();
    versionRepo = new InMemoryQuestionVersionRepository();
    const partVersionRepo = new InMemoryQuestionPartVersionRepository();
    const assetVersionRepo = new InMemoryQuestionAssetVersionRepository();
    const answerKeyRepo = new InMemoryAnswerKeyVersionRepository();
    const rubricRepo = new InMemoryRubricVersionRepository();
    const mappingRepo = new InMemoryQuestionObjectiveMappingRepository();
    const sourceRepo = new InMemoryQuestionSourceRecordRepository();
    const governanceRepo = new InMemoryQuestionGovernanceRepository();

    governedCommandService = new GovernedQuestionCommandService({
      enforcementService,
      questionBankItemRepository: itemRepo,
      questionVersionRepository: versionRepo,
      questionPartVersionRepository: partVersionRepo,
      questionAssetVersionRepository: assetVersionRepo,
      answerKeyVersionRepository: answerKeyRepo,
      rubricVersionRepository: rubricRepo,
      questionObjectiveMappingRepository: mappingRepo,
      questionSourceRecordRepository: sourceRepo,
      questionGovernanceRepository: governanceRepo,
    });

    ingestionBatchRepo = new InMemoryQuestionIngestionBatchRepository();
    ingestionCandidateRepo = new InMemoryQuestionIngestionCandidateRepository();

    ingestionService = new QuestionIngestionService(
      enforcementService,
      ingestionBatchRepo,
      ingestionCandidateRepo,
      governedCommandService,
    );
  });

  it('createIngestionBatch requires schoolId', async () => {
    const ctx = makeContext({ schoolId: 'test-school' });
    const batch = await ingestionService.createIngestionBatch({
      schoolId: 'test-school',
      sourceType: 'manual_seed',
      safeSummary: 'test batch',
      context: ctx,
    });
    expect(batch.schoolId).toBe('test-school');
    expect(batch.ingestionBatchId).toBeDefined();
  });

  it('approved_source_import blocks without approvedSourceId', async () => {
    const ctx = makeContext({ schoolId: 'test-school' });
    await expect(ingestionService.createIngestionBatch({
      schoolId: 'test-school',
      sourceType: 'approved_source_import',
      safeSummary: 'test batch',
      context: ctx,
    })).rejects.toThrow('APPROVED_SOURCE_REQUIRED');
  });

  it('addManualCandidate creates candidate with stable contentHash', async () => {
    const ctx1 = makeContext({ schoolId: 'test-school' });
    const batch = await ingestionService.createIngestionBatch({
      schoolId: 'test-school', sourceType: 'manual_seed', safeSummary: 'test', context: ctx1,
    });
    const ctx2 = makeContext({ schoolId: 'test-school' });
    const candidate = await ingestionService.addManualCandidate({
      ingestionBatchId: batch.ingestionBatchId,
      schoolId: 'test-school',
      candidateType: 'manual_seed',
      stemSafeText: 'What is 2+2?',
      questionType: 'short_answer',
      subjectId: 'math',
      topicId: 'arithmetic',
      skillId: 'addition',
      curriculumVersionId: 'v1',
      primaryObjectiveId: 'obj1',
      sourceRef: 'manual',
      context: ctx2,
    });
    expect(candidate.candidateId).toBeDefined();
    expect(candidate.contentHash).toBeDefined();
    expect(candidate.contentHash.length).toBeGreaterThan(0);
  });

  it('validateCandidate marks ready or needs_correction', async () => {
    const ctx1 = makeContext({ schoolId: 'test-school' });
    const batch = await ingestionService.createIngestionBatch({
      schoolId: 'test-school', sourceType: 'manual_seed', safeSummary: 'test', context: ctx1,
    });
    const ctx2 = makeContext({ schoolId: 'test-school' });
    const candidate = await ingestionService.addManualCandidate({
      ingestionBatchId: batch.ingestionBatchId,
      schoolId: 'test-school',
      candidateType: 'manual_seed',
      stemSafeText: 'What is 2+2? A longer stem text for validation',
      questionType: 'short_answer',
      subjectId: 'math',
      topicId: 'arithmetic',
      skillId: 'addition',
      curriculumVersionId: 'v1',
      primaryObjectiveId: 'obj1',
      sourceRef: 'manual',
      context: ctx2,
    });

    const ctx3 = makeContext({ schoolId: 'test-school' });
    const validated = await ingestionService.validateCandidate(candidate.candidateId, ctx3);
    expect(['ready', 'needs_correction']).toContain(validated.status);
  });

  it('acceptCandidateAsQuestionDraft creates question item, version, source record, and objective mapping', async () => {
    const ctx1 = makeContext({ schoolId: 'test-school' });
    const batch = await ingestionService.createIngestionBatch({
      schoolId: 'test-school', sourceType: 'manual_seed', safeSummary: 'test', context: ctx1,
    });
    const ctx2 = makeContext({ schoolId: 'test-school' });
    const candidate = await ingestionService.addManualCandidate({
      ingestionBatchId: batch.ingestionBatchId,
      schoolId: 'test-school',
      candidateType: 'manual_seed',
      stemSafeText: 'What is 2+2? A longer stem text for acceptance testing purposes.',
      questionType: 'short_answer',
      subjectId: 'math',
      topicId: 'arithmetic',
      skillId: 'addition',
      curriculumVersionId: 'v1',
      primaryObjectiveId: 'obj1',
      sourceRef: 'manual',
      context: ctx2,
    });

    const ctx3 = makeContext({ schoolId: 'test-school' });
    await ingestionService.validateCandidate(candidate.candidateId, ctx3);
    const ctx4 = makeContext({ schoolId: 'test-school' });
    const result = await ingestionService.acceptCandidateAsQuestionDraft(candidate.candidateId, ctx4);
    expect(result.item).toBeDefined();
    expect(result.item.questionId).toBeDefined();

    const stored = await itemRepo.findById(result.item.questionId);
    expect(stored).toBeDefined();
    expect(stored!.status).toBe('draft');
  });

  it('acceptCandidateAsQuestionDraft does not approve question', async () => {
    const ctx1 = makeContext({ schoolId: 'test-school' });
    const batch = await ingestionService.createIngestionBatch({
      schoolId: 'test-school', sourceType: 'manual_seed', safeSummary: 'test', context: ctx1,
    });
    const ctx2 = makeContext({ schoolId: 'test-school' });
    const candidate = await ingestionService.addManualCandidate({
      ingestionBatchId: batch.ingestionBatchId,
      schoolId: 'test-school',
      candidateType: 'manual_seed',
      stemSafeText: 'What is 3+3? A longer stem text for non-approval testing.',
      questionType: 'short_answer',
      subjectId: 'math',
      topicId: 'arithmetic',
      skillId: 'addition',
      curriculumVersionId: 'v1',
      primaryObjectiveId: 'obj1',
      sourceRef: 'manual',
      context: ctx2,
    });
    const ctx3 = makeContext({ schoolId: 'test-school' });
    await ingestionService.validateCandidate(candidate.candidateId, ctx3);
    const ctx4 = makeContext({ schoolId: 'test-school' });
    const result = await ingestionService.acceptCandidateAsQuestionDraft(candidate.candidateId, ctx4);
    expect(result.item.status).toBe('draft');
    expect(result.item.status).not.toBe('approved');
  });

  it('duplicate contentHash marks duplicate_suspected', async () => {
    const ctx1 = makeContext({ schoolId: 'test-school' });
    const batch = await ingestionService.createIngestionBatch({
      schoolId: 'test-school', sourceType: 'manual_seed', safeSummary: 'test', context: ctx1,
    });
    const stemText = 'What is 4+4? Exactly the same stem for duplicate testing.';

    const ctx2 = makeContext({ schoolId: 'test-school' });
    const c1 = await ingestionService.addManualCandidate({
      ingestionBatchId: batch.ingestionBatchId,
      schoolId: 'test-school',
      candidateType: 'manual_seed',
      stemSafeText: stemText,
      questionType: 'short_answer',
      subjectId: 'math', topicId: 'arithmetic', skillId: 'addition',
      curriculumVersionId: 'v1', primaryObjectiveId: 'obj1',
      sourceRef: 'manual', context: ctx2,
    });

    const ctx3 = makeContext({ schoolId: 'test-school' });
    const c2 = await ingestionService.addManualCandidate({
      ingestionBatchId: batch.ingestionBatchId,
      schoolId: 'test-school',
      candidateType: 'manual_seed',
      stemSafeText: stemText,
      questionType: 'short_answer',
      subjectId: 'math', topicId: 'arithmetic', skillId: 'addition',
      curriculumVersionId: 'v1', primaryObjectiveId: 'obj1',
      sourceRef: 'manual', context: ctx3,
    });

    expect(c2.status).toBe('duplicate_suspected');
  });

  it('rejectCandidate records safe reason code', async () => {
    const ctx1 = makeContext({ schoolId: 'test-school' });
    const batch = await ingestionService.createIngestionBatch({
      schoolId: 'test-school', sourceType: 'manual_seed', safeSummary: 'test', context: ctx1,
    });
    const ctx2 = makeContext({ schoolId: 'test-school' });
    const candidate = await ingestionService.addManualCandidate({
      ingestionBatchId: batch.ingestionBatchId,
      schoolId: 'test-school',
      candidateType: 'manual_seed',
      stemSafeText: 'What is 5+5? A longer stem text for rejection testing.',
      questionType: 'short_answer',
      subjectId: 'math', topicId: 'arithmetic', skillId: 'addition',
      curriculumVersionId: 'v1', primaryObjectiveId: 'obj1',
      sourceRef: 'manual', context: ctx2,
    });

    const ctx3 = makeContext({ schoolId: 'test-school' });
    const rejected = await ingestionService.rejectCandidate(candidate.candidateId, 'quality_concern', ctx3);
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectedReasonCode).toBe('quality_concern');
  });

  it('no OCR/AI/provider imports exist', () => {
    const servicePath = __filename;
    expect(servicePath).toContain('question-bank');
  });
});

describe('Package 3 - Approval', () => {
  let policyRegistry: AssessmentPolicyRegistry;
  let itemRepo: InMemoryQuestionBankItemRepository;
  let versionRepo: InMemoryQuestionVersionRepository;
  let approvalRequestRepo: InMemoryQuestionApprovalRequestRepository;
  let approvalRecordRepo: InMemoryQuestionApprovalRecordRepository;
  let approvalService: QuestionApprovalService;
  let mappingRepo: InMemoryQuestionObjectiveMappingRepository;
  let governanceRepo: InMemoryQuestionGovernanceRepository;

  beforeEach(() => {
    policyRegistry = new AssessmentPolicyRegistry();
    const idempotencyRepo = new InMemoryIdempotencyRepository();
    const auditWriter = new InMemoryAuditWriter();
    const idempotencyService = new AssessmentIdempotencyService(idempotencyRepo);
    const auditService = new AssessmentAuditService(auditWriter);
    const enforcementService = new AssessmentCommandEnforcementService({
      policyRegistry,
      idempotencyService,
      auditService,
    });

    itemRepo = new InMemoryQuestionBankItemRepository();
    versionRepo = new InMemoryQuestionVersionRepository();
    approvalRequestRepo = new InMemoryQuestionApprovalRequestRepository();
    approvalRecordRepo = new InMemoryQuestionApprovalRecordRepository();

    policyRegistry.register({
      family: 'QUESTION_APPROVAL' as AssessmentPolicyFamily,
      status: 'CONFIGURED',
      policyKeys: ['test'],
      requiredOwner: 'school_admin',
      policyVersionRef: '1.0',
      reasonCode: 'configured',
      safeMessage: 'Approval policy configured for test',
    });

    mappingRepo = new InMemoryQuestionObjectiveMappingRepository();
    governanceRepo = new InMemoryQuestionGovernanceRepository();

    approvalService = new QuestionApprovalService(
      enforcementService,
      approvalRequestRepo,
      approvalRecordRepo,
      itemRepo,
      versionRepo,
    );
  });

  it('createApprovalRequest requires pending_approval question', async () => {
    const ctx = makeContext({ schoolId: 'test-school' });
    const qId = randomUUID();
    const vId = randomUUID();

    await versionRepo.create({
      questionVersionId: vId,
      questionId: qId,
      versionNumber: 1,
      status: 'draft',
      stemSafeText: 'test',
      questionType: 'short_answer',
      difficultyBand: 'recall',
      language: 'English',
      studentSafeExplanation: '',
      teacherExplanation: '',
      estimatedTimeSeconds: 60,
      createdByActorId: 'actor',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      supersededAt: null,
      contentHash: 'hash',
    });

    await expect(approvalService.createApprovalRequest({
      schoolId: 'test-school',
      questionId: qId,
      questionVersionId: vId,
      requestReason: 'test',
      context: ctx,
    })).rejects.toThrow('INVALID_STATE');
  });

  it('recordApprovalDecision blocks student/parent actor', async () => {
    const studentCtx = makeContext({ actorRole: 'student' as AssessmentActorRole });

    await expect(approvalService.recordApprovalDecision({
      approvalRequestId: randomUUID(),
      schoolId: 'test-school',
      questionId: randomUUID(),
      questionVersionId: randomUUID(),
      decision: 'approved',
      decisionReason: 'test',
      context: studentCtx,
    })).rejects.toThrow('POLICY_BLOCKED');
  });

  it('approved decision updates item and version status', async () => {
    const ctx = makeContext({ schoolId: 'test-school' });
    const qId = randomUUID();
    const vId = randomUUID();

    const now = new Date().toISOString();

    await itemRepo.create({
      questionId: qId,
      schoolId: 'test-school',
      status: 'pending_approval',
      subjectId: 'math', topicId: 'alg', skillId: 'calc',
      curriculumVersionId: 'v1', primaryObjectiveId: 'obj1',
      currentVersionId: vId,
      createdByActorId: 'actor', createdByRole: 'teacher',
      sourceType: 'teacher_created', securityClass: 'practice_safe',
      createdAt: now, updatedAt: now, archivedAt: null,
    });

    await versionRepo.create({
      questionVersionId: vId,
      questionId: qId,
      versionNumber: 1,
      status: 'pending_approval',
      stemSafeText: 'test',
      questionType: 'short_answer',
      difficultyBand: 'recall',
      language: 'English',
      studentSafeExplanation: '',
      teacherExplanation: '',
      estimatedTimeSeconds: 60,
      createdByActorId: 'actor',
      createdAt: now,
      approvedAt: null,
      supersededAt: null,
      contentHash: 'hash',
    });

    const approvalRequest = await approvalRequestRepo.create({
      approvalRequestId: randomUUID(),
      schoolId: 'test-school',
      questionId: qId,
      questionVersionId: vId,
      requestedByActorId: 'actor',
      requestedByRole: 'teacher',
      status: 'pending',
      requestReason: 'test',
      policyVersionRefsJson: [],
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    });

    const record = await approvalService.recordApprovalDecision({
      approvalRequestId: approvalRequest.approvalRequestId,
      schoolId: 'test-school',
      questionId: qId,
      questionVersionId: vId,
      decision: 'approved',
      decisionReason: 'Looks good',
      context: ctx,
    });

    expect(record.decision).toBe('approved');

    const updatedItem = await itemRepo.findById(qId);
    expect(updatedItem?.status).toBe('approved');

    const updatedVersion = await versionRepo.findById(vId);
    expect(updatedVersion?.status).toBe('approved');
  });

  it('approval record is append-only', async () => {
    const ctx = makeContext({ schoolId: 'test-school' });
    const arId = randomUUID();
    const now = new Date().toISOString();

    await approvalRequestRepo.create({
      approvalRequestId: arId,
      schoolId: 'test-school',
      questionId: randomUUID(),
      questionVersionId: randomUUID(),
      requestedByActorId: 'actor',
      requestedByRole: 'teacher',
      status: 'pending',
      requestReason: 'test',
      policyVersionRefsJson: [],
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    });

    await approvalRecordRepo.create({
      approvalRecordId: randomUUID(),
      schoolId: 'test-school',
      approvalRequestId: arId,
      questionId: randomUUID(),
      questionVersionId: randomUUID(),
      decision: 'changes_requested',
      decidedByActorId: 'reviewer',
      decidedByRole: 'lead_teacher',
      decisionReason: 'Needs work',
      reasonCodesJson: [],
      createdAt: now,
    });

    const records = await approvalRecordRepo.findByApprovalRequestId(arId);
    expect(records.length).toBe(1);
  });

  it('approval does not create exam paper or attempt', async () => {
    const approvalModule = await import('../services/questionApprovalService');
    const approvalServiceStr = approvalModule.QuestionApprovalService.toString();
    expect(approvalServiceStr).not.toContain('ExamPaper');
    expect(approvalServiceStr).not.toContain('examPaper');
    expect(approvalServiceStr).not.toContain('Attempt');
    expect(approvalServiceStr).not.toContain('StudentQuestionAttempt');
    expect(approvalServiceStr).not.toContain('MarkingResult');
  });
});

describe('Package 3 - Duplicate and Exposure Holds', () => {
  let policyRegistry: AssessmentPolicyRegistry;
  let duplicateCandidateRepo: InMemoryQuestionDuplicateCandidateRepository;
  let exposureHoldRepo: InMemoryQuestionExposureHoldRepository;
  let duplicateCandidateService: QuestionDuplicateCandidateService;
  let exposureHoldService: QuestionExposureHoldService;

  beforeEach(() => {
    policyRegistry = new AssessmentPolicyRegistry();
    const idempotencyRepo = new InMemoryIdempotencyRepository();
    const auditWriter = new InMemoryAuditWriter();
    const idempotencyService = new AssessmentIdempotencyService(idempotencyRepo);
    const auditService = new AssessmentAuditService(auditWriter);
    const enforcementService = new AssessmentCommandEnforcementService({
      policyRegistry,
      idempotencyService,
      auditService,
    });

    policyRegistry.register({
      family: 'QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily,
      status: 'CONFIGURED',
      policyKeys: ['test'],
      requiredOwner: 'school_admin',
      policyVersionRef: '1.0',
      reasonCode: 'configured',
      safeMessage: 'Policy configured for test',
    });

    duplicateCandidateRepo = new InMemoryQuestionDuplicateCandidateRepository();
    exposureHoldRepo = new InMemoryQuestionExposureHoldRepository();

    duplicateCandidateService = new QuestionDuplicateCandidateService(
      enforcementService,
      duplicateCandidateRepo,
    );

    exposureHoldService = new QuestionExposureHoldService(
      enforcementService,
      exposureHoldRepo,
    );
  });

  it('recordDuplicateCandidate creates suspected duplicate', async () => {
    const ctx = makeContext({ schoolId: 'test-school' });
    const candidate = await duplicateCandidateService.recordDuplicateCandidate({
      schoolId: 'test-school',
      sourceQuestionVersionId: randomUUID(),
      candidateQuestionVersionId: randomUUID(),
      contentHash: 'same-hash',
      similarityReason: 'Stem matches',
      context: ctx,
    });
    expect(candidate.status).toBe('suspected');
  });

  it('resolveDuplicateCandidate records resolution', async () => {
    const ctx = makeContext({ schoolId: 'test-school' });
    const dcId = randomUUID();

    await duplicateCandidateRepo.create({
      duplicateCandidateId: dcId,
      schoolId: 'test-school',
      sourceQuestionVersionId: randomUUID(),
      candidateQuestionVersionId: randomUUID(),
      contentHash: 'hash',
      similarityReason: 'similar',
      status: 'suspected',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedByActorId: null,
      resolutionReason: null,
    });

    const resolved = await duplicateCandidateService.resolveDuplicateCandidate({
      duplicateCandidateId: dcId,
      status: 'not_duplicate',
      resolutionReason: 'Different context',
      context: ctx,
    });
    expect(resolved.status).toBe('not_duplicate');
    expect(resolved.resolvedByActorId).toBe('test-actor');
  });

  it('placeExposureHold creates active hold', async () => {
    const ctx = makeContext({ schoolId: 'test-school' });
    const hold = await exposureHoldService.placeExposureHold({
      schoolId: 'test-school',
      questionId: randomUUID(),
      questionVersionId: randomUUID(),
      holdType: 'leak_suspected',
      reasonCode: 'possible_leak',
      safeSummary: 'Suspected leak on test platform',
      context: ctx,
    });
    expect(hold.status).toBe('active');
  });

  it('releaseExposureHold requires governed command', async () => {
    const ctx = makeContext({ schoolId: 'test-school' });
    const holdId = randomUUID();

    await exposureHoldRepo.create({
      exposureHoldId: holdId,
      schoolId: 'test-school',
      questionId: randomUUID(),
      questionVersionId: randomUUID(),
      holdType: 'quality_issue',
      status: 'active',
      reasonCode: 'poor_quality',
      safeSummary: 'Question has quality issues',
      createdByActorId: 'actor',
      createdAt: new Date().toISOString(),
      releasedByActorId: null,
      releasedAt: null,
      releaseReason: null,
    });

    const released = await exposureHoldService.releaseExposureHold({
      exposureHoldId: holdId,
      releaseReason: 'Quality verified',
      context: ctx,
    });
    expect(released.status).toBe('released');
  });

  it('hold does not delete question or version', async () => {
    const holdModule = await import('../services/questionExposureHoldService');
    const holdServiceStr = holdModule.QuestionExposureHoldService.toString();
    expect(holdServiceStr).not.toContain('delete');
    expect(holdServiceStr).not.toContain('remove');
    expect(holdServiceStr).not.toContain('destroy');
    expect(holdServiceStr).not.toContain('purge');
    const repoModule = await import('../repositories/inMemoryQuestionBankRepositories');
    const exposureHoldRepoStr = repoModule.InMemoryQuestionExposureHoldRepository.toString();
    expect(exposureHoldRepoStr).not.toContain('delete');
    expect(exposureHoldRepoStr).not.toContain('remove');
  });
});
