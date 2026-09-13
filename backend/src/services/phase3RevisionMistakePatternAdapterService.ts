import {
  Phase3RevisionNode,
  Phase3RevisionEdge,
  Phase3RevisionDueItem,
} from '../contracts/phase3LivingRevisionContracts';
import { createMistakePatternRevisionNode } from './phase3RevisionNodeService';
import { createRevisionEdge } from './phase3RevisionEdgeService';
import { deriveDueFromMistakePattern } from './phase3RevisionDueResolverService';

export interface MistakePatternInput {
  patternId: string;
  patternType: string;
  safeTitle: string;
  learnerSafeSummary: string;
  occurrenceCount: number;
  isRecent?: boolean;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  repairNodeId?: string;
}

export function loadMistakePatternsForRevision(
  schoolId: string,
  studentId: string,
  patterns: MistakePatternInput[],
): { nodes: Phase3RevisionNode[]; edges: Phase3RevisionEdge[]; dueItems: Phase3RevisionDueItem[] } {
  const nodes: Phase3RevisionNode[] = [];
  const edges: Phase3RevisionEdge[] = [];
  const dueItems: Phase3RevisionDueItem[] = [];

  if (!Array.isArray(patterns) || patterns.length === 0) {
    return { nodes, edges, dueItems };
  }

  for (const pattern of patterns) {
    if (!pattern.patternId || !pattern.safeTitle) continue;

    const node = createMistakePatternRevisionNode(
      schoolId,
      studentId,
      `Mistake: ${pattern.safeTitle}`,
      pattern.learnerSafeSummary || 'Mistake pattern revision',
      { status: 'learner_created_visible' },
    );
    nodes.push(node);

    const dueItem = deriveDueFromMistakePattern(
      schoolId,
      studentId,
      node.nodeId,
      node.safeTitle,
      node.safeSummary,
      pattern.occurrenceCount > 1,
      pattern.isRecent === true,
      pattern.objectiveId,
      pattern.topicId,
    );
    dueItems.push(dueItem);
  }

  return { nodes, edges, dueItems };
}

export function mapMistakePatternToRevisionNode(
  schoolId: string,
  studentId: string,
  pattern: MistakePatternInput,
): Phase3RevisionNode | null {
  if (!pattern.patternId || !pattern.safeTitle) return null;

  return createMistakePatternRevisionNode(
    schoolId,
    studentId,
    `Mistake: ${pattern.safeTitle}`,
    pattern.learnerSafeSummary || 'Mistake pattern revision',
    { status: 'learner_created_visible' },
  );
}

export function mapMistakePatternToRepairEdge(
  schoolId: string,
  studentId: string,
  mistakeNodeId: string,
  repairNodeId: string,
): Phase3RevisionEdge {
  return createRevisionEdge(
    schoolId,
    studentId,
    'repairs_mistake',
    mistakeNodeId,
    repairNodeId,
    [],
    ['mistake_repair_connection'],
  );
}

export function mapMistakePatternToDueRevisit(
  schoolId: string,
  studentId: string,
  node: Phase3RevisionNode,
  pattern: MistakePatternInput,
): Phase3RevisionDueItem {
  return deriveDueFromMistakePattern(
    schoolId,
    studentId,
    node.nodeId,
    node.safeTitle,
    node.safeSummary,
    pattern.occurrenceCount > 1,
    pattern.isRecent === true,
    pattern.objectiveId,
    pattern.topicId,
  );
}
