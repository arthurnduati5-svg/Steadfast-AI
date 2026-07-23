import { describe, it, expect } from 'vitest';
import { readBackendSrcFile, checkBackendSrcFileExists } from '../../../../test-utils/repositoryPaths';

describe('Package 11 - Projection Safety and Routes', () => {


  it('route file should exist', () => {
    expect(checkBackendSrcFileExists('routes/resultRelease.ts')).toBe(true);
  });

  it('route file should import from correct service paths', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).toContain('resultReleasePacketService');
    expect(content).toContain('resultReleaseBoundaryEnforcementService');
    expect(content).toContain('resultReleaseApprovalService');
    expect(content).toContain('resultAudienceProjectionService');
    expect(content).toContain('resultReportSnapshotService');
    expect(content).toContain('parentSafeResultSummaryService');
    expect(content).toContain('studentSafeResultSummaryService');
    expect(content).toContain('resultReleaseDeliveryIntentService');
    expect(content).toContain('resultReleaseProjectionSafetyService');
    expect(content).toContain('resultReleaseAuditBridge');
    expect(content).toContain('resultReleaseIdempotencyService');
  });

  it('route file should not import OpenAI', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('openai');
    expect(content).not.toContain('OpenAI');
  });

  it('route file should not import Genkit', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('genkit');
    expect(content).not.toContain('Genkit');
  });

  it('route file should not import Pinecone', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('pinecone');
    expect(content).not.toContain('Pinecone');
  });

  it('route file should not import Ollama', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('ollama');
    expect(content).not.toContain('Ollama');
  });

  it('route file should not import Anthropic', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('anthropic');
    expect(content).not.toContain('Anthropic');
  });

  it('route file should not import Gemini', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('gemini');
    expect(content).not.toContain('Gemini');
  });

  it('route file should not import React', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('react');
    expect(content).not.toContain('React');
  });

  it('route file should not import Next.js', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('next/');
    expect(content).not.toContain('Next');
  });

  it('route file should not import frontend modules', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('frontend');
    expect(content).not.toContain('component');
  });

  it('route file should not import OCR libraries', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('tesseract');
    expect(content).not.toContain('ocr');
    expect(content).not.toContain('OCR');
  });

  it('route file should not import email/SMS/push/WhatsApp clients', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('nodemailer');
    expect(content).not.toContain('twilio');
    expect(content).not.toContain('sendgrid');
    expect(content).not.toContain('mailgun');
    expect(content).not.toContain('firebase-messaging');
  });

  it('route file should not import PDF libraries', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('pdfkit');
    expect(content).not.toContain('pdfmake');
    expect(content).not.toContain('pdf-lib');
    expect(content).not.toContain('jspdf');
  });

  it('index.ts should mount result-release route', () => {
    const content = readBackendSrcFile('index.ts');
    expect(content).toContain('resultRelease');
  });

  it('index.ts mount should use schoolAuthMiddleware and requireVerifiedSchoolContext', () => {
    const content = readBackendSrcFile('index.ts');
    const mountLines = content.split('\n').filter(l => l.includes('resultRelease'));
    const importLine = mountLines.find(l => l.includes('import'));
    const useLine = mountLines.find(l => l.includes('app.use'));
    expect(importLine).toBeTruthy();
    expect(useLine).toBeTruthy();
    expect(useLine).toContain('schoolAuthMiddleware');
    expect(useLine).toContain('requireVerifiedSchoolContext');
  });

  it('ai.ts should not have Package 11 expansion', () => {
    const aiContent = readBackendSrcFile('routes/ai.ts');
    expect(aiContent).not.toContain('ResultRelease');
    expect(aiContent).not.toContain('resultRelease');
  });

  it('no route sends notification', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('notify');
    expect(content).not.toContain('notification');
    expect(content).not.toContain('sendEmail');
    expect(content).not.toContain('sendSms');
  });

  it('no route publishes portal payload', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('portal');
    expect(content).not.toContain('publish');
  });

  it('no route creates PDF', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('pdf');
    expect(content).not.toContain('PDF');
  });

  it('no route changes marking result scores', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).not.toContain('score');
    expect(content).not.toContain('mark.');
    expect(content).not.toContain('grade');
  });

  it('route should use safe response envelope pattern', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).toContain('ResultReleaseSafeEnvelope');
    expect(content).toContain('sendEnvelope');
  });

  it('route should handle idempotency key', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).toContain('idempotency-key');
    expect(content).toContain('idempotencyKey');
  });

  it('route file should have projection safety endpoints', () => {
    const content = readBackendSrcFile('routes/resultRelease.ts');
    expect(content).toContain('projection/teacher');
    expect(content).toContain('projection/admin');
    expect(content).toContain('projection/student-safe');
    expect(content).toContain('projection/parent-boundary');
  });
});
