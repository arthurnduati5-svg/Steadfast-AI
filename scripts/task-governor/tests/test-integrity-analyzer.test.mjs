import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');
const testDir = resolve(root, 'scripts/task-governor/tests/fixtures');
const testFilePath = resolve(testDir, 'fake-test.test.ts');

async function importAnalyzer() {
  return await import('../test-integrity-analyzer.mjs');
}

describe('Test Integrity Analyzer', () => {
  let analyzer;

  before(async () => {
    analyzer = await importAnalyzer();
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });
  });

  it('detects executable fake pass expect(true).toBe(true)', () => {
    writeFileSync(testFilePath, [
      'import { test, expect } from "vitest";',
      'test("fake pass", () => {',
      '  expect(true).toBe(true);',
      '});',
    ].join('\n'), 'utf-8');

    const results = analyzer.analyzeTestFiles(['scripts/task-governor/tests/fixtures']);
    assert.ok(results.some(r => r.ruleId === 'fake-pass-expect-true'));
  });

  it('detects describe.skip', () => {
    writeFileSync(testFilePath, [
      'describe.skip("skipped suite", () => {',
      '  it("test", () => {});',
      '});',
    ].join('\n'), 'utf-8');

    const results = analyzer.analyzeTestFiles(['scripts/task-governor/tests/fixtures']);
    assert.ok(results.some(r => r.ruleId === 'describe-skip'));
  });

  it('detects it.skip', () => {
    writeFileSync(testFilePath, [
      'it.skip("skipped test", () => {});',
    ].join('\n'), 'utf-8');

    const results = analyzer.analyzeTestFiles(['scripts/task-governor/tests/fixtures']);
    assert.ok(results.some(r => r.ruleId === 'it-skip'));
  });

  it('does not misclassify detector strings', () => {
    writeFileSync(testFilePath, [
      '// this file tests that describe.skip is detected',
      'const pattern = "describe.skip(";',
      '// expect(true).toBe(true) is a fake pass pattern',
    ].join('\n'), 'utf-8');

    const results = analyzer.analyzeTestFiles(['scripts/task-governor/tests/fixtures']);
    const fakePassResults = results.filter(r => r.ruleId === 'fake-pass-expect-true' || r.ruleId === 'describe-skip');
    assert.equal(fakePassResults.length, 0);
  });

  it('detects .todo in test code', () => {
    writeFileSync(testFilePath, [
      'test.todo("pending test");',
    ].join('\n'), 'utf-8');

    const results = analyzer.analyzeTestFiles(['scripts/task-governor/tests/fixtures']);
    assert.ok(results.some(r => r.ruleId === 'test-todo'));
  });

  it('detects conditional test registration', () => {
    writeFileSync(testFilePath, [
      'if (someCondition) it("conditional test", () => {});',
    ].join('\n'), 'utf-8');

    const results = analyzer.analyzeTestFiles(['scripts/task-governor/tests/fixtures']);
    assert.ok(results.some(r => r.ruleId === 'conditional-test-registration'));
  });

  after(() => {
    try { rmSync(testDir, { recursive: true, force: true }); } catch {}
  });
});
