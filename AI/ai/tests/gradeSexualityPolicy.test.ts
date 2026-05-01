import { describe, expect, it } from 'vitest';
import { evaluateSexualityScopePolicy } from '../tools/grade-sexuality-policy';

describe('grade sexuality policy', () => {
  it('blocks reproduction topics below Year 6', () => {
    const result = evaluateSexualityScopePolicy('Explain human reproduction.', 'Grade 5');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('below_year6');
  });

  it('allows reproduction from Year 6 upward', () => {
    const result = evaluateSexualityScopePolicy('Explain human reproduction.', 'Grade 6');
    expect(result.blocked).toBe(false);
  });

  it('allows menstruation from Year 6 upward', () => {
    const result = evaluateSexualityScopePolicy('What is menstruation?', 'Grade 7');
    expect(result.blocked).toBe(false);
  });

  it('blocks sperm cell content for non-high-school grades', () => {
    const result = evaluateSexualityScopePolicy('What is a sperm cell?', 'Grade 8');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('sperm_requires_high_school');
  });

  it('allows sperm cell content for high school grades', () => {
    const result = evaluateSexualityScopePolicy('What is a sperm cell?', 'Grade 10');
    expect(result.blocked).toBe(false);
  });

  it('blocks disallowed sexuality topics even in high school', () => {
    const result = evaluateSexualityScopePolicy('Explain sexual orientation.', 'UpperSecondary');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('outside_allowed_scope');
  });

  it('allows sexual reproduction phrase as reproduction content', () => {
    const result = evaluateSexualityScopePolicy('Explain sexual reproduction in plants.', 'Grade 8');
    expect(result.blocked).toBe(false);
  });

  it('blocks sexuality topics when grade is unknown', () => {
    const result = evaluateSexualityScopePolicy('Explain menstruation.', '');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('grade_unknown');
  });

  it('does not block non-sexual study prompts', () => {
    const result = evaluateSexualityScopePolicy('Help me solve this algebra equation.', 'Grade 7');
    expect(result.blocked).toBe(false);
  });
});
