import { Router, Request, Response } from 'express';
import { safeLearningEvidenceIngestionService } from '../services/safeLearningEvidenceIngestionService';
import { safeLearningEvidenceRepository } from '../services/safeLearningEvidenceRepository';
import { safeLearningEvidenceGrowthProofService } from '../services/safeLearningEvidenceGrowthProofService';
import { safeLearningEvidenceAggregateService } from '../services/safeLearningEvidenceAggregateService';
import { safeLearningEvidenceWhyThisNextBridge } from '../services/safeLearningEvidenceWhyThisNextBridge';
import { safeLearningEvidenceTeacherViewService } from '../services/safeLearningEvidenceTeacherViewService';
import { safeLearningEvidenceLearnerViewService } from '../services/safeLearningEvidenceLearnerViewService';
import { safeLearningEvidenceTelemetryService } from '../services/safeLearningEvidenceTelemetryService';
import { safeLearningEvidenceResponseBuilder } from '../services/safeLearningEvidenceResponseBuilder';
import { safeLearningEvidencePrivacyGuard } from '../services/safeLearningEvidencePrivacyGuard';
import { safeLearningEvidenceAccessPolicy, type EvidenceAccessContext } from '../services/safeLearningEvidenceAccessPolicy';
import { SafeLearningEvidenceIngestRequestSchema, SafeLearningEvidenceQuerySchema } from '../lib/safeLearningEvidenceValidation';
import type { SafeLearningEvidenceResponse, SafeLearningEvidenceErrorResponse } from '../contracts/safeLearningEvidenceContracts';

const router = Router();

function getSchoolId(req: Request): string {
  return (req as any).schoolId || (req as any).schoolContext?.schoolId || '';
}

function getStudentId(req: Request): string {
  return (req as any).studentId || (req as any).schoolContext?.studentId || '';
}

function getRole(req: Request): string {
  return (req as any).role || 'student';
}

function buildAccessCtx(req: Request, targetSchoolId: string, targetStudentId?: string): EvidenceAccessContext {
  return {
    schoolId: targetSchoolId,
    studentId: targetStudentId,
    role: getRole(req) as any,
    requestSchoolId: getSchoolId(req),
    requestStudentId: getStudentId(req) || targetStudentId,
  };
}

function safeError(res: Response, status: number, body: SafeLearningEvidenceErrorResponse): void {
  res.status(status).json(body);
}

function safeResponse(res: Response, body: SafeLearningEvidenceResponse): void {
  res.status(200).json(body);
}

// POST /api/copilot/learning-evidence/ingest
router.post('/ingest', async (req: Request, res: Response) => {
  try {
    const parsed = SafeLearningEvidenceIngestRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      safeError(res, 400, safeLearningEvidenceResponseBuilder.buildErrorResponse(
        'validation_error',
        'Invalid evidence request.',
        parsed.error.issues.map((i) => i.message),
      ));
      return;
    }

    const accessCtx = buildAccessCtx(req, parsed.data.schoolId, parsed.data.studentId);
    const result = await safeLearningEvidenceIngestionService.ingestEvidence(parsed.data, accessCtx);

    safeLearningEvidenceTelemetryService.recordEvent({
      schoolId: parsed.data.schoolId,
      studentId: parsed.data.studentId,
      eventType: result.persisted ? 'safe_evidence_persisted' : 'safe_evidence_ingest_rejected',
      policyDecision: result.policyDecision,
      safeReasonCodes: result.safeReasonCodes,
    });

    safeResponse(res, safeLearningEvidenceResponseBuilder.buildPersistenceResponse(result));
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Evidence ingestion failed.',
      ['ingestion_internal_error'],
    ));
  }
});

// POST /api/copilot/learning-evidence/batch-ingest
router.post('/batch-ingest', async (req: Request, res: Response) => {
  try {
    const events = req.body.events;
    if (!Array.isArray(events) || events.length === 0 || events.length > 100) {
      safeError(res, 400, safeLearningEvidenceResponseBuilder.buildErrorResponse(
        'validation_error',
        'Batch must contain 1-100 events.',
        ['invalid_batch_size'],
      ));
      return;
    }

    const results: SafeLearningEvidenceResponse[] = [];
    for (const event of events) {
      const parsed = SafeLearningEvidenceIngestRequestSchema.safeParse(event);
      if (!parsed.success) {
        results.push({
          ok: false,
          status: 'rejected',
          policyDecision: 'blocked',
          dataQualityStatus: 'unsafe_rejected',
          safeReasonCodes: parsed.error.issues.map((i) => i.message),
          safeEvidenceRefs: [],
        });
        continue;
      }
      const accessCtx = buildAccessCtx(req, parsed.data.schoolId, parsed.data.studentId);
      const result = await safeLearningEvidenceIngestionService.ingestEvidence(parsed.data, accessCtx);
      results.push(safeLearningEvidenceResponseBuilder.buildPersistenceResponse(result));
    }

    safeResponse(res, {
      ok: true,
      status: 'batch_completed',
      safeReasonCodes: ['batch_ingest_completed'],
      safeEvidenceRefs: [],
      message: `Processed ${results.length} events.`,
    });
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Batch ingestion failed.',
      ['batch_ingestion_internal_error'],
    ));
  }
});

// GET /api/copilot/learning-evidence/:evidenceId
router.get('/:evidenceId', (req: Request, res: Response) => {
  try {
    const evidenceId = req.params.evidenceId;
    const record = safeLearningEvidenceRepository.findEvidenceById(evidenceId);
    if (!record) {
      safeResponse(res, safeLearningEvidenceResponseBuilder.buildEmptyEvidenceResponse(['evidence_not_found']));
      return;
    }

    const accessCtx = buildAccessCtx(req, record.schoolId, record.studentId);
    const accessCheck = safeLearningEvidenceAccessPolicy.evaluateEvidenceReadAccess(accessCtx);
    if (!accessCheck.allowed) {
      safeResponse(res, {
        ok: true,
        status: 'empty',
        safeReasonCodes: accessCheck.safeReasonCodes,
        safeEvidenceRefs: [],
      });
      return;
    }

    const redacted = safeLearningEvidencePrivacyGuard.redactForbiddenEvidenceFields(record);
    safeResponse(res, {
      ok: true,
      status: 'found',
      safeReasonCodes: ['evidence_found'],
      safeEvidenceRefs: [record.id],
      evidence: redacted as any,
    });
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Failed to retrieve evidence.',
      ['evidence_retrieval_error'],
    ));
  }
});

// GET /api/copilot/learning-evidence/student/:studentId
router.get('/student/:studentId', (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const schoolId = getSchoolId(req);
    const queryParams = {
      schoolId,
      studentId,
      subjectId: req.query.subjectId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      skillId: req.query.skillId as string | undefined,
      sourceTask: req.query.sourceTask as string | undefined,
      sourceMode: req.query.sourceMode as string | undefined,
      evidenceType: req.query.evidenceType as string | undefined,
      limit: Math.min(Number(req.query.limit) || 50, 200),
      offset: Number(req.query.offset) || 0,
    };

    const accessCtx = buildAccessCtx(req, schoolId, studentId);
    const accessCheck = safeLearningEvidenceAccessPolicy.evaluateEvidenceReadAccess(accessCtx);
    if (!accessCheck.allowed) {
      safeResponse(res, {
        ok: true,
        status: 'empty',
        safeReasonCodes: accessCheck.safeReasonCodes,
        safeEvidenceRefs: [],
      });
      return;
    }

    const records = safeLearningEvidenceRepository.queryEvidence(queryParams);
    if (records.length === 0) {
      safeResponse(res, safeLearningEvidenceResponseBuilder.buildEmptyEvidenceResponse(['no_learning_evidence_yet']));
      return;
    }

    const redacted = safeLearningEvidencePrivacyGuard.redactForbiddenEvidenceFields(records);
    safeResponse(res, {
      ok: true,
      status: 'found',
      safeReasonCodes: ['evidence_found'],
      safeEvidenceRefs: records.map((r) => r.id),
      message: `Found ${records.length} evidence records.`,
    });
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Failed to query evidence.',
      ['evidence_query_error'],
    ));
  }
});

// GET /api/copilot/learning-evidence/student/:studentId/aggregate
router.get('/student/:studentId/aggregate', (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const schoolId = getSchoolId(req);
    const window = (req.query.window as string) || 'all_time';

    const accessCtx = buildAccessCtx(req, schoolId, studentId);
    const accessCheck = safeLearningEvidenceAccessPolicy.evaluateEvidenceReadAccess(accessCtx);
    if (!accessCheck.allowed) {
      safeResponse(res, {
        ok: true,
        status: 'empty',
        safeReasonCodes: accessCheck.safeReasonCodes,
        safeEvidenceRefs: [],
      });
      return;
    }

    const aggregate = safeLearningEvidenceAggregateService.getAggregate({
      schoolId,
      studentId,
      aggregateWindow: window,
    });

    if (!aggregate) {
      safeResponse(res, safeLearningEvidenceResponseBuilder.buildEmptyEvidenceResponse(['no_learning_evidence_yet']));
      return;
    }

    safeResponse(res, safeLearningEvidenceResponseBuilder.buildAggregateResponse(aggregate));
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Failed to retrieve aggregate.',
      ['aggregate_retrieval_error'],
    ));
  }
});

// GET /api/copilot/learning-evidence/student/:studentId/growth-proof
router.get('/student/:studentId/growth-proof', (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const schoolId = getSchoolId(req);

    const accessCtx = buildAccessCtx(req, schoolId, studentId);
    const accessCheck = safeLearningEvidenceAccessPolicy.evaluateEvidenceReadAccess(accessCtx);
    if (!accessCheck.allowed) {
      safeResponse(res, {
        ok: true,
        status: 'empty',
        safeReasonCodes: accessCheck.safeReasonCodes,
        safeEvidenceRefs: [],
      });
      return;
    }

    const summary = safeLearningEvidenceGrowthProofService.buildGrowthProofSummary({
      schoolId,
      studentId,
      subjectId: req.query.subjectId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      skillId: req.query.skillId as string | undefined,
    });

    safeResponse(res, safeLearningEvidenceResponseBuilder.buildGrowthProofResponse(summary));
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Failed to generate growth proof.',
      ['growth_proof_error'],
    ));
  }
});

// GET /api/copilot/learning-evidence/student/:studentId/why-this-next-packet
router.get('/student/:studentId/why-this-next-packet', (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const schoolId = getSchoolId(req);

    const accessCtx = buildAccessCtx(req, schoolId, studentId);
    const accessCheck = safeLearningEvidenceAccessPolicy.evaluateEvidenceReadAccess(accessCtx);
    if (!accessCheck.allowed) {
      safeResponse(res, {
        ok: true,
        status: 'empty',
        safeReasonCodes: accessCheck.safeReasonCodes,
        safeEvidenceRefs: [],
      });
      return;
    }

    const records = safeLearningEvidenceRepository.queryEvidence({
      schoolId,
      studentId,
      limit: 50,
      offset: 0,
    });

    if (records.length === 0) {
      safeResponse(res, safeLearningEvidenceResponseBuilder.buildEmptyEvidenceResponse(['no_learning_evidence_yet']));
      return;
    }

    const packet = safeLearningEvidenceWhyThisNextBridge.buildPacket(records);
    if (!packet) {
      safeResponse(res, safeLearningEvidenceResponseBuilder.buildEmptyEvidenceResponse(['insufficient_evidence_for_why_this_next']));
      return;
    }

    safeResponse(res, safeLearningEvidenceResponseBuilder.buildWhyThisNextResponse(packet));
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Failed to build why-this-next packet.',
      ['why_this_next_error'],
    ));
  }
});

// GET /api/copilot/learning-evidence/student/:studentId/teacher-safe-view
router.get('/student/:studentId/teacher-safe-view', (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const schoolId = getSchoolId(req);

    const accessCtx = buildAccessCtx(req, schoolId, studentId);
    const accessCheck = safeLearningEvidenceAccessPolicy.evaluateTeacherViewAccess(accessCtx);
    if (!accessCheck.allowed) {
      safeResponse(res, {
        ok: true,
        status: 'empty',
        safeReasonCodes: accessCheck.safeReasonCodes,
        safeEvidenceRefs: [],
      });
      return;
    }

    const view = safeLearningEvidenceTeacherViewService.buildTeacherView({
      schoolId,
      studentId,
      subjectId: req.query.subjectId as string | undefined,
      topicId: req.query.topicId as string | undefined,
    });

    safeResponse(res, safeLearningEvidenceResponseBuilder.buildTeacherViewResponse(view));
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Failed to build teacher view.',
      ['teacher_view_error'],
    ));
  }
});

// GET /api/copilot/learning-evidence/student/:studentId/learner-safe-view
router.get('/student/:studentId/learner-safe-view', (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const schoolId = getSchoolId(req);

    const accessCtx = buildAccessCtx(req, schoolId, studentId);
    const accessCheck = safeLearningEvidenceAccessPolicy.evaluateLearnerViewAccess(accessCtx);
    if (!accessCheck.allowed) {
      safeResponse(res, {
        ok: true,
        status: 'empty',
        safeReasonCodes: accessCheck.safeReasonCodes,
        safeEvidenceRefs: [],
      });
      return;
    }

    const view = safeLearningEvidenceLearnerViewService.buildLearnerView({
      schoolId,
      studentId,
    });

    safeResponse(res, safeLearningEvidenceResponseBuilder.buildLearnerViewResponse(view));
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Failed to build learner view.',
      ['learner_view_error'],
    ));
  }
});

// POST /api/copilot/learning-evidence/student/:studentId/rebuild-aggregate
router.post('/student/:studentId/rebuild-aggregate', async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const schoolId = getSchoolId(req);

    const accessCtx = buildAccessCtx(req, schoolId, studentId);
    const accessCheck = safeLearningEvidenceAccessPolicy.evaluateEvidenceWriteAccess(accessCtx);
    if (!accessCheck.allowed) {
      safeResponse(res, {
        ok: true,
        status: 'empty',
        safeReasonCodes: accessCheck.safeReasonCodes,
        safeEvidenceRefs: [],
      });
      return;
    }

    const aggregate = safeLearningEvidenceAggregateService.getAggregate({
      schoolId,
      studentId,
      aggregateWindow: 'all_time',
    });

    safeResponse(res, {
      ok: true,
      status: aggregate ? 'rebuild_completed' : 'empty',
      safeReasonCodes: ['aggregate_rebuilt'],
      safeEvidenceRefs: [],
    });
  } catch (err) {
    safeError(res, 500, safeLearningEvidenceResponseBuilder.buildErrorResponse(
      'internal_error',
      'Failed to rebuild aggregate.',
      ['rebuild_aggregate_error'],
    ));
  }
});

export default router;
