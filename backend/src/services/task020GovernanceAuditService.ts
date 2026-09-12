// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Governance Audit Service v1
// Records safe governance/access/privacy/security events.
// ─────────────────────────────────────────────────────────────

import type {
  GovernanceAuditEvent,
  GovernanceAuditEventType,
  GovernanceAuditRecord,
  TutorRole,
  DataCategory,
} from '../contracts/task020GovernanceContracts';

const auditStore: GovernanceAuditRecord[] = [];

let auditIdCounter = 0;

export class GovernanceAuditService {
  async recordEvent(event: GovernanceAuditEvent): Promise<{ ok: boolean; eventId?: string }> {
    try {
      const record: GovernanceAuditRecord = {
        id: `gov-audit-${++auditIdCounter}-${Date.now()}`,
        schoolId: event.schoolId,
        actorId: event.actorId ? this.hashActorId(event.actorId) : undefined,
        actorRole: event.actorRole,
        resourceCategory: event.resourceCategory,
        action: event.action,
        decision: event.decision,
        reasonCodes: event.reasonCodes,
        privacyMetadata: this.sanitizeMetadata(event.privacyMetadata),
        requestId: event.requestId,
        correlationId: event.correlationId,
        createdAt: event.createdAt || new Date().toISOString(),
      };

      auditStore.push(record);

      return { ok: true, eventId: record.id };
    } catch {
      return { ok: false };
    }
  }

  async getAuditRecords(options?: {
    limit?: number;
    actorRole?: string;
    action?: string;
    schoolId?: string;
  }): Promise<GovernanceAuditRecord[]> {
    let records = [...auditStore];

    if (options?.actorRole) {
      records = records.filter(r => r.actorRole === options.actorRole);
    }
    if (options?.action) {
      records = records.filter(r => r.action === options.action);
    }
    if (options?.schoolId) {
      records = records.filter(r => r.schoolId === options.schoolId);
    }

    records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const limit = options?.limit || 100;
    return records.slice(0, limit);
  }

  getAuditSummary(): {
    totalEvents: number;
    eventTypeCounts: Record<string, number>;
    roleCounts: Record<string, number>;
  } {
    const eventTypeCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};

    for (const record of auditStore) {
      eventTypeCounts[record.action] = (eventTypeCounts[record.action] || 0) + 1;
      roleCounts[record.actorRole] = (roleCounts[record.actorRole] || 0) + 1;
    }

    return {
      totalEvents: auditStore.length,
      eventTypeCounts,
      roleCounts,
    };
  }

  clearAuditStore(): void {
    auditStore.length = 0;
  }

  private hashActorId(id: string): string {
    const hash = require('crypto').createHash('sha256').update(id).digest('hex');
    return hash.slice(0, 16);
  }

  private sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
    const forbidden = ['secret', 'token', 'password', 'authorization', 'cookie', 'connectionString'];
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (forbidden.some(f => key.toLowerCase().includes(f))) continue;
      safe[key] = value;
    }
    return safe;
  }
}

export const governanceAuditService = new GovernanceAuditService();
