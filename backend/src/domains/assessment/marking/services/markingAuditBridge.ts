interface MarkingAuditEvent {
  eventId: string;
  type: string;
  runId: string;
  actorId: string;
  details: string;
  timestamp: string;
}

const eventStore: MarkingAuditEvent[] = [];

export class MarkingAuditBridge {
  recordMarkingEvent(event: { type: string; runId: string; actorId: string; details: string }): void {
    eventStore.push({
      eventId: crypto.randomUUID(),
      type: event.type,
      runId: event.runId,
      actorId: event.actorId,
      details: event.details,
      timestamp: new Date().toISOString(),
    });
  }

  getEventsForRun(runId: string): MarkingAuditEvent[] {
    return eventStore.filter(e => e.runId === runId);
  }

  getAllEvents(): MarkingAuditEvent[] {
    return [...eventStore];
  }

  clear(): void {
    eventStore.length = 0;
  }
}
