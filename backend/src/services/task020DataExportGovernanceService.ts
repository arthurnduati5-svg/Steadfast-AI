// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Data Export Governance Service v1
// Creates safe export plans without actually dumping unsafe data.
// ─────────────────────────────────────────────────────────────

import type {
  DataCategory,
  TutorRole,
  ExportPlanRequest,
  ExportPlan,
} from '../contracts/task020GovernanceContracts';
import { dataClassificationRegistryService } from './task020DataClassificationRegistryService';

const EXPORT_EXCLUDED_CATEGORIES: DataCategory[] = [
  'ai_prompt_metadata',
  'provider_response_metadata',
  'safeguarding_metadata',
  'deen_sensitive_metadata',
  'audit_event',
  'operational_telemetry',
  'rate_limit_record',
  'idempotency_record',
  'conversation_message',
  'conversation_archive',
  'unknown',
];

const EXPORT_INCLUDED_CATEGORIES: DataCategory[] = [
  'learner_identity',
  'tutor_session_state',
  'safe_memory_summary',
  'practice_attempt',
  'learning_evidence',
  'mastery_snapshot',
  'revision_item',
  'spaced_review_item',
  'learner_preference_feedback',
  'adaptive_profile',
  'challenge_record',
  'remediation_path',
  'difficulty_calibration',
];

const LEARNER_EXCLUDED: DataCategory[] = [
  ...EXPORT_EXCLUDED_CATEGORIES,
  'teacher_safe_summary',
  'school_identity',
  'class_roster_scope',
];

export class DataExportGovernanceService {
  createExportPlan(request: ExportPlanRequest): ExportPlan {
    const reasons: string[] = [];
    const planId = `export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let included: DataCategory[];
    let excluded: DataCategory[];
    let redactionRequired = false;
    let safeguardingRequired = false;
    let deenRequired = false;

    if (request.exportType === 'learner_self') {
      included = EXPORT_INCLUDED_CATEGORIES.filter(c => !LEARNER_EXCLUDED.includes(c));
      excluded = LEARNER_EXCLUDED;
      redactionRequired = true;
      reasons.push('learner-self-export-redaction-required');
    } else if (request.exportType === 'school_admin') {
      included = [...EXPORT_INCLUDED_CATEGORIES, 'teacher_safe_summary'];
      excluded = EXPORT_EXCLUDED_CATEGORIES;
      reasons.push('school-admin-export-safe-categories');
    } else if (request.exportType === 'safeguarding_review') {
      included = [...EXPORT_INCLUDED_CATEGORIES, 'safeguarding_metadata', 'conversation_message'];
      excluded = ['ai_prompt_metadata', 'provider_response_metadata', 'operational_telemetry', 'rate_limit_record', 'idempotency_record'];
      redactionRequired = true;
      safeguardingRequired = true;
      reasons.push('safeguarding-review-export-redaction-required');
    } else {
      included = [];
      excluded = [...EXPORT_EXCLUDED_CATEGORIES];
      reasons.push('unknown-export-type-default-excluded');
    }

    if (included.some(c => c === 'deen_sensitive_metadata' || c === 'conversation_message')) {
      deenRequired = true;
      reasons.push('deen-review-required-for-sensitive-categories');
    }

    const estimatedTypes = included.map(c => `${c} records`);

    return {
      planId,
      dryRunOnly: true,
      schoolId: request.schoolId,
      targetLearnerId: request.targetLearnerId,
      includedCategories: included,
      excludedCategories: excluded,
      redactionRequired,
      safeguardingReviewRequired: safeguardingRequired,
      deenReviewRequired: deenRequired,
      estimatedRecordTypes: estimatedTypes,
      reasonCodes: ['export-plan-dry-run', ...reasons],
      createdAt: new Date().toISOString(),
    };
  }

  getExportExcludedCategories(): DataCategory[] {
    return [...EXPORT_EXCLUDED_CATEGORIES];
  }

  getExportIncludedCategories(): DataCategory[] {
    return [...EXPORT_INCLUDED_CATEGORIES];
  }
}

export const dataExportGovernanceService = new DataExportGovernanceService();
