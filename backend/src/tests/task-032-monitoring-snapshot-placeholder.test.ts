import { describe, it, expect } from 'vitest';
import { createTask032CanaryMonitoringSnapshotPlaceholder } from '../services/task032CanaryMonitoringSnapshotService';
import type { Task032CanaryMonitoringSnapshotPlaceholder } from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - Monitoring Snapshot Placeholder', () => {
  const validInput = {
    activationId: 'act_task032_safe_001',
    safeSummary: 'All preflight gates passed. Ready for observation handoff.',
    reasonCodes: ['preflight_passed', 'ready_for_task033']
  };

  async function createPlaceholder(): Promise<Task032CanaryMonitoringSnapshotPlaceholder> {
    return createTask032CanaryMonitoringSnapshotPlaceholder(validInput);
  }

  it('should create placeholder with observationStarted: false', async () => {
    const placeholder = await createPlaceholder();
    expect(placeholder.observationStarted).toBe(false);
  });

  it('should contain safeSummary', async () => {
    const placeholder = await createPlaceholder();
    expect(placeholder.safeSummary).toBe(validInput.safeSummary);
  });

  it('should contain reasonCodes', async () => {
    const placeholder = await createPlaceholder();
    expect(placeholder.reasonCodes).toEqual(validInput.reasonCodes);
    expect(placeholder.reasonCodes.length).toBe(2);
  });

  it('should have safeToStartTask033Candidate flag', async () => {
    const placeholder = await createPlaceholder();
    expect(placeholder.safeToStartTask033Candidate).toBe(true);
  });

  it('should have snapshotId containing activationId', async () => {
    const placeholder = await createPlaceholder();
    expect(placeholder.snapshotId).toContain(validInput.activationId);
    expect(placeholder.snapshotId).toContain('snap_');
  });

  it('should have activationId matching input', async () => {
    const placeholder = await createPlaceholder();
    expect(placeholder.activationId).toBe(validInput.activationId);
  });

  it('should have createdAt as ISO timestamp', async () => {
    const placeholder = await createPlaceholder();
    expect(placeholder.createdAt).toBeTruthy();
    expect(new Date(placeholder.createdAt).toISOString()).toBe(placeholder.createdAt);
  });

  it('should NOT contain live traffic metrics', async () => {
    const placeholder = await createPlaceholder();
    const keys = Object.keys(placeholder);
    expect(keys).not.toContain('activeSessionCount');
    expect(keys).not.toContain('requestCount');
    expect(keys).not.toContain('p95LatencyMs');
  });

  it('should NOT contain learning outcome metrics', async () => {
    const placeholder = await createPlaceholder();
    const keys = Object.keys(placeholder);
    expect(keys).not.toContain('learningOutcome');
    expect(keys).not.toContain('skillMastery');
    expect(keys).not.toContain('knowledgeGain');
  });

  it('should NOT contain teacher/student feedback', async () => {
    const placeholder = await createPlaceholder();
    const json = JSON.stringify(placeholder);
    expect(json).not.toContain('feedback');
    expect(json).not.toContain('teacherFeedback');
    expect(json).not.toContain('studentFeedback');
  });

  it('should handle custom reason codes', async () => {
    const custom = {
      ...validInput,
      reasonCodes: ['environment_passed', 'config_validated', 'cohort_approved', 'consent_ready']
    };
    const placeholder = await createTask032CanaryMonitoringSnapshotPlaceholder(custom);
    expect(placeholder.reasonCodes).toHaveLength(4);
    expect(placeholder.reasonCodes).toContain('environment_passed');
  });

  it('should handle empty reason codes', async () => {
    const placeholder = await createTask032CanaryMonitoringSnapshotPlaceholder({
      ...validInput,
      reasonCodes: []
    });
    expect(placeholder.reasonCodes).toEqual([]);
  });
});
