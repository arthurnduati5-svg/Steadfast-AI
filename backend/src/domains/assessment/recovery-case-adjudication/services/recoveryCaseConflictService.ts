import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseConflictOfInterestDeclaration, CreateConflictDeclarationInput } from '../contracts/recoveryCaseConflictContracts';
import type { RecoveryCaseConflictOfInterestDeclarationRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation, ADJUDICATION_FORBIDDEN_MUTATION_ROLES } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseConflictService {
  constructor(
    private conflictRepo: RecoveryCaseConflictOfInterestDeclarationRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createConflictDeclaration(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateConflictDeclarationInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const declaration = await this.conflictRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'conflict_declaration',
      entityId: declaration.conflictDeclarationId,
      action: 'create_conflict_declaration',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson, conflictType: input.conflictType, reviewerRole: input.reviewerRole },
    });

    return { success: true, status: 'ok', data: declaration, correlationId: ctx.correlationId };
  }

  async evaluateConflictDeclaration(declarationId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration>> {
    const declaration = await this.conflictRepo.getById(declarationId);
    if (!declaration) {
      return { success: false, status: 'not_found', message: 'Conflict declaration not found', errorCode: 'NOT_FOUND' };
    }

    if (declaration.conflictType === 'declared_personal_conflict') {
      const blocked = await this.conflictRepo.updateStatus(declarationId, 'blocked', ['declared_personal_conflict']);
      await this.auditRepo.create({
        schoolId: blocked.schoolId,
        entityType: 'conflict_declaration',
        entityId: declarationId,
        action: 'evaluate_conflict_declaration',
        actorId: '',
        actorRole: '',
        safeMetadata: { previousStatus: declaration.conflictStatus, newStatus: 'blocked', reason: 'declared_personal_conflict' },
      });
      return { success: true, status: 'ok', data: blocked };
    }

    if (ADJUDICATION_FORBIDDEN_MUTATION_ROLES.includes(declaration.reviewerRole)) {
      const blocked = await this.conflictRepo.updateStatus(declarationId, 'blocked', ['forbidden_reviewer_role']);
      await this.auditRepo.create({
        schoolId: blocked.schoolId,
        entityType: 'conflict_declaration',
        entityId: declarationId,
        action: 'evaluate_conflict_declaration',
        actorId: '',
        actorRole: '',
        safeMetadata: { previousStatus: declaration.conflictStatus, newStatus: 'blocked', reason: 'forbidden_reviewer_role', reviewerRole: declaration.reviewerRole },
      });
      return { success: true, status: 'ok', data: blocked };
    }

    const noConflict = await this.conflictRepo.updateStatus(declarationId, 'no_conflict');
    await this.auditRepo.create({
      schoolId: noConflict.schoolId,
      entityType: 'conflict_declaration',
      entityId: declarationId,
      action: 'evaluate_conflict_declaration',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: declaration.conflictStatus, newStatus: 'no_conflict' },
    });
    return { success: true, status: 'ok', data: noConflict };
  }

  async getConflictDeclaration(declarationId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration>> {
    const declaration = await this.conflictRepo.getById(declarationId);
    if (!declaration) {
      return { success: false, status: 'not_found', message: 'Conflict declaration not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: declaration };
  }

  async listConflictDeclarationsForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration[]>> {
    const items = await this.conflictRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listConflictDeclarationsByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration[]>> {
    const items = await this.conflictRepo.listByReviewer(schoolId, reviewerActorId);
    return { success: true, status: 'ok', data: items };
  }

  async listConflictDeclarationsByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration[]>> {
    const items = await this.conflictRepo.listByStatus(schoolId, status);
    return { success: true, status: 'ok', data: items };
  }

  async markNoConflict(declarationId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration>> {
    const declaration = await this.conflictRepo.updateStatus(declarationId, 'no_conflict');
    await this.auditRepo.create({
      schoolId: declaration.schoolId,
      entityType: 'conflict_declaration',
      entityId: declarationId,
      action: 'mark_no_conflict',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: declaration.conflictStatus },
    });
    return { success: true, status: 'ok', data: declaration };
  }

  async markHardConflict(declarationId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration>> {
    const declaration = await this.conflictRepo.updateStatus(declarationId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: declaration.schoolId,
      entityType: 'conflict_declaration',
      entityId: declarationId,
      action: 'mark_hard_conflict',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: declaration.conflictStatus },
    });
    return { success: true, status: 'ok', data: declaration };
  }

  async markNeedsAlternateReviewer(declarationId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration>> {
    const declaration = await this.conflictRepo.updateStatus(declarationId, 'needs_alternate_reviewer');
    await this.auditRepo.create({
      schoolId: declaration.schoolId,
      entityType: 'conflict_declaration',
      entityId: declarationId,
      action: 'mark_needs_alternate_reviewer',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: declaration.conflictStatus },
    });
    return { success: true, status: 'ok', data: declaration };
  }

  async voidConflictDeclaration(declarationId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConflictOfInterestDeclaration>> {
    const declaration = await this.conflictRepo.void(declarationId);
    await this.auditRepo.create({
      schoolId: declaration.schoolId,
      entityType: 'conflict_declaration',
      entityId: declarationId,
      action: 'void_conflict_declaration',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: declaration.conflictStatus },
    });
    return { success: true, status: 'ok', data: declaration };
  }
}
