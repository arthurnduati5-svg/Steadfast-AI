// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 AI Egress Privacy Guard Service v1
// Verifies and minimizes data leaving the backend to any AI
// gateway/model.
// ─────────────────────────────────────────────────────────────

import type {
  AiEgressRequest,
  AiEgressDecision,
} from '../contracts/task020GovernanceContracts';

const TUTOR_MODE_POLICY: Record<string, {
  allowTeacherOnlyNotes: boolean;
  allowSafeguardingRaw: boolean;
  allowPrivateMemory: boolean;
  allowAnswerKeys: boolean;
  allowDeenSensitive: boolean;
  allowDiagnostics: boolean;
  allowSecrets: boolean;
}> = {
  socratic: {
    allowTeacherOnlyNotes: false,
    allowSafeguardingRaw: false,
    allowPrivateMemory: false,
    allowAnswerKeys: false,
    allowDeenSensitive: false,
    allowDiagnostics: false,
    allowSecrets: false,
  },
  practice: {
    allowTeacherOnlyNotes: false,
    allowSafeguardingRaw: false,
    allowPrivateMemory: false,
    allowAnswerKeys: false,
    allowDeenSensitive: false,
    allowDiagnostics: false,
    allowSecrets: false,
  },
  challenge: {
    allowTeacherOnlyNotes: false,
    allowSafeguardingRaw: false,
    allowPrivateMemory: false,
    allowAnswerKeys: false,
    allowDeenSensitive: false,
    allowDiagnostics: false,
    allowSecrets: false,
  },
  remediation: {
    allowTeacherOnlyNotes: false,
    allowSafeguardingRaw: false,
    allowPrivateMemory: true,
    allowAnswerKeys: false,
    allowDeenSensitive: false,
    allowDiagnostics: false,
    allowSecrets: false,
  },
  review: {
    allowTeacherOnlyNotes: false,
    allowSafeguardingRaw: false,
    allowPrivateMemory: true,
    allowAnswerKeys: true,
    allowDeenSensitive: false,
    allowDiagnostics: false,
    allowSecrets: false,
  },
  assessment: {
    allowTeacherOnlyNotes: false,
    allowSafeguardingRaw: false,
    allowPrivateMemory: false,
    allowAnswerKeys: true,
    allowDeenSensitive: false,
    allowDiagnostics: false,
    allowSecrets: false,
  },
};

export class AiEgressPrivacyGuardService {
  checkEgress(request: AiEgressRequest): AiEgressDecision {
    const reasons: string[] = [];
    const policy = TUTOR_MODE_POLICY[request.tutorMode];

    if (!policy) {
      return {
        allowed: false,
        sanitizedPayload: [],
        blockedReason: `Unknown tutor mode: ${request.tutorMode}`,
        redactionApplied: true,
        reasonCodes: ['unknown-tutor-mode-blocked'],
        privacyMetadata: { failClosed: true },
      };
    }

    const sanitized = [...request.payloadFields];
    const violations: string[] = [];

    if (request.containsTeacherOnlyNotes && !policy.allowTeacherOnlyNotes) {
      violations.push('teacher-only-notes-not-allowed');
      this.removeField(sanitized, 'teacherOnlyNotes');
    }
    if (request.containsSafeguardingRaw && !policy.allowSafeguardingRaw) {
      violations.push('safeguarding-raw-not-allowed');
      this.removeField(sanitized, 'safeguardingRaw');
    }
    if (request.containsPrivateMemory && !policy.allowPrivateMemory) {
      violations.push('private-memory-not-allowed');
      this.removeField(sanitized, 'privateMemory');
      this.removeField(sanitized, 'privateMemoryRaw');
    }
    if (request.containsAnswerKeys && !policy.allowAnswerKeys) {
      violations.push('answer-keys-not-allowed');
      this.removeField(sanitized, 'answerKey');
      this.removeField(sanitized, 'solutionSteps');
    }
    if (request.containsDeenSensitive && !policy.allowDeenSensitive) {
      violations.push('deen-sensitive-not-allowed');
      this.removeField(sanitized, 'deenSensitiveRaw');
    }
    if (request.containsDiagnostics && !policy.allowDiagnostics) {
      violations.push('diagnostics-not-allowed');
      this.removeField(sanitized, 'diagnostics');
    }
    if (request.containsSecrets && !policy.allowSecrets) {
      violations.push('secrets-not-allowed');
      this.removeField(sanitized, 'secret');
      this.removeField(sanitized, 'token');
    }

    const redactionApplied = violations.length > 0;

    if (violations.length > 0) {
      reasons.push(...violations);
      reasons.push('egress-fields-removed');
    }

    if (violations.length > 0 && sanitized.length === 0) {
      return {
        allowed: false,
        sanitizedPayload: [],
        blockedReason: 'All payload fields were blocked by egress policy',
        redactionApplied: true,
        reasonCodes: reasons,
        privacyMetadata: {
          tutorMode: request.tutorMode,
          violations,
          blockedReason: 'all-fields-blocked',
        },
      };
    }

    reasons.push('egress-allowed');

    return {
      allowed: true,
      sanitizedPayload: sanitized,
      blockedReason: redactionApplied ? 'Some fields removed. See redactionApplied.' : undefined,
      redactionApplied,
      reasonCodes: reasons,
      privacyMetadata: {
        tutorMode: request.tutorMode,
        violations: violations.length > 0 ? violations : undefined,
        originalFieldCount: request.payloadFields.length,
        sanitizedFieldCount: sanitized.length,
      },
    };
  }

  isTutorModeSafeFor(modeType: string, field: string): boolean {
    const policy = TUTOR_MODE_POLICY[modeType];
    if (!policy) return false;
    switch (field) {
      case 'teacherOnlyNotes': return policy.allowTeacherOnlyNotes;
      case 'safeguardingRaw': return policy.allowSafeguardingRaw;
      case 'privateMemory':
      case 'privateMemoryRaw': return policy.allowPrivateMemory;
      case 'answerKey':
      case 'solutionSteps': return policy.allowAnswerKeys;
      case 'deenSensitiveRaw': return policy.allowDeenSensitive;
      case 'diagnostics': return policy.allowDiagnostics;
      case 'secret':
      case 'token': return policy.allowSecrets;
      default: return true;
    }
  }

  private removeField(fields: string[], field: string): void {
    const idx = fields.indexOf(field);
    if (idx >= 0) fields.splice(idx, 1);
  }

  getTutorModes(): string[] {
    return Object.keys(TUTOR_MODE_POLICY);
  }
}

export const aiEgressPrivacyGuardService = new AiEgressPrivacyGuardService();
