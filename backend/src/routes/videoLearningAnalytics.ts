// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Analytics Routes v1
// Endpoints: student, class, video-effectiveness, interventions
// Mounted at /api/video-learning-analytics
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

import { buildStudentVideoLearningSummary } from '../services/videoLearningAnalyticsAggregationService';
import { buildTeacherSafeAnalyticsResponse } from '../services/videoTeacherSafeAnalyticsResponseBuilder';
import { buildLearnerSafeAnalyticsSummary } from '../services/videoLearnerSafeAnalyticsResponseBuilder';
import { scoreVideoEffectiveness } from '../services/videoEffectivenessScoringService';
import { listStudentVideoLearningEvents, listClassVideoLearningEvents } from '../services/videoLearningAnalyticsRepository';

const router = Router();

// ── Helpers ──

function resolveIdentity(req: AuthedRequest): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || undefined,
    grade: undefined,
    ageBand: undefined,
  };
}

function sendUnauthenticated(res: Response): void {
  res.status(401).json({
    error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
  });
}

function sendForbidden(res: Response): void {
  res.status(403).json({
    ok: false,
    error: { code: 'FORBIDDEN', message: 'Not authorized for this scope.' },
  });
}

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ ok: false, error: { code: 'ERROR', message } });
}

/**
 * POST /api/video-learning-analytics/student
 * Returns learner-safe or teacher-safe video analytics for a student.
 */
router.post('/video-learning-analytics/student', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const { studentId, subject, topic, skillId, from, to, audience } = req.body || {};

    const targetStudentId = studentId || identity.studentId;

    // Students can only view their own data
    if (targetStudentId !== identity.studentId && identity.role !== 'teacher') {
      sendForbidden(res);
      return;
    }

    const scope = {
      studentId: targetStudentId,
      schoolId: identity.schoolId,
      subject: subject || null,
      topic: topic || null,
      skillId: skillId || null,
      from: from || null,
      to: to || null,
    };

    if (audience === 'teacher' && identity.role === 'teacher') {
      // Get detailed analytics for teacher view
      const identities: ResolvedTutorIdentity[] = [{ ...identity, studentId: targetStudentId }];
      const response = await buildTeacherSafeAnalyticsResponse(
        { schoolId: identity.schoolId, studentId: targetStudentId, subject, topic, skillId, from, to },
        identity,
        identities,
      );
      res.json({ ok: true, ...response });
    } else {
      // Learner-safe summary
      const learnerSummary = await buildLearnerSafeAnalyticsSummary(scope, identity);
      res.json({ ok: true, ...learnerSummary });
    }
  } catch (err) {
    console.error('[VideoAnalytics/student] Error:', err);
    sendError(res, 500, 'Video learning analytics service error.');
  }
});

/**
 * POST /api/video-learning-analytics/class
 * Returns teacher-safe class overview (teacher only).
 */
router.post('/video-learning-analytics/class', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }
    if (identity.role !== 'teacher') { sendForbidden(res); return; }

    const { classId, subject, topic, skillId, studentIds, from, to } = req.body || {};

    // Teacher analytics requires student IDs or classId
    if (!classId && !studentIds) {
      sendError(res, 400, 'classId or studentIds required.');
      return;
    }

    // Build student identities
    const studentIdentities: ResolvedTutorIdentity[] = (studentIds || []).map((sid: string) => ({
      studentId: sid,
      schoolId: identity.schoolId,
      userId: sid,
    }));

    const response = await buildTeacherSafeAnalyticsResponse(
      { schoolId: identity.schoolId, classId, subject, topic, skillId, from, to, teacherId: identity.userId },
      identity,
      studentIdentities,
    );

    res.json({ ok: true, ...response });
  } catch (err) {
    console.error('[VideoAnalytics/class] Error:', err);
    sendError(res, 500, 'Video learning analytics service error.');
  }
});

/**
 * POST /api/video-learning-analytics/video-effectiveness
 * Returns video effectiveness summaries.
 */
router.post('/video-learning-analytics/video-effectiveness', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const { videoId, subject, topic, skillId, from, to } = req.body || {};

    if (!videoId) {
      sendError(res, 400, 'videoId required.');
      return;
    }

    // Get events for this video
    const events = await listStudentVideoLearningEvents(
      { studentId: identity.studentId, schoolId: identity.schoolId, subject, topic, skillId, from, to },
      identity,
    );

    const videoEvents = events.filter((e) => e.videoId === videoId);
    const effectiveness = scoreVideoEffectiveness(videoEvents);

    res.json({ ok: true, ...effectiveness });
  } catch (err) {
    console.error('[VideoAnalytics/video-effectiveness] Error:', err);
    sendError(res, 500, 'Video effectiveness service error.');
  }
});

/**
 * POST /api/video-learning-analytics/interventions
 * Returns intervention recommendations (teacher only).
 */
router.post('/video-learning-analytics/interventions', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }
    if (identity.role !== 'teacher') { sendForbidden(res); return; }

    const { classId, subject, topic, skillId, studentIds, from, to } = req.body || {};

    if (!classId && !studentIds) {
      sendError(res, 400, 'classId or studentIds required.');
      return;
    }

    const studentIdentities: ResolvedTutorIdentity[] = (studentIds || []).map((sid: string) => ({
      studentId: sid,
      schoolId: identity.schoolId,
      userId: sid,
    }));

    const response = await buildTeacherSafeAnalyticsResponse(
      { schoolId: identity.schoolId, classId, subject, topic, skillId, from, to, teacherId: identity.userId },
      identity,
      studentIdentities,
    );

    res.json({
      ok: true,
      status: response.status,
      interventions: response.interventions,
      warnings: response.warnings,
    });
  } catch (err) {
    console.error('[VideoAnalytics/interventions] Error:', err);
    sendError(res, 500, 'Intervention recommendation service error.');
  }
});

export default router;
