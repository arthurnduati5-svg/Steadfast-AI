import { v4 as uuid } from 'uuid';
import {
  ExamVariantAssignment,
  ExamVariantAssignmentStatus,
  AssignmentStrategy,
  LearnerRefType,
} from '../contracts/examVariantAssignmentContracts';
import { ExamDeliveryCommandContext, ExamDeliveryPolicyDecision } from '../contracts/examDeliveryContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';
import { assertVariantAssignmentPolicy } from '../policies/examDeliveryPolicyDefinitions';

export class ExamVariantAssignmentService {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  async assignVariantToStudent(
    ctx: ExamDeliveryCommandContext,
    params: {
      deliverySessionId: string;
      paperId: string;
      paperVersionId: string;
      variantId: string;
      studentRef: string;
      learnerRefType: LearnerRefType;
      assignmentStrategy: AssignmentStrategy;
      safeAssignmentSummary: string;
    },
  ): Promise<{ assignment: ExamVariantAssignment | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertVariantAssignmentPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { assignment: null, policy };

    const session = await this.repos.sessionRepository.getById(params.deliverySessionId);
    if (!session || session.schoolId !== ctx.schoolId) {
      return { assignment: null, policy: { ...policy, allowed: false, reasonCode: 'SESSION_NOT_FOUND', safeMessage: 'Delivery session not found' } };
    }

    const eligibility = await this.validateAssignmentEligibility(ctx, params.deliverySessionId, params.studentRef);
    if (!eligibility.eligible) {
      return { assignment: null, policy: { ...policy, allowed: false, reasonCode: 'NOT_ELIGIBLE', safeMessage: eligibility.reason } };
    }

    const assignment = await this.repos.variantAssignmentRepository.create({
      variantAssignmentId: uuid(),
      schoolId: ctx.schoolId,
      deliverySessionId: params.deliverySessionId,
      paperId: params.paperId,
      paperVersionId: params.paperVersionId,
      variantId: params.variantId,
      studentRef: params.studentRef,
      learnerRefType: params.learnerRefType,
      assignmentStatus: 'assigned',
      assignmentStrategy: params.assignmentStrategy,
      assignedByActorId: ctx.actorId,
      assignedByRole: ctx.actorRole,
      safeAssignmentSummary: params.safeAssignmentSummary,
      revokedAt: null,
    });

    return { assignment, policy };
  }

  async bulkAssignVariants(
    ctx: ExamDeliveryCommandContext,
    params: {
      deliverySessionId: string;
      paperId: string;
      paperVersionId: string;
      assignments: Array<{
        variantId: string;
        studentRef: string;
        learnerRefType: LearnerRefType;
        assignmentStrategy: AssignmentStrategy;
        safeAssignmentSummary: string;
      }>;
    },
  ): Promise<{ assignments: ExamVariantAssignment[]; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertVariantAssignmentPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { assignments: [], policy };

    const results: ExamVariantAssignment[] = [];
    for (const a of params.assignments) {
      const assignment = await this.repos.variantAssignmentRepository.create({
        variantAssignmentId: uuid(),
        schoolId: ctx.schoolId,
        deliverySessionId: params.deliverySessionId,
        paperId: params.paperId,
        paperVersionId: params.paperVersionId,
        variantId: a.variantId,
        studentRef: a.studentRef,
        learnerRefType: a.learnerRefType,
        assignmentStatus: 'assigned',
        assignmentStrategy: a.assignmentStrategy,
        assignedByActorId: ctx.actorId,
        assignedByRole: ctx.actorRole,
        safeAssignmentSummary: a.safeAssignmentSummary,
        revokedAt: null,
      });
      results.push(assignment);
    }

    return { assignments: results, policy };
  }

  async revokeVariantAssignment(
    ctx: ExamDeliveryCommandContext,
    variantAssignmentId: string,
  ): Promise<{ assignment: ExamVariantAssignment | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertVariantAssignmentPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { assignment: null, policy };

    const existing = await this.repos.variantAssignmentRepository.getById(variantAssignmentId);
    if (!existing || existing.schoolId !== ctx.schoolId) {
      return { assignment: null, policy: { ...policy, allowed: false, reasonCode: 'NOT_FOUND', safeMessage: 'Assignment not found' } };
    }

    const now = new Date().toISOString();
    const assignment = await this.repos.variantAssignmentRepository.updateStatus(variantAssignmentId, 'revoked', now);
    return { assignment, policy };
  }

  async getAssignmentForStudent(
    deliverySessionId: string,
    studentRef: string,
  ): Promise<ExamVariantAssignment | null> {
    return this.repos.variantAssignmentRepository.getByDeliverySessionAndStudent(deliverySessionId, studentRef);
  }

  async listAssignmentsForSession(deliverySessionId: string): Promise<ExamVariantAssignment[]> {
    return this.repos.variantAssignmentRepository.listByDeliverySessionId(deliverySessionId);
  }

  async validateAssignmentEligibility(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
    studentRef: string,
  ): Promise<{ eligible: boolean; reason: string }> {
    const session = await this.repos.sessionRepository.getById(deliverySessionId);
    if (!session) return { eligible: false, reason: 'Session not found' };
    if (session.schoolId !== ctx.schoolId) return { eligible: false, reason: 'School mismatch' };
    if (session.status !== 'open' && session.status !== 'configured') {
      return { eligible: false, reason: `Session is ${session.status}, must be open or configured` };
    }
    const existing = await this.repos.variantAssignmentRepository.getByDeliverySessionAndStudent(deliverySessionId, studentRef);
    if (existing && existing.assignmentStatus !== 'revoked') {
      return { eligible: false, reason: 'Student already has an active assignment' };
    }
    return { eligible: true, reason: 'Eligible for assignment' };
  }
}
