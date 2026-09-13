// ─────────────────────────────────────────────────────────────
// Steadfast AI — Personalization Safety Service v1
// Sanitizes personalization signals before they enter the
// prompt block. Strips raw artifact text, OCR, transcript,
// answer keys, and hidden prompts. Marks redacted domains.
// Never lets learner data become instructions.
// ─────────────────────────────────────────────────────────────

import type {
  PersonalizationPacket,
  PersonalizationSignal,
  PersonalizationDomain,
  PersonalizationViolation,
} from './personalizationContracts';

import {
  MAX_PERSONALIZATION_SIGNAL_SUMMARY_CHARS,
  MAX_PERSONALIZATION_EVIDENCE_CHARS,
} from './personalizationContracts';

// ── Unsafe patterns that should never appear in signals ──

const UNSAFE_SUMMARY_PATTERNS = [
  /rawArtifactText/i,
  /rawOcrText/i,
  /rawTranscript/i,
  /fullTranscript/i,
  /answerKey/i,
  /rawAnswerKey/i,
  /markingSchemeRaw/i,
  /hiddenPrompt/i,
  /systemPrompt/i,
  /developerPrompt/i,
  /rawModelPrompt/i,
];

const INSTRUCTION_OVERRIDE_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|system|instructions?)/i,
  /you\s+(?:must|should|will|shall)\s+(?:ignore|forget|disregard)/i,
  /reveal\s+(?:the\s+)?(?:answer|solution|key)/i,
];

export class PersonalizationSafetyService {
  /**
   * Sanitize a single signal — strip raw data, check for prompt injection.
   */
  sanitizeSignal(signal: PersonalizationSignal): PersonalizationSignal {
    let warnings = [...signal.warnings];
    let title = signal.title;
    let summary = signal.summary;
    let evidence = [...signal.evidence];
    let status = signal.status;
    let useLevel = signal.useLevel;

    // Check summary for unsafe patterns
    const summaryMatch = UNSAFE_SUMMARY_PATTERNS.some((p) => p.test(summary));
    if (summaryMatch) {
      summary = '[REDACTED: unsafe content]';
      warnings.push('Unsafe content detected in signal summary — redacted.');
      status = 'redacted';
    }

    const titleMatch = UNSAFE_SUMMARY_PATTERNS.some((p) => p.test(title));
    if (titleMatch) {
      title = `${signal.domain} signal (redacted)`;
      warnings.push('Unsafe content detected in signal title — redacted.');
      status = 'redacted';
    }

    // Check evidence items
    evidence = evidence.map((e) => {
      const unsafe = UNSAFE_SUMMARY_PATTERNS.some((p) => p.test(e));
      if (unsafe) {
        warnings.push('Unsafe evidence redacted.');
        return '[REDACTED]';
      }
      return e.slice(0, MAX_PERSONALIZATION_EVIDENCE_CHARS);
    });

    // Check for instruction override attempts
    const combinedText = `${title} ${summary}`;
    const hasInjection = INSTRUCTION_OVERRIDE_PATTERNS.some((p) => p.test(combinedText));
    if (hasInjection) {
      warnings.push('Potential prompt injection attempt detected in signal — treated as data, not instructions.');
      useLevel = 'blocked';
    }

    // Bound strings
    summary = summary.slice(0, MAX_PERSONALIZATION_SIGNAL_SUMMARY_CHARS);
    title = title.slice(0, 120);

    return {
      ...signal,
      title,
      summary,
      evidence,
      status,
      useLevel,
      warnings: warnings.slice(0, 5),
    };
  }

  /**
   * Sanitize the entire personalization packet.
   */
  sanitizePacket(packet: PersonalizationPacket): PersonalizationPacket {
    const redactedDomains: PersonalizationDomain[] = [...packet.usage.redactedDomains];
    const blockedDomains: PersonalizationDomain[] = [...packet.usage.blockedDomains];
    const warnings: string[] = [...packet.safety.warnings];

    const sanitizedDomains: PersonalizationPacket['domains'] = {
      learnerMemory: packet.domains.learnerMemory.map((s) => this.sanitizeSignal(s)),
      mastery: packet.domains.mastery.map((s) => this.sanitizeSignal(s)),
      misconceptions: packet.domains.misconceptions.map((s) => this.sanitizeSignal(s)),
      artifactHistory: packet.domains.artifactHistory.map((s) => this.sanitizeSignal(s)),
      videoHistory: packet.domains.videoHistory.map((s) => this.sanitizeSignal(s)),
      artifactPractice: packet.domains.artifactPractice.map((s) => this.sanitizeSignal(s)),
      videoPractice: packet.domains.videoPractice.map((s) => this.sanitizeSignal(s)),
      recentActivity: packet.domains.recentActivity.map((s) => this.sanitizeSignal(s)),
      tutorState: packet.domains.tutorState.map((s) => this.sanitizeSignal(s)),
      intent: packet.domains.intent.map((s) => this.sanitizeSignal(s)),
      sourceTrust: packet.domains.sourceTrust.map((s) => this.sanitizeSignal(s)),
      cachePolicy: packet.domains.cachePolicy.map((s) => this.sanitizeSignal(s)),
    };

    // Track redacted/blocked domains
    for (const [key, signals] of Object.entries(sanitizedDomains)) {
      const domain = key as PersonalizationDomain;
      if (signals.some((s) => s.status === 'redacted') && !redactedDomains.includes(domain)) {
        redactedDomains.push(domain);
      }
      if (signals.some((s) => s.useLevel === 'blocked') && !blockedDomains.includes(domain)) {
        blockedDomains.push(domain);
      }
    }

    if (redactedDomains.length > packet.usage.redactedDomains.length) {
      warnings.push(`Additional redacted domains: ${redactedDomains.filter((d) => !packet.usage.redactedDomains.includes(d)).join(', ')}`);
    }

    return {
      ...packet,
      domains: sanitizedDomains,
      usage: {
        ...packet.usage,
        redactedDomains,
        blockedDomains,
      },
      safety: {
        ...packet.safety,
        promptInjectionBlocked: true,
        warnings,
      },
    };
  }

  /**
   * Assert the packet is safe to use in prompt assembly.
   */
  assertPacketSafe(packet: PersonalizationPacket): { ok: boolean; violations: PersonalizationViolation[] } {
    const violations: PersonalizationViolation[] = [];

    // Check safety guarantees
    if (packet.safety.rawArtifactTextIncluded) {
      violations.push({ code: 'RAW_ARTIFACT_TEXT', message: 'Raw artifact text detected in packet.', severity: 'error' });
    }
    if (packet.safety.rawOcrTextIncluded) {
      violations.push({ code: 'RAW_OCR_TEXT', message: 'Raw OCR text detected in packet.', severity: 'error' });
    }
    if (packet.safety.rawTranscriptIncluded) {
      violations.push({ code: 'RAW_TRANSCRIPT', message: 'Raw transcript detected in packet.', severity: 'error' });
    }
    if (packet.safety.answerKeyIncluded) {
      violations.push({ code: 'ANSWER_KEY_EXPOSED', message: 'Answer key detected in packet.', severity: 'error' });
    }
    if (packet.safety.hiddenPromptIncluded) {
      violations.push({ code: 'HIDDEN_PROMPT', message: 'Hidden prompt detected in packet.', severity: 'error' });
    }

    return {
      ok: violations.filter((v) => v.severity === 'error').length === 0,
      violations,
    };
  }
}

// ── Singleton ──

export const personalizationSafetyService = new PersonalizationSafetyService();
