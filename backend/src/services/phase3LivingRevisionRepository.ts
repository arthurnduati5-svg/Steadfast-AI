import prisma from '../lib/prisma';
import {
  Phase3RevisionNode,
  Phase3RevisionEdge,
  Phase3RevisionDueItem,
  Phase3RevisionAuditEvent,
  Phase3RevisionNodeCreateInput,
  Phase3RevisionEdgeCreateInput,
  Phase3RevisionNodeStatus,
  Phase3RevisionDueStatus,
  Phase3RevisionSafeEvidenceRef,
  Phase3RevisionNoteGraph,
} from '../contracts/phase3LivingRevisionContracts';

// ─────────────────────────────────────────────────────────────
// R8-G.3A-D1 durability boundary.
// Canonical production state lives in Prisma:
//   Phase3RevisionNodeRecord / Phase3RevisionEdgeRecord /
//   Phase3RevisionDueItemRecord / Phase3RevisionAuditRecord
// (see Phase3LivingRevisionDurableRepository below).
// The revision graph is a DERIVED_VIEW (nodes + edges + due state)
// reconstructed from those records after restart. There is no
// persistent graph model by design; the former process-local graph
// Map has been removed from canonical ownership.
// The synchronous Map-backed implementation below remains ONLY as
// explicit test injection for pre-existing focused unit tests. It is
// NOT canonical: in production/strict mode every sync entry point
// throws (fail-closed) instead of serving volatile memory.
// ─────────────────────────────────────────────────────────────

export function isRevisionMemoryFallbackAllowed(): boolean {
  if (process.env.REVISION_REQUIRE_DURABLE === '1') return false;
  if (process.env.REVISION_ALLOW_MEMORY_FALLBACK === '1') return true;
  if (process.env.TUTORSTATE_REQUIRE_DURABLE === '1') return false;
  if (process.env.TUTORSTATE_ALLOW_MEMORY_FALLBACK === '1') return true;
  return process.env.NODE_ENV !== 'production';
}

function guardMemoryTestInjection(caller: string): void {
  if (!isRevisionMemoryFallbackAllowed()) {
    throw new Error(
      `Phase3 Living Revision memory store is not canonical truth (${caller}): database-backed durability is required in production/strict mode (R8-G.3A-D1).`,
    );
  }
}

interface InternalRevisionNode extends Phase3RevisionNode {
  _createdAt: number;
  _updatedAt: number;
}

interface InternalRevisionEdge extends Phase3RevisionEdge {
  _createdAt: number;
}

interface InternalRevisionDueItem extends Phase3RevisionDueItem {
  _createdAt: number;
  _updatedAt: number;
}

class Phase3LivingRevisionRepositoryImpl {
  private nodes: Map<string, InternalRevisionNode> = new Map();
  private edges: Map<string, InternalRevisionEdge> = new Map();
  private dueItems: Map<string, InternalRevisionDueItem> = new Map();
  private auditEvents: Phase3RevisionAuditEvent[] = [];

  private generateId(): string {
    return `rev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private toNode(n: InternalRevisionNode): Phase3RevisionNode {
    return { ...n };
  }

  private toEdge(e: InternalRevisionEdge): Phase3RevisionEdge {
    return { ...e };
  }

  private toDueItem(d: InternalRevisionDueItem): Phase3RevisionDueItem {
    return { ...d };
  }

  createRevisionNode(input: Phase3RevisionNodeCreateInput): Phase3RevisionNode {
    guardMemoryTestInjection('createRevisionNode');
    const now = Date.now();
    const nowISO = new Date(now).toISOString();
    const node: InternalRevisionNode = {
      nodeId: this.generateId(),
      nodeType: input.nodeType,
      status: 'active',
      priority: 'medium',
      schoolId: input.schoolId,
      studentId: input.studentId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      skillId: input.skillId,
      objectiveId: input.objectiveId,
      safeTitle: input.safeTitle,
      safeSummary: input.safeSummary,
      learnerVisibleText: input.learnerVisibleText,
      sourceAnchorTitle: input.sourceAnchorTitle,
      approvedSourceRef: input.approvedSourceRef,
      sourceTruth: input.sourceTruth,
      safeEvidenceRefs: input.safeEvidenceRefs || [],
      safeReasonCodes: input.safeReasonCodes || [],
      connectionCount: 0,
      isPinned: false,
      isArchived: false,
      createdAt: nowISO,
      updatedAt: nowISO,
      _createdAt: now,
      _updatedAt: now,
    };
    this.nodes.set(node.nodeId, node);
    return this.toNode(node);
  }

  getRevisionNode(nodeId: string): Phase3RevisionNode | null {
    guardMemoryTestInjection('getRevisionNode');
    const n = this.nodes.get(nodeId);
    return n ? this.toNode(n) : null;
  }

  listRevisionNodesForLearner(schoolId: string, studentId: string): Phase3RevisionNode[] {
    guardMemoryTestInjection('listRevisionNodesForLearner');
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId && n.studentId === studentId) {
        result.push(this.toNode(n));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listRevisionNodesByObjective(schoolId: string, studentId: string, objectiveId: string): Phase3RevisionNode[] {
    guardMemoryTestInjection('listRevisionNodesByObjective');
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId && n.studentId === studentId && n.objectiveId === objectiveId) {
        result.push(this.toNode(n));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listRevisionNodesByTopic(schoolId: string, studentId: string, topicId: string): Phase3RevisionNode[] {
    guardMemoryTestInjection('listRevisionNodesByTopic');
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId && n.studentId === studentId && n.topicId === topicId) {
        result.push(this.toNode(n));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listRevisionNodesByStatus(schoolId: string, studentId: string, status: Phase3RevisionNodeStatus): Phase3RevisionNode[] {
    guardMemoryTestInjection('listRevisionNodesByStatus');
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId && n.studentId === studentId && n.status === status) {
        result.push(this.toNode(n));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  updateRevisionNodeStatus(nodeId: string, status: Phase3RevisionNodeStatus): Phase3RevisionNode | null {
    guardMemoryTestInjection('updateRevisionNodeStatus');
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.status = status;
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  pinRevisionNode(nodeId: string): Phase3RevisionNode | null {
    guardMemoryTestInjection('pinRevisionNode');
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.isPinned = true;
    n.status = 'pinned';
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  archiveRevisionNode(nodeId: string): Phase3RevisionNode | null {
    guardMemoryTestInjection('archiveRevisionNode');
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.isArchived = true;
    n.status = 'archived';
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  snoozeRevisionNode(nodeId: string): Phase3RevisionNode | null {
    guardMemoryTestInjection('snoozeRevisionNode');
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.status = 'active';
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  completeRevisionNode(nodeId: string): Phase3RevisionNode | null {
    guardMemoryTestInjection('completeRevisionNode');
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.status = 'active';
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  createRevisionEdge(input: Phase3RevisionEdgeCreateInput): Phase3RevisionEdge {
    guardMemoryTestInjection('createRevisionEdge');
    const now = Date.now();
    const edge: InternalRevisionEdge = {
      edgeId: this.generateId(),
      edgeType: input.edgeType,
      schoolId: input.schoolId,
      studentId: input.studentId,
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      safeEvidenceRefs: input.safeEvidenceRefs || [],
      safeReasonCodes: input.safeReasonCodes || [],
      createdAt: new Date(now).toISOString(),
      _createdAt: now,
    };
    this.edges.set(edge.edgeId, edge);

    const source = this.nodes.get(input.sourceNodeId);
    const target = this.nodes.get(input.targetNodeId);
    if (source) {
      source.connectionCount = (source.connectionCount || 0) + 1;
      source._updatedAt = now;
      source.updatedAt = new Date(now).toISOString();
    }
    if (target) {
      target.connectionCount = (target.connectionCount || 0) + 1;
      target._updatedAt = now;
      target.updatedAt = new Date(now).toISOString();
    }

    return this.toEdge(edge);
  }

  getRevisionEdge(edgeId: string): Phase3RevisionEdge | null {
    guardMemoryTestInjection('getRevisionEdge');
    const e = this.edges.get(edgeId);
    return e ? this.toEdge(e) : null;
  }

  listRevisionEdgesForLearner(schoolId: string, studentId: string): Phase3RevisionEdge[] {
    guardMemoryTestInjection('listRevisionEdgesForLearner');
    const result: Phase3RevisionEdge[] = [];
    for (const e of this.edges.values()) {
      if (e.schoolId === schoolId && e.studentId === studentId) {
        result.push(this.toEdge(e));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listRevisionEdgesForNode(nodeId: string): Phase3RevisionEdge[] {
    guardMemoryTestInjection('listRevisionEdgesForNode');
    const result: Phase3RevisionEdge[] = [];
    for (const e of this.edges.values()) {
      if (e.sourceNodeId === nodeId || e.targetNodeId === nodeId) {
        result.push(this.toEdge(e));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  deleteRevisionEdge(edgeId: string): boolean {
    guardMemoryTestInjection('deleteRevisionEdge');
    const e = this.edges.get(edgeId);
    if (!e) return false;
    this.edges.delete(edgeId);

    const source = this.nodes.get(e.sourceNodeId);
    const target = this.nodes.get(e.targetNodeId);
    const now = Date.now();
    if (source) {
      source.connectionCount = Math.max(0, (source.connectionCount || 1) - 1);
      source._updatedAt = now;
      source.updatedAt = new Date(now).toISOString();
    }
    if (target) {
      target.connectionCount = Math.max(0, (target.connectionCount || 1) - 1);
      target._updatedAt = now;
      target.updatedAt = new Date(now).toISOString();
    }

    return true;
  }

  upsertRevisionDueItem(item: Omit<Phase3RevisionDueItem, 'createdAt' | 'updatedAt' | 'dueItemId'>): Phase3RevisionDueItem {
    guardMemoryTestInjection('upsertRevisionDueItem');
    const now = Date.now();
    const nowISO = new Date(now).toISOString();

    for (const existing of this.dueItems.values()) {
      if (
        existing.schoolId === item.schoolId &&
        existing.studentId === item.studentId &&
        existing.nodeId === item.nodeId &&
        !existing.isCompleted
      ) {
        existing.priority = item.priority;
        existing.signalType = item.signalType;
        existing.safeTitle = item.safeTitle;
        existing.safeSummary = item.safeSummary;
        existing.recommendedAction = item.recommendedAction;
        existing.safeEvidenceRefs = item.safeEvidenceRefs;
        existing.safeReasonCodes = item.safeReasonCodes;
        existing._updatedAt = now;
        existing.updatedAt = nowISO;
        return this.toDueItem(existing);
      }
    }

    const dueItem: InternalRevisionDueItem = {
      dueItemId: this.generateId(),
      schoolId: item.schoolId,
      studentId: item.studentId,
      nodeId: item.nodeId,
      edgeId: item.edgeId,
      priority: item.priority,
      signalType: item.signalType,
      safeTitle: item.safeTitle,
      safeSummary: item.safeSummary,
      recommendedAction: item.recommendedAction,
      sourceTruthStatus: item.sourceTruthStatus,
      objectiveId: item.objectiveId,
      topicId: item.topicId,
      skillId: item.skillId,
      isCompleted: false,
      safeEvidenceRefs: item.safeEvidenceRefs,
      safeReasonCodes: item.safeReasonCodes,
      createdAt: nowISO,
      updatedAt: nowISO,
      _createdAt: now,
      _updatedAt: now,
    };
    this.dueItems.set(dueItem.dueItemId, dueItem);
    return this.toDueItem(dueItem);
  }

  getRevisionDueItem(dueItemId: string): Phase3RevisionDueItem | null {
    guardMemoryTestInjection('getRevisionDueItem');
    const d = this.dueItems.get(dueItemId);
    return d ? this.toDueItem(d) : null;
  }

  listDueRevisionItemsForLearner(schoolId: string, studentId: string): Phase3RevisionDueItem[] {
    guardMemoryTestInjection('listDueRevisionItemsForLearner');
    return this.listRevisionDueItemsForLearner(schoolId, studentId)
      .filter((d) => !d.isCompleted);
  }

  listRevisionDueItemsForLearner(schoolId: string, studentId: string): Phase3RevisionDueItem[] {
    guardMemoryTestInjection('listRevisionDueItemsForLearner');
    const result: Phase3RevisionDueItem[] = [];
    for (const d of this.dueItems.values()) {
      if (d.schoolId === schoolId && d.studentId === studentId) {
        result.push(this.toDueItem(d));
      }
    }
    return result.sort((a, b) => {
      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, blocked: 4 };
      const pa = priorityOrder[a.priority] ?? 5;
      const pb = priorityOrder[b.priority] ?? 5;
      return pa - pb;
    });
  }

  completeDueRevisionItem(dueItemId: string): Phase3RevisionDueItem | null {
    guardMemoryTestInjection('completeDueRevisionItem');
    return this.markRevisionDueItemCompleted(dueItemId);
  }

  markRevisionDueItemCompleted(dueItemId: string): Phase3RevisionDueItem | null {
    guardMemoryTestInjection('markRevisionDueItemCompleted');
    const d = this.dueItems.get(dueItemId);
    if (!d) return null;
    d.isCompleted = true;
    d._updatedAt = Date.now();
    d.updatedAt = new Date(d._updatedAt).toISOString();
    return this.toDueItem(d);
  }

  recordRevisionAuditEvent(event: Phase3RevisionAuditEvent): void {
    guardMemoryTestInjection('recordRevisionAuditEvent');
    this.auditEvents.push({ ...event });
  }

  listRevisionAuditEvents(schoolId: string, limit = 100): Phase3RevisionAuditEvent[] {
    guardMemoryTestInjection('listRevisionAuditEvents');
    return this.auditEvents
      .filter((e) => e.schoolId === schoolId)
      .reverse()
      .slice(0, limit);
  }

  resetPhase3LivingRevisionRepositoryForTests(): void {
    this.nodes.clear();
    this.edges.clear();
    this.dueItems.clear();
    this.auditEvents = [];
  }

  listAllNodesForSchool(schoolId: string): Phase3RevisionNode[] {
    guardMemoryTestInjection('listAllNodesForSchool');
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId) {
        result.push(this.toNode(n));
      }
    }
    return result;
  }

  listAllEdgesForSchool(schoolId: string): Phase3RevisionEdge[] {
    guardMemoryTestInjection('listAllEdgesForSchool');
    const result: Phase3RevisionEdge[] = [];
    for (const e of this.edges.values()) {
      if (e.schoolId === schoolId) {
        result.push(this.toEdge(e));
      }
    }
    return result;
  }

  listAllDueItemsForSchool(schoolId: string): Phase3RevisionDueItem[] {
    guardMemoryTestInjection('listAllDueItemsForSchool');
    const result: Phase3RevisionDueItem[] = [];
    for (const d of this.dueItems.values()) {
      if (d.schoolId === schoolId) {
        result.push(this.toDueItem(d));
      }
    }
    return result;
  }
}

export const phase3LivingRevisionRepository = new Phase3LivingRevisionRepositoryImpl();

// ─────────────────────────────────────────────────────────────
// CANONICAL DURABLE REPOSITORY (R8-G.3A-D1).
// Prisma-backed, restart-proven, fail-closed: every method throws
// on persistence failure (no silent in-memory success). Holds NO
// process-local state: a fresh instance reconstructs identical
// state from durable records (restart proof). Audit is append-only
// (create + read; no update/delete surface exists).
// ─────────────────────────────────────────────────────────────

export interface RevisionDurableClientLike {
  phase3RevisionNodeRecord?: any;
  phase3RevisionEdgeRecord?: any;
  phase3RevisionDueItemRecord?: any;
  phase3RevisionAuditRecord?: any;
  $transaction?: (fn: (tx: any) => Promise<any>) => Promise<any>;
}

function iso(value: any): string {
  if (!value) return new Date(0).toISOString();
  if (typeof value === 'string') return value;
  if (typeof value?.toISOString === 'function') return value.toISOString();
  return String(value);
}

function nodeRecordToContract(record: any): Phase3RevisionNode {
  return {
    nodeId: record.id,
    nodeType: record.nodeType,
    status: record.status,
    priority: record.priority,
    schoolId: record.schoolId,
    studentId: record.studentId ?? undefined,
    subjectId: record.subjectId ?? undefined,
    topicId: record.topicId ?? undefined,
    skillId: record.skillId ?? undefined,
    objectiveId: record.objectiveId ?? undefined,
    safeTitle: record.safeTitle,
    safeSummary: record.safeSummary,
    learnerVisibleText: record.learnerVisibleText ?? undefined,
    sourceAnchorTitle: record.sourceAnchorTitle ?? undefined,
    approvedSourceRef: record.approvedSourceRef ?? undefined,
    sourceTruth: record.sourceTruth,
    safeEvidenceRefs: record.safeEvidenceRefs ?? [],
    safeReasonCodes: record.safeReasonCodes ?? [],
    connectionCount: record.connectionCount ?? 0,
    isPinned: record.isPinned ?? false,
    isArchived: record.isArchived ?? false,
    createdAt: iso(record.createdAt),
    updatedAt: iso(record.updatedAt),
  };
}

function edgeRecordToContract(record: any): Phase3RevisionEdge {
  return {
    edgeId: record.id,
    edgeType: record.edgeType,
    schoolId: record.schoolId,
    studentId: record.studentId ?? undefined,
    sourceNodeId: record.sourceNodeId,
    targetNodeId: record.targetNodeId,
    safeEvidenceRefs: record.safeEvidenceRefs ?? [],
    safeReasonCodes: record.safeReasonCodes ?? [],
    createdAt: iso(record.createdAt),
  };
}

function dueRecordToContract(record: any): Phase3RevisionDueItem {
  return {
    dueItemId: record.id,
    schoolId: record.schoolId,
    studentId: record.studentId,
    nodeId: record.nodeId,
    edgeId: record.edgeId ?? undefined,
    priority: record.priority,
    signalType: record.signalType,
    safeTitle: record.safeTitle,
    safeSummary: record.safeSummary,
    recommendedAction: record.recommendedAction,
    sourceTruthStatus: record.sourceTruthStatus,
    objectiveId: record.objectiveId ?? undefined,
    topicId: record.topicId ?? undefined,
    skillId: record.skillId ?? undefined,
    isCompleted: record.isCompleted ?? false,
    safeEvidenceRefs: record.safeEvidenceRefs ?? [],
    safeReasonCodes: record.safeReasonCodes ?? [],
    createdAt: iso(record.createdAt),
    updatedAt: iso(record.updatedAt),
  };
}

function auditRecordToContract(record: any): Phase3RevisionAuditEvent {
  return {
    eventId: record.id,
    schoolId: record.schoolId,
    actorId: record.actorId,
    actorRole: record.actorRole,
    studentId: record.studentId ?? undefined,
    teacherId: record.teacherId ?? undefined,
    classId: record.classId ?? undefined,
    nodeId: record.nodeId ?? undefined,
    edgeId: record.edgeId ?? undefined,
    objectiveId: record.objectiveId ?? undefined,
    topicId: record.topicId ?? undefined,
    skillId: record.skillId ?? undefined,
    eventType: record.eventType,
    safeReasonCodes: record.safeReasonCodes ?? [],
    safeEvidenceRefs: record.safeEvidenceRefs ?? [],
    createdAt: iso(record.createdAt),
  };
}

function makeOpenDedupeKey(schoolId: string, studentId: string, nodeId: string): string {
  return `${schoolId}:${studentId}:${nodeId}`;
}

export type RevisionDueUpsertInput = Omit<Phase3RevisionDueItem, 'createdAt' | 'updatedAt' | 'dueItemId'>;

export class Phase3LivingRevisionDurableRepository {
  private readonly client: RevisionDurableClientLike;

  constructor(client?: RevisionDurableClientLike) {
    this.client = client || (prisma as unknown as RevisionDurableClientLike);
  }

  private nodes(): any {
    const delegate = this.client?.phase3RevisionNodeRecord;
    if (!delegate) {
      throw new Error('Phase3 Living Revision persistence unavailable: node record store is unreachable.');
    }
    return delegate;
  }

  private edges(): any {
    const delegate = this.client?.phase3RevisionEdgeRecord;
    if (!delegate) {
      throw new Error('Phase3 Living Revision persistence unavailable: edge record store is unreachable.');
    }
    return delegate;
  }

  private dueItems(): any {
    const delegate = this.client?.phase3RevisionDueItemRecord;
    if (!delegate) {
      throw new Error('Phase3 Living Revision persistence unavailable: due-item record store is unreachable.');
    }
    return delegate;
  }

  private audits(): any {
    const delegate = this.client?.phase3RevisionAuditRecord;
    if (!delegate) {
      throw new Error('Phase3 Living Revision persistence unavailable: audit record store is unreachable.');
    }
    return delegate;
  }

  private runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const txFn = (this.client as any)?.$transaction;
    if (typeof txFn === 'function') {
      return txFn.call(this.client, fn);
    }
    return fn(this.client);
  }

  // ── Nodes ──

  async createRevisionNode(input: Phase3RevisionNodeCreateInput): Promise<Phase3RevisionNode> {
    const record = await this.nodes().create({
      data: {
        schoolId: input.schoolId,
        studentId: input.studentId ?? null,
        nodeType: input.nodeType,
        status: 'active',
        priority: 'medium',
        subjectId: input.subjectId ?? null,
        topicId: input.topicId ?? null,
        skillId: input.skillId ?? null,
        objectiveId: input.objectiveId ?? null,
        safeTitle: input.safeTitle,
        safeSummary: input.safeSummary,
        learnerVisibleText: input.learnerVisibleText ?? null,
        sourceAnchorTitle: input.sourceAnchorTitle ?? null,
        approvedSourceRef: input.approvedSourceRef ?? null,
        sourceTruth: input.sourceTruth as any,
        safeEvidenceRefs: (input.safeEvidenceRefs || []) as any,
        safeReasonCodes: (input.safeReasonCodes || []) as any,
        connectionCount: 0,
        isPinned: false,
        isArchived: false,
      },
    });
    return nodeRecordToContract(record);
  }

  async getRevisionNode(nodeId: string, schoolId: string): Promise<Phase3RevisionNode | null> {
    const record = await this.nodes().findFirst({
      where: { id: nodeId, schoolId },
    });
    return record ? nodeRecordToContract(record) : null;
  }

  async listRevisionNodesForLearner(
    schoolId: string,
    studentId: string,
    filters?: { status?: Phase3RevisionNodeStatus; topicId?: string; objectiveId?: string },
  ): Promise<Phase3RevisionNode[]> {
    const records = await this.nodes().findMany({
      where: {
        schoolId,
        studentId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.topicId ? { topicId: filters.topicId } : {}),
        ...(filters?.objectiveId ? { objectiveId: filters.objectiveId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(nodeRecordToContract);
  }

  async listRevisionNodesByObjective(
    schoolId: string,
    studentId: string,
    objectiveId: string,
  ): Promise<Phase3RevisionNode[]> {
    return this.listRevisionNodesForLearner(schoolId, studentId, { objectiveId });
  }

  async listRevisionNodesByTopic(
    schoolId: string,
    studentId: string,
    topicId: string,
  ): Promise<Phase3RevisionNode[]> {
    return this.listRevisionNodesForLearner(schoolId, studentId, { topicId });
  }

  async listRevisionNodesByStatus(
    schoolId: string,
    studentId: string,
    status: Phase3RevisionNodeStatus,
  ): Promise<Phase3RevisionNode[]> {
    return this.listRevisionNodesForLearner(schoolId, studentId, { status });
  }

  private async mutateNode(
    nodeId: string,
    schoolId: string,
    data: Record<string, unknown>,
  ): Promise<Phase3RevisionNode | null> {
    const existing = await this.nodes().findFirst({
      where: { id: nodeId, schoolId },
      select: { id: true },
    });
    if (!existing) return null;
    const record = await this.nodes().update({
      where: { id: nodeId },
      data,
    });
    return nodeRecordToContract(record);
  }

  async updateRevisionNodeStatus(
    nodeId: string,
    schoolId: string,
    status: Phase3RevisionNodeStatus,
  ): Promise<Phase3RevisionNode | null> {
    return this.mutateNode(nodeId, schoolId, { status });
  }

  async pinRevisionNode(nodeId: string, schoolId: string): Promise<Phase3RevisionNode | null> {
    return this.mutateNode(nodeId, schoolId, { isPinned: true, status: 'pinned' });
  }

  async archiveRevisionNode(nodeId: string, schoolId: string): Promise<Phase3RevisionNode | null> {
    return this.mutateNode(nodeId, schoolId, { isArchived: true, status: 'archived' });
  }

  async snoozeRevisionNode(nodeId: string, schoolId: string): Promise<Phase3RevisionNode | null> {
    return this.mutateNode(nodeId, schoolId, { status: 'active' });
  }

  async completeRevisionNode(nodeId: string, schoolId: string): Promise<Phase3RevisionNode | null> {
    return this.mutateNode(nodeId, schoolId, { status: 'active' });
  }

  async listAllNodesForSchool(schoolId: string): Promise<Phase3RevisionNode[]> {
    const records = await this.nodes().findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(nodeRecordToContract);
  }

  // ── Edges (transactional with connection counts) ──

  async createRevisionEdge(input: Phase3RevisionEdgeCreateInput): Promise<Phase3RevisionEdge> {
    return this.runTransaction(async (tx: any) => {
      const source = await tx.phase3RevisionNodeRecord.findFirst({
        where: { id: input.sourceNodeId, schoolId: input.schoolId },
      });
      const target = await tx.phase3RevisionNodeRecord.findFirst({
        where: { id: input.targetNodeId, schoolId: input.schoolId },
      });
      if (!source) {
        throw new Error('Source revision node not found.');
      }
      if (!target) {
        throw new Error('Target revision node not found.');
      }
      if (source.schoolId !== target.schoolId) {
        throw new Error('Cross-school revision edges are forbidden.');
      }

      const edge = await tx.phase3RevisionEdgeRecord.create({
        data: {
          schoolId: input.schoolId,
          studentId: input.studentId ?? null,
          edgeType: input.edgeType,
          sourceNodeId: input.sourceNodeId,
          targetNodeId: input.targetNodeId,
          safeEvidenceRefs: (input.safeEvidenceRefs || []) as any,
          safeReasonCodes: (input.safeReasonCodes || []) as any,
        },
      });

      await tx.phase3RevisionNodeRecord.update({
        where: { id: input.sourceNodeId },
        data: { connectionCount: { increment: 1 } },
      });
      await tx.phase3RevisionNodeRecord.update({
        where: { id: input.targetNodeId },
        data: { connectionCount: { increment: 1 } },
      });

      return edgeRecordToContract(edge);
    });
  }

  async getRevisionEdge(edgeId: string, schoolId: string): Promise<Phase3RevisionEdge | null> {
    const record = await this.edges().findFirst({
      where: { id: edgeId, schoolId },
    });
    return record ? edgeRecordToContract(record) : null;
  }

  async listRevisionEdgesForLearner(schoolId: string, studentId: string): Promise<Phase3RevisionEdge[]> {
    const records = await this.edges().findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(edgeRecordToContract);
  }

  async listRevisionEdgesForNode(nodeId: string, schoolId: string): Promise<Phase3RevisionEdge[]> {
    const records = await this.edges().findMany({
      where: {
        schoolId,
        OR: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(edgeRecordToContract);
  }

  async deleteRevisionEdge(edgeId: string, schoolId: string): Promise<boolean> {
    return this.runTransaction(async (tx: any) => {
      const edge = await tx.phase3RevisionEdgeRecord.findFirst({
        where: { id: edgeId, schoolId },
      });
      if (!edge) return false;

      await tx.phase3RevisionEdgeRecord.delete({ where: { id: edgeId } });

      for (const nodeId of [edge.sourceNodeId, edge.targetNodeId]) {
        const node = await tx.phase3RevisionNodeRecord.findFirst({
          where: { id: nodeId, schoolId },
          select: { id: true, connectionCount: true },
        });
        if (node) {
          await tx.phase3RevisionNodeRecord.update({
            where: { id: nodeId },
            data: { connectionCount: Math.max(0, (node.connectionCount || 1) - 1) },
          });
        }
      }

      return true;
    });
  }

  async listAllEdgesForSchool(schoolId: string): Promise<Phase3RevisionEdge[]> {
    const records = await this.edges().findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(edgeRecordToContract);
  }

  // ── Due items (one open per learner node; history preserved) ──

  async upsertRevisionDueItem(item: RevisionDueUpsertInput): Promise<Phase3RevisionDueItem> {
    const openKey = makeOpenDedupeKey(item.schoolId, item.studentId, item.nodeId);
    const updateData = {
      priority: item.priority,
      signalType: item.signalType,
      safeTitle: item.safeTitle,
      safeSummary: item.safeSummary,
      recommendedAction: item.recommendedAction,
      sourceTruthStatus: item.sourceTruthStatus,
      objectiveId: item.objectiveId ?? null,
      topicId: item.topicId ?? null,
      skillId: item.skillId ?? null,
      edgeId: item.edgeId ?? null,
      safeEvidenceRefs: item.safeEvidenceRefs as any,
      safeReasonCodes: item.safeReasonCodes as any,
    };

    const existing = await this.dueItems().findFirst({
      where: {
        schoolId: item.schoolId,
        studentId: item.studentId,
        nodeId: item.nodeId,
        isCompleted: false,
      },
    });
    if (existing) {
      const updated = await this.dueItems().update({
        where: { id: existing.id },
        data: updateData,
      });
      return dueRecordToContract(updated);
    }

    try {
      const created = await this.dueItems().create({
        data: {
          schoolId: item.schoolId,
          studentId: item.studentId,
          nodeId: item.nodeId,
          ...updateData,
          isCompleted: false,
          openDedupeKey: openKey,
        },
      });
      return dueRecordToContract(created);
    } catch (err: any) {
      // Lost a concurrent open-item race (nullable-unique violation):
      // converge on the surviving open row instead of double-creating.
      if (err?.code === 'P2002') {
        const winner = await this.dueItems().findFirst({
          where: {
            schoolId: item.schoolId,
            studentId: item.studentId,
            nodeId: item.nodeId,
            isCompleted: false,
          },
        });
        if (winner) {
          const updated = await this.dueItems().update({
            where: { id: winner.id },
            data: updateData,
          });
          return dueRecordToContract(updated);
        }
      }
      throw err;
    }
  }

  async getRevisionDueItem(dueItemId: string, schoolId: string): Promise<Phase3RevisionDueItem | null> {
    const record = await this.dueItems().findFirst({
      where: { id: dueItemId, schoolId },
    });
    return record ? dueRecordToContract(record) : null;
  }

  async listRevisionDueItemsForLearner(
    schoolId: string,
    studentId: string,
  ): Promise<Phase3RevisionDueItem[]> {
    const records = await this.dueItems().findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
    });
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, blocked: 4 };
    return records.map(dueRecordToContract).sort((a: Phase3RevisionDueItem, b: Phase3RevisionDueItem) => {
      const pa = priorityOrder[a.priority] ?? 5;
      const pb = priorityOrder[b.priority] ?? 5;
      return pa - pb;
    });
  }

  async listDueRevisionItemsForLearner(
    schoolId: string,
    studentId: string,
  ): Promise<Phase3RevisionDueItem[]> {
    const items = await this.listRevisionDueItemsForLearner(schoolId, studentId);
    return items.filter((d) => !d.isCompleted);
  }

  async completeDueRevisionItem(dueItemId: string, schoolId: string): Promise<Phase3RevisionDueItem | null> {
    return this.markRevisionDueItemCompleted(dueItemId, schoolId);
  }

  async markRevisionDueItemCompleted(
    dueItemId: string,
    schoolId: string,
  ): Promise<Phase3RevisionDueItem | null> {
    const existing = await this.dueItems().findFirst({
      where: { id: dueItemId, schoolId },
      select: { id: true },
    });
    if (!existing) return null;
    // Releasing openDedupeKey (NULL) preserves future revision cycles:
    // completing one cycle never forbids the next due item for the node.
    const updated = await this.dueItems().update({
      where: { id: dueItemId },
      data: { isCompleted: true, openDedupeKey: null },
    });
    return dueRecordToContract(updated);
  }

  async listAllDueItemsForSchool(schoolId: string): Promise<Phase3RevisionDueItem[]> {
    const records = await this.dueItems().findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(dueRecordToContract);
  }

  // ── Audit (append-only) ──

  async recordRevisionAuditEvent(event: Phase3RevisionAuditEvent): Promise<Phase3RevisionAuditEvent> {
    const record = await this.audits().create({
      data: {
        schoolId: event.schoolId,
        actorId: event.actorId,
        actorRole: event.actorRole,
        studentId: event.studentId ?? null,
        teacherId: event.teacherId ?? null,
        classId: event.classId ?? null,
        nodeId: event.nodeId ?? null,
        edgeId: event.edgeId ?? null,
        objectiveId: event.objectiveId ?? null,
        topicId: event.topicId ?? null,
        skillId: event.skillId ?? null,
        eventType: event.eventType,
        safeReasonCodes: event.safeReasonCodes as any,
        safeEvidenceRefs: event.safeEvidenceRefs as any,
      },
    });
    return auditRecordToContract(record);
  }

  async listRevisionAuditEvents(schoolId: string, limit = 100): Promise<Phase3RevisionAuditEvent[]> {
    const records = await this.audits().findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return records.map(auditRecordToContract);
  }

  // ── Derived reconstruction (DERIVED_VIEW = nodes + edges + due state) ──

  async loadDurableRevisionState(
    schoolId: string,
    studentId: string,
  ): Promise<{
    nodes: Phase3RevisionNode[];
    edges: Phase3RevisionEdge[];
    dueItems: Phase3RevisionDueItem[];
    openDueItems: Phase3RevisionDueItem[];
  }> {
    const [nodes, edges, dueItems] = await Promise.all([
      this.listRevisionNodesForLearner(schoolId, studentId),
      this.listRevisionEdgesForLearner(schoolId, studentId),
      this.listRevisionDueItemsForLearner(schoolId, studentId),
    ]);
    return {
      nodes,
      edges,
      dueItems,
      openDueItems: dueItems.filter((d) => !d.isCompleted),
    };
  }
}

export const phase3LivingRevisionDurableRepository = new Phase3LivingRevisionDurableRepository();
