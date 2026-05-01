import { useState, useRef, useCallback, useEffect } from "react";
import { SpeechToText } from "./voice/stt";
import api, { ApiError } from "@/lib/api";
import type {
    DetectedInputLanguage,
    SessionLanguageState,
    SupportedLearningLanguage,
    VoiceAudioPlaybackState,
    VoiceBehaviorProfile,
    VoiceInterruptionState,
    VoiceMicPermissionState,
    VoiceReconnectState,
} from "@/lib/types";

export type VoiceState = "idle" | "initializing" | "listening" | "speaking" | "error";

export type VoiceTelemetryEvent = {
    type:
        | "stt_ready"
        | "stt_first_token"
        | "tts_first_audio_byte"
        | "tts_start"
        | "tts_retry"
        | "tts_resume"
        | "tts_cutoff";
    atMs: number;
    latencyMs: number;
    requestId: number;
    turnId?: string;
    engine?: "native" | "fallback" | "remote";
    chars?: number;
    reason?: string;
    attempt?: number;
    maxAttempts?: number;
};

export type VoiceTranscriptMeta = {
    requestId: number;
    turnId: string;
    sttLatencyMs: number;
    engine: "native" | "fallback";
    detectedInputLanguage?: DetectedInputLanguage | null;
    preferredResponseLanguage?: SupportedLearningLanguage | null;
};

export interface UseVoiceControllerProps {
    onTranscript: (transcript: string, meta?: VoiceTranscriptMeta) => void;
    onTelemetry?: (event: VoiceTelemetryEvent) => void;
    sessionId?: string;
    preferredLanguage?: string;
    sessionLanguageState?: SessionLanguageState;
    voiceBehaviorProfile?: VoiceBehaviorProfile;
}

export interface VoiceController {
    state: VoiceState;
    transcript: string;
    partialTranscript: string;
    lastTranscript: string;
    draftTranscript: string;
    error: string | null;
    start: () => void;
    stop: () => void;
    cancel: () => void;
    silence: () => void;
    toggle: () => void;
    discard: () => void;
    speak: (text: string) => void;
    isSupported: boolean;
    volume: number; // 0 to 1
    speechProgress: number; // 0 to 1 (TTS playback)
    speechIsPlaying: boolean;
    speechSpokenChars: number;
    activeSessionUsageId: string | null;
    micPermissionState: VoiceMicPermissionState;
    detectedLanguage: DetectedInputLanguage | null;
    selectedLanguage: SupportedLearningLanguage | null;
    currentAudioPlaybackState: VoiceAudioPlaybackState;
    interruptionState: VoiceInterruptionState;
    reconnectState: VoiceReconnectState;
    isMuted: boolean;
    toggleMute: () => void;
    replayLast: () => void;
    voiceBehaviorProfile: VoiceBehaviorProfile;
}

type SpeakCallOptions = {
    resumeAttempt?: number;
    nextTranscript?: string;
    segmentStartCharsOverride?: number;
    totalLengthCharsOverride?: number;
};

const LISTENING_INIT_TIMEOUT_MS = 2000;   // must feel instant
const FINALIZE_SETTLE_MS = 360;           // faster finalize for production responsiveness
const PROCESSING_WATCHDOG_MS = 2200;      // quicker recovery if finalize never happens
const FORCE_SERVER_STT = false;           // Native STT first for lower latency; fallback to server for reliability.
const ENABLE_BROWSER_TTS_FALLBACK = false; // Keep voice identity consistent (always OpenAI alloy).
const LOCAL_TTS_FALLBACK_DELAY_MS = 450;
const PREFERRED_TTS_VOICE = 'alloy';
const MIN_TTS_AUDIO_BLOB_BYTES = 1200;
const TTS_FETCH_TIMEOUT_MS = 12000;
const TTS_FETCH_RETRY_ATTEMPTS = 2;
const TTS_RETRY_BACKOFF_MS = 250;
const TTS_TAIL_RESUME_MAX_ATTEMPTS = 2;
const SPEAKING_SEGMENT_WATCHDOG_MS = 7000; // force recovery if a TTS segment never completes
const TTS_OFFLINE_QUEUE_MAX_SEGMENTS = 18;
const TTS_OFFLINE_RETRY_DELAY_MS = 220;
const DEFAULT_LISTENING_LIMIT_SECONDS = 180;
const VOICE_DEBUG_STORAGE_KEY = 'sf_voice_debug';
const MIC_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
};

type VoiceSessionStartResult = {
    allowed: boolean;
    sessionUsageId?: string;
    mode?: string;
    remainingSeconds?: number;
    reason?: string;
    message?: string;
};

type VoiceBalanceResult = {
    remainingSeconds: number;
    remainingMinutesRoundedDown: number;
    display: string;
};

type VoiceSessionStopResult = {
    sessionUsageId: string;
    billedSeconds: number;
    remainingSeconds: number;
    reason: string;
    mode?: string;
};

type VoiceBillingStartDecision = {
    allowed: boolean;
    sessionUsageId?: string;
    remainingSeconds?: number;
    reason?: string;
    message?: string;
};

const fetchVoiceBalanceRemote = async (): Promise<VoiceBalanceResult | null> => {
    try {
        return await api.voice.getBalance();
    } catch {
        return null;
    }
};

const startVoiceSessionRemote = async (
    chatSessionId?: string
): Promise<VoiceSessionStartResult | null> => {
    try {
        return await api.voice.startSession(chatSessionId ? { chatSessionId } : {});
    } catch (error) {
        if (error instanceof ApiError) {
            const payload = (typeof error.payload === 'object' && error.payload ? error.payload : {}) as Partial<VoiceSessionStartResult>;
            return {
                allowed: false,
                reason: typeof payload.reason === 'string' ? payload.reason : undefined,
                message: typeof payload.message === 'string' ? payload.message : error.message,
                remainingSeconds: typeof payload.remainingSeconds === 'number' ? payload.remainingSeconds : undefined,
            };
        }
        return null;
    }
};

const stopVoiceSessionRemote = async (payload: {
    sessionUsageId: string;
    stopReason: string;
    listeningSecondsUsed: number;
    ttsSecondsUsed: number;
    metadata?: Record<string, unknown>;
}): Promise<VoiceSessionStopResult | null> => {
    try {
        return await api.voice.stopSession(payload);
    } catch {
        return null;
    }
};

const normalizeVoiceMode = (lang?: string) => {
    const v = String(lang || 'english').toLowerCase();
    if (v.includes('arabic_english') || v.includes('arabic+english') || v.includes('ar_en')) return 'arabic_english';
    if (v.includes('arab')) return 'arabic';
    if (v.includes('swahili') || v === 'sw') return 'swahili';
    if (v.includes('english_sw') || v.includes('mix')) return 'english_sw';
    return 'english';
};

const resolveVoiceMode = (preferredLanguage?: string, sessionLanguageState?: SessionLanguageState) => {
    return normalizeVoiceMode(
        sessionLanguageState?.preferredLanguageMode ||
        sessionLanguageState?.voiceOutputLanguage ||
        preferredLanguage
    );
};

const sttLanguageCode = (mode: string) => {
    if (mode === 'arabic' || mode === 'arabic_english') return 'ar';
    if (mode === 'swahili') return 'sw';
    return 'en';
};

const normalizeTtsText = (text: string) => {
    return String(text || '')
        .replace(/\s*[\r\n]+\s*/g, ' ')
        .replace(/(?:^|\s)[\-*•]\s+/g, ' ')
        .replace(/\b(\d+)\.\s+/g, '$1 ')
        .replace(/\u2026|\.{3,}/g, '.')
        .replace(/\s*[:;]\s*/g, ', ')
        .replace(/\s*[,]+\s*/g, ', ')
        .replace(/\s*[!?]{2,}\s*/g, ' ')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(
            /\b([A-Za-z]{4,})\s+(ist|ism|istic|tion|sion|ment|ness|ship|hood|ology|ologist|able|ible|ing|ed|er|ers)\b/g,
            '$1$2'
        )
        .replace(/\s+/g, ' ')
        .trim();
};

const isSpeakableTtsText = (text: string) => {
    const cleaned = String(text || '')
        .replace(/[^A-Za-z0-9\u0600-\u06FF\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleaned) return false;
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;
    if (words.length === 1) {
        const only = words[0] || '';
        if (/^[A-Za-z\u0600-\u06FF]$/.test(only)) return false;
    }
    const meaningfulChars = (cleaned.match(/[A-Za-z0-9\u0600-\u06FF]/g) || []).length;
    return meaningfulChars >= 2;
};

const createVoiceTurnId = (requestId: number) =>
    `voice_${Date.now()}_${requestId}_${Math.random().toString(36).slice(2, 7)}`;

export function useVoiceController({
    onTranscript,
    onTelemetry,
    sessionId,
    preferredLanguage,
    sessionLanguageState,
    voiceBehaviorProfile = "tutor_voice",
}: UseVoiceControllerProps): VoiceController {
    const voiceMode = resolveVoiceMode(preferredLanguage, sessionLanguageState);
    const [state, setState] = useState<VoiceState>("idle");
    const [transcript, setTranscript] = useState("");
    const [partialTranscript, setPartialTranscript] = useState("");
    const [draftTranscript, setDraftTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);
    const [speechProgress, setSpeechProgress] = useState(0);
    const [speechIsPlaying, setSpeechIsPlaying] = useState(false);
    const [speechSpokenChars, setSpeechSpokenChars] = useState(0);
    const [micPermissionState, setMicPermissionState] = useState<VoiceMicPermissionState>("unknown");
    const [detectedLanguage, setDetectedLanguage] = useState<DetectedInputLanguage | null>(
        sessionLanguageState?.lastDetectedInputLanguage || null
    );
    const [selectedLanguage, setSelectedLanguage] = useState<SupportedLearningLanguage | null>(
        sessionLanguageState?.preferredResponseLanguage || null
    );
    const [currentAudioPlaybackState, setCurrentAudioPlaybackState] = useState<VoiceAudioPlaybackState>("idle");
    const [interruptionState, setInterruptionState] = useState<VoiceInterruptionState>("none");
    const [reconnectState, setReconnectState] = useState<VoiceReconnectState>("stable");
    const [isMuted, setIsMuted] = useState(false);
    const [activeSessionUsageId, setActiveSessionUsageId] = useState<string | null>(null);

    const stateRef = useRef<VoiceState>("idle");
    const recordingStartRef = useRef<number | null>(null);
    const sttFinalizeStartedAtRef = useRef<number | null>(null);
    const recordingStartedAtRef = useRef<number | null>(null);
    const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sttListeningStartedAtRef = useRef<number | null>(null);
    const sttFirstTokenRequestRef = useRef<number | null>(null);
    const lastDurationSecRef = useRef<number>(0);
    const stopRef = useRef<() => void>(() => { });
    const currentSessionLimitRef = useRef<number>(DEFAULT_LISTENING_LIMIT_SECONDS);
    const voiceSessionUsageIdRef = useRef<string | null>(null);
    const voiceSessionFinalizedRef = useRef(false);
    const listeningSecondsUsedRef = useRef(0);
    const ttsSecondsUsedRef = useRef(0);
    const ttsPlaybackStartedAtRef = useRef<number | null>(null);
    const ttsCapturedSecondsRef = useRef(0);
    const pendingVoiceBillingStartRef = useRef<Promise<VoiceBillingStartDecision> | null>(null);
    const voiceBillingStartResultRef = useRef<VoiceBillingStartDecision | null>(null);

    const sttRef = useRef<SpeechToText | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const inputStreamRef = useRef<MediaStream | null>(null);

    const ttsAbortRef = useRef<AbortController | null>(null);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
    const ttsObjectUrlRef = useRef<string | null>(null);
    const ttsRequestIdRef = useRef(0);
    const offlineQueuedSpeechRef = useRef<string[]>([]);
    const reconnectFlushInProgressRef = useRef(false);
    const lastSpokenTextRef = useRef<string>("");
    const sentRequestRef = useRef<number | null>(null);
    const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const localSpeechActiveRef = useRef(false);
    const speechQueueRef = useRef<string[]>([]);
    const speechSegmentActiveRef = useRef(false);
    const speakRef = useRef<(text: string, options?: SpeakCallOptions) => void>(() => { });
    const continueSpeechRef = useRef(false);
    const speechSegmentStartCharsRef = useRef(0);
    const speechSegmentLengthRef = useRef(0);
    const speechTotalLengthRef = useRef(0);
    const localSpeechProgressRafRef = useRef<number | null>(null);
    const localSpeechStartedAtRef = useRef<number | null>(null);
    const localSpeechEstimatedDurationMsRef = useRef<number>(0);
    const speechSegmentWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
    const playbackAnimationRef = useRef<number | null>(null);
    const speechProgressRafRef = useRef<number | null>(null);

    // Track which engine is currently active
    const activeEngineRef = useRef<'native' | 'fallback' | 'none'>('none');

    // Guards so late events can never revive state
    const requestIdRef = useRef(0);
    const stopRequestedRef = useRef(false);
    const turnIdByRequestRef = useRef<Map<number, string>>(new Map());
    const activeTurnIdRef = useRef<string | null>(null);

    // Latest text refs so timeouts read the real current value
    const draftRef = useRef("");
    const transcriptRef = useRef("");
    const partialRef = useRef("");

    // Timers
    const listeningInitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const processingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debugEnabledRef = useRef(false);
    const debugClockOriginRef = useRef(0);

    const debugNow = () => {
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
            return performance.now();
        }
        return Date.now();
    };

    const refreshVoiceDebugFlag = useCallback(() => {
        if (typeof window === "undefined") {
            debugEnabledRef.current = false;
            debugClockOriginRef.current = 0;
            return false;
        }
        const fromStorage = String(window.localStorage?.getItem(VOICE_DEBUG_STORAGE_KEY) || "").toLowerCase();
        const byStorage = fromStorage === "1" || fromStorage === "true" || fromStorage === "on";
        const params = new URLSearchParams(window.location.search);
        const byQuery = params.get("voiceDebug") === "1" || params.get("voice_debug") === "1";
        const byGlobal = Boolean((window as any).__VOICE_DEBUG__);
        const enabled = byStorage || byQuery || byGlobal;
        debugEnabledRef.current = enabled;
        if (!enabled) {
            debugClockOriginRef.current = 0;
        } else if (debugClockOriginRef.current <= 0) {
            debugClockOriginRef.current = debugNow();
        }
        return enabled;
    }, []);

    const voiceDebugLog = useCallback((event: string, details?: Record<string, unknown>) => {
        if (!debugEnabledRef.current) return;
        if (debugClockOriginRef.current <= 0) {
            debugClockOriginRef.current = debugNow();
        }
        const elapsedMs = debugNow() - debugClockOriginRef.current;
        if (details && Object.keys(details).length > 0) {
            console.debug(`[VoiceDebug +${elapsedMs.toFixed(1)}ms] ${event}`, details);
            return;
        }
        console.debug(`[VoiceDebug +${elapsedMs.toFixed(1)}ms] ${event}`);
    }, []);

    const emitTelemetry = useCallback((event: VoiceTelemetryEvent) => {
        if (!onTelemetry) return;
        try {
            onTelemetry(event);
        } catch (err) {
            console.warn('[VoiceController] telemetry callback failed', err);
        }
    }, [onTelemetry]);

    const bumpRequest = useCallback(() => {
        requestIdRef.current += 1;
        return requestIdRef.current;
    }, []);

    const bindTurnIdForRequest = useCallback((requestId: number): string => {
        const turnId = createVoiceTurnId(requestId);
        turnIdByRequestRef.current.set(requestId, turnId);
        activeTurnIdRef.current = turnId;
        if (turnIdByRequestRef.current.size > 24) {
            const oldest = turnIdByRequestRef.current.keys().next().value;
            if (typeof oldest === 'number') {
                turnIdByRequestRef.current.delete(oldest);
            }
        }
        return turnId;
    }, []);

    const maybeEmitSttFirstToken = useCallback((requestId: number, engine: "native" | "fallback") => {
        if (sttFirstTokenRequestRef.current === requestId) return;
        const startedAt = sttListeningStartedAtRef.current || recordingStartedAtRef.current;
        if (!startedAt) return;
        sttFirstTokenRequestRef.current = requestId;
        const turnId = turnIdByRequestRef.current.get(requestId) || bindTurnIdForRequest(requestId);
        emitTelemetry({
            type: "stt_first_token",
            atMs: Date.now(),
            latencyMs: Math.max(0, Date.now() - startedAt),
            requestId,
            turnId,
            engine,
        });
    }, [bindTurnIdForRequest, emitTelemetry]);

    const enqueueSpeechForReconnect = useCallback((segments: string[]): number => {
        if (!Array.isArray(segments) || segments.length === 0) return 0;
        let added = 0;
        for (const segment of segments) {
            const normalized = normalizeTtsText(segment || "");
            if (!normalized || !isSpeakableTtsText(normalized)) continue;
            const queue = offlineQueuedSpeechRef.current;
            const lastQueued = queue[queue.length - 1];
            if (lastQueued === normalized) continue;
            queue.push(normalized);
            added += 1;
            if (queue.length > TTS_OFFLINE_QUEUE_MAX_SEGMENTS) {
                queue.splice(0, queue.length - TTS_OFFLINE_QUEUE_MAX_SEGMENTS);
            }
        }
        return added;
    }, []);

    const isLikelyConnectivityIssue = useCallback((error: unknown): boolean => {
        if (error instanceof ApiError) {
            return error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500;
        }
        const raw = String((error as any)?.message || error || '').toLowerCase();
        if (!raw) return false;
        return (
            raw.includes('failed to fetch') ||
            raw.includes('networkerror') ||
            raw.includes('network request failed') ||
            raw.includes('network') ||
            raw.includes('timed out') ||
            raw.includes('timeout') ||
            raw.includes('gateway') ||
            raw.includes('econn') ||
            raw.includes('fetch')
        );
    }, []);

    const clearTimers = useCallback(() => {
        if (listeningInitTimerRef.current) clearTimeout(listeningInitTimerRef.current);
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        if (processingWatchdogRef.current) clearTimeout(processingWatchdogRef.current);
        listeningInitTimerRef.current = null;
        settleTimerRef.current = null;
        processingWatchdogRef.current = null;
    }, []);

    const clearRecordingTimer = useCallback(() => {
        if (recordingTimeoutRef.current) {
            clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = null;
        }
    }, []);

    const clearSpeechSegmentWatchdog = useCallback(() => {
        if (speechSegmentWatchdogRef.current) {
            clearTimeout(speechSegmentWatchdogRef.current);
            speechSegmentWatchdogRef.current = null;
        }
    }, []);

    const captureDurationSec = useCallback(() => {
        if (!recordingStartRef.current) return 0;
        const elapsed = Math.ceil((Date.now() - recordingStartRef.current) / 1000);
        return Math.min(currentSessionLimitRef.current, Math.max(1, elapsed));
    }, []);

    const markRecordingStart = useCallback(() => {
        if (recordingStartRef.current) return;
        recordingStartRef.current = Date.now();
        recordingStartedAtRef.current = recordingStartRef.current;
        sttListeningStartedAtRef.current = recordingStartRef.current;
        lastDurationSecRef.current = 0;
        clearRecordingTimer();
        recordingTimeoutRef.current = setTimeout(() => {
            if (stateRef.current === 'listening') {
                stopRef.current();
            }
        }, currentSessionLimitRef.current * 1000);
    }, [clearRecordingTimer]);

    const resetVoiceUsageTracking = useCallback(() => {
        voiceSessionUsageIdRef.current = null;
        setActiveSessionUsageId(null);
        voiceSessionFinalizedRef.current = false;
        listeningSecondsUsedRef.current = 0;
        ttsSecondsUsedRef.current = 0;
        ttsPlaybackStartedAtRef.current = null;
        ttsCapturedSecondsRef.current = 0;
        pendingVoiceBillingStartRef.current = null;
        voiceBillingStartResultRef.current = null;
    }, []);

    const applyVoiceBillingDecision = useCallback((decision: VoiceBillingStartDecision): boolean => {
        if (!decision.allowed) return false;
        voiceSessionUsageIdRef.current = decision.sessionUsageId || voiceSessionUsageIdRef.current;
        setActiveSessionUsageId(voiceSessionUsageIdRef.current || null);
        voiceSessionFinalizedRef.current = false;
        currentSessionLimitRef.current = Math.max(
            1,
            decision.remainingSeconds || currentSessionLimitRef.current || DEFAULT_LISTENING_LIMIT_SECONDS
        );
        return true;
    }, []);

    const clearSpeechQueue = useCallback(() => {
        speechQueueRef.current = [];
        speechSegmentActiveRef.current = false;
        continueSpeechRef.current = false;
        speechSegmentStartCharsRef.current = 0;
        speechSegmentLengthRef.current = 0;
        speechTotalLengthRef.current = 0;
        clearSpeechSegmentWatchdog();
    }, [clearSpeechSegmentWatchdog]);

    const stopMediaStream = useCallback((stream?: MediaStream | null) => {
        if (!stream) return;
        stream.getTracks().forEach((track) => track.stop());
    }, []);

    const acquireMicStream = useCallback(() => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Microphone API unavailable');
        }
        return navigator.mediaDevices.getUserMedia({ audio: MIC_AUDIO_CONSTRAINTS });
    }, []);

    const captureTtsUsageSoFar = useCallback(() => {
        const audio = ttsAudioRef.current;
        let secondsElapsed = 0;

        if (audio && Number.isFinite(audio.currentTime) && audio.currentTime > 0) {
            secondsElapsed = Math.ceil(audio.currentTime);
        } else if (ttsPlaybackStartedAtRef.current) {
            secondsElapsed = Math.ceil((Date.now() - ttsPlaybackStartedAtRef.current) / 1000);
        }

        if (secondsElapsed > ttsCapturedSecondsRef.current) {
            const delta = secondsElapsed - ttsCapturedSecondsRef.current;
            ttsSecondsUsedRef.current += delta;
            ttsCapturedSecondsRef.current = secondsElapsed;
        }
    }, []);

    const finalizeVoiceSessionUsage = useCallback(async (stopReason: 'user_stop' | 'error' | 'time_exhausted' = 'user_stop') => {
        const sessionUsageId = voiceSessionUsageIdRef.current;
        if (!sessionUsageId || voiceSessionFinalizedRef.current) return null;

        voiceSessionFinalizedRef.current = true;
        captureTtsUsageSoFar();

        const result = await stopVoiceSessionRemote({
            sessionUsageId,
            stopReason,
            listeningSecondsUsed: listeningSecondsUsedRef.current,
            ttsSecondsUsed: ttsSecondsUsedRef.current,
            metadata: {
                source: 'voice-mode',
                languageMode: voiceMode
            }
        });

        if (result?.reason === 'time_exhausted') {
            setError('Voice time finished');
            setState('error');
        }

        resetVoiceUsageTracking();
        return result;
    }, [captureTtsUsageSoFar, resetVoiceUsageTracking, voiceMode]);

    const stopAudioAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
        if (inputStreamRef.current) {
            stopMediaStream(inputStreamRef.current);
            inputStreamRef.current = null;
        }
        analyserRef.current = null;
        setVolume(0);
    }, [stopMediaStream]);

    const startAudioAnalysis = useCallback(async (stream: MediaStream) => {
        try {
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => { });
            }
            if (inputStreamRef.current && inputStreamRef.current !== stream) {
                stopMediaStream(inputStreamRef.current);
            }
            inputStreamRef.current = stream;

            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteTimeDomainData(dataArray);

                // Calculate RMS
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    const val = (dataArray[i] - 128) / 128;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / dataArray.length);

                // Set volume with some sensitivity gain
                setVolume(Math.min(1, rms * 4));
                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };

            updateVolume();
        } catch (err) {
            console.error('[VoiceController] Audio analysis failed:', err);
        }
    }, [stopMediaStream]);

    const stopPlaybackAnalysis = useCallback(() => {
        if (playbackAnimationRef.current) {
            cancelAnimationFrame(playbackAnimationRef.current);
            playbackAnimationRef.current = null;
        }
        if (playbackContextRef.current) {
            playbackContextRef.current.close().catch(() => { });
            playbackContextRef.current = null;
        }
        playbackAnalyserRef.current = null;
    }, []);

    const stopSpeechProgressLoop = useCallback(() => {
        if (speechProgressRafRef.current) {
            cancelAnimationFrame(speechProgressRafRef.current);
            speechProgressRafRef.current = null;
        }
    }, []);

    const stopLocalSpeechProgressLoop = useCallback(() => {
        if (localSpeechProgressRafRef.current) {
            cancelAnimationFrame(localSpeechProgressRafRef.current);
            localSpeechProgressRafRef.current = null;
        }
        localSpeechStartedAtRef.current = null;
        localSpeechEstimatedDurationMsRef.current = 0;
    }, []);

    const startPlaybackAnalysis = useCallback(async (audioEl: HTMLAudioElement) => {
        try {
            if (playbackContextRef.current) {
                playbackContextRef.current.close().catch(() => { });
            }

            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;

            const source = ctx.createMediaElementSource(audioEl);
            source.connect(analyser);
            analyser.connect(ctx.destination);

            playbackContextRef.current = ctx;
            playbackAnalyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVolume = () => {
                if (!playbackAnalyserRef.current) return;
                playbackAnalyserRef.current.getByteTimeDomainData(dataArray);

                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    const val = (dataArray[i] - 128) / 128;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / dataArray.length);
                setVolume(Math.min(1, rms * 5));
                playbackAnimationRef.current = requestAnimationFrame(updateVolume);
            };

            updateVolume();
        } catch (err) {
            console.error('[VoiceController] Playback analysis failed:', err);
        }
    }, []);

    const stopPlayback = useCallback((options?: { keepUiWarm?: boolean; preserveSpeechPlaying?: boolean }) => {
        ttsRequestIdRef.current += 1;
        ttsAbortRef.current?.abort();
        ttsAbortRef.current = null;
        clearSpeechSegmentWatchdog();

        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            ttsAudioRef.current.removeAttribute('src');
            ttsAudioRef.current.load();
            ttsAudioRef.current = null;
        }

        if (ttsObjectUrlRef.current) {
            URL.revokeObjectURL(ttsObjectUrlRef.current);
            ttsObjectUrlRef.current = null;
        }

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        synthUtteranceRef.current = null;
        localSpeechActiveRef.current = false;

        stopSpeechProgressLoop();
        stopLocalSpeechProgressLoop();
        stopPlaybackAnalysis();
        if (!options?.preserveSpeechPlaying) {
            setSpeechIsPlaying(false);
        }
        setCurrentAudioPlaybackState(options?.preserveSpeechPlaying ? "playing" : "stopped");
        if (options?.keepUiWarm) {
            setVolume((prev) => Math.max(prev, 0.08));
            return;
        }
        setVolume(0);
        setSpeechProgress(0);
        setSpeechSpokenChars(0);
    }, [clearSpeechSegmentWatchdog, stopLocalSpeechProgressLoop, stopPlaybackAnalysis, stopSpeechProgressLoop]);

    const hardReset = useCallback(() => {
        captureTtsUsageSoFar();
        void finalizeVoiceSessionUsage('user_stop');
        clearTimers();
        clearRecordingTimer();
        clearSpeechQueue();
        bumpRequest(); // invalidate any in-flight callbacks/timeouts
        stopRequestedRef.current = false;
        sentRequestRef.current = null;
        turnIdByRequestRef.current.clear();
        activeTurnIdRef.current = null;

        // Stop both engines
        sttRef.current?.abort();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
        activeEngineRef.current = 'none';

        stopPlayback();
        setState("idle");
        setTranscript("");
        setPartialTranscript("");
        setDraftTranscript("");
        setError(null);
        setSpeechProgress(0);
        setSpeechIsPlaying(false);
        setSpeechSpokenChars(0);
        setCurrentAudioPlaybackState("idle");
        setInterruptionState("none");
        setReconnectState("stable");
        draftRef.current = "";
        transcriptRef.current = "";
        partialRef.current = "";
        recordingStartRef.current = null;
        sttFinalizeStartedAtRef.current = null;
        recordingStartedAtRef.current = null;
        sttListeningStartedAtRef.current = null;
        sttFirstTokenRequestRef.current = null;
        offlineQueuedSpeechRef.current = [];
        reconnectFlushInProgressRef.current = false;
        lastDurationSecRef.current = 0;
        setVolume(0);
        stopAudioAnalysis();
        resetVoiceUsageTracking();
    }, [bumpRequest, captureTtsUsageSoFar, clearRecordingTimer, clearSpeechQueue, clearTimers, finalizeVoiceSessionUsage, resetVoiceUsageTracking, stopAudioAnalysis, stopPlayback]);

    const fail = useCallback(
        (msg: string) => {
            // If we are in fallback mode, failing means we really failed.
            // If we are in native mode, we might want to fail over to fallback? 
            // Simplified: if this is called, we show error and reset.

            clearTimers();
            clearRecordingTimer();
            clearSpeechQueue();
            bumpRequest();
            stopRequestedRef.current = false;
            sttRef.current?.abort();
            sttFinalizeStartedAtRef.current = null;
            sttListeningStartedAtRef.current = null;
            sttFirstTokenRequestRef.current = null;
            offlineQueuedSpeechRef.current = [];
            reconnectFlushInProgressRef.current = false;
            turnIdByRequestRef.current.clear();
            activeTurnIdRef.current = null;
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            activeEngineRef.current = 'none';
            captureTtsUsageSoFar();
            void finalizeVoiceSessionUsage('error');
            stopPlayback();
            resetVoiceUsageTracking();
            setCurrentAudioPlaybackState("error");
            setReconnectState("degraded");

            setError(msg);
            setState("error");

            // Stay in error until user retries or closes.
        },
        [bumpRequest, captureTtsUsageSoFar, clearSpeechQueue, clearTimers, finalizeVoiceSessionUsage, resetVoiceUsageTracking, stopPlayback]
    );

    // Fallback Implementation: MediaRecorder + Backend STT
    const startFallback = useCallback(async (myReq: number, preAcquiredStream?: MediaStream | null) => {
        console.log('[VoiceController] Starting Fallback (MediaRecorder)');
        let stream: MediaStream | null = null;

        try {
            if (requestIdRef.current !== myReq) return;

            stopPlayback();
            setState("initializing");
            setMicPermissionState("prompt");
            stream = preAcquiredStream ?? await acquireMicStream();
            setMicPermissionState("granted");
            if (requestIdRef.current !== myReq) {
                stopMediaStream(stream);
                return;
            }
            startAudioAnalysis(stream);

            const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';
            const mediaRecorder = new MediaRecorder(stream, { mimeType: preferredType, audioBitsPerSecond: 48000 });
            const audioChunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                // Only process if we are still in a valid state (processing)
                if (requestIdRef.current !== myReq) {
                    stopMediaStream(stream);
                    return;
                }

                stopMediaStream(stream);

                const pendingBillingStart = pendingVoiceBillingStartRef.current;
                if (pendingBillingStart) {
                    const billingStart = voiceBillingStartResultRef.current ?? await pendingBillingStart.catch(() => null);
                    if (requestIdRef.current !== myReq) return;
                    if (!billingStart) {
                        fail("Couldn't verify voice balance. Try again.");
                        return;
                    }
                    voiceBillingStartResultRef.current = billingStart;
                    if (!applyVoiceBillingDecision(billingStart)) {
                        fail(billingStart.message || "Voice time finished");
                        return;
                    }
                }

                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                console.log('[VoiceController] Fallback audio blob size:', audioBlob.size);

                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                formData.append('durationSec', String(lastDurationSecRef.current || 0));
                formData.append('language', sttLanguageCode(voiceMode));
                formData.append('languageMode', voiceMode);
                if (sessionLanguageState) {
                    formData.append('sessionLanguageState', JSON.stringify(sessionLanguageState));
                }
                const sessionUsageId = voiceSessionUsageIdRef.current;
                if (!sessionUsageId) {
                    fail("Couldn't verify voice session. Try again.");
                    return;
                }
                formData.append('sessionUsageId', sessionUsageId);

                try {
                    const data = await api.voice.transcribe(formData, { sessionUsageId });

                    if (requestIdRef.current !== myReq) return;

                    console.log('[VoiceController] Fallback transcription:', data.text);

                    if (data.text && data.text.trim()) {
                        const cleaned = data.text.trim();
                        setDetectedLanguage(data.detectedInputLanguage || null);
                        setSelectedLanguage((prev) => data.preferredResponseLanguage || prev);
                        maybeEmitSttFirstToken(myReq, "fallback");
                        if (sentRequestRef.current === myReq) return;
                        sentRequestRef.current = myReq;
                        setDraftTranscript(cleaned);
                        draftRef.current = cleaned;
                        setState("speaking");
                        const sttFinalizeStartedAt = sttFinalizeStartedAtRef.current;
                        const sttLatencyMs = sttFinalizeStartedAt
                            ? Math.max(0, Date.now() - sttFinalizeStartedAt)
                            : 0;
                        const turnId = bindTurnIdForRequest(myReq);
                        onTranscript(cleaned, {
                            requestId: myReq,
                            turnId,
                            sttLatencyMs,
                            engine: "fallback",
                            detectedInputLanguage: data.detectedInputLanguage || null,
                            preferredResponseLanguage: data.preferredResponseLanguage || null,
                        });
                        emitTelemetry({
                            type: "stt_ready",
                            atMs: Date.now(),
                            latencyMs: sttLatencyMs,
                            requestId: myReq,
                            turnId,
                            engine: "fallback",
                            chars: cleaned.length,
                        });
                        sttFinalizeStartedAtRef.current = null;
                    } else {
                        fail("I couldn't hear that clearly. Try again.");
                    }
                } catch (err: any) {
                    console.error('[VoiceController] Fallback network error', err);
                    fail("Connection hiccup. Please try again.");
                }
            };

            if (requestIdRef.current !== myReq) {
                stopMediaStream(stream);
                return;
            }

            mediaRecorderRef.current = mediaRecorder;
            activeEngineRef.current = 'fallback';
            mediaRecorder.start();
            setState("listening");
            markRecordingStart();
            console.log('[VoiceController] Fallback recording started');

        } catch (err: any) {
            if (stream) {
                stopMediaStream(stream);
            }
            console.error('[VoiceController] Fallback getUserMedia error', err);
            const name = err?.name || "";
            if (name === "NotAllowedError") {
                setMicPermissionState("denied");
                fail("Please allow microphone access, then try again.");
            } else if (name === "NotFoundError") {
                fail("No microphone found. Connect one and try again.");
            } else {
                fail("Microphone access is blocked. Check your permissions and try again.");
            }
        }
    }, [acquireMicStream, applyVoiceBillingDecision, bindTurnIdForRequest, emitTelemetry, fail, markRecordingStart, maybeEmitSttFirstToken, onTranscript, startAudioAnalysis, stopMediaStream, stopPlayback, voiceMode]);

    useEffect(() => {
        if (typeof window !== "undefined") sttRef.current = new SpeechToText();
        if (typeof window !== "undefined") {
            if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
                setMicPermissionState("unsupported");
            }
        }
        return () => {
            hardReset();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        const synth = window.speechSynthesis;
        const warmVoices = () => {
            try {
                synth.getVoices();
            } catch {
                // Ignore browser voice loading quirks.
            }
        };
        warmVoices();
        synth.addEventListener?.('voiceschanged', warmVoices);
        return () => synth.removeEventListener?.('voiceschanged', warmVoices);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        refreshVoiceDebugFlag();
        const w = window as any;
        const prevSet = w.setVoiceDebug;
        const prevGet = w.getVoiceDebug;

        const setVoiceDebug = (enabled: boolean) => {
            const next = Boolean(enabled);
            w.__VOICE_DEBUG__ = next;
            window.localStorage?.setItem(VOICE_DEBUG_STORAGE_KEY, next ? "1" : "0");
            refreshVoiceDebugFlag();
            const state = next ? "enabled" : "disabled";
            console.info(`[VoiceDebug] ${state}. key=${VOICE_DEBUG_STORAGE_KEY}`);
        };
        const getVoiceDebug = () => Boolean(debugEnabledRef.current);

        w.setVoiceDebug = setVoiceDebug;
        w.getVoiceDebug = getVoiceDebug;

        const onStorage = (event: StorageEvent) => {
            if (event.key === VOICE_DEBUG_STORAGE_KEY || event.key === null) {
                refreshVoiceDebugFlag();
            }
        };
        window.addEventListener("storage", onStorage);

        if (debugEnabledRef.current) {
            voiceDebugLog("debug_ready", { key: VOICE_DEBUG_STORAGE_KEY });
        }

        return () => {
            window.removeEventListener("storage", onStorage);
            if ((window as any).setVoiceDebug === setVoiceDebug) {
                (window as any).setVoiceDebug = prevSet;
            }
            if ((window as any).getVoiceDebug === getVoiceDebug) {
                (window as any).getVoiceDebug = prevGet;
            }
        };
    }, [refreshVoiceDebugFlag, voiceDebugLog]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const flushQueuedSpeechIfPossible = () => {
            if (!window.navigator.onLine) return;
            if (reconnectFlushInProgressRef.current) return;
            if (offlineQueuedSpeechRef.current.length === 0) return;
            if (stateRef.current === 'listening') return;
            const segmentIsActive =
                speechSegmentActiveRef.current ||
                localSpeechActiveRef.current ||
                Boolean(ttsAbortRef.current) ||
                Boolean(ttsAudioRef.current);
            if (stateRef.current === 'speaking' || segmentIsActive) return;

            const queue = offlineQueuedSpeechRef.current;
            const nextSegment = queue.shift();
            if (!nextSegment) return;
            const tail = queue.splice(0, queue.length);
            if (tail.length > 0) {
                speechQueueRef.current.push(...tail);
            }
            reconnectFlushInProgressRef.current = true;
            setReconnectState('reconnecting');
            setTimeout(() => {
                reconnectFlushInProgressRef.current = false;
                if (typeof window !== "undefined" && window.navigator.onLine) {
                    setReconnectState('stable');
                }
                const transcriptSnapshot = transcriptRef.current || nextSegment;
                speakRef.current(nextSegment, {
                    nextTranscript: transcriptSnapshot,
                    segmentStartCharsOverride: 0,
                    totalLengthCharsOverride: Math.max(1, transcriptSnapshot.length),
                });
            }, TTS_OFFLINE_RETRY_DELAY_MS);
        };

        const applyConnectionState = () => {
            const online = window.navigator.onLine;
            if (!online) {
                setReconnectState("offline");
                return;
            }
            setReconnectState(offlineQueuedSpeechRef.current.length > 0 ? "reconnecting" : "stable");
            flushQueuedSpeechIfPossible();
        };
        applyConnectionState();
        window.addEventListener("online", applyConnectionState);
        window.addEventListener("offline", applyConnectionState);
        return () => {
            window.removeEventListener("online", applyConnectionState);
            window.removeEventListener("offline", applyConnectionState);
        };
    }, []);

    // Sync refs
    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => { draftRef.current = draftTranscript; }, [draftTranscript]);
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
    useEffect(() => { partialRef.current = partialTranscript; }, [partialTranscript]);
    useEffect(() => { voiceDebugLog("state", { state }); }, [state, voiceDebugLog]);
    useEffect(() => {
        if (sessionLanguageState?.preferredResponseLanguage) {
            setSelectedLanguage(sessionLanguageState.preferredResponseLanguage);
        }
        if (sessionLanguageState?.lastDetectedInputLanguage) {
            setDetectedLanguage(sessionLanguageState.lastDetectedInputLanguage);
        }
    }, [sessionLanguageState]);

    const startVoiceBillingSession = useCallback(async (): Promise<VoiceBillingStartDecision> => {
        const started = await startVoiceSessionRemote(sessionId);
        if (started?.allowed && started.sessionUsageId) {
            return {
                allowed: true,
                sessionUsageId: started.sessionUsageId,
                remainingSeconds: Number.isFinite(started.remainingSeconds)
                    ? Number(started.remainingSeconds)
                    : DEFAULT_LISTENING_LIMIT_SECONDS
            } as const;
        }

        if (started && !started.allowed) {
            return {
                allowed: false,
                reason: started?.reason,
                remainingSeconds: started?.remainingSeconds ?? 0,
                message: started?.message || 'Voice time finished'
            } as const;
        }

        const balance = await fetchVoiceBalanceRemote();
        if (!balance || !Number.isFinite(balance.remainingSeconds)) {
            return {
                allowed: false,
                message: "Couldn't verify voice balance. Try again."
            } as const;
        }

        if (balance.remainingSeconds <= 0) {
            return {
                allowed: false,
                reason: 'time_exhausted',
                remainingSeconds: 0,
                message: 'Voice time finished'
            } as const;
        }

        return {
            allowed: false,
            remainingSeconds: balance.remainingSeconds,
            message: "Couldn't start voice session. Try again."
        } as const;
    }, [sessionId]);

    const start = useCallback(async () => {
        if (stateRef.current === "listening" || stateRef.current === "initializing") return;

        clearTimers();
        clearRecordingTimer();
        clearSpeechQueue();
        if (stateRef.current === "speaking" || speechIsPlaying) {
            setInterruptionState("student_barge_in");
        } else {
            setInterruptionState("none");
        }
        setReconnectState("stable");
        stopPlayback();
        const myReq = bumpRequest();
        stopRequestedRef.current = false;
        sentRequestRef.current = null;

        setError(null);
        setTranscript("");
        setPartialTranscript("");
        setDraftTranscript("");
        draftRef.current = "";
        transcriptRef.current = "";
        partialRef.current = "";
        recordingStartRef.current = null;
        sttFinalizeStartedAtRef.current = null;
        recordingStartedAtRef.current = null;
        lastDurationSecRef.current = 0;
        resetVoiceUsageTracking();

        setState("initializing");
        setMicPermissionState("prompt");
        sttListeningStartedAtRef.current = null;
        sttFirstTokenRequestRef.current = null;
        const preAcquiredStreamPromise = acquireMicStream().catch((err) => {
            console.warn('[VoiceController] Mic pre-acquire failed:', err);
            return null;
        });
        const billingStartPromise = startVoiceBillingSession();
        pendingVoiceBillingStartRef.current = billingStartPromise;
        voiceBillingStartResultRef.current = null;

        const applyBillingForRequest = async (): Promise<VoiceBillingStartDecision | null> => {
            const billingStart = await billingStartPromise.catch(() => null);
            if (requestIdRef.current !== myReq) {
                void preAcquiredStreamPromise.then((stream) => stopMediaStream(stream));
                return null;
            }
            if (!billingStart) {
                void preAcquiredStreamPromise.then((stream) => stopMediaStream(stream));
                fail("Couldn't verify voice balance. Try again.");
                return null;
            }

            voiceBillingStartResultRef.current = billingStart;
            if (!applyVoiceBillingDecision(billingStart)) {
                void preAcquiredStreamPromise.then((stream) => stopMediaStream(stream));
                fail(billingStart.message || "Voice time finished");
                return billingStart;
            }

            return billingStart;
        };

        const startFallbackWithPreparedStream = async () => {
            const preAcquiredStream = await preAcquiredStreamPromise;
            if (requestIdRef.current !== myReq) {
                stopMediaStream(preAcquiredStream);
                return;
            }
            await startFallback(myReq, preAcquiredStream);
        };

        // 1. Try Native STT first (unless we force server STT)
        if (FORCE_SERVER_STT) {
            await startFallbackWithPreparedStream();
            void applyBillingForRequest();
            return;
        }

        const billingStart = await applyBillingForRequest();
        if (!billingStart?.allowed) return;

        const stt = sttRef.current;
        if (!stt || !stt.isSupported()) {
            // Direct to fallback
            await startFallbackWithPreparedStream();
            return;
        }

        // Set 'initializing' optimistically
        setState("initializing");
        activeEngineRef.current = 'native';

        // Watchdog for native init
        listeningInitTimerRef.current = setTimeout(() => {
            if (requestIdRef.current !== myReq) return;
            console.log('[VoiceController] Native STT timed out, switching to fallback...');
            stt.abort();
            void startFallbackWithPreparedStream();
        }, LISTENING_INIT_TIMEOUT_MS);

        try {
            preAcquiredStreamPromise.then((stream) => {
                if (!stream) return;
                setMicPermissionState("granted");
                if (requestIdRef.current === myReq) {
                    startAudioAnalysis(stream);
                } else {
                    stopMediaStream(stream);
                }
            });

            stt.start(
                (partial) => {
                    if (requestIdRef.current !== myReq) return;
                    if (listeningInitTimerRef.current) {
                        clearTimeout(listeningInitTimerRef.current);
                        listeningInitTimerRef.current = null;
                    }
                    if (!stopRequestedRef.current) {
                        markRecordingStart();
                        setState("listening");
                    }
                    maybeEmitSttFirstToken(myReq, "native");
                    partialRef.current = partial;
                    setPartialTranscript(partial);
                },
                (final) => {
                    if (requestIdRef.current !== myReq) return;
                    if (listeningInitTimerRef.current) {
                        clearTimeout(listeningInitTimerRef.current);
                        listeningInitTimerRef.current = null;
                    }
                    if (!stopRequestedRef.current) {
                        markRecordingStart();
                        setState("listening");
                    }
                    maybeEmitSttFirstToken(myReq, "native");
                    partialRef.current = "";
                    setPartialTranscript("");
                    setDraftTranscript((prev) => {
                        const next = prev ? `${prev} ${final}` : final;
                        draftRef.current = next;
                        return next;
                    });
                    setTranscript((prev) => {
                        const next = prev ? `${prev} ${final}` : final;
                        transcriptRef.current = next;
                        return next;
                    });
                },
                (err) => {
                    if (requestIdRef.current !== myReq) return;
                    if (err === "no-speech" || err === "aborted") return;

                    // If error happens immediately (init timer still running), switch to fallback
                    if (listeningInitTimerRef.current) {
                        console.log('[VoiceController] Native STT error during init:', err);
                        clearTimeout(listeningInitTimerRef.current);
                        listeningInitTimerRef.current = null;
                        stt.abort(); // safety
                        void startFallbackWithPreparedStream();
                        return;
                    }

                    // Otherwise it's a runtime error
                    fail("Voice hiccup. Try again.");
                }
            );
        } catch {
            if (listeningInitTimerRef.current) clearTimeout(listeningInitTimerRef.current);
            await startFallbackWithPreparedStream();
        }
    }, [acquireMicStream, applyVoiceBillingDecision, bumpRequest, clearRecordingTimer, clearSpeechQueue, clearTimers, fail, markRecordingStart, maybeEmitSttFirstToken, resetVoiceUsageTracking, speechIsPlaying, startFallback, startAudioAnalysis, startVoiceBillingSession, stopMediaStream, stopPlayback]);

    const stop = useCallback(() => {
        if (stateRef.current !== "listening") return;
        const myReq = requestIdRef.current;
        stopRequestedRef.current = true;
        sentRequestRef.current = null;
        lastDurationSecRef.current = captureDurationSec();
        recordingStartRef.current = null;
        sttFinalizeStartedAtRef.current = Date.now();
        clearRecordingTimer();

        // UI feedback
        setState("speaking");

        if (activeEngineRef.current === 'native') {
            sttRef.current?.stop();

            // Native needs time to finalize
            processingWatchdogRef.current = setTimeout(() => {
                if (requestIdRef.current !== myReq) return;
                const text = (draftRef.current || transcriptRef.current || partialRef.current || "").trim();
                if (text.length > 0) {
                    if (sentRequestRef.current === myReq) return;
                    sentRequestRef.current = myReq;
                    setDraftTranscript(text);
                    draftRef.current = text;
                    setState("speaking");
                    listeningSecondsUsedRef.current = Math.max(listeningSecondsUsedRef.current, lastDurationSecRef.current);
                    maybeEmitSttFirstToken(myReq, "native");
                    const sttFinalizeStartedAt = sttFinalizeStartedAtRef.current;
                    const sttLatencyMs = sttFinalizeStartedAt
                        ? Math.max(0, Date.now() - sttFinalizeStartedAt)
                        : 0;
                    const turnId = bindTurnIdForRequest(myReq);
                    onTranscript(text, {
                        requestId: myReq,
                        turnId,
                        sttLatencyMs,
                        engine: "native",
                    });
                    emitTelemetry({
                        type: "stt_ready",
                        atMs: Date.now(),
                        latencyMs: sttLatencyMs,
                        requestId: myReq,
                        turnId,
                        engine: "native",
                        chars: text.length,
                    });
                    sttFinalizeStartedAtRef.current = null;
                } else {
                    hardReset();
                }
            }, PROCESSING_WATCHDOG_MS);

            settleTimerRef.current = setTimeout(() => {
                if (requestIdRef.current !== myReq) return;
                if (processingWatchdogRef.current) {
                    clearTimeout(processingWatchdogRef.current);
                    processingWatchdogRef.current = null;
                }
                const text = (draftRef.current || transcriptRef.current || partialRef.current || "").trim();
                if (text.length > 0) {
                    if (sentRequestRef.current === myReq) return;
                    sentRequestRef.current = myReq;
                    setDraftTranscript(text);
                    draftRef.current = text;
                    setState("speaking");
                    listeningSecondsUsedRef.current = Math.max(listeningSecondsUsedRef.current, lastDurationSecRef.current);
                    maybeEmitSttFirstToken(myReq, "native");
                    const sttFinalizeStartedAt = sttFinalizeStartedAtRef.current;
                    const sttLatencyMs = sttFinalizeStartedAt
                        ? Math.max(0, Date.now() - sttFinalizeStartedAt)
                        : 0;
                    const turnId = bindTurnIdForRequest(myReq);
                    onTranscript(text, {
                        requestId: myReq,
                        turnId,
                        sttLatencyMs,
                        engine: "native",
                    });
                    emitTelemetry({
                        type: "stt_ready",
                        atMs: Date.now(),
                        latencyMs: sttLatencyMs,
                        requestId: myReq,
                        turnId,
                        engine: "native",
                        chars: text.length,
                    });
                    sttFinalizeStartedAtRef.current = null;
                } else {
                    hardReset();
                }
                stopAudioAnalysis();
            }, FINALIZE_SETTLE_MS);

        } else if (activeEngineRef.current === 'fallback') {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                stopAudioAnalysis();
            } else {
                stopAudioAnalysis();
                fail("Something interrupted recording. Try again.");
            }
        }

    }, [bindTurnIdForRequest, captureDurationSec, clearRecordingTimer, emitTelemetry, hardReset, fail, maybeEmitSttFirstToken, onTranscript, stopAudioAnalysis]);

    useEffect(() => {
        stopRef.current = stop;
    }, [stop]);

    const discard = useCallback(() => {
        hardReset();
    }, [hardReset]);

    const cancel = useCallback(() => {
        hardReset();
    }, [hardReset]);

    const silence = useCallback(() => {
        captureTtsUsageSoFar();
        void finalizeVoiceSessionUsage('user_stop');
        clearSpeechQueue();
        stopPlayback();
        setInterruptionState("assistant_interrupted");
        setState((prev) => (prev === 'speaking' ? 'idle' : prev));
        setSpeechSpokenChars(0);
    }, [captureTtsUsageSoFar, clearSpeechQueue, finalizeVoiceSessionUsage, stopPlayback]);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            if (next) {
                captureTtsUsageSoFar();
                clearSpeechQueue();
                stopPlayback();
                setSpeechIsPlaying(false);
                setCurrentAudioPlaybackState("stopped");
                setInterruptionState("assistant_interrupted");
                setState((current) => (current === "speaking" ? "idle" : current));
            } else {
                setCurrentAudioPlaybackState("idle");
                setInterruptionState("none");
            }
            return next;
        });
    }, [captureTtsUsageSoFar, clearSpeechQueue, stopPlayback]);

    const replayLast = useCallback(() => {
        if (isMuted) return;
        const replayText = normalizeTtsText(transcriptRef.current || lastSpokenTextRef.current || "");
        if (!replayText || !isSpeakableTtsText(replayText)) return;
        setInterruptionState("none");
        speakRef.current(replayText, {
            nextTranscript: replayText,
            segmentStartCharsOverride: 0,
            totalLengthCharsOverride: replayText.length,
        });
    }, [isMuted]);

    const toggle = useCallback(() => {
        const current = stateRef.current;
        if (current === "idle" || current === "error") start();
        else if (current === "listening") stop();
        else discard();
    }, [start, stop, discard]);

    const speak = useCallback((text: string, options?: SpeakCallOptions) => {
        const cleaned = normalizeTtsText((text || "").trim());
        if (!cleaned) return;
        if (!isSpeakableTtsText(cleaned)) return;
        if (isMuted) {
            const mutedTranscript = typeof options?.nextTranscript === 'string' ? options.nextTranscript : cleaned;
            setTranscript(mutedTranscript);
            transcriptRef.current = mutedTranscript;
            setSpeechProgress(0);
            setSpeechIsPlaying(false);
            setSpeechSpokenChars(0);
            setCurrentAudioPlaybackState("stopped");
            setState("idle");
            return;
        }
        const resumeAttempt = Math.max(0, Number(options?.resumeAttempt || 0));
        const appendMode = continueSpeechRef.current;
        continueSpeechRef.current = false;

        if (!appendMode && state === 'speaking' && cleaned === lastSpokenTextRef.current) {
            return;
        }

        const segmentIsActive =
            speechSegmentActiveRef.current ||
            localSpeechActiveRef.current ||
            Boolean(ttsAbortRef.current) ||
            Boolean(ttsAudioRef.current);

        if (stateRef.current === 'speaking' && segmentIsActive) {
            const lastQueued = speechQueueRef.current[speechQueueRef.current.length - 1];
            if (cleaned !== lastQueued && cleaned !== lastSpokenTextRef.current) {
                speechQueueRef.current.push(cleaned);
            }
            return;
        }

        const existingTranscript = appendMode ? transcriptRef.current : "";
        const joiner = appendMode && existingTranscript.length > 0 ? " " : "";
        const nextTranscript = typeof options?.nextTranscript === 'string'
            ? options.nextTranscript
            : appendMode
                ? `${existingTranscript}${joiner}${cleaned}`
                : cleaned;
        const segmentStartChars = Number.isFinite(options?.segmentStartCharsOverride as number)
            ? Math.max(0, Number(options?.segmentStartCharsOverride))
            : appendMode
                ? existingTranscript.length + joiner.length
                : 0;
        const segmentLengthChars = Math.max(1, cleaned.length);
        const totalLengthChars = Number.isFinite(options?.totalLengthCharsOverride as number)
            ? Math.max(1, Number(options?.totalLengthCharsOverride))
            : Math.max(1, nextTranscript.length);
        speechSegmentStartCharsRef.current = segmentStartChars;
        speechSegmentLengthRef.current = segmentLengthChars;
        speechTotalLengthRef.current = totalLengthChars;

        const mapSegmentProgressToOverall = (segmentProgress: number) => {
            const segStart = speechSegmentStartCharsRef.current;
            const segLen = Math.max(1, speechSegmentLengthRef.current);
            const totalLen = Math.max(1, speechTotalLengthRef.current);
            const clampedSegment = Math.min(1, Math.max(0, segmentProgress));
            return Math.min(1, Math.max(0, (segStart + clampedSegment * segLen) / totalLen));
        };
        const segmentWordEndOffsets = (() => {
            const tokens = cleaned.match(/\S+\s*/g);
            if (!tokens || tokens.length === 0) return [segmentLengthChars];
            const offsets: number[] = [];
            let consumed = 0;
            for (const token of tokens) {
                consumed += token.length;
                offsets.push(Math.min(segmentLengthChars, consumed));
            }
            if (offsets[offsets.length - 1] !== segmentLengthChars) {
                offsets.push(segmentLengthChars);
            }
            return offsets;
        })();

        const mapSegmentProgressToChars = (segmentProgress: number) => {
            const segStart = speechSegmentStartCharsRef.current;
            const clampedSegment = Math.min(1, Math.max(0, segmentProgress));
            const wordCount = segmentWordEndOffsets.length;
            if (wordCount <= 0) {
                return Math.max(0, Math.min(speechTotalLengthRef.current, segStart));
            }
            const spokenWords = Math.max(0, Math.min(wordCount, Math.floor(clampedSegment * wordCount)));
            if (spokenWords <= 0) {
                return Math.max(0, Math.min(speechTotalLengthRef.current, segStart));
            }
            const segmentChars = segmentWordEndOffsets[spokenWords - 1];
            return Math.max(0, Math.min(speechTotalLengthRef.current, segStart + segmentChars));
        };

        const mapSegmentCharIndexToChars = (segmentCharIndex: number) => {
            const segStart = speechSegmentStartCharsRef.current;
            const clampedIndex = Math.min(segmentLengthChars, Math.max(0, Math.floor(segmentCharIndex)));
            const wordBoundary = segmentWordEndOffsets.find((offset) => offset > clampedIndex);
            const segmentChars = typeof wordBoundary === 'number'
                ? wordBoundary
                : segmentWordEndOffsets[segmentWordEndOffsets.length - 1] || segmentLengthChars;
            return Math.max(0, Math.min(speechTotalLengthRef.current, segStart + segmentChars));
        };

        // Cancel any existing recording/timers
        clearTimers();
        clearRecordingTimer();
        sttRef.current?.abort();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        activeEngineRef.current = 'none';
        stopAudioAnalysis();
        stopPlayback({ keepUiWarm: appendMode, preserveSpeechPlaying: appendMode });
        recordingStartRef.current = null;
        lastDurationSecRef.current = 0;
        ttsPlaybackStartedAtRef.current = null;
        ttsCapturedSecondsRef.current = 0;

        setState('speaking');
        setTranscript(nextTranscript); // Keep transcript continuous across streamed chunks.
        transcriptRef.current = nextTranscript;
        setPartialTranscript("");
        setError(null);
        lastSpokenTextRef.current = nextTranscript;
        const isResumeSegment = segmentStartChars > 0 || resumeAttempt > 0 || Boolean(options?.nextTranscript);
        setSpeechProgress((prev) =>
            (appendMode || isResumeSegment) ? Math.max(prev, mapSegmentProgressToOverall(0)) : 0
        );
        setSpeechIsPlaying((prev) => (appendMode || isResumeSegment) ? prev : false);
        setSpeechSpokenChars((prev) =>
            (appendMode || isResumeSegment) ? Math.max(prev, segmentStartChars) : 0
        );
        speechSegmentActiveRef.current = true;
        setCurrentAudioPlaybackState("buffering");
        setInterruptionState("none");
        setReconnectState("stable");

        const myRequestId = ++ttsRequestIdRef.current;
        const segmentDebugId = `tts-${myRequestId}`;
        const speakStartedAtMs = debugNow();
        voiceDebugLog("tts_segment_start", {
            segmentId: segmentDebugId,
            appendMode,
            chars: cleaned.length,
            text: cleaned,
        });
        const controller = new AbortController();
        ttsAbortRef.current = controller;
        let localFallbackStarted = false;

        const finishSpeakingSuccess = () => {
            clearSpeechSegmentWatchdog();
            captureTtsUsageSoFar();
            ttsPlaybackStartedAtRef.current = null;
            speechSegmentActiveRef.current = false;
            setSpeechProgress((prev) => Math.max(prev, mapSegmentProgressToOverall(1)));
            setSpeechSpokenChars((prev) => Math.max(prev, mapSegmentProgressToChars(1)));
            stopLocalSpeechProgressLoop();
            stopSpeechProgressLoop();

            let nextSegment: string | undefined;
            do {
                nextSegment = speechQueueRef.current.shift();
            } while (
                typeof nextSegment === 'string' &&
                (!nextSegment.trim() || nextSegment.trim() === lastSpokenTextRef.current)
            );

            if (nextSegment) {
                const trimmedNextSegment = nextSegment.trim();
                voiceDebugLog("tts_segment_queue_next", {
                    segmentId: segmentDebugId,
                    nextChars: trimmedNextSegment.length,
                    queuedRemaining: speechQueueRef.current.length,
                });
                stopPlayback({ keepUiWarm: true, preserveSpeechPlaying: true });
                continueSpeechRef.current = true;
                setTimeout(() => {
                    speakRef.current(trimmedNextSegment);
                }, 0);
                return;
            }

            setSpeechIsPlaying(false);
            stopPlayback();
            setState(s => s === 'speaking' ? 'idle' : s);
            voiceDebugLog("tts_segment_complete", {
                segmentId: segmentDebugId,
                elapsedMs: Math.round(debugNow() - speakStartedAtMs),
            });
            void finalizeVoiceSessionUsage('user_stop');
        };

        const scheduleTailResume = (reason: string, audioRef?: HTMLAudioElement | null): boolean => {
            if (controller.signal.aborted || myRequestId !== ttsRequestIdRef.current) return false;
            if (resumeAttempt >= TTS_TAIL_RESUME_MAX_ATTEMPTS) return false;

            const currentTime = Number(audioRef?.currentTime);
            const duration = Number(audioRef?.duration);
            const hasProgress = Number.isFinite(currentTime) && Number.isFinite(duration) && duration > 0;
            const progress = hasProgress ? Math.min(0.995, Math.max(0, currentTime / duration)) : 0;
            const spokenOverallChars = hasProgress
                ? mapSegmentProgressToChars(progress)
                : Math.max(segmentStartChars, speechSegmentStartCharsRef.current);
            const relativeSpoken = Math.max(0, Math.min(cleaned.length, spokenOverallChars - segmentStartChars));
            const remainingRaw = cleaned.slice(relativeSpoken).trim();
            const remaining = normalizeTtsText(remainingRaw);

            if (!remaining || !isSpeakableTtsText(remaining)) return false;
            if (remaining.length >= cleaned.length && resumeAttempt > 0) return false;

            const preservedTranscript = nextTranscript;
            const resumeFromChars = Math.max(segmentStartChars, spokenOverallChars);

            voiceDebugLog("tts_tail_resume", {
                segmentId: segmentDebugId,
                reason,
                resumeAttempt,
                nextResumeAttempt: resumeAttempt + 1,
                spokenOverallChars,
                remainingChars: remaining.length,
            });
            emitTelemetry({
                type: "tts_resume",
                atMs: Date.now(),
                latencyMs: 0,
                requestId: myRequestId,
                turnId: activeTurnIdRef.current || undefined,
                engine: "remote",
                chars: remaining.length,
                reason,
                attempt: resumeAttempt + 1,
                maxAttempts: TTS_TAIL_RESUME_MAX_ATTEMPTS,
            });

            speechSegmentActiveRef.current = false;
            ttsPlaybackStartedAtRef.current = null;
            stopPlayback({ keepUiWarm: true, preserveSpeechPlaying: true });

            setTimeout(() => {
                speakRef.current(remaining, {
                    resumeAttempt: resumeAttempt + 1,
                    nextTranscript: preservedTranscript,
                    segmentStartCharsOverride: resumeFromChars,
                    totalLengthCharsOverride: Math.max(1, preservedTranscript.length),
                });
            }, 70);

            return true;
        };

        const segmentWatchdogWindowMs = Math.max(
            SPEAKING_SEGMENT_WATCHDOG_MS,
            Math.min(15000, Math.round(cleaned.length * 135))
        );

        const armSegmentWatchdog = (timeoutMs?: number) => {
            clearSpeechSegmentWatchdog();
            const computedTimeout = timeoutMs ?? segmentWatchdogWindowMs;
            speechSegmentWatchdogRef.current = setTimeout(() => {
                if (myRequestId !== ttsRequestIdRef.current) return;
                finishSpeakingSuccess();
            }, computedTimeout);
        };

        const touchSegmentWatchdog = () => {
            armSegmentWatchdog(segmentWatchdogWindowMs);
        };

        armSegmentWatchdog();

        const startLocalSpeechFallback = () => {
            if (!ENABLE_BROWSER_TTS_FALLBACK) {
                voiceDebugLog("tts_fallback_disabled", { segmentId: segmentDebugId });
                return false;
            }
            if (localFallbackStarted) return true;
            if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
            if (typeof SpeechSynthesisUtterance === "undefined") return false;
            if (controller.signal.aborted || myRequestId !== ttsRequestIdRef.current) return false;

            localFallbackStarted = true;
            localSpeechActiveRef.current = true;

            const synth = window.speechSynthesis;
            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(cleaned);
            synthUtteranceRef.current = utterance;

            const langHint =
                voiceMode === 'arabic' || voiceMode === 'arabic_english'
                    ? 'ar'
                    : voiceMode === 'swahili' || voiceMode === 'english_sw'
                        ? 'sw'
                        : 'en';
            const voices = synth.getVoices();
            const matchedVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith(langHint));
            if (matchedVoice) {
                utterance.voice = matchedVoice;
                utterance.lang = matchedVoice.lang;
            } else {
                utterance.lang = langHint === 'ar' ? 'ar-SA' : langHint === 'sw' ? 'sw-KE' : 'en-US';
            }
            utterance.rate = 1.04;
            utterance.pitch = 1;
            setSpeechIsPlaying(true);
            setSpeechProgress((prev) => Math.max(prev, mapSegmentProgressToOverall(0.01)));

            utterance.onstart = () => {
                if (myRequestId !== ttsRequestIdRef.current) return;
                ttsPlaybackStartedAtRef.current = Date.now();
                ttsCapturedSecondsRef.current = 0;
                setCurrentAudioPlaybackState("playing");
                const startupMs = Math.max(0, Math.round(debugNow() - speakStartedAtMs));
                voiceDebugLog("tts_fallback_play_start", {
                    segmentId: segmentDebugId,
                    startupMs,
                });
                emitTelemetry({
                    type: "tts_start",
                    atMs: Date.now(),
                    latencyMs: startupMs,
                    requestId: myRequestId,
                    turnId: activeTurnIdRef.current || undefined,
                    engine: "fallback",
                    chars: cleaned.length,
                });
                setSpeechProgress(mapSegmentProgressToOverall(0.02));
                setSpeechIsPlaying(true);
                setSpeechSpokenChars((prev) => Math.max(prev, mapSegmentProgressToChars(0.02)));
                touchSegmentWatchdog();

                // Some browsers do not emit reliable boundary events for all voices.
                // Keep transcript typing smooth by estimating progress over expected speech duration.
                const estimatedMs = Math.max(
                    1400,
                    Math.round((cleaned.length / 14) * 1000 / Math.max(utterance.rate || 1, 0.8))
                );
                stopLocalSpeechProgressLoop();
                localSpeechStartedAtRef.current = Date.now();
                localSpeechEstimatedDurationMsRef.current = estimatedMs;

                const tick = () => {
                    if (!localSpeechActiveRef.current || myRequestId !== ttsRequestIdRef.current) return;
                    const startedAt = localSpeechStartedAtRef.current;
                    const expectedMs = localSpeechEstimatedDurationMsRef.current;
                    if (startedAt && expectedMs > 0) {
                        const elapsed = Date.now() - startedAt;
                        const estimatedProgress = Math.min(0.97, Math.max(0.02, elapsed / expectedMs));
                        const overall = mapSegmentProgressToOverall(estimatedProgress);
                        setSpeechProgress((prev) => (overall > prev ? overall : prev));
                        const chars = mapSegmentProgressToChars(estimatedProgress);
                        setSpeechSpokenChars((prev) => (chars > prev ? chars : prev));
                    }
                    captureTtsUsageSoFar();
                    localSpeechProgressRafRef.current = requestAnimationFrame(tick);
                };

                localSpeechProgressRafRef.current = requestAnimationFrame(tick);
            };

            utterance.onboundary = (event: SpeechSynthesisEvent) => {
                if (myRequestId !== ttsRequestIdRef.current) return;
                const boundaryName = String((event as any).name || '').toLowerCase();
                if (boundaryName && boundaryName !== 'word') return;
                const charIndex = Number(event.charIndex);
                if (Number.isFinite(charIndex) && cleaned.length > 0) {
                    const normalizedIndex = Math.max(0, Math.min(cleaned.length, Math.floor(charIndex)));
                    const progress = Math.min(0.98, Math.max(0, normalizedIndex / cleaned.length));
                    const overall = mapSegmentProgressToOverall(progress);
                    setSpeechProgress((prev) => (overall > prev ? overall : prev));
                    const chars = mapSegmentCharIndexToChars(normalizedIndex);
                    setSpeechSpokenChars((prev) => (chars > prev ? chars : prev));
                }
                captureTtsUsageSoFar();
                touchSegmentWatchdog();
            };

            utterance.onend = () => {
                if (myRequestId !== ttsRequestIdRef.current) return;
                localSpeechActiveRef.current = false;
                synthUtteranceRef.current = null;
                stopLocalSpeechProgressLoop();
                voiceDebugLog("tts_fallback_play_end", {
                    segmentId: segmentDebugId,
                    elapsedMs: Math.round(debugNow() - speakStartedAtMs),
                });
                finishSpeakingSuccess();
            };

            utterance.onerror = () => {
                if (controller.signal.aborted || myRequestId !== ttsRequestIdRef.current) return;
                localSpeechActiveRef.current = false;
                synthUtteranceRef.current = null;
                speechSegmentActiveRef.current = false;
                setCurrentAudioPlaybackState("error");
                clearSpeechQueue();
                stopLocalSpeechProgressLoop();
                captureTtsUsageSoFar();
                ttsPlaybackStartedAtRef.current = null;
                void finalizeVoiceSessionUsage('error');
                setSpeechIsPlaying(false);
                stopSpeechProgressLoop();
                stopPlayback();
                voiceDebugLog("tts_fallback_error", {
                    segmentId: segmentDebugId,
                    elapsedMs: Math.round(debugNow() - speakStartedAtMs),
                });
                setError("Voice playback didn't work. Please try again.");
                setState("error");
            };

            synth.speak(utterance);
            return true;
        };

        const run = async () => {
            let firstAudioByteTelemetrySent = false;
            let localFallbackTimer: ReturnType<typeof setTimeout> | null = null;
            const clearLocalFallbackTimer = () => {
                if (localFallbackTimer) {
                    clearTimeout(localFallbackTimer);
                    localFallbackTimer = null;
                }
            };
            const waitForRetry = (ms: number) =>
                new Promise<void>((resolve) => setTimeout(resolve, ms));
            const requestTtsBlob = async () => {
                const maxAttempts = Math.max(1, TTS_FETCH_RETRY_ATTEMPTS + 1);
                let lastError: unknown = null;

                for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
                    const fetchStartedAtMs = debugNow();
                    const attemptController = new AbortController();
                    const timeoutMs = TTS_FETCH_TIMEOUT_MS + (attempt - 1) * 1000;
                    const timeoutId = setTimeout(() => attemptController.abort(), timeoutMs);
                    const relayAbort = () => attemptController.abort();
                    controller.signal.addEventListener('abort', relayAbort, { once: true });

                    try {
                        voiceDebugLog("tts_fetch_start", {
                            segmentId: segmentDebugId,
                            endpoint: "/voice/tts",
                            chars: cleaned.length,
                            voice: PREFERRED_TTS_VOICE,
                            speed: 1.2,
                            attempt,
                            timeoutMs,
                        });

                        const response = await api.voice.synthesize(
                            {
                                text: cleaned,
                                voice: PREFERRED_TTS_VOICE,
                                speed: 1.2,
                                languageMode: voiceMode,
                                voiceBehaviorProfile,
                                sessionUsageId: voiceSessionUsageIdRef.current,
                                sessionLanguageState: sessionLanguageState || null,
                            },
                            {
                                sessionUsageId: voiceSessionUsageIdRef.current || undefined,
                                signal: attemptController.signal,
                                timeoutMs,
                            }
                        );

                        voiceDebugLog("tts_fetch_response", {
                            segmentId: segmentDebugId,
                            status: response.status,
                            ok: response.ok,
                            latencyMs: Math.round(debugNow() - fetchStartedAtMs),
                            attempt,
                        });

                        if (!firstAudioByteTelemetrySent) {
                            firstAudioByteTelemetrySent = true;
                            emitTelemetry({
                                type: "tts_first_audio_byte",
                                atMs: Date.now(),
                                latencyMs: Math.max(0, Math.round(debugNow() - speakStartedAtMs)),
                                requestId: myRequestId,
                                turnId: activeTurnIdRef.current || undefined,
                                engine: "remote",
                                chars: cleaned.length,
                            });
                        }

                        if (!response.ok) {
                            throw new Error(`TTS failed: ${response.status}`);
                        }

                        const audioBlob = await response.blob();
                        if (audioBlob.size < MIN_TTS_AUDIO_BLOB_BYTES) {
                            throw new Error(`TTS audio too short: ${audioBlob.size}`);
                        }

                        return audioBlob;
                    } catch (error) {
                        lastError = error;
                        const isAbort = attemptController.signal.aborted || controller.signal.aborted;
                        voiceDebugLog("tts_fetch_retry", {
                            segmentId: segmentDebugId,
                            attempt,
                            maxAttempts,
                            isAbort,
                            error: error instanceof Error ? error.message : String(error),
                        });
                        if (!isAbort && attempt < maxAttempts) {
                            emitTelemetry({
                                type: "tts_retry",
                                atMs: Date.now(),
                                latencyMs: 0,
                                requestId: myRequestId,
                                turnId: activeTurnIdRef.current || undefined,
                                engine: "remote",
                                reason: error instanceof Error ? error.message : String(error),
                                attempt,
                                maxAttempts,
                            });
                        }
                        if (isAbort || attempt >= maxAttempts) {
                            throw error;
                        }
                        await waitForRetry(TTS_RETRY_BACKOFF_MS * attempt);
                    } finally {
                        clearTimeout(timeoutId);
                        controller.signal.removeEventListener('abort', relayAbort);
                    }
                }

                throw (lastError instanceof Error ? lastError : new Error('TTS request failed'));
            };
            try {
                if (ENABLE_BROWSER_TTS_FALLBACK) {
                    localFallbackTimer = setTimeout(() => {
                        if (controller.signal.aborted || myRequestId !== ttsRequestIdRef.current) return;
                        const started = startLocalSpeechFallback();
                        if (started) {
                            controller.abort();
                        }
                    }, LOCAL_TTS_FALLBACK_DELAY_MS);
                }
                const audioBlob = await requestTtsBlob();
                clearLocalFallbackTimer();
                if (controller.signal.aborted || myRequestId !== ttsRequestIdRef.current || localFallbackStarted) return;
                voiceDebugLog("tts_blob_ready", {
                    segmentId: segmentDebugId,
                    bytes: audioBlob.size,
                });

                const url = URL.createObjectURL(audioBlob);
                ttsObjectUrlRef.current = url;
                const audio = new Audio(url);
                ttsAudioRef.current = audio;
                let playbackStartedAtMs = 0;

                audio.onplay = () => {
                    if (myRequestId !== ttsRequestIdRef.current) return;
                    clearLocalFallbackTimer();
                    ttsPlaybackStartedAtRef.current = Date.now();
                    ttsCapturedSecondsRef.current = 0;
                    setCurrentAudioPlaybackState("playing");
                    playbackStartedAtMs = debugNow();
                    const startupMs = Math.max(0, Math.round(playbackStartedAtMs - speakStartedAtMs));
                    voiceDebugLog("tts_audio_play", {
                        segmentId: segmentDebugId,
                        startupMs,
                    });
                    emitTelemetry({
                        type: "tts_start",
                        atMs: Date.now(),
                        latencyMs: startupMs,
                        requestId: myRequestId,
                        turnId: activeTurnIdRef.current || undefined,
                        engine: "remote",
                        chars: cleaned.length,
                    });
                    setSpeechIsPlaying(true);
                    touchSegmentWatchdog();
                    startPlaybackAnalysis(audio);
                    const loop = () => {
                        if (ttsAudioRef.current !== audio) return;
                        if (audio.paused || audio.ended) return;
                        if (Number.isFinite(audio.duration) && audio.duration > 0) {
                            const progress = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
                            const overall = mapSegmentProgressToOverall(progress);
                            setSpeechProgress((prev) => (overall > prev ? overall : prev));
                            const chars = mapSegmentProgressToChars(progress);
                            setSpeechSpokenChars((prev) => (chars > prev ? chars : prev));
                        }
                        speechProgressRafRef.current = requestAnimationFrame(loop);
                    };
                    stopSpeechProgressLoop();
                    speechProgressRafRef.current = requestAnimationFrame(loop);
                };

                audio.ontimeupdate = () => {
                    if (myRequestId !== ttsRequestIdRef.current) return;
                    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
                    const progress = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
                    const overall = mapSegmentProgressToOverall(progress);
                    setSpeechProgress((prev) => (overall > prev ? overall : prev));
                    const chars = mapSegmentProgressToChars(progress);
                    setSpeechSpokenChars((prev) => (chars > prev ? chars : prev));
                    captureTtsUsageSoFar();
                    touchSegmentWatchdog();
                };

                audio.onended = () => {
                    if (ttsAudioRef.current !== audio || myRequestId !== ttsRequestIdRef.current) return;
                    const endedAtMs = debugNow();
                    voiceDebugLog("tts_audio_end", {
                        segmentId: segmentDebugId,
                        totalMs: Math.round(endedAtMs - speakStartedAtMs),
                        playMs: playbackStartedAtMs > 0 ? Math.round(endedAtMs - playbackStartedAtMs) : null,
                        durationSec: Number.isFinite(audio.duration) ? Number(audio.duration.toFixed(2)) : null,
                        playedSec: Number.isFinite(audio.currentTime) ? Number(audio.currentTime.toFixed(2)) : null,
                    });
                    const hasFiniteDuration = Number.isFinite(audio.duration) && audio.duration > 0;
                    const playedRatio = hasFiniteDuration
                        ? Math.max(0, Math.min(1, Number(audio.currentTime) / Number(audio.duration)))
                        : 1;
                    const endedEarly = hasFiniteDuration && playedRatio < 0.985;
                    if (endedEarly) {
                        const resumed = scheduleTailResume('ended_early', audio);
                        if (resumed) return;
                        emitTelemetry({
                            type: "tts_cutoff",
                            atMs: Date.now(),
                            latencyMs: 0,
                            requestId: myRequestId,
                            turnId: activeTurnIdRef.current || undefined,
                            engine: "remote",
                            reason: "ended_early_unrecovered",
                            chars: cleaned.length,
                        });
                    }
                    finishSpeakingSuccess();
                };

                audio.onerror = () => {
                    if (controller.signal.aborted || myRequestId !== ttsRequestIdRef.current) return;
                    const resumed = scheduleTailResume('audio_error', audio);
                    if (resumed) return;
                    setCurrentAudioPlaybackState("error");
                    emitTelemetry({
                        type: "tts_cutoff",
                        atMs: Date.now(),
                        latencyMs: 0,
                        requestId: myRequestId,
                        turnId: activeTurnIdRef.current || undefined,
                        engine: "remote",
                        reason: "audio_error_unrecovered",
                        chars: cleaned.length,
                    });
                    captureTtsUsageSoFar();
                    ttsPlaybackStartedAtRef.current = null;
                    void finalizeVoiceSessionUsage('error');
                    setSpeechIsPlaying(false);
                    stopSpeechProgressLoop();
                    stopPlayback();
                    voiceDebugLog("tts_audio_error", {
                        segmentId: segmentDebugId,
                        elapsedMs: Math.round(debugNow() - speakStartedAtMs),
                    });
                    setError("Voice playback didn't work. Please try again.");
                    setState("error");
                    // Stay in error until user retries or closes.
                };

                await audio.play();
            } catch (err) {
                clearLocalFallbackTimer();
                if (controller.signal.aborted || myRequestId !== ttsRequestIdRef.current) return;
                console.error('[VoiceController] TTS failed', err);
                setCurrentAudioPlaybackState("error");
                voiceDebugLog("tts_fetch_or_playback_error", {
                    segmentId: segmentDebugId,
                    elapsedMs: Math.round(debugNow() - speakStartedAtMs),
                    error: err instanceof Error ? err.message : String(err),
                });
                const resumed = scheduleTailResume('fetch_or_playback_error');
                if (resumed) return;
                const startedLocal = startLocalSpeechFallback();
                if (startedLocal) return;
                if (isLikelyConnectivityIssue(err)) {
                    const queued = enqueueSpeechForReconnect([
                        cleaned,
                        ...speechQueueRef.current,
                    ]);
                    if (queued > 0) {
                        clearSpeechQueue();
                        speechSegmentActiveRef.current = false;
                        captureTtsUsageSoFar();
                        ttsPlaybackStartedAtRef.current = null;
                        stopPlayback();
                        setSpeechIsPlaying(false);
                        setCurrentAudioPlaybackState("idle");
                        setState("idle");
                        setError(null);
                        if (typeof window !== "undefined") {
                            setReconnectState(window.navigator.onLine ? "degraded" : "offline");
                        } else {
                            setReconnectState("degraded");
                        }
                        return;
                    }
                }
                emitTelemetry({
                    type: "tts_cutoff",
                    atMs: Date.now(),
                    latencyMs: 0,
                    requestId: myRequestId,
                    turnId: activeTurnIdRef.current || undefined,
                    engine: "remote",
                    reason: "fetch_or_playback_unrecovered",
                    chars: cleaned.length,
                });

                speechSegmentActiveRef.current = false;
                clearSpeechQueue();
                captureTtsUsageSoFar();
                ttsPlaybackStartedAtRef.current = null;
                void finalizeVoiceSessionUsage('error');
                stopPlayback();
                setError("Voice playback didn't work. Please try again.");
                setState("error");
            }
        };

        void run();
    }, [captureTtsUsageSoFar, clearRecordingTimer, clearSpeechQueue, clearSpeechSegmentWatchdog, clearTimers, emitTelemetry, enqueueSpeechForReconnect, finalizeVoiceSessionUsage, isLikelyConnectivityIssue, isMuted, startPlaybackAnalysis, state, stopAudioAnalysis, stopLocalSpeechProgressLoop, stopPlayback, stopSpeechProgressLoop, voiceBehaviorProfile, voiceMode]);

    useEffect(() => {
        speakRef.current = speak;
    }, [speak]);

    const isSupported = typeof window !== "undefined" && (
        !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ||
        !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );

    return {
        state,
        transcript,
        partialTranscript,
        lastTranscript: transcript,
        draftTranscript,
        error,
        start,
        stop,
        cancel,
        silence,
        toggle,
        discard,
        speak,
        isSupported,
        volume,
        speechProgress,
        speechIsPlaying,
        speechSpokenChars,
        activeSessionUsageId,
        micPermissionState,
        detectedLanguage,
        selectedLanguage,
        currentAudioPlaybackState,
        interruptionState,
        reconnectState,
        isMuted,
        toggleMute,
        replayLast,
        voiceBehaviorProfile,
    };
}


