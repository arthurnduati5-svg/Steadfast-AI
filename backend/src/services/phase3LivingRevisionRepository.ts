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
    const n = this.nodes.get(nodeId);
    return n ? this.toNode(n) : null;
  }

  listRevisionNodesForLearner(schoolId: string, studentId: string): Phase3RevisionNode[] {
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId && n.studentId === studentId) {
        result.push(this.toNode(n));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listRevisionNodesByObjective(schoolId: string, studentId: string, objectiveId: string): Phase3RevisionNode[] {
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId && n.studentId === studentId && n.objectiveId === objectiveId) {
        result.push(this.toNode(n));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listRevisionNodesByTopic(schoolId: string, studentId: string, topicId: string): Phase3RevisionNode[] {
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId && n.studentId === studentId && n.topicId === topicId) {
        result.push(this.toNode(n));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listRevisionNodesByStatus(schoolId: string, studentId: string, status: Phase3RevisionNodeStatus): Phase3RevisionNode[] {
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId && n.studentId === studentId && n.status === status) {
        result.push(this.toNode(n));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  updateRevisionNodeStatus(nodeId: string, status: Phase3RevisionNodeStatus): Phase3RevisionNode | null {
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.status = status;
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  pinRevisionNode(nodeId: string): Phase3RevisionNode | null {
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.isPinned = true;
    n.status = 'pinned';
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  archiveRevisionNode(nodeId: string): Phase3RevisionNode | null {
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.isArchived = true;
    n.status = 'archived';
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  snoozeRevisionNode(nodeId: string): Phase3RevisionNode | null {
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.status = 'active';
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  completeRevisionNode(nodeId: string): Phase3RevisionNode | null {
    const n = this.nodes.get(nodeId);
    if (!n) return null;
    n.status = 'active';
    n._updatedAt = Date.now();
    n.updatedAt = new Date(n._updatedAt).toISOString();
    return this.toNode(n);
  }

  createRevisionEdge(input: Phase3RevisionEdgeCreateInput): Phase3RevisionEdge {
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
    const e = this.edges.get(edgeId);
    return e ? this.toEdge(e) : null;
  }

  listRevisionEdgesForLearner(schoolId: string, studentId: string): Phase3RevisionEdge[] {
    const result: Phase3RevisionEdge[] = [];
    for (const e of this.edges.values()) {
      if (e.schoolId === schoolId && e.studentId === studentId) {
        result.push(this.toEdge(e));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listRevisionEdgesForNode(nodeId: string): Phase3RevisionEdge[] {
    const result: Phase3RevisionEdge[] = [];
    for (const e of this.edges.values()) {
      if (e.sourceNodeId === nodeId || e.targetNodeId === nodeId) {
        result.push(this.toEdge(e));
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  deleteRevisionEdge(edgeId: string): boolean {
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
    const d = this.dueItems.get(dueItemId);
    return d ? this.toDueItem(d) : null;
  }

  listDueRevisionItemsForLearner(schoolId: string, studentId: string): Phase3RevisionDueItem[] {
    return this.listRevisionDueItemsForLearner(schoolId, studentId)
      .filter((d) => !d.isCompleted);
  }

  listRevisionDueItemsForLearner(schoolId: string, studentId: string): Phase3RevisionDueItem[] {
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
    return this.markRevisionDueItemCompleted(dueItemId);
  }

  markRevisionDueItemCompleted(dueItemId: string): Phase3RevisionDueItem | null {
    const d = this.dueItems.get(dueItemId);
    if (!d) return null;
    d.isCompleted = true;
    d._updatedAt = Date.now();
    d.updatedAt = new Date(d._updatedAt).toISOString();
    return this.toDueItem(d);
  }

  recordRevisionAuditEvent(event: Phase3RevisionAuditEvent): void {
    this.auditEvents.push({ ...event });
  }

  listRevisionAuditEvents(schoolId: string, limit = 100): Phase3RevisionAuditEvent[] {
    return this.auditEvents
      .filter((e) => e.schoolId === schoolId)
      .reverse()
      .slice(0, limit);
  }

  private revisionGraphs: Map<string, Phase3RevisionNoteGraph> = new Map();

  upsertRevisionGraph(schoolId: string, studentId: string, graph: Phase3RevisionNoteGraph): void {
    this.revisionGraphs.set(`${schoolId}:${studentId}`, graph);
  }

  getRevisionGraphForLearner(schoolId: string, studentId: string): Phase3RevisionNoteGraph | null {
    return this.revisionGraphs.get(`${schoolId}:${studentId}`) || null;
  }

  resetPhase3LivingRevisionRepositoryForTests(): void {
    this.nodes.clear();
    this.edges.clear();
    this.dueItems.clear();
    this.auditEvents = [];
    this.revisionGraphs.clear();
  }

  listAllNodesForSchool(schoolId: string): Phase3RevisionNode[] {
    const result: Phase3RevisionNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId) {
        result.push(this.toNode(n));
      }
    }
    return result;
  }

  listAllEdgesForSchool(schoolId: string): Phase3RevisionEdge[] {
    const result: Phase3RevisionEdge[] = [];
    for (const e of this.edges.values()) {
      if (e.schoolId === schoolId) {
        result.push(this.toEdge(e));
      }
    }
    return result;
  }

  listAllDueItemsForSchool(schoolId: string): Phase3RevisionDueItem[] {
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
