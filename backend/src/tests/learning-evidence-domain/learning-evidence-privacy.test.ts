import { describe, it, expect } from 'vitest';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';

describe('LearningEvidencePrivacyGuard', () => {
  const guard = new LearningEvidencePrivacyGuard();

  it('accepts clean safe payload', () => {
    const result = guard.validatePayload({ outcome: 'correct', score: 0.95 });
    expect(result.valid).toBe(true);
    expect(result.forbiddenKeys).toEqual([]);
  });

  it('rejects payload with forbidden keys at top level', () => {
    const result = guard.validatePayload({ rawChat: 'chat', outcome: 'correct' });
    expect(result.valid).toBe(false);
    expect(result.forbiddenKeys.length).toBeGreaterThan(0);
  });

  it('rejects payload with forbidden keys nested', () => {
    const result = guard.validatePayload({ nested: { answerKey: 'abc' } });
    expect(result.valid).toBe(false);
  });

  it('rejects deeply nested forbidden keys', () => {
    const result = guard.validatePayload({ a: { b: { chainOfThought: 'step' } } });
    expect(result.valid).toBe(false);
  });

  it('accepts empty object', () => {
    expect(guard.validatePayload({}).valid).toBe(true);
  });

  it('sanitizeCommandBody removes raw* keys', () => {
    const sanitized = guard.sanitizeCommandBody({ outcome: 'correct', rawChat: 'secret', rawStudentAnswer: 'ans' });
    expect(sanitized.outcome).toBe('correct');
    expect((sanitized as any).rawChat).toBeUndefined();
    expect((sanitized as any).rawStudentAnswer).toBeUndefined();
  });
});
