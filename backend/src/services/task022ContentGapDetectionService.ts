import type { CurriculumFamily, ContentGapRecord, GapType } from './task022ContentGovernanceContracts';
import { curriculumRegistryService } from './task022CurriculumRegistryService';
import { approvedSourceRegistryService } from './task022ApprovedSourceRegistryService';
import { contentItemGovernanceService } from './task022ContentItemGovernanceService';
import type { IContentGapRepository } from './contentGovernance/repositories/interfaces';
import { PrismaContentGapRepository } from './contentGovernance/repositories/prismaContentGapRepository';
import prisma from '../lib/prisma';

/**
 * R8-G.3A-D2 Content Gap durability.
 *
 * PURE GAP DECISION (synchronous, unchanged) is separated from DURABLE GAP
 * WRITE (async). Only established safe gap fields are persisted — no raw
 * learner content. The logical gap key is preserved: sequential repeated
 * detection returns the existing canonical gap rather than duplicating it.
 */
export class ContentGapDetectionService {
  private gaps: Map<string, ContentGapRecord> = new Map();
  private gapRepository: IContentGapRepository;

  constructor(gapRepository?: IContentGapRepository) {
    this.gapRepository = gapRepository ?? new PrismaContentGapRepository(prisma as any);
  }

  setGapRepositoryForTesting(repo: IContentGapRepository): void {
    this.gapRepository = repo;
  }

  /** Logical gap key — preserved exactly (R8-G.3A-D2 #15). */
  private static gapKey(
    curriculumFamily: CurriculumFamily,
    subject?: string,
    topic?: string,
    skill?: string,
  ): string {
    return `${curriculumFamily}:${subject || '*'}:${topic || '*'}:${skill || '*'}`;
  }

  // ─── Legacy synchronous in-memory API — EXPLICIT TEST COMPATIBILITY ONLY ───
  detectGap(
    curriculumFamily: CurriculumFamily,
    subject?: string,
    topic?: string,
    skill?: string,
    schoolId?: string
  ): ContentGapRecord | null {
    const gapId = ContentGapDetectionService.gapKey(curriculumFamily, subject, topic, skill);

    const existing = this.gaps.get(gapId);
    if (existing) return existing;

    if (topic) {
      const resolvedTopic = curriculumRegistryService.resolveTopic(curriculumFamily, subject || '', topic);
      if (!resolvedTopic) {
        return this.recordGap(gapId, curriculumFamily, 'missing_curriculum_mapping', 'Topic not found in curriculum registry', subject, topic, skill);
      }

      const approvedSources = approvedSourceRegistryService.getApprovedSources(curriculumFamily);
      const topicSources = approvedSources.filter(s => s.topic === topic);
      if (topicSources.length === 0) {
        return this.recordGap(gapId, curriculumFamily, 'missing_approved_source', 'No approved source for topic', subject, topic, skill);
      }

      const pendingSources = approvedSourceRegistryService.getSourcesForFamily(curriculumFamily)
        .filter(s => s.topic === topic && (s.approvalStatus === 'pending_review' || s.approvalStatus === 'teacher_proposed'));

      if (pendingSources.length > 0) {
        return this.recordGap(gapId, curriculumFamily, 'source_pending_review', 'Sources exist but are pending review', subject, topic, skill);
      }

      const contentItems = contentItemGovernanceService.getItemsForTopic(resolvedTopic.topicId);
      const activeItems = contentItems.filter(i => i.status === 'active' || i.status === 'approved');
      if (activeItems.length === 0) {
        return this.recordGap(gapId, curriculumFamily, 'missing_content_item', 'No active content items for topic', subject, topic, skill);
      }
    }

    if (subject) {
      const resolvedSubject = curriculumRegistryService.resolveSubject(curriculumFamily, subject);
      if (!resolvedSubject) {
        return this.recordGap(gapId, curriculumFamily, 'missing_curriculum_mapping', 'Subject not found in curriculum registry', subject, topic, skill);
      }
    }

    if (skill && topic) {
      const resolvedTopic = curriculumRegistryService.resolveTopic(curriculumFamily, subject || '', topic);
      if (resolvedTopic) {
        const skills = curriculumRegistryService.resolveSkill(resolvedTopic.topicId);
        const matchedSkill = skills.find(s => s.title.toLowerCase().includes(skill.toLowerCase()));
        if (!matchedSkill) {
          return this.recordGap(gapId, curriculumFamily, 'missing_curriculum_mapping', 'Skill not found for topic', subject, topic, skill);
        }
      }
    }

    const activeVersion = schoolId
      ? curriculumRegistryService.getActiveVersion(schoolId, curriculumFamily)
      : null;

    if (activeVersion && activeVersion.status === 'deprecated') {
      return this.recordGapIdempotent(gapId, curriculumFamily, 'deprecated_curriculum_version', 'Active curriculum version is deprecated', subject, topic, skill);
    }

    return null;
  }

  private recordGap(
    gapId: string,
    curriculumFamily: CurriculumFamily,
    gapType: GapType,
    summary: string,
    subject?: string,
    topic?: string,
    skill?: string
  ): ContentGapRecord {
    const record: ContentGapRecord = {
      id: gapId,
      curriculumFamily,
      subject,
      topic,
      skill,
      gapType,
      status: 'open',
      safeSummary: summary,
      reasonCodes: [gapType, 'detected-by-content-gap-detection-service'],
      createdAt: new Date().toISOString(),
    };
    this.gaps.set(gapId, record);
    return record;
  }

  /** Memory variant that reuses an existing record's gapType when the key is already known. */
  private recordGapIdempotent(
    gapId: string,
    curriculumFamily: CurriculumFamily,
    gapType: GapType,
    summary: string,
    subject?: string,
    topic?: string,
    skill?: string
  ): ContentGapRecord {
    const existing = this.gaps.get(gapId);
    if (existing) return existing;
    return this.recordGap(gapId, curriculumFamily, gapType, summary, subject, topic, skill);
  }

  getGapsByType(gapType: GapType): ContentGapRecord[] {
    return Array.from(this.gaps.values()).filter(g => g.gapType === gapType);
  }

  getAllGaps(): ContentGapRecord[] {
    return Array.from(this.gaps.values());
  }

  getGapSummary(): { gapType: GapType; count: number }[] {
    const summary = new Map<GapType, number>();
    for (const gap of this.gaps.values()) {
      summary.set(gap.gapType, (summary.get(gap.gapType) || 0) + 1);
    }
    return Array.from(summary.entries()).map(([gapType, count]) => ({ gapType, count }));
  }

  clearGaps(): void {
    this.gaps.clear();
  }

  reset(): void {
    this.gaps.clear();
  }

  // ─── Durable async production API (R8-G.3A-D2) ─────────────────────────────

  /**
   * Durable repeat-detection semantics: on an existing durable gap key, return
   * the canonical record without generating uncontrolled duplicate state.
   * (Perfect concurrent uniqueness would need a schema constraint — reported
   * for R8-G.4/architecture review, not implemented in this parallel lane.)
   */
  async detectGapDurable(
    curriculumFamily: CurriculumFamily,
    subject?: string,
    topic?: string,
    skill?: string,
    schoolId?: string,
  ): Promise<ContentGapRecord | null> {
    const gapId = ContentGapDetectionService.gapKey(curriculumFamily, subject, topic, skill);

    const existing = await this.gapRepository.findById(gapId);
    if (existing) return existing;

    const decision = this.evaluateGapDecision(curriculumFamily, subject, topic, skill, schoolId);
    if (!decision) return null;

    try {
      return await this.gapRepository.create({
        id: gapId,
        curriculumFamily,
        subject,
        topic,
        skill,
        gapType: decision.gapType,
        status: 'open',
        safeSummary: decision.summary,
        reasonCodes: [decision.gapType, 'detected-by-content-gap-detection-service'],
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Sequential-safe retry: a concurrent writer may have created the same
      // canonical key between the read and the create. Return canonical state.
      const raced = await this.gapRepository.findById(gapId);
      if (raced) return raced;
      throw new Error('CONTENT_GAP_PERSISTENCE_FAILED: durable gap write failed');
    }
  }

  /**
   * PURE GAP DECISION — identical classification logic to the legacy sync
   * detectGap, without writing any state. Returns null when no gap exists.
   */
  private evaluateGapDecision(
    curriculumFamily: CurriculumFamily,
    subject?: string,
    topic?: string,
    skill?: string,
    schoolId?: string,
  ): { gapType: GapType; summary: string } | null {
    if (topic) {
      const resolvedTopic = curriculumRegistryService.resolveTopic(curriculumFamily, subject || '', topic);
      if (!resolvedTopic) {
        return { gapType: 'missing_curriculum_mapping', summary: 'Topic not found in curriculum registry' };
      }

      const approvedSources = approvedSourceRegistryService.getApprovedSources(curriculumFamily);
      const topicSources = approvedSources.filter(s => s.topic === topic);
      if (topicSources.length === 0) {
        return { gapType: 'missing_approved_source', summary: 'No approved source for topic' };
      }

      const pendingSources = approvedSourceRegistryService.getSourcesForFamily(curriculumFamily)
        .filter(s => s.topic === topic && (s.approvalStatus === 'pending_review' || s.approvalStatus === 'teacher_proposed'));

      if (pendingSources.length > 0) {
        return { gapType: 'source_pending_review', summary: 'Sources exist but are pending review' };
      }

      const contentItems = contentItemGovernanceService.getItemsForTopic(resolvedTopic.topicId);
      const activeItems = contentItems.filter(i => i.status === 'active' || i.status === 'approved');
      if (activeItems.length === 0) {
        return { gapType: 'missing_content_item', summary: 'No active content items for topic' };
      }
    }

    if (subject) {
      const resolvedSubject = curriculumRegistryService.resolveSubject(curriculumFamily, subject);
      if (!resolvedSubject) {
        return { gapType: 'missing_curriculum_mapping', summary: 'Subject not found in curriculum registry' };
      }
    }

    if (skill && topic) {
      const resolvedTopic = curriculumRegistryService.resolveTopic(curriculumFamily, subject || '', topic);
      if (resolvedTopic) {
        const skills = curriculumRegistryService.resolveSkill(resolvedTopic.topicId);
        const matchedSkill = skills.find(s => s.title.toLowerCase().includes(skill.toLowerCase()));
        if (!matchedSkill) {
          return { gapType: 'missing_curriculum_mapping', summary: 'Skill not found for topic' };
        }
      }
    }

    const activeVersion = schoolId
      ? curriculumRegistryService.getActiveVersion(schoolId, curriculumFamily)
      : null;

    if (activeVersion && activeVersion.status === 'deprecated') {
      return { gapType: 'deprecated_curriculum_version', summary: 'Active curriculum version is deprecated' };
    }

    return null;
  }

  async getGapByIdDurable(gapId: string): Promise<ContentGapRecord | null> {
    return this.gapRepository.findById(gapId);
  }

  async getGapsByTypeDurable(gapType: GapType): Promise<ContentGapRecord[]> {
    return this.gapRepository.findByType(gapType);
  }

  async getAllGapsDurable(): Promise<ContentGapRecord[]> {
    return this.gapRepository.list();
  }
}

export const contentGapDetectionService = new ContentGapDetectionService();
