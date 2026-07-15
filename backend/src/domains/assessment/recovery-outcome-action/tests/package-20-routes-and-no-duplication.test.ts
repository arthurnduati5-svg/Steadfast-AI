import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 20 - Routes and No-Duplication', () => {
  it('route file exists', () => {
    const routePath = path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts');
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('route file has POST /action-readiness endpoint', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain("router.post('/action-readiness'");
  });

  it('route file has GET /action-readiness endpoint', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain("router.get('/action-readiness'");
  });

  it('route file has POST /action-bundles endpoint', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain("router.post('/action-bundles'");
  });

  it('route file has continuation-action-drafts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('continuation-action-drafts');
  });

  it('route file has intensification-action-drafts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('intensification-action-drafts');
  });

  it('route file has pause-action-drafts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('pause-action-drafts');
  });

  it('route file has closure-action-drafts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('closure-action-drafts');
  });

  it('route file has approval-gates routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('approval-gates');
  });

  it('route file has mock-activation-queue routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('mock-activation-queue');
  });

  it('route file has dry-run-receipts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('dry-run-receipts');
  });

  it('route file has rollback-plans routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('rollback-plans');
  });

  it('route file has suppression-rules routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('suppression-rules');
  });

  it('route file has summaries routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    expect(content).toContain('/summaries');
  });

  it('route file uses schoolAuthMiddleware via index.ts mount', () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, '../../../../../src/index.ts'), 'utf-8');
    expect(indexContent).toContain('recovery-outcome-action');
    expect(indexContent).toContain('recoveryOutcomeActionRoutes');
  });

  it('route file does not import forbidden technologies', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeAction.ts'), 'utf-8');
    const forbidden = ['openai', 'genkit', 'pinecone', 'ollama', 'anthropic', 'gemini',
      'react', 'next', 'frontend', 'tesseract', 'ocr', 'nodemailer', 'twilio',
      'sendgrid', 'mailgun', 'whatsapp', 'pdfkit', 'puppeteer', 'playwright',
      'calendarClient', 'taskClient', 'portalClient', 'publishPortal', 'signedUrl',
      'jsonwebtoken', 'jwt', 'fetch(', 'axios', 'smtp', 'sendmail'];
    for (const f of forbidden) {
      expect(content).not.toContain(f);
    }
  });

  it('in-memory repositories do not import forbidden technologies', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../repositories/inMemoryRecoveryOutcomeActionRepositories.ts'), 'utf-8');
    const forbidden = ['openai', 'genkit', 'pinecone', 'ollama', 'anthropic', 'gemini',
      'react', 'next', 'frontend', 'tesseract', 'ocr', 'nodemailer', 'twilio',
      'sendgrid', 'mailgun', 'whatsapp', 'pdfkit', 'puppeteer', 'playwright',
      'calendarClient', 'taskClient', 'portalClient', 'publishPortal',
      'scoreMutation', 'masteryMutation', 'liveRecoveryActivation',
      'liveRecoveryCompletion', 'liveRecoveryClosure'];
    for (const f of forbidden) {
      expect(content).not.toContain(f);
    }
  });

  it('no Package 19 outcome decision duplication in action domain', () => {
    const files = [
      '../contracts/recoveryOutcomeActionReadinessContracts.ts',
      '../contracts/recoveryActionDraftContracts.ts',
      '../services/recoveryContinuationActionDraftService.ts',
    ];
    for (const f of files) {
      const content = fs.readFileSync(path.resolve(__dirname, f), 'utf-8');
      expect(content).not.toContain('RecoveryContinuationDecisionDraftRecord');
    }
  });
});
