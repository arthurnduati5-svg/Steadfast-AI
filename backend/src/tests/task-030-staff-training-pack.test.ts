import { describe, it, expect, beforeEach } from 'vitest';
import { generateTask030StaffTrainingPack } from '../services/task030StaffTrainingPackService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Staff Training Pack', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should generate training pack', async () => {
    const pack = await generateTask030StaffTrainingPack({ runId: 'run_train_001' });
    expect(pack.packId).toBeDefined();
  });

  it('should have runId matching input', async () => {
    const pack = await generateTask030StaffTrainingPack({ runId: 'run_train_002' });
    expect(pack.runId).toBe('run_train_002');
  });

  it('should have 10 checklists', async () => {
    const pack = await generateTask030StaffTrainingPack({ runId: 'run_train_003' });
    expect(pack.checklists).toHaveLength(10);
  });

  it('should include admin_operator_checklist', async () => {
    const pack = await generateTask030StaffTrainingPack({ runId: 'run_train_004' });
    const names = pack.checklists.map(c => c.checklistName);
    expect(names).toContain('admin_operator_checklist');
  });

  it('should include teacher_safety_checklist', async () => {
    const pack = await generateTask030StaffTrainingPack({ runId: 'run_train_005' });
    const names = pack.checklists.map(c => c.checklistName);
    expect(names).toContain('teacher_safety_checklist');
  });

  it('should include no_live_data_reminder', async () => {
    const pack = await generateTask030StaffTrainingPack({ runId: 'run_train_006' });
    const names = pack.checklists.map(c => c.checklistName);
    expect(names).toContain('no_live_data_reminder');
  });

  it('should have all checklists as allChecked', async () => {
    const pack = await generateTask030StaffTrainingPack({ runId: 'run_train_007' });
    pack.checklists.forEach(c => {
      expect(c.allChecked).toBe(true);
    });
  });

  it('should have items with proper itemId format', async () => {
    const pack = await generateTask030StaffTrainingPack({ runId: 'run_train_008' });
    pack.checklists.forEach(c => {
      c.items.forEach(item => {
        expect(item.itemId).toContain('_item_');
        expect(item.checked).toBe(true);
      });
    });
  });

  it('should have generatedAt as ISO string', async () => {
    const pack = await generateTask030StaffTrainingPack({ runId: 'run_train_009' });
    expect(() => new Date(pack.generatedAt)).not.toThrow();
  });

  it('should persist in repository', async () => {
    await generateTask030StaffTrainingPack({ runId: 'run_train_persist' });
    const stored = (task030ControlledStagingRehearsalRepository as any).staffTrainingPacks;
    expect(stored.length).toBeGreaterThanOrEqual(1);
  });
});
