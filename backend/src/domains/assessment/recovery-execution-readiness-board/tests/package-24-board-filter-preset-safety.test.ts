import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardFilterService } from '../services/recoveryExecutionReadinessBoardFilterService';
import { InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

const ctx = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'admin',
  correlationId: 'corr-1',
  idempotencyKey: 'ik-1',
};

describe('Package 24 - Board Filter Preset Safety', () => {
  it('createFilterPreset returns filter with boardFilterPresetId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository();
    const service = new RecoveryExecutionReadinessBoardFilterService(repo);
    const result = await service.createFilterPreset(ctx, 'school-1', {
      schoolId: 'school-1',
      presetName: 'My Preset',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardFilterPresetId).toBeDefined();
  });

  it('getFilterPreset returns created filter', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository();
    const service = new RecoveryExecutionReadinessBoardFilterService(repo);
    const created = await service.createFilterPreset(ctx, 'school-1', { schoolId: 'school-1', presetName: 'My Preset' });
    const id = created.data!.boardFilterPresetId;
    const result = await service.getFilterPreset('school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.presetName).toBe('My Preset');
  });

  it('listFilterPresetsForSchool returns presets by school', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository();
    const service = new RecoveryExecutionReadinessBoardFilterService(repo);
    await service.createFilterPreset(ctx, 'school-1', { schoolId: 'school-1', presetName: 'P1' });
    await service.createFilterPreset(ctx, 'school-1', { schoolId: 'school-1', presetName: 'P2' });
    const result = await service.listFilterPresetsForSchool('school-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('updateFilterPreset updates presetName', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository();
    const service = new RecoveryExecutionReadinessBoardFilterService(repo);
    const created = await service.createFilterPreset(ctx, 'school-1', { schoolId: 'school-1', presetName: 'Original' });
    const id = created.data!.boardFilterPresetId;
    const result = await service.updateFilterPreset(ctx, 'school-1', id, { presetName: 'Updated' });
    expect(result.success).toBe(true);
    expect(result.data?.presetName).toBe('Updated');
  });

  it('suppressFilterPreset works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository();
    const service = new RecoveryExecutionReadinessBoardFilterService(repo);
    const created = await service.createFilterPreset(ctx, 'school-1', { schoolId: 'school-1', presetName: 'P1' });
    const id = created.data!.boardFilterPresetId;
    const result = await service.suppressFilterPreset(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('suppressed');
  });

  it('voidFilterPreset works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository();
    const service = new RecoveryExecutionReadinessBoardFilterService(repo);
    const created = await service.createFilterPreset(ctx, 'school-1', { schoolId: 'school-1', presetName: 'P1' });
    const id = created.data!.boardFilterPresetId;
    const result = await service.voidFilterPreset(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('voided');
  });
});
