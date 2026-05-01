'use client';

import React from 'react';
import { Check, ChevronDown, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CopilotTheme, CopilotThemePreference } from '@/lib/copilot-theme';
import type { StudyAtmospherePreference } from '@/lib/types';
import {
  ADVANCED_STUDY_ATMOSPHERE_SWATCHES,
  buildStudyAtmosphereStyle,
  DEFAULT_STUDY_ATMOSPHERE_PREFERENCE,
  normalizeHexColor,
  normalizeStudyAtmospherePreference,
  STUDY_ATMOSPHERE_PRESETS,
} from '@/lib/study-atmospheres';

type StudyAtmospherePickerProps = {
  value: StudyAtmospherePreference;
  themePreference: CopilotThemePreference;
  resolvedTheme: CopilotTheme;
  onThemePreferenceChange: (preference: CopilotThemePreference) => void;
  onChange: (next: StudyAtmospherePreference) => void;
};

const THEME_MODE_CHOICES: Array<{
  id: CopilotThemePreference;
  label: string;
  helper: string;
}> = [
  { id: 'system', label: 'System', helper: 'Follow device' },
  { id: 'light', label: 'Light', helper: 'Daylight mode' },
  { id: 'dark', label: 'Dark', helper: 'Night mode' },
];

const PREVIEW_SURFACE_STYLE: React.CSSProperties = {
  border: '1px solid var(--copilot-soft-line)',
  background: 'var(--copilot-elevated-surface)',
};

function MiniThemePreview({
  style,
  label,
}: {
  style: React.CSSProperties;
  label: string;
}) {
  return (
    <div
      aria-hidden
      className="copilot-theme-scope overflow-hidden rounded-xl"
      style={{
        ...style,
        border: '1px solid var(--copilot-soft-line)',
      }}
    >
      <div
        className="h-3 border-b"
        style={{
          background: 'var(--copilot-backdrop)',
          borderColor: 'var(--copilot-soft-line)',
        }}
      />
      <div className="space-y-1.5 p-2" style={{ background: 'var(--copilot-main-stage)' }}>
        <div className="rounded-md p-1.5" style={PREVIEW_SURFACE_STYLE}>
          <div className="h-1.5 w-14 rounded-sm" style={{ background: 'var(--copilot-text-primary)' }} />
          <div className="mt-1 h-1 w-20 rounded-sm" style={{ background: 'var(--copilot-text-tertiary)' }} />
          <div
            className="mt-1.5 h-4 w-10 rounded-full"
            style={{
              border: '1px solid var(--copilot-accent-border)',
              background: 'var(--copilot-accent-soft)',
            }}
          />
        </div>
        <div className="flex items-center justify-between rounded-md px-1.5 py-1.5" style={PREVIEW_SURFACE_STYLE}>
          <span className="text-[10px] font-semibold" style={{ color: 'var(--copilot-accent-text)' }}>
            {label}
          </span>
          <span
            className="inline-flex h-3.5 w-3.5 rounded-full"
            style={{ background: 'var(--copilot-accent-primary)' }}
          />
        </div>
      </div>
    </div>
  );
}

export function StudyAtmospherePicker({
  value,
  themePreference,
  resolvedTheme,
  onThemePreferenceChange,
  onChange,
}: StudyAtmospherePickerProps) {
  const normalizedValue = normalizeStudyAtmospherePreference(value);
  const previewColorMode: CopilotTheme =
    themePreference === 'system' ? resolvedTheme : themePreference;

  const updatePreference = (patch: Partial<StudyAtmospherePreference>) => {
    onChange(
      normalizeStudyAtmospherePreference({
        ...normalizedValue,
        ...patch,
      })
    );
  };

  const updateCustomColor = (raw: string) => {
    const nextColor = normalizeHexColor(raw);
    updatePreference({
      useAdvanced: true,
      customBaseColor: nextColor || normalizedValue.customBaseColor || '#3b82f6',
    });
  };

  const activeAdvancedColor =
    normalizeHexColor(normalizedValue.customBaseColor) || '#3b82f6';
  const [advancedDraftColor, setAdvancedDraftColor] = React.useState(activeAdvancedColor);
  const [advancedExpanded, setAdvancedExpanded] = React.useState(Boolean(normalizedValue.useAdvanced));

  React.useEffect(() => {
    setAdvancedDraftColor(activeAdvancedColor);
  }, [activeAdvancedColor]);

  React.useEffect(() => {
    if (normalizedValue.useAdvanced) {
      setAdvancedExpanded(true);
    }
  }, [normalizedValue.useAdvanced]);

  const normalizedDraftAdvancedColor = normalizeHexColor(advancedDraftColor);
  const canApplyAdvancedColor =
    normalizedValue.useAdvanced &&
    Boolean(normalizedDraftAdvancedColor) &&
    normalizedDraftAdvancedColor !== normalizeHexColor(normalizedValue.customBaseColor);

  const currentPreviewStyle = buildStudyAtmosphereStyle({
    atmosphere: normalizedValue,
    colorMode: previewColorMode,
    studyMode: 'standard',
  });

  return (
    <section className="copilot-surface rounded-[1.5rem] border p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="copilot-primary-text text-sm font-semibold">Study atmosphere</p>
          <p className="copilot-tertiary-text mt-1 text-xs leading-5">
            Pick a compact premium atmosphere. Preview updates instantly.
          </p>
        </div>
        <span className="copilot-selection-chip-active inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Live
        </span>
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
          <Palette className="h-3.5 w-3.5" />
          Appearance mode
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {THEME_MODE_CHOICES.map((choice) => {
            const active = themePreference === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onThemePreferenceChange(choice.id)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-left transition-colors',
                  active
                    ? 'copilot-selection-chip-active'
                    : 'border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-[var(--copilot-text-secondary)] hover:bg-[var(--copilot-hover-surface)]'
                )}
              >
                <p className="text-sm font-semibold">{choice.label}</p>
                <p className="mt-0.5 text-[11px] text-[var(--copilot-text-tertiary)]">{choice.helper}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
            Atmosphere tiles
          </p>
          <p className="text-[11px] text-[var(--copilot-text-tertiary)]">
            Compact views, faster switching
          </p>
        </div>
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(165px,1fr))]">
          {STUDY_ATMOSPHERE_PRESETS.map((preset) => {
            const active = !normalizedValue.useAdvanced && normalizedValue.presetId === preset.id;
            const previewStyle = buildStudyAtmosphereStyle({
              atmosphere: {
                presetId: preset.id,
                useAdvanced: false,
                customBaseColor: null,
              },
              colorMode: previewColorMode,
              studyMode: 'standard',
            });
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  updatePreference({
                    presetId: preset.id,
                    useAdvanced: false,
                    customBaseColor: normalizedValue.customBaseColor || null,
                  })
                }
                className={cn(
                  'group rounded-xl border p-2 text-left transition-all duration-200',
                  active
                    ? 'copilot-atmosphere-card-active'
                    : 'border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] hover:-translate-y-[1px] hover:border-[var(--copilot-accent-border)] hover:bg-[var(--copilot-hover-surface)]'
                )}
              >
                <div className="relative overflow-hidden rounded-lg">
                  <MiniThemePreview style={previewStyle} label={preset.name.split(' ')[0]} />
                  {active ? (
                    <span className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)] text-[var(--copilot-accent-text)]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-semibold text-[var(--copilot-text-primary)]">{preset.name}</p>
                <p className="truncate text-[11px] text-[var(--copilot-text-secondary)]">{preset.moodLine}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setAdvancedExpanded((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--copilot-soft-line)] px-3 py-1.5 text-xs font-semibold text-[var(--copilot-text-secondary)] transition-colors hover:bg-[var(--copilot-hover-surface)]"
            aria-expanded={advancedExpanded}
          >
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                advancedExpanded ? 'rotate-180' : ''
              )}
            />
            Advanced color studio
          </button>
          <button
            type="button"
            onClick={() =>
              updatePreference({
                useAdvanced: !normalizedValue.useAdvanced,
                customBaseColor:
                  normalizedValue.customBaseColor ||
                  DEFAULT_STUDY_ATMOSPHERE_PREFERENCE.customBaseColor ||
                  '#3b82f6',
              })
            }
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              normalizedValue.useAdvanced
                ? 'copilot-selection-chip-active'
                : 'border-[var(--copilot-soft-line)] text-[var(--copilot-text-secondary)] hover:bg-[var(--copilot-hover-surface)]'
            )}
          >
            {normalizedValue.useAdvanced ? 'Advanced active' : 'Enable advanced'}
          </button>
        </div>

        {advancedExpanded ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {ADVANCED_STUDY_ATMOSPHERE_SWATCHES.map((swatch) => {
                const active =
                  normalizedValue.useAdvanced &&
                  normalizeHexColor(normalizedValue.customBaseColor) === swatch.color;
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => {
                      setAdvancedDraftColor(swatch.color);
                      updateCustomColor(swatch.color);
                    }}
                    title={swatch.label}
                    className={cn(
                      'h-7 w-7 rounded-full border transition-transform hover:scale-[1.04]',
                      active ? 'ring-2 ring-offset-1 ring-[var(--copilot-accent-focus-ring)]' : ''
                    )}
                    style={{
                      background: swatch.color,
                      borderColor: active ? 'var(--copilot-accent-border)' : 'rgba(15,23,42,0.2)',
                    }}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={normalizedDraftAdvancedColor || activeAdvancedColor}
                onChange={(event) => {
                  setAdvancedDraftColor(event.target.value);
                }}
                className="h-9 w-12 cursor-pointer rounded-md border border-[var(--copilot-soft-line)] bg-transparent p-1"
                aria-label="Choose custom study color"
              />
              <input
                type="text"
                value={advancedDraftColor}
                onChange={(event) => setAdvancedDraftColor(event.target.value)}
                className="h-9 w-[120px] rounded-md border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-2 text-xs text-[var(--copilot-text-primary)]"
                placeholder="#3b82f6"
                aria-label="Custom study color hex"
              />
              <button
                type="button"
                onClick={() => {
                  if (normalizedDraftAdvancedColor) {
                    updateCustomColor(normalizedDraftAdvancedColor);
                  }
                }}
                disabled={!canApplyAdvancedColor}
                className={cn(
                  'h-9 rounded-md border px-3 text-xs font-semibold transition-colors',
                  canApplyAdvancedColor
                    ? 'copilot-accent-soft-button text-[var(--copilot-accent-text)]'
                    : 'cursor-not-allowed border-[var(--copilot-soft-line)] text-[var(--copilot-text-tertiary)] opacity-70'
                )}
              >
                Apply color
              </button>
              <span className="text-[11px] text-[var(--copilot-text-tertiary)]">
                Kept readable across text and controls.
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
          <Sparkles className="h-3.5 w-3.5" />
          Live studio preview
        </p>
        <div className="max-w-[280px]">
          <MiniThemePreview style={currentPreviewStyle} label={normalizedValue.useAdvanced ? 'Advanced' : 'Preset'} />
        </div>
      </div>
    </section>
  );
}
