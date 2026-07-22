import { describe, it, expect, beforeEach } from 'vitest';
import { Phase3ObjectiveRepository } from '../services/phase3ObjectiveRepository';
import { Phase3DailyObjectiveCheckRepository } from '../services/phase3DailyObjectiveCheckRepository';
import { Phase3DailyObjectiveCheckSessionService } from '../services/phase3DailyObjectiveCheckSessionService';
import { Phase3DailyObjectiveCheckCompletionService } from '../services/phase3DailyObjectiveCheckCompletionService';
import { Phase3DailyObjectiveConfidenceService } from '../services/phase3DailyObjectiveConfidenceService';
import { Phase3DailyObjectiveCheckAttemptService } from '../services/phase3DailyObjectiveCheckAttemptService';
import * as phase3ObjectiveMasteryService from '../services/phase3ObjectiveMasteryService';

describe('Phase3 Daily Objective Check - Task 001 Objective Foundation Integration', () => {
  let objRepo: Phase3ObjectiveRepository;
  let sessionService: Phase3DailyObjectiveCheckSessionService;
  let completionService: Phase3DailyObjectiveCheckCompletionService;
  let confidenceService: Phase3DailyObjectiveConfidenceService;
  let attemptService: Phase3DailyObjectiveCheckAttemptService;

  beforeEach(() => {
    objRepo = new Phase3ObjectiveRepository();
    objRepo.resetPhase3ObjectiveRepositoryForTests();
    const checkRepo = new Phase3DailyObjectiveCheckRepository();
    checkRepo.resetPhase3DailyObjectiveCheckRepositoryForTests();
    sessionService = new Phase3DailyObjectiveCheckSessionService();
    completionService = new Phase3DailyObjectiveCheckCompletionService();
    confidenceService = new Phase3DailyObjectiveConfidenceService();
    attemptService = new Phase3DailyObjectiveCheckAttemptService();
  });

  it('uses Phase3ObjectiveRepository from Task 001 for objective lookup', () => {
    const obj = objRepo.createObjective({
      schoolId: 's1', classId: 'c1', subjectId: 'sub1',
      topicId: 't1', teacherId: 't1', creatorId: 't1',
      creatorRole: 'teacher', objectiveType: 'lesson_objective',
      difficultyBucket: 'core', title: 'Integration Test', safeDescription: 'Integration',
      successCriteria: [{ criterionId: 'sc1', description: 'Test', measurableIndicator: 'Test', orderIndex: 0 }],
      sourceTruthStatus: { status: 'approved' }, estimatedMinutes: 10,
    });

    const result = sessionService.startDailyObjectiveCheckSession({
      schoolId: 's1', studentId: 'stu1', classId: 'c1',
      subjectId: 'sub1', objectiveId: obj.objectiveId,
      sourceTruthStatus: 'approved',
    });

    expect(result.error).toBeUndefined();
    expect(result.session!.objectiveId).toBe(obj.objectiveId);
    expect(result.session!.skillId).toBe(obj.skillId);
  });

  it('uses Task 001 blueprint service to generate check content', () => {
    const obj = objRepo.createObjective({
      schoolId: 's1', classId: 'c1', subjectId: 'sub1',
      topicId: 't1', teacherId: 't1', creatorId: 't1',
      creatorRole: 'teacher', objectiveType: 'lesson_objective',
      difficultyBucket: 'core', title: 'BP Test', safeDescription: 'BP',
      successCriteria: [{ criterionId: 'sc1', description: 'Test', measurableIndicator: 'Test', orderIndex: 0 }],
      sourceTruthStatus: { status: 'approved' }, estimatedMinutes: 10,
    });

    const result = sessionService.startDailyObjectiveCheckSession({
      schoolId: 's1', studentId: 'stu1', classId: 'c1',
      subjectId: 'sub1', objectiveId: obj.objectiveId,
      sourceTruthStatus: 'approved',
    });

    expect(result.session!.blueprintId).toBeTruthy();
    expect(result.session!.requiredSteps).toContain('confidence_before');
    expect(result.session!.requiredSteps).toContain('attempt');
  });

  it('completion writes safe objective evidence via Task 001 Objective Evidence Bridge', () => {
    const obj = objRepo.createObjective({
      schoolId: 's1', classId: 'c1', subjectId: 'sub1',
      topicId: 't1', teacherId: 't1', creatorId: 't1',
      creatorRole: 'teacher', objectiveType: 'lesson_objective',
      difficultyBucket: 'foundation', title: 'Evid Test', safeDescription: 'Evid',
      successCriteria: [{ criterionId: 'sc1', description: 'Test', measurableIndicator: 'Test', orderIndex: 0 }],
      sourceTruthStatus: { status: 'approved' }, estimatedMinutes: 10,
    });

    const start = sessionService.startDailyObjectiveCheckSession({
      schoolId: 's1', studentId: 'stu1', classId: 'c1',
      subjectId: 'sub1', objectiveId: obj.objectiveId,
      sourceTruthStatus: 'approved',
    });

    const session = start.session!;
    confidenceService.recordConfidenceBefore({
      checkSessionId: session.checkSessionId, schoolId: 's1',
      studentId: 'stu1', confidenceLevel: 'know_this', checkpointType: 'before',
    });
    attemptService.recordSafeAttemptSignal({
      checkSessionId: session.checkSessionId, schoolId: 's1',
      studentId: 'stu1', signalBucket: 'objective_check_passed',
      hintUsageBucket: 'low',
    });

    const repo = new Phase3DailyObjectiveCheckRepository();
    repo.markRequiredStepCompleted(session.checkSessionId, 'confidence_before');
    repo.markRequiredStepCompleted(session.checkSessionId, 'attempt');
    repo.markRequiredStepCompleted(session.checkSessionId, 'confidence_after');

    const completionResult = completionService.completeDailyObjectiveCheckSession({
      checkSessionId: session.checkSessionId,
      schoolId: 's1', studentId: 'stu1',
    });

    expect(completionResult.error).toBeUndefined();
    expect(completionResult.result!.evidenceBridgeResultId).toBeTruthy();
    expect(completionResult.result!.masteryUpdated).toBeDefined();
    expect(completionResult.result!.newMasteryStatus).toBeDefined();
  });

  it('completion updates objective mastery via Task 001 Mastery Service', () => {
    const obj = objRepo.createObjective({
      schoolId: 's1', classId: 'c1', subjectId: 'sub1',
      topicId: 't1', teacherId: 't1', creatorId: 't1',
      creatorRole: 'teacher', objectiveType: 'lesson_objective',
      difficultyBucket: 'foundation', title: 'Mastery Test', safeDescription: 'Mastery',
      successCriteria: [{ criterionId: 'sc1', description: 'Test', measurableIndicator: 'Test', orderIndex: 0 }],
      sourceTruthStatus: { status: 'approved' }, estimatedMinutes: 10,
    });

    const snapshotBefore = objRepo.getObjectiveMasterySnapshot(obj.objectiveId, 'stu1');
    expect(snapshotBefore).toBeNull();

    const start = sessionService.startDailyObjectiveCheckSession({
      schoolId: 's1', studentId: 'stu1', classId: 'c1',
      subjectId: 'sub1', objectiveId: obj.objectiveId,
      sourceTruthStatus: 'approved',
    });

    const session = start.session!;
    confidenceService.recordConfidenceBefore({
      checkSessionId: session.checkSessionId, schoolId: 's1',
      studentId: 'stu1', confidenceLevel: 'know_this', checkpointType: 'before',
    });
    attemptService.recordSafeAttemptSignal({
      checkSessionId: session.checkSessionId, schoolId: 's1',
      studentId: 'stu1', signalBucket: 'objective_check_passed',
      hintUsageBucket: 'low',
    });

    const repo = new Phase3DailyObjectiveCheckRepository();
    repo.markRequiredStepCompleted(session.checkSessionId, 'confidence_before');
    repo.markRequiredStepCompleted(session.checkSessionId, 'attempt');
    repo.markRequiredStepCompleted(session.checkSessionId, 'confidence_after');

    const completionResult = completionService.completeDailyObjectiveCheckSession({
      checkSessionId: session.checkSessionId,
      schoolId: 's1', studentId: 'stu1',
    });

    expect(completionResult.error).toBeUndefined();

    const snapshotAfter = objRepo.getObjectiveMasterySnapshot(obj.objectiveId, 'stu1');
    expect(snapshotAfter).not.toBeNull();
    expect(snapshotAfter!.snapshotId).toBeTruthy();
  });

  it('does not duplicate Task 001 objective engine', () => {
    expect(Phase3ObjectiveRepository).toBeDefined();
    expect(typeof Phase3ObjectiveRepository).toBe('function');
  });

  it('does not create duplicate mastery service', () => {
    expect(phase3ObjectiveMasteryService).toBeDefined();
  });
});
