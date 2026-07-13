import type { AssessmentCommandEnforcementService, AssessmentEnforcementResult } from '../../assessmentCommandEnforcementService';
import type { AssessmentGovernedCommand } from '../../contracts/assessmentCommandContext';
import type { AssessmentPolicyFamily } from '../../contracts/assessmentPolicyContracts';
import type {
  QuestionBankItem,
  QuestionBankItemStatus,
  QuestionSourceType,
} from '../contracts/questionBankItemContracts';
import type {
  QuestionVersion,
  QuestionPartVersion,
  QuestionAssetVersion,
  QuestionType,
  StudentInputMode,
  QuestionAssetType,
} from '../contracts/questionVersionContracts';
import type { AnswerKeyVersion, RubricVersion, AnswerKeyStatus, RubricStatus } from '../contracts/answerKeyAndRubricContracts';
import type { QuestionObjectiveMapping, MappingStrength } from '../contracts/questionObjectiveMappingContracts';
import type { QuestionSourceRecord, QuestionSourceRecordType } from '../contracts/questionSourceRecordContracts';
import type { QuestionCurriculumValidity, QuestionUsageEligibility, ContentSafetyReview, UsageMode } from '../contracts/questionGovernanceContracts';
import type {
  QuestionBankItemRepository,
  QuestionVersionRepository,
  QuestionPartVersionRepository,
  QuestionAssetVersionRepository,
  AnswerKeyVersionRepository,
  RubricVersionRepository,
  QuestionObjectiveMappingRepository,
  QuestionSourceRecordRepository,
  QuestionGovernanceRepository,
} from '../contracts/questionBankRepositoryContracts';
import { DuplicateFingerprintService } from './duplicateFingerprintService';

export interface GovernedQuestionCommandServices {
  enforcementService: AssessmentCommandEnforcementService;
  questionBankItemRepository: QuestionBankItemRepository;
  questionVersionRepository: QuestionVersionRepository;
  questionPartVersionRepository: QuestionPartVersionRepository;
  questionAssetVersionRepository: QuestionAssetVersionRepository;
  answerKeyVersionRepository: AnswerKeyVersionRepository;
  rubricVersionRepository: RubricVersionRepository;
  questionObjectiveMappingRepository: QuestionObjectiveMappingRepository;
  questionSourceRecordRepository: QuestionSourceRecordRepository;
  questionGovernanceRepository: QuestionGovernanceRepository;
}

export interface CommandResult<T = unknown> {
  ok: boolean;
  data?: T;
  enforcementResult?: AssessmentEnforcementResult;
  error?: string;
}

export class GovernedQuestionCommandService {
  constructor(private services: GovernedQuestionCommandServices) {}

  async createQuestionDraft(
    command: AssessmentGovernedCommand<{
      schoolId: string;
      subjectId: string;
      topicId: string;
      skillId: string;
      curriculumVersionId: string;
      primaryObjectiveId: string;
      sourceType: QuestionSourceType;
      securityClass: string;
    }>,
  ): Promise<CommandResult<QuestionBankItem>> {
    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });

    if (!enforcement.ok) {
      return { ok: false, enforcementResult: enforcement, error: enforcement.safeMessage };
    }

    const body = command.body;
    const now = command.context.now;
    const item: QuestionBankItem = {
      questionId: crypto.randomUUID(),
      schoolId: body.schoolId,
      status: 'draft',
      subjectId: body.subjectId,
      topicId: body.topicId,
      skillId: body.skillId,
      curriculumVersionId: body.curriculumVersionId,
      primaryObjectiveId: body.primaryObjectiveId,
      currentVersionId: '',
      createdByActorId: command.context.actorId,
      createdByRole: command.context.actorRole,
      sourceType: body.sourceType,
      securityClass: body.securityClass as QuestionBankItem['securityClass'],
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    const created = await this.services.questionBankItemRepository.create(item);
    return { ok: true, data: created, enforcementResult: enforcement };
  }

  async createQuestionVersionDraft(
    command: AssessmentGovernedCommand<{
      questionId: string;
      stemSafeText: string;
      questionType: QuestionType;
      difficultyBand: string;
      language: string;
      studentSafeExplanation: string;
      teacherExplanation: string;
      estimatedTimeSeconds: number;
    }>,
  ): Promise<CommandResult<QuestionVersion>> {
    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
      requireVersion: true,
    });

    if (!enforcement.ok) {
      return { ok: false, enforcementResult: enforcement, error: enforcement.safeMessage };
    }

    const existingVersions = await this.services.questionVersionRepository.findByQuestionId(command.body.questionId);
    const versionNumber = existingVersions.length > 0
      ? Math.max(...existingVersions.map(v => v.versionNumber)) + 1
      : 1;

    const contentHash = DuplicateFingerprintService.buildQuestionContentHash(
      command.body.stemSafeText,
      command.body.questionType,
    );

    const version: QuestionVersion = {
      questionVersionId: crypto.randomUUID(),
      questionId: command.body.questionId,
      versionNumber,
      status: 'draft',
      stemSafeText: command.body.stemSafeText,
      questionType: command.body.questionType,
      difficultyBand: command.body.difficultyBand as QuestionVersion['difficultyBand'],
      language: command.body.language,
      studentSafeExplanation: command.body.studentSafeExplanation,
      teacherExplanation: command.body.teacherExplanation,
      estimatedTimeSeconds: command.body.estimatedTimeSeconds,
      createdByActorId: command.context.actorId,
      createdAt: command.context.now,
      approvedAt: null,
      supersededAt: null,
      contentHash,
    };

    const created = await this.services.questionVersionRepository.create(version);

    await this.services.questionBankItemRepository.updateCurrentVersion(
      command.body.questionId,
      created.questionVersionId,
      command.context.now,
    );

    return { ok: true, data: created, enforcementResult: enforcement };
  }

  async attachQuestionPartDraft(
    command: AssessmentGovernedCommand<{
      questionVersionId: string;
      partKey: string;
      partOrder: number;
      promptSafeText: string;
      marksAvailable: number;
      expectedWorkingVisibility: boolean;
      studentInputMode: StudentInputMode;
    }>,
  ): Promise<CommandResult<QuestionPartVersion>> {
    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });

    if (!enforcement.ok) {
      return { ok: false, enforcementResult: enforcement, error: enforcement.safeMessage };
    }

    const part: QuestionPartVersion = {
      questionPartVersionId: crypto.randomUUID(),
      questionVersionId: command.body.questionVersionId,
      partKey: command.body.partKey,
      partOrder: command.body.partOrder,
      promptSafeText: command.body.promptSafeText,
      marksAvailable: command.body.marksAvailable,
      expectedWorkingVisibility: command.body.expectedWorkingVisibility,
      studentInputMode: command.body.studentInputMode,
      createdAt: command.context.now,
    };

    const created = await this.services.questionPartVersionRepository.create(part);
    return { ok: true, data: created, enforcementResult: enforcement };
  }

  async attachQuestionAssetDraft(
    command: AssessmentGovernedCommand<{
      questionVersionId: string;
      assetType: QuestionAssetType;
      assetRef: string;
      assetFingerprint: string;
      studentVisible: boolean;
      teacherOnly: boolean;
      altText: string;
    }>,
  ): Promise<CommandResult<QuestionAssetVersion>> {
    if (command.body.studentVisible && command.body.teacherOnly) {
      return { ok: false, error: 'studentVisible and teacherOnly cannot both be true' };
    }

    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });

    if (!enforcement.ok) {
      return { ok: false, enforcementResult: enforcement, error: enforcement.safeMessage };
    }

    const asset: QuestionAssetVersion = {
      assetVersionId: crypto.randomUUID(),
      questionVersionId: command.body.questionVersionId,
      assetType: command.body.assetType,
      assetRef: command.body.assetRef,
      assetFingerprint: command.body.assetFingerprint,
      studentVisible: command.body.studentVisible,
      teacherOnly: command.body.teacherOnly,
      altText: command.body.altText,
      createdAt: command.context.now,
    };

    const created = await this.services.questionAssetVersionRepository.create(asset);
    return { ok: true, data: created, enforcementResult: enforcement };
  }

  async attachAnswerKeyDraft(
    command: AssessmentGovernedCommand<{
      questionVersionId: string;
      answerKeySafeRef: string;
      correctAnswerSummary: string;
      markingNotesTeacherOnly: string;
    }>,
  ): Promise<CommandResult<AnswerKeyVersion>> {
    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });

    if (!enforcement.ok) {
      return { ok: false, enforcementResult: enforcement, error: enforcement.safeMessage };
    }

    const answerKey: AnswerKeyVersion = {
      answerKeyVersionId: crypto.randomUUID(),
      questionVersionId: command.body.questionVersionId,
      status: 'draft',
      answerKeySafeRef: command.body.answerKeySafeRef,
      correctAnswerSummary: command.body.correctAnswerSummary,
      markingNotesTeacherOnly: command.body.markingNotesTeacherOnly,
      createdByActorId: command.context.actorId,
      createdAt: command.context.now,
      approvedAt: null,
    };

    const created = await this.services.answerKeyVersionRepository.create(answerKey);
    return { ok: true, data: created, enforcementResult: enforcement };
  }

  async attachRubricDraft(
    command: AssessmentGovernedCommand<{
      questionVersionId: string;
      rubricPublicSummary: string;
      rubricInternal: string;
      marksTotal: number;
      criteriaJson: string;
    }>,
  ): Promise<CommandResult<RubricVersion>> {
    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });

    if (!enforcement.ok) {
      return { ok: false, enforcementResult: enforcement, error: enforcement.safeMessage };
    }

    const rubric: RubricVersion = {
      rubricVersionId: crypto.randomUUID(),
      questionVersionId: command.body.questionVersionId,
      status: 'draft',
      rubricPublicSummary: command.body.rubricPublicSummary,
      rubricInternal: command.body.rubricInternal,
      marksTotal: command.body.marksTotal,
      criteriaJson: command.body.criteriaJson,
      createdByActorId: command.context.actorId,
      createdAt: command.context.now,
      approvedAt: null,
    };

    const created = await this.services.rubricVersionRepository.create(rubric);
    return { ok: true, data: created, enforcementResult: enforcement };
  }

  async mapQuestionToObjective(
    command: AssessmentGovernedCommand<{
      questionVersionId: string;
      objectiveId: string;
      objectiveVersionId: string;
      mappingStrength: MappingStrength;
      mappingReason: string;
    }>,
  ): Promise<CommandResult<QuestionObjectiveMapping>> {
    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });

    if (!enforcement.ok) {
      return { ok: false, enforcementResult: enforcement, error: enforcement.safeMessage };
    }

    const mapping: QuestionObjectiveMapping = {
      mappingId: crypto.randomUUID(),
      questionVersionId: command.body.questionVersionId,
      objectiveId: command.body.objectiveId,
      objectiveVersionId: command.body.objectiveVersionId,
      mappingStrength: command.body.mappingStrength,
      mappingReason: command.body.mappingReason,
      createdAt: command.context.now,
    };

    const created = await this.services.questionObjectiveMappingRepository.create(mapping);
    return { ok: true, data: created, enforcementResult: enforcement };
  }

  async recordQuestionSource(
    command: AssessmentGovernedCommand<{
      questionId: string;
      questionVersionId: string;
      sourceType: QuestionSourceRecordType;
      sourceRef: string;
      approvedSourceId: string | null;
      importBatchId: string | null;
      safeSummary: string;
    }>,
  ): Promise<CommandResult<QuestionSourceRecord>> {
    if (command.body.sourceType === 'approved_source_import' && !command.body.approvedSourceId) {
      return { ok: false, error: 'approved_source_import requires approvedSourceId' };
    }

    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });

    if (!enforcement.ok) {
      return { ok: false, enforcementResult: enforcement, error: enforcement.safeMessage };
    }

    const record: QuestionSourceRecord = {
      sourceRecordId: crypto.randomUUID(),
      questionId: command.body.questionId,
      questionVersionId: command.body.questionVersionId,
      sourceType: command.body.sourceType,
      sourceRef: command.body.sourceRef,
      approvedSourceId: command.body.approvedSourceId,
      importBatchId: command.body.importBatchId,
      createdByActorId: command.context.actorId,
      createdAt: command.context.now,
      safeSummary: command.body.safeSummary,
    };

    const created = await this.services.questionSourceRecordRepository.create(record);
    return { ok: true, data: created, enforcementResult: enforcement };
  }

  async checkCurriculumValidity(
    command: AssessmentGovernedCommand<{
      questionVersionId: string;
      schoolId: string;
      curriculumVersionId: string;
      objectiveIds: string[];
    }>,
  ): Promise<CommandResult<QuestionCurriculumValidity>> {
    const objectiveIds = command.body.objectiveIds;
    const valid = objectiveIds.length > 0;

    const validity: QuestionCurriculumValidity = {
      questionVersionId: command.body.questionVersionId,
      schoolId: command.body.schoolId,
      curriculumVersionId: command.body.curriculumVersionId,
      objectiveIds: objectiveIds,
      valid,
      reasonCodes: valid ? [] : ['no_objective_ids_provided'],
      checkedAt: command.context.now,
    };

    const saved = await this.services.questionGovernanceRepository.saveCurriculumValidity(validity);
    return { ok: true, data: saved };
  }

  async checkUsageEligibility(
    command: AssessmentGovernedCommand<{
      questionVersionId: string;
      usageMode: UsageMode;
      questionStatus: QuestionBankItemStatus;
      securityClass: string;
      hasContentSafetyReview: boolean;
      oralPolicyConfigured: boolean;
    }>,
  ): Promise<CommandResult<QuestionUsageEligibility>> {
    const body = command.body;
    const reasonCodes: string[] = [];

    if (body.usageMode === 'exam') {
      if (body.questionStatus !== 'approved') reasonCodes.push('exam_requires_approved_status');
      if (body.securityClass !== 'exam_secure' && body.securityClass !== 'approved') reasonCodes.push('exam_requires_exam_secure_security_class');
      if (!body.hasContentSafetyReview) reasonCodes.push('exam_requires_content_safety_review');
    }

    if (body.usageMode === 'practice') {
      if (body.questionStatus !== 'approved') reasonCodes.push('practice_requires_approved_status');
      if (body.securityClass !== 'practice_safe' && body.securityClass !== 'quiz_safe') reasonCodes.push('practice_requires_practice_safe_or_quiz_safe');
    }

    if (body.usageMode === 'oral' && !body.oralPolicyConfigured) {
      reasonCodes.push('oral_usage_policy_not_configured');
    }

    if (body.securityClass === 'restricted') {
      if (['practice', 'quiz', 'revision'].includes(body.usageMode)) {
        reasonCodes.push('restricted_question_not_allowed_for_usage_mode');
      }
    }

    const eligibility: QuestionUsageEligibility = {
      questionVersionId: body.questionVersionId,
      usageMode: body.usageMode,
      eligible: reasonCodes.length === 0,
      reasonCodes,
      checkedAt: command.context.now,
    };

    const saved = await this.services.questionGovernanceRepository.saveUsageEligibility(eligibility);
    return { ok: true, data: saved };
  }

  async checkContentSafety(
    command: AssessmentGovernedCommand<{
      questionVersionId: string;
      decision: string;
      reasonCodes: string[];
      safeNotes: string | null;
    }>,
  ): Promise<CommandResult<ContentSafetyReview>> {
    const review: ContentSafetyReview = {
      reviewId: crypto.randomUUID(),
      questionVersionId: command.body.questionVersionId,
      reviewState: 'not_reviewed',
      reviewedByActorId: command.context.actorId,
      reviewedByRole: command.context.actorRole,
      reviewedAt: null,
      decision: command.body.decision,
      reasonCodes: command.body.reasonCodes,
      safeNotes: command.body.safeNotes,
      createdAt: command.context.now,
    };

    const saved = await this.services.questionGovernanceRepository.saveContentSafetyReview(review);
    return { ok: true, data: saved };
  }

  async submitQuestionForApproval(
    command: AssessmentGovernedCommand<{
      questionId: string;
      questionVersionId: string;
    }>,
  ): Promise<CommandResult<{ newStatus: QuestionBankItemStatus }>> {
    const questionVersionId = command.body.questionVersionId;
    const questionId = command.body.questionId;

    const item = await this.services.questionBankItemRepository.findById(questionId);
    if (!item) return { ok: false, error: 'question not found' };

    const primaryMapping = await this.services.questionObjectiveMappingRepository.findPrimaryByQuestionVersionId(questionVersionId);
    if (!primaryMapping) {
      return { ok: false, error: 'approval submission requires at least one primary objective mapping' };
    }

    const curriculumValidity = await this.services.questionGovernanceRepository.findCurriculumValidity(questionVersionId);
    if (!curriculumValidity || !curriculumValidity.valid) {
      return { ok: false, error: 'approval submission requires valid curriculum validity' };
    }

    if (item.securityClass === 'exam_secure') {
      const safetyReview = await this.services.questionGovernanceRepository.findContentSafetyReview(questionVersionId);
      if (!safetyReview) {
        return { ok: false, error: 'exam_secure question requires content safety review before approval submission' };
      }
    }

    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['QUESTION_APPROVAL' as AssessmentPolicyFamily],
    });

    if (!enforcement.ok) {
      return { ok: false, enforcementResult: enforcement, error: `approval policy block: ${enforcement.safeMessage}` };
    }

    const newStatus: QuestionBankItemStatus = 'pending_approval';

    await this.services.questionBankItemRepository.updateStatus(questionId, newStatus, command.context.now);

    return {
      ok: true,
      data: { newStatus },
      enforcementResult: enforcement,
    };
  }
}
