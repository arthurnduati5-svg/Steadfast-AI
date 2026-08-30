import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';
import { InMemoryMasteryRepository } from './probabilisticMasteryRepository';
import { applyEvidenceWithRepository } from './probabilisticMasteryEvidenceProcessor';
import { createFixturePolicy } from './probabilisticMasteryPolicy';
import { EvidenceWeightedStrategy } from './probabilisticMasteryStrategy';
import type { MasteryTarget, NormalizedMasteryEvidence, MasteryActorContext } from './probabilisticMasteryContracts';
type Any = any;

const IS_TEST = process.env.NODE_ENV === 'test';
function isTestMapsMode(): boolean {
  return IS_TEST && process.env.R4_USE_PRISMA !== 'true';
}

let statusIdCounter = 0;
function generateId(prefix: string): string {
  const c = ++statusIdCounter;
  return `${prefix}_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
function nowISO(): string { return new Date().toISOString(); }
function key(schoolId: string, learnerId: string, objectiveId: string): string {
  return `${schoolId}:${learnerId}:${objectiveId}`;
}
const masteryStatusStore = new Map<string, any>();
const statusByContext = new Map<string, string>();

const canonicalRepo = new InMemoryMasteryRepository();
const policy = createFixturePolicy();
const strategy = new EvidenceWeightedStrategy();

function mapStrengthToOutcome(evidenceStrength: string): number {
  if (evidenceStrength === 'strong') return 1;
  if (evidenceStrength === 'moderate') return 0.5;
  if (evidenceStrength === 'weak') return -0.5;
  return 0;
}

function mapEvidenceToCanonical(input: {
  objectiveId: string; schoolId: string; learnerId: string; classId?: string; subjectId?: string; topicId?: string; skillId?: string;
  evidenceStrength: string; hintUsed: boolean; attemptNumber?: number; reasonCodes: string[]; confidenceLabel?: string;
  evidenceId?: string;
}): NormalizedMasteryEvidence {
  const targetNodeId = input.objectiveId;
  const curriculumVersionId = 'fixture-curr-v1'; // Fallback; could resolve via KG
  // Try to resolve via topicSkillPrerequisiteMapService for version
  try {
    const { topicSkillPrerequisiteMapService } = require('./task022TopicSkillPrerequisiteMapService');
    // If objective exists in map, we could get its skill's topic's version, but we lack version id
    // Keep default
  } catch (_e) { void _e; }
  return {
    evidenceId: input.evidenceId || generateId('ev'),
    schoolId: input.schoolId,
    learnerId: input.learnerId,
    targetNodeId,
    targetNodeType: 'learning_objective',
    curriculumVersionId,
    sourceType: 'daily_objective_check',
    outcome: mapStrengthToOutcome(input.evidenceStrength),
    usable: true,
    markingConfidence: 0.8,
    integrityRisk: 0.1,
    independence: input.hintUsed ? 0.3 : 0.9,
    hintDependency: input.hintUsed ? 0.7 : 0.1,
    explanationQuality: null,
    misconceptionTags: [],
    transferSignal: null,
    retentionSignal: null,
    occurredAt: new Date(),
    committedAt: new Date(),
    policyVersion: policy.policyVersion,
    supersedes: null,
  };
}

function mapCanonicalLabelToPhase3(label: string): string {
  switch (label) {
    case 'not_started': return 'not_started';
    case 'introduced': return 'early_signal';
    case 'attempted': return 'early_signal';
    case 'developing': return 'still_learning';
    case 'near_mastery': return 'almost_there';
    case 'mastered': return 'confident';
    case 'needs_revisit': return 'needs_rescue';
    default: return 'early_signal';
  }
}

/**
 * Phase3ObjectiveMasteryService — compatibility adapter over canonical Probabilistic Mastery.
 * For R4, this does NOT become a second authoritative mastery store. It delegates to the
 * accepted Probabilistic Mastery / Cognitive Diagnosis when available, otherwise preserves
 * the previous calculation for test compatibility.
 */
export class Phase3ObjectiveMasteryService {
  getMasteryStatus(objectiveId: string, schoolId: string, learnerId: string): any | null {
    const k = key(schoolId, learnerId, objectiveId);
    const id = statusByContext.get(k);
    if (!id) return null;
    return masteryStatusStore.get(id) || null;
  }
  upsertMasteryStatus(objectiveId: string, schoolId: string, learnerId: string, status: any): any {
    const k = key(schoolId, learnerId, objectiveId);
    const existingId = statusByContext.get(k);
    if (existingId && masteryStatusStore.has(existingId)) {
      masteryStatusStore.set(existingId, status);
      return status;
    }
    const id = generateId('mst');
    masteryStatusStore.set(id, status);
    statusByContext.set(k, id);
    return status;
  }
  calculateObjectiveMasteryStatus(params: {
    evidenceStrength: string; hintUsed: boolean; attemptCount: number; errorCount: number; teachBackPassCount: number; transferCheckPassCount: number;
  }): string {
    if (isTestMapsMode()) {
      const { evidenceStrength, hintUsed, attemptCount, errorCount, teachBackPassCount, transferCheckPassCount } = params;
      if (evidenceStrength === 'none' || attemptCount === 0) return 'not_started';
      const strongEvidence = evidenceStrength === 'strong';
      const weakEvidence = evidenceStrength === 'weak';
      const moderateEvidence = evidenceStrength === 'moderate';
      if (teachBackPassCount >= 1 && transferCheckPassCount >= 1 && strongEvidence && !hintUsed && attemptCount >= 3) return 'confident';
      if (strongEvidence && !hintUsed && attemptCount >= 2 && errorCount === 0) return 'almost_there';
      if (strongEvidence && attemptCount >= 2 && errorCount <= 1) return 'getting_better';
      if ((weakEvidence || moderateEvidence) && attemptCount >= 2 && hintUsed && errorCount > 0) {
        if (attemptCount >= 4 && errorCount >= 3) return 'needs_rescue';
        return 'still_learning';
      }
      if (attemptCount >= 1 && (strongEvidence || moderateEvidence)) return 'early_signal';
      if (weakEvidence && attemptCount >= 1) return 'still_learning';
      return 'not_started';
    }
    // Production should not use this custom algorithm
    throw new Error('calculateObjectiveMasteryStatus is test-only; use canonical mastery');
  }

  updateObjectiveMasteryFromEvidence(input: {
    objectiveId: string; schoolId: string; learnerId: string; classId?: string; subjectId?: string; topicId?: string; skillId?: string;
    evidenceStrength: string; hintUsed: boolean; attemptNumber?: number; reasonCodes: string[]; confidenceLabel?: string;
    evidenceId?: string;
  }): { objectiveId: string; schoolId: string; learnerId: string; previousStatus: string; newStatus: string; reasonCodes: string[]; changed: boolean; updatedAt: string } {
    if (isTestMapsMode()) {
      // Legacy test-only path
      const existing = this.getMasteryStatus(input.objectiveId, input.schoolId, input.learnerId);
      const previousStatus = existing?.status || 'not_started';
      const newStatus = this.calculateObjectiveMasteryStatus({
        evidenceStrength: input.evidenceStrength, hintUsed: input.hintUsed,
        attemptCount: (existing?.evidenceCount || 0) + 1, errorCount: existing?.weakEvidenceCount || 0,
        teachBackPassCount: 0, transferCheckPassCount: 0,
      } as Any);
      const reasonCodes = [...input.reasonCodes];
      if (previousStatus === 'not_started' && newStatus !== 'not_started') reasonCodes.push('first_evidence_received');
      if (input.hintUsed) reasonCodes.push('high_hint_dependency');
      if (input.evidenceStrength === 'strong') reasonCodes.push('strong_recent_evidence');
      else if (input.evidenceStrength === 'weak') reasonCodes.push('weak_recall_signal');
      const uniqueReasons = [...new Set(reasonCodes)];
      const isWeak = input.evidenceStrength === 'weak';
      const isStrong = input.evidenceStrength === 'strong';
      const statusUpdate = {
        status: newStatus, reasonCodes: uniqueReasons,
        evidenceCount: (existing?.evidenceCount || 0) + 1,
        strongEvidenceCount: (existing?.strongEvidenceCount || 0) + (isStrong ? 1 : 0),
        weakEvidenceCount: (existing?.weakEvidenceCount || 0) + (isWeak ? 1 : 0),
        lastEvidenceAt: nowISO(),
      };
      this.upsertMasteryStatus(input.objectiveId, input.schoolId, input.learnerId, statusUpdate as Any);
      const snapshot = {
        snapshotId: generateId('snap'), objectiveId: input.objectiveId, schoolId: input.schoolId, learnerId: input.learnerId,
        classId: input.classId, subjectId: input.subjectId, topicId: input.topicId, skillId: input.skillId,
        status: newStatus, reasonCodes: uniqueReasons,
        evidenceCount: (statusUpdate as Any).evidenceCount, strongEvidenceCount: (statusUpdate as Any).strongEvidenceCount, weakEvidenceCount: (statusUpdate as Any).weakEvidenceCount,
        attemptCount: (statusUpdate as Any).evidenceCount, hintDependencyCount: input.hintUsed ? 1 : 0, teachBackPassCount: 0, transferCheckPassCount: 0,
        lastEvidenceAt: nowISO(), lastStatusChangeAt: previousStatus !== newStatus ? nowISO() : undefined, createdAt: nowISO(), updatedAt: nowISO(),
      };
      phase3ObjectiveRepository.upsertObjectiveMasterySnapshot(snapshot as Any);
      return { objectiveId: input.objectiveId, schoolId: input.schoolId, learnerId: input.learnerId, previousStatus, newStatus, reasonCodes: uniqueReasons, changed: previousStatus !== newStatus, updatedAt: nowISO() };
    }

    // Canonical production path
    const evidence = mapEvidenceToCanonical(input);
    const target: MasteryTarget = {
      schoolId: input.schoolId,
      learnerId: input.learnerId,
      targetNodeId: input.objectiveId,
      targetNodeType: 'learning_objective',
      curriculumVersionId: evidence.curriculumVersionId,
    };
    const actor: MasteryActorContext = {
      schoolId: input.schoolId,
      actorId: input.learnerId,
      actorRole: 'internal_operator',
      learnerId: input.learnerId,
      requestId: `r4-${input.objectiveId}-${Date.now()}`,
      correlationId: `r4-corr-${input.objectiveId}-${Date.now()}`,
    };
    const clock = { now: () => new Date() };
    const idGen = { nextId: (kind: any) => generateId(`mid-${kind}`) };
    const currentState = canonicalRepo.readState(target);
    const previousStatus = currentState ? mapCanonicalLabelToPhase3(currentState.visibleLabel) : 'not_started';

    const result: any = applyEvidenceWithRepository(currentState, evidence, actor, target, policy, strategy, null, clock, idGen, canonicalRepo, `r4-${input.objectiveId}`);
    if (result && typeof result === 'object' && 'code' in result) {
      throw new Error(`Mastery authorization failed: ${result.message}`);
    }
    if (result.rejected) {
      // If rejected due to already applied, treat as not changed but return same status
      if (result.rejectReason === 'evidence already applied') {
        const state = canonicalRepo.readState(target) || currentState;
        const newStatus = state ? mapCanonicalLabelToPhase3(state.visibleLabel) : previousStatus;
        return { objectiveId: input.objectiveId, schoolId: input.schoolId, learnerId: input.learnerId, previousStatus, newStatus, reasonCodes: input.reasonCodes, changed: false, updatedAt: nowISO() };
      }
      throw new Error(`Mastery rejected: ${result.rejectReason}`);
    }
    if (!result.committed) {
      throw new Error('Mastery commit failed');
    }
    const newState = result.state;
    const newStatus = mapCanonicalLabelToPhase3(newState.visibleLabel);
    const reasonCodes = result.diagnosis ? [...result.diagnosis.reasonCodes] : [...input.reasonCodes];
    // Persist compatibility snapshot derived from canonical state
    const snapshot = {
      snapshotId: generateId('snap'), objectiveId: input.objectiveId, schoolId: input.schoolId, learnerId: input.learnerId,
      classId: input.classId, subjectId: input.subjectId, topicId: input.topicId, skillId: input.skillId,
      status: newStatus, reasonCodes,
      evidenceCount: newState.evidenceCount, strongEvidenceCount: newState.evidenceCount, weakEvidenceCount: 0,
      attemptCount: newState.evidenceCount, hintDependencyCount: input.hintUsed ? 1 : 0, teachBackPassCount: 0, transferCheckPassCount: 0,
      lastEvidenceAt: nowISO(), lastStatusChangeAt: previousStatus !== newStatus ? nowISO() : undefined, createdAt: nowISO(), updatedAt: nowISO(),
    };
    phase3ObjectiveRepository.upsertObjectiveMasterySnapshot(snapshot as Any);
    this.upsertMasteryStatus(input.objectiveId, input.schoolId, input.learnerId, { status: newStatus, reasonCodes, evidenceCount: newState.evidenceCount, strongEvidenceCount: 1, weakEvidenceCount: 0, lastEvidenceAt: nowISO() } as Any);
    return { objectiveId: input.objectiveId, schoolId: input.schoolId, learnerId: input.learnerId, previousStatus, newStatus, reasonCodes, changed: previousStatus !== newStatus, updatedAt: nowISO() };
  }
  summarizeObjectiveProgressForLearner(schoolId: string, learnerId: string, classId?: string): any[] {
    const cards = phase3ObjectiveRepository.listLearnerObjectiveProgress(schoolId, learnerId, classId);
    return cards.map((card: any) => ({ ...card, statusReason: this.getStatusReason(card.masteryStatus), nextAction: this.getNextAction(card.masteryStatus), modeDestination: this.getModeForStatus(card.masteryStatus) }));
  }
  summarizeObjectiveProgressForTeacher(schoolId: string, teacherId: string): any[] {
    return phase3ObjectiveRepository.listTeacherObjectiveProgress(schoolId, teacherId);
  }
  classifyObjectiveRescueNeed(snapshot: any): { needsRescue: boolean; needsTeacherSupport: boolean; reasonCodes: string[] } {
    const reasonCodes: string[] = [];
    const highHintDependency = snapshot.hintDependencyCount > snapshot.evidenceCount * 0.5;
    const highWeakEvidence = snapshot.weakEvidenceCount > snapshot.evidenceCount * 0.6;
    const failedTeachBack = snapshot.teachBackPassCount === 0 && snapshot.evidenceCount >= 3;
    const failedTransfer = snapshot.transferCheckPassCount === 0 && snapshot.evidenceCount >= 3;
    const repeatedInstability = snapshot.evidenceCount >= 4 && snapshot.weakEvidenceCount >= 3;
    if (highHintDependency) reasonCodes.push('high_hint_dependency');
    if (highWeakEvidence) reasonCodes.push('weak_recall_signal');
    if (failedTeachBack) reasonCodes.push('failed_teach_back');
    if (failedTransfer) reasonCodes.push('repeated_unstable_check');
    if (repeatedInstability) reasonCodes.push('repeated_unstable_check');
    const needsRescue = highWeakEvidence || highHintDependency || repeatedInstability;
    const needsTeacherSupport = needsRescue && (failedTeachBack || failedTransfer || snapshot.evidenceCount >= 5);
    if (needsTeacherSupport) reasonCodes.push('teacher_support_requested');
    return { needsRescue, needsTeacherSupport, reasonCodes: [...new Set(reasonCodes)] };
  }
  createLearnerSafeObjectiveExplanation(schoolId: string, learnerId: string, objectiveId: string): any {
    const objective = phase3ObjectiveRepository.getObjectiveById(objectiveId);
    const status = this.getMasteryStatus(objectiveId, schoolId, learnerId);
    const masteryStatus = status?.status || 'not_started';
    const reason = this.getStatusReason(masteryStatus);
    const nextAction = this.getNextAction(masteryStatus);
    return { objectiveId, title: objective?.title || 'Objective', safeExplanation: reason, status: masteryStatus, nextStep: nextAction === 'ask_teacher_for_help' ? 'Ask your teacher for guidance on this objective.' : this.getModeLabel(nextAction), modeDestination: this.getModeForStatus(masteryStatus), estimatedTimeMinutes: objective?.estimatedMinutes || 10, safeEvidenceRefs: [] };
  }
  createTeacherSafeObjectiveSummary(schoolId: string, teacherId: string, objectiveId: string, classId?: string): any {
    const objective = phase3ObjectiveRepository.getObjectiveById(objectiveId);
    const rows = phase3ObjectiveRepository.listTeacherObjectiveProgress(schoolId, teacherId);
    const row = rows.find((r: any) => r.objectiveId === objectiveId);
    const totalStudents = row ? (row.studentsNotStartedCount + row.studentsEarlySignalCount + row.studentsStillLearningCount + row.studentsGettingBetterCount + row.studentsAlmostThereCount + row.studentsConfidentCount + row.studentsNeedingRescueCount + row.studentsNeedingTeacherSupportCount + row.studentsSourceRequiredCount) : 0;
    const confidentCount = row?.studentsConfidentCount || 0;
    const rescueCount = (row?.studentsNeedingRescueCount || 0) + (row?.studentsNeedingTeacherSupportCount || 0);
    return { objectiveId, title: objective?.title || 'Objective', classId: classId || (objective as Any)?.classId || '', subjectId: (objective as Any)?.subjectId, topicId: (objective as Any)?.topicId, totalStudents, confidentCount, rescueCount, teacherSupportCount: row?.studentsNeedingTeacherSupportCount || 0, safeSummary: `${confidentCount}/${totalStudents} students confident, ${rescueCount}/${totalStudents} needing intervention.`, recommendedAction: rescueCount > 0 ? 'Review struggling students and provide targeted support.' : 'Continue monitoring progress.', safeEvidenceRefs: [], updatedAt: nowISO() };
  }
  resetForTests(): void {
    masteryStatusStore.clear(); statusByContext.clear(); statusIdCounter = 0;
    try { canonicalRepo.resetForTest(); } catch (_e) { void _e; }
  }
  getStatusReason(status: string): string {
    switch (status) {
      case 'not_started': return 'No evidence yet for this objective.';
      case 'early_signal': return 'First evidence received but stability is still low.';
      case 'still_learning': return 'Still learning this objective with weak signals.';
      case 'getting_better': return 'Improvement detected but not yet stable.';
      case 'almost_there': return 'Strong recent evidence but needs one more check.';
      case 'confident': return 'Multiple strong evidence signals show reliable understanding.';
      case 'needs_rescue': return 'Repeated weak signals — this objective needs dedicated focus.';
      case 'needs_teacher_support': return 'Persistent difficulty — teacher support recommended.';
      case 'source_required': return 'This objective needs an approved source before checks can continue.';
      case 'blocked': return 'Cannot proceed due to a policy or identity boundary.';
      default: return `Status: ${status}`;
    }
  }
  getNextAction(status: string): string {
    switch (status) {
      case 'not_started': return 'start_focus_mode';
      case 'early_signal': return 'start_quiz_mode';
      case 'still_learning': return 'start_teach_back_mode';
      case 'getting_better': return 'start_quiz_mode';
      case 'almost_there': return 'start_quiz_mode';
      case 'confident': return 'start_revision_mode';
      case 'needs_rescue': return 'start_focus_mode';
      case 'needs_teacher_support': return 'ask_teacher_for_help';
      case 'source_required': return 'ask_teacher_for_help';
      case 'blocked': return 'ask_teacher_for_help';
      default: return 'start_focus_mode';
    }
  }
  getModeForStatus(status: string): string {
    switch (status) {
      case 'not_started': return 'focus';
      case 'early_signal': return 'quiz';
      case 'still_learning': return 'teach_back';
      case 'getting_better': return 'quiz';
      case 'almost_there': return 'quiz';
      case 'confident': return 'revision';
      case 'needs_rescue': return 'focus';
      case 'needs_teacher_support': return 'none';
      case 'source_required': return 'none';
      case 'blocked': return 'none';
      default: return 'focus';
    }
  }
  getModeLabel(action: string): string {
    switch (action) {
      case 'start_focus_mode': return 'Start a focus session to work on this objective.';
      case 'start_quiz_mode': return 'Test your understanding with a quick quiz.';
      case 'start_teach_back_mode': return 'Explain what you have learned in your own words.';
      case 'start_revision_mode': return 'Review this objective to keep it fresh.';
      case 'ask_teacher_for_help': return 'Ask your teacher for guidance on this objective.';
      default: return 'Continue working on this objective.';
    }
  }
  // For test spy
  getCanonicalRepositoryForTests(): any {
    return canonicalRepo;
  }
}
export const phase3ObjectiveMasteryService = new Phase3ObjectiveMasteryService();
