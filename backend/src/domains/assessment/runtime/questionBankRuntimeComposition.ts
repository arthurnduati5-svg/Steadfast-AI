import { PrismaClient } from '@prisma/client';
import { QuestionBankRepositoryMode } from './questionBankRuntimeContracts';
import { questionBankRepositoryModeResolver } from './questionBankRepositoryMode';
import { QUESTION_BANK_PRISMA_CLIENT_UNAVAILABLE, QUESTION_BANK_REPOSITORY_COMPOSITION_FAILED } from './questionBankRuntimeContracts';

import { prisma as canonicalPrisma } from '../../../lib/prisma';

import { InMemoryMarkingRunRepository, InMemoryMarkingResultVersionRepository, InMemoryMarkingBreakdownItemRepository } from '../../assessment/marking/repositories/inMemoryMarkingRepositories';
import { PrismaMarkingRunRepository, PrismaMarkingResultVersionRepository, PrismaMarkingBreakdownItemRepository } from '../../assessment/marking/repositories/prismaMarkingRepositories';
import type { MarkingRunRepository, MarkingResultVersionRepository, MarkingBreakdownItemRepository } from '../../assessment/marking/contracts/markingRepositoryContracts';

import { InMemoryExamPaperAssemblyPersistence } from '../../assessment/exam-paper/services/inMemoryExamPaperAssemblyPersistence';
import type { ExamPaperAssemblyPersistence } from '../../assessment/exam-paper/contracts/examPaperAssemblyPersistenceContracts';
import { PrismaExamPaperAssemblyPersistence } from '../../assessment/exam-paper/services/prismaExamPaperAssemblyPersistence';

import { InMemoryExamPaperRepository, InMemoryExamPaperVersionRepository, InMemoryExamPaperSectionRepository, InMemoryExamPaperQuestionRepository, InMemoryExamVariantRepository, InMemoryExamVariantQuestionRepository, InMemoryExamAccessPolicyRepository, InMemoryExamPaperApprovalRepository, InMemoryExamPaperAssemblyRunRepository, InMemoryExamPaperDeliveryBridgeRepository } from '../../assessment/exam-paper/repositories/inMemoryExamPaperRepositories';
import type { ExamPaperRepository, ExamPaperVersionRepository, ExamPaperSectionRepository, ExamPaperQuestionRepository, ExamVariantRepository, ExamVariantQuestionRepository, ExamAccessPolicyRepository, ExamPaperApprovalRepository, ExamPaperAssemblyRunRepository, ExamPaperDeliveryBridgeRepository } from '../../assessment/exam-paper/contracts/examPaperRepositoryContracts';
import { PrismaExamPaperRepository, PrismaExamPaperVersionRepository, PrismaExamPaperSectionRepository, PrismaExamPaperQuestionRepository, PrismaExamVariantRepository, PrismaExamVariantQuestionRepository, PrismaExamAccessPolicyRepository, PrismaExamPaperApprovalRepository, PrismaExamPaperAssemblyRunRepository, PrismaExamPaperDeliveryBridgeRepository } from '../../assessment/exam-paper/repositories/prismaExamPaperRepositories';

import { InMemoryMarkingInvocationRequestRepository, InMemorySubmittedSnapshotIntakeRepository, InMemoryMarkingBatchRepository, InMemoryMarkingBatchItemRepository, InMemoryMarkingResultLinkRepository } from '../../assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories';
import type { MarkingInvocationRequestRepository, SubmittedSnapshotIntakeRepository, MarkingBatchRepository, MarkingBatchItemRepository, MarkingResultLinkRepository } from '../../assessment/marking-invocation/contracts/markingInvocationRepositoryContracts';

import { InMemoryRecoveryLifecycleClosureRepositories } from '../../assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { PrismaRecoveryLifecycleClosureRepositories } from '../../assessment/recovery-lifecycle-closure/repositories/prismaRecoveryLifecycleClosureRepositories';
import type { IRecoveryLifecycleClosureRepositories } from '../../assessment/recovery-lifecycle-closure/contracts/recoveryLifecycleClosureRepositoryContracts';

import { InMemoryRecoveryExecutionReadinessBoardSnapshotRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardLaneRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardCardRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardBlockerRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardSummaryRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardAuditRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository } from '../../assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import type {
  RecoveryExecutionReadinessBoardSnapshotRepository,
  RecoveryExecutionReadinessBoardLaneRepository,
  RecoveryExecutionReadinessBoardCardRepository,
  RecoveryExecutionReadinessBoardFilterPresetRepository,
  RecoveryExecutionReadinessBoardRiskSignalRepository,
  RecoveryExecutionReadinessBoardBlockerRepository,
  RecoveryExecutionReadinessBoardGovernanceNoteRepository,
  RecoveryExecutionReadinessBoardRoleProjectionRepository,
  RecoveryExecutionReadinessBoardTeacherQueueRepository,
  RecoveryExecutionReadinessBoardAdminQueueRepository,
  RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository,
  RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository,
  RecoveryExecutionReadinessBoardRefreshJobRepository,
  RecoveryExecutionReadinessBoardSummaryRepository,
  RecoveryExecutionReadinessBoardAuditRepository,
  RecoveryExecutionReadinessBoardIdempotencyRepository,
} from '../../assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';

import { PrismaRecoveryExecutionReadinessBoardSnapshotRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardLaneRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardCardRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardFilterPresetRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardRiskSignalRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardBlockerRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardGovernanceNoteRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardRoleProjectionRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardTeacherQueueRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardAdminQueueRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardRefreshJobRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardSummaryRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardAuditRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';
import { PrismaRecoveryExecutionReadinessBoardIdempotencyRepository } from '../../assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories';

import { InMemoryAdjudicationReadinessRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryReviewSessionRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryEvidenceBundleRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryReviewChecklistRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryConflictDeclarationRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryReviewerDecisionRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryPriorityOverrideRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemorySecondReviewRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryConsensusRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryDisagreementDraftRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryQueueDispositionRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryQualitySampleRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryAdjudicationSummaryRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryAdjudicationAuditRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { InMemoryAdjudicationIdempotencyRepository } from '../../assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import type {
  RecoveryCaseAdjudicationReadinessRepository,
  RecoveryCaseReviewSessionRepository,
  RecoveryCaseReviewEvidenceBundleRepository,
  RecoveryCaseReviewChecklistRepository,
  RecoveryCaseConflictOfInterestDeclarationRepository,
  RecoveryCaseReviewerDecisionDraftRepository,
  RecoveryCasePriorityOverrideRequestRepository,
  RecoveryCaseSecondReviewRequestRepository,
  RecoveryCaseReviewerConsensusRepository,
  RecoveryCaseDisagreementResolutionDraftRepository,
  RecoveryCaseQueueDispositionRepository,
  RecoveryCaseQualitySampleRepository,
  RecoveryCaseAdjudicationSummaryRepository,
  RecoveryCaseAdjudicationAuditRepository,
  RecoveryCaseAdjudicationIdempotencyRepository,
} from '../../assessment/recovery-case-adjudication/contracts/recoveryCaseAdjudicationRepositoryContracts';

export interface QuestionBankPackage5Repositories {
  markingRunRepository: MarkingRunRepository;
  markingResultVersionRepository: MarkingResultVersionRepository;
  markingBreakdownItemRepository: MarkingBreakdownItemRepository;
}

export interface QuestionBankPackage6Repositories {
  assemblyPersistence: ExamPaperAssemblyPersistence;
  paperRepository: ExamPaperRepository;
  versionRepository: ExamPaperVersionRepository;
  sectionRepository: ExamPaperSectionRepository;
  questionRepository: ExamPaperQuestionRepository;
  variantRepository: ExamVariantRepository;
  variantQuestionRepository: ExamVariantQuestionRepository;
  accessPolicyRepository: ExamAccessPolicyRepository;
  approvalRepository: ExamPaperApprovalRepository;
  assemblyRunRepository: ExamPaperAssemblyRunRepository;
  deliveryBridgeRepository: ExamPaperDeliveryBridgeRepository;
}

export interface QuestionBankPackage8Repositories {
  markingInvocationRequestRepository: MarkingInvocationRequestRepository;
  submittedSnapshotIntakeRepository: SubmittedSnapshotIntakeRepository;
  markingBatchRepository: MarkingBatchRepository;
  markingBatchItemRepository: MarkingBatchItemRepository;
  markingResultLinkRepository: MarkingResultLinkRepository;
}

export interface QuestionBankPackage22Repositories {
  closureRepositories: IRecoveryLifecycleClosureRepositories;
}

export interface QuestionBankPackage24Repositories {
  snapshotRepository: RecoveryExecutionReadinessBoardSnapshotRepository;
  laneRepository: RecoveryExecutionReadinessBoardLaneRepository;
  cardRepository: RecoveryExecutionReadinessBoardCardRepository;
  filterPresetRepository: RecoveryExecutionReadinessBoardFilterPresetRepository;
  riskSignalRepository: RecoveryExecutionReadinessBoardRiskSignalRepository;
  blockerRepository: RecoveryExecutionReadinessBoardBlockerRepository;
  governanceNoteRepository: RecoveryExecutionReadinessBoardGovernanceNoteRepository;
  roleProjectionRepository: RecoveryExecutionReadinessBoardRoleProjectionRepository;
  teacherQueueRepository: RecoveryExecutionReadinessBoardTeacherQueueRepository;
  adminQueueRepository: RecoveryExecutionReadinessBoardAdminQueueRepository;
  studentSafeStatusDraftRepository: RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository;
  parentSafeStatusDraftRepository: RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository;
  refreshJobRepository: RecoveryExecutionReadinessBoardRefreshJobRepository;
  summaryRepository: RecoveryExecutionReadinessBoardSummaryRepository;
  auditRepository: RecoveryExecutionReadinessBoardAuditRepository;
  idempotencyRepository: RecoveryExecutionReadinessBoardIdempotencyRepository;
}

export interface QuestionBankPackage26Repositories {
  adjudicationReadinessRepository: RecoveryCaseAdjudicationReadinessRepository;
  reviewSessionRepository: RecoveryCaseReviewSessionRepository;
  evidenceBundleRepository: RecoveryCaseReviewEvidenceBundleRepository;
  reviewChecklistRepository: RecoveryCaseReviewChecklistRepository;
  conflictDeclarationRepository: RecoveryCaseConflictOfInterestDeclarationRepository;
  reviewerDecisionRepository: RecoveryCaseReviewerDecisionDraftRepository;
  priorityOverrideRepository: RecoveryCasePriorityOverrideRequestRepository;
  secondReviewRepository: RecoveryCaseSecondReviewRequestRepository;
  consensusRepository: RecoveryCaseReviewerConsensusRepository;
  disagreementRepository: RecoveryCaseDisagreementResolutionDraftRepository;
  queueDispositionRepository: RecoveryCaseQueueDispositionRepository;
  qualitySampleRepository: RecoveryCaseQualitySampleRepository;
  adjudicationSummaryRepository: RecoveryCaseAdjudicationSummaryRepository;
  adjudicationAuditRepository: RecoveryCaseAdjudicationAuditRepository;
  adjudicationIdempotencyRepository: RecoveryCaseAdjudicationIdempotencyRepository;
}

export interface QuestionBankAllRepositories {
  mode: QuestionBankRepositoryMode;
  package5: QuestionBankPackage5Repositories;
  package6: QuestionBankPackage6Repositories;
  package8: QuestionBankPackage8Repositories;
  package22: QuestionBankPackage22Repositories;
  package24: QuestionBankPackage24Repositories;
  package26: QuestionBankPackage26Repositories;
}



function buildInMemoryPackage5Repos(): QuestionBankPackage5Repositories {
  return {
    markingRunRepository: new InMemoryMarkingRunRepository(),
    markingResultVersionRepository: new InMemoryMarkingResultVersionRepository(),
    markingBreakdownItemRepository: new InMemoryMarkingBreakdownItemRepository(),
  };
}

function buildInMemoryPackage6Repos(): QuestionBankPackage6Repositories {
  return {
    assemblyPersistence: new InMemoryExamPaperAssemblyPersistence(),
    paperRepository: new InMemoryExamPaperRepository(),
    versionRepository: new InMemoryExamPaperVersionRepository(),
    sectionRepository: new InMemoryExamPaperSectionRepository(),
    questionRepository: new InMemoryExamPaperQuestionRepository(),
    variantRepository: new InMemoryExamVariantRepository(),
    variantQuestionRepository: new InMemoryExamVariantQuestionRepository(),
    accessPolicyRepository: new InMemoryExamAccessPolicyRepository(),
    approvalRepository: new InMemoryExamPaperApprovalRepository(),
    assemblyRunRepository: new InMemoryExamPaperAssemblyRunRepository(),
    deliveryBridgeRepository: new InMemoryExamPaperDeliveryBridgeRepository(),
  };
}

function buildInMemoryPackage8Repos(): QuestionBankPackage8Repositories {
  return {
    markingInvocationRequestRepository: new InMemoryMarkingInvocationRequestRepository(),
    submittedSnapshotIntakeRepository: new InMemorySubmittedSnapshotIntakeRepository(),
    markingBatchRepository: new InMemoryMarkingBatchRepository(),
    markingBatchItemRepository: new InMemoryMarkingBatchItemRepository(),
    markingResultLinkRepository: new InMemoryMarkingResultLinkRepository(),
  };
}

function buildInMemoryPackage22Repos(): QuestionBankPackage22Repositories {
  return {
    closureRepositories: new InMemoryRecoveryLifecycleClosureRepositories(),
  };
}

function buildInMemoryPackage24Repos(): QuestionBankPackage24Repositories {
  return {
    snapshotRepository: new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository(),
    laneRepository: new InMemoryRecoveryExecutionReadinessBoardLaneRepository(),
    cardRepository: new InMemoryRecoveryExecutionReadinessBoardCardRepository(),
    filterPresetRepository: new InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository(),
    riskSignalRepository: new InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository(),
    blockerRepository: new InMemoryRecoveryExecutionReadinessBoardBlockerRepository(),
    governanceNoteRepository: new InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository(),
    roleProjectionRepository: new InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository(),
    teacherQueueRepository: new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository(),
    adminQueueRepository: new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository(),
    studentSafeStatusDraftRepository: new InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository(),
    parentSafeStatusDraftRepository: new InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository(),
    refreshJobRepository: new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository(),
    summaryRepository: new InMemoryRecoveryExecutionReadinessBoardSummaryRepository(),
    auditRepository: new InMemoryRecoveryExecutionReadinessBoardAuditRepository(),
    idempotencyRepository: new InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository(),
  };
}

function buildInMemoryPackage26Repos(): QuestionBankPackage26Repositories {
  return {
    adjudicationReadinessRepository: new InMemoryAdjudicationReadinessRepository(),
    reviewSessionRepository: new InMemoryReviewSessionRepository(),
    evidenceBundleRepository: new InMemoryEvidenceBundleRepository(),
    reviewChecklistRepository: new InMemoryReviewChecklistRepository(),
    conflictDeclarationRepository: new InMemoryConflictDeclarationRepository(),
    reviewerDecisionRepository: new InMemoryReviewerDecisionRepository(),
    priorityOverrideRepository: new InMemoryPriorityOverrideRepository(),
    secondReviewRepository: new InMemorySecondReviewRepository(),
    consensusRepository: new InMemoryConsensusRepository(),
    disagreementRepository: new InMemoryDisagreementDraftRepository(),
    queueDispositionRepository: new InMemoryQueueDispositionRepository(),
    qualitySampleRepository: new InMemoryQualitySampleRepository(),
    adjudicationSummaryRepository: new InMemoryAdjudicationSummaryRepository(),
    adjudicationAuditRepository: new InMemoryAdjudicationAuditRepository(),
    adjudicationIdempotencyRepository: new InMemoryAdjudicationIdempotencyRepository(),
  };
}

function buildPrismaPackage5Repos(prisma: PrismaClient): QuestionBankPackage5Repositories {
  return {
    markingRunRepository: new PrismaMarkingRunRepository(prisma),
    markingResultVersionRepository: new PrismaMarkingResultVersionRepository(prisma),
    markingBreakdownItemRepository: new PrismaMarkingBreakdownItemRepository(prisma),
  };
}

function buildPrismaPackage6Repos(prisma: PrismaClient): QuestionBankPackage6Repositories {
  return {
    assemblyPersistence: new PrismaExamPaperAssemblyPersistence(prisma),
    paperRepository: new PrismaExamPaperRepository(prisma),
    versionRepository: new PrismaExamPaperVersionRepository(prisma),
    sectionRepository: new PrismaExamPaperSectionRepository(prisma),
    questionRepository: new PrismaExamPaperQuestionRepository(prisma),
    variantRepository: new PrismaExamVariantRepository(prisma),
    variantQuestionRepository: new PrismaExamVariantQuestionRepository(prisma),
    accessPolicyRepository: new PrismaExamAccessPolicyRepository(prisma),
    approvalRepository: new PrismaExamPaperApprovalRepository(prisma),
    assemblyRunRepository: new PrismaExamPaperAssemblyRunRepository(prisma),
    deliveryBridgeRepository: new PrismaExamPaperDeliveryBridgeRepository(prisma),
  };
}

import { PrismaMarkingInvocationRequestRepository, PrismaSubmittedSnapshotIntakeRepository, PrismaMarkingBatchRepository, PrismaMarkingBatchItemRepository, PrismaMarkingResultLinkRepository } from '../../assessment/marking-invocation/repositories/prismaMarkingInvocationRepositories';

function buildPrismaPackage8Repos(prisma: PrismaClient): QuestionBankPackage8Repositories {
  return {
    markingInvocationRequestRepository: new PrismaMarkingInvocationRequestRepository(prisma),
    submittedSnapshotIntakeRepository: new PrismaSubmittedSnapshotIntakeRepository(prisma),
    markingBatchRepository: new PrismaMarkingBatchRepository(prisma),
    markingBatchItemRepository: new PrismaMarkingBatchItemRepository(prisma),
    markingResultLinkRepository: new PrismaMarkingResultLinkRepository(prisma),
  };
}

function buildPrismaPackage22Repos(prisma: PrismaClient): QuestionBankPackage22Repositories {
  return {
    closureRepositories: new PrismaRecoveryLifecycleClosureRepositories(prisma),
  };
}

function buildPrismaPackage24Repos(prisma: PrismaClient): QuestionBankPackage24Repositories {
  return {
    snapshotRepository: new PrismaRecoveryExecutionReadinessBoardSnapshotRepository(prisma),
    laneRepository: new PrismaRecoveryExecutionReadinessBoardLaneRepository(prisma),
    cardRepository: new PrismaRecoveryExecutionReadinessBoardCardRepository(prisma),
    filterPresetRepository: new PrismaRecoveryExecutionReadinessBoardFilterPresetRepository(prisma),
    riskSignalRepository: new PrismaRecoveryExecutionReadinessBoardRiskSignalRepository(prisma),
    blockerRepository: new PrismaRecoveryExecutionReadinessBoardBlockerRepository(prisma),
    governanceNoteRepository: new PrismaRecoveryExecutionReadinessBoardGovernanceNoteRepository(prisma),
    roleProjectionRepository: new PrismaRecoveryExecutionReadinessBoardRoleProjectionRepository(prisma),
    teacherQueueRepository: new PrismaRecoveryExecutionReadinessBoardTeacherQueueRepository(prisma),
    adminQueueRepository: new PrismaRecoveryExecutionReadinessBoardAdminQueueRepository(prisma),
    studentSafeStatusDraftRepository: new PrismaRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository(prisma),
    parentSafeStatusDraftRepository: new PrismaRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository(prisma),
    refreshJobRepository: new PrismaRecoveryExecutionReadinessBoardRefreshJobRepository(prisma),
    summaryRepository: new PrismaRecoveryExecutionReadinessBoardSummaryRepository(prisma),
    auditRepository: new PrismaRecoveryExecutionReadinessBoardAuditRepository(prisma),
    idempotencyRepository: new PrismaRecoveryExecutionReadinessBoardIdempotencyRepository(prisma),
  };
}

import {
  PrismaRecoveryCaseAdjudicationReadinessRepository,
  PrismaRecoveryCaseReviewSessionRepository,
  PrismaRecoveryCaseReviewEvidenceBundleRepository,
  PrismaRecoveryCaseReviewChecklistRepository,
  PrismaRecoveryCaseConflictOfInterestDeclarationRepository,
  PrismaRecoveryCaseReviewerDecisionDraftRepository,
  PrismaRecoveryCasePriorityOverrideRequestRepository,
  PrismaRecoveryCaseSecondReviewRequestRepository,
  PrismaRecoveryCaseReviewerConsensusRepository,
  PrismaRecoveryCaseDisagreementResolutionDraftRepository,
  PrismaRecoveryCaseQueueDispositionRepository,
  PrismaRecoveryCaseQualitySampleRepository,
  PrismaRecoveryCaseAdjudicationSummaryRepository,
  PrismaRecoveryCaseAdjudicationAuditRepository,
  PrismaRecoveryCaseAdjudicationIdempotencyRepository,
} from '../../assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories';

function buildPrismaPackage26Repos(prisma: PrismaClient): QuestionBankPackage26Repositories {
  return {
    adjudicationReadinessRepository: new PrismaRecoveryCaseAdjudicationReadinessRepository(prisma),
    reviewSessionRepository: new PrismaRecoveryCaseReviewSessionRepository(prisma),
    evidenceBundleRepository: new PrismaRecoveryCaseReviewEvidenceBundleRepository(prisma),
    reviewChecklistRepository: new PrismaRecoveryCaseReviewChecklistRepository(prisma),
    conflictDeclarationRepository: new PrismaRecoveryCaseConflictOfInterestDeclarationRepository(prisma),
    reviewerDecisionRepository: new PrismaRecoveryCaseReviewerDecisionDraftRepository(prisma),
    priorityOverrideRepository: new PrismaRecoveryCasePriorityOverrideRequestRepository(prisma),
    secondReviewRepository: new PrismaRecoveryCaseSecondReviewRequestRepository(prisma),
    consensusRepository: new PrismaRecoveryCaseReviewerConsensusRepository(prisma),
    disagreementRepository: new PrismaRecoveryCaseDisagreementResolutionDraftRepository(prisma),
    queueDispositionRepository: new PrismaRecoveryCaseQueueDispositionRepository(prisma),
    qualitySampleRepository: new PrismaRecoveryCaseQualitySampleRepository(prisma),
    adjudicationSummaryRepository: new PrismaRecoveryCaseAdjudicationSummaryRepository(prisma),
    adjudicationAuditRepository: new PrismaRecoveryCaseAdjudicationAuditRepository(prisma),
    adjudicationIdempotencyRepository: new PrismaRecoveryCaseAdjudicationIdempotencyRepository(prisma),
  };
}

export class QuestionBankRuntimeComposition {
  private repos: QuestionBankAllRepositories | null = null;

  constructor(private mode: QuestionBankRepositoryMode) {}

  build(): QuestionBankAllRepositories {
    if (this.mode === 'prisma') {
      if (!canonicalPrisma) {
        throw new Error(`${QUESTION_BANK_PRISMA_CLIENT_UNAVAILABLE}: Canonical Prisma client is not available`);
      }
      try {
        this.repos = {
          mode: 'prisma',
          package5: buildPrismaPackage5Repos(canonicalPrisma),
          package6: buildPrismaPackage6Repos(canonicalPrisma),
          package8: buildPrismaPackage8Repos(canonicalPrisma),
          package22: buildPrismaPackage22Repos(canonicalPrisma),
          package24: buildPrismaPackage24Repos(canonicalPrisma),
          package26: buildPrismaPackage26Repos(canonicalPrisma),
        };
      } catch (err: any) {
        throw new Error(`${QUESTION_BANK_REPOSITORY_COMPOSITION_FAILED}: ${err.message}`);
      }
    } else {
      this.repos = {
        mode: 'memory',
        package5: buildInMemoryPackage5Repos(),
        package6: buildInMemoryPackage6Repos(),
        package8: buildInMemoryPackage8Repos(),
        package22: buildInMemoryPackage22Repos(),
        package24: buildInMemoryPackage24Repos(),
        package26: buildInMemoryPackage26Repos(),
      };
    }
    return this.repos;
  }

  getRepositories(): QuestionBankAllRepositories {
    if (!this.repos) {
      throw new Error(`${QUESTION_BANK_REPOSITORY_COMPOSITION_FAILED}: Composition not built. Call build() first.`);
    }
    return this.repos;
  }
}

export function createQuestionBankComposition(mode?: QuestionBankRepositoryMode): QuestionBankRuntimeComposition {
  const resolvedMode = mode ?? questionBankRepositoryModeResolver.resolve();
  return new QuestionBankRuntimeComposition(resolvedMode);
}

import { createMarkingRouter } from '../../../routes/marking';
import { createExamPaperRouter } from '../../../routes/examPaper';
import { createMarkingInvocationRouter } from '../../../routes/markingInvocation';
import { createRecoveryLifecycleClosureRouter } from '../../../routes/recoveryLifecycleClosure';
import { createRecoveryExecutionReadinessBoardRouter } from '../../../routes/recoveryExecutionReadinessBoard';
import { createRecoveryCaseAdjudicationRouter } from '../../../routes/recoveryCaseAdjudication';
import { Router } from 'express';

export function createComposedQuestionBankRouter(composition?: QuestionBankRuntimeComposition): {
  markingRouter: Router;
  examPaperRouter: Router;
  markingInvocationRouter: Router;
  recoveryLifecycleClosureRouter: Router;
  recoveryExecutionReadinessBoardRouter: Router;
  recoveryCaseAdjudicationRouter: Router;
} {
  const comp = composition ?? createQuestionBankComposition();
  const repos = comp.build();

  return {
    markingRouter: createMarkingRouter(repos.package5.markingRunRepository, repos.package5.markingResultVersionRepository, repos.package5.markingBreakdownItemRepository),
    examPaperRouter: createExamPaperRouter(repos.package6),
    markingInvocationRouter: createMarkingInvocationRouter(
      repos.package8.markingInvocationRequestRepository,
      repos.package8.submittedSnapshotIntakeRepository,
      repos.package8.markingBatchRepository,
      repos.package8.markingBatchItemRepository,
      repos.package8.markingResultLinkRepository,
    ),
    recoveryLifecycleClosureRouter: createRecoveryLifecycleClosureRouter(repos.package22.closureRepositories),
    recoveryExecutionReadinessBoardRouter: createRecoveryExecutionReadinessBoardRouter(
      repos.package24.snapshotRepository,
      repos.package24.laneRepository,
      repos.package24.cardRepository,
      repos.package24.blockerRepository,
      repos.package24.riskSignalRepository,
      repos.package24.filterPresetRepository,
      repos.package24.governanceNoteRepository,
      repos.package24.roleProjectionRepository,
      repos.package24.teacherQueueRepository,
      repos.package24.adminQueueRepository,
      repos.package24.studentSafeStatusDraftRepository,
      repos.package24.parentSafeStatusDraftRepository,
      repos.package24.refreshJobRepository,
      repos.package24.summaryRepository,
      repos.package24.auditRepository,
      repos.package24.idempotencyRepository,
    ),
    recoveryCaseAdjudicationRouter: createRecoveryCaseAdjudicationRouter(
      repos.package26.adjudicationReadinessRepository,
      repos.package26.reviewSessionRepository,
      repos.package26.evidenceBundleRepository,
      repos.package26.reviewChecklistRepository,
      repos.package26.conflictDeclarationRepository,
      repos.package26.reviewerDecisionRepository,
      repos.package26.priorityOverrideRepository,
      repos.package26.secondReviewRepository,
      repos.package26.consensusRepository,
      repos.package26.disagreementRepository,
      repos.package26.queueDispositionRepository,
      repos.package26.qualitySampleRepository,
      repos.package26.adjudicationSummaryRepository,
      repos.package26.adjudicationAuditRepository,
      repos.package26.adjudicationIdempotencyRepository,
    ),
  };
}
