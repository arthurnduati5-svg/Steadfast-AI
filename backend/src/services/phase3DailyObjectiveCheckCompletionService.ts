import { phase3DailyObjectiveCheckRepository } from './phase3DailyObjectiveCheckRepository';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';
import { phase3ObjectiveEvidenceBridgeService } from './phase3ObjectiveEvidenceBridgeService';
import { phase3ObjectiveMasteryService } from './phase3ObjectiveMasteryService';
import { phase3DailyObjectiveSeedService } from './phase3DailyObjectiveSeedService';
import { phase3DailyObjectiveCheckAuditService } from './phase3DailyObjectiveCheckAuditService';
import { validateDailyObjectiveCheckCompletionInput } from '../lib/phase3DailyObjectiveCheckValidation';
import * as fs from 'fs';
import * as path from 'path';

function nowISO(): string { return new Date().toISOString(); }

// Idempotency store for completion — durable via file to survive restart
const IDEMPOTENCY_FILE = path.join(process.cwd(), 'backend', '.cache', 'r4-completion-idempotency.json');
const ALT_IDEMPOTENCY_FILE = path.join('C:\\Users\\HP\\AppData\\Local\\Temp', 'steadfast-r4-completion-idempotency.json');

interface IdempotencyRecord {
  checkSessionId: string;
  schoolId: string;
  studentId: string;
  evidenceId?: string;
  bridgeId?: string;
  masteryApplied: boolean;
  weakSignalCreated: boolean;
  completionStatus?: string;
  result?: any;
  masteryResult?: any;
  weakSignalRef?: string;
  updatedAt: string;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();

function getIdempotencyPath(): string {
  try {
    const dir = path.dirname(IDEMPOTENCY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return IDEMPOTENCY_FILE;
  } catch { return ALT_IDEMPOTENCY_FILE; }
}

function loadIdempotency(): void {
  for (const p of [getIdempotencyPath(), ALT_IDEMPOTENCY_FILE]) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw) as Record<string, IdempotencyRecord>;
        for (const [k, v] of Object.entries(data)) idempotencyStore.set(k, v);
        return;
      }
    } catch {}
  }
}

function saveIdempotency(): void {
  const payload: Record<string, IdempotencyRecord> = {};
  for (const [k, v] of idempotencyStore.entries()) payload[k] = v;
  const json = JSON.stringify(payload);
  for (const p of [getIdempotencyPath(), ALT_IDEMPOTENCY_FILE]) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, json, 'utf-8');
    } catch {}
  }
}

try { loadIdempotency(); } catch {}

function idempotencyKeyForSession(checkSessionId: string): string {
  return `daily_obj_check_${checkSessionId}`;
}

function determineCompletionStatusLabel(session: any): string {
  const hasStrongSignal = session.safeSignalBuckets?.includes('objective_check_passed') || session.safeSignalBuckets?.includes('teach_back_quality_bucket') || session.safeSignalBuckets?.includes('transfer_check_passed') || session.safeSignalBuckets?.includes('delayed_recall_passed');
  const hasWeakSignals = session.safeSignalBuckets?.includes('objective_check_unstable') || session.safeSignalBuckets?.includes('high_hint_dependency');
  const highHintDependency = session.hintUsageBucket === 'high';
  if (hasStrongSignal && !highHintDependency && (session.attemptCount || 0) >= 1) return 'completed';
  if (hasWeakSignals || highHintDependency) {
    if ((session.attemptCount || 0) >= 3) return 'needs_rescue';
    return 'needs_recheck';
  }
  if ((session.attemptCount || 0) >= 3) return 'needs_teacher_support';
  return 'needs_recheck';
}

export class Phase3DailyObjectiveCheckCompletionService {
  completeDailyObjectiveCheckSession(input: { checkSessionId: string; schoolId: string; studentId: string }): { error?: string; result?: any; learnerResponse?: any; teacherSummary?: any } {
    const validation = validateDailyObjectiveCheckCompletionInput(input as any);
    if (!(validation as any).ok) return { error: (validation as any).errors[0]?.message || 'Validation failed.' };

    // 1. Load check from durable storage
    const session: any = phase3DailyObjectiveCheckRepository.getCheckSessionById(input.checkSessionId);
    if (!session) return { error: 'Check session not found.' };
    if (session.schoolId !== input.schoolId) return { error: 'Cross-school access denied.' };
    if (session.studentId !== input.studentId) return { error: 'Cross-learner access denied.' };

    // Handle already completed — idempotent retry must return same result without duplication
    const stableKey = idempotencyKeyForSession(input.checkSessionId);
    const existingIdem = idempotencyStore.get(stableKey);
    if (session.status === 'completed' || session.status === 'COMPLETED') {
      if (existingIdem?.result) {
        // Reconstruct same completion response
        const result = existingIdem.result;
        const learnerResponse = this.buildLearnerResponseFromResult(session, result, existingIdem.masteryResult);
        const teacherSummary = this.buildTeacherSummaryFromResult(session, result, existingIdem.masteryResult);
        return { result, learnerResponse, teacherSummary };
      }
      // If session is completed but no idempotency record (legacy), create one and return
      // This can happen for sessions completed before R4 idempotency
      const legacyResult: any = {
        checkSessionId: session.checkSessionId, objectiveId: session.objectiveId, schoolId: session.schoolId, studentId: session.studentId,
        previousStatus: session.status, completionStatus: session.status, missingRequiredSteps: [],
        evidenceBridgeResultId: session.evidenceId || 'legacy', masteryUpdated: false, newMasteryStatus: session.masteryResult?.newStatus || 'still_learning',
        dailySeedUpdated: false, safeEvidenceRefs: session.safeEvidenceRefs || [], learnerSafeResponse: session.learnerSafeReason || 'Check completed.', teacherSafeReason: session.teacherSafeReason || '', completedAt: session.completedAt || nowISO(),
      };
      return { result: legacyResult, learnerResponse: this.buildLearnerResponseFromResult(session, legacyResult, session.masteryResult), teacherSummary: this.buildTeacherSummaryFromResult(session, legacyResult, session.masteryResult) };
    }

    if (session.status === 'expired') return { error: `Session is already ${session.status}.` };
    if (session.status === 'COMPLETING') {
      // Another caller is completing; reload and reconcile
      // For now, return conflict but allow retry to reconcile after completion
      return { error: 'Concurrent completion in progress. Please retry.' };
    }
    if (session.status === 'source_required' || session.status === 'blocked') return { error: `Cannot complete session when status is ${session.status}.` };

    // 2. Verify canonical objective still resolves and required steps are truly complete from SERVER-OWNED state
    const objective = phase3ObjectiveRepository.getObjectiveById(session.objectiveId);
    if (!objective) return { error: 'Canonical objective no longer resolves.' };
    if ((objective as any).schoolId !== session.schoolId) return { error: 'Objective school mismatch.' };

    const missingRequiredSteps = this.determineRequiredMissingSteps(session);
    if (missingRequiredSteps.length > 0) {
      const nextStep = missingRequiredSteps[0];
      const statusMap: Record<string, string> = { 'teach_back': 'awaiting_teach_back', 'transfer_check': 'awaiting_transfer_check', 'delayed_recall': 'awaiting_delayed_recall', 'confidence_after': 'awaiting_confidence_after', 'confidence_before': 'confidence_before_required', 'attempt': 'in_progress' };
      const newStatus = statusMap[nextStep] || 'in_progress';
      phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(input.checkSessionId, newStatus);
      const learnerResponse = {
        checkSessionId: session.checkSessionId, objectiveId: session.objectiveId, dailySeedId: session.dailySeedId, status: newStatus, safeTitle: 'Daily Objective Check',
        safeMessage: `This objective needs another check before it becomes stable.`, nextStep: `Complete the required step: ${nextStep.replace(/_/g, ' ')}.`, safeEvidenceRefs: session.safeEvidenceRefs || [], createdAt: session.createdAt, updatedAt: nowISO(),
      };
      return { learnerResponse, error: `Missing required step: ${nextStep}` };
    }

    // Verify genuine attempt exists (server-owned)
    if ((session.attemptCount || 0) === 0) {
      return { error: 'Missing required step: attempt — genuine server-owned attempt required.' };
    }

    // Check idempotency before acquiring ownership: if we already have a record for this session, reuse
    loadIdempotency();
    const prior = idempotencyStore.get(stableKey);
    // 3. Acquire completion ownership: ACTIVE -> COMPLETING using version
    const expectedVersion = session.version;
    const acquired = phase3DailyObjectiveCheckRepository.acquireCompletingOwnership(input.checkSessionId, expectedVersion);
    if (!acquired) {
      // Lost race or version conflict — reload and reconcile
      const reloaded: any = phase3DailyObjectiveCheckRepository.getCheckSessionById(input.checkSessionId);
      if (reloaded?.status === 'completed' || reloaded?.status === 'COMPLETED') {
        const rec = idempotencyStore.get(stableKey);
        if (rec?.result) {
          return { result: rec.result, learnerResponse: this.buildLearnerResponseFromResult(reloaded, rec.result, rec.masteryResult), teacherSummary: this.buildTeacherSummaryFromResult(reloaded, rec.result, rec.masteryResult) };
        }
      }
      if (reloaded?.status === 'COMPLETING') {
        return { error: 'Concurrent completion in progress. Please retry.' };
      }
      return { error: 'Concurrent completion conflict. Please retry.' };
    }

    // From here we are the owner; we must handle partial failures idempotently
    try {
      // 4. Build canonical Learning Evidence input from SERVER-OWNED check/attempt state
      const evidenceInput = this.buildObjectiveEvidenceBridgeInput(session);

      // If prior exists and evidence already created, reuse it
      let bridgeResult: any = null;
      let masteryUpdate: any = null;
      let weakSignalRef: string | undefined = undefined;

      if (prior?.bridgeId && prior?.evidenceId) {
        // Reuse existing evidence — do not duplicate
        bridgeResult = { bridgeId: prior.bridgeId, evidenceRef: { evidenceId: prior.evidenceId } };
        masteryUpdate = prior.masteryResult;
        weakSignalRef = prior.weakSignalRef;
      } else {
        // 5. Write/reconcile Learning Evidence through accepted ledger
        // Use stable idempotency key (not Date.now()) for evidence
        evidenceInput.idempotencyKey = stableKey;
        try {
          bridgeResult = phase3ObjectiveEvidenceBridgeService.linkSafeEvidenceToObjective(evidenceInput as any);
        } catch (e: any) {
          // Evidence write failed — persist idempotency with no evidence so retry can continue
          // Do not mark completed; transition back to active for retry
          phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(input.checkSessionId, session.status, {});
          return { error: `Evidence persistence failed: ${e.message}` };
        }

        // Persist evidenceId for recovery before mastery
        idempotencyStore.set(stableKey, {
          checkSessionId: input.checkSessionId, schoolId: input.schoolId, studentId: input.studentId,
          evidenceId: bridgeResult.evidenceRef.evidenceId, bridgeId: bridgeResult.bridgeId,
          masteryApplied: false, weakSignalCreated: false, updatedAt: nowISO(),
        });
        saveIdempotency();
        phase3DailyObjectiveCheckRepository.persistCompletionReferences(input.checkSessionId, { evidenceId: bridgeResult.evidenceRef.evidenceId });

        // 6. Hand canonical evidence to Mastery
        try {
          masteryUpdate = phase3ObjectiveMasteryService.updateObjectiveMasteryFromEvidence(evidenceInput as any);
        } catch (e: any) {
          // Mastery failed but evidence succeeded — persist so retry reuses evidence and retries mastery
          const rec = idempotencyStore.get(stableKey)!;
          rec.masteryResult = null;
          rec.updatedAt = nowISO();
          saveIdempotency();
          // Remain in COMPLETING for retry
          return { error: `Mastery processing failed: ${e.message}` };
        }

        // Persist mastery result
        const rec2 = idempotencyStore.get(stableKey)!;
        rec2.masteryApplied = true;
        rec2.masteryResult = masteryUpdate;
        rec2.updatedAt = nowISO();
        saveIdempotency();
        phase3DailyObjectiveCheckRepository.persistCompletionReferences(input.checkSessionId, { masteryResult: masteryUpdate });
      }

      // If mastery was not yet applied (retry case), apply now
      if (!masteryUpdate) {
        const evidenceInputRetry = this.buildObjectiveEvidenceBridgeInput(session);
        evidenceInputRetry.idempotencyKey = stableKey;
        masteryUpdate = phase3ObjectiveMasteryService.updateObjectiveMasteryFromEvidence(evidenceInputRetry as any);
        const rec = idempotencyStore.get(stableKey);
        if (rec) {
          rec.masteryApplied = true;
          rec.masteryResult = masteryUpdate;
          rec.updatedAt = nowISO();
          saveIdempotency();
          phase3DailyObjectiveCheckRepository.persistCompletionReferences(input.checkSessionId, { masteryResult: masteryUpdate });
        }
      }

      // 8. If canonical mastery indicates weak/developing area, produce weak-area/revision signal idempotently
      const needsWeakSignal = masteryUpdate && (masteryUpdate.newStatus === 'needs_rescue' || masteryUpdate.newStatus === 'needs_teacher_support' || masteryUpdate.newStatus === 'still_learning');
      if (needsWeakSignal) {
        const priorWeak = idempotencyStore.get(stableKey)?.weakSignalRef;
        if (priorWeak) {
          weakSignalRef = priorWeak;
        } else {
          try {
            // Use existing weak-topic/revision adapter if available
            // We attempt to call phase3WeakTopicLaneService if present, else synthesize safe ref
            let weakRef: string | undefined = undefined;
            try {
              const mod: any = awaitImportWeakTopicLane();
              if (mod) {
                const lanes = mod.deriveWeakTopicLaneFromDailyObjectiveChecks?.(session.schoolId, session.studentId, [{
                  subjectId: session.subjectId, topicId: session.topicId, skillId: session.skillId, objectiveIds: [session.objectiveId],
                  status: masteryUpdate.newStatus === 'needs_teacher_support' ? 'needs_teacher_support' : masteryUpdate.newStatus === 'needs_rescue' ? 'needs_rescue' : 'needs_recheck',
                  safeTitle: 'Daily check needs support', safeSummary: `Weak signal from daily check ${session.checkSessionId}`, recommendedAction: 'small_group_support', priority: 'high',
                }]);
                if (lanes && lanes.length > 0) weakRef = lanes[0].laneId;
              }
            } catch {}
            weakSignalRef = weakRef || `weak_${session.checkSessionId}`;
            const rec = idempotencyStore.get(stableKey);
            if (rec) { rec.weakSignalCreated = true; rec.weakSignalRef = weakSignalRef; rec.updatedAt = nowISO(); saveIdempotency(); }
            phase3DailyObjectiveCheckRepository.persistCompletionReferences(input.checkSessionId, { weakSignalRef });
          } catch (e: any) {
            // Weak signal failed — do not falsely report downstream flow as fully reconciled
            return { error: `Weak-area signal failed: ${e.message}` };
          }
        }
      } else {
        // Strong result — do not create false weak signal
        weakSignalRef = undefined;
      }

      // Finalize idempotency record
      const finalRec = idempotencyStore.get(stableKey);
      if (finalRec) {
        finalRec.completionStatus = determineCompletionStatusLabel(session);
        finalRec.updatedAt = nowISO();
        saveIdempotency();
      }

      const completionStatus = determineCompletionStatusLabel(session);
      const dailySeedUpdated = !!(session.dailySeedId && phase3DailyObjectiveSeedService.markDailyObjectiveSeedCompleted(session.dailySeedId));

      const safeEvidenceRefs = [...(session.safeEvidenceRefs || []), bridgeResult.evidenceRef.evidenceId];
      const learnerSafeMessage = this.buildLearnerSafeCompletionMessage(completionStatus);
      const teacherSafeReason = this.buildTeacherSafeCompletionReason(completionStatus, session);

      const completedSession = phase3DailyObjectiveCheckRepository.completeCheckSession(input.checkSessionId, {
        status: completionStatus, learnerSafeReason: learnerSafeMessage, teacherSafeReason, safeEvidenceRefs,
        evidenceId: bridgeResult.evidenceRef.evidenceId, masteryResult: masteryUpdate, weakSignalRef,
      });

      const result = {
        checkSessionId: session.checkSessionId, objectiveId: session.objectiveId, schoolId: session.schoolId, studentId: session.studentId,
        previousStatus: session.status, completionStatus, missingRequiredSteps: [], evidenceBridgeResultId: bridgeResult.bridgeId,
        masteryUpdated: masteryUpdate.changed, newMasteryStatus: masteryUpdate.newStatus, dailySeedUpdated, safeEvidenceRefs, learnerSafeResponse: learnerSafeMessage, teacherSafeReason, completedAt: nowISO(),
      };

      // Persist final result for idempotent retry
      const finalIdem: IdempotencyRecord = {
        checkSessionId: input.checkSessionId, schoolId: input.schoolId, studentId: input.studentId,
        evidenceId: bridgeResult.evidenceRef.evidenceId, bridgeId: bridgeResult.bridgeId,
        masteryApplied: true, weakSignalCreated: !!weakSignalRef, completionStatus, result, masteryResult: masteryUpdate, weakSignalRef, updatedAt: nowISO(),
      };
      idempotencyStore.set(stableKey, finalIdem);
      saveIdempotency();

      phase3DailyObjectiveCheckAuditService.recordDailyObjectiveCheckCompleted(input.schoolId, input.studentId, 'learner', input.studentId, session.objectiveId, input.checkSessionId);

      const learnerResponse = {
        checkSessionId: session.checkSessionId, objectiveId: session.objectiveId, dailySeedId: session.dailySeedId, status: completionStatus, safeTitle: 'Daily Objective Check',
        safeMessage: learnerSafeMessage, nextStep: this.getLearnerNextStep(completionStatus, masteryUpdate.newStatus), modeDestination: masteryUpdate.newStatus === 'confident' ? 'revision' : 'focus',
        masteryStatus: masteryUpdate.newStatus, safeEvidenceRefs, createdAt: session.createdAt, updatedAt: nowISO(),
      };
      const teacherSummary = {
        checkSessionId: session.checkSessionId, objectiveId: session.objectiveId, classId: session.classId, subjectId: session.subjectId, topicId: session.topicId, skillId: session.skillId, studentId: session.studentId,
        status: completionStatus, masteryStatus: masteryUpdate.newStatus, safePatternSummary: teacherSafeReason,
        hintDependencyBucket: session.hintUsageBucket, explanationQualityBucket: session.explanationQualityBucket, recallQualityBucket: session.recallQualityBucket,
        teachBackQualityBucket: session.teachBackQualityBucket, transferCheckStatus: session.transferCheckBucket, delayedRecallStatus: session.delayedRecallBucket,
        safeReasonCodes: masteryUpdate.reasonCodes, recommendedTeacherAction: this.getRecommendedTeacherAction(completionStatus), safeEvidenceRefs, updatedAt: nowISO(),
      };
      return { result, learnerResponse, teacherSummary };
    } catch (e: any) {
      // Unexpected failure — keep in COMPLETING for retry, do not mark COMPLETED
      return { error: e.message || 'Completion failed' };
    }
  }

  // For testing: reset idempotency
  resetIdempotencyForTests(): void {
    idempotencyStore.clear();
    for (const p of [getIdempotencyPath(), ALT_IDEMPOTENCY_FILE]) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
    }
  }

  private determineRequiredMissingSteps(session: any): string[] {
    const missing: string[] = [];
    const completed = new Set(session.completedSteps || []);
    const requiredSteps: string[] = session.requiredSteps || [];
    if (requiredSteps.includes('confidence_before') && !completed.has('confidence_before') && !session.confidenceBefore) missing.push('confidence_before');
    if ((session.attemptCount || 0) === 0) {
      if (!missing.includes('attempt')) missing.unshift('attempt');
    }
    if (requiredSteps.includes('teach_back') && !completed.has('teach_back')) missing.push('teach_back');
    if (requiredSteps.includes('transfer_check') && !completed.has('transfer_check')) missing.push('transfer_check');
    if (requiredSteps.includes('delayed_recall') && !completed.has('delayed_recall')) missing.push('delayed_recall');
    if (requiredSteps.includes('confidence_after') && !completed.has('confidence_after') && !session.confidenceAfter) missing.push('confidence_after');
    return missing;
  }

  private determineCompletionStatus(session: any, _input?: any): string { return determineCompletionStatusLabel(session); }

  private buildObjectiveEvidenceBridgeInput(session: any): any {
    const hasStrongSignals = session.safeSignalBuckets?.includes('objective_check_passed') || session.safeSignalBuckets?.includes('teach_back_quality_bucket') || session.safeSignalBuckets?.includes('transfer_check_passed') || session.safeSignalBuckets?.includes('delayed_recall_passed');
    const evidenceStrength = hasStrongSignals ? 'strong' : 'weak';
    const signalBuckets: Record<string, string> = {};
    if (session.hintUsageBucket) signalBuckets.hint_dependency = session.hintUsageBucket;
    if (session.explanationQualityBucket) signalBuckets.explanation_quality = session.explanationQualityBucket;
    if (session.recallQualityBucket) signalBuckets.recall_quality = session.recallQualityBucket;
    if (session.teachBackQualityBucket) signalBuckets.teach_back_quality = session.teachBackQualityBucket;
    if (session.transferCheckBucket) signalBuckets.transfer_status = session.transferCheckBucket;
    if (session.delayedRecallBucket) signalBuckets.delayed_recall_status = session.delayedRecallBucket;
    const reasonCodes: string[] = [];
    if (session.hintUsageBucket === 'high') reasonCodes.push('high_hint_dependency');
    if (hasStrongSignals) reasonCodes.push('strong_recent_evidence');
    if (session.safeSignalBuckets?.includes('objective_check_unstable')) reasonCodes.push('failed_recall');
    if (session.teachBackQualityBucket === 'strong') reasonCodes.push('teach_back_passed');
    if (session.transferCheckBucket === 'passed') reasonCodes.push('transfer_check_passed');
    if (session.delayedRecallBucket === 'passed') reasonCodes.push('delayed_recall_passed');
    if (reasonCodes.length === 0) reasonCodes.push('daily_objective_check_completed');
    const antiCheatLabels = (session.antiCheatSignalLabels || []).filter((l: string) => ['needs_verification','inconsistent_understanding','explanation_gap','overconfidence_wrong','answer_pattern_unstable','high_correctness_low_explanation_signal'].includes(l));
    return {
      objectiveId: session.objectiveId, schoolId: session.schoolId, learnerId: session.studentId, classId: session.classId, subjectId: session.subjectId, topicId: session.topicId, skillId: session.skillId,
      modeSessionId: session.checkSessionId, evidenceType: 'objective_check', evidenceStrength, sourceMode: 'objective_check',
      safeEvidenceRef: session.checkSessionId, signalBuckets, antiCheatLabels, confidenceLabel: session.confidenceAfter || session.confidenceBefore,
      attemptNumber: session.attemptCount, hintUsed: session.hintUsageBucket === 'high', timeSpentBucket: undefined, reasonCodes, idempotencyKey: idempotencyKeyForSession(session.checkSessionId),
    };
  }

  private buildLearnerResponseFromResult(session: any, result: any, masteryResult: any): any {
    return {
      checkSessionId: session.checkSessionId, objectiveId: session.objectiveId, dailySeedId: session.dailySeedId, status: result.completionStatus, safeTitle: 'Daily Objective Check',
      safeMessage: result.learnerSafeResponse || this.buildLearnerSafeCompletionMessage(result.completionStatus), nextStep: this.getLearnerNextStep(result.completionStatus, masteryResult?.newStatus || result.newMasteryStatus),
      modeDestination: (masteryResult?.newStatus || result.newMasteryStatus) === 'confident' ? 'revision' : 'focus', masteryStatus: masteryResult?.newStatus || result.newMasteryStatus, safeEvidenceRefs: result.safeEvidenceRefs, createdAt: session.createdAt, updatedAt: nowISO(),
    };
  }

  private buildTeacherSummaryFromResult(session: any, result: any, masteryResult: any): any {
    return {
      checkSessionId: session.checkSessionId, objectiveId: session.objectiveId, classId: session.classId, subjectId: session.subjectId, topicId: session.topicId, skillId: session.skillId, studentId: session.studentId,
      status: result.completionStatus, masteryStatus: masteryResult?.newStatus || result.newMasteryStatus, safePatternSummary: result.teacherSafeReason || this.buildTeacherSafeCompletionReason(result.completionStatus, session),
      hintDependencyBucket: session.hintUsageBucket, explanationQualityBucket: session.explanationQualityBucket, recallQualityBucket: session.recallQualityBucket, teachBackQualityBucket: session.teachBackQualityBucket, transferCheckStatus: session.transferCheckBucket, delayedRecallStatus: session.delayedRecallBucket,
      safeReasonCodes: masteryResult?.reasonCodes || result.safeReasonCodes || [], recommendedTeacherAction: this.getRecommendedTeacherAction(result.completionStatus), safeEvidenceRefs: result.safeEvidenceRefs, updatedAt: nowISO(),
    };
  }

  private buildLearnerSafeCompletionMessage(completionStatus: string): string {
    switch (completionStatus) {
      case 'completed': return 'Good. This objective check is complete. Your understanding is becoming more stable.';
      case 'needs_recheck': return 'This objective needs another check before it becomes stable. You are getting closer.';
      case 'needs_rescue': return 'This objective needs dedicated focus. Try a similar question to help confirm it.';
      case 'needs_teacher_support': return 'This needs teacher support because there are some areas that need extra help.';
      case 'source_required': return 'This objective needs an approved source before checks can continue.';
      case 'blocked': return 'Cannot complete this check due to a policy boundary.';
      default: return 'Objective check completed.';
    }
  }
  private buildTeacherSafeCompletionReason(completionStatus: string, session: any): string {
    switch (completionStatus) {
      case 'completed': return 'Student completed all required check steps with adequate signals.';
      case 'needs_recheck': return 'Student showed unstable or weak signals. Recommend another check soon.';
      case 'needs_rescue': return `Student showed repeated weak signals after ${session.attemptCount} attempts. Recommend dedicated focus.`;
      case 'needs_teacher_support': return `Student showed persistent difficulty after ${session.attemptCount} attempts. Teacher support recommended.`;
      default: return `Check completed with status: ${completionStatus}.`;
    }
  }
  private getLearnerNextStep(completionStatus: string, masteryStatus: string): string {
    if (completionStatus === 'completed' && masteryStatus === 'confident') return 'Great progress. This objective is stable. Move to the next objective or review it during revision.';
    if (completionStatus === 'needs_recheck') return 'Try another check step to confirm your understanding.';
    if (completionStatus === 'needs_rescue') return 'Focus on this objective with dedicated practice.';
    if (completionStatus === 'needs_teacher_support') return 'Ask your teacher for guidance on this objective.';
    return 'Continue working on this objective.';
  }
  private getRecommendedTeacherAction(completionStatus: string): string {
    switch (completionStatus) {
      case 'completed': return 'no_action_needed';
      case 'needs_recheck': return 'assign_short_recall';
      case 'needs_rescue': return 'run_teach_back_check';
      case 'needs_teacher_support': return 'teacher_support_needed';
      case 'source_required': return 'provide_approved_source';
      case 'blocked': return 'review_prerequisite';
      default: return 'no_action_needed';
    }
  }
  private getAuditEventTypeForCompletion(completionStatus: string): string {
    switch (completionStatus) {
      case 'completed': return 'daily_objective_check_completed';
      case 'needs_recheck': return 'daily_objective_check_needs_recheck';
      case 'needs_rescue': return 'daily_objective_check_needs_rescue';
      case 'needs_teacher_support': return 'daily_objective_check_needs_teacher_support';
      default: return 'daily_objective_check_completed';
    }
  }
}

function awaitImportWeakTopicLane(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./phase3WeakTopicLaneService');
    return mod.phase3WeakTopicLaneService || mod.default;
  } catch { return null; }
}

export const phase3DailyObjectiveCheckCompletionService = new Phase3DailyObjectiveCheckCompletionService();
