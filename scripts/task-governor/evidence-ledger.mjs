import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import crypto from 'node:crypto';
import { getGovernorRuntimeDir, getRepositoryRoot } from './repository-root.mjs';
import { LEDGER_SCHEMA_VERSION } from './constants.mjs';
import { EvidenceIntegrityError } from './errors.mjs';

function ensureDir(p) {
  const d = dirname(p);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

function getLedgerPath(taskId) {
  return `${getGovernorRuntimeDir(taskId)}/ledger.jsonl`;
}

function computeRecordHash(record, previousHash) {
  const data = JSON.stringify({ ...record, previousRecordHash: previousHash });
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function addRecord(record) {
  const taskId = record.taskId;
  const ledgerPath = getLedgerPath(taskId);
  ensureDir(ledgerPath);

  const previousRecord = getRecords(taskId).pop() || null;
  const previousHash = previousRecord ? previousRecord.currentRecordHash : crypto.createHash('sha256').update('genesis').digest('hex');

  const entry = {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    recordId: `${taskId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    taskId,
    timestamp: new Date().toISOString(),
    stateBefore: record.stateBefore,
    stateAfter: record.stateAfter,
    todoId: record.todoId || null,
    gateId: record.gateId || null,
    manifestHash: record.manifestHash || null,
    headBefore: record.headBefore || null,
    headAfter: record.headAfter || null,
    executable: record.executable || null,
    args: record.args || [],
    cwd: record.cwd || null,
    exitCode: record.exitCode,
    signal: record.signal || null,
    duration: record.duration || 0,
    stdoutPath: record.stdoutPath || null,
    stderrPath: record.stderrPath || null,
    stdoutHash: record.stdoutHash || null,
    stderrHash: record.stderrHash || null,
    parsedSummary: record.parsedSummary || null,
    previousRecordHash: previousHash,
    currentRecordHash: null,
  };

  entry.currentRecordHash = computeRecordHash(entry, previousHash);

  appendFileSync(ledgerPath, JSON.stringify(entry) + '\n', 'utf-8');
  return entry;
}

export function getRecords(taskId) {
  const ledgerPath = getLedgerPath(taskId);
  if (!existsSync(ledgerPath)) return [];

  const content = readFileSync(ledgerPath, 'utf-8');
  return content.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
}

export function verifyChain(taskId) {
  const records = getRecords(taskId);
  if (records.length === 0) return true;

  let previousHash = crypto.createHash('sha256').update('genesis').digest('hex');

  for (const record of records) {
    const storedHash = record.currentRecordHash;
    const recordClone = { ...record, currentRecordHash: null };
    const computedHash = computeRecordHash(recordClone, previousHash);

    if (computedHash !== storedHash) {
      throw new EvidenceIntegrityError(
        `Ledger tampering detected at record ${record.recordId}. Hash mismatch.`
      );
    }

    if (record.previousRecordHash !== previousHash) {
      throw new EvidenceIntegrityError(
        `Ledger chain broken at record ${record.recordId}. Previous hash mismatch.`
      );
    }

    previousHash = storedHash;
  }

  return true;
}

export function getLastRecord(taskId) {
  const records = getRecords(taskId);
  return records.length > 0 ? records[records.length - 1] : null;
}

export function getRecordsForGate(taskId, gateId) {
  return getRecords(taskId).filter(r => r.gateId === gateId);
}

export function getRecordsForTodo(taskId, todoId) {
  return getRecords(taskId).filter(r => r.todoId === todoId);
}
