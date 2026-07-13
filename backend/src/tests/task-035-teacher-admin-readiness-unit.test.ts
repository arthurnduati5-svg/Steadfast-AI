import { describe, it, expect } from 'vitest';
import { evaluateTeacherAdminReadiness } from '../services/task035TeacherAdminReadinessChecklistService';

describe('task035TeacherAdminReadiness', () => {
  it('should return all items complete when every readiness item is true', () => {
    const result = evaluateTeacherAdminReadiness();
    expect(result.ok).toBe(true);
    expect(result.allItemsComplete).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should have teachers knowing escalation route and socratic policy', () => {
    const result = evaluateTeacherAdminReadiness();
    expect(result.teachersKnowEscalationRoute).toBe(true);
    expect(result.teachersKnowSocraticPolicy).toBe(true);
    expect(result.teachersKnowNoAnswerKeyRule).toBe(true);
  });

  it('should have admins knowing kill switch location and rollback process', () => {
    const result = evaluateTeacherAdminReadiness();
    expect(result.adminsKnowKillSwitchLocation).toBe(true);
    expect(result.adminsKnowRollbackProcess).toBe(true);
  });

  it('should have staff knowing raw chat copy rule, deen referral path, safeguarding boundary, and curriculum gap path', () => {
    const result = evaluateTeacherAdminReadiness();
    expect(result.staffKnowNoRawChatCopyRule).toBe(true);
    expect(result.staffKnowDeenReferralPath).toBe(true);
    expect(result.staffKnowSafeguardingEscalationBoundary).toBe(true);
    expect(result.staffKnowCurriculumGapPath).toBe(true);
  });

  it('should have support channel ready', () => {
    const result = evaluateTeacherAdminReadiness();
    expect(result.supportChannelReady).toBe(true);
  });
});
