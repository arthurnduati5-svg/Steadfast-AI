import { describe, it, expect } from 'vitest';
import {
  TASK029_FORBIDDEN_FIELDS,
} from '../contracts/task029ExpansionOperationsContracts';
import {
  rejectTask029ForbiddenFields,
} from '../lib/task029ExpansionOperationsValidation';

describe('TASK029_FORBIDDEN_FIELDS contract', () => {
  it('should be a frozen array with more than 50 entries', () => {
    expect(TASK029_FORBIDDEN_FIELDS.length).toBeGreaterThanOrEqual(50);
  });

  it('should contain raw learner data fields', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawStudentData');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawLearnerData');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawParentData');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawTeacherData');
  });

  it('should contain safeguarding fields', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawSafeguardingNote');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawSafeguardingCase');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('safeguardingRaw');
  });

  it('should contain AI reasoning fields', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('chainOfThought');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('hiddenReasoning');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('scratchpad');
  });

  it('should contain authentication fields', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawSsoToken');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawJwt');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('apiKey');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('authorization');
  });

  it('should contain environment secret fields', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('DATABASE_URL');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('OPENAI_API_KEY');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('ANTHROPIC_API_KEY');
  });

  it('should contain contact fields', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('parentPhone');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('parentEmail');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('studentPhone');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('studentEmail');
  });

  it('should contain production deployment command fields', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('productionDeploymentCommand');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('productionRollbackCommand');
  });

  it('should contain answer and marking fields', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('answerKey');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('correctAnswer');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('markingScheme');
  });

  it('should contain provider response fields', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('providerPrompt');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('providerResponse');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawProviderResponse');
  });
});

describe('rejectTask029ForbiddenFields detection', () => {
  it('should return empty for clean object', () => {
    expect(rejectTask029ForbiddenFields({ schoolId: 's1', actorId: 'a1' })).toEqual([]);
  });

  it('should reject rawStudentData', () => {
    const result = rejectTask029ForbiddenFields({ rawStudentData: 'x' });
    expect(result).toEqual(['rawStudentData']);
  });

  it('should reject all forbidden fields present in object', () => {
    const result = rejectTask029ForbiddenFields({
      chainOfThought: 'secret',
      apiKey: 'sk-xxx',
      parentEmail: 'p@example.com',
      safeField: 'ok',
    });
    expect(result).toContain('chainOfThought');
    expect(result).toContain('apiKey');
    expect(result).toContain('parentEmail');
    expect(result).toHaveLength(3);
  });

  it('should return empty for null input', () => {
    expect(rejectTask029ForbiddenFields(null)).toEqual([]);
  });

  it('should return empty for non-object input', () => {
    expect(rejectTask029ForbiddenFields(42)).toEqual([]);
    expect(rejectTask029ForbiddenFields('string')).toEqual([]);
  });

  it('should return empty for undefined', () => {
    expect(rejectTask029ForbiddenFields(undefined)).toEqual([]);
  });
});
