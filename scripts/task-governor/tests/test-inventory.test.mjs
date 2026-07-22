import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('Test Inventory', async () => {
  let inventory;

  before(async () => {
    inventory = await import('../test-inventory.mjs');
  });

  it('compares inventories and detects changes', () => {
    const baseline = {
      suiteId: 'test-suite',
      testFiles: [
        { file: 'src/test/a.test.ts', testNames: [{ fullName: 'test 1', status: 'passed' }] },
        { file: 'src/test/b.test.ts', testNames: [{ fullName: 'test 2', status: 'passed' }] },
      ],
      fileCount: 2,
      testCount: 2,
      failedCount: 0,
      skippedCount: 0,
      todoCount: 0,
    };

    const current = {
      suiteId: 'test-suite',
      testFiles: [
        { file: 'src/test/a.test.ts', testNames: [{ fullName: 'test 1', status: 'passed' }] },
      ],
      fileCount: 1,
      testCount: 1,
      failedCount: 0,
      skippedCount: 0,
      todoCount: 0,
    };

    const errors = inventory.compareInventories(baseline, current);
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('disappeared')));
  });

  it('detects disappeared test names', () => {
    const baseline = {
      suiteId: 'test-suite',
      testFiles: [
        { file: 'src/test/a.test.ts', testNames: [{ fullName: 'important test', status: 'passed' }] },
      ],
      fileCount: 1,
      testCount: 1,
      failedCount: 0,
      skippedCount: 0,
      todoCount: 0,
    };

    const current = {
      suiteId: 'test-suite',
      testFiles: [
        { file: 'src/test/a.test.ts', testNames: [{ fullName: 'different test', status: 'passed' }] },
      ],
      fileCount: 1,
      testCount: 1,
      failedCount: 0,
      skippedCount: 0,
      todoCount: 0,
    };

    const errors = inventory.compareInventories(baseline, current);
    assert.ok(errors.some(e => e.includes('disappeared')));
  });

  it('detects new skipped tests', () => {
    const baseline = {
      suiteId: 'test-suite',
      testFiles: [],
      fileCount: 0,
      testCount: 0,
      failedCount: 0,
      skippedCount: 0,
      todoCount: 0,
    };

    const current = {
      suiteId: 'test-suite',
      testFiles: [],
      fileCount: 0,
      testCount: 0,
      failedCount: 0,
      skippedCount: 5,
      todoCount: 0,
    };

    const errors = inventory.compareInventories(baseline, current);
    assert.ok(errors.some(e => e.includes('skipped')));
  });

  it('separates root and backend suite identities', () => {
    const rootSuite = {
      suiteId: 'root-suite',
      testFiles: [
        { file: 'src/test/root.test.ts', testNames: [{ fullName: 'root test 1', status: 'passed' }] },
      ],
      fileCount: 1, testCount: 1, failedCount: 0, skippedCount: 0, todoCount: 0
    };
    const backendSuite = {
      suiteId: 'backend-suite',
      testFiles: [
        { file: 'backend/src/test/backend.test.ts', testNames: [{ fullName: 'backend test 1', status: 'passed' }] },
      ],
      fileCount: 1, testCount: 1, failedCount: 0, skippedCount: 0, todoCount: 0
    };

    const errors1 = inventory.compareInventories(rootSuite, backendSuite);
    assert.ok(errors1.some(e => e.includes('disappeared')));
  });

  it('passes with approved rename', () => {
    const baseline = {
      suiteId: 'test-suite',
      testFiles: [
        { file: 'src/test/old-name.test.ts', testNames: [{ fullName: 'test', status: 'passed' }] },
      ],
      fileCount: 1,
      testCount: 1,
      failedCount: 0,
      skippedCount: 0,
      todoCount: 0,
    };

    const current = {
      suiteId: 'test-suite',
      testFiles: [
        { file: 'src/test/new-name.test.ts', testNames: [{ fullName: 'test', status: 'passed' }] },
      ],
      fileCount: 1,
      testCount: 1,
      failedCount: 0,
      skippedCount: 0,
      todoCount: 0,
    };

    const renameMap = { 'src/test/old-name.test.ts': 'src/test/new-name.test.ts' };
    const errors = inventory.compareInventories(baseline, current, renameMap);
    assert.equal(errors.length, 0);
  });
});
