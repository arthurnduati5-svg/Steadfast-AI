// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Safeguarding Access Separation Service v1
// Separates ordinary learning privacy from serious-risk
// safeguarding access.
// ─────────────────────────────────────────────────────────────

import type { TutorRole } from '../contracts/task020GovernanceContracts';

export type SafeguardingTrigger =
  // Serious risk only
  | 'self_harm'
  | 'suicidal_intent'
  | 'abuse'
  | 'exploitation'
  | 'grooming'
  | 'credible_threat'
  | 'violence'
  | 'severe_crisis'
  // NOT safeguarding
  | 'wrong_answer'
  | 'low_grade'
  | 'confusion'
  | 'ordinary_frustration'
  | 'boredom'
  | 'religious_question'
  | 'doubt_without_safety_risk'
  | 'different_opinion'
  | 'repeated_mistake'
  | 'academic_weakness';

export interface SafeguardingAccessRequest {
  triggerType: SafeguardingTrigger;
  role: TutorRole;
  schoolId: string;
  studentId?: string;
  context: Record<string, unknown>;
}

export interface SafeguardingAccessDecision {
  isSeriousRisk: boolean;
  safeguardingAccessRequired: boolean;
  authorizedRoles: TutorRole[];
  reasonCodes: string[];
  safeMetadata: Record<string, unknown>;
}

const SERIOUS_RISK_TRIGGERS: Set<SafeguardingTrigger> = new Set([
  'self_harm',
  'suicidal_intent',
  'abuse',
  'exploitation',
  'grooming',
  'credible_threat',
  'violence',
  'severe_crisis',
]);

const NOT_SAFEGUARDING_TRIGGERS: Set<SafeguardingTrigger> = new Set([
  'wrong_answer',
  'low_grade',
  'confusion',
  'ordinary_frustration',
  'boredom',
  'religious_question',
  'doubt_without_safety_risk',
  'different_opinion',
  'repeated_mistake',
  'academic_weakness',
]);

const SAFEGUARDING_AUTHORIZED_ROLES: TutorRole[] = [
  'safeguarding_officer',
  'system_admin',
];

export class SafeguardingAccessSeparationService {
  checkAccess(request: SafeguardingAccessRequest): SafeguardingAccessDecision {
    const reasons: string[] = [];

    const isSeriousRisk = SERIOUS_RISK_TRIGGERS.has(request.triggerType);
    const isNotSafeguarding = NOT_SAFEGUARDING_TRIGGERS.has(request.triggerType);

    if (isNotSafeguarding) {
      return {
        isSeriousRisk: false,
        safeguardingAccessRequired: false,
        authorizedRoles: [],
        reasonCodes: ['not-safeguarding-trigger', `academic-behavior:${request.triggerType}`],
        safeMetadata: {
          triggerType: request.triggerType,
          classification: 'academic_not_safeguarding',
        },
      };
    }

    if (!isSeriousRisk) {
      return {
        isSeriousRisk: false,
        safeguardingAccessRequired: false,
        authorizedRoles: [],
        reasonCodes: ['unknown-trigger-not-safeguarding'],
        safeMetadata: {
          triggerType: request.triggerType,
          classification: 'unknown_not_safeguarding',
        },
      };
    }

    if (isSeriousRisk) {
      reasons.push('serious-risk-identified');
      reasons.push(`trigger:${request.triggerType}`);

      if (!SAFEGUARDING_AUTHORIZED_ROLES.includes(request.role)) {
        return {
          isSeriousRisk: true,
          safeguardingAccessRequired: true,
          authorizedRoles: SAFEGUARDING_AUTHORIZED_ROLES,
          reasonCodes: [...reasons, 'role-not-authorized-escalate'],
          safeMetadata: {
            triggerType: request.triggerType,
            classification: 'serious_risk_role_denied',
            currentRole: request.role,
            requiresEscalation: true,
          },
        };
      }

      return {
        isSeriousRisk: true,
        safeguardingAccessRequired: true,
        authorizedRoles: SAFEGUARDING_AUTHORIZED_ROLES,
        reasonCodes: [...reasons, 'access-granted-safeguarding-role'],
        safeMetadata: {
          triggerType: request.triggerType,
          classification: 'serious_risk_access_granted',
          currentRole: request.role,
        },
      };
    }

    return {
      isSeriousRisk: false,
      safeguardingAccessRequired: false,
      authorizedRoles: [],
      reasonCodes: ['default-no-safeguarding-access'],
      safeMetadata: { classification: 'default_denied' },
    };
  }

  isSeriousRisk(trigger: SafeguardingTrigger): boolean {
    return SERIOUS_RISK_TRIGGERS.has(trigger);
  }

  isNotSafeguarding(trigger: SafeguardingTrigger): boolean {
    return NOT_SAFEGUARDING_TRIGGERS.has(trigger);
  }

  getSeriousRiskTriggers(): SafeguardingTrigger[] {
    return Array.from(SERIOUS_RISK_TRIGGERS);
  }

  getNotSafeguardingTriggers(): SafeguardingTrigger[] {
    return Array.from(NOT_SAFEGUARDING_TRIGGERS);
  }

  getAuthorizedRoles(): TutorRole[] {
    return [...SAFEGUARDING_AUTHORIZED_ROLES];
  }
}

export const safeguardingAccessSeparationService = new SafeguardingAccessSeparationService();
