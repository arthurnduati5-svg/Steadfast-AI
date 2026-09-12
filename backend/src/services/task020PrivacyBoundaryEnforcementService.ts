// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Privacy Boundary Enforcement Service v1
// Applies field-level and response-level privacy filtering.
// ─────────────────────────────────────────────────────────────

import type {
  TutorRole,
  DataCategory,
  AccessAction,
  PrivacyBoundaryRequest,
  PrivacyBoundaryDecision,
} from '../contracts/task020GovernanceContracts';

const ALWAYS_REDACT_FIELDS = new Set([
  'rawChat', 'rawMessage', 'rawTranscript', 'rawPrompt',
  'systemPrompt', 'developerPrompt', 'modelDraft', 'providerResponse',
  'privateMemory', 'teacherOnlyNotes', 'safeguardingRaw',
  'deenSensitiveRawQuestion', 'answerKey', 'solutionSteps',
  'internalScoring', 'stackTrace', 'secret', 'token',
  'connectionString', 'authorizationHeader', 'cookie',
  'rawAiResponse', 'rawLearnerMemory', 'safetyExcerpt',
  'rawArtifactContent', 'rawVideoTranscript',
]);

const CATEGORY_SAFE_FIELDS: Record<string, string[]> = {
  tutor_session_state: ['id', 'status', 'currentMode', 'subject', 'topic', 'skillTag', 'supportLevel', 'difficultyLevel'],
  teacher_safe_summary: ['summaryId', 'studentId', 'subject', 'topic', 'masteryTrend', 'safeEvidenceCount', 'suggestedNextAction', 'safeMisconceptionCategory', 'teacherHelpRecommendation', 'createdAt'],
  practice_attempt: ['id', 'subject', 'topic', 'outcome', 'attemptNumber', 'hintsRequested', 'timeSpentSeconds', 'createdAt'],
  mastery_snapshot: ['id', 'subject', 'topic', 'skillId', 'skillLabel', 'level', 'confidenceScore', 'evidenceCount', 'lastAttemptAt'],
  safe_memory_summary: ['id', 'kind', 'summary', 'confidenceScore', 'lastObservedAt'],
  learning_evidence: ['id', 'kind', 'subject', 'topic', 'outcomeSummary', 'createdAt'],
};

export class PrivacyBoundaryEnforcementService {
  enforcePrivacy(request: PrivacyBoundaryRequest): PrivacyBoundaryDecision {
    const reasons: string[] = [];
    const safeFields: string[] = [];
    const removedFields: string[] = [];

    if (request.role === 'unknown') {
      return {
        allowed: false,
        blocked: true,
        redactionApplied: true,
        safeFields: [],
        removedFields: request.payloadFields,
        reasonCodes: ['unknown-role-blocked'],
        privacyMetadata: { failClosed: true },
      };
    }

    for (const field of request.payloadFields) {
      if (ALWAYS_REDACT_FIELDS.has(field)) {
        removedFields.push(field);
        reasons.push(`redacted:${field}`);
        continue;
      }

      const safeFieldsForCategory = CATEGORY_SAFE_FIELDS[request.resourceCategory];
      if (safeFieldsForCategory && !safeFieldsForCategory.includes(field)) {
        if (this.isFieldRestrictedByRole(field, request.role)) {
          removedFields.push(field);
          reasons.push(`role-restricted:${field}`);
          continue;
        }
      }

      safeFields.push(field);
    }

    const redactionApplied = removedFields.length > 0;
    const allowed = !redactionApplied || safeFields.length > 0;

    return {
      allowed,
      blocked: !allowed && redactionApplied,
      redactionApplied,
      safeFields,
      removedFields,
      reasonCodes: reasons.length > 0 ? reasons : ['all-fields-safe'],
      privacyMetadata: {
        role: request.role,
        category: request.resourceCategory,
        action: request.action,
        totalFields: request.payloadFields.length,
        safeFieldCount: safeFields.length,
        removedFieldCount: removedFields.length,
      },
    };
  }

  filterResponseByRole<T extends Record<string, unknown>>(
    payload: T,
    role: TutorRole,
    category: DataCategory,
  ): Partial<T> {
    const safeFieldsForCategory = CATEGORY_SAFE_FIELDS[category] || Object.keys(payload);
    const filtered: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (ALWAYS_REDACT_FIELDS.has(key)) continue;
      if (!safeFieldsForCategory.includes(key)) continue;
      filtered[key] = value;
    }

    return filtered as Partial<T>;
  }

  downgradeToSafeSummary(raw: Record<string, unknown>, category: DataCategory): Record<string, unknown> {
    const safeFieldsForCategory = CATEGORY_SAFE_FIELDS[category];
    if (!safeFieldsForCategory) {
      return { safeSummary: '[Safe summary available]', originalCategory: category };
    }
    const result: Record<string, unknown> = {};
    for (const field of safeFieldsForCategory) {
      if (field in raw) {
        result[field] = raw[field];
      }
    }
    return result;
  }

  private isFieldRestrictedByRole(field: string, role: TutorRole): boolean {
    if (role === 'teacher') {
      const teacherRestricted = ['privateMemory', 'teacherOnlyNotes', 'safeguardingRaw', 'deenSensitiveRawQuestion'];
      return teacherRestricted.includes(field);
    }
    if (role === 'learner') {
      const learnerRestricted = ['teacherOnlyNotes', 'internalScoring', 'stackTrace'];
      return learnerRestricted.includes(field);
    }
    return false;
  }

  getRedactedFieldList(): string[] {
    return Array.from(ALWAYS_REDACT_FIELDS);
  }
}

export const privacyBoundaryEnforcementService = new PrivacyBoundaryEnforcementService();
