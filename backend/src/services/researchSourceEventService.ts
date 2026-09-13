// ─────────────────────────────────────────────────────────────
// Steadfast AI — Research Source Event Service v1
// Bounded in-memory events for source trust actions.
// Non-blocking — failures do not affect the response.
// ─────────────────────────────────────────────────────────────

import type {
  ResearchSourceTrustPacket,
  ResearchTrustedSource,
} from './researchSourceTrustContracts';

/**
 * Event kinds for source trust actions.
 */
export type ResearchSourceEventKind =
  | 'research_sources_verified'
  | 'research_sources_missing'
  | 'research_source_blocked'
  | 'research_fallback_url_blocked'
  | 'research_model_generated_url_blocked'
  | 'research_citation_policy_applied'
  | 'research_source_metadata_created';

/**
 * A bounded source trust event.
 */
export interface ResearchSourceEvent {
  eventId: string;
  kind: ResearchSourceEventKind;
  sourceCount: number;
  verifiedWebCount: number;
  blockedCount: number;
  citationDisplayCount: number;
  hasVerifiedSources: boolean;
  warnings: string[];
  createdAt: string;
}

// In-memory event storage (bounded, non-persistent)
const eventStore: ResearchSourceEvent[] = [];
const MAX_STORED_EVENTS = 500;

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `rsev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Build a bounded research source event from a source trust packet.
 */
export function buildResearchSourceEvent(
  packet: ResearchSourceTrustPacket,
): ResearchSourceEvent {
  let kind: ResearchSourceEventKind;

  if (packet.verifiedWebSources.length > 0) {
    kind = 'research_sources_verified';
  } else if (packet.blockedSources.length > 0) {
    // Check if any blocked sources were model-generated or fallback
    const hasModelGenerated = packet.blockedSources.some(
      (s) => s.blockReasons.includes('model_generated_url'),
    );
    const hasFallback = packet.blockedSources.some(
      (s) => s.blockReasons.includes('fallback_url'),
    );

    if (hasModelGenerated) {
      kind = 'research_model_generated_url_blocked';
    } else if (hasFallback) {
      kind = 'research_fallback_url_blocked';
    } else {
      kind = 'research_source_blocked';
    }
  } else {
    kind = 'research_sources_missing';
  }

  return {
    eventId: generateId(),
    kind,
    sourceCount: packet.usage.sourceCount,
    verifiedWebCount: packet.usage.verifiedWebCount,
    blockedCount: packet.usage.blockedCount,
    citationDisplayCount: packet.usage.citationDisplayCount,
    hasVerifiedSources: packet.verifiedWebSources.length > 0,
    warnings: packet.safety.warnings.slice(0, 10),
    createdAt: nowISO(),
  };
}

/**
 * Write a source trust event to the bounded in-memory store.
 * Non-blocking — never throws.
 */
export function writeResearchSourceEvent(event: ResearchSourceEvent): void {
  try {
    eventStore.push(event);

    // Trim to max stored events
    if (eventStore.length > MAX_STORED_EVENTS) {
      eventStore.splice(0, eventStore.length - MAX_STORED_EVENTS);
    }
  } catch {
    // Non-blocking — event failure must not affect the response
  }
}

/**
 * Get recent events for debugging/monitoring (bounded).
 */
export function getRecentResearchSourceEvents(limit = 20): ResearchSourceEvent[] {
  return eventStore.slice(-limit);
}

/**
 * Clear all stored events (for testing).
 */
export function clearResearchSourceEvents(): void {
  eventStore.length = 0;
}
