import { describe, it, expect } from 'vitest';
import { ResultLearningEvidenceProjectionSafetyService } from '../services/resultLearningEvidenceProjectionSafetyService';
import { readBackendSrcFile, checkBackendSrcFileExists } from '../../../../test-utils/repositoryPaths';

describe('Package 10 - Projection Safety and Routes', () => {
  const projectionService = new ResultLearningEvidenceProjectionSafetyService();

  it('route file should exist', () => {
    expect(checkBackendSrcFileExists('routes/resultLearningEvidence.ts')).toBe(true);
  });

  it('route file should import from correct service paths', () => {
    const content = readBackendSrcFile('routes/resultLearningEvidence.ts');
    expect(content).toContain('resultEvidenceBridgeService');
    expect(content).toContain('objectiveMasteryImpactService');
    expect(content).toContain('masteryMutationPlanService');
    expect(content).toContain('masteryMutationApplicationService');
    expect(content).toContain('revisionSignalDispatchService');
    expect(content).toContain('growthSignalDispatchService');
    expect(content).toContain('projectionSafetyService');
    expect(content).toContain('auditBridge');
    expect(content).toContain('idempotencyService');
  });

  it('route file should not import OpenAI', () => {
    const content = readBackendSrcFile('routes/resultLearningEvidence.ts');
    expect(content).not.toContain('openai');
    expect(content).not.toContain('OpenAI');
  });

  it('route file should not import OCR libraries', () => {
    const content = readBackendSrcFile('routes/resultLearningEvidence.ts');
    expect(content).not.toContain('tesseract');
    expect(content).not.toContain('ocr');
  });

  it('route file should not import frontend modules', () => {
    const content = readBackendSrcFile('routes/resultLearningEvidence.ts');
    expect(content).not.toContain('react');
    expect(content).not.toContain('\"next/');
    expect(content).not.toContain('frontend');
  });

  it('index.ts should mount result-learning-evidence route', () => {
    const content = readBackendSrcFile('index.ts');
    expect(content).toContain('resultLearningEvidence');
  });

  it('index.ts mount should use schoolAuthMiddleware', () => {
    const content = readBackendSrcFile('index.ts');
    const mountLines = content.split('\n').filter(l => l.includes('resultLearningEvidence'));
    const importLine = mountLines.find(l => l.includes('import'));
    const useLine = mountLines.find(l => l.includes('app.use'));
    expect(importLine).toBeTruthy();
    expect(useLine).toBeTruthy();
    expect(useLine).toContain('schoolAuthMiddleware');
  });

  it('ai.ts should not have Package 10 expansion', () => {
    const aiContent = readBackendSrcFile('routes/ai.ts');
    expect(aiContent).not.toContain('ResultLearningEvidence');
    expect(aiContent).not.toContain('MasteryMutation');
    expect(aiContent).not.toContain('ObjectiveMasteryImpact');
    expect(aiContent).not.toContain('RevisionSignal');
    expect(aiContent).not.toContain('GrowthSignal');
  });

  it('student-safe projection should exclude forbidden fields', () => {
    const projection = projectionService.toStudentSafeProjection('student-1', {
      resultLearningEvidenceBridgeId: 'bridge-1', schoolId: 'school-1',
      resultFinalizationDecisionId: 'd-1', resultReleaseReadinessId: 'r-1',
      markingResultVersionId: 'v-1', studentRef: 'student-1',
      bridgeStatus: 'completed', bridgeMode: 'teacher_approved_result',
      safeEvidenceSummary: 'test', createdByActorId: 'a-1', createdByRole: 'teacher',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    expect(projection).not.toHaveProperty('answerKeyText');
    expect(projection).not.toHaveProperty('rawRubric');
    expect(projection).not.toHaveProperty('rawStudentAnswer');
    expect(projection).not.toHaveProperty('hiddenReasoning');
    expect(projection).not.toHaveProperty('chainOfThought');
    expect(projection).not.toHaveProperty('scoreBeforeFinalization');
    expect(projection).not.toHaveProperty('parentDeliveryPayload');
    expect(projection).not.toHaveProperty('reportCardPayload');
    expect(projection).not.toHaveProperty('rawMasteryDelta');
  });

  it('parent-boundary projection should not include report card payload', () => {
    const projection = projectionService.toParentBoundaryProjection('parent-1', {
      resultLearningEvidenceBridgeId: 'bridge-1', schoolId: 'school-1',
      resultFinalizationDecisionId: 'd-1', resultReleaseReadinessId: 'r-1',
      markingResultVersionId: 'v-1', studentRef: 'student-1',
      bridgeStatus: 'completed', bridgeMode: 'teacher_approved_result',
      safeEvidenceSummary: 'test', createdByActorId: 'a-1', createdByRole: 'teacher',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    expect(projection).not.toHaveProperty('parentDeliveryPayload');
    expect(projection).not.toHaveProperty('reportCardPayload');
    expect(projection).not.toHaveProperty('rawRubric');
    expect(projection).not.toHaveProperty('answerKeyText');
    expect(projection.allowedFieldNames).toContain('studentRef');
    expect(projection.blockedFieldNames).toContain('answerKeyText');
    expect(projection.blockedFieldNames).toContain('parentDeliveryPayload');
  });

  it('assertNoAnswerKeyLeakage should throw on answer key', () => {
    expect(() => projectionService.assertNoAnswerKeyLeakage({ answerKeyText: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoAnswerKeyLeakage({ correctAnswerSummary: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
  });

  it('assertNoRubricLeakage should throw on rubric', () => {
    expect(() => projectionService.assertNoRubricLeakage({ rubricInternal: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoRubricLeakage({ rawRubric: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
  });

  it('assertNoRawStudentAnswerLeakage should throw on raw answer', () => {
    expect(() => projectionService.assertNoRawStudentAnswerLeakage({ rawStudentAnswer: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
  });

  it('assertNoTeacherOnlyLeakage should throw on teacher notes', () => {
    expect(() => projectionService.assertNoTeacherOnlyLeakage({ markingNotesTeacherOnly: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
  });

  it('assertNoHiddenReasoningLeakage should throw on chain of thought', () => {
    expect(() => projectionService.assertNoHiddenReasoningLeakage({ chainOfThought: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
  });

  it('assertNoUnreleasedGradeLeakage should throw on unreleased scores', () => {
    expect(() => projectionService.assertNoUnreleasedGradeLeakage({ unreleasedScore: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
  });

  it('assertNoParentDeliveryPayloadLeakage should throw on parent payload', () => {
    expect(() => projectionService.assertNoParentDeliveryPayloadLeakage({ parentDeliveryPayload: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
  });

  it('assertNoReportCardPayloadLeakage should throw on report card', () => {
    expect(() => projectionService.assertNoReportCardPayloadLeakage({ reportCardPayload: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
  });

  it('assertNoRawMasteryDeltaLeakage should throw on raw delta', () => {
    expect(() => projectionService.assertNoRawMasteryDeltaLeakage({ rawMasteryDelta: 'test' } as any)).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoRawMasteryDeltaLeakage({ beforeStateJson: {} } as any)).toThrow('FORBIDDEN_FIELD');
  });

  it('route should contain safe response envelope keys', () => {
    const content = readBackendSrcFile('routes/resultLearningEvidence.ts');
    expect(content).toContain('ok');
    expect(content).toContain('requestId');
    expect(content).toContain('resourceId');
    expect(content).toContain('safeMessage');
    expect(content).toContain('reasonCode');
  });

  it('route should require idempotency key for mutating endpoints', () => {
    const content = readBackendSrcFile('routes/resultLearningEvidence.ts');
    expect(content).toContain('idempotency-key');
    expect(content).toContain('getIdempotencyKey');
  });
});
