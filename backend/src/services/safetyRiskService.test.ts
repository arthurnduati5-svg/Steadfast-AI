import { describe, expect, it } from 'vitest';
import { detectSafetyRisk } from './safetyRiskService';

describe('detectSafetyRisk', () => {
  it('flags immediate self-harm as critical', () => {
    const result = detectSafetyRisk('I want to kill myself tonight. I have a plan.');
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('self_harm');
    expect(result.severity).toBe('critical');
    expect(result.needsCounselorReport).toBe(true);
  });

  it('suppresses keyword-only academic suicide query', () => {
    const result = detectSafetyRisk('Can you define suicide for my assignment in class?');
    expect(result.flagged).toBe(false);
    expect(result.severity).toBeNull();
  });

  it('flags first-person distress cluster', () => {
    const result = detectSafetyRisk("I feel depressed, alone, and worthless these days.");
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('self_harm');
    expect(['medium', 'high', 'critical']).toContain(result.severity);
  });

  it('flags targeted violence context', () => {
    const result = detectSafetyRisk('They will beat me when I get home and I am scared.');
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('violence');
    expect(['medium', 'high', 'critical']).toContain(result.severity);
  });

  it('suppresses benign beat usage', () => {
    const result = detectSafetyRisk('How do I beat the game level 5 in class?');
    expect(result.flagged).toBe(false);
  });

  it('flags first-person runaway intent', () => {
    const result = detectSafetyRisk('I will run away from home tonight.');
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('abuse');
    expect(['medium', 'high', 'critical']).toContain(result.severity);
  });

  it('flags Arabic immediate self-harm intent as critical', () => {
    const result = detectSafetyRisk('أريد أن أموت الليلة ولدي خطة الآن.');
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('self_harm');
    expect(result.severity).toBe('critical');
  });

  it('flags Swahili targeted violence with context', () => {
    const result = detectSafetyRisk('Watanipiga nyumbani leo, nisaidie tafadhali.');
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('violence');
    expect(['medium', 'high', 'critical']).toContain(result.severity);
  });

  it('suppresses Arabic academic keyword-only query', () => {
    const result = detectSafetyRisk('ما معنى الانتحار في درس اليوم؟');
    expect(result.flagged).toBe(false);
    expect(result.severity).toBeNull();
  });

  it('suppresses Swahili benign beat usage', () => {
    const result = detectSafetyRisk('Ninawezaje kupiga game level ya tano darasani?');
    expect(result.flagged).toBe(false);
  });
});
