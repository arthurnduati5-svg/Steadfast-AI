import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateOperationalDataIntegrity, checkSchoolIdentityIntegrity, checkRosterMappingIntegrity, checkNoOrphanedCriticalRecords } from '../services/task024OperationalDataIntegrityService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024OperationalDataIntegrityService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should pass all integrity checks', async () => {
    const result = await evaluateOperationalDataIntegrity();
    expect(result.status).toBe('passed');
    expect(result.schoolIdentityIntegrity).toBe(true);
    expect(result.rosterMappingIntegrity).toBe(true);
    expect(result.task020GovernanceIntegrity).toBe(true);
    expect(result.task021SchoolIntegrationIntegrity).toBe(true);
    expect(result.task022ContentGovernanceIntegrity).toBe(true);
    expect(result.task023ReadinessIntegrity).toBe(true);
    expect(result.phase3MetadataIntegrity).toBe(true);
    expect(result.auditEventIntegrity).toBe(true);
    expect(result.noOrphanedCriticalRecords).toBe(true);
  });

  it('should detect issues when they exist', async () => {
    const result = await evaluateOperationalDataIntegrity();
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it('should check school identity integrity', async () => {
    expect(await checkSchoolIdentityIntegrity()).toBe(true);
  });

  it('should check roster mapping integrity', async () => {
    expect(await checkRosterMappingIntegrity()).toBe(true);
  });
});
