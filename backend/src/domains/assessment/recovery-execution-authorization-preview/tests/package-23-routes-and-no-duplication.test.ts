import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function readRouteFile(): string {
  return fs.readFileSync(
    path.resolve(__dirname, '../../../../routes/recoveryExecutionAuthorizationPreview.ts'), 'utf-8');
}

describe('Package 23 - Routes and No-Duplication', () => {
  it('route file exists at backend/src/routes/recoveryExecutionAuthorizationPreview.ts', () => {
    const routePath = path.resolve(__dirname, '../../../../routes/recoveryExecutionAuthorizationPreview.ts');
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('route file has authorization-readiness routes', () => {
    expect(readRouteFile()).toContain('authorization-readiness');
  });

  it('route file has authorization-request-drafts routes', () => {
    expect(readRouteFile()).toContain('authorization-request-drafts');
  });

  it('route file has authorization-eligibility-checks routes', () => {
    expect(readRouteFile()).toContain('authorization-eligibility-checks');
  });

  it('route file has authority-matrix-snapshots routes', () => {
    expect(readRouteFile()).toContain('authority-matrix-snapshots');
  });

  it('route file has approval-chain-drafts routes', () => {
    expect(readRouteFile()).toContain('approval-chain-drafts');
  });

  it('route file has risk-attestations routes', () => {
    expect(readRouteFile()).toContain('risk-attestations');
  });

  it('route file has consent-boundary-checks routes', () => {
    expect(readRouteFile()).toContain('consent-boundary-checks');
  });

  it('route file has vetoes routes', () => {
    expect(readRouteFile()).toContain('vetoes');
  });

  it('route file has preflight-checklists routes', () => {
    expect(readRouteFile()).toContain('preflight-checklists');
  });

  it('route file has authorization-dry-runs routes', () => {
    expect(readRouteFile()).toContain('authorization-dry-runs');
  });

  it('route file has pre-live-decision-packets routes', () => {
    expect(readRouteFile()).toContain('pre-live-decision-packets');
  });

  it('route file has mock-authorization-receipts routes', () => {
    expect(readRouteFile()).toContain('mock-authorization-receipts');
  });

  it('route file has authorization-summaries routes', () => {
    expect(readRouteFile()).toContain('authorization-summaries');
  });

  it('route file does NOT import AI, notification, PDF, frontend technologies', () => {
    const content = readRouteFile();
    const forbidden = ['openai', 'genkit', 'pinecone', 'ollama', 'anthropic', 'gemini',
      'react', 'frontend', 'tesseract', 'ocr', 'nodemailer', 'twilio',
      'sendgrid', 'mailgun', 'whatsapp', 'pdfkit', 'puppeteer', 'playwright',
      'calendarClient', 'taskClient', 'portalClient', 'publishPortal', 'signedUrl',
      'jsonwebtoken', 'jwt', 'fetch(', 'axios', 'smtp', 'sendmail'];
    for (const f of forbidden) {
      expect(content).not.toContain(f);
    }
  });

  it('route is mounted in index.ts', () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, '../../../../../src/index.ts'), 'utf-8');
    expect(indexContent).toContain('recovery-execution-authorization-preview');
    expect(indexContent).toContain('recoveryExecutionAuthorizationPreviewRoutes');
  });

  it('route file uses InMemory repos (safe default)', () => {
    expect(readRouteFile()).toContain('InMemoryRecoveryExecutionAuthorizationPreviewRepositories');
  });

  it('route file uses schoolAuthMiddleware and requireVerifiedSchoolContext', () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, '../../../../../src/index.ts'), 'utf-8');
    expect(indexContent).toContain('schoolAuthMiddleware');
    expect(indexContent).toContain('requireVerifiedSchoolContext');
  });

  it('no Package 22 lifecycle-closure duplication in the route file', () => {
    const content = readRouteFile();
    const forbiddenPkg22 = ['closure-readiness', 'handoff-packets', 'next-cycle-recommendations',
      'deferred-integration-tickets', 'unresolved-risk-registers', 'teacher-closure-review-packets',
      'admin-governance-review-packets', 'student-closure-reflection-drafts', 'parent-closure-guidance-drafts',
      'archive-manifests', 'final-lifecycle-summaries'];
    for (const term of forbiddenPkg22) {
      expect(content).not.toContain(term);
    }
  });

  it('no live authorization routes', () => {
    const content = readRouteFile();
    const forbiddenLive = ['live-authorization', 'live-execution', 'live-closure',
      'authorized-live', 'executed-live'];
    for (const term of forbiddenLive) {
      expect(content).not.toContain(term);
    }
  });
});
