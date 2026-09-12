// R8-G.3A-D2 injected failing repositories for failure-law proofs.
// DB failure ≠ successful governance mutation.
import type { ApprovedSource, ContentGovernanceAuditRecord, CurriculumFamily } from '../services/task022ContentGovernanceContracts';
import type { IApprovedSourceRepository, IContentGovernanceAuditRepository } from '../services/contentGovernance/repositories/interfaces';

export class FailingApprovedSourceRepository implements IApprovedSourceRepository {
  async create(source: ApprovedSource): Promise<ApprovedSource> {
    throw new Error('APPROVED_SOURCE_DEPENDENCY_UNAVAILABLE');
  }
  async update(source: ApprovedSource): Promise<ApprovedSource> {
    throw new Error('APPROVED_SOURCE_DEPENDENCY_UNAVAILABLE');
  }
  async findById(id: string): Promise<ApprovedSource | null> {
    throw new Error('APPROVED_SOURCE_DEPENDENCY_UNAVAILABLE');
  }
  async findByFamily(family: CurriculumFamily): Promise<ApprovedSource[]> {
    throw new Error('APPROVED_SOURCE_DEPENDENCY_UNAVAILABLE');
  }
  async findBySchool(schoolId: string): Promise<ApprovedSource[]> {
    throw new Error('APPROVED_SOURCE_DEPENDENCY_UNAVAILABLE');
  }
  async findByApprovalStatus(status: string): Promise<ApprovedSource[]> {
    throw new Error('APPROVED_SOURCE_DEPENDENCY_UNAVAILABLE');
  }
  async findApproved(family?: CurriculumFamily): Promise<ApprovedSource[]> {
    throw new Error('APPROVED_SOURCE_DEPENDENCY_UNAVAILABLE');
  }
  async list(): Promise<ApprovedSource[]> {
    throw new Error('APPROVED_SOURCE_DEPENDENCY_UNAVAILABLE');
  }
}

export class FailingContentGovernanceAuditRepository implements IContentGovernanceAuditRepository {
  async create(record: ContentGovernanceAuditRecord): Promise<ContentGovernanceAuditRecord> {
    throw new Error('GOVERNANCE_AUDIT_DEPENDENCY_UNAVAILABLE');
  }
  async find(options?: any): Promise<ContentGovernanceAuditRecord[]> {
    throw new Error('GOVERNANCE_AUDIT_DEPENDENCY_UNAVAILABLE');
  }
  async countByEventType(): Promise<Record<string, number>> {
    throw new Error('GOVERNANCE_AUDIT_DEPENDENCY_UNAVAILABLE');
  }
  async count(): Promise<number> {
    throw new Error('GOVERNANCE_AUDIT_DEPENDENCY_UNAVAILABLE');
  }
  async list(): Promise<ContentGovernanceAuditRecord[]> {
    throw new Error('GOVERNANCE_AUDIT_DEPENDENCY_UNAVAILABLE');
  }
}
