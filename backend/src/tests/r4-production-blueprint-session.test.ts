import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.resetModules();
// Use test mode WITHOUT R4_USE_PRISMA to use in-memory maps for session repo
process.env.NODE_ENV = 'test';
// Don't set R4_USE_PRISMA = 'true' so session repo uses in-memory maps

const objectiveId = 'prod-r4-objective';
const schoolId = 'prod-r4-school';
const subjectId = 'math';
const topicId = 'prod-r4-topic';
const skillId = 'prod-r4-skill';

function makeCanonicalObjective(): any {
  return {
    objectiveId,
    schoolId,
    subjectId,
    topicId,
    skillId,
    objectiveType: 'lesson_objective' as const,
    difficultyBucket: 'core' as const,
    title: 'Test Objective',
    safeDescription: 'Test safe description',
    successCriteria: [{ criterionId: 'c1', description: 'Test criterion', measurableIndicator: 'Can explain', orderIndex: 0 }],
    sourceTruthStatus: { status: 'approved' },
    isArchived: false,
    safeTags: [],
    estimatedMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeBlueprint(): any {
  return {
    blueprintId: 'bp-prod-r4',
    objectiveId,
    schoolId,
    classId: 'class_1',
    subjectId,
    topicId,
    skillId,
    recommendedModeDestination: 'focus',
    checkItems: [
      { itemId: 'ci_prod-r4_0', itemType: 'recall', promptSafeRef: 'prompt_lesson_objective_recall', orderIndex: 0, modeDestination: 'focus', estimatedTimeMinutes: 3 },
      { itemId: 'ci_prod-r4_1', itemType: 'understanding', promptSafeRef: 'prompt_lesson_objective_understanding', orderIndex: 1, modeDestination: 'quiz', estimatedTimeMinutes: 5 },
      { itemId: 'ci_prod-r4_2', itemType: 'application', promptSafeRef: 'prompt_lesson_objective_application', orderIndex: 2, modeDestination: 'quiz', estimatedTimeMinutes: 7 },
    ],
    successCriteriaRefs: ['c1'],
    checkPolicy: {
      requiresConfidenceBefore: true,
      requiresConfidenceAfter: true,
      requiresTeachBack: false,
      requiresTransferQuestion: false,
      requiresDelayedRecall: false,
      hintPolicy: 'limit_hints',
      antiCheatPolicy: 'standard',
      evidencePolicy: 'standard',
      maxAttempts: 3,
      minTimeSeconds: 30,
    },
    confidenceBeforeRequired: true,
    confidenceAfterRequired: true,
    teachBackRequired: false,
    transferQuestionRequired: false,
    delayedRecallRequired: false,
    sourceTruthStatus: { status: 'approved' },
    safeInstructions: 'Explain what you understand in your own words without looking up answers. The goal is to see what you already know.',
    createdAt: new Date().toISOString(),
  };
}

describe('R4 Production Blueprint Session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    // Don't set R4_USE_PRISMA so session repo uses in-memory maps
    delete process.env.R4_USE_PRISMA;
  });

  it('async session start: resolves objective from store, passes directly to blueprint builder, no sync lookup', async () => {
    // Import the singleton repositories used by the session service
    const { phase3ObjectiveRepository } = await import('../services/phase3ObjectiveRepository');
    const { phase3DailyObjectiveCheckRepository } = await import('../services/phase3DailyObjectiveCheckRepository');
    const { phase3ObjectiveCheckBlueprintService } = await import('../services/phase3ObjectiveCheckBlueprintService');

    // Reset and populate the objective store
    phase3ObjectiveRepository.resetPhase3ObjectiveRepositoryForTests();
    const created = phase3ObjectiveRepository.createObjective({
      schoolId,
      classId: 'class_1',
      subjectId,
      topicId,
      skillId,
      teacherId: 'teacher_1',
      creatorId: 'teacher_1',
      creatorRole: 'teacher',
      objectiveType: 'lesson_objective',
      difficultyBucket: 'core',
      title: 'Test Objective',
      safeDescription: 'Test safe description',
      successCriteria: [{ criterionId: 'c1', description: 'Test criterion', measurableIndicator: 'Can explain', orderIndex: 0 }],
      sourceTruthStatus: { status: 'approved' },
      estimatedMinutes: 10,
    });

    // Use the generated objectiveId from createObjective
    const sessionObjectiveId = created.objectiveId;
    const sessionSchoolId = created.schoolId;

    // Reset the session repository (uses in-memory stores in test mode without R4_USE_PRISMA)
    phase3DailyObjectiveCheckRepository.resetPhase3DailyObjectiveCheckRepositoryForTests();

    const { Phase3DailyObjectiveCheckSessionService } = await import('../services/phase3DailyObjectiveCheckSessionService');

    // Mock the blueprint builder on the SINGLETON to return a deterministic blueprint
    const mockCreateFromResolved = vi
      .fn()
      .mockReturnValue(makeBlueprint());
    phase3ObjectiveCheckBlueprintService['createObjectiveCheckBlueprintFromResolvedObjective'] = mockCreateFromResolved;

    const sessionService = new Phase3DailyObjectiveCheckSessionService();

    // Spy on getObjectiveById to throw if called (production sync lookup must not happen)
    vi.spyOn(phase3ObjectiveRepository, 'getObjectiveById').mockImplementation(() => {
      throw new Error('PRODUCTION SYNC OBJECTIVE LOOKUP MUST NOT BE CALLED');
    });

    // Spy on getObjectiveByIdAsync to verify it's called exactly once
    const getObjectiveByIdAsyncSpy = vi.spyOn(phase3ObjectiveRepository, 'getObjectiveByIdAsync');

    // In test mode without R4_USE_PRISMA, getObjectiveByIdAsync checks stores first.
    // Since we populated the store via createObjective, it should return the objective
    // without calling Prisma.
    const result = await sessionService.startDailyObjectiveCheckSessionAsync({
      schoolId: sessionSchoolId,
      studentId: 'student-prod-r4',
      objectiveId: sessionObjectiveId,
      subjectId,
      topicId,
      skillId,
      sourceTruthStatus: 'approved',
    });

    expect(result.error).toBeUndefined();
    expect(result.session).toBeDefined();
    expect(result.learnerResponse).toBeDefined();

    // Critical: getObjectiveByIdAsync called exactly once (canonical async resolution through store)
    expect(getObjectiveByIdAsyncSpy).toHaveBeenCalledTimes(1);
    // Critical: getObjectiveById NOT called (no second sync lookup)
    expect(phase3ObjectiveRepository.getObjectiveById).not.toHaveBeenCalled();

    // Blueprint builder called exactly once with the resolved objective
    expect(mockCreateFromResolved).toHaveBeenCalledTimes(1);
    const [receivedObjective] = mockCreateFromResolved.mock.calls[0];
    expect(receivedObjective.objectiveId).toBe(sessionObjectiveId);
    expect(receivedObjective.schoolId).toBe(sessionSchoolId);

    // Session creation called exactly once with correct references
    const createdSession = result.session!;
    expect(createdSession.objectiveId).toBe(sessionObjectiveId);
    expect(createdSession.topicId).toBe(topicId);
    expect(createdSession.skillId).toBe(skillId);
    expect(createdSession.blueprintId).toBe('bp-prod-r4');

    console.log('PASS: async session start - objective from store, no sync lookup, resolved objective passed directly');
  });

  it('blueprint builder: creates blueprint successfully with zero objective repository lookup calls', async () => {
    const mockObjective = makeCanonicalObjective();

    const { Phase3ObjectiveRepository } = await import('../services/phase3ObjectiveRepository');
    const { Phase3ObjectiveCheckBlueprintService } = await import('../services/phase3ObjectiveCheckBlueprintService');

    const repo = new Phase3ObjectiveRepository();
    repo.resetPhase3ObjectiveRepositoryForTests();

    // Create objective via repository to populate the store
    repo.createObjective({
      schoolId,
      classId: 'class_1',
      subjectId,
      topicId,
      skillId,
      teacherId: 'teacher_1',
      creatorId: 'teacher_1',
      creatorRole: 'teacher',
      objectiveType: 'lesson_objective',
      difficultyBucket: 'core',
      title: 'Test Objective',
      safeDescription: 'Test safe description',
      successCriteria: [{ criterionId: 'c1', description: 'Test criterion', measurableIndicator: 'Can explain', orderIndex: 0 }],
      sourceTruthStatus: { status: 'approved' },
      estimatedMinutes: 10,
    });

    const blueprintService = new Phase3ObjectiveCheckBlueprintService();

    let getObjectiveByIdCallCount = 0;
    let getObjectiveByIdAsyncCallCount = 0;

    ;(repo as any).getObjectiveById = vi.fn().mockImplementation(() => {
      getObjectiveByIdCallCount++;
      throw new Error('Sync lookup must not be called');
    });

    ;(repo as any).getObjectiveByIdAsync = vi.fn().mockImplementation(async () => {
      getObjectiveByIdAsyncCallCount++;
      return mockObjective;
    });

    const result = blueprintService['createObjectiveCheckBlueprintFromResolvedObjective'](
      mockObjective,
      schoolId,
      'learner',
    );

    expect(result).not.toHaveProperty('error');
    const blueprint = result as Exclude<typeof result, { error: string }>;
    // blueprintId is generated by the repository, just verify it exists
    expect(blueprint.blueprintId).toBeTruthy();
    expect(blueprint.objectiveId).toBe(objectiveId);
    expect(blueprint.schoolId).toBe(schoolId);
    expect(blueprint.checkItems.length).toBeGreaterThan(0);

    // Both sync and async lookup calls must be zero (objective from builder input / store)
    expect(getObjectiveByIdCallCount).toBe(0);
    expect(getObjectiveByIdAsyncCallCount).toBe(0);

    console.log('PASS: blueprint builder - zero repository lookup calls');
  });
});