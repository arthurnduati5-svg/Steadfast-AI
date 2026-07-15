import { describe, it, expect } from 'vitest';
import { RecoveryOutcomeSafetyService } from '../services/recoveryOutcomeSafetyService';
import { RecoveryContinuationDecisionDraftService } from '../services/recoveryContinuationDecisionDraftService';
import { RecoveryIntensificationDecisionDraftService } from '../services/recoveryIntensificationDecisionDraftService';
import { RecoveryPauseDecisionDraftService } from '../services/recoveryPauseDecisionDraftService';
import { RecoveryClosureDecisionDraftService } from '../services/recoveryClosureDecisionDraftService';
import { RecoveryExitCriteriaEvaluationService } from '../services/recoveryExitCriteriaEvaluationService';
import { RecoveryOutcomeTeacherReviewPacketService } from '../services/recoveryOutcomeTeacherReviewPacketService';
import { RecoveryOutcomeDecisionSummaryService } from '../services/recoveryOutcomeDecisionSummaryService';
import { RecoveryOutcomeAuditBridge } from '../services/recoveryOutcomeAuditBridge';
import { RecoveryOutcomeIdempotencyService } from '../services/recoveryOutcomeIdempotencyService';
import {
  InMemoryRecoveryExitCriteriaEvaluationRepository,
  InMemoryRecoveryContinuationDecisionDraftRepository,
  InMemoryRecoveryIntensificationDecisionDraftRepository,
  InMemoryRecoveryPauseDecisionDraftRepository,
  InMemoryRecoveryClosureDecisionDraftRepository,
  InMemoryRecoveryOutcomeTeacherReviewPacketRepository,
  InMemoryRecoveryOutcomeDecisionSummaryRepository,
  InMemoryRecoveryOutcomeAuditRepository,
  InMemoryRecoveryOutcomeIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeRepositories';

function makeCtx(overrides?: Record<string, string>) {
  return {
    schoolId: overrides?.schoolId ?? 'school-1',
    actorId: overrides?.actorId ?? 'actor-1',
    actorRole: overrides?.actorRole ?? 'teacher',
    correlationId: overrides?.correlationId ?? 'corr-1',
    idempotencyKey: overrides?.idempotencyKey ?? 'idem-1',
    requestId: overrides?.requestId ?? 'req-1',
  };
}

describe('Package 19 — No Live Outcome Mutation Safety', () => {
  const safety = new RecoveryOutcomeSafetyService();

  describe('assertNoLiveCompletion', () => {
    it('blocks "live completion" keywords', () => {
      const r = safety.assertNoLiveCompletion('this is a live completion of the plan');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('LIVE_COMPLETION');
    });

    it('blocks "recovery complete" keywords', () => {
      const r = safety.assertNoLiveCompletion('the recovery complete is ready');
      expect(r.allowed).toBe(false);
    });

    it('allows safe summary without live keywords', () => {
      const r = safety.assertNoLiveCompletion('Student progress reviewed');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoLiveClosure', () => {
    it('blocks "closure payload" keywords', () => {
      const r = safety.assertNoLiveClosure('closure payload for plan');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('LIVE_CLOSURE');
    });

    it('blocks "live closure" keywords', () => {
      const r = safety.assertNoLiveClosure('trigger live closure now');
      expect(r.allowed).toBe(false);
    });

    it('allows safe summary', () => {
      const r = safety.assertNoLiveClosure('reviewing draft options');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoLiveAssignment', () => {
    it('blocks "assignment" keyword', () => {
      const r = safety.assertNoLiveAssignment('assign new homework');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('LIVE_ASSIGNMENT');
    });

    it('blocks "homework" keyword', () => {
      const r = safety.assertNoLiveAssignment('homework for next week');
      expect(r.allowed).toBe(false);
    });

    it('allows safe text', () => {
      const r = safety.assertNoLiveAssignment('review lesson concepts');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoLiveNotification', () => {
    it('blocks "notification" keyword', () => {
      const r = safety.assertNoLiveNotification('send notification to parent');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('LIVE_NOTIFICATION');
    });

    it('blocks "email" keyword', () => {
      const r = safety.assertNoLiveNotification('email update to teacher');
      expect(r.allowed).toBe(false);
    });

    it('allows safe text', () => {
      const r = safety.assertNoLiveNotification('draft parent update');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoScoreMutation', () => {
    it('blocks "score" keyword', () => {
      const r = safety.assertNoScoreMutation('the final score is 85');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('SCORE_MUTATION');
    });

    it('blocks "mark" keyword', () => {
      const r = safety.assertNoScoreMutation('adjust the mark for question 3');
      expect(r.allowed).toBe(false);
    });

    it('allows safe text', () => {
      const r = safety.assertNoScoreMutation('evaluation criteria met');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoMasteryMutation', () => {
    it('blocks "mastery" keyword', () => {
      const r = safety.assertNoMasteryMutation('update mastery level');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('MASTERY_MUTATION');
    });

    it('blocks "mastery level" keyword', () => {
      const r = safety.assertNoMasteryMutation('mastery level changed');
      expect(r.allowed).toBe(false);
    });

    it('allows safe text', () => {
      const r = safety.assertNoMasteryMutation('progress reviewed');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoRegradeExecution', () => {
    it('blocks "regrade" keyword', () => {
      const r = safety.assertNoRegradeExecution('regrade the exam');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('REGRADE_EXECUTION');
    });

    it('blocks "re-evaluate" keyword', () => {
      const r = safety.assertNoRegradeExecution('re-evaluate student responses');
      expect(r.allowed).toBe(false);
    });

    it('allows safe text', () => {
      const r = safety.assertNoRegradeExecution('review answers');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoGeneratedQuestion', () => {
    it('blocks "generated question" keyword', () => {
      const r = safety.assertNoGeneratedQuestion('generated question for student');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('GENERATED_QUESTION');
    });

    it('blocks "question text" keyword', () => {
      const r = safety.assertNoGeneratedQuestion('question text for quiz');
      expect(r.allowed).toBe(false);
    });

    it('allows safe text', () => {
      const r = safety.assertNoGeneratedQuestion('review previous work');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoAINarrative', () => {
    it('blocks "ai narrative" keyword', () => {
      const r = safety.assertNoAINarrative('ai narrative for summary');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('AI_NARRATIVE');
    });

    it('blocks "generated narrative" keyword', () => {
      const r = safety.assertNoAINarrative('generated narrative from model');
      expect(r.allowed).toBe(false);
    });

    it('allows safe text', () => {
      const r = safety.assertNoAINarrative('teacher observation notes');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoOCR', () => {
    it('blocks "OCR" keyword', () => {
      const r = safety.assertNoOCR('OCR scanned document');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('OCR_TEXT');
    });

    it('allows safe text', () => {
      const r = safety.assertNoOCR('typed notes');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoPDF', () => {
    it('blocks "PDF" keyword', () => {
      const r = safety.assertNoPDF('PDF export of report');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('PDF_BINARY');
    });

    it('allows safe text', () => {
      const r = safety.assertNoPDF('report summary');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertNoExternalSync', () => {
    it('blocks "external sync" keyword', () => {
      const r = safety.assertNoExternalSync('external sync to lms');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('EXTERNAL_SYNC');
    });

    it('allows safe text', () => {
      const r = safety.assertNoExternalSync('export local backup');
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertRoleAllowed', () => {
    it('allows teacher role', () => {
      const r = safety.assertRoleAllowed('teacher');
      expect(r.allowed).toBe(true);
    });

    it('allows admin role', () => {
      const r = safety.assertRoleAllowed('admin');
      expect(r.allowed).toBe(true);
    });

    it('allows system_job role', () => {
      const r = safety.assertRoleAllowed('system_job');
      expect(r.allowed).toBe(true);
    });

    it('blocks student role', () => {
      const r = safety.assertRoleAllowed('student');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('ROLE_BLOCKED');
    });

    it('blocks parent role', () => {
      const r = safety.assertRoleAllowed('parent');
      expect(r.allowed).toBe(false);
    });

    it('blocks guest role', () => {
      const r = safety.assertRoleAllowed('guest');
      expect(r.allowed).toBe(false);
    });

    it('blocks unknown role', () => {
      const r = safety.assertRoleAllowed('unknown');
      expect(r.allowed).toBe(false);
    });
  });

  describe('assertSchoolContext', () => {
    it('rejects empty schoolId', () => {
      const r = safety.assertSchoolContext('');
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
    });

    it('accepts valid schoolId', () => {
      const r = safety.assertSchoolContext('school-1');
      expect(r.allowed).toBe(true);
    });
  });

  describe('checkAllLeakageCategories', () => {
    it('detects multiple categories simultaneously', () => {
      const r = safety.checkAllLeakageCategories('score and mastery update with notification email', {
        progressSummaryId: 'ps-1', evidenceRollupId: 'er-1',
      });
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('LIVE_NOTIFICATION');
    });

    it('passes when all categories clear', () => {
      const r = safety.checkAllLeakageCategories('Student is progressing well with evidence-based support', {
        progressSummaryId: 'ps-1', evidenceRollupId: 'er-1',
      });
      expect(r.allowed).toBe(true);
      expect(r.reasonCode).toBe('SAFE');
    });

    it('fails on missing sourceRefs', () => {
      const r = safety.assertSourceRefPresent({});
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('SOURCE_REFS_MISSING');
    });
  });

  describe('compositeSafetyCheck', () => {
    it('returns blocked when forbidden field present', () => {
      const r = safety.compositeSafetyCheck({ liveRecoveryCompletionPayload: { data: 'x' } });
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('FORBIDDEN_FIELD');
    });

    it('returns blocked when summary contains leakage', () => {
      const r = safety.compositeSafetyCheck({
        safeDecisionSummary: 'final score is 95',
        sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
      });
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('SCORE_MUTATION');
    });

    it('passes when everything is safe', () => {
      const r = safety.compositeSafetyCheck({
        safeDecisionSummary: 'Student reviewed concepts',
        sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
      });
      expect(r.allowed).toBe(true);
    });
  });

  describe('assertReadinessSourceRefs', () => {
    it('passes when required readiness refs present', () => {
      const r = safety.assertReadinessSourceRefs({ progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' });
      expect(r.allowed).toBe(true);
    });

    it('fails when missing progressSummaryId', () => {
      const r = safety.assertReadinessSourceRefs({ evidenceRollupId: 'er-1' });
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe('READINESS_REF_MISSING');
    });
  });

  describe('Student and parent roles cannot create records via service', () => {
    function buildServices() {
      const s = new RecoveryOutcomeSafetyService();
      const a = new RecoveryOutcomeAuditBridge(new InMemoryRecoveryOutcomeAuditRepository());
      const i = new RecoveryOutcomeIdempotencyService(new InMemoryRecoveryOutcomeIdempotencyRepository());
      return { s, a, i };
    }

    it('student blocked from exit criteria evaluation', async () => {
      const { s, a, i } = buildServices();
      const svc = new RecoveryExitCriteriaEvaluationService(new InMemoryRecoveryExitCriteriaEvaluationRepository() as any, s, a, i);
      const r = await svc.createExitCriteriaEvaluation(makeCtx({ actorRole: 'student' }), {
        schoolId: 'school-1', studentRef: 's1', resultRecoveryPlanId: 'p1',
        recoveryExitCriteriaId: 'c1', evaluationResult: 'met',
        safeEvaluationSummary: 'ok', evaluationDetailsJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
      });
      expect(r.ok).toBe(false);
      expect(r.reasonCode).toBe('ROLE_BLOCKED');
    });

    it('student blocked from continuation draft', async () => {
      const { s, a, i } = buildServices();
      const svc = new RecoveryContinuationDecisionDraftService(new InMemoryRecoveryContinuationDecisionDraftRepository(), s, a, i);
      const r = await svc.createContinuationDecisionDraft(makeCtx({ actorRole: 'student' }), { schoolId: 's', studentRef: 's', resultRecoveryPlanId: 'p', safeDecisionSummary: 'ok', rationaleJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } } as any);
      expect(r.ok).toBe(false);
    });

    it('student blocked from intensification draft', async () => {
      const { s, a, i } = buildServices();
      const svc = new RecoveryIntensificationDecisionDraftService(new InMemoryRecoveryIntensificationDecisionDraftRepository(), s, a, i);
      const r = await svc.createIntensificationDecisionDraft(makeCtx({ actorRole: 'student' }), { schoolId: 's', studentRef: 's', resultRecoveryPlanId: 'p', safeDecisionSummary: 'ok', rationaleJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } } as any);
      expect(r.ok).toBe(false);
    });

    it('student blocked from pause draft', async () => {
      const { s, a, i } = buildServices();
      const svc = new RecoveryPauseDecisionDraftService(new InMemoryRecoveryPauseDecisionDraftRepository(), s, a, i);
      const r = await svc.createPauseDecisionDraft(makeCtx({ actorRole: 'student' }), { schoolId: 's', studentRef: 's', resultRecoveryPlanId: 'p', safeDecisionSummary: 'ok', rationaleJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } } as any);
      expect(r.ok).toBe(false);
    });

    it('student blocked from closure draft', async () => {
      const { s, a, i } = buildServices();
      const svc = new RecoveryClosureDecisionDraftService(new InMemoryRecoveryClosureDecisionDraftRepository(), s, a, i);
      const r = await svc.createClosureDecisionDraft(makeCtx({ actorRole: 'student' }), { schoolId: 's', studentRef: 's', resultRecoveryPlanId: 'p', closureType: 'graduation', safeDecisionSummary: 'ok', rationaleJson: {}, futureReviewRefsJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } } as any);
      expect(r.ok).toBe(false);
    });

    it('student blocked from teacher review packet', async () => {
      const { s, a, i } = buildServices();
      const svc = new RecoveryOutcomeTeacherReviewPacketService(new InMemoryRecoveryOutcomeTeacherReviewPacketRepository(), s, a, i);
      const r = await svc.createTeacherReviewPacket(makeCtx({ actorRole: 'student' }), { schoolId: 's', studentRef: 's', teacherRef: 't', resultRecoveryPlanId: 'p', safeReviewPacketSummary: 'ok', readinessSnapshotJson: {}, decisionDraftRefsJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } });
      expect(r.ok).toBe(false);
    });

    it('student blocked from outcome decision summary', async () => {
      const { s, a, i } = buildServices();
      const svc = new RecoveryOutcomeDecisionSummaryService(new InMemoryRecoveryOutcomeDecisionSummaryRepository(), s, a, i);
      const r = await svc.createOutcomeDecisionSummary(makeCtx({ actorRole: 'student' }), { schoolId: 's', studentRef: 's', safeSummary: 'ok', decisionCountsJson: {}, topDecisionsJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } });
      expect(r.ok).toBe(false);
    });

    it('missing schoolId blocks all service operations', async () => {
      const { s, a, i } = buildServices();
      const svc = new RecoveryOutcomeDecisionSummaryService(new InMemoryRecoveryOutcomeDecisionSummaryRepository(), s, a, i);
      const r = await svc.createOutcomeDecisionSummary(makeCtx({ schoolId: '' }), { schoolId: '', studentRef: 's', safeSummary: 'ok', decisionCountsJson: {}, topDecisionsJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } });
      expect(r.ok).toBe(false);
      expect(r.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
    });
  });
});
