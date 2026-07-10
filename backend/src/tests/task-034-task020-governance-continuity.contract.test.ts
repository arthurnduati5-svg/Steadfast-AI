import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 task020 governance continuity', () => {
  const criticalFields = [
    'studentName', 'studentEmail', 'studentPhone',
    'parentName', 'parentEmail', 'parentPhone',
    'rawLearnerData', 'rawChat', 'rawStudentAnswer',
    'answerKey', 'correctAnswer', 'modelAnswer',
  ];

  it('contains studentName', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('studentName');
  });

  it('contains studentEmail', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('studentEmail');
  });

  it('contains studentPhone', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('studentPhone');
  });

  it('contains parentName', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('parentName');
  });

  it('contains parentEmail', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('parentEmail');
  });

  it('contains parentPhone', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('parentPhone');
  });

  it('contains answerKey', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('answerKey');
  });

  it('contains correctAnswer', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('correctAnswer');
  });

  it('contains modelAnswer', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('modelAnswer');
  });

  it('contains rawLearnerData', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('rawLearnerData');
  });

  it('contains rawChat', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('rawChat');
  });

  it('contains rawStudentAnswer', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('rawStudentAnswer');
  });

  it('all critical fields are present', () => {
    for (const field of criticalFields) {
      expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain(field);
    }
  });
});
