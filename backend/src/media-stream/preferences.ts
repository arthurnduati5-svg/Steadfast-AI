// ─── Appearance, Theme & Copilot Preference Helpers ──────────────
// Extracted from backend/src/routes/ai.ts inline helpers.

import { safeString } from './validation.js';

export const normalizeCopilotThemePreferenceValue = (value: unknown): string | null => {
  const raw = safeString(value).trim().toLowerCase();
  if (!raw || raw === 'null' || raw === 'undefined') return null;
  if (['default', 'dark', 'light'].includes(raw) || raw.startsWith('#')) return raw;
  return null;
};

export const normalizeHexColorValue = (value: unknown): string | null => {
  const raw = safeString(value).trim();
  if (!raw) return null;
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  const named: Record<string, string> = { blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', slate: '#64748b', emerald: '#10b981', amber: '#f59e0b' };
  return named[raw.toLowerCase()] || null;
};

export const normalizeStudyAtmospherePreferenceValue = (value: unknown): string | null => {
  const raw = safeString(value).trim().toLowerCase();
  if (!raw || raw === 'null' || raw === 'undefined') return null;
  const valid = ['calm', 'focus', 'warm', 'natural'];
  return valid.includes(raw) ? raw : null;
};

export const readAppearanceMetadata = (metadata: Record<string, unknown> | null): Record<string, unknown> => {
  const record = (metadata || {}) as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  const themeValue = normalizeCopilotThemePreferenceValue(record.copilotTheme);
  if (themeValue !== null) result.copilotTheme = themeValue;
  const accentValue = normalizeHexColorValue(record.copilotAccent);
  if (accentValue !== null) result.copilotAccent = accentValue;
  const atmosphereValue = normalizeStudyAtmospherePreferenceValue(record.copilotAtmosphere);
  if (atmosphereValue !== null) result.copilotAtmosphere = atmosphereValue;
  return Object.keys(result).length > 0 ? result : {};
};

export const normalizeMediaPreferencesValue = (value: unknown): string | null => {
  const raw = safeString(value).trim().toLowerCase();
  if (!raw || raw === 'null' || raw === 'undefined') return null;
  const valid = ['all', 'audio', 'video', 'document', 'visual'];
  return valid.includes(raw) ? raw : null;
};

export const normalizeLearningStyleSignals = (value: unknown): Record<string, unknown> => {
  const record = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  return {
    preferredRecapType: ['audio', 'video', 'visual', 'mixed'].includes(safeString(record.preferredRecapType).trim().toLowerCase())
      ? safeString(record.preferredRecapType).trim().toLowerCase()
      : 'mixed',
    shortFormSupport: ['concept_intuition', 'worked_example', 'quick_recap'].includes(safeString(record.shortFormSupport).trim().toLowerCase())
      ? safeString(record.shortFormSupport).trim().toLowerCase()
      : undefined,
    allowExternalCreativeSuggestions: typeof record.allowExternalCreativeSuggestions === 'boolean'
      ? record.allowExternalCreativeSuggestions
      : true,
    preferredLanguage: safeString(record.preferredLanguage).trim() || undefined,
    schoolLevel: safeString(record.schoolLevel).trim() || undefined,
  };
};

export const readLearningStudioMetadata = (metadata: Record<string, unknown> | null): Record<string, unknown> => {
  const record = (metadata || {}) as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  const mediaValue = normalizeMediaPreferencesValue(record.mediaMode);
  if (mediaValue !== null) result.mediaMode = mediaValue;
  const learningStyle = normalizeLearningStyleSignals(record.learningStyle || record);
  if (Object.keys(learningStyle).length > 0) result.learningStyle = learningStyle;
  return Object.keys(result).length > 0 ? result : {};
};

export function parseMaybeJsonRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value === 'object') return (value || null) as Record<string, unknown> | null;
  const raw = safeString(value).trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export function normalizeSupportedLearningLanguage(value: unknown): string {
  const raw = safeString(value).trim().toLowerCase();
  if (['english', 'bilingual_swahili', 'bilingual_arabic'].includes(raw)) return raw;
  return 'english';
}

export function normalizeLearningSupportMode(value: unknown): string {
  const raw = safeString(value).trim().toLowerCase();
  if (['guided', 'practice', 'challenge'].includes(raw)) return raw;
  return 'guided';
}

export function normalizeSimplicityLevel(value: unknown): string {
  const raw = safeString(value).trim().toLowerCase();
  if (['basic', 'intermediate', 'advanced'].includes(raw)) return raw;
  return 'intermediate';
}

export function normalizeSessionLanguageState(value: unknown, priorState?: Record<string, unknown> | null): Record<string, unknown> {
  const record = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  return {
    displayLanguage: safeString(record.displayLanguage).trim() || priorState?.displayLanguage || 'english',
    voiceLanguageMode: safeString(record.voiceLanguageMode).trim() || priorState?.voiceLanguageMode || 'english',
    supportedLearningLanguage: normalizeSupportedLearningLanguage(record.supportedLearningLanguage || priorState?.supportedLearningLanguage),
    bilingualSupport: safeString(record.bilingualSupport).trim() || priorState?.bilingualSupport || null,
    detectedInputLanguage: typeof record.detectedInputLanguage === 'object' ? record.detectedInputLanguage : priorState?.detectedInputLanguage,
    ttsVoice: safeString(record.ttsVoice).trim() || priorState?.ttsVoice || 'alloy',
    ttsSpeed: Number(record.ttsSpeed) || priorState?.ttsSpeed || 1.0,
  };
}
