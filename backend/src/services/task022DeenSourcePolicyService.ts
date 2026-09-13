import type {
  Task022DeenSourcePolicyDecision,
} from '../contracts/task022CurriculumGovernanceContracts';

export class DeenSourcePolicyService {
  decideDeenSourcePolicy(request: {
    sourceType: string;
    curriculumFamily: string;
    deenCategory?: string;
    approvalStatus: string;
    visibilityScope: string;
  }): Task022DeenSourcePolicyDecision {
    const reasons: string[] = [];

    if (this.blockUnapprovedDeenSource(request.sourceType, request.approvalStatus)) {
      reasons.push('unapproved-deen-source-blocked');
      return this.buildDeenSourcePolicyDecision({
        deenCategory: request.deenCategory,
        approvalStatus: request.approvalStatus,
        referralRequired: false,
        safeNotes: 'This source is not approved for Deen content use.',
        reasonCodes: reasons,
      });
    }

    if (this.isApprovedDeenSource(request.sourceType, request.approvalStatus, request.deenCategory)) {
      reasons.push('approved-deen-source');
      return this.buildDeenSourcePolicyDecision({
        deenCategory: request.deenCategory,
        approvalStatus: request.approvalStatus,
        referralRequired: false,
        safeNotes: 'Approved Deen source may be used in curriculum context.',
        reasonCodes: reasons,
      });
    }

    if (this.requiresDeenReview(request.sourceType, request.curriculumFamily, request.deenCategory)) {
      reasons.push('deen-review-required');
      return this.buildDeenSourcePolicyDecision({
        deenCategory: request.deenCategory,
        approvalStatus: request.approvalStatus,
        referralRequired: true,
        referralRole: 'deen_reviewer',
        safeNotes: 'This source requires Deen review before use.',
        reasonCodes: reasons,
      });
    }

    if (this.requiresScholarReferral(request.deenCategory)) {
      reasons.push('deen-scholar-referral-required');
      return this.buildDeenSourcePolicyDecision({
        deenCategory: request.deenCategory,
        approvalStatus: request.approvalStatus,
        referralRequired: true,
        referralRole: 'teacher',
        safeNotes: 'Deen-sensitive content requires scholar or teacher referral.',
        reasonCodes: reasons,
      });
    }

    reasons.push('deen-source-policy-default');
    return this.buildDeenSourcePolicyDecision({
      deenCategory: request.deenCategory,
      approvalStatus: request.approvalStatus,
      referralRequired: false,
      safeNotes: 'Source cleared under Deen source policy.',
      reasonCodes: reasons,
    });
  }

  isApprovedDeenSource(sourceType: string, approvalStatus: string, deenCategory?: string): boolean {
    if (approvalStatus !== 'approved') {
      return false;
    }
    const deenSourceTypes = ['approved_islamic_reference', 'madrasa_text', 'school_approved_material'];
    if (!deenSourceTypes.includes(sourceType)) {
      return false;
    }
    if (deenCategory && deenCategory === 'private') {
      return false;
    }
    return true;
  }

  requiresDeenReview(sourceType: string, curriculumFamily: string, deenCategory?: string): boolean {
    if (curriculumFamily !== 'madrasa_deen') {
      return false;
    }
    const reviewTypes = ['teacher_note', 'external_link_reference', 'lesson_plan'];
    if (!reviewTypes.includes(sourceType)) {
      return false;
    }
    if (deenCategory === 'advanced_source_sensitive' || deenCategory === 'sectarian_sensitive') {
      return true;
    }
    return false;
  }

  requiresScholarReferral(deenCategory?: string, text?: string): boolean {
    if (!deenCategory) {
      return false;
    }
    const referralCategories = ['fiqh_like', 'sectarian_sensitive', 'advanced_source_sensitive', 'private_doubt'];
    return referralCategories.includes(deenCategory);
  }

  buildDeenSourceSafeNotice(decision: Task022DeenSourcePolicyDecision): string {
    if (decision.referralRequired && decision.referralRole) {
      return `[Deen Source Safe Notice] ${decision.safeNotes ?? ''} Referral role: ${decision.referralRole}. Reason codes: ${decision.reasonCodes.join(', ')}.`;
    }
    return `[Deen Source Safe Notice] ${decision.safeNotes ?? ''} Reason codes: ${decision.reasonCodes.join(', ')}.`;
  }

  blockUnapprovedDeenSource(sourceType: string, approvalStatus: string): boolean {
    const deenOnlyTypes = ['approved_islamic_reference', 'madrasa_text'];
    if (!deenOnlyTypes.includes(sourceType)) {
      return false;
    }
    return approvalStatus !== 'approved';
  }

  buildDeenSourcePolicyDecision(params: {
    deenCategory?: string;
    approvalStatus: string;
    referralRequired: boolean;
    referralRole?: string;
    safeNotes?: string;
    reasonCodes: string[];
  }): Task022DeenSourcePolicyDecision {
    return {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sourceId: '',
      deenCategory: params.deenCategory,
      approvalStatus: params.approvalStatus,
      referralRequired: params.referralRequired,
      referralRole: params.referralRole,
      safeNotes: params.safeNotes,
      reasonCodes: params.reasonCodes,
      createdAt: new Date().toISOString(),
    };
  }
}

export const deenSourcePolicyService = new DeenSourcePolicyService();
