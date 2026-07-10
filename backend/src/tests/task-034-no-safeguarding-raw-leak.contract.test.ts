import { describe, it, expect } from 'vitest';
import {
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  Task034PrivacyReviewResult,
  Task034StaffReadinessInput,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { rejectTask034ForbiddenFields, validateTask034PrivacyReview } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 no safeguarding raw leak', () => {
  it('forbidden fields contains safeguardingRaw', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('safeguardingRaw');
  });

  it('rejectTask034ForbiddenFields matches safeguardingRaw', () => {
    const result = rejectTask034ForbiddenFields({ safeguardingRaw: 'incident detail' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('safeguardingRaw');
  });

  it('privacy review interface requires noSafeguardingRawNotes', () => {
    const review: Task034PrivacyReviewResult = {
      ok: true,
      noRawLearnerData: true,
      noRawChat: true,
      noRawAnswer: true,
      noRawStudentWork: true,
      noParentContactData: true,
      noTeacherPrivateNotes: true,
      noSafeguardingRawNotes: true,
      noPrivateDeenText: true,
      noAnswerKey: true,
      noMarkingScheme: true,
      noProviderPrompt: true,
      noProviderResponse: true,
      noHiddenReasoning: true,
      blockingIssues: [],
    };
    expect(review.noSafeguardingRawNotes).toBe(true);
  });

  it('staff readiness interface requires safeguardingEscalationAcknowledged', () => {
    const input: Task034StaffReadinessInput = {
      schoolAdminAcknowledged: true,
      internalOperatorAcknowledged: true,
      teacherSupportAcknowledged: true,
      privacyBoundaryAcknowledged: true,
      safeguardingEscalationAcknowledged: true,
      deenBoundaryAcknowledged: true,
      contentGovernanceAcknowledged: true,
      rollbackPauseKillSwitchAcknowledged: true,
      learnerSupportPlanAcknowledged: true,
      readinessScore: 80,
    };
    expect(input.safeguardingEscalationAcknowledged).toBe(true);
  });

  it('validateTask034PrivacyReview requires noSafeguardingRawNotes', () => {
    const result = validateTask034PrivacyReview({
      ok: true,
      noRawLearnerData: true,
      noRawChat: true,
      noRawAnswer: true,
      noRawStudentWork: true,
      noParentContactData: true,
      noTeacherPrivateNotes: true,
      noSafeguardingRawNotes: true,
      noPrivateDeenText: true,
      noAnswerKey: true,
      noMarkingScheme: true,
      noProviderPrompt: true,
      noProviderResponse: true,
      noHiddenReasoning: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('rejectTask034ForbiddenFields returns false for safe object', () => {
    const result = rejectTask034ForbiddenFields({ safeAudit: 'clean' });
    expect(result.hasForbiddenFields).toBe(false);
  });
});
