import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const routeFilePath = path.resolve(__dirname, '../../../../routes/resultReportCardAccess.ts');
const indexFilePath = path.resolve(__dirname, '../../../../index.ts');
const aiRoutePath = path.resolve(__dirname, '../../../../routes/ai.ts');
const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');

function fileExists(p: string): boolean {
  return fs.existsSync(p);
}

function readFile(p: string): string {
  return fs.readFileSync(p, 'utf-8');
}

function countOccurrences(text: string, pattern: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = text.indexOf(pattern, idx)) !== -1) {
    count++;
    idx += pattern.length;
  }
  return count;
}

describe('Package 15 — Routes and No Duplication', () => {
  describe('Route file existence', () => {
    it('backend/src/routes/resultReportCardAccess.ts exists', () => {
      expect(fileExists(routeFilePath)).toBe(true);
    });
  });

  describe('Route mount in index.ts', () => {
    const indexContent = readFile(indexFilePath);

    it('Route is mounted under /api/question-bank/result-report-card-access', () => {
      expect(indexContent).toContain("'/api/question-bank/result-report-card-access'");
    });

    it('Mount uses schoolAuthMiddleware', () => {
      expect(indexContent).toContain('schoolAuthMiddleware');
    });

    it('Mount uses requireVerifiedSchoolContext', () => {
      expect(indexContent).toContain('requireVerifiedSchoolContext');
    });
  });

  describe('Route file handler conventions', () => {
    const routeContent = readFile(routeFilePath);

    it('Route file contains router.post patterns', () => {
      expect(routeContent).toContain('router.post');
    });

    it('Route file contains router.get patterns', () => {
      expect(routeContent).toContain('router.get');
    });

    it('Mutating routes require idempotency key via extractContext', () => {
      expect(routeContent).toContain("idempotencyKey: (req.headers['x-idempotency-key']");
    });

    it('Safe response envelope keys exist (ResultReportCardAccessSafeEnvelope)', () => {
      expect(routeContent).toContain('ResultReportCardAccessSafeEnvelope');
      expect(routeContent).toContain('sendEnvelope');
    });

    it('Route contains /grants endpoint', () => {
      expect(routeContent).toContain("'/grants'");
    });

    it('Route contains /token-intents endpoints', () => {
      expect(routeContent).toContain('/token-intents');
    });

    it('Route contains /acknowledgements endpoints', () => {
      expect(routeContent).toContain('/acknowledgements');
    });

    it('Route contains /revocations endpoints', () => {
      expect(routeContent).toContain('/revocations');
    });

    it('Route contains /expiries endpoints', () => {
      expect(routeContent).toContain('/expiries');
    });

    it('Route contains /timeline endpoints', () => {
      expect(routeContent).toContain('/timeline');
    });

    it('Route contains /summaries endpoints', () => {
      expect(routeContent).toContain('/summaries');
    });

    it('Route contains /previews endpoints', () => {
      expect(routeContent).toContain('/previews');
    });

    it('Route contains /recipients endpoints', () => {
      expect(routeContent).toContain('/recipients');
    });
  });

  describe('No forbidden AI imports in route file', () => {
    const routeContent = readFile(routeFilePath);

    it('No OpenAI imports', () => {
      expect(routeContent).not.toContain("'openai'");
      expect(routeContent).not.toContain('OpenAI');
    });

    it('No Genkit imports', () => {
      expect(routeContent).not.toContain('genkit');
      expect(routeContent).not.toContain('@genkit-ai');
    });

    it('No Pinecone imports', () => {
      expect(routeContent).not.toContain('pinecone');
      expect(routeContent).not.toContain('Pinecone');
    });

    it('No Ollama imports', () => {
      expect(routeContent).not.toContain('ollama');
      expect(routeContent).not.toContain('Ollama');
    });

    it('No Anthropic imports', () => {
      expect(routeContent).not.toContain('anthropic');
      expect(routeContent).not.toContain('Anthropic');
    });

    it('No Gemini imports', () => {
      expect(routeContent).not.toContain('gemini');
      expect(routeContent).not.toContain('Gemini');
    });
  });

  describe('No frontend or React/Next imports', () => {
    const routeContent = readFile(routeFilePath);

    it('No React import', () => {
      expect(routeContent).not.toContain("'react'");
    });

    it('No Next import', () => {
      expect(routeContent).not.toContain("'next'");
      expect(routeContent).not.toContain("'next/router'");
      expect(routeContent).not.toContain("'next/navigation'");
      expect(routeContent).not.toContain("'next/headers'");
    });

    it('No frontend module imports', () => {
      expect(routeContent).not.toContain('../pages/');
      expect(routeContent).not.toContain('../components/');
      expect(routeContent).not.toContain('frontend/');
    });
  });

  describe('No OCR, notification, communication, PDF, token, or signed URL imports', () => {
    const routeContent = readFile(routeFilePath);

    it('No OCR imports', () => {
      expect(routeContent).not.toContain('tesseract');
      expect(routeContent).not.toContain('ocr');
    });

    it('No email/SMS/push/WhatsApp imports', () => {
      expect(routeContent).not.toContain('nodemailer');
      expect(routeContent).not.toContain('twilio');
      expect(routeContent).not.toContain('firebase-admin/messaging');
      expect(routeContent).not.toContain('whatsapp');
    });

    it('No PDF library imports', () => {
      expect(routeContent).not.toContain('pdfkit');
      expect(routeContent).not.toContain('pdfmake');
      expect(routeContent).not.toContain('pdf-lib');
      expect(routeContent).not.toContain('jspdf');
    });

    it('No portal library imports', () => {
      expect(routeContent).not.toContain('portal');
    });

    it('No token library imports', () => {
      expect(routeContent).not.toContain('jsonwebtoken');
      expect(routeContent).not.toContain('jwt');
    });

    it('No signed URL library imports', () => {
      expect(routeContent).not.toContain('@aws-sdk/s3-request-presigner');
      expect(routeContent).not.toContain('cloud-storage');
      expect(routeContent).not.toContain('signedUrl');
    });
  });

  describe('No expansion in ai.ts routes', () => {
    const aiContent = readFile(aiRoutePath);

    it('backend/src/routes/ai.ts has no Package 15 expansion', () => {
      expect(aiContent).not.toContain('resultReportCardAccess');
      expect(aiContent).not.toContain('ReportCardAccess');
      expect(aiContent).not.toContain('result-report-card-access');
    });
  });

  describe('Route file does not contain forbidden functionality', () => {
    const routeContent = readFile(routeFilePath);

    it('No route sends notification', () => {
      expect(routeContent).not.toContain('sendEmail');
      expect(routeContent).not.toContain('sendSms');
      expect(routeContent).not.toContain('sendPush');
      expect(routeContent).not.toContain('sendNotification');
    });

    it('No route publishes portal payload', () => {
      expect(routeContent).not.toContain('publishToPortal');
      expect(routeContent).not.toContain('livePortal');
    });

    it('No route creates URL/token', () => {
      expect(routeContent).not.toContain('createSignedUrl');
      expect(routeContent).not.toContain('generateToken');
      expect(routeContent).not.toContain('createJwt');
    });

    it('No route creates PDF', () => {
      expect(routeContent).not.toContain('generatePdf');
      expect(routeContent).not.toContain('createPdf');
      expect(routeContent).not.toContain('writePdf');
    });

    it('No route writes export file', () => {
      expect(routeContent).not.toContain('writeFile');
      expect(routeContent).not.toContain('createWriteStream');
      expect(routeContent).not.toContain('exportToFile');
    });

    it('No route changes marking result scores', () => {
      expect(routeContent).not.toContain('updateScore');
      expect(routeContent).not.toContain('overrideScore');
      expect(routeContent).not.toContain('changeResult');
    });

    it('No route executes live delivery, access, or export', () => {
      expect(routeContent).not.toContain('deliverLive');
      expect(routeContent).not.toContain('liveExport');
      expect(routeContent).not.toContain('executeExport');
    });
  });

  describe('Prisma schema — Package 15 access readiness models exist (11 models)', () => {
    const schema = readFile(schemaPath);

    it('ResultReportCardAccessGrantRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessGrantRecord {');
    });

    it('ResultReportCardAccessRecipientRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessRecipientRecord {');
    });

    it('ResultReportCardPortalPreviewRecord exists', () => {
      expect(schema).toContain('model ResultReportCardPortalPreviewRecord {');
    });

    it('ResultReportCardAccessTokenIntentRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessTokenIntentRecord {');
    });

    it('ResultReportCardAccessAcknowledgementRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessAcknowledgementRecord {');
    });

    it('ResultReportCardAccessRevocationRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessRevocationRecord {');
    });

    it('ResultReportCardAccessExpiryRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessExpiryRecord {');
    });

    it('ResultReportCardAccessTimelineRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessTimelineRecord {');
    });

    it('ResultReportCardAccessSummaryRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessSummaryRecord {');
    });

    it('ResultReportCardAccessAuditRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessAuditRecord {');
    });

    it('ResultReportCardAccessIdempotencyRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAccessIdempotencyRecord {');
    });
  });

  describe('Existing Package 14 export models — not duplicated', () => {
    const schema = readFile(schemaPath);

    it('Existing ResultReportCardExportJobRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardExportJobRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardExportTargetRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardExportTargetRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardExportEnvelopeRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardExportEnvelopeRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardMockExportAttemptRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardMockExportAttemptRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardExportReceiptRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardExportReceiptRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardExportSuppressionRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardExportSuppressionRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardExportRetryPlanRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardExportRetryPlanRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardArchiveManifestRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardArchiveManifestRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardExportAuditRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardExportAuditRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardExportIdempotencyRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardExportIdempotencyRecord {');
      expect(count).toBe(1);
    });
  });

  describe('Existing Package 13 report-card models — not duplicated', () => {
    const schema = readFile(schemaPath);

    it('Existing ResultReportCardAssemblyRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardAssemblyRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardAudienceProjectionRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardAudienceProjectionRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardReviewRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardReviewRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardExportIntentRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardExportIntentRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardRenderManifestRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardRenderManifestRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardTemplateRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardTemplateRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardTemplateVersionRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardTemplateVersionRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardSectionRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardSectionRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReportCardEvidenceLinkRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReportCardEvidenceLinkRecord {');
      expect(count).toBe(1);
    });
  });

  describe('Forbidden live portal/token/PDF/AI/OCR models do NOT exist in schema', () => {
    const schema = readFile(schemaPath);

    it('model PdfReportAccessRecord does NOT exist', () => {
      expect(schema).not.toContain('model PdfReportAccessRecord {');
    });

    it('model LivePortalSessionRecord does NOT exist', () => {
      expect(schema).not.toContain('model LivePortalSessionRecord {');
    });

    it('model ReportCardAccessTokenRecord does NOT exist', () => {
      expect(schema).not.toContain('model ReportCardAccessTokenRecord {');
    });

    it('model RealAccessTokenRecord does NOT exist', () => {
      expect(schema).not.toContain('model RealAccessTokenRecord {');
    });

    it('model SignedUrlRecord does NOT exist', () => {
      expect(schema).not.toContain('model SignedUrlRecord {');
    });

    it('model ParentPortalPublicationRecord does NOT exist', () => {
      expect(schema).not.toContain('model ParentPortalPublicationRecord {');
    });

    it('model StudentPortalPublicationRecord does NOT exist', () => {
      expect(schema).not.toContain('model StudentPortalPublicationRecord {');
    });

    it('model TeacherDashboardPublicationRecord does NOT exist', () => {
      expect(schema).not.toContain('model TeacherDashboardPublicationRecord {');
    });

    it('model AIReportNarrativeRecord does NOT exist', () => {
      expect(schema).not.toContain('model AIReportNarrativeRecord {');
    });

    it('model OCRResultRecord does NOT exist', () => {
      expect(schema).not.toContain('model OCRResultRecord {');
    });

    it('model ExternalSchoolSyncRecord does NOT exist', () => {
      expect(schema).not.toContain('model ExternalSchoolSyncRecord {');
    });
  });
});
