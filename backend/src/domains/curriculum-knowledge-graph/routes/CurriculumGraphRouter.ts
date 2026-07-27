// Curriculum Knowledge Graph — Router Factory

import { Router, Request, Response } from 'express';
import type { CurriculumGraphCommandService } from '../services/CurriculumGraphCommandService';
import type { CurriculumGraphQueryService } from '../services/CurriculumGraphQueryService';
import type { CurriculumGraphActorContext } from '../contracts/CurriculumGraphContracts';

export interface CurriculumGraphRequestContextResolver {
  resolve(req: Request): CurriculumGraphActorContext;
}

export const CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED = 'CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED';

export interface CurriculumGraphRouterDependencies {
  commandService: CurriculumGraphCommandService;
  queryService: CurriculumGraphQueryService;
  contextResolver: CurriculumGraphRequestContextResolver;
}

function sendSuccess(res: Response, data: unknown, status: number = 200) {
  return res.status(status).json({ ok: true, data });
}

function sendError(res: Response, status: number, code: string, message: string, requestId: string, correlationId: string) {
  return res.status(status).json({ ok: false, error: { code, message, requestId, correlationId } });
}

export function createCurriculumGraphRouter(deps: CurriculumGraphRouterDependencies): Router {
  if (!deps || typeof deps !== 'object') {
    throw new Error(`${CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED}: dependency object is required`);
  }
  if (!deps.commandService) {
    throw new Error(`${CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED}: commandService is required`);
  }
  if (!deps.queryService) {
    throw new Error(`${CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED}: queryService is required`);
  }
  if (!deps.contextResolver) {
    throw new Error(`${CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED}: contextResolver is required`);
  }
  const router = Router();
  const cs = deps.commandService;
  const qs = deps.queryService;
  const ctxResolver = deps.contextResolver;

  function getCtx(req: Request): CurriculumGraphActorContext {
    return ctxResolver.resolve(req);
  }

  function checkSchool(ctx: CurriculumGraphActorContext, res: Response): boolean {
    if (!ctx.schoolId) {
      sendError(res, 400, 'CURRICULUM_GRAPH_SCHOOL_CONTEXT_REQUIRED', 'School context required via x-school-id header', ctx.requestId, ctx.correlationId);
      return false;
    }
    return true;
  }

  // ─── Version Routes ───

  router.post('/versions', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const { curriculumKey, title, description, metadata } = req.body;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'CreateCurriculumGraphVersion',
      commandId,
      idempotencyKey: req.body.idempotencyKey || commandId,
      requestHash: JSON.stringify(req.body),
      expectedRevision: 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      curriculumKey,
      title,
      description,
      metadata: metadata || {},
    });
    if (result.success) return sendSuccess(res, result, 201);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.post('/versions/:versionId/successors', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'CreateSuccessorCurriculumGraphVersion',
      commandId,
      idempotencyKey: req.body.idempotencyKey || commandId,
      requestHash: JSON.stringify(req.body),
      expectedRevision: 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      sourceVersionId: req.params.versionId,
      title: req.body.title,
      description: req.body.description,
      metadata: req.body.metadata || {},
    });
    if (result.success) return sendSuccess(res, result, 201);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.get('/versions', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const versions = qs.listVersions(ctx, req.query.curriculumKey as string, req.query.status as string);
    return sendSuccess(res, versions);
  });

  router.get('/versions/:versionId', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const version = qs.getVersion(req.params.versionId, ctx);
    if (!version) return sendError(res, 404, 'CURRICULUM_GRAPH_NOT_FOUND', 'Version not found', ctx.requestId, ctx.correlationId);
    return sendSuccess(res, version);
  });

  router.get('/active/:curriculumKey', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const version = qs.getActiveVersion(req.params.curriculumKey, ctx);
    if (!version) return sendError(res, 404, 'CURRICULUM_GRAPH_NOT_FOUND', 'No active version found', ctx.requestId, ctx.correlationId);
    return sendSuccess(res, version);
  });

  // ─── Node Routes ───

  router.post('/versions/:versionId/nodes', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'AddCurriculumNode',
      commandId,
      idempotencyKey: req.body.idempotencyKey || commandId,
      requestHash: JSON.stringify(req.body),
      expectedRevision: req.body.expectedRevision ?? 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
      nodeType: req.body.nodeType,
      code: req.body.code,
      title: req.body.title,
      description: req.body.description || '',
      sequence: req.body.sequence ?? 1,
      tags: req.body.tags || [],
      studentVisible: req.body.studentVisible ?? true,
      metadata: req.body.metadata || {},
      learningObjectiveMetadata: req.body.learningObjectiveMetadata,
    });
    if (result.success) return sendSuccess(res, result, 201);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.patch('/versions/:versionId/nodes/:nodeId', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'UpdateCurriculumNode',
      commandId,
      idempotencyKey: req.body.idempotencyKey || commandId,
      requestHash: JSON.stringify(req.body),
      expectedRevision: req.body.expectedRevision ?? 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
      nodeId: req.params.nodeId,
      expectedNodeRevision: req.body.expectedNodeRevision,
      title: req.body.title,
      description: req.body.description,
      sequence: req.body.sequence,
      tags: req.body.tags,
      studentVisible: req.body.studentVisible,
      metadata: req.body.metadata,
      learningObjectiveMetadata: req.body.learningObjectiveMetadata,
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.delete('/versions/:versionId/nodes/:nodeId', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'RemoveCurriculumNode',
      commandId,
      idempotencyKey: req.body?.idempotencyKey || commandId,
      requestHash: JSON.stringify({ nodeId: req.params.nodeId }),
      expectedRevision: req.body?.expectedRevision ?? 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
      nodeId: req.params.nodeId,
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  // ─── Edge Routes ───

  router.post('/versions/:versionId/edges', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'AddCurriculumEdge',
      commandId,
      idempotencyKey: req.body.idempotencyKey || commandId,
      requestHash: JSON.stringify(req.body),
      expectedRevision: req.body.expectedRevision ?? 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
      edgeType: req.body.edgeType,
      fromNodeId: req.body.fromNodeId,
      toNodeId: req.body.toNodeId,
      sequence: req.body.sequence ?? 1,
      required: req.body.required ?? true,
      rationale: req.body.rationale || '',
      metadata: req.body.metadata || {},
    });
    if (result.success) return sendSuccess(res, result, 201);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.delete('/versions/:versionId/edges/:edgeId', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'RemoveCurriculumEdge',
      commandId,
      idempotencyKey: req.body?.idempotencyKey || commandId,
      requestHash: JSON.stringify({ edgeId: req.params.edgeId }),
      expectedRevision: req.body?.expectedRevision ?? 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
      edgeId: req.params.edgeId,
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  // ─── Validation and Lifecycle Routes ───

  router.post('/versions/:versionId/validate', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'ValidateCurriculumGraphVersion',
      commandId,
      idempotencyKey: req.body?.idempotencyKey || commandId,
      requestHash: JSON.stringify({ versionId: req.params.versionId }),
      expectedRevision: 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.post('/versions/:versionId/submit', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'SubmitCurriculumGraphForReview',
      commandId,
      idempotencyKey: req.body?.idempotencyKey || commandId,
      requestHash: JSON.stringify({ versionId: req.params.versionId }),
      expectedRevision: 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.post('/versions/:versionId/return-to-draft', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'ReturnCurriculumGraphToDraft',
      commandId,
      idempotencyKey: req.body?.idempotencyKey || commandId,
      requestHash: JSON.stringify(req.body),
      expectedRevision: 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
      reason: req.body?.reason || '',
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.post('/versions/:versionId/approve', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'ApproveCurriculumGraphVersion',
      commandId,
      idempotencyKey: req.body?.idempotencyKey || commandId,
      requestHash: JSON.stringify({ versionId: req.params.versionId }),
      expectedRevision: 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.post('/versions/:versionId/activate', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'ActivateCurriculumGraphVersion',
      commandId,
      idempotencyKey: req.body?.idempotencyKey || commandId,
      requestHash: JSON.stringify({ versionId: req.params.versionId }),
      expectedRevision: 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.post('/versions/:versionId/supersede', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'SupersedeCurriculumGraphVersion',
      commandId,
      idempotencyKey: req.body?.idempotencyKey || commandId,
      requestHash: JSON.stringify(req.body),
      expectedRevision: 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
      supersedingVersionId: req.body.supersedingVersionId,
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  router.post('/versions/:versionId/archive', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = cs.execute({
      commandType: 'ArchiveCurriculumGraphVersion',
      commandId,
      idempotencyKey: req.body?.idempotencyKey || commandId,
      requestHash: JSON.stringify(req.body),
      expectedRevision: 1,
      actor: ctx,
      occurredAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
      versionId: req.params.versionId,
      reason: req.body?.reason || '',
    });
    if (result.success) return sendSuccess(res, result);
    return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
  });

  // ─── Query Routes ───

  router.get('/versions/:versionId/nodes/:nodeId/children', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const result = qs.getChildren(req.params.versionId, req.params.nodeId, ctx);
    if ('success' in result) return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    return sendSuccess(res, result);
  });

  router.get('/versions/:versionId/nodes/:nodeId/ancestors', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const result = qs.getAncestors(req.params.versionId, req.params.nodeId, ctx);
    if ('success' in result) return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    return sendSuccess(res, result);
  });

  router.get('/versions/:versionId/nodes/:nodeId/descendants', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const maxDepth = req.query.maxDepth ? parseInt(req.query.maxDepth as string, 10) : 10;
    const result = qs.getDescendants(req.params.versionId, req.params.nodeId, ctx, maxDepth);
    if ('success' in result) return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    return sendSuccess(res, result);
  });

  router.get('/versions/:versionId/nodes/:nodeId/prerequisites', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const direct = qs.getDirectPrerequisites(req.params.versionId, req.params.nodeId, ctx);
    if ('success' in direct) return sendError(res, 400, direct.error.code, direct.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    const transitive = qs.getTransitivePrerequisites(req.params.versionId, req.params.nodeId, ctx);
    if ('success' in transitive) return sendError(res, 400, transitive.error.code, transitive.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    return sendSuccess(res, { direct, transitive });
  });

  router.get('/versions/:versionId/nodes/:nodeId/dependents', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const direct = qs.getDirectDependents(req.params.versionId, req.params.nodeId, ctx);
    if ('success' in direct) return sendError(res, 400, direct.error.code, direct.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    const transitive = qs.getTransitiveDependents(req.params.versionId, req.params.nodeId, ctx);
    if ('success' in transitive) return sendError(res, 400, transitive.error.code, transitive.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    return sendSuccess(res, { direct, transitive });
  });

  router.get('/versions/:versionId/objectives/:nodeId/map', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const result = qs.getObjectiveMap(req.params.versionId, req.params.nodeId, ctx);
    if (result && 'success' in result) return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    if (!result) return sendError(res, 404, 'CURRICULUM_GRAPH_NOT_FOUND', 'Objective not found', ctx.requestId, ctx.correlationId);
    return sendSuccess(res, result);
  });

  router.get('/versions/:versionId/concepts/:nodeId/map', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const maxDepth = req.query.maxDepth ? parseInt(req.query.maxDepth as string, 10) : 3;
    const result = qs.getConceptMap(req.params.versionId, req.params.nodeId, ctx, maxDepth);
    if (result && 'success' in result) return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    if (!result) return sendError(res, 404, 'CURRICULUM_GRAPH_NOT_FOUND', 'Concept not found', ctx.requestId, ctx.correlationId);
    return sendSuccess(res, result);
  });

  router.get('/versions/:versionId/nodes/:nodeId/learning-path', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const startingNodeIds = req.query.startingNodeIds ? (req.query.startingNodeIds as string).split(',') : undefined;
    const maxDepth = req.query.maxDepth ? parseInt(req.query.maxDepth as string, 10) : undefined;
    const result = qs.resolveStructuralLearningPath(req.params.versionId, req.params.nodeId, ctx, startingNodeIds, maxDepth);
    if ('success' in result) return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    return sendSuccess(res, result);
  });

  router.get('/versions/:versionId/nodes/:nodeId/impact', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const operationType = (req.query.operationType as any) || 'update';
    const result = qs.analyzeChangeImpact(req.params.versionId, ctx, req.params.nodeId, undefined, operationType);
    if ('success' in result) return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    return sendSuccess(res, result);
  });

  router.get('/versions/:versionId/student-safe', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const result = qs.getStudentSafeGraph(req.params.versionId, ctx);
    if (result && 'success' in result) return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    if (!result) return sendError(res, 404, 'CURRICULUM_GRAPH_NOT_FOUND', 'No visible graph', ctx.requestId, ctx.correlationId);
    return sendSuccess(res, result);
  });

  router.get('/versions/:versionId/staff-safe', (req: Request, res: Response) => {
    const ctx = getCtx(req);
    if (!checkSchool(ctx, res)) return;
    const result = qs.getStaffSafeGraph(req.params.versionId, ctx);
    if (result && 'success' in result) return sendError(res, 400, result.error.code, result.error.studentSafeMessage, ctx.requestId, ctx.correlationId);
    if (!result) return sendError(res, 404, 'CURRICULUM_GRAPH_NOT_FOUND', 'Version not found', ctx.requestId, ctx.correlationId);
    return sendSuccess(res, result);
  });

  return router;
}
