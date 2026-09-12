import {
  Phase3RevisionNoteGraph,
  Phase3RevisionNode,
  Phase3RevisionEdge,
  Phase3RevisionDueItem,
  Phase3RevisionConnectionSuggestion,
  Phase3RevisionNodeStatus,
  Phase3RevisionSafeEvidenceRef,
} from '../contracts/phase3LivingRevisionContracts';
import { phase3LivingRevisionRepository } from './phase3LivingRevisionRepository';
import { phase3LivingRevisionDurableRepository } from './phase3LivingRevisionRepository';
import { dedupeRevisionEdges } from './phase3RevisionEdgeService';

export function getLearnerRevisionNoteGraph(
  schoolId: string,
  studentId: string,
  includeArchived = false,
  topicId?: string,
  objectiveId?: string,
): Phase3RevisionNoteGraph {
  return buildRevisionNoteGraph(schoolId, studentId, includeArchived, topicId, objectiveId);
}

export function buildRevisionNoteGraph(
  schoolId: string,
  studentId: string,
  includeArchived = false,
  topicId?: string,
  objectiveId?: string,
): Phase3RevisionNoteGraph {
  const allNodes = assembleRevisionNodes(schoolId, studentId, includeArchived, topicId, objectiveId);
  const allEdges = assembleRevisionEdges(allNodes, schoolId, studentId);
  const dueItems = phase3LivingRevisionRepository.listRevisionDueItemsForLearner(schoolId, studentId);
  const connectionSuggestions = buildRevisionConnectionSuggestions(allNodes, allEdges);
  const safeEvidenceRefs = collectAllSafeEvidenceRefs(allNodes, allEdges);
  const safeReasonCodes = collectAllSafeReasonCodes(allNodes, allEdges);

  return {
    schoolId,
    studentId,
    generatedAt: new Date().toISOString(),
    nodes: allNodes,
    edges: allEdges,
    dueItems: dueItems.filter((d) => !d.isCompleted),
    connectionSuggestions,
    safeEvidenceRefs,
    safeReasonCodes,
    safeSummary: `Revision graph with ${allNodes.length} nodes and ${allEdges.length} connections.`,
  };
}

export function assembleRevisionNodes(
  schoolId: string,
  studentId: string,
  includeArchived = false,
  topicId?: string,
  objectiveId?: string,
): Phase3RevisionNode[] {
  let nodes = phase3LivingRevisionRepository.listRevisionNodesForLearner(schoolId, studentId);

  if (topicId) {
    nodes = nodes.filter((n) => n.topicId === topicId);
  }
  if (objectiveId) {
    nodes = nodes.filter((n) => n.objectiveId === objectiveId);
  }

  if (!includeArchived) {
    nodes = nodes.filter((n) => !n.isArchived);
  }

  return rankRevisionNodes(nodes);
}

export function dedupeGraphNodes(nodes: Phase3RevisionNode[]): Phase3RevisionNode[] {
  const seen = new Map<string, Phase3RevisionNode>();
  for (const node of nodes) {
    const key = `${node.schoolId}:${node.studentId}:${node.nodeId}`;
    if (!seen.has(key)) {
      seen.set(key, node);
    }
  }
  return Array.from(seen.values());
}

export function dedupeGraphEdges(edges: Phase3RevisionEdge[]): Phase3RevisionEdge[] {
  const seen = new Set<string>();
  const result: Phase3RevisionEdge[] = [];
  for (const edge of edges) {
    const key = `${edge.sourceNodeId}:${edge.targetNodeId}:${edge.edgeType}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(edge);
    }
  }
  return result;
}

export function refreshRevisionGraphForLearner(
  schoolId: string,
  studentId: string,
): Phase3RevisionNoteGraph {
  return buildRevisionNoteGraph(schoolId, studentId, false);
}

export function mergeRevisionSignalsIntoGraph(
  schoolId: string,
  studentId: string,
  additionalNodes: Phase3RevisionNode[],
  additionalEdges: Phase3RevisionEdge[],
): Phase3RevisionNoteGraph {
  const graph = getLearnerRevisionNoteGraph(schoolId, studentId);
  const allNodes = dedupeGraphNodes([...graph.nodes, ...additionalNodes]);
  const allEdges = dedupeGraphEdges([...graph.edges, ...additionalEdges]);
  const dueItems = phase3LivingRevisionRepository.listRevisionDueItemsForLearner(schoolId, studentId);
  const safeEvidenceRefs = collectAllSafeEvidenceRefs(allNodes, allEdges);
  const safeReasonCodes = collectAllSafeReasonCodes(allNodes, allEdges);

  return {
    schoolId,
    studentId,
    generatedAt: new Date().toISOString(),
    nodes: allNodes,
    edges: allEdges,
    dueItems: dueItems.filter((d) => !d.isCompleted),
    connectionSuggestions: buildRevisionConnectionSuggestions(allNodes, allEdges),
    safeEvidenceRefs,
    safeReasonCodes,
    safeSummary: `Revision graph with ${allNodes.length} nodes and ${allEdges.length} connections.`,
  };
}

export function resolveRevisionGraphSafeSummary(graph: Phase3RevisionNoteGraph): string {
  if (graph.nodes.length === 0) return 'No revision nodes yet.';
  return `Revision graph with ${graph.nodes.length} nodes and ${graph.edges.length} connections. ${graph.dueItems.length} items due.`;
}

export function getRevisionGraphStatsForTeacher(
  schoolId: string,
): { totalNodes: number; totalEdges: number; totalDueItems: number; totalLearners: number } {
  const allNodes = phase3LivingRevisionRepository.listAllNodesForSchool(schoolId);
  const allEdges = phase3LivingRevisionRepository.listAllEdgesForSchool(schoolId);
  const allDueItems = phase3LivingRevisionRepository.listAllDueItemsForSchool(schoolId);
  const learnerSet = new Set(allNodes.map((n) => n.studentId).filter(Boolean));
  return {
    totalNodes: allNodes.length,
    totalEdges: allEdges.length,
    totalDueItems: allDueItems.filter((d) => !d.isCompleted).length,
    totalLearners: learnerSet.size,
  };
}

export function assembleRevisionEdges(
  nodes: Phase3RevisionNode[],
  schoolId: string,
  studentId: string,
): Phase3RevisionEdge[] {
  const nodeIds = new Set(nodes.map((n) => n.nodeId));
  const allEdges = phase3LivingRevisionRepository.listRevisionEdgesForLearner(schoolId, studentId);
  return dedupeRevisionEdges(
    allEdges.filter((e) => nodeIds.has(e.sourceNodeId) || nodeIds.has(e.targetNodeId)),
  );
}

export function buildRevisionConnectionSuggestions(
  nodes: Phase3RevisionNode[],
  edges: Phase3RevisionEdge[],
): Phase3RevisionConnectionSuggestion[] {
  const suggestions: Phase3RevisionConnectionSuggestion[] = [];
  const existingEdges = new Set<string>();
  for (const e of edges) {
    existingEdges.add(`${e.sourceNodeId}:${e.targetNodeId}`);
    existingEdges.add(`${e.targetNodeId}:${e.sourceNodeId}`);
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      if (existingEdges.has(`${a.nodeId}:${b.nodeId}`) || existingEdges.has(`${b.nodeId}:${a.nodeId}`)) {
        continue;
      }

      if (a.objectiveId && b.objectiveId && a.objectiveId === b.objectiveId) {
        suggestions.push({
          sourceNodeId: a.nodeId,
          targetNodeId: b.nodeId,
          edgeType: 'same_objective',
          reasonCode: 'shared_objective',
          score: 0.9,
          safeEvidenceRefs: [],
        });
      } else if (a.topicId && b.topicId && a.topicId === b.topicId) {
        suggestions.push({
          sourceNodeId: a.nodeId,
          targetNodeId: b.nodeId,
          edgeType: 'same_topic',
          reasonCode: 'shared_topic',
          score: 0.7,
          safeEvidenceRefs: [],
        });
      }
    }
  }

  return suggestions.slice(0, 20);
}

export function rankRevisionNodes(nodes: Phase3RevisionNode[]): Phase3RevisionNode[] {
  const statusOrder: Record<string, number> = {
    due_for_review: 0,
    needs_recall: 1,
    needs_teach_back: 2,
    needs_practice: 3,
    pinned: 4,
    active: 5,
    needs_source: 6,
    needs_teacher_support: 7,
    blocked: 8,
    archived: 9,
  };

  return [...nodes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const sa = statusOrder[a.status] ?? 99;
    const sb = statusOrder[b.status] ?? 99;
    if (sa !== sb) return sa - sb;

    const isMistakeA = a.safeReasonCodes.includes('created_from_mistake_pattern');
    const isMistakeB = b.safeReasonCodes.includes('created_from_mistake_pattern');
    if (isMistakeA && !isMistakeB) return -1;
    if (!isMistakeA && isMistakeB) return 1;

    const isObjectiveA = a.nodeType === 'objective_anchor';
    const isObjectiveB = b.nodeType === 'objective_anchor';
    if (isObjectiveA && !isObjectiveB) return -1;
    if (!isObjectiveA && isObjectiveB) return 1;

    return b.connectionCount - a.connectionCount;
  });
}

export function rankRevisionEdges(edges: Phase3RevisionEdge[]): Phase3RevisionEdge[] {
  const priorityMap: Record<string, number> = {
    repairs_mistake: 0,
    came_from_mistake: 1,
    prerequisite_of: 2,
    supports_study_plan: 3,
    supports_growth_action: 4,
    same_objective: 5,
    same_topic: 6,
    due_for_recall: 7,
    strengthens: 8,
    supports: 9,
  };
  return [...edges].sort((a, b) => {
    const pa = priorityMap[a.edgeType] ?? 99;
    const pb = priorityMap[b.edgeType] ?? 99;
    return pa - pb;
  });
}

export function dedupeRevisionNodes(nodes: Phase3RevisionNode[]): Phase3RevisionNode[] {
  const seen = new Set<string>();
  return nodes.filter((n) => {
    if (seen.has(n.nodeId)) return false;
    seen.add(n.nodeId);
    return true;
  });
}

export function limitRevisionGraph(graph: Phase3RevisionNoteGraph, maxNodes = 100): Phase3RevisionNoteGraph {
  if (graph.nodes.length <= maxNodes) return graph;
  const limited = graph.nodes.slice(0, maxNodes);
  const limitedIds = new Set(limited.map((n) => n.nodeId));
  return {
    ...graph,
    nodes: limited,
    edges: graph.edges.filter((e) => limitedIds.has(e.sourceNodeId) && limitedIds.has(e.targetNodeId)),
  };
}

export function buildEmptyRevisionGraph(schoolId: string, studentId: string): Phase3RevisionNoteGraph {
  return {
    schoolId,
    studentId,
    generatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
    dueItems: [],
    connectionSuggestions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: [],
    safeSummary: 'No revision nodes yet. Start by saving a note or completing a learning session.',
  };
}

export async function getDurableLearnerRevisionNoteGraph(
  schoolId: string,
  studentId: string,
  includeArchived = false,
  topicId?: string,
  objectiveId?: string,
): Promise<Phase3RevisionNoteGraph> {
  // R8-G.3A-D1: DERIVED_VIEW reconstructed from durable records only.
  // Holds no process-local state; a fresh call after restart returns the
  // same graph. No persistent graph model exists by design.
  const state = await phase3LivingRevisionDurableRepository.loadDurableRevisionState(
    schoolId,
    studentId,
  );

  let nodes = state.nodes;
  if (topicId) {
    nodes = nodes.filter((n) => n.topicId === topicId);
  }
  if (objectiveId) {
    nodes = nodes.filter((n) => n.objectiveId === objectiveId);
  }
  if (!includeArchived) {
    nodes = nodes.filter((n) => !n.isArchived);
  }
  const rankedNodes = rankRevisionNodes(nodes);

  const nodeIds = new Set(rankedNodes.map((n) => n.nodeId));
  const edges = dedupeRevisionEdges(
    state.edges.filter((e) => nodeIds.has(e.sourceNodeId) || nodeIds.has(e.targetNodeId)),
  );
  const dueItems = state.openDueItems.filter((d) => nodeIds.has(d.nodeId));
  const connectionSuggestions = buildRevisionConnectionSuggestions(rankedNodes, edges);
  const safeEvidenceRefs = collectAllSafeEvidenceRefs(rankedNodes, edges);
  const safeReasonCodes = collectAllSafeReasonCodes(rankedNodes, edges);

  return {
    schoolId,
    studentId,
    generatedAt: new Date().toISOString(),
    nodes: rankedNodes,
    edges,
    dueItems,
    connectionSuggestions,
    safeEvidenceRefs,
    safeReasonCodes,
    safeSummary: `Revision graph with ${rankedNodes.length} nodes and ${edges.length} connections.`,
  };
}

function collectAllSafeEvidenceRefs(
  nodes: Phase3RevisionNode[],
  edges: Phase3RevisionEdge[],
): Phase3RevisionSafeEvidenceRef[] {
  const map = new Map<string, Phase3RevisionSafeEvidenceRef>();
  for (const n of nodes) {
    for (const ref of n.safeEvidenceRefs) {
      map.set(ref.evidenceId, ref);
    }
  }
  for (const e of edges) {
    for (const ref of e.safeEvidenceRefs) {
      map.set(ref.evidenceId, ref);
    }
  }
  return Array.from(map.values());
}

function collectAllSafeReasonCodes(nodes: Phase3RevisionNode[], edges: Phase3RevisionEdge[]): string[] {
  const set = new Set<string>();
  for (const n of nodes) {
    for (const code of n.safeReasonCodes) {
      set.add(code);
    }
  }
  for (const e of edges) {
    for (const code of e.safeReasonCodes) {
      set.add(code);
    }
  }
  return Array.from(set);
}
