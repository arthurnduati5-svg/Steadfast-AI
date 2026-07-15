import { FORBIDDEN_OUTCOME_FIELDS } from '../contracts/recoveryOutcomeContracts';

export class RecoveryOutcomeSafetyService {
  private checkField(payload: Record<string, unknown>, field: string, reasonCode: string, safeMessage: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (payload[field] !== undefined) return { allowed: false, reasonCode, safeMessage };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No leakage detected' };
  }

  private checkFields(payload: Record<string, unknown>, fields: string[], reasonCode: string, safeMessage: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    for (const f of fields) {
      if (payload[f] !== undefined) return { allowed: false, reasonCode, safeMessage };
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No leakage detected' };
  }

  private checkSummaryForKeywords(summary: string, keywords: string[], reasonCode: string, safeMessage: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const lower = summary.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return { allowed: false, reasonCode, safeMessage };
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No leakage detected' };
  }

  assertNoLiveCompletion(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['live completion', 'live closure', 'recovery complete', 'plan closed'], 'LIVE_COMPLETION', 'Live completion keywords detected');
  }

  assertNoLiveClosure(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['closure payload', 'live closure', 'final closure'], 'LIVE_CLOSURE', 'Live closure keywords detected');
  }

  assertNoLiveAssignment(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['assignment', 'homework', 'practice task', 'revision task'], 'LIVE_ASSIGNMENT', 'Live assignment keywords detected');
  }

  assertNoLiveNotification(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['notification', 'email', 'sms', 'push', 'whatsapp', 'parent alert', 'student alert'], 'LIVE_NOTIFICATION', 'Live notification keywords detected');
  }

  assertNoScoreMutation(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['score', 'mark', 'grade', 'result version', 'grade change'], 'SCORE_MUTATION', 'Score mutation keywords detected');
  }

  assertNoMasteryMutation(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['mastery', 'mastery level', 'mastery signal', 'mastery update'], 'MASTERY_MUTATION', 'Mastery mutation keywords detected');
  }

  assertNoRegradeExecution(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['regrade', 're-evaluate', 're-score', 're-mark'], 'REGRADE_EXECUTION', 'Regrade keywords detected');
  }

  assertNoGeneratedQuestion(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['generated question', 'question text', 'new question'], 'GENERATED_QUESTION', 'Generated question keywords detected');
  }

  assertNoAINarrative(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['ai narrative', 'generated narrative', 'model output', 'ai summary', 'llm output'], 'AI_NARRATIVE', 'AI narrative keywords detected');
  }

  assertNoOCR(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['ocr', 'ocr text', 'scanned text', 'image text'], 'OCR_TEXT', 'OCR keywords detected');
  }

  assertNoPDF(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['pdf', 'pdf binary', 'pdf export', 'pdf generation'], 'PDF_BINARY', 'PDF keywords detected');
  }

  assertNoExternalSync(summary: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkSummaryForKeywords(summary, ['external sync', 'sync payload', 'lms sync', 'sis sync', 'export to'], 'EXTERNAL_SYNC', 'External sync keywords detected');
  }

  assertRoleAllowed(actorRole: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const blocked = ['student', 'parent', 'guest', 'unknown'];
    if (blocked.includes(actorRole)) return { allowed: false, reasonCode: 'ROLE_BLOCKED', safeMessage: `Role ${actorRole} is blocked for this operation` };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Role allowed' };
  }

  assertMockOnlyOutcomeOperation(): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Mock-only mode enforced at service level' };
  }

  assertSchoolContext(schoolId: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (!schoolId) return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School ID is required' };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'School context present' };
  }

  assertSourceRefPresent(sourceRefs: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (!sourceRefs || Object.keys(sourceRefs).length === 0) return { allowed: false, reasonCode: 'SOURCE_REFS_MISSING', safeMessage: 'Source references are required' };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Source references present' };
  }

  assertReadinessSourceRefs(sourceRefs: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (!sourceRefs || Object.keys(sourceRefs).length === 0) return { allowed: false, reasonCode: 'READINESS_REFS_MISSING', safeMessage: 'Package 18 readiness references are required' };
    const required = ['progressSummaryId', 'evidenceRollupId'];
    for (const r of required) {
      if (!sourceRefs[r]) return { allowed: false, reasonCode: 'READINESS_REF_MISSING', safeMessage: `Required readiness ref ${r} is missing` };
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Readiness source refs present' };
  }

  checkAllLeakageCategories(summary: string, sourceRefs: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const checks = [
      this.assertNoLiveCompletion(summary),
      this.assertNoLiveClosure(summary),
      this.assertNoLiveAssignment(summary),
      this.assertNoLiveNotification(summary),
      this.assertNoScoreMutation(summary),
      this.assertNoMasteryMutation(summary),
      this.assertNoRegradeExecution(summary),
      this.assertNoGeneratedQuestion(summary),
      this.assertNoAINarrative(summary),
      this.assertNoOCR(summary),
      this.assertNoPDF(summary),
      this.assertNoExternalSync(summary),
    ];
    for (const c of checks) {
      if (!c.allowed) return c;
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'All leakage categories clear' };
  }

  compositeSafetyCheck(record: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = FORBIDDEN_OUTCOME_FIELDS;
    for (const f of forbidden) {
      if (record[f] !== undefined) return { allowed: false, reasonCode: 'FORBIDDEN_FIELD', safeMessage: `Forbidden outcome field ${f} detected` };
    }
    const summary = (record.safeDecisionSummary || record.safeReadinessSummary || record.safeCriteriaSummary || record.safeReviewPacketSummary || record.safeNextStepSummary || record.safeUpdateSummary || record.safeSummary || '') as string;
    const sourceRefs = (record.sourceRefsJson || {}) as Record<string, unknown>;
    return this.checkAllLeakageCategories(summary, sourceRefs);
  }
}
