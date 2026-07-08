// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 024 Operations Contracts Tests
// Verifies that all operation contract types compile and
// enforce correct statuses, severities, and categories.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  OPERATIONAL_STATUS_VALUES,
  INCIDENT_SEVERITY_VALUES,
  INCIDENT_CATEGORY_VALUES,
  type OperationalComponentStatus,
  type IncidentSeverity,
  type IncidentCategory,
  type TelemetryEvent,
  type IncidentRecord,
  type BackupReadinessResult,
  type RestoreDrillResult,
  type DataIntegrityCheckResult,
  type OperationsAuditRecord,
} from '../contracts/task024OperationsContracts';

// ─── Constant Value Tests ──────────────────────────────────

describe('OPERATIONAL_STATUS_VALUES', () => {
  it('contains all required component statuses', () => {
    const required: OperationalComponentStatus[] = [
      'healthy', 'degraded', 'unhealthy', 'blocked', 'unknown', 'not_applicable',
    ];
    for (const status of required) {
      expect(OPERATIONAL_STATUS_VALUES).toContain(status);
    }
    expect(OPERATIONAL_STATUS_VALUES).toHaveLength(required.length);
  });
});

describe('INCIDENT_SEVERITY_VALUES', () => {
  it('contains all required severities', () => {
    const required: IncidentSeverity[] = [
      'info', 'low', 'medium', 'high', 'critical',
    ];
    for (const severity of required) {
      expect(INCIDENT_SEVERITY_VALUES).toContain(severity);
    }
    expect(INCIDENT_SEVERITY_VALUES).toHaveLength(required.length);
  });
});

describe('INCIDENT_CATEGORY_VALUES', () => {
  it('contains all required categories', () => {
    const required: IncidentCategory[] = [
      'availability', 'database', 'migration', 'school_integration',
      'content_governance', 'ai_gateway', 'privacy', 'safeguarding',
      'deen_governance', 'rate_limit', 'security', 'backup', 'restore',
      'data_integrity', 'configuration', 'observability', 'unknown',
    ];
    for (const category of required) {
      expect(INCIDENT_CATEGORY_VALUES).toContain(category);
    }
    expect(INCIDENT_CATEGORY_VALUES).toHaveLength(required.length);
  });
});

// ─── Type Assignment Tests ─────────────────────────────────

describe('type-level assertions', () => {
  it('OPERATIONAL_STATUS_VALUES elements are assignable to OperationalComponentStatus', () => {
    for (const s of OPERATIONAL_STATUS_VALUES) {
      const _: OperationalComponentStatus = s;
      void _;
    }
  });

  it('INCIDENT_SEVERITY_VALUES elements are assignable to IncidentSeverity', () => {
    for (const s of INCIDENT_SEVERITY_VALUES) {
      const _: IncidentSeverity = s;
      void _;
    }
  });

  it('INCIDENT_CATEGORY_VALUES elements are assignable to IncidentCategory', () => {
    for (const c of INCIDENT_CATEGORY_VALUES) {
      const _: IncidentCategory = c;
      void _;
    }
  });
});

// ─── Object Conformance Tests ──────────────────────────────

describe('TelemetryEvent', () => {
  it('can be created with only safe fields', () => {
    const event: TelemetryEvent = {
      id: 'evt-001',
      timestamp: '2026-06-28T12:00:00Z',
      component: 'health-checker',
      category: 'health',
      severity: 'info',
      status: 'healthy',
      safeReasonCode: 'ALL_GOOD',
      safeSummary: 'All systems nominal',
    };
    expect(event.id).toBe('evt-001');
    expect(event.severity).toBe('info');
    // only safe metadata fields — no raw/private data leaked
    const keys = Object.keys(event);
    expect(keys).not.toContain('rawChat');
    expect(keys).not.toContain('privateMemory');
  });
});

describe('IncidentRecord', () => {
  it('can be created', () => {
    const incident: IncidentRecord = {
      id: 'inc-001',
      category: 'availability',
      severity: 'high',
      status: 'detected',
      safeTitle: 'DB connection lost',
      safeSummary: 'Database primary replica unreachable',
      reasonCodes: ['DB_CONN_REFUSED'],
      affectedComponents: ['primary-db'],
      recommendedOwnerRole: 'infra-engineer',
      studentSafetyRelevant: false,
      privacyRelevant: false,
      deenGovernanceRelevant: false,
      detectedAt: '2026-06-28T12:05:00Z',
    };
    expect(incident.id).toBe('inc-001');
    expect(incident.severity).toBe('high');
  });
});

describe('BackupReadinessResult', () => {
  it('can be created', () => {
    const result: BackupReadinessResult = {
      ready: true,
      configPresent: true,
      databaseProvider: 'postgresql',
      backupCommandDocumented: true,
      backupDestinationConfigured: true,
      backupScheduleDocumented: true,
      retentionPolicyDocumented: true,
      encryptionAtRestExpected: true,
      restoreDrillPlanExists: true,
      manualApprovalRequired: false,
      safeSummary: 'Backup ready',
      safeDetails: ['Config found', 'Destination reachable'],
    };
    expect(result.ready).toBe(true);
    expect(result.databaseProvider).toBe('postgresql');
  });
});

describe('RestoreDrillResult', () => {
  it('can be created', () => {
    const result: RestoreDrillResult = {
      success: true,
      drillType: 'weekly-rollback',
      dataSource: 's3-backup',
      recordsRestored: 1500,
      integrityChecksPassed: true,
      integrityCheckDetails: ['All checks passed'],
      destructiveCommandExecuted: false,
      realProductionDataOverwritten: false,
      manualApprovalBeforeRestore: true,
      safeSummary: 'Drill completed without incident',
    };
    expect(result.success).toBe(true);
    expect(result.drillType).toBe('weekly-rollback');
  });
});

describe('DataIntegrityCheckResult', () => {
  it('can be created', () => {
    const result: DataIntegrityCheckResult = {
      tableOrModel: 'SchoolProfile',
      accessible: true,
      orphanCount: 0,
      missingRequiredRelationCount: 0,
      invalidStatusCount: 0,
      duplicateActiveMappingCount: 0,
      recordCount: 520,
      issues: [],
    };
    expect(result.accessible).toBe(true);
    expect(result.recordCount).toBe(520);
  });
});

describe('OperationsAuditRecord', () => {
  it('has only safe metadata fields', () => {
    const record: OperationsAuditRecord = {
      incidentId: 'inc-001',
      category: 'availability',
      severity: 'high',
      status: 'resolved',
      safeSummary: 'Incident resolved',
      reasonCodes: ['DB_CONN_REFUSED'],
      timestamp: '2026-06-28T13:00:00Z',
      component: 'incident-manager',
      actionTaken: 'Failover initiated',
    };
    // no raw chat, no private memory, no provider response, no ai prompt
    expect(record.safeSummary).toBeTruthy();
    expect(record).not.toHaveProperty('rawChat');
    expect(record).not.toHaveProperty('privateMemory');
    expect(record).not.toHaveProperty('providerResponse');
    expect(record).not.toHaveProperty('aiPrompt');
  });
});
