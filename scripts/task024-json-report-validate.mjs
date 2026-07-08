#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, 'reports/task-024-operations-readiness-v1.json');

let passed = true;

if (!existsSync(REPORT_PATH)) {
  console.error('MISSING: reports/task-024-operations-readiness-v1.json');
  process.exit(1);
}

try {
  const raw = readFileSync(REPORT_PATH, 'utf-8');
  const report = JSON.parse(raw);

  const requiredKeys = [
    'taskId', 'scope', 'verdict', 'testsPassedCount', 'commandsRun',
    'filesCreated', 'filesModified', 'task024FocusedTestsPassed',
    'fullBackendSuiteRun', 'fullBackendSuitePassed',
    'backendBuildPassed', 'backendTypecheckPassed',
    'safeToStartTask025', 'noLiveAiCallIntroduced',
    'noLiveSchoolConnectorIntroduced', 'realBackupExecuted', 'realRestoreExecuted',
  ];

  for (const key of requiredKeys) {
    if (!(key in report)) {
      console.error(`MISSING KEY in report: ${key}`);
      passed = false;
    }
  }

  if (report.verdict === 'ACCEPTED_READY_YES' && !report.safeToStartTask025) {
    console.error('CONTRADICTION: verdict ACCEPTED_READY_YES but safeToStartTask025 is false');
    passed = false;
  }

  if (report.realBackupExecuted) {
    console.error('CONTRADICTION: realBackupExecuted is true');
    passed = false;
  }

  if (report.realRestoreExecuted) {
    console.error('CONTRADICTION: realRestoreExecuted is true');
    passed = false;
  }

  if (report.noLiveAiCallIntroduced === false) {
    console.error('CONTRADICTION: noLiveAiCallIntroduced is false');
    passed = false;
  }

  console.log(`Report taskId: ${report.taskId}`);
  console.log(`Report verdict: ${report.verdict}`);
  console.log(`Tests passed count: ${report.testsPassedCount}`);
  console.log(`Commands run: ${report.commandsRun?.length || 0}`);
} catch (err) {
  console.error(`FAILED to parse report: ${err.message}`);
  passed = false;
}

if (passed) {
  console.log('\nJSON REPORT VALIDATION PASSED');
  process.exit(0);
} else {
  console.error('\nJSON REPORT VALIDATION FAILED');
  process.exit(1);
}
