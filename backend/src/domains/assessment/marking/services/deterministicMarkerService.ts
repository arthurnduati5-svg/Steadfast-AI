import { MarkingResultVersion, SubmittedAnswerSnapshot, MarkingResultStatus } from '../contracts/markingContracts';
import { MarkingInputSnapshot } from '../contracts/markingResultContracts';

const DETERMINISTIC_TYPES = ['multiple_choice', 'true_false', 'matching', 'fill_blank', 'numeric'];

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

export class DeterministicMarkerService {
  canDeterministicallyMark(questionType: string): boolean {
    return DETERMINISTIC_TYPES.includes(questionType);
  }

  markMultipleChoice(submittedOptionKey: string, expectedOptionKey: string): { marksAwarded: number; marksAvailable: number; confidence: number } {
    const match = normalizeText(submittedOptionKey) === normalizeText(expectedOptionKey);
    return {
      marksAwarded: match ? 1 : 0,
      marksAvailable: 1,
      confidence: match ? 1 : 1,
    };
  }

  markTrueFalse(submittedOptionKey: string, expectedOptionKey: string): { marksAwarded: number; marksAvailable: number; confidence: number } {
    const match = normalizeText(submittedOptionKey) === normalizeText(expectedOptionKey);
    return {
      marksAwarded: match ? 1 : 0,
      marksAvailable: 1,
      confidence: match ? 1 : 1,
    };
  }

  markMatching(submittedPairs: Record<string, string>, expectedPairs: Record<string, string>): { marksAwarded: number; marksAvailable: number; confidence: number } {
    const keys = Object.keys(expectedPairs);
    let correct = 0;
    for (const key of keys) {
      const submitted = submittedPairs[key];
      const expected = expectedPairs[key];
      if (submitted && normalizeText(submitted) === normalizeText(expected)) {
        correct++;
      }
    }
    const marksAvailable = keys.length;
    return {
      marksAwarded: correct,
      marksAvailable,
      confidence: correct === marksAvailable ? 1 : 0.5,
    };
  }

  markNumeric(submittedValue: number, expectedValue: number, tolerance?: number): { marksAwarded: number; marksAvailable: number; confidence: number } {
    const diff = Math.abs(submittedValue - expectedValue);
    const withinTolerance = tolerance !== undefined ? diff <= tolerance : diff === 0;
    return {
      marksAwarded: withinTolerance ? 1 : 0,
      marksAvailable: 1,
      confidence: withinTolerance ? 1 : 1,
    };
  }

  markFillBlank(submittedText: string, expectedAnswers: string[]): { marksAwarded: number; marksAvailable: number; confidence: number } {
    const normalized = normalizeText(submittedText);
    const match = expectedAnswers.some(a => normalizeText(a) === normalized);
    return {
      marksAwarded: match ? 1 : 0,
      marksAvailable: 1,
      confidence: match ? 1 : 1,
    };
  }

  markSnapshotDeterministically(snapshot: SubmittedAnswerSnapshot, input: MarkingInputSnapshot): MarkingResultVersion {
    const now = new Date().toISOString();
    const base: MarkingResultVersion = {
      markingResultVersionId: crypto.randomUUID(),
      schoolId: snapshot.schoolId,
      markingRunId: '',
      questionId: snapshot.questionId,
      questionVersionId: snapshot.questionVersionId,
      answerSnapshotRef: snapshot.answerSnapshotRef,
      resultVersionNumber: 1,
      status: 'draft',
      questionType: snapshot.questionType,
      markingMethod: 'deterministic_choice',
      marksAwarded: 0,
      marksAvailable: 1,
      confidence: 1,
      requiresTeacherReview: false,
      reviewReasonCode: '',
      safeStudentFeedback: '',
      safeTeacherSummary: '',
      createdByActorId: '',
      createdByRole: '',
      createdAt: now,
    };

    switch (snapshot.questionType) {
      case 'multiple_choice': {
        if (!snapshot.submittedOptionKey || !input.expectedOptionKey) {
          return { ...base, status: 'review_required', requiresTeacherReview: true, reviewReasonCode: 'missing_answer_key', safeStudentFeedback: 'Answer key not available for this question.', safeTeacherSummary: 'Missing answer key for multiple choice.' };
        }
        const mcResult = this.markMultipleChoice(snapshot.submittedOptionKey, input.expectedOptionKey);
        return { ...base, ...mcResult, status: mcResult.marksAwarded === mcResult.marksAvailable ? 'provisional' : 'provisional', markingMethod: 'deterministic_choice', safeStudentFeedback: mcResult.marksAwarded === mcResult.marksAvailable ? 'Correct.' : 'Incorrect.', safeTeacherSummary: `Multiple choice: ${mcResult.marksAwarded}/${mcResult.marksAvailable}` };
      }
      case 'true_false': {
        if (!snapshot.submittedOptionKey || !input.expectedOptionKey) {
          return { ...base, status: 'review_required', requiresTeacherReview: true, reviewReasonCode: 'missing_answer_key', safeStudentFeedback: 'Answer key not available.', safeTeacherSummary: 'Missing answer key for true/false.' };
        }
        const tfResult = this.markTrueFalse(snapshot.submittedOptionKey, input.expectedOptionKey);
        return { ...base, ...tfResult, status: 'provisional', markingMethod: 'deterministic_choice', safeStudentFeedback: tfResult.marksAwarded === tfResult.marksAvailable ? 'Correct.' : 'Incorrect.', safeTeacherSummary: `True/false: ${tfResult.marksAwarded}/${tfResult.marksAvailable}` };
      }
      case 'matching': {
        if (!input.expectedMatchingPairs) {
          return { ...base, status: 'review_required', requiresTeacherReview: true, reviewReasonCode: 'missing_answer_key', safeStudentFeedback: 'Answer key not available.', safeTeacherSummary: 'Missing matching pairs.' };
        }
        const submittedPairs = (snapshot.submittedJson as Record<string, string>) || {};
        const matchResult = this.markMatching(submittedPairs, input.expectedMatchingPairs);
        return { ...base, ...matchResult, status: 'provisional', markingMethod: 'deterministic_matching', safeStudentFeedback: `${matchResult.marksAwarded} of ${matchResult.marksAvailable} matched correctly.`, safeTeacherSummary: `Matching: ${matchResult.marksAwarded}/${matchResult.marksAvailable}` };
      }
      case 'fill_blank': {
        if (!input.expectedFillBlankAnswers || input.expectedFillBlankAnswers.length === 0) {
          return { ...base, status: 'review_required', requiresTeacherReview: true, reviewReasonCode: 'missing_answer_key', safeStudentFeedback: 'Expected answers not available.', safeTeacherSummary: 'Missing fill-blank expected answers.' };
        }
        const fbResult = this.markFillBlank(snapshot.submittedAnswerSafeText, input.expectedFillBlankAnswers);
        return { ...base, ...fbResult, status: 'provisional', markingMethod: 'deterministic_exact', safeStudentFeedback: fbResult.marksAwarded === fbResult.marksAvailable ? 'Correct.' : 'Incorrect.', safeTeacherSummary: `Fill-blank: ${fbResult.marksAwarded}/${fbResult.marksAvailable}` };
      }
      case 'numeric': {
        if (snapshot.submittedNumericValue === undefined || input.expectedNumericValue === undefined) {
          return { ...base, status: 'review_required', requiresTeacherReview: true, reviewReasonCode: 'numeric_ambiguous', safeStudentFeedback: 'Numeric marking requires a clear expected value.', safeTeacherSummary: 'Numeric value or expected value missing.' };
        }
        const numResult = this.markNumeric(snapshot.submittedNumericValue, input.expectedNumericValue, input.allowedTolerance);
        return { ...base, ...numResult, status: 'provisional', markingMethod: 'deterministic_numeric', safeStudentFeedback: numResult.marksAwarded === numResult.marksAvailable ? 'Correct.' : 'Incorrect.', safeTeacherSummary: `Numeric: ${numResult.marksAwarded}/${numResult.marksAvailable}` };
      }
      default: {
        return { ...base, status: 'review_required', requiresTeacherReview: true, reviewReasonCode: 'unsupported_question_type', safeStudentFeedback: 'This question type requires teacher review.', safeTeacherSummary: `Unsupported type: ${snapshot.questionType}` };
      }
    }
  }
}
