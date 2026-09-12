import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import {
  loadMistakePatternsForRevision,
  mapMistakePatternToRepairEdge,
} from '../services/phase3RevisionMistakePatternAdapterService';
import * as revisionNodeService from '../services/phase3RevisionNodeService';

describe('Phase3RevisionMistakePatternAdapterService', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('loads mistake patterns and creates repair nodes safely', () => {
    const result = loadMistakePatternsForRevision('school-1', 'student-1', [
      { patternId: 'p1', patternType: 'recall_gap', safeTitle: 'Forgetting formulas', learnerSafeSummary: 'Need to revisit', occurrenceCount: 3, isRecent: true },
    ]);
    expect(result.nodes.length).toBe(1);
    expect(result.dueItems.length).toBe(1);
    expect(result.dueItems[0].priority).toBe('urgent');
    expect(result.nodes[0]).not.toHaveProperty('rawChat');
    expect(result.nodes[0]).not.toHaveProperty('answerKey');
  });

  it('maps mistake to repair edge', () => {
    const mistake = revisionNodeService.createMistakePatternRevisionNode('school-1', 'student-1', 'Mistake', 'Error', { status: 'learner_created_visible' });
    const repair = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Repair note', 'Fixed it');
    const edge = mapMistakePatternToRepairEdge('school-1', 'student-1', mistake.nodeId, repair.nodeId);
    expect(edge.edgeType).toBe('repairs_mistake');
  });
});
