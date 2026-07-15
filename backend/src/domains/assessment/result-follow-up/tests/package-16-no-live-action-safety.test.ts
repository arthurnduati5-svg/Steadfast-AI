import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ResultFollowUpSafetyService } from '../services/resultFollowUpSafetyService';
import { FORBIDDEN_FOLLOW_UP_FIELDS } from '../contracts/resultFollowUpContracts';

const followUpDir = path.resolve(__dirname, '..');

function readFollowUpSourceFiles(): string {
  const files = [
    'contracts/resultFollowUpContracts.ts',
    'policies/resultFollowUpPolicyDefinitions.ts',
    'services/resultFollowUpSafetyService.ts',
    'services/resultFollowUpCaseService.ts',
    'services/resultFollowUpSignalService.ts',
    'services/resultFollowUpActionPlanService.ts',
    'services/teacherFollowUpQueueService.ts',
    'services/parentGuidanceDraftService.ts',
    'services/studentReflectionTaskDraftService.ts',
    'services/followUpReviewWindowService.ts',
    'services/followUpEscalationPlanService.ts',
    'services/followUpSummaryService.ts',
  ];
  let combined = '';
  for (const file of files) {
    const fullPath = path.join(followUpDir, file);
    if (fs.existsSync(fullPath)) {
      combined += fs.readFileSync(fullPath, 'utf-8') + '\n';
    }
  }
  return combined;
}

describe('Package 16 — No Live Action Safety', () => {
  let safety: ResultFollowUpSafetyService;

  beforeEach(() => {
    safety = new ResultFollowUpSafetyService();
  });

  it('live notification is blocked (assertNoNotificationPayload)', () => {
    const result = safety.assertNoNotificationPayload({ parentNotificationPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('NOTIFICATION_PAYLOAD');
  });

  it('parent notification is blocked (FORBIDDEN_FOLLOW_UP_FIELDS)', () => {
    expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('parentNotificationPayload');
    expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('emailPayload');
  });

  it('student notification is blocked (FORBIDDEN_FOLLOW_UP_FIELDS)', () => {
    expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('studentNotificationPayload');
    expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('pushPayload');
  });

  it('teacher notification is blocked (FORBIDDEN_FOLLOW_UP_FIELDS)', () => {
    expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('teacherNotificationPayload');
    expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('smsPayload');
  });

  it('live teacher task creation is blocked (assertNoLiveTaskPayload)', () => {
    const result = safety.assertNoLiveTaskPayload({ liveTaskPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_TASK_PAYLOAD');
  });

  it('calendar event creation is blocked (FORBIDDEN_FOLLOW_UP_FIELDS)', () => {
    expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('calendarEventPayload');
  });

  it('external task sync is blocked (assertNoExternalSyncPayload)', () => {
    const result = safety.assertNoExternalSyncPayload({ externalSyncPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('EXTERNAL_SYNC_PAYLOAD');
  });

  it('AI narrative generation is blocked (assertNoAiNarrative)', () => {
    const result = safety.assertNoAiNarrative({ aiNarrative: 'Generated narrative' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('AI_NARRATIVE');
  });

  it('OCR execution is blocked (assertNoOcrText)', () => {
    const result = safety.assertNoOcrText({ ocrText: 'recognized text' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('OCR_TEXT');
  });

  it('score mutation is blocked (assertNoScoreMutation)', () => {
    const result = safety.assertNoScoreMutation({ score: 95 });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('SCORE_MUTATION');
  });

  describe('Forbidden fields in FORBIDDEN_FOLLOW_UP_FIELDS', () => {
    it('no live notification fields allowed', () => {
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('whatsAppPayload');
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('smsPayload');
    });

    it('no live task fields allowed', () => {
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('liveTaskPayload');
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('calendarEventPayload');
    });

    it('no external sync fields allowed', () => {
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('externalSyncPayload');
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('liveProviderPayload');
    });

    it('no AI narrative fields allowed', () => {
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('aiNarrative');
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('generatedNarrative');
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('modelOutput');
    });

    it('no OCR fields allowed', () => {
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('ocrText');
    });

    it('no PDF binary fields allowed', () => {
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('pdfBinary');
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('pdfBuffer');
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('pdfBase64');
    });

    it('no HTML export fields allowed', () => {
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('htmlExport');
      expect(FORBIDDEN_FOLLOW_UP_FIELDS).toContain('htmlFile');
    });
  });

  describe('Score and result mutation absent from source files', () => {
    const source = readFollowUpSourceFiles();

    it('updateScore is not in the codebase', () => {
      expect(source).not.toContain('updateScore');
    });

    it('overrideScore is not in the codebase', () => {
      expect(source).not.toContain('overrideScore');
    });

    it('result mutation absent', () => {
      expect(source).not.toContain('overwriteResult');
      expect(source).not.toContain('replaceResult');
    });

    it('regrade absent', () => {
      expect(source).not.toContain('regrade');
      expect(source).not.toContain('recalculateScore');
    });
  });

  describe('Forbidden communication patterns in follow-up directory', () => {
    const source = readFollowUpSourceFiles();

    it('no sendEmail|sendSms|sendPush|sendWhatsApp|notifyParent|notifyStudent', () => {
      const forbidden = /sendEmail|sendSms|sendPush|sendWhatsApp|notifyParent|notifyStudent/;
      expect(forbidden.test(source)).toBe(false);
    });
  });

  describe('Forbidden AI/OCR patterns in follow-up source', () => {
    const nonContractFiles = [
      'services/resultFollowUpCaseService.ts',
      'services/resultFollowUpSignalService.ts',
      'services/resultFollowUpActionPlanService.ts',
      'services/teacherFollowUpQueueService.ts',
      'services/parentGuidanceDraftService.ts',
      'services/studentReflectionTaskDraftService.ts',
      'services/followUpReviewWindowService.ts',
      'services/followUpEscalationPlanService.ts',
      'services/followUpSummaryService.ts',
    ];
    let combined = '';
    for (const file of nonContractFiles) {
      const fullPath = path.join(followUpDir, file);
      if (fs.existsSync(fullPath)) {
        combined += fs.readFileSync(fullPath, 'utf-8') + '\n';
      }
    }

    it('no openai|genkit|ollama|anthropic|gemini|tesseract|OCR patterns (except FORBIDDEN lists)', () => {
      const forbidden = /\b(openai|genkit|ollama|anthropic|gemini|tesseract|OCR)\b/i;
      expect(forbidden.test(combined)).toBe(false);
    });
  });

  describe('External network calls absent', () => {
    const source = readFollowUpSourceFiles();

    it('no axios|superagent|node-fetch|got in source', () => {
      const forbidden = /\b(axios|superagent|node-fetch|got)\b/;
      expect(forbidden.test(source)).toBe(false);
    });
  });
});
