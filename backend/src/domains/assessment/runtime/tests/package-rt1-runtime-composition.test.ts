import { describe, it, expect } from 'vitest';
import { questionBankRepositoryModeResolver } from '../questionBankRepositoryMode';
import { QuestionBankRuntimeComposition, createQuestionBankComposition } from '../questionBankRuntimeComposition';
import { QUESTION_BANK_REPOSITORY_COMPOSITION_FAILED, type QuestionBankRepositoryMode } from '../questionBankRuntimeContracts';

describe('Package RT1 - Question Bank Repository Mode Resolution', () => {
  it('resolves to memory by default', () => {
    const mode = questionBankRepositoryModeResolver.resolve();
    expect(mode).toBe('memory');
  });

  it('resolves to memory when env is empty', () => {
    const prev = process.env.QUESTION_BANK_REPOSITORY_MODE;
    delete process.env.QUESTION_BANK_REPOSITORY_MODE;
    const mode = questionBankRepositoryModeResolver.resolve();
    expect(mode).toBe('memory');
    if (prev) process.env.QUESTION_BANK_REPOSITORY_MODE = prev;
  });

  it('resolves to memory when env is memory', () => {
    const prev = process.env.QUESTION_BANK_REPOSITORY_MODE;
    process.env.QUESTION_BANK_REPOSITORY_MODE = 'memory';
    const mode = questionBankRepositoryModeResolver.resolve();
    expect(mode).toBe('memory');
    if (prev) process.env.QUESTION_BANK_REPOSITORY_MODE = prev;
  });

  it('resolves to prisma when env is prisma', () => {
    const prev = process.env.QUESTION_BANK_REPOSITORY_MODE;
    process.env.QUESTION_BANK_REPOSITORY_MODE = 'prisma';
    const mode = questionBankRepositoryModeResolver.resolve();
    expect(mode).toBe('prisma');
    if (prev) process.env.QUESTION_BANK_REPOSITORY_MODE = prev;
  });

  it('rejects unknown mode', () => {
    expect(() => questionBankRepositoryModeResolver.resolve({
      nodeEnv: 'development',
      repositoryMode: 'unknown',
      allowInMemory: 'true',
    })).toThrow();
  });
});

describe('Package RT1 - Question Bank Runtime Composition', () => {
  it('creates composition with memory mode', () => {
    const composition = createQuestionBankComposition('memory');
    expect(composition).toBeInstanceOf(QuestionBankRuntimeComposition);
  });

  it('build() returns repositories in memory mode', () => {
    const composition = createQuestionBankComposition('memory');
    const repos = composition.build();
    expect(repos.mode).toBe('memory');
    expect(repos.package5.markingRunRepository).toBeDefined();
    expect(repos.package5.markingResultVersionRepository).toBeDefined();
    expect(repos.package8.markingInvocationRequestRepository).toBeDefined();
    expect(repos.package22.closureRepositories).toBeDefined();
    expect(repos.package24.snapshotRepository).toBeDefined();
    expect(repos.package24.laneRepository).toBeDefined();
    expect(repos.package24.cardRepository).toBeDefined();
    expect(repos.package24.filterPresetRepository).toBeDefined();
    expect(repos.package24.riskSignalRepository).toBeDefined();
    expect(repos.package24.blockerRepository).toBeDefined();
    expect(repos.package24.governanceNoteRepository).toBeDefined();
    expect(repos.package24.roleProjectionRepository).toBeDefined();
    expect(repos.package24.teacherQueueRepository).toBeDefined();
    expect(repos.package24.adminQueueRepository).toBeDefined();
    expect(repos.package24.studentSafeStatusDraftRepository).toBeDefined();
    expect(repos.package24.parentSafeStatusDraftRepository).toBeDefined();
    expect(repos.package24.refreshJobRepository).toBeDefined();
    expect(repos.package24.summaryRepository).toBeDefined();
    expect(repos.package24.auditRepository).toBeDefined();
    expect(repos.package24.idempotencyRepository).toBeDefined();
  });

  it('getRepositories() throws if build() not called', () => {
    const composition = createQuestionBankComposition('memory');
    expect(() => composition.getRepositories()).toThrow(QUESTION_BANK_REPOSITORY_COMPOSITION_FAILED);
  });

  it('getRepositories() returns repos after build()', () => {
    const composition = createQuestionBankComposition('memory');
    composition.build();
    const repos = composition.getRepositories();
    expect(repos.mode).toBe('memory');
    expect(repos.package5.markingRunRepository).toBeDefined();
  });

  it('composition is a singleton per instance', () => {
    const composition = createQuestionBankComposition('memory');
    const reposA = composition.build();
    const reposB = composition.getRepositories();
    expect(reposA).toBe(reposB);
  });

  it('multiple compositions produce separate instances', () => {
    const compA = createQuestionBankComposition('memory');
    const compB = createQuestionBankComposition('memory');
    const reposA = compA.build();
    const reposB = compB.build();
    expect(reposA).not.toBe(reposB);
  });

  it('createQuestionBankComposition uses resolved mode when none provided', () => {
    const composition = createQuestionBankComposition();
    expect(composition).toBeInstanceOf(QuestionBankRuntimeComposition);
    const repos = composition.build();
    expect(repos.mode).toBe('memory');
  });

  it('Package 22 closure repos implement IRecoveryLifecycleClosureRepositories', () => {
    const composition = createQuestionBankComposition('memory');
    const repos = composition.build();
    expect(repos.package22.closureRepositories.closureReadiness).toBeDefined();
    expect(repos.package22.closureRepositories.handoffPacket).toBeDefined();
    expect(repos.package22.closureRepositories.nextCycleRecommendationDraft).toBeDefined();
    expect(repos.package22.closureRepositories.deferredIntegrationTicket).toBeDefined();
    expect(repos.package22.closureRepositories.unresolvedRiskRegister).toBeDefined();
    expect(repos.package22.closureRepositories.teacherClosureReviewPacket).toBeDefined();
    expect(repos.package22.closureRepositories.adminGovernanceReviewPacket).toBeDefined();
    expect(repos.package22.closureRepositories.studentClosureReflectionDraft).toBeDefined();
    expect(repos.package22.closureRepositories.parentClosureGuidanceDraft).toBeDefined();
    expect(repos.package22.closureRepositories.archiveManifest).toBeDefined();
    expect(repos.package22.closureRepositories.finalLifecycleSummary).toBeDefined();
    expect(repos.package22.closureRepositories.closureAudit).toBeDefined();
    expect(repos.package22.closureRepositories.closureIdempotency).toBeDefined();
  });
});
