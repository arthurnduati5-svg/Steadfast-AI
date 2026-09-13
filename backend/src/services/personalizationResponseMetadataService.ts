// ─────────────────────────────────────────────────────────────
// Steadfast AI — Personalization Response Metadata Service v1
// Builds safe personalization usage metadata from the packet.
// Tracks which domains were used, missing, redacted, blocked,
// and which domains were expected but empty.
// ─────────────────────────────────────────────────────────────

import type {
  PersonalizationPacket,
  PersonalizationResponseMetadata,
  PersonalizationDomain,
} from './personalizationContracts';

export class PersonalizationResponseMetadataService {
  /**
   * Build personalization response metadata from the packet and
   * optional prompt block usage info.
   */
  buildMetadata(input: {
    packet: PersonalizationPacket;
    promptUsedDomains?: PersonalizationDomain[];
    promptUsed: boolean;
  }): PersonalizationResponseMetadata {
    const { packet, promptUsedDomains, promptUsed } = input;

    const usedDomains = promptUsedDomains && promptUsedDomains.length > 0
      ? promptUsedDomains
      : packet.usage.usedDomains;

    return {
      personalizationAvailable: packet.usage.availableDomains.length > 0,
      personalizationUsed: promptUsed && usedDomains.length > 0,
      usedDomains,
      missingDomains: packet.usage.missingDomains,
      redactedDomains: packet.usage.redactedDomains,
      blockedDomains: packet.usage.blockedDomains,
      emptyButExpectedDomains: packet.usage.emptyButExpectedDomains,
      nextPersonalizedAction: packet.decisions[0]?.reason || null,
      warnings: [
        ...packet.safety.warnings,
        ...packet.usage.missingDomains.map((d) => `Personalization data missing for domain: ${d}`),
      ].slice(0, 10),
    };
  }

  /**
   * Detect if metadata reveals a contradiction:
   * personalizationUsed=false but availableDomains > 0.
   */
  detectUnusedPersonalization(metadata: PersonalizationResponseMetadata): string[] {
    const warnings: string[] = [];
    if (metadata.personalizationAvailable && !metadata.personalizationUsed) {
      warnings.push(
        `Personalization available (${metadata.usedDomains.length} domains) but not used in response.`,
      );
    }
    return warnings;
  }
}

// ── Singleton ──

export const personalizationResponseMetadataService = new PersonalizationResponseMetadataService();
