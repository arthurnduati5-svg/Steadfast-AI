import {
  Phase3RevisionTeacherOverview,
  Phase3RevisionTeacherLearnerRow,
  Phase3RevisionTeacherTopicRow,
  Phase3RevisionNode,
  Phase3RevisionDueItem,
  Phase3RevisionSafeEvidenceRef,
} from '../contracts/phase3LivingRevisionContracts';
import { phase3LivingRevisionRepository } from './phase3LivingRevisionRepository';

export function getTeacherRevisionOverview(
  schoolId: string,
  teacherId: string,
  classId?: string,
  subjectId?: string,
): Phase3RevisionTeacherOverview {
  const allNodes = phase3LivingRevisionRepository.listAllNodesForSchool(schoolId);
  const allDueItems = phase3LivingRevisionRepository.listAllDueItemsForSchool(schoolId);
  const allEdges = phase3LivingRevisionRepository.listAllEdgesForSchool(schoolId);

  const learnerMap = new Map<string, Phase3RevisionNode[]>();
  for (const node of allNodes) {
    if (node.studentId) {
      const existing = learnerMap.get(node.studentId) || [];
      existing.push(node);
      learnerMap.set(node.studentId, existing);
    }
  }

  const topicMap = new Map<string, { nodes: Phase3RevisionNode[]; learners: Set<string> }>();
  for (const node of allNodes) {
    if (node.topicId) {
      const existing = topicMap.get(node.topicId) || { nodes: [], learners: new Set<string>() };
      existing.nodes.push(node);
      if (node.studentId) existing.learners.add(node.studentId);
      topicMap.set(node.topicId, existing);
    }
  }

  const learnerRows: Phase3RevisionTeacherLearnerRow[] = [];
  for (const [studentId, nodes] of learnerMap) {
    const dueItems = allDueItems.filter(
      (d) => d.studentId === studentId && !d.isCompleted,
    );
    const sourceRequired = nodes.filter(
      (n) => n.sourceTruth.status === 'source_required' || n.sourceTruth.status === 'content_gap',
    );
    const teacherSupport = nodes.filter(
      (n) => n.status === 'needs_teacher_support' || n.sourceTruth.status === 'blocked',
    );
    const mistakeRepair = nodes.filter(
      (n) => n.nodeType === 'mistake_pattern_anchor',
    );
    const safeEvidenceRefs = extractSafeEvidenceRefs(nodes);

    learnerRows.push({
      studentId,
      revisionNodeCount: nodes.length,
      dueRevisionCount: dueItems.length,
      sourceRequiredCount: sourceRequired.length,
      teacherSupportNeeded: teacherSupport.length,
      mistakeRepairCount: mistakeRepair.length,
      safePatternSummary: buildLearnerPatternSummary(nodes, dueItems),
      recommendedTeacherAction: buildTeacherAction(nodes, dueItems),
      safeEvidenceRefs,
    });
  }

  const topicRows: Phase3RevisionTeacherTopicRow[] = [];
  for (const [topicId, data] of topicMap) {
    const nodes = data.nodes;
    const objectiveIds = [...new Set(nodes.map((n) => n.objectiveId).filter(Boolean) as string[])];
    const dueCount = allDueItems.filter(
      (d) => d.topicId === topicId && !d.isCompleted,
    ).length;
    const sourceRequired = nodes.filter(
      (n) => n.sourceTruth.status === 'source_required',
    ).length;
    const teacherSupport = nodes.filter(
      (n) => n.status === 'needs_teacher_support',
    ).length;
    const mistakeRepair = nodes.filter(
      (n) => n.nodeType === 'mistake_pattern_anchor',
    ).length;
    const safeEvidenceRefs = extractSafeEvidenceRefs(nodes);

    topicRows.push({
      topicId,
      objectiveIds,
      learnersAffectedCount: data.learners.size,
      revisionNodeCount: nodes.length,
      dueRevisionCount: dueCount,
      sourceRequiredCount: sourceRequired,
      teacherSupportCount: teacherSupport,
      mistakeRepairCount: mistakeRepair,
      safePatternSummary: `Topic with ${nodes.length} revision nodes across ${data.learners.size} learners.`,
      recommendedTeacherAction: sourceRequired > 0 ? 'Review source gaps' : teacherSupport > 0 ? 'Address teacher support requests' : 'Monitor progress',
      safeEvidenceRefs,
    });
  }

  const totalDue = allDueItems.filter((d) => !d.isCompleted).length;
  const totalSourceRequired = allNodes.filter(
    (n) => n.sourceTruth.status === 'source_required' || n.sourceTruth.status === 'content_gap',
  ).length;
  const totalTeacherSupport = allNodes.filter(
    (n) => n.status === 'needs_teacher_support' || n.sourceTruth.status === 'blocked',
  ).length;
  const totalMistakeRepair = allNodes.filter(
    (n) => n.nodeType === 'mistake_pattern_anchor',
  ).length;

  const recommendedTeacherActions: string[] = [];
  if (totalSourceRequired > 0) recommendedTeacherActions.push(`${totalSourceRequired} revision items need approved sources.`);
  if (totalTeacherSupport > 0) recommendedTeacherActions.push(`${totalTeacherSupport} revision items need teacher support.`);
  if (totalDue > 5) recommendedTeacherActions.push(`${totalDue} items are due for revision across all learners.`);
  if (totalMistakeRepair > 0) recommendedTeacherActions.push(`${totalMistakeRepair} mistake patterns are tracked for repair.`);
  if (recommendedTeacherActions.length === 0) recommendedTeacherActions.push('No revision support actions needed at this time.');

  return {
    schoolId,
    teacherId,
    classId,
    subjectId,
    generatedAt: new Date().toISOString(),
    totalLearnersWithRevisionNodes: learnerMap.size,
    totalDueRevisionItems: totalDue,
    totalSourceRequired,
    totalTeacherSupportNeeded: totalTeacherSupport,
    totalMistakeRepairNodes: totalMistakeRepair,
    learnerRows,
    topicRows,
    safeSummary: `${learnerMap.size} learners have revision nodes. ${totalDue} items due. ${totalSourceRequired} source gaps.`,
    recommendedTeacherActions,
  };
}

export function getClassRevisionOverview(
  schoolId: string,
  teacherId: string,
  classId: string,
): Phase3RevisionTeacherOverview {
  return getTeacherRevisionOverview(schoolId, teacherId, classId);
}

export function getLearnerRevisionTeacherSummary(
  schoolId: string,
  teacherId: string,
  studentId: string,
): Phase3RevisionTeacherLearnerRow | null {
  const nodes = phase3LivingRevisionRepository.listRevisionNodesForLearner(schoolId, studentId);
  if (nodes.length === 0) return null;

  const allDueItems = phase3LivingRevisionRepository.listAllDueItemsForSchool(schoolId);
  const dueItems = allDueItems.filter((d) => d.studentId === studentId && !d.isCompleted);
  const sourceRequired = nodes.filter(
    (n) => n.sourceTruth.status === 'source_required' || n.sourceTruth.status === 'content_gap',
  );
  const teacherSupport = nodes.filter(
    (n) => n.status === 'needs_teacher_support' || n.sourceTruth.status === 'blocked',
  );
  const mistakeRepair = nodes.filter((n) => n.nodeType === 'mistake_pattern_anchor');
  const safeEvidenceRefs = extractSafeEvidenceRefs(nodes);

  return {
    studentId,
    revisionNodeCount: nodes.length,
    dueRevisionCount: dueItems.length,
    sourceRequiredCount: sourceRequired.length,
    teacherSupportNeeded: teacherSupport.length,
    mistakeRepairCount: mistakeRepair.length,
    safePatternSummary: buildLearnerPatternSummary(nodes, dueItems),
    recommendedTeacherAction: buildTeacherAction(nodes, dueItems),
    safeEvidenceRefs,
  };
}

export function getRevisionDueSupportQueue(
  schoolId: string,
  teacherId: string,
): Phase3RevisionDueItem[] {
  const allDueItems = phase3LivingRevisionRepository.listAllDueItemsForSchool(schoolId);
  return allDueItems
    .filter((d) => !d.isCompleted)
    .sort((a, b) => {
      const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
    });
}

export function getRevisionSourceRequiredQueue(
  schoolId: string,
  teacherId: string,
): Phase3RevisionNode[] {
  const allNodes = phase3LivingRevisionRepository.listAllNodesForSchool(schoolId);
  return allNodes.filter(
    (n) => n.sourceTruth.status === 'source_required' || n.sourceTruth.status === 'content_gap',
  );
}

export function getTeacherSupportRevisionQueue(
  schoolId: string,
  teacherId: string,
): Phase3RevisionNode[] {
  const allNodes = phase3LivingRevisionRepository.listAllNodesForSchool(schoolId);
  return allNodes.filter(
    (n) => n.status === 'needs_teacher_support' || n.sourceTruth.status === 'blocked',
  );
}

export function getRevisionTopicSummary(
  schoolId: string,
  teacherId: string,
  topicId: string,
): Phase3RevisionTeacherTopicRow | null {
  const overview = getTeacherRevisionOverview(schoolId, teacherId);
  return overview.topicRows.find((t) => t.topicId === topicId) || null;
}

export function getRevisionMistakeRepairSummary(
  schoolId: string,
  teacherId: string,
): Phase3RevisionNode[] {
  const allNodes = phase3LivingRevisionRepository.listAllNodesForSchool(schoolId);
  return allNodes.filter((n) => n.nodeType === 'mistake_pattern_anchor');
}

export function getTeacherRecommendedRevisionActions(
  schoolId: string,
  teacherId: string,
): string[] {
  const overview = getTeacherRevisionOverview(schoolId, teacherId);
  return overview.recommendedTeacherActions;
}

function buildLearnerPatternSummary(
  nodes: Phase3RevisionNode[],
  dueItems: Phase3RevisionDueItem[],
): string {
  const parts: string[] = [];
  if (nodes.length > 0) parts.push(`${nodes.length} revision nodes`);
  const activeDue = dueItems.filter((d) => !d.isCompleted).length;
  if (activeDue > 0) parts.push(`${activeDue} due`);
  const sourceRequired = nodes.filter((n) => n.sourceTruth.status === 'source_required').length;
  if (sourceRequired > 0) parts.push(`${sourceRequired} source gaps`);
  return parts.length > 0 ? parts.join(', ') : 'No revision activity';
}

function buildTeacherAction(
  nodes: Phase3RevisionNode[],
  dueItems: Phase3RevisionDueItem[],
): string {
  const activeDue = dueItems.filter((d) => !d.isCompleted).length;
  if (activeDue > 0) return 'Review due revision items';
  const sourceRequired = nodes.filter((n) => n.sourceTruth.status === 'source_required').length;
  if (sourceRequired > 0) return 'Provide approved sources';
  return 'Monitor progress';
}

function extractSafeEvidenceRefs(nodes: Phase3RevisionNode[]): Phase3RevisionSafeEvidenceRef[] {
  const map = new Map<string, Phase3RevisionSafeEvidenceRef>();
  for (const n of nodes) {
    for (const ref of n.safeEvidenceRefs) {
      map.set(ref.evidenceId, ref);
    }
  }
  return Array.from(map.values());
}
