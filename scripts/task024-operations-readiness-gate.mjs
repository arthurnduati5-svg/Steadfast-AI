#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, 'reports/task-024-operations-readiness-v1.json');
const DOCS_DIR = join(ROOT, 'docs/architecture');

const REQUIRED_DOCS = [
  'TASK_024_OPERATIONS_READINESS_RUNTIME.md',
  'TASK_024_PRODUCTION_MONITORING_AND_ALERTING.md',
  'TASK_024_INCIDENT_RESPONSE_WORKFLOW.md',
  'TASK_024_INCIDENT_SEVERITY_ESCALATION.md',
  'TASK_024_BACKUP_READINESS.md',
  'TASK_024_RESTORE_DRILL_DRY_RUN.md',
  'TASK_024_OPERATIONAL_DATA_INTEGRITY.md',
  'TASK_024_OPERATIONS_PRIVACY_GUARD.md',
  'TASK_024_SAFE_OPERATIONS_SUMMARIES.md',
  'TASK_024_LOAD_SIMULATION_AND_PERFORMANCE_BASELINE.md',
  'TASK_024_TASK023_DEPLOYMENT_READINESS_DEPENDENCY.md',
  'TASK_024_GOVERNANCE_GATE_CONTINUITY.md',
  'TASK_024_OPERATIONS_RUNBOOK.md',
];

let passed = true;
let warnings = [];

console.log('=== TASK 024 OPERATIONS READINESS GATE ===\n');

for (const doc of REQUIRED_DOCS) {
  const docPath = join(DOCS_DIR, doc);
  if (existsSync(docPath)) {
    console.log(`✓ DOC: ${doc}`);
  } else {
    console.error(`✗ MISSING DOC: ${doc}`);
    passed = false;
  }
}

if (!existsSync(REPORT_PATH)) {
  console.error('\n✗ MISSING REPORT: reports/task-024-operations-readiness-v1.json');
  passed = false;
} else {
  console.log('\n✓ REPORT: reports/task-024-operations-readiness-v1.json exists');
  try {
    const report = JSON.parse(readFileSync(REPORT_PATH, 'utf-8'));
    console.log(`  Verdict: ${report.verdict}`);
    if (report.verdict !== 'ACCEPTED_READY_YES') {
      console.error(`  Report verdict is not ACCEPTED_READY_YES: ${report.verdict}`);
      passed = false;
    }
    if (report.task025StartedByThisTask) {
      console.error('  Task 025 was started by this task - not allowed');
      passed = false;
    }
    if (report.liveDeploymentIntroduced) {
      console.error('  Live deployment was introduced - not allowed');
      passed = false;
    }
    if (report.realBackupExecuted) {
      console.error('  Real backup was executed - not allowed');
      passed = false;
    }
    if (report.realRestoreExecuted) {
      console.error('  Real restore was executed - not allowed');
      passed = false;
    }
  } catch (err) {
    console.error(`  Failed to parse report: ${err.message}`);
    passed = false;
  }
}

console.log('\n=== GATE SUMMARY ===');
if (passed) {
  console.log('OPERATIONS READINESS GATE: PASSED');
  if (warnings.length > 0) {
    console.log('Warnings:');
    for (const w of warnings) console.log(`  ${w}`);
  }
  process.exit(0);
} else {
  console.error('OPERATIONS READINESS GATE: FAILED');
  process.exit(1);
}
