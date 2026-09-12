// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Deen-Sensitive Data Boundary Service v1
// Protects Islamic/Deen-sensitive data from exposure.
// ─────────────────────────────────────────────────────────────

import type { TutorRole, DataCategory } from '../contracts/task020GovernanceContracts';

export interface DeenBoundaryRequest {
  role: TutorRole;
  schoolId: string;
  contentCategory: 'basic_curriculum' | 'advanced_source_sensitive' | 'private_religious_doubt' | 'unapproved_claim';
  targetAudience: 'learner_self' | 'teacher' | 'admin' | 'safeguarding';
  containsRawQuestion: boolean;
  context: Record<string, unknown>;
}

export interface DeenBoundaryDecision {
  allowed: boolean;
  requiresReferral: boolean;
  referralRole: TutorRole | null;
  exposureAllowed: 'full' | 'safe_category_only' | 'none';
  reasonCodes: string[];
  safeMetadata: Record<string, unknown>;
}

const REFERRAL_ROLES: Record<string, TutorRole> = {
  advanced_source_sensitive: 'safeguarding_officer',
  private_religious_doubt: 'safeguarding_officer',
  unapproved_claim: 'safeguarding_officer',
};

const EXPOSURE_BY_CATEGORY: Record<string, 'full' | 'safe_category_only' | 'none'> = {
  basic_curriculum: 'full',
  advanced_source_sensitive: 'safe_category_only',
  private_religious_doubt: 'none',
  unapproved_claim: 'none',
};

export class DeenSensitiveDataBoundaryService {
  checkBoundary(request: DeenBoundaryRequest): DeenBoundaryDecision {
    const reasons: string[] = [];

    if (!request.schoolId) {
      return {
        allowed: false,
        requiresReferral: false,
        referralRole: null,
        exposureAllowed: 'none',
        reasonCodes: ['missing-school-context-denied'],
        safeMetadata: { failClosed: true },
      };
    }

    const exposure = EXPOSURE_BY_CATEGORY[request.contentCategory] || 'none';
    const referralRole = REFERRAL_ROLES[request.contentCategory] || null;

    if (request.contentCategory === 'basic_curriculum') {
      return {
        allowed: true,
        requiresReferral: false,
        referralRole: null,
        exposureAllowed: 'full',
        reasonCodes: ['basic-curriculum-allowed'],
        safeMetadata: { contentCategory: request.contentCategory, audience: request.targetAudience },
      };
    }

    if (request.contentCategory === 'advanced_source_sensitive') {
      reasons.push('advanced-source-sensitive-requires-category-only');
      if (request.containsRawQuestion) {
        reasons.push('raw-question-not-exposed');
      }
      return {
        allowed: request.targetAudience === 'safeguarding',
        requiresReferral: request.targetAudience !== 'safeguarding',
        referralRole,
        exposureAllowed: 'safe_category_only',
        reasonCodes: reasons,
        safeMetadata: {
          contentCategory: request.contentCategory,
          audience: request.targetAudience,
          requiresReferral: request.targetAudience !== 'safeguarding',
        },
      };
    }

    if (request.contentCategory === 'private_religious_doubt') {
      reasons.push('private-religious-doubt-not-exposed-in-reports-diagnostics');
      return {
        allowed: false,
        requiresReferral: true,
        referralRole,
        exposureAllowed: 'none',
        reasonCodes: [...reasons, 'referral-required'],
        safeMetadata: {
          contentCategory: request.contentCategory,
          requiresReferral: true,
          referralRole,
        },
      };
    }

    if (request.contentCategory === 'unapproved_claim') {
      reasons.push('unapproved-religious-claim-not-stored-as-truth');
      return {
        allowed: false,
        requiresReferral: true,
        referralRole,
        exposureAllowed: 'none',
        reasonCodes: [...reasons, 'referral-required'],
        safeMetadata: {
          contentCategory: request.contentCategory,
          requiresReferral: true,
          referralRole,
        },
      };
    }

    return {
      allowed: false,
      requiresReferral: false,
      referralRole: null,
      exposureAllowed: 'none',
      reasonCodes: ['unknown-deen-category-denied'],
      safeMetadata: { failClosed: true },
    };
  }

  getExposureLevel(category: string): 'full' | 'safe_category_only' | 'none' {
    return EXPOSURE_BY_CATEGORY[category] || 'none';
  }
}

export const deenSensitiveDataBoundaryService = new DeenSensitiveDataBoundaryService();
