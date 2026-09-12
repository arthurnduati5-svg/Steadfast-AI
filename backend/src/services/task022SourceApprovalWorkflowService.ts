import type { ApprovedSource } from './task022ContentGovernanceContracts';
import { approvedSourceRegistryService } from './task022ApprovedSourceRegistryService';

export type ActorRole = 'learner' | 'teacher' | 'school_admin' | 'system_admin' | 'internal_operator' | 'safeguarding_officer' | 'deen_reviewer' | 'unknown';

export interface ApprovalDecision {
  approved: boolean;
  reasonCodes: string[];
  requiresReferral: boolean;
  referralRole?: ActorRole;
}

/**
 * R8-G.3A-D2: approval/referral/role policy is UNCHANGED. Canonical state
 * mutation moves to the durable async registry methods; the legacy sync
 * registry methods remain only as explicit test compatibility.
 */
export class SourceApprovalWorkflowService {
  isApprovalAllowed(actorRole: ActorRole, source: ApprovedSource): ApprovalDecision {
    const reasons: string[] = [];
    let requiresReferral = false;
    let referralRole: ActorRole | undefined;

    if (actorRole === 'learner') {
      return { approved: false, reasonCodes: ['learner-cannot-approve-source'], requiresReferral: false };
    }

    if (actorRole === 'unknown') {
      return { approved: false, reasonCodes: ['unknown-role-cannot-approve'], requiresReferral: false };
    }

    if (source.curriculumFamily === 'madrasa_deen' || source.deenCategory) {
      if (actorRole === 'teacher') {
        requiresReferral = true;
        referralRole = 'deen_reviewer';
        reasons.push('deen-sensitive-source-requires-scholar-review');
      }
      if (actorRole === 'school_admin') {
        requiresReferral = true;
        referralRole = 'deen_reviewer';
        reasons.push('deen-sensitive-source-requires-scholar-review');
      }
      if (actorRole === 'deen_reviewer') {
        reasons.push('deen-reviewer-can-approve');
      }
    }

    if (actorRole === 'teacher') {
      if (!source.schoolId) {
        reasons.push('teacher-can-only-propose-for-their-school');
      }
      reasons.push('teacher-proposed-source');
    }

    if (actorRole === 'school_admin' && source.curriculumFamily === 'cambridge_academic') {
      if (!source.schoolId) {
        reasons.push('school-admin-source-must-be-school-scoped');
      }
      reasons.push('school-admin-can-approve-academic');
    }

    if (actorRole === 'system_admin' || actorRole === 'internal_operator') {
      reasons.push('system-admin-can-approve');
    }

    const approved = !requiresReferral;
    return { approved, reasonCodes: reasons, requiresReferral, referralRole };
  }

  proposeSource(source: ApprovedSource, actorRole: ActorRole): ApprovalDecision {
    const decision = this.isApprovalAllowed(actorRole, source);

    if (actorRole === 'teacher') {
      source.approvalStatus = 'teacher_proposed';
      source.approvedByRole = 'teacher';
    } else if (actorRole === 'school_admin') {
      source.approvalStatus = 'school_proposed';
      source.approvedByRole = 'school_admin';
    } else if (actorRole === 'system_admin' || actorRole === 'internal_operator') {
      source.approvalStatus = 'approved';
      source.approvedByRole = actorRole;
    }

    approvedSourceRegistryService.registerSource(source);
    return decision;
  }

  /**
   * Durable proposal: same role/status semantics as proposeSource, mutating
   * durable canonical state instead of the process-local Map.
   */
  async proposeSourceDurable(source: ApprovedSource, actorRole: ActorRole): Promise<ApprovalDecision> {
    const decision = this.isApprovalAllowed(actorRole, source);

    if (actorRole === 'teacher') {
      source.approvalStatus = 'teacher_proposed';
      source.approvedByRole = 'teacher';
    } else if (actorRole === 'school_admin') {
      source.approvalStatus = 'school_proposed';
      source.approvedByRole = 'school_admin';
    } else if (actorRole === 'system_admin' || actorRole === 'internal_operator') {
      source.approvalStatus = 'approved';
      source.approvedByRole = actorRole;
    }

    await approvedSourceRegistryService.registerSourceDurable(source);
    return decision;
  }

  approveSource(sourceId: string, actorRole: ActorRole): boolean {
    const source = approvedSourceRegistryService.getSource(sourceId);
    if (!source) return false;

    const decision = this.isApprovalAllowed(actorRole, source);
    if (!decision.approved && decision.requiresReferral) {
      source.approvalStatus = 'pending_review';
      return false;
    }

    if (!decision.approved) return false;

    source.approvalStatus = 'approved';
    source.approvedByRole = actorRole;
    source.approvedAt = new Date().toISOString();
    return true;
  }

  rejectSource(sourceId: string, actorRole: ActorRole): boolean {
    if (actorRole === 'learner' || actorRole === 'unknown') return false;
    const source = approvedSourceRegistryService.getSource(sourceId);
    if (!source) return false;
    source.approvalStatus = 'rejected';
    source.approvedByRole = actorRole;
    return true;
  }

  blockSource(sourceId: string, actorRole: ActorRole): boolean {
    if (actorRole === 'learner' || actorRole === 'unknown' || actorRole === 'teacher') return false;
    const source = approvedSourceRegistryService.getSource(sourceId);
    if (!source) return false;
    source.approvalStatus = 'blocked';
    source.approvedByRole = actorRole;
    return true;
  }

  // ─── Durable async production API (R8-G.3A-D2) ─────────────────────────────

  /**
   * Durable approval decision. Reads durable truth (fail closed on unknown /
   * dependency failure), applies the unchanged approval policy, and persists
   * the transition through the durable registry.
   */
  async approveSourceDurable(sourceId: string, actorRole: ActorRole): Promise<ApprovedSource | null> {
    const source = await approvedSourceRegistryService.getSourceDurable(sourceId);
    if (!source) return null;

    const decision = this.isApprovalAllowed(actorRole, source);
    if (!decision.approved && decision.requiresReferral) {
      await approvedSourceRegistryService.setSourceStatusDurable(sourceId, 'pending_review', undefined, actorRole);
      return null;
    }

    if (!decision.approved) return null;

    return approvedSourceRegistryService.setSourceStatusDurable(sourceId, 'approved', undefined, actorRole);
  }

  async rejectSourceDurable(sourceId: string, actorRole: ActorRole): Promise<ApprovedSource | null> {
    if (actorRole === 'learner' || actorRole === 'unknown') return null;
    const source = await approvedSourceRegistryService.getSourceDurable(sourceId);
    if (!source) return null;
    return approvedSourceRegistryService.setSourceStatusDurable(sourceId, 'rejected', undefined, actorRole);
  }

  async blockSourceDurable(sourceId: string, actorRole: ActorRole): Promise<ApprovedSource | null> {
    if (actorRole === 'learner' || actorRole === 'unknown' || actorRole === 'teacher') return null;
    const source = await approvedSourceRegistryService.getSourceDurable(sourceId);
    if (!source) return null;
    return approvedSourceRegistryService.setSourceStatusDurable(sourceId, 'blocked', undefined, actorRole);
  }
}

export const sourceApprovalWorkflowService = new SourceApprovalWorkflowService();
