import type {
  Task030StaffTrainingPack,
  Task030TrainingChecklist,
  Task030ChecklistItem,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030StaffTrainingPackInput } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

const CHECKLISTS_CONFIG: { name: string; items: string[] }[] = [
  {
    name: 'admin_operator_checklist',
    items: [
      'Verify staging environment gate is passed',
      'Confirm synthetic data mode is active',
      'Validate role token matrix is generated',
      'Run preflight checks before staging rehearsal',
      'Monitor operations console during rehearsal',
    ],
  },
  {
    name: 'teacher_safety_checklist',
    items: [
      'Confirm teacher cannot access operations console',
      'Verify teacher cannot view raw learner data',
      'Confirm teacher cannot view safeguarding notes',
      'Verify teacher cannot view Deen-sensitive text',
      'Ensure teacher cannot view answer keys',
    ],
  },
  {
    name: 'learner_support_checklist',
    items: [
      'Confirm learner cannot access admin console',
      'Verify learner sees own synthetic status only',
      'Ensure learner receives no answer keys',
      'Confirm no hidden reasoning exposed to learner',
      'Verify no teacher-only notes visible to learner',
    ],
  },
  {
    name: 'incident_escalation_dry_run_checklist',
    items: [
      'Run incident escalation in dry-run mode',
      'Verify intervention queue is accessible for admin',
      'Confirm incident panel shows safe summary only',
      'Ensure no raw data exposed in incident flow',
    ],
  },
  {
    name: 'rollback_drill_checklist',
    items: [
      'Verify synthetic-only rollback executed',
      'Confirm expanded access blocked during rollback',
      'Ensure audit evidence preserved during rollback',
      'Verify no destructive deletes performed',
    ],
  },
  {
    name: 'no_live_data_reminder',
    items: [
      'Reminder: No live student data used in rehearsal',
      'Reminder: All data is synthetic and safe',
      'Reminder: Real emails and phone numbers prohibited',
    ],
  },
  {
    name: 'no_answer_key_reminder',
    items: [
      'Reminder: Answer keys must never be exposed',
      'Reminder: Model answers are forbidden in rehearsal output',
      'Reminder: Marking schemes must remain internal only',
    ],
  },
  {
    name: 'deen_referral_boundary_reminder',
    items: [
      'Reminder: Deen-sensitive text must never appear in rehearsal output',
      'Reminder: Private Deen data boundary enforced at all times',
      'Reminder: Fatwa engine queries are forbidden in rehearsal mode',
    ],
  },
  {
    name: 'safeguarding_raw_note_boundary_reminder',
    items: [
      'Reminder: Raw safeguarding notes must never be exposed',
      'Reminder: Safeguarding data boundary enforced for all roles',
      'Reminder: Only safe summaries of safeguarding events allowed',
    ],
  },
  {
    name: 'task_031_readiness_handoff_checklist',
    items: [
      'Confirm all rehearsal gates passed',
      'Verify report generated with safeToStartTask031 decision',
      'Ensure all blocking issues documented',
      'Handoff evidence ledger to Task 031 proof loader',
    ],
  },
];

export async function generateTask030StaffTrainingPack(
  input: { runId: string },
): Promise<Task030StaffTrainingPack> {
  const validation = validateTask030StaffTrainingPackInput({
    runId: input.runId,
    schoolId: 'rehearsal',
  });

  const blockingIssues: string[] = validation.ok ? [] : [...validation.errors];

  if (!validation.ok) {
    throw new Error(`Staff training pack input validation failed: ${validation.errors.join(', ')}`);
  }

  const checklists: Task030TrainingChecklist[] = CHECKLISTS_CONFIG.map((config) => {
    const items: Task030ChecklistItem[] = config.items.map((desc, idx) => ({
      itemId: `${config.name}_item_${idx + 1}`,
      description: desc,
      checked: true,
    }));

    return {
      checklistName: config.name,
      items,
      allChecked: items.every(i => i.checked),
    };
  });

  const packId = `training_pack_${input.runId}_${Date.now()}`;

  const pack: Task030StaffTrainingPack = {
    packId,
    runId: input.runId,
    checklists,
    generatedAt: new Date().toISOString(),
  };

  await task030ControlledStagingRehearsalRepository.recordStaffTrainingPack(pack);

  return pack;
}
