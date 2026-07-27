#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getRepositoryRoot, getGitCommonDir, getCurrentHead, getCurrentBranch, getRuntimeDir, ensureDir, computeHash, writeJSON, readJSON, appendLine } from './agent-control-lib/repository.mjs';
import { loadAndValidateSchema, validateAgainstSchema } from './agent-control-lib/schema-validator.mjs';
import { STATES, getDefaultState, transitionState, validateStateChain, computeStateHash } from './agent-control-lib/state-machine.mjs';

const _scriptDir = dirname(fileURLToPath(import.meta.url));

function loadManifestSchema() {
  return loadAndValidateSchema(resolve(_scriptDir, '..', 'agent-control/schemas/task-manifest.schema.json'));
}

function loadStateSchema() {
  return loadAndValidateSchema(resolve(_scriptDir, '..', 'agent-control/schemas/task-state.schema.json'));
}

async function cmdCreate(manifestPath, promptPath) {
  const root = getRepositoryRoot();
  const schema = loadManifestSchema();

  if (!existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }
  if (!existsSync(promptPath)) {
    console.error(`Prompt not found: ${promptPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const validation = validateAgainstSchema(manifest, schema);
  if (!validation.valid) {
    console.error('Manifest schema validation failed:');
    validation.errors.forEach(e => console.error(`  ${e}`));
    process.exit(1);
  }

  const taskId = manifest.taskId;
  const runtimeDir = getRuntimeDir(taskId);
  ensureDir(runtimeDir);

  const promptContent = readFileSync(promptPath, 'utf-8');
  const promptHash = computeHash(promptContent);

  if (manifest.originalPromptHash && manifest.originalPromptHash !== promptHash) {
    console.error('Original prompt hash mismatch');
    process.exit(1);
  }

  const { dirname: pDir } = await import('node:path');
  const ensureParent = (p) => { mkdirSync(pDir(p), { recursive: true }); };
  ensureParent(resolve(runtimeDir, 'original-prompt.md'));
  writeFileSync(resolve(runtimeDir, 'original-prompt.md'), promptContent, 'utf-8');
  ensureParent(resolve(runtimeDir, 'original-prompt.sha256'));
  writeFileSync(resolve(runtimeDir, 'original-prompt.sha256'), promptHash, 'utf-8');

  const manifestCanonical = JSON.stringify(manifest, Object.keys(manifest).sort(), 2);
  const manifestHash = computeHash(manifestCanonical);
  ensureParent(resolve(runtimeDir, 'task-manifest.json'));
  writeFileSync(resolve(runtimeDir, 'task-manifest.json'), manifestCanonical, 'utf-8');
  writeJSON(resolve(runtimeDir, 'task-manifest.lock.json'), {
    taskId,
    manifestHash,
    lockedAt: new Date().toISOString(),
    lockedBy: 'bootstrap-task.mjs',
  });

  const startingHead = getCurrentHead();
  const startingBranch = getCurrentBranch();

  const taskBranch = `task/${taskId}`;
  const worktreeParent = resolve(root, '..', '.steadfast-worktrees', basename(root), taskId).replace(/\\/g, '/');

  const state = getDefaultState(taskId, manifestHash, startingHead, worktreeParent, taskBranch);
  state.startingHead = startingHead;
  state.workingHead = startingHead;
  writeJSON(resolve(runtimeDir, 'task-state.json'), state);

  const genesisHash = state.previousStateHash;
  const historyEntry = {
    timestamp: state.lastTransitionAt,
    fromState: 'NONE',
    toState: STATES.CREATED,
    revision: 0,
    transitionBy: 'bootstrap-task.mjs',
    previousStateHash: genesisHash,
    stateHash: state.stateHash,
  };
  appendLine(resolve(runtimeDir, 'state-history.jsonl'), JSON.stringify(historyEntry));

  const registryPath = resolve(getGitCommonDir(), 'steadfast-agent-control', 'registry.json');
  const registry = readJSON(registryPath) || { tasks: [] };
  if (!registry.tasks.find(t => t.taskId === taskId)) {
    registry.tasks.push({ taskId, title: manifest.title, taskType: manifest.taskType, riskProfile: manifest.riskProfile, createdAt: new Date().toISOString(), state: 'CREATED' });
    writeJSON(registryPath, registry);
  }

  const resumeCmd = `node scripts/task-governor.mjs resume --task ${taskId}`;
  writeFileSync(resolve(runtimeDir, 'resume-command.txt'), resumeCmd, 'utf-8');

  console.log(`Task ${taskId} created.`);
  console.log(`Manifest hash: ${manifestHash}`);
  console.log(`Starting HEAD: ${startingHead}`);
  console.log(`Task branch: ${taskBranch}`);
  console.log(`Runtime dir: ${runtimeDir}`);
  console.log(`Resume command: ${resumeCmd}`);
}

async function cmdAdopt(taskId, promptPath, reportPath) {
  const root = getRepositoryRoot();

  if (!promptPath || !existsSync(promptPath)) {
    console.error('OWNER_INPUT_REQUIRED');
    console.error('Missing required input: original prompt file');
    console.error('Expected: --prompt <original-prompt-path>');
    process.exit(1);
  }
  if (!reportPath || !existsSync(reportPath)) {
    console.error('OWNER_INPUT_REQUIRED');
    console.error('Missing required input: final report file');
    console.error('Expected: --report <final-report-path>');
    process.exit(1);
  }

  const runtimeDir = getRuntimeDir(taskId);
  ensureDir(runtimeDir);

  const promptContent = readFileSync(promptPath, 'utf-8');
  const promptHash = computeHash(promptContent);
  writeFileSync(resolve(runtimeDir, 'original-prompt.md'), promptContent, 'utf-8');
  writeFileSync(resolve(runtimeDir, 'original-prompt.sha256'), promptHash, 'utf-8');

  const reportContent = readFileSync(reportPath, 'utf-8');
  const reportHash = computeHash(reportContent);
  writeFileSync(resolve(runtimeDir, 'reports', 'adopted-report.md'), reportContent, 'utf-8');

  const startingHead = getCurrentHead();
  const startingBranch = getCurrentBranch();

  const manifest = {
    schemaVersion: 1,
    controlPlaneVersion: '1.0.0',
    taskId,
    title: `Adopted: ${taskId}`,
    taskType: 'integration',
    riskProfile: 'MEDIUM',
    originalPromptPath: promptPath,
    originalPromptHash: promptHash,
    repositoryRoot: root,
    startingBranch,
    startingHead,
    createdAt: new Date().toISOString(),
    ownerAcceptanceCriteria: ['Complete task adoption through control plane'],
    taskOwnedPaths: [],
    allowedSharedDependencyPaths: [],
    forbiddenPaths: [],
    taskCommands: [],
    requiredTestCommands: [],
    requiredTestSuites: [],
    requiredTestFilePatterns: [],
    testConfigurationFiles: [],
    runtimeAcceptance: false,
    visualAcceptance: false,
    requiredThemes: [],
    requiredSurfaces: [],
    requiredViewports: [],
    requiredInteractionStates: [],
    requiredEvidenceKinds: [],
    expectedCommitMessage: '',
    acceptedSentinel: '',
    postCommitCommands: [],
    deploymentRequired: false,
    integrationAuthorized: false,
    baselinePolicy: {},
    warningPolicy: {},
    generatedOutputPolicy: {},
    browserPolicy: { required: false },
    backlogPolicy: {},
  };
  const manifestHash = computeHash(JSON.stringify(manifest));
  writeJSON(resolve(runtimeDir, 'task-manifest.json'), manifest);
  writeJSON(resolve(runtimeDir, 'task-manifest.lock.json'), {
    taskId,
    manifestHash,
    lockedAt: new Date().toISOString(),
    lockedBy: 'bootstrap-task.mjs adopt',
  });

  const state = getDefaultState(taskId, manifestHash, startingHead, '', startingBranch);
  state.currentState = STATES.OWNER_INPUT_REQUIRED;
  state.stateHash = computeStateHash(state);
  writeJSON(resolve(runtimeDir, 'task-state.json'), state);

  const resumeCmd = `node scripts/task-governor.mjs resume --task ${taskId}`;
  writeFileSync(resolve(runtimeDir, 'resume-command.txt'), resumeCmd, 'utf-8');

  console.log(`Task ${taskId} adopted with state OWNER_INPUT_REQUIRED.`);
  console.log(`Prompt hash: ${promptHash}`);
  console.log(`Report hash: ${reportHash}`);
  console.log(`Starting HEAD: ${startingHead}`);
  console.log(`Resume command: ${resumeCmd}`);
}

async function cmdRecoverBootstrap(taskId, promptPath, reportPath, manifestPath) {
  const runtimeDir = getRuntimeDir(taskId);
  ensureDir(runtimeDir);

  if (!promptPath || !existsSync(promptPath)) {
    console.error('OWNER_INPUT_REQUIRED');
    console.error('Missing required input: original prompt file');
    console.error('Expected: --prompt <original-prompt-path>');
    process.exit(1);
  }

  const promptContent = readFileSync(promptPath, 'utf-8');
  const promptHash = computeHash(promptContent);

  const recoveryDir = resolve(runtimeDir, 'recovery');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const recoveryRunDir = resolve(recoveryDir, `invalid-acceptance-${timestamp}`);
  ensureDir(recoveryRunDir);

  const existingState = readJSON(resolve(runtimeDir, 'task-state.json'));
  if (existingState && existingState.currentState === 'ACCEPTED' && existingState.acceptedSentinelHash) {
    const existingSentinelPath = resolve(runtimeDir, 'acceptance', 'accepted-sentinel.txt');
    if (existsSync(existingSentinelPath)) {
      const existingSentinel = readFileSync(existingSentinelPath, 'utf-8').trim();
      if (existingSentinel.includes('STEADFAST_AGENT_CONTROL_PLANE_READY') && existingState.manifestHash) {
        const chainCheck = validateStateChain(taskId);
        if (chainCheck.valid) {
          console.error('RECOVERY_REJECTED: Valid manifest-governed acceptance already exists');
          process.exit(1);
        }
      }
    }
  }

  if (existingState && existingState.currentState === 'ERROR_REPAIR') {
    const recoveryMarkerPath = resolve(recoveryDir, 'recovery-completed.marker');
    if (existsSync(recoveryMarkerPath)) {
      console.error('RECOVERY_REJECTED: Recovery already completed for this task');
      process.exit(1);
    }
  }

  if (existingState) {
    writeJSON(resolve(recoveryRunDir, 'previous-task-state.json'), existingState);
    const historyPath = resolve(runtimeDir, 'state-history.jsonl');
    if (existsSync(historyPath)) {
      const historyContent = readFileSync(historyPath, 'utf-8');
      writeFileSync(resolve(recoveryRunDir, 'previous-state-history.jsonl'), historyContent, 'utf-8');
    }
    const acceptanceRecordPath = resolve(runtimeDir, 'acceptance', 'acceptance-record.json');
    if (existsSync(acceptanceRecordPath)) {
      writeJSON(resolve(recoveryRunDir, 'previous-acceptance-record.json'), readJSON(acceptanceRecordPath));
    }
    const sentinelPath = resolve(runtimeDir, 'acceptance', 'accepted-sentinel.txt');
    if (existsSync(sentinelPath)) {
      writeFileSync(resolve(recoveryRunDir, 'previous-sentinel.txt'), readFileSync(sentinelPath, 'utf-8'), 'utf-8');
    }
  }

  const recoveryReason = {
    recoveredAt: new Date().toISOString(),
    taskId,
    promptHash,
    priorState: existingState?.currentState || 'NONE',
    priorManifestHash: existingState?.manifestHash || '',
    priorAcceptedSentinelHash: existingState?.acceptedSentinelHash || '',
    invalidAcceptanceReasons: [
      !existingState?.manifestHash ? 'MANIFEST_HASH_MISSING' : null,
      existingState?.acceptedSentinelHash === '' ? 'ACCEPTED_SENTINEL_HASH_MISSING' : null,
    ].filter(Boolean),
  };
  writeJSON(resolve(recoveryRunDir, 'recovery-reason.json'), recoveryReason);

  writeFileSync(resolve(runtimeDir, 'original-prompt.md'), promptContent, 'utf-8');
  writeFileSync(resolve(runtimeDir, 'original-prompt.sha256'), promptHash, 'utf-8');

  if (reportPath && existsSync(reportPath)) {
    const reportContent = readFileSync(reportPath, 'utf-8');
    ensureDir(resolve(runtimeDir, 'reports'));
    writeFileSync(resolve(runtimeDir, 'reports', 'adopted-report.md'), reportContent, 'utf-8');
  }

  if (!manifestPath || !existsSync(manifestPath)) {
    console.error('MANIFEST_REQUIRED: --manifest <bootstrap-manifest-source-path> required');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  if (manifest.taskId !== taskId) {
    console.error(`MANIFEST_TASK_ID_MISMATCH: manifest has ${manifest.taskId}, expected ${taskId}`);
    process.exit(1);
  }
  if (!manifest.acceptedSentinel || manifest.acceptedSentinel.length === 0) {
    console.error('MANIFEST_MISSING_SENTINEL: acceptedSentinel is required');
    process.exit(1);
  }

  manifest.originalPromptHash = promptHash;
  manifest.originalPromptPath = promptPath;
  const manifestCanonical = JSON.stringify(manifest, Object.keys(manifest).sort(), 2);
  const manifestHash = computeHash(manifestCanonical);

  writeFileSync(resolve(runtimeDir, 'task-manifest.json'), manifestCanonical, 'utf-8');
  writeJSON(resolve(runtimeDir, 'task-manifest.lock.json'), {
    taskId,
    manifestHash,
    lockedAt: new Date().toISOString(),
    lockedBy: 'bootstrap-task.mjs recover-bootstrap',
  });

  const registryPath = resolve(getGitCommonDir(), 'steadfast-agent-control', 'registry.json');
  const registry = readJSON(registryPath) || { tasks: [] };
  if (!registry.tasks.find(t => t.taskId === taskId)) {
    registry.tasks.push({
      taskId,
      title: manifest.title || taskId,
      taskType: manifest.taskType || 'governance',
      riskProfile: manifest.riskProfile || 'HIGH',
      createdAt: new Date().toISOString(),
      state: 'ERROR_REPAIR',
    });
    writeJSON(registryPath, registry);
  }

  const highestValidRevision = (existingState?.revision || 0);
  const startingHead = getCurrentHead();
  const startingBranch = getCurrentBranch();
  const newState = getDefaultState(taskId, manifestHash, startingHead, '', `task/${taskId}`);
  newState.revision = highestValidRevision + 1;
  newState.currentState = STATES.ERROR_REPAIR;
  newState.previousState = existingState?.currentState || 'CREATED';
  newState.resumeState = STATES.BASELINE_CAPTURE;
  newState.previousStateHash = existingState?.stateHash || crypto.createHash('sha256').update('genesis').digest('hex');
  newState.startingHead = startingHead;
  newState.workingHead = startingHead;
  newState.stateHash = computeStateHash(newState);

  writeJSON(resolve(runtimeDir, 'task-state.json'), newState);

  const historyRecord = {
    timestamp: new Date().toISOString(),
    fromState: existingState?.currentState || 'CREATED',
    toState: STATES.ERROR_REPAIR,
    revision: newState.revision,
    transitionBy: 'bootstrap-task.mjs recover-bootstrap',
    previousStateHash: newState.previousStateHash,
    stateHash: newState.stateHash,
  };
  appendLine(resolve(runtimeDir, 'state-history.jsonl'), JSON.stringify(historyRecord));

  writeFileSync(resolve(recoveryDir, 'recovery-completed.marker'), new Date().toISOString(), 'utf-8');

  const resumeCmd = `node scripts/task-governor.mjs resume --task ${taskId}`;
  writeFileSync(resolve(runtimeDir, 'resume-command.txt'), resumeCmd, 'utf-8');

  console.log(`RECOVERY_COMPLETED: ${taskId}`);
  console.log(`Manifest hash: ${manifestHash}`);
  console.log(`Prompt hash: ${promptHash}`);
  console.log(`New state: ERROR_REPAIR`);
  console.log(`Resume state: BASELINE_CAPTURE`);
  console.log(`Revision: ${newState.revision}`);
  console.log(`Resume command: ${resumeCmd}`);
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  if (!mode) {
    console.log('Usage:');
    console.log('  node scripts/bootstrap-task.mjs create --manifest <path> --prompt <path>');
    console.log('  node scripts/bootstrap-task.mjs adopt --task-id <id> --prompt <path> --report <path>');
    console.log('  node scripts/bootstrap-task.mjs recover-bootstrap --task-id <id> --prompt <path> --report <path> --manifest <path>');
    process.exit(1);
  }

  if (mode === 'create') {
    const manifestIdx = args.indexOf('--manifest');
    const promptIdx = args.indexOf('--prompt');
    if (manifestIdx < 0 || promptIdx < 0) {
      console.error('create requires --manifest and --prompt');
      process.exit(1);
    }
    cmdCreate(args[manifestIdx + 1], args[promptIdx + 1]);
  } else if (mode === 'adopt') {
    const taskIdx = args.indexOf('--task-id');
    const promptIdx = args.indexOf('--prompt');
    const reportIdx = args.indexOf('--report');
    if (taskIdx < 0 || promptIdx < 0 || reportIdx < 0) {
      console.error('adopt requires --task-id, --prompt, and --report');
      process.exit(1);
    }
    cmdAdopt(args[taskIdx + 1], args[promptIdx + 1], args[reportIdx + 1]);
  } else if (mode === 'recover-bootstrap') {
    const taskIdx = args.indexOf('--task-id');
    const promptIdx = args.indexOf('--prompt');
    const reportIdx = args.indexOf('--report');
    const manifestIdx = args.indexOf('--manifest');
    if (taskIdx < 0 || promptIdx < 0 || manifestIdx < 0) {
      console.error('recover-bootstrap requires --task-id, --prompt, and --manifest');
      process.exit(1);
    }
    cmdRecoverBootstrap(
      args[taskIdx + 1],
      args[promptIdx + 1],
      reportIdx >= 0 ? args[reportIdx + 1] : null,
      args[manifestIdx + 1]
    );
  }
}

main();
