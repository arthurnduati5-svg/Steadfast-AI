// Internal API routes for the Learning Evidence Event Store

import { Router, Request, Response } from 'express';
import type { LearningEvidenceEventStoreRepository } from '../repositories/learningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../services/learningEvidenceCommandService';
import { LearningEvidenceProjectionService } from '../services/learningEvidenceProjectionService';
import { LearningEvidenceSeedService } from '../services/learningEvidenceSeedService';
import type { EvidenceCommand, EvidenceActorContext } from '../contracts/learningEvidenceCommandContracts';
import type { EvidenceSourceLineage, NormalizedEvidencePayload } from '../contracts/learningEvidenceEventStoreContracts';

function getSchoolContext(req: Request): { schoolId: string; actorId: string; actorRole: string } {
  return {
    schoolId: (req.headers['x-school-id'] as string) || (req as any).schoolId || '',
    actorId: (req.headers['x-actor-id'] as string) || 'anonymous',
    actorRole: (req.headers['x-actor-role'] as string) || 'unknown',
  };
}

function makeActorContext(req: Request, learnerId?: string): EvidenceActorContext {
  const ctx = getSchoolContext(req);
  return {
    schoolId: ctx.schoolId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    learnerId: learnerId || (req.params.learnerId) || '',
    requestId: (req.headers['x-request-id'] as string) || `req-${Date.now()}`,
    correlationId: (req.headers['x-correlation-id'] as string) || `corr-${Date.now()}`,
  };
}

export function createLearningEvidenceRouter(
  repo: LearningEvidenceEventStoreRepository,
): Router {
  const router = Router();
  const eventStoreRepo = repo;
  const privacyGuard = new LearningEvidencePrivacyGuard();
  const commandService = new LearningEvidenceCommandService(eventStoreRepo, privacyGuard);
  const projectionService = new LearningEvidenceProjectionService(eventStoreRepo);
  const seedService = new LearningEvidenceSeedService(commandService, eventStoreRepo);

  function safeEnvelope(res: Response, status: number, data: unknown) {
    return res.status(status).json({ ok: status < 400, data });
  }

  function errorEnvelope(res: Response, status: number, code: string, message: string, requestId: string, correlationId: string) {
    return res.status(status).json({ ok: false, error: { code, message, requestId, correlationId } });
  }

  // POST /candidates
  router.post('/candidates', async (req: Request, res: Response) => {
    try {
      const schoolCtx = getSchoolContext(req);
      if (!schoolCtx.schoolId) {
        return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required via x-school-id header', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
      }

      const { learnerId, sourceLineage, safePayload, idempotencyKey } = req.body;
      if (!learnerId || !sourceLineage || !safePayload || !idempotencyKey) {
        return errorEnvelope(res, 400, 'VALIDATION_ERROR', 'Missing required fields: learnerId, sourceLineage, safePayload, idempotencyKey', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
      }

      const actor = makeActorContext(req, learnerId);

      const command: EvidenceCommand = {
        commandType: 'CreateEvidenceCandidate',
        commandId: `api-${Date.now()}`,
        actor,
        learnerId,
        expectedStreamSequence: 0,
        idempotencyKey,
        requestHash: JSON.stringify(req.body),
        reasonCodes: sourceLineage.reasonCodes || [],
        policyVersion: '1.0',
        occurredAt: new Date().toISOString(),
        correlationId: actor.correlationId,
        sourceLineage: sourceLineage as EvidenceSourceLineage,
        safePayload: safePayload as NormalizedEvidencePayload,
      };

      const result = await commandService.execute(command);
      if (!result.success) {
        return errorEnvelope(res, 400, result.error!.code, result.error!.message, result.error!.requestId, result.error!.correlationId);
      }
      return safeEnvelope(res, 201, result.data);
    } catch (err: any) {
      return errorEnvelope(res, 500, 'INTERNAL_ERROR', err.message || 'Unexpected error', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
  });

  // POST /candidates/:candidateId/validate
  router.post('/candidates/:candidateId/validate', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }

    const { expectedStreamSequence, idempotencyKey } = req.body;
    const actor = makeActorContext(req);
    const result = await commandService.execute({
      commandType: 'StartEvidenceValidation',
      commandId: `api-${Date.now()}`,
      actor,
      learnerId: actor.learnerId,
      evidenceCandidateId: req.params.candidateId,
      expectedStreamSequence: expectedStreamSequence ?? 0,
      idempotencyKey: idempotencyKey || `validate-${Date.now()}`,
      requestHash: JSON.stringify(req.body),
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: actor.correlationId,
    });

    if (!result.success) {
      return errorEnvelope(res, 400, result.error!.code, result.error!.message, result.error!.requestId, result.error!.correlationId);
    }
    return safeEnvelope(res, 200, result.data);
  });

  // POST /candidates/:candidateId/review-required
  router.post('/candidates/:candidateId/review-required', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const { expectedStreamSequence, idempotencyKey } = req.body;
    const actor = makeActorContext(req);
    const result = await commandService.execute({
      commandType: 'RequireEvidenceReview',
      commandId: `api-${Date.now()}`,
      actor,
      learnerId: actor.learnerId,
      evidenceCandidateId: req.params.candidateId,
      expectedStreamSequence: expectedStreamSequence ?? 0,
      idempotencyKey: idempotencyKey || `review-${Date.now()}`,
      requestHash: JSON.stringify(req.body),
      reasonCodes: req.body.reasonCodes || [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: actor.correlationId,
    });
    if (!result.success) {
      return errorEnvelope(res, 400, result.error!.code, result.error!.message, result.error!.requestId, result.error!.correlationId);
    }
    return safeEnvelope(res, 200, result.data);
  });

  // POST /candidates/:candidateId/usable
  router.post('/candidates/:candidateId/usable', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const { expectedStreamSequence, idempotencyKey } = req.body;
    const actor = makeActorContext(req);
    const result = await commandService.execute({
      commandType: 'MarkEvidenceUsable',
      commandId: `api-${Date.now()}`,
      actor,
      learnerId: actor.learnerId,
      evidenceCandidateId: req.params.candidateId,
      expectedStreamSequence: expectedStreamSequence ?? 0,
      idempotencyKey: idempotencyKey || `usable-${Date.now()}`,
      requestHash: JSON.stringify(req.body),
      reasonCodes: req.body.reasonCodes || [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: actor.correlationId,
    });
    if (!result.success) {
      return errorEnvelope(res, 400, result.error!.code, result.error!.message, result.error!.requestId, result.error!.correlationId);
    }
    return safeEnvelope(res, 200, result.data);
  });

  // POST /candidates/:candidateId/commit
  router.post('/candidates/:candidateId/commit', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const { expectedStreamSequence, idempotencyKey } = req.body;
    const actor = makeActorContext(req);
    const result = await commandService.execute({
      commandType: 'CommitLearningEvidence',
      commandId: `api-${Date.now()}`,
      actor,
      learnerId: actor.learnerId,
      evidenceCandidateId: req.params.candidateId,
      expectedStreamSequence: expectedStreamSequence ?? 0,
      idempotencyKey: idempotencyKey || `commit-${Date.now()}`,
      requestHash: JSON.stringify(req.body),
      reasonCodes: req.body.reasonCodes || [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: actor.correlationId,
    });
    if (!result.success) {
      return errorEnvelope(res, 400, result.error!.code, result.error!.message, result.error!.requestId, result.error!.correlationId);
    }
    return safeEnvelope(res, 200, result.data);
  });

  // POST /evidence/:evidenceId/supersede
  router.post('/evidence/:evidenceId/supersede', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const { expectedStreamSequence, idempotencyKey, replacementEvidenceCandidateId } = req.body;
    const actor = makeActorContext(req);
    const result = await commandService.execute({
      commandType: 'SupersedeLearningEvidence',
      commandId: `api-${Date.now()}`,
      actor,
      learnerId: actor.learnerId,
      committedEvidenceId: req.params.evidenceId,
      replacementEvidenceCandidateId,
      expectedStreamSequence: expectedStreamSequence ?? 0,
      idempotencyKey: idempotencyKey || `supersede-${Date.now()}`,
      requestHash: JSON.stringify(req.body),
      reasonCodes: req.body.reasonCodes || [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: actor.correlationId,
    });
    if (!result.success) {
      return errorEnvelope(res, 400, result.error!.code, result.error!.message, result.error!.requestId, result.error!.correlationId);
    }
    return safeEnvelope(res, 200, result.data);
  });

  // POST /evidence/:evidenceId/retain
  router.post('/evidence/:evidenceId/retain', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const { expectedStreamSequence, idempotencyKey, policyReason } = req.body;
    const actor = makeActorContext(req);
    const result = await commandService.execute({
      commandType: 'RetainLearningEvidence',
      commandId: `api-${Date.now()}`,
      actor,
      learnerId: actor.learnerId,
      committedEvidenceId: req.params.evidenceId,
      policyReason: policyReason || 'policy_required',
      expectedStreamSequence: expectedStreamSequence ?? 0,
      idempotencyKey: idempotencyKey || `retain-${Date.now()}`,
      requestHash: JSON.stringify(req.body),
      reasonCodes: req.body.reasonCodes || [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: actor.correlationId,
    });
    if (!result.success) {
      return errorEnvelope(res, 400, result.error!.code, result.error!.message, result.error!.requestId, result.error!.correlationId);
    }
    return safeEnvelope(res, 200, result.data);
  });

  // GET /learners/:learnerId/evidence
  router.get('/learners/:learnerId/evidence', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    if (!['student', 'teacher', 'school_admin', 'internal_operator'].includes(schoolCtx.actorRole)) {
      return errorEnvelope(res, 403, 'EVIDENCE_ROLE_FORBIDDEN', 'Role not authorized to view evidence', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const { learnerId } = req.params;
    const events = await eventStoreRepo.getEventsForLearner(schoolCtx.schoolId, learnerId);
    const safeResult = events.map(e => ({
      eventId: e.eventId,
      eventType: e.eventType,
      sourceType: e.sourceType,
      streamSequence: e.streamSequence,
      occurredAt: e.occurredAt,
      privacyClass: e.privacyClass,
    }));
    return safeEnvelope(res, 200, safeResult);
  });

  // GET /learners/:learnerId/evidence/:evidenceId
  router.get('/learners/:learnerId/evidence/:evidenceId', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    if (!['student', 'teacher', 'school_admin', 'internal_operator'].includes(schoolCtx.actorRole)) {
      return errorEnvelope(res, 403, 'EVIDENCE_ROLE_FORBIDDEN', 'Role not authorized to view evidence', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const committed = await eventStoreRepo.getCommittedProjection(schoolCtx.schoolId, req.params.evidenceId);
    if (!committed) {
      return errorEnvelope(res, 404, 'EVIDENCE_NOT_FOUND', 'Evidence not found', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const safeResult = {
      committedEvidenceId: committed.committedEvidenceId,
      outcome: committed.outcome,
      evidenceMode: committed.evidenceMode,
      independence: committed.independence,
      active: committed.active,
    };
    return safeEnvelope(res, 200, safeResult);
  });

  // POST /internal/projections/rebuild
  router.post('/internal/projections/rebuild', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const { learnerId } = req.body;
    if (!learnerId) {
      return errorEnvelope(res, 400, 'VALIDATION_ERROR', 'learnerId required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const result = await projectionService.rebuildProjections(schoolCtx.schoolId, learnerId);
    return safeEnvelope(res, 200, result);
  });

  // GET /internal/streams/:learnerId/integrity
  router.get('/internal/streams/:learnerId/integrity', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const streamId = `evidence_${schoolCtx.schoolId}_${req.params.learnerId}`;
    const integrity = await eventStoreRepo.verifyStreamIntegrity(schoolCtx.schoolId, streamId);
    return safeEnvelope(res, 200, integrity);
  });

  // POST /internal/seeds
  router.post('/internal/seeds', async (req: Request, res: Response) => {
    const schoolCtx = getSchoolContext(req);
    if (!schoolCtx.schoolId) {
      return errorEnvelope(res, 400, 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED', 'School context required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const { learnerId } = req.body;
    if (!learnerId) {
      return errorEnvelope(res, 400, 'VALIDATION_ERROR', 'learnerId required', req.headers['x-request-id'] as string || '', req.headers['x-correlation-id'] as string || '');
    }
    const result = await seedService.seedAll(schoolCtx.schoolId, learnerId);
    return safeEnvelope(res, 201, result);
  });

  return router;
}
