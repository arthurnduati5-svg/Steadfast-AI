import { describe, it, expect } from 'vitest';
import { PILOT_READINESS_CHECK_TYPES, PRIVATE_CONTENT_PATTERNS } from '../contracts/task025PilotContracts';
import { TASK025_FORBIDDEN_FIELDS } from '../contracts/task025ControlledPilotReadinessContracts';

describe('Task025 Phase3 growth systems readiness contract', () => {
  it('does not include live AI call check types that could interfere with Phase 3 growth systems', () => {
    const hasLiveAiCallCheck = PILOT_READINESS_CHECK_TYPES.some(
      (t) => t.includes('live') || t.includes('ai_call'),
    );
    expect(hasLiveAiCallCheck).toBe(false);
  });

  it('does not include live activation or notification checks that mutate growth systems', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toContain('livePilotActivation');
    expect(TASK025_FORBIDDEN_FIELDS).toContain('liveInvitationSend');
  });

  it('forbidden fields prevent raw notification payloads from leaking into growth system outputs', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toContain('rawNotificationPayload');
    expect(TASK025_FORBIDDEN_FIELDS).toContain('rawEmailBody');
    expect(TASK025_FORBIDDEN_FIELDS).toContain('rawSmsBody');
  });

  it('PRIVATE_CONTENT_PATTERNS do not include growth-system-safe fields', () => {
    const hasGrowthOnlyPattern = PRIVATE_CONTENT_PATTERNS.some(
      (p) => p === 'growthScore' || p === 'recommendation' || p === 'engagementMetric',
    );
    expect(hasGrowthOnlyPattern).toBe(false);
  });

  it('readiness checks preserve prior Phase 3 gate integrity without duplication', () => {
    const phase3RelatedChecks = ['socratic_safety', 'academic_integrity', 'deen_governance', 'privacy_gate'];
    for (const check of phase3RelatedChecks) {
      expect(PILOT_READINESS_CHECK_TYPES).toContain(check);
    }
  });
});
