export type ModerationStatus = 'pending' | 'approved' | 'adjusted' | 'rejected' | 'blocked';
export type ModerationDecisionValue = 'uphold' | 'adjust' | 'return_to_teacher' | 'escalate' | 'block';

export interface ModerationDecision {
  moderationDecisionId: string;
  schoolId: string;
  markingResultVersionId: string;
  teacherOverrideId?: string;
  status: string;
  decision: string;
  safeReason: string;
  decidedByActorId: string;
  decidedByRole: string;
  createdAt: string;
}
