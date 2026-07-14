export interface ResultLearningEvidenceTeacherProjection {
  bridgeId: string;
  schoolId: string;
  bridgeStatus: string;
  bridgeMode: string;
  studentRef: string;
  safeEvidenceSummary: string;
  objectiveImpactCount: number;
  planStatus?: string;
  revisionSignalCount: number;
  growthSignalCount: number;
  reasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResultLearningEvidenceAdminProjection {
  totalBridges: number;
  totalPlans: number;
  totalImpacts: number;
  totalRevisionSignals: number;
  totalGrowthSignals: number;
  bridgesByStatus: Record<string, number>;
  plansByStatus: Record<string, number>;
  schoolId: string;
  safeSummary: string;
}

export interface ResultLearningEvidenceStudentSafeProjection {
  studentRef: string;
  learningObjectiveId: string;
  safeEvidenceSummary: string;
  safeMasteryMovementSummary: string;
  safeNextPracticeSummary: string;
  safeStatusSummary: string;
  availableNextActions: string[];
}

export interface ResultLearningEvidenceParentBoundaryProjection {
  studentRef: string;
  safeProgressSummary: string;
  safeSupportSummary: string;
  notYetReleasedReason: string;
  allowedFieldNames: string[];
  blockedFieldNames: string[];
}

export interface FinalizedResultEvidencePreview {
  bridgeId: string;
  resultFinalizationDecisionId: string;
  markingResultVersionId: string;
  studentRef: string;
  bridgeStatus: string;
  safeEvidenceSummary: string;
  objectiveImpactCount: number;
  createdAt: string;
}

export interface MasteryMutationPlanPreview {
  planId: string;
  bridgeId: string;
  planStatus: string;
  planMode: string;
  safePlanSummary: string;
  studentRef: string;
  impactCount: number;
  approvalRequired: boolean;
  approvedByActorId?: string;
  createdAt: string;
}

export interface RevisionSignalPreview {
  signalId: string;
  planId: string;
  signalStatus: string;
  signalType: string;
  priority: number;
  safeSignalSummary: string;
  learningObjectiveId: string;
  createdAt: string;
}

export interface GrowthSignalPreview {
  signalId: string;
  planId: string;
  signalStatus: string;
  signalType: string;
  safeGrowthSummary: string;
  learningObjectiveId: string;
  createdAt: string;
}

export const STUDENT_SAFE_FIELDS = [
  'studentRef', 'learningObjectiveId', 'safeEvidenceSummary',
  'safeMasteryMovementSummary', 'safeNextPracticeSummary',
  'safeStatusSummary', 'availableNextActions',
];

export const PARENT_BOUNDARY_FIELDS = [
  'studentRef', 'safeProgressSummary', 'safeSupportSummary',
  'notYetReleasedReason', 'allowedFieldNames', 'blockedFieldNames',
];

export const FORBIDDEN_FIELDS_STUDENT_PARENT = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary',
  'rubricInternal', 'rubricText', 'rawRubric',
  'markingNotesTeacherOnly', 'teacherOnlyNotes',
  'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal',
  'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals',
  'rawStudentAnswer', 'scoreBeforeFinalization',
  'unreleasedScore', 'finalGradeBeforeRelease',
  'parentDeliveryPayload', 'reportCardPayload',
  'rawMasteryDelta', 'beforeStateJson', 'afterStateJson', 'deltaJson',
] as const;
