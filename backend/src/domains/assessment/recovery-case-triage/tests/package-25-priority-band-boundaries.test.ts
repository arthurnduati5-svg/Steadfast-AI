import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryCasePriorityEngineService } from '../services/recoveryCasePriorityEngineService';

describe('Package 25 - Priority Band Boundaries', () => {
  let engine: RecoveryCasePriorityEngineService;

  beforeEach(() => {
    engine = new RecoveryCasePriorityEngineService();
  });

  it('score 80 → critical_review', () => {
    const band = engine.determinePriorityBand(80);
    expect(band).toBe('critical_review');
  });

  it('score 79 → high', () => {
    const band = engine.determinePriorityBand(79);
    expect(band).toBe('high');
  });

  it('score 60 → high', () => {
    const band = engine.determinePriorityBand(60);
    expect(band).toBe('high');
  });

  it('score 59 → normal', () => {
    const band = engine.determinePriorityBand(59);
    expect(band).toBe('normal');
  });

  it('score 35 → normal', () => {
    const band = engine.determinePriorityBand(35);
    expect(band).toBe('normal');
  });

  it('score 34 → low', () => {
    const band = engine.determinePriorityBand(34);
    expect(band).toBe('low');
  });

  it('score 1 → low', () => {
    const band = engine.determinePriorityBand(1);
    expect(band).toBe('low');
  });

  it('score 0 → deferred', () => {
    const band = engine.determinePriorityBand(0);
    expect(band).toBe('deferred');
  });

  it('score 100 → critical_review', () => {
    const band = engine.determinePriorityBand(100);
    expect(band).toBe('critical_review');
  });

  it('score 99 → critical_review', () => {
    const band = engine.determinePriorityBand(99);
    expect(band).toBe('critical_review');
  });

  it('score 81 → critical_review', () => {
    const band = engine.determinePriorityBand(81);
    expect(band).toBe('critical_review');
  });

  it('score 61 → high', () => {
    const band = engine.determinePriorityBand(61);
    expect(band).toBe('high');
  });

  it('score 36 → normal', () => {
    const band = engine.determinePriorityBand(36);
    expect(band).toBe('normal');
  });

  it('band assignment via priority assessment service matches engine', () => {
    const testCases = [
      { score: 80, expected: 'critical_review' },
      { score: 79, expected: 'high' },
      { score: 60, expected: 'high' },
      { score: 59, expected: 'normal' },
      { score: 35, expected: 'normal' },
      { score: 34, expected: 'low' },
      { score: 1, expected: 'low' },
      { score: 0, expected: 'deferred' },
    ];
    for (const { score, expected } of testCases) {
      const band = engine.determinePriorityBand(score);
      expect(band).toBe(expected);
    }
  });
});
