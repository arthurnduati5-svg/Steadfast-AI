import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('Task 039 — No Live School-System Call Contract', () => {
  it('mock adapter source never calls network', async () => {
    const source = readFileSync('backend/src/services/mockSchoolSystemAdapter.ts', 'utf-8');
    expect(source).not.toContain('axios');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('http');
  });

  it('disabled live adapter source never calls network', async () => {
    const source = readFileSync('backend/src/services/disabledLiveSchoolSystemAdapter.ts', 'utf-8');
    expect(source).not.toContain('axios');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('require(');
  });

  it('no school-system SDK imported for live calls', () => {
    const files = [
      'backend/src/services/mockSchoolSystemAdapter.ts',
      'backend/src/services/disabledLiveSchoolSystemAdapter.ts',
      'backend/src/services/schoolConnectorActivationGuard.ts',
      'backend/src/services/schoolContextVerificationService.ts',
      'backend/src/services/tutorLearnerMappingService.ts',
      'backend/src/services/teacherScopeMappingService.ts',
      'backend/src/services/schoolAdminScopeMappingService.ts',
      'backend/src/services/rosterSyncDryRunService.ts',
      'backend/src/services/schoolIdentityConflictDetectionService.ts',
    ];
    for (const file of files) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toContain('googleapis');
      expect(source).not.toContain('@microsoft');
      expect(source).not.toContain('canvas-api');
      expect(source).not.toContain('powerschool');
      expect(source).not.toContain('blackboard');
    }
  });

  it('no real credentials stored in any Task 039 file', () => {
    const files = [
      'backend/src/services/mockSchoolSystemAdapter.ts',
      'backend/src/services/schoolConnectorActivationGuard.ts',
      'backend/src/services/schoolContextVerificationService.ts',
      'backend/src/services/tutorLearnerMappingService.ts',
      'backend/src/services/teacherScopeMappingService.ts',
      'backend/src/services/schoolAdminScopeMappingService.ts',
      'backend/src/services/rosterSyncDryRunService.ts',
      'backend/src/services/schoolIdentityConflictDetectionService.ts',
      'backend/src/contracts/schoolSystemBridgeContracts.ts',
    ];
    for (const file of files) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/api[_-]?key/i);
      expect(source).not.toMatch(/bearer /i);
      expect(source).not.toMatch(/auth[_-]?token/i);
      expect(source).not.toMatch(/client[_-]?secret\b(?!_NAME)/i);
    }
  });

  it('no live school-system integration performed', () => {
    // Pure contract test: verify no env reads for live school credentials
    const files = [
      'backend/src/services/mockSchoolSystemAdapter.ts',
      'backend/src/services/disabledLiveSchoolSystemAdapter.ts',
    ];
    for (const file of files) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toContain('process.env');
    }
  });

  it('default provider mode is mock_only or disabled_live', async () => {
    const contracts = await import('../contracts/schoolSystemBridgeContracts');
    const mode = contracts.getDefaultSchoolProviderMode();
    expect(['mock_only', 'disabled_live']).toContain(mode);
  });

  it('all Task 039 services are importable without NetworkError', async () => {
    await import('../contracts/schoolSystemBridgeContracts');
    await import('../services/schoolContextVerificationService');
    await import('../services/tutorLearnerMappingService');
    await import('../services/teacherScopeMappingService');
    await import('../services/schoolAdminScopeMappingService');
    await import('../services/mockSchoolSystemAdapter');
    await import('../services/disabledLiveSchoolSystemAdapter');
    await import('../services/schoolConnectorActivationGuard');
    await import('../services/rosterSyncDryRunService');
    await import('../services/schoolIdentityConflictDetectionService');
    await import('../services/schoolConnectorNoBypassAuditService');
  });
});
