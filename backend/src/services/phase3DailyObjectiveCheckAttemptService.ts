import { PHASE3_DAILY_OBJECTIVE_SIGNAL_BUCKETS } from '../contracts/phase3DailyObjectiveCheckContracts';
import { phase3DailyObjectiveCheckRepository } from './phase3DailyObjectiveCheckRepository';
import { phase3DailyObjectiveCheckAuditService } from './phase3DailyObjectiveCheckAuditService';
import { validateDailyObjectiveCheckAttemptInput } from '../lib/phase3DailyObjectiveCheckValidation';

function nowISO(): string { return new Date().toISOString(); }

export class Phase3DailyObjectiveCheckAttemptService {
  recordSafeAttemptSignal(input: {
    checkSessionId: string; schoolId: string; studentId: string;
    attemptType?: string; signalBucket: string;
    hintUsageBucket?: string; explanationQualityBucket?: string; recallQualityBucket?: string;
    teachBackQualityBucket?: string; transferCheckBucket?: string; delayedRecallBucket?: string;
    antiCheatLabels?: string[]; timeSpentSeconds?: number; safeEvidenceRef?: string;
  }): { error?: string; attempt?: any; session?: any } {
    const validation = validateDailyObjectiveCheckAttemptInput(input as any);
    if (!(validation as any).ok) return { error: (validation as any).errors[0]?.message || 'Validation failed.' };
    const session: any = phase3DailyObjectiveCheckRepository.getCheckSessionById(input.checkSessionId);
    if (!session) return { error: 'Check session not found.' };
    if (session.schoolId !== input.schoolId) return { error: 'Cross-school access denied.' };
    if (session.studentId !== input.studentId) return { error: 'Cross-learner access denied.' };
    if (session.status === 'completed' || session.status === 'COMPLETED' || session.status === 'expired' || session.status === 'source_required' || session.status === 'blocked') {
      return { error: `Cannot record attempt when session is ${session.status}.` };
    }
    // Anti-cheat: never trust client-declared mastery/correctness fields directly.
    // Derive safe labels server-side; client fields like signalBucket are validated against allowlist
    // and then normalized. Forbidden mastery fields are already rejected by validation.
    if (!(PHASE3_DAILY_OBJECTIVE_SIGNAL_BUCKETS as readonly string[]).includes(input.signalBucket)) {
      return { error: 'Invalid signal bucket.' };
    }
    // Additional anti-cheat: if client tries to masquerade confidence as evidence, we treat separately
    // Confidence is handled via confidence service, not attempt.

    const antiCheatLabels = this.deriveAntiCheatResistantLabels(input as any);
    const attempt = phase3DailyObjectiveCheckRepository.recordSafeAttemptSignal({
      checkSessionId: input.checkSessionId, schoolId: input.schoolId, studentId: input.studentId,
      objectiveId: session.objectiveId, attemptType: input.attemptType || 'daily_objective_check',
      signalBucket: input.signalBucket, hintUsageBucket: input.hintUsageBucket,
      explanationQualityBucket: input.explanationQualityBucket, recallQualityBucket: input.recallQualityBucket,
      teachBackQualityBucket: input.teachBackQualityBucket, transferCheckBucket: input.transferCheckBucket,
      delayedRecallBucket: input.delayedRecallBucket, antiCheatLabels, timeSpentSeconds: input.timeSpentSeconds, safeEvidenceRef: input.safeEvidenceRef,
    });

    // Update session durable state with server-owned signals
    const signalBuckets = [...new Set([...(session.safeSignalBuckets || []), input.signalBucket])];
    const antiLabels = [...new Set([...(session.antiCheatSignalLabels || []), ...antiCheatLabels])];
    const modesUsed = input.attemptType ? [...new Set([...(session.modeDestinationsUsed || []), input.attemptType])] : session.modeDestinationsUsed;
    const attemptCount = (session.attemptCount || 0) + 1;
    const hintBucket = input.hintUsageBucket || session.hintUsageBucket;
    const explanationBucket = input.explanationQualityBucket || session.explanationQualityBucket;
    const recallBucket = input.recallQualityBucket || session.recallQualityBucket;
    const teachBackBucket = input.teachBackQualityBucket || session.teachBackQualityBucket;
    const transferBucket = input.transferCheckBucket || session.transferCheckBucket;
    const delayedBucket = input.delayedRecallBucket || session.delayedRecallBucket;

    // Mark required step 'attempt' as completed server-side
    phase3DailyObjectiveCheckRepository.markRequiredStepCompleted(input.checkSessionId, 'attempt');

    const updatedSession = phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(input.checkSessionId, session.status, {
      safeSignalBuckets: signalBuckets, antiCheatSignalLabels: antiLabels, modeDestinationsUsed: modesUsed,
      attemptCount, hintUsageBucket: hintBucket, explanationQualityBucket: explanationBucket, recallQualityBucket: recallBucket,
      teachBackQualityBucket: teachBackBucket, transferCheckBucket: transferBucket, delayedRecallBucket: delayedBucket,
    });
    phase3DailyObjectiveCheckAuditService.recordDailyObjectiveAttemptSignalRecorded(input.schoolId, input.studentId, 'learner', input.studentId, session.objectiveId, input.checkSessionId);
    return { attempt, session: updatedSession || session };
  }

  classifyAttemptSignalBucket(bucket: string): string {
    if ((PHASE3_DAILY_OBJECTIVE_SIGNAL_BUCKETS as readonly string[]).includes(bucket)) return bucket;
    return 'unknown_signal';
  }

  deriveAntiCheatResistantLabels(input: { hintUsageBucket?: string; explanationQualityBucket?: string; recallQualityBucket?: string; antiCheatLabels?: string[] }): string[] {
    const labels: string[] = [];
    const safeLabels = ['needs_verification','inconsistent_understanding','explanation_gap','overconfidence_wrong','answer_pattern_unstable','high_correctness_low_explanation_signal'];
    if (input.antiCheatLabels) {
      for (const label of input.antiCheatLabels) {
        if (safeLabels.includes(label) && !labels.includes(label)) labels.push(label);
      }
    }
    if (input.hintUsageBucket === 'high' && (!input.explanationQualityBucket || input.explanationQualityBucket === 'weak')) {
      if (!labels.includes('needs_verification')) labels.push('needs_verification');
    }
    if (input.explanationQualityBucket === 'weak' && input.recallQualityBucket === 'strong') {
      if (!labels.includes('high_correctness_low_explanation_signal')) labels.push('high_correctness_low_explanation_signal');
    }
    if (input.hintUsageBucket === 'high' && input.explanationQualityBucket === 'weak') {
      if (!labels.includes('inconsistent_understanding')) labels.push('inconsistent_understanding');
    }
    return labels;
  }

  deriveObjectiveEvidenceSignals(session: any): string[] {
    const signals: string[] = [];
    if (session.safeSignalBuckets?.includes('objective_check_passed')) signals.push('objective_check_passed');
    else if (session.safeSignalBuckets?.includes('objective_check_unstable')) signals.push('objective_check_unstable');
    if (session.teachBackQualityBucket === 'strong') signals.push('teach_back_quality_bucket');
    if (session.transferCheckBucket === 'passed') signals.push('transfer_check_passed');
    if (session.delayedRecallBucket === 'passed') signals.push('delayed_recall_passed');
    return signals;
  }

  // Compatibility helpers retained from previous implementation
  recordHintUsageBucket(checkSessionId: string, bucket: string): any {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(checkSessionId, 'in_progress', { hintUsageBucket: bucket });
  }
  recordExplanationQualityBucket(checkSessionId: string, bucket: string): any {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(checkSessionId, 'in_progress', { explanationQualityBucket: bucket });
  }
  recordRecallQualityBucket(checkSessionId: string, bucket: string): any {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(checkSessionId, 'in_progress', { recallQualityBucket: bucket });
  }
  recordTeachBackQualityBucket(checkSessionId: string, bucket: string): any {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(checkSessionId, 'in_progress', { teachBackQualityBucket: bucket });
  }
  recordTransferCheckBucket(checkSessionId: string, bucket: string): any {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(checkSessionId, 'in_progress', { transferCheckBucket: bucket });
  }
  recordDelayedRecallBucket(checkSessionId: string, bucket: string): any {
    return phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(checkSessionId, 'in_progress', { delayedRecallBucket: bucket });
  }
}

export const phase3DailyObjectiveCheckAttemptService = new Phase3DailyObjectiveCheckAttemptService();
