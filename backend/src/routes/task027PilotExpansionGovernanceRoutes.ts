import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { requireRole } from '../lib/rbac';

import { checkTask026Dependency } from '../services/task027Task026ExecutionDependencyService';
import { checkTask025Dependency } from '../services/task027Task025ReadinessDependencyService';
import { checkTask024Dependency } from '../services/task027Task024OperationsDependencyService';
import { checkGovernanceContinuity } from '../services/task027GovernanceContinuityService';
import { loadPilotExecutionEvidence } from '../services/task027PilotExecutionEvidenceLoaderService';
import { reviewLearningQuality } from '../services/task027LearningQualityReviewService';
import { createExpansionProposal, getExpansionProposal, listExpansionProposals } from '../services/task027CohortExpansionProposalService';
import { checkExpansionEligibility } from '../services/task027CohortExpansionEligibilityService';
import { assessExpansionRisk } from '../services/task027ExpansionRiskAssessmentService';
import { submitTeacherReview } from '../services/task027TeacherReviewWorkflowService';
import { approveExpansion } from '../services/task027SchoolAdminApprovalService';
import { checkParentLearnerFeedbackReadiness } from '../services/task027ParentLearnerFeedbackReadinessService';
import { reviewSafeguarding } from '../services/task027SafeguardingReviewService';
import { reviewDeenContent } from '../services/task027DeenContentGovernanceReviewService';
import { reviewPrivacy } from '../services/task027PrivacyReviewService';
import { reviewSocraticIntegrity } from '../services/task027SocraticIntegrityReviewService';
import { reviewAcademicIntegrity } from '../services/task027AcademicIntegrityReviewService';
import { reviewOperationsHealthBudget } from '../services/task027OperationsHealthBudgetReviewService';
import { checkPauseRollbackReadiness } from '../services/task027PauseRollbackReadinessReviewService';
import { generateEvidencePack } from '../services/task027ExpansionEvidencePackService';
import { makeGovernanceDecision } from '../services/task027GovernanceDecisionService';
import { getGovernanceDiagnostics } from '../services/task027GovernanceDiagnosticsService';
import { recordAuditEvent, listAuditEvents } from '../services/task027GovernanceAuditService';
import { generateGovernanceReport } from '../services/task027ExpansionGovernanceReportService';

const router = Router();

const governanceAdminRoles = [
  'school_admin',
  'system_admin',
  'internal_operator',
  'authorized_pilot_coordinator',
  'authorized_expansion_reviewer',
];

const governanceTeacherRoles = [
  'teacher_assigned_to_pilot',
  'school_admin',
  'system_admin',
  'internal_operator',
  'authorized_pilot_coordinator',
  'authorized_expansion_reviewer',
];

const governanceSafeguardingRoles = [
  'safeguarding_reviewer',
  'school_admin',
  'system_admin',
  'internal_operator',
  'authorized_pilot_coordinator',
  'authorized_expansion_reviewer',
];

const governanceContentRoles = [
  'content_governance_reviewer',
  'deen_source_reviewer',
  'school_admin',
  'system_admin',
  'internal_operator',
  'authorized_pilot_coordinator',
  'authorized_expansion_reviewer',
];

const governanceOperationsRoles = [
  'operations_reviewer',
  'school_admin',
  'system_admin',
  'internal_operator',
  'authorized_pilot_coordinator',
  'authorized_expansion_reviewer',
];

function authorizeByRole(role: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(role);
}

function getActorId(req: Request): string {
  return (req as any).user?.id || 'anonymous';
}

function getActorRole(req: Request): string {
  return (req as any).user?.role || 'anonymous';
}

function getSchoolId(req: Request): string | undefined {
  return (req as any).schoolId || (req as any).verifiedSchoolIdentity?.schoolId;
}

function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

function safeErrorEnvelope(res: Response, status: number, code: string, message: string, reasonCodes: string[], requestId: string): void {
  res.status(status).json({ ok: false, error: { code, safeMessage: message, reasonCodes }, requestId });
}

function requireGovernanceRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    const role = getActorRole(req);
    if (authorizeByRole(role, allowedRoles)) return next();
    res.status(403).json({
      ok: false,
      error: { code: 'GOVERNANCE_ACCESS_DENIED', safeMessage: 'You do not have the required governance role for this action.', reasonCodes: ['access_denied'] },
      requestId: getRequestId(req),
    });
  };
}

const governanceGuard = [
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  requireGovernanceRole(governanceAdminRoles),
];

const teacherGuard = [
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  requireGovernanceRole(governanceTeacherRoles),
];

const safeguardingGuard = [
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  requireGovernanceRole(governanceSafeguardingRoles),
];

const contentGuard = [
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  requireGovernanceRole(governanceContentRoles),
];

const operationsGuard = [
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  requireGovernanceRole(governanceOperationsRoles),
];

// ── Health ──

router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, status: 'healthy', service: 'task027-pilot-expansion-governance' });
});

// ── Preflight ──

router.post('/preflight', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req) || 'unknown';
    const task024Result = await checkTask024Dependency({ schoolId });
    const task025Result = await checkTask025Dependency({ schoolId });
    const task026Input = {
      schoolId,
      actorRole: getActorRole(req) as any,
      executionRunId: req.body.executionRunId || '',
      commitHash: req.body.commitHash || '',
    };
    const task026Result = await checkTask026Dependency(task026Input);
    const governanceResult = await checkGovernanceContinuity({ schoolId });

    const allOk = task024Result.ok && task025Result.ok && task026Result.ok && governanceResult.ok;
    const results = {
      task024: task024Result,
      task025: task025Result,
      task026: task026Result,
      governance: governanceResult,
    };

    res.json({ ok: allOk, results, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PREFLIGHT_FAILED', 'Preflight dependency checks failed.', ['internal_error'], requestId);
  }
});

// ── Evidence Load ──

router.post('/evidence/load', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await loadPilotExecutionEvidence(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'EVIDENCE_LOAD_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, evidence: result.evidence, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EVIDENCE_LOAD_FAILED', 'Failed to load pilot execution evidence.', ['internal_error'], requestId);
  }
});

// ── Learning Quality Review ──

router.post('/learning-quality/review', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await reviewLearningQuality(req.body);
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'LEARNING_QUALITY_REVIEW_FAILED', 'Failed to review learning quality.', ['internal_error'], requestId);
  }
});

// ── Create Proposal ──

router.post('/cohort-proposals', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await createExpansionProposal(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'PROPOSAL_CREATE_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }

    const schoolId = getSchoolId(req);
    if (schoolId) {
      await recordAuditEvent({
        schoolId,
        actorRole: getActorRole(req),
        actorId: getActorId(req),
        action: 'proposal_created',
        safeSummary: 'Expansion proposal created.',
        requestId,
      } as any);
    }

    res.status(201).json({ ok: true, proposal: result.proposal, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PROPOSAL_CREATE_FAILED', 'Failed to create expansion proposal.', ['internal_error'], requestId);
  }
});

// ── List Proposals ──

router.get('/cohort-proposals', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }
    const proposals = await listExpansionProposals(schoolId);
    res.json({ ok: true, count: proposals.length, proposals, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PROPOSALS_LIST_FAILED', 'Failed to list proposals.', ['internal_error'], requestId);
  }
});

// ── Get Proposal ──

router.get('/cohort-proposals/:proposalId', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const proposal = await getExpansionProposal(req.params.proposalId);
    if (!proposal) {
      safeErrorEnvelope(res, 404, 'PROPOSAL_NOT_FOUND', 'Expansion proposal not found.', ['not_found'], requestId);
      return;
    }
    res.json({ ok: true, proposal, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PROPOSAL_FETCH_FAILED', 'Failed to get proposal.', ['internal_error'], requestId);
  }
});

// ── Eligibility ──

router.post('/cohort-proposals/:proposalId/eligibility', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await checkExpansionEligibility(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'ELIGIBILITY_CHECK_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ELIGIBILITY_CHECK_FAILED', 'Failed to check eligibility.', ['internal_error'], requestId);
  }
});

// ── Risk Assessment ──

router.post('/cohort-proposals/:proposalId/risk-assessment', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await assessExpansionRisk(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'RISK_ASSESSMENT_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RISK_ASSESSMENT_FAILED', 'Failed to assess risk.', ['internal_error'], requestId);
  }
});

// ── Teacher Review ──

router.post('/cohort-proposals/:proposalId/teacher-review', ...teacherGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await submitTeacherReview(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'TEACHER_REVIEW_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'TEACHER_REVIEW_FAILED', 'Failed to submit teacher review.', ['internal_error'], requestId);
  }
});

// ── Admin Approval ──

router.post('/cohort-proposals/:proposalId/admin-approval', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await approveExpansion(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'ADMIN_APPROVAL_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ADMIN_APPROVAL_FAILED', 'Failed to approve expansion.', ['internal_error'], requestId);
  }
});

// ── Parent/Learner Feedback Readiness ──

router.post('/cohort-proposals/:proposalId/parent-learner-feedback-readiness', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await checkParentLearnerFeedbackReadiness(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'FEEDBACK_READINESS_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'FEEDBACK_READINESS_FAILED', 'Failed to check parent/learner feedback readiness.', ['internal_error'], requestId);
  }
});

// ── Safeguarding Review ──

router.post('/cohort-proposals/:proposalId/safeguarding-review', ...safeguardingGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await reviewSafeguarding(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'SAFEGUARDING_REVIEW_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'SAFEGUARDING_REVIEW_FAILED', 'Failed to submit safeguarding review.', ['internal_error'], requestId);
  }
});

// ── Deen/Content Review ──

router.post('/cohort-proposals/:proposalId/deen-content-review', ...contentGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await reviewDeenContent(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'DEEN_CONTENT_REVIEW_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DEEN_CONTENT_REVIEW_FAILED', 'Failed to submit Deen/content review.', ['internal_error'], requestId);
  }
});

// ── Privacy Review ──

router.post('/cohort-proposals/:proposalId/privacy-review', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await reviewPrivacy(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'PRIVACY_REVIEW_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PRIVACY_REVIEW_FAILED', 'Failed to submit privacy review.', ['internal_error'], requestId);
  }
});

// ── Socratic Integrity Review ──

router.post('/cohort-proposals/:proposalId/socratic-integrity-review', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await reviewSocraticIntegrity(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'SOCRATIC_INTEGRITY_REVIEW_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'SOCRATIC_INTEGRITY_REVIEW_FAILED', 'Failed to submit Socratic integrity review.', ['internal_error'], requestId);
  }
});

// ── Academic Integrity Review ──

router.post('/cohort-proposals/:proposalId/academic-integrity-review', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await reviewAcademicIntegrity(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'ACADEMIC_INTEGRITY_REVIEW_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ACADEMIC_INTEGRITY_REVIEW_FAILED', 'Failed to submit academic integrity review.', ['internal_error'], requestId);
  }
});

// ── Operations Health Budget Review ──

router.post('/cohort-proposals/:proposalId/operations-health-budget', ...operationsGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await reviewOperationsHealthBudget(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'OPERATIONS_HEALTH_BUDGET_REVIEW_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'OPERATIONS_HEALTH_BUDGET_REVIEW_FAILED', 'Failed to submit operations health budget review.', ['internal_error'], requestId);
  }
});

// ── Pause/Rollback Readiness ──

router.post('/cohort-proposals/:proposalId/pause-rollback-readiness', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await checkPauseRollbackReadiness(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'PAUSE_ROLLBACK_READINESS_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PAUSE_ROLLBACK_READINESS_FAILED', 'Failed to check pause/rollback readiness.', ['internal_error'], requestId);
  }
});

// ── Evidence Pack ──

router.post('/cohort-proposals/:proposalId/evidence-pack', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await generateEvidencePack(req.body);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'EVIDENCE_PACK_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, evidencePack: result.evidencePack, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EVIDENCE_PACK_FAILED', 'Failed to generate evidence pack.', ['internal_error'], requestId);
  }
});

// ── Decision ──

router.post('/cohort-proposals/:proposalId/decision', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const decision = await makeGovernanceDecision(req.body);
    res.status(201).json({ ok: true, decision, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'GOVERNANCE_DECISION_FAILED', 'Failed to make governance decision.', ['internal_error'], requestId);
  }
});

// ── Diagnostics ──

router.get('/diagnostics', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }
    const diagnostics = await getGovernanceDiagnostics(schoolId);
    res.json({ ok: true, diagnostics, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DIAGNOSTICS_FAILED', 'Failed to get governance diagnostics.', ['internal_error'], requestId);
  }
});

// ── Audit ──

router.get('/audit', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const events = await listAuditEvents(schoolId, limit);
    res.json({ ok: true, count: events.length, events, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'AUDIT_LIST_FAILED', 'Failed to list audit events.', ['internal_error'], requestId);
  }
});

// ── Report ──

router.get('/report', ...governanceGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    const pilotRunId = req.query.pilotRunId as string;
    if (!schoolId || !pilotRunId) {
      safeErrorEnvelope(res, 400, 'MISSING_PARAMS', 'schoolId and pilotRunId are required for report.', ['missing_params'], requestId);
      return;
    }
    const report = await generateGovernanceReport(schoolId, pilotRunId);
    res.json({ ok: true, report, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_FAILED', 'Failed to generate governance report.', ['internal_error'], requestId);
  }
});

export default router;
