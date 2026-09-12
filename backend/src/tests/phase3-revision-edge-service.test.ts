import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import * as revisionEdgeService from '../services/phase3RevisionEdgeService';
import * as revisionNodeService from '../services/phase3RevisionNodeService';

describe('Phase3RevisionEdgeService', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  function createTwoNodes(schoolId = 'school-1', studentId = 'student-1') {
    const n1 = revisionNodeService.createLearnerRevisionNode(schoolId, studentId, 'Node 1', 'First');
    const n2 = revisionNodeService.createLearnerRevisionNode(schoolId, studentId, 'Node 2', 'Second');
    return { n1, n2 };
  }

  it('creates revision edge between two nodes', () => {
    const { n1, n2 } = createTwoNodes();
    const edge = revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    expect(edge.edgeId).toBeTruthy();
    expect(edge.edgeType).toBe('supports');
  });

  it('denies cross-school edge', () => {
    const n1 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N1', 'First node');
    const n2 = revisionNodeService.createLearnerRevisionNode('school-2', 'student-1', 'N2', 'Second node');
    expect(() => {
      revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    }).toThrow('Cross-school');
  });

  it('denies cross-learner edge', () => {
    const n1 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N1', 'First node');
    const n2 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-2', 'N2', 'Second node');
    expect(() => {
      revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    }).toThrow('Cross-learner');
  });

  it('connects nodes by objective', () => {
    const { n1, n2 } = createTwoNodes();
    const edge = revisionEdgeService.connectNodesByObjective('school-1', 'student-1', n1.nodeId, n2.nodeId);
    expect(edge.edgeType).toBe('same_objective');
  });

  it('connects nodes by topic', () => {
    const { n1, n2 } = createTwoNodes();
    const edge = revisionEdgeService.connectNodesByTopic('school-1', 'student-1', n1.nodeId, n2.nodeId);
    expect(edge.edgeType).toBe('same_topic');
  });

  it('connects mistake to repair node', () => {
    const { n1, n2 } = createTwoNodes();
    const edge = revisionEdgeService.connectMistakeToRepairNode('school-1', 'student-1', n1.nodeId, n2.nodeId);
    expect(edge.edgeType).toBe('repairs_mistake');
  });

  it('lists node connections', () => {
    const { n1, n2 } = createTwoNodes();
    revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    const connections = revisionEdgeService.listNodeConnections(n1.nodeId);
    expect(connections.length).toBe(1);
  });

  it('removes revision edge', () => {
    const { n1, n2 } = createTwoNodes();
    const edge = revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    const removed = revisionEdgeService.removeRevisionEdge(edge.edgeId);
    expect(removed).toBe(true);
  });

  it('dedupes edges', () => {
    const { n1, n2 } = createTwoNodes();
    const e1 = revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    const edges = [e1, e1];
    const deduped = revisionEdgeService.dedupeRevisionEdges(edges);
    expect(deduped.length).toBe(1);
  });

  it('ranks connections by type priority', () => {
    const { n1, n2 } = createTwoNodes();
    const n3 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N3', 'Third node');
    const e1 = revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    const e2 = revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'repairs_mistake', n1.nodeId, n3.nodeId);
    const ranked = revisionEdgeService.rankRevisionConnections([e1, e2]);
    expect(ranked[0].edgeType).toBe('repairs_mistake');
  });
});
