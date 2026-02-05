'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, X, Settings, Volume2, VolumeX } from 'lucide-react';
import { PulseOrb } from './pulse-orb';
import { getMockAuthToken } from '@/lib/mock-auth';
import { getAssistantResponse } from '@/app/actions';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceConciergeProps {
    onClose: () => void;
    // Callback to sync messages back to main chat
    onMessageCompleted?: (userMsg: Message, aiMsg: Message) => void;
    sessionId?: string; // Add sessionId prop
}

export const VoiceConcierge: React.FC<VoiceConciergeProps> = ({
    onClose,
    onMessageCompleted,
    sessionId
}) => {
    const [state, setState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState('');
    const [aiResponseText, setAiResponseText] = useState('');
    const [displayText, setDisplayText] = useState(''); // For typewriter effect
    const [timer, setTimer] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const messagesRef = useRef<Message[]>([]); // Keep local history for context via Ref
    const typeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling response box
    const audioRef = useRef<HTMLAudioElement | null>(null); // Ref for playing audio
    const abortControllerRef = useRef<AbortController | null>(null); // Ref for cancelling requests
    const audioQueueRef = useRef<string[]>([]); // Queue for base64 audio chunks
    const isPlayingQueueRef = useRef(false); // Flag to track queue playback

    const { toast } = useToast();

    // Helper to stop everything and prevent collisions
    const cleanupRequests = useCallback(() => {
        // 1. Abort pending fetch requests (STT/TTS)
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // 2. Stop current audio playback
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        // 3. Clear typewriter intervals
        if (typeIntervalRef.current) {
            clearInterval(typeIntervalRef.current);
            typeIntervalRef.current = null;
        }

        // 4. Clear visual state
        setDisplayText('');
        setAiResponseText('');
        setTranscript('');

        // 5. Clear audio queue
        audioQueueRef.current = [];
        isPlayingQueueRef.current = false;
    }, []);

    // Typewriter effect logic
    useEffect(() => {
        if (state === 'speaking' && aiResponseText) {
            setDisplayText('');
            let i = 0;
            if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);

            typeIntervalRef.current = setInterval(() => {
                setDisplayText((prev) => aiResponseText.slice(0, i + 1));
                i++;
                if (i >= aiResponseText.length) {
                    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
                }
            }, 20); // 20ms per character for a snappier feel
        } else if (state !== 'speaking') {
            setDisplayText('');
            if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
        }
    }, [state, aiResponseText]);

    // Sync mute state with current audio
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
            if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const startTimer = () => {
        setTimer(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Auto-scroll to bottom as text types
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (state === 'speaking') {
            scrollToBottom();
        }
    }, [displayText, state]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartListening = async () => {
        try {
            cleanupRequests(); // stop any current playback/processing

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const audioChunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                processAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setState('listening');
            startTimer();
        } catch (error) {
            console.error('Mic access denied:', error);
            setState('error');
            setAiResponseText("Please enable microphone access in your browser.");
        }
    };

    const handleStopListening = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            stopTimer();
            setState('processing');
        }
    };

    const handleCancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = null; // Prevent processing
            mediaRecorderRef.current.stop();
            const tracks = mediaRecorderRef.current.stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        stopTimer();
        setTimer(0);
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setState('idle');
    };

    const processAudio = async (audioBlob: Blob) => {
        try {
            // New interaction cycle starts
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            // 1. Get Token (Mock Auth Fallback)
            let token = localStorage.getItem('token');
            if (!token) {
                try {
                    token = await getMockAuthToken();
                } catch (e) {
                    console.error('Failed to get mock token', e);
                }
            }

            if (!token) throw new Error("Authentication failed");

            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('sessionId', sessionId || 'student_session');
            formData.append('conversationState', JSON.stringify({})); // Fallback

            const response = await fetch('/api/copilot/voice-chat', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
                signal
            });

            if (!response.body) throw new Error("No response body");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedAiText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'transcription') {
                                setTranscript(data.content);
                            } else if (data.type === 'token') {
                                accumulatedAiText += data.content;
                                setAiResponseText(accumulatedAiText); // Update typewriter source
                                if (state !== 'speaking' && state !== 'processing') setState('speaking');
                            } else if (data.type === 'audio') {
                                audioQueueRef.current.push(data.content);
                                if (!isPlayingQueueRef.current) {
                                    playNextInQueue();
                                }
                            } else if (data.type === 'done') {
                                // Final state sync if needed
                                console.log('[Voice] Stream Complete');
                            }
                        } catch (e) {
                            console.warn("Error parsing stream line", e);
                        }
                    }
                }
            }
            return;

        } catch (error: any) {
            console.error("Processing error:", error);
            setState('error');
            setAiResponseText("I encountered an issue. Let's try again in a moment.");
        }
    };

    const playNextInQueue = async () => {
        if (audioQueueRef.current.length === 0) {
            isPlayingQueueRef.current = false;
            // Only go back to idle if we're not waiting for more chunks
            // But usually 'done' event will handle the final transition
            return;
        }

        isPlayingQueueRef.current = true;
        const base64 = audioQueueRef.current.shift();
        if (!base64) return;

        try {
            const blob = await (await fetch(`data:audio/mp3;base64,${base64}`)).blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.muted = isMuted;

            audio.onended = () => {
                URL.revokeObjectURL(url);
                playNextInQueue();
            };

            setState('speaking');
            await audio.play();
        } catch (e) {
            console.error("Queue Playback Error", e);
            playNextInQueue();
        }
    };

    return (
        <div className="flex flex-col items-center justify-between w-full h-full p-6 text-center bg-[#0B1A2A] text-white overflow-hidden">
            {/* Header/Close */}
            <div className="w-full flex justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10 text-white/50 hover:text-red-400 hover:bg-white/10"
                    onClick={() => {
                        handleCancelRecording();
                        onClose();
                    }}
                >
                    <X size={20} />
                </Button>
            </div>

            {/* Top Status Area - Student Focused Persona */}
            <div className="flex flex-col items-center min-h-[50px] mt-2">
                <h2 className={cn("text-2xl font-playfair transition-all duration-500",
                    state === 'processing' ? 'animate-pulse text-primary' : 'text-white'
                )}>
                    {state === 'idle' && "How can I help you study today?"}
                    {state === 'listening' && "Listening to you..."}
                    {state === 'processing' && "Thinking about your question..."}
                    {state === 'speaking' && "Here's what I found..."}
                    {state === 'error' && "Oops! Something went wrong."}
                </h2>

                <p className="mt-2 text-sm text-gray-400 font-ptsans max-w-sm line-clamp-2 min-h-[1.5em]">
                    {state === 'idle' && "Tap the mic when you're ready to talk."}
                    {state === 'listening' && formatTime(timer)}
                    {(state === 'processing' || state === 'speaking') && transcript ? `"${transcript}"` : ""}
                    {state === 'error' && aiResponseText}
                </p>
            </div>

            {/* Hero Area: Orb (Compact for Chat Overlay) */}
            <div className="flex-1 flex items-center justify-center w-full min-h-[220px]">
                <div className="scale-75 origin-center">
                    <PulseOrb state={state} />
                </div>
            </div>

            {/* Response Preview with Typewriter Effect */}
            <div className="flex-1 flex items-center justify-center w-full max-h-[120px] px-4">
                <AnimatePresence>
                    {state === 'speaking' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="bg-white/5 rounded-xl border border-primary/20 backdrop-blur-md max-w-lg w-full shadow-lg h-full flex flex-col overflow-hidden"
                        >
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent text-left"
                            >
                                <p className="text-primary text-base font-playfair leading-relaxed">
                                    {displayText}
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="inline-block w-1 h-4 bg-primary ml-1 align-middle"
                                    />
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 mb-6 mt-4 w-full px-8">
                <div className="flex items-center justify-center gap-6 w-full">
                    {state === 'listening' ? (
                        <Button
                            size="lg"
                            onClick={handleStopListening}
                            className="rounded-full px-8 bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                        >
                            <Square className="h-5 w-5 mr-2 fill-current" /> Stop
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            disabled={state === 'processing' || state === 'speaking'}
                            onClick={handleStartListening}
                            className={cn(
                                "h-16 w-16 rounded-full shadow-2xl transition-all duration-300 bg-primary hover:bg-primary/90 hover:scale-105"
                            )}
                        >
                            <Mic className="h-8 w-8" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-gray-400 hover:text-primary transition-colors h-10 w-10"
                    >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
