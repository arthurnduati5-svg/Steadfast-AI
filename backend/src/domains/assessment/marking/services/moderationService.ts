import { ModerationDecision } from '../contracts/moderationContracts';
import { ModerationDecisionRepository, MarkingResultVersionRepository } from '../contracts/markingRepositoryContracts';
import { InMemoryModerationDecisionRepository, InMemoryMarkingResultVersionRepository } from '../repositories/inMemoryMarkingRepositories';

const ALLOWED_MODERATOR_ROLES = ['lead_teacher', 'department_head', 'admin'];

export interface CreateModerationParams {
  schoolId: string;
  markingResultVersionId: string;
  decision: string;
  safeReason: string;
  decidedByActorId: string;
  decidedByRole: string;
}

export class ModerationService {
  constructor(
    private moderationRepo: ModerationDecisionRepository = new InMemoryModerationDecisionRepository(),
    private resultRepo: MarkingResultVersionRepository = new InMemoryMarkingResultVersionRepository(),
  ) {}

  async createModerationDecision(params: CreateModerationParams): Promise<ModerationDecision> {
    if (!ALLOWED_MODERATOR_ROLES.includes(params.decidedByRole)) {
      throw new Error('FORBIDDEN: Only lead_teacher, department_head, or admin can create moderation decisions');
    }
    const result = await this.resultRepo.findById(params.markingResultVersionId);
    if (!result) throw new Error('NOT_FOUND: Marking result not found');
    const now = new Date().toISOString();
    const decision: ModerationDecision = {
      moderationDecisionId: crypto.randomUUID(),
      schoolId: params.schoolId,
      markingResultVersionId: params.markingResultVersionId,
      status: 'pending',
      decision: params.decision,
      safeReason: params.safeReason,
      decidedByActorId: params.decidedByActorId,
      decidedByRole: params.decidedByRole,
      createdAt: now,
    };
    return this.moderationRepo.create(decision);
  }

  async approveModeration(decisionId: string, actorId: string, role: string): Promise<ModerationDecision> {
    if (!ALLOWED_MODERATOR_ROLES.includes(role)) throw new Error('FORBIDDEN: Not authorized to approve moderation');
    const decision = await this.moderationRepo.findById(decisionId);
    if (!decision) throw new Error('NOT_FOUND: Moderation decision not found');
    decision.status = 'approved';
    decision.decidedByActorId = actorId;
    decision.decidedByRole = role;
    const updated = await this.moderationRepo.update(decision);
    const result = await this.resultRepo.findById(decision.markingResultVersionId);
    if (result) {
      result.status = 'moderated';
      await this.resultRepo.update(result);
    }
    return updated;
  }

  async adjustThroughModeration(decisionId: string, newMarks: number, reason: string): Promise<ModerationDecision> {
    const decision = await this.moderationRepo.findById(decisionId);
    if (!decision) throw new Error('NOT_FOUND: Moderation decision not found');
    decision.status = 'adjusted';
    decision.decision = 'adjust';
    decision.safeReason = reason;
    const updated = await this.moderationRepo.update(decision);
    const result = await this.resultRepo.findById(decision.markingResultVersionId);
    if (result) {
      result.marksAwarded = newMarks;
      result.status = 'moderated';
      result.safeTeacherSummary = `Marks adjusted through moderation: ${newMarks}`;
      await this.resultRepo.update(result);
    }
    return updated;
  }

  async returnToTeacher(decisionId: string, reason: string): Promise<ModerationDecision> {
    const decision = await this.moderationRepo.findById(decisionId);
    if (!decision) throw new Error('NOT_FOUND: Moderation decision not found');
    decision.status = 'approved';
    decision.decision = 'return_to_teacher';
    decision.safeReason = reason;
    return this.moderationRepo.update(decision);
  }

  async escalateModeration(decisionId: string, reason: string): Promise<ModerationDecision> {
    const decision = await this.moderationRepo.findById(decisionId);
    if (!decision) throw new Error('NOT_FOUND: Moderation decision not found');
    decision.status = 'pending';
    decision.decision = 'escalate';
    decision.safeReason = reason;
    return this.moderationRepo.update(decision);
  }

  async blockModeration(decisionId: string, reason: string): Promise<ModerationDecision> {
    const decision = await this.moderationRepo.findById(decisionId);
    if (!decision) throw new Error('NOT_FOUND: Moderation decision not found');
    decision.status = 'blocked';
    decision.decision = 'block';
    decision.safeReason = reason;
    const updated = await this.moderationRepo.update(decision);
    const result = await this.resultRepo.findById(decision.markingResultVersionId);
    if (result) {
      result.status = 'blocked';
      await this.resultRepo.update(result);
    }
    return updated;
  }
}
