import {
  Phase3RevisionEdge,
  Phase3RevisionNode,
  Phase3RevisionEdgeType,
  Phase3RevisionEdgeCreateInput,
  Phase3RevisionSafeEvidenceRef,
} from '../contracts/phase3LivingRevisionContracts';
import { phase3LivingRevisionRepository } from './phase3LivingRevisionRepository';
import { validateRevisionEdgeCreateInput } from '../lib/phase3LivingRevisionValidation';

export function createRevisionEdge(
  schoolId: string,
  studentId: string | undefined,
  edgeType: Phase3RevisionEdgeType,
  sourceNodeId: string,
  targetNodeId: string,
  safeEvidenceRefs?: Phase3RevisionSafeEvidenceRef[],
  safeReasonCodes?: string[],
): Phase3RevisionEdge {
  const sourceNode = phase3LivingRevisionRepository.getRevisionNode(sourceNodeId);
  if (!sourceNode) {
    throw new Error('Source revision node not found.');
  }
  const targetNode = phase3LivingRevisionRepository.getRevisionNode(targetNodeId);
  if (!targetNode) {
    throw new Error('Target revision node not found.');
  }

  if (sourceNode.schoolId !== targetNode.schoolId) {
    throw new Error('Cross-school revision edges are forbidden.');
  }
  if (sourceNode.schoolId !== schoolId || targetNode.schoolId !== schoolId) {
    throw new Error('School identity mismatch for revision edge.');
  }

  if (studentId) {
    if (sourceNode.studentId && sourceNode.studentId !== studentId) {
      throw new Error('Cross-learner revision edges are forbidden.');
    }
    if (targetNode.studentId && targetNode.studentId !== studentId) {
      throw new Error('Cross-learner revision edges are forbidden.');
    }
  }

  if (sourceNode.nodeId === targetNode.nodeId) {
    throw new Error('Cannot create a self-referencing revision edge.');
  }

  const input: Phase3RevisionEdgeCreateInput = {
    schoolId,
    studentId,
    edgeType,
    sourceNodeId,
    targetNodeId,
    safeEvidenceRefs: safeEvidenceRefs || [],
    safeReasonCodes: safeReasonCodes || [],
  };

  const validationErr = validateRevisionEdgeCreateInput(input);
  if (validationErr) {
    throw new Error(validationErr.message);
  }

  return phase3LivingRevisionRepository.createRevisionEdge(input);
}

export function connectNodesByObjective(
  schoolId: string,
  studentId: string,
  sourceNodeId: string,
  targetNodeId: string,
): Phase3RevisionEdge {
  return createRevisionEdge(schoolId, studentId, 'same_objective', sourceNodeId, targetNodeId);
}

export function connectNodesByTopic(
  schoolId: string,
  studentId: string,
  sourceNodeId: string,
  targetNodeId: string,
): Phase3RevisionEdge {
  return createRevisionEdge(schoolId, studentId, 'same_topic', sourceNodeId, targetNodeId);
}

export function connectNodesBySkill(
  schoolId: string,
  studentId: string,
  sourceNodeId: string,
  targetNodeId: string,
): Phase3RevisionEdge {
  return createRevisionEdge(schoolId, studentId, 'same_skill', sourceNodeId, targetNodeId);
}

export function connectMistakeToRepairNode(
  schoolId: string,
  studentId: string,
  mistakeNodeId: string,
  repairNodeId: string,
): Phase3RevisionEdge {
  return createRevisionEdge(schoolId, studentId, 'repairs_mistake', mistakeNodeId, repairNodeId);
}

export function connectStudyPlanToRevisionNode(
  schoolId: string,
  studentId: string,
  studyPlanNodeId: string,
  revisionNodeId: string,
): Phase3RevisionEdge {
  return createRevisionEdge(schoolId, studentId, 'supports_study_plan', studyPlanNodeId, revisionNodeId);
}

export function connectGrowthPageCardToRevisionNode(
  schoolId: string,
  studentId: string,
  growthPageNodeId: string,
  revisionNodeId: string,
): Phase3RevisionEdge {
  return createRevisionEdge(schoolId, studentId, 'supports_growth_action', growthPageNodeId, revisionNodeId);
}

export function connectSourceToRevisionNode(
  schoolId: string,
  studentId: string | undefined,
  sourceNodeId: string,
  revisionNodeId: string,
): Phase3RevisionEdge {
  return createRevisionEdge(schoolId, studentId, 'supports', sourceNodeId, revisionNodeId);
}

export function listNodeConnections(nodeId: string): Phase3RevisionEdge[] {
  return phase3LivingRevisionRepository.listRevisionEdgesForNode(nodeId);
}

export function listEdgesForNode(nodeId: string): Phase3RevisionEdge[] {
  return phase3LivingRevisionRepository.listRevisionEdgesForNode(nodeId);
}

export function listEdgesForLearner(schoolId: string, studentId: string): Phase3RevisionEdge[] {
  return phase3LivingRevisionRepository.listRevisionEdgesForLearner(schoolId, studentId);
}

export function createEdgesForSharedObjective(
  schoolId: string,
  studentId: string,
  nodes: Phase3RevisionNode[],
): Phase3RevisionEdge[] {
  const edges: Phase3RevisionEdge[] = [];
  const objectiveGroups = new Map<string, Phase3RevisionNode[]>();
  for (const node of nodes) {
    if (node.objectiveId) {
      const group = objectiveGroups.get(node.objectiveId) || [];
      group.push(node);
      objectiveGroups.set(node.objectiveId, group);
    }
  }
  for (const [, group] of objectiveGroups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (group[i].nodeId !== group[j].nodeId) {
          try {
            const edge = connectNodesByObjective(schoolId, studentId, group[i].nodeId, group[j].nodeId);
            edges.push(edge);
          } catch { }
        }
      }
    }
  }
  return edges;
}

export function createEdgesForSharedTopic(
  schoolId: string,
  studentId: string,
  nodes: Phase3RevisionNode[],
): Phase3RevisionEdge[] {
  const edges: Phase3RevisionEdge[] = [];
  const topicGroups = new Map<string, Phase3RevisionNode[]>();
  for (const node of nodes) {
    if (node.topicId) {
      const group = topicGroups.get(node.topicId) || [];
      group.push(node);
      topicGroups.set(node.topicId, group);
    }
  }
  for (const [, group] of topicGroups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (group[i].nodeId !== group[j].nodeId) {
          try {
            const edge = connectNodesByTopic(schoolId, studentId, group[i].nodeId, group[j].nodeId);
            edges.push(edge);
          } catch { }
        }
      }
    }
  }
  return edges;
}

export function buildRevisionEdgeSafeSummary(edge: Phase3RevisionEdge): string {
  return `Connected by ${edge.edgeType.replace(/_/g, ' ')}.`;
}

export function listLearnerConnections(schoolId: string, studentId: string): Phase3RevisionEdge[] {
  return phase3LivingRevisionRepository.listRevisionEdgesForLearner(schoolId, studentId);
}

export function removeRevisionEdge(edgeId: string): boolean {
  return phase3LivingRevisionRepository.deleteRevisionEdge(edgeId);
}

export function rankRevisionConnections(edges: Phase3RevisionEdge[]): Phase3RevisionEdge[] {
  const priorityMap: Record<string, number> = {
    repairs_mistake: 0,
    came_from_mistake: 1,
    prerequisite_of: 2,
    supports_study_plan: 3,
    supports_growth_action: 4,
    same_objective: 5,
    same_topic: 6,
    same_skill: 7,
    due_for_recall: 8,
    strengthens: 9,
    supports: 10,
    revisits: 11,
    commonly_confused_with: 12,
    requires_source: 13,
    requires_teacher_support: 14,
  };
  return [...edges].sort((a, b) => {
    const pa = priorityMap[a.edgeType] ?? 99;
    const pb = priorityMap[b.edgeType] ?? 99;
    return pa - pb;
  });
}

export function dedupeRevisionEdges(edges: Phase3RevisionEdge[]): Phase3RevisionEdge[] {
  const seen = new Set<string>();
  const result: Phase3RevisionEdge[] = [];
  for (const e of edges) {
    const key = `${e.edgeType}:${e.sourceNodeId}:${e.targetNodeId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(e);
    }
  }
  return result;
}
