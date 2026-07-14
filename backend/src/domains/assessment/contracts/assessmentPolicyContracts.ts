export const ASSESSMENT_POLICY_FAMILIES = [
  'LEGAL_CONSENT_RETENTION',
  'CURRICULUM_CONTENT_AUTHORITY',
  'ROLE_APPROVAL_MODERATION',
  'QUESTION_TYPE_SCORING',
  'MASTERY_EVIDENCE_WEIGHTING',
  'AI_OCR_ELIGIBILITY',
  'SECURITY_EXPOSURE_LEAK_RESPONSE',
  'SLO_BACKUP_ROLLOUT',
  'FUTURE_EXTENSION_SCOPE',
  'USAGE_MODE',
  'PROJECTION',
  'FINALIZATION',
  'PARENT_RELEASE',
  'EXAM_BLUEPRINT_CREATION',
  'EXAM_BLUEPRINT_APPROVAL',
  'EXAM_DRAFT_GENERATION',
  'QUESTION_SELECTION',
] as const;

export type AssessmentPolicyFamily = typeof ASSESSMENT_POLICY_FAMILIES[number];

export type AssessmentPolicyStatus =
  | 'CONFIGURED'
  | 'MISSING'
  | 'DISABLED'
  | 'DEFERRED'
  | 'BLOCKED';

export interface AssessmentPolicyDecision {
  decisionId: string;
  policyFamily: AssessmentPolicyFamily;
  status: AssessmentPolicyStatus;
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  missingPolicyKeys: string[];
  requiredOwner: string;
  blockedOperation: string;
  policyVersionRef: string;
  createdAt: string;
}

export interface AssessmentPolicyDefinition {
  family: AssessmentPolicyFamily;
  status: AssessmentPolicyStatus;
  policyKeys: string[];
  requiredOwner: string;
  policyVersionRef: string;
  reasonCode: string;
  safeMessage: string;
}
