export type QuestionBankRepositoryMode = 'memory' | 'prisma';

export interface QuestionBankRuntimeEnvironment {
  nodeEnv: string | undefined;
  repositoryMode: string | undefined;
  allowInMemory: string | undefined;
}

export const QUESTION_BANK_REPOSITORY_MODE_MISSING = 'QUESTION_BANK_REPOSITORY_MODE_MISSING';
export const QUESTION_BANK_REPOSITORY_MODE_INVALID = 'QUESTION_BANK_REPOSITORY_MODE_INVALID';
export const QUESTION_BANK_IN_MEMORY_NOT_ALLOWED = 'QUESTION_BANK_IN_MEMORY_NOT_ALLOWED';
export const QUESTION_BANK_PRISMA_CLIENT_UNAVAILABLE = 'QUESTION_BANK_PRISMA_CLIENT_UNAVAILABLE';
export const QUESTION_BANK_REPOSITORY_COMPOSITION_FAILED = 'QUESTION_BANK_REPOSITORY_COMPOSITION_FAILED';
