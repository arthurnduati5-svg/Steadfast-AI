import type {
  Task025PilotReadinessContext,
  Task025ReadinessAuditEvent,
  Task025ReadinessBlocker,
  Task025AuditEvent,
} from '../contracts/task025ControlledPilotReadinessContracts';
import { TASK025_AUDIT_EVENTS } from '../contracts/task025ControlledPilotReadinessContracts';

interface StoredAuditRecord {
  id: string;
  schoolId: string;
  actorRole: string;
  eventType: string;
  safeSummary: string;
  createdAt: string;
  requestId: string;
}

interface StoredReadinessCheck {
  id: string;
  schoolId: string;
  checkType: string;
  status: string;
  safeSummary: string;
  blockingIssues: string[];
  createdAt: string;
}

const auditStore: StoredAuditRecord[] = [];
const readinessCheckStore: StoredReadinessCheck[] = [];
let idCounter = 0;

function generateId(): string {
  idCounter++;
  return `t025-${Date.now()}-${idCounter}`;
}

export const task025PilotReadinessRepository = {
  writeAuditEvent(
    schoolId: string,
    actorRole: string,
    eventType: Task025AuditEvent,
    safeSummary: string,
    requestId: string,
  ): Task025ReadinessAuditEvent {
    const record: StoredAuditRecord = {
      id: generateId(),
      schoolId,
      actorRole,
      eventType,
      safeSummary,
      createdAt: new Date().toISOString(),
      requestId,
    };
    auditStore.push(record);
    return {
      id: record.id,
      schoolId: record.schoolId,
      actorRole: record.actorRole,
      eventType: record.eventType as Task025AuditEvent,
      safeSummary: record.safeSummary,
      createdAt: record.createdAt,
      requestId: record.requestId,
    };
  },

  listAuditEvents(schoolId?: string, limit: number = 100): Task025ReadinessAuditEvent[] {
    let records = auditStore;
    if (schoolId) {
      records = records.filter((r) => r.schoolId === schoolId);
    }
    return records.slice(-limit).map((r) => ({
      id: r.id,
      schoolId: r.schoolId,
      actorRole: r.actorRole,
      eventType: r.eventType as Task025AuditEvent,
      safeSummary: r.safeSummary,
      createdAt: r.createdAt,
      requestId: r.requestId,
    }));
  },

  writeReadinessCheck(
    schoolId: string,
    checkType: string,
    status: string,
    safeSummary: string,
    blockingIssues: string[],
  ): void {
    readinessCheckStore.push({
      id: generateId(),
      schoolId,
      checkType,
      status,
      safeSummary,
      blockingIssues,
      createdAt: new Date().toISOString(),
    });
  },

  listReadinessChecks(schoolId?: string, limit: number = 50): StoredReadinessCheck[] {
    let records = readinessCheckStore;
    if (schoolId) {
      records = records.filter((r) => r.schoolId === schoolId);
    }
    return records.slice(-limit);
  },

  getReadinessDiagnostics(schoolId: string): {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    recentBlockers: Task025ReadinessBlocker[];
  } {
    const checks = readinessCheckStore.filter((r) => r.schoolId === schoolId);
    const passed = checks.filter((r) => r.status === 'passed').length;
    const failed = checks.filter((r) => r.status === 'failed' || r.status === 'blocked').length;
    const recentBlockers: Task025ReadinessBlocker[] = checks
      .filter((r) => r.status === 'failed' || r.status === 'blocked')
      .slice(-5)
      .map((r) => ({
        type: 'school_identity' as any,
        severity: 'high' as const,
        safeDescription: r.safeSummary,
        requiredAction: r.blockingIssues.join('; '),
      }));
    return {
      totalChecks: checks.length,
      passedChecks: passed,
      failedChecks: failed,
      recentBlockers,
    };
  },

  clearStores(): void {
    auditStore.length = 0;
    readinessCheckStore.length = 0;
  },
};
