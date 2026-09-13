import { Router, Request, Response } from 'express';
import {
  type Phase3ParentRole,
  type Phase3ParentLinkStatus,
  type Phase3ParentVisibilityLevel,
  type Phase3ParentNotificationType,
} from '../contracts/phase3ParentSupportContracts';
import * as repo from '../services/phase3ParentSupportRepository';
import * as visibilityGuard from '../services/phase3ParentVisibilityGuardService';
import * as progressSummaryService from '../services/phase3ParentProgressSummaryService';
import * as notificationPolicy from '../services/phase3ParentNotificationPolicyService';
import * as notificationPreference from '../services/phase3ParentNotificationPreferenceService';
import * as notificationQueue from '../services/phase3ParentNotificationQueueService';
import * as responseService from '../services/phase3ParentSupportResponseService';
import * as teacherOverviewService from '../services/phase3ParentSupportTeacherOverviewService';
import * as auditService from '../services/phase3ParentSupportAuditService';
import {
  validateParentSupportContext,
  validateParentSupportQuery,
  validateParentSupportTeacherQuery,
} from '../lib/phase3ParentSupportValidation';

const router = Router();

function getParentRole(req: Request): Phase3ParentRole {
  return (req as any).user?.role || 'parent';
}

function getUserId(req: Request): string {
  return (req as any).user?.id || 'unknown';
}

function getSchoolId(req: Request): string {
  return (req as any).schoolContext?.schoolId || (req as any).user?.schoolId || 'unknown';
}

// ── Parent routes ──────────────────────────────────────────

router.get('/parent', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const parentId = getUserId(req);
    const role = getParentRole(req);
    if (role !== 'parent' && role !== 'guardian' && role !== 'authorized_family_contact') {
      res.status(403).json({ message: 'Access denied. Parent role required.' });
      return;
    }

    const contextValidation = validateParentSupportContext({ schoolId, parentId, role });
    if (!contextValidation.ok) {
      res.status(400).json({ errors: contextValidation.errors });
      return;
    }

    const links = repo.listLearnerLinksForParent(schoolId, parentId);
    res.json({
      parentId,
      linkCount: links.length,
      links: links.map((l) => ({
        studentId: l.studentId,
        linkStatus: l.linkStatus,
        visibilityLevel: l.visibilityLevel,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/parent/children', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const parentId = getUserId(req);
    const role = getParentRole(req);
    if (role !== 'parent' && role !== 'guardian' && role !== 'authorized_family_contact') {
      res.status(403).json({ message: 'Access denied. Parent role required.' });
      return;
    }

    const view = responseService.buildParentSupportHomeView(schoolId, parentId);
    res.json(view);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/parent/children/:studentId/summary', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const parentId = getUserId(req);
    const studentId = req.params.studentId;
    const role = getParentRole(req);
    if (role !== 'parent' && role !== 'guardian' && role !== 'authorized_family_contact') {
      res.status(403).json({ message: 'Access denied. Parent role required.' });
      return;
    }

    const result = responseService.buildParentChildSummaryView(schoolId, parentId, studentId);
    if (!result.view) {
      res.status(403).json({ message: result.decision.safeSummary });
      return;
    }

    auditService.recordParentSafeSummaryViewed({
      schoolId,
      actorId: parentId,
      actorRole: role,
      parentId,
      studentId,
      summaryId: 'batch_view',
    });

    res.json(result.view);
  } catch (err: any) {
    res.status(403).json({ message: err.message || 'Access denied.' });
  }
});

router.get('/parent/children/:studentId/notifications', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const parentId = getUserId(req);
    const studentId = req.params.studentId;
    const role = getParentRole(req);
    if (role !== 'parent' && role !== 'guardian' && role !== 'authorized_family_contact') {
      res.status(403).json({ message: 'Access denied. Parent role required.' });
      return;
    }

    const cards = responseService.buildParentNotificationView(schoolId, parentId, studentId);
    res.json({ cards });
  } catch (err: any) {
    res.status(403).json({ message: err.message || 'Access denied.' });
  }
});

router.get('/parent/children/:studentId/support-suggestions', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const parentId = getUserId(req);
    const studentId = req.params.studentId;
    const role = getParentRole(req);
    if (role !== 'parent' && role !== 'guardian' && role !== 'authorized_family_contact') {
      res.status(403).json({ message: 'Access denied. Parent role required.' });
      return;
    }

    const view = responseService.buildParentSupportSuggestionView(schoolId, parentId, studentId);
    res.json(view);
  } catch (err: any) {
    res.status(403).json({ message: err.message || 'Access denied.' });
  }
});

router.get('/parent/preferences', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const parentId = getUserId(req);
    const role = getParentRole(req);
    if (role !== 'parent' && role !== 'guardian' && role !== 'authorized_family_contact') {
      res.status(403).json({ message: 'Access denied. Parent role required.' });
      return;
    }

    const prefs = repo.listParentNotificationPreferences(schoolId, parentId);
    res.json({ preferences: prefs });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/parent/preferences', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const parentId = getUserId(req);
    const role = getParentRole(req);
    if (role !== 'parent' && role !== 'guardian' && role !== 'authorized_family_contact') {
      res.status(403).json({ message: 'Access denied. Parent role required.' });
      return;
    }

    const { studentId, enabledNotificationTypes, quietHoursStart, quietHoursEnd, frequencyPreference, languagePreference } = req.body;
    if (!studentId) {
      res.status(400).json({ message: 'studentId is required.' });
      return;
    }

    const pref = notificationPreference.upsertParentNotificationPreference(
      schoolId, parentId, studentId,
      { enabledNotificationTypes, quietHoursStart, quietHoursEnd, frequencyPreference, languagePreference }
    );

    auditService.recordParentNotificationPreferenceUpdated({
      schoolId,
      actorId: parentId,
      actorRole: role,
      parentId,
      studentId,
    });

    res.json({ preference: pref });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/parent/notifications/:cardId/complete', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const parentId = getUserId(req);
    const cardId = req.params.cardId;
    const role = getParentRole(req);
    if (role !== 'parent' && role !== 'guardian' && role !== 'authorized_family_contact') {
      res.status(403).json({ message: 'Access denied. Parent role required.' });
      return;
    }

    const card = notificationQueue.markParentNotificationCardCompleted(schoolId, cardId);
    if (!card) {
      res.status(404).json({ message: 'Notification card not found.' });
      return;
    }

    res.json({ card });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

// ── Teacher/admin routes ───────────────────────────────────

router.get('/teacher/overview', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    const role = getParentRole(req);
    if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
      res.status(403).json({ message: 'Access denied. Teacher/admin role required.' });
      return;
    }

    const classId = req.query.classId as string | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const overview = teacherOverviewService.getTeacherParentSupportOverview(schoolId, teacherId, classId, subjectId);

    auditService.recordTeacherParentSupportOverviewViewed({
      schoolId,
      actorId: teacherId,
      actorRole: role,
      teacherId,
    });

    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/learners/:studentId', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    const studentId = req.params.studentId;
    const role = getParentRole(req);
    if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
      res.status(403).json({ message: 'Access denied. Teacher/admin role required.' });
      return;
    }

    const summary = teacherOverviewService.getLearnerParentSupportTeacherSummary(schoolId, studentId);
    res.json({ studentId, ...summary });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/notifications', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const role = getParentRole(req);
    if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
      res.status(403).json({ message: 'Access denied. Teacher/admin role required.' });
      return;
    }

    const queue = teacherOverviewService.getParentSupportNotificationReviewQueue(schoolId);
    res.json({ notificationReviewQueue: queue });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/source-required', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const role = getParentRole(req);
    if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
      res.status(403).json({ message: 'Access denied. Teacher/admin role required.' });
      return;
    }

    const queue = teacherOverviewService.getParentSupportSourceRequiredQueue(schoolId);
    res.json({ sourceRequiredQueue: queue });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/teacher-mediated', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const role = getParentRole(req);
    if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
      res.status(403).json({ message: 'Access denied. Teacher/admin role required.' });
      return;
    }

    const queue = teacherOverviewService.getParentSupportTeacherMediatedQueue(schoolId);
    res.json({ teacherMediatedQueue: queue });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

export default router;
