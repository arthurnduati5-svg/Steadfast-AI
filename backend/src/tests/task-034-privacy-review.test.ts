import { describe, it, expect } from 'vitest';
import { reviewTask034Privacy } from '../services/task034PrivacyReviewService';

describe('Task034 Privacy Review', () => {
  it('All privacy fields pass by default', () => {
    const result = reviewTask034Privacy();
    expect(result.ok).toBe(true);
    expect(result.noRawLearnerData).toBe(true);
    expect(result.noRawChat).toBe(true);
    expect(result.noRawAnswer).toBe(true);
    expect(result.noRawStudentWork).toBe(true);
    expect(result.noParentContactData).toBe(true);
    expect(result.noTeacherPrivateNotes).toBe(true);
    expect(result.noSafeguardingRawNotes).toBe(true);
    expect(result.noPrivateDeenText).toBe(true);
    expect(result.noAnswerKey).toBe(true);
    expect(result.noMarkingScheme).toBe(true);
    expect(result.noProviderPrompt).toBe(true);
    expect(result.noProviderResponse).toBe(true);
    expect(result.noHiddenReasoning).toBe(true);
  });

  it('noRawLearnerData false blocks', () => {
    const result = reviewTask034Privacy({ noRawLearnerData: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('raw_learner_data_exposed');
  });

  it('noRawChat false blocks', () => {
    const result = reviewTask034Privacy({ noRawChat: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('raw_chat_exposed');
  });

  it('noRawAnswer false blocks', () => {
    const result = reviewTask034Privacy({ noRawAnswer: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('raw_answer_exposed');
  });

  it('noRawStudentWork false blocks', () => {
    const result = reviewTask034Privacy({ noRawStudentWork: false });
    expect(result.ok).toBe(false);
  });

  it('noParentContactData false blocks', () => {
    const result = reviewTask034Privacy({ noParentContactData: false });
    expect(result.ok).toBe(false);
  });

  it('noTeacherPrivateNotes false blocks', () => {
    const result = reviewTask034Privacy({ noTeacherPrivateNotes: false });
    expect(result.ok).toBe(false);
  });

  it('noSafeguardingRawNotes false blocks', () => {
    const result = reviewTask034Privacy({ noSafeguardingRawNotes: false });
    expect(result.ok).toBe(false);
  });

  it('noPrivateDeenText false blocks', () => {
    const result = reviewTask034Privacy({ noPrivateDeenText: false });
    expect(result.ok).toBe(false);
  });

  it('noAnswerKey false blocks', () => {
    const result = reviewTask034Privacy({ noAnswerKey: false });
    expect(result.ok).toBe(false);
  });

  it('noMarkingScheme false blocks', () => {
    const result = reviewTask034Privacy({ noMarkingScheme: false });
    expect(result.ok).toBe(false);
  });

  it('noProviderPrompt false blocks', () => {
    const result = reviewTask034Privacy({ noProviderPrompt: false });
    expect(result.ok).toBe(false);
  });

  it('noProviderResponse false blocks', () => {
    const result = reviewTask034Privacy({ noProviderResponse: false });
    expect(result.ok).toBe(false);
  });

  it('noHiddenReasoning false blocks', () => {
    const result = reviewTask034Privacy({ noHiddenReasoning: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('hidden_reasoning_exposed');
  });

  it('Partial override preserves other defaults', () => {
    const result = reviewTask034Privacy({ noRawLearnerData: false });
    expect(result.noRawChat).toBe(true);
    expect(result.noRawAnswer).toBe(true);
  });
});
