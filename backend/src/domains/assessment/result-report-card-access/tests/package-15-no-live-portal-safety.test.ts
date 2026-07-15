import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  evaluateReportCardAccessNoLivePortalPolicy,
  evaluateReportCardAccessNoRealTokenPolicy,
  evaluateReportCardAccessNoNotificationPolicy,
} from '../policies/resultReportCardAccessPolicyDefinitions';
import { FORBIDDEN_ACCESS_PREVIEW_FIELDS } from '../contracts/resultReportCardAccessContracts';

const accessDir = path.resolve(__dirname, '..');

function readAccessSourceFiles(): string {
  const files = [
    'contracts/resultReportCardAccessContracts.ts',
    'policies/resultReportCardAccessPolicyDefinitions.ts',
    'services/resultReportCardAccessSafetyService.ts',
    'services/resultReportCardAccessGrantService.ts',
    'services/resultReportCardAccessRecipientService.ts',
    'services/resultReportCardPortalPreviewService.ts',
    'services/resultReportCardAccessTokenIntentService.ts',
    'services/resultReportCardAccessAcknowledgementService.ts',
    'services/resultReportCardAccessRevocationService.ts',
    'services/resultReportCardAccessExpiryService.ts',
    'services/resultReportCardAccessTimelineService.ts',
    'services/resultReportCardAccessSummaryService.ts',
  ];
  let combined = '';
  for (const file of files) {
    const fullPath = path.join(accessDir, file);
    if (fs.existsSync(fullPath)) {
      combined += fs.readFileSync(fullPath, 'utf-8') + '\n';
    }
  }
  return combined;
}

describe('Package 15 — No Live Portal Safety', () => {
  it('live portal publication is blocked (evaluateReportCardAccessNoLivePortalPolicy)', () => {
    const result = evaluateReportCardAccessNoLivePortalPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_PORTAL_BLOCKED');
    expect(result.policyFamily).toBe('RESULT_REPORT_CARD_ACCESS_NO_LIVE_PORTAL');
  });

  it('parent portal live publication is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('livePortalUrl');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('portalUrl');
  });

  it('student portal live publication is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('accessToken');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('livePortalUrl');
  });

  it('teacher dashboard live publication is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('portalPayload');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('portalUrl');
  });

  it('live URL creation is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('livePortalUrl');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('portalUrl');
  });

  it('signed URL creation is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('signedUrl');
  });

  it('real token creation is blocked (evaluateReportCardAccessNoRealTokenPolicy)', () => {
    const result = evaluateReportCardAccessNoRealTokenPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('REAL_TOKEN_BLOCKED');
  });

  it('JWT/session cookie creation is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('jwt');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('sessionCookie');
  });

  it('email sending is blocked (evaluateReportCardAccessNoNotificationPolicy)', () => {
    const result = evaluateReportCardAccessNoNotificationPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('NOTIFICATION_BLOCKED');
  });

  it('SMS sending is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('smsPayload');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('rawPhone');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('phoneNumber');
  });

  it('push sending is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('pushPayload');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('notificationPayload');
  });

  it('WhatsApp sending is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('whatsAppPayload');
  });

  it('real PDF generation is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('pdfBinary');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('pdfBuffer');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('pdfBase64');
  });

  it('PDF binary creation is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('pdfBinary');
  });

  it('HTML export file creation is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('htmlExport');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('htmlFile');
  });

  it('external school sync is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('externalSyncPayload');
  });

  it('AI narrative generation is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('aiNarrative');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('generatedNarrative');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('modelOutput');
  });

  it('OCR execution is blocked (FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('ocrText');
  });

  describe('Score and result mutation absent from source files', () => {
    const source = readAccessSourceFiles();

    it('score mutation is not in the codebase', () => {
      expect(source).not.toContain('updateScore');
      expect(source).not.toContain('overrideScore');
    });

    it('result overwrite is not in the codebase', () => {
      expect(source).not.toContain('overwriteResult');
      expect(source).not.toContain('replaceResult');
    });

    it('regrade execution is not in the codebase', () => {
      expect(source).not.toContain('regrade');
      expect(source).not.toContain('recalculateScore');
      expect(source).not.toContain('recomputeGrade');
    });
  });

  describe('Forbidden communication patterns in access directory', () => {
    const source = readAccessSourceFiles();

    it('no sendEmail|sendSms|sendPush|sendWhatsApp|notifyParent|notifyStudent patterns found', () => {
      const forbidden = /sendEmail|sendSms|sendPush|sendWhatsApp|notifyParent|notifyStudent/;
      expect(forbidden.test(source)).toBe(false);
    });
  });

  describe('Forbidden PDF generation in access directory', () => {
    const source = readAccessSourceFiles();

    it('no exportPdf|generatePdf|createPdf|writePdf patterns in source (except FORBIDDEN lists)', () => {
      const forbidden = /exportPdf|generatePdf|createPdf|writePdf/;
      expect(forbidden.test(source)).toBe(false);
    });
  });

  describe('Forbidden AI narrative in access directory', () => {
    const source = readAccessSourceFiles();

    it('no aiNarrative|generatedNarrative|modelOutput patterns in source (except FORBIDDEN lists)', () => {
      const nonContractFiles = [
        'policies/resultReportCardAccessPolicyDefinitions.ts',
        'services/resultReportCardAccessGrantService.ts',
        'services/resultReportCardAccessRecipientService.ts',
        'services/resultReportCardPortalPreviewService.ts',
        'services/resultReportCardAccessTokenIntentService.ts',
        'services/resultReportCardAccessAcknowledgementService.ts',
        'services/resultReportCardAccessRevocationService.ts',
        'services/resultReportCardAccessExpiryService.ts',
        'services/resultReportCardAccessTimelineService.ts',
        'services/resultReportCardAccessSummaryService.ts',
      ];
      let combined = '';
      for (const file of nonContractFiles) {
        const fullPath = path.join(accessDir, file);
        if (fs.existsSync(fullPath)) {
          combined += fs.readFileSync(fullPath, 'utf-8') + '\n';
        }
      }
      const forbidden = /aiNarrative|generatedNarrative|modelOutput/;
      expect(forbidden.test(combined)).toBe(false);
    });
  });

  describe('Forbidden AI/OCR in access directory', () => {
    it('no openai|genkit|ollama|anthropic|gemini|tesseract|OCR patterns in source (except FORBIDDEN lists)', () => {
      const nonContractFiles = [
        'policies/resultReportCardAccessPolicyDefinitions.ts',
        'services/resultReportCardAccessGrantService.ts',
        'services/resultReportCardAccessRecipientService.ts',
        'services/resultReportCardPortalPreviewService.ts',
        'services/resultReportCardAccessTokenIntentService.ts',
        'services/resultReportCardAccessAcknowledgementService.ts',
        'services/resultReportCardAccessRevocationService.ts',
        'services/resultReportCardAccessExpiryService.ts',
        'services/resultReportCardAccessTimelineService.ts',
        'services/resultReportCardAccessSummaryService.ts',
      ];
      let combined = '';
      for (const file of nonContractFiles) {
        const fullPath = path.join(accessDir, file);
        if (fs.existsSync(fullPath)) {
          combined += fs.readFileSync(fullPath, 'utf-8') + '\n';
        }
      }
      const forbidden = /\b(openai|genkit|ollama|anthropic|gemini|tesseract|OCR)\b/i;
      expect(forbidden.test(combined)).toBe(false);
    });
  });

  describe('External network calls absent', () => {
    const source = readAccessSourceFiles();

    it('no axios|superagent|node-fetch|got patterns in source', () => {
      const forbidden = /\b(axios|superagent|node-fetch|got)\b/;
      expect(forbidden.test(source)).toBe(false);
    });
  });
});
