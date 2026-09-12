// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Data Deletion Governance Service v1
// Creates safe deletion plans or dry-runs without destructive
// data deletion.
// ─────────────────────────────────────────────────────────────

import type {
  DataCategory,
  TutorRole,
  DeletionPlanRequest,
  DeletionPlan,
} from '../contracts/task020GovernanceContracts';
import { dataClassificationRegistryService } from './task020DataClassificationRegistryService';

const DELETE_ELIGIBLE_CATEGORIES: DataCategory[] = [
  'learner_identity',
  'tutor_session_state',
  'conversation_message',
  'conversation_archive',
  'safe_memory_summary',
  'practice_attempt',
  'learning_evidence',
  'revision_item',
  'spaced_review_item',
  'learner_preference_feedback',
  'adaptive_profile',
  'challenge_record',
  'remediation_path',
  'difficulty_calibration',
  'operational_telemetry',
  'rate_limit_record',
  'idempotency_record',
  'deen_sensitive_metadata',
];

const RETAINED_CATEGORIES: DataCategory[] = [
  'school_identity',
  'class_roster_scope',
  'audit_event',
  'teacher_safe_summary',
];

const RESTRICTED_CATEGORIES: DataCategory[] = [
  'safeguarding_metadata',
  'audit_event',
  'ai_prompt_metadata',
  'provider_response_metadata',
];

const REDACTION_INSTEAD_OF_DELETION: DataCategory[] = [
  'audit_event',
  'safeguarding_metadata',
  'conversation_archive',
  'ai_prompt_metadata',
  'provider_response_metadata',
];

export class DataDeletionGovernanceService {
  createDeletionPlan(request: DeletionPlanRequest): DeletionPlan {
    const reasons: string[] = [];
    const planId = `deletion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    reasons.push('dry-run-only-no-destructive-deletion');

    const deleteEligible = DELETE_ELIGIBLE_CATEGORIES.filter(c => {
      if (request.deletionType === 'learner_self') {
        return c !== 'learner_identity';
      }
      if (request.deletionType === 'school_admin') {
        return true;
      }
      if (request.deletionType === 'data_retention_policy') {
        return c !== 'mastery_snapshot';
      }
      return false;
    });

    if (request.deletionType === 'learner_self') {
      reasons.push('learner-self-deletion-identity-retained-for-school-records');
    }

    return {
      planId,
      dryRunOnly: true,
      deleteEligibleCategories: deleteEligible,
      retainedCategories: RETAINED_CATEGORIES,
      restrictedCategories: RESTRICTED_CATEGORIES,
      redactionInsteadOfDeletionCategories: REDACTION_INSTEAD_OF_DELETION,
      reasonCodes: reasons,
      createdAt: new Date().toISOString(),
    };
  }

  getDeleteEligibleCategories(): DataCategory[] {
    return [...DELETE_ELIGIBLE_CATEGORIES];
  }

  getRetainedCategories(): DataCategory[] {
    return [...RETAINED_CATEGORIES];
  }

  getRestrictedCategories(): DataCategory[] {
    return [...RESTRICTED_CATEGORIES];
  }

  getRedactionInsteadCategories(): DataCategory[] {
    return [...REDACTION_INSTEAD_OF_DELETION];
  }
}

export const dataDeletionGovernanceService = new DataDeletionGovernanceService();
