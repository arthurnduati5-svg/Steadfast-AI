import type {
  Task030SafeEvidenceEvent,
  Task030EvidenceLedger,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import { TASK030_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task030ControlledStagingRehearsalContracts';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

function containsForbiddenFields(obj: any): string[] {
  const found: string[] = [];
  function walk(value: any, path: string): void {
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (TASK030_FORBIDDEN_OUTPUT_FIELDS.includes(key)) {
        found.push(fullPath);
      }
      walk(value[key], fullPath);
    }
  }
  walk(obj, '');
  return found;
}

export async function recordTask030SafeEvidenceEvent(
  input: Task030SafeEvidenceEvent,
): Promise<Task030SafeEvidenceEvent> {
  const blockedFields = containsForbiddenFields(input);
  if (blockedFields.length > 0) {
    throw new Error(`Evidence event blocked: contains forbidden fields: ${blockedFields.join(', ')}`);
  }

  const eventId = input.eventId || `evt_${input.runId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const event: Task030SafeEvidenceEvent = {
    ...input,
    eventId,
    createdAt: input.createdAt || new Date().toISOString(),
  };

  await task030ControlledStagingRehearsalRepository.recordEvidenceEvent(event);

  return event;
}

export async function listTask030SafeEvidenceEvents(
  runId: string,
): Promise<Task030EvidenceLedger> {
  const events = await task030ControlledStagingRehearsalRepository.listEvidenceEvents(runId);

  const blockedFieldIssues: string[] = [];
  const safeEvents = events.filter((e) => {
    const blocked = containsForbiddenFields(e);
    if (blocked.length > 0) {
      blockedFieldIssues.push(...blocked.map(b => `event_${e.eventId}_${b}`));
      return false;
    }
    return true;
  });

  const ledger: Task030EvidenceLedger = {
    ledgerId: `ledger_${runId}`,
    runId,
    events: safeEvents,
    createdAt: new Date().toISOString(),
  };

  return ledger;
}
