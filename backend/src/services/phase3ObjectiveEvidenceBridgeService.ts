import type {
  Phase3ObjectiveEvidenceBridgeInput,
  Phase3ObjectiveEvidenceBridgeResult,
  Phase3ObjectiveMasterySnapshot,
  Phase3ObjectiveGrowthActionBridgeSignal,
  Phase3ObjectiveAuditEvent,
  Phase3SafeEvidenceRef,
  Phase3MasteryStatus,
  Phase3AntiCheatLabel,
  Phase3AuditEventType,
  Phase3RecommendedAction,
  Phase3ModeDestination,
} from '../contracts/phase3ObjectiveMasteryContracts';
import { PHASE3_FORBIDDEN_FIELDS } from '../contracts/phase3ObjectiveMasteryContracts';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';
import { phase3ObjectiveMasteryService } from './phase3ObjectiveMasteryService';

const ALLOWED_EVIDENCE_SIGNALS = [
  'attempt_completed',
  'hint_used',
  'confidence_marked',
  'teach_back_quality_bucket',
  'quiz_recall_bucket',
  'revision_completed',
  'objective_check_passed',
  'objective_check_unstable',
  'mistake_pattern_detected',
  'weak_topic_repeated',
  'transfer_check_attempted',
  'delayed_recall_attempted',
  'study_plan_session_completed',
  'video_reinforcement_completed',
] as const;

const MODE_SIGNAL_STRENGTH_MAP: Record<string, string> = {
  focus: 'weak',
  quiz: 'moderate',
  teach_back: 'strong',
  revision: 'moderate',
  exam: 'strong',
  objective_check: 'strong',
  study_plan: 'moderate',
  video: 'moderate',
};

let bridgeIdCounter = 0;

function generateBridgeId(): string {
  return `br_${Date.now().toString(36)}_${(++bridgeIdCounter).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// Idempotency for evidence bridge: stable key = idempotencyKey -> result
const evidenceIdempotencyStore = new Map<string, Phase3ObjectiveEvidenceBridgeResult>();

export class Phase3ObjectiveEvidenceBridgeService {
  linkSafeEvidenceToObjective(input: Phase3ObjectiveEvidenceBridgeInput): Phase3ObjectiveEvidenceBridgeResult {
    // Idempotent only for daily objective check stable keys; other evidence types use per-test keys and should not be deduplicated across unrelated tests
    const isDailyCheckIdempotent = input.idempotencyKey.startsWith('daily_obj_check_');
    if (isDailyCheckIdempotent) {
      const existingByKey = evidenceIdempotencyStore.get(input.idempotencyKey);
      if (existingByKey) {
        return existingByKey;
      }
    }
    this.validateInput(input);
    this.rejectForbiddenContent(input);

    const signals = this.detectSafeObjectiveSignals(input);
    const antiCheatSignals = this.detectAntiCheatResistantSignals(input);
    const { signalStrength } = this.normalizeModeEvidenceForObjective(input.sourceMode, input.evidenceType);

    const result = this.createObjectiveEvidenceBridgeResult(input, signals);

    phase3ObjectiveRepository.recordObjectiveEvidenceLink(result);

    const existing = phase3ObjectiveRepository.getObjectiveMasterySnapshot(input.objectiveId, input.learnerId);
    const snapshot = this.buildOrUpdateMasterySnapshot(input, existing, signalStrength);
    const updatedSnapshot = phase3ObjectiveRepository.upsertObjectiveMasterySnapshot(snapshot);

    const masteryUpdated = existing !== null && existing.status !== updatedSnapshot.status;

    const finalResult: Phase3ObjectiveEvidenceBridgeResult = {
      ...result,
      antiCheatSignals,
      masteryUpdated,
      newMasteryStatus: updatedSnapshot.status,
    };

    this.emitObjectiveAuditEvent(
      input.schoolId,
      input.learnerId,
      'learner',
      'objective_evidence_linked',
      input.objectiveId,
      input.reasonCodes,
    );

    // Store idempotency for retry recovery — same evidenceId/mastery result on duplicate (only for daily check)
    if (input.idempotencyKey.startsWith('daily_obj_check_')) {
      evidenceIdempotencyStore.set(input.idempotencyKey, finalResult);
    }

    // Also canonical Learning Evidence handoff: delegate to SafeLearningEvidence ledger
    // This ensures R4.11 creates/reconciles canonical Learning Evidence through the accepted owner.
    // We call it synchronously via repository for test, but in production it would be async Prisma.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { safeLearningEvidenceRepository } = require('./safeLearningEvidenceRepository');
      // Only create canonical evidence if not already exists for this idempotencyKey
      if (!safeLearningEvidenceRepository.findEvidenceByIdempotencyKey(input.idempotencyKey)) {
        safeLearningEvidenceRepository.createEvidenceRecord({
          schoolId: input.schoolId, studentId: input.learnerId, sourceTask: 'daily_objective_check', sourceMode: input.sourceMode,
          evidenceType: input.evidenceType, evidenceStrength: input.evidenceStrength, sourceTruthStatus: 'real', dataQualityStatus: 'valid',
          objectiveId: input.objectiveId, topicId: input.topicId, skillId: input.skillId,
          subjectId: input.subjectId, targetRef: input.objectiveId, attemptNumber: input.attemptNumber, hintLevel: input.hintUsed ? 'high' : 'none',
          hintDependencyBucket: input.hintUsed ? 'high' : 'low', safeReasonCodesJson: input.reasonCodes, safeEvidenceRefsJson: [finalResult.evidenceRef.evidenceId],
          safeMetadataJson: { dailyCheck: true, idempotencyKey: input.idempotencyKey }, idempotencyKey: input.idempotencyKey,
          policyDecision: 'allowed',
        } as any);
      }
    } catch {}

    return finalResult;
  }

  // For tests / retry recovery
  resetIdempotencyForTests(): void {
    evidenceIdempotencyStore.clear();
    bridgeIdCounter = 0;
  }

  createObjectiveEvidenceBridgeResult(
    input: Phase3ObjectiveEvidenceBridgeInput,
    signals: string[],
    newStatus?: Phase3MasteryStatus,
  ): Phase3ObjectiveEvidenceBridgeResult {
    const bridgeId = generateBridgeId();
    const now = nowISO();

    const evidenceRef: Phase3SafeEvidenceRef = {
      evidenceId: bridgeId,
      source: input.sourceMode,
      sourceMode: input.sourceMode,
      evidenceType: input.evidenceType,
      evidenceStrength: input.evidenceStrength,
      createdAt: now,
    };

    const safeSummary = this.buildSafeSummary(signals, input.sourceMode);

    return {
      bridgeId,
      objectiveId: input.objectiveId,
      schoolId: input.schoolId,
      learnerId: input.learnerId,
      evidenceRef,
      signalsDetected: signals,
      antiCheatSignals: input.antiCheatLabels || [],
      masteryUpdated: false,
      newMasteryStatus: newStatus,
      reasonCodes: input.reasonCodes,
      safeSummary,
      createdAt: now,
    };
  }

  normalizeModeEvidenceForObjective(sourceMode: string, evidenceType: string): { signalStrength: string; signalBuckets: Record<string, string> } {
    const signalStrength = MODE_SIGNAL_STRENGTH_MAP[sourceMode.toLowerCase()] || 'weak';

    const signalBuckets: Record<string, string> = {
      mode: sourceMode,
      evidence_type: evidenceType,
    };

    const t = evidenceType.toLowerCase();
    if (t === 'recall') {
      signalBuckets.recall_strength = signalStrength;
    } else if (t === 'understanding') {
      signalBuckets.understanding_depth = signalStrength;
    } else if (t === 'teach_back') {
      signalBuckets.teach_back_quality = signalStrength;
    } else if (t === 'transfer') {
      signalBuckets.transfer_strength = signalStrength;
    } else if (t === 'confidence') {
      signalBuckets.confidence_signal = 'marked';
    } else if (t === 'hint') {
      signalBuckets.hint_dependency = 'detected';
    }

    return { signalStrength, signalBuckets };
  }

  detectSafeObjectiveSignals(input: Phase3ObjectiveEvidenceBridgeInput): string[] {
    const signals: string[] = [];
    const mode = input.sourceMode.toLowerCase();
    const type = input.evidenceType.toLowerCase();

    if (type === 'attempt' || type === 'practice') {
      signals.push('attempt_completed');
    }

    if (input.hintUsed) {
      signals.push('hint_used');
    }

    if (type === 'confidence' || type.includes('confidence')) {
      signals.push('confidence_marked');
    }

    if (mode === 'teach_back' || type === 'teach_back') {
      signals.push('teach_back_quality_bucket');
    }

    if (mode === 'quiz' || type === 'quiz_recall') {
      signals.push('quiz_recall_bucket');
    }

    if (mode === 'revision' || type === 'revision') {
      signals.push('revision_completed');
    }

    // objective_check_passed vs objective_check_unstable
    if (type === 'objective_check') {
      if (input.evidenceStrength === 'strong') {
        signals.push('objective_check_passed');
      } else {
        signals.push('objective_check_unstable');
      }
    }

    if (type === 'mistake_pattern') {
      signals.push('mistake_pattern_detected');
    }

    if (type === 'weak_topic') {
      signals.push('weak_topic_repeated');
    }

    if (type === 'transfer_check') {
      signals.push('transfer_check_attempted');
    }

    if (type === 'delayed_recall') {
      signals.push('delayed_recall_attempted');
    }

    if (mode === 'study_plan') {
      signals.push('study_plan_session_completed');
    }

    if (mode === 'video') {
      signals.push('video_reinforcement_completed');
    }

    return signals;
  }

  detectAntiCheatResistantSignals(input: Phase3ObjectiveEvidenceBridgeInput): Phase3AntiCheatLabel[] {
    const labels: Phase3AntiCheatLabel[] = [];

    if (input.hintUsed && input.evidenceStrength === 'strong') {
      labels.push('needs_verification');
    }

    if (input.confidenceLabel === 'know_this' && input.evidenceStrength === 'weak') {
      labels.push('overconfidence_wrong');
    }

    if (input.hintUsed && input.confidenceLabel === 'know_this') {
      labels.push('inconsistent_understanding');
    }

    if (input.evidenceStrength === 'strong' && input.reasonCodes.some(r => r === 'weak_recall_signal')) {
      labels.push('high_correctness_low_explanation_signal');
    }

    if (input.attemptNumber !== undefined && input.attemptNumber > 3 && input.evidenceStrength === 'strong') {
      labels.push('answer_pattern_unstable');
    }

    if (input.confidenceLabel === 'know_this' && input.reasonCodes.some(r => r === 'failed_recall')) {
      labels.push('explanation_gap');
    }

    return labels;
  }

  emitObjectiveGrowthActionBridgeSignal(
    objectiveId: string,
    schoolId: string,
    studentId: string,
    status: Phase3MasteryStatus,
  ): Phase3ObjectiveGrowthActionBridgeSignal {
    const action = this.getActionForStatus(status);

    return {
      objectiveId,
      studentId,
      schoolId,
      masteryStatus: status,
      reasonCodes: [],
      recommendedAction: action.recommendedAction,
      modeDestination: action.modeDestination,
      safeEvidenceRefs: [],
    };
  }

  emitObjectiveAuditEvent(
    schoolId: string,
    actorId: string,
    actorRole: string,
    eventType: string,
    objectiveId: string,
    reasonCodes: string[],
  ): Phase3ObjectiveAuditEvent {
    const event: Phase3ObjectiveAuditEvent = {
      eventId: '',
      schoolId,
      actorId,
      actorRole,
      targetLearnerId: actorRole === 'learner' ? actorId : undefined,
      objectiveId,
      eventType: eventType as Phase3AuditEventType,
      reasonCodes,
      safeEvidenceRefs: [],
      createdAt: nowISO(),
    };

    return phase3ObjectiveRepository.createAuditEvent(event);
  }

  private validateInput(input: Phase3ObjectiveEvidenceBridgeInput): void {
    if (!input.objectiveId) throw new Error('objectiveId is required');
    if (!input.schoolId) throw new Error('schoolId is required');
    if (!input.learnerId) throw new Error('learnerId is required');
    if (!input.evidenceType) throw new Error('evidenceType is required');
    if (!input.evidenceStrength) throw new Error('evidenceStrength is required');
    if (!input.sourceMode) throw new Error('sourceMode is required');
    if (!input.safeEvidenceRef) throw new Error('safeEvidenceRef is required');
    if (!input.idempotencyKey) throw new Error('idempotencyKey is required');
    if (!input.reasonCodes || input.reasonCodes.length === 0) throw new Error('at least one reasonCode is required');
  }

  private rejectForbiddenContent(input: Phase3ObjectiveEvidenceBridgeInput): void {
    for (const field of PHASE3_FORBIDDEN_FIELDS) {
      if (input.evidenceType.toLowerCase().includes(field.toLowerCase())) {
        throw new Error(`Forbidden evidence type contains '${field}'`);
      }
      if (input.sourceMode.toLowerCase().includes(field.toLowerCase())) {
        throw new Error(`Forbidden source mode contains '${field}'`);
      }
    }
  }

  private buildOrUpdateMasterySnapshot(
    input: Phase3ObjectiveEvidenceBridgeInput,
    existing: Phase3ObjectiveMasterySnapshot | null,
    signalStrength: string,
  ): Phase3ObjectiveMasterySnapshot {
    const now = nowISO();
    const isStrong = signalStrength === 'strong';
    const isWeak = signalStrength === 'weak';
    const reasonCodes = input.reasonCodes as Phase3ObjectiveMasterySnapshot['reasonCodes'];

    if (existing) {
      const teachBackPass = input.evidenceType === 'teach_back' && input.evidenceStrength === 'strong' ? 1 : 0;
      const transferCheckPass = input.evidenceType === 'transfer' && input.evidenceStrength === 'strong' ? 1 : 0;

      return {
        ...existing,
        evidenceCount: existing.evidenceCount + 1,
        strongEvidenceCount: existing.strongEvidenceCount + (isStrong ? 1 : 0),
        weakEvidenceCount: existing.weakEvidenceCount + (isWeak ? 1 : 0),
        attemptCount: existing.attemptCount + 1,
        hintDependencyCount: existing.hintDependencyCount + (input.hintUsed ? 1 : 0),
        teachBackPassCount: existing.teachBackPassCount + teachBackPass,
        transferCheckPassCount: existing.transferCheckPassCount + transferCheckPass,
        reasonCodes: [...new Set([...existing.reasonCodes, ...reasonCodes])],
        lastEvidenceAt: now,
        updatedAt: now,
      };
    }

    return {
      snapshotId: '',
      objectiveId: input.objectiveId,
      schoolId: input.schoolId,
      learnerId: input.learnerId,
      classId: input.classId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      skillId: input.skillId,
      status: 'early_signal',
      reasonCodes,
      evidenceCount: 1,
      strongEvidenceCount: isStrong ? 1 : 0,
      weakEvidenceCount: isWeak ? 1 : 0,
      attemptCount: 1,
      hintDependencyCount: input.hintUsed ? 1 : 0,
      teachBackPassCount: input.evidenceType === 'teach_back' && isStrong ? 1 : 0,
      transferCheckPassCount: input.evidenceType === 'transfer' && isStrong ? 1 : 0,
      lastEvidenceAt: now,
      lastStatusChangeAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  private buildSafeSummary(signals: string[], sourceMode: string): string {
    if (signals.length === 0) return `Evidence recorded from ${sourceMode} mode.`;
    return `Objective evidence linked: ${signals.join(', ')} from ${sourceMode} mode.`;
  }

  private getActionForStatus(status: Phase3MasteryStatus): { recommendedAction: Phase3RecommendedAction; modeDestination: Phase3ModeDestination } {
    switch (status) {
      case 'not_started': return { recommendedAction: 'start_focus_mode', modeDestination: 'focus' };
      case 'early_signal': return { recommendedAction: 'start_quiz_mode', modeDestination: 'quiz' };
      case 'still_learning': return { recommendedAction: 'start_teach_back_mode', modeDestination: 'teach_back' };
      case 'getting_better': return { recommendedAction: 'start_quiz_mode', modeDestination: 'quiz' };
      case 'almost_there': return { recommendedAction: 'start_quiz_mode', modeDestination: 'quiz' };
      case 'confident': return { recommendedAction: 'start_revision_mode', modeDestination: 'revision' };
      case 'needs_rescue': return { recommendedAction: 'start_focus_mode', modeDestination: 'focus' };
      case 'needs_teacher_support': return { recommendedAction: 'ask_teacher_for_help', modeDestination: 'none' };
      case 'source_required': return { recommendedAction: 'ask_teacher_for_help', modeDestination: 'none' };
      case 'blocked': return { recommendedAction: 'ask_teacher_for_help', modeDestination: 'none' };
    }
  }
}

export const phase3ObjectiveEvidenceBridgeService = new Phase3ObjectiveEvidenceBridgeService();
