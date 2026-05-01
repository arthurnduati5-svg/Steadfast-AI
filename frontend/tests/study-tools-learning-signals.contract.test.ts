import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('study tools learning signals contract', () => {
  it('replaces tracking-and-coaching language with a compact learning-signals surface', () => {
    const source = readRepoFile('frontend/components/revision/study-tools-section.tsx');

    expect(source).toContain('Learning progress');
    expect(source).toContain('Try this next');
    expect(source).toContain('Open tool');
    expect(source).not.toContain('Learning signals');
    expect(source).not.toContain('Tracking and coaching');
    expect(source).not.toContain('One short coaching signal for next revision.');
  });

  it('uses automatic inference contract instead of manual coaching form dependency', () => {
    const source = readRepoFile('frontend/components/revision/study-tools-section.tsx');

    expect(source).toContain('buildLearningSignalsSnapshot');
    expect(source).toContain('learningSignals.nextBestSupport');
    expect(source).toContain('learningSignals.askDirectFeedback');
  });
});
