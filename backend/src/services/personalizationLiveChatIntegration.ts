// ─────────────────────────────────────────────────────────────
// Steadfast AI — Personalization Live Chat Integration v1
// Integrates personalization resolution into the live chat
// pipeline as a dedicated step: resolve → sanitize → guard
// → compose → attach. Works with existing pipeline flow.
// ─────────────────────────────────────────────────────────────

import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { TutorTurnContext } from './tutorStateContracts';
import type { DedicatedTutorState } from './tutorStateEndpointContracts';
import type { PersonalizationPacket, PersonalizationResponseMetadata, PersonalizationEnforcementResult } from './personalizationContracts';
import { personalizationSignalResolver } from './personalizationSignalResolver';
import { personalizationSafetyService } from './personalizationSafetyService';
import { personalizationNoEmptyContextGuard } from './personalizationNoEmptyContextGuard';
import { personalizationPromptComposer } from './personalizationPromptComposer';
import { personalizationResponseMetadataService } from './personalizationResponseMetadataService';
import { personalizationEventService } from './personalizationEventService';

export interface PersonalizationIntegrationInput {
  identity: ResolvedTutorIdentity;
  turnContext: TutorTurnContext | null;
  dedicatedState: DedicatedTutorState | null;
  hadLearnerMemory?: boolean;
  hadMastery?: boolean;
  hadMisconceptions?: boolean;
  hadArtifactPractice?: boolean;
  hadVideoPractice?: boolean;
  hadArtifactHistory?: boolean;
  hadVideoHistory?: boolean;
  hadTutorState?: boolean;
}

export interface PersonalizationIntegrationOutput {
  packet: PersonalizationPacket | null;
  promptBlock: string | null;
  metadata: PersonalizationResponseMetadata | null;
  enforcementResult: PersonalizationEnforcementResult | null;
  usedInPrompt: boolean;
  warnings: string[];
}

export class PersonalizationLiveChatIntegration {
  /**
   * Run the full personalization pipeline for a live chat turn.
   * Never throws — returns null packet on failure with warnings.
   */
  async resolveForTurn(input: PersonalizationIntegrationInput): Promise<PersonalizationIntegrationOutput> {
    const warnings: string[] = [];

    try {
      // 1. Resolve signals
      const packet = personalizationSignalResolver.resolvePacket({
        turnContext: input.turnContext,
        dedicatedState: input.dedicatedState,
      });

      // 2. Sanitize packet
      const sanitizedPacket = personalizationSafetyService.sanitizePacket(packet);

      // 3. Assert packet safety
      const safetyAssertion = personalizationSafetyService.assertPacketSafe(sanitizedPacket);
      if (!safetyAssertion.ok) {
        warnings.push(...safetyAssertion.violations.map((v) => v.message));
        // Write event for safety violation (non-blocking)
        personalizationEventService.writeEvent(input.identity, 'personalization_domain_blocked', sanitizedPacket, warnings).catch(() => {});
        return {
          packet: sanitizedPacket,
          promptBlock: null,
          metadata: { personalizationAvailable: false, personalizationUsed: false, usedDomains: [], missingDomains: [], redactedDomains: [], blockedDomains: [], emptyButExpectedDomains: [], warnings },
          enforcementResult: { ok: false, packet: sanitizedPacket, metadata: { personalizationAvailable: false, personalizationUsed: false, usedDomains: [], missingDomains: [], redactedDomains: [], blockedDomains: [], emptyButExpectedDomains: [], warnings }, violations: safetyAssertion.violations },
          usedInPrompt: false,
          warnings,
        };
      }

      // 4. Run no-empty-context guard
      const guardResult = personalizationNoEmptyContextGuard.assertNoEmptyPersonalizationWhenDataExists({
        packet: sanitizedPacket,
        hadLearnerMemory: input.hadLearnerMemory ?? false,
        hadMastery: input.hadMastery ?? false,
        hadMisconceptions: input.hadMisconceptions ?? false,
        hadArtifactPractice: input.hadArtifactPractice ?? false,
        hadVideoPractice: input.hadVideoPractice ?? false,
        hadArtifactHistory: input.hadArtifactHistory ?? false,
        hadVideoHistory: input.hadVideoHistory ?? false,
        hadTutorState: input.hadTutorState ?? false,
      });

      if (!guardResult.ok) {
        warnings.push(...guardResult.violations.map((v) => v.message));
        personalizationEventService.writeEvent(input.identity, 'personalization_empty_context_blocked', sanitizedPacket, warnings).catch(() => {});
        return {
          packet: sanitizedPacket,
          promptBlock: null,
          metadata: guardResult.metadata,
          enforcementResult: guardResult,
          usedInPrompt: false,
          warnings,
        };
      }

      // 5. Compose prompt block
      const promptBlockResult = personalizationPromptComposer.composePromptBlock(sanitizedPacket);

      // 6. Build metadata
      const metadata = personalizationResponseMetadataService.buildMetadata({
        packet: sanitizedPacket,
        promptUsedDomains: promptBlockResult.usedDomains,
        promptUsed: true,
      });

      // 7. Write event (non-blocking)
      personalizationEventService.writeEvent(input.identity, 'personalization_packet_resolved', sanitizedPacket).catch(() => {});

      return {
        packet: sanitizedPacket,
        promptBlock: promptBlockResult.promptBlock,
        metadata,
        enforcementResult: guardResult,
        usedInPrompt: promptBlockResult.usedDomains.length > 0,
        warnings,
      };
    } catch (err) {
      warnings.push(`Personalization resolution error: ${String(err)}`);
      return {
        packet: null,
        promptBlock: null,
        metadata: null,
        enforcementResult: null,
        usedInPrompt: false,
        warnings,
      };
    }
  }
}

export const personalizationLiveChatIntegration = new PersonalizationLiveChatIntegration();
