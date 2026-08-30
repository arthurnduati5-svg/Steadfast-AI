import { PHASE3_CONFIDENCE_LABELS } from '../contracts/phase3ObjectiveMasteryContracts';
import { phase3DailyObjectiveCheckRepository } from './phase3DailyObjectiveCheckRepository';
import { phase3DailyObjectiveCheckAuditService } from './phase3DailyObjectiveCheckAuditService';
import { validateDailyObjectiveConfidenceInput } from '../lib/phase3DailyObjectiveCheckValidation';

function nowISO(): string { return new Date().toISOString(); }
const allowedConfidenceLevels = [...PHASE3_CONFIDENCE_LABELS] as string[];

export class Phase3DailyObjectiveConfidenceService {
  recordConfidenceBefore(input: { checkSessionId: string; schoolId: string; studentId: string; confidenceLevel: string; checkpointType: 'before' | 'after' }): { error?: string; checkpoint?: any; session?: any } {
    const validation = validateDailyObjectiveConfidenceInput(input as any);
    if (!(validation as any).ok) return { error: (validation as any).errors[0]?.message || 'Validation failed.' };
    const session: any = phase3DailyObjectiveCheckRepository.getCheckSessionById(input.checkSessionId);
    if (!session) return { error: 'Check session not found.' };
    if (session.schoolId !== input.schoolId) return { error: 'Cross-school access denied.' };
    if (session.studentId !== input.studentId) return { error: 'Cross-learner access denied.' };
    if (session.status === 'completed' || session.status === 'expired' || session.status === 'source_required' || session.status === 'blocked' || session.status === 'COMPLETED' || session.status === 'COMPLETING') {
      return { error: `Cannot record confidence when session is ${session.status}.` };
    }
    const checkpoint = phase3DailyObjectiveCheckRepository.recordConfidenceCheckpoint({
      checkSessionId: input.checkSessionId, schoolId: input.schoolId, studentId: input.studentId, objectiveId: session.objectiveId, checkpointType: 'before', confidenceLevel: input.confidenceLevel,
    });
    // Mark step as completed in durable state; confidence_before is server-owned
    phase3DailyObjectiveCheckRepository.markRequiredStepCompleted(input.checkSessionId, 'confidence_before');
    const updatedSession = phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(input.checkSessionId, 'in_progress', { confidenceBefore: input.confidenceLevel });
    phase3DailyObjectiveCheckAuditService.recordDailyObjectiveConfidenceBeforeRecorded(input.schoolId, input.studentId, 'learner', input.studentId, session.objectiveId, input.checkSessionId);
    return { checkpoint, session: updatedSession || session };
  }

  async recordConfidenceBeforeAsync(input: { checkSessionId: string; schoolId: string; studentId: string; confidenceLevel: string; checkpointType: 'before' | 'after' }): Promise<{ error?: string; checkpoint?: any; session?: any }> {
    const validation = validateDailyObjectiveConfidenceInput(input as any);
    if (!(validation as any).ok) return { error: (validation as any).errors[0]?.message || 'Validation failed.' };
    const session: any = await phase3DailyObjectiveCheckRepository.getCheckSessionByIdAsync(input.checkSessionId);
    if (!session) return { error: 'Check session not found.' };
    if (session.schoolId !== input.schoolId) return { error: 'Cross-school access denied.' };
    if (session.studentId !== input.studentId) return { error: 'Cross-learner access denied.' };
    if (session.status === 'completed' || session.status === 'expired' || session.status === 'source_required' || session.status === 'blocked' || session.status === 'COMPLETED' || session.status === 'COMPLETING') {
      return { error: `Cannot record confidence when session is ${session.status}.` };
    }
    const checkpoint = await phase3DailyObjectiveCheckRepository.recordConfidenceCheckpointAsync({
      checkSessionId: input.checkSessionId, schoolId: input.schoolId, studentId: input.studentId, objectiveId: session.objectiveId, checkpointType: 'before', confidenceLevel: input.confidenceLevel,
    });
    await phase3DailyObjectiveCheckRepository.markRequiredStepCompletedAsync(input.checkSessionId, 'confidence_before');
    const updatedSession = await phase3DailyObjectiveCheckRepository.updateCheckSessionStatusAsync(input.checkSessionId, 'in_progress', { confidenceBefore: input.confidenceLevel });
    phase3DailyObjectiveCheckAuditService.recordDailyObjectiveConfidenceBeforeRecorded(input.schoolId, input.studentId, 'learner', input.studentId, session.objectiveId, input.checkSessionId);
    return { checkpoint, session: updatedSession || session };
  }

  recordConfidenceAfter(input: { checkSessionId: string; schoolId: string; studentId: string; confidenceLevel: string; checkpointType: 'before' | 'after' }): { error?: string; checkpoint?: any; session?: any } {
    const validation = validateDailyObjectiveConfidenceInput(input as any);
    if (!(validation as any).ok) return { error: (validation as any).errors[0]?.message || 'Validation failed.' };
    const session: any = phase3DailyObjectiveCheckRepository.getCheckSessionById(input.checkSessionId);
    if (!session) return { error: 'Check session not found.' };
    if (session.schoolId !== input.schoolId) return { error: 'Cross-school access denied.' };
    if (session.studentId !== input.studentId) return { error: 'Cross-learner access denied.' };
    if (session.status === 'completed' || session.status === 'expired' || session.status === 'COMPLETED') return { error: `Cannot record confidence when session is ${session.status}.` };
    // confidence_after requires that attempt exists (server-owned), but we allow recording and then validate at completion
    const checkpoint = phase3DailyObjectiveCheckRepository.recordConfidenceCheckpoint({
      checkSessionId: input.checkSessionId, schoolId: input.schoolId, studentId: input.studentId, objectiveId: session.objectiveId, checkpointType: 'after', confidenceLevel: input.confidenceLevel,
    });
    phase3DailyObjectiveCheckRepository.markRequiredStepCompleted(input.checkSessionId, 'confidence_after');
    const newStatus = session.status === 'awaiting_confidence_after' ? 'in_progress' : session.status;
    const updatedSession = phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(input.checkSessionId, newStatus, { confidenceAfter: input.confidenceLevel });
    phase3DailyObjectiveCheckAuditService.recordDailyObjectiveConfidenceAfterRecorded(input.schoolId, input.studentId, 'learner', input.studentId, session.objectiveId, input.checkSessionId);
    return { checkpoint, session: updatedSession || session };
  }

  async recordConfidenceAfterAsync(input: { checkSessionId: string; schoolId: string; studentId: string; confidenceLevel: string; checkpointType: 'before' | 'after' }): Promise<{ error?: string; checkpoint?: any; session?: any }> {
    const validation = validateDailyObjectiveConfidenceInput(input as any);
    if (!(validation as any).ok) return { error: (validation as any).errors[0]?.message || 'Validation failed.' };
    const session: any = await phase3DailyObjectiveCheckRepository.getCheckSessionByIdAsync(input.checkSessionId);
    if (!session) return { error: 'Check session not found.' };
    if (session.schoolId !== input.schoolId) return { error: 'Cross-school access denied.' };
    if (session.studentId !== input.studentId) return { error: 'Cross-learner access denied.' };
    if (session.status === 'completed' || session.status === 'expired' || session.status === 'COMPLETED') return { error: `Cannot record confidence when session is ${session.status}.` };
    const checkpoint = await phase3DailyObjectiveCheckRepository.recordConfidenceCheckpointAsync({
      checkSessionId: input.checkSessionId, schoolId: input.schoolId, studentId: input.studentId, objectiveId: session.objectiveId, checkpointType: 'after', confidenceLevel: input.confidenceLevel,
    });
    await phase3DailyObjectiveCheckRepository.markRequiredStepCompletedAsync(input.checkSessionId, 'confidence_after');
    const newStatus = session.status === 'awaiting_confidence_after' ? 'in_progress' : session.status;
    const updatedSession = await phase3DailyObjectiveCheckRepository.updateCheckSessionStatusAsync(input.checkSessionId, newStatus, { confidenceAfter: input.confidenceLevel });
    phase3DailyObjectiveCheckAuditService.recordDailyObjectiveConfidenceAfterRecorded(input.schoolId, input.studentId, 'learner', input.studentId, session.objectiveId, input.checkSessionId);
    return { checkpoint, session: updatedSession || session };
  }

  validateConfidenceLevel(level: string): boolean { return allowedConfidenceLevels.includes(level); }

  compareConfidenceShift(before: string | undefined, after: string | undefined): { shift: string; pattern: string } {
    if (!before) return { shift: 'no_before', pattern: 'confidence_unstable' };
    if (!after) return { shift: 'no_after', pattern: 'confidence_unstable' };
    const beforeIndex = allowedConfidenceLevels.indexOf(before);
    const afterIndex = allowedConfidenceLevels.indexOf(after);
    if (beforeIndex === afterIndex) return { shift: 'unchanged', pattern: 'confidence_aligned' };
    if (afterIndex > beforeIndex) return { shift: 'improved', pattern: 'confidence_improving' };
    if (before === 'know_this' && afterIndex < beforeIndex) return { shift: 'overstated_to_realistic', pattern: 'confidence_overstated' };
    return { shift: 'decreased', pattern: 'confidence_understated' };
  }

  deriveConfidenceEvidenceSignal(before: string | undefined, after: string | undefined): string {
    if (!before) return 'no_confidence_baseline';
    if (!after) return 'no_confidence_followup';
    if (before === after && before === 'know_this') return 'stable_confidence';
    if (before === 'confused' && after === 'partly_know') return 'confidence_improving';
    if (before === 'know_this' && after !== 'know_this') return 'confidence_recalibrated';
    return 'confidence_marked';
  }

  createSafeConfidenceSummary(session: any): string {
    if (!session.confidenceBefore && !session.confidenceAfter) return 'No confidence recorded for this check.';
    if (session.confidenceBefore && !session.confidenceAfter) return `Started feeling ${session.confidenceBefore}. Complete the remaining steps to see how your confidence settles.`;
    if (!session.confidenceBefore && session.confidenceAfter) return `After the check, feeling ${session.confidenceAfter}.`;
    return `Confidence shifted from ${session.confidenceBefore} before to ${session.confidenceAfter} after the check.`;
  }
}

export const phase3DailyObjectiveConfidenceService = new Phase3DailyObjectiveConfidenceService();
