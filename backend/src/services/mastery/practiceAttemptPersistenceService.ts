import type { SafePracticeAttemptInput, SafePracticeAttemptRecord } from './task011Contracts';
import { practiceAttemptService } from '../practiceAttemptService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

function nowISO(): string {
  return new Date().toISOString();
}

export class PracticeAttemptPersistenceService {
  async persistPracticeAttempt(
    identity: ResolvedTutorIdentity,
    input: SafePracticeAttemptInput,
  ): Promise<{
    record: SafePracticeAttemptRecord | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    try {
      const result = await practiceAttemptService.createPracticeAttempt(identity, {
        sessionId: input.sessionId ?? null,
        kind: 'open_response',
        subject: input.subject ?? null,
        topic: input.topic ?? null,
        skillIds: input.skillIds ?? [],
        promptSummary: input.promptSummary.slice(0, 1200),
        learnerAnswerSummary: input.learnerAnswerSummary?.slice(0, 1200) ?? null,
        expectedAnswerSummary: input.expectedAnswerSummary?.slice(0, 1200) ?? null,
        outcome: input.outcome,
        hintsRequested: input.hintLevelUsed,
        attemptNumber: input.attemptNumber,
        timeSpentSeconds: input.timeSpentSeconds ?? null,
        confidence: input.confidence,
        misconceptionSignals: (input.misconceptionSignals ?? []).map((s) => ({
          label: s.label.slice(0, 160),
          summary: s.summary.slice(0, 1200),
          confidence: s.confidence ?? 0.5,
          skillIds: s.skillIds ?? [],
        })),
      });

      const record: SafePracticeAttemptRecord = {
        attemptId: result.attempt.attemptId,
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        sessionId: input.sessionId ?? null,
        subject: input.subject ?? null,
        topic: input.topic ?? null,
        skillIds: input.skillIds ?? [],
        curriculumTrack: input.curriculumTrack ?? 'unknown',
        subjectModuleId: input.subjectModuleId ?? null,
        outcome: input.outcome,
        hintLevelUsed: input.hintLevelUsed,
        attemptNumber: input.attemptNumber,
        confidence: input.confidence,
        validationModes: input.validationModes ?? [],
        mistakeCategories: input.mistakeCategories ?? [],
        safeSummary: input.promptSummary.slice(0, 500),
        createdAt: result.attempt.createdAt,
      };

      warnings.push(...result.warnings);

      return { record, warnings };
    } catch (err) {
      warnings.push(`Failed to persist practice attempt: ${String(err)}`);
      return { record: null, warnings };
    }
  }

  async listSafePracticeAttempts(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string; topic?: string; skillId?: string; limit?: number },
  ): Promise<{ records: SafePracticeAttemptRecord[]; warnings: string[] }> {
    try {
      const attempts = await practiceAttemptService.listPracticeAttempts(identity, options);
      const records: SafePracticeAttemptRecord[] = attempts.map((a) => ({
        attemptId: a.attemptId,
        schoolId: a.schoolId,
        studentId: a.studentId,
        sessionId: a.sessionId ?? null,
        subject: a.subject ?? null,
        topic: a.topic ?? null,
        skillIds: a.skillIds,
        curriculumTrack: 'unknown',
        subjectModuleId: null,
        outcome: a.outcome,
        hintLevelUsed: a.hintsRequested,
        attemptNumber: a.attemptNumber,
        confidence: a.confidence,
        validationModes: [],
        mistakeCategories: [],
        safeSummary: a.promptSummary.slice(0, 500),
        createdAt: a.createdAt,
      }));
      return { records, warnings: [] };
    } catch (err) {
      return { records: [], warnings: [`Failed to list practice attempts: ${String(err)}`] };
    }
  }

  async getSafePracticeAttemptById(
    identity: ResolvedTutorIdentity,
    attemptId: string,
  ): Promise<{ record: SafePracticeAttemptRecord | null; warnings: string[] }> {
    try {
      const attempt = await practiceAttemptService.getPracticeAttempt(identity, attemptId);
      if (!attempt) return { record: null, warnings: ['Practice attempt not found'] };

      const record: SafePracticeAttemptRecord = {
        attemptId: attempt.attemptId,
        schoolId: attempt.schoolId,
        studentId: attempt.studentId,
        sessionId: attempt.sessionId ?? null,
        subject: attempt.subject ?? null,
        topic: attempt.topic ?? null,
        skillIds: attempt.skillIds,
        curriculumTrack: 'unknown',
        subjectModuleId: null,
        outcome: attempt.outcome,
        hintLevelUsed: attempt.hintsRequested,
        attemptNumber: attempt.attemptNumber,
        confidence: attempt.confidence,
        validationModes: [],
        mistakeCategories: [],
        safeSummary: attempt.promptSummary.slice(0, 500),
        createdAt: attempt.createdAt,
      };
      return { record, warnings: [] };
    } catch (err) {
      return { record: null, warnings: [`Failed to get practice attempt: ${String(err)}`] };
    }
  }
}

export const practiceAttemptPersistenceService = new PracticeAttemptPersistenceService();
