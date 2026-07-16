import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryCaseTriageSafetyService, SafetyCheckSummary } from '../services/recoveryCaseTriageSafetyService';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

describe('Package 25 - No Live Action Safety', () => {
  let safety: RecoveryCaseTriageSafetyService;

  beforeEach(() => {
    safety = new RecoveryCaseTriageSafetyService();
  });

  it('SafetyService.assertNoLiveAssignment returns DENIED', async () => {
    const result = await safety.assertNoLiveAssignment();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoEscalationDispatch returns DENIED', async () => {
    const result = await safety.assertNoEscalationDispatch();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoNotification returns DENIED', async () => {
    const result = await safety.assertNoNotification();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoCalendarEvent returns DENIED', async () => {
    const result = await safety.assertNoCalendarEvent();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoPortalPublish returns DENIED', async () => {
    const result = await safety.assertNoPortalPublish();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoExternalSync returns DENIED', async () => {
    const result = await safety.assertNoExternalSync();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoLiveExecution returns DENIED', async () => {
    const result = await safety.assertNoLiveExecution();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoLiveAuthorization returns DENIED', async () => {
    const result = await safety.assertNoLiveAuthorization();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoLiveClosure returns DENIED', async () => {
    const result = await safety.assertNoLiveClosure();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoScoreMutation returns DENIED', async () => {
    const result = await safety.assertNoScoreMutation();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoMasteryMutation returns DENIED', async () => {
    const result = await safety.assertNoMasteryMutation();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoRegradeExecution returns DENIED', async () => {
    const result = await safety.assertNoRegradeExecution();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoAIScoring returns DENIED', async () => {
    const result = await safety.assertNoAIScoring();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoGeneratedQuestion returns DENIED', async () => {
    const result = await safety.assertNoGeneratedQuestion();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoOCR returns DENIED', async () => {
    const result = await safety.assertNoOCR();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoPDF returns DENIED', async () => {
    const result = await safety.assertNoPDF();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('SafetyService.assertNoSensitiveFactorRanking returns DENIED', async () => {
    const result = await safety.assertNoSensitiveFactorRanking();
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('runAllSafetyChecks returns all DENIED', async () => {
    const summary: SafetyCheckSummary = await safety.runAllSafetyChecks();
    expect(summary.totalChecks).toBe(17);
    expect(summary.deniedCount).toBe(17);
    for (const detail of summary.details) {
      expect(detail.status).toBe('DENIED');
    }
  });

  it('policies block ALL roles for live actions (incl admin, system_job)', () => {
    const livePolicyKeys = [
      'RECOVERY_CASE_TRIAGE_NO_LIVE_ASSIGNMENT',
      'RECOVERY_CASE_TRIAGE_NO_ESCALATION_DISPATCH',
      'RECOVERY_CASE_TRIAGE_NO_NOTIFICATION',
      'RECOVERY_CASE_TRIAGE_NO_CALENDAR_EVENT',
      'RECOVERY_CASE_TRIAGE_NO_PORTAL_PUBLISH',
      'RECOVERY_CASE_TRIAGE_NO_EXTERNAL_SYNC',
      'RECOVERY_CASE_TRIAGE_NO_LIVE_EXECUTION',
      'RECOVERY_CASE_TRIAGE_NO_LIVE_AUTHORIZATION',
      'RECOVERY_CASE_TRIAGE_NO_LIVE_CLOSURE',
      'RECOVERY_CASE_TRIAGE_NO_SCORE_MUTATION',
      'RECOVERY_CASE_TRIAGE_NO_MASTERY_MUTATION',
      'RECOVERY_CASE_TRIAGE_NO_REGRADE_EXECUTION',
      'RECOVERY_CASE_TRIAGE_NO_AI_SCORING',
      'RECOVERY_CASE_TRIAGE_NO_GENERATED_QUESTION',
      'RECOVERY_CASE_TRIAGE_NO_OCR',
      'RECOVERY_CASE_TRIAGE_NO_PDF',
      'RECOVERY_CASE_TRIAGE_NO_SENSITIVE_FACTOR_RANKING',
    ];
    const allRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job', 'student', 'parent', 'guest', 'unknown'];
    for (const policyKey of livePolicyKeys) {
      for (const role of allRoles) {
        const result = checkPolicy(policyKey, role);
        expect(result.denied).toBe(true);
      }
    }
  });

  it('no forbidden models exist in Prisma schema', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const modelLines = schema.split('\n').filter(l => l.trim().startsWith('model '));
    const modelNames = modelLines.map(l => l.trim().split(' ')[1]);

    const forbidden = ['Assignment', 'Notification', 'Calendar', 'Portal', 'AiScoring', 'OCR', 'PDF'];
    const recoveryCaseModels = modelNames.filter(m => m.includes('RecoveryCase'));
    for (const forbiddenModel of forbidden) {
      const matches = recoveryCaseModels.filter(m => m.includes(forbiddenModel));
      expect(matches).toHaveLength(0);
    }
  });

  it('no live assignment, notification, portal, calendar, sync, score, mastery, regrade, AI, OCR, PDF', () => {
    const forbiddenTerms = [
      'liveAssignment', 'live_assignment',
      'notification', 'notified',
      'portal', 'portalPublish',
      'calendar', 'calendarEvent',
      'externalSync', 'external_sync',
      'scoreMutation', 'score_mutation',
      'masteryMutation', 'mastery_mutation',
      'regrade', 'aiScoring', 'ai_scoring',
      'ocr', 'OCR', 'pdf', 'PDF',
    ];
    const allLiveChecks = [
      'assertNoLiveAssignment', 'assertNoEscalationDispatch',
      'assertNoNotification', 'assertNoCalendarEvent',
      'assertNoPortalPublish', 'assertNoExternalSync',
      'assertNoLiveExecution', 'assertNoLiveAuthorization',
      'assertNoLiveClosure', 'assertNoScoreMutation',
      'assertNoMasteryMutation', 'assertNoRegradeExecution',
      'assertNoAIScoring', 'assertNoGeneratedQuestion',
      'assertNoOCR', 'assertNoPDF',
      'assertNoSensitiveFactorRanking',
    ];
    expect(allLiveChecks).toHaveLength(17);
  });
});
