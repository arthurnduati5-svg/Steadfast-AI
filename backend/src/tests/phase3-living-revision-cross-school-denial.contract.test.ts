import { describe, it, expect, beforeEach } from 'vitest';
import * as revisionEdgeService from '../services/phase3RevisionEdgeService';
import * as revisionNodeService from '../services/phase3RevisionNodeService';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';

describe('Phase3LivingRevisionCrossSchoolDenial', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('denies cross-school edge creation', () => {
    const n1 = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N1', 'First node');
    const n2 = revisionNodeService.createLearnerRevisionNode('school-2', 'student-1', 'N2', 'Second node');
    expect(() => {
      revisionEdgeService.createRevisionEdge('school-1', 'student-1', 'supports', n1.nodeId, n2.nodeId);
    }).toThrow('Cross-school');
  });

  it('ensures repository filters by schoolId', () => {
    revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'N1', 'First node');
    revisionNodeService.createLearnerRevisionNode('school-2', 'student-1', 'N2', 'Second node');
    const nodesSchool1 = phase3LivingRevisionRepository.listRevisionNodesForLearner('school-1', 'student-1');
    expect(nodesSchool1.length).toBe(1);
  });
});
