import type { DetectedInputLanguage, SupportedLearningLanguage } from './types';

export const resolveStudentTurnLanguage = (args: {
  detectedLanguage?: DetectedInputLanguage | null;
  previousStableLanguage?: DetectedInputLanguage | null;
}): {
  displayLanguage: DetectedInputLanguage | null;
  nextStableLanguage: DetectedInputLanguage | null;
} => {
  const detected = args.detectedLanguage || null;
  const previousStable = args.previousStableLanguage || null;
  if (!detected) {
    return {
      displayLanguage: previousStable,
      nextStableLanguage: previousStable,
    };
  }
  if (detected === 'mixed' || detected === 'unknown') {
    return {
      displayLanguage: previousStable || detected,
      nextStableLanguage: previousStable,
    };
  }
  return {
    displayLanguage: detected,
    nextStableLanguage: detected,
  };
};

export const resolveAssistantTurnLanguage = (args: {
  selectedLanguage?: SupportedLearningLanguage | null;
  fallbackStudentLanguage?: DetectedInputLanguage | null;
}): SupportedLearningLanguage | null => {
  if (args.selectedLanguage) return args.selectedLanguage;
  const fallback = args.fallbackStudentLanguage || null;
  if (fallback === 'english' || fallback === 'swahili' || fallback === 'arabic') return fallback;
  return null;
};

export const reconcileInterruptedAssistantText = (args: {
  fullTranscript?: string | null;
  spokenChars?: number | null;
  typedAssistantTranscript?: string | null;
}): string => {
  const full = String(args.fullTranscript || '').trim();
  const typed = String(args.typedAssistantTranscript || '').trim();
  if (!full && typed) return typed;
  if (!full) return '';
  const spokenChars = Number(args.spokenChars || 0);
  if (Number.isFinite(spokenChars) && spokenChars > 0) {
    // Add a tiny tolerance window so boundary jitter does not chop the last spoken syllable.
    const toleranceChars = 2;
    const target = Math.max(1, Math.floor(spokenChars) + toleranceChars);
    const sliced = full.slice(0, Math.min(full.length, target)).trim();
    if (sliced) return sliced;
  }
  return typed || full;
};
