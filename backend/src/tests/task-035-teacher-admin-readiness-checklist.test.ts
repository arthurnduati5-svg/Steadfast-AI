import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Teacher/Admin Readiness Checklist', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035TeacherAdminReadinessChecklistService');
  });

  it('should export evaluateTeacherAdminReadiness function', () => {
    expect(typeof service.evaluateTeacherAdminReadiness).toBe('function');
  });

  it('should pass when all items complete', () => {
    const result = service.evaluateTeacherAdminReadiness();
    expect(result.ok).toBe(true);
    expect(result.allItemsComplete).toBe(true);
    expect(result.teachersKnowEscalationRoute).toBe(true);
    expect(result.teachersKnowSocraticPolicy).toBe(true);
    expect(result.teachersKnowNoAnswerKeyRule).toBe(true);
    expect(result.adminsKnowKillSwitchLocation).toBe(true);
    expect(result.staffKnowNoRawChatCopyRule).toBe(true);
    expect(result.staffKnowDeenReferralPath).toBe(true);
    expect(result.supportChannelReady).toBe(true);
  });
});
