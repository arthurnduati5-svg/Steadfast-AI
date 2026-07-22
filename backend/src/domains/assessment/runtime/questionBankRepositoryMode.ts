import {
  QuestionBankRepositoryMode,
  QuestionBankRuntimeEnvironment,
  QUESTION_BANK_REPOSITORY_MODE_MISSING,
  QUESTION_BANK_REPOSITORY_MODE_INVALID,
  QUESTION_BANK_IN_MEMORY_NOT_ALLOWED,
} from './questionBankRuntimeContracts';

export class QuestionBankRepositoryModeResolver {
  private mode: QuestionBankRepositoryMode | null = null;

  resolve(env?: QuestionBankRuntimeEnvironment): QuestionBankRepositoryMode {
    const e = env ?? {
      nodeEnv: process.env.NODE_ENV,
      repositoryMode: process.env.QUESTION_BANK_REPOSITORY_MODE,
      allowInMemory: process.env.QUESTION_BANK_ALLOW_IN_MEMORY,
    };

    if (e.nodeEnv === 'test') {
      if (e.repositoryMode === 'prisma') {
        this.mode = 'prisma';
        return 'prisma';
      }
      this.mode = 'memory';
      return 'memory';
    }

    if (e.nodeEnv === 'production') {
      if (e.repositoryMode === 'prisma') {
        this.mode = 'prisma';
        return 'prisma';
      }
      throw new Error(`${QUESTION_BANK_REPOSITORY_MODE_MISSING}: Production requires QUESTION_BANK_REPOSITORY_MODE=prisma`);
    }

    if (!e.repositoryMode) {
      throw new Error(`${QUESTION_BANK_REPOSITORY_MODE_MISSING}: QUESTION_BANK_REPOSITORY_MODE is not set`);
    }

    if (e.repositoryMode === 'memory') {
      if (e.allowInMemory !== 'true') {
        throw new Error(`${QUESTION_BANK_IN_MEMORY_NOT_ALLOWED}: Set QUESTION_BANK_ALLOW_IN_MEMORY=true to use memory mode outside test`);
      }
      this.mode = 'memory';
      return 'memory';
    }

    if (e.repositoryMode === 'prisma') {
      this.mode = 'prisma';
      return 'prisma';
    }

    throw new Error(`${QUESTION_BANK_REPOSITORY_MODE_INVALID}: Invalid QUESTION_BANK_REPOSITORY_MODE '${e.repositoryMode}'`);
  }

  getResolvedMode(): QuestionBankRepositoryMode | null {
    return this.mode;
  }

  reset(): void {
    this.mode = null;
  }
}

export const questionBankRepositoryModeResolver = new QuestionBankRepositoryModeResolver();
