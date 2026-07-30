import type { MasteryTarget, MasteryState, PrerequisiteInfo, PrerequisiteReader } from './probabilisticMasteryContracts';

interface GraphEdge {
  fromId: string;
  toId: string;
  edgeType: 'prerequisite' | 'builds_on';
}

interface GraphSnapshot {
  edges: GraphEdge[];
}

export function createPrerequisiteReader(
  graph: GraphSnapshot,
  stateLookup: (target: MasteryTarget) => MasteryState | null,
  schoolId: string,
  curriculumVersionId: string,
): PrerequisiteReader {
  function isSchoolOrVersionMismatch(target: MasteryTarget): boolean {
    return target.schoolId !== schoolId || target.curriculumVersionId !== curriculumVersionId;
  }

  function typedUnavailable(): PrerequisiteInfo[] {
    return [];
  }

  function getDirectPrerequisites(target: MasteryTarget): PrerequisiteInfo[] {
    if (target.schoolId !== schoolId) return [];
    if (target.curriculumVersionId !== curriculumVersionId) return [];

    const result: PrerequisiteInfo[] = [];
    const seen = new Set<string>();
    for (const edge of graph.edges) {
      if (edge.toId === target.targetNodeId) {
        const prereqId = edge.fromId;
        if (seen.has(prereqId)) continue;
        seen.add(prereqId);
        const prereqTarget: MasteryTarget = {
          schoolId: target.schoolId,
          learnerId: target.learnerId,
          targetNodeId: prereqId,
          targetNodeType: target.targetNodeType,
          curriculumVersionId: target.curriculumVersionId,
        };
        result.push({
          targetNodeId: prereqId,
          targetNodeType: target.targetNodeType,
          curriculumVersionId: target.curriculumVersionId,
          isPrerequisite: edge.edgeType === 'prerequisite',
          isBuildsOn: edge.edgeType === 'builds_on',
          state: stateLookup(prereqTarget),
        });
      }
    }
    return result;
  }

  function getTransitivePrerequisites(target: MasteryTarget): PrerequisiteInfo[] {
    if (target.schoolId !== schoolId) return [];
    if (target.curriculumVersionId !== curriculumVersionId) return [];

    const visited = new Set<string>();
    const queue: string[] = [target.targetNodeId];
    const result: PrerequisiteInfo[] = [];
    const seenResult = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      for (const edge of graph.edges) {
        if (edge.toId === currentId && edge.edgeType === 'prerequisite') {
          const prereqId = edge.fromId;
          if (visited.has(prereqId)) continue;
          if (prereqId === target.targetNodeId) continue;

          if (!seenResult.has(prereqId)) {
            seenResult.add(prereqId);
            const prereqTarget: MasteryTarget = {
              schoolId: target.schoolId,
              learnerId: target.learnerId,
              targetNodeId: prereqId,
              targetNodeType: target.targetNodeType,
              curriculumVersionId: target.curriculumVersionId,
            };
            result.push({
              targetNodeId: prereqId,
              targetNodeType: target.targetNodeType,
              curriculumVersionId: target.curriculumVersionId,
              isPrerequisite: true,
              isBuildsOn: false,
              state: stateLookup(prereqTarget),
            });
          }
          queue.push(prereqId);
        }
      }
    }

    return result;
  }

  return { getDirectPrerequisites, getTransitivePrerequisites };
}

export function detectCircularPrerequisites(graph: GraphSnapshot): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    recStack.add(nodeId);

    for (const edge of graph.edges) {
      if (edge.fromId === nodeId && edge.edgeType === 'prerequisite') {
        if (dfs(edge.toId)) return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  const allNodes = new Set<string>();
  for (const edge of graph.edges) {
    allNodes.add(edge.fromId);
    allNodes.add(edge.toId);
  }

  for (const nodeId of allNodes) {
    if (dfs(nodeId)) return true;
  }

  return false;
}
