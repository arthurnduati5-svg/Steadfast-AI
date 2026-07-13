import { describe, it, expect } from 'vitest';
import {
  OperationalEventType, IncidentSeverity, RunbookStep,
} from '../contracts/task024OperationsContracts';

describe('Continuity: Task 024 Contracts', () => {
  it('OperationalEventType type is importable', () => {
    const t: OperationalEventType = 'incident';
    expect(t).toBe('incident');
  });

  it('IncidentSeverity type is importable', () => {
    const sev: IncidentSeverity = 'critical';
    expect(sev).toBe('critical');
  });

  it('RunbookStep type is importable', () => {
    const step: RunbookStep = 'detect';
    expect(step).toBe('detect');
  });
});
