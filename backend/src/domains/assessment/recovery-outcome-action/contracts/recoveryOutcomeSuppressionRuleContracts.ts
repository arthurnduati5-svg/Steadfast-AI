import { RecoveryOutcomeActionSafeEnvelope } from './recoveryOutcomeActionContracts';

export type SuppressionRuleStatus = 'active' | 'suppressed' | 'blocked' | 'voided';

export interface RecoveryOutcomeSuppressionRule {
  suppressionRuleId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  ruleStatus: SuppressionRuleStatus;
  safeRuleSummary: string;
  ruleConditionsJson: Record<string, unknown>;
  ruleScopeJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  activatedForFutureUseAt?: Date;
  suppressedAt?: Date;
  blockedAt?: Date;
  voidedAt?: Date;
}

export interface CreateSuppressionRuleRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  safeRuleSummary: string;
  ruleConditionsJson: Record<string, unknown>;
  ruleScopeJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export type SuppressionRuleResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>;
