import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 22 - Routes and No-Duplication', () => {
  it('route file exists at backend/src/routes/recoveryLifecycleClosure.ts', () => {
    const routePath = path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts');
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('route file has POST closure-readiness endpoint', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain("router.post('/closure-readiness'");
  });

  it('route file has GET closure-readiness endpoint', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain("router.get('/closure-readiness'");
  });

  it('route file has handoff-packets routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('handoff-packets');
  });

  it('route file has next-cycle-recommendations routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('next-cycle-recommendations');
  });

  it('route file has deferred-integration-tickets routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('deferred-integration-tickets');
  });

  it('route file has unresolved-risk-registers routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('unresolved-risk-registers');
  });

  it('route file has teacher-closure-review-packets routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('teacher-closure-review-packets');
  });

  it('route file has admin-governance-review-packets routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('admin-governance-review-packets');
  });

  it('route file has student-closure-reflection-drafts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('student-closure-reflection-drafts');
  });

  it('route file has parent-closure-guidance-drafts routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('parent-closure-guidance-drafts');
  });

  it('route file has archive-manifests routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('archive-manifests');
  });

  it('route file has final-lifecycle-summaries routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('final-lifecycle-summaries');
  });

  it('route is mounted in index.ts', () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, '../../../../../src/index.ts'), 'utf-8');
    expect(indexContent).toContain('recovery-lifecycle-closure');
    expect(indexContent).toContain('recoveryLifecycleClosureRoutes');
  });

  it('route file uses InMemory repos (safe default)', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).toContain('InMemoryRecoveryLifecycleClosureRepositories');
  });

  it('no Package 21 simulation duplication in routes', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    expect(content).not.toContain('RecoveryOutcomeExecutionSimulation');
    // NOTE: 'simulation-run' appears in '/handoff-packets/simulation-run/:runId' which
    // is a legitimate reference to Package 21 simulation runs by ID (reuse by reference).
    // Check for Package 21-specific route patterns that would indicate duplication:
    expect(content).not.toContain('simulation-plan');
    expect(content).not.toContain('simulation-step');
    expect(content).not.toContain('eligibility-check');
    expect(content).not.toContain('blocked-action-diagnostic');
    expect(content).not.toContain('failure-injection');
    expect(content).not.toContain('simulation-result');
    expect(content).not.toContain('readiness-verdict');
    // Verify Package 22 references Package 21 simulation runs by ID (by reference, not by duplication)
    expect(content).toContain('simulation-run'); // legitimate reference by ID
  });

  it('no Package 20 action-preparation duplication', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    const forbiddenPkg20 = ['RecoveryOutcomeActionReadiness', 'RecoveryOutcomeAction', 'action-bundle',
      'action-readiness', 'action-plans', 'action-runs'];
    for (const term of forbiddenPkg20) {
      expect(content).not.toContain(term);
    }
  });

  it('no Package 19 outcome-decision duplication', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    const forbiddenPkg19 = ['RecoveryOutcomeDecision', 'outcome-decision', 'decision-bundle',
      'decision-verdict', 'outcome-eligibility'];
    for (const term of forbiddenPkg19) {
      expect(content).not.toContain(term);
    }
  });

  it('no Package 18 progress-observation duplication', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    const forbiddenPkg18 = ['ProgressObservation', 'progress-observation', 'observation-record',
      'observation-evidence', 'ProgressNote'];
    for (const term of forbiddenPkg18) {
      expect(content).not.toContain(term);
    }
  });

  it('no Package 17 recovery-planning duplication', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    const forbiddenPkg17 = ['RecoveryPlan', 'recovery-plan', 'RecoveryGoal', 'RecoveryIntervention',
      'plan-goal', 'plan-intervention'];
    for (const term of forbiddenPkg17) {
      expect(content).not.toContain(term);
    }
  });

  it('route file does not import forbidden technologies', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../../../routes/recoveryLifecycleClosure.ts'), 'utf-8');
    // NOTE: 'next' is excluded from this scan because it appears legitimately in
    // 'next-cycle-recommendations' route group name. We check for other Next.js indicators.
    const forbidden = ['openai', 'genkit', 'pinecone', 'ollama', 'anthropic', 'gemini',
      'react', 'frontend', 'tesseract', 'ocr', 'nodemailer', 'twilio',
      'sendgrid', 'mailgun', 'whatsapp', 'pdfkit', 'puppeteer', 'playwright',
      'calendarClient', 'taskClient', 'portalClient', 'publishPortal', 'signedUrl',
      'jsonwebtoken', 'jwt', 'fetch(', 'axios', 'smtp', 'sendmail'];
    for (const f of forbidden) {
      expect(content).not.toContain(f);
    }
  });
});
