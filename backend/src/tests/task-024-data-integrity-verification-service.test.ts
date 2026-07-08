import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  verifyDataIntegrity,
  verifyModel,
  getVerificationHistory,
} from '../services/task024DataIntegrityVerificationService';

vi.mock('@prisma/client', () => {
  function createModel(count: number, relationCount?: number) {
    const rc = relationCount ?? count;
    return {
      count: vi.fn(function () { return Promise.resolve(count); }),
      findMany: vi.fn(function () {
        return Promise.resolve(
          Array.from({ length: rc }, (_, i) => ({ id: String(i) })),
        );
      }),
      findFirst: vi.fn(function () {
        return Promise.resolve({ createdAt: new Date('2025-01-15T00:00:00Z') });
      }),
    };
  }

  return {
    PrismaClient: vi.fn(function () {
      return {
        SchoolIntegrationIdempotencyRecord: createModel(12, 12),
        TutorLearnerIdentityMap: createModel(85, 83),
        StudentLearningSessionState: createModel(340, 340),
        ContentGovernanceAuditRecord: createModel(28, 28),
        ApprovedSourceRecord: createModel(64, 64),
        ContentItemRecord: createModel(210, 210),
        ContentGapRecord: createModel(17, 17),
        DurableAuditEvent: createModel(1024, 1024),
        RateLimitQuotaRecord: createModel(0, 0),
      };
    }),
  };
});

describe('task024DataIntegrityVerificationService', () => {
  beforeEach(() => {
    // verificationHistory is module-scoped and accumulates; each test
    // tracks its own baseline independently.
  });

  it('verifyDataIntegrity with useTestFixtures:true returns array of DataIntegrityCheckResult', async () => {
    const results = await verifyDataIntegrity({ useTestFixtures: true });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r).toHaveProperty('tableOrModel');
      expect(r).toHaveProperty('accessible');
      expect(r).toHaveProperty('orphanCount');
      expect(r).toHaveProperty('missingRequiredRelationCount');
      expect(r).toHaveProperty('invalidStatusCount');
      expect(r).toHaveProperty('duplicateActiveMappingCount');
      expect(r).toHaveProperty('recordCount');
      expect(r).toHaveProperty('issues');
    }
  });

  it('each result has properly typed fields', async () => {
    const results = await verifyDataIntegrity({ useTestFixtures: true });

    for (const r of results) {
      expect(typeof r.tableOrModel).toBe('string');
      expect(typeof r.accessible).toBe('boolean');
      expect(typeof r.orphanCount).toBe('number');
      expect(typeof r.missingRequiredRelationCount).toBe('number');
      expect(typeof r.invalidStatusCount).toBe('number');
      expect(typeof r.duplicateActiveMappingCount).toBe('number');
      expect(typeof r.recordCount).toBe('number');
      expect(Array.isArray(r.issues)).toBe(true);
    }
  });

  it('does NOT expose raw row data (no student names, no chat content)', async () => {
    const results = await verifyDataIntegrity({ useTestFixtures: true });

    for (const r of results) {
      const json = JSON.stringify(r);
      expect(json).not.toMatch(/student(Name|_name)/i);
      expect(json).not.toMatch(/chat(Content|_content|Message|_message)/i);
      expect(json).not.toMatch(/raw(Content|_content)/i);
    }
  });

  it('records are accessible when using test fixtures', async () => {
    const results = await verifyDataIntegrity({ useTestFixtures: true });

    const accessible = results.filter((r) => r.accessible);
    expect(accessible.length).toBeGreaterThan(0);
    const inaccessible = results.filter((r) => !r.accessible);
    expect(inaccessible.length).toBe(1);
    expect(inaccessible[0].tableOrModel).toBe('rateLimitQuotaRecords');
  });

  it('returned fixtures have expected record counts', async () => {
    const results = await verifyDataIntegrity({ useTestFixtures: true });

    const find = (name: string) =>
      results.find((r) => r.tableOrModel === name)!;

    expect(find('schoolIntegrationMappings').recordCount).toBe(12);
    expect(find('learnerMappings').recordCount).toBe(85);
    expect(find('sessionStateRecords').recordCount).toBe(340);
    expect(find('contentGovernanceRecords').recordCount).toBe(28);
    expect(find('approvedSourceRecords').recordCount).toBe(64);
    expect(find('contentItemRecords').recordCount).toBe(210);
    expect(find('contentGapRecords').recordCount).toBe(17);
    expect(find('auditRecords').recordCount).toBe(1024);
    expect(find('rateLimitQuotaRecords').recordCount).toBe(0);
  });

  it('verifyModel checks a single known model', async () => {
    const result = await verifyModel('schoolIntegrationMappings');

    expect(result.tableOrModel).toBe('schoolIntegrationMappings');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('recordCount');
    expect(typeof result.recordCount).toBe('number');
  });

  it('verifyModel returns DataIntegrityCheckResult shape', async () => {
    const result = await verifyModel('auditRecords');

    expect(typeof result.tableOrModel).toBe('string');
    expect(typeof result.accessible).toBe('boolean');
    expect(typeof result.orphanCount).toBe('number');
    expect(typeof result.missingRequiredRelationCount).toBe('number');
    expect(typeof result.invalidStatusCount).toBe('number');
    expect(typeof result.duplicateActiveMappingCount).toBe('number');
    expect(typeof result.recordCount).toBe('number');
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it('verifyModel returns unknown model result for unregistered model', async () => {
    const result = await verifyModel('nonexistentModel');

    expect(result.tableOrModel).toBe('nonexistentModel');
    expect(result.accessible).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]).toContain('Unknown model');
  });

  it('getVerificationHistory returns an array', () => {
    const history = getVerificationHistory();

    expect(Array.isArray(history)).toBe(true);
  });

  it('verifyDataIntegrity with fixtures returns results with valid shape', async () => {
    const results = await verifyDataIntegrity({ useTestFixtures: true });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('verifyModel returns valid result', async () => {
    const result = await verifyModel('schoolIntegrationMappings');

    expect(result.tableOrModel).toBe('schoolIntegrationMappings');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('recordCount');
    expect(typeof result.recordCount).toBe('number');
  });
});
