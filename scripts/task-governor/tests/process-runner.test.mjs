import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('Process Runner', async () => {
  let runner;

  before(async () => {
    runner = await import('../process-runner.mjs');
  });

  it('runs a simple command successfully', async () => {
    const result = await runner.runCommand({
      executable: 'node',
      args: ['-e', 'console.log("hello")'],
      timeoutMs: 10000,
      taskId: 'test',
    });

    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('hello'));
    assert.ok(result.duration > 0);
  });

  it('captures non-zero exit codes', async () => {
    const result = await runner.runCommand({
      executable: 'node',
      args: ['-e', 'process.exit(1)'],
      timeoutMs: 10000,
      taskId: 'test',
    });

    assert.equal(result.exitCode, 1);
  });

  it('records timeout', async () => {
    const result = await runner.runCommand({
      executable: 'node',
      args: ['-e', 'setTimeout(() => {}, 50000)'],
      timeoutMs: 100,
      taskId: 'test',
    });

    assert.ok(result.timedOut);
  });

  it('detects warning patterns in output', async () => {
    const findings = runner.checkOutputForFailures(
      'error: The system cannot find the path specified',
      '',
      ['The system cannot find the path specified']
    );
    assert.equal(findings.length, 1);
    assert.equal(findings[0].pattern, 'The system cannot find the path specified');
  });

  it('returns empty for clean output', async () => {
    const findings = runner.checkOutputForFailures(
      'All tests passed',
      '',
      ['The system cannot find the path specified']
    );
    assert.equal(findings.length, 0);
  });
});
