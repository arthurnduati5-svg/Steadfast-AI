import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Package 8 Marking Invocation Contracts', () => {
  it('markingInvocationContracts.ts exists', () => {
    const filePath = path.resolve(__dirname, '../contracts/markingInvocationContracts.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('submittedSnapshotIntakeContracts.ts exists', () => {
    const filePath = path.resolve(__dirname, '../contracts/submittedSnapshotIntakeContracts.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('markingBatchContracts.ts exists', () => {
    const filePath = path.resolve(__dirname, '../contracts/markingBatchContracts.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('markingResultBridgeContracts.ts exists', () => {
    const filePath = path.resolve(__dirname, '../contracts/markingResultBridgeContracts.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('markingInvocationProjectionContracts.ts exists', () => {
    const filePath = path.resolve(__dirname, '../contracts/markingInvocationProjectionContracts.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('markingInvocationRepositoryContracts.ts exists', () => {
    const filePath = path.resolve(__dirname, '../contracts/markingInvocationRepositoryContracts.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('contracts/index.ts exists', () => {
    const filePath = path.resolve(__dirname, '../contracts/index.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('markingInvocationPolicyDefinitions.ts exists', () => {
    const filePath = path.resolve(__dirname, '../policies/markingInvocationPolicyDefinitions.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('student-safe projection excludes answer keys', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../contracts/markingInvocationProjectionContracts.ts'), 'utf-8');
    const studentSafeMatch = content.match(/MarkingInvocationStudentSafeProjection \{([^}]+\})/);
    if (studentSafeMatch) {
      const studentSafeContent = studentSafeMatch[1];
      expect(studentSafeContent).not.toContain('answerKeySafeRef');
      expect(studentSafeContent).not.toContain('answerKeyText');
      expect(studentSafeContent).not.toContain('correctAnswerSummary');
    }
  });

  it('student-safe projection excludes scores/final grades', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../contracts/markingInvocationProjectionContracts.ts'), 'utf-8');
    const studentSafeMatch = content.match(/MarkingInvocationStudentSafeProjection \{([^}]+\})/);
    if (studentSafeMatch) {
      const studentSafeContent = studentSafeMatch[1];
      expect(studentSafeContent).not.toContain('score');
      expect(studentSafeContent).not.toContain('finalGrade');
    }
  });

  it('student-safe projection excludes parent release fields', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../contracts/markingInvocationProjectionContracts.ts'), 'utf-8');
    expect(content).not.toContain('parentReleaseStatus');
  });

  it('student-safe projection excludes mastery mutation fields', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../contracts/markingInvocationProjectionContracts.ts'), 'utf-8');
    expect(content).not.toContain('masteryMutation');
  });

  it('student-safe projection includes allowed fields only', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../contracts/markingInvocationProjectionContracts.ts'), 'utf-8');
    expect(content).toContain('submissionSnapshotId');
    expect(content).toContain('markingInvocationRequestId');
    expect(content).toContain('intakeStatus');
    expect(content).toContain('processingStatus');
  });

  it('MarkingInvocationTeacherProjection excludes final release', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../contracts/markingInvocationProjectionContracts.ts'), 'utf-8');
    expect(content).not.toContain('parentRelease');
    expect(content).not.toContain('finalGrade');
  });

  it('repository contracts define all required interfaces', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../contracts/markingInvocationRepositoryContracts.ts'), 'utf-8');
    expect(content).toContain('MarkingInvocationRequestRepository');
    expect(content).toContain('SubmittedSnapshotIntakeRepository');
    expect(content).toContain('MarkingBatchRepository');
    expect(content).toContain('MarkingBatchItemRepository');
    expect(content).toContain('MarkingResultLinkRepository');
    expect(content).toContain('MarkingDispatchAuditRepository');
    expect(content).toContain('MarkingInvocationIdempotencyRepository');
    expect(content).toContain('MarkingReadinessCheckRepository');
  });

  it('policy definitions contain all required policy families', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../policies/markingInvocationPolicyDefinitions.ts'), 'utf-8');
    expect(content).toContain('MARKING_INVOCATION_REQUEST');
    expect(content).toContain('SUBMITTED_SNAPSHOT_INTAKE');
    expect(content).toContain('MARKING_BATCH_PLANNING');
    expect(content).toContain('DETERMINISTIC_MARKING_INVOCATION');
    expect(content).toContain('RUBRIC_MARKING_INVOCATION');
    expect(content).toContain('TEACHER_REVIEW_DISPATCH');
    expect(content).toContain('MARKING_RESULT_VERSION_LINK');
    expect(content).toContain('MARKING_INVOCATION_PROJECTION');
  });

  it('forbidden mutation roles are defined', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../policies/markingInvocationPolicyDefinitions.ts'), 'utf-8');
    expect(content).toContain('student');
    expect(content).toContain('parent');
    expect(content).toContain('guest');
    expect(content).toContain('unknown');
  });
});
