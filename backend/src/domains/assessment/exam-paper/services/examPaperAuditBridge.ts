export interface AuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  safeSummary: string;
  reasonCode: string;
  createdAt: string;
}

export class ExamPaperAuditBridge {
  private events: AuditEvent[] = [];

  public async recordAuditEvent(event: Omit<AuditEvent, 'eventId' | 'createdAt'>): Promise<AuditEvent> {
    const auditEvent: AuditEvent = {
      ...event,
      eventId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.events.push(auditEvent);
    return auditEvent;
  }

  public getEvents(): AuditEvent[] {
    return [...this.events];
  }

  public getEventsForResource(resourceId: string): AuditEvent[] {
    return this.events.filter((e) => e.resourceId === resourceId);
  }

  public clear(): void {
    this.events = [];
  }
}
