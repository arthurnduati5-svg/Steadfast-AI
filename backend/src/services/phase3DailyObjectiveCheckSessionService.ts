import { phase3DailyObjectiveCheckRepository } from './phase3DailyObjectiveCheckRepository';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';
import { phase3ObjectiveCheckBlueprintService } from './phase3ObjectiveCheckBlueprintService';
import { phase3DailyObjectiveCheckAuditService } from './phase3DailyObjectiveCheckAuditService';
import { rejectForbiddenDailyObjectiveCheckPayloadFields, validateDailyObjectiveCheckSessionStartInput } from '../lib/phase3DailyObjectiveCheckValidation';

function nowISO(): string { return new Date().toISOString(); }
function safeTitle(): string { return 'Daily Objective Check'; }
function safeMessageFirstStep(): string { return 'This objective is ready for a short check. Start with how confident you feel before trying.'; }
function sourceRequiredMessage(): string { return 'This objective needs an approved source or teacher confirmation before checks can continue.'; }
function blockedMessage(): string { return 'This objective check cannot proceed due to a policy boundary.'; }
function buildLearnerResponse(session: any, message: string, nextStep: string): any {
  return { checkSessionId: session.checkSessionId, objectiveId: session.objectiveId, dailySeedId: session.dailySeedId, status: session.status, safeTitle: safeTitle(), safeMessage: message, nextStep, safeEvidenceRefs: session.safeEvidenceRefs || [], createdAt: session.createdAt, updatedAt: session.updatedAt };
}

export class Phase3DailyObjectiveCheckSessionService {
  startDailyObjectiveCheckSession(input: {
    schoolId: string; studentId: string; classId?: string; subjectId: string; topicId?: string; skillId?: string; objectiveId: string; dailySeedId?: string; blueprintId?: string; sourceTruthStatus: string;
  }): { error?: string; session?: any; learnerResponse?: any } {
    const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields(input as any);
    if (forbiddenErrors.length > 0) return { error: 'Forbidden fields in request.' };
    const validation = validateDailyObjectiveCheckSessionStartInput(input as any);
    if (!validation.ok) return { error: (validation as any).errors[0]?.message || 'Validation failed.' };

    // Canonical objective resolution — must come from Knowledge Graph / Phase3ObjectiveRepository
    // Never synthesize skillId/topicId with Date.now()/Math.random
    const objective = phase3ObjectiveRepository.getObjectiveById(input.objectiveId);
    if (!objective) return { error: 'Objective not found.' };
    if (objective.schoolId !== input.schoolId) return { error: 'Cross-school objective access denied.' };
    if ((objective as any).isArchived) return { error: 'Objective is archived and cannot start a check.' };

    // Validate source/governance status permits student use
    const srcStatus = (objective as any).sourceTruthStatus?.status || (objective as any).sourceTruthStatus || 'approved';
    const blockedStatuses = ['source_required', 'content_gap', 'blocked', 'unknown'];
    if (blockedStatuses.includes(srcStatus)) {
      const fakeSession: any = {
        checkSessionId: 'blocked', schoolId: input.schoolId, studentId: input.studentId,
        classId: input.classId || (objective as any).classId || '', subjectId: input.subjectId || (objective as any).subjectId || '',
        topicId: input.topicId || (objective as any).topicId || '', skillId: input.skillId || (objective as any).skillId,
        objectiveId: input.objectiveId, dailySeedId: input.dailySeedId, blueprintId: '', sourceTruthStatus: srcStatus,
        status: 'source_required', requiredSteps: [], completedSteps: [], safeSignalBuckets: [], safeEvidenceRefs: [], modeDestinationsUsed: [], attemptCount: 0,
        antiCheatSignalLabels: [], learnerSafeReason: sourceRequiredMessage(), teacherSafeReason: 'Source truth is missing or blocked.', createdAt: nowISO(), updatedAt: nowISO(), version: 1,
      };
      return { session: fakeSession, learnerResponse: buildLearnerResponse(fakeSession, sourceRequiredMessage(), 'Speak to your teacher about this objective.') };
    }

    // Resolve canonical topic/skill/objective references — never invent IDs
    // Do not generate missing skillId using Date.now()/Math.random/"skill_"+...
    let blueprint = phase3ObjectiveCheckBlueprintService.getObjectiveCheckBlueprint(input.objectiveId);
    if (!blueprint) {
      const created: any = phase3ObjectiveCheckBlueprintService.createObjectiveCheckBlueprint(input.objectiveId, input.schoolId, 'learner');
      if (created && 'error' in created) return { error: created.error };
      blueprint = created as any;
    }

    const requiredSteps: string[] = ['confidence_before', 'attempt'];
    if ((blueprint as any).teachBackRequired) requiredSteps.push('teach_back');
    if ((blueprint as any).transferQuestionRequired) requiredSteps.push('transfer_check');
    if ((blueprint as any).delayedRecallRequired) requiredSteps.push('delayed_recall');
    if ((blueprint as any).confidenceAfterRequired) requiredSteps.push('confidence_after');

    // Resolve canonical refs from objective, not from synthetic generation
    const topicId = input.topicId || (objective as any).topicId || '';
    const skillId = input.skillId || (objective as any).skillId;

    const session = phase3DailyObjectiveCheckRepository.createCheckSession({
      schoolId: input.schoolId, studentId: input.studentId,
      classId: input.classId || (objective as any).classId || '',
      subjectId: input.subjectId || (objective as any).subjectId || '',
      topicId, skillId,
      objectiveId: input.objectiveId, dailySeedId: input.dailySeedId,
      blueprintId: (blueprint as any).blueprintId,
      sourceTruthStatus: srcStatus, requiredSteps,
      learnerSafeReason: 'Daily objective check session started.', teacherSafeReason: 'Check session started.',
    });

    const startStatus = 'confidence_before_required';
    const updatedSession = phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(session.checkSessionId, startStatus, { requiredSteps });
    phase3DailyObjectiveCheckAuditService.recordDailyObjectiveCheckSessionStarted(input.schoolId, input.studentId, 'learner', input.studentId, input.objectiveId, session.checkSessionId);
    const finalSession = updatedSession || session;
    const learnerResponse = buildLearnerResponse(finalSession, safeMessageFirstStep(), 'Record your confidence before starting the check.');
    (learnerResponse as any).confidencePrompt = 'How confident do you feel about this objective?';
    return { session: finalSession, learnerResponse };
  }

  getDailyObjectiveCheckSession(checkSessionId: string): any | null {
    return phase3DailyObjectiveCheckRepository.getCheckSessionById(checkSessionId);
  }

  async getDailyObjectiveCheckSessionAsync(checkSessionId: string): Promise<any | null> {
    return phase3DailyObjectiveCheckRepository.getCheckSessionByIdAsync(checkSessionId);
  }

  listLearnerDailyObjectiveCheckSessions(schoolId: string, studentId: string): any[] {
    return phase3DailyObjectiveCheckRepository.listCheckSessionsByLearner(schoolId, studentId);
  }

  async listLearnerDailyObjectiveCheckSessionsAsync(schoolId: string, studentId: string): Promise<any[]> {
    return phase3DailyObjectiveCheckRepository.listCheckSessionsByLearnerAsync(schoolId, studentId);
  }

  expireStaleDailyObjectiveCheckSessions(): number {
    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000;
    let expiredCount = 0;
    for (const session of phase3DailyObjectiveCheckRepository.listTeacherCheckSummaries('')) {
      const age = now - new Date((session as any).updatedAt).getTime();
      if (age > staleThreshold && ((session as any).status === 'started' || (session as any).status === 'in_progress' || (session as any).status === 'confidence_before_required')) {
        phase3DailyObjectiveCheckRepository.expireCheckSession((session as any).checkSessionId);
        expiredCount++;
      }
    }
    return expiredCount;
  }

  async expireStaleDailyObjectiveCheckSessionsAsync(): Promise<number> {
    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000;
    let expiredCount = 0;
    const sessions = await phase3DailyObjectiveCheckRepository.listTeacherCheckSummariesAsync('');
    for (const session of sessions) {
      const age = now - new Date((session as any).updatedAt).getTime();
      if (age > staleThreshold && ((session as any).status === 'started' || (session as any).status === 'in_progress' || (session as any).status === 'confidence_before_required')) {
        await phase3DailyObjectiveCheckRepository.expireCheckSessionAsync((session as any).checkSessionId);
        expiredCount++;
      }
    }
    return expiredCount;
  }

  resolveNextRequiredCheckStep(session: any): string {
    const completed = new Set(session.completedSteps || []);
    for (const step of (session.requiredSteps || [])) {
      if (!completed.has(step)) return step;
    }
    return 'complete';
  }

  blockSessionForSourceRequired(checkSessionId: string): any | null {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(checkSessionId, 'source_required', { learnerSafeReason: sourceRequiredMessage(), teacherSafeReason: 'Check blocked - source truth is missing.' });
  }

  async blockSessionForSourceRequiredAsync(checkSessionId: string): Promise<any | null> {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatusAsync(checkSessionId, 'source_required', { learnerSafeReason: sourceRequiredMessage(), teacherSafeReason: 'Check blocked - source truth is missing.' });
  }

  blockSessionForPolicyBoundary(checkSessionId: string, reason: string): any | null {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(checkSessionId, 'blocked', { learnerSafeReason: blockedMessage(), teacherSafeReason: reason });
  }

  async blockSessionForPolicyBoundaryAsync(checkSessionId: string, reason: string): Promise<any | null> {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatusAsync(checkSessionId, 'blocked', { learnerSafeReason: blockedMessage(), teacherSafeReason: reason });
  }

  async startDailyObjectiveCheckSessionAsync(input: {
    schoolId: string; studentId: string; classId?: string; subjectId: string; topicId?: string; skillId?: string; objectiveId: string; dailySeedId?: string; blueprintId?: string; sourceTruthStatus: string;
  }): Promise<{ error?: string; session?: any; learnerResponse?: any }> {
    const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields(input as any);
    if (forbiddenErrors.length > 0) return { error: 'Forbidden fields in request.' };
    const validation = validateDailyObjectiveCheckSessionStartInput(input as any);
    if (!validation.ok) return { error: (validation as any).errors[0]?.message || 'Validation failed.' };

    const objective = await phase3ObjectiveRepository.getObjectiveByIdAsync(input.objectiveId);
    if (!objective) return { error: 'Objective not found.' };
    if ((objective as any).schoolId !== input.schoolId && (objective as any).schoolId !== 'unknown') return { error: 'Cross-school objective access denied.' };
    if ((objective as any).isArchived) return { error: 'Objective is archived and cannot start a check.' };

    const srcStatus = (objective as any).sourceTruthStatus?.status || (objective as any).sourceTruthStatus || 'approved';
    const blockedStatuses = ['source_required', 'content_gap', 'blocked', 'unknown'];
    if (blockedStatuses.includes(srcStatus)) {
      const fakeSession: any = {
        checkSessionId: 'blocked', schoolId: input.schoolId, studentId: input.studentId,
        classId: input.classId || (objective as any).classId || '', subjectId: input.subjectId || (objective as any).subjectId || '',
        topicId: input.topicId || (objective as any).topicId || '', skillId: input.skillId || (objective as any).skillId,
        objectiveId: input.objectiveId, dailySeedId: input.dailySeedId, blueprintId: '', sourceTruthStatus: srcStatus,
        status: 'source_required', requiredSteps: [], completedSteps: [], safeSignalBuckets: [], safeEvidenceRefs: [], modeDestinationsUsed: [], attemptCount: 0,
        antiCheatSignalLabels: [], learnerSafeReason: sourceRequiredMessage(), teacherSafeReason: 'Source truth is missing or blocked.', createdAt: nowISO(), updatedAt: nowISO(), version: 1,
      };
      return { session: fakeSession, learnerResponse: buildLearnerResponse(fakeSession, sourceRequiredMessage(), 'Speak to your teacher about this objective.') };
    }

    let blueprint = phase3ObjectiveCheckBlueprintService.getObjectiveCheckBlueprint(input.objectiveId);
    if (!blueprint) {
      const created: any = phase3ObjectiveCheckBlueprintService.createObjectiveCheckBlueprint(input.objectiveId, input.schoolId, 'learner');
      if (created && 'error' in created) return { error: created.error };
      blueprint = created as any;
    }

    const requiredSteps: string[] = ['confidence_before', 'attempt'];
    if ((blueprint as any).teachBackRequired) requiredSteps.push('teach_back');
    if ((blueprint as any).transferQuestionRequired) requiredSteps.push('transfer_check');
    if ((blueprint as any).delayedRecallRequired) requiredSteps.push('delayed_recall');
    if ((blueprint as any).confidenceAfterRequired) requiredSteps.push('confidence_after');

    const topicId = input.topicId || (objective as any).topicId || '';
    const skillId = input.skillId || (objective as any).skillId;

    const session = await phase3DailyObjectiveCheckRepository.createCheckSessionAsync({
      schoolId: input.schoolId, studentId: input.studentId,
      classId: input.classId || (objective as any).classId || '',
      subjectId: input.subjectId || (objective as any).subjectId || '',
      topicId, skillId,
      objectiveId: input.objectiveId, dailySeedId: input.dailySeedId,
      blueprintId: (blueprint as any).blueprintId,
      sourceTruthStatus: srcStatus, requiredSteps,
      learnerSafeReason: 'Daily objective check session started.', teacherSafeReason: 'Check session started.',
    });

    const startStatus = 'confidence_before_required';
    const updatedSession = await phase3DailyObjectiveCheckRepository.updateCheckSessionStatusAsync(session.checkSessionId, startStatus, { requiredSteps });
    phase3DailyObjectiveCheckAuditService.recordDailyObjectiveCheckSessionStarted(input.schoolId, input.studentId, 'learner', input.studentId, input.objectiveId, session.checkSessionId);
    const finalSession = updatedSession || session;
    const learnerResponse = buildLearnerResponse(finalSession, safeMessageFirstStep(), 'Record your confidence before starting the check.');
    (learnerResponse as any).confidencePrompt = 'How confident do you feel about this objective?';
    return { session: finalSession, learnerResponse };
  }
}

export const phase3DailyObjectiveCheckSessionService = new Phase3DailyObjectiveCheckSessionService();
