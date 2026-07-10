import { describe, it, expect } from 'vitest';
import { scanPrivacyBoundary } from '../services/task034ExpandedPrivacyBoundaryService';

describe('Task034ExpandedPrivacyBoundary', () => {
  it('should pass with safe content', () => {
    const safeContent = JSON.stringify({
      rolloutRunId: 'rollout_run_task034_safe',
      schoolId: 'school_task034_limited_rollout_safe',
      safeDenialCount: 0,
      aggregateSessionCount: 100,
    });

    const result = scanPrivacyBoundary(safeContent);
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toEqual([]);
  });

  it('should detect raw student chat', () => {
    const unsafeContent = 'some raw student chat content here';
    const result = scanPrivacyBoundary(unsafeContent);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should detect private learner memory', () => {
    const unsafeContent = 'accessed private learner memory';
    const result = scanPrivacyBoundary(unsafeContent);
    expect(result.ok).toBe(false);
  });

  it('should detect teacher-only notes', () => {
    const unsafeContent = 'teacher-only notes contains';
    const result = scanPrivacyBoundary(unsafeContent);
    expect(result.ok).toBe(false);
  });

  it('should detect Deen-sensitive private text', () => {
    const unsafeContent = 'Deen-sensitive private text data';
    const result = scanPrivacyBoundary(unsafeContent);
    expect(result.ok).toBe(false);
  });

  it('should detect database URLs', () => {
    const unsafeContent = 'postgres://user:pass@host/db';
    const result = scanPrivacyBoundary(unsafeContent);
    expect(result.ok).toBe(false);
  });

  it('should detect answer keys', () => {
    const unsafeContent = 'answer key for exam';
    const result = scanPrivacyBoundary(unsafeContent);
    expect(result.ok).toBe(false);
  });

  it('should pass with safe negative checklist phrases', () => {
    const safeContent = JSON.stringify({
      rawStudentChatExposed: false,
      privateLearnerMemoryExposed: false,
      tokensSecretsExposed: false,
      databaseUrlsExposed: false,
      answerKeysExposed: false,
    });

    const result = scanPrivacyBoundary(safeContent);
    expect(result.ok).toBe(true);
  });

  it('should allow safe identifiers', () => {
    const safeContent = 'school_task034_limited_rollout_safe student_hash_task034_safe_001 rollout_run_task034_safe';
    const result = scanPrivacyBoundary(safeContent);
    expect(result.ok).toBe(true);
  });
});
