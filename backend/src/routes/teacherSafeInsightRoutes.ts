import { Router, Request, Response } from 'express';
import { evaluateTeacherSafeAccessPolicy, evaluateSafeguardingAccessPolicy } from '../services/teacherSafeInsightAccessPolicy';
import { assertSafeTeacherInsightInput, rejectForbiddenTeacherSafeFields } from '../services/teacherSafeInsightPrivacyGuard';
import { buildSafeInsightResponse, buildSafeInsightErrorResponse, buildEmptyEvidenceResponse, buildInsufficientRealEvidenceResponse } from '../services/teacherSafeReportBuilder';
import { buildSafeResponse, buildSafeErrorResponse } from '../services/teacherSafeInsightResponseBuilder';
import { buildLearnerSafeSummary } from '../services/teacherSafeLearnerSummaryService';
import { buildClassSafeSummary } from '../services/teacherSafeClassSummaryService';
import { buildWeakTopicClusters } from '../services/teacherSafeWeakTopicClusterService';
import { buildSupportQueue } from '../services/teacherSafeSupportQueueService';
import { buildNextActionRecommendation, buildClassNextActions } from '../services/teacherSafeNextActionService';
import { buildDashboardEvidencePacket } from '../services/teacherSafeDashboardEvidenceService';
import { recordTeacherSafeAuditEvent } from '../services/teacherSafeReportAuditService';
import { readSafeEvidenceWithStatus } from '../services/teacherSafeInsightEvidenceReader';
import type { TeacherSafeInsightContext } from '../contracts/teacherSafeInsightContracts';

const router = Router();

function buildContext(req: Request): TeacherSafeInsightContext {
  return {
    schoolId: (req as any).user?.schoolId || ((req as any).schoolId || ''),
    teacherId: (req as any).user?.id || '',
    role: (req as any).user?.role || '',
    classId: req.query.classId as string || (req as any).user?.classId || undefined,
    studentId: req.params.studentId || undefined,
    subjectId: req.query.subjectId as string || undefined,
    topicId: req.query.topicId as string || undefined,
    skillId: req.query.skillId as string || undefined,
    requestId: (req as any).requestId || 'unknown',
  };
}

function safeError(res: Response, statusCode: number, response: ReturnType<typeof buildSafeInsightErrorResponse>): void {
  res.status(statusCode).json(response);
}

router.get('/student/:studentId/summary', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context, req.params.studentId);
    if (!scope.allowed) {
      await recordTeacherSafeAuditEvent(context.schoolId, context.teacherId, 'learner_summary', scope.decision, scope.reasonCodes, context.classId, req.params.studentId);
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const { isEmpty, isInsufficient } = readSafeEvidenceWithStatus({ schoolId: context.schoolId, studentId: req.params.studentId });
    if (isEmpty) {
      res.json(buildEmptyEvidenceResponse('learner_summary', 'learner'));
      return;
    }
    const summary = buildLearnerSafeSummary({ ...context, studentId: req.params.studentId });
    await recordTeacherSafeAuditEvent(context.schoolId, context.teacherId, 'learner_summary', 'allowed', [], context.classId, req.params.studentId);
    res.json(buildSafeResponse('learner_summary', 'learner', summary, summary.sourceTruthStatus, summary.confidenceBucket, summary.safeReasonCodes));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/class/:classId/summary', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context, undefined, req.params.classId);
    if (!scope.allowed) {
      await recordTeacherSafeAuditEvent(context.schoolId, context.teacherId, 'class_summary', scope.decision, scope.reasonCodes, req.params.classId);
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const { isEmpty } = readSafeEvidenceWithStatus({ schoolId: context.schoolId, classId: req.params.classId });
    if (isEmpty) {
      res.json(buildEmptyEvidenceResponse('class_summary', 'class'));
      return;
    }
    const summary = buildClassSafeSummary({ ...context, classId: req.params.classId }, ['student-1', 'student-2']);
    await recordTeacherSafeAuditEvent(context.schoolId, context.teacherId, 'class_summary', 'allowed', [], req.params.classId);
    res.json(buildSafeResponse('class_summary', 'class', summary, summary.sourceTruthStatus, summary.confidenceBucket, summary.safeReasonCodes));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/class/:classId/weak-topics', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context, undefined, req.params.classId);
    if (!scope.allowed) {
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const clusters = buildWeakTopicClusters({ schoolId: context.schoolId, classId: req.params.classId, subjectId: context.subjectId });
    const status = clusters.length > 0 ? 'ok' : 'empty';
    res.json(buildSafeInsightResponse('weak_topic_cluster', 'class', clusters, 'real', clusters.length > 0 ? 'medium' : 'not_enough_evidence', [], status));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/class/:classId/support-queue', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context, undefined, req.params.classId);
    if (!scope.allowed) {
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const queue = buildSupportQueue({ schoolId: context.schoolId, classId: req.params.classId });
    const status = queue.length > 0 ? 'ok' : 'empty';
    res.json(buildSafeInsightResponse('support_need_queue', 'class', queue, 'real', queue.length > 0 ? 'medium' : 'not_enough_evidence', [], status));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/class/:classId/revision-attention', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context, undefined, req.params.classId);
    if (!scope.allowed) {
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const evidence = readSafeEvidenceWithStatus({ schoolId: context.schoolId, classId: req.params.classId });
    const items: any[] = evidence.isEmpty ? [] : [{ classId: req.params.classId, itemCount: evidence.packet.evidenceCount, attention: 'review_revision_items' }];
    const status = items.length > 0 ? 'ok' : 'empty';
    res.json(buildSafeInsightResponse('revision_attention_queue', 'class', items, evidence.packet.sourceTruthStatus, evidence.packet.confidenceBucket, evidence.packet.safeReasonCodes, status));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/student/:studentId/next-action', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context, req.params.studentId);
    if (!scope.allowed) {
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const action = buildNextActionRecommendation({ ...context, studentId: req.params.studentId });
    res.json(buildSafeResponse('teacher_next_action', 'learner', action, action.sourceTruthStatus, action.confidenceBucket, action.safeReasonCodes));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/class/:classId/next-actions', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context, undefined, req.params.classId);
    if (!scope.allowed) {
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const actions = buildClassNextActions({ ...context, classId: req.params.classId });
    const status = actions.length > 0 ? 'ok' : 'empty';
    res.json(buildSafeInsightResponse('teacher_next_action', 'class', actions, 'real', status === 'ok' ? 'medium' : 'not_enough_evidence', [], status));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/dashboard/evidence', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context);
    if (!scope.allowed) {
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const packet = buildDashboardEvidencePacket(context);
    const status = packet.sourceTruthSummary.realCount > 0 ? 'ok' : 'empty';
    res.json(buildSafeInsightResponse('mastery_progress_summary', 'class', packet, packet.sourceTruthSummary.status, status === 'ok' ? 'medium' : 'not_enough_evidence', packet.safeReasonCodes, status));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/student/:studentId/learner-safe-progress', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context, req.params.studentId);
    if (!scope.allowed) {
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const summary = buildLearnerSafeSummary({ ...context, studentId: req.params.studentId });
    res.json(buildSafeResponse('learner_safe_progress', 'learner', summary, summary.sourceTruthStatus, summary.confidenceBucket, summary.safeReasonCodes));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/student/:studentId/deen-referral-summary', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = evaluateTeacherSafeAccessPolicy(context, req.params.studentId);
    if (!scope.allowed) {
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', scope.decision, scope.reasonCodes));
      return;
    }
    const summary = buildLearnerSafeSummary({ ...context, studentId: req.params.studentId });
    const deenInfo = {
      deenReferralCount: summary.safeReasonCodes.includes('deen_referral_created') ? 1 : 0,
      uncertaintyReasonCode: summary.safeReasonCodes.includes('deen_referral_created') ? 'deen_referral_created' : undefined,
      sourceGapReasonCode: summary.safeReasonCodes.includes('content_gap_no_curriculum_context') ? 'content_gap_no_curriculum_context' : undefined,
      teacherFollowUpRecommendation: summary.safeReasonCodes.includes('deen_referral_created') ? 'refer_deen_question' : undefined,
    };
    res.json(buildSafeResponse('deen_referral_summary', 'learner', deenInfo, summary.sourceTruthStatus, summary.confidenceBucket, summary.safeReasonCodes));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.get('/student/:studentId/safeguarding-safe-signal', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const safeguardingScope = evaluateSafeguardingAccessPolicy(context);
    if (!safeguardingScope.allowed) {
      safeError(res, 403, buildSafeInsightErrorResponse('blocked', safeguardingScope.decision, safeguardingScope.reasonCodes));
      return;
    }
    const signal = {
      studentId: req.params.studentId,
      signalType: 'safeguarding_safe_signal',
      safeSummary: 'No safeguarding signals detected in safe learning evidence.',
      safeReasonCodes: [] as string[],
      requiresAuthorizedFollowUp: false,
    };
    res.json(buildSafeResponse('safeguarding_safe_signal_summary', 'learner', signal, 'real', 'low', []));
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

router.post('/report/audit', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const { reportType, policyDecision, reasonCodes, classId, studentId } = req.body || {};
    const event = await recordTeacherSafeAuditEvent(
      context.schoolId,
      context.teacherId,
      reportType || 'learner_summary',
      policyDecision || 'allowed',
      reasonCodes || [],
      classId || context.classId,
      studentId || context.studentId,
    );
    res.json({ ok: true, event });
  } catch (error: any) {
    safeError(res, 500, buildSafeInsightErrorResponse('error', undefined, []));
  }
});

export default router;
