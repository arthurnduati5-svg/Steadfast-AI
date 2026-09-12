import {
  Phase3RevisionLearnerView,
  Phase3RevisionNoteGraph,
  Phase3RevisionNode,
  Phase3RevisionEdge,
  Phase3RevisionDueItem,
  Phase3RevisionConnectionSuggestion,
  Phase3RevisionAction,
} from '../contracts/phase3LivingRevisionContracts';

export function buildLearnerRevisionView(
  schoolId: string,
  studentId: string,
  nodes: Phase3RevisionNode[],
  dueItems: Phase3RevisionDueItem[],
): Phase3RevisionLearnerView {
  const now = new Date().toISOString();
  const activeDue = dueItems.filter((d) => !d.isCompleted);
  return {
    schoolId,
    studentId,
    generatedAt: now,
    safeHeadline: activeDue.length > 0
      ? `You have ${activeDue.length} revision item${activeDue.length !== 1 ? 's' : ''} to revisit.`
      : 'Your revision map is ready.',
    safeSummary: `${nodes.length} revision node${nodes.length !== 1 ? 's' : ''}, ${activeDue.length} item${activeDue.length !== 1 ? 's' : ''} due.`,
    nodes,
    edges: [],
    dueItems: activeDue,
    connectionSuggestions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: [],
  };
}

export function buildLearnerRevisionGraphView(graph: Phase3RevisionNoteGraph): Phase3RevisionLearnerView {
  const safeHeadline = buildLearnerSafeHeadline(graph);
  const safeSummary = buildLearnerSafeSummary(graph);

  return {
    schoolId: graph.schoolId,
    studentId: graph.studentId,
    generatedAt: graph.generatedAt,
    safeHeadline,
    safeSummary,
    nodes: graph.nodes,
    edges: graph.edges,
    dueItems: graph.dueItems,
    connectionSuggestions: graph.connectionSuggestions,
    safeEvidenceRefs: graph.safeEvidenceRefs,
    safeReasonCodes: graph.safeReasonCodes,
  };
}

export function buildLearnerRevisionNodeView(node: Phase3RevisionNode) {
  return {
    nodeId: node.nodeId,
    nodeType: node.nodeType,
    status: node.status,
    safeTitle: node.safeTitle,
    safeSummary: node.safeSummary,
    sourceTruth: node.sourceTruth,
    connectionCount: node.connectionCount,
    isPinned: node.isPinned,
    isArchived: node.isArchived,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
}

export function buildLearnerRevisionEdgeView(edge: Phase3RevisionEdge) {
  return {
    edgeId: edge.edgeId,
    edgeType: edge.edgeType,
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    createdAt: edge.createdAt,
  };
}

export function buildLearnerRevisionDueView(dueItem: Phase3RevisionDueItem) {
  return {
    dueItemId: dueItem.dueItemId,
    priority: dueItem.priority,
    signalType: dueItem.signalType,
    safeTitle: dueItem.safeTitle,
    safeSummary: dueItem.safeSummary,
    recommendedAction: dueItem.recommendedAction,
    isCompleted: dueItem.isCompleted,
    createdAt: dueItem.createdAt,
  };
}

export function buildRevisionConnectionSuggestionView(suggestion: Phase3RevisionConnectionSuggestion) {
  return {
    sourceNodeId: suggestion.sourceNodeId,
    targetNodeId: suggestion.targetNodeId,
    edgeType: suggestion.edgeType,
    reasonCode: suggestion.reasonCode,
    score: suggestion.score,
  };
}

export function buildEmptyRevisionView(
  schoolId: string,
  studentId: string,
): Phase3RevisionLearnerView {
  const now = new Date().toISOString();
  return {
    schoolId,
    studentId,
    generatedAt: now,
    safeHeadline: 'Your revision journey starts here.',
    safeSummary: 'No revision nodes yet. Start by saving a note or completing a learning session.',
    nodes: [],
    edges: [],
    dueItems: [],
    connectionSuggestions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: [],
  };
}

export function buildLearnerDueRevisionView(
  schoolId: string,
  studentId: string,
  dueItems: Phase3RevisionDueItem[],
) {
  const activeDue = dueItems.filter((d) => !d.isCompleted);
  return {
    schoolId,
    studentId,
    generatedAt: new Date().toISOString(),
    dueItems: activeDue.map((d) => buildLearnerRevisionDueView(d)),
    totalDue: activeDue.length,
  };
}

export function buildLearnerRevisionActionView(node: Phase3RevisionNode): Phase3RevisionAction[] {
  const actions: Phase3RevisionAction[] = ['open_revision_node'];
  if (node.sourceTruth.status === 'source_required' || node.sourceTruth.status === 'content_gap') {
    return ['ask_teacher_for_source'];
  }
  if (node.status === 'needs_teacher_support' || node.sourceTruth.status === 'blocked') {
    return ['ask_teacher_for_help'];
  }
  if (node.nodeType === 'mistake_pattern_anchor' || node.nodeType === 'mistake_pattern_repair') {
    actions.push('review_mistake_pattern');
  }
  if (node.nodeType === 'weak_topic_anchor' || node.nodeType === 'weak_topic_revisit') {
    actions.push('review_weak_topic');
  }
  if (node.nodeType === 'study_plan_anchor' || node.nodeType === 'study_plan_revisit') {
    actions.push('open_study_plan');
  }
  if (node.status === 'due_for_review') {
    actions.push('start_recall_check');
  }
  actions.push('no_action_needed');
  return actions;
}

export function buildBlockedRevisionNotice(
  schoolId: string,
  studentId: string,
  reason: string,
): Phase3RevisionLearnerView {
  const now = new Date().toISOString();
  return {
    schoolId,
    studentId,
    generatedAt: now,
    safeHeadline: 'Some revision items are not yet available.',
    safeSummary: reason,
    nodes: [],
    edges: [],
    dueItems: [],
    connectionSuggestions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['blocked'],
  };
}

export function buildSourceRequiredRevisionNotice(
  schoolId: string,
  studentId: string,
): Phase3RevisionLearnerView {
  return buildBlockedRevisionNotice(
    schoolId,
    studentId,
    'This revision item needs an approved source or teacher confirmation before you continue.',
  );
}

export function buildTeacherSupportRevisionNotice(
  schoolId: string,
  studentId: string,
): Phase3RevisionLearnerView {
  return buildBlockedRevisionNotice(
    schoolId,
    studentId,
    'Your teacher can help confirm this revision path.',
  );
}

function buildLearnerSafeHeadline(graph: Phase3RevisionNoteGraph): string {
  if (graph.nodes.length === 0) {
    return 'Your revision journey starts here.';
  }
  if (graph.dueItems.length > 0) {
    return `You have ${graph.dueItems.length} revision item${graph.dueItems.length !== 1 ? 's' : ''} to revisit.`;
  }
  return `Your revision map has ${graph.nodes.length} node${graph.nodes.length !== 1 ? 's' : ''}.`;
}

function buildLearnerSafeSummary(graph: Phase3RevisionNoteGraph): string {
  const parts: string[] = [];
  if (graph.nodes.length > 0) {
    parts.push(`${graph.nodes.length} revision note${graph.nodes.length !== 1 ? 's' : ''}`);
  }
  if (graph.edges.length > 0) {
    parts.push(`${graph.edges.length} connection${graph.edges.length !== 1 ? 's' : ''}`);
  }
  const activeDue = graph.dueItems.filter((d) => !d.isCompleted).length;
  if (activeDue > 0) {
    parts.push(`${activeDue} item${activeDue !== 1 ? 's' : ''} due for review`);
  }
  if (parts.length === 0) return 'Your revision graph is ready.';
  return parts.join(', ') + '.';
}
