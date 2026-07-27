// Curriculum Knowledge Graph — Repository Interface

import type {
  CurriculumGraphVersion,
  CurriculumGraphNode,
  CurriculumGraphEdge,
  CurriculumGraphCommandResult,
  CurriculumGraphCommandBase,
} from '../contracts/CurriculumGraphContracts';

export interface CurriculumKnowledgeGraphRepository {
  saveVersion(version: CurriculumGraphVersion): void;
  getVersion(schoolId: string, versionId: string): CurriculumGraphVersion | undefined;
  listVersions(schoolId: string, curriculumKey?: string, status?: string): CurriculumGraphVersion[];
  getActiveVersion(schoolId: string, curriculumKey: string): CurriculumGraphVersion | undefined;

  saveNode(node: CurriculumGraphNode): void;
  getNode(schoolId: string, versionId: string, nodeId: string): CurriculumGraphNode | undefined;
  listNodes(schoolId: string, versionId: string): CurriculumGraphNode[];
  removeNode(schoolId: string, versionId: string, nodeId: string): boolean;

  saveEdge(edge: CurriculumGraphEdge): void;
  getEdge(schoolId: string, versionId: string, edgeId: string): CurriculumGraphEdge | undefined;
  listEdges(schoolId: string, versionId: string): CurriculumGraphEdge[];
  removeEdge(schoolId: string, versionId: string, edgeId: string): boolean;

  getCommandResult(schoolId: string, commandType: string, idempotencyKey: string): CurriculumGraphCommandResult | undefined;
  saveCommandResult(schoolId: string, commandType: string, idempotencyKey: string, result: CurriculumGraphCommandResult): void;

  runAtomicMutation<T>(fn: () => T): T;
  createSnapshot(): string;
  restoreSnapshot(snapshotId: string): void;
  reset(): void;
}
