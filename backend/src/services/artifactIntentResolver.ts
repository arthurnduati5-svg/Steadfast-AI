// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Intent Resolver v2
// Classifies learner intent using structured context, not
// keyword-only matching. Handles explain, hint, mark, practice,
// diagram, worked-example, formula, and follow-up intents.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactReasoningContext,
  ArtifactReasoningIntent,
  ArtifactReasoningIntentResolution,
} from './artifactReasoningContracts';

export class ArtifactIntentResolver {
  /**
   * Resolve the artifact reasoning intent from context and message.
   */
  resolve(context: ArtifactReasoningContext): ArtifactReasoningIntentResolution {
    const message = (context.learnerMessage || '').trim().toLowerCase();
    const warnings: string[] = [];

    // 1. Answer marking — answerText present and question context exists
    if (context.answerText && context.answerText.trim().length > 0) {
      if (context.activeQuestionId || context.questions.length > 0) {
        return {
          intent: 'mark_answer',
          method: 'structured',
          confidence: 'high',
          requiresClarification: false,
          warnings: [],
        };
      }
      return {
        intent: 'mark_answer',
        method: 'structured',
        confidence: 'medium',
        requiresClarification: false,
        warnings: ['Answer text provided but no active question — will attempt generic marking.'],
      };
    }

    // 2. Explain question — direct reference to question
    if (
      /explain\s+(question|this|that|q|it)/i.test(message) ||
      /what\s+(is|does|about)\s+(question|q)/i.test(message) ||
      /tell\s+me\s+(about|what)\s+(question|q)/i.test(message) ||
      /break\s+down\s+(question|this)/i.test(message) ||
      /walk\s+me\s+through\s+(question|this)/i.test(message)
    ) {
      return {
        intent: 'explain_question',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 3. Hint — learner asks for hint
    if (
      /(give|can|will|could)\s+(me\s+)?(a\s+)?hint/i.test(message) ||
      /hint/i.test(message) ||
      /help\s+me\s+(with|start)/i.test(message) ||
      /nudge/i.test(message) ||
      /clue/i.test(message)
    ) {
      return {
        intent: 'give_hint',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 4. Similar practice
    if (
      /(another|similar|another\s+like\s+this|different|one\s+more|more\s+like)\s+(one|question|practice|example)/i.test(message) ||
      /(give|create|make)\s+(me\s+)?(another|similar|another\s+one)/i.test(message)
    ) {
      return {
        intent: 'generate_similar_practice',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 5. Section practice
    if (
      /(practice|questions|exercises)\s+(from|in|for)\s+(section|part\s+\d+|chapter)/i.test(message) ||
      /(section|chapter|part)\s+\d+\s+(practice|questions|exercises)/i.test(message)
    ) {
      return {
        intent: 'generate_section_practice',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 6. Explain worked example
    if (
      /explain\s+(the\s+)?(worked\s+example|example|sample\s+problem)/i.test(message) ||
      /walk\s+me\s+through\s+(the\s+)?(example|worked)/i.test(message) ||
      /show\s+me\s+(how|the\s+steps)/i.test(message)
    ) {
      return {
        intent: 'explain_worked_example',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 7. Explain formula/theorem
    if (
      /explain\s+(the\s+)?(formula|theorem|equation|definition)/i.test(message) ||
      /what\s+(is|does)\s+(the\s+)?(formula|theorem|equation|definition)/i.test(message)
    ) {
      return {
        intent: 'explain_formula',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 8. Explain diagram
    if (
      /explain\s+(the\s+)?(diagram|figure|table|chart|graph|image)/i.test(message) ||
      /what\s+(does|is)\s+(the\s+)?(diagram|figure|table|chart|graph|image)\s+(mean|show|say)/i.test(message)
    ) {
      return {
        intent: 'explain_diagram',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 9. Teach from artifact
    if (
      /(teach|tutor|guide)\s+me\s+(from|using|with)\s+(this|the|that|the\s+worksheet|the\s+file|the\s+artifact)/i.test(message) ||
      /(use|based\s+on)\s+(this|the|that)\s+(worksheet|file|document|artifact|paper)/i.test(message) ||
      /learn\s+(from|using)\s+(this|the)/i.test(message)
    ) {
      return {
        intent: 'teach_from_artifact',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 10. Summarize artifact
    if (
      /(summarize|summary|overview|what'?s\s+this\s+about|what\s+is\s+this\s+(file|worksheet|document|page))/i.test(message)
    ) {
      return {
        intent: 'summarize_artifact',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 11. Find topic
    if (
      /(find|locate|where\s+is|what\s+topic|which\s+section)\s+(is\s+)?(question|this|that)/i.test(message) ||
      /what\s+(topic|skill|subject)\s+(is|does)\s+(question|this|that)/i.test(message) ||
      /which\s+topic/i.test(message)
    ) {
      return {
        intent: 'find_topic',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 12. Compare to worked example
    if (
      /(compare|check|match)\s+(my|the)\s+(answer|work)\s+(to|with|against|using)\s+(the\s+)?(worked\s+)?(example|answer)/i.test(message) ||
      /is\s+(my|the)\s+(answer|work)\s+(correct|right|wrong)\s+(like|compared\s+to)\s+(the\s+)?(example|worked)/i.test(message)
    ) {
      return {
        intent: 'compare_to_worked_example',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 13. Clarify reference — ambiguous
    if (
      /(what\s+(question|section|part|page)|which\s+(question|one|part)|i\s+don'?t\s+know\s+which|not\s+sure\s+which)/i.test(message)
    ) {
      return {
        intent: 'clarify_reference',
        method: 'structured',
        confidence: 'medium',
        requiresClarification: true,
        warnings: ['Learner needs help identifying the reference.'],
      };
    }

    // 14. Explain section (generic section/question reference)
    if (/(section|part|chapter)\s+\d+/i.test(message)) {
      return {
        intent: 'explain_section',
        method: 'structured',
        confidence: 'high',
        requiresClarification: false,
        warnings: [],
      };
    }

    // 15. Fallback — vague artifact-related
    if (context.questions.length > 0 || context.blocks.length > 0) {
      // If artifact is active but intent is unclear, default to teach_from_artifact
      return {
        intent: 'teach_from_artifact',
        method: 'fallback',
        confidence: 'low',
        requiresClarification: true,
        warnings: [
          'Learner intent could not be confidently determined from message. Defaulting to teach_from_artifact with clarification available.',
        ],
      };
    }

    // 16. Unsupported
    return {
      intent: 'unsupported_or_ambiguous',
      method: 'fallback',
      confidence: 'low',
      requiresClarification: false,
      warnings: ['Learner intent could not be determined and no artifact context is active.'],
    };
  }
}

export const artifactIntentResolver = new ArtifactIntentResolver();
