import { describe, it, expect } from 'vitest';

describe('Task 039 — School Connector No-Bypass Audit', () => {
  it('runs and passes with default config', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const result = audit.runSchoolConnectorNoBypassAudit();
    expect(result.passed).toBe(true);
  });

  it('getTask039NoBypassAuditResult returns passed', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const result = audit.getTask039NoBypassAuditResult();
    expect(result.passed).toBe(true);
  });

  it('detects no bypass blockers with default config', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const result = audit.runSchoolConnectorNoBypassAudit();
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.blockedFindings.length).toBe(0);
  });

  it('findings include school context verification requirement', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const result = audit.runSchoolConnectorNoBypassAudit();
    const hasContextCheck = result.findings.some(f =>
      f.description.includes('must be called before'),
    );
    expect(hasContextCheck).toBe(true);
  });

  it('findings include mock adapter network-free', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const result = audit.runSchoolConnectorNoBypassAudit();
    const hasMockCheck = result.findings.some(f =>
      f.description.includes('synthetic data only'),
    );
    expect(hasMockCheck).toBe(true);
  });

  it('findings include disabled live adapter network-free', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const result = audit.runSchoolConnectorNoBypassAudit();
    const hasDisabledCheck = result.findings.some(f =>
      f.description.includes('disabledLiveSchoolSystemAdapter'),
    );
    expect(hasDisabledCheck).toBe(true);
  });

  it('findings include no real credentials read', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const result = audit.runSchoolConnectorNoBypassAudit();
    const hasCredCheck = result.findings.some(f =>
      f.description.includes('No real school credentials'),
    );
    expect(hasCredCheck).toBe(true);
  });

  it('scans actual Task 039 source files for forbidden patterns', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const result = audit.runSchoolConnectorNoBypassAudit();
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('detects synthetic bypass sample with fetch call', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const badSource = `
      import { verifyExternalSchoolIdentity } from './schoolContextVerificationService';
      export async function getStudentData(studentId: string) {
        const response = await fetch('https://live-school-system.com/api/students/' + studentId);
        return response.json();
      }
    `;
    const findings = audit.scanStringForSyntheticBypass(badSource);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.category === 'potential_bypass_blocker')).toBe(true);
  });

  it('detects synthetic bypass sample with createTutorSession', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const badSource = `
      function handleRequest(userId: string) {
        const session = createTutorSession(userId);
        return session;
      }
    `;
    const findings = audit.scanStringForSyntheticBypass(badSource);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.category === 'potential_bypass_blocker')).toBe(true);
  });

  it('detects synthetic bypass sample with axios', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const badSource = `
      import axios from 'axios';
      export async function syncRoster(schoolId: string) {
        const response = await axios.get('https://sis.example.com/roster/' + schoolId);
        return response.data;
      }
    `;
    const findings = audit.scanStringForSyntheticBypass(badSource);
    expect(findings.some(f => f.category === 'potential_bypass_blocker')).toBe(true);
  });

  it('clean source has no bypass findings', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const cleanSource = `
      import { ExternalSchoolIdentityPayload } from '../contracts/schoolSystemBridgeContracts';
      export function verify(data: ExternalSchoolIdentityPayload) {
        if (!data.schoolId) return { verified: false };
        return { verified: true };
      }
    `;
    const findings = audit.scanStringForSyntheticBypass(cleanSource);
    expect(findings.length).toBe(0);
  });

  it('scanSourceForBypassPatterns scans real files', async () => {
    const audit = await import('../services/schoolConnectorNoBypassAuditService');
    const result = audit.scanSourceForBypassPatterns();
    expect(result.filesScanned).toBeGreaterThan(0);
    expect(result.findings.length).toBe(0);
  });
});
