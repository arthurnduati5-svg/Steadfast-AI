import {
  ExamBlueprint, ExamBlueprintVersion, ExamBlueprintRequirement,
  ExamDraftSet, ExamDraft, ExamDraftQuestion,
  QuestionSelectionRun, QuestionSelectionCandidate,
} from './';

export interface ExamBlueprintRepository {
  create(item: ExamBlueprint): Promise<ExamBlueprint>;
  findById(blueprintId: string): Promise<ExamBlueprint | null>;
  findBySchoolId(schoolId: string): Promise<ExamBlueprint[]>;
  findBySchoolIdAndStatus(schoolId: string, status: string): Promise<ExamBlueprint[]>;
  findBySchoolIdAndSubject(schoolId: string, subjectId: string): Promise<ExamBlueprint[]>;
  findByCurriculumVersionId(curriculumVersionId: string): Promise<ExamBlueprint[]>;
  findByCurrentVersionId(currentVersionId: string): Promise<ExamBlueprint | null>;
  update(item: ExamBlueprint): Promise<ExamBlueprint | null>;
}

export interface ExamBlueprintVersionRepository {
  create(item: ExamBlueprintVersion): Promise<ExamBlueprintVersion>;
  findById(blueprintVersionId: string): Promise<ExamBlueprintVersion | null>;
  findByBlueprintId(blueprintId: string): Promise<ExamBlueprintVersion[]>;
  findLatestByBlueprintId(blueprintId: string): Promise<ExamBlueprintVersion | null>;
  findByStatus(status: string): Promise<ExamBlueprintVersion[]>;
  update(item: ExamBlueprintVersion): Promise<ExamBlueprintVersion | null>;
}

export interface ExamBlueprintRequirementRepository {
  create(item: ExamBlueprintRequirement): Promise<ExamBlueprintRequirement>;
  findById(requirementId: string): Promise<ExamBlueprintRequirement | null>;
  findByBlueprintVersionId(blueprintVersionId: string): Promise<ExamBlueprintRequirement[]>;
  findBySchoolId(schoolId: string): Promise<ExamBlueprintRequirement[]>;
  findByObjectiveId(objectiveId: string): Promise<ExamBlueprintRequirement[]>;
  findByTopicId(topicId: string): Promise<ExamBlueprintRequirement[]>;
  findBySkillId(skillId: string): Promise<ExamBlueprintRequirement[]>;
  findByQuestionType(questionType: string): Promise<ExamBlueprintRequirement[]>;
}

export interface ExamDraftSetRepository {
  create(item: ExamDraftSet): Promise<ExamDraftSet>;
  findById(draftSetId: string): Promise<ExamDraftSet | null>;
  findBySchoolId(schoolId: string): Promise<ExamDraftSet[]>;
  findBySchoolIdAndStatus(schoolId: string, status: string): Promise<ExamDraftSet[]>;
  findByBlueprintId(blueprintId: string): Promise<ExamDraftSet[]>;
  findByBlueprintVersionId(blueprintVersionId: string): Promise<ExamDraftSet[]>;
  update(item: ExamDraftSet): Promise<ExamDraftSet | null>;
}

export interface ExamDraftRepository {
  create(item: ExamDraft): Promise<ExamDraft>;
  findById(draftId: string): Promise<ExamDraft | null>;
  findByDraftSetId(draftSetId: string): Promise<ExamDraft[]>;
  findBySchoolId(schoolId: string): Promise<ExamDraft[]>;
  findByRank(draftSetId: string, rank: number): Promise<ExamDraft | null>;
  update(item: ExamDraft): Promise<ExamDraft | null>;
}

export interface ExamDraftQuestionRepository {
  create(item: ExamDraftQuestion): Promise<ExamDraftQuestion>;
  findById(draftQuestionId: string): Promise<ExamDraftQuestion | null>;
  findByDraftId(draftId: string): Promise<ExamDraftQuestion[]>;
  findBySchoolId(schoolId: string): Promise<ExamDraftQuestion[]>;
  findByQuestionId(questionId: string): Promise<ExamDraftQuestion[]>;
  findByRequirementId(requirementId: string): Promise<ExamDraftQuestion[]>;
  findByDraftIdAndPosition(draftId: string, position: number): Promise<ExamDraftQuestion | null>;
}

export interface QuestionSelectionRunRepository {
  create(item: QuestionSelectionRun): Promise<QuestionSelectionRun>;
  findById(selectionRunId: string): Promise<QuestionSelectionRun | null>;
  findBySchoolId(schoolId: string): Promise<QuestionSelectionRun[]>;
  findByBlueprintVersionId(blueprintVersionId: string): Promise<QuestionSelectionRun[]>;
  findByDraftSetId(draftSetId: string): Promise<QuestionSelectionRun | null>;
  findByStatus(status: string): Promise<QuestionSelectionRun[]>;
  update(item: QuestionSelectionRun): Promise<QuestionSelectionRun | null>;
}

export interface QuestionSelectionCandidateRepository {
  create(item: QuestionSelectionCandidate): Promise<QuestionSelectionCandidate>;
  findById(selectionCandidateId: string): Promise<QuestionSelectionCandidate | null>;
  findBySelectionRunId(selectionRunId: string): Promise<QuestionSelectionCandidate[]>;
  findBySchoolId(schoolId: string): Promise<QuestionSelectionCandidate[]>;
  findByQuestionId(questionId: string): Promise<QuestionSelectionCandidate[]>;
  findByEligible(eligible: boolean): Promise<QuestionSelectionCandidate[]>;
  findBySelected(selected: boolean): Promise<QuestionSelectionCandidate[]>;
}
