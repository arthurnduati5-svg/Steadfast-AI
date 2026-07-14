import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const routeFilePath = path.resolve(__dirname, '../../../../../../backend/src/routes/resultReportCard.ts');
const indexFilePath = path.resolve(__dirname, '../../../../../../backend/src/index.ts');
const aiRoutePath = path.resolve(__dirname, '../../../../../../backend/src/routes/ai.ts');
const schemaPath = path.resolve(__dirname, '../../../../../../backend/prisma/schema.prisma');

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

describe('Package 13 — Routes and No Duplication', () => {
  describe('Route file existence', () => {
    it('backend/src/routes/resultReportCard.ts exists', () => {
      expect(fileExists(routeFilePath)).toBe(true);
    });
  });

  describe('Route mount', () => {
    const indexContent = readFile(indexFilePath);

    it('Route is mounted under /api/question-bank/result-report-cards', () => {
      expect(indexContent).toContain("'/api/question-bank/result-report-cards'");
    });

    it('Mount uses schoolAuthMiddleware', () => {
      expect(indexContent).toContain('schoolAuthMiddleware');
    });

    it('Mount uses requireVerifiedSchoolContext', () => {
      expect(indexContent).toContain('requireVerifiedSchoolContext');
    });
  });

  describe('Route handler conventions', () => {
    const routeContent = readFile(routeFilePath);

    it('Mutating routes require idempotency key (check extractContext in route file)', () => {
      expect(routeContent).toContain("'x-idempotency-key'");
      expect(routeContent).toContain('idempotencyKey');
    });

    it('Safe response envelope keys exist (check a route handler returns correct envelope)', () => {
      expect(routeContent).toContain('ok ? 200 : 400');
      expect(routeContent).toContain('sendEnvelope');
      expect(routeContent).toContain('safeMessage');
      expect(routeContent).toContain('reasonCode');
    });

    it('Routes do not import OpenAI', () => {
      expect(routeContent).not.toContain("'openai'");
      expect(routeContent).not.toContain('OpenAI');
    });

    it('Routes do not import Genkit', () => {
      expect(routeContent).not.toContain('genkit');
      expect(routeContent).not.toContain('@genkit-ai');
    });

    it('Routes do not import Pinecone', () => {
      expect(routeContent).not.toContain('pinecone');
      expect(routeContent).not.toContain('Pinecone');
    });

    it('Routes do not import Ollama', () => {
      expect(routeContent).not.toContain('ollama');
      expect(routeContent).not.toContain('Ollama');
    });

    it('Routes do not import Anthropic', () => {
      expect(routeContent).not.toContain('anthropic');
      expect(routeContent).not.toContain('Anthropic');
    });

    it('Routes do not import Gemini', () => {
      expect(routeContent).not.toContain('gemini');
      expect(routeContent).not.toContain('Gemini');
    });

    it('Routes do not import React', () => {
      expect(routeContent).not.toContain("'react'");
    });

    it('Routes do not import Next', () => {
      expect(routeContent).not.toContain("'next'");
      expect(routeContent).not.toContain("'next/router'");
      expect(routeContent).not.toContain("'next/navigation'");
      expect(routeContent).not.toContain("'next/headers'");
    });

    it('Routes do not import frontend modules', () => {
      expect(routeContent).not.toContain('../pages/');
      expect(routeContent).not.toContain('../components/');
      expect(routeContent).not.toContain('frontend/');
    });

    it('Routes do not import OCR libraries', () => {
      expect(routeContent).not.toContain('tesseract');
      expect(routeContent).not.toContain('ocr');
    });

    it('Routes do not import email/SMS/push/WhatsApp clients', () => {
      expect(routeContent).not.toContain('nodemailer');
      expect(routeContent).not.toContain('twilio');
      expect(routeContent).not.toContain('firebase-admin/messaging');
      expect(routeContent).not.toContain('whatsapp');
    });

    it('Routes do not import PDF libraries', () => {
      expect(routeContent).not.toContain('pdfkit');
      expect(routeContent).not.toContain('pdfmake');
      expect(routeContent).not.toContain('pdf-lib');
      expect(routeContent).not.toContain('jspdf');
      expect(routeContent).not.toContain('pdf2json');
    });

    it('Routes do not import external sync clients', () => {
      expect(routeContent).not.toContain('axios');
      expect(routeContent).not.toContain('superagent');
    });
  });

  describe('No forbidden expansions in other routes', () => {
    const aiContent = readFile(aiRoutePath);

    it('backend/src/routes/ai.ts has no Package 13 expansion (check file content)', () => {
      expect(aiContent).not.toContain('resultReportCard');
      expect(aiContent).not.toContain('ReportCard');
      expect(aiContent).not.toContain('result-report-card');
    });
  });

  describe('No live delivery, export, or mutation in route file', () => {
    const routeContent = readFile(routeFilePath);

    it('No route sends notification (check for forbidden strings in route file)', () => {
      expect(routeContent).not.toContain('notificationPayload');
      expect(routeContent).not.toContain('sendNotification');
      expect(routeContent).not.toContain('notification.');
    });

    it('No route publishes portal payload', () => {
      expect(routeContent).not.toContain('portalPayload');
      expect(routeContent).not.toContain('publishPortal');
    });

    it('No route creates PDF', () => {
      expect(routeContent).not.toContain('pdfBinary');
      expect(routeContent).not.toContain('pdfBuffer');
      expect(routeContent).not.toContain('pdfBase64');
      expect(routeContent).not.toContain('generatePdf');
      expect(routeContent).not.toContain('createPdf');
    });

    it('No route changes marking result scores', () => {
      expect(routeContent).not.toContain('updateScore');
      expect(routeContent).not.toContain('overrideScore');
      expect(routeContent).not.toContain('changeResult');
    });

    it('No route executes live delivery or export', () => {
      expect(routeContent).not.toContain('_live');
      expect(routeContent).not.toContain('executeDelivery');
      expect(routeContent).not.toContain('sendToExternal');
    });
  });

  describe('Prisma schema — Package 13 models exist', () => {
    const schema = readFile(schemaPath);

    it('ResultReportCardTemplateRecord exists', () => {
      expect(schema).toContain('model ResultReportCardTemplateRecord {');
    });

    it('ResultReportCardTemplateVersionRecord exists', () => {
      expect(schema).toContain('model ResultReportCardTemplateVersionRecord {');
    });

    it('ResultReportCardAssemblyRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAssemblyRecord {');
    });

    it('ResultReportCardSectionRecord exists', () => {
      expect(schema).toContain('model ResultReportCardSectionRecord {');
    });

    it('ResultReportCardEvidenceLinkRecord exists', () => {
      expect(schema).toContain('model ResultReportCardEvidenceLinkRecord {');
    });

    it('ResultReportCardAudienceProjectionRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAudienceProjectionRecord {');
    });

    it('ResultReportCardReviewRecord exists', () => {
      expect(schema).toContain('model ResultReportCardReviewRecord {');
    });

    it('ResultReportCardExportIntentRecord exists', () => {
      expect(schema).toContain('model ResultReportCardExportIntentRecord {');
    });

    it('ResultReportCardRenderManifestRecord exists', () => {
      expect(schema).toContain('model ResultReportCardRenderManifestRecord {');
    });

    it('ResultReportCardAuditRecord exists', () => {
      expect(schema).toContain('model ResultReportCardAuditRecord {');
    });

    it('ResultReportCardIdempotencyRecord exists', () => {
      expect(schema).toContain('model ResultReportCardIdempotencyRecord {');
    });
  });

  describe('Existing models from earlier packages — no duplication', () => {
    const schema = readFile(schemaPath);

    it('Existing StudentResultReportSnapshotRecord is not duplicated (single instance)', () => {
      const count = countOccurrences(schema, 'model StudentResultReportSnapshotRecord {');
      expect(count).toBe(1);
    });

    it('Existing ParentSafeResultSummaryRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ParentSafeResultSummaryRecord {');
      expect(count).toBe(1);
    });

    it('Existing StudentSafeResultSummaryRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model StudentSafeResultSummaryRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultReleasePacketRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultReleasePacketRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultAudienceProjectionRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultAudienceProjectionRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultDeliveryJobRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultDeliveryJobRecord {');
      expect(count).toBe(1);
    });

    it('Existing ResultDeliveryReceiptRecord is not duplicated', () => {
      const count = countOccurrences(schema, 'model ResultDeliveryReceiptRecord {');
      expect(count).toBe(1);
    });
  });

  describe('Forbidden models do NOT exist in schema', () => {
    const schema = readFile(schemaPath);

    it('model PdfReportExportRecord does NOT exist', () => {
      expect(schema).not.toContain('model PdfReportExportRecord {');
    });

    it('model ReportCardExportRecord does NOT exist', () => {
      expect(schema).not.toContain('model ReportCardExportRecord {');
    });

    it('model AIReportNarrativeRecord does NOT exist', () => {
      expect(schema).not.toContain('model AIReportNarrativeRecord {');
    });

    it('model OCRResultRecord does NOT exist', () => {
      expect(schema).not.toContain('model OCRResultRecord {');
    });

    it('model LiveEmailProviderRecord does NOT exist', () => {
      expect(schema).not.toContain('model LiveEmailProviderRecord {');
    });

    it('model ExternalSchoolSyncRecord does NOT exist', () => {
      expect(schema).not.toContain('model ExternalSchoolSyncRecord {');
    });

    it('model ParentNotificationDeliveryRecord does NOT exist', () => {
      expect(schema).not.toContain('model ParentNotificationDeliveryRecord {');
    });

    it('model StudentNotificationDeliveryRecord does NOT exist', () => {
      expect(schema).not.toContain('model StudentNotificationDeliveryRecord {');
    });
  });
});
