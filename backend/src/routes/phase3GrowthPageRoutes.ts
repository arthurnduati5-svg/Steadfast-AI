import { Router, Request, Response } from 'express';
import { validateGrowthPageLearnerQuery, validateGrowthPageTeacherQuery } from '../lib/phase3GrowthPageValidation';
import { phase3GrowthPageLearnerResponseService } from '../services/phase3GrowthPageLearnerResponseService';
import { phase3GrowthPageTeacherOverviewService } from '../services/phase3GrowthPageTeacherOverviewService';
import { phase3GrowthPageDueNowService } from '../services/phase3GrowthPageDueNowService';
import { phase3WeakTopicLaneService } from '../services/phase3WeakTopicLaneService';
import { phase3MistakeJournalReadModelService } from '../services/phase3MistakeJournalReadModelService';
import { phase3WhatHelpsMeLearnBestService } from '../services/phase3WhatHelpsMeLearnBestService';
import { phase3GrowthPageAuditService } from '../services/phase3GrowthPageAuditService';
import { phase3GrowthPageReadModelService } from '../services/phase3GrowthPageReadModelService';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';

const router = Router();

// All routes in this file use schoolAuthMiddleware and requireVerifiedSchoolContext
// mounted at /api/phase3/growth-page in index.ts

function getActorId(req: Request): string {
  return (req as any).user?.id || (req as any).schoolContext?.userId || 'unknown';
}

function getActorRole(req: Request): string {
  return (req as any).user?.role || (req as any).schoolContext?.role || 'unknown';
}

function getSchoolId(req: Request): string {
  return (req as any).schoolContext?.schoolId || (req as any).user?.schoolId || '';
}

function getStudentId(req: Request): string {
  return (req as any).schoolContext?.studentId || (req as any).user?.studentId || (req as any).user?.id || '';
}

function getTeacherId(req: Request): string {
  return (req as any).user?.id || '';
}

// ─── Learner routes ───────────────────────────────────────────

router.get('/learner', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getStudentId(req);
    if (!schoolId || !studentId) {
      res.status(400).json({ message: 'Learner identity could not be resolved.' });
      return;
    }
    const query = validateGrowthPageLearnerQuery({ schoolId, studentId });
    const view = phase3GrowthPageLearnerResponseService.buildLearnerGrowthPageView(query.schoolId, query.studentId);

    phase3GrowthPageAuditService.recordGrowthPageViewed(
      query.schoolId, getActorId(req), getActorRole(req), query.studentId
    );

    res.json(view);
  } catch (err: any) {
    const status = err.name === 'Phase3GrowthPageValidationError' ? 400 : 500;
    res.status(status).json({ message: err.safeMessage || 'An unexpected error occurred.' });
  }
});

router.get('/learner/due-now', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getStudentId(req);
    if (!schoolId || !studentId) {
      res.status(400).json({ message: 'Learner identity could not be resolved.' });
      return;
    }
    const page = phase3GrowthPageReadModelService.getLearnerGrowthPage(schoolId, studentId);
    res.json({ dueNow: page.dueNow, payloadSource: page.payloadSource });
  } catch (err: any) {
    const status = err.name === 'Phase3GrowthPageAccessDenied' ? 403 : 500;
    res.status(status).json({ message: err.safeMessage || 'An unexpected error occurred.' });
  }
});

router.post('/learner/due-now/:dueNowItemId/complete', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const { dueNowItemId } = req.params;
    if (!schoolId || !dueNowItemId) {
      res.status(400).json({ message: 'Missing required information.' });
      return;
    }
    const studentId = getStudentId(req);
    const ownsItem = phase3GrowthPageDueNowService.getDueNowItemsForLearner(schoolId, studentId)
      .some(item => item.dueNowItemId === dueNowItemId);
    if (!ownsItem) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    const completed = phase3GrowthPageDueNowService.markDueNowCompleted(schoolId, dueNowItemId);
    if (!completed) {
      res.status(404).json({ message: 'Due now item not found.' });
      return;
    }

    phase3GrowthPageAuditService.recordDueNowItemCompleted(
      schoolId, getActorId(req), getActorRole(req), studentId, dueNowItemId
    );

    res.json({ completed: true, dueNowItem: completed });
  } catch (err: any) {
    const status = err.name === 'Phase3GrowthPageAccessDenied' ? 403 : 500;
    res.status(status).json({ message: err.safeMessage || 'An unexpected error occurred.' });
  }
});

router.get('/learner/weak-topic-lanes', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getStudentId(req);
    if (!schoolId || !studentId) {
      res.status(400).json({ message: 'Learner identity could not be resolved.' });
      return;
    }
    const lanes = phase3WeakTopicLaneService.detectWeakTopicLanes(schoolId, studentId);
    const ranked = phase3WeakTopicLaneService.rankWeakTopicLanes(lanes);
    const safeLanes = ranked.map(l => ({
      ...l,
      safeSummary: phase3WeakTopicLaneService.buildWeakTopicLaneLearnerMessage(l),
    }));
    res.json({ weakTopicLanes: safeLanes });
  } catch (err: any) {
    const status = err.name === 'Phase3GrowthPageValidationError' ? 400 : err.name === 'Phase3GrowthPageAccessDenied' ? 403 : 500;
    res.status(status).json({ message: err.safeMessage || 'An unexpected error occurred.' });
  }
});

router.get('/learner/mistake-journal', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getStudentId(req);
    if (!schoolId || !studentId) {
      res.status(400).json({ message: 'Learner identity could not be resolved.' });
      return;
    }
    const journal = phase3MistakeJournalReadModelService.buildMistakeJournalReadModel(schoolId, studentId);
    res.json(journal);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/learner/what-helps-me-learn-best', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getStudentId(req);
    if (!schoolId || !studentId) {
      res.status(400).json({ message: 'Learner identity could not be resolved.' });
      return;
    }
    const profile = phase3WhatHelpsMeLearnBestService.buildWhatHelpsMeLearnBestProfile(schoolId, studentId);
    if (!profile) {
      res.json({ message: 'Learning pattern data is still being collected.', profile: null });
      return;
    }
    res.json({ profile });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/learner/cards/:cardId', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getStudentId(req);
    if (!schoolId || !studentId) {
      res.status(400).json({ message: 'Learner identity could not be resolved.' });
      return;
    }
    const page = phase3GrowthPageReadModelService.getLearnerGrowthPage(schoolId, studentId);
    const card = page.cards.find(c => c.cardId === req.params.cardId);
    if (!card) {
      res.status(404).json({ message: 'Card not found.' });
      return;
    }
    res.json({ card });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

// ─── Teacher/admin routes ───────────────────────────────────────

router.get('/teacher/overview', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getTeacherId(req);
    const role = getActorRole(req);

    if (!schoolId || !teacherId) {
      res.status(400).json({ message: 'Teacher identity could not be resolved.' });
      return;
    }

    if (role === 'student' || role === 'learner') {
      res.status(403).json({ message: 'Access denied. Teacher or admin role required.' });
      return;
    }

    const query = validateGrowthPageTeacherQuery({ schoolId, teacherId, role });
    const overview = phase3GrowthPageTeacherOverviewService.getTeacherGrowthPageOverview(query);

    phase3GrowthPageAuditService.recordTeacherOverviewViewed(schoolId, getActorId(req), role, teacherId);

    res.json(overview);
  } catch (err: any) {
    const status = err.name === 'Phase3GrowthPageValidationError' ? 400 : err.name === 'Phase3GrowthPageAccessDenied' ? 403 : 500;
    res.status(status).json({ message: err.safeMessage || 'An unexpected error occurred.' });
  }
});

router.get('/teacher/learners/:studentId', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getTeacherId(req);
    const role = getActorRole(req);

    if (role === 'student' || role === 'learner') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const query = validateGrowthPageTeacherQuery({ schoolId, teacherId, role });
    const summary = phase3GrowthPageTeacherOverviewService.getLearnerGrowthPageTeacherSummary(query, req.params.studentId);
    res.json(summary);
  } catch (err: any) {
    const status = err.name === 'Phase3GrowthPageValidationError' ? 400 : err.name === 'Phase3GrowthPageAccessDenied' ? 403 : 500;
    res.status(status).json({ message: err.safeMessage || 'An unexpected error occurred.' });
  }
});

router.get('/teacher/weak-topic-lanes', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const role = getActorRole(req);
    if (role === 'student' || role === 'learner') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    const queue = phase3GrowthPageTeacherOverviewService.getWeakTopicSupportQueue({
      schoolId,
      teacherId: getTeacherId(req),
      role,
    });
    res.json({ weakTopicSupportQueue: queue });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/mistake-patterns', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const role = getActorRole(req);
    if (role === 'student' || role === 'learner') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    const patterns = phase3GrowthPageTeacherOverviewService.getMistakePatternClassSummary({
      schoolId,
      teacherId: getTeacherId(req),
      role,
    });
    res.json({ mistakePatterns: patterns });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/topics/:topicId', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const role = getActorRole(req);
    if (role === 'student' || role === 'learner') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    const query = validateGrowthPageTeacherQuery({ schoolId, teacherId: getTeacherId(req), role });
    const topic = phase3GrowthPageTeacherOverviewService.buildTeacherGrowthTopicRows(query)
      .find(row => row.topicId === req.params.topicId);
    if (!topic) {
      res.status(404).json({ message: 'Topic summary not found.' });
      return;
    }
    res.json(topic);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

export default router;
