import { describe, it, expect } from 'vitest';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';

describe('task026ForbiddenFields contract enforcement', () => {
  describe('clean objects pass', () => {
    it('returns null for a clean flat object', () => {
      expect(rejectTask026ForbiddenFields({ schoolId: 's1', safeSummary: 'ok', cohortSize: 25 })).toBeNull();
    });

    it('returns null for empty object', () => {
      expect(rejectTask026ForbiddenFields({})).toBeNull();
    });

    it('returns null for nested safe fields', () => {
      const result = rejectTask026ForbiddenFields({ meta: { status: 'active', riskLevel: 'low' }, items: [{ name: 'test' }] });
      expect(result).toBeNull();
    });
  });

  describe('top-level field detection', () => {
    const testCases = [
      { field: 'rawStudentData', label: 'raw student data' },
      { field: 'rawLearnerData', label: 'raw learner data' },
      { field: 'privateDeenText', label: 'private deen text' },
      { field: 'answerKey', label: 'answer key' },
      { field: 'chainOfThought', label: 'chain of thought' },
      { field: 'hiddenReasoning', label: 'hidden reasoning' },
      { field: 'providerPrompt', label: 'provider prompt' },
      { field: 'rawChat', label: 'raw chat' },
      { field: 'productionDeploymentCommand', label: 'production deployment' },
      { field: 'liveAiProviderPayload', label: 'live AI payload' },
      { field: 'DATABASE_URL', label: 'database URL' },
      { field: 'OPENAI_API_KEY', label: 'OpenAI key' },
    ];

    testCases.forEach(({ field, label }) => {
      it(`detects "${field}" (${label})`, () => {
        const result = rejectTask026ForbiddenFields({ schoolId: 's1', [field]: 'leaked' });
        expect(result).not.toBeNull();
        if (result) {
          expect(result.code).toBe('FORBIDDEN_FIELD');
          expect(result.reasonCodes).toContain('forbidden_field');
          expect(result.reasonCodes).toContain(`field:${field}`);
        }
      });
    });
  });

  describe('null/undefined detection', () => {
    it('detects forbidden field set to null', () => {
      expect(rejectTask026ForbiddenFields({ rawStudentData: null })).not.toBeNull();
    });

    it('detects forbidden field set to empty string', () => {
      expect(rejectTask026ForbiddenFields({ rawStudentData: '' })).not.toBeNull();
    });
  });

  describe('nested detection', () => {
    it('detects one level deep', () => {
      const result = rejectTask026ForbiddenFields({ meta: { hiddenReasoning: 'hidden' } });
      expect(result).not.toBeNull();
    });

    it('detects three levels deep', () => {
      const result = rejectTask026ForbiddenFields({ a: { b: { c: { answerKey: 'x' } } } });
      expect(result).not.toBeNull();
    });

    it('detects in array of objects', () => {
      const result = rejectTask026ForbiddenFields({ items: [{ name: 'a', rawChat: 'leaked' }] });
      expect(result).not.toBeNull();
    });
  });

  describe('TASK026_FORBIDDEN_FIELDS constant completeness', () => {
    it('contains all expected categories', () => {
      const set = new Set(TASK026_FORBIDDEN_FIELDS);
      expect(set.has('rawStudentData')).toBe(true);
      expect(set.has('privateDeenText')).toBe(true);
      expect(set.has('answerKey')).toBe(true);
      expect(set.has('chainOfThought')).toBe(true);
      expect(set.has('liveAiProviderPayload')).toBe(true);
      expect(set.has('productionDeploymentCommand')).toBe(true);
      expect(set.has('DATABASE_URL')).toBe(true);
      expect(TASK026_FORBIDDEN_FIELDS.length).toBeGreaterThanOrEqual(45);
    });
  });

  describe('error shape', () => {
    it('returns Task026ValidationError with expected shape', () => {
      const result = rejectTask026ForbiddenFields({ rawChat: 'hello' });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.valid).toBe(false);
        expect(typeof result.safeMessage).toBe('string');
        expect(Array.isArray(result.reasonCodes)).toBe(true);
      }
    });
  });
});
