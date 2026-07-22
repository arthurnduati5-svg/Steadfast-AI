#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = resolve(dirname(process.argv[1]), '../..');

const TEST_FILES = [
  'scripts/task-governor/tests/manifest-validator.test.mjs',
  'scripts/task-governor/tests/state-machine.test.mjs',
  'scripts/task-governor/tests/evidence-ledger.test.mjs',
  'scripts/task-governor/tests/process-runner.test.mjs',
  'scripts/task-governor/tests/workspace-guard.test.mjs',
  'scripts/task-governor/tests/test-inventory.test.mjs',
  'scripts/task-governor/tests/test-integrity-analyzer.test.mjs',
  'scripts/task-governor/tests/commit-guard.test.mjs',
  'scripts/task-governor/tests/finalizer.test.mjs',
  'scripts/task-governor/tests/governor-integration.test.mjs',
];

async function runTestFile(testPath) {
  const fullPath = resolve(ROOT, testPath);
  if (!existsSync(fullPath)) {
    return { file: testPath, passed: false, error: 'Test file not found', duration: 0 };
  }

  const start = Date.now();
  return new Promise((resolvePromise) => {
    const child = spawn('node', [fullPath], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, NODE_ENV: 'test' },
      timeout: 60000,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      const duration = Date.now() - start;
      resolvePromise({
        file: testPath,
        passed: code === 0,
        exitCode: code,
        stdout,
        stderr,
        duration,
      });
    });

    child.on('error', (err) => {
      resolvePromise({
        file: testPath,
        passed: false,
        error: err.message,
        duration: Date.now() - start,
      });
    });
  });
}

async function main() {
  console.log('=== Governor Test Runner ===');
  console.log(`Root: ${ROOT}`);
  console.log('');

  let passed = 0;
  let failed = 0;

  for (const testFile of TEST_FILES) {
    const result = await runTestFile(testFile);
    const icon = result.passed ? '✓' : '✗';
    const duration = result.duration > 0 ? ` (${result.duration}ms)` : '';
    console.log(`  ${icon} ${testFile}${duration}`);

    if (result.passed) {
      passed++;
    } else {
      failed++;
      if (result.error) {
        console.log(`       Error: ${result.error}`);
      }
      if (result.stderr) {
        const lines = result.stderr.split('\n').filter(l => l.trim());
        for (const line of lines.slice(0, 5)) {
          console.log(`       ${line}`);
        }
      }
    }
  }

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed, ${TEST_FILES.length} total`);
  return failed > 0 ? 1 : 0;
}

process.exit(await main());
