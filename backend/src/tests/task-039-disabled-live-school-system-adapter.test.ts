import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('Task 039 — Disabled Live School System Adapter', () => {
  it('adapter mode is disabled_live', async () => {
    const { disabledLiveSchoolSystemAdapter } = await import('../services/disabledLiveSchoolSystemAdapter');
    expect(disabledLiveSchoolSystemAdapter.mode).toBe('disabled_live');
  });

  it('adapter name is future_school_sis', async () => {
    const { disabledLiveSchoolSystemAdapter } = await import('../services/disabledLiveSchoolSystemAdapter');
    expect(disabledLiveSchoolSystemAdapter.name).toBe('future_school_sis');
  });

  it('fetchVerifiedIdentity returns empty payload', async () => {
    const { disabledLiveSchoolSystemAdapter } = await import('../services/disabledLiveSchoolSystemAdapter');
    const identity = disabledLiveSchoolSystemAdapter.fetchVerifiedIdentity('any-id', 'any-school');
    expect(identity.externalUserId).toBe('');
    expect(identity.schoolId).toBe('');
    expect(identity.role).toBe('unknown');
  });

  it('fetchRoster returns empty input', async () => {
    const { disabledLiveSchoolSystemAdapter } = await import('../services/disabledLiveSchoolSystemAdapter');
    const roster = disabledLiveSchoolSystemAdapter.fetchRoster('any-school');
    expect(roster.students).toEqual([]);
    expect(roster.teachers).toEqual([]);
    expect(roster.classes).toEqual([]);
    expect(roster.subjects).toEqual([]);
    expect(roster.enrollments).toEqual([]);
    expect(roster.teacherAssignments).toEqual([]);
  });

  it('getRequiredFutureConfig returns empty config', async () => {
    const { disabledLiveSchoolSystemAdapter } = await import('../services/disabledLiveSchoolSystemAdapter');
    const config = disabledLiveSchoolSystemAdapter.getRequiredFutureConfig();
    expect(config.baseUrl).toBe('');
    expect(config.timeoutMs).toBe(30000);
    expect(config.retryLimit).toBe(3);
  });

  it('getFutureEnvVarNames returns documented names', async () => {
    const { disabledLiveSchoolSystemAdapter } = await import('../services/disabledLiveSchoolSystemAdapter');
    const names = disabledLiveSchoolSystemAdapter.getFutureEnvVarNames();
    expect(names).toContain('SCHOOL_CONNECTOR_MODE');
    expect(names).toContain('SCHOOL_CONNECTOR_PROVIDER');
    expect(names).toContain('SCHOOL_CONNECTOR_BASE_URL');
    expect(names).toContain('SCHOOL_CONNECTOR_CLIENT_SECRET_NAME');
  });

  it('disabled adapter source file has no network imports', async () => {
    const source = readFileSync('backend/src/services/disabledLiveSchoolSystemAdapter.ts', 'utf-8');
    expect(source).not.toContain('axios');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('require(');
  });

  it('disabled adapter does not read real credentials', async () => {
    const source = readFileSync('backend/src/services/disabledLiveSchoolSystemAdapter.ts', 'utf-8');
    expect(source).not.toContain('process.env');
  });
});
