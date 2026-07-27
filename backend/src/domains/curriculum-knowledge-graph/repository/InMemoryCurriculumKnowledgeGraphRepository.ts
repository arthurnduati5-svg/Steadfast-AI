// Curriculum Knowledge Graph — In-Memory Repository

import type { CurriculumKnowledgeGraphRepository } from './CurriculumKnowledgeGraphRepository';
import type {
  CurriculumGraphVersion,
  CurriculumGraphNode,
  CurriculumGraphEdge,
  CurriculumGraphCommandResult,
} from '../contracts/CurriculumGraphContracts';

interface SnapshotState {
  versions: Map<string, CurriculumGraphVersion>;
  nodes: Map<string, CurriculumGraphNode>;
  edges: Map<string, CurriculumGraphEdge>;
  commandResults: Map<string, CurriculumGraphCommandResult>;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function versionKey(schoolId: string, versionId: string): string {
  return `${schoolId}::${versionId}`;
}

function nodeKey(schoolId: string, versionId: string, nodeId: string): string {
  return `${schoolId}::${versionId}::${nodeId}`;
}

function edgeKey(schoolId: string, versionId: string, edgeId: string): string {
  return `${schoolId}::${versionId}::${edgeId}`;
}

function cmdResultKey(schoolId: string, commandType: string, idempotencyKey: string): string {
  return `${schoolId}::${commandType}::${idempotencyKey}`;
}

export class InMemoryCurriculumKnowledgeGraphRepository implements CurriculumKnowledgeGraphRepository {
  private versions: Map<string, CurriculumGraphVersion> = new Map();
  private nodes: Map<string, CurriculumGraphNode> = new Map();
  private edges: Map<string, CurriculumGraphEdge> = new Map();
  private commandResults: Map<string, CurriculumGraphCommandResult> = new Map();
  private snapshots: Map<string, SnapshotState> = new Map();
  private snapshotCounter = 0;

  saveVersion(version: CurriculumGraphVersion): void {
    this.versions.set(versionKey(version.schoolId, version.versionId), deepClone(version));
  }

  getVersion(schoolId: string, versionId: string): CurriculumGraphVersion | undefined {
    const v = this.versions.get(versionKey(schoolId, versionId));
    return v ? deepClone(v) : undefined;
  }

  listVersions(schoolId: string, curriculumKey?: string, status?: string): CurriculumGraphVersion[] {
    const result: CurriculumGraphVersion[] = [];
    for (const v of this.versions.values()) {
      if (v.schoolId !== schoolId) continue;
      if (curriculumKey && v.curriculumKey !== curriculumKey) continue;
      if (status && v.status !== status) continue;
      result.push(deepClone(v));
    }
    result.sort((a, b) => a.versionNumber - b.versionNumber || a.createdAt.localeCompare(b.createdAt));
    return result;
  }

  getActiveVersion(schoolId: string, curriculumKey: string): CurriculumGraphVersion | undefined {
    for (const v of this.versions.values()) {
      if (v.schoolId === schoolId && v.curriculumKey === curriculumKey && v.status === 'active') {
        return deepClone(v);
      }
    }
    return undefined;
  }

  saveNode(node: CurriculumGraphNode): void {
    this.nodes.set(nodeKey(node.schoolId, node.versionId, node.nodeId), deepClone(node));
  }

  getNode(schoolId: string, versionId: string, nodeId: string): CurriculumGraphNode | undefined {
    const n = this.nodes.get(nodeKey(schoolId, versionId, nodeId));
    return n ? deepClone(n) : undefined;
  }

  listNodes(schoolId: string, versionId: string): CurriculumGraphNode[] {
    const result: CurriculumGraphNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.schoolId === schoolId && n.versionId === versionId) {
        result.push(deepClone(n));
      }
    }
    result.sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code) || a.nodeId.localeCompare(b.nodeId));
    return result;
  }

  removeNode(schoolId: string, versionId: string, nodeId: string): boolean {
    const key = nodeKey(schoolId, versionId, nodeId);
    if (!this.nodes.has(key)) return false;
    this.nodes.delete(key);
    return true;
  }

  saveEdge(edge: CurriculumGraphEdge): void {
    this.edges.set(edgeKey(edge.schoolId, edge.versionId, edge.edgeId), deepClone(edge));
  }

  getEdge(schoolId: string, versionId: string, edgeId: string): CurriculumGraphEdge | undefined {
    const e = this.edges.get(edgeKey(schoolId, versionId, edgeId));
    return e ? deepClone(e) : undefined;
  }

  listEdges(schoolId: string, versionId: string): CurriculumGraphEdge[] {
    const result: CurriculumGraphEdge[] = [];
    for (const e of this.edges.values()) {
      if (e.schoolId === schoolId && e.versionId === versionId) {
        result.push(deepClone(e));
      }
    }
    result.sort((a, b) => a.sequence - b.sequence || a.edgeId.localeCompare(b.edgeId));
    return result;
  }

  removeEdge(schoolId: string, versionId: string, edgeId: string): boolean {
    const key = edgeKey(schoolId, versionId, edgeId);
    if (!this.edges.has(key)) return false;
    this.edges.delete(key);
    return true;
  }

  getCommandResult(schoolId: string, commandType: string, idempotencyKey: string): CurriculumGraphCommandResult | undefined {
    return this.commandResults.get(cmdResultKey(schoolId, commandType, idempotencyKey));
  }

  saveCommandResult(schoolId: string, commandType: string, idempotencyKey: string, result: CurriculumGraphCommandResult): void {
    this.commandResults.set(cmdResultKey(schoolId, commandType, idempotencyKey), deepClone(result));
  }

  runAtomicMutation<T>(fn: () => T): T {
    const snapshotId = this.createSnapshot();
    try {
      const result = fn();
      this.snapshots.delete(snapshotId);
      return result;
    } catch (err) {
      this.restoreSnapshot(snapshotId);
      this.snapshots.delete(snapshotId);
      throw err;
    }
  }

  createSnapshot(): string {
    const id = `snap-${++this.snapshotCounter}`;
    this.snapshots.set(id, {
      versions: new Map(this.versions),
      nodes: new Map(this.nodes),
      edges: new Map(this.edges),
      commandResults: new Map(this.commandResults),
    });
    return id;
  }

  restoreSnapshot(snapshotId: string): void {
    const snap = this.snapshots.get(snapshotId);
    if (!snap) return;
    this.versions = new Map(snap.versions);
    this.nodes = new Map(snap.nodes);
    this.edges = new Map(snap.edges);
    this.commandResults = new Map(snap.commandResults);
  }

  reset(): void {
    this.versions.clear();
    this.nodes.clear();
    this.edges.clear();
    this.commandResults.clear();
    this.snapshots.clear();
    this.snapshotCounter = 0;
  }
}
