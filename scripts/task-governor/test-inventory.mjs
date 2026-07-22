import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getRepositoryRoot, getGovernorRuntimeDir } from './repository-root.mjs';
import { runCommand } from './process-runner.mjs';
import { TestInventoryError } from './errors.mjs';

function ensureDir(p) {
  const d = dirname(p);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

export async function captureInventory(taskId, suite, manifest) {
  const runtimeDir = getGovernorRuntimeDir(taskId);
  const inventoryPath = `${runtimeDir}/inventories/${suite.id}.json`;
  ensureDir(inventoryPath);

  const tmpJsonPath = `${runtimeDir}/inventories/${suite.id}-tmp.json`;
  const args = [...suite.args];
  const jsonIndex = args.indexOf('--reporter=verbose');
  if (jsonIndex >= 0) {
    args[jsonIndex] = `--reporter=json`;
  } else {
    args.push('--reporter=json');
  }
  if (!args.includes('--outputFile')) {
    args.push('--outputFile', tmpJsonPath);
  }

  const result = await runCommand({
    executable: suite.executable,
    args,
    cwd: suite.cwd || '.',
    timeoutMs: suite.timeoutMs || 300000,
    taskId,
  });

  let jsonData;
  if (existsSync(tmpJsonPath)) {
    try {
      jsonData = JSON.parse(readFileSync(tmpJsonPath, 'utf-8'));
    } catch {
      jsonData = null;
    }
  }

  if (!jsonData) {
    try {
      jsonData = JSON.parse(result.stdout);
    } catch {
      jsonData = null;
    }
  }

  if (!jsonData) {
    throw new TestInventoryError(`Cannot parse Vitest JSON output for suite ${suite.id}`);
  }

  const inventory = parseVitestJson(jsonData, suite.id, suite.cwd);
  writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2), 'utf-8');

  return inventory;
}

function parseVitestJson(json, suiteId, suiteCwd) {
  const root = getRepositoryRoot();

  const testFiles = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalTodo = 0;

  if (json.testResults && Array.isArray(json.testResults)) {
    for (const fileResult of json.testResults) {
      let normalizedPath = fileResult.name || fileResult.filePath || '';
      normalizedPath = normalizedPath.replace(/\\/g, '/');
      if (normalizedPath.startsWith(root.replace(/\\/g, '/') + '/')) {
        normalizedPath = normalizedPath.slice(root.length + 1);
      }

      const testNames = [];
      if (fileResult.assertionResults && Array.isArray(fileResult.assertionResults)) {
        for (const assertion of fileResult.assertionResults) {
          const fullName = assertion.fullName || assertion.title || '';
          testNames.push({
            fullName,
            status: assertion.status || 'unknown',
          });
          totalTests++;
          if (assertion.status === 'passed') totalPassed++;
          else if (assertion.status === 'failed') totalFailed++;
          else if (assertion.status === 'skipped' || assertion.status === 'pending') totalSkipped++;
          else if (assertion.status === 'todo') totalTodo++;
        }
      }

      testFiles.push({
        file: normalizedPath,
        testNames,
        filePassed: totalFailed === 0,
      });
    }
  } else if (json.numTotalTests !== undefined) {
    totalTests = json.numTotalTests || 0;
    totalPassed = json.numPassedTests || 0;
    totalFailed = json.numFailedTests || 0;
    totalSkipped = json.numPendingTests || 0;
    totalTodo = json.numTodoTests || 0;

    if (json.numTotalTestSuites !== undefined) {
    }
  }

  return {
    suiteId,
    suiteCwd: suiteCwd || '.',
    numTotalTestSuites: json.numTotalTestSuites || testFiles.length,
    numPassedTestSuites: json.numPassedTestSuites || 0,
    numFailedTestSuites: json.numFailedTestSuites || 0,
    testFiles,
    fileCount: testFiles.length,
    testCount: totalTests,
    passedCount: totalPassed,
    failedCount: totalFailed,
    skippedCount: totalSkipped,
    todoCount: totalTodo,
    numTotalTests: totalTests,
    numPassedTests: totalPassed,
    numFailedTests: totalFailed,
    numPendingTests: totalSkipped,
    numTodoTests: totalTodo,
    success: json.success !== undefined ? json.success : (totalFailed === 0),
    timestamp: new Date().toISOString(),
  };
}

export function loadInventory(taskId, suiteId) {
  const runtimeDir = getGovernorRuntimeDir(taskId);
  const inventoryPath = `${runtimeDir}/inventories/${suiteId}.json`;
  if (!existsSync(inventoryPath)) return null;
  return JSON.parse(readFileSync(inventoryPath, 'utf-8'));
}

export function compareInventories(baseline, current, renameMap = {}) {
  const errors = [];

  if (!baseline || !current) {
    return ['Missing inventory for comparison'];
  }

  if (current.failedCount > 0) {
    errors.push(`Suite ${current.suiteId}: ${current.failedCount} failed tests`);
  }

  if (current.skippedCount > 0) {
    errors.push(`Suite ${current.suiteId}: ${current.skippedCount} skipped tests`);
  }

  if (current.todoCount > 0) {
    errors.push(`Suite ${current.suiteId}: ${current.todoCount} todo/pending tests`);
  }

  const baselineFiles = new Map();
  for (const f of baseline.testFiles) {
    const mapped = renameMap[f.file] || f.file;
    baselineFiles.set(mapped, new Set(f.testNames.map(t => t.fullName)));
  }

  const currentFiles = new Map();
  for (const f of current.testFiles) {
    currentFiles.set(f.file, new Set(f.testNames.map(t => t.fullName)));
  }

  for (const [file, tests] of baselineFiles) {
    if (!currentFiles.has(file)) {
      errors.push(`Baseline test file disappeared: ${file}`);
    } else {
      const currentTests = currentFiles.get(file);
      for (const testName of tests) {
        if (!currentTests.has(testName)) {
          errors.push(`Baseline test name disappeared: ${testName} in ${file}`);
        }
      }
    }
  }

  return errors;
}
