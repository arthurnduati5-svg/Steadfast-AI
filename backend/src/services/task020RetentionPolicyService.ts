import {
  TASK020_RETENTION_ACTIONS, type Task020RetentionAction,
  type Task020DataCategory, type Task020RetentionPolicyDecision,
} from '../contracts/task020SecurityPrivacyGovernanceContracts';

const RETENTION_MAP: Record<string, { action: Task020RetentionAction; periodDays: number; redactBeforeDelete: boolean }> = {
  school_identity: { action: 'retain', periodDays: 365 * 7, redactBeforeDelete: false },
  learner_identity: { action: 'retain', periodDays: 365 * 3, redactBeforeDelete: true },
  teacher_identity: { action: 'retain', periodDays: 365 * 3, redactBeforeDelete: true },
  parent_identity: { action: 'retain', periodDays: 365 * 3, redactBeforeDelete: true },
  peer_identity: { action: 'retain', periodDays: 365, redactBeforeDelete: true },
  objective_mastery: { action: 'retain', periodDays: 365 * 2, redactBeforeDelete: false },
  daily_check: { action: 'retain', periodDays: 365 * 2, redactBeforeDelete: false },
  daily_learning_feed: { action: 'retain', periodDays: 365, redactBeforeDelete: false },
  study_plan: { action: 'retain', periodDays: 365, redactBeforeDelete: false },
  growth_page: { action: 'retain', periodDays: 365 * 2, redactBeforeDelete: false },
  mistake_journal: { action: 'retain', periodDays: 365 * 2, redactBeforeDelete: false },
  living_revision: { action: 'retain', periodDays: 365 * 2, redactBeforeDelete: false },
  confidence_recovery: { action: 'retain', periodDays: 365, redactBeforeDelete: false },
  parent_support: { action: 'retain', periodDays: 365, redactBeforeDelete: true },
  peer_learning: { action: 'retain', periodDays: 365, redactBeforeDelete: true },
  safe_learning_evidence: { action: 'archive', periodDays: 365 * 3, redactBeforeDelete: false },
  teacher_safe_summary: { action: 'retain', periodDays: 365, redactBeforeDelete: false },
  safeguarding_signal: { action: 'retain', periodDays: 365 * 3, redactBeforeDelete: false },
  safeguarding_raw: { action: 'archive', periodDays: 365 * 7, redactBeforeDelete: false },
  deen_context: { action: 'retain', periodDays: 365 * 2, redactBeforeDelete: false },
  deen_private_text: { action: 'delete_pending_review', periodDays: 365, redactBeforeDelete: true },
  answer_key: { action: 'retain', periodDays: 365 * 3, redactBeforeDelete: false },
  model_answer: { action: 'retain', periodDays: 365 * 3, redactBeforeDelete: false },
  marking_scheme: { action: 'retain', periodDays: 365 * 3, redactBeforeDelete: false },
  provider_prompt: { action: 'redact', periodDays: 90, redactBeforeDelete: true },
  provider_response: { action: 'redact', periodDays: 90, redactBeforeDelete: true },
  hidden_reasoning: { action: 'redact', periodDays: 30, redactBeforeDelete: true },
  credential: { action: 'redact', periodDays: 0, redactBeforeDelete: true },
  audit_metadata: { action: 'retain', periodDays: 365 * 7, redactBeforeDelete: false },
  operational_metric: { action: 'retain', periodDays: 365, redactBeforeDelete: false },
};

export class Task020RetentionPolicyService {
  decideRetentionAction(category: Task020DataCategory | string): Task020RetentionPolicyDecision {
    const config = RETENTION_MAP[category];
    if (!config) {
      return {
        retentionAction: 'blocked',
        dataCategory: category as Task020DataCategory,
        retentionPeriodDays: 0,
        requiresRedactionBeforeDelete: true,
        reasonCodes: ['T020_RET_UNKNOWN_CATEGORY'],
      };
    }
    return {
      retentionAction: config.action,
      dataCategory: category as Task020DataCategory,
      retentionPeriodDays: config.periodDays,
      requiresRedactionBeforeDelete: config.redactBeforeDelete,
      reasonCodes: [`T020_RET_${config.action.toUpperCase()}`],
    };
  }

  canRetainDataCategory(category: Task020DataCategory | string): boolean {
    const decision = this.decideRetentionAction(category);
    return decision.retentionAction === 'retain' || decision.retentionAction === 'archive';
  }

  canRedactDataCategory(category: Task020DataCategory | string): boolean {
    const decision = this.decideRetentionAction(category);
    return decision.retentionAction === 'redact' || decision.requiresRedactionBeforeDelete;
  }

  canArchiveDataCategory(category: Task020DataCategory | string): boolean {
    const decision = this.decideRetentionAction(category);
    return decision.retentionAction === 'archive';
  }

  canDeleteDataCategory(category: Task020DataCategory | string): boolean {
    const decision = this.decideRetentionAction(category);
    return decision.retentionAction === 'delete_allowed' || decision.retentionAction === 'delete_pending_review';
  }

  buildRetentionPolicyDecision(category: Task020DataCategory | string): Task020RetentionPolicyDecision {
    return this.decideRetentionAction(category);
  }
}

export const task020RetentionPolicyService = new Task020RetentionPolicyService();
