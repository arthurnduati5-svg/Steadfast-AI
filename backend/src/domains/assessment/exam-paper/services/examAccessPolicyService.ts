import { randomUUID } from 'crypto';
import { ExamAccessPolicy, ExamAccessPolicyStatus, ExamAvailabilityMode } from '../contracts/examPaperAccessContracts';
import { ExamPaperCommandContext, ExamPaperPolicyDecision } from '../contracts/examPaperContracts';

const FORBIDDEN_ROLES = ['student', 'parent', 'guest', 'unknown'];

export class ExamAccessPolicyService {
  public validateContext(ctx: ExamPaperCommandContext): ExamPaperPolicyDecision {
    if (!ctx.schoolId) return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School ID required', blockedOperation: 'createAccessPolicy' };
    if (FORBIDDEN_ROLES.includes(ctx.actorRole)) return { allowed: false, reasonCode: 'ROLE_NOT_ALLOWED', safeMessage: `Role ${ctx.actorRole} cannot manage access policies`, blockedOperation: 'createAccessPolicy' };
    return { allowed: true, reasonCode: 'OK', safeMessage: 'Context validated', blockedOperation: '' };
  }

  public async createAccessPolicy(
    data: {
      schoolId: string;
      paperId: string;
      paperVersionId: string;
      intendedAudienceType: string;
      availabilityMode: ExamAvailabilityMode;
      requiresTeacherActivation: boolean;
      allowStudentSelfStart: boolean;
      allowRetake: boolean;
      maxAttempts: number;
      safePolicySummary: string;
      createdByActorId: string;
    },
  ): Promise<ExamAccessPolicy> {
    return {
      accessPolicyId: randomUUID(),
      ...data,
      status: 'draft' as ExamAccessPolicyStatus,
      classScopeRefsJson: null,
      roleScopeRefsJson: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public async validateAccessPolicy(policy: ExamAccessPolicy): Promise<string[]> {
    const warnings: string[] = [];
    if (!policy.intendedAudienceType) warnings.push('Intended audience type is not set');
    if (policy.maxAttempts < 1) warnings.push('maxAttempts must be at least 1');
    return warnings;
  }

  public async markAccessPolicyDeliveryReady(policy: ExamAccessPolicy): Promise<ExamAccessPolicy> {
    return { ...policy, status: 'delivery_ready' as ExamAccessPolicyStatus, updatedAt: new Date().toISOString() };
  }

  public async blockAccessPolicy(policy: ExamAccessPolicy): Promise<ExamAccessPolicy> {
    return { ...policy, status: 'blocked' as ExamAccessPolicyStatus, updatedAt: new Date().toISOString() };
  }

  public async getAccessPolicyForPaperVersion(paperVersionId: string, policies: ExamAccessPolicy[]): Promise<ExamAccessPolicy | null> {
    return policies.find((p) => p.paperVersionId === paperVersionId) || null;
  }
}
