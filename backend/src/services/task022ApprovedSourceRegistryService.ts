import type { ApprovedSource, CurriculumFamily, SourceApprovalStatus, SourceTrustLevel, SourceType } from './task022ContentGovernanceContracts';
import type { IApprovedSourceRepository } from './contentGovernance/repositories/interfaces';
import { PrismaApprovedSourceRepository } from './contentGovernance/repositories/prismaApprovedSourceRepository';
import prisma from '../lib/prisma';

/**
 * R8-G.3A-D2 governance flags (explicit memory injection only).
 *
 * CONTENT_GOVERNANCE_ALLOW_MEMORY_FALLBACK=1
 *   Explicit domain-specific opt-in for legacy in-memory test compatibility.
 *   Production must NEVER choose memory merely because NODE_ENV !== production.
 *
 * CONTENT_GOVERNANCE_REQUIRE_DURABLE=1
 *   Strict durable mode. Overrides the fallback flag: canonical Approved Source
 *   state is always owned by the durable repository.
 */
export function isApprovedSourceMemoryFallbackAllowed(): boolean {
  if (process.env.CONTENT_GOVERNANCE_REQUIRE_DURABLE === '1') return false;
  return process.env.CONTENT_GOVERNANCE_ALLOW_MEMORY_FALLBACK === '1';
}

/**
 * Durable canonical owner for ApprovedSourceRecord (R8-G.3A-D2).
 * Production canonical state is the durable repository; the process-local Map
 * remains only as EXPLICIT TEST COMPATIBILITY.
 */
export class ApprovedSourceRegistryService {
  private sources: Map<string, ApprovedSource> = new Map();
  private familySources: Map<string, string[]> = new Map();
  private schoolSources: Map<string, string[]> = new Map();
  private categorySources: Map<string, string[]> = new Map();
  private durableRepository: IApprovedSourceRepository;

  constructor(durableRepository?: IApprovedSourceRepository) {
    this.durableRepository = durableRepository ?? new PrismaApprovedSourceRepository(prisma as any);
  }

  /** Test compatibility injection point: never used by production routes. */
  setDurableRepositoryForTesting(repo: IApprovedSourceRepository): void {
    this.durableRepository = repo;
  }

  // ─── Legacy synchronous in-memory API — EXPLICIT TEST COMPATIBILITY ONLY ───
  registerSource(source: ApprovedSource): void {
    this.sources.set(source.id, source);

    const familyKey = source.curriculumFamily;
    if (!this.familySources.has(familyKey)) this.familySources.set(familyKey, []);
    const fIds = this.familySources.get(familyKey)!;
    if (!fIds.includes(source.id)) fIds.push(source.id);

    if (source.schoolId) {
      if (!this.schoolSources.has(source.schoolId)) this.schoolSources.set(source.schoolId, []);
      const sIds = this.schoolSources.get(source.schoolId)!;
      if (!sIds.includes(source.id)) sIds.push(source.id);
    }

    if (source.deenCategory) {
      if (!this.categorySources.has(source.deenCategory)) this.categorySources.set(source.deenCategory, []);
      const cIds = this.categorySources.get(source.deenCategory)!;
      if (!cIds.includes(source.id)) cIds.push(source.id);
    }
  }

  getSource(sourceId: string): ApprovedSource | null {
    return this.sources.get(sourceId) || null;
  }

  getSourcesForFamily(family: CurriculumFamily): ApprovedSource[] {
    const ids = this.familySources.get(family) || [];
    return ids.map(id => this.sources.get(id)).filter((s): s is ApprovedSource => !!s);
  }

  getSourcesForSchool(schoolId: string): ApprovedSource[] {
    const ids = this.schoolSources.get(schoolId) || [];
    return ids.map(id => this.sources.get(id)).filter((s): s is ApprovedSource => !!s);
  }

  getApprovedSources(family?: CurriculumFamily): ApprovedSource[] {
    const allSources = family
      ? this.getSourcesForFamily(family)
      : Array.from(this.sources.values());
    return allSources.filter(s => s.approvalStatus === 'approved');
  }

  isSourceApproved(sourceId: string): boolean {
    const source = this.sources.get(sourceId);
    return !!source && source.approvalStatus === 'approved';
  }

  isSourcePendingReview(sourceId: string): boolean {
    const source = this.sources.get(sourceId);
    return !!source && (source.approvalStatus === 'pending_review' || source.approvalStatus === 'teacher_proposed' || source.approvalStatus === 'school_proposed');
  }

  isSourceRejected(sourceId: string): boolean {
    const source = this.sources.get(sourceId);
    return !!source && source.approvalStatus === 'rejected';
  }

  isSourceBlocked(sourceId: string): boolean {
    const source = this.sources.get(sourceId);
    return !!source && (source.approvalStatus === 'blocked' || source.trustLevel === 'blocked');
  }

  setSourceStatus(sourceId: string, status: SourceApprovalStatus, actorId?: string, role?: string): boolean {
    const source = this.sources.get(sourceId);
    if (!source) return false;
    source.approvalStatus = status;
    if (actorId) source.approvedByActorId = actorId;
    if (role) source.approvedByRole = role;
    source.approvedAt = new Date().toISOString();
    return true;
  }

  getAllSources(): ApprovedSource[] {
    return Array.from(this.sources.values());
  }

  getApprovedCount(): number {
    return this.getApprovedSources().length;
  }

  getPendingReviewCount(): number {
    return Array.from(this.sources.values()).filter(s =>
      s.approvalStatus === 'pending_review' || s.approvalStatus === 'teacher_proposed' || s.approvalStatus === 'school_proposed'
    ).length;
  }

  getBlockedCount(): number {
    return Array.from(this.sources.values()).filter(s =>
      s.approvalStatus === 'blocked' || s.trustLevel === 'blocked'
    ).length;
  }

  getDeprecatedCount(): number {
    return Array.from(this.sources.values()).filter(s => s.approvalStatus === 'deprecated').length;
  }

  reset(): void {
    this.sources.clear();
    this.familySources.clear();
    this.schoolSources.clear();
    this.categorySources.clear();
  }

  // ─── Durable async production API (R8-G.3A-D2) ─────────────────────────────

  /**
   * Durable read for production approval truth.
   * SAFETY LAW (R8-G.3A-D2 #13): a failed durable read is NEVER equivalent to
   * "source approved" or "no restriction". Unknown source => null (fail closed).
   * Dependency failure THROWS so callers fail closed — never answer approved=true.
   */
  async getSourceDurable(sourceId: string): Promise<ApprovedSource | null> {
    const source = await this.durableRepository.findById(sourceId);
    return source ?? null;
  }

  async getAllSourcesDurable(): Promise<ApprovedSource[]> {
    return this.durableRepository.list();
  }

  async getApprovedSourcesDurable(family?: CurriculumFamily): Promise<ApprovedSource[]> {
    return this.durableRepository.findApproved(family);
  }

  /**
   * Durable fail-closed approval truth: only an explicitly approved durable
   * record counts. Unknown source => false. DB failure throws (never true).
   */
  async isApprovedDurable(sourceId: string): Promise<boolean> {
    const source = await this.durableRepository.findById(sourceId);
    return !!source && source.approvalStatus === 'approved';
  }

  /** Register a source through the durable canonical owner. */
  async registerSourceDurable(source: ApprovedSource): Promise<ApprovedSource> {
    const existing = await this.durableRepository.findById(source.id);
    if (existing) {
      return this.durableRepository.update(source);
    }
    return this.durableRepository.create(source);
  }

  /** Durable approval lifecycle update. Returns null when source is unknown. */
  async setSourceStatusDurable(
    sourceId: string,
    status: SourceApprovalStatus,
    actorId?: string,
    role?: string,
  ): Promise<ApprovedSource | null> {
    const source = await this.durableRepository.findById(sourceId);
    if (!source) return null;
    source.approvalStatus = status;
    if (actorId) source.approvedByActorId = actorId;
    if (role) source.approvedByRole = role;
    source.approvedAt = new Date().toISOString();
    return this.durableRepository.update(source);
  }

  async approveSourceDurable(sourceId: string, actorId?: string, role?: string): Promise<ApprovedSource | null> {
    return this.setSourceStatusDurable(sourceId, 'approved', actorId, role);
  }

  async rejectSourceDurable(sourceId: string, actorId?: string, role?: string): Promise<ApprovedSource | null> {
    return this.setSourceStatusDurable(sourceId, 'rejected', actorId, role);
  }

  async blockSourceDurable(sourceId: string, actorId?: string, role?: string): Promise<ApprovedSource | null> {
    return this.setSourceStatusDurable(sourceId, 'blocked', actorId, role);
  }

  async deprecateSourceDurable(sourceId: string, actorId?: string, role?: string): Promise<ApprovedSource | null> {
    return this.setSourceStatusDurable(sourceId, 'deprecated', actorId, role);
  }
}

export const approvedSourceRegistryService = new ApprovedSourceRegistryService();
