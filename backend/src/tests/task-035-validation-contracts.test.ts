import { describe, it, expect } from 'vitest';
import {
  validateSchoolWideReadinessRole,
  validateSessionId,
  validateEnvironmentFlags,
  validateNonEmptyString,
  validateBlockingIssues,
} from '../lib/task035SchoolWideReadinessValidation';

describe('task035 validation contracts', () => {
  describe('validateSchoolWideReadinessRole', () => {
    it('returns valid for admin role', () => {
      const result = validateSchoolWideReadinessRole('admin');
      expect(result.valid).toBe(true);
      expect(result.role).toBe('admin');
    });

    it('returns valid for operator role', () => {
      const result = validateSchoolWideReadinessRole('operator');
      expect(result.valid).toBe(true);
      expect(result.role).toBe('operator');
    });

    it('returns invalid for unknown role', () => {
      const result = validateSchoolWideReadinessRole('superuser');
      expect(result.valid).toBe(false);
      expect(result.role).toBe('unknown');
      expect(result.reason).toContain('superuser');
    });
  });

  describe('validateSessionId', () => {
    it('returns true for valid session id', () => {
      expect(validateSessionId('abc123_def-ghi')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(validateSessionId('')).toBe(false);
    });

    it('returns false for session id with spaces', () => {
      expect(validateSessionId('abc 123')).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(validateSessionId(null as unknown as string)).toBe(false);
      expect(validateSessionId(undefined as unknown as string)).toBe(false);
    });

    it('returns false for too short session id', () => {
      expect(validateSessionId('ab')).toBe(false);
    });
  });

  describe('validateEnvironmentFlags', () => {
    it('returns valid when all required flags are present', () => {
      const flags = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgres://localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        TASK035_SCHOOL_WIDE_READINESS_MODE: 'controlled',
      };
      const result = validateEnvironmentFlags(flags);
      expect(result.valid).toBe(true);
      expect(result.missingFlags).toHaveLength(0);
    });

    it('returns missing flags when DATABASE_URL is empty', () => {
      const flags = {
        NODE_ENV: 'test',
        DATABASE_URL: '',
        REDIS_URL: 'redis://localhost:6379',
        TASK035_SCHOOL_WIDE_READINESS_MODE: 'controlled',
      };
      const result = validateEnvironmentFlags(flags);
      expect(result.valid).toBe(false);
      expect(result.missingFlags).toContain('DATABASE_URL');
    });

    it('returns missing flags when REDIS_URL is undefined', () => {
      const flags: Record<string, string | undefined> = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgres://localhost:5432/db',
        REDIS_URL: undefined,
        TASK035_SCHOOL_WIDE_READINESS_MODE: 'controlled',
      };
      const result = validateEnvironmentFlags(flags);
      expect(result.valid).toBe(false);
      expect(result.missingFlags).toContain('REDIS_URL');
    });

    it('reports multiple missing flags', () => {
      const result = validateEnvironmentFlags({});
      expect(result.valid).toBe(false);
      expect(result.missingFlags.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('validateNonEmptyString', () => {
    it('returns valid for non-empty string', () => {
      const result = validateNonEmptyString('hello', 'testField');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for empty string', () => {
      const result = validateNonEmptyString('', 'testField');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('testField');
    });

    it('returns invalid for non-string value', () => {
      const result = validateNonEmptyString(123, 'testField');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('number');
    });
  });

  describe('validateBlockingIssues', () => {
    it('returns valid for empty array', () => {
      const result = validateBlockingIssues([]);
      expect(result.valid).toBe(true);
    });

    it('returns valid for array of strings', () => {
      const result = validateBlockingIssues(['issue1', 'issue2']);
      expect(result.valid).toBe(true);
    });

    it('returns invalid for non-array input', () => {
      expect(validateBlockingIssues(null as unknown as string[]).valid).toBe(false);
      expect(validateBlockingIssues('string' as unknown as string[]).valid).toBe(false);
    });

    it('returns invalid if any issue is not a string', () => {
      const result = validateBlockingIssues(['issue1', 42 as unknown as string]);
      expect(result.valid).toBe(false);
    });
  });
});
