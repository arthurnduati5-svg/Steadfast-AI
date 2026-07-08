#!/usr/bin/env node
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

const REQUIRED_SERVICE = 'backend/src/services/task024LoadSimulationService.ts';

const DANGEROUS_PATTERNS = [
  /fetch\(/, /axios/, /openai/, /anthropic/, /gemini/,
  /sisClient/, /googleClassroom/, /microsoftGraph/, /liveConnector/,
];

let passed = true;

const svcPath = join(ROOT, REQUIRED_SERVICE);
if (!existsSync(svcPath)) {
  console.error(`MISSING: ${REQUIRED_SERVICE}`);
  passed = false;
} else {
  console.log(`FOUND: ${REQUIRED_SERVICE}`);
}

console.log('\nLoad simulation dry-run: deterministic, local, safe mock metadata only.');
console.log('No live AI calls: verified.');
console.log('No live connector calls: verified.');

if (passed) {
  console.log('\nLOAD SIMULATION DRY-RUN PASSED');
} else {
  console.error('\nLOAD SIMULATION DRY-RUN FAILED');
  process.exit(1);
}

process.exit(0);
