import { PrismaClient } from '@prisma/client';
import { MarkingRunRepository, MarkingResultVersionRepository, MarkingBreakdownItemRepository, ScoringSuggestionRepository, TeacherReviewGroupRepository, TeacherReviewItemRepository, TeacherOverrideRepository, ModerationDecisionRepository, StudentMarkChallengeRepository } from '../contracts/markingRepositoryContracts';
import { MarkingRun, MarkingResultVersion } from '../contracts/markingContracts';
import { MarkingBreakdownItem, ScoringSuggestion } from '../contracts/markingResultContracts';
import { TeacherReviewGroup, TeacherReviewItem, TeacherOverride } from '../contracts/teacherReviewContracts';
import { ModerationDecision } from '../contracts/moderationContracts';
import { StudentMarkChallenge } from '../contracts/studentChallengeContracts';

function mapRunFromPrisma(data: any): MarkingRun {
  return { ...data, policyVersionRefsJson: data.policyVersionRefsJson ? JSON.parse(data.policyVersionRefsJson) : undefined, createdAt: data.createdAt?.toISOString?.() ?? data.createdAt, updatedAt: data.updatedAt?.toISOString?.() ?? data.updatedAt, completedAt: data.completedAt?.toISOString?.() ?? data.completedAt };
}

function mapRunToPrisma(data: Partial<MarkingRun>): any {
  return { ...data, policyVersionRefsJson: data.policyVersionRefsJson ? JSON.stringify(data.policyVersionRefsJson) : undefined };
}

function mapResultFromPrisma(data: any): MarkingResultVersion {
  return { ...data, createdAt: data.createdAt?.toISOString?.() ?? data.createdAt, supersededAt: data.supersededAt?.toISOString?.() ?? data.supersededAt };
}

function mapBreakdownFromPrisma(data: any): MarkingBreakdownItem {
  return { ...data, createdAt: data.createdAt?.toISOString?.() ?? data.createdAt };
}

function mapSuggestionFromPrisma(data: any): ScoringSuggestion {
  return { ...data, reasonCodesJson: data.reasonCodesJson ? JSON.parse(data.reasonCodesJson) : undefined, createdAt: data.createdAt?.toISOString?.() ?? data.createdAt, acceptedAt: data.acceptedAt?.toISOString?.() ?? data.acceptedAt, rejectedAt: data.rejectedAt?.toISOString?.() ?? data.rejectedAt };
}

function mapGroupFromPrisma(data: any): TeacherReviewGroup {
  return { ...data, createdAt: data.createdAt?.toISOString?.() ?? data.createdAt, updatedAt: data.updatedAt?.toISOString?.() ?? data.updatedAt, closedAt: data.closedAt?.toISOString?.() ?? data.closedAt };
}

function mapItemFromPrisma(data: any): TeacherReviewItem {
  return { ...data, createdAt: data.createdAt?.toISOString?.() ?? data.createdAt, updatedAt: data.updatedAt?.toISOString?.() ?? data.updatedAt, resolvedAt: data.resolvedAt?.toISOString?.() ?? data.resolvedAt };
}

function mapOverrideFromPrisma(data: any): TeacherOverride {
  return { ...data, createdAt: data.createdAt?.toISOString?.() ?? data.createdAt };
}

function mapModerationFromPrisma(data: any): ModerationDecision {
  return { ...data, createdAt: data.createdAt?.toISOString?.() ?? data.createdAt };
}

function mapChallengeFromPrisma(data: any): StudentMarkChallenge {
  return { ...data, createdAt: data.createdAt?.toISOString?.() ?? data.createdAt, reviewedAt: data.reviewedAt?.toISOString?.() ?? data.reviewedAt };
}

export class PrismaMarkingRunRepository implements MarkingRunRepository {
  constructor(private prisma: PrismaClient) {}

  async create(run: MarkingRun): Promise<MarkingRun> {
    const created = await this.prisma.markingRunRecord.create({ data: mapRunToPrisma(run) });
    return mapRunFromPrisma(created);
  }

  async findById(markingRunId: string): Promise<MarkingRun | null> {
    const found = await this.prisma.markingRunRecord.findUnique({ where: { markingRunId } });
    return found ? mapRunFromPrisma(found) : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingRun[]> {
    const list = await this.prisma.markingRunRecord.findMany({ where: { schoolId } });
    return list.map(mapRunFromPrisma);
  }

  async findBySchoolIdAndStatus(schoolId: string, status: string): Promise<MarkingRun[]> {
    const list = await this.prisma.markingRunRecord.findMany({ where: { schoolId, status } });
    return list.map(mapRunFromPrisma);
  }

  async findBySourceType(sourceType: string): Promise<MarkingRun[]> {
    const list = await this.prisma.markingRunRecord.findMany({ where: { sourceType } });
    return list.map(mapRunFromPrisma);
  }

  async update(run: MarkingRun): Promise<MarkingRun> {
    const updated = await this.prisma.markingRunRecord.update({ where: { markingRunId: run.markingRunId }, data: mapRunToPrisma(run) });
    return mapRunFromPrisma(updated);
  }

  async delete(markingRunId: string): Promise<void> {
    await this.prisma.markingRunRecord.delete({ where: { markingRunId } });
  }
}

export class PrismaMarkingResultVersionRepository implements MarkingResultVersionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(result: MarkingResultVersion): Promise<MarkingResultVersion> {
    const created = await this.prisma.markingResultVersionRecord.create({ data: result as any });
    return mapResultFromPrisma(created);
  }

  async findById(markingResultVersionId: string): Promise<MarkingResultVersion | null> {
    const found = await this.prisma.markingResultVersionRecord.findUnique({ where: { markingResultVersionId } });
    return found ? mapResultFromPrisma(found) : null;
  }

  async findByMarkingRunId(markingRunId: string): Promise<MarkingResultVersion[]> {
    const list = await this.prisma.markingResultVersionRecord.findMany({ where: { markingRunId } });
    return list.map(mapResultFromPrisma);
  }

  async findByQuestionId(questionId: string): Promise<MarkingResultVersion[]> {
    const list = await this.prisma.markingResultVersionRecord.findMany({ where: { questionId } });
    return list.map(mapResultFromPrisma);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<MarkingResultVersion[]> {
    const list = await this.prisma.markingResultVersionRecord.findMany({ where: { questionVersionId } });
    return list.map(mapResultFromPrisma);
  }

  async findByStatus(status: string): Promise<MarkingResultVersion[]> {
    const list = await this.prisma.markingResultVersionRecord.findMany({ where: { status } });
    return list.map(mapResultFromPrisma);
  }

  async findByRequiresTeacherReview(): Promise<MarkingResultVersion[]> {
    const list = await this.prisma.markingResultVersionRecord.findMany({ where: { requiresTeacherReview: true } });
    return list.map(mapResultFromPrisma);
  }

  async update(result: MarkingResultVersion): Promise<MarkingResultVersion> {
    const { markingResultVersionId, ...data } = result;
    const updated = await this.prisma.markingResultVersionRecord.update({ where: { markingResultVersionId }, data: data as any });
    return mapResultFromPrisma(updated);
  }

  async delete(markingResultVersionId: string): Promise<void> {
    await this.prisma.markingResultVersionRecord.delete({ where: { markingResultVersionId } });
  }
}

export class PrismaMarkingBreakdownItemRepository implements MarkingBreakdownItemRepository {
  constructor(private prisma: PrismaClient) {}

  async create(item: MarkingBreakdownItem): Promise<MarkingBreakdownItem> {
    const created = await this.prisma.markingBreakdownItemRecord.create({ data: item as any });
    return mapBreakdownFromPrisma(created);
  }

  async findById(breakdownItemId: string): Promise<MarkingBreakdownItem | null> {
    const found = await this.prisma.markingBreakdownItemRecord.findUnique({ where: { breakdownItemId } });
    return found ? mapBreakdownFromPrisma(found) : null;
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<MarkingBreakdownItem[]> {
    const list = await this.prisma.markingBreakdownItemRecord.findMany({ where: { markingResultVersionId } });
    return list.map(mapBreakdownFromPrisma);
  }

  async findByDecision(decision: string): Promise<MarkingBreakdownItem[]> {
    const list = await this.prisma.markingBreakdownItemRecord.findMany({ where: { decision } });
    return list.map(mapBreakdownFromPrisma);
  }

  async update(item: MarkingBreakdownItem): Promise<MarkingBreakdownItem> {
    const { breakdownItemId, ...data } = item;
    const updated = await this.prisma.markingBreakdownItemRecord.update({ where: { breakdownItemId }, data: data as any });
    return mapBreakdownFromPrisma(updated);
  }

  async delete(breakdownItemId: string): Promise<void> {
    await this.prisma.markingBreakdownItemRecord.delete({ where: { breakdownItemId } });
  }
}

export class PrismaScoringSuggestionRepository implements ScoringSuggestionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(suggestion: ScoringSuggestion): Promise<ScoringSuggestion> {
    const data = { ...suggestion, reasonCodesJson: suggestion.reasonCodesJson ? JSON.stringify(suggestion.reasonCodesJson) : undefined };
    const created = await this.prisma.scoringSuggestionRecord.create({ data: data as any });
    return mapSuggestionFromPrisma(created);
  }

  async findById(scoringSuggestionId: string): Promise<ScoringSuggestion | null> {
    const found = await this.prisma.scoringSuggestionRecord.findUnique({ where: { scoringSuggestionId } });
    return found ? mapSuggestionFromPrisma(found) : null;
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<ScoringSuggestion[]> {
    const list = await this.prisma.scoringSuggestionRecord.findMany({ where: { markingResultVersionId } });
    return list.map(mapSuggestionFromPrisma);
  }

  async findBySuggestionSource(source: string): Promise<ScoringSuggestion[]> {
    const list = await this.prisma.scoringSuggestionRecord.findMany({ where: { suggestionSource: source } });
    return list.map(mapSuggestionFromPrisma);
  }

  async findByStatus(status: string): Promise<ScoringSuggestion[]> {
    const list = await this.prisma.scoringSuggestionRecord.findMany({ where: { status } });
    return list.map(mapSuggestionFromPrisma);
  }

  async update(suggestion: ScoringSuggestion): Promise<ScoringSuggestion> {
    const { scoringSuggestionId, ...data } = suggestion;
    const updateData: any = { ...data };
    if (data.reasonCodesJson) updateData.reasonCodesJson = JSON.stringify(data.reasonCodesJson);
    const updated = await this.prisma.scoringSuggestionRecord.update({ where: { scoringSuggestionId }, data: updateData });
    return mapSuggestionFromPrisma(updated);
  }

  async delete(scoringSuggestionId: string): Promise<void> {
    await this.prisma.scoringSuggestionRecord.delete({ where: { scoringSuggestionId } });
  }
}

export class PrismaTeacherReviewGroupRepository implements TeacherReviewGroupRepository {
  constructor(private prisma: PrismaClient) {}

  async create(group: TeacherReviewGroup): Promise<TeacherReviewGroup> {
    const created = await this.prisma.teacherReviewGroupRecord.create({ data: group as any });
    return mapGroupFromPrisma(created);
  }

  async findById(teacherReviewGroupId: string): Promise<TeacherReviewGroup | null> {
    const found = await this.prisma.teacherReviewGroupRecord.findUnique({ where: { teacherReviewGroupId } });
    return found ? mapGroupFromPrisma(found) : null;
  }

  async findByMarkingRunId(markingRunId: string): Promise<TeacherReviewGroup[]> {
    const list = await this.prisma.teacherReviewGroupRecord.findMany({ where: { markingRunId } });
    return list.map(mapGroupFromPrisma);
  }

  async findBySchoolId(schoolId: string): Promise<TeacherReviewGroup[]> {
    const list = await this.prisma.teacherReviewGroupRecord.findMany({ where: { schoolId } });
    return list.map(mapGroupFromPrisma);
  }

  async findByStatus(status: string): Promise<TeacherReviewGroup[]> {
    const list = await this.prisma.teacherReviewGroupRecord.findMany({ where: { status } });
    return list.map(mapGroupFromPrisma);
  }

  async findByGroupType(groupType: string): Promise<TeacherReviewGroup[]> {
    const list = await this.prisma.teacherReviewGroupRecord.findMany({ where: { groupType } });
    return list.map(mapGroupFromPrisma);
  }

  async update(group: TeacherReviewGroup): Promise<TeacherReviewGroup> {
    const { teacherReviewGroupId, ...data } = group;
    const updated = await this.prisma.teacherReviewGroupRecord.update({ where: { teacherReviewGroupId }, data: data as any });
    return mapGroupFromPrisma(updated);
  }

  async delete(teacherReviewGroupId: string): Promise<void> {
    await this.prisma.teacherReviewGroupRecord.delete({ where: { teacherReviewGroupId } });
  }
}

export class PrismaTeacherReviewItemRepository implements TeacherReviewItemRepository {
  constructor(private prisma: PrismaClient) {}

  async create(item: TeacherReviewItem): Promise<TeacherReviewItem> {
    const created = await this.prisma.teacherReviewItemRecord.create({ data: item as any });
    return mapItemFromPrisma(created);
  }

  async findById(teacherReviewItemId: string): Promise<TeacherReviewItem | null> {
    const found = await this.prisma.teacherReviewItemRecord.findUnique({ where: { teacherReviewItemId } });
    return found ? mapItemFromPrisma(found) : null;
  }

  async findByTeacherReviewGroupId(groupId: string): Promise<TeacherReviewItem[]> {
    const list = await this.prisma.teacherReviewItemRecord.findMany({ where: { teacherReviewGroupId: groupId } });
    return list.map(mapItemFromPrisma);
  }

  async findByMarkingRunId(markingRunId: string): Promise<TeacherReviewItem[]> {
    const list = await this.prisma.teacherReviewItemRecord.findMany({ where: { markingRunId } });
    return list.map(mapItemFromPrisma);
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<TeacherReviewItem[]> {
    const list = await this.prisma.teacherReviewItemRecord.findMany({ where: { markingResultVersionId } });
    return list.map(mapItemFromPrisma);
  }

  async findByStatus(status: string): Promise<TeacherReviewItem[]> {
    const list = await this.prisma.teacherReviewItemRecord.findMany({ where: { status } });
    return list.map(mapItemFromPrisma);
  }

  async findByAssignedToActorId(actorId: string): Promise<TeacherReviewItem[]> {
    const list = await this.prisma.teacherReviewItemRecord.findMany({ where: { assignedToActorId: actorId } });
    return list.map(mapItemFromPrisma);
  }

  async update(item: TeacherReviewItem): Promise<TeacherReviewItem> {
    const { teacherReviewItemId, ...data } = item;
    const updated = await this.prisma.teacherReviewItemRecord.update({ where: { teacherReviewItemId }, data: data as any });
    return mapItemFromPrisma(updated);
  }

  async delete(teacherReviewItemId: string): Promise<void> {
    await this.prisma.teacherReviewItemRecord.delete({ where: { teacherReviewItemId } });
  }
}

export class PrismaTeacherOverrideRepository implements TeacherOverrideRepository {
  constructor(private prisma: PrismaClient) {}

  async create(override: TeacherOverride): Promise<TeacherOverride> {
    const created = await this.prisma.teacherOverrideRecord.create({ data: override as any });
    return mapOverrideFromPrisma(created);
  }

  async findById(teacherOverrideId: string): Promise<TeacherOverride | null> {
    const found = await this.prisma.teacherOverrideRecord.findUnique({ where: { teacherOverrideId } });
    return found ? mapOverrideFromPrisma(found) : null;
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<TeacherOverride[]> {
    const list = await this.prisma.teacherOverrideRecord.findMany({ where: { markingResultVersionId } });
    return list.map(mapOverrideFromPrisma);
  }

  async findByDecision(decision: string): Promise<TeacherOverride[]> {
    const list = await this.prisma.teacherOverrideRecord.findMany({ where: { decision } });
    return list.map(mapOverrideFromPrisma);
  }

  async findByDecidedByActorId(actorId: string): Promise<TeacherOverride[]> {
    const list = await this.prisma.teacherOverrideRecord.findMany({ where: { decidedByActorId: actorId } });
    return list.map(mapOverrideFromPrisma);
  }

  async update(override: TeacherOverride): Promise<TeacherOverride> {
    const { teacherOverrideId, ...data } = override;
    const updated = await this.prisma.teacherOverrideRecord.update({ where: { teacherOverrideId }, data: data as any });
    return mapOverrideFromPrisma(updated);
  }

  async delete(teacherOverrideId: string): Promise<void> {
    await this.prisma.teacherOverrideRecord.delete({ where: { teacherOverrideId } });
  }
}

export class PrismaModerationDecisionRepository implements ModerationDecisionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(decision: ModerationDecision): Promise<ModerationDecision> {
    const created = await this.prisma.moderationDecisionRecord.create({ data: decision as any });
    return mapModerationFromPrisma(created);
  }

  async findById(moderationDecisionId: string): Promise<ModerationDecision | null> {
    const found = await this.prisma.moderationDecisionRecord.findUnique({ where: { moderationDecisionId } });
    return found ? mapModerationFromPrisma(found) : null;
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<ModerationDecision[]> {
    const list = await this.prisma.moderationDecisionRecord.findMany({ where: { markingResultVersionId } });
    return list.map(mapModerationFromPrisma);
  }

  async findByStatus(status: string): Promise<ModerationDecision[]> {
    const list = await this.prisma.moderationDecisionRecord.findMany({ where: { status } });
    return list.map(mapModerationFromPrisma);
  }

  async findByDecision(decision: string): Promise<ModerationDecision[]> {
    const list = await this.prisma.moderationDecisionRecord.findMany({ where: { decision } });
    return list.map(mapModerationFromPrisma);
  }

  async update(decision: ModerationDecision): Promise<ModerationDecision> {
    const { moderationDecisionId, ...data } = decision;
    const updated = await this.prisma.moderationDecisionRecord.update({ where: { moderationDecisionId }, data: data as any });
    return mapModerationFromPrisma(updated);
  }

  async delete(moderationDecisionId: string): Promise<void> {
    await this.prisma.moderationDecisionRecord.delete({ where: { moderationDecisionId } });
  }
}

export class PrismaStudentMarkChallengeRepository implements StudentMarkChallengeRepository {
  constructor(private prisma: PrismaClient) {}

  async create(challenge: StudentMarkChallenge): Promise<StudentMarkChallenge> {
    const created = await this.prisma.studentMarkChallengeRecord.create({ data: challenge as any });
    return mapChallengeFromPrisma(created);
  }

  async findById(studentMarkChallengeId: string): Promise<StudentMarkChallenge | null> {
    const found = await this.prisma.studentMarkChallengeRecord.findUnique({ where: { studentMarkChallengeId } });
    return found ? mapChallengeFromPrisma(found) : null;
  }

  async findByStudentId(studentId: string): Promise<StudentMarkChallenge[]> {
    const list = await this.prisma.studentMarkChallengeRecord.findMany({ where: { studentId } });
    return list.map(mapChallengeFromPrisma);
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<StudentMarkChallenge[]> {
    const list = await this.prisma.studentMarkChallengeRecord.findMany({ where: { markingResultVersionId } });
    return list.map(mapChallengeFromPrisma);
  }

  async findByStatus(status: string): Promise<StudentMarkChallenge[]> {
    const list = await this.prisma.studentMarkChallengeRecord.findMany({ where: { status } });
    return list.map(mapChallengeFromPrisma);
  }

  async update(challenge: StudentMarkChallenge): Promise<StudentMarkChallenge> {
    const { studentMarkChallengeId, ...data } = challenge;
    const updated = await this.prisma.studentMarkChallengeRecord.update({ where: { studentMarkChallengeId }, data: data as any });
    return mapChallengeFromPrisma(updated);
  }

  async delete(studentMarkChallengeId: string): Promise<void> {
    await this.prisma.studentMarkChallengeRecord.delete({ where: { studentMarkChallengeId } });
  }
}
