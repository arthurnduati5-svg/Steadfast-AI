'use client';

import React from 'react';
import type { VoiceModeVisualState } from '@/lib/types';

interface HeroOrbProps {
  active?: boolean;
  intensity?: number;
  state?: VoiceModeVisualState;
  className?: string;
}

export function HeroOrb({ active = false, intensity = 0, state = 'idle', className }: HeroOrbProps) {
  const clamped = Math.min(1, Math.max(0, intensity));
  const pulseScale = 1 + clamped * 0.045;
  const pulseGlow = 0.18 + clamped * 0.58;
  const wobble = clamped * 0.75;

  return (
    <div
      className={`voice-orb-core${active ? ' voice-orb-core-active' : ''} voice-orb-${state} ${className || ''}`}
      style={{
        ['--orb-pulse-scale' as any]: pulseScale.toFixed(3),
        ['--orb-pulse-glow' as any]: pulseGlow.toFixed(2),
        ['--orb-intensity' as any]: clamped.toFixed(3),
        ['--orb-wobble' as any]: wobble.toFixed(3),
      }}
    >
      <span className="voice-orb-aura" aria-hidden="true" />
      <span className="voice-orb-wave-ring voice-orb-wave-ring-a" aria-hidden="true" />
      <span className="voice-orb-wave-ring voice-orb-wave-ring-b" aria-hidden="true" />
      <span className="voice-orb-ripple" aria-hidden="true" />
      <span className="voice-orb-nucleus" aria-hidden="true" />
      <span className="voice-orb-signal-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
