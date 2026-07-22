import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { loadManifest } from './manifest-loader.mjs';
import { validateManifest } from './manifest-validator.mjs';
import { loadState, saveState, updateState } from './state-store.mjs';
import { isValidTransition, canExecuteState } from './state-machine.mjs';
import { runAndRecord, checkOutputForFailures } from './process-runner.mjs';
import { addRecord, verifyChain, getRecords, getLastRecord } from './evidence-ledger.mjs';
import { captureBaseline, checkWorkspace, getCurrentHead, getStatus, checkFinalWorkspace } from './workspace-guard.mjs';
import { captureInventory, compareInventories, loadInventory } from './test-inventory.mjs';
import { analyzeTestFiles } from './test-integrity-analyzer.mjs';
import { runAllScans } from './scan-runner.mjs';
import { STATES, WARNING_PATTERNS, EXIT_CODES, GATE_TYPES } from './constants.mjs';
import { GovernorError, FinalizationError, EvidenceIntegrityError } from './errors.mjs';
import { getRepositoryRoot, getGovernorRuntimeDir } from './repository-root.mjs';

export async function runGate(taskId, gateId) {
  const manifest = loadManifest(taskId);
  validateManifest(manifest);

  const gate = manifest.gates.find(g => g.id === gateId);
  if (!gate) {
    throw new GovernorError(`Gate not found: ${gateId}`, 11);
  }

  const state = loadState(taskId);
  if (!canExecuteState(state.currentState)) {
    throw new GovernorError(`Task is in terminal state: ${state.currentState}`, 10);
  }

  const headBefore = getCurrentHead();
  let gateResult;

  try {
    gateResult = await executeGate(gate, manifest, state, taskId);
  } catch (err) {
    gateResult = {
      passed: false,
      exitCode: err.exitCode || 1,
      error: err.message,
      duration: 0,
    };
  }

  const record = {
    taskId,
    gateId,
    stateBefore: state.currentState,
    stateAfter: gateResult.passed ? state.currentState : STATES.ERROR_REPAIR,
    headBefore,
    headAfter: getCurrentHead(),
    exitCode: gateResult.exitCode,
    duration: gateResult.duration,
    manifestHash: state.manifestHash,
    executable: gate.executable || null,
    args: gate.args || [],
    cwd: gate.cwd || null,
  };

  addRecord(record);

  if (!gateResult.passed && gate.required !== false) {
    updateState(taskId, {
      currentState: STATES.ERROR_REPAIR,
      lastFailedGateId: gateId,
      failedCommand: gate.executable,
      failedExitCode: gateResult.exitCode,
      repairAttempts: (state.repairAttempts || 0) + 1,
    });
  } else if (gateResult.passed) {
    updateState(taskId, {
      lastSuccessfulGateId: gateId,
      gateCompletion: {
        ...state.gateCompletion,
        [gateId]: true,
      },
    });
  }

  return {
    gateId,
    passed: gateResult.passed,
    exitCode: gateResult.exitCode,
    ...gateResult,
  };
}

async function executeGate(gate, manifest, state, taskId) {
  const type = gate.type || GATE_TYPES.COMMAND;

  switch (type) {
    case GATE_TYPES.COMMAND: {
      const result = await runAndRecord({
        executable: gate.executable,
        args: gate.args || [],
        cwd: gate.cwd || '.',
        timeoutMs: gate.timeoutMs || 300000,
        taskId,
        gateId: gate.id,
      });

      const passed = result.exitCode === 0 && !result.timedOut;

      const warnings = checkOutputForFailures(
        result.stdoutPath ? '' : '',
        result.stderrPath ? '' : '',
        WARNING_PATTERNS
      );

      return {
        passed,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        duration: result.duration,
        warnings,
        stdoutPath: result.stdoutPath,
        stderrPath: result.stderrPath,
      };
    }

    case GATE_TYPES.TEST_INVENTORY: {
      const suite = manifest.testInventories.find(s => s.id === gate.suiteId);
      if (!suite) throw new GovernorError(`Test suite not configured: ${gate.suiteId}`, 11);
      const inventory = await captureInventory(taskId, suite, manifest);
      const passed = inventory.failedCount === 0 && !inventory.todoCount > 0;
      return { passed, exitCode: passed ? 0 : 1, inventory };
    }

    case GATE_TYPES.TEST_INTEGRITY: {
      const results = analyzeTestFiles(manifest.scope.allowedPaths);
      const passed = results.length === 0;
      return { passed, exitCode: passed ? 0 : 1, integrityIssues: results };
    }

    case GATE_TYPES.WORKSPACE: {
      const baseline = captureBaseline(manifest.scope);
      const issues = checkWorkspace(manifest, baseline);
      const passed = issues.length === 0;
      return { passed, exitCode: passed ? 0 : 1, workspaceIssues: issues };
    }

    case GATE_TYPES.SCAN: {
      const scanResults = runAllScans(manifest.scope.allowedPaths);
      let totalIssues = 0;
      for (const [, issues] of Object.entries(scanResults)) {
        totalIssues += issues.length;
      }
      const passed = totalIssues === 0;
      return { passed, exitCode: passed ? 0 : 1, scanResults };
    }

    case GATE_TYPES.COMMIT: {
      return { passed: true, exitCode: 0 };
    }

    default:
      return { passed: false, exitCode: 1, error: `Unknown gate type: ${type}` };
  }
}

export async function verifyPostCommit(taskId) {
  const manifest = loadManifest(taskId);
  validateManifest(manifest);
  const state = loadState(taskId);
  verifyChain(taskId);

  const errors = [];

  const requiredGates = manifest.gates.filter(g => g.required !== false);
  for (const gate of requiredGates) {
    if (!state.gateCompletion[gate.id]) {
      errors.push(`Required gate not completed: ${gate.id}`);
    }
  }

  const currentHead = getCurrentHead();
  if (state.postCommitVerifiedHead && state.postCommitVerifiedHead === currentHead) {
    const status = getStatus();
    for (const file of status.unstaged) {
      if (manifest.scope.allowedPaths.some(a => file.startsWith(a))) {
        errors.push(`Code changed after post-commit verification: ${file}`);
      }
    }
  }

  if (manifest.acceptance && manifest.acceptance.requiredGateIds) {
    for (const gid of manifest.acceptance.requiredGateIds) {
      if (!state.gateCompletion[gid]) {
        errors.push(`Acceptance-required gate not completed: ${gid}`);
      }
    }
  }

  return errors;
}

export async function finalizeTask(taskId) {
  const manifest = loadManifest(taskId);
  validateManifest(manifest);

  const errors = [];

  try {
    verifyChain(taskId);
  } catch (e) {
    errors.push(`Evidence chain: ${e.message}`);
  }

  const state = loadState(taskId);

  if (state.currentState !== STATES.FINAL_REPOSITORY_PROOF && state.currentState !== STATES.ACCOUNTABILITY_COMMITTED) {
    errors.push(`State must be FINAL_REPOSITORY_PROOF or ACCOUNTABILITY_COMMITTED, current: ${state.currentState}`);
  }

  if (manifest.acceptance && manifest.acceptance.requiredGateIds) {
    for (const gid of manifest.acceptance.requiredGateIds) {
      if (!state.gateCompletion[gid]) {
        errors.push(`Acceptance-required gate not completed: ${gid}`);
      }
    }
  }

  if (manifest.todos) {
    for (const todo of manifest.todos) {
      if (!state.todoCompletion[todo.id]) {
        errors.push(`Todo not completed: ${todo.id}`);
      }
    }
  }

  const headBeforeFinalize = getCurrentHead();
  if (state.accountabilityCommitHash && state.accountabilityCommitHash !== headBeforeFinalize) {
    errors.push(`HEAD (${headBeforeFinalize}) does not match accountability commit (${state.accountabilityCommitHash})`);
  }

  if (state.implementationCommitHash) {
    const implCommit = state.implementationCommitHash;
  } else {
    errors.push('No implementation commit recorded');
  }

  const status = getStatus();
  if (status.staged.length > 0) {
    errors.push(`Staged files remain: ${status.staged.join(', ')}`);
  }

  for (const file of status.unstaged) {
    if (manifest.scope.allowedPaths.some(a => file.startsWith(a.replace(/\\/g, '/')))) {
      errors.push(`Task-allowed path not clean: ${file}`);
    }
  }

  for (const file of status.untracked) {
    if (manifest.scope.allowedPaths.some(a => file.startsWith(a.replace(/\\/g, '/')))) {
      errors.push(`Task-allowed path untracked: ${file}`);
    }
  }

  for (const file of status.deleted) {
    if (manifest.scope.allowedPaths.some(a => file.startsWith(a.replace(/\\/g, '/')))) {
      errors.push(`Task-allowed path deleted: ${file}`);
    }
  }

  if (manifest.testInventories) {
    for (const suite of manifest.testInventories) {
      const inventory = loadInventory(taskId, suite.id);
      if (!inventory) {
        errors.push(`No inventory captured for suite: ${suite.id}`);
        continue;
      }
      if (inventory.failedCount > 0) {
        errors.push(`Suite ${suite.id} has ${inventory.failedCount} failures`);
      }
      if (inventory.skippedCount > 0) {
        errors.push(`Suite ${suite.id} has ${inventory.skippedCount} skipped tests`);
      }
      if (inventory.todoCount > 0) {
        errors.push(`Suite ${suite.id} has ${inventory.todoCount} todo tests`);
      }
    }
  }

  const integrityIssues = analyzeTestFiles(manifest.scope.allowedPaths);
  for (const issue of integrityIssues) {
    errors.push(`Integrity issue: ${issue.ruleId} in ${issue.file}:${issue.line}`);
  }

  const accountabilityDoc = manifest.scope && manifest.scope.accountabilityDocument;
  if (accountabilityDoc) {
    const root = getRepositoryRoot();
    const docPath = resolve(root, accountabilityDoc);
    if (existsSync(docPath)) {
      const content = readFileSync(docPath, 'utf-8');
      if (content.includes(manifest.acceptance.sentinel)) {
        errors.push(`Handwritten sentinel found in accountability document: ${accountabilityDoc}`);
      }
    }
  }

  if (errors.length > 0) {
    return {
      accepted: false,
      errors,
      sentinel: null,
      receipt: null,
    };
  }

  const receipt = {
    taskId,
    finalHead: headBeforeFinalize,
    implementationCommit: state.implementationCommitHash,
    accountabilityCommit: state.accountabilityCommitHash,
    manifestHash: state.manifestHash,
    finalEvidenceHash: null,
    testInventorySummary: {},
    workspaceResult: 'clean',
    timestamp: new Date().toISOString(),
    sentinel: manifest.acceptance.sentinel,
  };

  const runtimeDir = getGovernorRuntimeDir(taskId);
  const receiptPath = `${runtimeDir}/final-receipt.json`;
  const receiptDir = dirname(receiptPath);
  if (!existsSync(receiptDir)) mkdirSync(receiptDir, { recursive: true });
  writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf-8');

  updateState(taskId, {
    currentState: STATES.ACCEPTED_READY,
  });

  return {
    accepted: true,
    errors: [],
    sentinel: manifest.acceptance.sentinel,
    receipt,
  };
}
