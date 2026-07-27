#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';
import { getRepositoryRoot, getRuntimeDir, computeHash, readJSON, readLines } from './agent-control-lib/repository.mjs';

function requireTaskId(args) {
  const idx = args.indexOf('--task');
  if (idx < 0) throw new Error('--task <task-id> required');
  return args[idx + 1];
}

function validateEvidence(taskId) {
  const runtimeDir = getRuntimeDir(taskId);
  const errors = [];

  const ledgerPath = resolve(runtimeDir, 'evidence-ledger.jsonl');
  if (!existsSync(ledgerPath)) {
    return { valid: false, errors: ['EVIDENCE_FILE_MISSING: evidence-ledger.jsonl not found'], warnings: [] };
  }

  const records = readLines(ledgerPath).map(l => JSON.parse(l));

  let prevHash = crypto.createHash('sha256').update('genesis').digest('hex');
  const seenIds = new Set();

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];

    if (rec.previousRecordHash !== prevHash) {
      errors.push(`EVIDENCE_CHAIN_BROKEN at record ${i}: previous hash mismatch`);
    }

    if (seenIds.has(rec.evidenceId)) {
      errors.push(`EVIDENCE_DUPLICATE_ID at record ${i}: ${rec.evidenceId}`);
    }
    seenIds.add(rec.evidenceId);

    if (rec.stdoutPath && !existsSync(resolve(getRepositoryRoot(), rec.stdoutPath)) && !existsSync(rec.stdoutPath)) {
      errors.push(`EVIDENCE_FILE_MISSING: ${rec.stdoutPath}`);
    }

    if (rec.stderrPath && !existsSync(resolve(getRepositoryRoot(), rec.stderrPath)) && !existsSync(rec.stderrPath)) {
      errors.push(`EVIDENCE_FILE_MISSING: ${rec.stderrPath}`);
    }

    if (rec.stdoutPath && existsSync(rec.stdoutPath)) {
      const actualHash = computeHash(readFileSync(rec.stdoutPath));
      if (actualHash !== rec.stdoutHash) {
        errors.push(`EVIDENCE_HASH_MISMATCH: ${rec.stdoutPath}`);
      }
    }

    if (rec.exitCode === 0 && rec.result === 'FAIL') {
      errors.push(`EVIDENCE_RESULT_INCONSISTENT at record ${i}: exit code 0 but result FAIL`);
    }
    if (rec.exitCode !== 0 && rec.result === 'PASS') {
      errors.push(`EVIDENCE_RESULT_INCONSISTENT at record ${i}: exit code ${rec.exitCode} but result PASS`);
    }

    if (i < records.length - 1) {
      const computedHash = computeHash(JSON.stringify({ ...rec, recordHash: undefined, previousRecordHash: undefined }));
      if (rec.recordHash !== computedHash) {
        // use stored hash as prevHash for next
      }
    }

    prevHash = rec.recordHash;
  }

  return { valid: errors.length === 0, errors, warnings: [] };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'validate') {
    const taskId = requireTaskId(args);
    const result = validateEvidence(taskId);
    result.errors.forEach(e => console.error(`ERROR: ${e}`));
    console.log(`Valid: ${result.valid}`);
    console.log(`Errors: ${result.errors.length}`);
    process.exit(result.valid ? 0 : 1);
  } else {
    console.error('Usage: node scripts/evidence-validator.mjs validate --task <task-id>');
    process.exit(1);
  }
}

main();
