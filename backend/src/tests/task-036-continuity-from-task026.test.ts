import { describe, it, expect } from 'vitest';
import {
  PilotExecutionStatus, PilotMetricType, PilotAlertLevel,
} from '../contracts/task026ControlledPilotExecutionContracts';

describe('Continuity: Task 026 Contracts', () => {
  it('PilotExecutionStatus type is importable', () => {
    const s: PilotExecutionStatus = 'running';
    expect(s).toBe('running');
  });

  it('PilotMetricType type is importable', () => {
    const m: PilotMetricType = 'latency';
    expect(m).toBe('latency');
  });

  it('PilotAlertLevel type is importable', () => {
    const a: PilotAlertLevel = 'warning';
    expect(a).toBe('warning');
  });
});
