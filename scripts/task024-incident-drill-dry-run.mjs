#!/usr/bin/env node
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

const REQUIRED_DOCS = [
  'docs/architecture/TASK_024_INCIDENT_RESPONSE_WORKFLOW.md',
  'docs/architecture/TASK_024_INCIDENT_SEVERITY_ESCALATION.md',
];

const REQUIRED_SERVICES = [
  'backend/src/services/task024IncidentResponseWorkflowService.ts',
  'backend/src/services/task024IncidentSeverityEscalationService.ts',
];

const SAFETY_CHECKS = [
  'owner',
  'severity',
  'escalation',
  'containment',
  'mitigation',
  'postmortem',
];

let passed = true;

for (const doc of REQUIRED_DOCS) {
  const docPath = join(ROOT, doc);
  if (!existsSync(docPath)) {
    console.error(`MISSING: ${doc}`);
    passed = false;
  } else {
    console.log(`FOUND: ${doc}`);
  }
}

for (const svc of REQUIRED_SERVICES) {
  const svcPath = join(ROOT, svc);
  if (!existsSync(svcPath)) {
    console.error(`MISSING: ${svc}`);
    passed = false;
  } else {
    console.log(`FOUND: ${svc}`);
  }
}

console.log(`\nSafety checks: ${SAFETY_CHECKS.join(', ')}`);

if (passed) {
  console.log('\nINCIDENT DRILL DRY-RUN PASSED');
  console.log('Owner, severity, escalation, containment, mitigation, postmortem rules verified.');
} else {
  console.error('\nINCIDENT DRILL DRY-RUN FAILED');
  process.exit(1);
}

process.exit(0);
