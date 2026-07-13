import { describe, it, expect } from 'vitest';
import {
  TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS,
} from '../contracts/task036LiveSchoolLaunchContracts';
import {
  validateForbiddenSideEffects,
} from '../lib/task036LiveSchoolLaunchValidation';

describe('Task036 Forbidden Side Effects', () => {
  it('list contains all expected forbidden patterns', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('fetch(');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('axios.');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('http.request');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('https.request');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('openai');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('anthropic');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('gemini');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('provider.generate');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('generateContent');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('chat.completions');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('webhook');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('liveConnector');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendEmail');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('twilio');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('prisma migrate deploy');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('DROP TABLE');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('.env');
  });

  it('patterns list has no duplicates', () => {
    const unique = new Set(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS);
    expect(unique.size).toBe(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS.length);
  });

  it('validateForbiddenSideEffects detects all pattern types', () => {
    const code = `
      fetch('url');
      axios.get('/api');
      openai.chat.completions.create();
      const smtp = nodemailer;
      twilio.sendSms();
      prisma migrate deploy;
      DROP TABLE users;
      kubectl apply -f deployment.yaml;
    `;
    const errors = validateForbiddenSideEffects(code);
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });

  it('validateForbiddenSideEffects returns empty for clean code', () => {
    const code = 'const x = 1; const y = x + 2; return y;';
    expect(validateForbiddenSideEffects(code)).toEqual([]);
  });

  it('patterns are properly escaped', () => {
    expect(validateForbiddenSideEffects('axios.post').length).toBeGreaterThan(0);
    expect(validateForbiddenSideEffects('axios.get').length).toBeGreaterThan(0);
  });
});
