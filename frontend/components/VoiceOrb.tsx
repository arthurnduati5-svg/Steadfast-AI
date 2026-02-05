'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";

type VoiceOrbProps = {
    size?: number;                 // canvas size in px
    listening?: boolean;           // if false, idle only
    colors?: string[];             // gradient palette
    className?: string;
    showStatus?: boolean;
};

type AudioState =
    | { status: "idle"; amplitude: number }
    | { status: "listening"; amplitude: number }
    | { status: "no-mic"; amplitude: number }
    | { status: "error"; amplitude: number; error: string };

export default function VoiceOrb({
    size = 280,
    listening = true,
    colors,
    className,
    showStatus = false,
}: VoiceOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const timeDataRef = useRef<Uint8Array | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [audio, setAudio] = useState<AudioState>({
        status: listening ? "idle" : "idle",
        amplitude: 0.08,
    });

    // Helper to read CSS variable and ensure valid color format
    const getCssVar = (name: string) => {
        if (typeof window !== 'undefined') {
            const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
            // Check if it's a Shadcn/Tailwind HSL channel value (e.g. "210 100% 50%")
            if (val && val.match(/^\d+(\s|,\s?)\d+%(\s|,\s?)\d+%$/)) {
                return `hsl(${val.replace(/ /g, ',')})`;
            }
            if (val && val.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/)) {
                return `hsl(${val})`;
            }
            return val;
        }
        return '';
    };

    const palette = useMemo(() => {
        if (colors && colors.length > 0) return colors;

        // Attempt to read from CSS variables or fallback
        // We wrap these in our smarter parser
        const p = [
            getCssVar('--primary') || "#00A4FF",
            getCssVar('--ring') || "#3B82F6", // Ring is often a nice accent in shadcn
            "#7C3AED",
            "#00E6C3"
        ];
        // Filter out empty strings if any
        return p.filter(Boolean);
    }, [colors]);

    useEffect(() => {
        let isMounted = true;

        async function initMic() {
            if (!listening) {
                setAudio({ status: "idle", amplitude: 0.08 });
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!isMounted) return;

                streamRef.current = stream;

                const Ctx = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new Ctx() as AudioContext;
                audioCtxRef.current = audioCtx;

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 1024;
                analyser.smoothingTimeConstant = 0.85;
                analyserRef.current = analyser;

                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                timeDataRef.current = new Uint8Array(analyser.frequencyBinCount);

                setAudio({ status: "listening", amplitude: 0.08 });
            } catch (e) {
                // No mic permission or no device, run idle animation anyway.
                console.warn("VoiceOrb mic access failed or denied:", e);
                setAudio({
                    status: "no-mic",
                    amplitude: 0.08,
                });
            }
        }

        initMic();

        return () => {
            isMounted = false;

            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => { });
                audioCtxRef.current = null;
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }

            analyserRef.current = null;
            timeDataRef.current = null;
        };
    }, [listening]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(size * dpr);
        canvas.height = Math.floor(size * dpr);
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cx = size / 2;
        const cy = size / 2;

        // Basic “blob” controls
        const baseRadius = size * 0.18; // Reduced from 0.22 to fit better
        const points = 90;

        // Motion smoothing for amplitude, prevents jitter
        let smoothAmp = 0.08;

        function clamp(n: number, min: number, max: number) {
            return Math.max(min, Math.min(max, n));
        }

        function getAmplitude(): number {
            if (!listening) return 0.08;

            const analyser = analyserRef.current;
            const data = timeDataRef.current;
            if (!analyser || !data) return 0.08;

            analyser.getByteTimeDomainData(data as any);

            // RMS amplitude from waveform
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128;
                sum += v * v;
            }
            const rms = Math.sqrt(sum / data.length);

            // Scale and clamp to a visually useful range
            return clamp(rms * 2.2, 0.06, 1);
        }

        // “Noise” without dependencies: layered sines with time offsets
        function edgeNoise(angle: number, t: number): number {
            const n1 = Math.sin(angle * 3 + t * 1.2);
            const n2 = Math.sin(angle * 7 - t * 0.9);
            const n3 = Math.sin(angle * 11 + t * 0.6);
            return (n1 * 0.55 + n2 * 0.3 + n3 * 0.15);
        }

        function draw(nowMs: number) {
            if (!ctx) return; // Guard clause for TypeScript safety

            const t = nowMs / 1000;

            const amp = getAmplitude();

            // Attack fast, release slower (feels “voice mode”)
            const attack = 0.22;
            const release = 0.08;
            const rate = amp > smoothAmp ? attack : release;
            smoothAmp = smoothAmp + (amp - smoothAmp) * rate;

            const idlePulse = 0.5 + 0.5 * Math.sin(t * 1.1);
            const radius = baseRadius * (1 + smoothAmp * 0.6 + idlePulse * 0.05);

            const wobble = 0.08 + smoothAmp * 0.55;
            const glow = 16 + smoothAmp * 55;

            ctx.clearRect(0, 0, size, size);

            // Additive blending gives that luminous feel
            ctx.save();
            ctx.globalCompositeOperation = "lighter";

            // Multiple passes for depth
            for (let layer = 0; layer < 3; layer++) {
                const layerScale = 1 + layer * 0.085;
                const layerAlpha = 0.18 - layer * 0.04;

                const g = ctx.createRadialGradient(
                    cx,
                    cy,
                    radius * 0.2,
                    cx,
                    cy,
                    radius * 2.35
                );

                const last = palette.length - 1;
                for (let i = 0; i < palette.length; i++) {
                    g.addColorStop(i / last, palette[i]);
                }

                ctx.globalAlpha = layerAlpha;
                ctx.fillStyle = g;

                ctx.filter = `blur(${glow}px)`;

                ctx.beginPath();
                for (let i = 0; i <= points; i++) {
                    const a = (i / points) * Math.PI * 2;
                    const nx = Math.cos(a);
                    const ny = Math.sin(a);

                    const n = edgeNoise(a, t + layer * 0.35) * wobble;
                    const rr = radius * layerScale * (1 + n);

                    const x = cx + nx * rr;
                    const y = cy + ny * rr;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();

            // Inner “expensive” core highlight
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.filter = "blur(6px)";
            const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.2);
            core.addColorStop(0, "rgba(255,255,255,0.35)");
            core.addColorStop(0.35, "rgba(255,255,255,0.12)");
            core.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.95, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            // ctx is local to effect, but canvas transform reset might be needed if shared canvas (unlikely here)
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
        };
    }, [size, listening, palette]);

    return (
        <div className={className} style={{ display: "grid", placeItems: "center" }}>
            <canvas
                ref={canvasRef}
                aria-label="Voice activity orb"
                role="img"
            />
            {showStatus && (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                    {audio.status === "listening" && "Listening"}
                    {audio.status === "no-mic" && "Mic not available, idle mode"}
                    {audio.status === "idle" && "Idle"}
                    {audio.status === "error" && audio.error}
                </div>
            )}
        </div>
    );
}
// Tune visual intensity by adjusting:
// 1. baseRadius (size * 0.22) - size of the blob
// 2. clamp range in getAmplitude - currently 0.06 to 1
// 3. glow calculation (16 + smoothAmp * 55) - blur amount
// 4. wobble factor (0.08 + smoothAmp * 0.55) - edge distortion
