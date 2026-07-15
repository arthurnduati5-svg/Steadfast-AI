import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 21 - Routes and No-Duplication', () => {
  it('route file exists', () => {
    const routePath = path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts');
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('route file has POST /simulation-readiness endpoint', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain("router.post('/simulation-readiness'");
  });

  it('route file has GET /simulation-readiness endpoint', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain("router.get('/simulation-readiness'");
  });

  it('route file has simulation-plans routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('simulation-plans');
  });

  it('route file has simulation-runs routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('simulation-runs');
  });

  it('route file has simulation-steps routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('simulation-steps');
  });

  it('route file has eligibility-checks routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('eligibility-checks');
  });

  it('route file has blocked-action-diagnostics routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('blocked-action-diagnostics');
  });

  it('route file has failure-injections routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('failure-injections');
  });

  it('route file has simulation-results routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('simulation-results');
  });

  it('route file has teacher-simulation-reviews routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('teacher-simulation-reviews');
  });

  it('route file has student-preview-drafts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('student-preview-drafts');
  });

  it('route file has parent-preview-drafts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('parent-preview-drafts');
  });

  it('route file has readiness-verdicts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('readiness-verdicts');
  });

  it('route file has summaries routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
    expect(content).toContain('/summaries');
  });

  it('route file uses schoolAuthMiddleware via index.ts mount', () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, '../../../../../src/index.ts'), 'utf-8');
    expect(indexContent).toContain('recovery-outcome-execution-simulation');
    expect(indexContent).toContain('recoveryOutcomeExecutionSimulationRoutes');
  });

  it('route file does not import forbidden technologies', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryOutcomeExecutionSimulation.ts'), 'utf-8');
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
      path.resolve(__dirname, '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts'), 'utf-8');
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

  it('no Package 20 action-preparation duplication in simulation domain', () => {
    const files = [
      '../contracts/recoveryOutcomeExecutionSimulationReadinessContracts.ts',
      '../contracts/recoveryOutcomeExecutionSimulationPlanContracts.ts',
      '../contracts/recoveryOutcomeExecutionSimulationRunContracts.ts',
    ];
    for (const f of files) {
      const content = fs.readFileSync(path.resolve(__dirname, f), 'utf-8');
      expect(content).not.toContain('RecoveryOutcomeActionReadiness');
    }
  });
});
