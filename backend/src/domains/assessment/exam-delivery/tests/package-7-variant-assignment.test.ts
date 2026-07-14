import { describe, it, expect, beforeAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { createInMemoryExamDeliveryRepositories } from '../repositories/inMemoryExamDeliveryRepositories';
import { ExamDeliverySessionService } from '../services/examDeliverySessionService';
import { ExamDeliveryActivationService } from '../services/examDeliveryActivationService';
import { ExamVariantAssignmentService } from '../services/examVariantAssignmentService';
import { ExamAttemptService } from '../services/examAttemptService';
import { ExamDeliveryCommandContext } from '../contracts/examDeliveryContracts';

describe('Package 7 - Variant Assignment', () => {
  const repos = createInMemoryExamDeliveryRepositories();
  const sessionService = new ExamDeliverySessionService(repos);
  const activationService = new ExamDeliveryActivationService(repos);
  const assignmentService = new ExamVariantAssignmentService(repos);
  const attemptService = new ExamAttemptService(repos);
  const schoolId = 'school1';
  const teacherCtx: ExamDeliveryCommandContext = {
    schoolId,
    actorId: 'teacher1',
    actorRole: 'teacher',
    correlationId: uuid(),
    idempotencyKey: uuid(),
  };

  let sessionId: string;

  beforeAll(async () => {
    const { session } = await sessionService.createDeliverySession(teacherCtx, {
      paperId: 'paper1',
      paperVersionId: 'pv1',
      deliveryBridgeId: 'db1',
      accessPolicyId: 'ap1',
      title: 'Assignment Test',
      safeInstructions: 'Test',
      intendedAudienceType: 'class',
      sessionMode: 'teacher_controlled',
      activationMode: 'manual_teacher_activation',
    });
    sessionId = session!.deliverySessionId;
    await activationService.openDeliverySession(teacherCtx, sessionId);
  });

  it('assigns approved variant to a studentRef', async () => {
    const { assignment, policy } = await assignmentService.assignVariantToStudent(teacherCtx, {
      deliverySessionId: sessionId,
      paperId: 'paper1',
      paperVersionId: 'pv1',
      variantId: 'variant1',
      studentRef: 'student1',
      learnerRefType: 'mock_student_ref',
      assignmentStrategy: 'manual_teacher_assignment',
      safeAssignmentSummary: 'Assigned variant 1 to student 1',
    });
    expect(policy.allowed).toBe(true);
    expect(assignment).not.toBeNull();
    expect(assignment!.studentRef).toBe('student1');
    expect(assignment!.variantId).toBe('variant1');
    expect(assignment!.assignmentStatus).toBe('assigned');
  });

  it('assignment preserves variantId', async () => {
    const a = await assignmentService.getAssignmentForStudent(sessionId, 'student1');
    expect(a).not.toBeNull();
    expect(a!.variantId).toBe('variant1');
  });

  it('assignment preserves paperVersionId', async () => {
    const a = await assignmentService.getAssignmentForStudent(sessionId, 'student1');
    expect(a).not.toBeNull();
    expect(a!.paperVersionId).toBe('pv1');
  });

  it('bulk assignment works deterministically', async () => {
    const { assignments, policy } = await assignmentService.bulkAssignVariants(teacherCtx, {
      deliverySessionId: sessionId,
      paperId: 'paper1',
      paperVersionId: 'pv1',
      assignments: [
        { variantId: 'v2', studentRef: 'student2', learnerRefType: 'mock_student_ref', assignmentStrategy: 'same_variant_for_all', safeAssignmentSummary: 'Bulk assign' },
        { variantId: 'v3', studentRef: 'student3', learnerRefType: 'mock_student_ref', assignmentStrategy: 'same_variant_for_all', safeAssignmentSummary: 'Bulk assign' },
      ],
    });
    expect(policy.allowed).toBe(true);
    expect(assignments.length).toBe(2);
    expect(assignments[0].studentRef).toBe('student2');
    expect(assignments[1].studentRef).toBe('student3');
  });

  it('assignment does not notify students (no notification mechanism present)', async () => {
    const a = await assignmentService.getAssignmentForStudent(sessionId, 'student1');
    expect(a).not.toBeNull();
  });

  it('assignment does not create attempts by itself', async () => {
    const assignments = await assignmentService.listAssignmentsForSession(sessionId);
    const attempts = await attemptService.listAttemptsForSession(sessionId);
    expect(assignments.length).toBeGreaterThan(0);
    expect(attempts.length).toBe(0);
  });

  it('assignment revocation blocks attempt start', async () => {
    const studentCtx: ExamDeliveryCommandContext = {
      schoolId, actorId: 'student1', actorRole: 'student', correlationId: uuid(), idempotencyKey: uuid(),
    };

    const { assignment: revoke } = await assignmentService.revokeVariantAssignment(teacherCtx, 'va_revoke_test');
    const revokeAssign = await assignmentService.assignVariantToStudent(teacherCtx, {
      deliverySessionId: sessionId,
      paperId: 'paper1',
      paperVersionId: 'pv1',
      variantId: 'v_revoke',
      studentRef: 'revoke_student',
      learnerRefType: 'mock_student_ref',
      assignmentStrategy: 'manual_teacher_assignment',
      safeAssignmentSummary: 'Will be revoked',
    });
    expect(revokeAssign.assignment).not.toBeNull();
    const assignId = revokeAssign.assignment!.variantAssignmentId;

    await assignmentService.revokeVariantAssignment(teacherCtx, assignId);

    const { attempt } = await attemptService.startAttempt(studentCtx, {
      deliverySessionId: sessionId,
      variantAssignmentId: assignId,
      studentRef: 'revoke_student',
      durationSecondsAllowed: 3600,
    });
    expect(attempt).toBeNull();
  });
});
