import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { evaluateReportCardExportNoPdfBinaryPolicy, evaluateReportCardExportNoLivePublicationPolicy } from '../policies/resultReportCardExportPolicyDefinitions';
import { FORBIDDEN_EXPORT_ENVELOPE_FIELDS } from '../contracts/resultReportCardExportContracts';

const exportDir = path.resolve(__dirname, '..');

function readExportSourceFiles(): string {
  const files = [
    'contracts/index.ts',
    'policies/resultReportCardExportPolicyDefinitions.ts',
    'repositories/inMemoryResultReportCardExportRepositories.ts',
    'repositories/prismaResultReportCardExportRepositories.ts',
    'services/resultReportCardExportAuditBridge.ts',
    'services/resultReportCardExportIdempotencyService.ts',
  ];
  let combined = '';
  for (const file of files) {
    const fullPath = path.join(exportDir, file);
    if (fs.existsSync(fullPath)) {
      combined += fs.readFileSync(fullPath, 'utf-8') + '\n';
    }
  }
  return combined;
}

describe('Package 14 — No Live Export Safety', () => {
  it('real PDF generation is blocked (evaluateReportCardExportNoPdfBinaryPolicy)', () => {
    const result = evaluateReportCardExportNoPdfBinaryPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('PDF_BINARY_BLOCKED');
    expect(result.policyFamily).toBe('RESULT_REPORT_CARD_EXPORT_NO_PDF_BINARY');
  });

  it('PDF binary creation is blocked (FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBinary');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBuffer');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBase64');
  });

  it('HTML export file creation is blocked (FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('htmlExport');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('htmlFile');
  });

  it('parent portal live publication is blocked (evaluateReportCardExportNoLivePublicationPolicy)', () => {
    const result = evaluateReportCardExportNoLivePublicationPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_EXPORT_BLOCKED');
  });

  it('student portal live publication is blocked (FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('studentDeliveryPayload');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('portalPayload');
  });

  it('teacher dashboard live publication is blocked (FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('portalPayload');
  });

  it('external school sync is blocked (FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('externalSyncPayload');
  });

  it('AI narrative generation is blocked (FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('aiNarrative');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('generatedNarrative');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('modelOutput');
  });

  it('OCR execution is blocked (FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('ocrText');
  });

  it('score mutation is not in the codebase (search source files)', () => {
    const source = readExportSourceFiles();
    expect(source).not.toContain('updateScore');
    expect(source).not.toContain('overrideScore');
    expect(source).not.toContain('changeResult');
  });

  it('result overwrite is not in the codebase', () => {
    const source = readExportSourceFiles();
    expect(source).not.toContain('overwriteResult');
    expect(source).not.toContain('replaceResult');
  });

  describe('pattern search for forbidden communication in export directory', () => {
    const source = readExportSourceFiles();

    it('no sendEmail|sendSms|sendPush|sendWhatsApp|notifyParent|notifyStudent patterns found', () => {
      const forbidden = /sendEmail|sendSms|sendPush|sendWhatsApp|notifyParent|notifyStudent/;
      expect(forbidden.test(source)).toBe(false);
    });
  });

  describe('pattern search for PDF generation in export directory', () => {
    const source = readExportSourceFiles();

    it('no exportPdf|generatePdf|createPdf|writePdf|pdfBinary|pdfBuffer|pdfBase64 patterns in source (except FORBIDDEN_EXPORT_ENVELOPE_FIELDS list)', () => {
      const forbidden = /exportPdf|generatePdf|createPdf|writePdf/;
      expect(forbidden.test(source)).toBe(false);
    });
  });

  describe('pattern search for AI narrative in export directory', () => {
    const source = readExportSourceFiles();

    it('no aiNarrative|generatedNarrative|modelOutput patterns in source (except FORBIDDEN_EXPORT_ENVELOPE_FIELDS list)', () => {
      const forbidden = /aiNarrative|generatedNarrative|modelOutput/;
      expect(forbidden.test(source)).toBe(false);
    });
  });

  describe('pattern search for AI/OCR in export directory', () => {
    const source = readExportSourceFiles();

    it('no openai|genkit|ollama|anthropic|gemini|tesseract|OCR patterns in source', () => {
      const forbidden = /\b(openai|genkit|ollama|anthropic|gemini|tesseract|OCR)\b/i;
      expect(forbidden.test(source)).toBe(false);
    });
  });
});
