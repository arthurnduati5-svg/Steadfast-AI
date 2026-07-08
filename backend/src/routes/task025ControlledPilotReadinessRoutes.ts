import { Router, Request, Response } from 'express';
import { validateTask025PilotReadinessContext, validateTask025PilotScopeInput, validateTask025CandidateCohortInput, validateTask025StakeholderReadinessInput, validateTask025TeacherWorkflowInput, validateTask025AdminAcceptanceInput, validateTask025ParentCommunicationInput, validateTask025SafeguardingReadinessInput, validateTask025MonitoringReadinessInput, validateTask025PauseRollbackInput, validateTask025DataPrivacyInput, rejectTask025ForbiddenFields } from '../lib/task025ControlledPilotReadinessValidation';
import { evaluatePilotScope } from '../services/task025PilotScopeGateService';
import { evaluateCandidateCohortReadiness } from '../services/task025CandidateCohortReadinessService';
import { checkPilotEligibility } from '../services/task025PilotEligibilityPolicyService';
import { evaluateStakeholderReadiness } from '../services/task025StakeholderReadinessService';
import { validateTeacherWorkflow } from '../services/task025TeacherWorkflowValidationService';
import { checkAdminAcceptance } from '../services/task025SchoolAdminAcceptanceReadinessService';
import { checkParentCommunicationReadiness } from '../services/task025ParentCommunicationReadinessService';
import { checkSafeguardingEscalationReadiness } from '../services/task025SafeguardingEscalationReadinessService';
import { checkSupportOperationsReadiness } from '../services/task025SupportOperationsReadinessService';
import { checkMonitoringGateReadiness } from '../services/task025MonitoringGateReadinessService';
import { checkDataPrivacyReadiness } from '../services/task025DataPrivacyReadinessService';
import { checkPauseRollbackReadiness } from '../services/task025PauseRollbackReadinessService';
import { checkTask024Dependency } from '../services/task025Task024DependencyService';
import { evaluateReadinessDecision } from '../services/task025ReadinessDecisionService';
import { generateReadinessDiagnostics } from '../services/task025ReadinessDiagnosticsService';
import { queryReadinessAudit } from '../services/task025ReadinessAuditService';
import { generateReadinessReport } from '../services/task025ReadinessReportService';
import { task025PilotReadinessRepository } from '../services/task025PilotReadinessRepository';

const router = Router();

function getSchoolId(req: Request): string | undefined {
  return (req as any).schoolId || (req as any).verifiedSchoolIdentity?.schoolId;
}

function getActorRole(req: Request): string {
  return (req as any).user?.role || 'anonymous';
}

function getActorId(req: Request): string {
  return (req as any).user?.id || 'unknown';
}

function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

function safeErrorEnvelope(res: Response, status: number, code: string, safeMessage: string, reasonCodes: string[], requestId: string): void {
  res.status(status).json({
    ok: false,
    error: { code, safeMessage, reasonCodes },
    requestId,
  });
}

function safeDeniedResponse(res: Response, requestId: string): void {
  res.status(403).json({
    ok: false,
    error: { code: 'ACCESS_DENIED', safeMessage: 'Access denied. Admin or internal operator role required.', reasonCodes: ['access_denied'] },
    requestId,
  });
}

async function requireReadinessActor(req: Request, res: Response): Promise<boolean> {
  const role = getActorRole(req);
  const allowedRoles = ['school_admin', 'system_admin', 'internal_operator', 'authorized_pilot_coordinator', 'admin'];
  if (!allowedRoles.includes(role)) {
    safeDeniedResponse(res, getRequestId(req));
    return false;
  }
  return true;
}

// GET /health
router.get('/health', async (req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    status: 'ready',
    task: 'TASK-025',
    description: 'Controlled Pilot Readiness Runtime',
    scope: 'readiness_only',
    timestamp: new Date().toISOString(),
    requestId: getRequestId(req),
  });
});

// POST /scope/evaluate
router.post('/scope/evaluate', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const forbiddenCheck = rejectTask025ForbiddenFields(req.body || {});
    if (forbiddenCheck) {
      safeErrorEnvelope(res, 400, forbiddenCheck.code, forbiddenCheck.safeMessage, forbiddenCheck.reasonCodes, requestId);
      return;
    }

    const scopeInput = validateTask025PilotScopeInput(req.body, ctx.data.schoolId);
    if (!scopeInput.valid) {
      safeErrorEnvelope(res, 400, scopeInput.code, scopeInput.safeMessage, scopeInput.reasonCodes, requestId);
      return;
    }

    const assessment = await evaluatePilotScope(scopeInput.data);
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'scope_evaluated', assessment.safeSummary, requestId);
    res.json({ ok: true, assessment, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'SCOPE_EVALUATION_FAILED', 'Failed to evaluate pilot scope.', ['internal_error'], requestId);
  }
});

// POST /cohorts/candidates
router.post('/cohorts/candidates', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const forbiddenCheck = rejectTask025ForbiddenFields(req.body || {});
    if (forbiddenCheck) {
      safeErrorEnvelope(res, 400, forbiddenCheck.code, forbiddenCheck.safeMessage, forbiddenCheck.reasonCodes, requestId);
      return;
    }

    const cohortInput = validateTask025CandidateCohortInput(req.body, ctx.data.schoolId);
    if (!cohortInput.valid) {
      safeErrorEnvelope(res, 400, cohortInput.code, cohortInput.safeMessage, cohortInput.reasonCodes, requestId);
      return;
    }

    const readiness = await evaluateCandidateCohortReadiness(cohortInput.data);
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'cohort_readiness_checked', readiness.safeSummary, requestId);
    res.json({ ok: true, readiness, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COHORT_READINESS_FAILED', 'Failed to evaluate cohort readiness.', ['internal_error'], requestId);
  }
});

// POST /cohorts/:cohortId/readiness
router.post('/cohorts/:cohortId/readiness', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const cohortInput = validateTask025CandidateCohortInput({
      ...req.body,
      cohortId: req.params.cohortId,
      schoolId: ctx.data.schoolId,
    }, ctx.data.schoolId);
    if (!cohortInput.valid) {
      safeErrorEnvelope(res, 400, cohortInput.code, cohortInput.safeMessage, cohortInput.reasonCodes, requestId);
      return;
    }

    const readiness = await evaluateCandidateCohortReadiness(cohortInput.data);
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'cohort_readiness_checked', readiness.safeSummary, requestId);
    res.json({ ok: true, readiness, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COHORT_READINESS_FAILED', 'Failed to evaluate cohort readiness.', ['internal_error'], requestId);
  }
});

// POST /stakeholders/readiness
router.post('/stakeholders/readiness', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const stakeholderInput = validateTask025StakeholderReadinessInput(req.body, ctx.data.schoolId);
    if (!stakeholderInput.valid) {
      safeErrorEnvelope(res, 400, stakeholderInput.code, stakeholderInput.safeMessage, stakeholderInput.reasonCodes, requestId);
      return;
    }

    const result = await evaluateStakeholderReadiness(stakeholderInput.data);
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'readiness_check_run', result.safeSummary, requestId);
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STAKEHOLDER_READINESS_FAILED', 'Failed to evaluate stakeholder readiness.', ['internal_error'], requestId);
  }
});

// POST /teacher-workflows/validate
router.post('/teacher-workflows/validate', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const workflowInput = validateTask025TeacherWorkflowInput(req.body);
    if (!workflowInput.valid) {
      safeErrorEnvelope(res, 400, workflowInput.code, workflowInput.safeMessage, workflowInput.reasonCodes, requestId);
      return;
    }

    const result = await validateTeacherWorkflow({
      ...workflowInput.data,
      allTeachersUnderstandScope: !!req.body.allTeachersUnderstandScope,
      escalationPathKnown: !!req.body.escalationPathKnown,
      privacyBoundaryUnderstood: !!req.body.privacyBoundaryUnderstood,
    });
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'teacher_workflow_validated', result.safeSummary, requestId);
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'TEACHER_WORKFLOW_FAILED', 'Failed to validate teacher workflow.', ['internal_error'], requestId);
  }
});

// POST /admin-acceptance/check
router.post('/admin-acceptance/check', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const adminInput = validateTask025AdminAcceptanceInput(req.body);
    if (!adminInput.valid) {
      safeErrorEnvelope(res, 400, adminInput.code, adminInput.safeMessage, adminInput.reasonCodes, requestId);
      return;
    }

    const result = await checkAdminAcceptance({
      adminOwner: adminInput.data.adminOwner,
      pilotOwnerAssigned: !!req.body.pilotOwnerAssigned,
      pilotPurposeDefined: !!req.body.pilotPurposeDefined,
      pilotScopeDefined: !!req.body.pilotScopeDefined,
      pilotDatesDefined: !!req.body.pilotDatesDefined,
      escalationOwnerAssigned: !!req.body.escalationOwnerAssigned,
      pauseOwnerAssigned: !!req.body.pauseOwnerAssigned,
      rollbackOwnerAssigned: !!req.body.rollbackOwnerAssigned,
      supportOwnerAssigned: !!req.body.supportOwnerAssigned,
      privacyOwnerAssigned: !!req.body.privacyOwnerAssigned,
      incidentOwnerAssigned: !!req.body.incidentOwnerAssigned,
    });
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'admin_acceptance_checked', result.safeSummary, requestId);
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ADMIN_ACCEPTANCE_FAILED', 'Failed to check admin acceptance readiness.', ['internal_error'], requestId);
  }
});

// POST /parent-communication/check
router.post('/parent-communication/check', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const commInput = validateTask025ParentCommunicationInput(req.body);
    if (!commInput.valid) {
      safeErrorEnvelope(res, 400, commInput.code, commInput.safeMessage, commInput.reasonCodes, requestId);
      return;
    }

    const result = await checkParentCommunicationReadiness({
      templatesReady: commInput.data.templatesReady,
      noRawLearnerDataInTemplates: !!req.body.noRawLearnerDataInTemplates,
      noUnsupportedClaims: !!req.body.noUnsupportedClaims,
      noReligiousAuthorityOverclaim: !!req.body.noReligiousAuthorityOverclaim,
      noAiExaggeration: !!req.body.noAiExaggeration,
      noGuaranteeOfOutcomes: !!req.body.noGuaranteeOfOutcomes,
      clearPilotExplanation: !!req.body.clearPilotExplanation,
      clearSupportPath: !!req.body.clearSupportPath,
      clearSchoolContactPath: !!req.body.clearSchoolContactPath,
      clearPrivacySummary: !!req.body.clearPrivacySummary,
      clearOptOutPathDefined: commInput.data.optOutPathDefined,
    });
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'parent_communication_checked', result.safeSummary, requestId);
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PARENT_COMMUNICATION_FAILED', 'Failed to check parent communication readiness.', ['internal_error'], requestId);
  }
});

// POST /safeguarding-escalation/check
router.post('/safeguarding-escalation/check', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const sgInput = validateTask025SafeguardingReadinessInput(req.body);
    if (!sgInput.valid) {
      safeErrorEnvelope(res, 400, sgInput.code, sgInput.safeMessage, sgInput.reasonCodes, requestId);
      return;
    }

    const result = await checkSafeguardingEscalationReadiness({
      safeguardingOwnerExists: sgInput.data.safeguardingOwnerExists,
      escalationRouteDefined: sgInput.data.escalationRouteDefined,
      seriousRiskDisclosureMinimal: !!req.body.seriousRiskDisclosureMinimal,
      rawNotesNeverExposed: !!req.body.rawNotesNeverExposed,
      humanReviewPathExists: sgInput.data.humanReviewPathExists,
      auditEventCreated: true,
    });
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'safeguarding_escalation_checked', result.safeSummary, requestId);
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'SAFEGUARDING_FAILED', 'Failed to check safeguarding escalation readiness.', ['internal_error'], requestId);
  }
});

// POST /support-operations/check
router.post('/support-operations/check', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const result = await checkSupportOperationsReadiness({
      supportOwnerAssigned: !!req.body.supportOwnerAssigned,
      incidentOwnerAssigned: !!req.body.incidentOwnerAssigned,
      supportScheduleDefined: !!req.body.supportScheduleDefined,
      incidentResponseTimeDefined: !!req.body.incidentResponseTimeDefined,
      communicationChainDefined: !!req.body.communicationChainDefined,
    });
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'support_operations_checked', result.safeSummary, requestId);
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'SUPPORT_OPERATIONS_FAILED', 'Failed to check support operations readiness.', ['internal_error'], requestId);
  }
});

// POST /monitoring-gate/check
router.post('/monitoring-gate/check', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const monInput = validateTask025MonitoringReadinessInput(req.body);
    if (!monInput.valid) {
      safeErrorEnvelope(res, 400, monInput.code, monInput.safeMessage, monInput.reasonCodes, requestId);
      return;
    }

    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: monInput.data.task024MonitoringReady,
      incidentDrillAvailable: monInput.data.incidentDrillAvailable,
      backupRestoreDrillAvailable: monInput.data.backupRestoreDrillAvailable,
      operationalPrivacyScanAvailable: !!req.body.operationalPrivacyScanAvailable,
      pauseSignalPathDefined: !!req.body.pauseSignalPathDefined,
      rollbackSignalPathDefined: !!req.body.rollbackSignalPathDefined,
      readinessDiagnosticsSafeMetadataOnly: !!req.body.readinessDiagnosticsSafeMetadataOnly,
    });
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'monitoring_gate_checked', result.safeSummary, requestId);
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'MONITORING_GATE_FAILED', 'Failed to check monitoring gate readiness.', ['internal_error'], requestId);
  }
});

// POST /pause-rollback/check
router.post('/pause-rollback/check', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const prInput = validateTask025PauseRollbackInput(req.body);
    if (!prInput.valid) {
      safeErrorEnvelope(res, 400, prInput.code, prInput.safeMessage, prInput.reasonCodes, requestId);
      return;
    }

    const result = await checkPauseRollbackReadiness({
      pauseOwnerExists: prInput.data.pauseOwnerExists,
      rollbackOwnerExists: prInput.data.rollbackOwnerExists,
      pauseCriteriaDefined: prInput.data.pauseCriteriaDefined,
      rollbackCriteriaDefined: prInput.data.rollbackCriteriaDefined,
      incidentSeverityMappingExists: !!req.body.incidentSeverityMappingExists,
      communicationChainExistsAsMetadata: !!req.body.communicationChainExistsAsMetadata,
      noActualRollbackExecuted: true,
      noDeploymentCommandExists: true,
    });
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'pause_rollback_checked', result.safeSummary, requestId);
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PAUSE_ROLLBACK_FAILED', 'Failed to check pause/rollback readiness.', ['internal_error'], requestId);
  }
});

// POST /data-privacy/check
router.post('/data-privacy/check', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const dpInput = validateTask025DataPrivacyInput(req.body);
    if (!dpInput.valid) {
      safeErrorEnvelope(res, 400, dpInput.code, dpInput.safeMessage, dpInput.reasonCodes, requestId);
      return;
    }

    const result = await checkDataPrivacyReadiness({
      dataClassificationApplied: dpInput.data.dataClassificationApplied,
      roleMatrixApplied: dpInput.data.roleMatrixApplied,
      retentionExportDeleteFoundationNotBypassed: !!req.body.retentionExportDeleteFoundationNotBypassed,
      aiEgressGuardNotBypassed: dpInput.data.aiEgressGuardNotBypassed,
      rawLearnerDataBlocked: !!req.body.rawLearnerDataBlocked,
      parentDataBlocked: !!req.body.parentDataBlocked,
      safeguardingRawBlocked: !!req.body.safeguardingRawBlocked,
      privateDeenTextBlocked: !!req.body.privateDeenTextBlocked,
      hiddenReasoningBlocked: !!req.body.hiddenReasoningBlocked,
      answerArtifactsBlocked: !!req.body.answerArtifactsBlocked,
    });
    task025PilotReadinessRepository.writeAuditEvent(ctx.data.schoolId, ctx.data.actorRole, 'data_privacy_checked', result.safeSummary, requestId);
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DATA_PRIVACY_FAILED', 'Failed to check data privacy readiness.', ['internal_error'], requestId);
  }
});

// POST /decision/evaluate
router.post('/decision/evaluate', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const body = req.body || {};

    const decision = await evaluateReadinessDecision(
      ctx.data.schoolId,
      ctx.data.actorRole,
      requestId,
      {
        scopeGatePassed: !!body.scopeGatePassed,
        cohortReadinessPassed: !!body.cohortReadinessPassed,
        teacherWorkflowPassed: !!body.teacherWorkflowPassed,
        adminAcceptancePassed: !!body.adminAcceptancePassed,
        parentCommunicationPassed: !!body.parentCommunicationPassed,
        safeguardingPassed: !!body.safeguardingPassed,
        supportOperationsPassed: !!body.supportOperationsPassed,
        monitoringGatePassed: !!body.monitoringGatePassed,
        pauseRollbackPassed: !!body.pauseRollbackPassed,
        dataPrivacyPassed: !!body.dataPrivacyPassed,
        task020ContinuityPassed: !!body.task020ContinuityPassed,
        task021ContinuityPassed: !!body.task021ContinuityPassed,
        task022ContinuityPassed: !!body.task022ContinuityPassed,
        task023ContinuityPassed: !!body.task023ContinuityPassed,
        task024ContinuityPassed: !!body.task024ContinuityPassed,
        extraBlockers: [],
      },
    );

    res.json({ ok: true, decision, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DECISION_FAILED', 'Failed to evaluate readiness decision.', ['internal_error'], requestId);
  }
});

// POST /reports/generate
router.post('/reports/generate', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const ctx = validateTask025PilotReadinessContext({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      verifiedSchoolIdentity: true,
      requestId,
    });
    if (!ctx.valid) {
      safeErrorEnvelope(res, 400, ctx.code, ctx.safeMessage, ctx.reasonCodes, requestId);
      return;
    }

    const body = req.body || {};

    const report = await generateReadinessReport(
      {
        schoolId: ctx.data.schoolId,
        schoolVerified: true,
        scopeGateStatus: body.scopeGateStatus || 'unknown',
        cohortReadinessStatus: body.cohortReadinessStatus || 'unknown',
        teacherWorkflowStatus: body.teacherWorkflowStatus || 'unknown',
        adminAcceptanceStatus: body.adminAcceptanceStatus || 'unknown',
        parentCommunicationStatus: body.parentCommunicationStatus || 'unknown',
        safeguardingStatus: body.safeguardingStatus || 'unknown',
        supportOperationsStatus: body.supportOperationsStatus || 'unknown',
        monitoringGateStatus: body.monitoringGateStatus || 'unknown',
        pauseRollbackStatus: body.pauseRollbackStatus || 'unknown',
        dataPrivacyStatus: body.dataPrivacyStatus || 'unknown',
        overallDecision: body.overallDecision || 'not_ready',
        task026SafeToStart: !!body.task026SafeToStart,
        requiredActions: Array.isArray(body.requiredActions) ? body.requiredActions : [],
      },
      ctx.data.actorRole,
      requestId,
    );

    res.json({ ok: true, report, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_FAILED', 'Failed to generate readiness report.', ['internal_error'], requestId);
  }
});

// GET /diagnostics
router.get('/diagnostics', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'MISSING_SCHOOL_ID', 'School identity is required.', ['missing_school_id'], requestId);
      return;
    }

    const diagnostics = task025PilotReadinessRepository.getReadinessDiagnostics(schoolId);
    task025PilotReadinessRepository.writeAuditEvent(schoolId, getActorRole(req), 'diagnostics_viewed', 'Readiness diagnostics viewed.', requestId);
    res.json({ ok: true, diagnostics, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DIAGNOSTICS_FAILED', 'Failed to retrieve readiness diagnostics.', ['internal_error'], requestId);
  }
});

// GET /audit
router.get('/audit', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  if (!(await requireReadinessActor(req, res))) return;

  try {
    const schoolId = getSchoolId(req);
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

    const auditResult = await queryReadinessAudit({ schoolId, limit: limitParam });
    task025PilotReadinessRepository.writeAuditEvent(schoolId || 'unknown', getActorRole(req), 'audit_viewed', `Audit history viewed (${auditResult.totalCount} records).`, requestId);
    res.json({ ok: true, ...auditResult, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'AUDIT_FAILED', 'Failed to retrieve audit records.', ['internal_error'], requestId);
  }
});

export default router;
