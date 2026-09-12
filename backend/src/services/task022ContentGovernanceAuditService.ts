import type { ContentGovernanceAuditRecord, GovernanceAuditEventType, CurriculumFamily } from './task022ContentGovernanceContracts';
import type { IContentGovernanceAuditRepository } from './contentGovernance/repositories/interfaces';
import { PrismaContentGovernanceAuditRepository } from './contentGovernance/repositories/prismaContentGovernanceAuditRepository';
import prisma from '../lib/prisma';
import { isApprovedSourceMemoryFallbackAllowed } from './task022ApprovedSourceRegistryService';

/**
 * R8-G.3A-D2 Content Governance Audit.
 *
 * The durable repository is the production sink (append-only). The in-memory
 * array remains only as EXPLICIT TEST COMPATIBILITY behind the explicit
 * domain-specific opt-in flag CONTENT_GOVERNANCE_ALLOW_MEMORY_FALLBACK=1
 * (CONTENT_GOVERNANCE_REQUIRE_DURABLE=1 overrides the fallback).
 *
 * Required audits are awaited by production callers: a failed required audit
 * write must NOT be reported as completed governance success.
 */
export class ContentGovernanceAuditService {
  private records: ContentGovernanceAuditRecord[] = [];
  private auditRepository: IContentGovernanceAuditRepository;

  constructor(auditRepository?: IContentGovernanceAuditRepository) {
    this.auditRepository = auditRepository ?? new PrismaContentGovernanceAuditRepository(prisma as any);
  }

  setAuditRepositoryForTesting(repo: IContentGovernanceAuditRepository): void {
    this.auditRepository = repo;
  }

  /** True when the explicit test-compatibility memory sink is opted in. */
  isMemorySinkActive(): boolean {
    return isApprovedSourceMemoryFallbackAllowed();
  }

  // ─── Legacy synchronous in-memory API — EXPLICIT TEST COMPATIBILITY ONLY ───
  record(event: Omit<ContentGovernanceAuditRecord, 'id' | 'createdAt'>): ContentGovernanceAuditRecord {
    const record: ContentGovernanceAuditRecord = {
      ...event,
      id: `gov-audit-${this.records.length + 1}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.records.push(record);

    if (this.records.length > 10000) {
      this.records = this.records.slice(-5000);
    }

    return record;
  }

  getRecords(options?: {
    eventType?: GovernanceAuditEventType;
    schoolId?: string;
    curriculumFamily?: CurriculumFamily;
    limit?: number;
  }): ContentGovernanceAuditRecord[] {
    let filtered = this.records;

    if (options?.eventType) {
      filtered = filtered.filter(r => r.eventType === options.eventType);
    }
    if (options?.schoolId) {
      filtered = filtered.filter(r => r.schoolId === options.schoolId);
    }
    if (options?.curriculumFamily) {
      filtered = filtered.filter(r => r.curriculumFamily === options.curriculumFamily);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  getEventCountByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const r of this.records) {
      counts[r.eventType] = (counts[r.eventType] || 0) + 1;
    }
    return counts;
  }

  getTotalRecordCount(): number {
    return this.records.length;
  }

  reset(): void {
    this.records = [];
  }

  // ─── Durable async production API (R8-G.3A-D2) ─────────────────────────────

  private buildDurableRecord(event: Omit<ContentGovernanceAuditRecord, 'id' | 'createdAt'>): ContentGovernanceAuditRecord {
    return {
      ...event,
      id: `gov-audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Durable, append-only audit write. Awaited by production callers.
   * Throws on repository failure so required-audit callers fail closed.
   */
  async recordDurable(event: Omit<ContentGovernanceAuditRecord, 'id' | 'createdAt'>): Promise<ContentGovernanceAuditRecord> {
    const record = this.buildDurableRecord(event);
    return this.auditRepository.create(record);
  }

  async getRecordsDurable(options?: {
    eventType?: GovernanceAuditEventType;
    schoolId?: string;
    curriculumFamily?: CurriculumFamily;
    limit?: number;
  }): Promise<ContentGovernanceAuditRecord[]> {
    return this.auditRepository.find(options);
  }

  async getEventCountByTypeDurable(): Promise<Record<string, number>> {
    return this.auditRepository.countByEventType();
  }

  async getTotalRecordCountDurable(): Promise<number> {
    return this.auditRepository.count();
  }

  // Durable semantic helpers — semantically equivalent to the legacy helpers.

  async recordCurriculumResolvedDurable(actorRole: string, curriculumFamily: CurriculumFamily, subject?: string, topic?: string): Promise<ContentGovernanceAuditRecord> {
    return this.recordDurable({
      actorRole,
      eventType: 'curriculum_resolved',
      curriculumFamily,
      decision: 'resolved',
      reasonCodes: ['curriculum-resolved-successfully'],
      privacyMetadata: { safe: true },
    });
  }

  async recordGapDetectedDurable(actorRole: string, curriculumFamily: CurriculumFamily, reasonCodes: string[]): Promise<ContentGovernanceAuditRecord> {
    return this.recordDurable({
      actorRole,
      eventType: 'curriculum_gap_detected',
      curriculumFamily,
      decision: 'gap',
      reasonCodes,
      privacyMetadata: { safe: true },
    });
  }

  async recordSourceActionDurable(eventType: 'source_approved' | 'source_rejected' | 'source_deprecated', sourceId: string, actorRole: string): Promise<ContentGovernanceAuditRecord> {
    return this.recordDurable({
      actorRole,
      eventType,
      sourceId,
      decision: eventType.replace('source_', ''),
      reasonCodes: [`source-${eventType.replace('source_', '')}`],
      privacyMetadata: { safe: true },
    });
  }

  async recordContentGroundingDurable(decision: 'content_grounding_allowed' | 'content_grounding_denied', curriculumFamily: CurriculumFamily, actorRole: string, reasonCodes: string[]): Promise<ContentGovernanceAuditRecord> {
    return this.recordDurable({
      actorRole,
      eventType: decision,
      curriculumFamily,
      decision: decision.includes('allowed') ? 'allowed' : 'denied',
      reasonCodes,
      privacyMetadata: { safe: true },
    });
  }

  async recordDeenReferralDurable(actorRole: string, curriculumFamily: CurriculumFamily, reasonCodes: string[]): Promise<ContentGovernanceAuditRecord> {
    return this.recordDurable({
      actorRole,
      eventType: 'deen_referral_required',
      curriculumFamily,
      decision: 'referral',
      reasonCodes,
      privacyMetadata: { safe: true },
    });
  }

  async recordTeacherOnlyFilteredDurable(actorRole: string, reasonCodes: string[]): Promise<ContentGovernanceAuditRecord> {
    return this.recordDurable({
      actorRole,
      eventType: 'teacher_only_content_filtered',
      decision: 'filtered',
      reasonCodes,
      privacyMetadata: { safe: true },
    });
  }
}

export const contentGovernanceAuditService = new ContentGovernanceAuditService();
