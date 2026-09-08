import { describe, it, expect, beforeEach } from 'vitest';
import { Phase3ObjectiveMasteryService } from '../services/phase3ObjectiveMasteryService';
import { phase3ObjectiveRepository } from '../services/phase3ObjectiveRepository';
import type {
  Phase3ObjectiveEvidenceBridgeInput,
  Phase3ObjectiveMasterySnapshot,
} from '../contracts/phase3ObjectiveMasteryContracts';

const service = new Phase3ObjectiveMasteryService();

const testSchoolId = 'mastery-test-school';
const testLearnerId = 'mastery-test-learner';
const testTeacherId = 'mastery-test-teacher';
const testClassId = 'mastery-test-class';
const testObjectiveId = 'mastery-test-objective';

function makeEvidenceInput(overrides: Partial<Phase3ObjectiveEvidenceBridgeInput>): Phase3ObjectiveEvidenceBridgeInput {
  return {
    objectiveId: testObjectiveId,
    schoolId: testSchoolId,
    learnerId: testLearnerId,
    classId: testClassId,
    subjectId: 'Math',
    topicId: 'Algebra',
    skillId: 'sk_test',
    modeSessionId: 'session_1',
    evidenceType: 'quiz_result',
    evidenceStrength: 'weak',
    sourceMode: 'quiz',
    safeEvidenceRef: 'evt_ref_1',
    signalBuckets: {},
    hintUsed: false,
    reasonCodes: [],
    idempotencyKey: 'ik_1',
    attemptNumber: 1,
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<Phase3ObjectiveMasterySnapshot> = {}): Phase3ObjectiveMasterySnapshot {
  return {
    snapshotId: '',
    objectiveId: testObjectiveId,
    schoolId: testSchoolId,
    learnerId: testLearnerId,
    classId: testClassId,
    status: 'not_started',
    reasonCodes: [],
    evidenceCount: 0,
    strongEvidenceCount: 0,
    weakEvidenceCount: 0,
    attemptCount: 0,
    hintDependencyCount: 0,
    teachBackPassCount: 0,
    transferCheckPassCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Phase3ObjectiveMasteryService', () => {
  beforeEach(async () => {
    await service.resetForTests();
    phase3ObjectiveRepository.resetPhase3ObjectiveRepositoryForTests();
  });

  describe('calculateObjectiveMasteryStatus', () => {
    it('should start as not_started when no evidence', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'none',
        hintUsed: false,
        attemptCount: 0,
        errorCount: 0,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      expect(status).toBe('not_started');
    });

    it('should become early_signal after first moderate or strong evidence', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'moderate',
        hintUsed: false,
        attemptCount: 1,
        errorCount: 0,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      expect(status).toBe('early_signal');
    });

    it('should become still_learning for weak signal patterns', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'weak',
        hintUsed: false,
        attemptCount: 1,
        errorCount: 1,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      expect(status).toBe('still_learning');
    });

    it('should become getting_better for improving signal', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'strong',
        hintUsed: false,
        attemptCount: 2,
        errorCount: 1,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      expect(status).toBe('getting_better');
    });

    it('should become almost_there with strong recent evidence', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'strong',
        hintUsed: false,
        attemptCount: 2,
        errorCount: 0,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      expect(status).toBe('almost_there');
    });

    it('should become confident only with teachback + transfer passed and strong evidence', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'strong',
        hintUsed: false,
        attemptCount: 3,
        errorCount: 0,
        teachBackPassCount: 1,
        transferCheckPassCount: 1,
      });

      expect(status).toBe('confident');
    });

    it('should become needs_rescue for repeated weak evidence with high error count', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'weak',
        hintUsed: true,
        attemptCount: 4,
        errorCount: 3,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      expect(status).toBe('needs_rescue');
    });

    it('should become needs_teacher_support for persistent rescue', () => {
      const snapshot = makeSnapshot({
        evidenceCount: 6,
        weakEvidenceCount: 5,
        hintDependencyCount: 4,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
        status: 'needs_rescue',
      });

      const classification = service.classifyObjectiveRescueNeed(snapshot);
      expect(classification.needsRescue).toBe(true);
      expect(classification.needsTeacherSupport).toBe(true);
      expect(classification.reasonCodes).toContain('teacher_support_requested');
    });

    it('should NOT set confident from single correct answer alone', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'strong',
        hintUsed: false,
        attemptCount: 1,
        errorCount: 0,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      expect(status).not.toBe('confident');
    });

    it('should NOT set confident from confidence alone', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'moderate',
        hintUsed: false,
        attemptCount: 2,
        errorCount: 0,
        confidenceLabel: 'know_this',
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      expect(status).not.toBe('confident');
    });

    it('should NOT set confident from page view (opened page)', () => {
      const status = service.calculateObjectiveMasteryStatus({
        objectiveId: testObjectiveId,
        schoolId: testSchoolId,
        learnerId: testLearnerId,
        evidenceStrength: 'weak',
        hintUsed: false,
        attemptCount: 1,
        errorCount: 0,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      expect(status).not.toBe('confident');
      expect(status).toBe('still_learning');
    });
  });

  describe('classifyObjectiveRescueNeed', () => {
    it('should classify rescue need correctly for weak evidence pattern', () => {
      const snapshot = makeSnapshot({
        evidenceCount: 5,
        weakEvidenceCount: 4,
        hintDependencyCount: 0,
      });

      const result = service.classifyObjectiveRescueNeed(snapshot);
      expect(result.needsRescue).toBe(true);
      expect(result.reasonCodes).toContain('weak_recall_signal');
    });

    it('should classify rescue need correctly for high hint dependency', () => {
      const snapshot = makeSnapshot({
        evidenceCount: 4,
        weakEvidenceCount: 0,
        hintDependencyCount: 3,
      });

      const result = service.classifyObjectiveRescueNeed(snapshot);
      expect(result.needsRescue).toBe(true);
      expect(result.reasonCodes).toContain('high_hint_dependency');
    });

    it('should classify rescue need correctly for repeated instability', () => {
      const snapshot = makeSnapshot({
        evidenceCount: 4,
        weakEvidenceCount: 3,
      });

      const result = service.classifyObjectiveRescueNeed(snapshot);
      expect(result.needsRescue).toBe(true);
      expect(result.reasonCodes).toContain('repeated_unstable_check');
    });

    it('should not flag rescue when evidence is strong', () => {
      const snapshot = makeSnapshot({
        evidenceCount: 5,
        weakEvidenceCount: 1,
        strongEvidenceCount: 4,
        hintDependencyCount: 0,
      });

      const result = service.classifyObjectiveRescueNeed(snapshot);
      expect(result.needsRescue).toBe(false);
      expect(result.needsTeacherSupport).toBe(false);
    });

    it('should trigger teacher support when rescue conditions are met and evidence count >= 5', () => {
      const snapshot = makeSnapshot({
        evidenceCount: 5,
        weakEvidenceCount: 4,
        hintDependencyCount: 4,
        teachBackPassCount: 0,
        transferCheckPassCount: 0,
      });

      const result = service.classifyObjectiveRescueNeed(snapshot);
      expect(result.needsRescue).toBe(true);
      expect(result.needsTeacherSupport).toBe(true);
    });
  });

  describe('updateObjectiveMasteryFromEvidence', () => {
    it('should return progress update from first evidence', async () => {
      const result = await service.updateObjectiveMasteryFromEvidence(makeEvidenceInput({
        evidenceStrength: 'moderate',
        idempotencyKey: 'ik_first',
      }));

      expect(result.changed).toBe(true);
      expect(result.previousStatus).toBe('not_started');
      expect(result.newStatus).toBe('early_signal');
      expect(result.reasonCodes).toContain('first_evidence_received');
    });

    it('should increment evidence counters', async () => {
      await service.updateObjectiveMasteryFromEvidence(makeEvidenceInput({
        evidenceStrength: 'weak',
        idempotencyKey: 'ik_inc_1',
      }));

      const result = await service.updateObjectiveMasteryFromEvidence(makeEvidenceInput({
        evidenceStrength: 'strong',
        idempotencyKey: 'ik_inc_2',
      }));

      expect(result.reasonCodes).toContain('strong_recent_evidence');
    });
  });

  describe('createLearnerSafeObjectiveExplanation', () => {
    it('should create learner-safe explanation', () => {
      phase3ObjectiveRepository.createObjective({
        schoolId: testSchoolId,
        classId: testClassId,
        teacherId: testTeacherId,
        creatorId: testTeacherId,
        creatorRole: 'teacher',
        objectiveType: 'lesson_objective',
        difficultyBucket: 'core',
        title: 'Linear Equations',
        safeDescription: 'Learn to solve linear equations',
        successCriteria: [{
          criterionId: 'c1',
          description: 'Solve linear equations correctly',
          measurableIndicator: '80% accuracy',
          orderIndex: 0,
        }],
        sourceTruthStatus: { status: 'approved' },
        estimatedMinutes: 25,
      });

      const explanation = service.createLearnerSafeObjectiveExplanation(
        testSchoolId, testLearnerId, 'obj_non_existent',
      );

      expect(explanation).toBeDefined();
      expect(explanation.objectiveId).toBe('obj_non_existent');
      expect(explanation.status).toBe('not_started');
      expect(explanation.nextStep).toBeTruthy();
      expect(explanation.safeEvidenceRefs).toEqual([]);
    });
  });

  describe('createTeacherSafeObjectiveSummary', () => {
    it('should create teacher-safe summary', () => {
      const obj = phase3ObjectiveRepository.createObjective({
        schoolId: testSchoolId,
        classId: testClassId,
        teacherId: testTeacherId,
        creatorId: testTeacherId,
        creatorRole: 'teacher',
        objectiveType: 'lesson_objective',
        difficultyBucket: 'core',
        title: 'Linear Equations',
        safeDescription: 'Learn to solve linear equations',
        successCriteria: [{
          criterionId: 'c1',
          description: 'Solve linear equations correctly',
          measurableIndicator: '80% accuracy',
          orderIndex: 0,
        }],
        sourceTruthStatus: { status: 'approved' },
        estimatedMinutes: 25,
      });

      const summary = service.createTeacherSafeObjectiveSummary(
        testSchoolId, testTeacherId, obj.objectiveId, testClassId,
      );

      expect(summary).toBeDefined();
      expect(summary.objectiveId).toBe(obj.objectiveId);
      expect(summary.totalStudents).toBe(0);
      expect(summary.confidentCount).toBe(0);
      expect(summary.rescueCount).toBe(0);
      expect(summary.safeSummary).toBeTruthy();
    });
  });
});
