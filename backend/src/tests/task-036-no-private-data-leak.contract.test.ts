import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task036LiveSchoolLaunchContracts';

describe('No Private Data Leak Contract', () => {
  it('forbids raw learner data exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawLearnerData');
  });

  it('forbids raw chat exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawChat');
  });

  it('forbids raw answer exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawAnswer');
  });

  it('forbids parent contact exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('parentContact');
  });

  it('forbids teacher private notes exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('teacherPrivateNote');
  });

  it('forbids provider payload exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('providerPayload');
  });

  it('forbids secrets exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('secret');
  });

  it('forbids student phone and email', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('studentPhone');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('studentEmail');
  });

  it('forbids parent phone and email', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('parentPhone');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('parentEmail');
  });
});
