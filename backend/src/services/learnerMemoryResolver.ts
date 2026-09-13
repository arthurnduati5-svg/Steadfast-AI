// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learner Memory Resolver
// Resolves durable learner memory into TutorTurnContext.learnerProfile.
// Loads active memory, filters by subject/topic/skill/artifact,
// maps to ContextSignal arrays, and returns safe bounded context.
// ─────────────────────────────────────────────────────────────

import type {
  LearnerMemoryItem,
  LearnerMemoryKind,
  LearnerMemoryContext,
  LearnerMemoryContextStatus,
  ContextSignal,
  ResolveLearnerMemoryRequest,
} from './learnerMemoryContracts';
import { learnerMemoryService } from './learnerMemoryService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

function nowISO(): string {
  return new Date().toISOString();
}

// ── LearnerMemoryResolver ──

export class LearnerMemoryResolver {
  /**
   * Resolve learner memory context for TutorTurnContext.
   * Returns safe bounded signals. Never returns deleted/expired memory.
   */
  async resolveLearnerMemoryContext(
    identity: ResolvedTutorIdentity,
    request: ResolveLearnerMemoryRequest,
  ): Promise<LearnerMemoryContext> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const resolvedAt = nowISO();

    try {
      // Load all active memory for this learner
      const allMemory = await learnerMemoryService.listLearnerMemory(identity, {
        limit: 100,
        includeDeleted: false,
      });

      if (allMemory.length === 0) {
        return {
          status: 'no_data_yet',
          strengths: [],
          weaknesses: [],
          recentMistakes: [],
          misconceptionSignals: [],
          masterySignals: [],
          revisionNeeds: [],
          artifactUseSignals: [],
          languageSupportSignals: [],
          metacognitiveSupportSignals: [],
          memoryIdsUsed: [],
          eventIdsUsed: [],
          warnings: [],
          errors: [],
          resolvedAt,
        };
      }

      // Filter by subject/topic/skill/artifact if provided
      let filteredMemory = allMemory;
      if (request.subject) {
        filteredMemory = filteredMemory.filter(
          (m) => m.subject === request.subject,
        );
      }
      if (request.topic) {
        filteredMemory = filteredMemory.filter(
          (m) => m.topic === request.topic || m.summary.toLowerCase().includes(request.topic!.toLowerCase()),
        );
      }
      if (request.skillIds && request.skillIds.length > 0) {
        filteredMemory = filteredMemory.filter((m) =>
          request.skillIds!.some((sid) => m.skillIds.includes(sid)),
        );
      }
      if (request.artifactIds && request.artifactIds.length > 0) {
        // Prioritize artifact-linked memory but keep all
        const artifactMatch = filteredMemory.filter((m) =>
          request.artifactIds!.some((aid) => m.artifactIds.includes(aid)),
        );
        if (artifactMatch.length > 0) {
          // Sort artifact-linked to top
          const nonMatch = filteredMemory.filter(
            (m) => !request.artifactIds!.some((aid) => m.artifactIds.includes(aid)),
          );
          filteredMemory = [...artifactMatch, ...nonMatch];
        }
      }

      // Sort by priority: recent mistakes > misconceptions > revision needs > weaknesses > strengths > others
      const prioritized = this._prioritizeMemory(filteredMemory);

      const maxSignals = request.maxSignals || 8;

      // Map to context signals
      const strengths: ContextSignal[] = [];
      const weaknesses: ContextSignal[] = [];
      const recentMistakes: ContextSignal[] = [];
      const misconceptionSignals: ContextSignal[] = [];
      const masterySignals: ContextSignal[] = [];
      const revisionNeeds: ContextSignal[] = [];
      const artifactUseSignals: ContextSignal[] = [];
      const languageSupportSignals: ContextSignal[] = [];
      const metacognitiveSupportSignals: ContextSignal[] = [];

      const memoryIdsUsed: string[] = [];
      const eventIdsUsed: string[] = [];

      for (const mem of prioritized) {
        const signal = this._memoryToSignal(mem);
        memoryIdsUsed.push(mem.memoryId);
        for (const eid of mem.sourceEventIds) {
          if (!eventIdsUsed.includes(eid)) eventIdsUsed.push(eid);
        }

        switch (mem.kind) {
          case 'strength':
            if (strengths.length < maxSignals) strengths.push(signal);
            break;
          case 'weakness':
            if (weaknesses.length < maxSignals) weaknesses.push(signal);
            break;
          case 'recent_mistake':
            if (recentMistakes.length < maxSignals) recentMistakes.push(signal);
            break;
          case 'misconception':
            if (misconceptionSignals.length < maxSignals) misconceptionSignals.push(signal);
            break;
          case 'early_mastery_signal':
            if (masterySignals.length < maxSignals) masterySignals.push(signal);
            break;
          case 'revision_need':
            if (revisionNeeds.length < maxSignals) revisionNeeds.push(signal);
            break;
          case 'artifact_usage':
            if (artifactUseSignals.length < maxSignals) artifactUseSignals.push(signal);
            break;
          case 'language_support':
            if (languageSupportSignals.length < maxSignals) languageSupportSignals.push(signal);
            break;
          case 'metacognitive_support':
            if (metacognitiveSupportSignals.length < maxSignals) metacognitiveSupportSignals.push(signal);
            break;
          default:
            // practice_pattern, tutor_preference — included as notes
            break;
        }
      }

      // Determine context status
      let status: LearnerMemoryContextStatus = 'resolved';
      if (memoryIdsUsed.length === 0) {
        status = 'no_data_yet';
      } else if (errors.length > 0 && memoryIdsUsed.length === 0) {
        status = 'error';
      } else if (errors.length > 0) {
        status = 'partial';
      }

      return {
        status,
        strengths,
        weaknesses,
        recentMistakes,
        misconceptionSignals,
        masterySignals,
        revisionNeeds,
        artifactUseSignals,
        languageSupportSignals,
        metacognitiveSupportSignals,
        memoryIdsUsed,
        eventIdsUsed,
        warnings,
        errors,
        resolvedAt,
      };
    } catch (err) {
      errors.push(`Learner memory resolver failed: ${String(err)}`);
      return {
        status: 'error',
        strengths: [],
        weaknesses: [],
        recentMistakes: [],
        misconceptionSignals: [],
        masterySignals: [],
        revisionNeeds: [],
        artifactUseSignals: [],
        languageSupportSignals: [],
        metacognitiveSupportSignals: [],
        memoryIdsUsed: [],
        eventIdsUsed: [],
        warnings,
        errors,
        resolvedAt,
      };
    }
  }

  /**
   * Prioritize memory items: recent mistakes and misconceptions first,
   * then revision needs, weaknesses, strengths, then others.
   */
  private _prioritizeMemory(memory: LearnerMemoryItem[]): LearnerMemoryItem[] {
    const priority: Record<LearnerMemoryKind, number> = {
      recent_mistake: 0,
      misconception: 1,
      revision_need: 2,
      weakness: 3,
      strength: 4,
      early_mastery_signal: 5,
      artifact_usage: 6,
      language_support: 7,
      metacognitive_support: 8,
      practice_pattern: 9,
      tutor_preference: 10,
    };

    return [...memory].sort((a, b) => {
      const pa = priority[a.kind] ?? 99;
      const pb = priority[b.kind] ?? 99;
      if (pa !== pb) return pa - pb;
      // Same kind: higher confidence first, then more recent
      if (b.confidenceScore !== a.confidenceScore) {
        return b.confidenceScore - a.confidenceScore;
      }
      return b.lastObservedAt.localeCompare(a.lastObservedAt);
    });
  }

  /**
   * Convert a LearnerMemoryItem to a ContextSignal.
   */
  private _memoryToSignal(memory: LearnerMemoryItem): ContextSignal {
    return {
      id: memory.memoryId,
      label: memory.label,
      summary: memory.summary,
      source: `memory:${memory.kind}:${memory.source}`,
      confidence: memory.confidenceScore,
      updatedAt: memory.lastObservedAt,
    };
  }
}

// Singleton
export const learnerMemoryResolver = new LearnerMemoryResolver();
