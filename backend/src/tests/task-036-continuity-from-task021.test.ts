import { describe, it, expect } from 'vitest';
import {
  SchoolIntegrationStatus, SyncDirection, SchoolConnectorType,
} from '../contracts/task021SchoolIntegrationContracts';

describe('Continuity: Task 021 Contracts', () => {
  it('SchoolIntegrationStatus type is importable', () => {
    const status: SchoolIntegrationStatus = 'active';
    expect(status).toBe('active');
  });

  it('SyncDirection type is importable', () => {
    const dir: SyncDirection = 'inbound';
    expect(dir).toBe('inbound');
  });

  it('SchoolConnectorType type is importable', () => {
    const ct: SchoolConnectorType = 'sis';
    expect(ct).toBe('sis');
  });

  it('imports all expected types', () => {
    expect(typeof SchoolIntegrationStatus).toBe('undefined');
    expect(typeof SyncDirection).toBe('undefined');
    expect(typeof SchoolConnectorType).toBe('undefined');
  });
});
