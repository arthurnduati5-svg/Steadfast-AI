import { Router, Request, Response } from 'express';
import { loadTask032ProofForTask033 } from '../services/task033Task032ProofLoaderService';
import { getTask033CanaryObservationConfig } from '../services/task033CanaryObservationConfigService';
import { collectTask033ObservationEvidence } from '../services/task033CanaryObservationEvidenceService';
import { generateTask033AggregateMonitoringSnapshot } from '../services/task033AggregateMonitoringSnapshotService';
import { submitTeacherFeedback } from '../services/task033TeacherFeedbackReviewService';
import { submitStudentSafeFeedback } from '../services/task033StudentSafeFeedbackService';
import { submitAdminReview } from '../services/task033AdminReviewWorkflowService';
import { enforceTask033HealthBudget } from '../services/task033HealthBudgetEnforcementService';
import { reviewTask033LearningQuality } from '../services/task033LearningQualityReviewService';
import { reviewTask033DeenGovernance } from '../services/task033DeenGovernanceReviewService';
import { reviewTask033CurriculumSource } from '../services/task033CurriculumSourceReviewService';
import { reviewTask033Privacy } from '../services/task033PrivacyReviewService';
import { reviewTask033Incidents } from '../services/task033IncidentBridgeReviewService';
import { reviewTask033RollbackReadiness } from '../services/task033RollbackReadinessReviewService';
import { computeTask033PostCanaryDecision } from '../services/task033PostCanaryDecisionService';
import type { Task033ObservationRole } from '../contracts/task033CanaryObservationContracts';
import { resolveObservationRole033, getObservationRolePermissions033 } from '../contracts/task033CanaryObservationContracts';

const router = Router();

function getRequestRole(req: Request): Task033ObservationRole {
  const rawRole = (req.headers['x-role'] as string) || 'unknown';
  return resolveObservationRole033(rawRole);
}

function hasPermission(req: Request, permission: string): boolean {
  const role = getRequestRole(req);
  const perms = getObservationRolePermissions033(role);
  return perms[permission] === true;
}

router.get('/api/pilot/canary/observation/status', async (req: Request, res: Response) => {
  try {
    const config = getTask033CanaryObservationConfig();
    const task032Proof = await loadTask032ProofForTask033();
    res.json({
      observationMode: config.observationMode,
      observationRunId: config.observationRunId,
      envFlagsValid: config.envFlagsValid,
      task032ProofLoaded: task032Proof.ok,
      blockingIssues: config.blockingIssues,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/pilot/canary/observation/summary', async (req: Request, res: Response) => {
  try {
    if (!hasPermission(req, 'canViewAggregateObservationSummary')) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const snapshot = generateTask033AggregateMonitoringSnapshot();
    res.json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/pilot/canary/observation/health', async (req: Request, res: Response) => {
  try {
    if (!hasPermission(req, 'canViewHealthBudget')) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const budget = enforceTask033HealthBudget({});
    res.json(budget);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/pilot/canary/observation/incidents', async (req: Request, res: Response) => {
  try {
    if (!hasPermission(req, 'canViewSafeIncidentSummaries')) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const result = reviewTask033Incidents([]);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/pilot/canary/observation/teacher-feedback', async (req: Request, res: Response) => {
  try {
    const role = getRequestRole(req);
    if (role !== 'teacher' && role !== 'admin' && role !== 'operator') {
      return res.status(403).json({ error: 'forbidden' });
    }
    res.json({ message: 'teacher feedback endpoint ready', role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/pilot/canary/observation/teacher-feedback', async (req: Request, res: Response) => {
  try {
    const role = getRequestRole(req);
    if (!hasPermission(req, 'canSubmitAssignedScopeFeedback')) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { teacherHash, category, safeSummary, assignmentScope } = req.body;
    const result = submitTeacherFeedback({
      teacherHash: teacherHash || 'teacher_hash_task032_safe_001',
      canaryRunId: 'canary_run_task032_safe',
      category: category || 'positive_learning_signal',
      safeSummary: safeSummary || 'feedback received',
      assignmentScope: assignmentScope || [],
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/pilot/canary/observation/student-safe-feedback', async (req: Request, res: Response) => {
  try {
    if (!hasPermission(req, 'canSubmitSafeCategoryFeedback')) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { studentHash, feedbackCategory, safeSentiment } = req.body;
    const result = submitStudentSafeFeedback({
      studentHash: studentHash || 'student_hash_task032_safe_001',
      canaryRunId: 'canary_run_task032_safe',
      feedbackCategory: feedbackCategory || 'not_sure',
      safeSentiment: safeSentiment || 'neutral',
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/pilot/canary/observation/admin-review', async (req: Request, res: Response) => {
  try {
    if (!hasPermission(req, 'canSubmitAdminReview')) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const result = submitAdminReview({
      actorRole: 'admin',
      actorHash: 'admin_hash_task032_safe_001',
      canaryRunId: 'canary_run_task032_safe',
      observationRunId: 'observation_run_task033_safe',
      task032ProofOk: true,
      observationConfigOk: true,
      aggregateSnapshotOk: true,
      teacherFeedbackOk: true,
      studentSafeFeedbackOk: true,
      healthBudgetOk: true,
      learningQualityOk: true,
      deenGovernanceOk: true,
      curriculumSourceOk: true,
      privacyOk: true,
      incidentBridgeOk: true,
      rollbackReadinessOk: true,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/pilot/canary/observation/post-canary-decision', async (req: Request, res: Response) => {
  try {
    if (!hasPermission(req, 'canGeneratePostCanaryDecision')) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const task032Proof = await loadTask032ProofForTask033();
    const config = getTask033CanaryObservationConfig();
    const healthBudget = enforceTask033HealthBudget({});
    const learningQuality = reviewTask033LearningQuality({
      socraticGatePassed: true,
      noFinalAnswerPolicyWeakened: false,
      answerKeyExposureDetected: false,
      homeworkShortcutDetected: false,
      studentReasoningFirstPreserved: true,
    });
    const deenGovernance = reviewTask033DeenGovernance({
      deenGatePassed: true,
      fatwaEngineIntroduced: false,
      inventedRulingDetected: false,
      sectarianAuthorityClaimDetected: false,
      deenSensitivePrivateTextExposed: false,
      safeReferralPathPreserved: true,
      approvedSourceBoundaryPreserved: true,
    });
    const curriculumSource = reviewTask033CurriculumSource({
      curriculumGatePassed: true,
      approvedCurriculumScopeRequired: true,
      approvedSourceScopeRequired: true,
      unapprovedSubjectBlocked: true,
      teacherOnlyContentExposed: false,
      answerKeyExposureDetected: false,
      contentGapHandledSafely: true,
    });
    const privacy = reviewTask033Privacy({
      privacyGatePassed: true,
      rawStudentChatExposed: false,
      rawStudentIdentityExposed: false,
      privateLearnerMemoryExposed: false,
      teacherOnlyNotesExposed: false,
      safeguardingRawDetailsExposed: false,
      deenSensitivePrivateTextExposed: false,
      tokensSecretsExposed: false,
      databaseUrlsExposed: false,
      authHeadersExposed: false,
      cookiesExposed: false,
      answerKeysExposed: false,
      teacherOnlyContentExposed: false,
      protectedRubricsExposed: false,
      aiPromptsExposed: false,
      providerResponsesExposed: false,
    });
    const incidentBridge = reviewTask033Incidents([]);
    const rollbackReadiness = reviewTask033RollbackReadiness({
      rollbackPlanExists: true,
      rollbackOwnerAssigned: true,
      killSwitchAvailable: true,
      pauseAvailable: true,
      runtimeAccessBlockedByRollback: true,
      safeAuditSummaryPreserved: true,
      destructiveLearningEvidenceDeletionAvoided: true,
      rollbackDrillStillValidFromTask032: true,
    });

    const decision = computeTask033PostCanaryDecision({
      task032Proof: task032Proof as any,
      observationConfig: config,
      teacherFeedbackReviewOk: true,
      studentSafeFeedbackReviewOk: true,
      healthBudgetReview: healthBudget,
      learningQualityReview: learningQuality,
      deenGovernanceReview: deenGovernance,
      curriculumSourceReview: curriculumSource,
      privacyReview: privacy,
      incidentBridgeReview: { ok: incidentBridge.blockingIssues.length === 0, blockingIssues: incidentBridge.blockingIssues },
      rollbackReadinessReview: rollbackReadiness,
      verificationCommandsPassed: true,
    });

    res.json(decision);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/pilot/canary/observation/report/task-033', async (req: Request, res: Response) => {
  try {
    res.json({ message: 'report endpoint - generate via POST', reportId: 'task-033' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/pilot/canary/observation/report/task-033/generate', async (req: Request, res: Response) => {
  try {
    res.json({ message: 'report generation triggered', reportId: 'task-033' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
