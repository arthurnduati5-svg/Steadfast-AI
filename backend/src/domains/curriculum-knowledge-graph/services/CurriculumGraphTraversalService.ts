// Curriculum Knowledge Graph — Traversal Service

import type {
  CurriculumGraphNode,
  CurriculumGraphEdge,
  TraversalResponse,
  StructuralLearningPathResult,
  ObjectiveMapResult,
  ConceptMapResult,
  ChangeImpactResult,
  StudentSafeGraph,
  StudentSafeNode,
  StudentSafeEdge,
  StaffSafeGraph,
  CurriculumGraphVersion,
} from '../contracts/CurriculumGraphContracts';
import type { CurriculumKnowledgeGraphRepository } from '../repository/CurriculumKnowledgeGraphRepository';

export class CurriculumGraphTraversalService {
  constructor(private repo: CurriculumKnowledgeGraphRepository) {}

  getChildren(schoolId: string, versionId: string, nodeId: string): CurriculumGraphNode[] {
    const edges = this.repo.listEdges(schoolId, versionId).filter(e => e.edgeType === 'contains' && e.fromNodeId === nodeId);
    const nodes = this.repo.listNodes(schoolId, versionId);
    return edges
      .map(e => nodes.find(n => n.nodeId === e.toNodeId))
      .filter((n): n is CurriculumGraphNode => n !== undefined)
      .sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code) || a.nodeId.localeCompare(b.nodeId));
  }

  getAncestors(schoolId: string, versionId: string, nodeId: string): CurriculumGraphNode[] {
    const edges = this.repo.listEdges(schoolId, versionId).filter(e => e.edgeType === 'contains');
    const nodes = this.repo.listNodes(schoolId, versionId);
    const result: CurriculumGraphNode[] = [];
    const childToParent = new Map<string, string>();
    for (const e of edges) {
      childToParent.set(e.toNodeId, e.fromNodeId);
    }
    let current = nodeId;
    let maxDepth = 100;
    while (current && maxDepth > 0) {
      const parentId = childToParent.get(current);
      if (!parentId) break;
      const parent = nodes.find(n => n.nodeId === parentId);
      if (!parent) break;
      result.push(parent);
      current = parentId;
      maxDepth--;
    }
    return result;
  }

  getDescendants(schoolId: string, versionId: string, nodeId: string, maxDepth: number = 10): TraversalResponse {
    const edges = this.repo.listEdges(schoolId, versionId).filter(e => e.edgeType === 'contains');
    const nodes = this.repo.listNodes(schoolId, versionId);
    const version = this.repo.getVersion(schoolId, versionId);

    const adj = new Map<string, string[]>();
    for (const n of nodes) adj.set(n.nodeId, []);
    for (const e of edges) {
      if (adj.has(e.fromNodeId)) adj.get(e.fromNodeId)!.push(e.toNodeId);
    }

    const visited = new Set<string>();
    const resultNodes: CurriculumGraphNode[] = [];
    const resultEdges: CurriculumGraphEdge[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
    let truncated = false;

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth > 0 && !visited.has(id)) {
        visited.add(id);
        const node = nodes.find(n => n.nodeId === id);
        if (node) resultNodes.push(node);
      }
      if (depth >= maxDepth) {
        truncated = true;
        continue;
      }
      const children = adj.get(id) || [];
      for (const child of children) {
        if (!visited.has(child)) {
          const edge = edges.find(e => e.fromNodeId === id && e.toNodeId === child);
          if (edge) resultEdges.push(edge);
          queue.push({ id: child, depth: depth + 1 });
        }
      }
    }

    resultNodes.sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code) || a.nodeId.localeCompare(b.nodeId));
    return {
      rootNodeId: nodeId,
      nodes: resultNodes,
      edges: resultEdges,
      depth: maxDepth,
      truncated,
      graphVersionId: versionId,
      graphRevision: version?.revision ?? 0,
    };
  }

  getDirectPrerequisites(schoolId: string, versionId: string, nodeId: string): CurriculumGraphNode[] {
    const edges = this.repo.listEdges(schoolId, versionId).filter(e => e.edgeType === 'prerequisite_of' && e.toNodeId === nodeId);
    const nodes = this.repo.listNodes(schoolId, versionId);
    return edges
      .map(e => nodes.find(n => n.nodeId === e.fromNodeId))
      .filter((n): n is CurriculumGraphNode => n !== undefined)
      .sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code) || a.nodeId.localeCompare(b.nodeId));
  }

  getTransitivePrerequisites(schoolId: string, versionId: string, nodeId: string, maxDepth: number = 20): CurriculumGraphNode[] {
    const edges = this.repo.listEdges(schoolId, versionId).filter(e => e.edgeType === 'prerequisite_of');
    const nodes = this.repo.listNodes(schoolId, versionId);

    const reverseAdj = new Map<string, string[]>();
    for (const n of nodes) reverseAdj.set(n.nodeId, []);
    for (const e of edges) {
      if (reverseAdj.has(e.toNodeId)) reverseAdj.get(e.toNodeId)!.push(e.fromNodeId);
    }

    const visited = new Set<string>();
    const result: CurriculumGraphNode[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;
      const prereqs = reverseAdj.get(id) || [];
      for (const p of prereqs) {
        if (!visited.has(p)) {
          visited.add(p);
          const node = nodes.find(n => n.nodeId === p);
          if (node) {
            result.push(node);
            queue.push({ id: p, depth: depth + 1 });
          }
        }
      }
    }
    return result.sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code) || a.nodeId.localeCompare(b.nodeId));
  }

  getDirectDependents(schoolId: string, versionId: string, nodeId: string): CurriculumGraphNode[] {
    const edges = this.repo.listEdges(schoolId, versionId).filter(e => e.edgeType === 'prerequisite_of' && e.fromNodeId === nodeId);
    const nodes = this.repo.listNodes(schoolId, versionId);
    return edges
      .map(e => nodes.find(n => n.nodeId === e.toNodeId))
      .filter((n): n is CurriculumGraphNode => n !== undefined)
      .sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code) || a.nodeId.localeCompare(b.nodeId));
  }

  getTransitiveDependents(schoolId: string, versionId: string, nodeId: string, maxDepth: number = 20): CurriculumGraphNode[] {
    const edges = this.repo.listEdges(schoolId, versionId).filter(e => e.edgeType === 'prerequisite_of');
    const nodes = this.repo.listNodes(schoolId, versionId);

    const adj = new Map<string, string[]>();
    for (const n of nodes) adj.set(n.nodeId, []);
    for (const e of edges) {
      if (adj.has(e.fromNodeId)) adj.get(e.fromNodeId)!.push(e.toNodeId);
    }

    const visited = new Set<string>();
    const result: CurriculumGraphNode[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;
      const deps = adj.get(id) || [];
      for (const d of deps) {
        if (!visited.has(d)) {
          visited.add(d);
          const node = nodes.find(n => n.nodeId === d);
          if (node) {
            result.push(node);
            queue.push({ id: d, depth: depth + 1 });
          }
        }
      }
    }
    return result.sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code) || a.nodeId.localeCompare(b.nodeId));
  }

  resolveStructuralLearningPath(
    schoolId: string,
    versionId: string,
    targetNodeId: string,
    startingNodeIds: string[] = [],
    maxDepth: number = 50,
  ): StructuralLearningPathResult {
    const nodes = this.repo.listNodes(schoolId, versionId);
    const edges = this.repo.listEdges(schoolId, versionId);
    const targetNode = nodes.find(n => n.nodeId === targetNodeId);

    const result: StructuralLearningPathResult = {
      targetNode: targetNode!,
      orderedNodes: [],
      requiredEdges: [],
      prerequisiteCount: 0,
      startingFoundations: startingNodeIds,
      unresolvedPrerequisites: [],
      pathStatus: 'ready',
      reasonCodes: [],
    };

    if (!targetNode) {
      result.pathStatus = 'blocked';
      result.reasonCodes.push('target_not_found');
      return result;
    }

    // Check for prerequisite cycles
    const prereqEdges = edges.filter(e => e.edgeType === 'prerequisite_of');
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    let hasCycle = false;

    function dfsCycle(nodeId: string): void {
      if (recursionStack.has(nodeId)) { hasCycle = true; return; }
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      recursionStack.add(nodeId);
      for (const pe of prereqEdges) {
        if (pe.fromNodeId === nodeId) {
          dfsCycle(pe.toNodeId);
        }
      }
      recursionStack.delete(nodeId);
    }
    dfsCycle(targetNodeId);

    if (hasCycle) {
      result.pathStatus = 'blocked';
      result.reasonCodes.push('prerequisite_cycle');
      return result;
    }

    // Gather transitive prerequisites
    const prereqIds = new Set<string>();
    const startSet = new Set(startingNodeIds);
    const queue: string[] = [targetNodeId];
    while (queue.length > 0 && prereqIds.size < maxDepth) {
      const current = queue.shift()!;
      for (const pe of prereqEdges) {
        if (pe.toNodeId === current && !prereqIds.has(pe.fromNodeId) && !startSet.has(pe.fromNodeId)) {
          prereqIds.add(pe.fromNodeId);
          queue.push(pe.fromNodeId);
        }
      }
    }

    if (prereqIds.size === 0) {
      result.pathStatus = 'ready';
      result.reasonCodes.push('no_prerequisites');
      return result;
    }

    // Topological sort
    const inDegree = new Map<string, number>();
    const prereqAdj = new Map<string, string[]>();
    for (const id of prereqIds) {
      inDegree.set(id, 0);
      prereqAdj.set(id, []);
    }
    for (const pe of prereqEdges) {
      if (prereqIds.has(pe.fromNodeId) && prereqIds.has(pe.toNodeId)) {
        prereqAdj.get(pe.fromNodeId)!.push(pe.toNodeId);
        inDegree.set(pe.toNodeId, (inDegree.get(pe.toNodeId) || 0) + 1);
      }
    }

    const topoQueue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) topoQueue.push(id);
    }

    const orderedIds: string[] = [];
    while (topoQueue.length > 0) {
      const id = topoQueue.shift()!;
      orderedIds.push(id);
      for (const dep of prereqAdj.get(id) || []) {
        const newDeg = (inDegree.get(dep) || 1) - 1;
        inDegree.set(dep, newDeg);
        if (newDeg === 0) topoQueue.push(dep);
      }
    }

    result.orderedNodes = orderedIds
      .map(id => nodes.find(n => n.nodeId === id))
      .filter((n): n is CurriculumGraphNode => n !== undefined);

    result.requiredEdges = prereqEdges.filter(pe =>
      prereqIds.has(pe.fromNodeId) && prereqIds.has(pe.toNodeId),
    );

    const unresolved = Array.from(prereqIds).filter(id => !orderedIds.includes(id));
    result.unresolvedPrerequisites = unresolved;
    result.prerequisiteCount = prereqIds.size;
    result.pathStatus = unresolved.length > 0 ? 'blocked' : 'prerequisites_required';
    if (result.pathStatus === 'prerequisites_required') {
      result.reasonCodes.push('prerequisites_found');
    }

    return result;
  }

  getObjectiveMap(schoolId: string, versionId: string, nodeId: string): ObjectiveMapResult | null {
    const nodes = this.repo.listNodes(schoolId, versionId);
    const edges = this.repo.listEdges(schoolId, versionId);
    const objective = nodes.find(n => n.nodeId === nodeId && n.nodeType === 'learning_objective');
    if (!objective) return null;

    const hierarchyLocation: CurriculumGraphNode[] = this.getAncestors(schoolId, versionId, nodeId).reverse();
    hierarchyLocation.push(objective);

    const targetedConcepts = edges
      .filter(e => e.edgeType === 'objective_targets_concept' && e.fromNodeId === nodeId)
      .map(e => nodes.find(n => n.nodeId === e.toNodeId))
      .filter((n): n is CurriculumGraphNode => n !== undefined);

    const developedSkills = edges
      .filter(e => e.edgeType === 'objective_develops_skill' && e.fromNodeId === nodeId)
      .map(e => nodes.find(n => n.nodeId === e.toNodeId))
      .filter((n): n is CurriculumGraphNode => n !== undefined);

    const directPrerequisites = this.getDirectPrerequisites(schoolId, versionId, nodeId);
    const transitivePrerequisites = this.getTransitivePrerequisites(schoolId, versionId, nodeId);

    const dependentObjectives = edges
      .filter(e => e.edgeType === 'prerequisite_of' && e.fromNodeId === nodeId)
      .map(e => nodes.find(n => n.nodeId === e.toNodeId && n.nodeType === 'learning_objective'))
      .filter((n): n is CurriculumGraphNode => n !== undefined);

    return {
      objectiveNode: objective,
      hierarchyLocation,
      targetedConcepts,
      developedSkills,
      directPrerequisites,
      transitivePrerequisites,
      dependentObjectives,
      successCriteria: objective.learningObjectiveMetadata?.successCriteria || [],
      cognitiveDemand: objective.learningObjectiveMetadata?.cognitiveDemand || 'understand',
      demonstrationTypes: objective.learningObjectiveMetadata?.demonstrationTypes || [],
    };
  }

  getConceptMap(schoolId: string, versionId: string, nodeId: string, maxDepth: number = 3): ConceptMapResult | null {
    const nodes = this.repo.listNodes(schoolId, versionId);
    const edges = this.repo.listEdges(schoolId, versionId);
    const concept = nodes.find(n => n.nodeId === nodeId && n.nodeType === 'concept');
    if (!concept) return null;

    const hierarchyLocation = this.getAncestors(schoolId, versionId, nodeId).reverse();
    hierarchyLocation.push(concept);

    const prerequisiteConcepts = this.getDirectPrerequisites(schoolId, versionId, nodeId)
      .filter(n => n.nodeType === 'concept');
    const dependentConcepts = this.getDirectDependents(schoolId, versionId, nodeId)
      .filter(n => n.nodeType === 'concept');

    const targetingObjectives = edges
      .filter(e => e.edgeType === 'objective_targets_concept' && e.toNodeId === nodeId)
      .map(e => nodes.find(n => n.nodeId === e.fromNodeId))
      .filter((n): n is CurriculumGraphNode => n !== undefined);

    const relatedConcepts = edges
      .filter(e => e.edgeType === 'related_to' && (e.fromNodeId === nodeId || e.toNodeId === nodeId))
      .map(e => {
        const relatedId = e.fromNodeId === nodeId ? e.toNodeId : e.fromNodeId;
        return nodes.find(n => n.nodeId === relatedId && n.nodeType === 'concept');
      })
      .filter((n): n is CurriculumGraphNode => n !== undefined);

    const buildOnRelationships = edges.filter(e =>
      e.edgeType === 'builds_on' && (e.fromNodeId === nodeId || e.toNodeId === nodeId),
    );

    return {
      conceptNode: concept,
      hierarchyLocation,
      prerequisiteConcepts,
      dependentConcepts,
      targetingObjectives,
      relatedConcepts,
      buildOnRelationships,
      depth: maxDepth,
    };
  }

  analyzeChangeImpact(
    schoolId: string,
    versionId: string,
    nodeId?: string,
    edgeId?: string,
    operationType: 'update' | 'remove' | 'replace' | 'deprecate_in_successor' = 'update',
  ): ChangeImpactResult {
    const nodes = this.repo.listNodes(schoolId, versionId);
    const edges = this.repo.listEdges(schoolId, versionId);

    const result: ChangeImpactResult = {
      operationType,
      directChildren: [],
      descendants: [],
      directPrerequisites: [],
      directDependents: [],
      transitiveDependents: [],
      affectedObjectives: [],
      affectedConcepts: [],
      affectedSkills: [],
      affectedHierarchyPaths: [],
      blockedOperationReasons: [],
      suggestedSequence: [],
    };

    if (nodeId) {
      result.directChildren = this.getChildren(schoolId, versionId, nodeId);
      const descResponse = this.getDescendants(schoolId, versionId, nodeId, 20);
      result.descendants = descResponse.nodes;
      result.directPrerequisites = this.getDirectPrerequisites(schoolId, versionId, nodeId);
      result.directDependents = this.getDirectDependents(schoolId, versionId, nodeId);
      result.transitiveDependents = this.getTransitiveDependents(schoolId, versionId, nodeId);

      // Affected objectives
      const objectiveNodes = nodes.filter(n => n.nodeType === 'learning_objective');
      for (const obj of objectiveNodes) {
        const objEdges = edges.filter(e =>
          (e.fromNodeId === obj.nodeId || e.toNodeId === obj.nodeId),
        );
        if (objEdges.some(e => e.fromNodeId === nodeId || e.toNodeId === nodeId)) {
          result.affectedObjectives.push(obj);
        }
      }

      result.affectedConcepts = nodes.filter(n =>
        n.nodeType === 'concept' && (n.nodeId === nodeId || descResponse.nodes.some(d => d.nodeId === n.nodeId)),
      );
      result.affectedSkills = nodes.filter(n =>
        n.nodeType === 'skill' && (n.nodeId === nodeId || descResponse.nodes.some(d => d.nodeId === n.nodeId)),
      );

      // Hierarchy paths
      const ancestors = this.getAncestors(schoolId, versionId, nodeId);
      const path = [...ancestors.reverse().map(n => n.code), nodes.find(n => n.nodeId === nodeId)?.code || ''];
      result.affectedHierarchyPaths.push(path);
      for (const child of result.directChildren) {
        const childAncestors = this.getAncestors(schoolId, versionId, child.nodeId);
        result.affectedHierarchyPaths.push([...childAncestors.reverse().map(n => n.code), child.code]);
      }

      // Check if removal is blocked
      if (operationType === 'remove') {
        if (result.directChildren.length > 0) {
          result.blockedOperationReasons.push(`Node has ${result.directChildren.length} direct child(ren). Remove or reparent them first.`);
        }
        if (result.directDependents.length > 0) {
          result.blockedOperationReasons.push(`Node has ${result.directDependents.length} direct dependent(s). Remove prerequisite edges first.`);
        }
      }
    }

    return result;
  }

  buildStudentSafeGraph(schoolId: string, versionId: string): StudentSafeGraph | null {
    const version = this.repo.getVersion(schoolId, versionId);
    if (!version || (version.status !== 'active' && version.status !== 'approved')) return null;

    const nodes = this.repo.listNodes(schoolId, versionId);
    const edges = this.repo.listEdges(schoolId, versionId);

    const safeNodes: StudentSafeNode[] = nodes
      .filter(n => n.studentVisible)
      .map(n => ({
        nodeId: n.nodeId,
        nodeType: n.nodeType,
        code: n.code,
        title: n.title,
        description: n.description,
        sequence: n.sequence,
        tags: n.tags,
        studentSafeStatement: n.learningObjectiveMetadata?.studentSafeStatement,
        successCriteria: n.learningObjectiveMetadata?.successCriteria,
        learningObjectiveMetadata: n.learningObjectiveMetadata ? {
          objectiveType: n.learningObjectiveMetadata.objectiveType,
          expectedOutcome: n.learningObjectiveMetadata.expectedOutcome,
          successCriteria: n.learningObjectiveMetadata.successCriteria,
          cognitiveDemand: n.learningObjectiveMetadata.cognitiveDemand,
          demonstrationTypes: n.learningObjectiveMetadata.demonstrationTypes,
          studentSafeStatement: n.learningObjectiveMetadata.studentSafeStatement,
        } : undefined,
      }));

    const safeNodeIds = new Set(safeNodes.map(n => n.nodeId));
    const safeEdges: StudentSafeEdge[] = edges
      .filter(e => safeNodeIds.has(e.fromNodeId) && safeNodeIds.has(e.toNodeId))
      .map(e => ({
        edgeId: e.edgeId,
        edgeType: e.edgeType,
        fromNodeId: e.fromNodeId,
        toNodeId: e.toNodeId,
        sequence: e.sequence,
        required: e.required,
        rationale: e.rationale,
      }));

    return {
      versionId: version.versionId,
      curriculumKey: version.curriculumKey,
      versionNumber: version.versionNumber,
      title: version.title,
      description: version.description,
      nodes: safeNodes,
      edges: safeEdges,
      graphRevision: version.revision,
    };
  }

  buildStaffSafeGraph(schoolId: string, versionId: string, withValidation: boolean = false): StaffSafeGraph | null {
    const version = this.repo.getVersion(schoolId, versionId);
    if (!version) return null;

    const nodes = this.repo.listNodes(schoolId, versionId);
    const edges = this.repo.listEdges(schoolId, versionId);

    return {
      version: { ...version },
      nodes: nodes.map(n => ({ ...n })),
      edges: edges.map(e => ({ ...e })),
    };
  }
}
