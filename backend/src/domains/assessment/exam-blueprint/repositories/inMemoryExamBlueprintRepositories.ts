import {
  ExamBlueprint, ExamBlueprintVersion, ExamBlueprintRequirement,
  ExamDraftSet, ExamDraft, ExamDraftQuestion,
  QuestionSelectionRun, QuestionSelectionCandidate,
} from '../contracts';
import {
  ExamBlueprintRepository, ExamBlueprintVersionRepository,
  ExamBlueprintRequirementRepository, ExamDraftSetRepository,
  ExamDraftRepository, ExamDraftQuestionRepository,
  QuestionSelectionRunRepository, QuestionSelectionCandidateRepository,
} from '../contracts/examBlueprintRepositoryContracts';

export class InMemoryExamBlueprintRepository implements ExamBlueprintRepository {
  private items = new Map<string, ExamBlueprint>();
  async create(item: ExamBlueprint): Promise<ExamBlueprint> {
    this.items.set(item.blueprintId, { ...item });
    return { ...item };
  }
  async findById(blueprintId: string): Promise<ExamBlueprint | null> {
    return this.items.get(blueprintId) ? { ...this.items.get(blueprintId)! } : null;
  }
  async findBySchoolId(schoolId: string): Promise<ExamBlueprint[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId).map(i => ({ ...i }));
  }
  async findBySchoolIdAndStatus(schoolId: string, status: string): Promise<ExamBlueprint[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId && i.status === status).map(i => ({ ...i }));
  }
  async findBySchoolIdAndSubject(schoolId: string, subjectId: string): Promise<ExamBlueprint[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId && i.subjectId === subjectId).map(i => ({ ...i }));
  }
  async findByCurriculumVersionId(curriculumVersionId: string): Promise<ExamBlueprint[]> {
    return [...this.items.values()].filter(i => i.curriculumVersionId === curriculumVersionId).map(i => ({ ...i }));
  }
  async findByCurrentVersionId(currentVersionId: string): Promise<ExamBlueprint | null> {
    const found = [...this.items.values()].find(i => i.currentVersionId === currentVersionId);
    return found ? { ...found } : null;
  }
  async update(item: ExamBlueprint): Promise<ExamBlueprint | null> {
    const existing = this.items.get(item.blueprintId);
    if (!existing) return null;
    this.items.set(item.blueprintId, { ...item });
    return { ...item };
  }
  reset(): void { this.items.clear(); }
}

export class InMemoryExamBlueprintVersionRepository implements ExamBlueprintVersionRepository {
  private items = new Map<string, ExamBlueprintVersion>();
  async create(item: ExamBlueprintVersion): Promise<ExamBlueprintVersion> {
    this.items.set(item.blueprintVersionId, { ...item });
    return { ...item };
  }
  async findById(blueprintVersionId: string): Promise<ExamBlueprintVersion | null> {
    return this.items.get(blueprintVersionId) ? { ...this.items.get(blueprintVersionId)! } : null;
  }
  async findByBlueprintId(blueprintId: string): Promise<ExamBlueprintVersion[]> {
    return [...this.items.values()].filter(i => i.blueprintId === blueprintId).sort((a, b) => b.versionNumber - a.versionNumber).map(i => ({ ...i }));
  }
  async findLatestByBlueprintId(blueprintId: string): Promise<ExamBlueprintVersion | null> {
    const versions = [...this.items.values()].filter(i => i.blueprintId === blueprintId).sort((a, b) => b.versionNumber - a.versionNumber);
    return versions.length > 0 ? { ...versions[0] } : null;
  }
  async findByStatus(status: string): Promise<ExamBlueprintVersion[]> {
    return [...this.items.values()].filter(i => i.status === status).map(i => ({ ...i }));
  }
  async update(item: ExamBlueprintVersion): Promise<ExamBlueprintVersion | null> {
    const existing = this.items.get(item.blueprintVersionId);
    if (!existing) return null;
    this.items.set(item.blueprintVersionId, { ...item });
    return { ...item };
  }
  reset(): void { this.items.clear(); }
}

export class InMemoryExamBlueprintRequirementRepository implements ExamBlueprintRequirementRepository {
  private items = new Map<string, ExamBlueprintRequirement>();
  async create(item: ExamBlueprintRequirement): Promise<ExamBlueprintRequirement> {
    this.items.set(item.requirementId, { ...item });
    return { ...item };
  }
  async findById(requirementId: string): Promise<ExamBlueprintRequirement | null> {
    return this.items.get(requirementId) ? { ...this.items.get(requirementId)! } : null;
  }
  async findByBlueprintVersionId(blueprintVersionId: string): Promise<ExamBlueprintRequirement[]> {
    return [...this.items.values()].filter(i => i.blueprintVersionId === blueprintVersionId).map(i => ({ ...i }));
  }
  async findBySchoolId(schoolId: string): Promise<ExamBlueprintRequirement[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId).map(i => ({ ...i }));
  }
  async findByObjectiveId(objectiveId: string): Promise<ExamBlueprintRequirement[]> {
    return [...this.items.values()].filter(i => i.objectiveId === objectiveId).map(i => ({ ...i }));
  }
  async findByTopicId(topicId: string): Promise<ExamBlueprintRequirement[]> {
    return [...this.items.values()].filter(i => i.topicId === topicId).map(i => ({ ...i }));
  }
  async findBySkillId(skillId: string): Promise<ExamBlueprintRequirement[]> {
    return [...this.items.values()].filter(i => i.skillId === skillId).map(i => ({ ...i }));
  }
  async findByQuestionType(questionType: string): Promise<ExamBlueprintRequirement[]> {
    return [...this.items.values()].filter(i => i.questionType === questionType).map(i => ({ ...i }));
  }
  reset(): void { this.items.clear(); }
}

export class InMemoryExamDraftSetRepository implements ExamDraftSetRepository {
  private items = new Map<string, ExamDraftSet>();
  async create(item: ExamDraftSet): Promise<ExamDraftSet> {
    this.items.set(item.draftSetId, { ...item });
    return { ...item };
  }
  async findById(draftSetId: string): Promise<ExamDraftSet | null> {
    return this.items.get(draftSetId) ? { ...this.items.get(draftSetId)! } : null;
  }
  async findBySchoolId(schoolId: string): Promise<ExamDraftSet[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId).map(i => ({ ...i }));
  }
  async findBySchoolIdAndStatus(schoolId: string, status: string): Promise<ExamDraftSet[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId && i.status === status).map(i => ({ ...i }));
  }
  async findByBlueprintId(blueprintId: string): Promise<ExamDraftSet[]> {
    return [...this.items.values()].filter(i => i.blueprintId === blueprintId).map(i => ({ ...i }));
  }
  async findByBlueprintVersionId(blueprintVersionId: string): Promise<ExamDraftSet[]> {
    return [...this.items.values()].filter(i => i.blueprintVersionId === blueprintVersionId).map(i => ({ ...i }));
  }
  async update(item: ExamDraftSet): Promise<ExamDraftSet | null> {
    const existing = this.items.get(item.draftSetId);
    if (!existing) return null;
    this.items.set(item.draftSetId, { ...item });
    return { ...item };
  }
  reset(): void { this.items.clear(); }
}

export class InMemoryExamDraftRepository implements ExamDraftRepository {
  private items = new Map<string, ExamDraft>();
  async create(item: ExamDraft): Promise<ExamDraft> {
    this.items.set(item.draftId, { ...item });
    return { ...item };
  }
  async findById(draftId: string): Promise<ExamDraft | null> {
    return this.items.get(draftId) ? { ...this.items.get(draftId)! } : null;
  }
  async findByDraftSetId(draftSetId: string): Promise<ExamDraft[]> {
    return [...this.items.values()].filter(i => i.draftSetId === draftSetId).sort((a, b) => a.rank - b.rank).map(i => ({ ...i }));
  }
  async findBySchoolId(schoolId: string): Promise<ExamDraft[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId).map(i => ({ ...i }));
  }
  async findByRank(draftSetId: string, rank: number): Promise<ExamDraft | null> {
    const found = [...this.items.values()].find(i => i.draftSetId === draftSetId && i.rank === rank);
    return found ? { ...found } : null;
  }
  async update(item: ExamDraft): Promise<ExamDraft | null> {
    const existing = this.items.get(item.draftId);
    if (!existing) return null;
    this.items.set(item.draftId, { ...item });
    return { ...item };
  }
  reset(): void { this.items.clear(); }
}

export class InMemoryExamDraftQuestionRepository implements ExamDraftQuestionRepository {
  private items = new Map<string, ExamDraftQuestion>();
  async create(item: ExamDraftQuestion): Promise<ExamDraftQuestion> {
    this.items.set(item.draftQuestionId, { ...item });
    return { ...item };
  }
  async findById(draftQuestionId: string): Promise<ExamDraftQuestion | null> {
    return this.items.get(draftQuestionId) ? { ...this.items.get(draftQuestionId)! } : null;
  }
  async findByDraftId(draftId: string): Promise<ExamDraftQuestion[]> {
    return [...this.items.values()].filter(i => i.draftId === draftId).sort((a, b) => a.position - b.position).map(i => ({ ...i }));
  }
  async findBySchoolId(schoolId: string): Promise<ExamDraftQuestion[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId).map(i => ({ ...i }));
  }
  async findByQuestionId(questionId: string): Promise<ExamDraftQuestion[]> {
    return [...this.items.values()].filter(i => i.questionId === questionId).map(i => ({ ...i }));
  }
  async findByRequirementId(requirementId: string): Promise<ExamDraftQuestion[]> {
    return [...this.items.values()].filter(i => i.requirementId === requirementId).map(i => ({ ...i }));
  }
  async findByDraftIdAndPosition(draftId: string, position: number): Promise<ExamDraftQuestion | null> {
    const found = [...this.items.values()].find(i => i.draftId === draftId && i.position === position);
    return found ? { ...found } : null;
  }
  reset(): void { this.items.clear(); }
}

export class InMemoryQuestionSelectionRunRepository implements QuestionSelectionRunRepository {
  private items = new Map<string, QuestionSelectionRun>();
  async create(item: QuestionSelectionRun): Promise<QuestionSelectionRun> {
    this.items.set(item.selectionRunId, { ...item });
    return { ...item };
  }
  async findById(selectionRunId: string): Promise<QuestionSelectionRun | null> {
    return this.items.get(selectionRunId) ? { ...this.items.get(selectionRunId)! } : null;
  }
  async findBySchoolId(schoolId: string): Promise<QuestionSelectionRun[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId).map(i => ({ ...i }));
  }
  async findByBlueprintVersionId(blueprintVersionId: string): Promise<QuestionSelectionRun[]> {
    return [...this.items.values()].filter(i => i.blueprintVersionId === blueprintVersionId).map(i => ({ ...i }));
  }
  async findByDraftSetId(draftSetId: string): Promise<QuestionSelectionRun | null> {
    return [...this.items.values()].find(i => i.draftSetId === draftSetId) ? { ...([...this.items.values()].find(i => i.draftSetId === draftSetId)!) } : null;
  }
  async findByStatus(status: string): Promise<QuestionSelectionRun[]> {
    return [...this.items.values()].filter(i => i.status === status).map(i => ({ ...i }));
  }
  async update(item: QuestionSelectionRun): Promise<QuestionSelectionRun | null> {
    const existing = this.items.get(item.selectionRunId);
    if (!existing) return null;
    this.items.set(item.selectionRunId, { ...item });
    return { ...item };
  }
  reset(): void { this.items.clear(); }
}

export class InMemoryQuestionSelectionCandidateRepository implements QuestionSelectionCandidateRepository {
  private items = new Map<string, QuestionSelectionCandidate>();
  async create(item: QuestionSelectionCandidate): Promise<QuestionSelectionCandidate> {
    this.items.set(item.selectionCandidateId, { ...item });
    return { ...item };
  }
  async findById(selectionCandidateId: string): Promise<QuestionSelectionCandidate | null> {
    return this.items.get(selectionCandidateId) ? { ...this.items.get(selectionCandidateId)! } : null;
  }
  async findBySelectionRunId(selectionRunId: string): Promise<QuestionSelectionCandidate[]> {
    return [...this.items.values()].filter(i => i.selectionRunId === selectionRunId).map(i => ({ ...i }));
  }
  async findBySchoolId(schoolId: string): Promise<QuestionSelectionCandidate[]> {
    return [...this.items.values()].filter(i => i.schoolId === schoolId).map(i => ({ ...i }));
  }
  async findByQuestionId(questionId: string): Promise<QuestionSelectionCandidate[]> {
    return [...this.items.values()].filter(i => i.questionId === questionId).map(i => ({ ...i }));
  }
  async findByEligible(eligible: boolean): Promise<QuestionSelectionCandidate[]> {
    return [...this.items.values()].filter(i => i.eligible === eligible).map(i => ({ ...i }));
  }
  async findBySelected(selected: boolean): Promise<QuestionSelectionCandidate[]> {
    return [...this.items.values()].filter(i => i.selected === selected).map(i => ({ ...i }));
  }
  reset(): void { this.items.clear(); }
}

export function createInMemoryExamBlueprintRepositories() {
  return {
    blueprintRepo: new InMemoryExamBlueprintRepository(),
    blueprintVersionRepo: new InMemoryExamBlueprintVersionRepository(),
    requirementRepo: new InMemoryExamBlueprintRequirementRepository(),
    draftSetRepo: new InMemoryExamDraftSetRepository(),
    draftRepo: new InMemoryExamDraftRepository(),
    draftQuestionRepo: new InMemoryExamDraftQuestionRepository(),
    selectionRunRepo: new InMemoryQuestionSelectionRunRepository(),
    selectionCandidateRepo: new InMemoryQuestionSelectionCandidateRepository(),
  };
}
