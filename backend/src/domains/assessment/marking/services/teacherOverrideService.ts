import { TeacherOverride } from '../contracts/teacherReviewContracts';
import { MarkingResultVersion } from '../contracts/markingContracts';
import { ScoringSuggestion } from '../contracts/markingResultContracts';
import { ModerationDecision } from '../contracts/moderationContracts';
import { TeacherOverrideRepository, MarkingResultVersionRepository, ScoringSuggestionRepository, ModerationDecisionRepository, TeacherReviewItemRepository } from '../contracts/markingRepositoryContracts';
import { InMemoryTeacherOverrideRepository, InMemoryMarkingResultVersionRepository, InMemoryScoringSuggestionRepository, InMemoryModerationDecisionRepository, InMemoryTeacherReviewItemRepository } from '../repositories/inMemoryMarkingRepositories';

const ALLOWED_OVERRIDE_ROLES = ['teacher', 'lead_teacher', 'admin'];

export interface AdjustMarksParams {
  markingResultVersionId: string;
  previousMarks: number;
  newMarks: number;
  overrideReasonCode: string;
  safeReason: string;
  actorId: string;
  role: string;
  teacherReviewItemId?: string;
}

export class TeacherOverrideService {
  constructor(
    private overrideRepo: TeacherOverrideRepository = new InMemoryTeacherOverrideRepository(),
    private resultRepo: MarkingResultVersionRepository = new InMemoryMarkingResultVersionRepository(),
    private suggestionRepo: ScoringSuggestionRepository = new InMemoryScoringSuggestionRepository(),
    private moderationRepo: ModerationDecisionRepository = new InMemoryModerationDecisionRepository(),
    private reviewItemRepo: TeacherReviewItemRepository = new InMemoryTeacherReviewItemRepository(),
  ) {}

  async confirmResult(resultVersionId: string, actorId: string, role: string): Promise<TeacherOverride> {
    if (!ALLOWED_OVERRIDE_ROLES.includes(role)) throw new Error('FORBIDDEN: Only teacher/lead_teacher/admin can confirm results');
    const result = await this.resultRepo.findById(resultVersionId);
    if (!result) throw new Error('NOT_FOUND: Marking result not found');
    const now = new Date().toISOString();
    const override: TeacherOverride = {
      teacherOverrideId: crypto.randomUUID(),
      schoolId: result.schoolId,
      markingResultVersionId: resultVersionId,
      decision: 'confirm',
      previousMarks: result.marksAwarded,
      newMarks: result.marksAwarded,
      overrideReasonCode: 'teacher_confirmed',
      safeReason: 'Teacher confirmed the marking result.',
      decidedByActorId: actorId,
      decidedByRole: role,
      createdAt: now,
    };
    const saved = await this.overrideRepo.create(override);
    result.status = 'teacher_confirmed';
    result.safeTeacherSummary = 'Confirmed by teacher.';
    await this.resultRepo.update(result);
    return saved;
  }

  async adjustMarks(params: AdjustMarksParams): Promise<TeacherOverride> {
    if (!ALLOWED_OVERRIDE_ROLES.includes(params.role)) throw new Error('FORBIDDEN: Only teacher/lead_teacher/admin can adjust marks');
    const result = await this.resultRepo.findById(params.markingResultVersionId);
    if (!result) throw new Error('NOT_FOUND: Marking result not found');
    const now = new Date().toISOString();
    const override: TeacherOverride = {
      teacherOverrideId: crypto.randomUUID(),
      schoolId: result.schoolId,
      markingResultVersionId: params.markingResultVersionId,
      teacherReviewItemId: params.teacherReviewItemId,
      decision: 'adjust_marks',
      previousMarks: params.previousMarks,
      newMarks: params.newMarks,
      overrideReasonCode: params.overrideReasonCode,
      safeReason: params.safeReason,
      decidedByActorId: params.actorId,
      decidedByRole: params.role,
      createdAt: now,
    };
    const saved = await this.overrideRepo.create(override);
    result.marksAwarded = params.newMarks;
    result.status = 'teacher_overridden';
    result.safeTeacherSummary = `Marks adjusted by teacher: ${params.previousMarks} → ${params.newMarks}`;
    await this.resultRepo.update(result);
    return saved;
  }

  async routeToModeration(resultVersionId: string, reason: string): Promise<ModerationDecision> {
    const result = await this.resultRepo.findById(resultVersionId);
    if (!result) throw new Error('NOT_FOUND: Marking result not found');
    const now = new Date().toISOString();
    const decision: ModerationDecision = {
      moderationDecisionId: crypto.randomUUID(),
      schoolId: result.schoolId,
      markingResultVersionId: resultVersionId,
      status: 'pending',
      decision: 'uphold',
      safeReason: reason,
      decidedByActorId: '',
      decidedByRole: '',
      createdAt: now,
    };
    return this.moderationRepo.create(decision);
  }

  async rejectSuggestion(suggestionId: string, actorId: string, role: string, reason: string): Promise<ScoringSuggestion> {
    if (!ALLOWED_OVERRIDE_ROLES.includes(role)) throw new Error('FORBIDDEN: Only teacher/lead_teacher/admin can reject suggestions');
    const suggestion = await this.suggestionRepo.findById(suggestionId);
    if (!suggestion) throw new Error('NOT_FOUND: Suggestion not found');
    suggestion.status = 'rejected_by_teacher';
    suggestion.decidedByActorId = actorId;
    suggestion.rejectedAt = new Date().toISOString();
    suggestion.safeRationale = reason;
    return this.suggestionRepo.update(suggestion);
  }

  async blockResult(resultVersionId: string, reason: string): Promise<MarkingResultVersion> {
    const result = await this.resultRepo.findById(resultVersionId);
    if (!result) throw new Error('NOT_FOUND: Marking result not found');
    result.status = 'blocked';
    result.safeTeacherSummary = reason;
    result.requiresTeacherReview = false;
    return this.resultRepo.update(result);
  }
}
