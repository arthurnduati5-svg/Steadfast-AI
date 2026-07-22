#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { getRepositoryRoot, getGovernorRuntimeDir, getGitDir } from './task-governor/repository-root.mjs';
import { loadManifest } from './task-governor/manifest-loader.mjs';
import { validateManifest } from './task-governor/manifest-validator.mjs';
import { loadState, updateState, saveState, getDefaultState } from './task-governor/state-store.mjs';
import { STATES, EXIT_CODES } from './task-governor/constants.mjs';
import { runGate, verifyPostCommit, finalizeTask } from './task-governor/gate-runner.mjs';
import { verifyChain, getRecords, getLastRecord } from './task-governor/evidence-ledger.mjs';
import { captureBaseline, getCurrentHead, getStatus, checkWorkspace } from './task-governor/workspace-guard.mjs';
import { prepareCommit, recordImplementationCommit, recordAccountabilityCommit } from './task-governor/commit-guard.mjs';
import { formatStatus, formatStatusJson, formatExplain } from './task-governor/output-format.mjs';
import { runAllScans } from './task-governor/scan-runner.mjs';
import { analyzeTestFiles } from './task-governor/test-integrity-analyzer.mjs';
import { GovernorError } from './task-governor/errors.mjs';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('One-Shot Acceptance Governor');
    console.log('Usage: node scripts/task-governor.mjs <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  doctor                          Verify governor installation');
    console.log('  validate <task-id>               Validate task manifest');
    console.log('  bootstrap <task-id>              Bootstrap a task (capture baseline)');
    console.log('  status <task-id>                 Show task status');
    console.log('  status <task-id> --json          Show task status as JSON');
    console.log('  resume <task-id>                 Show next required action');
    console.log('  run-gate <task-id> <gate-id>     Run a specific gate');
    console.log('  verify-todo <task-id> <todo-id>  Verify a todo is complete');
    console.log('  prepare-commit <task-id>         Validate staging for commit');
    console.log('  record-implementation-commit <task-id>  Record an implementation commit');
    console.log('  verify-post-commit <task-id>     Run post-commit verification');
    console.log('  record-accountability-commit <task-id>  Record an accountability commit');
    console.log('  finalize <task-id>               Finalize and accept the task');
    console.log('  explain <task-id>                Show detailed task explanation');
    return 0;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'doctor':
        return await cmdDoctor();
      case 'validate':
        return await cmdValidate(args[1]);
      case 'bootstrap':
        return await cmdBootstrap(args[1]);
      case 'status':
        if (args[2] === '--json') {
          return await cmdStatus(args[1], true);
        }
        return await cmdStatus(args[1], false);
      case 'resume':
        return await cmdResume(args[1]);
      case 'run-gate':
        return await cmdRunGate(args[1], args[2]);
      case 'verify-todo':
        return await cmdVerifyTodo(args[1], args[2]);
      case 'prepare-commit':
        return await cmdPrepareCommit(args[1]);
      case 'record-implementation-commit':
        return await cmdRecordImplCommit(args[1]);
      case 'verify-post-commit':
        return await cmdVerifyPostCommit(args[1]);
      case 'record-accountability-commit':
        return await cmdRecordAccCommit(args[1]);
      case 'finalize':
        return await cmdFinalize(args[1]);
      case 'explain':
        return await cmdExplain(args[1]);
      default:
        console.error(`Unknown command: ${command}`);
        return 1;
    }
  } catch (err) {
    if (err instanceof GovernorError) {
      console.error(`ERROR [${err.exitCode}]: ${err.message}`);
      return err.exitCode;
    }
    console.error(`UNEXPECTED ERROR: ${err.message}`);
    console.error(err.stack);
    return 1;
  }
}

async function cmdDoctor() {
  const checks = [];

  try {
    const root = getRepositoryRoot();
    checks.push({ name: 'Repository root', ok: !!root, detail: root });
  } catch (e) {
    checks.push({ name: 'Repository root', ok: false, detail: e.message });
  }

  try {
    const gitDir = getGitDir();
    checks.push({ name: 'Git directory', ok: !!gitDir, detail: gitDir });
  } catch (e) {
    checks.push({ name: 'Git directory', ok: false, detail: e.message });
  }

  const requiredModules = [
    'repository-root.mjs', 'constants.mjs', 'errors.mjs',
    'manifest-loader.mjs', 'manifest-validator.mjs', 'state-machine.mjs',
    'state-store.mjs', 'evidence-ledger.mjs', 'workspace-guard.mjs',
    'process-runner.mjs', 'test-inventory.mjs', 'test-integrity-analyzer.mjs',
    'scan-runner.mjs', 'gate-runner.mjs', 'commit-guard.mjs',
    'finalizer.mjs', 'output-format.mjs',
  ];

  for (const mod of requiredModules) {
    const modPath = resolve(getRepositoryRoot(), 'scripts/task-governor', mod);
    checks.push({
      name: `Module: ${mod}`,
      ok: existsSync(modPath),
      detail: modPath,
    });
  }

  const manifestSchemaPath = resolve(getRepositoryRoot(), '.task-governor/schemas/task-manifest.schema.json');
  checks.push({
    name: 'Manifest schema',
    ok: existsSync(manifestSchemaPath),
    detail: manifestSchemaPath,
  });

  console.log('=== One-Shot Acceptance Governor Doctor ===');
  console.log('');
  for (const check of checks) {
    const icon = check.ok ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}`);
    if (check.detail) console.log(`       ${check.detail}`);
  }

  const allPassed = checks.every(c => c.ok);
  console.log('');
  console.log(allPassed ? 'STATUS: OPERATIONAL' : 'STATUS: ISSUES DETECTED');

  return allPassed ? 0 : 1;
}

async function cmdValidate(taskId) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs validate <task-id>');
    return 1;
  }
  const manifest = loadManifest(taskId);
  validateManifest(manifest);
  console.log(`Manifest "${taskId}" is valid.`);
  return 0;
}

async function cmdBootstrap(taskId) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs bootstrap <task-id>');
    return 1;
  }

  const manifest = loadManifest(taskId);
  validateManifest(manifest);

  const state = getDefaultState(taskId);
  state.currentHead = getCurrentHead();

  const baseline = captureBaseline(manifest.scope);
  const runtimeDir = getGovernorRuntimeDir(taskId);
  const baselinePath = `${runtimeDir}/baseline-workspace.json`;
  const baseDir = dirname(baselinePath);
  if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true });
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), 'utf-8');

  state.baselineCaptured = true;
  state.currentState = STATES.IMPLEMENTING;
  saveState(state);

  console.log(`Task "${taskId}" bootstrapped.`);
  console.log(`State: ${state.currentState}`);
  console.log(`Starting HEAD: ${state.currentHead}`);
  console.log(`Baseline saved to: ${baselinePath}`);

  return 0;
}

async function cmdStatus(taskId, json) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs status <task-id> [--json]');
    return 1;
  }

  const manifest = loadManifest(taskId);
  validateManifest(manifest);
  const state = loadState(taskId);
  const gates = manifest.gates || [];
  const todos = manifest.todos || [];

  if (json) {
    console.log(formatStatusJson(taskId, state, manifest));
  } else {
    console.log(formatStatus(taskId, state, manifest, gates, todos));
  }

  if (state.currentState === STATES.ACCEPTED_READY) {
    return 0;
  }
  if (state.currentState === STATES.BLOCKED) {
    return EXIT_CODES.EXTERNAL_BLOCKER;
  }
  if (state.currentState === STATES.ERROR_REPAIR) {
    return EXIT_CODES.ERROR_REPAIR_LOCKED;
  }
  return 0;
}

async function cmdResume(taskId) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs resume <task-id>');
    return 1;
  }

  const manifest = loadManifest(taskId);
  validateManifest(manifest);
  const state = loadState(taskId);

  try {
    verifyChain(taskId);
  } catch (e) {
    console.error(`WARNING: ${e.message}`);
  }

  console.log(formatStatus(taskId, state, manifest, manifest.gates || [], manifest.todos || []));

  if (state.currentState === STATES.ACCEPTED_READY) return 0;
  if (state.currentState === STATES.BLOCKED) return EXIT_CODES.EXTERNAL_BLOCKER;

  return state.currentState === STATES.ERROR_REPAIR ? EXIT_CODES.ERROR_REPAIR_LOCKED : 0;
}

async function cmdRunGate(taskId, gateId) {
  if (!taskId || !gateId) {
    console.error('Usage: node scripts/task-governor.mjs run-gate <task-id> <gate-id>');
    return 1;
  }

  const result = await runGate(taskId, gateId);
  console.log(`Gate: ${result.gateId}`);
  console.log(`Result: ${result.passed ? 'PASSED' : 'FAILED'}`);
  console.log(`Exit code: ${result.exitCode}`);

  if (result.warnings && result.warnings.length > 0) {
    console.log('Warnings:');
    for (const w of result.warnings) {
      console.log(`  - ${w.pattern} at position ${w.index}`);
    }
  }

  if (result.workspaceIssues && result.workspaceIssues.length > 0) {
    console.log('Workspace issues:');
    for (const issue of result.workspaceIssues) {
      console.log(`  - ${issue}`);
    }
  }

  if (result.integrityIssues && result.integrityIssues.length > 0) {
    console.log('Integrity issues:');
    for (const issue of result.integrityIssues) {
      console.log(`  - [${issue.ruleId}] ${issue.file}:${issue.line} — ${issue.excerpt}`);
    }
  }

  if (result.scanResults) {
    let totalIssues = 0;
    for (const [, issues] of Object.entries(result.scanResults)) {
      totalIssues += issues.length;
    }
    console.log(`Scan issues found: ${totalIssues}`);
  }

  return result.passed ? 0 : 1;
}

async function cmdVerifyTodo(taskId, todoId) {
  if (!taskId || !todoId) {
    console.error('Usage: node scripts/task-governor.mjs verify-todo <task-id> <todo-id>');
    return 1;
  }

  const manifest = loadManifest(taskId);
  validateManifest(manifest);
  const state = loadState(taskId);

  const todo = manifest.todos.find(t => t.id === todoId);
  if (!todo) {
    console.error(`Todo not found: ${todoId}`);
    return 1;
  }

  if (todo.dependsOn && todo.dependsOn.length > 0) {
    for (const dep of todo.dependsOn) {
      if (!state.todoCompletion[dep]) {
        console.error(`Dependency not satisfied: ${dep} must be completed before ${todoId}`);
        return 1;
      }
    }
  }

  updateState(taskId, {
    todoCompletion: { ...state.todoCompletion, [todoId]: true },
    currentTodoId: todoId,
  });

  console.log(`Todo "${todoId}" verified complete.`);
  return 0;
}

async function cmdPrepareCommit(taskId) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs prepare-commit <task-id>');
    return 1;
  }

  const result = prepareCommit(taskId);
  console.log(`Staged files: ${result.stagedCount}`);
  for (const file of result.stagedFiles) {
    console.log(`  ${file}`);
  }
  console.log('Prepare-commit passed.');
  return 0;
}

async function cmdRecordImplCommit(taskId) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs record-implementation-commit <task-id>');
    return 1;
  }

  const result = recordImplementationCommit(taskId);
  console.log(`Implementation commit: ${result.implementationCommitHash}`);
  return 0;
}

async function cmdVerifyPostCommit(taskId) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs verify-post-commit <task-id>');
    return 1;
  }

  const errors = await verifyPostCommit(taskId);
  if (errors.length === 0) {
    console.log('Post-commit verification passed.');
    return 0;
  }

  console.log('Post-commit verification FAILED:');
  for (const err of errors) {
    console.log(`  - ${err}`);
  }
  return 1;
}

async function cmdRecordAccCommit(taskId) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs record-accountability-commit <task-id>');
    return 1;
  }

  const result = recordAccountabilityCommit(taskId);
  console.log(`Accountability commit: ${result.accountabilityCommitHash}`);
  return 0;
}

async function cmdFinalize(taskId) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs finalize <task-id>');
    return 1;
  }

  const result = await finalizeTask(taskId);

  if (!result.accepted) {
    console.log('TASK_NOT_ACCEPTED');
    console.log(`TASK_ID=${taskId}`);
    const state = loadState(taskId);
    console.log(`STATE=${state.currentState}`);
    if (result.errors.length > 0) {
      console.log(`FAILED_GATE=${result.errors[0].split(':')[0] || 'finalize'}`);
      console.log(`FAILURE_REASON=${result.errors[0]}`);
    }
    console.log('NEXT_REQUIRED_ACTION=Repair the first failed gate and rerun finalize');
    return EXIT_CODES.FINALIZATION_NOT_PERMITTED;
  }

  console.log(`TASK_ACCEPTED: ${taskId}`);
  console.log(`FINAL_HEAD: ${result.receipt.finalHead}`);
  console.log(`IMPLEMENTATION_COMMIT: ${result.receipt.implementationCommit}`);
  console.log(`ACCOUNTABILITY_COMMIT: ${result.receipt.accountabilityCommit}`);

  if (result.sentinel) {
    console.log(result.sentinel);
  }

  return 0;
}

async function cmdExplain(taskId) {
  if (!taskId) {
    console.error('Usage: node scripts/task-governor.mjs explain <task-id>');
    return 1;
  }

  const manifest = loadManifest(taskId);
  validateManifest(manifest);
  const state = loadState(taskId);
  const gates = manifest.gates || [];
  const todos = manifest.todos || [];

  console.log(formatExplain(state, manifest, gates, todos));
  return 0;
}

process.exit(await main());
