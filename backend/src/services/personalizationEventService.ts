// ─────────────────────────────────────────────────────────────
// Steadfast AI — Personalization Event Service v1
// Writes bounded personalization events through the existing
// post-turn event channel. Non-blocking — failures do not
// interrupt the chat response.
// ─────────────────────────────────────────────────────────────

import type { PersonalizationPacket, PersonalizationEventKind } from './personalizationContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── In-memory event store (for tests and runtime awareness) ──

interface PersonalizationEventEntry {
  eventId: string;
  kind: PersonalizationEventKind;
  schoolId: string;
  studentId: string;
  packetId: string;
  availableDomains: string[];
  usedDomains: string[];
  missingDomains: string[];
  redactedDomains: string[];
  warnings: string[];
  timestamp: string;
}

const eventStore: PersonalizationEventEntry[] = [];
const MAX_EVENT_STORE = 500;

let eventCounter = 0;
function generateEventId(): string {
  eventCounter += 1;
  return `persevt_${Date.now()}_${eventCounter}`;
}

export class PersonalizationEventService {
  /**
   * Write a personalization event to the in-memory store.
   * Non-blocking — never throws. Failures silently degrade.
   */
  async writeEvent(
    identity: ResolvedTutorIdentity,
    kind: PersonalizationEventKind,
    packet: PersonalizationPacket,
    extraWarnings?: string[],
  ): Promise<void> {
    try {
      const entry: PersonalizationEventEntry = {
        eventId: generateEventId(),
        kind,
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        packetId: packet.packetId,
        availableDomains: packet.usage.availableDomains,
        usedDomains: packet.usage.usedDomains,
        missingDomains: packet.usage.missingDomains,
        redactedDomains: packet.usage.redactedDomains,
        warnings: [...packet.safety.warnings, ...(extraWarnings || [])].slice(0, 10),
        timestamp: new Date().toISOString(),
      };

      eventStore.push(entry);

      // Bound store
      if (eventStore.length > MAX_EVENT_STORE) {
        eventStore.splice(0, eventStore.length - MAX_EVENT_STORE);
      }
    } catch {
      // Non-blocking — never fail chat
    }
  }

  /**
   * Read recent events (for tests and diagnostics).
   */
  getRecentEvents(maxItems: number): PersonalizationEventEntry[] {
    return eventStore.slice(-maxItems);
  }

  /**
   * Clear event store (for tests).
   */
  clearEvents(): void {
    eventStore.length = 0;
  }
}

// ── Singleton ──

export const personalizationEventService = new PersonalizationEventService();
