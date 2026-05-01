import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    BookAudio,
    Languages,
    MessageSquareReply,
    Mic,
    Pause,
    Play,
    Save,
    Square,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';
import { HeroOrb } from './hero-orb';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
    reconcileInterruptedAssistantText,
    resolveAssistantTurnLanguage,
    resolveStudentTurnLanguage,
} from '@/lib/voice-turn-reconciliation';
import type {
    DetectedInputLanguage,
    VoiceBehaviorProfile,
    VoiceModeRuntimeState,
    VoiceModeVisualState,
    VoiceRecapGenerationState,
    VoiceTranscriptTurn,
} from '@/lib/types';
import type { VoiceController } from '../../AI/useVoiceController';

interface VoiceConciergeProps {
    voiceController: VoiceController;
    sessionId?: string;
    className?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

const PROFILE_LABEL: Record<VoiceBehaviorProfile, string> = {
    tutor_voice: 'Tutor Voice',
    revision_voice: 'Revision Voice',
    reading_voice: 'Reading Voice',
    focus_voice: 'Focus Voice',
    exam_voice: 'Exam Voice',
};

const STATE_LABEL: Record<VoiceModeVisualState, string> = {
    idle: 'Idle',
    ready: 'Ready',
    listening: 'Listening',
    active_capture: 'Capturing',
    processing: 'Thinking',
    speaking: 'Speaking',
    waiting_response: 'Waiting for your answer',
    interrupted: 'Interrupted',
    paused: 'Paused',
    reconnecting: 'Reconnecting',
    error: 'Voice issue',
    recap_playback: 'Recap playback',
};

const STATE_GUIDANCE: Record<VoiceModeVisualState, string> = {
    idle: 'Voice mode is resting.',
    ready: 'Speak naturally. I will guide one step at a time.',
    listening: 'I am listening. Keep explaining your thinking.',
    active_capture: 'Good flow. Continue your explanation.',
    processing: 'Let me think for a moment.',
    speaking: 'I will keep this short and clear.',
    waiting_response: 'Your turn. Try answering out loud.',
    interrupted: 'Interruption handled. Continue when ready.',
    paused: 'Paused. Tap resume when you want to continue.',
    reconnecting: 'Connection is recovering. Your context is preserved.',
    error: 'Voice hit a problem. You can retry or switch to text.',
    recap_playback: 'Replaying the saved explanation.',
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const getLastTurnByRole = (turns: VoiceTranscriptTurn[], role: VoiceTranscriptTurn['role']): VoiceTranscriptTurn | null => {
    for (let index = turns.length - 1; index >= 0; index -= 1) {
        if (turns[index]?.role === role) return turns[index];
    }
    return null;
};

const toTitleFromText = (value: string) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return 'Current voice lesson';
    if (text.length <= 62) return text;
    return `${text.slice(0, 59).trimEnd()}...`;
};

const deriveVisualState = (args: {
    state: VoiceController['state'];
    speechIsPlaying: boolean;
    error: string | null;
    isPaused: boolean;
    reconnectState: VoiceController['reconnectState'];
    interruptionState: VoiceController['interruptionState'];
    awaitingStudentResponse: boolean;
    isRecapPlayback: boolean;
    volume: number;
}): VoiceModeVisualState => {
    if (args.error) return 'error';
    if (args.reconnectState === 'offline' || args.reconnectState === 'degraded' || args.reconnectState === 'reconnecting') {
        return 'reconnecting';
    }
    if (args.isPaused) return 'paused';
    if (args.isRecapPlayback) return 'recap_playback';
    if (args.interruptionState !== 'none') return 'interrupted';
    if (args.state === 'listening') {
        return args.volume >= 0.22 ? 'active_capture' : 'listening';
    }
    if (args.state === 'speaking') {
        return args.speechIsPlaying ? 'speaking' : 'processing';
    }
    if (args.awaitingStudentResponse) return 'waiting_response';
    if (args.state === 'initializing') return 'ready';
    return 'ready';
};

export const VoiceConcierge: React.FC<VoiceConciergeProps> = ({
    voiceController,
    sessionId,
    className,
    isOpen = false,
    onClose,
}) => {
    const {
        state,
        transcript,
        partialTranscript,
        draftTranscript,
        stop,
        start,
        discard,
        error,
        volume,
        speechIsPlaying,
        speechSpokenChars,
        isSupported,
        voiceBehaviorProfile,
        detectedLanguage,
        selectedLanguage,
        micPermissionState,
        currentAudioPlaybackState,
        interruptionState,
        reconnectState,
        activeSessionUsageId,
        isMuted,
        toggleMute,
        replayLast,
        silence,
    } = voiceController;

    const [isMounted, setIsMounted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [awaitingStudentResponse, setAwaitingStudentResponse] = useState(false);
    const [isRecapPlayback, setIsRecapPlayback] = useState(false);
    const [typedAssistantTranscript, setTypedAssistantTranscript] = useState('');
    const [turns, setTurns] = useState<VoiceTranscriptTurn[]>([]);
    const [savedRecapIds, setSavedRecapIds] = useState<string[]>([]);
    const [recapGenerationState, setRecapGenerationState] = useState<VoiceRecapGenerationState>('idle');
    const [statusNotice, setStatusNotice] = useState('');
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const transcriptRef = useRef<HTMLDivElement | null>(null);
    const previousStateRef = useRef<VoiceController['state']>('idle');
    const lastStudentFinalRef = useRef('');
    const lastAssistantFinalRef = useRef('');
    const permissionEventEmittedRef = useRef(false);
    const audioErrorEventEmittedRef = useRef(false);
    const hesitationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastGrowthSignalKeyRef = useRef('');
    const lastStableStudentLanguageRef = useRef<DetectedInputLanguage | null>(detectedLanguage || null);

    const currentTopic = useMemo(() => {
        const studentTurn = getLastTurnByRole(turns, 'student');
        if (!studentTurn) return 'Voice study session';
        return toTitleFromText(studentTurn.text);
    }, [turns]);

    const visualState = useMemo(
        () =>
            deriveVisualState({
                state,
                speechIsPlaying,
                error,
                isPaused,
                reconnectState,
                interruptionState,
                awaitingStudentResponse,
                isRecapPlayback,
                volume,
            }),
        [state, speechIsPlaying, error, isPaused, reconnectState, interruptionState, awaitingStudentResponse, isRecapPlayback, volume]
    );

    const runtimeState = useMemo<VoiceModeRuntimeState>(
        () => ({
            isVoiceModeActive: isOpen,
            voiceSessionId: activeSessionUsageId || null,
            voiceProfile: voiceBehaviorProfile,
            currentVoiceState: visualState,
            micPermissionState,
            detectedLanguage: detectedLanguage || null,
            selectedLanguage: selectedLanguage || null,
            partialTranscript: partialTranscript || '',
            finalTranscript: draftTranscript || '',
            aiSpokenText: transcript || '',
            currentAudioPlaybackState,
            interruptionState,
            reconnectState,
            recapGenerationState,
            savedRecapIds,
            entryPoint: 'voice_overlay',
            returnContext: sessionId || null,
        }),
        [
            activeSessionUsageId,
            currentAudioPlaybackState,
            detectedLanguage,
            draftTranscript,
            interruptionState,
            isOpen,
            micPermissionState,
            partialTranscript,
            recapGenerationState,
            reconnectState,
            savedRecapIds,
            selectedLanguage,
            sessionId,
            transcript,
            visualState,
            voiceBehaviorProfile,
        ]
    );

    const intensity = useMemo(() => {
        const floor =
            visualState === 'speaking'
                ? 0.22
                : visualState === 'processing'
                    ? 0.14
                    : visualState === 'active_capture'
                        ? 0.2
                        : visualState === 'listening'
                            ? 0.16
                            : visualState === 'waiting_response'
                                ? 0.11
                                : visualState === 'reconnecting'
                                    ? 0.07
                                    : visualState === 'error'
                                        ? 0.06
                                        : 0.08;
        return clamp(floor + (visualState === 'active_capture' || visualState === 'listening' || visualState === 'speaking' ? volume * 0.78 : 0));
    }, [visualState, volume]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setIsPaused(false);
            setAwaitingStudentResponse(false);
            setIsRecapPlayback(false);
            setTypedAssistantTranscript('');
            setTurns([]);
            setSavedRecapIds([]);
            setRecapGenerationState('idle');
            setStatusNotice('');
            previousStateRef.current = 'idle';
            lastStudentFinalRef.current = '';
            lastAssistantFinalRef.current = '';
            permissionEventEmittedRef.current = false;
            audioErrorEventEmittedRef.current = false;
            lastStableStudentLanguageRef.current = detectedLanguage || null;
        }
    }, [detectedLanguage, isOpen]);

    useEffect(() => {
        const previous = previousStateRef.current;
        if (state === 'speaking' || state === 'listening') {
            setAwaitingStudentResponse(false);
        }
        if (previous === 'speaking' && state === 'idle') {
            setAwaitingStudentResponse(true);
        }
        previousStateRef.current = state;
    }, [state]);

    useEffect(() => {
        if (!isOpen) return;
        if (state !== 'speaking') return;
        const full = transcript || '';
        if (!full) return;
        const spokenChars = clamp(Math.floor(speechSpokenChars), 0, full.length);
        const typed = full.slice(0, spokenChars || full.length);
        if (typed !== typedAssistantTranscript) {
            setTypedAssistantTranscript(typed);
        }
    }, [isOpen, state, transcript, speechSpokenChars, typedAssistantTranscript]);

    useEffect(() => {
        if (!isOpen) return;
        if (state !== 'listening') return;
        const liveText = (partialTranscript || draftTranscript || '').trim();
        if (!liveText) return;
        const languageResolution = resolveStudentTurnLanguage({
            detectedLanguage: detectedLanguage || null,
            previousStableLanguage: lastStableStudentLanguageRef.current,
        });
        lastStableStudentLanguageRef.current = languageResolution.nextStableLanguage;
        setTurns((prev) => {
            const next = prev.filter((turn) => turn.id !== 'student-live');
            next.push({
                id: 'student-live',
                role: 'student',
                text: liveText,
                partial: true,
                final: false,
                language: languageResolution.displayLanguage,
                createdAt: new Date().toISOString(),
            });
            return next.slice(-10);
        });
    }, [isOpen, state, partialTranscript, draftTranscript, detectedLanguage]);

    useEffect(() => {
        if (!isOpen) return;
        if (state === 'listening') return;
        const finalStudent = (draftTranscript || '').trim();
        setTurns((prev) => prev.filter((turn) => turn.id !== 'student-live'));
        if (!finalStudent || finalStudent === lastStudentFinalRef.current) return;
        const languageResolution = resolveStudentTurnLanguage({
            detectedLanguage: detectedLanguage || null,
            previousStableLanguage: lastStableStudentLanguageRef.current,
        });
        lastStableStudentLanguageRef.current = languageResolution.nextStableLanguage;
        lastStudentFinalRef.current = finalStudent;
        setTurns((prev) => {
            const next = prev.concat({
                id: `student-${Date.now()}`,
                role: 'student',
                text: finalStudent,
                partial: false,
                final: true,
                language: languageResolution.displayLanguage,
                createdAt: new Date().toISOString(),
            });
            return next.slice(-10);
        });
    }, [isOpen, state, draftTranscript, detectedLanguage]);

    useEffect(() => {
        if (!isOpen) return;
        if (state !== 'speaking') {
            setTurns((prev) => prev.filter((turn) => turn.id !== 'assistant-live'));
            return;
        }
        const assistantLive = (typedAssistantTranscript || transcript || '').trim();
        if (!assistantLive) return;
        const assistantLanguage = resolveAssistantTurnLanguage({
            selectedLanguage: selectedLanguage || null,
            fallbackStudentLanguage: lastStableStudentLanguageRef.current,
        });
        setTurns((prev) => {
            const next = prev.filter((turn) => turn.id !== 'assistant-live');
            next.push({
                id: 'assistant-live',
                role: 'assistant',
                text: assistantLive,
                partial: true,
                final: false,
                language: assistantLanguage,
                createdAt: new Date().toISOString(),
            });
            return next.slice(-10);
        });
    }, [isOpen, state, typedAssistantTranscript, transcript, selectedLanguage]);

    useEffect(() => {
        if (!isOpen) return;
        if (state === 'speaking') return;
        const assistantFinal = (transcript || '').trim();
        if (!assistantFinal || assistantFinal === lastAssistantFinalRef.current) return;
        const assistantLanguage = resolveAssistantTurnLanguage({
            selectedLanguage: selectedLanguage || null,
            fallbackStudentLanguage: lastStableStudentLanguageRef.current,
        });
        lastAssistantFinalRef.current = assistantFinal;
        setTurns((prev) => {
            const withoutLive = prev.filter((turn) => turn.id !== 'assistant-live');
            withoutLive.push({
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: assistantFinal,
                partial: false,
                final: true,
                language: assistantLanguage,
                createdAt: new Date().toISOString(),
            });
            return withoutLive.slice(-10);
        });
    }, [isOpen, state, transcript, selectedLanguage]);

    useEffect(() => {
        if (!isOpen) return;
        if (interruptionState === 'none') return;
        const interruptedText = reconcileInterruptedAssistantText({
            fullTranscript: transcript,
            spokenChars: speechSpokenChars,
            typedAssistantTranscript,
        });
        if (!interruptedText) return;
        const assistantLanguage = resolveAssistantTurnLanguage({
            selectedLanguage: selectedLanguage || null,
            fallbackStudentLanguage: lastStableStudentLanguageRef.current,
        });
        setTurns((prev) => {
            const next = prev.filter((turn) => turn.id !== 'assistant-live');
            next.push({
                id: `assistant-interrupted-${Date.now()}`,
                role: 'assistant',
                text: interruptedText,
                partial: true,
                final: false,
                language: assistantLanguage,
                createdAt: new Date().toISOString(),
            });
            return next.slice(-10);
        });
    }, [interruptionState, isOpen, selectedLanguage, speechSpokenChars, transcript, typedAssistantTranscript]);

    useEffect(() => {
        const panel = transcriptRef.current;
        if (!panel) return;
        panel.scrollTop = panel.scrollHeight;
    }, [turns]);

    useEffect(() => {
        if (!isOpen) return;
        if (visualState === 'reconnecting') {
            setStatusNotice('Connection recovering...');
            return;
        }
        if (visualState === 'interrupted') {
            setStatusNotice('Interruption handled.');
            return;
        }
        if (visualState === 'error' && error) {
            setStatusNotice(error);
            return;
        }
        setStatusNotice('');
    }, [isOpen, visualState, error]);

    useEffect(() => {
        if (!isOpen) return;
        if (micPermissionState !== 'denied' || permissionEventEmittedRef.current) return;
        permissionEventEmittedRef.current = true;
        void api.quality.recordLearningEffectEvent({
            eventType: 'permission_denied',
            sessionId: sessionId || null,
            metadata: { module: 'voice_mode', source: 'voice_overlay' },
        }).catch(() => undefined);
    }, [isOpen, micPermissionState, sessionId]);

    useEffect(() => {
        if (!isOpen) return;
        if (!error || audioErrorEventEmittedRef.current) return;
        audioErrorEventEmittedRef.current = true;
        void api.quality.recordLearningEffectEvent({
            eventType: 'audio_failure',
            sessionId: sessionId || null,
            metadata: {
                module: 'voice_mode',
                message: error,
                state: runtimeState.currentVoiceState,
            },
        }).catch(() => undefined);
    }, [error, isOpen, runtimeState.currentVoiceState, sessionId]);

    useEffect(() => {
        if (!isOpen) return;
        if (interruptionState === 'none') return;
        void api.quality.recordLearningEffectEvent({
            eventType: 'interruptions',
            sessionId: sessionId || null,
            metadata: {
                module: 'voice_mode',
                interruptionState,
                voiceState: runtimeState.currentVoiceState,
            },
        }).catch(() => undefined);
    }, [interruptionState, isOpen, runtimeState.currentVoiceState, sessionId]);

    useEffect(() => {
        if (hesitationTimerRef.current) {
            clearTimeout(hesitationTimerRef.current);
            hesitationTimerRef.current = null;
        }
        if (!isOpen) return;
        if (runtimeState.currentVoiceState !== 'waiting_response') return;
        hesitationTimerRef.current = setTimeout(() => {
            const signalKey = `hesitation:${currentTopic}`;
            if (lastGrowthSignalKeyRef.current === signalKey) return;
            lastGrowthSignalKeyRef.current = signalKey;
            void api.quality.recordLearningEffectEvent({
                eventType: 'growth_signal_update',
                sessionId: sessionId || null,
                topic: currentTopic,
                metadata: {
                    source: 'voice_mode',
                    signal: 'topic_hesitation',
                },
            }).catch(() => undefined);
        }, 5200);
        return () => {
            if (hesitationTimerRef.current) {
                clearTimeout(hesitationTimerRef.current);
                hesitationTimerRef.current = null;
            }
        };
    }, [currentTopic, isOpen, runtimeState.currentVoiceState, sessionId]);

    useEffect(() => {
        if (!isOpen) return;
        const finalStudent = (draftTranscript || '').trim();
        if (finalStudent.length < 90) return;
        const signalKey = `oral_explain:${finalStudent.slice(0, 90)}`;
        if (lastGrowthSignalKeyRef.current === signalKey) return;
        lastGrowthSignalKeyRef.current = signalKey;
        void api.quality.recordLearningEffectEvent({
            eventType: 'growth_signal_update',
            sessionId: sessionId || null,
            topic: currentTopic,
            metadata: {
                source: 'voice_mode',
                signal: 'strong_oral_explanation',
                chars: finalStudent.length,
            },
        }).catch(() => undefined);
    }, [currentTopic, draftTranscript, isOpen, sessionId]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                discard();
                onClose?.();
                return;
            }
            if (event.key === ' ' && state === 'listening') {
                event.preventDefault();
                stop();
            }
        };
        document.addEventListener('keydown', handleKeydown);
        return () => document.removeEventListener('keydown', handleKeydown);
    }, [discard, isOpen, onClose, state, stop]);

    const handleClose = useCallback(
        (options?: { preserveSession?: boolean }) => {
            if (!options?.preserveSession) {
                discard();
            }
            onClose?.();
        },
        [discard, onClose]
    );

    const handlePrimaryAction = useCallback(() => {
        setIsPaused(false);
        if (state === 'listening') {
            stop();
            return;
        }
        if (state === 'speaking' && speechIsPlaying) {
            silence();
            return;
        }
        start();
    }, [silence, speechIsPlaying, start, state, stop]);

    const handlePause = useCallback(() => {
        if (!isPaused) {
            if (state === 'listening') {
                stop();
            } else if (state === 'speaking') {
                silence();
            }
            setIsPaused(true);
            return;
        }
        setIsPaused(false);
        if (state === 'idle') start();
    }, [isPaused, silence, start, state, stop]);

    const handleReplay = useCallback(() => {
        replayLast();
        setIsRecapPlayback(true);
        window.setTimeout(() => setIsRecapPlayback(false), 1800);
    }, [replayLast]);

    const handleSwitchToText = useCallback(() => {
        void api.quality.recordLearningEffectEvent({
            eventType: 'revision_handoff',
            sessionId: sessionId || null,
            metadata: {
                from: 'voice_mode',
                to: 'text_chat',
                voiceProfile: voiceBehaviorProfile,
            },
        }).catch(() => undefined);
        handleClose();
    }, [handleClose, sessionId, voiceBehaviorProfile]);

    const handleSaveRecap = useCallback(async () => {
        const source = (lastAssistantFinalRef.current || transcript || '').trim();
        if (!source) return;
        setRecapGenerationState('generating');
        setStatusNotice('Generating recap audio...');
        try {
            const result = await api.media.generateAudioRecap({
                recapText: source,
                title: `Voice recap: ${currentTopic}`,
                topic: currentTopic,
                sessionId: sessionId || undefined,
                language: selectedLanguage || undefined,
            });
            setRecapGenerationState('saved');
            setSavedRecapIds((prev) => {
                const next = result.asset?.id ? [result.asset.id, ...prev.filter((id) => id !== result.asset.id)] : prev;
                return next.slice(0, 8);
            });
            setStatusNotice(result.fallbackToText ? 'Recap saved as text recap.' : 'Recap audio saved to Media.');
            void api.quality.recordLearningEffectEvent({
                eventType: 'recap_generated',
                sessionId: sessionId || null,
                metadata: {
                    source: 'voice_mode',
                    fallbackToText: result.fallbackToText,
                    assetId: result.asset?.id || null,
                },
            }).catch(() => undefined);
            void api.quality.recordLearningEffectEvent({
                eventType: 'recap_saved',
                sessionId: sessionId || null,
                metadata: {
                    source: 'voice_mode',
                    assetId: result.asset?.id || null,
                },
            }).catch(() => undefined);
        } catch {
            setRecapGenerationState('error');
            setStatusNotice('Could not save recap right now.');
        }
    }, [currentTopic, selectedLanguage, sessionId, transcript]);

    const profileLabel = PROFILE_LABEL[runtimeState.voiceProfile] || 'Tutor Voice';
    const guidanceText = statusNotice || STATE_GUIDANCE[runtimeState.currentVoiceState];
    const stateLabel = STATE_LABEL[runtimeState.currentVoiceState];
    const languageLabel = runtimeState.selectedLanguage || runtimeState.detectedLanguage || 'auto';
    const canReplay = Boolean((lastAssistantFinalRef.current || transcript || '').trim());
    const canSaveRecap = canReplay && recapGenerationState !== 'generating';
    const isProcessing = state === 'initializing' || runtimeState.currentVoiceState === 'processing';

    if (!isOpen || !isMounted) return null;

    return createPortal(
        <div className={cn('voice-overlay-layer', className)}>
            <div className="voice-overlay-backdrop" onClick={() => handleClose({ preserveSession: state === 'speaking' })} />
            <div
                className={cn('voice-card', `voice-card-state-${runtimeState.currentVoiceState}`)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="voice-dialog-title"
                ref={dialogRef}
                tabIndex={-1}
            >
                <div className="voice-card-bg">
                    <div className="voice-nebula" />
                    <div className="voice-orbit-rings" />
                    <div className="voice-stars" />
                    <div className="voice-light-sweep" />
                </div>

                <div className="voice-card-content">
                    <header className="voice-context-bar">
                        <div className="voice-context-stack">
                            <p className="voice-mode-label">{profileLabel}</p>
                            <h2 id="voice-dialog-title" className="voice-work-title">
                                {currentTopic}
                            </h2>
                            <div className="voice-context-meta">
                                <span className="voice-state-pill">{stateLabel}</span>
                                <span className="voice-lang-pill">
                                    <Languages size={13} />
                                    {languageLabel}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="voice-close-btn"
                            onClick={() => handleClose({ preserveSession: state === 'speaking' })}
                            aria-label="Exit voice mode"
                        >
                            <X size={18} />
                        </Button>
                    </header>

                    <section className={cn('voice-orb-field', `voice-orb-field-${runtimeState.currentVoiceState}`)}>
                        <div className="voice-orb-shell">
                            <HeroOrb
                                active={runtimeState.currentVoiceState !== 'idle' && runtimeState.currentVoiceState !== 'ready'}
                                intensity={intensity}
                                state={runtimeState.currentVoiceState}
                            />
                        </div>
                        <p className="voice-orb-caption">{guidanceText}</p>
                    </section>

                    <section className="voice-transcript-zone">
                        <div ref={transcriptRef} className="voice-transcript-scroll" aria-live="polite" aria-atomic="false">
                            {turns.length === 0 ? (
                                <p className="voice-transcript-empty">Speak naturally. I will ask one question at a time.</p>
                            ) : (
                                turns.map((turn, index) => (
                                    <article
                                        key={turn.id}
                                        className={cn(
                                            'voice-turn',
                                            `voice-turn-${turn.role}`,
                                            turn.partial && 'voice-turn-partial',
                                            index < turns.length - 4 && 'voice-turn-faded'
                                        )}
                                    >
                                        <p className="voice-turn-label">{turn.role === 'student' ? 'You' : turn.role === 'assistant' ? 'Steadfast' : 'System'}</p>
                                        <p className="voice-turn-text">{turn.text}</p>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="voice-guidance-strip">
                        <p>{guidanceText}</p>
                    </section>

                    <footer className="voice-control-bar">
                        <div className="voice-control-row voice-control-row-primary">
                            <Button
                                type="button"
                                size="icon"
                                className={cn('voice-control-btn', 'voice-control-btn-primary', state === 'listening' && 'voice-control-btn-stop')}
                                onClick={handlePrimaryAction}
                                disabled={!isSupported || isProcessing}
                                aria-label={state === 'listening' ? 'Stop listening' : 'Start voice capture'}
                            >
                                {state === 'listening' ? <Square size={20} className="fill-current" /> : <Mic size={20} />}
                            </Button>

                            <Button
                                type="button"
                                size="icon"
                                className="voice-control-btn"
                                onClick={toggleMute}
                                aria-label={isMuted ? 'Unmute voice output' : 'Mute voice output'}
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </Button>

                            <Button
                                type="button"
                                size="icon"
                                className="voice-control-btn"
                                onClick={handlePause}
                                aria-label={isPaused ? 'Resume voice mode' : 'Pause voice mode'}
                            >
                                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                            </Button>

                            <Button
                                type="button"
                                size="icon"
                                className="voice-control-btn"
                                onClick={handleReplay}
                                disabled={!canReplay}
                                aria-label="Replay assistant response"
                            >
                                <MessageSquareReply size={18} />
                            </Button>

                            <Button
                                type="button"
                                size="icon"
                                className="voice-control-btn"
                                onClick={handleSaveRecap}
                                disabled={!canSaveRecap}
                                aria-label="Save recap"
                            >
                                {recapGenerationState === 'generating' ? <BookAudio size={18} className="voice-spin" /> : <Save size={18} />}
                            </Button>
                        </div>

                        <div className="voice-control-row voice-control-row-secondary">
                            <Button type="button" variant="ghost" size="sm" className="voice-text-switch-btn" onClick={handleSwitchToText}>
                                Switch to text
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="voice-end-btn" onClick={() => handleClose()}>
                                End session
                            </Button>
                        </div>
                    </footer>
                </div>
            </div>
        </div>,
        document.body
    );
};
