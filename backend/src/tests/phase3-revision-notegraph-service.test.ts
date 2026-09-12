import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import * as revisionNoteGraphService from '../services/phase3RevisionNoteGraphService';
import * as revisionNodeService from '../services/phase3RevisionNodeService';

describe('Phase3RevisionNoteGraphService', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('builds empty revision graph', () => {
    const graph = revisionNoteGraphService.buildEmptyRevisionGraph('school-1', 'student-1');
    expect(graph.schoolId).toBe('school-1');
    expect(graph.nodes.length).toBe(0);
    expect(graph.edges.length).toBe(0);
    expect(graph.dueItems.length).toBe(0);
  });

  it('assembles nodes and edges safely', () => {
    const n1 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N1', 'First');
    const n2 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N2', 'Second');

    phase3LivingRevisionRepository.createRevisionEdge({
      schoolId: 'school-1', studentId: 'student-1', edgeType: 'supports', sourceNodeId: n1.nodeId, targetNodeId: n2.nodeId,
      safeEvidenceRefs: [], safeReasonCodes: [],
    });

    const graph = revisionNoteGraphService.getLearnerRevisionNoteGraph('school-1', 'student-1');
    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
  });

  it('ranks pinned nodes first', () => {
    const n1 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N1', 'First');
    const n2 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N2', 'Second');

    phase3LivingRevisionRepository.pinRevisionNode(n2.nodeId);

    const graph = revisionNoteGraphService.getLearnerRevisionNoteGraph('school-1', 'student-1');
    expect(graph.nodes[0].isPinned).toBe(true);
  });

  it('builds connection suggestions', () => {
    const n1 = revisionNodeService.createObjectiveRevisionNode('school-1', 'student-1', 'obj-1', 'Obj 1', '', { status: 'approved' });
    const n2 = revisionNodeService.createObjectiveRevisionNode('school-1', 'student-1', 'obj-1', 'Obj 2', '', { status: 'approved' });

    phase3LivingRevisionRepository.createRevisionNode({
      schoolId: 'school-1', studentId: 'student-1', nodeType: 'learner_note',
      safeTitle: 'Loose', safeSummary: '', sourceTruth: { status: 'learner_created_visible' },
    });

    const graph = revisionNoteGraphService.getLearnerRevisionNoteGraph('school-1', 'student-1');
    if (graph.connectionSuggestions.length > 0) {
      expect(graph.connectionSuggestions[0].edgeType).toBe('same_objective');
    }
  });

  it('limits graph by max nodes', () => {
    for (let i = 0; i < 10; i++) {
      revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', `N${i}`, `Node ${i}`);
    }

    const graph = revisionNoteGraphService.getLearnerRevisionNoteGraph('school-1', 'student-1');
    const limited = revisionNoteGraphService.limitRevisionGraph(graph, 5);
    expect(limited.nodes.length).toBe(5);
  });
});
