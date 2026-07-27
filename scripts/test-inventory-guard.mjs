#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { getRepositoryRoot, getRuntimeDir, getCurrentHead, ensureDir, computeHash, writeJSON, readJSON } from './agent-control-lib/repository.mjs';

function requireTaskId(args) {
  const idx = args.indexOf('--task');
  if (idx < 0) throw new Error('--task <task-id> required');
  return args[idx + 1];
}

function collectTestFiles(testPatterns, cwd) {
  const files = [];
  for (const pattern of testPatterns) {
    try {
      const result = execSync(`dir /s /b "${pattern}" 2>nul`, { cwd, encoding: 'utf-8', timeout: 10000 });
      files.push(...result.split('\n').map(l => l.trim()).filter(l => l));
    } catch { /* pattern may not match */ }
  }
  return [...new Set(files)];
}

function hashCommand(cmd) {
  return computeHash(cmd);
}

function captureInventory(taskId, testCommands, testPatterns, configFiles, cwd) {
  const runtimeDir = getRuntimeDir(taskId);
  ensureDir(resolve(runtimeDir, 'final'));

  const inventory = {
    taskId,
    capturedAt: new Date().toISOString(),
    head: getCurrentHead(),
    exactCommandHashes: testCommands.map(c => ({ command: c, hash: hashCommand(c) })),
    collectedTestFiles: collectTestFiles(testPatterns || ['**/*.test.*'], cwd),
    configurationHashes: {},
    testCount: 0,
    passCount: 0,
    failCount: 0,
    skipCount: 0,
    todoCount: 0,
    warningCount: 0,
    exitCode: 0,
  };

  if (configFiles) {
    for (const cf of configFiles) {
      const cfPath = resolve(cwd || getRepositoryRoot(), cf);
      if (existsSync(cfPath)) {
        inventory.configurationHashes[cf] = computeFileHash(cfPath);
      }
    }
  }

  return inventory;
}

function captureTestRun(taskId, testCommand, cwd) {
  const runtimeDir = getRuntimeDir(taskId);
  ensureDir(resolve(runtimeDir, 'evidence', 'tests'));

  const outPath = resolve(runtimeDir, 'evidence', 'tests', 'test-output.txt');
  const errPath = resolve(runtimeDir, 'evidence', 'tests', 'test-error.txt');

  const result = spawnSync('cmd', ['/c', testCommand], {
    cwd: cwd || getRepositoryRoot(),
    encoding: 'utf-8',
    timeout: 300000,
    maxBuffer: 10 * 1024 * 1024,
    shell: true,
  });

  writeFileSync(outPath, result.stdout || '', 'utf-8');
  writeFileSync(errPath, result.stderr || '', 'utf-8');

  const testCount = (result.stdout || '').match(/(\d+)\s+tests?\b/i);
  const passCount = (result.stdout || '').match(/(\d+)\s+passed?\b/i);
  const failCount = (result.stdout || '').match(/(\d+)\s+failed?\b/i);
  const skipCount = (result.stdout || '').match(/(\d+)\s+skipped?\b/i);
  const todoCount = (result.stdout || '').match(/(\d+)\s+todo\b/i);

  return {
    exitCode: result.status != null ? result.status : -1,
    stdoutPath: outPath,
    stderrPath: errPath,
    stdoutHash: computeHash(result.stdout || ''),
    stderrHash: computeHash(result.stderr || ''),
    testCount: testCount ? parseInt(testCount[1]) : 0,
    passCount: passCount ? parseInt(passCount[1]) : 0,
    failCount: failCount ? parseInt(failCount[1]) : 0,
    skipCount: skipCount ? parseInt(skipCount[1]) : 0,
    todoCount: todoCount ? parseInt(todoCount[1]) : 0,
  };
}

function compareInventories(baseline, final) {
  const errors = [];

  if (!baseline || !final) {
    return { valid: false, errors: ['Missing baseline or final inventory'] };
  }

  if (baseline.exactCommandHashes && final.exactCommandHashes) {
    for (const bCmd of baseline.exactCommandHashes) {
      const fCmd = final.exactCommandHashes.find(c => c.command === bCmd.command);
      if (!fCmd) {
        errors.push(`TEST_COMMAND_NARROWED: Command "${bCmd.command}" missing from final`);
      }
    }
  }

  const baselineFiles = baseline.collectedTestFiles || [];
  const finalFiles = final.collectedTestFiles || [];

  for (const bf of baselineFiles) {
    if (!finalFiles.includes(bf)) {
      errors.push(`TEST_FILE_DELETED: ${bf}`);
    }
  }

  const baselineTestCount = baseline.testCount || 0;
  const finalTestCount = final.testCount || 0;
  if (finalTestCount < baselineTestCount) {
    errors.push(`TEST_COUNT_DECREASED: ${baselineTestCount} -> ${finalTestCount}`);
  }

  if (final.failCount > 0) {
    errors.push(`TESTS_FAILED: ${final.failCount} failure(s)`);
  }

  if (final.skipCount > (baseline.skipCount || 0)) {
    errors.push(`TEST_SKIP_INTRODUCED: ${(baseline.skipCount || 0)} -> ${final.skipCount}`);
  }

  if ((final.skipCount || 0) > 0) {
    errors.push(`SKIPPED_TESTS_PRESENT: ${final.skipCount} skipped`);
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  node scripts/test-inventory-guard.mjs capture-baseline --task <task-id>');
    console.log('  node scripts/test-inventory-guard.mjs capture-final --task <task-id>');
    console.log('  node scripts/test-inventory-guard.mjs compare --task <task-id>');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'capture-baseline': {
        const taskId = requireTaskId(args);
        const manifest = readJSON(resolve(getRuntimeDir(taskId), 'task-manifest.json'));
        const inv = captureInventory(taskId, manifest?.requiredTestCommands || [], manifest?.requiredTestFilePatterns || [], manifest?.testConfigurationFiles || [], getRepositoryRoot());
        writeJSON(resolve(getRuntimeDir(taskId), 'baseline', 'test-inventory.json'), inv);
        console.log('Baseline test inventory captured.');
        break;
      }
      case 'capture-final': {
        const taskId = requireTaskId(args);
        const manifest = readJSON(resolve(getRuntimeDir(taskId), 'task-manifest.json'));
        const commands = manifest?.requiredTestCommands || [];
        if (commands.length === 0) {
          console.log('No test commands to run.');
          process.exit(0);
        }
        const runResult = captureTestRun(taskId, commands[0], getRepositoryRoot());
        const inv = captureInventory(taskId, commands, manifest?.requiredTestFilePatterns || [], manifest?.testConfigurationFiles || [], getRepositoryRoot());
        inv.exitCode = runResult.exitCode;
        inv.testCount = runResult.testCount;
        inv.passCount = runResult.passCount;
        inv.failCount = runResult.failCount;
        inv.skipCount = runResult.skipCount;
        inv.todoCount = runResult.todoCount;
        inv.outputEvidencePath = runResult.stdoutPath;
        writeJSON(resolve(getRuntimeDir(taskId), 'final', 'test-inventory.json'), inv);
        console.log('Final test inventory captured.');
        console.log(`Tests: ${inv.testCount}, Passed: ${inv.passCount}, Failed: ${inv.failCount}, Skipped: ${inv.skipCount}`);
        process.exit(inv.exitCode === 0 ? 0 : 1);
      }
      case 'compare': {
        const taskId = requireTaskId(args);
        const baseline = readJSON(resolve(getRuntimeDir(taskId), 'baseline', 'test-inventory.json'));
        const final = readJSON(resolve(getRuntimeDir(taskId), 'final', 'test-inventory.json'));
        const result = compareInventories(baseline, final);
        result.errors.forEach(e => console.error(`ERROR: ${e}`));
        console.log(`Valid: ${result.valid}`);
        console.log(`Errors: ${result.errors.length}`);
        process.exit(result.valid ? 0 : 1);
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
