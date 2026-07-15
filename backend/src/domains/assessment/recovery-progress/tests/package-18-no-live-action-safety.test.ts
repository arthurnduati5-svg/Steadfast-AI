import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RecoveryProgressSafetyService } from '../services/recoveryProgressSafetyService';
import { FORBIDDEN_PROGRESS_FIELDS } from '../contracts/recoveryProgressContracts';

const progressDir = path.resolve(__dirname, '..');

function readProgressSourceFiles(): string {
  const files = [
    'contracts/recoveryProgressContracts.ts',
    'policies/recoveryProgressPolicyDefinitions.ts',
    'services/recoveryProgressSafetyService.ts',
    'services/recoveryProgressObservationService.ts',
    'services/recoveryCheckpointEvaluationService.ts',
    'services/recoveryOutcomeEvidenceService.ts',
    'services/recoveryPlanAdjustmentDraftService.ts',
    'services/recoveryTeacherReviewDecisionService.ts',
    'services/recoveryStudentProgressReflectionDraftService.ts',
    'services/recoveryParentProgressNoteDraftService.ts',
    'services/recoveryEvidenceRollupService.ts',
    'services/recoveryProgressSummaryService.ts',
  ];
  let combined = '';
  for (const file of files) {
    const fullPath = path.join(progressDir, file);
    if (fs.existsSync(fullPath)) {
      combined += fs.readFileSync(fullPath, 'utf-8') + '\n';
    }
  }
  return combined;
}

describe('Package 18 — No Live Action Safety', () => {
  let safety: RecoveryProgressSafetyService;

  beforeEach(() => {
    safety = new RecoveryProgressSafetyService();
  });

  it('answer key leakage is blocked (assertNoAnswerKeyLeakage)', () => {
    const result = safety.assertNoAnswerKeyLeakage({ answerKeyText: 'secret key' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_KEY_LEAKAGE');
  });

  it('rubric leakage is blocked (assertNoRubricLeakage)', () => {
    const result = safety.assertNoRubricLeakage({ rubricInternal: 'internal rubric' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RUBRIC_LEAKAGE');
  });

  it('raw student answer leakage is blocked (assertNoRawStudentAnswerLeakage)', () => {
    const result = safety.assertNoRawStudentAnswerLeakage({ rawStudentAnswer: 'student answer' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RAW_STUDENT_ANSWER_LEAKAGE');
  });

  it('teacher-only leakage is blocked (assertNoTeacherOnlyLeakage)', () => {
    const result = safety.assertNoTeacherOnlyLeakage({ teacherOnlyNotes: 'notes' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');
  });

  it('hidden reasoning leakage is blocked (assertNoHiddenReasoningLeakage)', () => {
    const result = safety.assertNoHiddenReasoningLeakage({ chainOfThought: 'thinking' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('HIDDEN_REASONING_LEAKAGE');
  });

  it('unreleased grade leakage is blocked (assertNoUnreleasedGradeLeakage)', () => {
    const result = safety.assertNoUnreleasedGradeLeakage({ unreleasedScore: 85 });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('UNRELEASED_GRADE_LEAKAGE');
  });

  it('notification payload is blocked (assertNoNotificationPayload)', () => {
    const result = safety.assertNoNotificationPayload({ parentNotificationPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('NOTIFICATION_PAYLOAD');
  });

  it('live assignment payload is blocked (assertNoLiveAssignmentPayload)', () => {
    const result = safety.assertNoLiveAssignmentPayload({ liveAssignmentPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_ASSIGNMENT_PAYLOAD');
  });

  it('homework assignment payload is blocked (assertNoHomeworkAssignmentPayload)', () => {
    const result = safety.assertNoHomeworkAssignmentPayload({ homeworkAssignmentPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('HOMEWORK_ASSIGNMENT_PAYLOAD');
  });

  it('practice assignment payload is blocked (assertNoPracticeAssignmentPayload)', () => {
    const result = safety.assertNoPracticeAssignmentPayload({ practiceAssignmentPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('PRACTICE_ASSIGNMENT_PAYLOAD');
  });

  it('revision task payload is blocked (assertNoRevisionTaskPayload)', () => {
    const result = safety.assertNoRevisionTaskPayload({ revisionTaskPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('REVISION_TASK_PAYLOAD');
  });

  it('calendar event payload is blocked (assertNoCalendarEventPayload)', () => {
    const result = safety.assertNoCalendarEventPayload({ calendarEventPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('CALENDAR_EVENT_PAYLOAD');
  });

  it('external sync payload is blocked (assertNoExternalSyncPayload)', () => {
    const result = safety.assertNoExternalSyncPayload({ externalSyncPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('EXTERNAL_SYNC_PAYLOAD');
  });

  it('provider secret is blocked (assertNoProviderSecret)', () => {
    const result = safety.assertNoProviderSecret({ providerSecret: 'secret' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('PROVIDER_SECRET');
  });

  it('AI narrative is blocked (assertNoAiNarrative)', () => {
    const result = safety.assertNoAiNarrative({ aiNarrative: 'Generated narrative' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('AI_NARRATIVE');
  });

  it('generated question is blocked (assertNoGeneratedQuestion)', () => {
    const result = safety.assertNoGeneratedQuestion({ generatedQuestionText: 'question' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('GENERATED_QUESTION');
  });

  it('generated answer key is blocked (assertNoGeneratedAnswerKey)', () => {
    const result = safety.assertNoGeneratedAnswerKey({ generatedAnswerKey: 'answer key' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('GENERATED_ANSWER_KEY');
  });

  it('OCR text is blocked (assertNoOcrText)', () => {
    const result = safety.assertNoOcrText({ ocrText: 'ocr output' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('OCR_TEXT');
  });

  it('PDF binary is blocked (assertNoPdfBinary)', () => {
    const result = safety.assertNoPdfBinary({ pdfBinary: 'binary' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('PDF_BINARY');
  });

  it('HTML export is blocked (assertNoHtmlExport)', () => {
    const result = safety.assertNoHtmlExport({ htmlExport: '<html>' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('HTML_EXPORT');
  });

  it('score mutation is blocked (assertNoScoreMutation)', () => {
    const result = safety.assertNoScoreMutation({ score: 95 });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('SCORE_MUTATION');
  });

  it('mastery mutation is blocked (assertNoMasteryMutation)', () => {
    const result = safety.assertNoMasteryMutation({ masteryScore: 0.8 });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('MASTERY_MUTATION');
  });

  it('live progress mutation is blocked (assertNoLiveProgressMutation)', () => {
    const result = safety.assertNoLiveProgressMutation({ scoreMutationPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_PROGRESS_MUTATION');
  });

  it('unsafe diagnosis is blocked (assertNoUnsafeDiagnosis)', () => {
    const result = safety.assertNoUnsafeDiagnosis({ diagnosis: 'medical diagnosis' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('UNSAFE_DIAGNOSIS');
  });

  it('unsafe safeguarding disclosure is blocked (assertNoUnsafeSafeguardingDisclosure)', () => {
    const result = safety.assertNoUnsafeSafeguardingDisclosure({ riskLabelUnsafe: 'high' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('UNSAFE_SAFEGUARDING_DISCLOSURE');
  });

  it('assertObservationUsesReferencesOnly aggregates checks', () => {
    const result = safety.assertObservationUsesReferencesOnly({ answerKeySafeRef: 'ref' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_KEY_LEAKAGE');
  });

  it('assertParentNoteDraftSafe aggregates checks', () => {
    const result = safety.assertParentNoteDraftSafe({ teacherOnlyNotes: 'notes' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');
  });

  it('assertReflectionDraftSafe blocks answer leakage', () => {
    const result = safety.assertReflectionDraftSafe({ correctAnswer: 'A' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_LEAKAGE');
  });

  it('assertEvaluationReferencesSafe aggregates checks', () => {
    const result = safety.assertEvaluationReferencesSafe({ unreleasedGrade: 'A' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('UNRELEASED_GRADE_LEAKAGE');
  });

  it('assertMockOnlyProgressOperation allows safe modes', () => {
    const result = safety.assertMockOnlyProgressOperation('mock_observation_only');
    expect(result.allowed).toBe(true);
  });

  it('assertMockOnlyProgressOperation blocks live modes', () => {
    const result = safety.assertMockOnlyProgressOperation('live_progress_update');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_ACTION_BLOCKED');
  });

  describe('FORBIDDEN_PROGRESS_FIELDS', () => {
    it('contains answer key fields', () => {
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('answerKeySafeRef');
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('answerKeyText');
    });

    it('contains rubric fields', () => {
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('rubricInternal');
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('rubricText');
    });

    it('contains notification fields', () => {
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('parentNotificationPayload');
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('whatsAppPayload');
    });

    it('contains AI narrative fields', () => {
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('aiNarrative');
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('modelOutput');
    });

    it('contains OCR and PDF fields', () => {
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('ocrText');
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('pdfBinary');
    });

    it('contains score and mastery mutation fields', () => {
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('scoreMutationPayload');
      expect(FORBIDDEN_PROGRESS_FIELDS).toContain('masteryMutationPayload');
    });
  });

  describe('Score and result mutation absent from source files', () => {
    const source = readProgressSourceFiles();

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

  describe('Forbidden communication patterns in progress directory', () => {
    const source = readProgressSourceFiles();

    it('no sendEmail|sendSms|sendPush|sendWhatsApp|notifyParent|notifyStudent', () => {
      const forbidden = /sendEmail|sendSms|sendPush|sendWhatsApp|notifyParent|notifyStudent/;
      expect(forbidden.test(source)).toBe(false);
    });
  });

  describe('Forbidden AI/OCR patterns in progress source', () => {
    const nonContractFiles = [
      'services/recoveryProgressObservationService.ts',
      'services/recoveryCheckpointEvaluationService.ts',
      'services/recoveryOutcomeEvidenceService.ts',
      'services/recoveryPlanAdjustmentDraftService.ts',
      'services/recoveryTeacherReviewDecisionService.ts',
      'services/recoveryStudentProgressReflectionDraftService.ts',
      'services/recoveryParentProgressNoteDraftService.ts',
      'services/recoveryEvidenceRollupService.ts',
      'services/recoveryProgressSummaryService.ts',
    ];
    let combined = '';
    for (const file of nonContractFiles) {
      const fullPath = path.join(progressDir, file);
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
    const source = readProgressSourceFiles();

    it('no axios|superagent|node-fetch|got in source', () => {
      const forbidden = /\b(axios|superagent|node-fetch|got)\b/;
      expect(forbidden.test(source)).toBe(false);
    });
  });
});
