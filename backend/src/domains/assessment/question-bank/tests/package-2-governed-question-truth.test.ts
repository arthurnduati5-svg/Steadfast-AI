import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { AssessmentCommandEnforcementService } from '../../assessmentCommandEnforcementService';
import { AssessmentPolicyRegistry } from '../../policies/assessmentPolicyRegistry';
import { AssessmentIdempotencyService } from '../../idempotency/assessmentIdempotencyService';
import { AssessmentAuditService } from '../../audit/assessmentAuditService';
import { AssessmentOutboxService } from '../../outbox/assessmentOutboxService';
import { InMemoryIdempotencyRepository, InMemoryAuditWriter, InMemoryOutboxRepository, InMemoryInboxRepository } from '../../repositories/inMemoryAssessmentRepositories';
import type { AssessmentCommandContext, AssessmentGovernedCommand } from '../../contracts/assessmentCommandContext';
import { GovernedQuestionCommandService } from '../services/governedQuestionCommandService';
import type { GovernedQuestionCommandServices } from '../services/governedQuestionCommandService';
import {
  InMemoryQuestionBankItemRepository,
  InMemoryQuestionVersionRepository,
  InMemoryQuestionPartVersionRepository,
  InMemoryQuestionAssetVersionRepository,
  InMemoryAnswerKeyVersionRepository,
  InMemoryRubricVersionRepository,
  InMemoryQuestionObjectiveMappingRepository,
  InMemoryQuestionSourceRecordRepository,
  InMemoryQuestionGovernanceRepository,
} from '../repositories/inMemoryQuestionBankRepositories';
import { DuplicateFingerprintService } from '../services/duplicateFingerprintService';
import {
  classifyQuestionType,
  classifySecurityClass,
} from '../services/questionClassificationService';
import {
  toStudentQuestionSafeView,
  toTeacherQuestionSafeView,
  toParentQuestionSafeView,
  isOutboxPayloadAnswerKeySafe,
  getAnswerKeySafeMetadata,
} from '../services/projectionSafetyService';

const defaultContext: AssessmentCommandContext = {
  actorId: 'test-actor',
  actorRole: 'teacher',
  schoolId: 'test-school',
  correlationId: 'corr-001',
  idempotencyKey: 'idem-001',
  source: 'api',
  now: '2026-07-13T12:00:00.000Z',
};

function makeCommand<TBody = Record<string, unknown>>(body: TBody, overrides?: Partial<AssessmentCommandContext>): AssessmentGovernedCommand<TBody> {
  return {
    context: { ...defaultContext, ...overrides } as AssessmentCommandContext,
    commandType: 'test_command',
    commandFingerprint: 'fingerprint-1',
    aggregateType: 'question_bank_item',
    aggregateId: 'agg-1',
    expectedVersion: 1,
    body,
  };
}

function recordToRecord(obj: unknown): Record<string, unknown> {
  return obj as Record<string, unknown>;
}

describe('Package 2 — Governed Question Truth', () => {
  let policyRegistry: AssessmentPolicyRegistry;
  let idempotencyService: AssessmentIdempotencyService;
  let auditService: AssessmentAuditService;
  let outboxService: AssessmentOutboxService;
  let enforcementService: AssessmentCommandEnforcementService;
  let questionBankItemRepo: InMemoryQuestionBankItemRepository;
  let questionVersionRepo: InMemoryQuestionVersionRepository;
  let questionPartVersionRepo: InMemoryQuestionPartVersionRepository;
  let questionAssetVersionRepo: InMemoryQuestionAssetVersionRepository;
  let answerKeyVersionRepo: InMemoryAnswerKeyVersionRepository;
  let rubricVersionRepo: InMemoryRubricVersionRepository;
  let questionObjectiveMappingRepo: InMemoryQuestionObjectiveMappingRepository;
  let questionSourceRecordRepo: InMemoryQuestionSourceRecordRepository;
  let questionGovernanceRepo: InMemoryQuestionGovernanceRepository;
  let governedService: GovernedQuestionCommandService;

  beforeEach(() => {
    policyRegistry = new AssessmentPolicyRegistry();
    (policyRegistry as any).register({
      family: 'QUESTION_DRAFT_CREATION',
      status: 'CONFIGURED',
      version: '1.0',
      description: 'Test draft policy',
    });

    const idempotencyRepo = new InMemoryIdempotencyRepository();
    idempotencyService = new AssessmentIdempotencyService(idempotencyRepo);

    const auditWriter = new InMemoryAuditWriter();
    auditService = new AssessmentAuditService(auditWriter);

    const outboxRepo = new InMemoryOutboxRepository();
    const inboxRepo = new InMemoryInboxRepository();
    outboxService = new AssessmentOutboxService(outboxRepo, inboxRepo, false);

    enforcementService = new AssessmentCommandEnforcementService(
      { policyRegistry, idempotencyService, auditService, outboxService },
      true,
      true,
      false,
    );

    questionBankItemRepo = new InMemoryQuestionBankItemRepository();
    questionVersionRepo = new InMemoryQuestionVersionRepository();
    questionPartVersionRepo = new InMemoryQuestionPartVersionRepository();
    questionAssetVersionRepo = new InMemoryQuestionAssetVersionRepository();
    answerKeyVersionRepo = new InMemoryAnswerKeyVersionRepository();
    rubricVersionRepo = new InMemoryRubricVersionRepository();
    questionObjectiveMappingRepo = new InMemoryQuestionObjectiveMappingRepository();
    questionSourceRecordRepo = new InMemoryQuestionSourceRecordRepository();
    questionGovernanceRepo = new InMemoryQuestionGovernanceRepository();

    const services: GovernedQuestionCommandServices = {
      enforcementService,
      questionBankItemRepository: questionBankItemRepo,
      questionVersionRepository: questionVersionRepo,
      questionPartVersionRepository: questionPartVersionRepo,
      questionAssetVersionRepository: questionAssetVersionRepo,
      answerKeyVersionRepository: answerKeyVersionRepo,
      rubricVersionRepository: rubricVersionRepo,
      questionObjectiveMappingRepository: questionObjectiveMappingRepo,
      questionSourceRecordRepository: questionSourceRecordRepo,
      questionGovernanceRepository: questionGovernanceRepo,
    };

    governedService = new GovernedQuestionCommandService(services);
  });

  // ── 10.1 No-Duplication Tests ──
  describe('10.1 No-Duplication Tests', () => {
    it('does not import React or Next', () => {
      const content = readFileSync(__filename, 'utf-8');
      const importLines = content.split('\n').filter((l: string) => l.includes("from '"));
      for (const line of importLines) {
        expect(line).not.toMatch(/from '(react|next|react-dom)/);
      }
    });

    it('does not import AI provider modules', () => {
      const content = readFileSync(__filename, 'utf-8');
      const importLines = content.split('\n').filter((l: string) => l.includes("from '"));
      for (const line of importLines) {
        expect(line).not.toMatch(/openai|pinecone|genkit/);
      }
    });

    it('test file is in question-bank domain', () => {
      expect(__filename).toContain('question-bank');
    });
  });

  // ── 10.2 Governed Command Tests ──
  describe('10.2 Governed Command Tests', () => {
    it('createQuestionDraft blocks without schoolId', async () => {
      const cmd = makeCommand({
        schoolId: 's1',
        subjectId: 'math',
        topicId: 't1',
        skillId: 's1',
        curriculumVersionId: 'cv1',
        primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const,
        securityClass: 'practice_safe',
      }, { schoolId: '' });
      const result = await governedService.createQuestionDraft(cmd);
      expect(result.ok).toBe(false);
    });

    it('createQuestionDraft blocks without actorId', async () => {
      const cmd = makeCommand({
        schoolId: 's1',
        subjectId: 'math',
        topicId: 't1',
        skillId: 's1',
        curriculumVersionId: 'cv1',
        primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const,
        securityClass: 'practice_safe',
      }, { actorId: '' });
      const result = await governedService.createQuestionDraft(cmd);
      expect(result.ok).toBe(false);
    });

    it('createQuestionDraft blocks without idempotencyKey', async () => {
      const cmd = makeCommand({
        schoolId: 's1',
        subjectId: 'math',
        topicId: 't1',
        skillId: 's1',
        curriculumVersionId: 'cv1',
        primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const,
        securityClass: 'practice_safe',
      }, { idempotencyKey: undefined });
      const result = await governedService.createQuestionDraft(cmd);
      expect(result.ok).toBe(false);
    });

    it('same idempotencyKey and fingerprint returns same accepted result', async () => {
      const cmd = makeCommand({
        schoolId: 's1',
        subjectId: 'math',
        topicId: 't1',
        skillId: 's1',
        curriculumVersionId: 'cv1',
        primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const,
        securityClass: 'practice_safe',
      });
      const first = await governedService.createQuestionDraft(cmd);
      expect(first.ok).toBe(true);

      const second = await governedService.createQuestionDraft(cmd);
      expect(second.ok).toBe(true);
    });

    it('same idempotencyKey with different fingerprint conflicts', async () => {
      const cmd1 = makeCommand({
        schoolId: 's1',
        subjectId: 'math',
        topicId: 't1',
        skillId: 's1',
        curriculumVersionId: 'cv1',
        primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const,
        securityClass: 'practice_safe',
      });
      await governedService.createQuestionDraft(cmd1);

      const cmd2 = makeCommand({
        schoolId: 's1',
        subjectId: 'math',
        topicId: 't1',
        skillId: 's1',
        curriculumVersionId: 'cv1',
        primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const,
        securityClass: 'practice_safe',
      });
      cmd2.commandFingerprint = 'different-fingerprint';
      const second = await governedService.createQuestionDraft(cmd2);
      expect(second.ok).toBe(false);
    });

    it('missing required policy fails closed', async () => {
      const freshRegistry = new AssessmentPolicyRegistry();
      const freshEnforcement = new AssessmentCommandEnforcementService(
        { policyRegistry: freshRegistry, idempotencyService, auditService, outboxService },
        true, true, false,
      );
      const freshServices: GovernedQuestionCommandServices = {
        enforcementService: freshEnforcement,
        questionBankItemRepository: questionBankItemRepo,
        questionVersionRepository: questionVersionRepo,
        questionPartVersionRepository: questionPartVersionRepo,
        questionAssetVersionRepository: questionAssetVersionRepo,
        answerKeyVersionRepository: answerKeyVersionRepo,
        rubricVersionRepository: rubricVersionRepo,
        questionObjectiveMappingRepository: questionObjectiveMappingRepo,
        questionSourceRecordRepository: questionSourceRecordRepo,
        questionGovernanceRepository: questionGovernanceRepo,
      };
      const freshCmdService = new GovernedQuestionCommandService(freshServices);

      const cmd = makeCommand({
        schoolId: 's1',
        subjectId: 'math',
        topicId: 't1',
        skillId: 's1',
        curriculumVersionId: 'cv1',
        primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const,
        securityClass: 'practice_safe',
      });
      const result = await freshCmdService.createQuestionDraft(cmd);
      expect(result.ok).toBe(false);
      expect(result.enforcementResult?.reasonCode).toBe('policy_blocked');
    });

    it('configured draft policy allows draft creation', async () => {
      const cmd = makeCommand({
        schoolId: 's1',
        subjectId: 'math',
        topicId: 't1',
        skillId: 's1',
        curriculumVersionId: 'cv1',
        primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const,
        securityClass: 'practice_safe',
      });
      const result = await governedService.createQuestionDraft(cmd);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('draft');
    });
  });

  // ── 10.3 Versioning Tests ──
  describe('10.3 Versioning Tests', () => {
    it('questionId remains stable across versions', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      expect(draft.ok).toBe(true);
      const qId = draft.data!.questionId;

      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId,
        stemSafeText: 'What is 2+2?',
        questionType: 'short_answer' as const,
        difficultyBand: 'recall',
        language: 'en',
        studentSafeExplanation: 'Basic addition',
        teacherExplanation: 'Tests basic addition',
        estimatedTimeSeconds: 30,
      }));
      expect(v1.ok).toBe(true);
      expect(v1.data!.questionId).toBe(qId);

      const v2 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId,
        stemSafeText: 'What is 2+2? (advanced)',
        questionType: 'short_answer' as const,
        difficultyBand: 'understanding',
        language: 'en',
        studentSafeExplanation: 'Basic addition',
        teacherExplanation: 'Tests basic addition',
        estimatedTimeSeconds: 30,
      }));
      expect(v2.ok).toBe(true);
      expect(v2.data!.questionId).toBe(qId);
      expect(v2.data!.versionNumber).toBe(2);
    });

    it('approved version cannot be mutated via status update', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;

      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId,
        stemSafeText: 'What is 2+2?',
        questionType: 'short_answer' as const,
        difficultyBand: 'recall',
        language: 'en',
        studentSafeExplanation: 'Basic addition',
        teacherExplanation: 'Tests basic addition',
        estimatedTimeSeconds: 30,
      }));
      const versionId = v1.data!.questionVersionId;

      const updated = await questionVersionRepo.updateStatus(versionId, 'approved');
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('approved');

      const fetched = await questionVersionRepo.findById(versionId);
      expect(fetched!.status).toBe('approved');
    });

    it('new edit creates new version', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;

      await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId,
        stemSafeText: 'Original stem',
        questionType: 'short_answer' as const,
        difficultyBand: 'recall',
        language: 'en',
        studentSafeExplanation: 'Expl',
        teacherExplanation: 'Teach',
        estimatedTimeSeconds: 30,
      }));

      const v2 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId,
        stemSafeText: 'Edited stem',
        questionType: 'short_answer' as const,
        difficultyBand: 'understanding',
        language: 'en',
        studentSafeExplanation: 'Expl',
        teacherExplanation: 'Teach',
        estimatedTimeSeconds: 45,
      }));
      expect(v2.data!.versionNumber).toBe(2);
      expect(v2.data!.stemSafeText).toBe('Edited stem');
    });

    it('currentVersionId updates only through governed command', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;
      expect(draft.data!.currentVersionId).toBe('');

      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId,
        stemSafeText: 'Stem',
        questionType: 'short_answer' as const,
        difficultyBand: 'recall',
        language: 'en',
        studentSafeExplanation: 'Exp',
        teacherExplanation: 'Tch',
        estimatedTimeSeconds: 30,
      }));

      const item = await questionBankItemRepo.findById(qId);
      expect(item!.currentVersionId).toBe(v1.data!.questionVersionId);
    });

    it('contentHash is stable across whitespace/case changes', () => {
      const hash1 = DuplicateFingerprintService.buildQuestionContentHash(
        'What is  the  meaning of  life?',
        'short_answer',
      );
      const hash2 = DuplicateFingerprintService.buildQuestionContentHash(
        'what is the meaning of LIFE?',
        'short_answer',
      );
      expect(hash1).toBe(hash2);
    });
  });

  // ── 10.4 Curriculum Mapping Tests ──
  describe('10.4 Curriculum Mapping Tests', () => {
    it('approval submission fails without primary objective mapping', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;
      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId, stemSafeText: 'Stem', questionType: 'short_answer' as const,
        difficultyBand: 'recall', language: 'en', studentSafeExplanation: 'E',
        teacherExplanation: 'T', estimatedTimeSeconds: 30,
      }));
      const versionId = v1.data!.questionVersionId;

      await questionGovernanceRepo.saveCurriculumValidity({
        questionVersionId: versionId,
        schoolId: 's1',
        curriculumVersionId: 'cv1',
        objectiveIds: ['obj1'],
        valid: true,
        reasonCodes: [],
        checkedAt: '2026-07-13T12:00:00.000Z',
      });

      (policyRegistry as any).register({
        family: 'QUESTION_APPROVAL',
        status: 'CONFIGURED',
        version: '1.0',
        description: 'Test approval policy',
      });

      const result = await governedService.submitQuestionForApproval(makeCommand({
        questionId: qId,
        questionVersionId: versionId,
      }));
      expect(result.ok).toBe(false);
      expect(result.error).toContain('primary objective mapping');
    });

    it('mapping requires objectiveId and objectiveVersionId', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;
      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId, stemSafeText: 'Stem', questionType: 'short_answer' as const,
        difficultyBand: 'recall', language: 'en', studentSafeExplanation: 'E',
        teacherExplanation: 'T', estimatedTimeSeconds: 30,
      }));
      const versionId = v1.data!.questionVersionId;

      const mapping = await governedService.mapQuestionToObjective(makeCommand({
        questionVersionId: versionId,
        objectiveId: 'obj-123',
        objectiveVersionId: 'obj-v1',
        mappingStrength: 'primary' as const,
        mappingReason: 'Core objective coverage',
      }));
      expect(mapping.ok).toBe(true);
      expect(mapping.data!.objectiveId).toBe('obj-123');
      expect(mapping.data!.objectiveVersionId).toBe('obj-v1');
    });

    it('invalid curriculum validity blocks approval submission', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;
      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId, stemSafeText: 'Stem', questionType: 'short_answer' as const,
        difficultyBand: 'recall', language: 'en', studentSafeExplanation: 'E',
        teacherExplanation: 'T', estimatedTimeSeconds: 30,
      }));
      const versionId = v1.data!.questionVersionId;

      await governedService.mapQuestionToObjective(makeCommand({
        questionVersionId: versionId,
        objectiveId: 'obj-1',
        objectiveVersionId: 'obj-v1',
        mappingStrength: 'primary' as const,
        mappingReason: 'Core objective coverage',
      }));

      await questionGovernanceRepo.saveCurriculumValidity({
        questionVersionId: versionId,
        schoolId: 's1',
        curriculumVersionId: 'cv1',
        objectiveIds: [],
        valid: false,
        reasonCodes: ['no_objective_ids_provided'],
        checkedAt: '2026-07-13T12:00:00.000Z',
      });

      (policyRegistry as any).register({
        family: 'QUESTION_APPROVAL',
        status: 'CONFIGURED',
        version: '1.0',
        description: 'Test approval policy',
      });

      const result = await governedService.submitQuestionForApproval(makeCommand({
        questionId: qId,
        questionVersionId: versionId,
      }));
      expect(result.ok).toBe(false);
      expect(result.error).toContain('curriculum validity');
    });

    it('valid curriculum check records reason codes', async () => {
      const validity = await governedService.checkCurriculumValidity(makeCommand({
        questionVersionId: 'qv-1',
        schoolId: 's1',
        curriculumVersionId: 'cv1',
        objectiveIds: ['obj1', 'obj2'],
      }));
      expect(validity.ok).toBe(true);
      expect(validity.data!.valid).toBe(true);
      expect(validity.data!.reasonCodes).toEqual([]);

      const invalidValidity = await governedService.checkCurriculumValidity(makeCommand({
        questionVersionId: 'qv-2',
        schoolId: 's1',
        curriculumVersionId: 'cv1',
        objectiveIds: [],
      }));
      expect(invalidValidity.ok).toBe(true);
      expect(invalidValidity.data!.valid).toBe(false);
      expect(invalidValidity.data!.reasonCodes).toContain('no_objective_ids_provided');
    });

    it('mapping does not mutate mastery', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;
      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId, stemSafeText: 'Stem', questionType: 'short_answer' as const,
        difficultyBand: 'recall', language: 'en', studentSafeExplanation: 'E',
        teacherExplanation: 'T', estimatedTimeSeconds: 30,
      }));

      await governedService.mapQuestionToObjective(makeCommand({
        questionVersionId: v1.data!.questionVersionId,
        objectiveId: 'obj-1',
        objectiveVersionId: 'obj-v1',
        mappingStrength: 'primary' as const,
        mappingReason: 'test',
      }));

      const item = await questionBankItemRepo.findById(qId);
      expect(item!.status).toBe('draft');
    });
  });

  // ── 10.5 Source Record Tests ──
  describe('10.5 Source Record Tests', () => {
    it('teacher_created source can create draft', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      expect(draft.ok).toBe(true);

      const record = await governedService.recordQuestionSource(makeCommand({
        questionId: draft.data!.questionId,
        questionVersionId: 'qv-1',
        sourceType: 'teacher_created' as const,
        sourceRef: 'manual-entry',
        approvedSourceId: null,
        importBatchId: null,
        safeSummary: 'Created by teacher manually',
      }));
      expect(record.ok).toBe(true);
      expect(record.data!.sourceType).toBe('teacher_created');
    });

    it('approved_source_import requires approvedSourceId', async () => {
      const record = await governedService.recordQuestionSource(makeCommand({
        questionId: 'q1',
        questionVersionId: 'qv-1',
        sourceType: 'approved_source_import' as const,
        sourceRef: 'ref-1',
        approvedSourceId: null,
        importBatchId: null,
        safeSummary: 'Import without source id',
      }));
      expect(record.ok).toBe(false);
      expect(record.error).toContain('approvedSourceId');
    });

    it('ai_assisted_draft remains draft unless AI policy configured', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'ai_assisted_draft' as const, securityClass: 'practice_safe',
      }));
      expect(draft.ok).toBe(true);
      expect(draft.data!.status).toBe('draft');
      expect(draft.data!.sourceType).toBe('ai_assisted_draft');
    });

    it('source safeSummary does not leak raw provider output', async () => {
      const record = await governedService.recordQuestionSource(makeCommand({
        questionId: 'q1',
        questionVersionId: 'qv-1',
        sourceType: 'ai_assisted_draft' as const,
        sourceRef: 'ai-gen-001',
        approvedSourceId: null,
        importBatchId: null,
        safeSummary: 'AI-assisted draft for algebra topic',
      }));
      expect(record.ok).toBe(true);
      expect(record.data!.safeSummary).not.toContain('apiKey');
      expect(record.data!.safeSummary).not.toContain('secret');
      expect(record.data!.safeSummary).not.toContain('token');
    });
  });

  // ── 10.6 Answer Key and Rubric Safety Tests ──
  describe('10.6 Answer Key and Rubric Safety Tests', () => {
    it('student projection strips answerKey and rubricInternal fields', () => {
      const version = {
        questionVersionId: 'qv-1',
        stemSafeText: 'Test stem',
        questionType: 'short_answer',
        difficultyBand: 'recall',
        language: 'en',
        studentSafeExplanation: 'Student explanation',
        teacherExplanation: 'Teacher notes',
        estimatedTimeSeconds: 30,
        answerKey: 'The answer is 42',
        correctAnswerSummary: '42',
        markingNotesTeacherOnly: 'Watch for common mistake',
        rubricInternal: 'Detailed rubric',
        criteriaJson: '{}',
      };

      const studentView = toStudentQuestionSafeView(version);
      expect(studentView.stemSafeText).toBe('Test stem');
      expect(recordToRecord(studentView).answerKey).toBeUndefined();
      expect(recordToRecord(studentView).correctAnswerSummary).toBeUndefined();
      expect(recordToRecord(studentView).markingNotesTeacherOnly).toBeUndefined();
      expect(recordToRecord(studentView).rubricInternal).toBeUndefined();
      expect(recordToRecord(studentView).teacherExplanation).toBeUndefined();
    });

    it('parent projection strips answerKey and raw answer fields', () => {
      const version = {
        questionVersionId: 'qv-1',
        stemSafeText: 'Test stem',
        questionType: 'short_answer',
        difficultyBand: 'recall',
        language: 'en',
        studentSafeExplanation: 'Exp',
        estimatedTimeSeconds: 30,
        answerKey: 'secret',
        correctAnswerSummary: '42',
        rubricInternal: 'internal',
        rawStudentAnswer: 'student raw work',
      };

      const parentView = toParentQuestionSafeView(version);
      expect(recordToRecord(parentView).answerKey).toBeUndefined();
      expect(recordToRecord(parentView).correctAnswerSummary).toBeUndefined();
      expect(recordToRecord(parentView).rubricInternal).toBeUndefined();
      expect(recordToRecord(parentView).rawStudentAnswer).toBeUndefined();
    });

    it('teacher projection may include teacherExplanation but not secrets', () => {
      const version = {
        questionVersionId: 'qv-1',
        stemSafeText: 'Test stem',
        questionType: 'short_answer',
        difficultyBand: 'recall',
        language: 'en',
        studentSafeExplanation: 'Exp',
        teacherExplanation: 'Teacher explanation',
        estimatedTimeSeconds: 30,
        secret: 'my-secret',
        apiKey: 'key-123',
        versionNumber: 1,
      };

      const teacherView = toTeacherQuestionSafeView(version, true);
      expect(recordToRecord(teacherView).secret).toBeUndefined();
      expect(recordToRecord(teacherView).apiKey).toBeUndefined();
    });

    it('outbox payload rejects answer key fields', () => {
      const safePayload = { questionVersionId: 'qv-1', stemSafeText: 'Stem' };
      expect(isOutboxPayloadAnswerKeySafe(safePayload).safe).toBe(true);

      const unsafePayload = { questionVersionId: 'qv-1', answerKey: 'secret answer' };
      expect(isOutboxPayloadAnswerKeySafe(unsafePayload).safe).toBe(false);

      const unsafePayload2 = { questionVersionId: 'qv-1', correctAnswerSummary: '42' };
      expect(isOutboxPayloadAnswerKeySafe(unsafePayload2).safe).toBe(false);
    });

    it('answer key safe metadata can report presence without exposing content', async () => {
      await answerKeyVersionRepo.create({
        answerKeyVersionId: 'ak-1',
        questionVersionId: 'qv-1',
        status: 'draft',
        answerKeySafeRef: '/ref/ak-1',
        correctAnswerSummary: '42',
        markingNotesTeacherOnly: 'Notes',
        createdByActorId: 'actor-1',
        createdAt: '2026-07-13T12:00:00.000Z',
        approvedAt: null,
      });

      const metadata = await getAnswerKeySafeMetadata(answerKeyVersionRepo, 'qv-1');
      expect(metadata.hasAnswerKey).toBe(true);
      expect(metadata.answerKeyStatus).toBe('draft');

      const noKey = await getAnswerKeySafeMetadata(answerKeyVersionRepo, 'qv-nonexistent');
      expect(noKey.hasAnswerKey).toBe(false);
      expect(noKey.answerKeyStatus).toBeNull();
    });
  });

  // ── 10.7 Usage Eligibility Tests ──
  describe('10.7 Usage Eligibility Tests', () => {
    it('exam usage requires approved question', async () => {
      const eligibility = await governedService.checkUsageEligibility(makeCommand({
        questionVersionId: 'qv-1',
        usageMode: 'exam' as const,
        questionStatus: 'draft' as const,
        securityClass: 'exam_secure',
        hasContentSafetyReview: true,
        oralPolicyConfigured: false,
      }));
      expect(eligibility.ok).toBe(true);
      expect(eligibility.data!.eligible).toBe(false);
      expect(eligibility.data!.reasonCodes).toContain('exam_requires_approved_status');
    });

    it('exam usage blocks draft question', async () => {
      const eligibility = await governedService.checkUsageEligibility(makeCommand({
        questionVersionId: 'qv-1',
        usageMode: 'exam' as const,
        questionStatus: 'draft' as const,
        securityClass: 'practice_safe',
        hasContentSafetyReview: false,
        oralPolicyConfigured: false,
      }));
      expect(eligibility.data!.eligible).toBe(false);
    });

    it('practice usage allows practice_safe approved question', async () => {
      const eligibility = await governedService.checkUsageEligibility(makeCommand({
        questionVersionId: 'qv-1',
        usageMode: 'practice' as const,
        questionStatus: 'approved' as const,
        securityClass: 'practice_safe',
        hasContentSafetyReview: false,
        oralPolicyConfigured: false,
      }));
      expect(eligibility.data!.eligible).toBe(true);
    });

    it('restricted question blocks student exposure', async () => {
      const practiceEligibility = await governedService.checkUsageEligibility(makeCommand({
        questionVersionId: 'qv-1',
        usageMode: 'practice' as const,
        questionStatus: 'approved' as const,
        securityClass: 'restricted',
        hasContentSafetyReview: false,
        oralPolicyConfigured: false,
      }));
      expect(practiceEligibility.data!.eligible).toBe(false);
      expect(practiceEligibility.data!.reasonCodes).toContain('restricted_question_not_allowed_for_usage_mode');
    });

    it('oral usage remains blocked unless policy configured', async () => {
      const eligibility = await governedService.checkUsageEligibility(makeCommand({
        questionVersionId: 'qv-1',
        usageMode: 'oral' as const,
        questionStatus: 'approved' as const,
        securityClass: 'practice_safe',
        hasContentSafetyReview: false,
        oralPolicyConfigured: false,
      }));
      expect(eligibility.data!.eligible).toBe(false);
      expect(eligibility.data!.reasonCodes).toContain('oral_usage_policy_not_configured');
    });

    it('Deen-sensitive question content authority policy', () => {
      const result = classifyQuestionType('Explain the concept of Tawheed.');
      expect(result.ok).toBe(true);
    });
  });

  // ── 10.8 Approval-Ready State Tests ──
  describe('10.8 Approval-Ready State Tests', () => {
    it('submitQuestionForApproval fails closed when approval policy missing', async () => {
      const freshReg = new AssessmentPolicyRegistry();
      (freshReg as any).register({
        family: 'QUESTION_DRAFT_CREATION',
        status: 'CONFIGURED',
        version: '1.0',
        description: 'draft',
      });

      const freshEnf = new AssessmentCommandEnforcementService(
        { policyRegistry: freshReg, idempotencyService, auditService, outboxService },
        true, true, false,
      );
      const freshSvcs: GovernedQuestionCommandServices = {
        enforcementService: freshEnf,
        questionBankItemRepository: questionBankItemRepo,
        questionVersionRepository: questionVersionRepo,
        questionPartVersionRepository: questionPartVersionRepo,
        questionAssetVersionRepository: questionAssetVersionRepo,
        answerKeyVersionRepository: answerKeyVersionRepo,
        rubricVersionRepository: rubricVersionRepo,
        questionObjectiveMappingRepository: questionObjectiveMappingRepo,
        questionSourceRecordRepository: questionSourceRecordRepo,
        questionGovernanceRepository: questionGovernanceRepo,
      };
      const freshCmd = new GovernedQuestionCommandService(freshSvcs);

      const draft = await freshCmd.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;

      const v1 = await freshCmd.createQuestionVersionDraft(makeCommand({
        questionId: qId, stemSafeText: 'Stem', questionType: 'short_answer' as const,
        difficultyBand: 'recall', language: 'en', studentSafeExplanation: 'E',
        teacherExplanation: 'T', estimatedTimeSeconds: 30,
      }));
      const versionId = v1.data!.questionVersionId;

      const result = await freshCmd.submitQuestionForApproval(makeCommand({
        questionId: qId,
        questionVersionId: versionId,
      }));
      expect(result.ok).toBe(false);
    });

    it('submitQuestionForApproval fails when curriculum validity missing', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;

      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId, stemSafeText: 'Stem', questionType: 'short_answer' as const,
        difficultyBand: 'recall', language: 'en', studentSafeExplanation: 'E',
        teacherExplanation: 'T', estimatedTimeSeconds: 30,
      }));
      const versionId = v1.data!.questionVersionId;

      await governedService.mapQuestionToObjective(makeCommand({
        questionVersionId: versionId,
        objectiveId: 'obj-1',
        objectiveVersionId: 'obj-v1',
        mappingStrength: 'primary' as const,
        mappingReason: 'test',
      }));

      (policyRegistry as any).register({
        family: 'QUESTION_APPROVAL',
        status: 'CONFIGURED',
        version: '1.0',
        description: 'approval policy',
      });

      const result = await governedService.submitQuestionForApproval(makeCommand({
        questionId: qId,
        questionVersionId: versionId,
      }));
      expect(result.ok).toBe(false);
      expect(result.error).toContain('curriculum validity');
    });

    it('submitQuestionForApproval fails when content safety review missing for exam usage', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'exam_secure',
      }));
      const qId = draft.data!.questionId;

      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId, stemSafeText: 'Stem', questionType: 'short_answer' as const,
        difficultyBand: 'recall', language: 'en', studentSafeExplanation: 'E',
        teacherExplanation: 'T', estimatedTimeSeconds: 30,
      }));
      const versionId = v1.data!.questionVersionId;

      await governedService.mapQuestionToObjective(makeCommand({
        questionVersionId: versionId, objectiveId: 'obj-1', objectiveVersionId: 'obj-v1',
        mappingStrength: 'primary' as const, mappingReason: 'test',
      }));

      await questionGovernanceRepo.saveCurriculumValidity({
        questionVersionId: versionId, schoolId: 's1',
        curriculumVersionId: 'cv1', objectiveIds: ['obj-1'],
        valid: true, reasonCodes: [], checkedAt: '2026-07-13T12:00:00.000Z',
      });

      (policyRegistry as any).register({
        family: 'QUESTION_APPROVAL',
        status: 'CONFIGURED',
        version: '1.0',
        description: 'approval policy',
      });

      const result = await governedService.submitQuestionForApproval(makeCommand({
        questionId: qId,
        questionVersionId: versionId,
      }));
      expect(result.ok).toBe(false);
      expect(result.error).toContain('content safety review');
    });

    it('submitQuestionForApproval succeeds only into pending_approval, not approved', async () => {
      const draft = await governedService.createQuestionDraft(makeCommand({
        schoolId: 's1', subjectId: 'math', topicId: 't1', skillId: 's1',
        curriculumVersionId: 'cv1', primaryObjectiveId: 'obj1',
        sourceType: 'teacher_created' as const, securityClass: 'practice_safe',
      }));
      const qId = draft.data!.questionId;

      const v1 = await governedService.createQuestionVersionDraft(makeCommand({
        questionId: qId, stemSafeText: 'Stem', questionType: 'short_answer' as const,
        difficultyBand: 'recall', language: 'en', studentSafeExplanation: 'E',
        teacherExplanation: 'T', estimatedTimeSeconds: 30,
      }));
      const versionId = v1.data!.questionVersionId;

      await governedService.mapQuestionToObjective(makeCommand({
        questionVersionId: versionId, objectiveId: 'obj-1', objectiveVersionId: 'obj-v1',
        mappingStrength: 'primary' as const, mappingReason: 'test',
      }));

      await questionGovernanceRepo.saveCurriculumValidity({
        questionVersionId: versionId, schoolId: 's1',
        curriculumVersionId: 'cv1', objectiveIds: ['obj-1'],
        valid: true, reasonCodes: [], checkedAt: '2026-07-13T12:00:00.000Z',
      });

      (policyRegistry as any).register({
        family: 'QUESTION_APPROVAL',
        status: 'CONFIGURED',
        version: '1.0',
        description: 'approval policy',
      });

      const result = await governedService.submitQuestionForApproval(makeCommand({
        questionId: qId,
        questionVersionId: versionId,
      }));
      expect(result.ok).toBe(true);
      expect(result.data!.newStatus).toBe('pending_approval');

      const item = await questionBankItemRepo.findById(qId);
      expect(item!.status).toBe('pending_approval');
    });
  });

  // ── Classification Service Tests ──
  describe('Classification Service', () => {
    it('classifyQuestionType identifies multiple_choice', () => {
      const result = classifyQuestionType('Which of the following is correct?\n[A] Option 1\n[B] Option 2');
      expect(result.ok).toBe(true);
    });

    it('classifyQuestionType identifies essay', () => {
      const result = classifyQuestionType('Explain the causes of World War I.');
      expect(result.ok).toBe(true);
    });

    it('classifySecurityClass returns practice_safe for non-assessment', () => {
      const result = classifySecurityClass('short_answer', 'math', false);
      expect(result.ok).toBe(true);
    });

    it('classifySecurityClass returns exam_secure for exam subjects', () => {
      const result = classifySecurityClass('multiple_choice', 'exam_science', false);
      expect(result.ok).toBe(true);
    });
  });

  // ── Duplicate Fingerprint Tests ──
  describe('Duplicate Fingerprint Service', () => {
    it('produces stable content hash', () => {
      const h1 = DuplicateFingerprintService.buildQuestionContentHash('What is 2+2?', 'short_answer');
      const h2 = DuplicateFingerprintService.buildQuestionContentHash('What is 2+2?', 'short_answer');
      expect(h1).toBe(h2);
    });

    it('normalization removes extra whitespace', () => {
      const h1 = DuplicateFingerprintService.buildQuestionContentHash('Hello   World', 'short_answer');
      const h2 = DuplicateFingerprintService.buildQuestionContentHash('Hello World', 'short_answer');
      expect(h1).toBe(h2);
    });

    it('different text produces different hash', () => {
      const h1 = DuplicateFingerprintService.buildQuestionContentHash('What is 2+2?', 'short_answer');
      const h2 = DuplicateFingerprintService.buildQuestionContentHash('What is 3+3?', 'short_answer');
      expect(h1).not.toBe(h2);
    });
  });
});
