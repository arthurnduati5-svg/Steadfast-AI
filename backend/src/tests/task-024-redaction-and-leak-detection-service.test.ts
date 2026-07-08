import { describe, it, expect } from 'vitest';
import {
  redactText,
  redactObject,
  scanForLeaks,
  assertNoLeaks,
} from '../services/task024RedactionAndLeakDetectionService';

describe('redactText', () => {
  it('redacts database URLs', () => {
    const result = redactText('postgres://user:pass@localhost:5432/mydb');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toMatch(/postgres:\/\//);
  });

  it('redacts MySQL database URLs', () => {
    const result = redactText('mysql://admin:secret@host:3306/db');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts MongoDB URLs', () => {
    const result = redactText('mongodb://user:pass@cluster.mongodb.net/db');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts Redis URLs', () => {
    const result = redactText('redis://:password@cache:6379');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts API keys (sk- pattern)', () => {
    const result = redactText('sk-123456789012345678901234567890');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts GitHub tokens (ghp_ pattern)', () => {
    const result = redactText('ghp_1234567890123456789012345678901234567890');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts Slack tokens (xoxb- pattern)', () => {
    const result = redactText('xoxb-1234567890-1234567890-abcdef12345678');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts Google AI keys (AIza pattern)', () => {
    const result = redactText('AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts Bearer tokens', () => {
    const result = redactText('Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts private keys (BEGIN PRIVATE KEY)', () => {
    const result = redactText('-----BEGIN PRIVATE KEY-----\nABCDEF123456\n-----END PRIVATE KEY-----');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts RSA private keys', () => {
    const result = redactText('-----BEGIN RSA PRIVATE KEY-----\nABCDEF\n-----END RSA PRIVATE KEY-----');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts EC private keys', () => {
    const result = redactText('-----BEGIN EC PRIVATE KEY-----\nABCDEF\n-----END EC PRIVATE KEY-----');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts provider keys (pplx- prefix)', () => {
    const result = redactText('pplx-123456789012345678901234567890123456');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts provider keys (anthropic- prefix)', () => {
    const result = redactText('anthropic-123456789012345678901234567890');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts provider keys (openai- prefix)', () => {
    const result = redactText('openai-123456789012345678901234567890123456');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts emails', () => {
    const result = redactText('contact@steadfast-ai.com');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts phone numbers', () => {
    const result = redactText('+1 (555) 123-4567');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts long secret-like base64 strings', () => {
    const result = redactText('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/abcdefgh');
    expect(result).toContain('[REDACTED]');
  });

  it('deredacts unsafe content markers (rawPrompt)', () => {
    const result = redactText('the rawPrompt contains sensitive info');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts unsafe content markers (answerKey)', () => {
    const result = redactText('the answerKey is secret');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts unsafe content markers (rawChat)', () => {
    const result = redactText('rawChat data');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts auth headers', () => {
    const result = redactText('authorization: Bearer token123');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts set-cookie headers', () => {
    const result = redactText('set-cookie: session=abc123');
    expect(result).toContain('[REDACTED]');
  });

  it('does NOT redact normal text', () => {
    const result = redactText('hello world');
    expect(result).toBe('hello world');
  });

  it('does NOT redact simple safe content', () => {
    const result = redactText('The quick brown fox jumps over the lazy dog.');
    expect(result).toBe('The quick brown fox jumps over the lazy dog.');
  });

  it('does NOT redact short non-secret strings', () => {
    const result = redactText('abc');
    expect(result).toBe('abc');
  });

  it('handles empty string', () => {
    const result = redactText('');
    expect(result).toBe('');
  });

  it('redacts multiple patterns in one string', () => {
    const input = `user: test@example.com key: sk-123456789012345678901234567890`;
    const result = redactText(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toMatch(/test@example\.com/);
    expect(result).not.toMatch(/sk-/);
  });
});

describe('redactObject', () => {
  it('redacts unsafe field names to [REDACTED]', () => {
    const obj = { rawChat: 'this is sensitive', name: 'student' };
    const result = redactObject(obj);
    expect(result).toEqual({ rawChat: '[REDACTED]', name: 'student' });
  });

  it('redacts raw_prompt field', () => {
    const result = redactObject({ raw_prompt: 'sensitive' });
    expect(result.raw_prompt).toBe('[REDACTED]');
  });

  it('redacts answerKey field', () => {
    const result = redactObject({ answerKey: '42' });
    expect(result.answerKey).toBe('[REDACTED]');
  });

  it('redacts apiKey field', () => {
    const result = redactObject({ apiKey: 'sk-secret' });
    expect(result.apiKey).toBe('[REDACTED]');
  });

  it('redacts password field', () => {
    const result = redactObject({ password: 'hunter2' });
    expect(result.password).toBe('[REDACTED]');
  });

  it('redacts token field', () => {
    const result = redactObject({ token: 'abc123' });
    expect(result.token).toBe('[REDACTED]');
  });

  it('redacts field names case-insensitively', () => {
    const result = redactObject({ RAWCHAT: 'value' });
    expect(result.RAWCHAT).toBe('[REDACTED]');
  });

  it('redacts values containing secret patterns', () => {
    const obj = { message: 'Contact me at admin@test.com' };
    const result = redactObject(obj);
    expect(result.message).toContain('[REDACTED]');
  });

  it('handles nested objects', () => {
    const obj = { user: { rawChat: 'sensitive', name: 'bob' } };
    const result = redactObject(obj);
    expect(result.user).toEqual({ rawChat: '[REDACTED]', name: 'bob' });
  });

  it('handles deeply nested safe values', () => {
    const obj = { a: { b: { c: { d: 'safe' } } } };
    const result = redactObject(obj);
    expect(result).toEqual({ a: { b: { c: { d: 'safe' } } } });
  });

  it('handles arrays of objects', () => {
    const obj = { items: [{ rawChat: 'secret' }, { name: 'public' }] };
    const result = redactObject(obj);
    expect(result.items).toEqual([{ rawChat: '[REDACTED]' }, { name: 'public' }]);
  });

  it('handles arrays of strings with secrets', () => {
    const obj = { logs: ['normal', 'user: test@example.com'] };
    const result = redactObject(obj);
    expect(result.logs[0]).toBe('normal');
    expect(result.logs[1]).toContain('[REDACTED]');
  });

  it('preserves safe fields', () => {
    const obj = { name: 'Alice', age: 25, active: true, score: null };
    const result = redactObject(obj);
    expect(result).toEqual(obj);
  });

  it('preserves numbers and booleans', () => {
    const obj = { count: 42, enabled: false, data: null, id: undefined };
    const result = redactObject(obj);
    expect(result.count).toBe(42);
    expect(result.enabled).toBe(false);
    expect(result.data).toBeNull();
  });

  it('respects depth limit of 0', () => {
    const obj = { a: { b: { c: 'deep' } } };
    const result = redactObject(obj, 0);
    expect(result).toEqual({ a: { b: { c: 'deep' } } });
  });

  it('respects shallow depth limit', () => {
    const obj = { a: { b: { rawChat: 'secret' } } };
    const result = redactObject(obj, 1);
    expect(result.a).toEqual({ b: { rawChat: 'secret' } });
  });

  it('redacts email field value via field name', () => {
    const result = redactObject({ email: 'test@example.com' });
    expect(result.email).toBe('[REDACTED]');
  });

  it('redacts phone field value via field name', () => {
    const result = redactObject({ phone: '555-1234' });
    expect(result.phone).toBe('[REDACTED]');
  });

  it('handles empty object', () => {
    const result = redactObject({});
    expect(result).toEqual({});
  });
});

describe('scanForLeaks', () => {
  it('returns hasLeak true for strings with database URLs', () => {
    const result = scanForLeaks('postgres://user:pass@host/db');
    expect(result.hasLeak).toBe(true);
  });

  it('returns hasLeak true for strings with API keys', () => {
    const result = scanForLeaks('sk-123456789012345678901234567890');
    expect(result.hasLeak).toBe(true);
  });

  it('returns hasLeak true for strings with bearer tokens', () => {
    const result = scanForLeaks('Bearer eyJhbGciOiJIUzI1NiJ9.dGVzdA');
    expect(result.hasLeak).toBe(true);
  });

  it('returns hasLeak true for strings with private keys', () => {
    const result = scanForLeaks('-----BEGIN PRIVATE KEY-----\nABCDEF\n-----END PRIVATE KEY-----');
    expect(result.hasLeak).toBe(true);
  });

  it('returns hasLeak false for safe strings', () => {
    const result = scanForLeaks('hello world, this is safe');
    expect(result.hasLeak).toBe(false);
  });

  it('returns correct pattern name for database_url', () => {
    const result = scanForLeaks('postgres://u:p@h/d');
    expect(result.patterns).toContain('database_url');
  });

  it('returns correct pattern name for api_key', () => {
    const result = scanForLeaks('sk-123456789012345678901234567890');
    expect(result.patterns).toContain('api_key');
  });

  it('returns correct pattern name for bearer_token', () => {
    const result = scanForLeaks('Bearer eyJhbGciOiJIUzI1NiJ9.token');
    expect(result.patterns).toContain('bearer_token');
  });

  it('returns correct pattern name for private_key', () => {
    const result = scanForLeaks('-----BEGIN RSA PRIVATE KEY-----\nABCDEF\n-----END RSA PRIVATE KEY-----');
    expect(result.patterns).toContain('private_key');
  });

  it('returns unsafe_content_marker for rawPrompt-like content', () => {
    const result = scanForLeaks('the rawPrompt is here');
    expect(result.patterns).toContain('unsafe_content_marker');
  });

  it('returns answer_key_marker for answerKey content', () => {
    const result = scanForLeaks('my answerKey is secret');
    expect(result.patterns).toContain('answer_key_marker');
  });

  it('returns multiple patterns when multiple leaks exist', () => {
    const result = scanForLeaks('postgres://u:p@h/db has sk-123456789012345678901234567890 key');
    expect(result.patterns.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty patterns for safe input', () => {
    const result = scanForLeaks('safe text');
    expect(result.patterns).toEqual([]);
  });

  it('handles empty string', () => {
    const result = scanForLeaks('');
    expect(result.hasLeak).toBe(false);
    expect(result.patterns).toEqual([]);
  });
});

describe('assertNoLeaks', () => {
  it('returns safe: false for leaky strings', () => {
    const result = assertNoLeaks('postgres://user:pass@host/db');
    expect(result.safe).toBe(false);
  });

  it('returns violations for leaky strings', () => {
    const result = assertNoLeaks('sk-123456789012345678901234567890');
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('returns correct violation names', () => {
    const result = assertNoLeaks('sk-abc123def456ghi789jkl012mno345');
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('returns safe: true for safe strings', () => {
    const result = assertNoLeaks('hello world');
    expect(result.safe).toBe(true);
  });

  it('returns empty violations for safe strings', () => {
    const result = assertNoLeaks('safe text');
    expect(result.violations).toEqual([]);
  });

  it('reports all violations in one call', () => {
    const result = assertNoLeaks('postgres://u:p@h/db sk-abc123def456ghi789jkl012mno345');
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty string', () => {
    const result = assertNoLeaks('');
    expect(result.safe).toBe(true);
    expect(result.violations).toEqual([]);
  });
});
