import type {
  SafeLearningEvidenceRecord,
  SafeLearningEvidenceAggregate,
  GrowthProofCandidate,
  SafeLearningEvidenceTelemetryEvent,
} from '../contracts/safeLearningEvidenceContracts';

function nowISO(): string {
  return new Date().toISOString();
}

let evidenceIdCounter = 0;
let eventIdCounter = 0;

function generateId(prefix: string): string {
  const c = prefix === 'ev' ? ++evidenceIdCounter : ++eventIdCounter;
  return `${prefix}_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const evidenceStore = new Map<string, SafeLearningEvidenceRecord>();
const evidenceByStudent = new Map<string, Set<string>>();
const evidenceByIdempotency = new Map<string, string>();
const aggregateStore = new Map<string, SafeLearningEvidenceAggregate>();
const growthProofStore = new Map<string, GrowthProofCandidate>();
const growthProofByStudent = new Map<string, Set<string>>();
const auditStore = new Map<string, SafeLearningEvidenceTelemetryEvent>();

function studentKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

function aggregateKey(schoolId: string, studentId: string, window: string): string {
  return `${schoolId}:${studentId}:${window}`;
}

export class SafeLearningEvidenceRepository {
  createEvidenceRecord(input: {
    schoolId: string;
    studentId: string;
    tutorLearnerId?: string;
    conversationId?: string;
    tutorSessionId?: string;
    turnId?: string;
    modeSessionId?: string;
    sourceTask: string;
    sourceMode: string;
    evidenceType: string;
    evidenceStrength: string;
    sourceTruthStatus: string;
    dataQualityStatus: string;
    approvedContentRef?: string;
    contentFingerprint?: string;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
    objectiveId?: string;
    targetType?: string;
    targetRef?: string;
    attemptNumber?: number;
    timeSpentBucket?: string;
    difficultyBucket?: string;
    supportNeed?: string;
    hintLevel?: string;
    hintDependencyBucket?: string;
    mistakeCategory?: string;
    misconceptionCategory?: string;
    recallQuality?: string;
    explanationQualityBucket?: string;
    reflectionQualityBucket?: string;
    readinessBucket?: string;
    masterySignal?: string;
    weakTopicSignal?: string;
    revisionSignal?: string;
    growthProofSignal?: string;
    policyDecision: string;
    safeReasonCodesJson: string[];
    safeEvidenceRefsJson: string[];
    safeMetadataJson: Record<string, unknown>;
    idempotencyKey: string;
  }): SafeLearningEvidenceRecord {
    const id = generateId('ev');
    const now = nowISO();
    const record: SafeLearningEvidenceRecord = {
      id,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    evidenceStore.set(id, record);
    const sk = studentKey(input.schoolId, input.studentId);
    if (!evidenceByStudent.has(sk)) evidenceByStudent.set(sk, new Set());
    evidenceByStudent.get(sk)!.add(id);
    evidenceByIdempotency.set(input.idempotencyKey, id);
    return record;
  }

  findEvidenceById(id: string): SafeLearningEvidenceRecord | null {
    return evidenceStore.get(id) ?? null;
  }

  findEvidenceByIdempotencyKey(key: string): SafeLearningEvidenceRecord | null {
    const id = evidenceByIdempotency.get(key);
    if (!id) return null;
    return evidenceStore.get(id) ?? null;
  }

  queryEvidence(params: {
    schoolId: string;
    studentId?: string;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
    sourceTask?: string;
    sourceMode?: string;
    evidenceType?: string;
    limit: number;
    offset: number;
  }): SafeLearningEvidenceRecord[] {
    const results: SafeLearningEvidenceRecord[] = [];
    for (const record of evidenceStore.values()) {
      if (record.schoolId !== params.schoolId) continue;
      if (params.studentId && record.studentId !== params.studentId) continue;
      if (params.subjectId && record.subjectId !== params.subjectId) continue;
      if (params.topicId && record.topicId !== params.topicId) continue;
      if (params.skillId && record.skillId !== params.skillId) continue;
      if (params.sourceTask && record.sourceTask !== params.sourceTask) continue;
      if (params.sourceMode && record.sourceMode !== params.sourceMode) continue;
      if (params.evidenceType && record.evidenceType !== params.evidenceType) continue;
      results.push(record);
    }
    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return results.slice(params.offset, params.offset + params.limit);
  }

  upsertAggregate(input: SafeLearningEvidenceAggregate): SafeLearningEvidenceAggregate {
    const key = aggregateKey(input.schoolId, input.studentId, input.aggregateWindow);
    const existing = aggregateStore.get(key);
    if (existing) {
      const updated: SafeLearningEvidenceAggregate = {
        ...existing,
        evidenceCount: input.evidenceCount,
        realEvidenceCount: input.realEvidenceCount,
        weakSignalCount: input.weakSignalCount,
        masterySignalCount: input.masterySignalCount,
        revisionSignalCount: input.revisionSignalCount,
        mistakeSignalCount: input.mistakeSignalCount,
        hintDependencyCount: input.hintDependencyCount,
        reflectionCount: input.reflectionCount,
        teachBackCount: input.teachBackCount,
        quizRecallCount: input.quizRecallCount,
        lastEvidenceAt: input.lastEvidenceAt ?? existing.lastEvidenceAt,
        confidenceBucket: input.confidenceBucket,
        safeSummaryJson: input.safeSummaryJson,
      };
      aggregateStore.set(key, updated);
      return updated;
    }
    aggregateStore.set(key, input);
    return input;
  }

  findAggregate(params: {
    schoolId: string;
    studentId: string;
    aggregateWindow: string;
  }): SafeLearningEvidenceAggregate | null {
    const key = aggregateKey(params.schoolId, params.studentId, params.aggregateWindow);
    return aggregateStore.get(key) ?? null;
  }

  createGrowthProof(input: GrowthProofCandidate): GrowthProofCandidate {
    const now = nowISO();
    const candidate: GrowthProofCandidate = {
      ...input,
      createdAt: input.createdAt || now,
    };
    const id = `${candidate.schoolId}:${candidate.studentId}:${candidate.subjectId || '_'}:${candidate.skillId || '_'}:${candidate.sourceTruthStatus}`;
    growthProofStore.set(id, candidate);
    const sk = studentKey(input.schoolId, input.studentId);
    if (!growthProofByStudent.has(sk)) growthProofByStudent.set(sk, new Set());
    growthProofByStudent.get(sk)!.add(id);
    return candidate;
  }

  queryGrowthProofs(params: {
    schoolId: string;
    studentId: string;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
  }): GrowthProofCandidate[] {
    const results: GrowthProofCandidate[] = [];
    for (const record of growthProofStore.values()) {
      if (record.schoolId !== params.schoolId) continue;
      if (record.studentId !== params.studentId) continue;
      if (params.subjectId && record.subjectId !== params.subjectId) continue;
      if (params.topicId && record.topicId !== params.topicId) continue;
      if (params.skillId && record.skillId !== params.skillId) continue;
      results.push(record);
    }
    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return results;
  }

  createAuditEvent(input: SafeLearningEvidenceTelemetryEvent): SafeLearningEvidenceTelemetryEvent {
    const id = generateId('aud');
    const event: SafeLearningEvidenceTelemetryEvent = {
      ...input,
      id: input.id || id,
      createdAt: input.createdAt || nowISO(),
    };
    auditStore.set(event.id, event);
    return event;
  }

  countEvidenceForStudent(schoolId: string, studentId: string): number {
    const sk = studentKey(schoolId, studentId);
    const ids = evidenceByStudent.get(sk);
    return ids ? ids.size : 0;
  }

  countRealEvidenceForStudent(schoolId: string, studentId: string): number {
    const sk = studentKey(schoolId, studentId);
    const ids = evidenceByStudent.get(sk);
    if (!ids) return 0;
    let count = 0;
    for (const id of ids) {
      const rec = evidenceStore.get(id);
      if (rec && rec.sourceTruthStatus === 'real') count++;
    }
    return count;
  }

  _clearForTest(): void {
    evidenceStore.clear();
    evidenceByStudent.clear();
    evidenceByIdempotency.clear();
    aggregateStore.clear();
    growthProofStore.clear();
    growthProofByStudent.clear();
    auditStore.clear();
    evidenceIdCounter = 0;
    eventIdCounter = 0;
  }

  get evidenceCount(): number {
    return evidenceStore.size;
  }

  get auditCount(): number {
    return auditStore.size;
  }
}

export const safeLearningEvidenceRepository = new SafeLearningEvidenceRepository();
