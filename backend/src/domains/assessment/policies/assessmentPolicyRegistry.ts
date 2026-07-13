import { randomUUID } from 'crypto';
import type {
  AssessmentPolicyFamily,
  AssessmentPolicyDecision,
  AssessmentPolicyDefinition,
  AssessmentPolicyStatus,
} from '../contracts/assessmentPolicyContracts';
import { ASSESSMENT_POLICY_FAMILIES } from '../contracts/assessmentPolicyContracts';

const DEFAULT_BLOCKED: AssessmentPolicyStatus = 'MISSING';

export class AssessmentPolicyRegistry {
  private policies = new Map<string, AssessmentPolicyDefinition>();

  register(definition: AssessmentPolicyDefinition): void {
    this.policies.set(definition.family, definition);
  }

  resolve(family: AssessmentPolicyFamily): AssessmentPolicyDecision {
    const policy = this.policies.get(family);
    const now = new Date().toISOString();

    if (!policy) {
      return {
        decisionId: randomUUID(),
        policyFamily: family,
        status: 'MISSING',
        allowed: false,
        reasonCode: 'policy_missing',
        safeMessage: `Policy ${family} is not configured. Operation blocked.`,
        missingPolicyKeys: [family],
        requiredOwner: 'school_admin',
        blockedOperation: 'any',
        policyVersionRef: 'none',
        createdAt: now,
      };
    }

    if (policy.status === 'DISABLED' || policy.status === 'BLOCKED' || policy.status === 'DEFERRED') {
      return {
        decisionId: randomUUID(),
        policyFamily: family,
        status: policy.status,
        allowed: false,
        reasonCode: policy.reasonCode,
        safeMessage: policy.safeMessage,
        missingPolicyKeys: [],
        requiredOwner: policy.requiredOwner,
        blockedOperation: 'any',
        policyVersionRef: policy.policyVersionRef,
        createdAt: now,
      };
    }

    return {
      decisionId: randomUUID(),
      policyFamily: family,
      status: 'CONFIGURED',
      allowed: true,
      reasonCode: 'policy_configured',
      safeMessage: `Policy ${family} is configured and allowed.`,
      missingPolicyKeys: [],
      requiredOwner: policy.requiredOwner,
      blockedOperation: '',
      policyVersionRef: policy.policyVersionRef,
      createdAt: now,
    };
  }

  resolveRequired(families: AssessmentPolicyFamily[]): AssessmentPolicyDecision[] {
    return families.map(f => this.resolve(f));
  }

  assertAllAllowed(families: AssessmentPolicyFamily[]): {
    ok: boolean;
    decisions: AssessmentPolicyDecision[];
    blocked: AssessmentPolicyDecision[];
  } {
    const decisions = this.resolveRequired(families);
    const blocked = decisions.filter(d => !d.allowed);
    return { ok: blocked.length === 0, decisions, blocked };
  }

  reset(): void {
    this.policies.clear();
  }
}
