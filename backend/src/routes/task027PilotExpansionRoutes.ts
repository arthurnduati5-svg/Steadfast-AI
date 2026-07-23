import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireRole } from '../lib/rbac';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { generateExpansionEvidencePack } from '../services/task027PilotExpansionEvidencePackService';
import { assessExpansionRisk } from '../services/task027PilotExpansionRiskAssessmentService';
import { submitExpansionReview, checkRequiredReviews } from '../services/task027PilotExpansionReviewService';
import { decideExpansion } from '../services/task027PilotExpansionDecisionService';
import { applyCohortExpansion, rollbackCohortExpansion } from '../services/task027PilotExpansionCohortChangeService';
import { generateExpansionReport } from '../services/task027PilotExpansionReportService';
import { recordExpansionAuditEvent, listExpansionAuditEvents } from '../services/task027PilotExpansionAuditService';

const router = Router();

const adminGuard = [schoolAuthMiddleware, requireRole('admin')];
const internalGuard = [schoolAuthMiddleware, requireRole('admin', 'counselor')];
const teacherAdminGuard = [schoolAuthMiddleware, requireRole('admin')];
const studentGuard = [schoolAuthMiddleware, requireRole('student')];

function getActorRole(req: Request): string {
  return (req as any).user?.role || 'anonymous';
}

function getActorId(req: Request): string {
  return (req as any).user?.id || 'anonymous';
}

function getSchoolId(req: Request): string | undefined {
  return (req as any).schoolId || (req as any).verifiedSchoolIdentity?.schoolId;
}

function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

function safeDeniedResponse(res: Response, requestId: string): void {
  res.status(403).json({
    ok: false,
    error: { code: 'PILOT_EXPANSION_ACCESS_DENIED', safeMessage: 'This pilot expansion action is not available for this account, role, school, or review state.', reasonCodes: ['access_denied'] },
    requestId,
  });
}

function safeErrorEnvelope(res: Response, status: number, code: string, safeMessage: string, reasonCodes: string[], requestId: string): void {
  res.status(status).json({ ok: false, error: { code, safeMessage, reasonCodes }, requestId });
}

// ── Expansion Status ──

router.get('/pilot/expansion/status', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    const pilotProgramId = req.query.pilotProgramId as string;
    const proposals = schoolId
      ? await task027PilotExpansionRepository.listProposals(schoolId, pilotProgramId)
      : await task027PilotExpansionRepository.listProposals();

    const counts: Record<string, number> = {};
    for (const p of proposals as any[]) {
      counts[p.status] = (counts[p.status] || 0) + 1;
    }

    res.json({ ok: true, totalProposals: proposals.length, statusCounts: counts, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EXPANSION_STATUS_FAILED', 'Failed to get expansion status.', ['internal_error'], requestId);
  }
});

// ── Create Proposal ──

router.post('/pilot/expansion/proposals', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { pilotProgramId, proposalName, safeSummary, requestedStudentIncrease, requestedTeacherIncrease, requestedClassIds, requestedSubjectIds, requestedCurriculumScopes, requestedYearGroups } = req.body;
    if (!pilotProgramId || !proposalName) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'pilotProgramId and proposalName are required.', ['missing_required_fields'], requestId);
      return;
    }

    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId,
      schoolId,
      status: 'draft',
      proposalName,
      safeSummary: safeSummary || `Expansion proposal: ${proposalName}`,
      requestedStudentIncrease: requestedStudentIncrease ?? 0,
      requestedTeacherIncrease: requestedTeacherIncrease ?? 0,
      requestedClassIds: requestedClassIds ?? [],
      requestedSubjectIds: requestedSubjectIds ?? [],
      requestedCurriculumScopes: requestedCurriculumScopes ?? [],
      requestedYearGroups: requestedYearGroups ?? [],
      createdByRole: getActorRole(req),
      createdByActorIdHash: getActorId(req),
    });

    await recordExpansionAuditEvent({
      expansionProposalId: (proposal as any).id,
      pilotProgramId,
      schoolId,
      actorRole: getActorRole(req),
      actorIdHash: getActorId(req),
      action: 'proposal_created',
      safeSummary: `Expansion proposal ${proposalName} created.`,
      requestId,
    });

    res.status(201).json({ ok: true, proposalId: (proposal as any).id, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PROPOSAL_CREATE_FAILED', 'Failed to create expansion proposal.', ['internal_error'], requestId);
  }
});

// ── Get Proposal ──

router.get('/pilot/expansion/proposals/:proposalId', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const proposal = await task027PilotExpansionRepository.getProposal(req.params.proposalId);
    if (!proposal) {
      safeErrorEnvelope(res, 404, 'PROPOSAL_NOT_FOUND', 'Expansion proposal not found.', ['not_found'], requestId);
      return;
    }
    res.json({ ok: true, proposal, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PROPOSAL_FETCH_FAILED', 'Failed to get proposal.', ['internal_error'], requestId);
  }
});

// ── Generate Evidence Pack ──

router.post('/pilot/expansion/proposals/:proposalId/evidence-pack', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await generateExpansionEvidencePack(req.params.proposalId);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'EVIDENCE_PACK_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, evidencePackId: result.evidencePackId, blockingIssues: result.blockingIssues, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EVIDENCE_PACK_FAILED', 'Failed to generate evidence pack.', ['internal_error'], requestId);
  }
});

// ── Risk Assessment ──

router.post('/pilot/expansion/proposals/:proposalId/risk-assessment', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await assessExpansionRisk(req.params.proposalId);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'RISK_ASSESSMENT_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, riskAssessmentId: result.riskAssessmentId, overallRiskLevel: result.overallRiskLevel, blockingIssues: result.blockingIssues, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RISK_ASSESSMENT_FAILED', 'Failed to assess risk.', ['internal_error'], requestId);
  }
});

// ── Submit Review ──

router.post('/pilot/expansion/proposals/:proposalId/reviews', ...teacherAdminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { reviewType, safeSummary, blockingIssues, warnings, evidenceRefs } = req.body;
    if (!reviewType || !safeSummary) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'reviewType and safeSummary are required.', ['missing_required_fields'], requestId);
      return;
    }

    const result = await submitExpansionReview({
      expansionProposalId: req.params.proposalId,
      schoolId,
      reviewType,
      reviewerRole: getActorRole(req),
      reviewerActorIdHash: getActorId(req),
      safeSummary,
      blockingIssues,
      warnings,
      evidenceRefs,
    });

    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'REVIEW_SUBMIT_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }

    res.status(201).json({ ok: true, reviewId: result.reviewId, reviewStatus: result.reviewStatus, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REVIEW_FAILED', 'Failed to submit review.', ['internal_error'], requestId);
  }
});

// ── List Reviews ──

router.get('/pilot/expansion/proposals/:proposalId/reviews', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const reviews = await task027PilotExpansionRepository.listReviews(req.params.proposalId);
    res.json({ ok: true, count: reviews.length, reviews, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REVIEWS_FETCH_FAILED', 'Failed to list reviews.', ['internal_error'], requestId);
  }
});

// ── Expansion Decision ──

router.post('/pilot/expansion/proposals/:proposalId/decision', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await decideExpansion(req.params.proposalId, getActorRole(req), getActorId(req));
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'DECISION_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }

    res.status(201).json({
      ok: true,
      approvalId: result.approvalId,
      decision: result.decision,
      approvalStatus: result.approvalStatus,
      safeToExpand: result.safeToExpand,
      safeToStartTask028: result.safeToStartTask028,
      blockingIssues: result.blockingIssues,
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DECISION_FAILED', 'Failed to make expansion decision.', ['internal_error'], requestId);
  }
});

// ── Apply Cohort Change ──

router.post('/pilot/expansion/proposals/:proposalId/apply', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await applyCohortExpansion(req.params.proposalId, getActorRole(req), getActorId(req));
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'COHORT_APPLY_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, cohortChangeId: result.cohortChangeId, addedStudentCount: result.addedStudentCount, addedTeacherCount: result.addedTeacherCount, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COHORT_APPLY_FAILED', 'Failed to apply cohort change.', ['internal_error'], requestId);
  }
});

// ── Rollback Cohort Change ──

router.post('/pilot/expansion/proposals/:proposalId/rollback', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { cohortChangeId } = req.body;
    if (!cohortChangeId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'cohortChangeId required.', ['missing_required_fields'], requestId);
      return;
    }
    const result = await rollbackCohortExpansion(cohortChangeId, getActorRole(req), getActorId(req));
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'ROLLBACK_FAILED', result.safeMessage, ['rollback_failed'], requestId);
      return;
    }
    res.json({ ok: true, message: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ROLLBACK_FAILED', 'Failed to rollback cohort change.', ['internal_error'], requestId);
  }
});

// ── Reports ──

router.get('/pilot/expansion/reports/task-027', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    res.json({ ok: true, message: 'Generate report via verify-task027.ps1 or gen-task027-report.cjs', requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_FETCH_FAILED', 'Failed to fetch report.', ['internal_error'], requestId);
  }
});

router.post('/pilot/expansion/reports/task-027/generate', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await generateExpansionReport('027');
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'REPORT_GENERATION_FAILED', result.safeSummary, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, reportId: result.reportId, safeToStartTask028: result.safeToStartTask028, safeSummary: result.safeSummary, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_GENERATION_FAILED', 'Failed to generate report.', ['internal_error'], requestId);
  }
});

export default router;
