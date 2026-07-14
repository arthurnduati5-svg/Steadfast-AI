import { TeacherReviewGroup, TeacherReviewItem } from '../contracts/teacherReviewContracts';
import { TeacherReviewGroupRepository, TeacherReviewItemRepository } from '../contracts/markingRepositoryContracts';
import { InMemoryTeacherReviewGroupRepository, InMemoryTeacherReviewItemRepository } from '../repositories/inMemoryMarkingRepositories';

export interface CreateReviewItemParams {
  schoolId: string;
  markingRunId: string;
  markingResultVersionId: string;
  reasonCode: string;
  safeSummary: string;
}

export interface CreateReviewGroupParams {
  schoolId: string;
  markingRunId: string;
  groupType: string;
  reasonCode: string;
  questionId: string;
  questionVersionId: string;
  safeSummary: string;
  recommendedAction: string;
}

const ALLOWED_REVIEWER_ROLES = ['teacher', 'lead_teacher', 'admin'];

export class TeacherReviewQueueService {
  constructor(
    private groupRepo: TeacherReviewGroupRepository = new InMemoryTeacherReviewGroupRepository(),
    private itemRepo: TeacherReviewItemRepository = new InMemoryTeacherReviewItemRepository(),
  ) {}

  async createReviewItem(params: CreateReviewItemParams): Promise<TeacherReviewItem> {
    const now = new Date().toISOString();
    const item: TeacherReviewItem = {
      teacherReviewItemId: crypto.randomUUID(),
      schoolId: params.schoolId,
      teacherReviewGroupId: '',
      markingRunId: params.markingRunId,
      markingResultVersionId: params.markingResultVersionId,
      status: 'open',
      reviewReasonCode: params.reasonCode,
      priority: 1,
      safeSummary: params.safeSummary,
      createdAt: now,
      updatedAt: now,
    };
    return this.itemRepo.create(item);
  }

  async createOrUpdateReviewGroup(params: CreateReviewGroupParams): Promise<TeacherReviewGroup> {
    const existing = await this.groupRepo.findByMarkingRunId(params.markingRunId);
    const match = existing.find(
      g => g.questionVersionId === params.questionVersionId && g.reasonCode === params.reasonCode && g.status === 'open'
    );
    if (match) {
      match.itemCount += 1;
      match.safeSummary = params.safeSummary;
      match.updatedAt = new Date().toISOString();
      return this.groupRepo.update(match);
    }
    const now = new Date().toISOString();
    const group: TeacherReviewGroup = {
      teacherReviewGroupId: crypto.randomUUID(),
      schoolId: params.schoolId,
      markingRunId: params.markingRunId,
      status: 'open',
      groupType: params.groupType,
      reasonCode: params.reasonCode,
      questionId: params.questionId,
      questionVersionId: params.questionVersionId,
      itemCount: 1,
      safeSummary: params.safeSummary,
      recommendedAction: params.recommendedAction,
      createdAt: now,
      updatedAt: now,
    };
    return this.groupRepo.create(group);
  }

  async listOpenReviewGroups(schoolId: string): Promise<TeacherReviewGroup[]> {
    return this.groupRepo.findBySchoolId(schoolId);
  }

  async listReviewItemsForGroup(groupId: string): Promise<TeacherReviewItem[]> {
    return this.itemRepo.findByTeacherReviewGroupId(groupId);
  }

  async assignReviewItem(itemId: string, actorId: string): Promise<TeacherReviewItem> {
    const item = await this.itemRepo.findById(itemId);
    if (!item) throw new Error('NOT_FOUND: Review item not found');
    item.assignedToActorId = actorId;
    item.status = 'assigned';
    item.updatedAt = new Date().toISOString();
    return this.itemRepo.update(item);
  }

  async resolveReviewItem(itemId: string, resolution: string): Promise<TeacherReviewItem> {
    const item = await this.itemRepo.findById(itemId);
    if (!item) throw new Error('NOT_FOUND: Review item not found');
    item.status = 'resolved';
    item.safeSummary = resolution;
    item.updatedAt = new Date().toISOString();
    item.resolvedAt = new Date().toISOString();
    return this.itemRepo.update(item);
  }
}
