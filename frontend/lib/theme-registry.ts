'use client';

export type ThemeId =
  | 'steadfast-default'
  | 'midnight-scholar'
  | 'soft-paper'
  | 'rose-studio'
  | 'ember-focus'
  | 'violet-library'
  | 'ocean-glass'
  | 'calm-forest';

export type ThemeTone = 'dark' | 'light' | 'neutral' | 'warm' | 'cool';

export interface ThemeEntry {
  id: ThemeId;
  label: string;
  tone: ThemeTone;
  description: string;
  isAvailable: boolean;
  futureFlag?: string;
}

export const THEMES: ThemeEntry[] = [
  {
    id: 'steadfast-default',
    label: 'Steadfast Default',
    tone: 'neutral',
    description: 'Balanced light/dark with blue-accent — the current production theme.',
    isAvailable: true,
  },
  {
    id: 'midnight-scholar',
    label: 'Midnight Scholar',
    tone: 'dark',
    description: 'Deep navy background with gold accents — focused, late-night study feel.',
    isAvailable: false,
    futureFlag: 'theme:midnight-scholar',
  },
  {
    id: 'soft-paper',
    label: 'Soft Paper',
    tone: 'light',
    description: 'Warm cream background with soft brown text — reading-friendly atmosphere.',
    isAvailable: false,
    futureFlag: 'theme:soft-paper',
  },
  {
    id: 'rose-studio',
    label: 'Rose Studio',
    tone: 'warm',
    description: 'Gentle rose and coral accents on a light surface — creative, inviting.',
    isAvailable: false,
    futureFlag: 'theme:rose-studio',
  },
  {
    id: 'ember-focus',
    label: 'Ember Focus',
    tone: 'warm',
    description: 'Deep charcoal with amber and rust highlights — high-contrast focus mode.',
    isAvailable: false,
    futureFlag: 'theme:ember-focus',
  },
  {
    id: 'violet-library',
    label: 'Violet Library',
    tone: 'cool',
    description: 'Muted violet and indigo tones — calm, reflective study environment.',
    isAvailable: false,
    futureFlag: 'theme:violet-library',
  },
  {
    id: 'ocean-glass',
    label: 'Ocean Glass',
    tone: 'cool',
    description: 'Teal and aqua on a dark glass surface — modern, immersive.',
    isAvailable: false,
    futureFlag: 'theme:ocean-glass',
  },
  {
    id: 'calm-forest',
    label: 'Calm Forest',
    tone: 'neutral',
    description: 'Earthy greens and warm neutrals — nature-inspired, grounding.',
    isAvailable: false,
    futureFlag: 'theme:calm-forest',
  },
];

const themeMap = new Map<ThemeId, ThemeEntry>(THEMES.map((t) => [t.id, t]));

export function getThemeEntry(id: ThemeId): ThemeEntry | undefined {
  return themeMap.get(id);
}

export function getAvailableThemes(): ThemeEntry[] {
  return THEMES.filter((t) => t.isAvailable);
}

export function isValidThemeId(id: string): id is ThemeId {
  return themeMap.has(id as ThemeId);
}
