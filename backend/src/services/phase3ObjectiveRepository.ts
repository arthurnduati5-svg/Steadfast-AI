import type {
  Phase3Objective,
  Phase3ObjectiveCheckBlueprint,
  Phase3ObjectiveMasterySnapshot,
  Phase3ObjectiveEvidenceBridgeResult,
  Phase3ObjectiveAuditEvent,
  Phase3DailyObjectiveCheckSeed,
} from '../contracts/phase3ObjectiveMasteryContracts';

type Any = any;

let objectiveIdCounter = 0;
let blueprintIdCounter = 0;
let snapshotIdCounter = 0;
let bridgeIdCounter = 0;
let eventIdCounter = 0;
let seedIdCounter = 0;

function generateId(prefix: string): string {
  const c =
    prefix === 'obj'
      ? ++objectiveIdCounter
      : prefix === 'bp'
        ? ++blueprintIdCounter
        : prefix === 'snap'
          ? ++snapshotIdCounter
          : prefix === 'br'
            ? ++bridgeIdCounter
            : prefix === 'evt'
              ? ++eventIdCounter
              : ++seedIdCounter;
  return `${prefix}_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function key(schoolId: string, id: string): string {
  return `${schoolId}:${id}`;
}

const IS_TEST = process.env.NODE_ENV === 'test';

const objectiveStore = new Map<string, Phase3Objective>();
const blueprintStore = new Map<string, Phase3ObjectiveCheckBlueprint>();
const snapshotStore = new Map<string, Phase3ObjectiveMasterySnapshot>();
const bridgeResultStore = new Map<string, Phase3ObjectiveEvidenceBridgeResult>();
const auditStore = new Map<string, Phase3ObjectiveAuditEvent>();
const seedStore = new Map<string, Phase3DailyObjectiveCheckSeed>();
const objectivesBySchool = new Map<string, Set<string>>();
const objectivesByClass = new Map<string, Set<string>>();
const objectivesByTeacher = new Map<string, Set<string>>();
const blueprintsByObjective = new Map<string, string>();
const snapshotsByObjectiveAndLearner = new Map<string, string>();
const seedsByStudent = new Map<string, Set<string>>();

function mapCanonicalToPhase3(canonical: any, fallbackSchoolId?: string): Phase3Objective {
  // canonical is from topicSkillPrerequisiteMapService or learningObjectiveGovernanceService
  // Normalize to Phase3Objective
  return {
    objectiveId: canonical.objectiveId || canonical.id,
    schoolId: canonical.schoolId || fallbackSchoolId || 'unknown',
    classId: canonical.classId,
    subjectId: canonical.subjectId || canonical.subject,
    topicId: canonical.topicId || canonical.curriculumTopicId,
    skillId: canonical.skillId || canonical.curriculumSkillId,
    teacherId: canonical.teacherId,
    creatorId: canonical.creatorId || 'system',
    creatorRole: canonical.creatorRole || 'teacher',
    objectiveType: canonical.objectiveType || 'lesson_objective',
    difficultyBucket: canonical.difficultyBucket || canonical.difficultyBand || 'core',
    title: canonical.title || canonical.studentSafeDescription || 'Objective',
    safeDescription: canonical.safeDescription || canonical.studentSafeDescription || canonical.teacherSafeDescription || 'Safe description',
    successCriteria: canonical.successCriteria || [],
    sourceTruthStatus: canonical.sourceTruthStatus || { status: canonical.status === 'active' || canonical.status === 'approved' ? 'approved' : canonical.status } || { status: 'approved' },
    isArchived: canonical.isArchived || false,
    safeTags: canonical.safeTags || [],
    estimatedMinutes: canonical.estimatedMinutes || 10,
    createdAt: canonical.createdAt || nowISO(),
    updatedAt: canonical.updatedAt || nowISO(),
  } as Any;
}

/**
 * Phase3ObjectiveRepository — compatibility facade.
 * Canonical curriculum truth is LearningObjectiveRecord / CurriculumTopicRecord / CurriculumSkillRecord
 * via Prisma. This repository retains class/taught-objective assignment metadata and safe snapshots
 * for compatibility. Canonical curriculum fields must come from / reference the accepted Knowledge Graph
 * when available. For R4, objective lookup first checks local store then, if available, verifies against
 * canonical LearningObjectiveRecord via Prisma (fail closed if not found when canonical is required).
 */
export class Phase3ObjectiveRepository {
  createObjective(input: {
    schoolId: string;
    classId?: string;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
    teacherId?: string;
    creatorId: string;
    creatorRole: string;
    objectiveType: string;
    difficultyBucket: string;
    title: string;
    safeDescription: string;
    successCriteria: any[];
    sourceTruthStatus: any;
    isArchived?: boolean;
    safeTags?: string[];
    estimatedMinutes: number;
  }): Phase3Objective {
    if (!IS_TEST) {
      // Production: fail closed — Phase3 objective creation is not an authoritative curriculum authoring path.
      // Canonical objectives must be created via the accepted Knowledge Graph / curriculum governance service.
      throw new Error('Phase3 objective creation is not an authoritative curriculum authoring path. Use the canonical Knowledge Graph authoring service.');
    }
    // Test-only: create in local Map stores for legacy test fixtures
    const objectiveId = generateId('obj');
    const now = nowISO();
    const obj: Phase3Objective = {
      objectiveId,
      schoolId: input.schoolId,
      classId: input.classId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      skillId: input.skillId,
      teacherId: input.teacherId,
      creatorId: input.creatorId,
      creatorRole: input.creatorRole,
      objectiveType: input.objectiveType as Any,
      difficultyBucket: input.difficultyBucket as Any,
      title: input.title,
      safeDescription: input.safeDescription,
      successCriteria: input.successCriteria || [],
      sourceTruthStatus: input.sourceTruthStatus,
      isArchived: false,
      safeTags: [],
      estimatedMinutes: input.estimatedMinutes,
      createdAt: now,
      updatedAt: now,
    };
    objectiveStore.set(objectiveId, obj);
    const sk = input.schoolId;
    if (!objectivesBySchool.has(sk)) objectivesBySchool.set(sk, new Set());
    objectivesBySchool.get(sk)!.add(objectiveId);
    if (input.classId) {
      const ck = key(sk, input.classId);
      if (!objectivesByClass.has(ck)) objectivesByClass.set(ck, new Set());
      objectivesByClass.get(ck)!.add(objectiveId);
    }
    if (input.teacherId) {
      const tk = key(sk, input.teacherId);
      if (!objectivesByTeacher.has(tk)) objectivesByTeacher.set(tk, new Set());
      objectivesByTeacher.get(tk)!.add(objectiveId);
    }
    // Register in canonical map for test-mode delegation
    try {
      const { topicSkillPrerequisiteMapService } = require('./task022TopicSkillPrerequisiteMapService');
      const { learningObjectiveGovernanceService } = require('./task022LearningObjectiveGovernanceService');
      topicSkillPrerequisiteMapService.registerObjective({ objectiveId, curriculumSkillId: input.skillId, title: input.title, status: 'active' } as Any);
      learningObjectiveGovernanceService.registerObjective({ objectiveId, curriculumSkillId: input.skillId, title: input.title, status: 'active' } as Any);
      if (input.skillId) {
        topicSkillPrerequisiteMapService.registerSkill({ skillId: input.skillId, curriculumTopicId: input.topicId, title: input.skillId } as Any);
      }
      if (input.topicId) {
        topicSkillPrerequisiteMapService.registerTopic({ topicId: input.topicId, curriculumVersionId: input.topicId, subject: input.subjectId, title: input.topicId } as Any);
      }
    } catch (_e) { void _e; }
    return obj;
  }

  updateObjective(objectiveId: string, updates: Partial<Phase3Objective>): Phase3Objective | null {
    const existing = objectiveStore.get(objectiveId);
    if (!existing) return null;
    const updated: Phase3Objective = { ...existing, ...updates, objectiveId, updatedAt: nowISO() } as Any;
    objectiveStore.set(objectiveId, updated);
    return updated;
  }

  archiveObjective(objectiveId: string): Phase3Objective | null {
    return this.updateObjective(objectiveId, { isArchived: true, archivedAt: nowISO() } as Any);
  }

  getObjectiveById(objectiveId: string): Phase3Objective | null {
    if (IS_TEST) {
      // Test-only: check local Map stores, then canonical map
      const fromStore = objectiveStore.get(objectiveId);
      if (fromStore) return fromStore;
      try {
        const { topicSkillPrerequisiteMapService } = require('./task022TopicSkillPrerequisiteMapService');
        const canon = topicSkillPrerequisiteMapService.getObjective(objectiveId);
        if (canon) return mapCanonicalToPhase3(canon);
      } catch (_e) { void _e; }
      return null;
    }
    // Production: sync method is deprecated. Fail closed — callers must use getObjectiveByIdAsync.
    throw new Error('Synchronous objective lookup is not available in production. Use getObjectiveByIdAsync for canonical resolution.');
  }

  async getObjectiveByIdAsync(objectiveId: string): Promise<Phase3Objective | null> {
    if (IS_TEST) {
      // Test-only: check local stores, then canonical maps
      const fromStore = objectiveStore.get(objectiveId);
      if (fromStore) return fromStore;
      try {
        const { topicSkillPrerequisiteMapService } = require('./task022TopicSkillPrerequisiteMapService');
        const canon = topicSkillPrerequisiteMapService.getObjective(objectiveId);
        if (canon) return mapCanonicalToPhase3(canon);
      } catch (_e) { void _e; }
      try {
        const { learningObjectiveGovernanceService } = require('./task022LearningObjectiveGovernanceService');
        const gov = learningObjectiveGovernanceService.getObjective(objectiveId);
        if (gov) return mapCanonicalToPhase3(gov);
      } catch (_e) { void _e; }
      // Try Prisma in test too if R4_USE_PRISMA is set
      if (process.env.R4_USE_PRISMA === 'true') {
        return this.resolveFromPrisma(objectiveId);
      }
      return null;
    }

    // Production: Prisma is the only authoritative source. Do NOT check objectiveStore or Map services first.
    return this.resolveFromPrisma(objectiveId);
  }

  private async resolveFromPrisma(objectiveId: string): Promise<Phase3Objective | null> {
    const { default: prismaClient } = await import('../lib/prisma');
    const row: any = await prismaClient.learningObjectiveRecord.findUnique({ where: { id: objectiveId } });
    if (!row) return null; // Not found in canonical KG is a legitimate null
    let skill: any = null;
    let topic: any = null;
    try {
      skill = await prismaClient.curriculumSkillRecord.findUnique({ where: { id: row.curriculumSkillId } });
      if (skill) topic = await prismaClient.curriculumTopicRecord.findUnique({ where: { id: skill.curriculumTopicId } });
    } catch (e: any) {
      // Prisma failure must be thrown, not swallowed as null — caller needs to distinguish "not found" from "unavailable"
      throw new Error(`Canonical KG persistence failure: ${e?.message || 'unknown'}`);
    }
    const mapped = mapCanonicalToPhase3({
      ...row,
      objectiveId: row.id,
      skillId: row.curriculumSkillId,
      topicId: skill?.curriculumTopicId,
      subjectId: topic?.subject,
      status: row.status,
    }, row.schoolId);
    // Cache in local store so sync callers (e.g. blueprint service) can find it
    objectiveStore.set(objectiveId, mapped);
    return mapped;
  }

  // Alias for compatibility
  getObjective(objectiveId: string): Phase3Objective | null {
    return this.getObjectiveById(objectiveId);
  }

  async getObjectiveAsync(objectiveId: string): Promise<Phase3Objective | null> {
    return this.getObjectiveByIdAsync(objectiveId);
  }

  listObjectivesBySchool(schoolId: string): Phase3Objective[] {
    const ids = objectivesBySchool.get(schoolId);
    if (!ids) return [];
    return Array.from(ids).map((id) => objectiveStore.get(id)).filter(Boolean) as Phase3Objective[];
  }

  listObjectivesByClass(schoolId: string, classId: string): Phase3Objective[] {
    const ck = key(schoolId, classId);
    const ids = objectivesByClass.get(ck);
    if (!ids) return [];
    return Array.from(ids).map((id) => objectiveStore.get(id)).filter(Boolean) as Phase3Objective[];
  }

  listObjectivesByTeacher(schoolId: string, teacherId: string): Phase3Objective[] {
    const tk = key(schoolId, teacherId);
    const ids = objectivesByTeacher.get(tk);
    if (!ids) return [];
    return Array.from(ids).map((id) => objectiveStore.get(id)).filter(Boolean) as Phase3Objective[];
  }

  listObjectivesByLearnerContext(schoolId: string, classId?: string): Phase3Objective[] {
    if (classId) return this.listObjectivesByClass(schoolId, classId);
    return this.listObjectivesBySchool(schoolId);
  }

  createObjectiveCheckBlueprint(input: {
    objectiveId: string;
    schoolId: string;
    classId?: string;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
    recommendedModeDestination: string;
    checkItems: any[];
    successCriteriaRefs: string[];
    checkPolicy: any;
    confidenceBeforeRequired: boolean;
    confidenceAfterRequired: boolean;
    teachBackRequired: boolean;
    transferQuestionRequired: boolean;
    delayedRecallRequired: boolean;
    sourceTruthStatus: any;
    safeInstructions: string;
  }): Phase3ObjectiveCheckBlueprint {
    const blueprintId = generateId('bp');
    const now = nowISO();
    const blueprint: Phase3ObjectiveCheckBlueprint = {
      blueprintId,
      objectiveId: input.objectiveId,
      schoolId: input.schoolId,
      classId: input.classId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      skillId: input.skillId,
      recommendedModeDestination: input.recommendedModeDestination as Any,
      checkItems: input.checkItems || [],
      successCriteriaRefs: input.successCriteriaRefs || [],
      checkPolicy: input.checkPolicy,
      confidenceBeforeRequired: input.confidenceBeforeRequired,
      confidenceAfterRequired: input.confidenceAfterRequired,
      teachBackRequired: input.teachBackRequired,
      transferQuestionRequired: input.transferQuestionRequired,
      delayedRecallRequired: input.delayedRecallRequired,
      sourceTruthStatus: input.sourceTruthStatus,
      safeInstructions: input.safeInstructions,
      createdAt: now,
    } as Any;
    blueprintStore.set(blueprintId, blueprint);
    blueprintsByObjective.set(input.objectiveId, blueprintId);
    return blueprint;
  }

  getObjectiveCheckBlueprint(objectiveId: string): Phase3ObjectiveCheckBlueprint | null {
    const bpId = blueprintsByObjective.get(objectiveId);
    if (!bpId) return null;
    return blueprintStore.get(bpId) || null;
  }

  recordObjectiveEvidenceLink(result: Phase3ObjectiveEvidenceBridgeResult): void {
    bridgeResultStore.set(result.bridgeId, result);
  }

  getObjectiveMasterySnapshot(objectiveId: string, learnerId: string): Phase3ObjectiveMasterySnapshot | null {
    const sk = key(objectiveId, learnerId);
    const snapId = snapshotsByObjectiveAndLearner.get(sk);
    if (!snapId) return null;
    return snapshotStore.get(snapId) || null;
  }

  upsertObjectiveMasterySnapshot(snapshot: Phase3ObjectiveMasterySnapshot): Phase3ObjectiveMasterySnapshot {
    const sk = key(snapshot.objectiveId, snapshot.learnerId);
    const existing = snapshotsByObjectiveAndLearner.get(sk);
    if (existing && snapshotStore.has(existing)) {
      const updated = { ...snapshot, snapshotId: existing, updatedAt: nowISO() } as Any;
      snapshotStore.set(existing, updated);
      return snapshotStore.get(existing)!;
    }
    const snapId = generateId('snap');
    const now = nowISO();
    const stored: Phase3ObjectiveMasterySnapshot = { ...snapshot, snapshotId: snapId, createdAt: now, updatedAt: now } as Any;
    snapshotStore.set(snapId, stored);
    snapshotsByObjectiveAndLearner.set(sk, snapId);
    return stored;
  }

  private getSnapshotsForObjective(objectiveId: string): Phase3ObjectiveMasterySnapshot[] {
    const result: Phase3ObjectiveMasterySnapshot[] = [];
    for (const [k, snapId] of snapshotsByObjectiveAndLearner.entries()) {
      if (k.startsWith(`${objectiveId}:`)) {
        const snap = snapshotStore.get(snapId);
        if (snap) result.push(snap);
      }
    }
    return result;
  }

  listTeacherObjectiveProgress(schoolId: string, teacherId: string): any[] {
    const objectives = this.listObjectivesByTeacher(schoolId, teacherId);
    if (objectives.length === 0) return [];
    const rows: any[] = [];
    for (const obj of objectives) {
      const snapshots = this.getSnapshotsForObjective(obj.objectiveId);
      const row = {
        objectiveId: obj.objectiveId,
        classId: obj.classId || '',
        subjectId: obj.subjectId,
        topicId: obj.topicId,
        skillId: obj.skillId,
        objectiveTitle: obj.title,
        successCriteriaCount: obj.successCriteria.length,
        studentsNotStartedCount: snapshots.filter((s) => s.status === 'not_started').length,
        studentsEarlySignalCount: snapshots.filter((s) => s.status === 'early_signal').length,
        studentsStillLearningCount: snapshots.filter((s) => s.status === 'still_learning').length,
        studentsGettingBetterCount: snapshots.filter((s) => s.status === 'getting_better').length,
        studentsAlmostThereCount: snapshots.filter((s) => s.status === 'almost_there').length,
        studentsConfidentCount: snapshots.filter((s) => s.status === 'confident').length,
        studentsNeedingRescueCount: snapshots.filter((s) => s.status === 'needs_rescue').length,
        studentsNeedingTeacherSupportCount: snapshots.filter((s) => s.status === 'needs_teacher_support').length,
        studentsSourceRequiredCount: snapshots.filter((s) => s.status === 'source_required').length,
        safeCommonPatternSummary: `${snapshots.length} students have progress data for this objective.`,
        recommendedTeacherAction: snapshots.some((s) => s.status === 'needs_rescue') ? 'review struggling students and provide targeted support' : 'continue monitoring progress',
        safeEvidenceRefs: [],
        updatedAt: nowISO(),
      };
      rows.push(row);
    }
    return rows;
  }

  listLearnerObjectiveProgress(schoolId: string, learnerId: string, classId?: string): any[] {
    const objectives = classId ? this.listObjectivesByClass(schoolId, classId) : this.listObjectivesBySchool(schoolId);
    const cards: any[] = [];
    for (const obj of objectives) {
      const snapshot = this.getObjectiveMasterySnapshot(obj.objectiveId, learnerId);
      const status = (snapshot as Any)?.status || 'not_started';
      cards.push({
        objectiveId: obj.objectiveId,
        title: obj.title,
        safeDescription: obj.safeDescription,
        masteryStatus: status,
        statusReason: this.getStatusReason(status),
        nextAction: this.getNextAction(status),
        modeDestination: this.getModeForStatus(status),
        safeEvidenceRefs: [],
        estimatedTimeMinutes: obj.estimatedMinutes,
        updatedAt: (snapshot as Any)?.updatedAt || obj.updatedAt,
      });
    }
    return cards;
  }

  listDailyObjectiveSeeds(studentId: string, schoolId: string): Phase3DailyObjectiveCheckSeed[] {
    const sk = key(schoolId, studentId);
    const ids = seedsByStudent.get(sk);
    if (!ids) return [];
    return Array.from(ids).map((id) => seedStore.get(id)).filter(Boolean) as Any;
  }

  createDailyObjectiveSeed(input: {
    schoolId: string;
    studentId: string;
    classId?: string;
    sourceType: string;
    title: string;
    safeDescription: string;
    targetObjectiveId: string;
    topicId?: string;
    skillId?: string;
    modeDestination: string;
    priority: string;
    estimatedTimeMinutes: number;
    reasonCode: string;
    antiCheatPolicy: string;
    evidencePolicy: string;
    completionStatus?: string;
    dueAt: string;
  }): Phase3DailyObjectiveCheckSeed {
    const seedId = generateId('seed');
    const now = nowISO();
    const seed: Phase3DailyObjectiveCheckSeed = {
      seedId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      classId: input.classId,
      sourceType: input.sourceType as Any,
      title: input.title,
      safeDescription: input.safeDescription,
      targetObjectiveId: input.targetObjectiveId,
      topicId: input.topicId,
      skillId: input.skillId,
      modeDestination: input.modeDestination as Any,
      priority: input.priority as Any,
      estimatedTimeMinutes: input.estimatedTimeMinutes,
      reasonCode: input.reasonCode,
      antiCheatPolicy: input.antiCheatPolicy,
      evidencePolicy: input.evidencePolicy,
      completionStatus: 'pending' as Any,
      safeEvidenceRefs: [],
      createdAt: now,
      dueAt: input.dueAt,
    } as Any;
    seedStore.set(seedId, seed);
    const sk = key(input.schoolId, input.studentId);
    if (!seedsByStudent.has(sk)) seedsByStudent.set(sk, new Set());
    seedsByStudent.get(sk)!.add(seedId);
    return seed;
  }

  markDailyObjectiveSeedCompleted(seedId: string): Phase3DailyObjectiveCheckSeed | null {
    const seed = seedStore.get(seedId);
    if (!seed) return null;
    (seed as Any).completionStatus = 'completed';
    (seed as Any).completedAt = nowISO();
    seedStore.set(seedId, seed);
    return seed;
  }

  createAuditEvent(event: Phase3ObjectiveAuditEvent): Phase3ObjectiveAuditEvent {
    const eventId = generateId('evt');
    const stored: Phase3ObjectiveAuditEvent = { ...event, eventId, createdAt: nowISO() } as Any;
    auditStore.set(eventId, stored);
    return stored;
  }

  resetPhase3ObjectiveRepositoryForTests(): void {
    objectiveStore.clear();
    blueprintStore.clear();
    snapshotStore.clear();
    bridgeResultStore.clear();
    auditStore.clear();
    seedStore.clear();
    objectivesBySchool.clear();
    objectivesByClass.clear();
    objectivesByTeacher.clear();
    blueprintsByObjective.clear();
    snapshotsByObjectiveAndLearner.clear();
    seedsByStudent.clear();
    objectiveIdCounter = 0;
    blueprintIdCounter = 0;
    snapshotIdCounter = 0;
    bridgeIdCounter = 0;
    eventIdCounter = 0;
    seedIdCounter = 0;
    try {
      const { topicSkillPrerequisiteMapService } = require('./task022TopicSkillPrerequisiteMapService');
      topicSkillPrerequisiteMapService.reset();
    } catch (_e) { void _e; }
    try {
      const { learningObjectiveGovernanceService } = require('./task022LearningObjectiveGovernanceService');
      learningObjectiveGovernanceService.reset();
    } catch (_e) { void _e; }
  }

  private getStatusReason(status: string): string {
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

  private getNextAction(status: string): string {
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

  private getModeForStatus(status: string): string {
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
}

export const phase3ObjectiveRepository = new Phase3ObjectiveRepository();
