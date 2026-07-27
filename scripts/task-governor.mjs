#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { getRepositoryRoot, getRuntimeDir, getCurrentHead, ensureDir, computeHash, writeJSON, readJSON, appendLine } from './agent-control-lib/repository.mjs';
import { STATES, loadState, transitionState, recordFailure, resolveFailure, isValidTransition } from './agent-control-lib/state-machine.mjs';

function requireTaskId(args) {
  const idx = args.indexOf('--task');
  if (idx < 0) throw new Error('--task <task-id> required');
  return args[idx + 1];
}

function cmdStatus(taskId) {
  const state = loadState(taskId);
  if (!state) { console.log(`Task ${taskId}: NOT FOUND`); return; }
  console.log(`Task: ${taskId}`);
  console.log(`State: ${state.currentState}`);
  console.log(`Revision: ${state.revision}`);
  console.log(`Manifest hash: ${state.manifestHash}`);
  console.log(`Starting HEAD: ${state.startingHead}`);
  console.log(`Working HEAD: ${state.workingHead}`);
  console.log(`Active failures: ${state.activeFailureIds.length > 0 ? state.activeFailureIds.join(', ') : 'none'}`);
  console.log(`Last transition: ${state.lastTransitionAt}`);
  if (state.currentState === STATES.ACCEPTED) {
    console.log(`Accepted at: ${state.acceptedAt}`);
    console.log(`Accepted sentinel hash: ${state.acceptedSentinelHash}`);
  }
  if (state.currentState === STATES.OWNER_INPUT_REQUIRED) {
    console.log('Status: OWNER_INPUT_REQUIRED — owner input needed to continue');
  }
  if (state.currentState !== STATES.ACCEPTED) {
    console.log(`Next allowed action: advance --to <state>`);
  }
}

async function cmdAdvance(taskId, toState) {
  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);
  if (state.currentState === STATES.ACCEPTED) throw new Error('Cannot advance an accepted task');
  if (toState === STATES.ACCEPTED) throw new Error('Only finalize-task.mjs may transition to ACCEPTED');

  const newState = transitionState(taskId, toState, 'task-governor.mjs');
  console.log(`Task ${taskId}: ${state.currentState} -> ${toState}`);
  console.log(`Revision: ${newState.revision}`);
}

async function cmdFail(taskId, gateId, commandFile, returnState) {
  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);

  const failureId = `${taskId}-${gateId}-${Date.now()}`;
  const newState = recordFailure(taskId, failureId, state.currentState, returnState || state.currentState, commandFile || '', -1, '');

  const runtimeDir = getRuntimeDir(taskId);
  const failuresDir = resolve(runtimeDir, 'backlog');
  ensureDir(failuresDir);
  appendLine(resolve(failuresDir, 'discoveries.jsonl'), JSON.stringify({
    failureId,
    taskId,
    gateId,
    commandFile,
    returnState,
    timestamp: new Date().toISOString(),
  }));

  console.log(`FAILURE_RECORDED: ${failureId}`);
  console.log(`Task moved to ERROR_REPAIR. Resume state: ${newState.resumeState}`);
}

async function cmdResolve(taskId, failureId, evidencePath) {
  const newState = resolveFailure(taskId, failureId);
  if (!newState) throw new Error(`Failed to resolve failure ${failureId}`);
  console.log(`Failure ${failureId} resolved.`);
  console.log(`Active failures remaining: ${newState.activeFailureIds.length}`);
  if (newState.activeFailureIds.length === 0) {
    console.log(`Task returned to: ${newState.currentState}`);
  }
}

async function cmdRun(taskId, gateId, cwd, commandArgs) {
  if (!commandArgs || commandArgs.length === 0) throw new Error('No command specified');

  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);

  const runtimeDir = getRuntimeDir(taskId);
  const evidenceDir = resolve(runtimeDir, 'evidence', 'commands');
  ensureDir(evidenceDir);

  const startTime = new Date().toISOString();
  const stdoutPath = resolve(evidenceDir, `${gateId}-stdout.txt`);
  const stderrPath = resolve(evidenceDir, `${gateId}-stderr.txt`);

  const result = spawnSync(commandArgs[0], commandArgs.slice(1), {
    cwd: cwd || getRepositoryRoot(),
    encoding: 'utf-8',
    timeout: 300000,
    maxBuffer: 10 * 1024 * 1024,
  });

  const endTime = new Date().toISOString();
  writeFileSync(stdoutPath, result.stdout || '', 'utf-8');
  writeFileSync(stderrPath, result.stderr || '', 'utf-8');

  const evidenceId = `${taskId}-${gateId}-${Date.now()}`;
  const record = {
    evidenceId,
    taskId,
    gateId,
    evidenceKind: 'command-output',
    producerScript: 'task-governor.mjs run',
    command: commandArgs.join(' '),
    arguments: commandArgs,
    workingDirectory: cwd || getRepositoryRoot(),
    startedAt: startTime,
    completedAt: endTime,
    exitCode: result.status != null ? result.status : -1,
    stdoutPath,
    stdoutHash: computeHash(result.stdout || ''),
    stderrPath,
    stderrHash: computeHash(result.stderr || ''),
    referencedArtifacts: [],
    artifactHashes: {},
    warningCount: 0,
    failedAssertionCount: 0,
    result: result.status === 0 ? 'PASS' : 'FAIL',
    previousRecordHash: '',
    recordHash: '',
  };

  const ledgerPath = resolve(runtimeDir, 'evidence-ledger.jsonl');
  const records = existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf-8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l)) : [];
  const prevHash = records.length > 0 ? records[records.length - 1].recordHash : crypto.createHash('sha256').update('genesis').digest('hex');
  record.previousRecordHash = prevHash;
  record.recordHash = computeHash(JSON.stringify(record));
  appendLine(ledgerPath, JSON.stringify(record));

  console.log(`Gate: ${gateId}`);
  console.log(`Exit code: ${result.status}`);
  console.log(`Result: ${record.result}`);
  console.log(`Evidence ID: ${evidenceId}`);

  if (result.status !== 0 && gateId.startsWith('mandatory-')) {
    const failId = `${taskId}-${gateId}-${Date.now()}`;
    recordFailure(taskId, failId, state.currentState, state.currentState, commandArgs.join(' '), result.status, evidenceDir);
    console.log(`FAILURE_RECORDED: ${failId}`);
  }

  return result.status === 0 ? 0 : 1;
}

async function cmdStage(taskId, pathsFile) {
  if (!pathsFile || !existsSync(pathsFile)) throw new Error('--paths-file <path> required');

  const root = getRepositoryRoot();
  const paths = readFileSync(pathsFile, 'utf-8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  for (const p of paths) {
    if (p === '.' || p === '-A' || p === '--all') {
      throw new Error(`BROAD_STAGING_FORBIDDEN: ${p}`);
    }
  }

  const stagedPaths = [];
  for (const p of paths) {
    const fullPath = resolve(root, p);
    if (existsSync(fullPath)) {
      execSync(`git add "${fullPath}"`, { cwd: root, encoding: 'utf-8' });
      stagedPaths.push(p);
    } else {
      execSync(`git add "${p}"`, { cwd: root, encoding: 'utf-8', stdio: 'pipe' });
      stagedPaths.push(p);
    }
  }

  const indexHash = execSync('git write-tree', { cwd: root, encoding: 'utf-8' }).trim();
  const runtimeDir = getRuntimeDir(taskId);
  ensureDir(runtimeDir);

  const receipt = {
    taskId,
    stagedAt: new Date().toISOString(),
    stagedBy: 'task-governor.mjs stage',
    stagedPaths,
    indexTreeHash: indexHash,
    pathCount: stagedPaths.length,
  };

  writeJSON(resolve(runtimeDir, 'staging', 'staging-receipt.json'), receipt);
  console.log(`Staged ${stagedPaths.length} paths.`);
  console.log(`Index tree hash: ${indexHash}`);
  console.log('Staged paths:');
  stagedPaths.forEach(p => console.log(`  ${p}`));
}

function cmdReport(taskId) {
  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);

  const runtimeDir = getRuntimeDir(taskId);
  const report = {
    taskId,
    currentState: state.currentState,
    revision: state.revision,
    manifestHash: state.manifestHash,
    startingHead: state.startingHead,
    workingHead: state.workingHead,
    activeFailures: state.activeFailureIds,
    resolvedFailures: state.resolvedFailureIds,
    lastTransition: state.lastTransitionAt,
    hasWorkspaceEvidence: existsSync(resolve(runtimeDir, 'baseline', 'git-status.json')),
    hasEvidenceLedger: existsSync(resolve(runtimeDir, 'evidence-ledger.jsonl')),
    hasStagingReceipt: existsSync(resolve(runtimeDir, 'staging', 'staging-receipt.json')),
    hasCommitVerification: existsSync(resolve(runtimeDir, 'commits', 'commit-verification.json')),
    hasPostCommitVerification: existsSync(resolve(runtimeDir, 'post-commit', 'verification.json')),
    accepted: state.currentState === STATES.ACCEPTED,
  };

  console.log(JSON.stringify(report, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Steadfast Agent Execution Control Plane — Task Governor');
    console.log('');
    console.log('Commands:');
    console.log('  status --task <task-id>');
    console.log('  advance --task <task-id> --to <state>');
    console.log('  fail --task <task-id> --gate <gate-id> --command-file <path> --return-state <state>');
    console.log('  resolve --task <task-id> --failure <failure-id> --evidence <path>');
    console.log('  run --task <task-id> --gate <gate-id> --cwd <path> -- <command...>');
    console.log('  stage --task <task-id> --paths-file <path>');
    console.log('  report --task <task-id>');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'status': {
        const taskId = requireTaskId(args);
        cmdStatus(taskId);
        break;
      }
      case 'advance': {
        const taskId = requireTaskId(args);
        const toIdx = args.indexOf('--to');
        if (toIdx < 0) throw new Error('--to <state> required');
        await cmdAdvance(taskId, args[toIdx + 1]);
        break;
      }
      case 'fail': {
        const taskId = requireTaskId(args);
        const gateIdx = args.indexOf('--gate');
        const fileIdx = args.indexOf('--command-file');
        const returnIdx = args.indexOf('--return-state');
        await cmdFail(taskId, gateIdx >= 0 ? args[gateIdx + 1] : 'unknown', fileIdx >= 0 ? args[fileIdx + 1] : null, returnIdx >= 0 ? args[returnIdx + 1] : null);
        break;
      }
      case 'resolve': {
        const taskId = requireTaskId(args);
        const failIdx = args.indexOf('--failure');
        const evIdx = args.indexOf('--evidence');
        if (failIdx < 0) throw new Error('--failure <failure-id> required');
        await cmdResolve(taskId, args[failIdx + 1], evIdx >= 0 ? args[evIdx + 1] : '');
        break;
      }
      case 'run': {
        const taskId = requireTaskId(args);
        const gateIdx = args.indexOf('--gate');
        const cwdIdx = args.indexOf('--cwd');
        const dashIdx = args.indexOf('--');
        if (gateIdx < 0) throw new Error('--gate <gate-id> required');
        if (dashIdx < 0) throw new Error('-- <command> required');
        const cwd = cwdIdx >= 0 ? args[cwdIdx + 1] : null;
        const commandArgs = args.slice(dashIdx + 1);
        await cmdRun(taskId, args[gateIdx + 1], cwd, commandArgs);
        break;
      }
      case 'stage': {
        const taskId = requireTaskId(args);
        const pathIdx = args.indexOf('--paths-file');
        if (pathIdx < 0) throw new Error('--paths-file <path> required');
        await cmdStage(taskId, args[pathIdx + 1]);
        break;
      }
      case 'report': {
        const taskId = requireTaskId(args);
        cmdReport(taskId);
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}

main();
