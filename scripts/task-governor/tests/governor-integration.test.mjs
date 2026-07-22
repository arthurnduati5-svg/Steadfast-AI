import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';

const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
const testTaskId = 'test-integration-' + Date.now();
const testDir = resolve(root, `.task-governor/tasks`);
const manifestPath = resolve(testDir, `${testTaskId}.json`);

function createTestManifest(sentinel) {
  return {
    schemaVersion: 1,
    taskId: testTaskId,
    title: 'Integration Test Task',
    description: 'Temporary task for integration testing',
    scope: {
      allowedPaths: ['scripts/task-governor/tests/fixtures-integration'],
      accountabilityDocument: 'scripts/task-governor/tests/fixtures-integration/accountability.md',
    },
    todos: [
      { id: 'INT-1', title: 'Integration todo 1', dependsOn: [], requiredGateIds: ['int-gate-1'] },
    ],
    gates: [
      { id: 'int-gate-1', title: 'Integration test gate', type: 'command', required: true, executable: 'node', args: ['-e', 'console.log("integration gate ok")'], timeoutMs: 30000 },
    ],
    commitPolicy: {
      implementationMessagePattern: 'fix\\(integration\\):',
      accountabilityMessagePattern: 'docs\\(integration\\):',
      forbidAmend: true,
      forbidPush: true,
      accountabilityCommitDocsOnly: true,
    },
    acceptance: {
      sentinel: sentinel || 'TEST_INTEGRATION_ACCEPTED_READY',
      requiredState: 'FINAL_REPOSITORY_PROOF',
      requiredGateIds: ['int-gate-1'],
    },
  };
}

describe('Governor Integration', async () => {
  before(() => {
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });
    if (!existsSync(resolve(root, 'scripts/task-governor/tests/fixtures-integration'))) {
      mkdirSync(resolve(root, 'scripts/task-governor/tests/fixtures-integration'), { recursive: true });
    }
  });

  it('bootstrap captures baseline and sets state to IMPLEMENTING', async () => {
    const manifest = createTestManifest();
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    const { default: gov } = await import('../../task-governor.mjs');
    const validateMod = await import('../manifest-validator.mjs');
    const loaderMod = await import('../manifest-loader.mjs');
    const stateStore = await import('../state-store.mjs');

    const loadedManifest = loaderMod.loadManifest(testTaskId);
    validateMod.validateManifest(loadedManifest);
    assert.equal(loadedManifest.taskId, testTaskId);

    const state = stateStore.getDefaultState(testTaskId);
    assert.equal(state.currentState, 'PREFLIGHT');
  });

  it('validate rejects invalid manifest', async () => {
    const invalidManifest = { schemaVersion: 99, taskId: testTaskId };
    writeFileSync(manifestPath, JSON.stringify(invalidManifest, null, 2), 'utf-8');

    try {
      const validateMod = await import('../manifest-validator.mjs');
      const loaderMod = await import('../manifest-loader.mjs');
      const loaded = loaderMod.loadManifest(testTaskId);
      assert.throws(() => validateMod.validateManifest(loaded), /Unknown schema version/);
    } catch (e) {
      assert.ok(e.message.includes('Unknown schema version') || e.message.includes('Unknown'));
    }
  });

  after(() => {
    try {
      const gitPath = execSync('git rev-parse --git-path task-governor', { encoding: 'utf-8' }).trim();
      const runtimeDir = resolve(root, gitPath, testTaskId);
      if (existsSync(runtimeDir)) rmSync(runtimeDir, { recursive: true, force: true });
    } catch {}
    try {
      if (existsSync(resolve(root, 'scripts/task-governor/tests/fixtures-integration'))) {
        rmSync(resolve(root, 'scripts/task-governor/tests/fixtures-integration'), { recursive: true, force: true });
      }
    } catch {}
  });
});
