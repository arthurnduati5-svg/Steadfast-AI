import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const routeFilePath = path.resolve(__dirname, '../../../../routes/resultReportCardExport.ts');
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

describe('Package 14 — Routes and No Duplication', () => {
  describe('Route file existence', () => {
    it('backend/src/routes/resultReportCardExport.ts exists', () => {
      expect(fileExists(routeFilePath)).toBe(true);
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

    it('Route file contains /jobs endpoint pattern', () => {
      expect(routeContent).toContain('/jobs');
    });

    it('Route file contains /targets endpoint pattern', () => {
      expect(routeContent).toContain('/targets');
    });

    it('Route file contains /envelopes endpoint pattern', () => {
      expect(routeContent).toContain('/envelopes');
    });

    it('Route file contains /mock-attempts endpoint pattern', () => {
      expect(routeContent).toContain('/mock-attempts');
    });

    it('Route file contains /receipts endpoint pattern', () => {
      expect(routeContent).toContain('/receipts');
    });

    it('Route file contains /suppressions endpoint pattern', () => {
      expect(routeContent).toContain('/suppressions');
    });

    it('Route file contains /retry-plans endpoint pattern', () => {
      expect(routeContent).toContain('/retry-plans');
    });

    it('Route file contains /archive-manifests endpoint pattern', () => {
      expect(routeContent).toContain('/archive-manifests');
    });
  });

  describe('Route mount in index.ts', () => {
    const indexContent = readFile(indexFilePath);

    it('Route is mounted with correct path', () => {
      expect(indexContent).toContain("'/api/question-bank/result-report-card-export'");
    });

    it('Mount uses schoolAuthMiddleware', () => {
      expect(indexContent).toContain('schoolAuthMiddleware');
    });

    it('Mount uses requireVerifiedSchoolContext', () => {
      expect(indexContent).toContain('requireVerifiedSchoolContext');
    });
  });

  describe('No forbidden AI imports in export route file', () => {
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

  describe('No OCR, notification, or communication imports in route file', () => {
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

    it('No external sync client imports', () => {
      expect(routeContent).not.toContain('axios');
      expect(routeContent).not.toContain('superagent');
    });
  });

  describe('No expansion in ai.ts routes', () => {
    const aiContent = readFile(aiRoutePath);

    it('backend/src/routes/ai.ts has no Package 14 expansion', () => {
      expect(aiContent).not.toContain('resultReportCardExport');
      expect(aiContent).not.toContain('ReportCardExport');
      expect(aiContent).not.toContain('result-report-card-export');
    });
  });

  describe('Prisma schema — Package 14 models exist', () => {
    const schema = readFile(schemaPath);

    it('ResultReportCardExportJobRecord exists', () => {
      expect(schema).toContain('model ResultReportCardExportJobRecord {');
    });

    it('ResultReportCardExportTargetRecord exists', () => {
      expect(schema).toContain('model ResultReportCardExportTargetRecord {');
    });

    it('ResultReportCardExportEnvelopeRecord exists', () => {
      expect(schema).toContain('model ResultReportCardExportEnvelopeRecord {');
    });

    it('ResultReportCardMockExportAttemptRecord exists', () => {
      expect(schema).toContain('model ResultReportCardMockExportAttemptRecord {');
    });

    it('ResultReportCardExportReceiptRecord exists', () => {
      expect(schema).toContain('model ResultReportCardExportReceiptRecord {');
    });

    it('ResultReportCardExportSuppressionRecord exists', () => {
      expect(schema).toContain('model ResultReportCardExportSuppressionRecord {');
    });

    it('ResultReportCardExportRetryPlanRecord exists', () => {
      expect(schema).toContain('model ResultReportCardExportRetryPlanRecord {');
    });

    it('ResultReportCardArchiveManifestRecord exists', () => {
      expect(schema).toContain('model ResultReportCardArchiveManifestRecord {');
    });

    it('ResultReportCardExportAuditRecord exists', () => {
      expect(schema).toContain('model ResultReportCardExportAuditRecord {');
    });

    it('ResultReportCardExportIdempotencyRecord exists', () => {
      expect(schema).toContain('model ResultReportCardExportIdempotencyRecord {');
    });
  });

  describe('Existing Package 13 models — no duplication', () => {
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
  });

  describe('Forbidden real export models do NOT exist in schema', () => {
    const schema = readFile(schemaPath);

    it('model PdfReportExportRecord does NOT exist', () => {
      expect(schema).not.toContain('model PdfReportExportRecord {');
    });

    it('model ReportCardExportRecord does NOT exist', () => {
      expect(schema).not.toContain('model ReportCardExportRecord {');
    });

    it('model ReportCardPdfRecord does NOT exist', () => {
      expect(schema).not.toContain('model ReportCardPdfRecord {');
    });

    it('model ReportCardPdfBinaryRecord does NOT exist', () => {
      expect(schema).not.toContain('model ReportCardPdfBinaryRecord {');
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

    it('model ExternalSchoolSyncRecord does NOT exist', () => {
      expect(schema).not.toContain('model ExternalSchoolSyncRecord {');
    });

    it('model AIReportNarrativeRecord does NOT exist', () => {
      expect(schema).not.toContain('model AIReportNarrativeRecord {');
    });

    it('model OCRResultRecord does NOT exist', () => {
      expect(schema).not.toContain('model OCRResultRecord {');
    });
  });
});
