import type {
  ResultReportCardSafeEnvelope,
  ResultReportCardCommandContext,
} from '../contracts/resultReportCardContracts';
import type { ResultReportCardSection } from '../contracts/resultReportCardSectionContracts';
import type { ResultReportCardSectionRepository, ResultReportCardEvidenceLinkRepository } from '../contracts/resultReportCardRepositoryContracts';
import type { ResultReportCardSafetyService } from './resultReportCardSafetyService';
import type { ResultReportCardAuditBridge } from './resultReportCardAuditBridge';
import type { ResultReportCardIdempotencyService } from './resultReportCardIdempotencyService';
import { evaluateReportCardSectionCompositionPolicy } from '../policies/resultReportCardPolicyDefinitions';

type SectionInput = {
  resultReportCardAssemblyId: string;
  safeHeading: string;
  safeSummary: string;
  safeBodyJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  redactionRulesJson?: Record<string, unknown>;
};

export class ResultReportCardSectionComposer {
  constructor(
    private sectionRepo: ResultReportCardSectionRepository,
    private evidenceRepo: ResultReportCardEvidenceLinkRepository,
    private safetyService: ResultReportCardSafetyService,
    private auditBridge: ResultReportCardAuditBridge,
    private idempotencyService: ResultReportCardIdempotencyService,
  ) {}

  private envelope(
    ctx: ResultReportCardCommandContext,
    overrides: Partial<ResultReportCardSafeEnvelope>,
  ): ResultReportCardSafeEnvelope {
    return {
      ok: true,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
      nextAllowedActions: [],
      ...overrides,
    };
  }

  private async composeSection(
    ctx: ResultReportCardCommandContext,
    sectionKey: string,
    sectionType: string,
    sectionOrder: number,
    idempotencyKey: string,
    input: {
      resultReportCardAssemblyId: string;
      safeHeading: string;
      safeSummary: string;
      safeBodyJson?: Record<string, unknown>;
      sourceRefsJson?: Record<string, unknown>;
      allowedFieldNamesJson?: Record<string, unknown>;
      blockedFieldNamesJson?: Record<string, unknown>;
      redactionRulesJson?: Record<string, unknown>;
    },
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx, idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx, idempotencyKey);
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const section = await this.sectionRepo.create({
        resultReportCardAssemblyId: input.resultReportCardAssemblyId,
        sectionKey,
        sectionType,
        sectionOrder,
        safeHeading: input.safeHeading,
        safeSummary: input.safeSummary,
        safeBodyJson: input.safeBodyJson,
        sourceRefsJson: input.sourceRefsJson,
        allowedFieldNamesJson: input.allowedFieldNamesJson,
        blockedFieldNamesJson: input.blockedFieldNamesJson,
        redactionRulesJson: input.redactionRulesJson,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordSectionComposed(ctx, section);
      await this.idempotencyService.completeOperation(startIdem, section.resultReportCardSectionId, `${sectionType} section composed`);
      return this.envelope(ctx, {
        resourceId: section.resultReportCardSectionId,
        resourceVersion: section.createdAt,
        status: section.sectionStatus,
        safeMessage: `${sectionType} section composed successfully`,
        data: section,
        nextAllowedActions: ['sealSection'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: `Failed to compose ${sectionType} section`, reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async composeResultOverviewSection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoAiNarrativeLeakage(input.safeBodyJson ?? {});
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'result_overview', 'result_overview', 1, 'composeResultOverviewSection', input);
  }

  async composeStrengthsSection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoAiNarrativeLeakage(input.safeBodyJson ?? {});
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'strengths', 'strengths', 2, 'composeStrengthsSection', input);
  }

  async composeGrowthAreasSection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoAiNarrativeLeakage(input.safeBodyJson ?? {});
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'growth_areas', 'growth_areas', 3, 'composeGrowthAreasSection', input);
  }

  async composeObjectiveMasterySection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoRawMasteryDeltaLeakage(input.safeBodyJson ?? {});
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'objective_mastery', 'objective_mastery', 4, 'composeObjectiveMasterySection', input);
  }

  async composePracticeNextStepsSection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoAiNarrativeLeakage(input.safeBodyJson ?? {});
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'practice_next_steps', 'practice_next_steps', 5, 'composePracticeNextStepsSection', input);
  }

  async composeParentSupportGuidanceSection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoAiNarrativeLeakage(input.safeBodyJson ?? {});
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'parent_support_guidance', 'parent_support_guidance', 6, 'composeParentSupportGuidanceSection', input);
  }

  async composeStudentReflectionPromptSection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoAiNarrativeLeakage(input.safeBodyJson ?? {});
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'student_reflection_prompt', 'student_reflection_prompt', 7, 'composeStudentReflectionPromptSection', input);
  }

  async composeTeacherReviewNoteSection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoTeacherOnlyLeakage(input.safeBodyJson ?? {}, 'teacher');
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'teacher_review_note', 'teacher_review_note', 8, 'composeTeacherReviewNoteSection', input);
  }

  async composeAdminAuditSummarySection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoTeacherOnlyLeakage(input.safeBodyJson ?? {}, 'admin');
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'admin_audit_summary', 'admin_audit_summary', 9, 'composeAdminAuditSummarySection', input);
  }

  async composeDeliveryReadinessSummarySection(
    ctx: ResultReportCardCommandContext,
    input: SectionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardSectionCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const safetyCheck = await this.safetyService.assertNoNotificationPayloadLeakage(input.safeBodyJson ?? {});
    if (!safetyCheck.safe) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', safeSummary: safetyCheck.safeMessage ?? 'Safety check failed' });
      return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage ?? 'Safety check failed', reasonCode: safetyCheck.reasonCode ?? 'SAFETY_BLOCKED', status: 'blocked' });
    }

    return this.composeSection(ctx, 'delivery_readiness_summary', 'delivery_readiness_summary', 10, 'composeDeliveryReadinessSummarySection', input);
  }

  async sealSection(ctx: ResultReportCardCommandContext, sectionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const section = await this.sectionRepo.getById(sectionId);
    if (!section) return this.envelope(ctx, { ok: false, safeMessage: 'Section not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (section.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (section.sectionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Section already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.sectionRepo.updateStatus(sectionId, 'sealed');
    await this.auditBridge.recordSectionSealed(ctx, section);
    return this.envelope(ctx, { resourceId: sectionId, status: 'sealed', safeMessage: 'Section sealed' });
  }

  async blockSection(ctx: ResultReportCardCommandContext, sectionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const section = await this.sectionRepo.getById(sectionId);
    if (!section) return this.envelope(ctx, { ok: false, safeMessage: 'Section not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (section.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (section.sectionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Section already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.sectionRepo.updateStatus(sectionId, 'blocked');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: 'BLOCKED', safeSummary: 'Section blocked' });
    return this.envelope(ctx, { resourceId: sectionId, status: 'blocked', safeMessage: 'Section blocked' });
  }

  async voidSection(ctx: ResultReportCardCommandContext, sectionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const section = await this.sectionRepo.getById(sectionId);
    if (!section) return this.envelope(ctx, { ok: false, safeMessage: 'Section not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (section.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (section.sectionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Section already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.sectionRepo.updateStatus(sectionId, 'void');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', reasonCode: 'VOIDED', safeSummary: 'Section voided' });
    return this.envelope(ctx, { resourceId: sectionId, status: 'void', safeMessage: 'Section voided' });
  }

  async getSection(ctx: ResultReportCardCommandContext, sectionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const section = await this.sectionRepo.getById(sectionId);
    if (!section) return this.envelope(ctx, { ok: false, safeMessage: 'Section not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (section.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    return this.envelope(ctx, { resourceId: section.resultReportCardSectionId, status: section.sectionStatus, safeMessage: 'Section found', data: section });
  }

  async listSectionsForAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const sections = await this.sectionRepo.listByAssemblyId(assemblyId);
    return this.envelope(ctx, { safeMessage: `Found ${sections.length} sections`, data: sections });
  }
}
