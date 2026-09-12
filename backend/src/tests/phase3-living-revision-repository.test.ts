import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import { Phase3RevisionNodeCreateInput, Phase3RevisionEdgeCreateInput } from '../contracts/phase3LivingRevisionContracts';

describe('Phase3LivingRevisionRepository', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  const sampleNode: Phase3RevisionNodeCreateInput = {
    schoolId: 'school-1',
    studentId: 'student-1',
    nodeType: 'learner_note',
    safeTitle: 'Test note',
    safeSummary: 'A test revision note',
    sourceTruth: { status: 'learner_created_visible' },
    safeReasonCodes: ['saved_by_learner'],
  };

  it('creates and retrieves revision node', () => {
    const node = phase3LivingRevisionRepository.createRevisionNode(sampleNode);
    expect(node.nodeId).toBeTruthy();
    expect(node.safeTitle).toBe('Test note');
    expect(node.schoolId).toBe('school-1');
    expect(node.studentId).toBe('student-1');
    expect(node.sourceTruth.status).toBe('learner_created_visible');

    const retrieved = phase3LivingRevisionRepository.getRevisionNode(node.nodeId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.nodeId).toBe(node.nodeId);
  });

  it('stores only safe metadata', () => {
    const node = phase3LivingRevisionRepository.createRevisionNode(sampleNode);
    expect(node).not.toHaveProperty('rawChat');
    expect(node).not.toHaveProperty('answerKey');
    expect(node).not.toHaveProperty('hiddenReasoning');
    expect(node).not.toHaveProperty('providerResponse');
  });

  it('lists nodes for learner', () => {
    phase3LivingRevisionRepository.createRevisionNode(sampleNode);
    phase3LivingRevisionRepository.createRevisionNode({ ...sampleNode, safeTitle: 'Note 2' });

    const nodes = phase3LivingRevisionRepository.listRevisionNodesForLearner('school-1', 'student-1');
    expect(nodes.length).toBe(2);
  });

  it('lists nodes by objective', () => {
    phase3LivingRevisionRepository.createRevisionNode({ ...sampleNode, objectiveId: 'obj-1' });
    phase3LivingRevisionRepository.createRevisionNode({ ...sampleNode, objectiveId: 'obj-2' });

    const nodes = phase3LivingRevisionRepository.listRevisionNodesByObjective('school-1', 'student-1', 'obj-1');
    expect(nodes.length).toBe(1);
  });

  it('pins and archives nodes', () => {
    const node = phase3LivingRevisionRepository.createRevisionNode(sampleNode);

    const pinned = phase3LivingRevisionRepository.pinRevisionNode(node.nodeId);
    expect(pinned!.isPinned).toBe(true);

    const archived = phase3LivingRevisionRepository.archiveRevisionNode(node.nodeId);
    expect(archived!.isArchived).toBe(true);
  });

  it('creates and retrieves edges', () => {
    const n1 = phase3LivingRevisionRepository.createRevisionNode(sampleNode);
    const n2 = phase3LivingRevisionRepository.createRevisionNode({ ...sampleNode, safeTitle: 'Node 2' });

    const edgeInput: Phase3RevisionEdgeCreateInput = {
      schoolId: 'school-1',
      studentId: 'student-1',
      edgeType: 'supports',
      sourceNodeId: n1.nodeId,
      targetNodeId: n2.nodeId,
    };

    const edge = phase3LivingRevisionRepository.createRevisionEdge(edgeInput);
    expect(edge.edgeId).toBeTruthy();
    expect(edge.edgeType).toBe('supports');

    const retrieved = phase3LivingRevisionRepository.getRevisionEdge(edge.edgeId);
    expect(retrieved).not.toBeNull();
  });

  it('lists edges for node', () => {
    const n1 = phase3LivingRevisionRepository.createRevisionNode(sampleNode);
    const n2 = phase3LivingRevisionRepository.createRevisionNode({ ...sampleNode, safeTitle: 'Node 2' });

    phase3LivingRevisionRepository.createRevisionEdge({
      schoolId: 'school-1', studentId: 'student-1', edgeType: 'supports', sourceNodeId: n1.nodeId, targetNodeId: n2.nodeId,
    });

    const edges = phase3LivingRevisionRepository.listRevisionEdgesForNode(n1.nodeId);
    expect(edges.length).toBe(1);
  });

  it('deletes edges', () => {
    const n1 = phase3LivingRevisionRepository.createRevisionNode(sampleNode);
    const n2 = phase3LivingRevisionRepository.createRevisionNode({ ...sampleNode, safeTitle: 'Node 2' });

    const edge = phase3LivingRevisionRepository.createRevisionEdge({
      schoolId: 'school-1', studentId: 'student-1', edgeType: 'supports', sourceNodeId: n1.nodeId, targetNodeId: n2.nodeId,
    });

    const deleted = phase3LivingRevisionRepository.deleteRevisionEdge(edge.edgeId);
    expect(deleted).toBe(true);
    expect(phase3LivingRevisionRepository.getRevisionEdge(edge.edgeId)).toBeNull();
  });

  it('manages due items', () => {
    const n1 = phase3LivingRevisionRepository.createRevisionNode(sampleNode);

    const due = phase3LivingRevisionRepository.upsertRevisionDueItem({
      schoolId: 'school-1', studentId: 'student-1', nodeId: n1.nodeId,
      priority: 'high', signalType: 'created_from_growth_page',
      safeTitle: 'Due test', safeSummary: 'Test due',
      recommendedAction: 'start_recall_check',
      sourceTruthStatus: 'approved',
      safeEvidenceRefs: [], safeReasonCodes: ['test'],
    });

    expect(due.dueItemId).toBeTruthy();
    expect(due.isCompleted).toBe(false);

    const completed = phase3LivingRevisionRepository.markRevisionDueItemCompleted(due.dueItemId);
    expect(completed!.isCompleted).toBe(true);
  });

  it('upserts due items by node', () => {
    const n1 = phase3LivingRevisionRepository.createRevisionNode(sampleNode);

    const due1 = phase3LivingRevisionRepository.upsertRevisionDueItem({
      schoolId: 'school-1', studentId: 'student-1', nodeId: n1.nodeId,
      priority: 'medium', signalType: 'due_for_recall',
      safeTitle: 'Due', safeSummary: 'Test',
      recommendedAction: 'start_recall_check',
      sourceTruthStatus: 'approved',
      safeEvidenceRefs: [], safeReasonCodes: [],
    });

    const due2 = phase3LivingRevisionRepository.upsertRevisionDueItem({
      schoolId: 'school-1', studentId: 'student-1', nodeId: n1.nodeId,
      priority: 'high', signalType: 'due_for_recall',
      safeTitle: 'Due updated', safeSummary: 'Test',
      recommendedAction: 'start_recall_check',
      sourceTruthStatus: 'approved',
      safeEvidenceRefs: [], safeReasonCodes: [],
    });

    expect(due2.dueItemId).toBe(due1.dueItemId);
    expect(due2.priority).toBe('high');
  });

  it('records audit events', () => {
    phase3LivingRevisionRepository.recordRevisionAuditEvent({
      eventId: 'e1', schoolId: 'school-1', actorId: 'student-1', actorRole: 'student',
      eventType: 'revision_node_created', safeReasonCodes: [], safeEvidenceRefs: [], createdAt: new Date().toISOString(),
    });

    const events = phase3LivingRevisionRepository.listRevisionAuditEvents('school-1');
    expect(events.length).toBe(1);
  });

  it('resets repository for tests', () => {
    phase3LivingRevisionRepository.createRevisionNode(sampleNode);
    expect(phase3LivingRevisionRepository.listRevisionNodesForLearner('school-1', 'student-1').length).toBe(1);

    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
    expect(phase3LivingRevisionRepository.listRevisionNodesForLearner('school-1', 'student-1').length).toBe(0);
  });
});
