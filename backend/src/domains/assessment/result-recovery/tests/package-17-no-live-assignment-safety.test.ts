import { describe, it, expect } from 'vitest';
import {
  InMemoryResultRecoveryAuditRepository,
  InMemoryResultRecoveryIdempotencyRepository,
} from '../repositories/inMemoryResultRecoveryRepositories';
import { ResultRecoverySafetyService } from '../services/resultRecoverySafetyService';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';

describe('Package 17 — No Live Assignment Safety', () => {
  it('Live homework assignment is blocked', () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoHomeworkAssignmentPayload({ homeworkAssignmentPayload: { task: 'math hw' } });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('HOMEWORK_ASSIGNMENT_PAYLOAD');
  });

  it('Live practice assignment is blocked', () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoPracticeAssignmentPayload({ practiceAssignmentPayload: { set: 'practice set' } });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('PRACTICE_ASSIGNMENT_PAYLOAD');
  });

  it('Live revision task is blocked', () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoRevisionTaskPayload({ revisionTaskPayload: { topic: 'algebra' } });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('REVISION_TASK_PAYLOAD');
  });

  it('Live teacher task creation is blocked', () => {
    const safety = new ResultRecoverySafetyService();
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const policy = enforcer.enforce('RESULT_RECOVERY_NO_LIVE_ASSIGNMENT', 'teacher');
    expect(policy.allowed).toBe(false);
    const liveCheck = safety.assertNoLiveAssignmentPayload({ liveAssignmentPayload: { task: 'teacher task' } });
    expect(liveCheck.allowed).toBe(false);
  });

  it('Live parent task creation is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const policy = enforcer.enforce('RESULT_RECOVERY_NO_LIVE_ASSIGNMENT', 'parent');
    expect(policy.allowed).toBe(false);
    expect(policy.reasonCode).toBe('RESULT_RECOVERY_NO_LIVE_ASSIGNMENT_BLOCKED');
  });

  it('Live student task creation is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const policy = enforcer.enforce('RESULT_RECOVERY_NO_LIVE_ASSIGNMENT', 'student');
    expect(policy.allowed).toBe(false);
    expect(policy.reasonCode).toBe('RESULT_RECOVERY_NO_LIVE_ASSIGNMENT_BLOCKED');
  });

  it('Live notification is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const policy = enforcer.enforce('RESULT_RECOVERY_NO_LIVE_NOTIFICATION', '*');
    expect(policy.allowed).toBe(false);

    const safety = new ResultRecoverySafetyService();
    const sms = safety.assertNoNotificationPayload({ smsPayload: 'text' });
    expect(sms.allowed).toBe(false);
    const email = safety.assertNoNotificationPayload({ emailPayload: 'text' });
    expect(email.allowed).toBe(false);
    const push = safety.assertNoNotificationPayload({ pushPayload: 'text' });
    expect(push.allowed).toBe(false);
  });

  it('Calendar event creation is blocked', () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoCalendarEventPayload({ calendarEventPayload: { date: '2026-07-20' } });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('CALENDAR_EVENT_PAYLOAD');
  });

  it('External task sync is blocked', () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoExternalSyncPayload({ externalSyncPayload: { target: 'google-classroom' } });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('EXTERNAL_SYNC_PAYLOAD');
  });

  it('External school sync is blocked', () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoExternalSyncPayload({ externalSyncPayload: { system: 'sis' } });
    expect(check.allowed).toBe(false);
  });

  it('AI narrative generation is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const policy = enforcer.enforce('RESULT_RECOVERY_NO_AI_NARRATIVE', 'teacher');
    expect(policy.allowed).toBe(false);
    expect(policy.reasonCode).toBe('RESULT_RECOVERY_NO_AI_NARRATIVE_BLOCKED');

    const safety = new ResultRecoverySafetyService();
    expect(safety.assertNoAiNarrative({ aiNarrative: 'story' }).allowed).toBe(false);
    expect(safety.assertNoAiNarrative({ generatedNarrative: 'story' }).allowed).toBe(false);
    expect(safety.assertNoAiNarrative({ modelOutput: 'story' }).allowed).toBe(false);
  });

  it('Question generation is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const policy = enforcer.enforce('RESULT_RECOVERY_NO_GENERATED_QUESTION', 'admin');
    expect(policy.allowed).toBe(false);
    expect(policy.reasonCode).toBe('RESULT_RECOVERY_NO_GENERATED_QUESTION_BLOCKED');

    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoGeneratedQuestion({ generatedQuestionText: 'What is 2+2?' });
    expect(check.allowed).toBe(false);
  });

  it('Generated answer key is blocked', () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoGeneratedAnswerKey({ generatedAnswerKey: 'Answer: 4' });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('GENERATED_ANSWER_KEY');
  });

  it('OCR execution is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const policy = enforcer.enforce('RESULT_RECOVERY_NO_OCR', 'teacher');
    expect(policy.allowed).toBe(false);
    expect(policy.reasonCode).toBe('RESULT_RECOVERY_NO_OCR_BLOCKED');

    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoOcrText({ ocrText: 'scanned text' });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('OCR_TEXT');
  });

  it('Real PDF generation is blocked', () => {
    const safety = new ResultRecoverySafetyService();
    expect(safety.assertNoPdfBinary({ pdfBinary: Buffer.from('pdf') }).allowed).toBe(false);
    expect(safety.assertNoPdfBinary({ pdfBuffer: Buffer.from('pdf') }).allowed).toBe(false);
    expect(safety.assertNoPdfBinary({ pdfBase64: 'base64data' }).allowed).toBe(false);
    expect(safety.assertNoHtmlExport({ htmlExport: '<html>' }).allowed).toBe(false);
  });

  it('Score mutation is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const policy = enforcer.enforce('RESULT_RECOVERY_NO_SCORE_MUTATION', 'teacher');
    expect(policy.allowed).toBe(false);
    expect(policy.reasonCode).toBe('RESULT_RECOVERY_NO_SCORE_MUTATION_BLOCKED');

    const safety = new ResultRecoverySafetyService();
    expect(safety.assertNoScoreMutation({ score: 85 }).allowed).toBe(false);
    expect(safety.assertNoScoreMutation({ mark: 'A' }).allowed).toBe(false);
    expect(safety.assertNoScoreMutation({ grade: 'pass' }).allowed).toBe(false);
    expect(safety.assertNoScoreMutation({ resultVersion: 2 }).allowed).toBe(false);
  });

  it('Mastery mutation is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const policy = enforcer.enforce('RESULT_RECOVERY_NO_MASTERY_MUTATION', 'teacher');
    expect(policy.allowed).toBe(false);
    expect(policy.reasonCode).toBe('RESULT_RECOVERY_NO_MASTERY_MUTATION_BLOCKED');

    const safety = new ResultRecoverySafetyService();
    expect(safety.assertNoMasteryMutation({ masteryScore: 0.8 }).allowed).toBe(false);
    expect(safety.assertNoMasteryMutation({ masteryLevel: 'proficient' }).allowed).toBe(false);
    expect(safety.assertNoMasteryMutation({ masterySignal: 'positive' }).allowed).toBe(false);
  });

  it('Result overwrite is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const planCreatePolicy = enforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', 'student');
    expect(planCreatePolicy.allowed).toBe(false);

    const safety = new ResultRecoverySafetyService();
    const scoreCheck = safety.assertNoScoreMutation({ score: 100 });
    expect(scoreCheck.allowed).toBe(false);

    const masteryCheck = safety.assertNoMasteryMutation({ masteryScore: 1.0 });
    expect(masteryCheck.allowed).toBe(false);
  });

  it('Regrade execution is blocked', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const scorePolicy = enforcer.enforce('RESULT_RECOVERY_NO_SCORE_MUTATION', 'system_job');
    expect(scorePolicy.allowed).toBe(false);

    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoScoreMutation({ score: 95 });
    expect(check.allowed).toBe(false);
  });

  it('External network calls are absent', () => {
    const safety = new ResultRecoverySafetyService();
    const syncCheck = safety.assertNoExternalSyncPayload({ externalSyncPayload: 'data' });
    expect(syncCheck.allowed).toBe(false);
    const providerCheck = safety.assertNoProviderSecret({ liveProviderPayload: 'api call' });
    expect(providerCheck.allowed).toBe(false);
    const apiKeyCheck = safety.assertNoProviderSecret({ apiKey: 'secret' });
    expect(apiKeyCheck.allowed).toBe(false);
  });
});
