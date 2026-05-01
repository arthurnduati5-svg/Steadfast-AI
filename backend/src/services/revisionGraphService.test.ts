import { describe, expect, it } from 'vitest';
import { __revisionGraphTestUtils } from './revisionGraphService';

const makeNote = (overrides: Record<string, unknown> = {}) => ({
  id: 'note-1',
  title: 'Linear equations',
  summary: 'Keep both sides balanced.',
  topic: 'Linear equations',
  subtopic: 'Balancing',
  subject: 'math',
  tags: ['Equations', 'Linear'],
  saveType: 'worked_step',
  contentType: 'worked_step',
  isMistakeBased: false,
  collectionId: 'collection-1',
  ...overrides,
});

describe('revisionGraphService', () => {
  it('normalizes tags with typo fixes, synonym mapping, and duplicate merging', () => {
    const normalized = __revisionGraphTestUtils.normalizeGraphTags([
      'Eqaution',
      'equations',
      'Maths',
      'math',
      'Linear',
      'linear',
    ]);

    expect(normalized.tagKeys).toContain('equation');
    expect(normalized.tagKeys).toContain('math');
    expect(normalized.suggestions.some((suggestion) => suggestion.kind === 'fix_spelling')).toBe(true);
    expect(normalized.suggestions.some((suggestion) => suggestion.kind === 'mapped_synonym')).toBe(true);
    expect(normalized.suggestions.some((suggestion) => suggestion.kind === 'merge_duplicate')).toBe(true);
  });

  it('creates recovery links with explainable signals and concrete action steps', () => {
    const source = makeNote({
      id: 'source-1',
      title: 'Keep both sides balanced',
      isMistakeBased: true,
      tags: ['Equations', 'Linear', 'Negative signs'],
    });
    const related = makeNote({
      id: 'target-1',
      title: 'Watch negative signs after moving terms',
      isMistakeBased: true,
      tags: ['Linear', 'Negative signs', 'Equation'],
      summary: 'A frequent sign mistake while transposing.',
    });

    const graph = __revisionGraphTestUtils.buildConnectedNoteGraphForSource(source, [related]);
    expect(graph.links.length).toBe(1);
    expect(graph.links[0]?.category).toBe('recovery');
    expect(graph.links[0]?.explainability.fields).toContain('tags');
    expect(graph.links[0]?.explainability.fields).toContain('mistake_history');
    expect(graph.links[0]?.whyConnected.toLowerCase()).toContain('shared tags');
    expect(graph.links[0]?.actionStep.toLowerCase()).toContain('correction rule');
  });

  it('classifies application links and returns compact summary lines', () => {
    const source = makeNote({
      id: 'source-2',
      title: 'Ratio basics',
      topic: 'Ratios',
      subtopic: 'Foundations',
      tags: ['Ratios', 'Application'],
      saveType: 'short_note',
      contentType: 'summary',
    });
    const related = makeNote({
      id: 'target-2',
      title: 'Ratio in recipe scaling',
      topic: 'Ratios',
      subtopic: 'Recipe scaling',
      tags: ['Application', 'Word problem', 'Ratios'],
      saveType: 'short_note',
      contentType: 'summary',
      isMistakeBased: false,
    });

    const graph = __revisionGraphTestUtils.buildConnectedNoteGraphForSource(source, [related]);
    expect(graph.links[0]?.category).toBe('application');
    expect(graph.summaryLines.length).toBeGreaterThanOrEqual(3);
    expect(graph.summaryLines[0]?.toLowerCase()).toContain('revision route');
  });
});

