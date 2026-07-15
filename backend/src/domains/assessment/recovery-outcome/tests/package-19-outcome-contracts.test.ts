import { describe, it, expect } from 'vitest';
import * as contracts from '../contracts';
import * as fs from 'fs';
import * as path from 'path';
import { RecoveryOutcomePolicyEnforcer, RECOVERY_OUTCOME_POLICY_FAMILIES } from '../policies/recoveryOutcomePolicyDefinitions';

describe('Package 19 — Outcome Contracts', () => {

  it('imported module is defined', () => {
    expect(contracts).toBeDefined();
  });

  it('ALLOWED_OUTCOME_CREATION_ROLES contains teacher, lead_teacher, department_head, admin, system_job', () => {
    const allowed = contracts.ALLOWED_OUTCOME_CREATION_ROLES;
    expect(allowed).toContain('teacher');
    expect(allowed).toContain('lead_teacher');
    expect(allowed).toContain('department_head');
    expect(allowed).toContain('admin');
    expect(allowed).toContain('system_job');
    expect(allowed.length).toBeGreaterThanOrEqual(5);
  });

  it('BLOCKED_OUTCOME_CREATION_ROLES contains student, parent, guest, unknown', () => {
    const blocked = contracts.BLOCKED_OUTCOME_CREATION_ROLES;
    expect(blocked).toContain('student');
    expect(blocked).toContain('parent');
    expect(blocked).toContain('guest');
    expect(blocked).toContain('unknown');
    expect(blocked.length).toBeGreaterThanOrEqual(4);
  });

  it('ALLOWED_OUTCOME_CREATION_ROLES and BLOCKED_OUTCOME_CREATION_ROLES have no overlap', () => {
    const allowed = new Set(contracts.ALLOWED_OUTCOME_CREATION_ROLES);
    for (const role of contracts.BLOCKED_OUTCOME_CREATION_ROLES) {
      expect(allowed.has(role)).toBe(false);
    }
  });

  it('FORBIDDEN_OUTCOME_FIELDS contains liveRecoveryCompletionPayload', () => {
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('liveRecoveryCompletionPayload');
  });

  it('FORBIDDEN_OUTCOME_FIELDS contains liveRecoveryClosurePayload', () => {
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('liveRecoveryClosurePayload');
  });

  it('FORBIDDEN_OUTCOME_FIELDS contains liveAssignmentPayload', () => {
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('liveAssignmentPayload');
  });

  it('FORBIDDEN_OUTCOME_FIELDS blocks notification payloads', () => {
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('parentNotificationPayload');
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('studentNotificationPayload');
  });

  it('FORBIDDEN_OUTCOME_FIELDS blocks score and mastery mutation payloads', () => {
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('scoreMutationPayload');
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('masteryMutationPayload');
  });

  it('FORBIDDEN_OUTCOME_FIELDS blocks AI narratives and generated questions', () => {
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('aiNarrative');
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('generatedQuestionText');
  });

  it('FORBIDDEN_OUTCOME_FIELDS blocks OCR, PDF, and external sync payloads', () => {
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('ocrText');
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('pdfBinary');
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS).toContain('externalSyncPayload');
  });

  it('FORBIDDEN_OUTCOME_FIELDS has at least 20 entries', () => {
    expect(contracts.FORBIDDEN_OUTCOME_FIELDS.length).toBeGreaterThanOrEqual(20);
  });

  it('RecoveryOutcomePolicyEnforcer is exported from policies', async () => {
    const { RecoveryOutcomePolicyEnforcer } = await import('../policies/recoveryOutcomePolicyDefinitions');
    const enforcer = new RecoveryOutcomePolicyEnforcer();
    expect(enforcer.enforce).toBeDefined();
  });

  it('RecoveryOutcomePolicyEnforcer.enforce returns deny for unknown policy family', () => {
    const enforcer = new RecoveryOutcomePolicyEnforcer();
    const result = enforcer.enforce('UNKNOWN_POLICY', 'teacher');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('POLICY_NOT_FOUND');
  });

  it('RecoveryOutcomePolicyEnforcer.enforce blocks student role for decision readiness', () => {
    const enforcer = new RecoveryOutcomePolicyEnforcer();
    const result = enforcer.enforce('RECOVERY_OUTCOME_DECISION_READINESS_CREATION', 'student');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ROLE_BLOCKED');
  });

  it('RecoveryOutcomePolicyEnforcer.enforce allows teacher role for decision readiness', () => {
    const enforcer = new RecoveryOutcomePolicyEnforcer();
    const result = enforcer.enforce('RECOVERY_OUTCOME_DECISION_READINESS_CREATION', 'teacher');
    expect(result.allowed).toBe(true);
  });

  it('RecoveryOutcomePolicyEnforcer.enforce allows admin role for exit criteria', () => {
    const enforcer = new RecoveryOutcomePolicyEnforcer();
    const result = enforcer.enforce('RECOVERY_EXIT_CRITERIA_CREATION', 'admin');
    expect(result.allowed).toBe(true);
  });

  it('RecoveryOutcomePolicyEnforcer.enforce blocks student role for exit criteria', () => {
    const enforcer = new RecoveryOutcomePolicyEnforcer();
    const result = enforcer.enforce('RECOVERY_EXIT_CRITERIA_CREATION', 'student');
    expect(result.allowed).toBe(false);
  });

  it('RecoveryOutcomePolicyEnforcer.enforce blocks student for exit criteria evaluation', () => {
    const enforcer = new RecoveryOutcomePolicyEnforcer();
    const result = enforcer.enforce('RECOVERY_EXIT_CRITERIA_EVALUATION', 'student');
    expect(result.allowed).toBe(false);
  });

  it('RecoveryOutcomePolicyEnforcer.enforce blocks student for all 4 draft types', () => {
    const enforcer = new RecoveryOutcomePolicyEnforcer();
    expect(enforcer.enforce('RECOVERY_CONTINUATION_DRAFT_CREATION', 'student').allowed).toBe(false);
    expect(enforcer.enforce('RECOVERY_INTENSIFICATION_DRAFT_CREATION', 'student').allowed).toBe(false);
    expect(enforcer.enforce('RECOVERY_PAUSE_DRAFT_CREATION', 'student').allowed).toBe(false);
    expect(enforcer.enforce('RECOVERY_CLOSURE_DRAFT_CREATION', 'student').allowed).toBe(false);
  });

  it('RecoveryOutcomePolicyEnforcer.enforce blocks student for teacher review packet', () => {
    const enforcer = new RecoveryOutcomePolicyEnforcer();
    const result = enforcer.enforce('RECOVERY_OUTCOME_TEACHER_REVIEW_PACKET_CREATION', 'student');
    expect(result.allowed).toBe(false);
  });

  it('RECOVERY_OUTCOME_POLICY_FAMILIES contains all expected families', () => {
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_DECISION_READINESS_CREATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_EXIT_CRITERIA_CREATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_EXIT_CRITERIA_EVALUATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_CONTINUATION_DRAFT_CREATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_INTENSIFICATION_DRAFT_CREATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_PAUSE_DRAFT_CREATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_CLOSURE_DRAFT_CREATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_TEACHER_REVIEW_PACKET_CREATION');
  });

  it('RECOVERY_OUTCOME_POLICY_FAMILIES includes no-live-action families', () => {
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_LIVE_COMPLETION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_LIVE_ASSIGNMENT');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_LIVE_NOTIFICATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_SCORE_MUTATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_MASTERY_MUTATION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_REGRADE_EXECUTION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_GENERATED_QUESTION');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_AI_NARRATIVE');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_OCR');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_PDF');
    expect(RECOVERY_OUTCOME_POLICY_FAMILIES).toHaveProperty('RECOVERY_OUTCOME_NO_EXTERNAL_SYNC');
  });

  it('no-live-action policy families block all roles', () => {
    const families = [
      'RECOVERY_OUTCOME_NO_LIVE_COMPLETION', 'RECOVERY_OUTCOME_NO_LIVE_ASSIGNMENT',
      'RECOVERY_OUTCOME_NO_LIVE_NOTIFICATION', 'RECOVERY_OUTCOME_NO_SCORE_MUTATION',
      'RECOVERY_OUTCOME_NO_MASTERY_MUTATION', 'RECOVERY_OUTCOME_NO_REGRADE_EXECUTION',
      'RECOVERY_OUTCOME_NO_GENERATED_QUESTION', 'RECOVERY_OUTCOME_NO_AI_NARRATIVE',
      'RECOVERY_OUTCOME_NO_OCR', 'RECOVERY_OUTCOME_NO_PDF', 'RECOVERY_OUTCOME_NO_EXTERNAL_SYNC',
    ];
    for (const family of families) {
      const def = RECOVERY_OUTCOME_POLICY_FAMILIES[family];
      expect(def.allowedRoles).toEqual([]);
      expect(def.failClosed).toBe(true);
      expect(def.failClosedDecision).toBe('deny');
    }
  });

  it('no forbidden imports from live-execution domains in contracts', () => {
    const contractsDir = path.resolve(__dirname, '../contracts');
    const files = fs.readdirSync(contractsDir).filter(f => f.endsWith('.ts'));
    const combined = files.map(f => fs.readFileSync(path.join(contractsDir, f), 'utf-8')).join('\n');
    const importLines = combined.split('\n').filter(l => l.includes('from ') || l.includes('require('));
    const forbiddenImports = ['openai', 'genkit', 'pinecone', 'ollama', 'anthropic', 'gemini', 'react', 'frontend', 'tesseract', 'ocr', 'nodemailer', 'twilio', 'sendgrid', 'mailgun', 'whatsapp', 'pdfkit', 'puppeteer', 'playwright', 'calendarClient', 'taskClient', 'portalClient', 'publishPortal', 'signedUrl', 'jsonwebtoken', 'jwt'];
    const combinedImports = importLines.join('\n');
    for (const fi of forbiddenImports) {
      expect(combinedImports).not.toContain(fi);
    }
  });
});
