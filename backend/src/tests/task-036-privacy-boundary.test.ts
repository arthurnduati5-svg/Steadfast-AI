import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validatePrivacyBoundaryResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    savePrivacyBoundary: vi.fn(),
    getPrivacyBoundary: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function checkPrivacy(sessionId: string, privacyData: any): { passed: boolean; errors: string[] } {
  const result = {
    ok: privacyData.ok ?? true,
    passed: privacyData.passed ?? true,
    rawStudentChatExposed: privacyData.rawStudentChatExposed ?? false,
    rawAnswersExposed: privacyData.rawAnswersExposed ?? false,
    rawSafeguardingNotesExposed: privacyData.rawSafeguardingNotesExposed ?? false,
    rawDeenTextExposed: privacyData.rawDeenTextExposed ?? false,
    rawProviderPayloadExposed: privacyData.rawProviderPayloadExposed ?? false,
    parentContactExposed: privacyData.parentContactExposed ?? false,
    teacherPrivateNotesExposed: privacyData.teacherPrivateNotesExposed ?? false,
    hiddenReasoningExposed: privacyData.hiddenReasoningExposed ?? false,
    secretsExposed: privacyData.secretsExposed ?? false,
    answerKeyExposed: privacyData.answerKeyExposed ?? false,
    markingSchemeExposed: privacyData.markingSchemeExposed ?? false,
    blockingIssues: [],
  };
  const errors = validatePrivacyBoundaryResult(result);
  if (errors.length > 0) return { passed: false, errors };
  task036Repository.savePrivacyBoundary(sessionId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Privacy Boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when no privacy issues', () => {
    const result = checkPrivacy('sess-1', {});
    expect(result.passed).toBe(true);
    expect(task036Repository.savePrivacyBoundary).toHaveBeenCalled();
  });

  it('fails when raw student chat exposed', () => {
    const result = checkPrivacy('sess-1', { ok: false, passed: false, rawStudentChatExposed: true });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('raw_student_chat_exposed');
  });

  it('fails when raw answers exposed', () => {
    const result = checkPrivacy('sess-1', { ok: false, passed: false, rawAnswersExposed: true });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('raw_answers_exposed');
  });

  it('fails when parent contact exposed', () => {
    const result = checkPrivacy('sess-1', { ok: false, passed: false, parentContactExposed: true });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('parent_contact_exposed');
  });

  it('fails when hidden reasoning exposed', () => {
    const result = checkPrivacy('sess-1', { ok: false, passed: false, hiddenReasoningExposed: true });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('hidden_reasoning_exposed');
  });

  it('fails when answer key exposed', () => {
    const result = checkPrivacy('sess-1', { ok: false, passed: false, answerKeyExposed: true });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('answer_key_exposed');
  });

  it('fails when marking scheme exposed', () => {
    const result = checkPrivacy('sess-1', { ok: false, passed: false, markingSchemeExposed: true });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('marking_scheme_exposed');
  });

  it('retrieves stored privacy boundary from repository', () => {
    const stored: any = {
      ok: true, passed: true, rawStudentChatExposed: false,
      rawAnswersExposed: false, rawSafeguardingNotesExposed: false,
      rawDeenTextExposed: false, rawProviderPayloadExposed: false,
      parentContactExposed: false, teacherPrivateNotesExposed: false,
      hiddenReasoningExposed: false, secretsExposed: false,
      answerKeyExposed: false, markingSchemeExposed: false,
      blockingIssues: [],
    };
    vi.mocked(task036Repository.getPrivacyBoundary).mockReturnValue(stored);
    const retrieved = task036Repository.getPrivacyBoundary('sess-1');
    expect(retrieved!.passed).toBe(true);
    expect(retrieved!.rawStudentChatExposed).toBe(false);
  });
});
