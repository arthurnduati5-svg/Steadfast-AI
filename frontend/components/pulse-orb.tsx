'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PulseOrbProps {
    state: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
}

export function PulseOrb({ state }: PulseOrbProps) {
    // Animation Variants
    // Blue palette based on school colors (hsl(207, 88%, 68%))
    const blueBase = "rgba(106, 179, 244, 1)"; // App primary blue equivalent
    const blueGlow = "rgba(106, 179, 244, 0.4)";
    const blueDeep = "rgba(59, 130, 246, 1)";
    const blueLight = "rgba(191, 219, 254, 1)";

    const coreVariants = {
        idle: {
            scale: [1, 1.05, 1],
            opacity: 0.8,
            boxShadow: `0px 0px 20px 5px ${blueGlow}`,
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
        },
        listening: {
            scale: [1, 1.25, 0.95, 1.1, 1],
            opacity: 1,
            boxShadow: `0px 0px 40px 10px ${blueGlow}`,
            transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const }
        },
        processing: {
            scale: 0.9,
            rotate: 360,
            borderRadius: ["50%", "40%", "50%"],
            boxShadow: `0px 0px 30px 5px ${blueGlow}`,
            transition: {
                rotate: { duration: 2, repeat: Infinity, ease: "linear" as const },
                borderRadius: { duration: 1, repeat: Infinity }
            }
        },
        speaking: {
            scale: [1, 1.15, 1],
            opacity: 1,
            boxShadow: [
                `0px 0px 20px 2px ${blueGlow}`,
                `0px 0px 60px 20px ${blueGlow}`,
                `0px 0px 20px 2px ${blueGlow}`
            ],
            transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const }
        },
        error: {
            scale: 1,
            backgroundColor: "#ef4444", // Red for error
            boxShadow: "0px 0px 20px 5px rgba(239, 68, 68, 0.5)",
        }
    };

    const ringVariants = {
        idle: { opacity: 0 },
        listening: {
            scale: [1, 2],
            opacity: [0.5, 0],
            transition: { duration: 1.5, repeat: Infinity, ease: "easeOut" as const }
        },
        processing: { opacity: 0 },
        speaking: {
            scale: [1, 1.5],
            opacity: [0.3, 0],
            transition: { duration: 2, repeat: Infinity, ease: "easeOut" as const, delay: 0.2 }
        },
        error: { opacity: 0 }
    };

    return (
        <div className="relative flex items-center justify-center w-64 h-64">
            {/* Background Radial Gradient */}
            <div className="absolute inset-0 bg-radial-gradient from-blue-500/10 to-transparent opacity-50 blur-3xl" />

            {/* Outer Ring Animation (Pulse) */}
            <motion.div
                className="absolute w-full h-full rounded-full border border-blue-400/30"
                variants={ringVariants}
                animate={state}
                initial="idle"
            />

            {/* Core Orb */}
            <motion.div
                className="w-32 h-32 rounded-full bg-blue-400 relative z-10"
                variants={coreVariants}
                animate={state}
                initial="idle"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${blueLight}, ${blueBase}, ${blueDeep})`,
                }}
            />
        </div>
    );
}
