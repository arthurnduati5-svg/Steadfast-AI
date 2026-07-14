import { MarkingRunRepository, MarkingResultVersionRepository, MarkingBreakdownItemRepository, ScoringSuggestionRepository, TeacherReviewGroupRepository, TeacherReviewItemRepository, TeacherOverrideRepository, ModerationDecisionRepository, StudentMarkChallengeRepository } from '../contracts/markingRepositoryContracts';
import { MarkingRun, MarkingResultVersion, SubmittedAnswerSnapshot } from '../contracts/markingContracts';
import { MarkingBreakdownItem, ScoringSuggestion } from '../contracts/markingResultContracts';
import { TeacherReviewGroup, TeacherReviewItem, TeacherOverride } from '../contracts/teacherReviewContracts';
import { ModerationDecision } from '../contracts/moderationContracts';
import { StudentMarkChallenge } from '../contracts/studentChallengeContracts';

export class InMemoryMarkingRunRepository implements MarkingRunRepository {
  private store = new Map<string, MarkingRun>();

  async create(run: MarkingRun): Promise<MarkingRun> {
    this.store.set(run.markingRunId, { ...run });
    return { ...run };
  }

  async findById(markingRunId: string): Promise<MarkingRun | null> {
    const run = this.store.get(markingRunId);
    return run ? { ...run } : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId).map(r => ({ ...r }));
  }

  async findBySchoolIdAndStatus(schoolId: string, status: string): Promise<MarkingRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.status === status).map(r => ({ ...r }));
  }

  async findBySourceType(sourceType: string): Promise<MarkingRun[]> {
    return Array.from(this.store.values()).filter(r => r.sourceType === sourceType).map(r => ({ ...r }));
  }

  async update(run: MarkingRun): Promise<MarkingRun> {
    this.store.set(run.markingRunId, { ...run });
    return { ...run };
  }

  async delete(markingRunId: string): Promise<void> {
    this.store.delete(markingRunId);
  }
}

export class InMemoryMarkingResultVersionRepository implements MarkingResultVersionRepository {
  private store = new Map<string, MarkingResultVersion>();

  async create(result: MarkingResultVersion): Promise<MarkingResultVersion> {
    this.store.set(result.markingResultVersionId, { ...result });
    return { ...result };
  }

  async findById(markingResultVersionId: string): Promise<MarkingResultVersion | null> {
    const r = this.store.get(markingResultVersionId);
    return r ? { ...r } : null;
  }

  async findByMarkingRunId(markingRunId: string): Promise<MarkingResultVersion[]> {
    return Array.from(this.store.values()).filter(r => r.markingRunId === markingRunId).map(r => ({ ...r }));
  }

  async findByQuestionId(questionId: string): Promise<MarkingResultVersion[]> {
    return Array.from(this.store.values()).filter(r => r.questionId === questionId).map(r => ({ ...r }));
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<MarkingResultVersion[]> {
    return Array.from(this.store.values()).filter(r => r.questionVersionId === questionVersionId).map(r => ({ ...r }));
  }

  async findByStatus(status: string): Promise<MarkingResultVersion[]> {
    return Array.from(this.store.values()).filter(r => r.status === status).map(r => ({ ...r }));
  }

  async findByRequiresTeacherReview(): Promise<MarkingResultVersion[]> {
    return Array.from(this.store.values()).filter(r => r.requiresTeacherReview).map(r => ({ ...r }));
  }

  async update(result: MarkingResultVersion): Promise<MarkingResultVersion> {
    this.store.set(result.markingResultVersionId, { ...result });
    return { ...result };
  }

  async delete(markingResultVersionId: string): Promise<void> {
    this.store.delete(markingResultVersionId);
  }
}

export class InMemoryMarkingBreakdownItemRepository implements MarkingBreakdownItemRepository {
  private store = new Map<string, MarkingBreakdownItem>();

  async create(item: MarkingBreakdownItem): Promise<MarkingBreakdownItem> {
    this.store.set(item.breakdownItemId, { ...item });
    return { ...item };
  }

  async findById(breakdownItemId: string): Promise<MarkingBreakdownItem | null> {
    const item = this.store.get(breakdownItemId);
    return item ? { ...item } : null;
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<MarkingBreakdownItem[]> {
    return Array.from(this.store.values()).filter(i => i.markingResultVersionId === markingResultVersionId).map(i => ({ ...i }));
  }

  async findByDecision(decision: string): Promise<MarkingBreakdownItem[]> {
    return Array.from(this.store.values()).filter(i => i.decision === decision).map(i => ({ ...i }));
  }

  async update(item: MarkingBreakdownItem): Promise<MarkingBreakdownItem> {
    this.store.set(item.breakdownItemId, { ...item });
    return { ...item };
  }

  async delete(breakdownItemId: string): Promise<void> {
    this.store.delete(breakdownItemId);
  }
}

export class InMemoryScoringSuggestionRepository implements ScoringSuggestionRepository {
  private store = new Map<string, ScoringSuggestion>();

  async create(suggestion: ScoringSuggestion): Promise<ScoringSuggestion> {
    this.store.set(suggestion.scoringSuggestionId, { ...suggestion });
    return { ...suggestion };
  }

  async findById(scoringSuggestionId: string): Promise<ScoringSuggestion | null> {
    const s = this.store.get(scoringSuggestionId);
    return s ? { ...s } : null;
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<ScoringSuggestion[]> {
    return Array.from(this.store.values()).filter(s => s.markingResultVersionId === markingResultVersionId).map(s => ({ ...s }));
  }

  async findBySuggestionSource(source: string): Promise<ScoringSuggestion[]> {
    return Array.from(this.store.values()).filter(s => s.suggestionSource === source).map(s => ({ ...s }));
  }

  async findByStatus(status: string): Promise<ScoringSuggestion[]> {
    return Array.from(this.store.values()).filter(s => s.status === status).map(s => ({ ...s }));
  }

  async update(suggestion: ScoringSuggestion): Promise<ScoringSuggestion> {
    this.store.set(suggestion.scoringSuggestionId, { ...suggestion });
    return { ...suggestion };
  }

  async delete(scoringSuggestionId: string): Promise<void> {
    this.store.delete(scoringSuggestionId);
  }
}

export class InMemoryTeacherReviewGroupRepository implements TeacherReviewGroupRepository {
  private store = new Map<string, TeacherReviewGroup>();

  async create(group: TeacherReviewGroup): Promise<TeacherReviewGroup> {
    this.store.set(group.teacherReviewGroupId, { ...group });
    return { ...group };
  }

  async findById(teacherReviewGroupId: string): Promise<TeacherReviewGroup | null> {
    const g = this.store.get(teacherReviewGroupId);
    return g ? { ...g } : null;
  }

  async findByMarkingRunId(markingRunId: string): Promise<TeacherReviewGroup[]> {
    return Array.from(this.store.values()).filter(g => g.markingRunId === markingRunId).map(g => ({ ...g }));
  }

  async findBySchoolId(schoolId: string): Promise<TeacherReviewGroup[]> {
    return Array.from(this.store.values()).filter(g => g.schoolId === schoolId).map(g => ({ ...g }));
  }

  async findByStatus(status: string): Promise<TeacherReviewGroup[]> {
    return Array.from(this.store.values()).filter(g => g.status === status).map(g => ({ ...g }));
  }

  async findByGroupType(groupType: string): Promise<TeacherReviewGroup[]> {
    return Array.from(this.store.values()).filter(g => g.groupType === groupType).map(g => ({ ...g }));
  }

  async update(group: TeacherReviewGroup): Promise<TeacherReviewGroup> {
    this.store.set(group.teacherReviewGroupId, { ...group });
    return { ...group };
  }

  async delete(teacherReviewGroupId: string): Promise<void> {
    this.store.delete(teacherReviewGroupId);
  }
}

export class InMemoryTeacherReviewItemRepository implements TeacherReviewItemRepository {
  private store = new Map<string, TeacherReviewItem>();

  async create(item: TeacherReviewItem): Promise<TeacherReviewItem> {
    this.store.set(item.teacherReviewItemId, { ...item });
    return { ...item };
  }

  async findById(teacherReviewItemId: string): Promise<TeacherReviewItem | null> {
    const item = this.store.get(teacherReviewItemId);
    return item ? { ...item } : null;
  }

  async findByTeacherReviewGroupId(groupId: string): Promise<TeacherReviewItem[]> {
    return Array.from(this.store.values()).filter(i => i.teacherReviewGroupId === groupId).map(i => ({ ...i }));
  }

  async findByMarkingRunId(markingRunId: string): Promise<TeacherReviewItem[]> {
    return Array.from(this.store.values()).filter(i => i.markingRunId === markingRunId).map(i => ({ ...i }));
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<TeacherReviewItem[]> {
    return Array.from(this.store.values()).filter(i => i.markingResultVersionId === markingResultVersionId).map(i => ({ ...i }));
  }

  async findByStatus(status: string): Promise<TeacherReviewItem[]> {
    return Array.from(this.store.values()).filter(i => i.status === status).map(i => ({ ...i }));
  }

  async findByAssignedToActorId(actorId: string): Promise<TeacherReviewItem[]> {
    return Array.from(this.store.values()).filter(i => i.assignedToActorId === actorId).map(i => ({ ...i }));
  }

  async update(item: TeacherReviewItem): Promise<TeacherReviewItem> {
    this.store.set(item.teacherReviewItemId, { ...item });
    return { ...item };
  }

  async delete(teacherReviewItemId: string): Promise<void> {
    this.store.delete(teacherReviewItemId);
  }
}

export class InMemoryTeacherOverrideRepository implements TeacherOverrideRepository {
  private store = new Map<string, TeacherOverride>();

  async create(override: TeacherOverride): Promise<TeacherOverride> {
    this.store.set(override.teacherOverrideId, { ...override });
    return { ...override };
  }

  async findById(teacherOverrideId: string): Promise<TeacherOverride | null> {
    const o = this.store.get(teacherOverrideId);
    return o ? { ...o } : null;
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<TeacherOverride[]> {
    return Array.from(this.store.values()).filter(o => o.markingResultVersionId === markingResultVersionId).map(o => ({ ...o }));
  }

  async findByDecision(decision: string): Promise<TeacherOverride[]> {
    return Array.from(this.store.values()).filter(o => o.decision === decision).map(o => ({ ...o }));
  }

  async findByDecidedByActorId(actorId: string): Promise<TeacherOverride[]> {
    return Array.from(this.store.values()).filter(o => o.decidedByActorId === actorId).map(o => ({ ...o }));
  }

  async update(override: TeacherOverride): Promise<TeacherOverride> {
    this.store.set(override.teacherOverrideId, { ...override });
    return { ...override };
  }

  async delete(teacherOverrideId: string): Promise<void> {
    this.store.delete(teacherOverrideId);
  }
}

export class InMemoryModerationDecisionRepository implements ModerationDecisionRepository {
  private store = new Map<string, ModerationDecision>();

  async create(decision: ModerationDecision): Promise<ModerationDecision> {
    this.store.set(decision.moderationDecisionId, { ...decision });
    return { ...decision };
  }

  async findById(moderationDecisionId: string): Promise<ModerationDecision | null> {
    const d = this.store.get(moderationDecisionId);
    return d ? { ...d } : null;
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<ModerationDecision[]> {
    return Array.from(this.store.values()).filter(d => d.markingResultVersionId === markingResultVersionId).map(d => ({ ...d }));
  }

  async findByStatus(status: string): Promise<ModerationDecision[]> {
    return Array.from(this.store.values()).filter(d => d.status === status).map(d => ({ ...d }));
  }

  async findByDecision(decision: string): Promise<ModerationDecision[]> {
    return Array.from(this.store.values()).filter(d => d.decision === decision).map(d => ({ ...d }));
  }

  async update(decision: ModerationDecision): Promise<ModerationDecision> {
    this.store.set(decision.moderationDecisionId, { ...decision });
    return { ...decision };
  }

  async delete(moderationDecisionId: string): Promise<void> {
    this.store.delete(moderationDecisionId);
  }
}

export class InMemoryStudentMarkChallengeRepository implements StudentMarkChallengeRepository {
  private store = new Map<string, StudentMarkChallenge>();

  async create(challenge: StudentMarkChallenge): Promise<StudentMarkChallenge> {
    this.store.set(challenge.studentMarkChallengeId, { ...challenge });
    return { ...challenge };
  }

  async findById(studentMarkChallengeId: string): Promise<StudentMarkChallenge | null> {
    const c = this.store.get(studentMarkChallengeId);
    return c ? { ...c } : null;
  }

  async findByStudentId(studentId: string): Promise<StudentMarkChallenge[]> {
    return Array.from(this.store.values()).filter(c => c.studentId === studentId).map(c => ({ ...c }));
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<StudentMarkChallenge[]> {
    return Array.from(this.store.values()).filter(c => c.markingResultVersionId === markingResultVersionId).map(c => ({ ...c }));
  }

  async findByStatus(status: string): Promise<StudentMarkChallenge[]> {
    return Array.from(this.store.values()).filter(c => c.status === status).map(c => ({ ...c }));
  }

  async update(challenge: StudentMarkChallenge): Promise<StudentMarkChallenge> {
    this.store.set(challenge.studentMarkChallengeId, { ...challenge });
    return { ...challenge };
  }

  async delete(studentMarkChallengeId: string): Promise<void> {
    this.store.delete(studentMarkChallengeId);
  }
}
