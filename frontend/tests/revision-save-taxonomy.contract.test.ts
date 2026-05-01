import { describe, expect, it } from 'vitest';
import type { Message } from '@/lib/types';
import {
  buildRevisionAutoFillSuggestion,
  buildRevisionSavePreview,
  getRevisionSaveTypeLabel,
  inferRevisionSaveType,
  inferRevisionSaveTypeFromContentType,
  inferRevisionSubject,
  normalizeRevisionSubject,
} from '@/lib/revision-save-taxonomy';

function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'message-1',
    role: 'model',
    content: 'Here is a guided explanation.',
    metadata: {},
    ...overrides,
  };
}

describe('revision save taxonomy contract', () => {
  it('normalizes common subject wording into the structured taxonomy', () => {
    expect(normalizeRevisionSubject('Mathematics')).toBe('math');
    expect(normalizeRevisionSubject('ICT & Coding')).toBe('ict_coding');
    expect(normalizeRevisionSubject('Islamic Studies')).toBe('ire');
  });

  it('infers subject from topic context when no direct subject is supplied', () => {
    const subject = inferRevisionSubject({
      topic: 'Photosynthesis and osmosis basics',
      tutorState: null,
      tutorArtifacts: null,
      message: null,
      selectedText: null,
    });

    expect(subject).toBe('biology');
  });

  it('keeps research notes and worked steps distinct in save inference', () => {
    const researchMessage = buildMessage({
      content: 'According to the source, the exchange rate changes during the day.',
      sources: [{ sourceName: 'Central Bank', url: 'https://example.com' }],
    });
    const workedStepMessage = buildMessage({
      content: 'Step 1: move the constant to the other side, then divide by the coefficient.',
      metadata: {
        presentation: {
          cardKind: 'breakdown',
        },
      },
    });

    expect(inferRevisionSaveType({ message: researchMessage })).toBe('research_note');
    expect(inferRevisionSaveType({ message: workedStepMessage })).toBe('worked_step');
    expect(inferRevisionSaveTypeFromContentType('correction')).toBe('mistake_to_fix');
  });

  it('builds a clean preview instead of mirroring raw chat text', () => {
    const preview = buildRevisionSavePreview({
      saveType: 'practice_item',
      subject: 'math',
      topic: 'Linear equations',
      sourceText: 'Try solving 3x + 5 = 20 and explain each step.',
    });

    expect(preview.title).toBe('Linear equations');
    expect(preview.subjectLabel).toBe('Math');
    expect(preview.saveTypeLabel).toBe(getRevisionSaveTypeLabel('practice_item'));
    expect(preview.helper).toContain('question');
    expect(preview.summary).not.toBe('');
  });

  it('marks autofill high-confidence when multiple strong signals align', () => {
    const message = buildMessage({
      content: 'According to this source, osmosis depends on concentration gradients.',
      sources: [{ sourceName: 'Biology Hub', url: 'https://example.com/osmosis' }],
      metadata: {
        presentation: {
          cardKind: 'summary',
          topicMastery: { subject: 'biology', topic: 'Osmosis', label: 'getting_better' },
        },
      },
    });

    const suggestion = buildRevisionAutoFillSuggestion({
      message,
      topic: 'Osmosis',
      subject: 'Biology',
      selectedText: 'Osmosis moves water from high to low water potential.',
    });

    expect(suggestion.subject).toBe('biology');
    expect(suggestion.saveType).toBe('research_note');
    expect(suggestion.confidence).toBe('high');
    expect(suggestion.needsReview).toBe(false);
  });

  it('marks autofill low-confidence when subject signal is weak', () => {
    const suggestion = buildRevisionAutoFillSuggestion({
      message: buildMessage({ content: 'This helps in many topics.' }),
      topic: '',
      selectedText: '',
    });

    expect(suggestion.subject).toBeNull();
    expect(suggestion.confidence).toBe('low');
    expect(suggestion.needsReview).toBe(true);
  });
});
