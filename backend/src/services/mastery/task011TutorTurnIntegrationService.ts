import type {
  Task011TutorTurnIntegrationResult,
  Task011PersistenceResult,
  SafePracticeAttemptInput,
  SafeStepEvidenceInput,
  MasteryAggregationInput,
} from './task011Contracts';
import { practiceAttemptPersistenceService } from './practiceAttemptPersistenceService';
import { stepEvidencePersistenceService } from './stepEvidencePersistenceService';
import { masteryEvidenceAggregationService } from './masteryEvidenceAggregationService';
import { weakSkillTrackingService } from './weakSkillTrackingService';
import { revisionSchedulingRuntime } from './revisionSchedulingRuntime';
import { spacedReviewPlanner } from './spacedReviewPlanner';
import { learnerProgressStateService } from './learnerProgressStateService';
import { growthProofSummaryService } from './growthProofSummaryService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

function nowISO(): string {
  return new Date().toISOString();
}

export class Task011TutorTurnIntegrationService {
  async processValidatedTutorTurn(
    identity: ResolvedTutorIdentity,
    params: {
      requestId: string;
      subject?: string | null;
      topic?: string | null;
      skillIds?: string[];
      curriculumTrack?: string;
      subjectModuleId?: string | null;
      outcome?: 'correct' | 'partially_correct' | 'incorrect' | 'unclear' | 'not_evaluated';
      hintLevelUsed?: number;
      attemptNumber?: number;
      confidence?: number;
      mistakeCategories?: string[];
      validationModes?: string[];
      safeSummary?: string;
      learnerResponseSummary?: string | null;
      expectedAnswerSummary?: string | null;
      isPracticeAttempt: boolean;
      isSafetyTurn: boolean;
      isIntegrityBlocked: boolean;
      isDeenTurn: boolean;
      isSourceSensitive: boolean;
    },
  ): Promise<Task011TutorTurnIntegrationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (params.isSafetyTurn) {
      return {
        ok: true,
        requestId: params.requestId,
        persistenceResult: {
          ok: true,
          attemptPersisted: false,
          stepEvidencePersisted: false,
          masteryAggregated: false,
          weakSkillUpdated: false,
          revisionScheduled: false,
          spacedReviewPlanned: false,
          progressStateUpdated: false,
          growthProofGenerated: false,
          warnings: ['Safety turn: no learning evidence persisted'],
          errors: [],
        },
        warnings: ['Safety turn skipped for learning persistence'],
        errors: [],
      };
    }

    if (params.isIntegrityBlocked) {
      const safeSummary = 'Academic integrity blocked turn: safe metadata only.';
      const evidenceInput: SafeStepEvidenceInput = {
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        sessionId: null,
        subject: params.subject ?? null,
        topic: params.topic ?? null,
        skillIds: params.skillIds ?? [],
        evidenceType: 'revision_needed',
        confidenceScore: 0.3,
        safeSummary,
        validationModes: params.validationModes ?? [],
        curriculumTrack: params.curriculumTrack ?? 'unknown',
        subjectModuleId: params.subjectModuleId ?? null,
        sourceSensitive: false,
        source: 'academic_integrity_guard',
      };

      await stepEvidencePersistenceService.persistStepEvidence(identity, evidenceInput);

      return {
        ok: true,
        requestId: params.requestId,
        persistenceResult: {
          ok: true,
          attemptPersisted: false,
          stepEvidencePersisted: true,
          masteryAggregated: false,
          weakSkillUpdated: true,
          revisionScheduled: false,
          spacedReviewPlanned: false,
          progressStateUpdated: false,
          growthProofGenerated: false,
          warnings: ['Integrity blocked: only safe metadata persisted (no mastery evidence)'],
          errors: [],
        },
        warnings: ['Integrity blocked: only safe metadata persisted (no mastery evidence)'],
        errors: [],
      };
    }

    let attemptPersisted = false;
    let stepEvidencePersisted = false;
    let masteryAggregated = false;
    let weakSkillUpdated = false;
    let revisionScheduled = false;
    let spacedReviewPlanned = false;
    let progressStateUpdated = false;
    let growthProofGenerated = false;

    const skillIds = params.skillIds ?? [];

    if (params.isPracticeAttempt && params.outcome && params.outcome !== 'not_evaluated') {
      const attemptInput: SafePracticeAttemptInput = {
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        sessionId: null,
        subject: params.subject ?? null,
        topic: params.topic ?? null,
        skillIds,
        curriculumTrack: params.curriculumTrack ?? 'unknown',
        subjectModuleId: params.subjectModuleId ?? null,
        promptSummary: params.safeSummary ?? 'Practice attempt',
        learnerAnswerSummary: params.learnerResponseSummary ?? null,
        expectedAnswerSummary: params.expectedAnswerSummary ?? null,
        outcome: params.outcome,
        hintLevelUsed: params.hintLevelUsed ?? 0,
        attemptNumber: params.attemptNumber ?? 1,
        timeSpentSeconds: null,
        confidence: params.confidence ?? 0.3,
        validationModes: params.validationModes ?? [],
        mistakeCategories: params.mistakeCategories ?? [],
      };

      const attemptResult = await practiceAttemptPersistenceService.persistPracticeAttempt(
        identity,
        attemptInput,
      );
      attemptPersisted = attemptResult.record !== null;
      if (attemptResult.warnings.length > 0) warnings.push(...attemptResult.warnings);

      if (params.safeSummary) {
        const evidenceInput: SafeStepEvidenceInput = {
          schoolId: identity.schoolId,
          tutorLearnerId: identity.studentId,
          sessionId: null,
          subject: params.subject ?? null,
          topic: params.topic ?? null,
          skillIds,
          evidenceType: params.outcome === 'correct'
            ? 'attempt_correct'
            : params.outcome === 'partially_correct'
              ? 'attempt_partially_correct'
              : 'attempt_incorrect',
          confidenceScore: params.confidence ?? 0.3,
          hintLevel: params.hintLevelUsed ?? 0,
          validationModes: params.validationModes ?? [],
          mistakeCategory: params.mistakeCategories?.[0] ?? null,
          safeSummary: params.safeSummary.slice(0, 500),
          curriculumTrack: params.curriculumTrack ?? 'unknown',
          subjectModuleId: params.subjectModuleId ?? null,
          sourceSensitive: params.isSourceSensitive,
          source: 'tutor_turn_integration',
        };

        const evidenceResult = await stepEvidencePersistenceService.persistStepEvidence(
          identity,
          evidenceInput,
        );
        stepEvidencePersisted = evidenceResult.record !== null;
        if (evidenceResult.warnings.length > 0) warnings.push(...evidenceResult.warnings);
      }
    } else if (params.safeSummary) {
      const evidenceType = params.isDeenTurn ? 'revision_needed' : 'practice_requested';
      const deenSafeSummary = params.isDeenTurn
        ? 'Deen-related learning progress metadata only. No religious claims stored as facts.'
        : (params.safeSummary.slice(0, 500));

      const evidenceInput: SafeStepEvidenceInput = {
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        sessionId: null,
        subject: params.subject ?? null,
        topic: params.topic ?? null,
        skillIds,
        evidenceType: evidenceType as any,
        confidenceScore: params.confidence ?? 0.3,
        hintLevel: params.hintLevelUsed ?? 0,
        validationModes: params.validationModes ?? [],
        mistakeCategory: params.mistakeCategories?.[0] ?? null,
        safeSummary: deenSafeSummary,
        curriculumTrack: params.curriculumTrack ?? 'unknown',
        subjectModuleId: params.subjectModuleId ?? null,
        sourceSensitive: params.isSourceSensitive,
        source: 'tutor_turn_integration',
      };

      const evidenceResult = await stepEvidencePersistenceService.persistStepEvidence(
        identity,
        evidenceInput,
      );
      stepEvidencePersisted = evidenceResult.record !== null;
      if (evidenceResult.warnings.length > 0) warnings.push(...evidenceResult.warnings);
    }

    if (params.outcome && params.outcome !== 'not_evaluated' && skillIds.length > 0) {
      for (const skillId of skillIds) {
        const aggInput: MasteryAggregationInput = {
          schoolId: identity.schoolId,
          tutorLearnerId: identity.studentId,
          subject: params.subject ?? 'general',
          topic: params.topic ?? 'general',
          skillId,
          skillLabel: skillId,
          outcome: params.outcome as any,
          hintLevel: params.hintLevelUsed ?? 0,
          confidence: params.confidence ?? 0.3,
          curriculumTrack: params.curriculumTrack ?? 'unknown',
        };

        const aggResult = await masteryEvidenceAggregationService.aggregateEvidenceFromAttempt(
          identity,
          aggInput,
        );
        if (aggResult.result) masteryAggregated = true;
        if (aggResult.warnings.length > 0) warnings.push(...aggResult.warnings);

        if (params.outcome === 'incorrect') {
          const wsResult = await weakSkillTrackingService.updateWeakSkill(identity, {
            subject: params.subject ?? 'general',
            topic: params.topic ?? 'general',
            skillId,
            skillLabel: skillId,
            isMistake: true,
            isMisconception: !!(params.mistakeCategories && params.mistakeCategories.length > 0),
            isIndependentSuccess: false,
            safeSummary: params.safeSummary ?? 'Practice attempt',
          });
          weakSkillUpdated = true;

          if (aggResult.result) {
            const revDecision = await revisionSchedulingRuntime.scheduleRevision(identity, {
              schoolId: identity.schoolId,
              tutorLearnerId: identity.studentId,
              subject: params.subject ?? 'general',
              topic: params.topic ?? 'general',
              skillId,
              skillLabel: skillId,
              currentMasteryLevel: aggResult.result.level,
              confidenceScore: aggResult.result.confidenceScore,
              mistakeCount: aggResult.result.incorrectCount,
              independentSuccessCount: aggResult.result.independentCorrectCount,
              lastAttemptAt: aggResult.result.lastAttemptAt,
              lastCorrectAt: aggResult.result.lastCorrectAt,
              lastIncorrectAt: aggResult.result.lastIncorrectAt,
            });
            revisionScheduled = revDecision.shouldSchedule;
            spacedReviewPlanned = revDecision.shouldSchedule;
          }
        }

        if (params.outcome === 'correct') {
          const wsResult = await weakSkillTrackingService.updateWeakSkill(identity, {
            subject: params.subject ?? 'general',
            topic: params.topic ?? 'general',
            skillId,
            skillLabel: skillId,
            isMistake: false,
            isMisconception: false,
            isIndependentSuccess: (params.hintLevelUsed ?? 0) === 0,
            safeSummary: params.safeSummary ?? 'Correct practice attempt',
          });
          weakSkillUpdated = true;
        }
      }
    }

    const progressResult = await learnerProgressStateService.refreshProgressState(identity);
    progressStateUpdated = progressResult.state !== null;
    if (progressResult.warnings.length > 0) warnings.push(...progressResult.warnings);

    const growthResult = await growthProofSummaryService.generateGrowthProofSummary(identity);
    growthProofGenerated = growthResult.summary !== null;
    if (growthResult.warnings.length > 0) warnings.push(...growthResult.warnings);

    const persistenceResult: Task011PersistenceResult = {
      ok: errors.length === 0,
      attemptPersisted,
      stepEvidencePersisted,
      masteryAggregated,
      weakSkillUpdated,
      revisionScheduled,
      spacedReviewPlanned,
      progressStateUpdated,
      growthProofGenerated,
      warnings,
      errors,
    };

    return {
      ok: errors.length === 0,
      requestId: params.requestId,
      persistenceResult,
      growthProofSummary: growthResult.summary,
      warnings,
      errors,
    };
  }
}

export const task011TutorTurnIntegrationService = new Task011TutorTurnIntegrationService();
