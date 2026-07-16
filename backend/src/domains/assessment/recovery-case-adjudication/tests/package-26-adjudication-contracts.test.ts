import { describe, it, expect } from 'vitest';
import {
  RecoveryCaseAdjudicationCommandContext,
  ForbiddenAdjudicationActorRoles,
  AllowedAdjudicationActorRoles,
  ForbiddenAdjudicationStatuses,
  ForbiddenAdjudicationEntityFields,
  AdjudicationDecisionCodes,
  AdjudicationReviewerPositions,
  AdjudicationDispositionCodes,
  ADJUDICATION_GOVERNANCE_POLICY_VERSION,
} from '../contracts';

describe('Package 26 - Adjudication Contracts', () => {
  it('RecoveryCaseAdjudicationCommandContext has correct shape', () => {
    const ctx: RecoveryCaseAdjudicationCommandContext = {
      schoolId: 'school-1',
      actorId: 'actor-1',
      actorRole: 'teacher',
      correlationId: 'corr-1',
      idempotencyKey: 'ik-1',
      sourceRefsJson: { ref: 'value' },
    };
    expect(ctx.schoolId).toBe('school-1');
    expect(ctx.actorId).toBe('actor-1');
    expect(ctx.actorRole).toBe('teacher');
    expect(ctx.correlationId).toBe('corr-1');
    expect(ctx.idempotencyKey).toBe('ik-1');
    expect(ctx.sourceRefsJson).toEqual({ ref: 'value' });
  });

  it('ForbiddenAdjudicationActorRoles includes student, parent, guest, unknown', () => {
    expect(ForbiddenAdjudicationActorRoles).toContain('student');
    expect(ForbiddenAdjudicationActorRoles).toContain('parent');
    expect(ForbiddenAdjudicationActorRoles).toContain('guest');
    expect(ForbiddenAdjudicationActorRoles).toContain('unknown');
    expect(ForbiddenAdjudicationActorRoles.length).toBe(4);
  });

  it('AllowedAdjudicationActorRoles includes teacher, lead_teacher, department_head, admin, system_job', () => {
    expect(AllowedAdjudicationActorRoles).toContain('teacher');
    expect(AllowedAdjudicationActorRoles).toContain('lead_teacher');
    expect(AllowedAdjudicationActorRoles).toContain('department_head');
    expect(AllowedAdjudicationActorRoles).toContain('admin');
    expect(AllowedAdjudicationActorRoles).toContain('system_job');
    expect(AllowedAdjudicationActorRoles.length).toBe(5);
  });

  it('ForbiddenAdjudicationStatuses includes executed, assigned, sent, published, authorized_live, and more', () => {
    expect(ForbiddenAdjudicationStatuses).toContain('executed');
    expect(ForbiddenAdjudicationStatuses).toContain('assigned');
    expect(ForbiddenAdjudicationStatuses).toContain('sent');
    expect(ForbiddenAdjudicationStatuses).toContain('published');
    expect(ForbiddenAdjudicationStatuses).toContain('authorized_live');
    expect(ForbiddenAdjudicationStatuses).toContain('live_authorized');
    expect(ForbiddenAdjudicationStatuses.length).toBeGreaterThanOrEqual(10);
  });

  it('ForbiddenAdjudicationEntityFields includes sensitive fields like rawStudentAnswer, answerKeyText, hiddenReasoning, etc', () => {
    expect(ForbiddenAdjudicationEntityFields).toContain('rawStudentAnswer');
    expect(ForbiddenAdjudicationEntityFields).toContain('answerKeyText');
    expect(ForbiddenAdjudicationEntityFields).toContain('hiddenReasoning');
    expect(ForbiddenAdjudicationEntityFields).toContain('chainOfThought');
    expect(ForbiddenAdjudicationEntityFields).toContain('unreleasedScore');
    expect(ForbiddenAdjudicationEntityFields).toContain('aiDecision');
    expect(ForbiddenAdjudicationEntityFields).toContain('modelOutput');
    expect(ForbiddenAdjudicationEntityFields).toContain('pdfBuffer');
    expect(ForbiddenAdjudicationEntityFields).toContain('ocrText');
    expect(ForbiddenAdjudicationEntityFields.length).toBeGreaterThanOrEqual(40);
  });

  it('AdjudicationDecisionCodes has all 10 codes', () => {
    expect(AdjudicationDecisionCodes).toContain('confirm_priority');
    expect(AdjudicationDecisionCodes).toContain('recommend_lower_priority');
    expect(AdjudicationDecisionCodes).toContain('recommend_higher_priority');
    expect(AdjudicationDecisionCodes).toContain('request_more_evidence');
    expect(AdjudicationDecisionCodes).toContain('request_second_review');
    expect(AdjudicationDecisionCodes).toContain('recommend_escalation');
    expect(AdjudicationDecisionCodes).toContain('defer_review');
    expect(AdjudicationDecisionCodes).toContain('block_for_governance');
    expect(AdjudicationDecisionCodes).toContain('return_to_triage');
    expect(AdjudicationDecisionCodes).toContain('no_change');
    expect(AdjudicationDecisionCodes.length).toBe(10);
  });

  it('AdjudicationReviewerPositions has all 4 positions', () => {
    expect(AdjudicationReviewerPositions).toContain('primary');
    expect(AdjudicationReviewerPositions).toContain('secondary');
    expect(AdjudicationReviewerPositions).toContain('governance_resolver');
    expect(AdjudicationReviewerPositions).toContain('quality_reviewer');
    expect(AdjudicationReviewerPositions.length).toBe(4);
  });

  it('AdjudicationDispositionCodes has all 8 codes', () => {
    expect(AdjudicationDispositionCodes).toContain('retain_in_queue');
    expect(AdjudicationDispositionCodes).toContain('defer_for_more_evidence');
    expect(AdjudicationDispositionCodes).toContain('second_review_required');
    expect(AdjudicationDispositionCodes).toContain('priority_override_proposed');
    expect(AdjudicationDispositionCodes).toContain('escalation_proposed');
    expect(AdjudicationDispositionCodes).toContain('return_to_triage');
    expect(AdjudicationDispositionCodes).toContain('governance_blocked');
    expect(AdjudicationDispositionCodes).toContain('archived_ready');
    expect(AdjudicationDispositionCodes.length).toBe(8);
  });

  it('ADJUDICATION_GOVERNANCE_POLICY_VERSION equals expected string', () => {
    expect(ADJUDICATION_GOVERNANCE_POLICY_VERSION).toBe('RECOVERY_CASE_ADJUDICATION_POLICY_V1');
  });

  it('ForbiddenActorRoles and AllowedActorRoles have no overlap', () => {
    for (const forbidden of ForbiddenAdjudicationActorRoles) {
      expect(AllowedAdjudicationActorRoles).not.toContain(forbidden);
    }
  });
});
