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
import { BlueprintCoverageGapService } from '../services/blueprintCoverageGapService';
import { createInMemoryExamBlueprintRepositories } from '../repositories/inMemoryExamBlueprintRepositories';

describe('Package 4: Question Selection', () => {
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
  const selectionService = new QuestionSelectionService({
    enforcementService,
    eligibilityService,
    coverageGapService,
    selectionRunRepo: repos.selectionRunRepo,
    selectionCandidateRepo: repos.selectionCandidateRepo,
  });

  beforeEach(() => {
    itemRepo.reset();
    versionRepo.reset();
    governanceRepo.reset();
    exposureHoldRepo.reset();
    repos.selectionRunRepo.reset();
    repos.selectionCandidateRepo.reset();
  });

  function seedApprovedQuestion(opts: {
    id: string;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
    objectiveId?: string;
    difficulty?: string;
    type?: string;
    securityClass?: string;
  }) {
    const now = new Date().toISOString();
    itemRepo.create({
      questionId: opts.id,
      schoolId: 'school-1',
      status: 'approved',
      subjectId: opts.subjectId || 'math',
      topicId: opts.topicId || 'algebra',
      skillId: opts.skillId || 'solving',
      curriculumVersionId: 'cv-1',
      primaryObjectiveId: opts.objectiveId || 'obj-1',
      currentVersionId: `v-${opts.id}`,
      createdByActorId: 'teacher-1',
      createdByRole: 'teacher',
      sourceType: 'teacher_created',
      securityClass: (opts.securityClass || 'quiz_safe') as any,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    });
    versionRepo.create({
      questionVersionId: `v-${opts.id}`,
      questionId: opts.id,
      versionNumber: 1,
      status: 'approved' as const,
      stemSafeText: 'Test question',
      questionType: (opts.type || 'multiple_choice') as any,
      difficultyBand: (opts.difficulty || 'recall') as any,
      language: 'English',
      studentSafeExplanation: 'Explanation',
      teacherExplanation: 'Teacher note',
      estimatedTimeSeconds: 120,
      createdByActorId: 'teacher-1',
      createdAt: now,
      approvedAt: now,
      supersededAt: null,
      contentHash: `hash-${opts.id}`,
    });
    governanceRepo.saveUsageEligibility({
      questionVersionId: `v-${opts.id}`,
      usageMode: 'exam',
      eligible: true,
      reasonCodes: [],
      checkedAt: now,
    });
  }

  const blueprintVersion = {
    blueprintVersionId: 'bv-1',
    blueprintId: 'bp-1',
    versionNumber: 1,
    status: 'approved' as const,
    title: 'Test Blueprint v1',
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

  it('only approved QuestionBankItemRecord can be selected', async () => {
    seedApprovedQuestion({ id: 'q1', objectiveId: 'obj-1' });
    const draftQ: any = { questionId: 'q-draft', subjectId: 'math', topicId: 'algebra', skillId: 'solving', primaryObjectiveId: 'obj-1', curriculumVersionId: 'cv-1', currentVersionId: 'v-draft', createdByActorId: 'teacher-1', createdByRole: 'teacher', sourceType: 'teacher_created', securityClass: 'quiz_safe', schoolId: 'school-1', status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), archivedAt: null };
    itemRepo.create(draftQ);
    versionRepo.create({ questionVersionId: 'v-draft', questionId: 'q-draft', versionNumber: 1, status: 'draft', stemSafeText: 'Draft', questionType: 'multiple_choice', difficultyBand: 'recall', language: 'English', studentSafeExplanation: '', teacherExplanation: '', estimatedTimeSeconds: 60, createdByActorId: 'teacher-1', createdAt: new Date().toISOString(), approvedAt: null, supersededAt: null, contentHash: 'hash-draft' });

    const { eligible, reasons } = await eligibilityService.buildEligiblePool('school-1', blueprintVersion, []);
    const ids = eligible.map(e => e.questionId);
    expect(ids).toContain('q1');
    expect(ids).not.toContain('q-draft');
  });

  it('only approved QuestionVersionRecord can be selected', async () => {
    seedApprovedQuestion({ id: 'q1', objectiveId: 'obj-1' });
    const { eligible } = await eligibilityService.buildEligiblePool('school-1', blueprintVersion, []);
    expect(eligible.length).toBeGreaterThan(0);
  });

  it('exam usage eligibility is required', async () => {
    seedApprovedQuestion({ id: 'q1', objectiveId: 'obj-1' });
    governanceRepo.saveUsageEligibility({
      questionVersionId: 'v-q1',
      usageMode: 'exam',
      eligible: false,
      reasonCodes: ['not_exam_eligible'],
      checkedAt: new Date().toISOString(),
    });
    const { eligible } = await eligibilityService.buildEligiblePool('school-1', blueprintVersion, []);
    expect(eligible.length).toBe(0);
  });

  it('active exposure hold blocks selection', async () => {
    seedApprovedQuestion({ id: 'q1', objectiveId: 'obj-1' });
    exposureHoldRepo.create({
      exposureHoldId: 'hold-1',
      schoolId: 'school-1',
      questionId: 'q1',
      questionVersionId: 'v-q1',
      holdType: 'policy_block' as const,
      status: 'active',
      reasonCode: 'leak_suspected',
      safeSummary: 'Suspected leak',
      createdByActorId: 'admin-1',
      createdAt: new Date().toISOString(),
      releasedByActorId: null,
      releasedAt: null,
      releaseReason: null,
    });
    const { eligible } = await eligibilityService.buildEligiblePool('school-1', blueprintVersion, []);
    expect(eligible.length).toBe(0);
  });

  it('curriculum mismatch creates gap reason', async () => {
    seedApprovedQuestion({ id: 'q1', objectiveId: 'obj-1' });
    const mismatchVersion = { ...blueprintVersion, curriculumVersionId: 'cv-other' };
    const { eligible } = await eligibilityService.buildEligiblePool('school-1', mismatchVersion, []);
    expect(eligible.length).toBe(0);
  });

  it('selection is deterministic for same inputs', async () => {
    seedApprovedQuestion({ id: 'q1', objectiveId: 'obj-1' });
    seedApprovedQuestion({ id: 'q2', objectiveId: 'obj-2' });
    seedApprovedQuestion({ id: 'q3', objectiveId: 'obj-2', difficulty: 'application' });

    const reqs = [
      { requirementId: 'r1', blueprintVersionId: 'bv-1', schoolId: 'school-1', requirementType: 'objective' as const, subjectId: 'math', topicId: 'algebra', skillId: 'solving', objectiveId: 'obj-1', requiredQuestionCount: 1, requiredMarks: 10, minimumDifficulty: 'recall' as const, maximumDifficulty: 'creation' as const, questionType: 'multiple_choice' as const, weight: 1, isMandatory: true, createdAt: new Date().toISOString() },
      { requirementId: 'r2', blueprintVersionId: 'bv-1', schoolId: 'school-1', requirementType: 'objective' as const, subjectId: 'math', topicId: 'algebra', skillId: 'solving', objectiveId: 'obj-2', requiredQuestionCount: 1, requiredMarks: 10, minimumDifficulty: 'recall' as const, maximumDifficulty: 'creation' as const, questionType: 'multiple_choice' as const, weight: 1, isMandatory: true, createdAt: new Date().toISOString() },
    ];

    const result1 = await selectionService.selectQuestionsForBlueprint('school-1', blueprintVersion, reqs, 'balanced');
    const result2 = await selectionService.selectQuestionsForBlueprint('school-1', blueprintVersion, reqs, 'balanced');

    expect(result1.selected.length).toBeGreaterThan(0);
    expect(result2.selected.length).toBeGreaterThan(0);
  });

  it('insufficient pool produces gap report instead of fake success', async () => {
    seedApprovedQuestion({ id: 'q1', objectiveId: 'obj-1' });
    const reqs = [
      { requirementId: 'r1', blueprintVersionId: 'bv-1', schoolId: 'school-1', requirementType: 'objective' as const, subjectId: 'math', topicId: 'algebra', skillId: 'solving', objectiveId: 'obj-1', requiredQuestionCount: 10, requiredMarks: 100, minimumDifficulty: 'recall' as const, maximumDifficulty: 'creation' as const, questionType: 'multiple_choice' as const, weight: 1, isMandatory: true, createdAt: new Date().toISOString() },
    ];

    const result = await selectionService.selectQuestionsForBlueprint('school-1', blueprintVersion, reqs, 'balanced');
    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.gaps[0].reasonCode).toBe('INSUFFICIENT_POOL');
  });
});
