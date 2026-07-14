import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AssessmentCommandEnforcementService } from '../domains/assessment/assessmentCommandEnforcementService';
import { AssessmentPolicyRegistry } from '../domains/assessment/policies/assessmentPolicyRegistry';
import { AssessmentIdempotencyService } from '../domains/assessment/idempotency/assessmentIdempotencyService';
import { AssessmentAuditService } from '../domains/assessment/audit/assessmentAuditService';
import { InMemoryIdempotencyRepository, InMemoryAuditWriter } from '../domains/assessment/repositories/inMemoryAssessmentRepositories';
import { extractMockAssessmentActorContext, createSafeResponseEnvelope } from '../domains/assessment/question-bank/services/extractMockAssessmentActorContext';
import { AssessmentGovernedCommand } from '../domains/assessment/contracts/assessmentCommandContext';

import { ExamBlueprintCommandService } from '../domains/assessment/exam-blueprint/services/examBlueprintCommandService';
import { QuestionPoolEligibilityService } from '../domains/assessment/exam-blueprint/services/questionPoolEligibilityService';
import { QuestionSelectionService } from '../domains/assessment/exam-blueprint/services/questionSelectionService';
import { ExamDraftSetGenerationService } from '../domains/assessment/exam-blueprint/services/examDraftSetGenerationService';
import { ExamDraftRankingService } from '../domains/assessment/exam-blueprint/services/examDraftRankingService';
import { BlueprintCoverageGapService } from '../domains/assessment/exam-blueprint/services/blueprintCoverageGapService';
import { ExamDraftProjectionSafetyService } from '../domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService';

import {
  InMemoryExamBlueprintRepository,
  InMemoryExamBlueprintVersionRepository,
  InMemoryExamBlueprintRequirementRepository,
  InMemoryExamDraftSetRepository,
  InMemoryExamDraftRepository,
  InMemoryExamDraftQuestionRepository,
  InMemoryQuestionSelectionRunRepository,
  InMemoryQuestionSelectionCandidateRepository,
} from '../domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories';

import {
  InMemoryQuestionBankItemRepository,
  InMemoryQuestionVersionRepository,
  InMemoryQuestionGovernanceRepository,
  InMemoryQuestionExposureHoldRepository,
} from '../domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories';

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

const blueprintRepo = new InMemoryExamBlueprintRepository();
const blueprintVersionRepo = new InMemoryExamBlueprintVersionRepository();
const requirementRepo = new InMemoryExamBlueprintRequirementRepository();
const draftSetRepo = new InMemoryExamDraftSetRepository();
const draftRepo = new InMemoryExamDraftRepository();
const draftQuestionRepo = new InMemoryExamDraftQuestionRepository();
const selectionRunRepo = new InMemoryQuestionSelectionRunRepository();
const selectionCandidateRepo = new InMemoryQuestionSelectionCandidateRepository();

const blueprintCommandService = new ExamBlueprintCommandService({
  enforcementService,
  blueprintRepo,
  blueprintVersionRepo,
  requirementRepo,
});

const questionBankItemRepo = new InMemoryQuestionBankItemRepository();
const questionVersionRepo = new InMemoryQuestionVersionRepository();
const questionGovernanceRepo = new InMemoryQuestionGovernanceRepository();
const exposureHoldRepo = new InMemoryQuestionExposureHoldRepository();

const eligibilityService = new QuestionPoolEligibilityService({
  questionBankItemRepo: questionBankItemRepo as any,
  questionVersionRepo: questionVersionRepo as any,
  questionGovernanceRepo: questionGovernanceRepo as any,
  usageEligibilityRepo: questionGovernanceRepo as any,
  exposureHoldRepo: exposureHoldRepo as any,
});

const coverageGapService = new BlueprintCoverageGapService();
const rankingService = new ExamDraftRankingService();
const projectionSafetyService = new ExamDraftProjectionSafetyService();

const selectionService = new QuestionSelectionService({
  enforcementService,
  eligibilityService,
  coverageGapService,
  selectionRunRepo,
  selectionCandidateRepo,
});

const draftSetGenerationService = new ExamDraftSetGenerationService({
  enforcementService,
  selectionService,
  rankingService,
  coverageGapService,
  blueprintRepo,
  blueprintVersionRepo,
  requirementRepo,
  draftSetRepo,
  draftRepo,
  draftQuestionRepo,
});

function getRequestId(req: Request): string {
  return String((req as any).requestId || req.headers['x-request-id'] || randomUUID());
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
      const message = err.message || 'UNKNOWN_SAFE_ERROR';
      let status = 500;
      let errorCode = 'UNKNOWN_SAFE_ERROR';
      if (message.startsWith('SCHOOL_CONTEXT_REQUIRED')) { status = 400; errorCode = 'SCHOOL_CONTEXT_REQUIRED'; }
      else if (message.startsWith('VALIDATION_FAILED')) { status = 400; errorCode = 'VALIDATION_FAILED'; }
      else if (message.startsWith('POLICY_BLOCKED')) { status = 403; errorCode = 'POLICY_BLOCKED'; }
      else if (message.startsWith('NOT_FOUND')) { status = 404; errorCode = 'NOT_FOUND'; }
      else if (message.startsWith('INVALID_STATE')) { status = 409; errorCode = 'INVALID_STATE'; }
      else if (message.startsWith('IDEMPOTENCY_CONFLICT')) { status = 409; errorCode = 'IDEMPOTENCY_CONFLICT'; }
      else if (message.startsWith('FORBIDDEN_FIELD')) { status = 403; errorCode = 'FORBIDDEN_FIELD'; }
      res.status(status).json(createSafeResponseEnvelope({
        ok: false,
        requestId,
        correlationId: '',
        safeMessage: message.replace(/^[A-Z_]+:\s*/, ''),
        reasonCode: message.split(':')[0] || 'UNKNOWN_SAFE_ERROR',
        errorCode,
      }));
    }
  };
}

// POST /api/question-bank/blueprints
router.post('/blueprints', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await blueprintCommandService.createBlueprint({
    context,
    commandType: 'exam:blueprint:create',
    commandFingerprint: `blueprint:${context.schoolId}:${Date.now()}`,
    body: {
      schoolId: context.schoolId,
      title: req.body.title,
      subjectId: req.body.subjectId,
      curriculumVersionId: req.body.curriculumVersionId,
      gradeBand: req.body.gradeBand || '',
      examType: req.body.examType || 'exam',
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to create blueprint', reasonCode: 'BLUEPRINT_CREATION_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.blueprintId,
    status: 'blueprint_created',
    safeMessage: 'Exam blueprint created',
    data: { blueprintId: result.data.blueprintId },
  }));
}));

// POST /api/question-bank/blueprints/:blueprintId/versions
router.post('/blueprints/:blueprintId/versions', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await blueprintCommandService.createBlueprintVersion({
    context,
    commandType: 'exam:blueprint:version:create',
    commandFingerprint: `version:${req.params.blueprintId}:${Date.now()}`,
    body: {
      blueprintId: req.params.blueprintId,
      title: req.body.title,
      safeDescription: req.body.safeDescription || '',
      durationMinutes: req.body.durationMinutes || 60,
      totalMarks: req.body.totalMarks || 100,
      targetQuestionCount: req.body.targetQuestionCount || 10,
      difficultyMixJson: req.body.difficultyMixJson,
      questionTypeMixJson: req.body.questionTypeMixJson,
      securityClassRequirement: req.body.securityClassRequirement,
      coveragePolicy: req.body.coveragePolicy,
      selectionStrategy: req.body.selectionStrategy,
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
    resourceId: result.data.blueprintVersionId,
    status: 'version_created',
    safeMessage: 'Blueprint version created',
    data: { blueprintVersionId: result.data.blueprintVersionId },
  }));
}));

// POST /api/question-bank/blueprint-versions/:blueprintVersionId/requirements
router.post('/blueprint-versions/:blueprintVersionId/requirements', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await blueprintCommandService.addBlueprintRequirement({
    context,
    commandType: 'exam:blueprint:requirement:add',
    commandFingerprint: `requirement:${req.params.blueprintVersionId}:${Date.now()}`,
    body: {
      blueprintVersionId: req.params.blueprintVersionId,
      requirementType: req.body.requirementType,
      subjectId: req.body.subjectId || context.schoolId,
      topicId: req.body.topicId || '',
      skillId: req.body.skillId || '',
      objectiveId: req.body.objectiveId || '',
      requiredQuestionCount: req.body.requiredQuestionCount || 1,
      requiredMarks: req.body.requiredMarks || 0,
      minimumDifficulty: req.body.minimumDifficulty,
      maximumDifficulty: req.body.maximumDifficulty,
      questionType: req.body.questionType,
      weight: req.body.weight,
      isMandatory: req.body.isMandatory,
    },
  });

  if (!result.ok || !result.data) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to add requirement', reasonCode: 'REQUIREMENT_FAILED' }));
    return;
  }

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.data.requirementId,
    status: 'requirement_created',
    safeMessage: 'Blueprint requirement added',
  }));
}));

// POST /api/question-bank/blueprint-versions/:blueprintVersionId/submit-approval
router.post('/blueprint-versions/:blueprintVersionId/submit-approval', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await blueprintCommandService.submitBlueprintVersionForApproval({
    context,
    commandType: 'exam:blueprint:submit_approval',
    commandFingerprint: `submit_approval:${req.params.blueprintVersionId}:${Date.now()}`,
    body: { blueprintVersionId: req.params.blueprintVersionId },
  });

  if (!result.ok) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to submit for approval', reasonCode: 'SUBMIT_APPROVAL_FAILED' }));
    return;
  }

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: req.params.blueprintVersionId,
    status: 'submitted_for_approval',
    safeMessage: 'Blueprint version submitted for approval',
  }));
}));

// POST /api/question-bank/blueprint-versions/:blueprintVersionId/approve
router.post('/blueprint-versions/:blueprintVersionId/approve', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const result = await blueprintCommandService.approveBlueprintVersion({
    context,
    commandType: 'exam:blueprint:approve',
    commandFingerprint: `approve:${req.params.blueprintVersionId}:${Date.now()}`,
    body: { blueprintVersionId: req.params.blueprintVersionId },
  });

  if (!result.ok) {
    res.status(400).json(createSafeResponseEnvelope({ ok: false, requestId: getRequestId(req), correlationId: context.correlationId, safeMessage: result.error || 'Failed to approve', reasonCode: 'APPROVAL_FAILED' }));
    return;
  }

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: req.params.blueprintVersionId,
    status: 'blueprint_version_approved',
    safeMessage: 'Blueprint version approved',
  }));
}));

// POST /api/question-bank/blueprint-versions/:blueprintVersionId/draft-sets
router.post('/blueprint-versions/:blueprintVersionId/draft-sets', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) { res.status(400).json({ ok: false, errorCode: 'IDEMPOTENCY_REQUIRED' }); return; }
  context.idempotencyKey = idempotencyKey;

  const blueprintVersion = await blueprintVersionRepo.findById(req.params.blueprintVersionId);
  if (!blueprintVersion) { res.status(404).json({ ok: false, errorCode: 'NOT_FOUND', safeMessage: 'Blueprint version not found' }); return; }

  const blueprint = await blueprintRepo.findById(blueprintVersion.blueprintId);
  if (!blueprint) { res.status(404).json({ ok: false, errorCode: 'NOT_FOUND', safeMessage: 'Blueprint not found' }); return; }

  if (blueprintVersion.status !== 'approved') {
    res.status(400).json({ ok: false, errorCode: 'INVALID_STATE', safeMessage: 'Only approved blueprint versions can generate draft sets' });
    return;
  }

  const requirements = await requirementRepo.findByBlueprintVersionId(blueprintVersion.blueprintVersionId);
  const requestedDraftCount = req.body.requestedDraftCount || 3;

  if (requestedDraftCount < 3 || requestedDraftCount > 10) {
    res.status(400).json({ ok: false, errorCode: 'VALIDATION_FAILED', safeMessage: 'requestedDraftCount must be between 3 and 10' });
    return;
  }

  const result = await draftSetGenerationService.generateDraftSet(
    context.schoolId,
    blueprint,
    blueprintVersion,
    requirements,
    requestedDraftCount,
    context.actorId,
    context.actorRole,
  );

  res.status(201).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: result.draftSet.draftSetId,
    status: 'draft_set_generated',
    safeMessage: `Generated ${result.drafts.length} draft papers`,
    data: {
      draftSetId: result.draftSet.draftSetId,
      draftCount: result.drafts.length,
      drafts: result.drafts.map(d => ({
        draftId: d.draftId,
        rank: d.rank,
        draftTitle: d.draftTitle,
        overallScore: d.overallScore,
        questionCount: d.questionCount,
        totalMarks: d.totalMarks,
      })),
    },
  }));
}));

// GET /api/question-bank/blueprints/:blueprintId
router.get('/blueprints/:blueprintId', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const blueprint = await blueprintRepo.findById(req.params.blueprintId);
  if (!blueprint) { res.status(404).json({ ok: false, errorCode: 'NOT_FOUND' }); return; }

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: blueprint.blueprintId,
    status: 'blueprint_found',
    data: {
      blueprintId: blueprint.blueprintId,
      title: blueprint.title,
      status: blueprint.status,
      subjectId: blueprint.subjectId,
      gradeBand: blueprint.gradeBand,
      examType: blueprint.examType,
      currentVersionId: blueprint.currentVersionId,
      createdAt: blueprint.createdAt,
    },
  }));
}));

// GET /api/question-bank/blueprints/:blueprintId/versions
router.get('/blueprints/:blueprintId/versions', safeHandler(async (req, res) => {
  const versions = await blueprintVersionRepo.findByBlueprintId(req.params.blueprintId);
  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: '',
    status: 'versions_listed',
    safeMessage: `${versions.length} versions found`,
    data: versions.map(v => ({
      blueprintVersionId: v.blueprintVersionId,
      versionNumber: v.versionNumber,
      status: v.status,
      title: v.title,
      totalMarks: v.totalMarks,
      targetQuestionCount: v.targetQuestionCount,
      durationMinutes: v.durationMinutes,
      createdAt: v.createdAt,
      approvedAt: v.approvedAt,
    })),
  }));
}));

// GET /api/question-bank/blueprint-versions/:blueprintVersionId/requirements
router.get('/blueprint-versions/:blueprintVersionId/requirements', safeHandler(async (req, res) => {
  const requirements = await requirementRepo.findByBlueprintVersionId(req.params.blueprintVersionId);
  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: '',
    status: 'requirements_listed',
    safeMessage: `${requirements.length} requirements found`,
    data: requirements.map(r => ({
      requirementId: r.requirementId,
      requirementType: r.requirementType,
      objectiveId: r.objectiveId,
      isMandatory: r.isMandatory,
      requiredQuestionCount: r.requiredQuestionCount,
      requiredMarks: r.requiredMarks,
      questionType: r.questionType,
    })),
  }));
}));

// GET /api/question-bank/draft-sets/:draftSetId
router.get('/draft-sets/:draftSetId', safeHandler(async (req, res) => {
  const draftSet = await draftSetRepo.findById(req.params.draftSetId);
  if (!draftSet) { res.status(404).json({ ok: false, errorCode: 'NOT_FOUND' }); return; }

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: '',
    resourceId: draftSet.draftSetId,
    status: 'draft_set_found',
    data: draftSet,
  }));
}));

// GET /api/question-bank/draft-sets/:draftSetId/drafts
router.get('/draft-sets/:draftSetId/drafts', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);
  const drafts = await draftRepo.findByDraftSetId(req.params.draftSetId);

  const safeDrafts = drafts.map(d => projectionSafetyService.toTeacherDraftSummary(
    d,
    [],
  ));

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    status: 'drafts_listed',
    safeMessage: `${safeDrafts.length} drafts found`,
    data: safeDrafts,
  }));
}));

// GET /api/question-bank/drafts/:draftId
router.get('/drafts/:draftId', safeHandler(async (req, res) => {
  const context = extractMockAssessmentActorContext(req);

  if (['student', 'parent'].includes(context.actorRole)) {
    res.status(403).json(projectionSafetyService.toStudentForbiddenDraftView());
    return;
  }

  const draft = await draftRepo.findById(req.params.draftId);
  if (!draft) { res.status(404).json({ ok: false, errorCode: 'NOT_FOUND' }); return; }

  const questions = await draftQuestionRepo.findByDraftId(draft.draftId);
  const safeData = projectionSafetyService.toTeacherDraftSummary(draft, questions);

  res.status(200).json(createSafeResponseEnvelope({
    ok: true,
    requestId: getRequestId(req),
    correlationId: context.correlationId,
    resourceId: draft.draftId,
    status: 'draft_found',
    data: safeData,
  }));
}));

export default router;
