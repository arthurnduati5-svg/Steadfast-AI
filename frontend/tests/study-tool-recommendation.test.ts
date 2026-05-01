import { describe, expect, it } from 'vitest';
import type { RevisionItem } from '@/lib/types';
import {
  buildStudyToolRecommendation,
  classifyRevisionNoteShape,
  evaluateQuickCheckAnswer,
  evaluateTeachBackResponse,
} from '@/lib/study-tool-recommendation';

function buildItem(overrides: Partial<RevisionItem>): RevisionItem {
  return {
    id: 'item-1',
    title: 'Sample note',
    summary: 'Sample summary.',
    content: 'Sample content.',
    contentType: 'note',
    createdAt: new Date('2026-04-15T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-15T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

describe('study tool recommendation service', () => {
  it('prioritizes flashcards + recall sheet for definition-heavy notes', () => {
    const item = buildItem({
      title: 'Osmosis definition',
      summary: 'Osmosis is the movement of water from high potential to low potential.',
      content: 'Definition: Osmosis refers to water movement across a semi-permeable membrane.',
      contentType: 'definition',
      saveType: 'definition',
    });

    const recommendation = buildStudyToolRecommendation({ item });
    const recommendedIds = recommendation.recommendedTools.map((tool) => tool.id);

    expect(recommendedIds).toContain('flashcards');
    expect(recommendedIds).toContain('recall_sheet');
    expect(recommendation.generatedArtifacts.flashcards.cards.length).toBeGreaterThan(0);
  });

  it('classifies worked method notes and prioritizes flow + quick check', () => {
    const item = buildItem({
      title: 'Solve simultaneous equations',
      summary: 'Use elimination method in ordered steps.',
      content:
        '1) Align variables. 2) Multiply one equation. 3) Subtract to eliminate. 4) Back-substitute and check.',
      contentType: 'worked_step',
      saveType: 'worked_step',
    });

    const classified = classifyRevisionNoteShape(item);
    const recommendation = buildStudyToolRecommendation({ item });
    const recommendedIds = recommendation.recommendedTools.map((tool) => tool.id);

    expect(['worked_step', 'process', 'mixed']).toContain(classified.noteShape);
    expect(recommendedIds).toContain('flow_diagram');
    expect(recommendedIds).toContain('quick_check');
  });

  it('prioritizes compare table + teach back for comparison notes', () => {
    const item = buildItem({
      title: 'Mitosis vs meiosis',
      summary: 'Compare mitosis versus meiosis and avoid common confusion points.',
      content: 'Difference between mitosis and meiosis: mitosis creates identical cells whereas meiosis creates variation.',
      saveType: 'mistake_to_fix',
      isMistakeBased: true,
    });

    const recommendation = buildStudyToolRecommendation({ item });
    const recommendedIds = recommendation.recommendedTools.map((tool) => tool.id);

    expect(recommendedIds).toContain('compare_table');
    expect(recommendedIds).toContain('teach_back');
    expect(recommendation.generatedArtifacts.compareTable.trapPoints.length).toBeGreaterThan(0);
  });

  it('evaluates teach-back responses with a low score when empty', () => {
    const item = buildItem({
      title: 'Energy transfer',
      summary: 'Energy is transferred by heating, working, and radiation.',
      content: 'Energy transfer in systems includes conduction, convection, and radiation.',
    });

    const recommendation = buildStudyToolRecommendation({ item });
    const result = evaluateTeachBackResponse('', recommendation.generatedArtifacts.teachBack);

    expect(result.score).toBe(0);
    expect(result.correctness).toBe('struggled');
  });

  it('evaluates quick-check responses using keyword overlap', () => {
    const item = buildItem({
      title: 'Photosynthesis',
      summary: 'Photosynthesis uses light energy to make glucose and oxygen.',
      content: 'Photosynthesis occurs in chloroplasts and converts carbon dioxide and water into glucose.',
      contentType: 'explanation',
    });

    const recommendation = buildStudyToolRecommendation({ item });
    const question = recommendation.generatedArtifacts.quickCheck.questions[0];
    const evaluation = evaluateQuickCheckAnswer('It uses light energy to make glucose.', question);

    expect(evaluation.score).toBeGreaterThan(35);
    expect(['correct', 'partial', 'struggled']).toContain(evaluation.correctness);
  });
});
