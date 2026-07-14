import { randomUUID } from 'crypto';
import type { ResultReleaseBoundaryRepository, ResultReleaseReadinessRepository } from '../contracts/resultGovernanceRepositoryContracts';
import type { ResultReleaseBoundary } from '../contracts/resultGovernanceRepositoryContracts';
import { FORBIDDEN_FIELDS_STUDENT, FORBIDDEN_FIELDS_PARENT } from '../contracts/index';
import { ResultGovernancePolicyRegistry, isAllowedMutationRole } from '../policies/resultGovernancePolicyDefinitions';

export class ResultReleaseBoundaryService {
  constructor(
    private boundaryRepo: ResultReleaseBoundaryRepository,
    private readinessRepo: ResultReleaseReadinessRepository,
    private policyRegistry: ResultGovernancePolicyRegistry,
  ) {}

  async createReleaseBoundary(params: {
    schoolId: string;
    resultReleaseReadinessId: string;
    resultFinalizationDecisionId?: string;
    audienceType: string;
    safeBoundarySummary: string;
    allowedFields?: string[];
    blockedFields?: string[];
    redactionRules?: Record<string, unknown>;
    actorId: string;
    actorRole: string;
  }): Promise<ResultReleaseBoundary> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!isAllowedMutationRole(params.actorRole)) throw new Error(`FORBIDDEN: role ${params.actorRole} cannot create release boundaries`);
    const policy = this.policyRegistry.checkPolicy('RESULT_RELEASE_BOUNDARY', params.actorRole);
    if (!policy.allowed) throw new Error(`POLICY_BLOCKED: ${policy.safeMessage}`);

    const readiness = await this.readinessRepo.getById(params.resultReleaseReadinessId);
    if (!readiness) throw new Error('NOT_FOUND: release readiness not found');

    const allowedFields = params.allowedFields || ['studentRef', 'safeStatusSummary', 'releaseReadinessStatus'];
    const blockedFields = params.blockedFields || this.getDefaultBlockedFields(params.audienceType);

    const boundary: ResultReleaseBoundary = {
      resultReleaseBoundaryId: randomUUID(),
      schoolId: params.schoolId,
      resultReleaseReadinessId: params.resultReleaseReadinessId,
      resultFinalizationDecisionId: params.resultFinalizationDecisionId || readiness.resultFinalizationDecisionId,
      audienceType: params.audienceType || 'student',
      boundaryStatus: 'draft',
      allowedFieldsJson: { fields: allowedFields },
      blockedFieldsJson: { fields: blockedFields },
      redactionRulesJson: params.redactionRules || undefined,
      safeBoundarySummary: params.safeBoundarySummary,
      createdByActorId: params.actorId,
      createdByRole: params.actorRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.boundaryRepo.create(boundary);
  }

  private getDefaultBlockedFields(audienceType: string): string[] {
    if (audienceType === 'student') return [...FORBIDDEN_FIELDS_STUDENT] as string[];
    if (audienceType === 'parent_boundary_only') return [...FORBIDDEN_FIELDS_PARENT] as string[];
    if (audienceType === 'teacher') return [];
    if (audienceType === 'admin') return [];
    return [...FORBIDDEN_FIELDS_STUDENT] as string[];
  }

  async activateReleaseBoundary(boundaryId: string, actorRole: string): Promise<ResultReleaseBoundary | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot activate boundaries`);
    return this.boundaryRepo.updateStatus(boundaryId, 'active');
  }

  async blockReleaseBoundary(boundaryId: string, actorRole: string): Promise<ResultReleaseBoundary | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot block boundaries`);
    return this.boundaryRepo.updateStatus(boundaryId, 'blocked');
  }

  async voidReleaseBoundary(boundaryId: string, actorRole: string): Promise<ResultReleaseBoundary | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot void boundaries`);
    return this.boundaryRepo.voidBoundary(boundaryId, new Date().toISOString());
  }

  async getReleaseBoundary(boundaryId: string): Promise<ResultReleaseBoundary | null> {
    return this.boundaryRepo.getById(boundaryId);
  }

  async listBoundariesForReadiness(readinessId: string): Promise<ResultReleaseBoundary[]> {
    return this.boundaryRepo.listByReadiness(readinessId);
  }

  buildStudentBoundary(projection: Record<string, unknown>): Record<string, unknown> {
    const blocked = [...FORBIDDEN_FIELDS_STUDENT];
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(projection)) {
      if (!blocked.includes(key as any)) {
        result[key] = value;
      }
    }
    return result;
  }

  buildTeacherBoundary(projection: Record<string, unknown>): Record<string, unknown> {
    return { ...projection };
  }

  buildAdminBoundary(projection: Record<string, unknown>): Record<string, unknown> {
    return { ...projection };
  }

  buildParentBoundaryOnly(projection: Record<string, unknown>): Record<string, unknown> {
    const blocked = [...FORBIDDEN_FIELDS_PARENT];
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(projection)) {
      if (!blocked.includes(key as any)) {
        result[key] = value;
      }
    }
    return result;
  }
}
