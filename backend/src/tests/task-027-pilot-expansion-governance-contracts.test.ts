import { describe, it, expect } from 'vitest';
import {
  TASK027_GOVERNANCE_STATUSES,
  TASK027_EXPANSION_DECISIONS,
  TASK027_REVIEW_ACTOR_ROLES,
  TASK027_REVIEW_GATE_STATUSES,
  TASK027_EXPANSION_PROPOSAL_STATUSES,
  TASK027_EXPANSION_SCOPE_TYPES,
  TASK027_RISK_LEVELS,
  TASK027_EVIDENCE_EVENT_TYPES,
  TASK027_TEACHER_REVIEW_STATUSES,
  TASK027_ADMIN_APPROVAL_STATUSES,
  TASK027_SAFEGUARDING_REVIEW_STATUSES,
  TASK027_DEEN_REVIEW_STATUSES,
  TASK027_PRIVACY_REVIEW_STATUSES,
  TASK027_SOCRATIC_REVIEW_STATUSES,
  TASK027_OPERATIONS_REVIEW_STATUSES,
  TASK027_ACADEMIC_INTEGRITY_REVIEW_STATUSES,
  TASK027_PARENT_LEARNER_FEEDBACK_STATUSES,
  TASK027_BLOCKER_TYPES,
  TASK027_AUDIT_EVENTS,
  TASK027_FORBIDDEN_FIELDS,
} from '../contracts/task027PilotExpansionGovernanceContracts';

describe('Task027PilotExpansionGovernanceContracts', () => {
  describe('TASK027_GOVERNANCE_STATUSES', () => {
    it('contains all expected statuses', () => {
      expect(TASK027_GOVERNANCE_STATUSES).toContain('pending');
      expect(TASK027_GOVERNANCE_STATUSES).toContain('gathering_evidence');
      expect(TASK027_GOVERNANCE_STATUSES).toContain('under_review');
      expect(TASK027_GOVERNANCE_STATUSES).toContain('approved_for_expansion');
      expect(TASK027_GOVERNANCE_STATUSES).toContain('blocked');
      expect(TASK027_GOVERNANCE_STATUSES).toContain('rejected');
      expect(TASK027_GOVERNANCE_STATUSES).toContain('completed');
      expect(TASK027_GOVERNANCE_STATUSES.length).toBe(7);
    });
  });

  describe('TASK027_EXPANSION_DECISIONS', () => {
    it('includes approved_for_task028 and all blocked variants', () => {
      expect(TASK027_EXPANSION_DECISIONS).toContain('approved_for_task028');
      expect(TASK027_EXPANSION_DECISIONS).toContain('blocked_needs_review');
      expect(TASK027_EXPANSION_DECISIONS).toContain('blocked_high_risk');
      expect(TASK027_EXPANSION_DECISIONS).toContain('blocked_missing_evidence');
      expect(TASK027_EXPANSION_DECISIONS).toContain('blocked_dependency_failure');
      expect(TASK027_EXPANSION_DECISIONS).toContain('blocked_privacy_safeguarding');
      expect(TASK027_EXPANSION_DECISIONS).toContain('blocked_content_governance');
      expect(TASK027_EXPANSION_DECISIONS).toContain('blocked_operations_capacity');
      expect(TASK027_EXPANSION_DECISIONS).toContain('rejected_do_not_expand');
      expect(TASK027_EXPANSION_DECISIONS.length).toBe(9);
    });
  });

  describe('TASK027_REVIEW_ACTOR_ROLES', () => {
    it('contains all expected roles', () => {
      expect(TASK027_REVIEW_ACTOR_ROLES).toContain('school_admin');
      expect(TASK027_REVIEW_ACTOR_ROLES).toContain('system_admin');
      expect(TASK027_REVIEW_ACTOR_ROLES).toContain('internal_operator');
      expect(TASK027_REVIEW_ACTOR_ROLES).toContain('teacher_assigned_to_pilot');
      expect(TASK027_REVIEW_ACTOR_ROLES).toContain('safeguarding_reviewer');
      expect(TASK027_REVIEW_ACTOR_ROLES).toContain('content_governance_reviewer');
      expect(TASK027_REVIEW_ACTOR_ROLES).toContain('deen_source_reviewer');
      expect(TASK027_REVIEW_ACTOR_ROLES).toContain('operations_reviewer');
      expect(TASK027_REVIEW_ACTOR_ROLES).toContain('authorized_expansion_reviewer');
      expect(TASK027_REVIEW_ACTOR_ROLES.length).toBe(10);
    });
  });

  describe('TASK027_REVIEW_GATE_STATUSES', () => {
    it('contains passed, failed, blocked, pending_review, conditions_required', () => {
      expect(TASK027_REVIEW_GATE_STATUSES).toContain('passed');
      expect(TASK027_REVIEW_GATE_STATUSES).toContain('failed');
      expect(TASK027_REVIEW_GATE_STATUSES).toContain('blocked');
      expect(TASK027_REVIEW_GATE_STATUSES).toContain('pending_review');
      expect(TASK027_REVIEW_GATE_STATUSES).toContain('conditions_required');
      expect(TASK027_REVIEW_GATE_STATUSES.length).toBe(5);
    });
  });

  describe('TASK027_EXPANSION_PROPOSAL_STATUSES', () => {
    it('contains full lifecycle', () => {
      expect(TASK027_EXPANSION_PROPOSAL_STATUSES).toContain('draft');
      expect(TASK027_EXPANSION_PROPOSAL_STATUSES).toContain('under_review');
      expect(TASK027_EXPANSION_PROPOSAL_STATUSES).toContain('approved');
      expect(TASK027_EXPANSION_PROPOSAL_STATUSES).toContain('rejected');
      expect(TASK027_EXPANSION_PROPOSAL_STATUSES).toContain('ready_to_expand');
      expect(TASK027_EXPANSION_PROPOSAL_STATUSES).toContain('expanded');
      expect(TASK027_EXPANSION_PROPOSAL_STATUSES).toContain('rolled_back');
      expect(TASK027_EXPANSION_PROPOSAL_STATUSES.length).toBe(7);
    });
  });

  describe('TASK027_EXPANSION_SCOPE_TYPES', () => {
    it('contains same_school, class, grade, subject, cohort scopes', () => {
      expect(TASK027_EXPANSION_SCOPE_TYPES).toContain('same_school');
      expect(TASK027_EXPANSION_SCOPE_TYPES).toContain('additional_class');
      expect(TASK027_EXPANSION_SCOPE_TYPES).toContain('additional_grade');
      expect(TASK027_EXPANSION_SCOPE_TYPES).toContain('additional_subject');
      expect(TASK027_EXPANSION_SCOPE_TYPES).toContain('same_cohort');
      expect(TASK027_EXPANSION_SCOPE_TYPES.length).toBe(5);
    });
  });

  describe('TASK027_RISK_LEVELS', () => {
    it('contains low, medium, high, critical', () => {
      expect(TASK027_RISK_LEVELS).toContain('low');
      expect(TASK027_RISK_LEVELS).toContain('medium');
      expect(TASK027_RISK_LEVELS).toContain('high');
      expect(TASK027_RISK_LEVELS).toContain('critical');
      expect(TASK027_RISK_LEVELS.length).toBe(4);
    });
  });

  describe('TASK027_EVIDENCE_EVENT_TYPES', () => {
    it('contains pilot execution events', () => {
      expect(TASK027_EVIDENCE_EVENT_TYPES).toContain('pilot_completed');
      expect(TASK027_EVIDENCE_EVENT_TYPES).toContain('session_started');
      expect(TASK027_EVIDENCE_EVENT_TYPES).toContain('safeguarding_signal');
      expect(TASK027_EVIDENCE_EVENT_TYPES).toContain('teacher_review_submitted');
      expect(TASK027_EVIDENCE_EVENT_TYPES).toContain('learner_feedback_collected');
      expect(TASK027_EVIDENCE_EVENT_TYPES.length).toBe(10);
    });
  });

  describe('TASK027_TEACHER_REVIEW_STATUSES', () => {
    it('contains teacher review lifecycle', () => {
      expect(TASK027_TEACHER_REVIEW_STATUSES).toContain('not_started');
      expect(TASK027_TEACHER_REVIEW_STATUSES).toContain('in_progress');
      expect(TASK027_TEACHER_REVIEW_STATUSES).toContain('submitted');
      expect(TASK027_TEACHER_REVIEW_STATUSES).toContain('approved');
      expect(TASK027_TEACHER_REVIEW_STATUSES).toContain('rejected');
      expect(TASK027_TEACHER_REVIEW_STATUSES.length).toBe(5);
    });
  });

  describe('TASK027_FORBIDDEN_FIELDS', () => {
    it('contains forbidden field patterns', () => {
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawStudentData');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawLearnerData');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawParentData');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawAnswerKey');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawPII');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawBiometricData');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawFatwaText');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawPietyScore');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawSectarianLabel');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawFinalAnswer');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawReasoningTrace');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawModelOutput');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawPromptData');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawProviderPayloads');
      expect(TASK027_FORBIDDEN_FIELDS).toContain('rawSafeguardingDisclosure');
      expect(TASK027_FORBIDDEN_FIELDS.length).toBeGreaterThanOrEqual(30);
    });
  });

  describe('remaining status/blocker/audit constant arrays', () => {
    it('TASK027_ADMIN_APPROVAL_STATUSES has expected values', () => {
      expect(TASK027_ADMIN_APPROVAL_STATUSES).toContain('pending');
      expect(TASK027_ADMIN_APPROVAL_STATUSES).toContain('approved_with_conditions');
      expect(TASK027_ADMIN_APPROVAL_STATUSES).toContain('approved');
      expect(TASK027_ADMIN_APPROVAL_STATUSES).toContain('rejected');
    });

    it('TASK027_SAFEGUARDING_REVIEW_STATUSES has expected values', () => {
      expect(TASK027_SAFEGUARDING_REVIEW_STATUSES).toContain('not_reviewed');
      expect(TASK027_SAFEGUARDING_REVIEW_STATUSES).toContain('passed');
      expect(TASK027_SAFEGUARDING_REVIEW_STATUSES).toContain('passed_with_conditions');
      expect(TASK027_SAFEGUARDING_REVIEW_STATUSES).toContain('blocked');
    });

    it('TASK027_DEEN_REVIEW_STATUSES has expected values', () => {
      expect(TASK027_DEEN_REVIEW_STATUSES).toContain('not_reviewed');
      expect(TASK027_DEEN_REVIEW_STATUSES).toContain('passed');
      expect(TASK027_DEEN_REVIEW_STATUSES).toContain('passed_with_referral');
      expect(TASK027_DEEN_REVIEW_STATUSES).toContain('blocked');
    });

    it('TASK027_BLOCKER_TYPES covers all categories', () => {
      expect(TASK027_BLOCKER_TYPES).toContain('dependency_failure');
      expect(TASK027_BLOCKER_TYPES).toContain('missing_evidence');
      expect(TASK027_BLOCKER_TYPES).toContain('high_risk');
      expect(TASK027_BLOCKER_TYPES).toContain('critical_risk');
      expect(TASK027_BLOCKER_TYPES).toContain('privacy_concern');
      expect(TASK027_BLOCKER_TYPES).toContain('safeguarding_concern');
      expect(TASK027_BLOCKER_TYPES).toContain('deen_concern');
      expect(TASK027_BLOCKER_TYPES).toContain('missing_task026_commit');
      expect(TASK027_BLOCKER_TYPES).toContain('missing_task025_acceptance');
      expect(TASK027_BLOCKER_TYPES).toContain('unverified_school');
      expect(TASK027_BLOCKER_TYPES.length).toBeGreaterThanOrEqual(20);
    });

    it('TASK027_AUDIT_EVENTS covers governance lifecycle', () => {
      expect(TASK027_AUDIT_EVENTS).toContain('governance_started');
      expect(TASK027_AUDIT_EVENTS).toContain('evidence_loaded');
      expect(TASK027_AUDIT_EVENTS).toContain('decision_made');
      expect(TASK027_AUDIT_EVENTS).toContain('report_generated');
      expect(TASK027_AUDIT_EVENTS).toContain('governance_completed');
      expect(TASK027_AUDIT_EVENTS).toContain('expansion_blocked');
      expect(TASK027_AUDIT_EVENTS).toContain('expansion_approved');
      expect(TASK027_AUDIT_EVENTS.length).toBeGreaterThanOrEqual(20);
    });
  });
});
