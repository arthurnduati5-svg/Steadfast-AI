import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import * as revisionNodeService from '../services/phase3RevisionNodeService';

describe('Phase3LivingRevisionSourceTruthBoundary', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('creates source-required placeholder when source is missing', () => {
    const node = revisionNodeService.createSourceRequiredPlaceholderNode('school-1', 'student-1', 'Missing', 'Source needed');
    expect(node.nodeType).toBe('source_required_placeholder');
    expect(node.sourceTruth.status).toBe('source_required');
  });

  it('does not create actionable node from non-actionable source truth', () => {
    const node = revisionNodeService.createSourceRequiredPlaceholderNode('school-1', 'student-1', 'Gap', 'Content gap');
    expect(node.status).not.toBe('due_for_review');
    expect(node.nodeType).toBe('source_required_placeholder');
  });

  it('returns learner-safe message for source required', () => {
    const summary = revisionNodeService.buildLearnerSafeNodeSummary('source_required_placeholder', '');
    expect(summary).toContain('approved source');
    expect(summary).not.toContain('answer');
    expect(summary).not.toContain('solution');
  });
});
