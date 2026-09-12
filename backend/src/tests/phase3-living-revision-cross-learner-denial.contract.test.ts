import { describe, it, expect, beforeEach } from 'vitest';
import * as revisionEdgeService from '../services/phase3RevisionEdgeService';
import * as revisionNodeService from '../services/phase3RevisionNodeService';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';

describe('Phase3LivingRevisionCrossLearnerDenial', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('denies cross-learner edge creation', () => {
    const n1 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N1', 'First node');
    const n2 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-2', 'N2', 'Second node');
    expect(() => {
      revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    }).toThrow('Cross-learner');
  });

  it('learners only see own nodes', () => {
    revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'S1 Note', 'Student 1 note');
    revisionNodeService.createLearnerRevisionNode('school-1', 'student-2', 'S2 Note', 'Student 2 note');
    const nodes1 = phase3LivingRevisionRepository.listRevisionNodesForLearner('school-1', 'student-1');
    expect(nodes1.length).toBe(1);
    expect(nodes1[0].studentId).toBe('student-1');
  });
});
