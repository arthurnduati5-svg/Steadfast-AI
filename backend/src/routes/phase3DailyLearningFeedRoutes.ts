import { Router, Request, Response } from 'express';
import { phase3DailyLearningFeedService } from '../services/phase3DailyLearningFeedService';
import { phase3DailyLearningFeedTeacherOverviewService } from '../services/phase3DailyLearningFeedTeacherOverviewService';
import { phase3DailyLearningFeedAuditService } from '../services/phase3DailyLearningFeedAuditService';
import {
  validateDailyLearningFeedQuery,
  validateDailyLearningFeedTeacherOverviewQuery,
} from '../lib/phase3DailyLearningFeedValidation';

const router = Router();

function getActorRole(req: Request): string {
  return (req as any).user?.role || (req as any).student?.role || 'learner';
}

function getActorId(req: Request): string {
  return (req as any).user?.id || (req as any).student?.id || 'unknown';
}

/**
 * GET /api/phase3/daily-learning-feed/learner/today
 * Returns the learner's daily learning feed.
 */
router.get('/learner/today', (req: Request, res: Response) => {
  const schoolId = (req as any).schoolContext?.schoolId || (req as any).user?.schoolId || (req as any).query.schoolId as string;
  const studentId = (req as any).student?.id || (req as any).user?.id || (req as any).query.studentId as string;

  if (!schoolId || !studentId) {
    res.status(400).json({ message: 'School ID and student ID are required.' });
    return;
  }

  const queryValidation = validateDailyLearningFeedQuery({ schoolId, studentId });
  if (!queryValidation.ok) {
    res.status(400).json({ message: 'Validation failed.', errors: queryValidation.errors });
    return;
  }

  const feed = phase3DailyLearningFeedService.getLearnerDailyLearningFeed(schoolId, studentId);
  res.json(feed);
});

/**
 * GET /api/phase3/daily-learning-feed/learner/items/:feedItemId
 * Returns a single feed item detail for the learner.
 */
router.get('/learner/items/:feedItemId', (req: Request, res: Response) => {
  const schoolId = (req as any).schoolContext?.schoolId || (req as any).user?.schoolId || (req as any).query.schoolId as string;
  const studentId = (req as any).student?.id || (req as any).user?.id || (req as any).query.studentId as string;
  const { feedItemId } = req.params;

  if (!schoolId || !studentId) {
    res.status(400).json({ message: 'School ID and student ID are required.' });
    return;
  }

  const item = phase3DailyLearningFeedService.getFeedItemById(schoolId, studentId, feedItemId);
  if (!item) {
    res.status(404).json({ message: 'Feed item not found.' });
    return;
  }

  res.json(item);
});

/**
 * GET /api/phase3/daily-learning-feed/teacher/overview
 * Returns teacher-safe daily overview.
 */
router.get('/teacher/overview', (req: Request, res: Response) => {
  const schoolId = (req as any).schoolContext?.schoolId || (req as any).user?.schoolId || (req as any).query.schoolId as string;
  const teacherId = (req as any).teacher?.id || (req as any).user?.id || (req as any).query.teacherId as string;
  const role = getActorRole(req);

  const queryValidation = validateDailyLearningFeedTeacherOverviewQuery({
    schoolId,
    teacherId,
    role,
    classId: req.query.classId as string | undefined,
  });

  if (!queryValidation.ok) {
    res.status(403).json({ message: 'Access denied.', errors: queryValidation.errors });
    return;
  }

  const overview = phase3DailyLearningFeedTeacherOverviewService.getTeacherDailyLearningOverview(
    schoolId,
    teacherId,
    req.query.classId as string | undefined,
    req.query.subjectId as string | undefined,
  );

  res.json(overview);
});

/**
 * GET /api/phase3/daily-learning-feed/teacher/objectives/:objectiveId
 * Returns teacher-safe summary for a specific objective.
 */
router.get('/teacher/objectives/:objectiveId', (req: Request, res: Response) => {
  const schoolId = (req as any).schoolContext?.schoolId || (req as any).user?.schoolId || (req as any).query.schoolId as string;
  const teacherId = (req as any).teacher?.id || (req as any).user?.id || (req as any).query.teacherId as string;
  const role = getActorRole(req);
  const { objectiveId } = req.params;

  const queryValidation = validateDailyLearningFeedTeacherOverviewQuery({
    schoolId,
    teacherId,
    role,
  });

  if (!queryValidation.ok) {
    res.status(403).json({ message: 'Access denied.', errors: queryValidation.errors });
    return;
  }

  const overview = phase3DailyLearningFeedTeacherOverviewService.getTeacherDailyLearningOverview(
    schoolId,
    teacherId,
  );

  const objectiveRow = overview.objectiveRows.find(r => r.objectiveId === objectiveId);
  if (!objectiveRow) {
    res.status(404).json({ message: 'Objective not found in daily feed overview.' });
    return;
  }

  res.json(objectiveRow);
});

export default router;
