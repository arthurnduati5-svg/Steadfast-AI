export interface RecoveryCaseQueueExplanation {
  queueExplanationId: string;
  schoolId: string;
  queueItemId: string;
  priorityAssessmentId: string;
  queueSnapshotId: string;
  explanationText: string;
  factorBreakdownJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
}
