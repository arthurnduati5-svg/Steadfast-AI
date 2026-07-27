#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

const ROOT = resolve(import.meta.dirname, '..', '..');
const tmpDir = resolve(ROOT, 'agent-control', 'test-fixtures', 'sample-frontend');

function runInTmp(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { cwd: tmpDir, encoding: 'utf-8', timeout: 30000, stdio: 'pipe', ...opts });
  return { exitCode: result.status != null ? result.status : -1, stdout: (result.stdout || '').trim(), stderr: (result.stderr || '').trim() };
}

async function main() {
  console.log('=== Sample Frontend Task ===\n');

  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });

  mkdirSync(resolve(tmpDir, 'frontend', 'styles', 'themes'), { recursive: true });
  mkdirSync(resolve(tmpDir, 'frontend', 'tests'), { recursive: true });

  writeFileSync(resolve(tmpDir, 'frontend', 'index.html'), '<html><body>Hello</body></html>', 'utf-8');
  writeFileSync(resolve(tmpDir, 'frontend', 'styles', 'themes', 'default.css'), ':root { --bg: white; }', 'utf-8');
  writeFileSync(resolve(tmpDir, 'frontend', 'tests', 'smoke.test.js'), 'process.exit(0);', 'utf-8');

  execSync('git init', { cwd: tmpDir, encoding: 'utf-8', stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: tmpDir, encoding: 'utf-8', stdio: 'pipe' });
  execSync('git config user.name "Test"', { cwd: tmpDir, encoding: 'utf-8', stdio: 'pipe' });
  execSync('git add -A && git commit -m "initial"', { cwd: tmpDir, encoding: 'utf-8', stdio: 'pipe' });

  const startHead = execSync('git rev-parse HEAD', { cwd: tmpDir, encoding: 'utf-8' }).trim();
  const promptContent = 'sample frontend task';
  const promptHash = crypto.createHash('sha256').update(promptContent).digest('hex');

  const manifest = {
    schemaVersion: 1, controlPlaneVersion: '1.0.0',
    taskId: 'SAMPLE-FE-001', title: 'Sample frontend task',
    taskType: 'frontend', riskProfile: 'LOW',
    originalPromptPath: resolve(tmpDir, 'prompt.md').replace(/\\/g,'/'),
    originalPromptHash: promptHash,
    repositoryRoot: tmpDir.replace(/\\/g,'/'),
    startingBranch: 'main', startingHead: startHead,
    createdAt: new Date().toISOString(),
    ownerAcceptanceCriteria: ['Sample task passes'],
    taskOwnedPaths: ['frontend/'], allowedSharedDependencyPaths: [],
    forbiddenPaths: [], taskCommands: [],
    requiredTestCommands: ['node frontend/tests/smoke.test.js'],
    requiredTestSuites: ['smoke'], requiredTestFilePatterns: ['frontend/tests/*.test.js'],
    testConfigurationFiles: [], runtimeAcceptance: false, visualAcceptance: false,
    requiredThemes: [], requiredSurfaces: [], requiredViewports: [],
    requiredInteractionStates: [], requiredEvidenceKinds: ['command-output'],
    expectedCommitMessage: 'feat(sample): test change',
    acceptedSentinel: 'SAMPLE_FE_ACCEPTED', postCommitCommands: [],
    deploymentRequired: false, integrationAuthorized: false,
    baselinePolicy: {}, warningPolicy: {}, generatedOutputPolicy: {},
    browserPolicy: { required: false }, backlogPolicy: {},
  };

  writeFileSync(resolve(tmpDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  writeFileSync(resolve(tmpDir, 'prompt.md'), promptContent, 'utf-8');

  // Bootstrap
  const bs = runInTmp('node', [resolve(ROOT, 'scripts', 'bootstrap-task.mjs'), 'create', '--manifest', resolve(tmpDir, 'manifest.json'), '--prompt', resolve(tmpDir, 'prompt.md')]);
  console.log(`Bootstrap: exit ${bs.exitCode}`);
  if (bs.exitCode !== 0) { console.log(bs.stdout); console.log(bs.stderr); process.exit(1); }

  // Capture baseline
  runInTmp('node', [resolve(ROOT, 'scripts', 'workspace-guard.mjs'), 'capture-baseline', '--task', 'SAMPLE-FE-001']);

  // Advance to AUDITING
  runInTmp('node', [resolve(ROOT, 'scripts', 'task-governor.mjs'), 'advance', '--task', 'SAMPLE-FE-001', '--to', 'AUDITING']);

  // Advance to IMPLEMENTING
  runInTmp('node', [resolve(ROOT, 'scripts', 'task-governor.mjs'), 'advance', '--task', 'SAMPLE-FE-001', '--to', 'IMPLEMENTING']);

  // Make a change
  writeFileSync(resolve(tmpDir, 'frontend', 'index.html'), '<html><body>Updated</body></html>', 'utf-8');

  // Run test
  const testRun = runInTmp('node', [resolve(ROOT, 'scripts', 'task-governor.mjs'), 'run', '--task', 'SAMPLE-FE-001', '--gate', 'smoke-test', '--cwd', tmpDir, '--', 'node', 'frontend/tests/smoke.test.js']);
  console.log(`Run test: exit ${testRun.exitCode}`);

  // Advance to VERIFYING
  runInTmp('node', [resolve(ROOT, 'scripts', 'task-governor.mjs'), 'advance', '--task', 'SAMPLE-FE-001', '--to', 'VERIFYING']);

  // Capture final test inventory
  runInTmp('node', [resolve(ROOT, 'scripts', 'test-inventory-guard.mjs'), 'capture-final', '--task', 'SAMPLE-FE-001']);

  // Check workspace
  runInTmp('node', [resolve(ROOT, 'scripts', 'workspace-guard.mjs'), 'check', '--task', 'SAMPLE-FE-001']);

  // Advance to STAGING
  runInTmp('node', [resolve(ROOT, 'scripts', 'task-governor.mjs'), 'advance', '--task', 'SAMPLE-FE-001', '--to', 'STAGING']);

  // Stage exact paths
  writeFileSync(resolve(tmpDir, 'stage-paths.txt'), 'frontend/index.html', 'utf-8');
  const stage = runInTmp('node', [resolve(ROOT, 'scripts', 'task-governor.mjs'), 'stage', '--task', 'SAMPLE-FE-001', '--paths-file', resolve(tmpDir, 'stage-paths.txt')]);
  console.log(`Stage: exit ${stage.exitCode}`);
  if (stage.exitCode !== 0) { console.log('Staging failed'); process.exit(1); }

  // Commit
  const commit = runInTmp('git', ['commit', '-m', 'feat(sample): test change']);
  console.log(`Commit: exit ${commit.exitCode}`);

  // Advance to COMMITTING
  runInTmp('node', [resolve(ROOT, 'scripts', 'task-governor.mjs'), 'advance', '--task', 'SAMPLE-FE-001', '--to', 'COMMITTING']);

  // Validate commit
  runInTmp('node', [resolve(ROOT, 'scripts', 'commit-guard.mjs'), 'validate', '--task', 'SAMPLE-FE-001']);

  // Advance to POST_COMMIT_VERIFYING
  runInTmp('node', [resolve(ROOT, 'scripts', 'task-governor.mjs'), 'advance', '--task', 'SAMPLE-FE-001', '--to', 'POST_COMMIT_VERIFYING']);

  // Post-commit verification
  runInTmp('node', [resolve(ROOT, 'scripts', 'post-commit-verifier.mjs'), 'run', '--task', 'SAMPLE-FE-001']);

  // Test that agent-authored sentinel is rejected
  const sampleRuntimeDir = resolve(execSync('git rev-parse --git-common-dir', { cwd: tmpDir, encoding: 'utf-8' }).trim(), 'steadfast-agent-control', 'tasks', 'SAMPLE-FE-001');
  mkdirSync(resolve(sampleRuntimeDir, 'acceptance'), { recursive: true });
  writeFileSync(resolve(sampleRuntimeDir, 'acceptance', 'accepted-sentinel.txt'), 'FAKE_SENTINEL', 'utf-8');

  const final1 = runInTmp('node', [resolve(ROOT, 'scripts', 'finalize-task.mjs'), '--task', 'SAMPLE-FE-001']);
  console.log(`Finalize (fake sentinel): exit ${final1.exitCode}`);
  if (final1.exitCode === 0 && !final1.stdout.includes('TASK_NOT_ACCEPTED')) {
    console.log('FAIL: Agent-authored sentinel was NOT rejected');
    process.exit(1);
  }
  console.log('OK: Agent-authored sentinel rejected');

  // Clean fake sentinel and rerun
  rmSync(resolve(sampleRuntimeDir, 'acceptance', 'accepted-sentinel.txt'), { force: true });

  const final2 = runInTmp('node', [resolve(ROOT, 'scripts', 'finalize-task.mjs'), '--task', 'SAMPLE-FE-001']);
  console.log(`Finalize (clean): exit ${final2.exitCode}`);
  console.log(final2.stdout);

  if (final2.stdout.includes('TASK_NOT_ACCEPTED') || !final2.stdout.includes('TASK_ACCEPTED')) {
    console.log('FAIL: Sample task was NOT accepted');
    process.exit(1);
  }
  console.log('\nSAMPLE FRONTEND TASK PASSED');

  // Cleanup
  rmSync(tmpDir, { recursive: true, force: true });
  if (existsSync(sampleRuntimeDir)) rmSync(sampleRuntimeDir, { recursive: true, force: true });
}

main().catch(e => { console.error(e); process.exit(1); });
