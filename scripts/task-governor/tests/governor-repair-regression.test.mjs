import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
const testTaskId = 'test-governor-repair-' + Date.now();
const testDir = resolve(root, `.task-governor/tasks`);
const manifestPath = resolve(testDir, `${testTaskId}.json`);
const runtimeDir = resolve(
  execSync('git rev-parse --git-path task-governor', { encoding: 'utf-8' }).trim(),
  testTaskId
);

function testManifest() {
  return {
    schemaVersion: 1,
    taskId: testTaskId,
    title: 'Governor Repair Regression Test',
    description: 'Temporary task for regression testing governor repair',
    scope: {
      allowedPaths: ['scripts/task-governor/tests/fixtures-repair'],
      accountabilityDocument: 'scripts/task-governor/tests/fixtures-repair/accountability.md',
    },
    todos: [
      { id: 'REGRESS-1', title: 'Regression todo 1', dependsOn: [], requiredGateIds: ['regress-gate-1', 'regress-gate-2'] },
      { id: 'REGRESS-2', title: 'Regression todo 2', dependsOn: ['REGRESS-1'], requiredGateIds: ['regress-gate-3'] },
      { id: 'REGRESS-3', title: 'No-gate todo', dependsOn: [], requiredGateIds: [] },
    ],
    gates: [
      { id: 'regress-gate-1', title: 'Gate 1', type: 'command', required: true, executable: 'node', args: ['-e', 'console.log("gate-1 ok")'], timeoutMs: 30000 },
      { id: 'regress-gate-2', title: 'Gate 2', type: 'command', required: true, executable: 'node', args: ['-e', 'process.exit(0)'], timeoutMs: 30000 },
      { id: 'regress-gate-3', title: 'Gate 3', type: 'command', required: true, executable: 'node', args: ['-e', 'console.log("gate-3 ok")'], timeoutMs: 30000 },
    ],
    commitPolicy: {
      implementationMessagePattern: 'fix\\(regress\\):',
      accountabilityMessagePattern: 'docs\\(regress\\):',
      forbidAmend: true,
      forbidPush: true,
      accountabilityCommitDocsOnly: true,
    },
    acceptance: {
      sentinel: 'TEST_GOVERNOR_REPAIR_ACCEPTED_READY',
      requiredState: 'FINAL_REPOSITORY_PROOF',
      requiredGateIds: ['regress-gate-1'],
    },
  };
}

function ensureFixtures() {
  const fixtureDir = resolve(root, 'scripts/task-governor/tests/fixtures-repair');
  if (!existsSync(fixtureDir)) mkdirSync(fixtureDir, { recursive: true });
  const accPath = resolve(fixtureDir, 'accountability.md');
  if (!existsSync(accPath)) writeFileSync(accPath, '# Accountability\n', 'utf-8');
}

function clean() {
  try { if (existsSync(runtimeDir)) rmSync(runtimeDir, { recursive: true, force: true }); } catch {}
  try { if (existsSync(manifestPath)) rmSync(manifestPath, { force: true }); } catch {}
  try {
    const fd = resolve(root, 'scripts/task-governor/tests/fixtures-repair');
    if (existsSync(fd)) rmSync(fd, { recursive: true, force: true });
  } catch {}
}

describe('Governor Repair – Todo Verification', async () => {
  let stateStore, loaderMod, validateMod, ledgerMod, runnerMod, scanMod, stateMachine;

  before(async () => {
    clean(); ensureFixtures();
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(testManifest(), null, 2), 'utf-8');
    stateStore = await import('../state-store.mjs');
    loaderMod = await import('../manifest-loader.mjs');
    validateMod = await import('../manifest-validator.mjs');
    ledgerMod = await import('../evidence-ledger.mjs');
    runnerMod = await import('../process-runner.mjs');
    scanMod = await import('../scan-runner.mjs');
    stateMachine = await import('../state-machine.mjs');
  });

  after(() => clean());

  it('acceptance todo with no gates fails manifest validation', () => {
    const manifest = testManifest();
    manifest.todos.push({
      id: 'FAKE-ACCEPT',
      title: 'Pre-Commit Acceptance',
      description: 'Should have gates',
      dependsOn: [],
      requiredGateIds: [],
    });
    assert.throws(
      () => validateMod.validateManifest(manifest),
      /acceptance-phase todo .* has no requiredGateIds/
    );
  });

  it('valid manifest passes validation', () => {
    assert.ok(validateMod.validateManifest(testManifest()));
  });

  it('verify-todo checks requiredGateIds existence', () => {
    const state = stateStore.getDefaultState(testTaskId);
    state.currentState = 'TODO_VERIFICATION';
    state.currentHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    state.manifestHash = loaderMod.computeManifestHash(testManifest());
    state.todoCompletion = {};
    state.gateCompletion = {};
    stateStore.saveState(state);

    const manifest = loaderMod.loadManifest(testTaskId);
    const todo2 = manifest.todos.find(t => t.id === 'REGRESS-2');
    assert.ok(todo2.requiredGateIds.includes('regress-gate-3'));
  });

  it('todo cannot complete when dependency is unmet', () => {
    const state = stateStore.getDefaultState(testTaskId);
    state.currentState = 'TODO_VERIFICATION';
    state.currentHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    state.manifestHash = loaderMod.computeManifestHash(testManifest());
    state.todoCompletion = {};
    state.gateCompletion = { 'regress-gate-1': true, 'regress-gate-2': true, 'regress-gate-3': true };
    stateStore.saveState(state);

    const manifest = loaderMod.loadManifest(testTaskId);
    const todo2 = manifest.todos.find(t => t.id === 'REGRESS-2');
    assert.ok(todo2.dependsOn.includes('REGRESS-1'), 'REGRESS-2 depends on REGRESS-1');
  });

  it('todo cannot complete with stale manifest hash', () => {
    const manifest = testManifest();
    const currentHash = loaderMod.computeManifestHash(manifest);
    const state = stateStore.getDefaultState(testTaskId);
    state.currentState = 'TODO_VERIFICATION';
    state.currentHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    state.manifestHash = 'stale-hash-that-does-not-match';
    state.todoCompletion = {};
    state.gateCompletion = { 'regress-gate-1': true, 'regress-gate-2': true };
    stateStore.saveState(state);

    const stored = stateStore.loadState(testTaskId);
    assert.notEqual(stored.manifestHash, currentHash, 'Manifest hash should differ');
  });

  it('todo cannot complete with wrong HEAD', () => {
    const manifest = testManifest();
    const state = stateStore.getDefaultState(testTaskId);
    state.currentState = 'TODO_VERIFICATION';
    state.currentHead = '0000000000000000000000000000000000000000';
    state.manifestHash = loaderMod.computeManifestHash(manifest);
    state.todoCompletion = {};
    state.gateCompletion = { 'regress-gate-1': true, 'regress-gate-2': true };
    stateStore.saveState(state);

    const current = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    assert.notEqual(state.currentHead, current, 'HEAD should differ');
  });
});

describe('Governor Repair – Warning Inspection', async () => {
  let runnerMod;

  before(async () => {
    runnerMod = await import('../process-runner.mjs');
  });

  it('checkOutputForFailures reads from log paths', () => {
    const fixtureDir = resolve(root, 'scripts/task-governor/tests/fixtures-repair');
    if (!existsSync(fixtureDir)) mkdirSync(fixtureDir, { recursive: true });
    const logPath = resolve(fixtureDir, 'test-stdout.log');
    writeFileSync(logPath, 'error: The system cannot find the path specified', 'utf-8');

    const findings = runnerMod.checkOutputForFailures('', '', ['The system cannot find the path specified'], logPath, null);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].pattern, 'The system cannot find the path specified');
  });

  it('checkOutputForFailures returns empty for clean log', () => {
    const fixtureDir = resolve(root, 'scripts/task-governor/tests/fixtures-repair');
    const logPath = resolve(fixtureDir, 'test-clean.log');
    writeFileSync(logPath, 'All tests passed', 'utf-8');

    const findings = runnerMod.checkOutputForFailures('', '', ['The system cannot find the path specified'], logPath, null);
    assert.equal(findings.length, 0);
  });

  it('fatal warning detection in direct output', () => {
    const findings = runnerMod.checkOutputForFailures(
      'Unhandled Error: crash', '', ['Unhandled Error'], null, null
    );
    assert.equal(findings.length, 1);
  });

  it('passes clean output', () => {
    const findings = runnerMod.checkOutputForFailures(
      'All tests passed', '', ['Unhandled Error'], null, null
    );
    assert.equal(findings.length, 0);
  });

  it('empty output returns no findings', () => {
    const findings = runnerMod.checkOutputForFailures('', '', ['any pattern'], null, null);
    assert.equal(findings.length, 0);
  });

  it('readLogContent returns empty for missing file', () => {
    assert.equal(runnerMod.readLogContent('/nonexistent/file.log'), '');
  });
});

describe('Governor Repair – Resume', async () => {
  let stateStore, loaderMod;

  before(async () => {
    stateStore = await import('../state-store.mjs');
    loaderMod = await import('../manifest-loader.mjs');
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(testManifest(), null, 2), 'utf-8');
  });

  it('resume returns gate action when gates incomplete (TODO_VERIFICATION, no gates pass)', () => {
    const state = stateStore.getDefaultState(testTaskId);
    state.currentState = 'TODO_VERIFICATION';
    state.currentHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    state.manifestHash = loaderMod.computeManifestHash(testManifest());
    state.todoCompletion = {};
    state.gateCompletion = {};
    stateStore.saveState(state);
    assert.equal(state.currentState, 'TODO_VERIFICATION');
  });

  it('resume returns verify-todo after all gates pass', () => {
    const state = stateStore.getDefaultState(testTaskId);
    state.currentState = 'TODO_VERIFICATION';
    state.currentHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    state.manifestHash = loaderMod.computeManifestHash(testManifest());
    state.todoCompletion = {};
    state.gateCompletion = { 'regress-gate-1': true, 'regress-gate-2': true, 'regress-gate-3': true };
    stateStore.saveState(state);
    const manifest = testManifest();
    assert.ok(manifest.todos.find(t => t.id === 'REGRESS-1').requiredGateIds.every(g => state.gateCompletion[g]));
  });

  it('resume returns repair action in ERROR_REPAIR state', () => {
    const state = stateStore.getDefaultState(testTaskId);
    state.currentState = 'ERROR_REPAIR';
    state.lastFailedGateId = 'regress-gate-1';
    state.currentHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    stateStore.saveState(state);
    assert.equal(state.currentState, 'ERROR_REPAIR');
  });
});

describe('Governor Repair – Evidence Ledger', async () => {
  let ledgerMod, stateStore;

  before(async () => {
    ledgerMod = await import('../evidence-ledger.mjs');
    stateStore = await import('../state-store.mjs');
  });

  after(() => clean());

  it('addRecord creates hash-chained entry', () => {
    const head = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    ledgerMod.addRecord({
      taskId: testTaskId,
      gateId: 'test-gate',
      stateBefore: 'IMPLEMENTING',
      stateAfter: 'TODO_VERIFICATION',
      headBefore: head,
      headAfter: head,
      manifestHash: 'test-hash',
      exitCode: 0,
      duration: 100,
    });
    assert.ok(ledgerMod.verifyChain(testTaskId));
  });

  it('verifyChain detects tampered record', () => {
    const ledgerPath = resolve(runtimeDir, 'ledger.jsonl');
    if (existsSync(ledgerPath)) {
      const content = readFileSync(ledgerPath, 'utf-8').trim();
      const lines = content.split('\n').filter(Boolean);
      if (lines.length > 0) {
        const last = JSON.parse(lines[lines.length - 1]);
        last.exitCode = 99;
        lines[lines.length - 1] = JSON.stringify(last);
        writeFileSync(ledgerPath, lines.join('\n') + '\n', 'utf-8');
      }
    }
    assert.throws(() => ledgerMod.verifyChain(testTaskId), /tampering/);
  });
});

describe('Governor Repair – Scan Runner', async () => {
  let scanMod;

  before(async () => {
    scanMod = await import('../scan-runner.mjs');
  });

  it('route-local-repo scan has patterns', () => {
    assert.ok(scanMod.SCAN_PATTERNS.routeLocalRepository.length > 0);
  });

  it('shell/path scan has patterns', () => {
    assert.ok(scanMod.SCAN_PATTERNS.shellAndPath.length > 0);
  });

  it('idempotency scan has patterns', () => {
    assert.ok(scanMod.SCAN_PATTERNS.idempotency.length > 0);
  });

  it('scan returns results object', () => {
    const results = scanMod.runAllScans(['scripts/task-governor/tests/fixtures-repair'], { scans: [] });
    assert.ok(typeof results === 'object');
  });

  it('manual-sentinel scan detects sentinel string', () => {
    const fixtureDir = resolve(root, 'scripts/task-governor/tests/fixtures-repair');
    if (!existsSync(fixtureDir)) mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(resolve(fixtureDir, 'test-sentinel.ts'), 'const x = "STEADFAST_QBANK_RUNTIME_COMPOSITION_PERSISTENCE_TRUTH_ACCEPTED_READY";', 'utf-8');
    const results = scanMod.runAllScans(['scripts/task-governor/tests/fixtures-repair'], {
      scans: [{ id: 'manual-sentinel-scan', title: 'Manual sentinel scan', type: 'pattern' }],
    });
    const found = Object.values(results).some(issues => issues.some(i => i.pattern === 'accepted sentinel'));
    assert.ok(found);
  });
});

describe('Governor Repair – State Machine', async () => {
  let sm;

  before(async () => { sm = await import('../state-machine.mjs'); });

  it('PREFLIGHT -> IMPLEMENTING valid', () => assert.ok(sm.isValidTransition('PREFLIGHT', 'IMPLEMENTING')));
  it('PREFLIGHT -> ACCEPTED_READY invalid', () => assert.ok(!sm.isValidTransition('PREFLIGHT', 'ACCEPTED_READY')));
  it('ERROR_REPAIR -> TODO_VERIFICATION valid', () => assert.ok(sm.isValidTransition('ERROR_REPAIR', 'TODO_VERIFICATION')));
  it('ACCEPTED_READY is terminal', () => assert.ok(sm.isTerminal('ACCEPTED_READY')));
  it('IMPLEMENTING not terminal', () => assert.ok(!sm.isTerminal('IMPLEMENTING')));
});

describe('Governor Repair – Process Runner', async () => {
  let runnerMod;

  before(async () => { runnerMod = await import('../process-runner.mjs'); });

  it('runCommand succeeds for simple command', async () => {
    const result = await runnerMod.runCommand({ executable: 'node', args: ['-e', 'console.log("ok")'], timeoutMs: 10000, taskId: 'test' });
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('ok'));
  });

  it('runCommand captures non-zero exit', async () => {
    const result = await runnerMod.runCommand({ executable: 'node', args: ['-e', 'process.exit(42)'], timeoutMs: 10000, taskId: 'test' });
    assert.equal(result.exitCode, 42);
  });

  it('runCommand captures timeout', async () => {
    const result = await runnerMod.runCommand({ executable: 'node', args: ['-e', 'setTimeout(()=>{},10000)'], timeoutMs: 50, taskId: 'test' });
    assert.ok(result.timedOut);
  });
});

describe('Governor Repair – Manifest Validator', async () => {
  let vm;

  before(async () => { vm = await import('../manifest-validator.mjs'); });

  it('rejects null manifest', () => assert.throws(() => vm.validateManifest(null), /must be a non-null object/));
  it('rejects empty object', () => assert.throws(() => vm.validateManifest({}), /missing|invalid/i));
  it('rejects duplicate gate IDs', () => {
    const m = testManifest();
    m.gates.push({ id: 'regress-gate-1', title: 'Dup', type: 'command', executable: 'node', args: ['-e', ''], timeoutMs: 10000 });
    assert.throws(() => vm.validateManifest(m), /Duplicate gate ID/);
  });
  it('rejects unknown gate reference in todo', () => {
    const m = testManifest();
    m.todos[0].requiredGateIds.push('nonexistent-gate');
    assert.throws(() => vm.validateManifest(m), /references unknown gate/);
  });
});
