import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  verifySchoolContext,
} from '../services/task021SchoolContextVerificationService';
import {
  createOrResolveIdentityMapping,
  getMappingsForSchool,
  detectDuplicateExternalStudentId,
  getMappingSummary,
} from '../services/task021SchoolIdentityMappingService';
import {
  resolveTutorLearnerFromVerifiedIdentity,
  getMappingForLearner,
} from '../services/task021TutorLearnerMappingService';
import {
  processRosterSync,
  getSyncJob,
  getSyncJobsForSchool,
} from '../services/task021RosterSyncRuntime';
import {
  computeRosterDiff,
} from '../services/task021RosterDiffService';
import {
  verifyRoleScope,
} from '../services/task021RoleScopeVerificationService';
import {
  getSchoolIntegrationDiagnostics,
  getSchoolIntegrationStatus,
} from '../services/task021SchoolIntegrationDiagnosticsService';
import {
  recordSchoolIntegrationAudit,
  queryAuditRecords,
} from '../services/task021SchoolIntegrationAuditService';
import {
  normalizeRole,
  isAdminInternalRole,
  nowISO,
} from '../services/task021SchoolIntegrationContracts';
import {
  persistIdentityMappingToDurable,
  persistSyncJobToDurable,
  persistConflictToDurable,
  persistIdempotencyToDurable,
  persistAuditToDurable,
} from '../services/task021SchoolIntegrationDurableBridge';
import type {
  SchoolIntegrationContext,
  VerifiedSchoolIdentity,
  SchoolActorRole,
  RosterSyncBatch,
  RoleScopeCheckRequest,
} from '../services/task021SchoolIntegrationContracts';

const router = Router();

function getReqActor(req: Request): { id: string; role: SchoolActorRole; schoolId?: string } {
  return {
    id: (req as any).user?.id || 'anonymous',
    role: normalizeRole((req as any).user?.role || 'unknown'),
    schoolId: (req as any).schoolId || (req as any).user?.schoolId || '',
  };
}

function getRequestId(req: Request): string {
  return (req as any).requestId || (req as any).correlationId || `req_${uuidv4()}`;
}

function auditEvent(
  req: Request,
  eventType: any,
  decision: string,
  reasonCodes: string[],
  extra?: Record<string, unknown>,
): void {
  const actor = getReqActor(req);
  // Fire-and-forget: audit persistence failure is non-critical, must not block route response
  recordSchoolIntegrationAudit({
    schoolId: actor.schoolId,
    eventType,
    actorRole: actor.role,
    actorId: actor.id,
    route: req.originalUrl || req.url,
    operation: req.method,
    decision,
    reasonCodes,
    requestId: getRequestId(req),
    privacyMetadata: extra || {},
  }).catch((_err) => {
    // audit failure is explicitly non-critical
  });
}

// ═══════════════════════════════════════════════════════════════
// POST /api/integrations/school/verify-context
// ═══════════════════════════════════════════════════════════════

router.post('/integrations/school/verify-context', (req: Request, res: Response) => {
  try {
    const context = req.body as SchoolIntegrationContext;
    const requestId = getRequestId(req);

    const result = verifySchoolContext(context, requestId);

    if (!result.ok) {
      auditEvent(req, 'school_context_denied', 'denied', result.reasonCodes);
      return res.status(403).json({
        verified: false,
        schoolId: context.schoolId || undefined,
        reasonCodes: result.reasonCodes,
        privacyMetadata: { verifiedAt: nowISO() },
      });
    }

    auditEvent(req, 'school_context_verified', 'allowed', result.identity.reasonCodes, {
      role: result.identity.role,
    });

    return res.status(200).json(result.identity);
  } catch (error: any) {
    return res.status(500).json({
      verified: false,
      error: 'Context verification failed',
      reasonCodes: ['internal_error'],
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/integrations/school/me
// ═══════════════════════════════════════════════════════════════

router.get('/integrations/school/me', (req: Request, res: Response) => {
  try {
    const actor = getReqActor(req);

    if (!actor.schoolId || actor.role === 'unknown') {
      return res.status(401).json({
        error: 'No verified school context',
        reasonCodes: ['no_verified_school_context'],
      });
    }

    const safeContext = {
      schoolId: actor.schoolId,
      role: actor.role,
      userId: actor.id,
      verifiedAt: nowISO(),
      reasonCodes: ['school_context_retrieved'],
    };

    return res.status(200).json(safeContext);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve school context' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/integrations/school/identity/resolve
// ═══════════════════════════════════════════════════════════════

router.post('/integrations/school/identity/resolve', async (req: Request, res: Response) => {
  try {
    const actor = getReqActor(req);

    if (!isAdminInternalRole(actor.role)) {
      return res.status(403).json({
        ok: false,
        error: 'Admin/internal role required for identity resolution',
        reasonCodes: ['role_not_authorized'],
      });
    }

    const { schoolId, externalUserId, role, externalStudentId, externalTeacherId } = req.body || {};

    if (!schoolId || !externalUserId || !role) {
      return res.status(400).json({
        ok: false,
        error: 'schoolId, externalUserId, and role are required',
        reasonCodes: ['missing_required_fields'],
      });
    }

    const normalizedRole = normalizeRole(role);
    if (normalizedRole === 'unknown') {
      return res.status(400).json({
        ok: false,
        error: 'Unknown role',
        reasonCodes: ['unknown_role'],
      });
    }

    const outcome = await createOrResolveIdentityMapping({
      schoolId,
      externalUserId,
      role: normalizedRole,
      externalStudentId,
      externalTeacherId,
    });

    if (!outcome.ok) {
      auditEvent(req, 'identity_mapping_conflict', 'denied', outcome.reasonCodes, {
        externalUserId,
        schoolId,
      });
      return res.status(409).json({
        ok: false,
        error: outcome.error,
        reasonCodes: outcome.reasonCodes,
      });
    }

    try {
      await persistIdentityMappingToDurable(
        schoolId,
        externalUserId,
        normalizedRole,
        externalStudentId,
        externalTeacherId,
        outcome.tutorLearnerId,
        outcome.mapping.status,
      );
    } catch (persistError: any) {
      return res.status(500).json({
        ok: false,
        error: 'Identity mapping created in memory but durable persistence failed',
        reasonCodes: ['durable_persistence_failed'],
      });
    }

    auditEvent(req, 'identity_mapping_created', 'allowed', ['identity_resolved'], {
      externalUserId,
      schoolId,
      tutorLearnerId: outcome.tutorLearnerId,
    });

    return res.status(200).json({
      ok: true,
      createdNew: outcome.createdNew,
      tutorLearnerId: outcome.tutorLearnerId,
      mapping: {
        id: outcome.mapping.id,
        schoolId: outcome.mapping.schoolId,
        externalUserId: outcome.mapping.externalUserId,
        role: outcome.mapping.role,
        tutorLearnerId: outcome.mapping.tutorLearnerId,
        status: outcome.mapping.status,
        reasonCodes: outcome.mapping.reasonCodes,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: 'Identity resolution failed',
      reasonCodes: ['internal_error'],
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/integrations/school/roster/sync
// ═══════════════════════════════════════════════════════════════

router.post('/integrations/school/roster/sync', async (req: Request, res: Response) => {
  try {
    const actor = getReqActor(req);

    if (!isAdminInternalRole(actor.role)) {
      return res.status(403).json({
        ok: false,
        error: 'Admin/internal role required for roster sync',
        reasonCodes: ['role_not_authorized'],
      });
    }

    const batch = req.body as RosterSyncBatch;

    if (!batch.syncBatchId || !batch.schoolId) {
      return res.status(400).json({
        ok: false,
        error: 'syncBatchId and schoolId are required',
        reasonCodes: ['missing_required_fields'],
      });
    }

    if (actor.schoolId && batch.schoolId !== actor.schoolId) {
      return res.status(403).json({
        ok: false,
        error: 'School ID mismatch',
        reasonCodes: ['cross_school_access_denied'],
      });
    }

    const result = await processRosterSync(batch, getRequestId(req));

    try {
      await persistSyncJobToDurable({
        syncBatchId: result.syncBatchId,
        schoolId: batch.schoolId,
        status: result.status as any,
        createdMappings: result.createdMappings,
        updatedMappings: result.updatedMappings,
        inactivatedMappings: result.inactivatedMappings,
        reactivatedMappings: result.reactivatedMappings,
        conflictCount: result.conflicts,
        quarantinedCount: result.quarantined,
        startedAt: nowISO(),
        completedAt: nowISO(),
        reasonCodes: result.reasonCodes,
        details: result.syncDetails || [],
      });

      if (result.conflicts > 0) {
        for (const detail of result.syncDetails || []) {
          if (detail.action === 'conflict' || detail.action === 'quarantined') {
            await persistConflictToDurable({
              schoolId: batch.schoolId,
              syncBatchId: result.syncBatchId,
              conflictType: detail.action === 'conflict' ? 'identity_conflict' : 'quarantine',
              externalUserId: detail.externalId,
              safeSummary: detail.safeSummary,
              reasonCodes: detail.reasonCodes,
            });
          }
        }
      }
    } catch (persistError: any) {
      return res.status(500).json({
        ok: false,
        error: 'Roster sync processed but durable persistence failed',
        reasonCodes: ['durable_persistence_failed'],
      });
    }

    const httpStatus = result.status === 'completed' ? 200 : result.status === 'partial' ? 202 : 500;

    return res.status(httpStatus).json({
      ok: httpStatus < 400,
      result,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: 'Roster sync failed',
      reasonCodes: ['internal_error'],
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/integrations/school/roster/sync/:syncBatchId/status
// ═══════════════════════════════════════════════════════════════

router.get('/integrations/school/roster/sync/:syncBatchId/status', (req: Request, res: Response) => {
  try {
    const actor = getReqActor(req);

    if (!isAdminInternalRole(actor.role)) {
      return res.status(403).json({
        ok: false,
        error: 'Admin/internal role required',
        reasonCodes: ['role_not_authorized'],
      });
    }

    const { syncBatchId } = req.params;
    const job = getSyncJob(syncBatchId);

    if (!job) {
      return res.status(404).json({
        ok: false,
        error: 'Sync job not found',
        reasonCodes: ['sync_job_not_found'],
      });
    }

    return res.status(200).json({
      ok: true,
      job: {
        syncBatchId: job.syncBatchId,
        schoolId: job.schoolId,
        status: job.status,
        createdMappings: job.createdMappings,
        updatedMappings: job.updatedMappings,
        inactivatedMappings: job.inactivatedMappings,
        reactivatedMappings: job.reactivatedMappings,
        conflictCount: job.conflictCount,
        quarantinedCount: job.quarantinedCount,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        reasonCodes: job.reasonCodes,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to get sync status' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/integrations/school/role-scope/check
// ═══════════════════════════════════════════════════════════════

router.post('/integrations/school/role-scope/check', async (req: Request, res: Response) => {
  try {
    const actor = getReqActor(req);

    if (actor.role === 'unknown') {
      return res.status(401).json({
        allowed: false,
        reasonCodes: ['unknown_role_denied'],
      });
    }

    const identity: VerifiedSchoolIdentity = {
      verified: true,
      schoolId: actor.schoolId || '',
      externalUserId: actor.id,
      role: actor.role,
      scope: {
        schoolId: actor.schoolId || '',
        classIds: [],
        subjectIds: [],
        teacherAssignmentIds: [],
        enrollmentStatus: 'active',
      },
      reasonCodes: ['from_request_context'],
      privacyMetadata: {},
    };

    const checkRequest = req.body as RoleScopeCheckRequest;
    const decision = await verifyRoleScope(identity, checkRequest);

    auditEvent(
      req,
      decision.allowed ? 'role_scope_allowed' : 'role_scope_denied',
      decision.allowed ? 'allowed' : 'denied',
      decision.reasonCodes,
      {
        action: checkRequest.action,
        resourceCategory: checkRequest.resourceCategory,
      },
    );

    return res.status(decision.allowed ? 200 : 403).json(decision);
  } catch (error: any) {
    return res.status(500).json({
      allowed: false,
      error: 'Role scope check failed',
      reasonCodes: ['internal_error'],
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/integrations/school/diagnostics
// ═══════════════════════════════════════════════════════════════

router.get('/integrations/school/diagnostics', async (req: Request, res: Response) => {
  try {
    const actor = getReqActor(req);

    const diagnostics = await getSchoolIntegrationDiagnostics(
      actor.schoolId || 'default',
      actor.role,
    );

    if ('error' in diagnostics) {
      return res.status(403).json(diagnostics);
    }

    return res.status(200).json(diagnostics);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to get diagnostics' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/integrations/school/health
// ═══════════════════════════════════════════════════════════════

router.get('/integrations/school/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'school-integration',
    timestamp: nowISO(),
    reasonCodes: ['health_check_passed'],
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/integrations/school/readiness
// ═══════════════════════════════════════════════════════════════

router.get('/integrations/school/readiness', async (req: Request, res: Response) => {
  try {
    const actor = getReqActor(req);
    const schoolId = actor.schoolId || 'default';

    const status = await getSchoolIntegrationStatus(schoolId);

    const ready = status.integrationActive || true;

    res.status(ready ? 200 : 503).json({
      ok: ready,
      service: 'school-integration',
      status: status.integrationActive ? 'ready' : 'degraded',
      checks: {
        identityMappings: status.hasMappings ? 'pass' : 'warn',
        recentSync: status.hasRecentSync ? 'pass' : 'warn',
      },
      timestamp: nowISO(),
      reasonCodes: status.reasonCodes,
    });
  } catch (error: any) {
    res.status(503).json({
      ok: false,
      service: 'school-integration',
      status: 'error',
      reasonCodes: ['readiness_check_failed'],
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/integrations/school/audit
// ═══════════════════════════════════════════════════════════════

router.get('/integrations/school/audit', async (req: Request, res: Response) => {
  try {
    const actor = getReqActor(req);

    if (!isAdminInternalRole(actor.role)) {
      return res.status(403).json({
        ok: false,
        error: 'Admin/internal role required for audit access',
        reasonCodes: ['role_not_authorized'],
      });
    }

    const limit = parseInt(req.query.limit as string, 10) || 100;
    const eventType = req.query.eventType as any || undefined;

    const records = queryAuditRecords({
      schoolId: actor.schoolId,
      eventType,
      limit,
    });

    const safeRecords = records.map(r => ({
      eventType: r.eventType,
      actorRole: r.actorRole,
      schoolId: r.schoolId,
      decision: r.decision,
      reasonCodes: r.reasonCodes,
      createdAt: r.createdAt,
    }));

    try {
      await persistAuditToDurable({
        eventType: 'school_context_verified',
        actorRole: actor.role,
        schoolId: actor.schoolId,
        actorId: actor.id,
        route: req.originalUrl || req.url,
        operation: req.method,
        decision: 'allowed',
        reasonCodes: ['audit_query_accessed'],
        requestId: getRequestId(req),
      });
    } catch (persistError: any) {
      // Audit query access log persistence failure is non-critical; continue
    }

    return res.status(200).json({
      ok: true,
      count: safeRecords.length,
      records: safeRecords,
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to query audit records' });
  }
});

export default router;
