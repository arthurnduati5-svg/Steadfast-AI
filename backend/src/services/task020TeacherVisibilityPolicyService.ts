// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Teacher Visibility Policy Service v1
// Hardens and proves teacher-safe reporting boundary.
// ─────────────────────────────────────────────────────────────

import type { DataCategory } from '../contracts/task020GovernanceContracts';

export interface TeacherVisibilityRequest {
  schoolId: string;
  classId?: string;
  studentId?: string;
  resourceCategory: DataCategory;
  requestedFields: string[];
}

export interface TeacherVisibilityDecision {
  allowed: boolean;
  safeSummaryOnly: boolean;
  blockedReasons: string[];
  safeFields: string[];
  blockedFields: string[];
  privacyMetadata: Record<string, unknown>;
}

const TEACHER_SAFE_CATEGORIES: DataCategory[] = [
  'teacher_safe_summary',
  'practice_attempt',
  'mastery_snapshot',
  'learning_evidence',
  'revision_item',
  'spaced_review_item',
  'safe_memory_summary',
  'tutor_session_state',
  'challenge_record',
  'remediation_path',
  'difficulty_calibration',
  'class_roster_scope',
  'school_identity',
];

const TEACHER_FORBIDDEN_FIELDS = new Set([
  'rawChat', 'rawMessage', 'rawTranscript', 'rawPrompt',
  'systemPrompt', 'developerPrompt', 'modelDraft', 'providerResponse',
  'privateMemory', 'teacherOnlyNotes', 'safeguardingRaw',
  'safetyExcerpt', 'deenSensitiveRawQuestion',
  'answerKey', 'solutionSteps', 'internalScoring',
  'stackTrace', 'secret', 'token', 'connectionString',
  'authorizationHeader', 'cookie',
  'rawAiResponse', 'rawLearnerMemory',
  'rawArtifactContent', 'rawVideoTranscript',
  'chatHistory', 'conversationHistory',
]);

const TEACHER_SAFE_FIELDS_MAP: Record<string, string[]> = {
  teacher_safe_summary: ['safeSummary', 'summaryId', 'studentId', 'subject', 'topic', 'masteryTrend', 'safeEvidenceCount', 'suggestedNextAction', 'safeMisconceptionCategory', 'teacherHelpRecommendation', 'createdAt'],
  practice_attempt: ['id', 'subject', 'topic', 'outcome', 'attemptNumber', 'timeSpentSeconds', 'hintsRequested', 'createdAt'],
  mastery_snapshot: ['id', 'subject', 'topic', 'skillId', 'skillLabel', 'level', 'confidenceScore', 'evidenceCount'],
  learning_evidence: ['id', 'kind', 'subject', 'topic', 'outcomeSummary', 'createdAt'],
  revision_item: ['id', 'title', 'subject', 'topic', 'saveType', 'mastery', 'createdAt'],
  spaced_review_item: ['id', 'subject', 'topic', 'dueAt', 'status', 'reason'],
  safe_memory_summary: ['id', 'kind', 'summary', 'confidenceScore', 'lastObservedAt'],
};

export class TeacherVisibilityPolicyService {
  checkVisibility(request: TeacherVisibilityRequest): TeacherVisibilityDecision {
    const blockedReasons: string[] = [];
    const safeFields: string[] = [];
    const blockedFields: string[] = [];

    if (!request.schoolId) {
      return {
        allowed: false,
        safeSummaryOnly: true,
        blockedReasons: ['missing-school-context'],
        safeFields: [],
        blockedFields: request.requestedFields,
        privacyMetadata: { failClosed: true },
      };
    }

    const isSafeCategory = TEACHER_SAFE_CATEGORIES.includes(request.resourceCategory);
    if (!isSafeCategory) {
      return {
        allowed: false,
        safeSummaryOnly: true,
        blockedReasons: [`category-not-teacher-safe:${request.resourceCategory}`],
        safeFields: [],
        blockedFields: request.requestedFields,
        privacyMetadata: { failClosed: true, category: request.resourceCategory },
      };
    }

    for (const field of request.requestedFields) {
      if (TEACHER_FORBIDDEN_FIELDS.has(field)) {
        blockedFields.push(field);
        blockedReasons.push(`teacher-field-forbidden:${field}`);
        continue;
      }
      const safeFieldsForCat = TEACHER_SAFE_FIELDS_MAP[request.resourceCategory];
      if (safeFieldsForCat && !safeFieldsForCat.includes(field)) {
        blockedFields.push(field);
        blockedReasons.push(`field-not-in-teacher-safe-list:${field}`);
        continue;
      }
      safeFields.push(field);
    }

    const allowed = safeFields.length > 0 || blockedFields.length === 0;

    return {
      allowed,
      safeSummaryOnly: blockedFields.length > 0,
      blockedReasons,
      safeFields,
      blockedFields,
      privacyMetadata: {
        category: request.resourceCategory,
        safeFieldCount: safeFields.length,
        blockedFieldCount: blockedFields.length,
      },
    };
  }

  getTeacherSafeCategories(): DataCategory[] {
    return [...TEACHER_SAFE_CATEGORIES];
  }

  getTeacherForbiddenFields(): string[] {
    return Array.from(TEACHER_FORBIDDEN_FIELDS);
  }
}

export const teacherVisibilityPolicyService = new TeacherVisibilityPolicyService();
