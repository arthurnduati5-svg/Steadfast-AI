// ─────────────────────────────────────────────────────────────
// Steadfast AI — Growth Proof Service v1
// Evaluates learning evidence and produces growth proof verdicts.
// Prevents fake mastery and fake growth claims.
//
// Growth proof rules:
// - insufficient_evidence: too few events
// - early_signal: weak or moderate signs
// - growth_observed: correction, retry, or reasoning improvement
// - mastery_candidate: only when strong evidence exists
// - mastery_not_supported: weak, stale, demo, fallback, or inconsistent
// ═══════════════════════════════════════════════════════════════

import type {
  GrowthProof,
  GrowthProofVerdict,
  GrowthProofInput,
  GrowthProofOutput,
  GrowthProofEvidenceEvent,
} from './growthProofContracts';

import {
  GROWTH_PROOF_RULES,
} from './growthProofContracts';

import type {
  LearningEvidenceStrength,
  MistakeTaxonomyCode,
} from './learningEvidenceLedgerContracts';

import {
  STRENGTH_ORDER,
} from './learningEvidenceLedgerContracts';

function nowISO(): string {
  return new Date().toISOString();
}

// ═══════════════════════════════════════════════════════════════
// Growth Proof Constants
// ═══════════════════════════════════════════════════════════════

const STRENGTH_SCORES: Record<LearningEvidenceStrength, number> = {
  none: 0,
  weak: 0.25,
  moderate: 0.5,
  strong: 0.75,
  mastery_candidate: 1.0,
};

// ═══════════════════════════════════════════════════════════════
// Growth Proof Service
// ═══════════════════════════════════════════════════════════════

export class GrowthProofService {
  /**
   * Evaluate evidence and produce a growth proof verdict.
   */
  evaluateGrowth(input: GrowthProofInput): GrowthProofOutput {
    const warnings: string[] = [];
    const events = input.evidenceEvents || [];

    if (events.length === 0) {
      return {
        proof: {
          learnerIdHash: input.learnerIdHash,
          subjectId: input.subjectId,
          skillId: input.skillId,
          topicId: input.topicId,
          verdict: 'insufficient_evidence',
          safeReason: 'No evidence events provided. Growth cannot be assessed.',
          supportingEvidenceEventIds: [],
          evidenceStrength: 'none',
          revisionRecommended: false,
          masteryClaimAllowed: false,
          confidenceScore: 0,
          rawPrivateDataIncluded: false,
        },
        warnings: ['No evidence events to evaluate.'],
        generatedAt: nowISO(),
      };
    }

    // Separate real evidence from demo/fallback/synthetic
    const realEvents = events.filter((e) => e.sourceQuality === 'real');
    const demoFallbackEvents = events.filter(
      (e) => e.sourceQuality === 'demo' || e.sourceQuality === 'fallback' || e.sourceQuality === 'synthetic_test',
    );

    // If all events are demo/fallback/synthetic, block mastery
    if (realEvents.length === 0 && demoFallbackEvents.length > 0) {
      return {
        proof: this._buildProof(input, {
          verdict: 'mastery_not_supported',
          safeReason: 'All evidence is from demo, fallback, or synthetic sources. Real growth cannot be proven.',
          evidenceEventIds: events.map((e) => e.eventId),
          evidenceStrength: 'none',
          revisionRecommended: false,
          masteryClaimAllowed: false,
          confidenceScore: 0,
        }),
        warnings: ['All evidence is from non-real sources. Real growth cannot be proven.'],
        generatedAt: nowISO(),
      };
    }

    // If no real events, insufficient evidence
    if (realEvents.length === 0) {
      return {
        proof: this._buildProof(input, {
          verdict: 'insufficient_evidence',
          safeReason: 'No real evidence events available for growth evaluation.',
          evidenceEventIds: events.map((e) => e.eventId),
          evidenceStrength: 'none',
          revisionRecommended: false,
          masteryClaimAllowed: false,
          confidenceScore: 0,
        }),
        warnings: ['No real evidence events.'],
        generatedAt: nowISO(),
      };
    }

    // Analyze real evidence
    const strongestStrength = this._findStrongestStrength(realEvents);
    const strongCount = realEvents.filter(
      (e) => e.evidenceStrength === 'strong' || e.evidenceStrength === 'mastery_candidate',
    ).length;
    const moderateCount = realEvents.filter((e) => e.evidenceStrength === 'moderate').length;
    const weakCount = realEvents.filter((e) => e.evidenceStrength === 'weak').length;
    const noneCount = realEvents.filter((e) => e.evidenceStrength === 'none').length;

    const hasCorrection = realEvents.some((e) => e.correctionObserved === true);
    const hasReflection = realEvents.some((e) => e.reflectionObserved === true);
    const hasTransfer = realEvents.some((e) => e.transferObserved === true);

    // Check for hint dependency
    const hintEvents = realEvents.filter(
      (e) => e.hintLevel && parseInt(e.hintLevel, 10) >= GROWTH_PROOF_RULES.HINT_DEPENDENCY_THRESHOLD,
    );
    const hasHintDependency = hintEvents.length >= 3;

    // Check for stale/fresh
    const freshCount = realEvents.filter((e) => e.freshness === 'fresh' || e.freshness === 'recent').length;
    const staleCount = realEvents.filter((e) => e.freshness === 'stale' || e.freshness === 'expired').length;

    // Detect mistake patterns
    const mistakeTypes: MistakeTaxonomyCode[] = realEvents
      .filter((e) => e.mistakeType && e.mistakeType !== 'unknown')
      .map((e) => e.mistakeType!) as MistakeTaxonomyCode[];
    const uniqueMistakeTypes = [...new Set(mistakeTypes)];

    // ── Verdict: mastery_candidate ──
    // Requires: strong evidence, >= MIN_STRONG_EVENTS, not all stale, not hint-dependent
    if (
      strongestStrength === 'mastery_candidate' ||
      (strongestStrength === 'strong' && strongCount >= GROWTH_PROOF_RULES.MIN_STRONG_EVENTS_FOR_MASTERY_CANDIDATE)
    ) {
      if (realEvents.length >= GROWTH_PROOF_RULES.MIN_EVENTS_FOR_MASTERY_CANDIDATE) {
        if (!hasHintDependency && staleCount < freshCount) {
          // One correct answer alone is not mastery - check for multiple forms of evidence
          const correctAnswerOnly = strongCount === 1 && !hasCorrection && !hasReflection && !hasTransfer;
          if (!correctAnswerOnly) {
            return {
              proof: this._buildProof(input, {
                verdict: 'mastery_candidate',
                safeReason: `Strong evidence of growth detected (${strongCount} strong/mastery events). Correction, reflection, or transfer signals present.`,
                evidenceEventIds: realEvents.map((e) => e.eventId),
                evidenceStrength: strongestStrength,
                revisionRecommended: false,
                masteryClaimAllowed: true,
                confidenceScore: Math.min(0.9, 0.5 + strongCount * 0.1 + (hasCorrection ? 0.1 : 0) + (hasTransfer ? 0.1 : 0) + (hasReflection ? 0.05 : 0)),
              }),
              warnings: [],
              generatedAt: nowISO(),
            };
          }

          // Single correct answer with no other signals — not mastery
          return {
            proof: this._buildProof(input, {
              verdict: 'growth_observed',
              safeReason: 'Correct answer observed but one correct answer alone is not sufficient for mastery. More evidence needed.',
              evidenceEventIds: realEvents.map((e) => e.eventId),
              evidenceStrength: strongestStrength,
              revisionRecommended: true,
              masteryClaimAllowed: false,
              confidenceScore: 0.4,
            }),
            warnings: ['One correct answer alone cannot prove mastery. Additional practice or explanation needed.'],
            generatedAt: nowISO(),
          };
        }

        return {
          proof: this._buildProof(input, {
            verdict: 'growth_observed',
            safeReason: hasHintDependency
              ? 'Evidence shows strong signals but heavy hint dependency prevents mastery confirmation.'
              : 'Evidence shows strong signals but stale evidence prevents current mastery confirmation.',
            evidenceEventIds: realEvents.map((e) => e.eventId),
            evidenceStrength: strongestStrength,
            revisionRecommended: true,
            masteryClaimAllowed: false,
            confidenceScore: 0.5,
          }),
          warnings: [
            hasHintDependency ? 'Heavy hint dependency detected. Mastery cannot be confirmed.' : '',
            staleCount >= freshCount ? 'Stale evidence outweighs fresh evidence.' : '',
          ].filter(Boolean),
          generatedAt: nowISO(),
        };
      }
    }

    // ── Verdict: growth_observed ──
    // Requires: real events with correction/reflection/transfer OR moderate+ evidence
    if (
      realEvents.length >= GROWTH_PROOF_RULES.MIN_EVENTS_FOR_GROWTH &&
      (hasCorrection || hasReflection || hasTransfer || strongestStrength === 'moderate' || strongCount >= 1)
    ) {
      if (weakCount <= GROWTH_PROOF_RULES.MAX_WEAK_FOR_GROWTH || strongCount >= 1) {
        return {
          proof: this._buildProof(input, {
            verdict: 'growth_observed',
            safeReason: hasCorrection
              ? 'Growth observed through correction of previous mistakes.'
              : hasTransfer
                ? 'Growth observed through successful transfer to new contexts.'
                : hasReflection
                  ? 'Growth observed through learner reflection.'
                  : 'Growth observed through moderate or strong evidence signals.',
            evidenceEventIds: realEvents.map((e) => e.eventId),
            evidenceStrength: strongestStrength,
            revisionRecommended: hasHintDependency,
            masteryClaimAllowed: false,
            confidenceScore: Math.min(0.7, 0.3 + (hasCorrection ? 0.2 : 0) + (hasTransfer ? 0.2 : 0) + (hasReflection ? 0.1 : 0)),
          }),
          warnings: hasHintDependency ? ['Hint dependency detected. Practice without hints recommended before mastery.'] : [],
          generatedAt: nowISO(),
        };
      }

      return {
        proof: this._buildProof(input, {
          verdict: 'early_signal',
          safeReason: 'Some learning activity detected but most evidence is weak. More robust learner work needed.',
          evidenceEventIds: realEvents.map((e) => e.eventId),
          evidenceStrength: strongestStrength,
          revisionRecommended: true,
          masteryClaimAllowed: false,
          confidenceScore: 0.2,
        }),
        warnings: ['Most evidence is weak. Encourage more active learner work.'],
        generatedAt: nowISO(),
      };
    }

    // ── Verdict: early_signal ──
    if (realEvents.length >= GROWTH_PROOF_RULES.MIN_EVENTS_FOR_EARLY_SIGNAL) {
      return {
        proof: this._buildProof(input, {
          verdict: 'early_signal',
          safeReason: 'Early learning signals detected but insufficient for growth confirmation.',
          evidenceEventIds: realEvents.map((e) => e.eventId),
          evidenceStrength: strongestStrength,
          revisionRecommended: true,
          masteryClaimAllowed: false,
          confidenceScore: 0.15,
        }),
        warnings: ['Limited evidence available. Continue practice and engagement.'],
        generatedAt: nowISO(),
      };
    }

    // ── Verdict: insufficient_evidence ──
    return {
      proof: this._buildProof(input, {
        verdict: 'insufficient_evidence',
        safeReason: 'Insufficient evidence to evaluate growth.',
        evidenceEventIds: realEvents.map((e) => e.eventId),
        evidenceStrength: strongestStrength,
        revisionRecommended: false,
        masteryClaimAllowed: false,
        confidenceScore: 0,
      }),
      warnings: ['Very limited evidence. Need more learner interactions.'],
      generatedAt: nowISO(),
    };
  }

  /**
   * Build a growth proof from parameters.
   */
  private _buildProof(
    input: GrowthProofInput,
    params: {
      verdict: GrowthProofVerdict;
      safeReason: string;
      evidenceEventIds: string[];
      evidenceStrength: LearningEvidenceStrength;
      revisionRecommended: boolean;
      masteryClaimAllowed: boolean;
      confidenceScore: number;
    },
  ): GrowthProof {
    // Find dominant mistake pattern
    let mistakePattern: MistakeTaxonomyCode | undefined;
    const mistakes = input.evidenceEvents
      .filter((e) => e.mistakeType && e.mistakeType !== 'unknown')
      .map((e) => e.mistakeType!);
    if (mistakes.length > 0) {
      // Find most common mistake
      const counts = new Map<MistakeTaxonomyCode, number>();
      for (const m of mistakes) {
        counts.set(m, (counts.get(m) || 0) + 1);
      }
      let maxCount = 0;
      for (const [m, c] of counts) {
        if (c > maxCount) {
          maxCount = c;
          mistakePattern = m;
        }
      }
    }

    return {
      learnerIdHash: input.learnerIdHash,
      subjectId: input.subjectId,
      skillId: input.skillId,
      topicId: input.topicId,
      verdict: params.verdict,
      safeReason: params.safeReason,
      supportingEvidenceEventIds: params.evidenceEventIds,
      evidenceStrength: params.evidenceStrength,
      mistakePattern,
      revisionRecommended: params.revisionRecommended,
      masteryClaimAllowed: params.masteryClaimAllowed,
      confidenceScore: params.confidenceScore,
      rawPrivateDataIncluded: false,
    };
  }

  /**
   * Find the strongest evidence strength in a list of events.
   */
  private _findStrongestStrength(events: GrowthProofEvidenceEvent[]): LearningEvidenceStrength {
    let strongest: LearningEvidenceStrength = 'none';
    for (const e of events) {
      const currentIdx = STRENGTH_ORDER.indexOf(e.evidenceStrength);
      const strongestIdx = STRENGTH_ORDER.indexOf(strongest);
      if (currentIdx > strongestIdx) {
        strongest = e.evidenceStrength;
      }
    }
    return strongest;
  }
}

// Singleton
export const growthProofService = new GrowthProofService();
