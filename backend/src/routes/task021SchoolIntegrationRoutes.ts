import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  normalizeExternalSchoolIdentity,
  extractSafeExternalIdentityFromAuthContext,
  rejectUnsafeExternalIdentityPayload,
  buildExternalIdentitySummary,
} from '../services/task021ExternalSchoolIdentityAdapterService';
import {
  createRosterSyncBatch,
  rejectRawRosterPayload,
  summarizeRosterSyncBatch,
} from '../services/task021RosterSyncIntakeService';
import {
  verifyParentCanAccessLearner,
  buildParentLearnerLinkDecision,
} from '../services/task021ParentLearnerLinkVerificationService';
import {
  resetTask021SchoolIntegrationRepositoryForTests,
  upsertExternalIdentity,
  getExternalIdentity,
  upsertIdentityMapping,
  getIdentityMapping,
  listIdentityMappingsForSchool,
  upsertRosterRecord,
  createRosterSyncBatch as repoCreateRosterSyncBatch,
  getRosterSyncBatch,
  listRosterSyncBatchesForSchool,
  recordRosterReconciliationResult,
  upsertTeacherAssignment,
  getTeacherAssignment,
  upsertParentLearnerLink as repoUpsertParentLearnerLink,
  getParentLearnerLink,
  recordSchoolContextVerification,
  listSchoolContextVerifications,
  recordRoleScopeDecision,
  recordIntegrationFailure,
  listIntegrationFailures,
  recordSchoolIntegrationDiagnostic,
  listSchoolIntegrationDiagnostics,
  recordSchoolIntegrationAuditEvent,
  listSchoolIntegrationAuditEvents,
  listRosterRecordsForSchool,
  listRosterRecordsForClass,
  listTeacherAssignmentsForTeacher,
  listTeacherAssignmentsForClass,
  listParentLearnerLinksForParent,
  listParentLearnerLinksForLearner,
  listIdentityMappingsForSchool as repoListIdentityMappingsForSchool,
  getRepositoryCounts,
} from '../services/task021SchoolIntegrationRepository';
import type {
  Task021ExternalIdentityProvider,
  Task021IdentityMappingStatus,
  Task021AuditEventType,
  Task021SchoolIntegrationContext,
} from '../contracts/task021SchoolIntegrationContracts';
import { TASK021_FORBIDDEN_FIELDS } from '../contracts/task021SchoolIntegrationContracts';
import {
  validateTask021SchoolIntegrationContext,
  validateTask021ExternalSchoolIdentity,
  rejectForbiddenTask021PayloadFields,
} from '../lib/task021SchoolIntegrationValidation';

const router = Router();

function getActor(req: Request): { id: string; role: string; schoolId?: string } {
  return {
    id: (req as any).user?.id || 'anonymous',
    role: (req as any).user?.role || 'unknown',
    schoolId: (req as any).schoolId || (req as any).user?.schoolId || '',
  };
}

function safeAudit(
  schoolId: string,
  eventType: Task021AuditEventType,
  reasonCodes: string[],
  extra?: Record<string, unknown>,
): void {
  recordSchoolIntegrationAuditEvent({
    eventId: uuidv4(),
    schoolId,
    actorId: 'system',
    actorRole: 'internal_operator',
    eventType,
    safeReasonCodes: reasonCodes,
    safeMetadata: extra || {},
    createdAt: new Date().toISOString(),
  });
}

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'task021-school-integration',
    timestamp: new Date().toISOString(),
    reasonCodes: ['health_check_passed'],
  });
});

router.post('/identity/normalize', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const validation = validateTask021ExternalSchoolIdentity(req.body);
    if (!validation.valid) {
      return res.status(400).json({ ok: false, reasonCodes: validation.reasonCodes });
    }

    const unsafeFields = rejectUnsafeExternalIdentityPayload(req.body || {});
    if (unsafeFields.length > 0) {
      return res.status(400).json({
        ok: false,
        reasonCodes: unsafeFields.map(f => `forbidden_field:${f}`),
      });
    }

    const normalized = normalizeExternalSchoolIdentity(req.body);
    upsertExternalIdentity(
      normalized.schoolId,
      normalized.externalUserId,
      normalized.provider,
      normalized.actorRole,
    );

    safeAudit(normalized.schoolId, 'external_identity_normalized', ['identity_normalized']);

    return res.status(200).json({
      ok: true,
      identity: buildExternalIdentitySummary(normalized),
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Identity normalization failed', reasonCodes: ['internal_error'] });
  }
});

router.post('/identity/map', (req: Request, res: Response) => {
  try {
    const { schoolId, externalUserId, internalTutorId, role, provider } = req.body || {};
    if (!schoolId || !externalUserId || !internalTutorId || !role || !provider) {
      return res.status(400).json({ ok: false, reasonCodes: ['missing_required_fields'] });
    }

    const status: Task021IdentityMappingStatus = 'mapped';
    upsertIdentityMapping({
      mappingId: uuidv4(),
      schoolId,
      externalUserId,
      internalTutorId,
      role,
      status,
      provider,
      reasonCodes: ['identity_mapping_created'],
    });

    safeAudit(schoolId, 'identity_mapping_created', ['identity_mapping_created']);

    return res.status(200).json({ ok: true, status: 'mapped' });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Identity mapping failed', reasonCodes: ['internal_error'] });
  }
});

router.get('/identity/:mappingId', (req: Request, res: Response) => {
  try {
    const { mappingId } = req.params;
    const actor = getActor(req);
    const mappings = repoListIdentityMappingsForSchool(actor.schoolId || '');
    const mapping = mappings.find(m => m.mappingId === mappingId);
    if (!mapping) {
      return res.status(404).json({ ok: false, reasonCodes: ['identity_mapping_not_found'] });
    }
    return res.status(200).json({
      ok: true,
      mapping: {
        mappingId: mapping.mappingId,
        schoolId: mapping.schoolId,
        role: mapping.role,
        status: mapping.status,
        provider: mapping.provider,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to get mapping', reasonCodes: ['internal_error'] });
  }
});

router.post('/context/verify', (req: Request, res: Response) => {
  try {
    const ctx = req.body as Partial<Task021SchoolIntegrationContext>;
    const validation = validateTask021SchoolIntegrationContext(ctx);
    if (!validation.valid) {
      const code = validation.reasonCodes[0] || 'context_verification_failed';
      recordSchoolContextVerification({
        verificationId: uuidv4(),
        schoolId: ctx.schoolId || 'unknown',
        actorExternalId: ctx.externalUserId || ctx.externalSubjectId || 'unknown',
        actorRole: ctx.actorRole || 'unknown',
        status: 'missing_school_context',
        reasonCodes: validation.reasonCodes,
        verifiedAt: new Date().toISOString(),
      });
      return res.status(403).json({ verified: false, reasonCodes: validation.reasonCodes });
    }

    recordSchoolContextVerification({
      verificationId: uuidv4(),
      schoolId: ctx.schoolId!,
      actorExternalId: ctx.externalUserId || ctx.externalSubjectId || 'unknown',
      actorRole: ctx.actorRole || 'unknown',
      status: 'verified',
      reasonCodes: ['school_context_verified'],
      verifiedAt: new Date().toISOString(),
    });

    safeAudit(ctx.schoolId!, 'school_context_verified', ['school_context_verified']);

    return res.status(200).json({ verified: true, schoolId: ctx.schoolId, role: ctx.actorRole });
  } catch (error: any) {
    return res.status(500).json({ verified: false, error: 'Context verification failed', reasonCodes: ['internal_error'] });
  }
});

router.post('/roster/sync-batches', (req: Request, res: Response) => {
  try {
    const { schoolId, provider } = req.body || {};
    if (!schoolId || !provider) {
      return res.status(400).json({ ok: false, reasonCodes: ['missing_school_id_or_provider'] });
    }

    const unsafeFields = rejectRawRosterPayload(req.body || {});
    if (unsafeFields.rejected) {
      return res.status(400).json({ ok: false, reasonCodes: unsafeFields.rejectedFields.map(f => `forbidden_field:${f}`) });
    }

    const batch = createRosterSyncBatch(schoolId, provider);

    repoCreateRosterSyncBatch({
      batchId: batch.batchId,
      schoolId: batch.schoolId,
      provider: batch.provider as Task021ExternalIdentityProvider,
      receivedAt: batch.receivedAt,
      status: 'received',
      recordCount: 0,
      safeMetadata: {},
    });

    safeAudit(schoolId, 'roster_sync_batch_created', ['roster_sync_batch_created']);

    return res.status(200).json({ ok: true, batch: summarizeRosterSyncBatch(batch) });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to create sync batch', reasonCodes: ['internal_error'] });
  }
});

router.post('/roster/sync-batches/:batchId/reconcile', (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const batch = getRosterSyncBatch(batchId);
    if (!batch) {
      return res.status(404).json({ ok: false, reasonCodes: ['sync_batch_not_found'] });
    }

    recordRosterReconciliationResult({
      batchId,
      status: 'matched',
      recordsProcessed: batch.recordCount || 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      staleDetected: 0,
      disabledDetected: 0,
      conflictsDetected: 0,
      reasonCodes: ['reconciliation_completed'],
    });

    safeAudit(batch.schoolId, 'roster_reconciliation_completed', ['reconciliation_completed']);

    return res.status(200).json({ ok: true, batchId, status: 'reconciled' });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Reconciliation failed', reasonCodes: ['internal_error'] });
  }
});

router.get('/roster/sync-batches/:batchId', (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const batch = getRosterSyncBatch(batchId);
    if (!batch) {
      return res.status(404).json({ ok: false, reasonCodes: ['sync_batch_not_found'] });
    }
    return res.status(200).json({
      ok: true,
      batch: {
        batchId: batch.batchId,
        schoolId: batch.schoolId,
        provider: batch.provider,
        status: batch.status,
        recordCount: batch.recordCount,
        receivedAt: batch.receivedAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to get sync batch', reasonCodes: ['internal_error'] });
  }
});

router.post('/teacher-assignments', (req: Request, res: Response) => {
  try {
    const { schoolId, teacherId, classId, subjectId } = req.body || {};
    if (!schoolId || !teacherId || !classId) {
      return res.status(400).json({ ok: false, reasonCodes: ['missing_required_fields'] });
    }

    upsertTeacherAssignment({
      assignmentId: uuidv4(),
      schoolId,
      teacherId,
      classId,
      subjectId,
      status: 'active',
      reasonCodes: ['teacher_assignment_created'],
    });

    safeAudit(schoolId, 'teacher_assignment_verified', ['teacher_assignment_created']);

    return res.status(200).json({ ok: true, status: 'active' });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to create assignment', reasonCodes: ['internal_error'] });
  }
});

router.post('/teacher-assignments/verify', (req: Request, res: Response) => {
  try {
    const { schoolId, teacherId, classId } = req.body || {};
    if (!schoolId || !teacherId || !classId) {
      return res.status(400).json({ ok: false, reasonCodes: ['missing_required_fields'] });
    }

    const assignment = getTeacherAssignment(schoolId, teacherId, classId);
    if (!assignment || assignment.status !== 'active') {
      return res.status(403).json({
        allowed: false,
        reasonCodes: ['teacher_not_assigned_to_class', 'class_assignment_required'],
      });
    }

    return res.status(200).json({ allowed: true, reasonCodes: ['teacher_assignment_verified'] });
  } catch (error: any) {
    return res.status(500).json({ allowed: false, error: 'Assignment verification failed', reasonCodes: ['internal_error'] });
  }
});

router.post('/parent-links', (req: Request, res: Response) => {
  try {
    const { schoolId, parentId, learnerId } = req.body || {};
    if (!schoolId || !parentId || !learnerId) {
      return res.status(400).json({ ok: false, reasonCodes: ['missing_required_fields'] });
    }

    const link = {
      linkId: uuidv4(),
      parentId,
      learnerId,
      schoolId,
      status: 'active' as const,
      reasonCodes: ['parent_learner_link_created'],
    };

    repoUpsertParentLearnerLink(link);
    safeAudit(schoolId, 'parent_learner_link_verified', ['parent_learner_link_created']);

    return res.status(200).json({ ok: true, linkId: link.linkId });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to create parent link', reasonCodes: ['internal_error'] });
  }
});

router.post('/parent-links/verify', (req: Request, res: Response) => {
  try {
    const { schoolId, parentId, learnerId } = req.body || {};
    if (!schoolId || !parentId || !learnerId) {
      return res.status(400).json({ ok: false, reasonCodes: ['missing_required_fields'] });
    }

    const link = getParentLearnerLink(schoolId, parentId, learnerId);
    const decision = buildParentLearnerLinkDecision(link, parentId, learnerId, schoolId);

    if (!decision.allowed) {
      safeAudit(schoolId, 'parent_learner_link_denied', decision.reasonCodes);
      return res.status(403).json({ allowed: false, reasonCodes: decision.reasonCodes });
    }

    safeAudit(schoolId, 'parent_learner_link_verified', ['parent_learner_link_verified']);
    return res.status(200).json({ allowed: true, reasonCodes: decision.reasonCodes });
  } catch (error: any) {
    return res.status(500).json({ allowed: false, error: 'Parent link verification failed', reasonCodes: ['internal_error'] });
  }
});

router.post('/role-scope/verify', (req: Request, res: Response) => {
  try {
    const { actorRole, action, resourceCategory } = req.body || {};
    if (!actorRole || !action) {
      return res.status(400).json({ ok: false, reasonCodes: ['missing_required_fields'] });
    }

    const actor = getActor(req);
    const schoolId = actor.schoolId || 'unknown';

    const allowed = actorRole !== 'unknown' && actorRole !== 'anonymous';

    recordRoleScopeDecision({
      allowed,
      actorRole,
      action,
      resourceCategory: resourceCategory || 'unknown',
      decision: allowed ? 'allow' : 'deny',
      reasonCodes: allowed ? ['role_scope_verified'] : ['role_scope_denied', 'unknown_role_denied'],
    });

    safeAudit(schoolId, allowed ? 'role_scope_verified' : 'role_scope_denied', ['role_scope_checked']);

    return res.status(allowed ? 200 : 403).json({ allowed, reasonCodes: allowed ? ['role_scope_verified'] : ['role_scope_denied'] });
  } catch (error: any) {
    return res.status(500).json({ allowed: false, error: 'Role scope check failed', reasonCodes: ['internal_error'] });
  }
});

router.get('/diagnostics', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const schoolId = actor.schoolId || 'default';
    const counts = getRepositoryCounts();

    const diagnostic: Record<string, unknown> = {
      schoolId,
      status: 'operational',
      externalIdentitiesCount: counts.externalIdentities,
      identityMappingsCount: counts.identityMappings,
      rosterRecordsCount: counts.rosterRecords,
      rosterSyncBatchesCount: counts.rosterSyncBatches,
      teacherAssignmentsCount: counts.teacherAssignments,
      parentLearnerLinksCount: counts.parentLearnerLinks,
      verificationsCount: counts.verifications,
      roleDecisionsCount: counts.roleDecisions,
      failuresCount: counts.failures,
      diagnosticsCount: counts.diagnostics,
      auditEventsCount: counts.auditEvents,
      reasonCodes: ['diagnostics_generated'],
    };

    recordSchoolIntegrationDiagnostic({
      diagnosticId: uuidv4(),
      schoolId,
      severity: 'info',
      component: 'school-integration',
      safeMessage: 'Diagnostics retrieved',
      reasonCodes: ['diagnostics_generated'],
      createdAt: new Date().toISOString(),
    });

    safeAudit(schoolId, 'school_integration_diagnostic_viewed', ['diagnostics_viewed']);

    return res.status(200).json(diagnostic);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to get diagnostics', reasonCodes: ['internal_error'] });
  }
});

router.get('/failures', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const schoolId = actor.schoolId || 'default';
    const failures = listIntegrationFailures(schoolId);
    return res.status(200).json({
      ok: true,
      count: failures.length,
      failures: failures.map(f => ({
        failureId: f.failureId,
        failureType: f.failureType,
        safeSummary: f.safeSummary,
        reasonCodes: f.reasonCodes,
        createdAt: f.createdAt,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to get failures', reasonCodes: ['internal_error'] });
  }
});

router.get('/audit', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const schoolId = actor.schoolId || 'default';
    const events = listSchoolIntegrationAuditEvents(schoolId);
    return res.status(200).json({
      ok: true,
      count: events.length,
      events: events.map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        actorRole: e.actorRole,
        safeReasonCodes: e.safeReasonCodes,
        createdAt: e.createdAt,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to get audit events', reasonCodes: ['internal_error'] });
  }
});

export default router;
