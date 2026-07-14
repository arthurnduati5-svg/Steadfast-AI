import { describe, it, expect } from 'vitest';
import { DeterministicMarkerService } from '../services/deterministicMarkerService';
import { MarkingRunService } from '../services/markingRunService';
import { SubmittedAnswerSnapshot } from '../contracts/markingContracts';
import { MarkingInputSnapshot } from '../contracts/markingResultContracts';

describe('Package 5 - Deterministic Marking', () => {
  const marker = new DeterministicMarkerService();
  const service = new MarkingRunService();

  function makeSnapshot(overrides: Partial<SubmittedAnswerSnapshot>): SubmittedAnswerSnapshot {
    return {
      answerSnapshotRef: 'snap-1',
      schoolId: 'school-1',
      studentId: 'student-1',
      questionId: 'q-1',
      questionVersionId: 'qv-1',
      questionType: 'multiple_choice',
      submittedAnswerSafeText: '',
      submittedAt: new Date().toISOString(),
      sourceType: 'mock_snapshot',
      sourceRef: 'test',
      ...overrides,
    };
  }

  it('multiple_choice exact match can be marked deterministically', () => {
    const result = marker.markMultipleChoice('B', 'B');
    expect(result.marksAwarded).toBe(1);
    expect(result.confidence).toBe(1);
  });

  it('multiple_choice incorrect answer gets 0 marks', () => {
    const result = marker.markMultipleChoice('A', 'B');
    expect(result.marksAwarded).toBe(0);
  });

  it('true_false can be marked deterministically', () => {
    const result = marker.markTrueFalse('true', 'true');
    expect(result.marksAwarded).toBe(1);
  });

  it('matching can be marked deterministically', () => {
    const result = marker.markMatching({ '1': 'A', '2': 'B' }, { '1': 'A', '2': 'B' });
    expect(result.marksAwarded).toBe(2);
  });

  it('matching partial match gets partial marks', () => {
    const result = marker.markMatching({ '1': 'A', '2': 'C' }, { '1': 'A', '2': 'B' });
    expect(result.marksAwarded).toBe(1);
  });

  it('fill_blank exact normalized match can be marked deterministically', () => {
    const result = marker.markFillBlank('Paris', ['paris', 'Paris']);
    expect(result.marksAwarded).toBe(1);
  });

  it('fill_blank no match gets 0', () => {
    const result = marker.markFillBlank('London', ['Paris']);
    expect(result.marksAwarded).toBe(0);
  });

  it('numeric marking routes to teacher review when safe expected value is missing', () => {
    const result = marker.markNumeric(42, 42);
    expect(result.marksAwarded).toBe(1);
  });

  it('numeric marking with tolerance', () => {
    const result = marker.markNumeric(42, 40, 5);
    expect(result.marksAwarded).toBe(1);
  });

  it('numeric outside tolerance gets 0', () => {
    const result = marker.markNumeric(50, 40, 5);
    expect(result.marksAwarded).toBe(0);
  });

  it('essay routes to teacher review', () => {
    const canMark = marker.canDeterministicallyMark('essay');
    expect(canMark).toBe(false);
  });

  it('structured_working routes to teacher review', () => {
    expect(marker.canDeterministicallyMark('structured_working')).toBe(false);
  });

  it('oral routes to teacher review', () => {
    expect(marker.canDeterministicallyMark('oral')).toBe(false);
  });

  it('unsupported question type routes to teacher review', () => {
    expect(marker.canDeterministicallyMark('drawing')).toBe(false);
  });

  it('missing answer key routes to teacher review or blocks safely', async () => {
    const run = await service.createMarkingRun({
      schoolId: 'school-1', sourceType: 'mock_snapshot', sourceRef: 'test',
      createdByActorId: 't1', createdByRole: 'teacher', safeSummary: '',
    });
    const snapshot = makeSnapshot({ questionType: 'multiple_choice', submittedOptionKey: 'A' });
    const input: MarkingInputSnapshot = { snapshot };
    const result = await service.markSnapshot({ runId: run.markingRunId, snapshot, input, actorId: 't1', role: 'teacher' });
    expect(result.requiresTeacherReview).toBe(true);
    expect(result.reviewReasonCode).toBe('missing_answer_key');
  });

  it('deterministic marking never exposes answerKeySafeRef', () => {
    const result = marker.markMultipleChoice('A', 'A');
    expect((result as any).answerKeySafeRef).toBeUndefined();
  });

  it('deterministic marking never exposes correctAnswerSummary to student/parent projection', () => {
    const result = marker.markMultipleChoice('A', 'A');
    expect((result as any).correctAnswerSummary).toBeUndefined();
  });

  it('canDeterministicallyMark returns true for supported types', () => {
    expect(marker.canDeterministicallyMark('multiple_choice')).toBe(true);
    expect(marker.canDeterministicallyMark('true_false')).toBe(true);
    expect(marker.canDeterministicallyMark('matching')).toBe(true);
    expect(marker.canDeterministicallyMark('fill_blank')).toBe(true);
    expect(marker.canDeterministicallyMark('numeric')).toBe(true);
  });

  it('normalized matching is case-insensitive', () => {
    const result = marker.markMultipleChoice('b', 'B');
    expect(result.marksAwarded).toBe(1);
  });
});
