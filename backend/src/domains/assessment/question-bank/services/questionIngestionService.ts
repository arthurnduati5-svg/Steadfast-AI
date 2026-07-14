import { randomUUID } from 'crypto';
import type { AssessmentCommandEnforcementService } from '../../../assessment/assessmentCommandEnforcementService';
import { DuplicateFingerprintService } from './duplicateFingerprintService';
import type { GovernedQuestionCommandServices } from './governedQuestionCommandService';
import { GovernedQuestionCommandService } from './governedQuestionCommandService';
import type { QuestionIngestionBatch, QuestionIngestionCandidate, IngestionBatchStatus, IngestionCandidateStatus, IngestionCandidateType } from '../contracts/questionIngestionContracts';
import type {
  QuestionIngestionBatchRepository,
  QuestionIngestionCandidateRepository,
} from '../contracts/questionIngestionContracts';
import type { AssessmentCommandContext } from '../../../assessment/contracts/assessmentCommandContext';
import type { QuestionBankItem } from '../contracts/questionBankItemContracts';
import type { AssessmentPolicyFamily } from '../../../assessment/contracts/assessmentPolicyContracts';

export class QuestionIngestionService {
  constructor(
    private enforcementService: AssessmentCommandEnforcementService,
    private ingestionBatchRepository: QuestionIngestionBatchRepository,
    private ingestionCandidateRepository: QuestionIngestionCandidateRepository,
    private governedQuestionCommandService: GovernedQuestionCommandService,
  ) {}

  async createIngestionBatch(params: {
    schoolId: string;
    sourceType: string;
    approvedSourceId?: string;
    importBatchRef?: string;
    safeSummary: string;
    context: AssessmentCommandContext;
  }): Promise<QuestionIngestionBatch> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context: params.context,
      commandType: 'question:ingestion:create_batch',
      commandFingerprint: `ingestion:batch:${params.schoolId}:${Date.now()}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    if (params.sourceType === 'approved_source_import' && !params.approvedSourceId) {
      throw new Error('APPROVED_SOURCE_REQUIRED: approved_source_import requires approvedSourceId');
    }

    const batch: QuestionIngestionBatch = {
      ingestionBatchId: randomUUID(),
      schoolId: params.schoolId,
      sourceType: params.sourceType,
      approvedSourceId: params.approvedSourceId ?? null,
      importBatchRef: params.importBatchRef ?? null,
      status: 'draft',
      createdByActorId: params.context.actorId,
      createdByRole: params.context.actorRole,
      candidateCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      warningCount: 0,
      safeSummary: params.safeSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };

    return this.ingestionBatchRepository.create(batch);
  }

  async addManualCandidate(params: {
    ingestionBatchId: string;
    schoolId: string;
    candidateType: IngestionCandidateType;
    stemSafeText: string;
    questionType: string;
    subjectId: string;
    topicId: string;
    skillId: string;
    curriculumVersionId: string;
    primaryObjectiveId: string;
    approvedSourceId?: string;
    sourceRef: string;
    safeMetadataJson?: Record<string, unknown>;
    context: AssessmentCommandContext;
  }): Promise<QuestionIngestionCandidate> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context: params.context,
      commandType: 'question:ingestion:add_candidate',
      commandFingerprint: `ingestion:candidate:${params.schoolId}:${Date.now()}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const contentHash = DuplicateFingerprintService.buildQuestionContentHash(
      params.stemSafeText,
      params.questionType,
    );

    const candidate: QuestionIngestionCandidate = {
      candidateId: randomUUID(),
      ingestionBatchId: params.ingestionBatchId,
      schoolId: params.schoolId,
      status: 'draft',
      candidateType: params.candidateType,
      stemSafeText: params.stemSafeText,
      questionType: params.questionType,
      subjectId: params.subjectId,
      topicId: params.topicId,
      skillId: params.skillId,
      curriculumVersionId: params.curriculumVersionId,
      primaryObjectiveId: params.primaryObjectiveId,
      approvedSourceId: params.approvedSourceId ?? null,
      sourceRef: params.sourceRef,
      contentHash,
      warningsJson: [],
      safeMetadataJson: params.safeMetadataJson ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      acceptedQuestionId: null,
      acceptedQuestionVersionId: null,
      rejectedReasonCode: null,
    };

    const existingDuplicates = await this.ingestionCandidateRepository.findByContentHash(params.schoolId, contentHash);
    if (existingDuplicates.length > 0) {
      candidate.status = 'duplicate_suspected';
    }

    return this.ingestionCandidateRepository.create(candidate);
  }

  async validateCandidate(candidateId: string, context: AssessmentCommandContext): Promise<QuestionIngestionCandidate> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context,
      commandType: 'question:ingestion:validate_candidate',
      commandFingerprint: `ingestion:validate:${candidateId}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const candidate = await this.ingestionCandidateRepository.findById(candidateId);
    if (!candidate) throw new Error('NOT_FOUND: candidate not found');

    const warnings: string[] = [];
    if (!candidate.stemSafeText || candidate.stemSafeText.trim().length < 10) {
      warnings.push('stem_too_short');
    }
    if (!candidate.questionType) {
      warnings.push('missing_question_type');
    }
    if (!candidate.subjectId || !candidate.topicId || !candidate.skillId) {
      warnings.push('missing_curriculum_mapping');
    }

    const newStatus: IngestionCandidateStatus = warnings.length > 0 ? 'needs_correction' : 'ready';

    const updated = await this.ingestionCandidateRepository.updateStatus(candidateId, newStatus);
    if (!updated) throw new Error('FAILED: could not update candidate');
    return updated;
  }

  async acceptCandidateAsQuestionDraft(candidateId: string, context: AssessmentCommandContext): Promise<{ item: QuestionBankItem }> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context,
      commandType: 'question:ingestion:accept_candidate',
      commandFingerprint: `ingestion:accept:${candidateId}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const candidate = await this.ingestionCandidateRepository.findById(candidateId);
    if (!candidate) throw new Error('NOT_FOUND: candidate not found');
    if (candidate.status !== 'ready') throw new Error('INVALID_STATE: candidate must be in ready status');

    const draftContext: AssessmentCommandContext = {
      ...context,
      correlationId: `${context.correlationId}-draft`,
      idempotencyKey: `${context.idempotencyKey}-draft`,
    };

    const versionContext: AssessmentCommandContext = {
      ...context,
      correlationId: `${context.correlationId}-version`,
      idempotencyKey: `${context.idempotencyKey}-version`,
    };

    const itemResult = await this.governedQuestionCommandService.createQuestionDraft({
      context: draftContext,
      commandType: 'question:draft:create',
      commandFingerprint: `draft:${candidate.schoolId}:${Date.now()}`,
      body: {
        schoolId: candidate.schoolId,
        subjectId: candidate.subjectId,
        topicId: candidate.topicId,
        skillId: candidate.skillId,
        curriculumVersionId: candidate.curriculumVersionId,
        primaryObjectiveId: candidate.primaryObjectiveId,
        sourceType: candidate.candidateType === 'approved_source_import' ? 'approved_source_import' : 'teacher_created',
        securityClass: 'practice_safe',
      },
    });

    if (!itemResult.ok || !itemResult.data) throw new Error(`FAILED: ${itemResult.error}`);

    const item = itemResult.data;

    await this.governedQuestionCommandService.createQuestionVersionDraft({
      context: versionContext,
      commandType: 'question:version:create',
      commandFingerprint: `version:${item.questionId}:${Date.now()}`,
      body: {
        questionId: item.questionId,
        stemSafeText: candidate.stemSafeText,
        questionType: candidate.questionType as any,
        difficultyBand: 'recall',
        language: 'English',
        studentSafeExplanation: '',
        teacherExplanation: '',
        estimatedTimeSeconds: 120,
      },
    });

    await this.ingestionCandidateRepository.updateAcceptedRef(
      candidateId,
      item.questionId,
      item.currentVersionId,
    );

    return { item };
  }

  async rejectCandidate(candidateId: string, reasonCode: string, context: AssessmentCommandContext): Promise<QuestionIngestionCandidate> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context,
      commandType: 'question:ingestion:reject_candidate',
      commandFingerprint: `ingestion:reject:${candidateId}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const rejected = await this.ingestionCandidateRepository.rejectCandidate(candidateId, reasonCode);
    if (!rejected) throw new Error('NOT_FOUND: candidate not found');
    return rejected;
  }

  async listBatchCandidates(ingestionBatchId: string): Promise<QuestionIngestionCandidate[]> {
    return this.ingestionCandidateRepository.findByBatchId(ingestionBatchId);
  }
}
