import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const testTaskId = 'test-evidence-' + Date.now();

describe('Evidence Ledger', async () => {
  let ledger;

  before(async () => {
    ledger = await import('../evidence-ledger.mjs');
  });

  it('adds a record to the ledger', async () => {
    const record = ledger.addRecord({
      taskId: testTaskId,
      stateBefore: 'PREFLIGHT',
      stateAfter: 'IMPLEMENTING',
      gateId: 'test-gate',
      exitCode: 0,
      manifestHash: 'abc123',
    });

    assert.ok(record.recordId);
    assert.equal(record.taskId, testTaskId);
    assert.equal(record.stateBefore, 'PREFLIGHT');
    assert.equal(record.stateAfter, 'IMPLEMENTING');
    assert.ok(record.currentRecordHash);
  });

  it('retrieves records for a task', async () => {
    const records = ledger.getRecords(testTaskId);
    assert.ok(records.length >= 1);
    assert.equal(records[0].taskId, testTaskId);
  });

  it('verifies the chain is intact', async () => {
    const result = ledger.verifyChain(testTaskId);
    assert.equal(result, true);
  });

  it('verifies chain for empty ledger', async () => {
    const result = ledger.verifyChain('nonexistent-task-' + Date.now());
    assert.equal(result, true);
  });

  it('gets the last record', async () => {
    const last = ledger.getLastRecord(testTaskId);
    assert.ok(last);
    assert.equal(last.taskId, testTaskId);
  });

  it('filters records by gate', async () => {
    const records = ledger.getRecordsForGate(testTaskId, 'test-gate');
    assert.ok(records.length >= 1);
  });
});
