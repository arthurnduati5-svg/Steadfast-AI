import type {
  Task031SafeEvidenceEvent,
  Task031EvidenceLedger,
} from '../contracts/task031StagingSmokeCanaryReadinessContracts';

const ledgerStore = new Map<string, Task031SafeEvidenceEvent[]>();

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_task031_safe`;
}

function isAllowedField(key: string): boolean {
  const allowed = [
    'eventId', 'runId', 'stageId', 'scenarioId', 'actorRole',
    'syntheticRole', 'status', 'safeSummary', 'reasonCodes', 'createdAt',
  ];
  return allowed.includes(key);
}

function stripForbiddenFields(payload: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(payload)) {
    if (isAllowedField(key)) {
      cleaned[key] = payload[key];
    }
  }
  return cleaned;
}

export async function recordTask031SafeEvidenceEvent(
  input: Record<string, unknown>,
): Promise<Task031SafeEvidenceEvent> {
  const cleaned = stripForbiddenFields(input);
  const now = new Date().toISOString();

  const event: Task031SafeEvidenceEvent = {
    eventId: (cleaned.eventId as string) || generateEventId(),
    runId: (cleaned.runId as string) || 'unknown_run',
    stageId: (cleaned.stageId as string) || 'unknown_stage',
    scenarioId: (cleaned.scenarioId as string) || 'unknown_scenario',
    actorRole: (cleaned.actorRole as string) || 'unknown',
    syntheticRole: (cleaned.syntheticRole as string) || 'synthetic_unknown',
    status: (cleaned.status as string) || 'recorded',
    safeSummary: (cleaned.safeSummary as string) || 'No details exposed.',
    reasonCodes: Array.isArray(cleaned.reasonCodes) ? cleaned.reasonCodes as string[] : [],
    createdAt: (cleaned.createdAt as string) || now,
  };

  const runId = event.runId;
  const existing = ledgerStore.get(runId) || [];
  existing.push(event);
  ledgerStore.set(runId, existing);

  return { ...event };
}

export async function listTask031SafeEvidenceEvents(
  runId: string,
): Promise<Task031EvidenceLedger> {
  const events = ledgerStore.get(runId) || [];
  return {
    runId,
    events: events.map(e => ({ ...e })),
  };
}

export function clearTask031EvidenceLedger(): void {
  ledgerStore.clear();
}
