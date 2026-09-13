import { Router, Request, Response } from 'express';
import { phase3PeerLearningRepository as repo } from '../services/phase3PeerLearningRepository';
import * as groupScopeGuard from '../services/phase3PeerGroupScopeGuardService';
import * as visibilityGuard from '../services/phase3PeerVisibilityGuardService';
import * as resourceSharing from '../services/phase3PeerResourceSharingService';
import * as resourceReviewQueue from '../services/phase3PeerResourceReviewQueueService';
import * as highlightService from '../services/phase3PeerHighlightService';
import * as highlightModeration from '../services/phase3PeerHighlightModerationService';
import * as healthyChallengeService from '../services/phase3HealthyChallengeService';
import * as challengeParticipation from '../services/phase3HealthyChallengeParticipationService';
import * as responseService from '../services/phase3PeerLearningResponseService';
import * as teacherOverviewService from '../services/phase3PeerLearningTeacherOverviewService';
import * as auditService from '../services/phase3PeerLearningAuditService';
import {
  validatePeerLearningContext,
  validatePeerLearningQuery,
  validatePeerLearningTeacherQuery,
  validatePeerContentSubmission,
  validatePeerResourceShare,
  validatePeerHighlight,
  validateHealthyChallenge,
  validateHealthyChallengeParticipation,
} from '../lib/phase3PeerLearningValidation';

const router = Router();

function getRole(req: Request): string {
  return (req as any).user?.role || 'unknown';
}

function getUserId(req: Request): string {
  return (req as any).user?.id || 'unknown';
}

function getSchoolId(req: Request): string {
  return (req as any).schoolContext?.schoolId || (req as any).user?.schoolId || 'unknown';
}

function isLearner(req: Request): boolean {
  const role = getRole(req);
  return role === 'student' || role === 'learner';
}

function isTeacher(req: Request): boolean {
  const role = getRole(req);
  return role === 'teacher' || role === 'admin' || role === 'internal';
}

// ── Learner routes ──────────────────────────────────────────

router.get('/learner', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    if (!isLearner(req) && !isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Learner or teacher role required.' });
      return;
    }
    const contextValidation = validatePeerLearningContext({ schoolId, studentId });
    if (!contextValidation.ok) {
      res.status(400).json({ errors: contextValidation.errors });
      return;
    }
    const view = responseService.buildPeerLearningHomeView(schoolId, studentId);
    res.json(view);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/learner/groups', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const groups = repo.listPeerGroupsForLearner(schoolId, studentId);
    const filtered = groupScopeGuard.filterGroupsForLearnerScope(
      schoolId, studentId,
      groups.map(g => ({ groupId: g.groupId, groupStatus: g.groupStatus, schoolId: g.schoolId }))
    );
    const result = groups.filter(g => filtered.some(f => f.groupId === g.groupId));
    res.json({ groups: result });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/learner/groups/:groupId', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    const { groupId } = req.params;
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const view = responseService.buildPeerGroupView(schoolId, studentId, groupId);
    res.json(view);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/learner/groups/:groupId/resources', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    const { groupId } = req.params;
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const view = responseService.buildApprovedPeerResourcesView(schoolId, studentId, groupId);
    res.json(view);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/learner/groups/:groupId/resources', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    const { groupId } = req.params;
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const scope = groupScopeGuard.assertLearnerCanAccessPeerGroup(schoolId, studentId, groupId);
    if (scope.visibilityLevel !== 'group_visible') {
      res.status(403).json({ message: scope.safeSummary });
      return;
    }
    const validation = validatePeerResourceShare(req.body);
    if (!validation.ok) {
      res.status(400).json({ errors: validation.errors });
      return;
    }
    const result = resourceSharing.submitPeerResourceForReview({
      schoolId,
      groupId,
      studentId,
      resourceType: req.body.resourceType,
      safeTitle: req.body.safeTitle,
      safeSummary: req.body.safeSummary || '',
      safeContent: req.body.safeContent || '',
      safeReasonCodes: [],
      safeEvidenceRefs: [],
      sourceTruthStatus: 'learner_created_visible',
    });
    auditService.recordPeerResourceSubmitted({
      schoolId, actorId: studentId, actorRole: 'student', resourceId: result.resource.resourceId, groupId,
    });
    res.status(201).json(result.resource);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/learner/groups/:groupId/highlights', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    const { groupId } = req.params;
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const view = responseService.buildPeerHighlightsView(schoolId, studentId, groupId);
    res.json(view);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/learner/groups/:groupId/highlights', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    const { groupId } = req.params;
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const scope = groupScopeGuard.assertLearnerCanAccessPeerGroup(schoolId, studentId, groupId);
    if (scope.visibilityLevel !== 'group_visible') {
      res.status(403).json({ message: scope.safeSummary });
      return;
    }
    const validation = validatePeerHighlight(req.body);
    if (!validation.ok) {
      res.status(400).json({ errors: validation.errors });
      return;
    }
    const result = highlightService.submitPeerHighlightForReview({
      schoolId,
      groupId,
      studentId,
      highlightType: req.body.highlightType,
      safeTitle: req.body.safeTitle,
      safeSummary: req.body.safeSummary || '',
      safeContent: req.body.safeContent || '',
      safeReasonCodes: [],
      safeEvidenceRefs: [],
      sourceTruthStatus: 'learner_created_visible',
    });
    auditService.recordPeerHighlightSubmitted({
      schoolId, actorId: studentId, actorRole: 'student', highlightId: result.highlight.highlightId, groupId,
    });
    res.status(201).json(result.highlight);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/learner/groups/:groupId/challenges', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    const { groupId } = req.params;
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const view = responseService.buildHealthyChallengesView(schoolId, studentId, groupId);
    res.json(view);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/learner/challenges/:challengeId/join', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    const { challengeId } = req.params;
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const validation = validateHealthyChallengeParticipation({
      schoolId, studentId, challengeId,
    });
    if (!validation.ok) {
      res.status(400).json({ errors: validation.errors });
      return;
    }
    const participation = challengeParticipation.joinHealthyChallenge(schoolId, studentId, challengeId);
    auditService.recordHealthyChallengeJoined({
      schoolId, actorId: studentId, actorRole: 'student', challengeId, participationId: participation.participationId,
    });
    res.status(201).json(participation);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/learner/challenges/:challengeId/steps/:stepId/complete', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    const { challengeId } = req.params;
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const participation = challengeParticipation.completeHealthyChallengeStep(schoolId, studentId, challengeId);
    if (!participation) {
      res.status(404).json({ message: 'Participation not found. Join the challenge first.' });
      return;
    }
    auditService.recordHealthyChallengeStepCompleted({
      schoolId, actorId: studentId, actorRole: 'student', challengeId, participationId: participation.participationId,
    });
    res.json(participation);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/learner/submissions', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const studentId = getUserId(req);
    if (!isLearner(req)) {
      res.status(403).json({ message: 'Access denied. Learner role required.' });
      return;
    }
    const view = responseService.buildOwnPeerSubmissionsView(schoolId, studentId);
    res.json(view);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

// ── Teacher/admin routes ─────────────────────────────────────

router.get('/teacher/overview', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const contextValidation = validatePeerLearningTeacherQuery({ schoolId, teacherId });
    if (!contextValidation.ok) {
      res.status(400).json({ errors: contextValidation.errors });
      return;
    }
    const overview = teacherOverviewService.getTeacherPeerLearningOverview(schoolId, teacherId);
    auditService.recordTeacherPeerOverviewViewed({ schoolId, actorId: teacherId, actorRole: 'teacher' });
    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/groups', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const groups = repo.listPeerGroupsForSchool(schoolId);
    res.json({ groups });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/teacher/groups', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const validation = validatePeerContentSubmission(req.body);
    if (!validation.ok) {
      res.status(400).json({ errors: validation.errors });
      return;
    }
    const group = repo.upsertPeerGroup({
      schoolId,
      teacherId,
      classId: req.body.classId,
      subjectId: req.body.subjectId,
      groupType: req.body.groupType,
      groupStatus: 'active',
      safeTitle: req.body.safeTitle,
      safeSummary: req.body.safeSummary || '',
    });
    auditService.recordPeerGroupCreated({ schoolId, actorId: teacherId, actorRole: 'teacher', groupId: group.groupId });
    res.status(201).json(group);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/groups/:groupId', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    const { groupId } = req.params;
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const summary = teacherOverviewService.getPeerGroupTeacherSummary(schoolId, teacherId, groupId);
    if (!summary) {
      res.status(404).json({ message: 'Group not found.' });
      return;
    }
    const group = repo.getPeerGroup(groupId);
    const resources = repo.listPeerResourceSharesForGroup(groupId);
    const highlights = repo.listPeerHighlightsForGroup(groupId);
    const challenges = repo.listHealthyChallengesForGroup(groupId);
    res.json({ group, summary, resources, highlights, challenges });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/teacher/groups/:groupId/members', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    const { groupId } = req.params;
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const group = repo.getPeerGroup(groupId);
    if (!group || group.schoolId !== schoolId) {
      res.status(404).json({ message: 'Group not found.' });
      return;
    }
    const membership = repo.addPeerGroupMembership({
      groupId,
      schoolId,
      studentId: req.body.studentId,
      teacherId,
      role: 'member',
    });
    auditService.recordPeerGroupMembershipAdded({
      schoolId, actorId: teacherId, actorRole: 'teacher', groupId, studentId: req.body.studentId,
    });
    res.status(201).json(membership);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/resources/review', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const queue = resourceReviewQueue.listPeerResourceReviewQueueForTeacher(schoolId);
    res.json({ reviewQueue: queue });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/teacher/resources/:resourceId/review', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    const { resourceId } = req.params;
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const { action } = req.body;
    let result;
    if (action === 'approve') {
      result = resourceReviewQueue.approvePeerResourceReviewItem(schoolId, teacherId, resourceId);
      if (result) auditService.recordPeerResourceApproved({ schoolId, actorId: teacherId, actorRole: 'teacher', resourceId });
    } else if (action === 'reject') {
      result = resourceReviewQueue.rejectPeerResourceReviewItem(schoolId, teacherId, resourceId);
      if (result) auditService.recordPeerResourceRejected({ schoolId, actorId: teacherId, actorRole: 'teacher', resourceId });
    } else {
      res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
      return;
    }
    if (!result) {
      res.status(404).json({ message: 'Resource not found.' });
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/highlights/review', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const queue = highlightModeration.listPeerHighlightReviewQueueForTeacher(schoolId);
    res.json({ reviewQueue: queue });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/teacher/highlights/:highlightId/review', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    const { highlightId } = req.params;
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const { action } = req.body;
    let result;
    if (action === 'approve') {
      result = highlightModeration.approvePeerHighlightReviewItem(schoolId, teacherId, highlightId);
      if (result) auditService.recordPeerHighlightApproved({ schoolId, actorId: teacherId, actorRole: 'teacher', highlightId });
    } else if (action === 'reject') {
      result = highlightModeration.rejectPeerHighlightReviewItem(schoolId, teacherId, highlightId);
      if (result) auditService.recordPeerHighlightRejected({ schoolId, actorId: teacherId, actorRole: 'teacher', highlightId });
    } else {
      res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
      return;
    }
    if (!result) {
      res.status(404).json({ message: 'Highlight not found.' });
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.get('/teacher/challenges', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const challenges = healthyChallengeService.listHealthyChallengesForTeacher(schoolId, teacherId);
    res.json({ challenges });
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/teacher/challenges', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const validation = validateHealthyChallenge(req.body);
    if (!validation.ok) {
      res.status(400).json({ errors: validation.errors });
      return;
    }
    const challenge = healthyChallengeService.createHealthyChallenge({
      schoolId,
      teacherId,
      groupId: req.body.groupId,
      classId: req.body.classId,
      challengeType: req.body.challengeType,
      safeTitle: req.body.safeTitle,
      safeSummary: req.body.safeSummary || '',
      safeInstructions: req.body.safeInstructions || '',
      safeEvidenceRefs: [],
      sourceTruthStatus: 'teacher_created',
      expiresAt: req.body.expiresAt,
    });
    auditService.recordHealthyChallengeCreated({
      schoolId, actorId: teacherId, actorRole: 'teacher', challengeId: challenge.challengeId,
    });
    res.status(201).json(challenge);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/teacher/challenges/:challengeId/pause', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    const { challengeId } = req.params;
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const challenge = healthyChallengeService.pauseHealthyChallenge(schoolId, challengeId);
    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found.' });
      return;
    }
    res.json(challenge);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

router.post('/teacher/challenges/:challengeId/archive', (req: Request, res: Response) => {
  try {
    const schoolId = getSchoolId(req);
    const teacherId = getUserId(req);
    const { challengeId } = req.params;
    if (!isTeacher(req)) {
      res.status(403).json({ message: 'Access denied. Teacher role required.' });
      return;
    }
    const challenge = healthyChallengeService.archiveHealthyChallenge(schoolId, challengeId);
    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found.' });
      return;
    }
    res.json(challenge);
  } catch (err: any) {
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

export default router;
