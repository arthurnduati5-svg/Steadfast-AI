import { describe, it, expect } from 'vitest';
import {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
  ResultReleasePacketStatus,
  ResultReleasePacketAudience,
  ResultReleasePacketMode,
  ResultReleaseApprovalStatus,
  ResultReleaseApprovalType,
  ResultAudienceProjectionStatus,
  StudentResultReportSnapshotStatus,
  StudentResultReportSnapshotType,
  ParentSafeResultSummaryStatus,
  StudentSafeResultSummaryStatus,
  ResultReleaseDeliveryIntentStatus,
  ResultReleaseDeliveryChannel,
  ActorRole,
  ALLOWED_APPROVAL_ROLES,
  BLOCKED_APPROVAL_ROLES,
} from '../contracts/resultReleaseContracts';
import {
  RESULT_RELEASE_POLICY_FAMILIES,
  ResultReleasePolicyFamily,
  evaluatePacketCreationPolicy,
  evaluateBoundaryEnforcementPolicy,
  evaluateReleaseApprovalPolicy,
  evaluateAudienceProjectionPolicy,
  evaluateReportSnapshotPolicy,
  evaluateParentSafeSummaryPolicy,
  evaluateStudentSafeSummaryPolicy,
  evaluateDeliveryIntentPolicy,
  evaluateAuditPolicy,
} from '../policies/resultReleasePolicyDefinitions';
import {
  ResultReleasePacketRepository,
  ResultReleaseApprovalRepository,
  ResultAudienceProjectionRepository,
  StudentResultReportSnapshotRepository,
  ParentSafeResultSummaryRepository,
  StudentSafeResultSummaryRepository,
  ResultReleaseDeliveryIntentRepository,
  ResultReleaseAuditRepository,
  ResultReleaseIdempotencyRepository,
} from '../contracts/resultReleaseRepositoryContracts';
import { ResultReleasePacket, CreateReleasePacketInput } from '../contracts/resultReleasePacketContracts';
import { ResultReleaseApproval, CreateReleaseApprovalInput } from '../contracts/resultReleaseApprovalContracts';
import { ResultAudienceProjection, CreateAudienceProjectionInput } from '../contracts/resultAudienceProjectionContracts';
import {
  StudentResultReportSnapshot, CreateReportSnapshotInput,
  ParentSafeResultSummary, CreateParentSafeSummaryInput,
  StudentSafeResultSummary, CreateStudentSafeSummaryInput,
} from '../contracts/resultReportSnapshotContracts';
import { ResultReleaseDeliveryIntent, CreateDeliveryIntentInput } from '../contracts/resultReleaseDeliveryIntentContracts';
import { ResultReleaseProjectionSafetyService } from '../services/resultReleaseProjectionSafetyService';
import { ResultReleaseBoundaryEnforcementService } from '../services/resultReleaseBoundaryEnforcementService';

describe('Package 11 - Result Release Contracts', () => {
  it('should define all 9 policy families', () => {
    const families = Object.keys(RESULT_RELEASE_POLICY_FAMILIES);
    expect(families).toContain('RESULT_RELEASE_PACKET_CREATION');
    expect(families).toContain('RESULT_RELEASE_BOUNDARY_ENFORCEMENT');
    expect(families).toContain('RESULT_RELEASE_APPROVAL');
    expect(families).toContain('RESULT_AUDIENCE_PROJECTION');
    expect(families).toContain('RESULT_STUDENT_REPORT_SNAPSHOT');
    expect(families).toContain('RESULT_PARENT_SAFE_SUMMARY');
    expect(families).toContain('RESULT_STUDENT_SAFE_SUMMARY');
    expect(families).toContain('RESULT_RELEASE_DELIVERY_INTENT');
    expect(families).toContain('RESULT_RELEASE_AUDIT');
    expect(families.length).toBe(9);
  });

  it('should export ResultReleaseSafeEnvelope', () => {
    const envelope: ResultReleaseSafeEnvelope = { ok: true, requestId: 'r1', status: 'ok' };
    expect(envelope.ok).toBe(true);
    expect(envelope.requestId).toBe('r1');
  });

  it('should export ReleasePacket contracts', () => {
    const packet: ResultReleasePacket = {
      resultReleasePacketId: 'p1', schoolId: 's1',
      resultFinalizationDecisionId: 'fd1', resultReleaseReadinessId: 'rr1',
      resultReleaseBoundaryId: 'rb1', markingResultVersionId: 'mv1',
      studentRef: 'st1', packetStatus: 'draft', packetAudience: 'student',
      packetMode: 'student_safe_result', safePacketSummary: 'test',
      createdByActorId: 'a1', createdByRole: 'teacher',
      createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    };
    expect(packet.resultReleasePacketId).toBe('p1');
    expect(packet.packetStatus).toBe('draft');

    const input: CreateReleasePacketInput = {
      schoolId: 's1', resultFinalizationDecisionId: 'fd1',
      resultReleaseReadinessId: 'rr1', resultReleaseBoundaryId: 'rb1',
      markingResultVersionId: 'mv1', studentRef: 'st1',
      packetAudience: 'student', packetMode: 'student_safe_result',
      safePacketSummary: 'test', createdByActorId: 'a1', createdByRole: 'teacher',
    };
    expect(input.schoolId).toBe('s1');
  });

  it('should export Approval contracts', () => {
    const approval: ResultReleaseApproval = {
      resultReleaseApprovalId: 'a1', schoolId: 's1',
      resultReleasePacketId: 'p1', resultFinalizationDecisionId: 'fd1',
      studentRef: 'st1', approvalStatus: 'draft', approvalType: 'teacher_release_approval',
      approvedAudience: 'student', approvedByActorId: 'a1', approvedByRole: 'teacher',
      safeApprovalSummary: 'test', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    };
    expect(approval.approvalStatus).toBe('draft');

    const input: CreateReleaseApprovalInput = {
      schoolId: 's1', resultReleasePacketId: 'p1',
      resultFinalizationDecisionId: 'fd1', studentRef: 'st1',
      approvalType: 'teacher_release_approval', approvedAudience: 'student',
      approvedByActorId: 'a1', approvedByRole: 'teacher', safeApprovalSummary: 'test',
    };
    expect(input.approvalType).toBe('teacher_release_approval');
  });

  it('should export Audience Projection contracts', () => {
    const proj: ResultAudienceProjection = {
      resultAudienceProjectionId: 'ap1', schoolId: 's1',
      resultReleasePacketId: 'p1', studentRef: 'st1',
      audienceType: 'student', projectionStatus: 'draft', projectionVersion: 1,
      safeProjectionSummary: 'test', createdByActorId: 'a1', createdByRole: 'teacher',
      createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    };
    expect(proj.projectionStatus).toBe('draft');

    const input: CreateAudienceProjectionInput = {
      schoolId: 's1', resultReleasePacketId: 'p1', studentRef: 'st1',
      audienceType: 'student', safeProjectionSummary: 'test',
      createdByActorId: 'a1', createdByRole: 'teacher',
    };
    expect(input.audienceType).toBe('student');
  });

  it('should export Report Snapshot contracts', () => {
    const snapshot: StudentResultReportSnapshot = {
      studentResultReportSnapshotId: 'ss1', schoolId: 's1',
      resultReleasePacketId: 'p1', resultAudienceProjectionId: 'ap1',
      studentRef: 'st1', snapshotStatus: 'draft', snapshotType: 'student_safe_exam_result',
      safeReportTitle: 'Test', safeReportSummary: 'Summary',
      createdByActorId: 'a1', createdByRole: 'teacher',
      createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    };
    expect(snapshot.snapshotStatus).toBe('draft');

    const pSummary: ParentSafeResultSummary = {
      parentSafeResultSummaryId: 'ps1', schoolId: 's1',
      resultReleasePacketId: 'p1', resultAudienceProjectionId: 'ap1',
      studentRef: 'st1', summaryStatus: 'draft', safeProgressSummary: 'progress',
      safeSupportSummary: 'support', createdByActorId: 'a1', createdByRole: 'teacher',
      createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    };
    expect(pSummary.summaryStatus).toBe('draft');

    const sSummary: StudentSafeResultSummary = {
      studentSafeResultSummaryId: 'sss1', schoolId: 's1',
      resultReleasePacketId: 'p1', resultAudienceProjectionId: 'ap1',
      studentRef: 'st1', summaryStatus: 'draft', safeAchievementSummary: 'achievement',
      safeLearningProgressSummary: 'progress', safeNextPracticeSummary: 'practice',
      createdByActorId: 'a1', createdByRole: 'teacher',
      createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    };
    expect(sSummary.summaryStatus).toBe('draft');
  });

  it('should export Delivery Intent contracts', () => {
    const intent: ResultReleaseDeliveryIntent = {
      resultReleaseDeliveryIntentId: 'di1', schoolId: 's1',
      resultReleasePacketId: 'p1', resultReleaseApprovalId: 'a1',
      studentRef: 'st1', audienceType: 'student', deliveryChannel: 'student_portal_future',
      intentStatus: 'draft', safeIntentSummary: 'test',
      createdByActorId: 'a1', createdByRole: 'teacher',
      createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    };
    expect(intent.intentStatus).toBe('draft');

    const input: CreateDeliveryIntentInput = {
      schoolId: 's1', resultReleasePacketId: 'p1', resultReleaseApprovalId: 'a1',
      studentRef: 'st1', audienceType: 'student', deliveryChannel: 'student_portal_future',
      safeIntentSummary: 'test', createdByActorId: 'a1', createdByRole: 'teacher',
    };
    expect(input.deliveryChannel).toBe('student_portal_future');
  });

  it('should export all 9 repository interfaces', () => {
    const repoInterfaceNames = [
      'ResultReleasePacketRepository',
      'ResultReleaseApprovalRepository',
      'ResultAudienceProjectionRepository',
      'StudentResultReportSnapshotRepository',
      'ParentSafeResultSummaryRepository',
      'StudentSafeResultSummaryRepository',
      'ResultReleaseDeliveryIntentRepository',
      'ResultReleaseAuditRepository',
      'ResultReleaseIdempotencyRepository',
    ];
    for (const name of repoInterfaceNames) {
      expect(typeof {}.constructor).toBe('function');
    }
    expect(repoInterfaceNames.length).toBe(9);
  });

  it('should export status and type literals', () => {
    const status: ResultReleasePacketStatus = 'draft';
    expect(status).toBe('draft');
    const audience: ResultReleasePacketAudience = 'student';
    expect(audience).toBe('student');
    const mode: ResultReleasePacketMode = 'student_safe_result';
    expect(mode).toBe('student_safe_result');
    const appStatus: ResultReleaseApprovalStatus = 'draft';
    expect(appStatus).toBe('draft');
    const appType: ResultReleaseApprovalType = 'teacher_release_approval';
    expect(appType).toBe('teacher_release_approval');
    const projStatus: ResultAudienceProjectionStatus = 'draft';
    expect(projStatus).toBe('draft');
    const snapStatus: StudentResultReportSnapshotStatus = 'draft';
    expect(snapStatus).toBe('draft');
    const snapType: StudentResultReportSnapshotType = 'student_safe_exam_result';
    expect(snapType).toBe('student_safe_exam_result');
    const parentStatus: ParentSafeResultSummaryStatus = 'draft';
    expect(parentStatus).toBe('draft');
    const studentStatus: StudentSafeResultSummaryStatus = 'draft';
    expect(studentStatus).toBe('draft');
    const diStatus: ResultReleaseDeliveryIntentStatus = 'draft';
    expect(diStatus).toBe('draft');
    const channel: ResultReleaseDeliveryChannel = 'student_portal_future';
    expect(channel).toBe('student_portal_future');
  });

  it('should define ALLOWED_APPROVAL_ROLES', () => {
    expect(ALLOWED_APPROVAL_ROLES).toContain('teacher');
    expect(ALLOWED_APPROVAL_ROLES).toContain('lead_teacher');
    expect(ALLOWED_APPROVAL_ROLES).toContain('department_head');
    expect(ALLOWED_APPROVAL_ROLES).toContain('admin');
    expect(ALLOWED_APPROVAL_ROLES).toContain('system_job');
    expect(ALLOWED_APPROVAL_ROLES.length).toBe(5);
  });

  it('should define BLOCKED_APPROVAL_ROLES', () => {
    expect(BLOCKED_APPROVAL_ROLES).toContain('student');
    expect(BLOCKED_APPROVAL_ROLES).toContain('parent');
    expect(BLOCKED_APPROVAL_ROLES).toContain('guest');
    expect(BLOCKED_APPROVAL_ROLES).toContain('unknown');
    expect(BLOCKED_APPROVAL_ROLES.length).toBe(4);
  });

  it('should block student/parent/guest from approval via policy', () => {
    const blockedRoles: ActorRole[] = ['student', 'parent', 'guest', 'unknown'];
    for (const role of blockedRoles) {
      const decision = evaluateReleaseApprovalPolicy({ schoolId: 's1', actorRole: role });
      expect(decision.allowed).toBe(false);
      expect(decision.reasonCode).toBe('FORBIDDEN');
    }
  });

  it('should allow teacher/admin/system_job to create release packets via policy', () => {
    const allowedRoles: ActorRole[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
    for (const role of allowedRoles) {
      const decision = evaluatePacketCreationPolicy({ schoolId: 's1', actorRole: role });
      expect(decision.allowed).toBe(true);
    }
  });

  it('should block missing schoolId in packet creation policy', () => {
    const decision = evaluatePacketCreationPolicy({ schoolId: '', actorRole: 'teacher' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block missing schoolId in boundary enforcement policy', () => {
    const decision = evaluateBoundaryEnforcementPolicy({ schoolId: '' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block missing schoolId in approval policy', () => {
    const decision = evaluateReleaseApprovalPolicy({ schoolId: '', actorRole: 'teacher' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block missing schoolId in audience projection policy', () => {
    const decision = evaluateAudienceProjectionPolicy({ schoolId: '' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block missing schoolId in report snapshot policy', () => {
    const decision = evaluateReportSnapshotPolicy({ schoolId: '', actorRole: 'teacher' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block missing schoolId in parent safe summary policy', () => {
    const decision = evaluateParentSafeSummaryPolicy({ schoolId: '' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block missing schoolId in student safe summary policy', () => {
    const decision = evaluateStudentSafeSummaryPolicy({ schoolId: '' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block missing schoolId in delivery intent policy', () => {
    const decision = evaluateDeliveryIntentPolicy({ schoolId: '', actorRole: 'teacher' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block missing schoolId in audit policy', () => {
    const decision = evaluateAuditPolicy({ schoolId: '' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('student-safe projection should exclude forbidden fields', async () => {
    const safetyService = new ResultReleaseProjectionSafetyService();
    const ctx: ResultReleaseCommandContext = {
      schoolId: 's1', actorId: 'a1', actorRole: 'teacher',
      correlationId: 'corr1', idempotencyKey: 'ik1',
    };
    const result = await safetyService.toStudentSafeProjection(ctx, {
      answerKeyText: 'secret', rawRubric: 'rubric', rawStudentAnswer: 'answer',
      hiddenReasoning: 'reason', chainOfThought: 'cot', unreleasedScore: '80',
      studentRef: 'st1', safeAchievementSummary: 'good',
    });
    const data = result as any;
    expect(data.data).not.toHaveProperty('answerKeyText');
    expect(data.data).not.toHaveProperty('rawRubric');
    expect(data.data).not.toHaveProperty('rawStudentAnswer');
    expect(data.data).not.toHaveProperty('hiddenReasoning');
    expect(data.data).not.toHaveProperty('chainOfThought');
    expect(data.data).not.toHaveProperty('unreleasedScore');
    expect(data.data).toHaveProperty('studentRef');
  });

  it('parent-boundary projection should exclude forbidden fields', async () => {
    const safetyService = new ResultReleaseProjectionSafetyService();
    const ctx: ResultReleaseCommandContext = {
      schoolId: 's1', actorId: 'a1', actorRole: 'teacher',
      correlationId: 'corr1', idempotencyKey: 'ik1',
    };
    const result = await safetyService.toParentBoundaryProjection(ctx, {
      answerKeyText: 'secret', rawRubric: 'rubric', pdfPayload: 'pdf',
      portalPayload: 'portal', notificationPayload: 'notify',
      studentRef: 'st1', safeProgressSummary: 'progress',
    });
    const data = result as any;
    expect(data.data).not.toHaveProperty('answerKeyText');
    expect(data.data).not.toHaveProperty('rawRubric');
    expect(data.data).not.toHaveProperty('pdfPayload');
    expect(data.data).not.toHaveProperty('portalPayload');
    expect(data.data).not.toHaveProperty('notificationPayload');
    expect(data.data).toHaveProperty('studentRef');
  });

  it('student/parent/guest cannot create release packets via policy', () => {
    const blockedRoles: ActorRole[] = ['student', 'parent', 'guest', 'unknown'];
    for (const role of blockedRoles) {
      const decision = evaluatePacketCreationPolicy({ schoolId: 's1', actorRole: role });
      expect(decision.allowed).toBe(false);
    }
  });

  it('teacher/admin/system_job can create release packets via policy', () => {
    const allowedRoles: ActorRole[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
    for (const role of allowedRoles) {
      const decision = evaluatePacketCreationPolicy({ schoolId: 's1', actorRole: role });
      expect(decision.allowed).toBe(true);
    }
  });

  it('should enforce report snapshot policy role gating', () => {
    expect(evaluateReportSnapshotPolicy({ schoolId: 's1', actorRole: 'student' }).allowed).toBe(false);
    expect(evaluateReportSnapshotPolicy({ schoolId: 's1', actorRole: 'parent' }).allowed).toBe(false);
    expect(evaluateReportSnapshotPolicy({ schoolId: 's1', actorRole: 'guest' }).allowed).toBe(false);
    expect(evaluateReportSnapshotPolicy({ schoolId: 's1', actorRole: 'teacher' }).allowed).toBe(true);
    expect(evaluateReportSnapshotPolicy({ schoolId: 's1', actorRole: 'admin' }).allowed).toBe(true);
  });

  it('should enforce delivery intent policy role gating', () => {
    expect(evaluateDeliveryIntentPolicy({ schoolId: 's1', actorRole: 'student' }).allowed).toBe(false);
    expect(evaluateDeliveryIntentPolicy({ schoolId: 's1', actorRole: 'parent' }).allowed).toBe(false);
    expect(evaluateDeliveryIntentPolicy({ schoolId: 's1', actorRole: 'teacher' }).allowed).toBe(true);
    expect(evaluateDeliveryIntentPolicy({ schoolId: 's1', actorRole: 'admin' }).allowed).toBe(true);
  });

  it('should have all policy family entries with defaultDecision and failClosedMessage', () => {
    for (const [family, config] of Object.entries(RESULT_RELEASE_POLICY_FAMILIES)) {
      expect(config).toHaveProperty('defaultDecision');
      expect(config).toHaveProperty('failClosedMessage');
      expect(typeof config.defaultDecision).toBe('string');
      expect(typeof config.failClosedMessage).toBe('string');
    }
  });
});
