import {
  Phase3ConfidenceObservation,
  Phase3ConfidenceCalibrationResult,
  Phase3ConfidenceMismatch,
  Phase3MicroMasterySignal,
  Phase3WeakTopicRecoveryPlan,
  Phase3WeakTopicRecoveryStep,
  Phase3RecoveryActionCard,
  Phase3ConfidenceRecoveryAuditEvent,
  Phase3RecoveryStatus,
  Phase3RecoveryAction,
} from '../contracts/phase3ConfidenceRecoveryContracts';

interface ConfidenceRecoveryStore {
  observations: Map<string, Phase3ConfidenceObservation>;
  calibrations: Map<string, Phase3ConfidenceCalibrationResult>;
  mismatches: Map<string, Phase3ConfidenceMismatch>;
  microMasterySignals: Map<string, Phase3MicroMasterySignal>;
  recoveryPlans: Map<string, Phase3WeakTopicRecoveryPlan>;
  recoveryActionCards: Map<string, Phase3RecoveryActionCard>;
  auditEvents: Phase3ConfidenceRecoveryAuditEvent[];
}

const store: ConfidenceRecoveryStore = {
  observations: new Map(),
  calibrations: new Map(),
  mismatches: new Map(),
  microMasterySignals: new Map(),
  recoveryPlans: new Map(),
  recoveryActionCards: new Map(),
  auditEvents: [],
};

export function recordConfidenceObservation(obs: Phase3ConfidenceObservation): Phase3ConfidenceObservation {
  store.observations.set(obs.observationId, obs);
  return obs;
}

export function listConfidenceObservationsForLearner(schoolId: string, studentId: string): Phase3ConfidenceObservation[] {
  return Array.from(store.observations.values())
    .filter((o) => o.schoolId === schoolId && o.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getConfidenceObservation(observationId: string): Phase3ConfidenceObservation | undefined {
  return store.observations.get(observationId);
}

export function upsertConfidenceCalibrationResult(
  result: Phase3ConfidenceCalibrationResult
): Phase3ConfidenceCalibrationResult {
  store.calibrations.set(result.calibrationId, result);
  return result;
}

export function getConfidenceCalibrationResult(calibrationId: string): Phase3ConfidenceCalibrationResult | undefined {
  return store.calibrations.get(calibrationId);
}

export function listConfidenceCalibrationResultsForLearner(
  schoolId: string,
  studentId: string
): Phase3ConfidenceCalibrationResult[] {
  return Array.from(store.calibrations.values())
    .filter((c) => c.schoolId === schoolId && c.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertConfidenceMismatch(mismatch: Phase3ConfidenceMismatch): Phase3ConfidenceMismatch {
  store.mismatches.set(mismatch.mismatchId, mismatch);
  return mismatch;
}

export function listConfidenceMismatchesForLearner(schoolId: string, studentId: string): Phase3ConfidenceMismatch[] {
  return Array.from(store.mismatches.values())
    .filter((m) => m.schoolId === schoolId && m.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertMicroMasterySignal(signal: Phase3MicroMasterySignal): Phase3MicroMasterySignal {
  store.microMasterySignals.set(signal.signalId, signal);
  return signal;
}

export function getMicroMasterySignal(signalId: string): Phase3MicroMasterySignal | undefined {
  return store.microMasterySignals.get(signalId);
}

export function listMicroMasterySignalsForLearner(schoolId: string, studentId: string): Phase3MicroMasterySignal[] {
  return Array.from(store.microMasterySignals.values())
    .filter((s) => s.schoolId === schoolId && s.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listMicroMasterySignalsByObjective(
  schoolId: string,
  studentId: string,
  objectiveId: string
): Phase3MicroMasterySignal[] {
  return Array.from(store.microMasterySignals.values())
    .filter((s) => s.schoolId === schoolId && s.studentId === studentId && s.objectiveId === objectiveId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertWeakTopicRecoveryPlan(plan: Phase3WeakTopicRecoveryPlan): Phase3WeakTopicRecoveryPlan {
  store.recoveryPlans.set(plan.planId, plan);
  return plan;
}

export function getWeakTopicRecoveryPlan(planId: string): Phase3WeakTopicRecoveryPlan | undefined {
  return store.recoveryPlans.get(planId);
}

export function listWeakTopicRecoveryPlansForLearner(schoolId: string, studentId: string): Phase3WeakTopicRecoveryPlan[] {
  return Array.from(store.recoveryPlans.values())
    .filter((p) => p.schoolId === schoolId && p.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listWeakTopicRecoveryPlansByTopic(
  schoolId: string,
  studentId: string,
  topicId: string
): Phase3WeakTopicRecoveryPlan[] {
  return Array.from(store.recoveryPlans.values())
    .filter((p) => p.schoolId === schoolId && p.studentId === studentId && p.topicId === topicId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateRecoveryPlanStatus(
  planId: string,
  status: Phase3RecoveryStatus
): Phase3WeakTopicRecoveryPlan | undefined {
  const plan = store.recoveryPlans.get(planId);
  if (!plan) return undefined;
  plan.status = status;
  plan.updatedAt = new Date().toISOString();
  return plan;
}

export function completeRecoveryStep(
  planId: string,
  stepId: string
): { plan: Phase3WeakTopicRecoveryPlan; step: Phase3WeakTopicRecoveryStep } | undefined {
  const plan = store.recoveryPlans.get(planId);
  if (!plan) return undefined;
  const step = plan.steps.find((s) => s.stepId === stepId);
  if (!step) return undefined;
  step.completed = true;
  step.completedAt = new Date().toISOString();
  plan.updatedAt = new Date().toISOString();
  return { plan, step };
}

export function upsertRecoveryActionCard(card: Phase3RecoveryActionCard): Phase3RecoveryActionCard {
  store.recoveryActionCards.set(card.actionId, card);
  return card;
}

export function listRecoveryActionCardsForLearner(schoolId: string, studentId: string): Phase3RecoveryActionCard[] {
  return Array.from(store.recoveryActionCards.values())
    .filter((c) => c.schoolId === schoolId && c.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordConfidenceRecoveryAuditEvent(
  event: Phase3ConfidenceRecoveryAuditEvent
): Phase3ConfidenceRecoveryAuditEvent {
  store.auditEvents.push(event);
  return event;
}

export function listConfidenceRecoveryAuditEvents(
  schoolId: string,
  limit = 100
): Phase3ConfidenceRecoveryAuditEvent[] {
  return store.auditEvents
    .filter((e) => e.schoolId === schoolId)
    .slice(-limit)
    .reverse();
}

export function resetPhase3ConfidenceRecoveryRepositoryForTests(): void {
  store.observations.clear();
  store.calibrations.clear();
  store.mismatches.clear();
  store.microMasterySignals.clear();
  store.recoveryPlans.clear();
  store.recoveryActionCards.clear();
  store.auditEvents = [];
}
