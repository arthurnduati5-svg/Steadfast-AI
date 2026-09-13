import type {
  ApprovedSource, ContentGapRecord, ContentGovernanceAuditRecord,
  ContentItem, CurriculumFamily, CurriculumTopic, CurriculumSkill,
  CurriculumVersion, LearningObjective, PrerequisiteLink,
} from '../../task022ContentGovernanceContracts';

export interface ICurriculumVersionRepository {
  create(version: CurriculumVersion): Promise<CurriculumVersion>;
  update(version: CurriculumVersion): Promise<CurriculumVersion>;
  findById(id: string): Promise<CurriculumVersion | null>;
  findActive(schoolId?: string): Promise<CurriculumVersion[]>;
  findByFamily(family: CurriculumFamily): Promise<CurriculumVersion[]>;
  findByFamilyAndVersion(family: CurriculumFamily, versionCode: string, schoolId?: string): Promise<CurriculumVersion | null>;
  list(): Promise<CurriculumVersion[]>;
}

export interface ICurriculumTopicRepository {
  create(topic: CurriculumTopic): Promise<CurriculumTopic>;
  update(topic: CurriculumTopic): Promise<CurriculumTopic>;
  findById(id: string): Promise<CurriculumTopic | null>;
  findBySubject(family: CurriculumFamily, subject: string): Promise<CurriculumTopic[]>;
  findByCurriculumVersion(versionId: string): Promise<CurriculumTopic[]>;
  list(): Promise<CurriculumTopic[]>;
}

export interface ICurriculumSkillRepository {
  create(skill: CurriculumSkill): Promise<CurriculumSkill>;
  update(skill: CurriculumSkill): Promise<CurriculumSkill>;
  findById(id: string): Promise<CurriculumSkill | null>;
  findByTopic(topicId: string): Promise<CurriculumSkill[]>;
  list(): Promise<CurriculumSkill[]>;
}

export interface ILearningObjectiveRepository {
  create(objective: LearningObjective): Promise<LearningObjective>;
  update(objective: LearningObjective): Promise<LearningObjective>;
  findById(id: string): Promise<LearningObjective | null>;
  findBySkill(skillId: string): Promise<LearningObjective[]>;
  list(): Promise<LearningObjective[]>;
}

export interface IPrerequisiteLinkRepository {
  create(link: PrerequisiteLink): Promise<PrerequisiteLink>;
  findByFromSkill(skillId: string): Promise<PrerequisiteLink[]>;
  findByToSkill(skillId: string): Promise<PrerequisiteLink[]>;
  list(): Promise<PrerequisiteLink[]>;
}

export interface IApprovedSourceRepository {
  create(source: ApprovedSource): Promise<ApprovedSource>;
  update(source: ApprovedSource): Promise<ApprovedSource>;
  findById(id: string): Promise<ApprovedSource | null>;
  findByFamily(family: CurriculumFamily): Promise<ApprovedSource[]>;
  findBySchool(schoolId: string): Promise<ApprovedSource[]>;
  findByApprovalStatus(status: string): Promise<ApprovedSource[]>;
  findApproved(family?: CurriculumFamily): Promise<ApprovedSource[]>;
  list(): Promise<ApprovedSource[]>;
}

export interface IContentItemRepository {
  create(item: ContentItem): Promise<ContentItem>;
  update(item: ContentItem): Promise<ContentItem>;
  findById(id: string): Promise<ContentItem | null>;
  findByTopic(topicId: string): Promise<ContentItem[]>;
  findBySkill(skillId: string): Promise<ContentItem[]>;
  findByStatus(status: string): Promise<ContentItem[]>;
  list(): Promise<ContentItem[]>;
}

export interface IContentGapRepository {
  create(gap: ContentGapRecord): Promise<ContentGapRecord>;
  update(gap: ContentGapRecord): Promise<ContentGapRecord>;
  findById(id: string): Promise<ContentGapRecord | null>;
  findByType(gapType: string): Promise<ContentGapRecord[]>;
  findByFamily(family: CurriculumFamily): Promise<ContentGapRecord[]>;
  list(): Promise<ContentGapRecord[]>;
}

export interface IContentGovernanceAuditRepository {
  create(record: ContentGovernanceAuditRecord): Promise<ContentGovernanceAuditRecord>;
  find(options?: {
    eventType?: string;
    schoolId?: string;
    curriculumFamily?: CurriculumFamily;
    limit?: number;
  }): Promise<ContentGovernanceAuditRecord[]>;
  countByEventType(): Promise<Record<string, number>>;
  count(): Promise<number>;
  list(): Promise<ContentGovernanceAuditRecord[]>;
}

export interface IContentReviewRepository {
  create(record: {
    id: string;
    schoolId?: string;
    targetType: string;
    targetId: string;
    reviewState: string;
    reviewedByActorId?: string;
    reviewedByRole?: string;
    reviewedAt?: string;
    decision: string;
    reasonCodes?: string[];
    safeNotes?: string;
    createdAt: string;
    updatedAt: string;
  }): Promise<any>;
  findByTarget(targetType: string, targetId: string): Promise<any[]>;
  list(): Promise<any[]>;
}

export interface IContentGovernanceReadinessRepository {
  isDurablePersistenceAvailable(): Promise<boolean>;
}
