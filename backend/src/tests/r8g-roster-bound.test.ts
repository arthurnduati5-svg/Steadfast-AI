import { describe, it, expect, beforeEach } from 'vitest';
import { performRosterSyncDryRun } from '../services/rosterSyncDryRunService';
import { reconcileRosterDiff } from '../services/task021RosterReconciliationService';
import type { RosterSyncInput } from '../contracts/schoolSystemBridgeContracts';

function smallInput(): RosterSyncInput {
  return {
    schoolId: 'school-a',
    students: [
      { externalStudentId: 's1', schoolId: 'school-a' },
      { externalStudentId: 's2', schoolId: 'school-a' },
    ],
    teachers: [{ externalTeacherId: 't1', schoolId: 'school-a' }],
    classes: [{ classId: 'c1', schoolId: 'school-a' }],
    subjects: [],
    enrollments: [],
    teacherAssignments: [],
  } as unknown as RosterSyncInput;
}

function bigInput(total: number): RosterSyncInput {
  const students = Array.from({ length: total }, (_, index) => ({
    externalStudentId: `s${index}`,
    schoolId: 'school-a',
  }));
  return {
    schoolId: 'school-a',
    students,
    teachers: [],
    classes: [],
    subjects: [],
    enrollments: [],
    teacherAssignments: [],
  } as unknown as RosterSyncInput;
}

describe('R8-G roster bound mechanism', () => {
  beforeEach(() => {
    delete process.env['ROSTER_MAX_RECORDS'];
  });

  it('unconfigured bound preserves normal valid roster semantics', () => {
    const result = performRosterSyncDryRun(smallInput());
    expect(result.blocked).toBe(false);
    expect(result.reasonCodes).toContain('dry_run_completed');
    expect(result.summary.totalStudents).toBe(2);
  });

  it('over-bound dry-run is rejected before work with a stable reason', () => {
    process.env['ROSTER_MAX_RECORDS'] = '10';
    const result = performRosterSyncDryRun(bigInput(11));
    expect(result.blocked).toBe(true);
    expect(result.safeToApplyLater).toBe(false);
    expect(result.conflicts).toEqual([]);
    expect(result.reasonCodes).toContain('roster_payload_too_large');
    expect(result.reasonCodes).toContain('received:11');
    expect(result.reasonCodes).toContain('limit:10');
    // No reconciliation work performed: would-create counters stay zero.
    expect(result.summary.wouldCreate).toBe(0);
  });

  it('at-bound payload is accepted (boundary inclusive)', () => {
    process.env['ROSTER_MAX_RECORDS'] = '10';
    const result = performRosterSyncDryRun(bigInput(10));
    expect(result.blocked).toBe(false);
  });

  it('reconcile rejects over-bound entries with nothing applied', () => {
    process.env['ROSTER_MAX_RECORDS'] = '2';
    const entries = [
      { category: 'new_student_mapping_needed', externalId: 's1' },
      { category: 'new_student_mapping_needed', externalId: 's2' },
      { category: 'new_student_mapping_needed', externalId: 's3' },
    ] as unknown as Parameters<typeof reconcileRosterDiff>[0];
    const result = reconcileRosterDiff(entries, 'school-a');
    expect(result.rejected?.code).toBe('roster_payload_too_large');
    expect(result.decisions).toEqual([]);
    expect(result.appliedCount).toBe(0);
  });

  it('invalid configured bound fails safe to disabled (no rejection)', () => {
    process.env['ROSTER_MAX_RECORDS'] = 'not-a-number';
    const result = performRosterSyncDryRun(bigInput(5000));
    expect(result.blocked).toBe(false);
    expect(result.reasonCodes).toContain('dry_run_completed');
  });
});
