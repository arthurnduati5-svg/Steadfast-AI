export type AssessmentConflictReason =
  | 'VERSION_CONFLICT'
  | 'MISSING_EXPECTED_VERSION'
  | 'UNVERSIONED_COMMAND_NOT_ALLOWED'
  | 'OK';

export interface AssessmentConcurrencyCheck {
  aggregateType: string;
  aggregateId: string;
  expectedVersion: number | undefined;
  actualVersion: number | undefined;
  commandId: string;
  conflictReason: AssessmentConflictReason;
}

export interface AssessmentConcurrencyResult {
  ok: boolean;
  conflictReason: AssessmentConflictReason;
  expectedVersion: number | undefined;
  actualVersion: number | undefined;
  safeMessage: string;
}
