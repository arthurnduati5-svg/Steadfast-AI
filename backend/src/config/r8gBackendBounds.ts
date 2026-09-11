/**
 * R8-G backend operational bounds.
 *
 * All values are explicitly configurable via environment and validated here.
 * UNSET or INVALID means DISABLED: no destructive behavior (no purge, no
 * rejection) ever follows from a missing or malformed value. No business
 * policy (exact roster size, exact retention duration) is invented here —
 * the operator supplies it; this module only validates and exposes it.
 *
 * Keys:
 * - ROSTER_MAX_RECORDS: maximum accepted roster records (students + teachers
 *   + classes + subjects + enrollments + teacherAssignments) per sync/dry-run.
 * - R8G_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS: retention threshold for redundant
 *   LearningEvidenceIdempotency rows whose canonical event already exists.
 * - R8G_RESULT_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS: retention threshold for
 *   completed ResultLearningEvidenceIdempotencyRecord rows.
 * - R8G_DAILY_OBJECTIVE_IDEMPOTENCY_RETENTION_DAYS: retention threshold for
 *   completed daily-objective idempotency rows.
 * - R8G_IDEMPOTENCY_PURGE_BATCH_MAX: upper bound on rows purged per execution.
 */

export interface R8GBoundsConfig {
  rosterMaxRecords: number | null;
  evidenceIdempotencyRetentionDays: number | null;
  resultEvidenceIdempotencyRetentionDays: number | null;
  dailyObjectiveIdempotencyRetentionDays: number | null;
  idempotencyPurgeBatchMax: number;
}

export interface R8GBoundIssue {
  key: string;
  message: string;
}

const DEFAULT_PURGE_BATCH_MAX = 500;
const MAX_PURGE_BATCH_MAX = 5000;
const MAX_RETENTION_DAYS = 3650;
const MAX_ROSTER_RECORDS = 50_000_000;

function parsePositiveInt(raw: string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}

export function getR8GBoundsConfig(env: NodeJS.ProcessEnv = process.env): {
  config: R8GBoundsConfig;
  issues: R8GBoundIssue[];
} {
  const issues: R8GBoundIssue[] = [];

  const rosterRaw = env['ROSTER_MAX_RECORDS'];
  let rosterMaxRecords = parsePositiveInt(rosterRaw);
  if (rosterRaw !== undefined && rosterRaw.trim() !== '' && rosterMaxRecords === null) {
    issues.push({
      key: 'ROSTER_MAX_RECORDS',
      message: 'ROSTER_MAX_RECORDS must be a positive integer; ignoring (bound disabled).',
    });
  } else if (rosterMaxRecords !== null && rosterMaxRecords > MAX_ROSTER_RECORDS) {
    issues.push({
      key: 'ROSTER_MAX_RECORDS',
      message: `ROSTER_MAX_RECORDS exceeds sanity ceiling ${MAX_ROSTER_RECORDS}; ignoring (bound disabled).`,
    });
    rosterMaxRecords = null;
  }

  const parseRetention = (key: string): number | null => {
    const raw = env[key];
    const value = parsePositiveInt(raw);
    if (raw !== undefined && raw.trim() !== '' && value === null) {
      issues.push({ key, message: `${key} must be a positive integer number of days; ignoring (lifecycle disabled).` });
      return null;
    }
    if (value !== null && value > MAX_RETENTION_DAYS) {
      issues.push({ key, message: `${key} exceeds sanity ceiling ${MAX_RETENTION_DAYS} days; ignoring (lifecycle disabled).` });
      return null;
    }
    return value;
  };

  const batchRaw = env['R8G_IDEMPOTENCY_PURGE_BATCH_MAX'];
  let idempotencyPurgeBatchMax = DEFAULT_PURGE_BATCH_MAX;
  if (batchRaw !== undefined && batchRaw.trim() !== '') {
    const parsed = parsePositiveInt(batchRaw);
    if (parsed === null || parsed > MAX_PURGE_BATCH_MAX) {
      issues.push({
        key: 'R8G_IDEMPOTENCY_PURGE_BATCH_MAX',
        message: `R8G_IDEMPOTENCY_PURGE_BATCH_MAX must be a positive integer <= ${MAX_PURGE_BATCH_MAX}; using default ${DEFAULT_PURGE_BATCH_MAX}.`,
      });
    } else {
      idempotencyPurgeBatchMax = parsed;
    }
  }

  return {
    config: {
      rosterMaxRecords,
      evidenceIdempotencyRetentionDays: parseRetention('R8G_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS'),
      resultEvidenceIdempotencyRetentionDays: parseRetention('R8G_RESULT_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS'),
      dailyObjectiveIdempotencyRetentionDays: parseRetention('R8G_DAILY_OBJECTIVE_IDEMPOTENCY_RETENTION_DAYS'),
      idempotencyPurgeBatchMax,
    },
    issues,
  };
}

export interface RosterRecordCounts {
  students: number;
  teachers: number;
  classes: number;
  subjects: number;
  enrollments: number;
  teacherAssignments: number;
}

export function countRosterRecords(input: {
  students?: unknown[];
  teachers?: unknown[];
  classes?: unknown[];
  subjects?: unknown[];
  enrollments?: unknown[];
  teacherAssignments?: unknown[];
}): { total: number; counts: RosterRecordCounts } {
  const counts: RosterRecordCounts = {
    students: input.students?.length ?? 0,
    teachers: input.teachers?.length ?? 0,
    classes: input.classes?.length ?? 0,
    subjects: input.subjects?.length ?? 0,
    enrollments: input.enrollments?.length ?? 0,
    teacherAssignments: input.teacherAssignments?.length ?? 0,
  };
  const total =
    counts.students +
    counts.teachers +
    counts.classes +
    counts.subjects +
    counts.enrollments +
    counts.teacherAssignments;
  return { total, counts };
}

export type RosterBoundVerdict =
  | { allowed: true; total: number; limit: number | null }
  | { allowed: false; total: number; limit: number };

/**
 * Enforce the configured roster bound BEFORE expensive reconciliation work.
 * Unconfigured (null) means no bound is applied — normal valid roster
 * semantics are unchanged. Over-bound returns a rejection the caller must
 * surface as a 413/payload-too-large style error without partial application.
 */
export function checkRosterBound(
  total: number,
  limit: number | null = getR8GBoundsConfig().config.rosterMaxRecords,
): RosterBoundVerdict {
  if (limit === null) return { allowed: true, total, limit: null };
  if (total <= limit) return { allowed: true, total, limit };
  return { allowed: false, total, limit };
}
