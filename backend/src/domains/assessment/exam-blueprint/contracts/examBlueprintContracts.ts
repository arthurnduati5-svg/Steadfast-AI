export type BlueprintStatus =
  | 'draft' | 'active' | 'archived' | 'blocked' | 'superseded';

export type BlueprintVersionStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'superseded' | 'blocked';

export type SelectionStrategy =
  | 'balanced' | 'coverage_first' | 'difficulty_balanced' | 'security_first'
  | 'freshness_first' | 'teacher_seeded' | 'mock_seeded';

export type CoveragePolicy =
  | 'strict_all_mandatory' | 'balanced_weighted' | 'best_effort_with_gaps'
  | 'teacher_review_required';

export interface ExamBlueprint {
  blueprintId: string;
  schoolId: string;
  status: BlueprintStatus;
  title: string;
  subjectId: string;
  curriculumVersionId: string;
  gradeBand: string;
  examType: string;
  createdByActorId: string;
  createdByRole: string;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ExamBlueprintVersion {
  blueprintVersionId: string;
  blueprintId: string;
  versionNumber: number;
  status: BlueprintVersionStatus;
  title: string;
  safeDescription: string;
  durationMinutes: number;
  totalMarks: number;
  targetQuestionCount: number;
  difficultyMixJson: string;
  questionTypeMixJson: string;
  securityClassRequirement: string;
  coveragePolicy: CoveragePolicy;
  selectionStrategy: SelectionStrategy;
  createdByActorId: string;
  createdAt: string;
  approvedAt: string | null;
  supersededAt: string | null;
}

export type RequirementType =
  | 'objective' | 'skill' | 'topic' | 'section' | 'question_type' | 'difficulty_band' | 'security';

export interface ExamBlueprintRequirement {
  requirementId: string;
  blueprintVersionId: string;
  schoolId: string;
  requirementType: RequirementType;
  subjectId: string;
  topicId: string;
  skillId: string;
  objectiveId: string;
  requiredQuestionCount: number;
  requiredMarks: number;
  minimumDifficulty: string;
  maximumDifficulty: string;
  questionType: string;
  weight: number;
  isMandatory: boolean;
  createdAt: string;
}

export interface BlueprintCoverageGap {
  reasonCode: string;
  requirementId: string;
  requirementType: RequirementType;
  subjectId: string;
  topicId: string;
  skillId: string;
  objectiveId: string;
  questionType: string;
  requiredCount: number;
  availableCount: number;
  gapCount: number;
  safeMessage: string;
}
