// ─── Voice, TTS, STT & Language Preference Helpers ─────────────────
// Extracted from backend/src/routes/ai.ts inline helpers.

import type { VoiceLanguageMode } from './types.js';
import { safeString } from './validation.js';

export const normalizeVoiceLanguageMode = (value: unknown): VoiceLanguageMode => {
  const raw = safeString(value).trim().toLowerCase();
  if (['english', 'swahili', 'arabic', 'english_sw', 'arabic_english'].includes(raw)) {
    return raw as VoiceLanguageMode;
  }
  return 'english';
};

export const DEFAULT_TTS_VOICE = 'alloy';
export const DEFAULT_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'tts-1';
export const ALLOWED_TTS_VOICES = new Set(['alloy', 'sage', 'ash', 'verse', 'coral']);

export const toWhisperLanguage = (voiceLanguageMode: VoiceLanguageMode): string | null => {
  if (voiceLanguageMode === 'swahili' || voiceLanguageMode === 'english_sw') return 'sw';
  if (voiceLanguageMode === 'arabic' || voiceLanguageMode === 'arabic_english') return 'ar';
  return null;
};

export const buildSttPrompt = (mode: VoiceLanguageMode): string => {
  if (mode === 'swahili' || mode === 'english_sw') {
    return 'Transcribe the following Swahili or mixed Swahili-English speech accurately. Preserve proper nouns and numbers.';
  }
  if (mode === 'arabic' || mode === 'arabic_english') {
    return 'Transcribe the following Arabic or mixed Arabic-English speech accurately. Preserve Qur\'anic terms and academic vocabulary.';
  }
  return 'Transcribe the following English speech accurately.';
};

export const sanitizeTtsInput = (text: string): string => {
  const clean = safeString(text)
    .replace(/[[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > 4000 ? clean.slice(0, 3997).trimEnd() + '...' : clean;
};

export const normalizeVoiceBehaviorProfile = (value: unknown): Record<string, unknown> => {
  const record = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  return {
    attentionSpan: safeString(record.attentionSpan).trim() || 'moderate',
    processingSpeed: safeString(record.processingSpeed).trim() || 'average',
    confidenceLevel: safeString(record.confidenceLevel).trim() || 'neutral',
    preferredVoice: safeString(record.preferredVoice).trim() || 'sage',
    preferredSpeed: safeString(record.preferredSpeed).trim() || '1.0',
    voiceMode: normalizeVoiceLanguageMode(record.voiceMode),
  };
};

export const resolveVoiceBehaviorProfile = (profile: Record<string, unknown>, requestVoice?: string): Record<string, unknown> => {
  const rawRequest = safeString(requestVoice).trim().toLowerCase();
  if (!rawRequest || !['focus_voice', 'exam_voice', 'calm_voice', 'revision_voice', 'encourage_voice'].includes(rawRequest)) {
    return profile;
  }
  return {
    ...profile,
    activeVoiceStyle: rawRequest,
  };
};

export const buildVoiceBehaviorInstruction = (profile: Record<string, unknown>): string => {
  const style = safeString(profile.activeVoiceStyle).trim() || 'default';
  const speed = safeString(profile.preferredSpeed).trim() || '1.0';
  const voice = safeString(profile.preferredVoice).trim() || DEFAULT_TTS_VOICE;
  const instructions: string[] = ['Voice delivery instructions for the assistant:'];
  if (style === 'focus_voice') instructions.push('- Use a calm, measured pace with clear emphasis on key terms.');
  else if (style === 'exam_voice') instructions.push('- Use a direct, precise tone suitable for exam revision.');
  else if (style === 'calm_voice') instructions.push('- Use a warm, reassuring tone with short sentences.');
  else if (style === 'revision_voice') instructions.push('- Use an organized, structured tone with clear transitions.');
  else if (style === 'encourage_voice') instructions.push('- Use an encouraging, supportive tone with positive reinforcement.');
  instructions.push(`- Preferred speech rate: ${speed}x`);
  instructions.push(`- Preferred voice: ${voice}`);
  return instructions.join('\n');
};

export const buildTtsInstruction = (profile: Record<string, unknown>): Record<string, unknown> => {
  const voice = safeString(profile.preferredVoice).trim() || DEFAULT_TTS_VOICE;
  const speed = safeString(profile.preferredSpeed).trim() || '1.0';
  return {
    voice: ALLOWED_TTS_VOICES.has(voice) ? voice : DEFAULT_TTS_VOICE,
    speed: Math.max(0.5, Math.min(2.0, Number(speed) || 1.0)),
  };
};

export const DEFAULT_CONVERSATION_STATE = {
  researchModeActive: false,
  researchReady: false,
  lastSearchTopic: [],
  researchQuery: undefined,
  retrievedSourceSet: [],
  sourceReuseId: undefined,
  researchSourceContext: undefined,
  inferredSchoolLevel: undefined,
  inferredLanguage: undefined,
  researchLatencyState: undefined,
  confidenceState: undefined,
  advancedOptions: null,
  awaitingPracticeQuestionInvitationResponse: false,
  activePracticeQuestion: undefined,
  awaitingPracticeQuestionAnswer: false,
  validationAttemptCount: 0,
  lastAssistantMessage: undefined,
  sensitiveContentDetected: false,
  videoSuggested: false,
  usedExamples: [],
};

export const toSupportedLanguageFromVoiceMode = (mode: VoiceLanguageMode): string => {
  if (mode === 'swahili' || mode === 'english_sw') return 'bilingual_swahili';
  if (mode === 'arabic' || mode === 'arabic_english') return 'bilingual_arabic';
  return 'english';
};

export const toBilingualSupportLanguage = (mode: VoiceLanguageMode): string | null => {
  if (mode === 'swahili' || mode === 'english_sw') return 'swahili';
  if (mode === 'arabic' || mode === 'arabic_english') return 'arabic';
  return null;
};

export const buildDefaultSessionLanguageState = (voiceMode?: VoiceLanguageMode): Record<string, unknown> => {
  const mode = voiceMode || 'english';
  return {
    displayLanguage: mode === 'arabic' || mode === 'arabic_english' ? 'arabic' : 'english',
    voiceLanguageMode: mode,
    supportedLearningLanguage: toSupportedLanguageFromVoiceMode(mode),
    bilingualSupport: toBilingualSupportLanguage(mode),
    detectedInputLanguage: undefined,
    ttsVoice: DEFAULT_TTS_VOICE,
    ttsSpeed: 1.0,
  };
};

export const detectInputLanguage = (text: unknown): { language: string; confidence: string } => {
  const raw = safeString(text).trim();
  if (!raw) return { language: 'unknown', confidence: 'low' };
  const arabicChars = (raw.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
  const totalChars = raw.replace(/\s/g, '').length;
  if (totalChars === 0) return { language: 'unknown', confidence: 'low' };
  const arabicRatio = arabicChars / totalChars;
  if (arabicRatio > 0.4) return { language: 'arabic', confidence: arabicRatio > 0.7 ? 'high' : 'medium' };
  const swahiliSignals = /\b(ndiyo|hapana|sijui|tafadhali|asante|sawa|kwa|na|ya|za|wa|huu|hii|hizo)\b/i.test(raw);
  if (swahiliSignals) return { language: 'swahili', confidence: 'medium' };
  return { language: 'english', confidence: 'high' };
};

export const buildMessageLanguageMetadata = (args: {
  voiceLanguageMode?: VoiceLanguageMode;
  sessionLanguageState?: Record<string, unknown> | null;
  text?: string;
}): Record<string, unknown> | undefined => {
  const voiceMode = args.voiceLanguageMode || 'english';
  const sessionState = args.sessionLanguageState || {};
  const detected = detectInputLanguage(args.text);
  const metadata: Record<string, unknown> = {
    voiceLanguageMode: voiceMode,
    detectedInputLanguage: detected.language,
    detectionConfidence: detected.confidence,
  };
  if (sessionState.bilingualSupport) {
    metadata.bilingualSupport = sessionState.bilingualSupport;
  }
  return metadata;
};

export function getVoiceQuotaKey(userId: string, date: Date): string {
  const day = date.toISOString().slice(0, 10);
  return `voice:quota:${userId}:${day}`;
}

export function getVoiceDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export function computeVoiceQuota(usage: { sessionCount: number; totalSeconds: number; bonusSeconds?: number }): {
  allowed: boolean;
  remainingSessions: number;
  remainingSeconds: number;
} {
  const { MAX_VOICE_SESSIONS_PER_DAY, MAX_VOICE_SECONDS_PER_DAY, MAX_VOICE_BALANCE_SPEND_SECONDS } = require('./types.js');
  const remainingSessions = Math.max(0, MAX_VOICE_SESSIONS_PER_DAY - usage.sessionCount);
  const totalAllowed = MAX_VOICE_SECONDS_PER_DAY + (usage.bonusSeconds || 0);
  const remainingSeconds = Math.max(0, totalAllowed - usage.totalSeconds);
  return {
    allowed: remainingSessions > 0 && remainingSeconds > MAX_VOICE_BALANCE_SPEND_SECONDS,
    remainingSessions,
    remainingSeconds,
  };
}

export function getDocumentQuotaKey(userId: string): string {
  return `doc:quota:${userId}`;
}
