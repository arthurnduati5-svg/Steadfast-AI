import { describe, it, expect } from 'vitest';
import serverTeacher from '../flows/serverTeacher';

describe('serverTeacher - deterministic plain text output', () => {

  it('produces clean, plain student text', async () => {
    const r = await serverTeacher({
      text: 'explain algebra basics',
      preferences: {
        userId: 'u77',
        preferredLanguage: 'english',
        interests: []
      },
      state: {
        awaitingPracticeQuestionAnswer: false,
        validationAttemptCount: 0,
        correctAnswers: [],
        adaptMode: 'normal'
      }
    });

    expect(typeof r.text).toBe('string');
    expect(r.text.length).toBeGreaterThan(5);
    expect(r.text.includes('*')).toBe(false);
    expect(r.text.includes('`')).toBe(false);
    expect(r.text.includes('\\')).toBe(false);
    expect(r.text.endsWith('?')).toBe(true);
  });

});
