export type SafetyRiskCategory =
  | 'none'
  | 'self_harm'
  | 'suicidal_intent'
  | 'abuse'
  | 'exploitation'
  | 'grooming'
  | 'credible_threat'
  | 'violence'
  | 'severe_crisis'
  | 'normal_learning_frustration'
  | 'unknown';

export type SafetyRiskLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface SafetyPolicyInput {
  requestId: string;
  messageText: string;
  learnerAge?: number;
  learnerGrade?: string;
}

export interface SafetyPolicyResult {
  riskCategory: SafetyRiskCategory;
  riskLevel: SafetyRiskLevel;
  seriousRisk: boolean;
  safeguardingCandidate: boolean;
  continueTutoringAllowed: boolean;
  safeStudentMessage?: string;
  reasons: string[];
}
