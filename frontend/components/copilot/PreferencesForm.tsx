'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { InterestSelector } from './InterestSelector';
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  Clapperboard,
  Clock3,
  Compass,
  Languages,
  Mic2,
  Palette,
  Save,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  areStudyAtmospherePreferencesEqual,
  DEFAULT_STUDY_ATMOSPHERE_PREFERENCE,
  normalizeStudyAtmospherePreference,
} from '@/lib/study-atmospheres';
import { StudyAtmospherePicker } from './StudyAtmospherePicker';
import type { CopilotTheme, CopilotThemePreference } from '@/lib/copilot-theme';
import type {
  LearningSupportMode,
  SessionLanguageState,
  SimplicityLevel,
  StudyAtmospherePreference,
  SupportedLearningLanguage,
  MediaPreferenceProfile,
} from '@/lib/types';

type LanguageMode = NonNullable<SessionLanguageState['preferredLanguageMode']>;
type PreferencesSectionId =
  | 'appearance'
  | 'learning_style'
  | 'interests'
  | 'language'
  | 'voice'
  | 'study_modes'
  | 'media_preferences'
  | 'safety_limits';

interface PreferencesFormProps {
  profileData: any;
  onSave: (data: any) => Promise<any>;
  isSaving: boolean;
  isLoading: boolean;
  onClose: () => void;
  variant?: 'standalone' | 'embedded';
  className?: string;
  copilotThemePreference?: CopilotThemePreference;
  resolvedCopilotTheme?: CopilotTheme;
  studyAtmospherePreference?: StudyAtmospherePreference;
}

const LANGUAGE_LABEL_TO_MODE: Record<string, LanguageMode> = {
  English: 'english',
  Swahili: 'swahili',
  Arabic: 'arabic',
  'English + Swahili Mix': 'english_sw',
  'Arabic + English': 'arabic_english',
};

const LANGUAGE_MODE_TO_LABEL: Record<LanguageMode, string> = {
  english: 'English',
  swahili: 'Swahili',
  arabic: 'Arabic',
  english_sw: 'English + Swahili Mix',
  arabic_english: 'Arabic + English',
};

const PREDEFINED_INTERESTS = [
  'Football',
  'Farming',
  'Cooking',
  'Music',
  'Drawing',
  'Science',
  'Nature',
  'Animals',
  'Writing',
  'Camping',
  'Beauty',
  'Painting',
  'Basketball',
  'Photography',
  'Swimming',
  'Technology',
];

const LEARNING_SUPPORT_OPTIONS: Array<{ id: LearningSupportMode; title: string; description: string }> = [
  { id: 'strict_single_language', title: 'Single-language guide', description: 'One response language, less noise.' },
  { id: 'bilingual_support', title: 'Bilingual bridge', description: 'Primary language with support translation.' },
  { id: 'translation_support', title: 'Translation assist', description: 'Adds translation support when needed.' },
  { id: 'learner_choice', title: 'Learner choice', description: 'Adapts support language per context.' },
];

const SIMPLICITY_OPTIONS: Array<{ id: SimplicityLevel; title: string; description: string }> = [
  { id: 'very_simple', title: 'Foundation steps', description: 'Small chunks and extra scaffolding.' },
  { id: 'simple', title: 'Balanced clarity', description: 'Concise guidance for normal revision.' },
  { id: 'standard', title: 'Exam depth', description: 'Higher detail for advanced sessions.' },
];

const RESPONSE_LANGUAGE_OPTIONS: Array<{ id: SupportedLearningLanguage; label: string }> = [
  { id: 'english', label: 'English' },
  { id: 'swahili', label: 'Swahili' },
  { id: 'arabic', label: 'Arabic' },
];

const LEARNING_STYLE_SIGNAL_OPTIONS: Array<{ id: string; label: string; description: string }> = [
  { id: 'simpler_language', label: 'Simpler language', description: 'Prefer shorter and easier wording first.' },
  { id: 'step_by_step_first', label: 'Step-by-step first', description: 'Break work into ordered small steps.' },
  { id: 'visual_help', label: 'Visual help', description: 'Prioritize diagrams and visual anchors.' },
  { id: 'short_recaps', label: 'Short recaps', description: 'Keep revision summaries brief and tight.' },
  { id: 'example_first', label: 'Example first', description: 'Show one worked example before theory.' },
  { id: 'audio_support', label: 'Audio support', description: 'Offer spoken recap support when useful.' },
  { id: 'challenge_me_more', label: 'Challenge me more', description: 'Increase stretch questions sooner.' },
];

const DEFAULT_MEDIA_PREFERENCES: MediaPreferenceProfile = {
  preferredRecapType: 'mixed',
  shortFormSupport: 'concept_intuition',
  allowExternalCreativeSuggestions: true,
};

const MEDIA_RECAP_OPTIONS: Array<{ id: MediaPreferenceProfile['preferredRecapType']; title: string; description: string }> = [
  { id: 'audio', title: 'Audio', description: 'Voice-first recaps for quick replay.' },
  { id: 'video', title: 'Video', description: 'Clip-first walkthrough with pacing cues.' },
  { id: 'visual', title: 'Visual', description: 'Diagram and image explainers first.' },
  { id: 'mixed', title: 'Mixed', description: 'Blend audio, visual, and video depending on need.' },
];

const MEDIA_SHORT_SUPPORT_OPTIONS: Array<{ id: MediaPreferenceProfile['shortFormSupport']; title: string; description: string }> = [
  { id: 'concept_intuition', title: 'Concept intuition', description: 'Short visual intuition before detail.' },
  { id: 'worked_example', title: 'Worked example', description: 'Step-led examples students can copy and adapt.' },
  { id: 'quick_recap', title: 'Quick recap', description: 'Fast memory refresh before questions.' },
];

const STUDY_MODE_PROFILES: Array<{
  id: 'focus_rebuild' | 'steady_progress' | 'exam_drive';
  title: string;
  description: string;
  support: LearningSupportMode;
  simplicity: SimplicityLevel;
}> = [
  {
    id: 'focus_rebuild',
    title: 'Focus rebuild',
    description: 'Short guided steps and stricter language boundaries.',
    support: 'strict_single_language',
    simplicity: 'very_simple',
  },
  {
    id: 'steady_progress',
    title: 'Steady progress',
    description: 'Balanced detail for daily revision momentum.',
    support: 'learner_choice',
    simplicity: 'simple',
  },
  {
    id: 'exam_drive',
    title: 'Exam drive',
    description: 'Higher challenge and translation support when needed.',
    support: 'translation_support',
    simplicity: 'standard',
  },
];

const SAFETY_PROFILES: Array<{
  id: 'guarded' | 'balanced' | 'open';
  title: string;
  description: string;
  support: LearningSupportMode;
  simplicity: SimplicityLevel;
}> = [
  {
    id: 'guarded',
    title: 'Guarded',
    description: 'One language and simpler explanations.',
    support: 'strict_single_language',
    simplicity: 'very_simple',
  },
  {
    id: 'balanced',
    title: 'Balanced',
    description: 'Moderate flexibility with stable clarity.',
    support: 'learner_choice',
    simplicity: 'simple',
  },
  {
    id: 'open',
    title: 'Open support',
    description: 'Full detail with wider translation support.',
    support: 'translation_support',
    simplicity: 'standard',
  },
];

const PREFERENCE_SECTIONS: Array<{
  id: PreferencesSectionId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'appearance', label: 'Appearance', description: 'Atmosphere and visual tone', icon: Palette },
  { id: 'learning_style', label: 'Learning style', description: 'Support and detail behavior', icon: Brain },
  { id: 'interests', label: 'Interests', description: 'Context-aware examples', icon: Compass },
  { id: 'language', label: 'Language', description: 'Primary response language', icon: Languages },
  { id: 'voice', label: 'Voice', description: 'Audio output language', icon: Mic2 },
  { id: 'study_modes', label: 'Study modes', description: 'Preset tutoring profiles', icon: Workflow },
  { id: 'media_preferences', label: 'Media preferences', description: 'Study and creative stream tuning', icon: Clapperboard },
  { id: 'safety_limits', label: 'Safety / limits', description: 'Guardrail intensity', icon: ShieldCheck },
];

const MODE_BASES: Record<LanguageMode, SessionLanguageState> = {
  english: {
    preferredResponseLanguage: 'english',
    learningSupportMode: 'strict_single_language',
    simplicityLevel: 'simple',
    voiceOutputLanguage: 'english',
    preferredLanguageMode: 'english',
    bilingualSupportLanguage: null,
  },
  swahili: {
    preferredResponseLanguage: 'swahili',
    learningSupportMode: 'strict_single_language',
    simplicityLevel: 'simple',
    voiceOutputLanguage: 'swahili',
    preferredLanguageMode: 'swahili',
    bilingualSupportLanguage: null,
  },
  arabic: {
    preferredResponseLanguage: 'arabic',
    learningSupportMode: 'strict_single_language',
    simplicityLevel: 'simple',
    voiceOutputLanguage: 'arabic',
    preferredLanguageMode: 'arabic',
    bilingualSupportLanguage: null,
  },
  english_sw: {
    preferredResponseLanguage: 'english',
    learningSupportMode: 'bilingual_support',
    simplicityLevel: 'simple',
    voiceOutputLanguage: 'english',
    preferredLanguageMode: 'english_sw',
    bilingualSupportLanguage: 'swahili',
  },
  arabic_english: {
    preferredResponseLanguage: 'arabic',
    learningSupportMode: 'bilingual_support',
    simplicityLevel: 'simple',
    voiceOutputLanguage: 'arabic',
    preferredLanguageMode: 'arabic_english',
    bilingualSupportLanguage: 'english',
  },
};

const formatTimeAgo = (isoString: string | null): string => {
  if (!isoString) return 'Never';

  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${Math.max(seconds, 1)} second${seconds === 1 ? '' : 's'} ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

const normalizePreferredLanguageLabel = (value: unknown): string => {
  const raw = String(value || '').trim();
  if (LANGUAGE_LABEL_TO_MODE[raw]) return raw;
  if ((LANGUAGE_MODE_TO_LABEL as Record<string, string>)[raw]) {
    return (LANGUAGE_MODE_TO_LABEL as Record<string, string>)[raw];
  }
  return 'English';
};

const normalizeLanguageMode = (value: unknown): LanguageMode => {
  const raw = String(value || '').trim();
  if ((MODE_BASES as Record<string, SessionLanguageState>)[raw]) return raw as LanguageMode;
  return 'english';
};

const buildSessionLanguageState = (
  preferredLanguageLabel: string,
  incoming?: Partial<SessionLanguageState> | null
): SessionLanguageState => {
  const fallbackMode = LANGUAGE_LABEL_TO_MODE[preferredLanguageLabel] || 'english';
  const mode = normalizeLanguageMode(incoming?.preferredLanguageMode || fallbackMode);
  const base = MODE_BASES[mode];
  return {
    ...base,
    ...(incoming || {}),
    preferredLanguageMode: mode,
    preferredResponseLanguage: incoming?.preferredResponseLanguage || base.preferredResponseLanguage,
    voiceOutputLanguage: incoming?.voiceOutputLanguage || base.voiceOutputLanguage,
    learningSupportMode: incoming?.learningSupportMode || base.learningSupportMode,
    simplicityLevel: incoming?.simplicityLevel || base.simplicityLevel,
    bilingualSupportLanguage:
      Object.prototype.hasOwnProperty.call(incoming || {}, 'bilingualSupportLanguage')
        ? incoming?.bilingualSupportLanguage || null
        : base.bilingualSupportLanguage || null,
  };
};

const comparableLanguageState = (state: SessionLanguageState) => ({
  preferredResponseLanguage: state.preferredResponseLanguage,
  learningSupportMode: state.learningSupportMode || null,
  simplicityLevel: state.simplicityLevel || null,
  voiceOutputLanguage: state.voiceOutputLanguage || null,
  bilingualSupportLanguage: state.bilingualSupportLanguage || null,
  preferredLanguageMode: state.preferredLanguageMode || 'english',
});

const normalizeMediaPreferences = (value: unknown): MediaPreferenceProfile => {
  const source = (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};
  const preferredRecapType = safeMediaRecapPreference(source.preferredRecapType);
  const shortFormSupport = safeShortSupportPreference(source.shortFormSupport);
  return {
    preferredRecapType,
    shortFormSupport,
    allowExternalCreativeSuggestions:
      source.allowExternalCreativeSuggestions === undefined
        ? DEFAULT_MEDIA_PREFERENCES.allowExternalCreativeSuggestions
        : Boolean(source.allowExternalCreativeSuggestions),
  };
};

const safeMediaRecapPreference = (value: unknown): MediaPreferenceProfile['preferredRecapType'] => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'audio' || normalized === 'video' || normalized === 'visual' || normalized === 'mixed') {
    return normalized;
  }
  return DEFAULT_MEDIA_PREFERENCES.preferredRecapType;
};

const safeShortSupportPreference = (value: unknown): MediaPreferenceProfile['shortFormSupport'] => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'concept_intuition' || normalized === 'worked_example' || normalized === 'quick_recap') {
    return normalized;
  }
  return DEFAULT_MEDIA_PREFERENCES.shortFormSupport;
};

const normalizeLearningStyleSignals = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const known = new Set(LEARNING_STYLE_SIGNAL_OPTIONS.map((entry) => entry.id));
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const entry of value) {
    const id = String(entry || '').trim().toLowerCase();
    if (!id || !known.has(id) || seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
  }
  return normalized;
};

function PreferenceChoice({
  title,
  description,
  active,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border px-3 py-3 text-left transition-all duration-200',
        active
          ? 'copilot-selection-chip-active shadow-sm'
          : 'border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] hover:-translate-y-[1px] hover:border-[var(--copilot-accent-border)] hover:bg-[var(--copilot-hover-surface)]'
      )}
    >
      <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">{description}</p>
    </button>
  );
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  profileData,
  onSave,
  isSaving,
  isLoading,
  onClose,
  variant = 'standalone',
  className,
  copilotThemePreference = 'system',
  resolvedCopilotTheme = 'dark',
  studyAtmospherePreference = DEFAULT_STUDY_ATMOSPHERE_PREFERENCE,
}) => {
  const { toast } = useToast();
  const initialLanguage = normalizePreferredLanguageLabel(profileData?.preferredLanguage || 'English');

  const [activeSection, setActiveSection] = useState<PreferencesSectionId>('appearance');
  const [preferredLanguage, setPreferredLanguage] = useState(initialLanguage);
  const [topInterests, setTopInterests] = useState<string[]>([]);
  const [learningStyleSignals, setLearningStyleSignals] = useState<string[]>([]);
  const [localLastUpdatedAt, setLocalLastUpdatedAt] = useState<string | null>(null);
  const [localThemePreference, setLocalThemePreference] = useState<CopilotThemePreference>(copilotThemePreference);
  const [localStudyAtmosphere, setLocalStudyAtmosphere] = useState<StudyAtmospherePreference>(
    normalizeStudyAtmospherePreference(studyAtmospherePreference)
  );
  const [mediaPreferences, setMediaPreferences] = useState<MediaPreferenceProfile>(
    normalizeMediaPreferences(profileData?.mediaPreferences)
  );
  const [sessionLanguageState, setSessionLanguageState] = useState<SessionLanguageState>(
    buildSessionLanguageState(initialLanguage, profileData?.sessionLanguageState || null)
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [displayTimeAgo, setDisplayTimeAgo] = useState('Never');

  useEffect(() => {
    if (!profileData) return;
    const nextLanguage = normalizePreferredLanguageLabel(profileData.preferredLanguage || 'English');
    setPreferredLanguage(nextLanguage);
    setTopInterests(profileData.interests || profileData.topInterests || []);
    setLearningStyleSignals(normalizeLearningStyleSignals(profileData.learningStyleSignals));
    setMediaPreferences(normalizeMediaPreferences(profileData.mediaPreferences));
    setLocalLastUpdatedAt(profileData.lastUpdatedAt || null);
    setSessionLanguageState(buildSessionLanguageState(nextLanguage, profileData?.sessionLanguageState || null));
  }, [profileData]);

  useEffect(() => {
    setLocalThemePreference(copilotThemePreference);
  }, [copilotThemePreference]);

  useEffect(() => {
    setLocalStudyAtmosphere(normalizeStudyAtmospherePreference(studyAtmospherePreference));
  }, [studyAtmospherePreference]);

  useEffect(() => {
    const updateDisplay = () => setDisplayTimeAgo(formatTimeAgo(localLastUpdatedAt));
    updateDisplay();
    const intervalId = setInterval(updateDisplay, 30_000);
    return () => clearInterval(intervalId);
  }, [localLastUpdatedAt]);

  const initialSessionLanguageState = useMemo(
    () =>
      buildSessionLanguageState(
        normalizePreferredLanguageLabel(profileData?.preferredLanguage || 'English'),
        profileData?.sessionLanguageState || null
      ),
    [profileData]
  );

  const hasChanges = useMemo(() => {
    if (!profileData) return true;
    const initialInterests = profileData.interests || profileData.topInterests || [];
    const initialLearningSignals = normalizeLearningStyleSignals(profileData.learningStyleSignals);
    const initialMediaPreferences = normalizeMediaPreferences(profileData.mediaPreferences);
    const interestsChanged =
      JSON.stringify([...topInterests].sort()) !== JSON.stringify([...initialInterests].sort());
    const learningSignalsChanged =
      JSON.stringify([...learningStyleSignals].sort()) !== JSON.stringify([...initialLearningSignals].sort());
    const languageChanged =
      preferredLanguage !== normalizePreferredLanguageLabel(profileData.preferredLanguage || 'English');
    const themeChanged = localThemePreference !== copilotThemePreference;
    const atmosphereChanged = !areStudyAtmospherePreferencesEqual(
      localStudyAtmosphere,
      normalizeStudyAtmospherePreference(studyAtmospherePreference)
    );
    const sessionLanguageChanged =
      JSON.stringify(comparableLanguageState(sessionLanguageState)) !==
      JSON.stringify(comparableLanguageState(initialSessionLanguageState));
    const mediaPreferencesChanged =
      JSON.stringify(mediaPreferences) !== JSON.stringify(initialMediaPreferences);
    return (
      languageChanged ||
      interestsChanged ||
      learningSignalsChanged ||
      themeChanged ||
      atmosphereChanged ||
      sessionLanguageChanged ||
      mediaPreferencesChanged
    );
  }, [
    preferredLanguage,
    topInterests,
    learningStyleSignals,
    profileData,
    localThemePreference,
    copilotThemePreference,
    localStudyAtmosphere,
    studyAtmospherePreference,
    sessionLanguageState,
    initialSessionLanguageState,
    mediaPreferences,
  ]);

  const applyLanguageMode = (mode: LanguageMode) => {
    setPreferredLanguage(LANGUAGE_MODE_TO_LABEL[mode]);
    setSessionLanguageState((prev) => ({
      ...prev,
      ...MODE_BASES[mode],
      preferredLanguageMode: mode,
    }));
  };

  const currentStudyModeProfile = useMemo(() => {
    const match = STUDY_MODE_PROFILES.find(
      (profile) =>
        profile.support === sessionLanguageState.learningSupportMode &&
        profile.simplicity === sessionLanguageState.simplicityLevel
    );
    return match?.id || null;
  }, [sessionLanguageState.learningSupportMode, sessionLanguageState.simplicityLevel]);

  const currentSafetyProfile = useMemo(() => {
    const match = SAFETY_PROFILES.find(
      (profile) =>
        profile.support === sessionLanguageState.learningSupportMode &&
        profile.simplicity === sessionLanguageState.simplicityLevel
    );
    return match?.id || null;
  }, [sessionLanguageState.learningSupportMode, sessionLanguageState.simplicityLevel]);

  const activeSectionMeta = PREFERENCE_SECTIONS.find((section) => section.id === activeSection) || PREFERENCE_SECTIONS[0];
  const ActiveSectionIcon = activeSectionMeta.icon;

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const now = new Date().toISOString();
      const payload = {
        preferredLanguage,
        interests: topInterests,
        learningStyleSignals,
        lastUpdatedAt: now,
        copilotThemePreference: localThemePreference,
        studyAtmosphere: localStudyAtmosphere,
        mediaPreferences,
        sessionLanguageState,
      };

      const savedPreferences = await onSave(payload);
      const resolvedLastUpdatedAt = savedPreferences?.lastUpdatedAt || now;
      setLocalLastUpdatedAt(resolvedLastUpdatedAt);
      setSaveStatus('success');

      toast({
        title: 'Control center updated',
        description: 'Steadfast will adapt these settings in your next study actions.',
      });

      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1200);
    } catch (error) {
      toast({
        title: 'Could not save changes',
        description: 'Please try again.',
        variant: 'destructive',
      });
      setSaveStatus('idle');
    }
  };

  const renderActiveSection = () => {
    if (activeSection === 'appearance') {
      return (
        <StudyAtmospherePicker
          value={localStudyAtmosphere}
          onChange={setLocalStudyAtmosphere}
          themePreference={localThemePreference}
          onThemePreferenceChange={setLocalThemePreference}
          resolvedTheme={resolvedCopilotTheme}
        />
      );
    }

    if (activeSection === 'learning_style') {
      return (
        <section className="copilot-surface rounded-[1.5rem] border p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Learning support behavior</p>
          <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
            Tune how much language support and explanation depth Steadfast should use by default.
          </p>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
              Support mode
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {LEARNING_SUPPORT_OPTIONS.map((option) => (
                <PreferenceChoice
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  active={sessionLanguageState.learningSupportMode === option.id}
                  onClick={() =>
                    setSessionLanguageState((prev) => ({
                      ...prev,
                      learningSupportMode: option.id,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
              Explanation depth
            </p>
            <div className="grid gap-2 md:grid-cols-3">
              {SIMPLICITY_OPTIONS.map((option) => (
                <PreferenceChoice
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  active={sessionLanguageState.simplicityLevel === option.id}
                  onClick={() =>
                    setSessionLanguageState((prev) => ({
                      ...prev,
                      simplicityLevel: option.id,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
              Learning tactics
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {LEARNING_STYLE_SIGNAL_OPTIONS.map((option) => {
                const active = learningStyleSignals.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setLearningStyleSignals((prev) =>
                        prev.includes(option.id)
                          ? prev.filter((entry) => entry !== option.id)
                          : [...prev, option.id]
                      )
                    }
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-left transition-all duration-200',
                      active
                        ? 'copilot-selection-chip-active shadow-sm'
                        : 'border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] hover:border-[var(--copilot-accent-border)] hover:bg-[var(--copilot-hover-surface)]'
                    )}
                  >
                    <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{option.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (activeSection === 'interests') {
      return (
        <section className="copilot-surface rounded-[1.5rem] border p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Interest intelligence</p>
          <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
            Keep this list clean so examples connect to what students already care about.
          </p>
          <div className="mt-4">
            <InterestSelector
              predefinedInterests={PREDEFINED_INTERESTS}
              selectedInterests={topInterests}
              onSelectInterests={setTopInterests}
              displayMode="explicit-remove"
            />
          </div>
        </section>
      );
    }

    if (activeSection === 'language') {
      return (
        <section className="copilot-surface rounded-[1.5rem] border p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Response language mode</p>
          <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
            Set the language profile that should lead most revision responses.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {Object.entries(LANGUAGE_LABEL_TO_MODE).map(([label, mode]) => (
              <PreferenceChoice
                key={label}
                title={label}
                description={
                  mode === 'english_sw' || mode === 'arabic_english'
                    ? 'Primary language with bilingual support.'
                    : 'Strict single-language response profile.'
                }
                active={sessionLanguageState.preferredLanguageMode === mode}
                onClick={() => applyLanguageMode(mode)}
              />
            ))}
          </div>
        </section>
      );
    }

    if (activeSection === 'voice') {
      return (
        <section className="copilot-surface rounded-[1.5rem] border p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Voice output</p>
          <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
            Choose spoken language defaults for voice sessions and recap playback.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {RESPONSE_LANGUAGE_OPTIONS.map((option) => (
              <PreferenceChoice
                key={option.id}
                title={option.label}
                description="Voice output language"
                active={sessionLanguageState.voiceOutputLanguage === option.id}
                onClick={() =>
                  setSessionLanguageState((prev) => ({
                    ...prev,
                    voiceOutputLanguage: option.id,
                  }))
                }
              />
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
              Quick actions
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="copilot-accent-soft-button rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--copilot-accent-text)]"
                onClick={() =>
                  setSessionLanguageState((prev) => ({
                    ...prev,
                    voiceOutputLanguage: prev.preferredResponseLanguage,
                  }))
                }
              >
                Mirror response language
              </button>
              <button
                type="button"
                className="rounded-full border border-[var(--copilot-soft-line)] px-3 py-1.5 text-xs font-semibold text-[var(--copilot-text-secondary)] transition-colors hover:bg-[var(--copilot-hover-surface)]"
                onClick={() =>
                  setSessionLanguageState((prev) => ({
                    ...prev,
                    bilingualSupportLanguage: prev.bilingualSupportLanguage ? null : 'english',
                  }))
                }
              >
                {sessionLanguageState.bilingualSupportLanguage ? 'Disable bilingual fallback' : 'Enable English fallback'}
              </button>
            </div>
          </div>
        </section>
      );
    }

    if (activeSection === 'media_preferences') {
      return (
        <section className="copilot-surface rounded-[1.5rem] border p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Media intelligence</p>
          <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
            Tune how Study Stream and Creative Stream prioritize recap formats, short-form support, and trusted sources.
          </p>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
              Preferred recap type
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {MEDIA_RECAP_OPTIONS.map((option) => (
                <PreferenceChoice
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  active={mediaPreferences.preferredRecapType === option.id}
                  onClick={() =>
                    setMediaPreferences((prev) => ({
                      ...prev,
                      preferredRecapType: option.id,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
              Short-form support
            </p>
            <div className="grid gap-2 md:grid-cols-3">
              {MEDIA_SHORT_SUPPORT_OPTIONS.map((option) => (
                <PreferenceChoice
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  active={mediaPreferences.shortFormSupport === option.id}
                  onClick={() =>
                    setMediaPreferences((prev) => ({
                      ...prev,
                      shortFormSupport: option.id,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                  Creative stream sources
                </p>
                <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
                  Allow trusted external short clips when they add useful intuition.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setMediaPreferences((prev) => ({
                    ...prev,
                    allowExternalCreativeSuggestions: !prev.allowExternalCreativeSuggestions,
                  }))
                }
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  mediaPreferences.allowExternalCreativeSuggestions
                    ? 'copilot-selection-chip-active'
                    : 'border-[var(--copilot-soft-line)] text-[var(--copilot-text-secondary)] hover:bg-[var(--copilot-hover-surface)]'
                )}
              >
                {mediaPreferences.allowExternalCreativeSuggestions ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </section>
      );
    }

    if (activeSection === 'study_modes') {
      return (
        <section className="copilot-surface rounded-[1.5rem] border p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Study mode profiles</p>
          <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
            One-tap behavior presets for different student phases.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {STUDY_MODE_PROFILES.map((profile) => (
              <PreferenceChoice
                key={profile.id}
                title={profile.title}
                description={profile.description}
                active={currentStudyModeProfile === profile.id}
                onClick={() =>
                  setSessionLanguageState((prev) => ({
                    ...prev,
                    learningSupportMode: profile.support,
                    simplicityLevel: profile.simplicity,
                  }))
                }
              />
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="copilot-surface rounded-[1.5rem] border p-4 shadow-sm">
        <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Safety and limits</p>
        <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
          Set strong guardrails to reduce overload and keep revision calm.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {SAFETY_PROFILES.map((profile) => (
            <PreferenceChoice
              key={profile.id}
              title={profile.title}
              description={profile.description}
              active={currentSafetyProfile === profile.id}
              onClick={() =>
                setSessionLanguageState((prev) => ({
                  ...prev,
                  learningSupportMode: profile.support,
                  simplicityLevel: profile.simplicity,
                }))
              }
            />
          ))}
        </div>
      </section>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col rounded-[2rem] bg-white p-6">
        <div className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="h-8 w-64 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="mt-8 space-y-4">
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
          <div className="h-36 animate-pulse rounded-[1.5rem] bg-slate-100" />
          <div className="h-40 animate-pulse rounded-[1.5rem] bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-col bg-[hsl(var(--background))] p-5 text-[hsl(var(--foreground))] md:p-6',
        variant === 'embedded' ? 'rounded-none' : 'rounded-[2rem]',
        className
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="copilot-icon-button mt-0.5 h-9 w-9 rounded-full"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="copilot-tertiary-text text-[11px] font-semibold uppercase tracking-[0.16em]">
            Adaptive control center
          </p>
          <h2 className="copilot-primary-text mt-1 text-2xl font-semibold tracking-tight">
            Make Steadfast fit how your student learns
          </h2>
          <div
            className="copilot-surface-muted copilot-secondary-text mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
            aria-live="polite"
          >
            <Clock3 className="h-3.5 w-3.5" />
            <span>Last updated: {displayTimeAgo}</span>
            {saveStatus === 'saving' ? <span>- Saving...</span> : null}
            {saveStatus === 'success' ? <span>- Saved</span> : null}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="copilot-surface rounded-[1.4rem] border p-2 shadow-sm">
          <div className="space-y-1">
            {PREFERENCE_SECTIONS.map((section) => {
              const Icon = section.icon;
              const active = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full rounded-[1rem] border px-3 py-2.5 text-left transition-all duration-200',
                    active
                      ? 'border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)] text-[var(--copilot-accent-text)] shadow-sm'
                      : 'border-transparent text-[var(--copilot-text-secondary)] hover:border-[var(--copilot-soft-line)] hover:bg-[var(--copilot-hover-surface)] hover:text-[var(--copilot-text-primary)]'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-[1px] inline-flex h-7 w-7 items-center justify-center rounded-lg border border-current/20">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{section.label}</span>
                      <span className="block text-[11px] leading-4 opacity-80">{section.description}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="copilot-surface min-h-0 rounded-[1.4rem] border p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-3 py-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-[var(--copilot-accent-text)]">
              <ActiveSectionIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{activeSectionMeta.label}</p>
              <p className="text-xs text-[var(--copilot-text-secondary)]">{activeSectionMeta.description}</p>
            </div>
          </div>

          <div className="min-h-0 max-h-[52vh] overflow-y-auto pr-1 md:max-h-[56vh]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderActiveSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>

      <div className="mt-4 border-t border-[hsl(var(--border))] pt-4">
        <Button
          onClick={handleSave}
          className="copilot-primary-cta h-12 w-full rounded-2xl text-sm font-semibold disabled:opacity-50"
          disabled={!hasChanges || saveStatus !== 'idle' || isSaving}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={saveStatus}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-center gap-2"
            >
              {saveStatus === 'saving' && (
                <>
                  <Spinner />
                  <span>Saving control center...</span>
                </>
              )}
              {saveStatus === 'success' && (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'idle' && (
                <>
                  <Save className="h-4.5 w-4.5" />
                  <span>Apply preferences</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
};
