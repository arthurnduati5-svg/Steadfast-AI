import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import using dynamic import since these are ESM
const modulePath = '../manifest-validator.mjs';

async function getValidator() {
  return await import(modulePath);
}

describe('Manifest Validator', async () => {
  it('passes a valid manifest', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    const result = validateManifest(manifest);
    assert.equal(result, true);
  });

  it('fails on malformed manifest (null)', async () => {
    const { validateManifest } = await getValidator();
    assert.throws(() => validateManifest(null), /non-null object/);
  });

  it('fails on unknown schema version', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.schemaVersion = 99;
    assert.throws(() => validateManifest(manifest), /Unknown schema version/);
  });

  it('fails on empty sentinel', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.acceptance.sentinel = '';
    assert.throws(() => validateManifest(manifest), /non-empty string/);
  });

  it('fails on duplicate gate IDs', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.gates.push({ ...manifest.gates[0], title: 'Duplicate' });
    assert.throws(() => validateManifest(manifest), /Duplicate gate ID/);
  });

  it('fails on duplicate todo IDs', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.todos.push({ ...manifest.todos[0], title: 'Duplicate' });
    assert.throws(() => validateManifest(manifest), /Duplicate todo ID/);
  });

  it('fails on cyclic todo dependencies', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.todos = [
      { id: 'A', title: 'A', dependsOn: ['B'] },
      { id: 'B', title: 'B', dependsOn: ['C'] },
      { id: 'C', title: 'C', dependsOn: ['A'] },
    ];
    assert.throws(() => validateManifest(manifest), /Cyclic dependency/);
  });

  it('fails on unknown gate reference in todo', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.todos[0].requiredGateIds = ['nonexistent-gate'];
    assert.throws(() => validateManifest(manifest), /references unknown gate/);
  });

  it('fails on missing required fields', async () => {
    const { validateManifest } = await getValidator();
    assert.throws(() => validateManifest({}), /acceptance/);
  });

  it('fails on path traversal in allowedPaths', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.scope.allowedPaths.push('../outside');
    assert.throws(() => validateManifest(manifest), /Path traversal/);
  });

  it('fails on absolute path in allowedPaths', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.scope.allowedPaths.push('C:/absolute/path');
    assert.throws(() => validateManifest(manifest), /Absolute machine-specific path/);
  });

  it('fails on missing executable for command gate', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.gates[0].executable = undefined;
    assert.throws(() => validateManifest(manifest), /missing executable/);
  });

  it('fails on non-positive timeout', async () => {
    const { validateManifest } = await getValidator();
    const manifest = createValidManifest();
    manifest.gates[0].timeoutMs = 0;
    assert.throws(() => validateManifest(manifest), /non-positive timeout/);
  });
});

function createValidManifest() {
  return {
    schemaVersion: 1,
    taskId: 'test-task',
    title: 'Test Task',
    description: 'A test task for validation',
    scope: {
      allowedPaths: ['src/test'],
      protectedPaths: ['src/protected'],
      accountabilityDocument: 'src/test/accountability.md',
    },
    todos: [
      { id: 'TODO-1', title: 'Test todo 1', dependsOn: [], requiredGateIds: ['gate-1'] },
    ],
    gates: [
      { id: 'gate-1', title: 'Test gate', type: 'command', required: true, executable: 'node', args: ['--version'], timeoutMs: 30000 },
    ],
    commitPolicy: {
      implementationMessagePattern: 'fix\\(test\\):',
      accountabilityMessagePattern: 'docs\\(test\\):',
      forbidAmend: true,
      forbidPush: true,
      accountabilityCommitDocsOnly: true,
    },
    acceptance: {
      sentinel: 'TEST_SENTINEL_ACCEPTED_READY',
      requiredState: 'FINAL_REPOSITORY_PROOF',
      requiredGateIds: ['gate-1'],
    },
  };
}
