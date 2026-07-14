import { describe, it, expect } from 'vitest';
import {
  ExamDeliveryCommandContext,
  ExamDeliveryPolicyDecision,
  ExamDeliverySafeEnvelope,
  ExamDeliveryTeacherProjection,
  ExamDeliveryStudentAttemptProjection,
  ExamVariantAssignmentTeacherView,
  ExamAttemptQuestionStudentView,
  ExamDeliveryAdminProjection,
  STUDENT_PROJECTION_FORBIDDEN_FIELDS,
} from '../contracts/examDeliveryContracts';
import {
  ExamDeliverySession,
  ExamDeliverySessionState,
  ExamDeliverySessionStatus,
  ExamDeliverySessionMode,
  ExamDeliveryActivationMode,
} from '../contracts/examDeliverySessionContracts';
import {
  ExamVariantAssignment,
  ExamVariantAssignmentStatus,
  LearnerRefType,
  AssignmentStrategy,
} from '../contracts/examVariantAssignmentContracts';
import {
  ExamAttempt,
  ExamAttemptQuestionSnapshot,
  ExamAttemptStatus,
  ExamTimingEventType,
  ExamAttemptTimingEvent,
} from '../contracts/examAttemptContracts';
import {
  ExamAnswerSubmission,
  ExamAnswerSubmissionStatus,
} from '../contracts/examAnswerSubmissionContracts';
import {
  ExamAttemptSubmissionSnapshot,
  ExamAttemptSubmissionSnapshotStatus,
  ExamDeliveryAuditEvent,
  ExamDeliveryIdempotencyEntry,
  ExamDeliverySnapshotForMarking,
} from '../contracts/examDeliverySnapshotContracts';
import {
  ExamDeliverySessionRepository,
  ExamDeliverySessionStateRepository,
  ExamVariantAssignmentRepository,
  ExamAttemptRepository,
  ExamAttemptQuestionSnapshotRepository,
  ExamAnswerSubmissionRepository,
  ExamAttemptTimingEventRepository,
  ExamAttemptSubmissionSnapshotRepository,
  ExamDeliveryAuditRepository,
  ExamDeliveryIdempotencyRepository,
  ExamDeliveryAllRepositories,
} from '../contracts/examDeliveryRepositoryContracts';
import { assertTeacherRole, assertStudentRole } from '../policies/examDeliveryPolicyDefinitions';

describe('Package 7 - Delivery Contracts', () => {
  it('exports STUDENT_PROJECTION_FORBIDDEN_FIELDS with expected entries', () => {
    expect(Array.isArray(STUDENT_PROJECTION_FORBIDDEN_FIELDS)).toBe(true);
    expect(STUDENT_PROJECTION_FORBIDDEN_FIELDS.length).toBeGreaterThan(0);
    expect(STUDENT_PROJECTION_FORBIDDEN_FIELDS).toContain('answerKeyText');
    expect(STUDENT_PROJECTION_FORBIDDEN_FIELDS).toContain('markingResult');
    expect(STUDENT_PROJECTION_FORBIDDEN_FIELDS).toContain('finalGrade');
    expect(STUDENT_PROJECTION_FORBIDDEN_FIELDS).toContain('score');
    expect(STUDENT_PROJECTION_FORBIDDEN_FIELDS).toContain('parentReleaseStatus');
    expect(STUDENT_PROJECTION_FORBIDDEN_FIELDS).toContain('masteryMutation');
  });

  it('ExamDeliverySession contract has required fields', () => {
    const session: ExamDeliverySession = {
      deliverySessionId: 's1',
      schoolId: 'school1',
      paperId: 'p1',
      paperVersionId: 'pv1',
      deliveryBridgeId: 'db1',
      accessPolicyId: 'ap1',
      status: 'draft',
      sessionMode: 'teacher_controlled',
      title: 'Test Session',
      safeInstructions: 'Read carefully',
      intendedAudienceType: 'class',
      classScopeRefsJson: null,
      roleScopeRefsJson: null,
      activationMode: 'manual_teacher_activation',
      createdByActorId: 'actor1',
      createdByRole: 'teacher',
      openedAt: null,
      closedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    };
    expect(session.deliverySessionId).toBe('s1');
    expect(session.status).toBe('draft');
  });

  it('ExamVariantAssignment contract has required fields', () => {
    const a: ExamVariantAssignment = {
      variantAssignmentId: 'va1',
      schoolId: 's1',
      deliverySessionId: 'ds1',
      paperId: 'p1',
      paperVersionId: 'pv1',
      variantId: 'v1',
      studentRef: 'student1',
      learnerRefType: 'mock_student_ref',
      assignmentStatus: 'assigned',
      assignmentStrategy: 'manual_teacher_assignment',
      assignedByActorId: 'actor1',
      assignedByRole: 'teacher',
      safeAssignmentSummary: 'Assigned variant v1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revokedAt: null,
    };
    expect(a.assignmentStatus).toBe('assigned');
    expect(a.studentRef).toBe('student1');
  });

  it('ExamAttempt contract has required fields', () => {
    const att: ExamAttempt = {
      attemptId: 'a1',
      schoolId: 's1',
      deliverySessionId: 'ds1',
      variantAssignmentId: 'va1',
      paperId: 'p1',
      paperVersionId: 'pv1',
      variantId: 'v1',
      studentRef: 'student1',
      status: 'in_progress',
      attemptNumber: 1,
      startedAt: new Date().toISOString(),
      lastSeenAt: null,
      submittedAt: null,
      autoSubmittedAt: null,
      cancelledAt: null,
      blockedAt: null,
      durationSecondsAllowed: 3600,
      durationSecondsUsed: 0,
      safeAttemptSummary: 'Attempt started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(att.status).toBe('in_progress');
    expect(att.attemptNumber).toBe(1);
  });

  it('Student projection excludes answer keys and final grades', () => {
    const forbidden = new Set(STUDENT_PROJECTION_FORBIDDEN_FIELDS);
    expect(forbidden.has('answerKeySafeRef')).toBe(true);
    expect(forbidden.has('answerKeyText')).toBe(true);
    expect(forbidden.has('correctAnswerSummary')).toBe(true);
    expect(forbidden.has('markingResult')).toBe(true);
    expect(forbidden.has('score')).toBe(true);
    expect(forbidden.has('finalGrade')).toBe(true);
  });

  it('Parent release fields are present in forbidden list', () => {
    expect(STUDENT_PROJECTION_FORBIDDEN_FIELDS).toContain('parentReleaseStatus');
    expect(STUDENT_PROJECTION_FORBIDDEN_FIELDS).toContain('masteryMutation');
  });

  it('assertTeacherRole blocks guest role', () => {
    const result = assertTeacherRole('guest');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toContain('ROLE_BLOCKED');
  });

  it('assertTeacherRole blocks unknown role', () => {
    const result = assertTeacherRole('unknown');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toContain('ROLE_BLOCKED');
  });

  it('assertTeacherRole blocks parent role', () => {
    const result = assertTeacherRole('parent');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toContain('ROLE_BLOCKED');
  });

  it('assertTeacherRole allows teacher role', () => {
    const result = assertTeacherRole('teacher');
    expect(result.allowed).toBe(true);
  });

  it('assertTeacherRole allows admin role', () => {
    const result = assertTeacherRole('admin');
    expect(result.allowed).toBe(true);
  });

  it('assertTeacherRole allows system_job role', () => {
    const result = assertTeacherRole('system_job');
    expect(result.allowed).toBe(true);
  });

  it('assertStudentRole blocks guest role for attempt actions', () => {
    const result = assertStudentRole('guest');
    expect(result.allowed).toBe(false);
  });

  it('assertStudentRole allows student role', () => {
    const result = assertStudentRole('student');
    expect(result.allowed).toBe(true);
  });

  it('student projection type does not include marking fields', () => {
    const projection: ExamDeliveryStudentAttemptProjection = {
      attemptId: 'a1',
      deliverySessionId: 'ds1',
      paperVersionId: 'pv1',
      variantId: 'v1',
      status: 'in_progress',
      startedAt: null,
      lastSeenAt: null,
      durationSecondsAllowed: 3600,
      durationSecondsUsed: 0,
      safeAttemptSummary: '',
      questions: [],
      savedAnswerStatus: null,
      submissionStatus: null,
    };
    const keys = Object.keys(projection);
    expect(keys).not.toContain('score');
    expect(keys).not.toContain('finalGrade');
    expect(keys).not.toContain('markingResult');
    expect(keys).not.toContain('answerKeyText');
  });

  it('teacher projection has assignment views', () => {
    const tp: ExamDeliveryTeacherProjection = {
      deliverySessionId: 'ds1',
      schoolId: 's1',
      paperId: 'p1',
      paperVersionId: 'pv1',
      sessionStatus: 'open',
      sessionMode: 'teacher_controlled',
      title: 'Test',
      safeInstructions: '',
      intendedAudienceType: 'class',
      activationMode: 'manual_teacher_activation',
      openedAt: null,
      closedAt: null,
      stateSummary: '',
      activeAttemptCount: 0,
      submittedAttemptCount: 0,
      assignments: [],
    };
    expect(tp.sessionStatus).toBe('open');
  });

  it('admin projection includes state counters', () => {
    const ap: ExamDeliveryAdminProjection = {
      deliverySessionId: 'ds1',
      schoolId: 's1',
      paperId: 'p1',
      paperVersionId: 'pv1',
      deliveryBridgeId: 'db1',
      accessPolicyId: 'ap1',
      sessionStatus: 'open',
      sessionMode: 'teacher_controlled',
      activationMode: 'manual_teacher_activation',
      title: 'Test',
      state: {
        activeAttemptCount: 5,
        submittedAttemptCount: 2,
        pausedAttemptCount: 1,
        blockedAttemptCount: 0,
        version: 1,
        safeStateSummary: '',
      },
      createdByActorId: 'a1',
      createdByRole: 'teacher',
      openedAt: null,
      closedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(ap.state.activeAttemptCount).toBe(5);
  });
});
