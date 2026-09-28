import { describe, it, expect } from 'vitest';
import { orchestrateTutorTurn } from '../services/tutorOrchestration/tutorTurnOrchestrationEngine';
import { writeLearningEvidence } from '../services/tutorOrchestration/learningEvidenceWriteRuntime';
import { updateRevisionQueue } from '../services/tutorOrchestration/revisionQueueUpdateRuntime';

describe('TutorOrchestration - Evidence and Revision Contract', () => {
  const baseInput = {
    requestId: 'test-evidence-001',
    schoolId: 'school-1',
    tutorLearnerId: 'learner-1',
    tutorSessionId: 'session-1',
  };

  it('full orchestration writes evidence', async () => {
    const result = await orchestrateTutorTurn({
      ...baseInput,
      messageText: 'Explain fractions please.',
    });
    expect(result.evidenceWrite).toBeDefined();
    expect(result.evidenceWrite?.reason).toBeTruthy();
  });

  it('full orchestration updates revision queue', async () => {
    const result = await orchestrateTutorTurn({
      ...baseInput,
      messageText: 'My answer is 15.',
    });
    expect(result.revisionUpdate).toBeDefined();
    expect(typeof result.revisionUpdate?.revisionUpdated).toBe('boolean');
  });

  it('evidence write produces valid result', () => {
    const evidence = writeLearningEvidence({
      requestId: 'test-001',
      tutorLearnerId: 'learner-1',
      intent: 'submit_attempt',
      responseMove: 'attempt_feedback',
      stepCheck: {
        requestId: 'test-001',
        status: 'correct',
        checkedAspect: 'answer',
        reasoning: 'Correct answer',
        nextStepSuggestion: 'Great work',
        shouldRevealFinalAnswer: true,
        validationModesUsed: [],
      },
    });
    expect(evidence.evidenceWritten).toBe(true);
    // AI-INTELLIGENCE-01 R5: a validated correct learner step is attempt
    // evidence — never automatic 'concept_understood' / permanent mastery.
    expect(evidence.evidenceType).toBe('attempt');
  });

  it('revision queue update produces valid result', () => {
    const revision = updateRevisionQueue({
      requestId: 'test-001',
      evidenceResult: {
        requestId: 'test-001',
        evidenceWritten: true,
        evidenceType: 'mistake',
        skillTag: 'math_error',
        confidence: 'high',
        reason: 'Calculation errors',
      },
      previousMistakes: 2,
    });
    expect(revision.revisionUpdated).toBe(true);
    expect(revision.revisionAction).toBe('add_weak_skill');
  });

  it('evidence is recorded for submit_attempt', async () => {
    const result = await orchestrateTutorTurn({
      ...baseInput,
      messageText: 'My answer is 42.',
    });
    expect(result.evidenceWrite).toBeDefined();
    expect(result.evidenceWrite?.evidenceWritten).toBe(true);
  });
});
