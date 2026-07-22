import { randomUUID } from 'crypto';
import {
  ExamPaperAssemblyPersistence,
  PersistExamPaperAssemblyGraphInput,
  PersistExamPaperAssemblyGraphResult,
} from '../contracts/examPaperAssemblyPersistenceContracts';

interface StoredAssemblyRecord {
  input: PersistExamPaperAssemblyGraphInput;
  result: PersistExamPaperAssemblyGraphResult;
  createdAt: string;
}

export class InMemoryExamPaperAssemblyPersistence implements ExamPaperAssemblyPersistence {
  private store = new Map<string, StoredAssemblyRecord>();
  private idempotencyStore = new Map<string, StoredAssemblyRecord>();

  async persistAssemblyGraph(input: PersistExamPaperAssemblyGraphInput): Promise<PersistExamPaperAssemblyGraphResult> {
    const fingerprint = `${input.schoolId}:${input.idempotencyKey}`;

    const existing = this.idempotencyStore.get(fingerprint);
    if (existing) {
      const requestFingerprint = JSON.stringify({ operation: 'assemblePaperFromDraft', input });
      const storedFingerprint = JSON.stringify({ operation: 'assemblePaperFromDraft', input: existing.input });
      if (requestFingerprint !== storedFingerprint) {
        throw new Error('IDEMPOTENCY_CONFLICT: Same idempotency key with different request fingerprint');
      }
      return { ...existing.result };
    }

    const paperId = randomUUID();
    const paperVersionId = randomUUID();
    const assemblyRunId = randomUUID();
    const sectionCount = input.sections.length;

    const result: PersistExamPaperAssemblyGraphResult = {
      paperId,
      paperVersionId,
      assemblyRunId,
      status: input.assembledQuestionCount > 0 ? 'completed' : 'partial',
      questionCount: input.assembledQuestionCount,
      sectionCount,
      totalMarks: input.totalMarks,
      warnings: input.warningCount > 0 ? ['Assembly completed with warnings'] : [],
      safeSummary: input.safeSummary,
    };

    const record: StoredAssemblyRecord = {
      input,
      result,
      createdAt: new Date().toISOString(),
    };

    this.store.set(paperId, record);
    this.idempotencyStore.set(fingerprint, record);

    return { ...result };
  }

  getById(paperId: string): StoredAssemblyRecord | undefined {
    return this.store.get(paperId);
  }

  clear(): void {
    this.store.clear();
    this.idempotencyStore.clear();
  }
}
