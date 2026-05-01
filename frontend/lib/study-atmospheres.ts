'use client';

import type { CSSProperties } from 'react';
import type { CopilotTheme } from './copilot-theme';
import type {
  FullscreenModeFlags,
  FullscreenStudyMode,
  StudyAtmosphereId,
  StudyAtmospherePreference,
} from './types';

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

type AtmosphereTone = {
  appBg: string;
  shellBg: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
};

export type StudyAtmospherePreset = {
  id: StudyAtmosphereId;
  name: string;
  moodLine: string;
  description: string;
  baseColor: string;
  light: AtmosphereTone;
  dark: AtmosphereTone;
};

export type AdvancedAtmosphereSwatch = {
  id:
    | 'blue'
    | 'sky'
    | 'teal'
    | 'emerald'
    | 'violet'
    | 'plum'
    | 'rose'
    | 'peach'
    | 'amber'
    | 'slate';
  label: string;
  color: string;
};

export const DEFAULT_STUDY_ATMOSPHERE_ID: StudyAtmosphereId = 'midnight_scholar';

export const DEFAULT_STUDY_ATMOSPHERE_PREFERENCE: StudyAtmospherePreference = {
  presetId: DEFAULT_STUDY_ATMOSPHERE_ID,
  useAdvanced: false,
  customBaseColor: null,
};

export const ADVANCED_STUDY_ATMOSPHERE_SWATCHES: AdvancedAtmosphereSwatch[] = [
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'sky', label: 'Sky', color: '#0ea5e9' },
  { id: 'teal', label: 'Teal', color: '#0f766e' },
  { id: 'emerald', label: 'Emerald', color: '#059669' },
  { id: 'violet', label: 'Violet', color: '#7c3aed' },
  { id: 'plum', label: 'Plum', color: '#7e22ce' },
  { id: 'rose', label: 'Rose', color: '#e11d48' },
  { id: 'peach', label: 'Peach', color: '#f97316' },
  { id: 'amber', label: 'Amber', color: '#d97706' },
  { id: 'slate', label: 'Slate', color: '#334155' },
];

export const STUDY_ATMOSPHERE_PRESETS: StudyAtmospherePreset[] = [
  {
    id: 'midnight_scholar',
    name: 'Midnight Scholar',
    moodLine: 'Calm, deep, and focused',
    description: 'Deep navy surfaces with cool steel accents for deliberate study.',
    baseColor: '#3b82f6',
    light: {
      appBg: '#f5f8ff',
      shellBg: '#edf3ff',
      surface: '#ffffff',
      surfaceMuted: '#f1f5ff',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textTertiary: '#64748b',
    },
    dark: {
      appBg: '#0b1220',
      shellBg: '#111a2f',
      surface: '#121e34',
      surfaceMuted: '#18253d',
      textPrimary: '#e8efff',
      textSecondary: '#c3d0ec',
      textTertiary: '#8ea0c3',
    },
  },
  {
    id: 'soft_paper',
    name: 'Soft Paper',
    moodLine: 'Warm, clear, and easy on the eyes',
    description: 'Paper-like ivory tones with calm academic contrast.',
    baseColor: '#4f78c7',
    light: {
      appBg: '#f8f5ee',
      shellBg: '#f3eee3',
      surface: '#fffdf9',
      surfaceMuted: '#f6f2e9',
      textPrimary: '#1f2937',
      textSecondary: '#4b5563',
      textTertiary: '#6b7280',
    },
    dark: {
      appBg: '#1b1814',
      shellBg: '#241f19',
      surface: '#2a241d',
      surfaceMuted: '#312a22',
      textPrimary: '#f7f2e8',
      textSecondary: '#e6dcc8',
      textTertiary: '#b7a994',
    },
  },
  {
    id: 'rose_studio',
    name: 'Rose Studio',
    moodLine: 'Soft, refined, and personal',
    description: 'Dusty rose and mauve undertones with elegant warmth.',
    baseColor: '#c2557e',
    light: {
      appBg: '#fdf5f9',
      shellBg: '#f8ebf2',
      surface: '#fffafb',
      surfaceMuted: '#f8edf3',
      textPrimary: '#2b1d2a',
      textSecondary: '#5a4357',
      textTertiary: '#7d647b',
    },
    dark: {
      appBg: '#20161e',
      shellBg: '#291d27',
      surface: '#31232f',
      surfaceMuted: '#3a2a38',
      textPrimary: '#f8e9f3',
      textSecondary: '#e4cbd9',
      textTertiary: '#b691aa',
    },
  },
  {
    id: 'forest_calm',
    name: 'Forest Calm',
    moodLine: 'Grounded, quiet, and low-stress',
    description: 'Moss and sage balance for steady, low-friction learning.',
    baseColor: '#2f8d67',
    light: {
      appBg: '#f3f8f4',
      shellBg: '#eaf3eb',
      surface: '#fcfffd',
      surfaceMuted: '#edf6ef',
      textPrimary: '#11231a',
      textSecondary: '#2f4b3e',
      textTertiary: '#5c7a6c',
    },
    dark: {
      appBg: '#0f1c16',
      shellBg: '#14261e',
      surface: '#183026',
      surfaceMuted: '#1f3a2e',
      textPrimary: '#e3f4ec',
      textSecondary: '#c3e2d3',
      textTertiary: '#86af9b',
    },
  },
  {
    id: 'violet_library',
    name: 'Violet Library',
    moodLine: 'Rich, reflective, and elegant',
    description: 'Ink-violet tones made for reading, reflection, and retention.',
    baseColor: '#7b5ad9',
    light: {
      appBg: '#f7f4ff',
      shellBg: '#efeaff',
      surface: '#fcfbff',
      surfaceMuted: '#f0ebff',
      textPrimary: '#1f1534',
      textSecondary: '#44365f',
      textTertiary: '#6d5f8a',
    },
    dark: {
      appBg: '#151224',
      shellBg: '#1d1730',
      surface: '#241d3b',
      surfaceMuted: '#2d2448',
      textPrimary: '#efe9ff',
      textSecondary: '#d2c6f1',
      textTertiary: '#9f8fc7',
    },
  },
  {
    id: 'ember_focus',
    name: 'Ember Focus',
    moodLine: 'Warm, sharp, and exam-ready',
    description: 'Disciplined charcoal with restrained amber emphasis.',
    baseColor: '#c7772f',
    light: {
      appBg: '#fbf6ef',
      shellBg: '#f3eadc',
      surface: '#fffdf9',
      surfaceMuted: '#f7eee1',
      textPrimary: '#231a12',
      textSecondary: '#4a3c2f',
      textTertiary: '#766454',
    },
    dark: {
      appBg: '#17120e',
      shellBg: '#201711',
      surface: '#281d16',
      surfaceMuted: '#33251b',
      textPrimary: '#faeee0',
      textSecondary: '#e4d0b5',
      textTertiary: '#b89673',
    },
  },
  {
    id: 'ocean_glass',
    name: 'Ocean Glass',
    moodLine: 'Fresh, smooth, and modern',
    description: 'Blue-teal slate tones with clean sea-glass accents.',
    baseColor: '#1787a6',
    light: {
      appBg: '#f2fbfd',
      shellBg: '#e5f5f9',
      surface: '#fbfeff',
      surfaceMuted: '#eaf5f8',
      textPrimary: '#102531',
      textSecondary: '#335064',
      textTertiary: '#5d7c8f',
    },
    dark: {
      appBg: '#0c1a22',
      shellBg: '#112430',
      surface: '#15303d',
      surfaceMuted: '#1a3948',
      textPrimary: '#e4f3f8',
      textSecondary: '#c3dee8',
      textTertiary: '#89aebb',
    },
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isValidAtmosphereId = (value: unknown): value is StudyAtmosphereId =>
  STUDY_ATMOSPHERE_PRESETS.some((preset) => preset.id === value);

const normalizeHue = (value: number) => ((value % 360) + 360) % 360;

const rgbToHex = (rgb: RGB) =>
  `#${[rgb.r, rgb.g, rgb.b].map((part) => clamp(Math.round(part), 0, 255).toString(16).padStart(2, '0')).join('')}`;

const parseHexColor = (hex: string): RGB | null => {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  const raw = normalized.slice(1);
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map((part) => `${part}${part}`)
          .join('')
      : raw;
  const int = Number.parseInt(expanded, 16);
  if (!Number.isFinite(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const withAlpha = (color: string, alpha: number): string => {
  const rgb = parseHexColor(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1).toFixed(3)})`;
};

const mixColors = (a: string, b: string, amount: number): string => {
  const rgbA = parseHexColor(a);
  const rgbB = parseHexColor(b);
  if (!rgbA || !rgbB) return a;
  const t = clamp(amount, 0, 1);
  return rgbToHex({
    r: rgbA.r + (rgbB.r - rgbA.r) * t,
    g: rgbA.g + (rgbB.g - rgbA.g) * t,
    b: rgbA.b + (rgbB.b - rgbA.b) * t,
  });
};

const rgbToHsl = (rgb: RGB): HSL => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;

  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
  }

  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return {
    h: normalizeHue(hue),
    s: saturation * 100,
    l: lightness * 100,
  };
};

const hslToRgb = (hsl: HSL): RGB => {
  const h = normalizeHue(hsl.h);
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  };
};

const toHslTriplet = (hex: string): string => {
  const rgb = parseHexColor(hex);
  if (!rgb) return '210 20% 50%';
  const hsl = rgbToHsl(rgb);
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
};

const relativeLuminance = (hex: string): number => {
  const rgb = parseHexColor(hex);
  if (!rgb) return 0;
  const convert = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const r = convert(rgb.r);
  const g = convert(rgb.g);
  const b = convert(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (a: string, b: string): number => {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const pickReadableOnFill = (fillColor: string): string => {
  const whiteContrast = contrastRatio(fillColor, '#ffffff');
  const darkContrast = contrastRatio(fillColor, '#0f172a');
  return whiteContrast >= darkContrast ? '#ffffff' : '#0f172a';
};

const getPresetById = (id: StudyAtmosphereId): StudyAtmospherePreset =>
  STUDY_ATMOSPHERE_PRESETS.find((preset) => preset.id === id) ||
  STUDY_ATMOSPHERE_PRESETS[0];

export function normalizeHexColor(raw: unknown): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  const withHash = value.startsWith('#') ? value : `#${value}`;
  if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(withHash)) return null;
  if (withHash.length === 4) {
    const [_, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return withHash.toLowerCase();
}

export function normalizeStudyAtmospherePreference(raw: unknown): StudyAtmospherePreference {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_STUDY_ATMOSPHERE_PREFERENCE };
  }
  const candidate = raw as Partial<StudyAtmospherePreference>;
  const presetId = isValidAtmosphereId(candidate.presetId)
    ? candidate.presetId
    : DEFAULT_STUDY_ATMOSPHERE_ID;
  const useAdvanced = Boolean(candidate.useAdvanced);
  const customBaseColor = normalizeHexColor(candidate.customBaseColor) || null;
  return {
    presetId,
    useAdvanced,
    customBaseColor,
  };
}

export function areStudyAtmospherePreferencesEqual(
  a: StudyAtmospherePreference,
  b: StudyAtmospherePreference
): boolean {
  const left = normalizeStudyAtmospherePreference(a);
  const right = normalizeStudyAtmospherePreference(b);
  return (
    left.presetId === right.presetId &&
    left.useAdvanced === right.useAdvanced &&
    (left.customBaseColor || null) === (right.customBaseColor || null)
  );
}

const getAccentByPreference = (preference: StudyAtmospherePreference): string => {
  const preset = getPresetById(preference.presetId);
  if (preference.useAdvanced) {
    const candidate = normalizeHexColor(preference.customBaseColor);
    if (candidate) return candidate;
  }
  return preset.baseColor;
};

const resolveModeFlags = (
  studyMode?: FullscreenStudyMode,
  modeFlags?: Partial<FullscreenModeFlags>
): { focus: boolean; exam: boolean } => ({
  focus: modeFlags?.focus === true || studyMode === 'focus',
  exam: modeFlags?.exam === true || studyMode === 'exam',
});

const resolveAccentForMode = (
  accentHex: string,
  colorMode: CopilotTheme,
  modeState: { focus: boolean; exam: boolean }
): string => {
  const rgb = parseHexColor(accentHex);
  if (!rgb) return accentHex;
  const hsl = rgbToHsl(rgb);
  const isHybridMode = modeState.focus && modeState.exam;
  const saturationScale =
    isHybridMode
      ? 0.84
      : modeState.focus
      ? 0.76
      : modeState.exam
        ? 0.96
        : colorMode === 'dark'
          ? 0.88
          : 0.9;
  const lightnessTarget = colorMode === 'dark'
    ? (isHybridMode ? 61 : modeState.exam ? 66 : modeState.focus ? 58 : 62)
    : (isHybridMode ? 45 : modeState.exam ? 42 : modeState.focus ? 48 : 45);
  const adjusted: HSL = {
    h: hsl.h,
    s: clamp(hsl.s * saturationScale, colorMode === 'dark' ? 30 : 24, colorMode === 'dark' ? 82 : 78),
    l: clamp(lightnessTarget + (hsl.l - 50) * 0.28, colorMode === 'dark' ? 52 : 34, colorMode === 'dark' ? 74 : 58),
  };
  return rgbToHex(hslToRgb(adjusted));
};

export function buildStudyAtmosphereStyle(args: {
  atmosphere: StudyAtmospherePreference;
  colorMode: CopilotTheme;
  studyMode?: FullscreenStudyMode;
  modeFlags?: Partial<FullscreenModeFlags>;
}): CSSProperties {
  const atmosphere = normalizeStudyAtmospherePreference(args.atmosphere);
  const preset = getPresetById(atmosphere.presetId);
  const colorMode: CopilotTheme = args.colorMode === 'dark' ? 'dark' : 'light';
  const modeState = resolveModeFlags(args.studyMode || 'standard', args.modeFlags);
  const isFocusMode = modeState.focus;
  const isExamMode = modeState.exam;
  const neutral = colorMode === 'dark' ? preset.dark : preset.light;

  const baseAccent = getAccentByPreference(atmosphere);
  const accentPrimary = resolveAccentForMode(baseAccent, colorMode, modeState);
  const accentPrimaryHover = mixColors(accentPrimary, '#ffffff', colorMode === 'dark' ? 0.11 : 0.07);
  const accentPrimaryActive = mixColors(accentPrimary, '#0f172a', colorMode === 'dark' ? 0.22 : 0.16);
  const accentSoft = withAlpha(
    accentPrimary,
    colorMode === 'dark'
      ? isFocusMode
        ? 0.16
        : isExamMode
          ? 0.24
          : 0.22
      : isFocusMode
        ? 0.1
        : isExamMode
          ? 0.16
          : 0.14
  );
  const accentSoftHover = withAlpha(
    accentPrimary,
    colorMode === 'dark'
      ? isFocusMode
        ? 0.24
        : isExamMode
          ? 0.36
          : 0.32
      : isFocusMode
        ? 0.15
        : isExamMode
          ? 0.24
          : 0.2
  );
  const accentBorder = withAlpha(
    accentPrimary,
    colorMode === 'dark'
      ? isExamMode
        ? 0.6
        : 0.52
      : isExamMode
        ? 0.46
        : 0.38
  );
  const accentFocusRing = withAlpha(
    accentPrimary,
    colorMode === 'dark'
      ? isExamMode
        ? 0.62
        : 0.55
      : isExamMode
        ? 0.46
        : 0.38
  );
  const accentMutedIcon = withAlpha(accentPrimary, colorMode === 'dark' ? 0.8 : 0.74);
  const accentText = mixColors(accentPrimary, colorMode === 'dark' ? '#eff6ff' : '#0f172a', colorMode === 'dark' ? 0.36 : 0.44);
  const accentSurface = mixColors(neutral.surface, accentPrimary, colorMode === 'dark' ? 0.22 : 0.14);
  const accentSubtleGlow = withAlpha(
    accentPrimary,
    colorMode === 'dark'
      ? isFocusMode
        ? 0.12
        : isExamMode
          ? 0.18
          : 0.22
      : isFocusMode
        ? 0.08
        : isExamMode
          ? 0.12
          : 0.14
  );
  const accentOnFill = pickReadableOnFill(accentPrimary);
  const appBg = neutral.appBg;
  const shellBg = neutral.shellBg;
  const surface = neutral.surface;
  const surfaceMuted = neutral.surfaceMuted;
  const elevatedTop = mixColors(surface, colorMode === 'dark' ? '#ffffff' : '#f8fafc', colorMode === 'dark' ? 0.04 : 0.2);
  const elevatedBottom = mixColors(surface, colorMode === 'dark' ? '#020617' : '#e2e8f0', colorMode === 'dark' ? 0.08 : 0.16);
  const borderSubtle = withAlpha(
    colorMode === 'dark' ? mixColors(neutral.textTertiary, '#94a3b8', 0.3) : '#64748b',
    colorMode === 'dark'
      ? isExamMode
        ? 0.4
        : 0.34
      : isExamMode
        ? 0.3
        : 0.24
  );
  const borderStrong = withAlpha(
    mixColors(neutral.textSecondary, accentPrimary, colorMode === 'dark' ? 0.24 : 0.18),
    colorMode === 'dark' ? 0.52 : 0.38
  );
  const cardShadow = colorMode === 'dark'
    ? `0 12px 34px ${withAlpha('#020617', 0.35)}`
    : `0 12px 34px ${withAlpha('#0f172a', 0.08)}`;
  const cardShadowStrong = colorMode === 'dark'
    ? `0 24px 60px ${withAlpha('#020617', 0.5)}`
    : `0 24px 60px ${withAlpha('#0f172a', 0.12)}`;

  const style = {} as CSSProperties;
  const assign = (name: string, value: string) => {
    (style as Record<string, string>)[name] = value;
  };

  assign('--background', toHslTriplet(appBg));
  assign('--foreground', toHslTriplet(neutral.textPrimary));
  assign('--card', toHslTriplet(surface));
  assign('--card-foreground', toHslTriplet(neutral.textPrimary));
  assign('--popover', toHslTriplet(surface));
  assign('--popover-foreground', toHslTriplet(neutral.textPrimary));
  assign('--primary', toHslTriplet(accentPrimary));
  assign('--primary-foreground', toHslTriplet(accentOnFill));
  assign('--secondary', toHslTriplet(surfaceMuted));
  assign('--secondary-foreground', toHslTriplet(neutral.textSecondary));
  assign('--muted', toHslTriplet(surfaceMuted));
  assign('--muted-foreground', toHslTriplet(neutral.textTertiary));
  assign('--accent', toHslTriplet(mixColors(surfaceMuted, accentPrimary, 0.1)));
  assign('--accent-foreground', toHslTriplet(neutral.textPrimary));
  assign('--border', toHslTriplet(mixColors(surfaceMuted, neutral.textTertiary, colorMode === 'dark' ? 0.18 : 0.1)));
  assign('--input', toHslTriplet(mixColors(surfaceMuted, neutral.textTertiary, colorMode === 'dark' ? 0.16 : 0.08)));
  assign('--ring', toHslTriplet(accentPrimary));

  assign('--sf-cream-bg', appBg);
  assign('--sf-cream-surface', surface);
  assign('--sf-cream-border', borderSubtle);

  assign('--copilot-accent-primary', accentPrimary);
  assign('--copilot-accent-primary-hover', accentPrimaryHover);
  assign('--copilot-accent-primary-active', accentPrimaryActive);
  assign('--copilot-accent-soft', accentSoft);
  assign('--copilot-accent-soft-hover', accentSoftHover);
  assign('--copilot-accent-surface', accentSurface);
  assign('--copilot-accent-border', accentBorder);
  assign('--copilot-accent-focus-ring', accentFocusRing);
  assign('--copilot-accent-text', accentText);
  assign('--copilot-accent-on-fill', accentOnFill);
  assign('--copilot-accent-subtle-glow', accentSubtleGlow);
  assign('--copilot-accent-muted-icon', accentMutedIcon);

  assign('--background-app', appBg);
  assign('--background-shell', shellBg);
  assign('--background-surface', surface);
  assign('--background-surface-raised', elevatedTop);
  assign('--border-subtle', borderSubtle);
  assign('--border-strong', borderStrong);
  assign('--text-primary', neutral.textPrimary);
  assign('--text-secondary', neutral.textSecondary);
  assign('--text-muted', neutral.textTertiary);
  assign('--shadow-color', withAlpha(colorMode === 'dark' ? '#020617' : '#0f172a', colorMode === 'dark' ? 0.54 : 0.14));
  assign('--overlay-color', withAlpha(colorMode === 'dark' ? '#020617' : '#0f172a', colorMode === 'dark' ? 0.55 : 0.2));

  assign('--copilot-chat-text', neutral.textPrimary);
  assign('--copilot-chat-text-strong', neutral.textPrimary);
  assign('--copilot-chat-text-soft', neutral.textSecondary);
  assign('--copilot-link', accentText);
  assign('--copilot-link-hover', accentPrimaryHover);
  assign('--copilot-assistant-bubble-bg', withAlpha(surface, colorMode === 'dark' ? 0.95 : 0.98));
  assign('--copilot-assistant-bubble-border', borderSubtle);
  assign('--copilot-user-bubble-bg', accentSurface);
  assign('--copilot-user-bubble-fg', neutral.textPrimary);
  assign('--copilot-user-bubble-border', accentBorder);
  assign('--copilot-input-bg', withAlpha(surface, colorMode === 'dark' ? 0.88 : 0.95));
  assign('--copilot-input-text', neutral.textPrimary);
  assign('--copilot-input-placeholder', neutral.textTertiary);
  assign('--copilot-soft-shadow', cardShadow);
  assign('--copilot-card-shadow', cardShadow);
  assign('--copilot-card-shadow-strong', cardShadowStrong);
  assign('--copilot-surface-1', withAlpha(surface, colorMode === 'dark' ? 0.96 : 0.97));
  assign('--copilot-surface-2', withAlpha(shellBg, colorMode === 'dark' ? 0.95 : 0.93));
  assign('--copilot-surface-muted', withAlpha(surfaceMuted, colorMode === 'dark' ? 0.95 : 0.92));
  assign('--copilot-hover-surface', mixColors(surfaceMuted, accentPrimary, colorMode === 'dark' ? 0.1 : 0.07));
  assign('--copilot-backdrop', withAlpha(shellBg, colorMode === 'dark' ? 0.9 : 0.86));
  assign('--copilot-text-primary', neutral.textPrimary);
  assign('--copilot-text-secondary', neutral.textSecondary);
  assign('--copilot-text-tertiary', neutral.textTertiary);
  assign(
    '--copilot-main-stage',
    `radial-gradient(circle at top, ${accentSubtleGlow}, transparent 38%), linear-gradient(180deg, ${appBg} 0%, ${shellBg} 100%)`
  );
  assign('--copilot-elevated-surface', `linear-gradient(180deg, ${withAlpha(elevatedTop, 0.98)}, ${withAlpha(elevatedBottom, 0.99)})`);
  assign('--copilot-elevated-surface-muted', `linear-gradient(180deg, ${withAlpha(surfaceMuted, 0.98)}, ${withAlpha(elevatedBottom, 0.98)})`);
  assign('--copilot-soft-line', borderSubtle);
  assign('--copilot-kicker-bg', accentSoft);
  assign('--copilot-kicker-fg', accentText);
  assign('--copilot-blockquote-bg', `linear-gradient(180deg, ${withAlpha(accentSurface, 0.68)}, ${withAlpha(surfaceMuted, 0.88)})`);
  assign('--copilot-blockquote-fg', neutral.textSecondary);
  assign('--copilot-action-bg', withAlpha(surface, colorMode === 'dark' ? 0.86 : 0.92));
  assign('--copilot-action-fg', neutral.textSecondary);
  assign('--copilot-action-border', borderSubtle);
  assign('--copilot-action-hover-bg', accentSoftHover);
  assign('--copilot-action-hover-fg', neutral.textPrimary);
  assign('--copilot-action-hover-border', accentBorder);
  assign('--copilot-source-count', neutral.textTertiary);

  return style;
}
