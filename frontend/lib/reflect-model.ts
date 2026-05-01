import type {
  MetacognitiveConfidence,
  MetacognitiveErrorType,
  MetacognitiveEvent,
  MetacognitiveProblemFraming,
  MetacognitivePrompt,
  MetacognitiveStateSnapshot,
  MetacognitiveStrategyPreference,
  MetacognitiveTransferReadiness,
  ReflectCardVariant,
  StudentConfidenceSelfCheck,
  StudentProgressCheck,
  StudentSupportPreference,
} from '@/lib/types';

export type MetacognitiveChoicePayload = {
  eventType: MetacognitiveEvent['eventType'];
  confidence?: MetacognitiveConfidence | null;
  problemFraming?: MetacognitiveProblemFraming | null;
  errorType?: MetacognitiveErrorType | null;
  strategyPreference?: MetacognitiveStrategyPreference | null;
  transferReadiness?: MetacognitiveTransferReadiness | null;
  confidenceSelfCheck?: StudentConfidenceSelfCheck | null;
  supportPreference?: StudentSupportPreference | null;
  progressCheck?: StudentProgressCheck | null;
  note?: string | null;
  snapshotPatch?: MetacognitiveStateSnapshot | null;
};

export type ChoiceDefinition = {
  label: string;
  payload: MetacognitiveChoicePayload;
};

export type ReflectCardSpec = {
  headline: string;
  mainPrompt: string;
  primaryChoices: ChoiceDefinition[];
  supportPrompt?: string | null;
  supportChoices?: ChoiceDefinition[];
  autoSubmitPrimary?: boolean;
};

export function resolveMetacognitiveVariant(prompt: MetacognitivePrompt): ReflectCardVariant {
  if (prompt.variant) return prompt.variant;
  switch (prompt.type) {
    case 'progress_check':
      return 'after_correction';
    case 'practice_readiness':
    case 'inspect_step':
    case 'choose_support':
      return 'before_practice';
    case 'revision_recheck':
      return 'revision_comeback';
    case 'weak_topic_recovery':
      return 'weak_topic_recovery';
    default:
      return 'before_continue';
  }
}

function buildConfidenceChoices(): ChoiceDefinition[] {
  return [
    {
      label: 'I understand this well',
        payload: {
          eventType: 'confidence_check',
          confidenceSelfCheck: 'understand_well',
          snapshotPatch: { confidenceSelfCheck: 'understand_well' },
        },
    },
    {
      label: 'I partly understand',
        payload: {
          eventType: 'confidence_check',
          confidenceSelfCheck: 'partly_understand',
          snapshotPatch: { confidenceSelfCheck: 'partly_understand' },
        },
    },
    {
      label: 'I am confused',
        payload: {
          eventType: 'confidence_check',
          confidenceSelfCheck: 'confused',
          snapshotPatch: { confidenceSelfCheck: 'confused' },
        },
    },
  ];
}

function buildSupportChoices(): ChoiceDefinition[] {
  return [
    {
      label: 'A simpler explanation',
        payload: {
          eventType: 'strategy_selected',
          supportPreference: 'simpler_explanation',
          snapshotPatch: { supportPreference: 'simpler_explanation' },
        },
    },
    {
      label: 'One small hint',
        payload: {
          eventType: 'strategy_selected',
          supportPreference: 'small_hint',
          snapshotPatch: { supportPreference: 'small_hint' },
        },
    },
    {
      label: 'A worked example',
        payload: {
          eventType: 'strategy_selected',
          supportPreference: 'worked_example',
          snapshotPatch: { supportPreference: 'worked_example' },
        },
    },
    {
      label: 'A practice question',
        payload: {
          eventType: 'strategy_selected',
          supportPreference: 'practice_question',
          snapshotPatch: { supportPreference: 'practice_question' },
        },
    },
  ];
}

function buildProgressChoices(): ChoiceDefinition[] {
  return [
    {
      label: 'Still confusing',
        payload: {
          eventType: 'concept_clarity_check',
          confidenceSelfCheck: 'confused',
          progressCheck: 'still_confusing',
          snapshotPatch: { confidenceSelfCheck: 'confused' },
      },
    },
    {
      label: 'Getting clearer',
        payload: {
          eventType: 'concept_clarity_check',
          confidenceSelfCheck: 'partly_understand',
          progressCheck: 'getting_clearer',
          snapshotPatch: { confidenceSelfCheck: 'partly_understand' },
      },
    },
    {
      label: 'I think I get it',
        payload: {
          eventType: 'concept_clarity_check',
          confidenceSelfCheck: 'understand_well',
          progressCheck: 'i_think_i_get_it',
          snapshotPatch: { confidenceSelfCheck: 'understand_well' },
      },
    },
    {
      label: 'Let me try one now',
        payload: {
          eventType: 'revision_intent_check',
          confidenceSelfCheck: 'partly_understand',
          supportPreference: 'practice_question',
          progressCheck: 'let_me_try_one_now',
        snapshotPatch: {
          confidenceSelfCheck: 'partly_understand',
          supportPreference: 'practice_question',
        },
      },
    },
  ];
}

function buildPracticeReadinessChoices(): ChoiceDefinition[] {
  return [
    {
      label: 'Yes, let me try',
        payload: {
          eventType: 'revision_intent_check',
          confidenceSelfCheck: 'understand_well',
          supportPreference: 'practice_question',
          progressCheck: 'ready_to_try',
        snapshotPatch: {
          confidenceSelfCheck: 'understand_well',
          supportPreference: 'practice_question',
        },
      },
    },
    {
      label: 'Give me a small hint first',
        payload: {
          eventType: 'revision_intent_check',
          confidenceSelfCheck: 'partly_understand',
          supportPreference: 'small_hint',
          progressCheck: 'hint_first',
        snapshotPatch: {
          confidenceSelfCheck: 'partly_understand',
          supportPreference: 'small_hint',
        },
      },
    },
    {
      label: 'Show one worked example',
        payload: {
          eventType: 'revision_intent_check',
          confidenceSelfCheck: 'partly_understand',
          supportPreference: 'worked_example',
          progressCheck: 'show_worked_example',
        snapshotPatch: {
          confidenceSelfCheck: 'partly_understand',
          supportPreference: 'worked_example',
        },
      },
    },
  ];
}

function buildRevisionProgressChoices(): ChoiceDefinition[] {
  return [
    {
      label: 'Still hard',
        payload: {
          eventType: 'recovery_checkpoint',
          confidenceSelfCheck: 'confused',
          progressCheck: 'still_hard',
          snapshotPatch: { confidenceSelfCheck: 'confused' },
      },
    },
    {
      label: 'A bit better',
        payload: {
          eventType: 'recovery_checkpoint',
          confidenceSelfCheck: 'partly_understand',
          progressCheck: 'a_bit_better',
          snapshotPatch: { confidenceSelfCheck: 'partly_understand' },
      },
    },
    {
      label: 'Much better',
        payload: {
          eventType: 'recovery_checkpoint',
          confidenceSelfCheck: 'understand_well',
          progressCheck: 'much_better',
          snapshotPatch: { confidenceSelfCheck: 'understand_well' },
      },
    },
    {
      label: 'I want one quick test',
        payload: {
          eventType: 'revision_intent_check',
          confidenceSelfCheck: 'partly_understand',
          supportPreference: 'practice_question',
          progressCheck: 'quick_test',
        snapshotPatch: {
          confidenceSelfCheck: 'partly_understand',
          supportPreference: 'practice_question',
        },
      },
    },
  ];
}

export function buildMetacognitivePromptSpec(prompt: MetacognitivePrompt): ReflectCardSpec {
  const variant = resolveMetacognitiveVariant(prompt);
  const supportPrompt = prompt.supportPrompt || 'What would help most?';

  switch (variant) {
    case 'after_correction':
      return {
        headline: 'Reflect',
        mainPrompt: 'How does this feel now?',
        primaryChoices: buildProgressChoices(),
        supportPrompt,
        supportChoices: buildSupportChoices(),
      };
    case 'before_practice':
      return {
        headline: 'Reflect',
        mainPrompt: 'Are you ready to try one now?',
        primaryChoices: buildPracticeReadinessChoices(),
        autoSubmitPrimary: true,
      };
    case 'revision_comeback':
      return {
        headline: 'Reflect',
        mainPrompt: 'How does this topic feel now?',
        primaryChoices: buildRevisionProgressChoices(),
        supportPrompt,
        supportChoices: buildSupportChoices(),
      };
    case 'weak_topic_recovery':
      return {
        headline: 'Rebuild',
        mainPrompt: 'Before we continue, where are you right now?',
        primaryChoices: buildConfidenceChoices(),
        supportPrompt,
        supportChoices: buildSupportChoices(),
      };
    case 'before_continue':
    default:
      return {
        headline: 'Reflect',
        mainPrompt: 'Before we continue, where are you right now?',
        primaryChoices: buildConfidenceChoices(),
        supportPrompt,
        supportChoices: buildSupportChoices(),
      };
  }
}
