import { OpenAI } from 'openai';
import type { VoiceBehaviorProfile } from '../lib/types';
import { logger } from '../utils/logger';
import {
  buildMediaAssetDedupeKey,
  createMediaAsset,
  findMediaAssetByDedupeKey,
  type MediaAsset,
} from './mediaAssetService';
import { recordLearningEffectEvent } from './learningEffectivenessService';
import { generateRevisionAudioRecap } from './revisionLearningService';

type VoiceLanguageMode = 'english' | 'swahili' | 'arabic' | 'english_sw' | 'arabic_english';

export type AudioRecapSourceType = 'manual' | 'collection' | 'item' | 'queue';

export type GenerateAudioRecapAssetArgs = {
  userId: string;
  sourceType?: AudioRecapSourceType | string | null;
  recapText?: string | null;
  collectionId?: string | null;
  itemId?: string | null;
  sessionId?: string | null;
  sourceChatSessionId?: string | null;
  sourceChatMessageId?: string | null;
  revisionItemId?: string | null;
  title?: string | null;
  topic?: string | null;
  subject?: string | null;
  language?: string | null;
  voiceBehaviorProfile?: VoiceBehaviorProfile;
  eventSource?: 'revision' | 'media';
};

export type GenerateAudioRecapAssetResult = {
  asset: MediaAsset;
  recapText: string;
  audioUrl: string | null;
  audioDurationSec: number | null;
  fallbackToText: boolean;
  sourceType: AudioRecapSourceType;
  queueStats: {
    active: number;
    queued: number;
  };
  degradedReason:
    | 'none'
    | 'tts_error'
    | 'queue_saturated'
    | 'queue_timeout'
    | 'audio_too_large';
};

type TtsSynthesisResult = {
  audioUrl: string | null;
  audioDurationSec: number | null;
  fallbackToText: boolean;
  degradedReason:
    | 'none'
    | 'tts_error'
    | 'queue_saturated'
    | 'queue_timeout'
    | 'audio_too_large';
};

type RecapGenerationDependencies = {
  now: () => number;
  synthesizeMp3: (args: {
    text: string;
    languageMode: VoiceLanguageMode;
    voiceBehaviorProfile: VoiceBehaviorProfile;
  }) => Promise<Buffer>;
  generateRevisionAudioRecap: typeof generateRevisionAudioRecap;
  findMediaAssetByDedupeKey: typeof findMediaAssetByDedupeKey;
  createMediaAsset: typeof createMediaAsset;
  recordLearningEffectEvent: typeof recordLearningEffectEvent;
};

const DEFAULT_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'tts-1';
const DEFAULT_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'alloy';
const MAX_MEDIA_DATA_URL_BYTES = 2_000_000;
const RECAP_TTS_MAX_CONCURRENCY = Math.max(
  2,
  Number(process.env.RECAP_TTS_MAX_CONCURRENCY || 24)
);
const RECAP_TTS_MAX_QUEUE = Math.max(1, Number(process.env.RECAP_TTS_MAX_QUEUE || 600));
const RECAP_TTS_QUEUE_WAIT_MS = Math.max(
  300,
  Number(process.env.RECAP_TTS_QUEUE_WAIT_MS || 2200)
);
const RECAP_TTS_JOB_TIMEOUT_MS = Math.max(
  800,
  Number(process.env.RECAP_TTS_JOB_TIMEOUT_MS || 12000)
);
const RECAP_TTS_RESULT_CACHE_TTL_MS = Math.max(
  1_000,
  Number(process.env.RECAP_TTS_RESULT_CACHE_TTL_MS || 8 * 60 * 1000)
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const safeString = (value: unknown) => (typeof value === 'string' ? value : '');
const clampMediaText = (value: string, maxChars = 1200) => {
  const normalized = safeString(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length <= maxChars
    ? normalized
    : `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
};

const inferSubjectFromTopic = (value: string): string | null => {
  const text = safeString(value).toLowerCase();
  if (!text) return null;
  if (/\b(algebra|equation|fraction|geometry|calculus|graph|probability|math)\b/.test(text)) {
    return 'math';
  }
  if (/\b(photosynthesis|cell|biology|ecosystem|organism)\b/.test(text)) return 'biology';
  if (/\b(chemistry|acid|alkali|molecule|reaction)\b/.test(text)) return 'chemistry';
  if (/\b(physics|force|energy|motion|electric)\b/.test(text)) return 'physics';
  if (/\b(history|civilization|war|empire)\b/.test(text)) return 'history';
  if (/\b(geography|climate|map|river|population)\b/.test(text)) return 'geography';
  return null;
};

const normalizeVoiceLanguageMode = (value: unknown): VoiceLanguageMode => {
  const normalized = safeString(value).trim().toLowerCase();
  if (normalized === 'swahili') return 'swahili';
  if (normalized === 'arabic') return 'arabic';
  if (normalized === 'english_sw') return 'english_sw';
  if (normalized === 'arabic_english') return 'arabic_english';
  return 'english';
};

const resolveAudioRecapSourceType = (value: unknown): AudioRecapSourceType => {
  const normalized = safeString(value).trim().toLowerCase();
  if (normalized === 'collection') return 'collection';
  if (normalized === 'item') return 'item';
  if (normalized === 'queue') return 'queue';
  return 'manual';
};

const buildVoiceBehaviorInstruction = (profile: VoiceBehaviorProfile): string => {
  if (profile === 'exam_voice') {
    return 'Keep this concise, attempt-first, and avoid extra hints unless needed after the student tries.';
  }
  if (profile === 'focus_voice') {
    return 'Keep this calm, low-branching, and give only one next step at a time.';
  }
  if (profile === 'revision_voice') {
    return 'Use short recall cues and quick corrective feedback.';
  }
  if (profile === 'reading_voice') {
    return 'Read clearly, slowly, and use very simple transitions.';
  }
  return 'Use short Socratic guidance with one question at a time.';
};

const buildTtsInstruction = (
  mode: VoiceLanguageMode,
  profile: VoiceBehaviorProfile = 'reading_voice'
): string => {
  const behaviorInstruction = buildVoiceBehaviorInstruction(profile);
  const safetyInstruction =
    'Keep tone respectful, calm, modest, family-safe, and culturally sensitive for Muslim learners.';
  if (mode === 'arabic') {
    return `تحدث كمعلم هادئ وبسيط بجمل قصيرة وواضحة. ${behaviorInstruction} ${safetyInstruction}`.trim();
  }
  if (mode === 'swahili') {
    return `Ongea kwa utulivu kama mwalimu wa mwanafunzi mmoja, kwa sentensi fupi na wazi. ${behaviorInstruction} ${safetyInstruction}`.trim();
  }
  if (mode === 'english_sw') {
    return `Speak in calm English-Swahili mix with clear, short sentences. ${behaviorInstruction} ${safetyInstruction}`.trim();
  }
  if (mode === 'arabic_english') {
    return `Speak in calm Arabic-English bilingual style with smooth short transitions. ${behaviorInstruction} ${safetyInstruction}`.trim();
  }
  return `Speak like a calm teacher using short, clear sentences. ${behaviorInstruction} ${safetyInstruction}`.trim();
};

const sanitizeTtsInput = (value: string): string => {
  const text = safeString(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const limited = text.length > 3800 ? `${text.slice(0, 3797).trimEnd()}...` : text;
  return limited;
};

const estimateAudioDurationSec = (text: string): number => {
  const words = text.split(/\s+/).filter(Boolean).length;
  const approx = words / 2.7;
  return Math.max(4, Math.min(180, Math.round(approx)));
};

const extractMediaKeyPoints = (sourceText: string, topicHint?: string): string[] => {
  const normalized = safeString(sourceText).replace(/\r/g, '\n').trim();
  if (!normalized) {
    const topic = safeString(topicHint).trim() || 'this concept';
    return [
      `Start with the core idea behind ${topic}.`,
      `Notice the worked step before trying your own example.`,
      `Review one mistake to avoid when applying ${topic}.`,
    ];
  }
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (!sentences.length) return [];
  return sentences.slice(0, 4).map((sentence) => clampMediaText(sentence, 160));
};

const buildMediaQuickChecks = (topic: string): string[] => {
  const cleanTopic = safeString(topic).trim() || 'this topic';
  return [
    `In one sentence, what is the main idea in ${cleanTopic}?`,
    `What is one common mistake to avoid in ${cleanTopic}?`,
  ];
};

class QueueSaturatedError extends Error {
  constructor() {
    super('queue_saturated');
  }
}

class QueueTimeoutError extends Error {
  constructor() {
    super('queue_timeout');
  }
}

class AsyncConcurrencyGate {
  private active = 0;
  private pending: Array<{
    resolve: (release: () => void) => void;
    reject: (error: Error) => void;
    timeoutRef: ReturnType<typeof setTimeout>;
  }> = [];

  constructor(
    private readonly maxActive: number,
    private readonly maxQueued: number,
    private readonly maxQueueWaitMs: number
  ) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.maxActive) {
      this.active += 1;
      return this.buildRelease();
    }
    if (this.pending.length >= this.maxQueued) {
      throw new QueueSaturatedError();
    }
    return new Promise<() => void>((resolve, reject) => {
      const timeoutRef = setTimeout(() => {
        const index = this.pending.findIndex((entry) => entry.timeoutRef === timeoutRef);
        if (index >= 0) this.pending.splice(index, 1);
        reject(new QueueTimeoutError());
      }, this.maxQueueWaitMs);
      this.pending.push({ resolve, reject, timeoutRef });
    });
  }

  stats() {
    return {
      active: this.active,
      queued: this.pending.length,
    };
  }

  private buildRelease() {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (this.active > 0) this.active -= 1;
      const next = this.pending.shift();
      if (!next) return;
      clearTimeout(next.timeoutRef);
      this.active += 1;
      next.resolve(this.buildRelease());
    };
  }
}

const runWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeoutRef = setTimeout(() => {
      reject(new Error('tts_timeout'));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeoutRef);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutRef);
        reject(error);
      });
  });
};

const buildDefaultDependencies = (): RecapGenerationDependencies => ({
  now: () => Date.now(),
  synthesizeMp3: async ({ text, languageMode, voiceBehaviorProfile }) => {
    const mp3 = await openai.audio.speech.create({
      model: DEFAULT_TTS_MODEL,
      voice: DEFAULT_TTS_VOICE as any,
      input: sanitizeTtsInput(text),
      speed: 1.05,
      instructions: buildTtsInstruction(languageMode, voiceBehaviorProfile),
      response_format: 'mp3',
    });
    return Buffer.from(await mp3.arrayBuffer());
  },
  generateRevisionAudioRecap,
  findMediaAssetByDedupeKey,
  createMediaAsset,
  recordLearningEffectEvent,
});

export function createRecapGenerationService(
  dependencyOverrides: Partial<RecapGenerationDependencies> = {}
) {
  const deps: RecapGenerationDependencies = {
    ...buildDefaultDependencies(),
    ...dependencyOverrides,
  };
  const ttsGate = new AsyncConcurrencyGate(
    RECAP_TTS_MAX_CONCURRENCY,
    RECAP_TTS_MAX_QUEUE,
    RECAP_TTS_QUEUE_WAIT_MS
  );
  const inFlightByKey = new Map<string, Promise<TtsSynthesisResult>>();
  const cacheByKey = new Map<string, { expiresAt: number; value: TtsSynthesisResult }>();

  const synthesizeAudioRecap = async (args: {
    recapKey: string;
    recapText: string;
    languageMode: VoiceLanguageMode;
    voiceBehaviorProfile: VoiceBehaviorProfile;
  }): Promise<TtsSynthesisResult> => {
    const now = deps.now();
    const cached = cacheByKey.get(args.recapKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const inFlight = inFlightByKey.get(args.recapKey);
    if (inFlight) return inFlight;

    const synthesisPromise = (async (): Promise<TtsSynthesisResult> => {
      let releaseSlot: (() => void) | null = null;
      try {
        releaseSlot = await ttsGate.acquire();
        const buffer = await runWithTimeout(
          deps.synthesizeMp3({
            text: args.recapText,
            languageMode: args.languageMode,
            voiceBehaviorProfile: args.voiceBehaviorProfile,
          }),
          RECAP_TTS_JOB_TIMEOUT_MS
        );
        if (!buffer.length) {
          return {
            audioUrl: null,
            audioDurationSec: null,
            fallbackToText: true,
            degradedReason: 'tts_error',
          };
        }
        if (buffer.length > MAX_MEDIA_DATA_URL_BYTES) {
          return {
            audioUrl: null,
            audioDurationSec: null,
            fallbackToText: true,
            degradedReason: 'audio_too_large',
          };
        }
        const result: TtsSynthesisResult = {
          audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
          audioDurationSec: estimateAudioDurationSec(args.recapText),
          fallbackToText: false,
          degradedReason: 'none',
        };
        cacheByKey.set(args.recapKey, {
          expiresAt: deps.now() + RECAP_TTS_RESULT_CACHE_TTL_MS,
          value: result,
        });
        return result;
      } catch (error) {
        if (error instanceof QueueSaturatedError) {
          return {
            audioUrl: null,
            audioDurationSec: null,
            fallbackToText: true,
            degradedReason: 'queue_saturated',
          };
        }
        if (error instanceof QueueTimeoutError) {
          return {
            audioUrl: null,
            audioDurationSec: null,
            fallbackToText: true,
            degradedReason: 'queue_timeout',
          };
        }
        logger.warn({ error: String(error) }, '[RecapGeneration] Audio synthesis fallback to text.');
        return {
          audioUrl: null,
          audioDurationSec: null,
          fallbackToText: true,
          degradedReason: 'tts_error',
        };
      } finally {
        releaseSlot?.();
      }
    })();

    inFlightByKey.set(args.recapKey, synthesisPromise);
    try {
      return await synthesisPromise;
    } finally {
      inFlightByKey.delete(args.recapKey);
    }
  };

  const generateAudioRecapAsset = async (
    args: GenerateAudioRecapAssetArgs
  ): Promise<GenerateAudioRecapAssetResult> => {
    const userId = safeString(args.userId).trim();
    if (!userId) {
      throw new Error('userId is required.');
    }
    const sourceType = resolveAudioRecapSourceType(args.sourceType);
    let recapText = clampMediaText(safeString(args.recapText), 1800);

    if (!recapText && (sourceType === 'collection' || sourceType === 'item' || sourceType === 'queue')) {
      const revisionRecap = await deps.generateRevisionAudioRecap({
        userId,
        sourceType,
        collectionId: safeString(args.collectionId).trim() || undefined,
        itemId: safeString(args.itemId).trim() || undefined,
      });
      recapText = clampMediaText(revisionRecap.recapText, 1800);
    }

    if (!recapText) {
      throw new Error('A recapText or valid revision source is required.');
    }

    const topic = safeString(args.topic).trim() || null;
    const title = clampMediaText(
      safeString(args.title).trim() || `Audio recap: ${topic || 'study focus'}`,
      120
    );
    const subject =
      safeString(args.subject).trim() || inferSubjectFromTopic(topic || title) || null;
    const languageMode = normalizeVoiceLanguageMode(args.language || 'english');
    const voiceBehaviorProfile = args.voiceBehaviorProfile || 'reading_voice';
    const recapKey = buildMediaAssetDedupeKey([
      'audio_recap',
      userId,
      sourceType,
      safeString(args.collectionId),
      safeString(args.itemId),
      title,
      topic || '',
      recapText.slice(0, 320),
    ]);

    const existingAsset = await deps.findMediaAssetByDedupeKey({
      userId,
      dedupeKey: recapKey,
    });
    if (existingAsset) {
      return {
        asset: existingAsset,
        recapText: existingAsset.recapText || recapText,
        audioUrl: existingAsset.dataUrl || null,
        audioDurationSec: existingAsset.durationSec || null,
        fallbackToText: !Boolean(existingAsset.dataUrl),
        sourceType,
        queueStats: ttsGate.stats(),
        degradedReason: 'none',
      };
    }

    const synthesis = await synthesizeAudioRecap({
      recapKey,
      recapText,
      languageMode,
      voiceBehaviorProfile,
    });

    const sourceChatSessionId =
      safeString(args.sourceChatSessionId).trim() ||
      safeString(args.sessionId).trim() ||
      null;
    const sourceChatMessageId = safeString(args.sourceChatMessageId).trim() || null;

    const asset = await deps.createMediaAsset({
      userId,
      assetKind: 'audio_recap',
      title,
      summary: clampMediaText(recapText, 220),
      subject,
      topic,
      language: languageMode,
      sessionId: sourceChatSessionId,
      sourceChatSessionId,
      sourceChatMessageId,
      revisionItemId: safeString(args.revisionItemId).trim() || null,
      dataUrl: synthesis.audioUrl,
      durationSec: synthesis.audioDurationSec,
      recapText,
      keyPoints: extractMediaKeyPoints(recapText, topic || title),
      quickChecks: buildMediaQuickChecks(topic || title),
      metadata: {
        sourceType,
        collectionId: safeString(args.collectionId).trim() || null,
        itemId: safeString(args.itemId).trim() || null,
        degradedReason: synthesis.degradedReason,
        recapQueue: ttsGate.stats(),
        sourceChatSessionId,
        sourceChatMessageId,
      },
      safetyStatus: 'safe',
      sourceTrust: 'internal',
      dedupeKey: recapKey,
    });

    void Promise.resolve(
      deps.recordLearningEffectEvent({
        userId,
        sessionId: sourceChatSessionId,
        subject,
        topic,
        revisionItemId: safeString(args.revisionItemId).trim() || null,
        eventType: 'media_asset_created',
        metadata: {
          assetKind: 'audio_recap',
          assetId: asset.id,
          sourceType,
          degradedReason: synthesis.degradedReason,
        },
      })
    ).catch(() => undefined);

    return {
      asset,
      recapText,
      audioUrl: synthesis.audioUrl,
      audioDurationSec: synthesis.audioDurationSec,
      fallbackToText: synthesis.fallbackToText,
      sourceType,
      queueStats: ttsGate.stats(),
      degradedReason: synthesis.degradedReason,
    };
  };

  return {
    generateAudioRecapAsset,
    getQueueStats: () => ttsGate.stats(),
  };
}

export const recapGenerationService = createRecapGenerationService();
