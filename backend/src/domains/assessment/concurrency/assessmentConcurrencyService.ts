import type {
  AssessmentConcurrencyCheck,
  AssessmentConcurrencyResult,
} from '../contracts/assessmentConcurrencyContracts';

export function assertExpectedVersion(
  check: AssessmentConcurrencyCheck,
): AssessmentConcurrencyResult {
  if (check.expectedVersion === undefined) {
    return {
      ok: false,
      conflictReason: 'MISSING_EXPECTED_VERSION',
      expectedVersion: undefined,
      actualVersion: check.actualVersion,
      safeMessage: 'expectedVersion is required for versioned aggregate transitions',
    };
  }

  if (check.actualVersion !== check.expectedVersion) {
    return {
      ok: false,
      conflictReason: 'VERSION_CONFLICT',
      expectedVersion: check.expectedVersion,
      actualVersion: check.actualVersion,
      safeMessage: `Version conflict: expected ${check.expectedVersion}, actual ${check.actualVersion ?? 'undefined'}`,
    };
  }

  return {
    ok: true,
    conflictReason: 'OK',
    expectedVersion: check.expectedVersion,
    actualVersion: check.actualVersion,
    safeMessage: 'Expected version matches',
  };
}

export function createVersionConflict(
  expectedVersion: number | undefined,
  actualVersion: number | undefined,
  commandId: string,
): AssessmentConcurrencyResult {
  return {
    ok: false,
    conflictReason: 'VERSION_CONFLICT',
    expectedVersion,
    actualVersion,
    safeMessage: `Version conflict for command ${commandId}`,
  };
}
