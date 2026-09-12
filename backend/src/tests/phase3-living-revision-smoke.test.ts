import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import * as revisionNodeService from '../services/phase3RevisionNodeService';
import * as revisionEdgeService from '../services/phase3RevisionEdgeService';
import * as revisionNoteGraphService from '../services/phase3RevisionNoteGraphService';

describe('Phase3LivingRevisionSmoke', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('completes a learner lifecycle: create node → create edge → view graph', () => {
    const n1 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'My first revision note', 'A summary of what I learned');
    expect(n1.nodeId).toBeTruthy();

    const n2 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'My second note', 'Connected idea');
    expect(n2.nodeId).toBeTruthy();

    const edge = revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    expect(edge.edgeId).toBeTruthy();

    const graph = revisionNoteGraphService.getLearnerRevisionNoteGraph('school-1', 'student-1');
    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);

    const pinned = revisionNodeService.pinRevisionNode(n1.nodeId);
    expect(pinned!.isPinned).toBe(true);

    const archived = revisionNodeService.archiveRevisionNode(n2.nodeId);
    expect(archived!.isArchived).toBe(true);

    const graphWithoutArchived = revisionNoteGraphService.getLearnerRevisionNoteGraph('school-1', 'student-1');
    expect(graphWithoutArchived.nodes.length).toBe(1);
  });
});
