import { describe, it, expect, beforeEach } from 'vitest';
import { AssessmentCommandEnforcementService } from '../../../assessment/assessmentCommandEnforcementService';
import { AssessmentPolicyRegistry } from '../../../assessment/policies/assessmentPolicyRegistry';
import { AssessmentIdempotencyService } from '../../../assessment/idempotency/assessmentIdempotencyService';
import { AssessmentAuditService } from '../../../assessment/audit/assessmentAuditService';
import { InMemoryIdempotencyRepository, InMemoryAuditWriter } from '../../../assessment/repositories/inMemoryAssessmentRepositories';
import {
  InMemoryQuestionBankItemRepository,
  InMemoryQuestionVersionRepository,
  InMemoryQuestionGovernanceRepository,
  InMemoryQuestionExposureHoldRepository,
} from '../../question-bank/repositories/inMemoryQuestionBankRepositories';
import { QuestionPoolEligibilityService } from '../services/questionPoolEligibilityService';
import { QuestionSelectionService } from '../services/questionSelectionService';
import { ExamDraftSetGenerationService } from '../services/examDraftSetGenerationService';
import { ExamDraftRankingService } from '../services/examDraftRankingService';
import { BlueprintCoverageGapService } from '../services/blueprintCoverageGapService';
import { ExamDraftProjectionSafetyService } from '../services/examDraftProjectionSafetyService';
import { createInMemoryExamBlueprintRepositories } from '../repositories/inMemoryExamBlueprintRepositories';

describe('Package 4: Draft Set Generation', () => {
  const policyRegistry = new AssessmentPolicyRegistry();
  const idempotencyRepo = new InMemoryIdempotencyRepository();
  const auditWriter = new InMemoryAuditWriter();
  const idempotencyService = new AssessmentIdempotencyService(idempotencyRepo);
  const auditService = new AssessmentAuditService(auditWriter);
  const enforcementService = new AssessmentCommandEnforcementService({
    policyRegistry,
    idempotencyService,
    auditService,
  });

  const itemRepo = new InMemoryQuestionBankItemRepository();
  const versionRepo = new InMemoryQuestionVersionRepository();
  const governanceRepo = new InMemoryQuestionGovernanceRepository();
  const exposureHoldRepo = new InMemoryQuestionExposureHoldRepository();

  const repos = createInMemoryExamBlueprintRepositories();

  const eligibilityService = new QuestionPoolEligibilityService({
    questionBankItemRepo: itemRepo as any,
    questionVersionRepo: versionRepo as any,
    questionGovernanceRepo: governanceRepo as any,
    usageEligibilityRepo: governanceRepo as any,
    exposureHoldRepo: exposureHoldRepo as any,
  });

  const coverageGapService = new BlueprintCoverageGapService();
  const rankingService = new ExamDraftRankingService();

  const selectionService = new QuestionSelectionService({
    enforcementService,
    eligibilityService,
    coverageGapService,
    selectionRunRepo: repos.selectionRunRepo,
    selectionCandidateRepo: repos.selectionCandidateRepo,
  });

  const draftSetService = new ExamDraftSetGenerationService({
    enforcementService,
    selectionService,
    rankingService,
    coverageGapService,
    blueprintRepo: repos.blueprintRepo,
    blueprintVersionRepo: repos.blueprintVersionRepo,
    requirementRepo: repos.requirementRepo,
    draftSetRepo: repos.draftSetRepo,
    draftRepo: repos.draftRepo,
    draftQuestionRepo: repos.draftQuestionRepo,
  });

  const projectionSafetyService = new ExamDraftProjectionSafetyService();

  beforeEach(() => {
    itemRepo.reset();
    versionRepo.reset();
    governanceRepo.reset();
    exposureHoldRepo.reset();
    repos.blueprintRepo.reset();
    repos.blueprintVersionRepo.reset();
    repos.requirementRepo.reset();
    repos.draftSetRepo.reset();
    repos.draftRepo.reset();
    repos.draftQuestionRepo.reset();
    repos.selectionRunRepo.reset();
    repos.selectionCandidateRepo.reset();
  });

  function seedQuestions(count: number) {
    const now = new Date().toISOString();
    for (let i = 0; i < count; i++) {
      const id = `q${i}`;
      itemRepo.create({
        questionId: id,
        schoolId: 'school-1',
        status: 'approved',
        subjectId: 'math',
        topicId: 'algebra',
        skillId: 'solving',
        curriculumVersionId: 'cv-1',
        primaryObjectiveId: `obj-${i % 3}`,
        currentVersionId: `v-${id}`,
        createdByActorId: 'teacher-1',
        createdByRole: 'teacher',
        sourceType: 'teacher_created',
        securityClass: 'quiz_safe',
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      });
      versionRepo.create({
        questionVersionId: `v-${id}`,
        questionId: id,
        versionNumber: 1,
        status: 'approved',
        stemSafeText: `Question ${i}`,
        questionType: 'multiple_choice',
        difficultyBand: i < 3 ? 'recall' : i < 6 ? 'understanding' : 'application',
        language: 'English',
        studentSafeExplanation: 'Exp',
        teacherExplanation: 'TExp',
        estimatedTimeSeconds: 120,
        createdByActorId: 'teacher-1',
        createdAt: now,
        approvedAt: now,
        supersededAt: null,
        contentHash: `hash-${id}`,
      });
      governanceRepo.saveUsageEligibility({
        questionVersionId: `v-${id}`,
        usageMode: 'exam',
        eligible: true,
        reasonCodes: [],
        checkedAt: now,
      });
    }
  }

  it('requestedDraftCount below 3 blocks', async () => {
    await expect(draftSetService.generateDraftSet(
      'school-1', null as any, null as any, [], 1, 'actor-1', 'teacher',
    )).rejects.toThrow('VALIDATION_FAILED');
  });

  it('requestedDraftCount above 10 blocks', async () => {
    await expect(draftSetService.generateDraftSet(
      'school-1', null as any, null as any, [], 11, 'actor-1', 'teacher',
    )).rejects.toThrow('VALIDATION_FAILED');
  });

  it('generateDraftSet creates 3-10 drafts', async () => {
    seedQuestions(10);
    const blueprint = {
      blueprintId: 'bp-1',
      schoolId: 'school-1',
      status: 'active' as const,
      title: 'Math Exam',
      subjectId: 'math',
      curriculumVersionId: 'cv-1',
      gradeBand: '10',
      examType: 'exam',
      createdByActorId: 'teacher-1',
      createdByRole: 'teacher',
      currentVersionId: 'bv-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    };
    await repos.blueprintRepo.create(blueprint);

    const blueprintVersion = {
      blueprintVersionId: 'bv-1',
      blueprintId: 'bp-1',
      versionNumber: 1,
      status: 'approved' as const,
      title: 'v1',
      safeDescription: 'Test',
      durationMinutes: 60,
      totalMarks: 100,
      targetQuestionCount: 5,
      difficultyMixJson: '{}',
      questionTypeMixJson: '{}',
      securityClassRequirement: 'practice_safe',
      coveragePolicy: 'balanced_weighted' as const,
      selectionStrategy: 'balanced' as const,
      curriculumVersionId: 'cv-1',
      createdByActorId: 'teacher-1',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      supersededAt: null,
    };
    await repos.blueprintVersionRepo.create(blueprintVersion);

    const result = await draftSetService.generateDraftSet(
      'school-1', blueprint, blueprintVersion, [], 3, 'teacher-1', 'teacher',
    );

    expect(result.draftSet.requestedDraftCount).toBe(3);
    expect(result.drafts.length).toBe(3);
    expect(result.draftSet.status).toBe('ready_for_teacher_review');
  });

  it('each draft contains selected question references', async () => {
    seedQuestions(10);
    const blueprint = {
      blueprintId: 'bp-2',
      schoolId: 'school-1',
      status: 'active' as const,
      title: 'Math Exam 2',
      subjectId: 'math',
      curriculumVersionId: 'cv-1',
      gradeBand: '10',
      examType: 'exam',
      createdByActorId: 'teacher-1',
      createdByRole: 'teacher',
      currentVersionId: 'bv-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    };
    await repos.blueprintRepo.create(blueprint);
    await repos.blueprintVersionRepo.create({
      blueprintVersionId: 'bv-2',
      blueprintId: 'bp-2',
      versionNumber: 1,
      status: 'approved' as const,
      title: 'v1',
      safeDescription: '',
      durationMinutes: 60,
      totalMarks: 100,
      targetQuestionCount: 5,
      difficultyMixJson: '{}',
      questionTypeMixJson: '{}',
      securityClassRequirement: 'practice_safe',
      coveragePolicy: 'balanced_weighted' as const,
      selectionStrategy: 'balanced' as const,
      curriculumVersionId: 'cv-1',
      createdByActorId: 'teacher-1',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      supersededAt: null,
    });

    const versionBp2 = await repos.blueprintVersionRepo.findLatestByBlueprintId('bp-2');
    const result = await draftSetService.generateDraftSet(
      'school-1', blueprint, versionBp2!, [], 3, 'teacher-1', 'teacher',
    );

    expect(result.allQuestions.length).toBe(3);
    for (const questions of result.allQuestions) {
      expect(questions.length).toBeGreaterThan(0);
    }
  });

  it('drafts are ranked and scored', async () => {
    seedQuestions(10);
    const blueprint = {
      blueprintId: 'bp-3',
      schoolId: 'school-1',
      status: 'active' as const,
      title: 'Math Exam 3',
      subjectId: 'math',
      curriculumVersionId: 'cv-1',
      gradeBand: '10',
      examType: 'exam',
      createdByActorId: 'teacher-1',
      createdByRole: 'teacher',
      currentVersionId: 'bv-3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    };
    await repos.blueprintRepo.create(blueprint);
    await repos.blueprintVersionRepo.create({
      blueprintVersionId: 'bv-3',
      blueprintId: 'bp-3',
      versionNumber: 1,
      status: 'approved' as const,
      title: 'v1',
      safeDescription: '',
      durationMinutes: 60,
      totalMarks: 100,
      targetQuestionCount: 5,
      difficultyMixJson: '{}',
      questionTypeMixJson: '{}',
      securityClassRequirement: 'practice_safe',
      coveragePolicy: 'balanced_weighted' as const,
      selectionStrategy: 'balanced' as const,
      curriculumVersionId: 'cv-1',
      createdByActorId: 'teacher-1',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      supersededAt: null,
    });

    const versionBp3 = await repos.blueprintVersionRepo.findLatestByBlueprintId('bp-3');
    const result = await draftSetService.generateDraftSet(
      'school-1', blueprint, versionBp3!, [], 3, 'teacher-1', 'teacher',
    );

    for (const draft of result.drafts) {
      expect(draft.overallScore).toBeGreaterThan(0);
      expect(draft.safeTeacherSummary).toBeTruthy();
      expect(draft.recommendationReason).toBeTruthy();
    }

    expect(result.drafts[0].rank).toBeLessThan(result.drafts[2].rank || 999);
  });

  it('safeTeacherSummary is present for each draft', async () => {
    seedQuestions(10);
    const blueprint = {
      blueprintId: 'bp-4',
      schoolId: 'school-1',
      status: 'active' as const,
      title: 'Math Exam 4',
      subjectId: 'math',
      curriculumVersionId: 'cv-1',
      gradeBand: '10',
      examType: 'exam',
      createdByActorId: 'teacher-1',
      createdByRole: 'teacher',
      currentVersionId: 'bv-4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    };
    await repos.blueprintRepo.create(blueprint);
    await repos.blueprintVersionRepo.create({
      blueprintVersionId: 'bv-4', blueprintId: 'bp-4', versionNumber: 1, status: 'approved' as const, title: 'v1', safeDescription: '', durationMinutes: 60, totalMarks: 100, targetQuestionCount: 5, difficultyMixJson: '{}', questionTypeMixJson: '{}', securityClassRequirement: 'practice_safe', coveragePolicy: 'balanced_weighted' as const, selectionStrategy: 'balanced' as const, curriculumVersionId: 'cv-1', createdByActorId: 'teacher-1', createdAt: new Date().toISOString(), approvedAt: new Date().toISOString(), supersededAt: null,
    });

    const versionBp4 = await repos.blueprintVersionRepo.findLatestByBlueprintId('bp-4');
    const result = await draftSetService.generateDraftSet('school-1', blueprint, versionBp4!, [], 3, 'teacher-1', 'teacher');
    for (const d of result.drafts) {
      expect(d.safeTeacherSummary).toBeTruthy();
    }
  });

  it('projection safety blocks student view', async () => {
    const forbidden = projectionSafetyService.toStudentForbiddenDraftView();
    expect(forbidden.error).toBe('FORBIDDEN');
  });

  it('projection safety does not leak answer keys', () => {
    const safeData = projectionSafetyService.assertNoAnswerKeyLeakage({
      draftId: 'd-1',
      answerKeySafeRef: 'secret',
      correctAnswerSummary: 'A',
      markingNotesTeacherOnly: 'secret',
    });
    expect((safeData as any).answerKeySafeRef).toBeUndefined();
    expect((safeData as any).correctAnswerSummary).toBeUndefined();
    expect((safeData as any).markingNotesTeacherOnly).toBeUndefined();
  });
});
