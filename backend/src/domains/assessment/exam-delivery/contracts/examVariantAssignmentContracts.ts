export type ExamVariantAssignmentStatus =
  | 'assigned'
  | 'active'
  | 'revoked'
  | 'blocked'
  | 'completed';

export type LearnerRefType =
  | 'mock_student_ref'
  | 'school_student_ref'
  | 'external_student_ref_deferred';

export type AssignmentStrategy =
  | 'manual_teacher_assignment'
  | 'round_robin'
  | 'same_variant_for_all'
  | 'mock_seeded';

export interface ExamVariantAssignment {
  variantAssignmentId: string;
  schoolId: string;
  deliverySessionId: string;
  paperId: string;
  paperVersionId: string;
  variantId: string;
  studentRef: string;
  learnerRefType: LearnerRefType;
  assignmentStatus: ExamVariantAssignmentStatus;
  assignmentStrategy: AssignmentStrategy;
  assignedByActorId: string;
  assignedByRole: string;
  safeAssignmentSummary: string;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}
