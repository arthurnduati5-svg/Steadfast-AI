import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import { validateTask034ForbiddenOutputFields } from '../lib/task034ControlledLimitedRolloutValidation';

describe('Task 034 - no false pass', () => {
  const testFiles = globSync('C:\\Users\\HP\\Steadfast-AI\\backend\\src\\tests\\task-034*.test.ts');

  it('should not use .skip in test files', () => {
    const filesWithSkip: string[] = [];
    for (const file of testFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('.skip(')) {
        filesWithSkip.push(file);
      }
    }
    expect(filesWithSkip).toHaveLength(0);
  });

  it('should not use xit in test files', () => {
    const filesWithXit: string[] = [];
    for (const file of testFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('xit(') || content.includes('xit (')) {
        filesWithXit.push(file);
      }
    }
    expect(filesWithXit).toHaveLength(0);
  });

  it('should not use xdescribe in test files', () => {
    const filesWithXdescribe: string[] = [];
    for (const file of testFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('xdescribe(') || content.includes('xdescribe (')) {
        filesWithXdescribe.push(file);
      }
    }
    expect(filesWithXdescribe).toHaveLength(0);
  });

  it('should not use expect(true).toBe(true)', () => {
    const filesWithTrueToBeTrue: string[] = [];
    for (const file of testFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('expect(true).toBe(true)')) {
        filesWithTrueToBeTrue.push(file);
      }
    }
    expect(filesWithTrueToBeTrue).toHaveLength(0);
  });

  it('should not use expect(1).toBe(1)', () => {
    const filesWithOneToOne: string[] = [];
    for (const file of testFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('expect(1).toBe(1)')) {
        filesWithOneToOne.push(file);
      }
    }
    expect(filesWithOneToOne).toHaveLength(0);
  });

  it('validateTask034ForbiddenOutputFields detects forbidden fields', () => {
    const result = validateTask034ForbiddenOutputFields({
      studentName: 'John',
      rawLearnerData: 'sensitive',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('forbidden_field_non_empty_studentName');
    expect(result.reasonCodes).toContain('forbidden_field_non_empty_rawLearnerData');
  });

  it('validateTask034ForbiddenOutputFields null fails', () => {
    const result = validateTask034ForbiddenOutputFields(null as any);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('validateTask034ForbiddenOutputFields empty object passes', () => {
    const result = validateTask034ForbiddenOutputFields({});
    expect(result.ok).toBe(true);
  });

  it('all test files have at least one assertion', () => {
    for (const file of testFiles) {
      const content = readFileSync(file, 'utf-8');
      const assertionCount = (content.match(/expect\(/g) || []).length;
      expect(assertionCount).toBeGreaterThanOrEqual(1);
    }
  });
});
