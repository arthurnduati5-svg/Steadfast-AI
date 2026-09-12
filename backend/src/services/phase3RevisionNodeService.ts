import {
  Phase3RevisionNode,
  Phase3RevisionNodeCreateInput,
  Phase3RevisionNodeType,
  Phase3RevisionSourceTruth,
  Phase3RevisionSafeEvidenceRef,
  Phase3RevisionNodeStatus,
} from '../contracts/phase3LivingRevisionContracts';
import {
  phase3LivingRevisionRepository,
  phase3LivingRevisionDurableRepository,
} from './phase3LivingRevisionRepository';
import { validateRevisionNodeCreateInput } from '../lib/phase3LivingRevisionValidation';

export function createLearnerRevisionNode(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  learnerVisibleText?: string,
): Phase3RevisionNode {
  const input: Phase3RevisionNodeCreateInput = {
    schoolId,
    studentId,
    nodeType: 'learner_note',
    safeTitle,
    safeSummary,
    learnerVisibleText,
    sourceTruth: { status: 'learner_created_visible' },
    safeReasonCodes: ['saved_by_learner'],
  };
  const validationErr = validateRevisionNodeCreateInput(input);
  if (validationErr) {
    throw new Error(validationErr.message);
  }
  return phase3LivingRevisionRepository.createRevisionNode(input);
}

export function createObjectiveRevisionNode(
  schoolId: string,
  studentId: string,
  objectiveId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  const input: Phase3RevisionNodeCreateInput = {
    schoolId,
    studentId,
    nodeType: 'objective_anchor',
    objectiveId,
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_objective'],
  };
  return phase3LivingRevisionRepository.createRevisionNode(input);
}

export function createDailyCheckRevisionNode(
  schoolId: string,
  studentId: string,
  objectiveId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  const input: Phase3RevisionNodeCreateInput = {
    schoolId,
    studentId,
    nodeType: 'daily_check_anchor',
    objectiveId,
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_daily_check'],
  };
  return phase3LivingRevisionRepository.createRevisionNode(input);
}

export function createStudyPlanRevisionNode(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  const input: Phase3RevisionNodeCreateInput = {
    schoolId,
    studentId,
    nodeType: 'study_plan_anchor',
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_study_plan'],
  };
  return phase3LivingRevisionRepository.createRevisionNode(input);
}

export function createGrowthPageRevisionNode(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  const input: Phase3RevisionNodeCreateInput = {
    schoolId,
    studentId,
    nodeType: 'growth_page_anchor',
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_growth_page'],
  };
  return phase3LivingRevisionRepository.createRevisionNode(input);
}

export function createMistakePatternRevisionNode(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  const input: Phase3RevisionNodeCreateInput = {
    schoolId,
    studentId,
    nodeType: 'mistake_pattern_anchor',
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_mistake_pattern'],
  };
  return phase3LivingRevisionRepository.createRevisionNode(input);
}

export function createWeakTopicRevisionNode(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  const input: Phase3RevisionNodeCreateInput = {
    schoolId,
    studentId,
    nodeType: 'weak_topic_anchor',
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_weak_topic'],
  };
  return phase3LivingRevisionRepository.createRevisionNode(input);
}

export function createSourceRequiredPlaceholderNode(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
): Phase3RevisionNode {
  const input: Phase3RevisionNodeCreateInput = {
    schoolId,
    studentId,
    nodeType: 'source_required_placeholder',
    safeTitle,
    safeSummary,
    sourceTruth: { status: 'source_required' },
    safeReasonCodes: ['source_required'],
  };
  return phase3LivingRevisionRepository.createRevisionNode(input);
}

export function createTeacherSupportPlaceholderNode(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
): Phase3RevisionNode {
  const input: Phase3RevisionNodeCreateInput = {
    schoolId,
    studentId,
    nodeType: 'teacher_support_placeholder',
    safeTitle,
    safeSummary,
    sourceTruth: { status: 'blocked' },
    safeReasonCodes: ['teacher_support_required'],
  };
  return phase3LivingRevisionRepository.createRevisionNode(input);
}

export function getRevisionNode(nodeId: string): Phase3RevisionNode | null {
  return phase3LivingRevisionRepository.getRevisionNode(nodeId);
}

export function listLearnerRevisionNodes(schoolId: string, studentId: string): Phase3RevisionNode[] {
  return phase3LivingRevisionRepository.listRevisionNodesForLearner(schoolId, studentId);
}

export function pinRevisionNode(nodeId: string): Phase3RevisionNode | null {
  return phase3LivingRevisionRepository.pinRevisionNode(nodeId);
}

export function archiveRevisionNode(nodeId: string): Phase3RevisionNode | null {
  return phase3LivingRevisionRepository.archiveRevisionNode(nodeId);
}

export function completeRevisionNode(nodeId: string): Phase3RevisionNode | null {
  return phase3LivingRevisionRepository.completeRevisionNode(nodeId);
}

export function snoozeRevisionNode(nodeId: string): Phase3RevisionNode | null {
  return phase3LivingRevisionRepository.snoozeRevisionNode(nodeId);
}

export function createRevisionNodeFromObjective(
  schoolId: string,
  studentId: string,
  objectiveId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  return createObjectiveRevisionNode(schoolId, studentId, objectiveId, safeTitle, safeSummary, sourceTruth);
}

export function createRevisionNodeFromDailyCheck(
  schoolId: string,
  studentId: string,
  objectiveId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  return createDailyCheckRevisionNode(schoolId, studentId, objectiveId, safeTitle, safeSummary, sourceTruth);
}

export function createRevisionNodeFromStudyPlan(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  return createStudyPlanRevisionNode(schoolId, studentId, safeTitle, safeSummary, sourceTruth);
}

export function createRevisionNodeFromGrowthPage(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  return createGrowthPageRevisionNode(schoolId, studentId, safeTitle, safeSummary, sourceTruth);
}

export function createRevisionNodeFromMistakePattern(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  return createMistakePatternRevisionNode(schoolId, studentId, safeTitle, safeSummary, sourceTruth);
}

export function createRevisionNodeFromWeakTopic(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Phase3RevisionNode {
  return createWeakTopicRevisionNode(schoolId, studentId, safeTitle, safeSummary, sourceTruth);
}

export function dedupeRevisionNodes(nodes: Phase3RevisionNode[]): Phase3RevisionNode[] {
  const seen = new Map<string, Phase3RevisionNode>();
  for (const node of nodes) {
    const key = `${node.schoolId}:${node.studentId}:${node.nodeType}:${node.objectiveId || node.topicId || node.safeTitle}`;
    if (!seen.has(key)) {
      seen.set(key, node);
    }
  }
  return Array.from(seen.values());
}

export function rankRevisionNodes(nodes: Phase3RevisionNode[]): Phase3RevisionNode[] {
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, blocked: 4 };
  return [...nodes].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 5;
    const pb = priorityOrder[b.priority] ?? 5;
    return pa - pb;
  });
}

export function buildRevisionNodeSafeSummary(node: Phase3RevisionNode): string {
  if (node.nodeType === 'source_required_placeholder' || node.nodeType === 'source_required_revision') {
    return 'This revision item needs an approved source or teacher confirmation before you continue.';
  }
  if (node.nodeType === 'teacher_support_placeholder' || node.nodeType === 'teacher_support_revision') {
    return 'Your teacher can help confirm this revision path.';
  }
  return node.safeSummary || 'Revision item ready for review.';
}

export function buildLearnerSafeNodeTitle(nodeType: Phase3RevisionNodeType, baseTitle: string): string {
  const prefixMap: Partial<Record<Phase3RevisionNodeType, string>> = {
    learner_note: 'Note',
    approved_source_anchor: 'Source',
    objective_anchor: 'Objective',
    daily_check_anchor: 'Check',
    study_plan_anchor: 'Study Plan',
    growth_page_anchor: 'Growth',
    mistake_pattern_anchor: 'Mistake',
    weak_topic_anchor: 'Topic',
    recall_prompt: 'Recall',
    teach_back_prompt: 'Teach Back',
    worked_step_summary: 'Step',
    concept_summary: 'Concept',
    source_required_placeholder: 'Source Needed',
    teacher_support_placeholder: 'Teacher Help',
  };
  const prefix = prefixMap[nodeType] || 'Revision';
  return `${prefix}: ${baseTitle}`;
}

export function buildLearnerSafeNodeSummary(nodeType: Phase3RevisionNodeType, baseSummary: string): string {
  if (nodeType === 'source_required_placeholder') {
    return 'This revision item needs an approved source before you continue.';
  }
  if (nodeType === 'teacher_support_placeholder') {
    return 'Your teacher can help confirm this part.';
  }
  return baseSummary;
}

// ─────────────────────────────────────────────────────────────
// R8-G.3A-D1C durable async production counterparts.
// Same validation/input-building as the sync legacy variants; the only
// ownership difference is the durable repository (PostgreSQL).
// Legacy sync exports above remain for explicit test compatibility.
// ─────────────────────────────────────────────────────────────

async function createNodeDurable(input: Phase3RevisionNodeCreateInput): Promise<Phase3RevisionNode> {
  const validationErr = validateRevisionNodeCreateInput(input);
  if (validationErr) {
    throw new Error(validationErr.message);
  }
  return phase3LivingRevisionDurableRepository.createRevisionNode(input);
}

export async function createRevisionNodeDurable(
  input: Phase3RevisionNodeCreateInput,
): Promise<Phase3RevisionNode> {
  return createNodeDurable(input);
}

export async function createLearnerRevisionNodeDurable(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  learnerVisibleText?: string,
): Promise<Phase3RevisionNode> {
  return createNodeDurable({
    schoolId,
    studentId,
    nodeType: 'learner_note',
    safeTitle,
    safeSummary,
    learnerVisibleText,
    sourceTruth: { status: 'learner_created_visible' },
    safeReasonCodes: ['saved_by_learner'],
  });
}

export async function createObjectiveRevisionNodeDurable(
  schoolId: string,
  studentId: string,
  objectiveId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Promise<Phase3RevisionNode> {
  return createNodeDurable({
    schoolId,
    studentId,
    nodeType: 'objective_anchor',
    objectiveId,
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_objective'],
  });
}

export async function createDailyCheckRevisionNodeDurable(
  schoolId: string,
  studentId: string,
  objectiveId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Promise<Phase3RevisionNode> {
  return createNodeDurable({
    schoolId,
    studentId,
    nodeType: 'daily_check_anchor',
    objectiveId,
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_daily_check'],
  });
}

export async function createStudyPlanRevisionNodeDurable(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Promise<Phase3RevisionNode> {
  return createNodeDurable({
    schoolId,
    studentId,
    nodeType: 'study_plan_anchor',
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_study_plan'],
  });
}

export async function createGrowthPageRevisionNodeDurable(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Promise<Phase3RevisionNode> {
  return createNodeDurable({
    schoolId,
    studentId,
    nodeType: 'growth_page_anchor',
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_growth_page'],
  });
}

export async function createMistakePatternRevisionNodeDurable(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Promise<Phase3RevisionNode> {
  return createNodeDurable({
    schoolId,
    studentId,
    nodeType: 'mistake_pattern_anchor',
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_mistake_pattern'],
  });
}

export async function createWeakTopicRevisionNodeDurable(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
  sourceTruth: Phase3RevisionSourceTruth,
): Promise<Phase3RevisionNode> {
  return createNodeDurable({
    schoolId,
    studentId,
    nodeType: 'weak_topic_anchor',
    safeTitle,
    safeSummary,
    sourceTruth,
    safeReasonCodes: ['created_from_weak_topic'],
  });
}

export async function createSourceRequiredPlaceholderNodeDurable(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
): Promise<Phase3RevisionNode> {
  return createNodeDurable({
    schoolId,
    studentId,
    nodeType: 'source_required_placeholder',
    safeTitle,
    safeSummary,
    sourceTruth: { status: 'source_required' },
    safeReasonCodes: ['source_required'],
  });
}

export async function createTeacherSupportPlaceholderNodeDurable(
  schoolId: string,
  studentId: string,
  safeTitle: string,
  safeSummary: string,
): Promise<Phase3RevisionNode> {
  return createNodeDurable({
    schoolId,
    studentId,
    nodeType: 'teacher_support_placeholder',
    safeTitle,
    safeSummary,
    sourceTruth: { status: 'blocked' },
    safeReasonCodes: ['teacher_support_required'],
  });
}

export async function getRevisionNodeDurable(
  nodeId: string,
  schoolId: string,
): Promise<Phase3RevisionNode | null> {
  return phase3LivingRevisionDurableRepository.getRevisionNode(nodeId, schoolId);
}

export async function listLearnerRevisionNodesDurable(
  schoolId: string,
  studentId: string,
): Promise<Phase3RevisionNode[]> {
  return phase3LivingRevisionDurableRepository.listRevisionNodesForLearner(schoolId, studentId);
}

export async function pinRevisionNodeDurable(
  nodeId: string,
  schoolId: string,
): Promise<Phase3RevisionNode | null> {
  return phase3LivingRevisionDurableRepository.pinRevisionNode(nodeId, schoolId);
}

export async function archiveRevisionNodeDurable(
  nodeId: string,
  schoolId: string,
): Promise<Phase3RevisionNode | null> {
  return phase3LivingRevisionDurableRepository.archiveRevisionNode(nodeId, schoolId);
}

export async function completeRevisionNodeDurable(
  nodeId: string,
  schoolId: string,
): Promise<Phase3RevisionNode | null> {
  return phase3LivingRevisionDurableRepository.completeRevisionNode(nodeId, schoolId);
}

export async function snoozeRevisionNodeDurable(
  nodeId: string,
  schoolId: string,
): Promise<Phase3RevisionNode | null> {
  return phase3LivingRevisionDurableRepository.snoozeRevisionNode(nodeId, schoolId);
}
