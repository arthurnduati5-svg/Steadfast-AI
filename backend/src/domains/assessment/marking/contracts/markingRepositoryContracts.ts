import type { MarkingRun, MarkingResultVersion, SubmittedAnswerSnapshot } from './markingContracts';
import type { MarkingBreakdownItem, ScoringSuggestion } from './markingResultContracts';
import type { TeacherReviewGroup, TeacherReviewItem, TeacherOverride } from './teacherReviewContracts';
import type { ModerationDecision } from './moderationContracts';
import type { StudentMarkChallenge } from './studentChallengeContracts';

export interface MarkingRunRepository {
  create(run: MarkingRun): Promise<MarkingRun>;
  findById(markingRunId: string): Promise<MarkingRun | null>;
  findBySchoolId(schoolId: string): Promise<MarkingRun[]>;
  findBySchoolIdAndStatus(schoolId: string, status: string): Promise<MarkingRun[]>;
  findBySourceType(sourceType: string): Promise<MarkingRun[]>;
  update(run: MarkingRun): Promise<MarkingRun>;
  delete(markingRunId: string): Promise<void>;
}

export interface MarkingResultVersionRepository {
  create(result: MarkingResultVersion): Promise<MarkingResultVersion>;
  findById(markingResultVersionId: string): Promise<MarkingResultVersion | null>;
  findByMarkingRunId(markingRunId: string): Promise<MarkingResultVersion[]>;
  findByQuestionId(questionId: string): Promise<MarkingResultVersion[]>;
  findByQuestionVersionId(questionVersionId: string): Promise<MarkingResultVersion[]>;
  findByStatus(status: string): Promise<MarkingResultVersion[]>;
  findByRequiresTeacherReview(): Promise<MarkingResultVersion[]>;
  update(result: MarkingResultVersion): Promise<MarkingResultVersion>;
  delete(markingResultVersionId: string): Promise<void>;
}

export interface MarkingBreakdownItemRepository {
  create(item: MarkingBreakdownItem): Promise<MarkingBreakdownItem>;
  findById(breakdownItemId: string): Promise<MarkingBreakdownItem | null>;
  findByMarkingResultVersionId(markingResultVersionId: string): Promise<MarkingBreakdownItem[]>;
  findByDecision(decision: string): Promise<MarkingBreakdownItem[]>;
  update(item: MarkingBreakdownItem): Promise<MarkingBreakdownItem>;
  delete(breakdownItemId: string): Promise<void>;
}

export interface ScoringSuggestionRepository {
  create(suggestion: ScoringSuggestion): Promise<ScoringSuggestion>;
  findById(scoringSuggestionId: string): Promise<ScoringSuggestion | null>;
  findByMarkingResultVersionId(markingResultVersionId: string): Promise<ScoringSuggestion[]>;
  findBySuggestionSource(source: string): Promise<ScoringSuggestion[]>;
  findByStatus(status: string): Promise<ScoringSuggestion[]>;
  update(suggestion: ScoringSuggestion): Promise<ScoringSuggestion>;
  delete(scoringSuggestionId: string): Promise<void>;
}

export interface TeacherReviewGroupRepository {
  create(group: TeacherReviewGroup): Promise<TeacherReviewGroup>;
  findById(teacherReviewGroupId: string): Promise<TeacherReviewGroup | null>;
  findByMarkingRunId(markingRunId: string): Promise<TeacherReviewGroup[]>;
  findBySchoolId(schoolId: string): Promise<TeacherReviewGroup[]>;
  findByStatus(status: string): Promise<TeacherReviewGroup[]>;
  findByGroupType(groupType: string): Promise<TeacherReviewGroup[]>;
  update(group: TeacherReviewGroup): Promise<TeacherReviewGroup>;
  delete(teacherReviewGroupId: string): Promise<void>;
}

export interface TeacherReviewItemRepository {
  create(item: TeacherReviewItem): Promise<TeacherReviewItem>;
  findById(teacherReviewItemId: string): Promise<TeacherReviewItem | null>;
  findByTeacherReviewGroupId(groupId: string): Promise<TeacherReviewItem[]>;
  findByMarkingRunId(markingRunId: string): Promise<TeacherReviewItem[]>;
  findByMarkingResultVersionId(markingResultVersionId: string): Promise<TeacherReviewItem[]>;
  findByStatus(status: string): Promise<TeacherReviewItem[]>;
  findByAssignedToActorId(actorId: string): Promise<TeacherReviewItem[]>;
  update(item: TeacherReviewItem): Promise<TeacherReviewItem>;
  delete(teacherReviewItemId: string): Promise<void>;
}

export interface TeacherOverrideRepository {
  create(override: TeacherOverride): Promise<TeacherOverride>;
  findById(teacherOverrideId: string): Promise<TeacherOverride | null>;
  findByMarkingResultVersionId(markingResultVersionId: string): Promise<TeacherOverride[]>;
  findByDecision(decision: string): Promise<TeacherOverride[]>;
  findByDecidedByActorId(actorId: string): Promise<TeacherOverride[]>;
  update(override: TeacherOverride): Promise<TeacherOverride>;
  delete(teacherOverrideId: string): Promise<void>;
}

export interface ModerationDecisionRepository {
  create(decision: ModerationDecision): Promise<ModerationDecision>;
  findById(moderationDecisionId: string): Promise<ModerationDecision | null>;
  findByMarkingResultVersionId(markingResultVersionId: string): Promise<ModerationDecision[]>;
  findByStatus(status: string): Promise<ModerationDecision[]>;
  findByDecision(decision: string): Promise<ModerationDecision[]>;
  update(decision: ModerationDecision): Promise<ModerationDecision>;
  delete(moderationDecisionId: string): Promise<void>;
}

export interface StudentMarkChallengeRepository {
  create(challenge: StudentMarkChallenge): Promise<StudentMarkChallenge>;
  findById(studentMarkChallengeId: string): Promise<StudentMarkChallenge | null>;
  findByStudentId(studentId: string): Promise<StudentMarkChallenge[]>;
  findByMarkingResultVersionId(markingResultVersionId: string): Promise<StudentMarkChallenge[]>;
  findByStatus(status: string): Promise<StudentMarkChallenge[]>;
  update(challenge: StudentMarkChallenge): Promise<StudentMarkChallenge>;
  delete(studentMarkChallengeId: string): Promise<void>;
}
