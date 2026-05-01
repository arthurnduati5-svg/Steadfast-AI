'use client';

export type CopilotTheme = 'light' | 'dark';
export type CopilotThemePreference = CopilotTheme | 'system';

const THEME_ATTRIBUTE_NAMES = [
  'data-theme',
  'data-mode',
  'data-color-mode',
  'data-color-theme',
  'data-bs-theme',
] as const;

const parseThemeValue = (value: string | null | undefined): CopilotTheme | null => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'dark' || normalized.startsWith('dark-') || normalized.endsWith('-dark')) return 'dark';
  if (normalized === 'light' || normalized.startsWith('light-') || normalized.endsWith('-light')) return 'light';
  return null;
};

const readThemeFromElement = (element: Element | null): CopilotTheme | null => {
  if (!element) return null;

  for (const attributeName of THEME_ATTRIBUTE_NAMES) {
    const parsed = parseThemeValue(element.getAttribute(attributeName));
    if (parsed) return parsed;
  }

  if (element.classList.contains('dark')) return 'dark';
  if (element.classList.contains('light')) return 'light';
  if (element.classList.contains('theme-dark')) return 'dark';
  if (element.classList.contains('theme-light')) return 'light';

  return null;
};

export function normalizeCopilotThemePreference(raw: unknown): CopilotThemePreference {
  if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
  return 'system';
}

export function getAmbientDocumentTheme(): CopilotTheme {
  if (typeof window === 'undefined') return 'light';

  const htmlTheme = readThemeFromElement(document.documentElement);
  if (htmlTheme) return htmlTheme;

  const bodyTheme = readThemeFromElement(document.body);
  if (bodyTheme) return bodyTheme;

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveCopilotTheme(
  preference: CopilotThemePreference,
  ambientTheme: CopilotTheme
): CopilotTheme {
  return preference === 'system' ? ambientTheme : preference;
}

export function observeAmbientDocumentTheme(
  onChange: (theme: CopilotTheme) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const emit = () => onChange(getAmbientDocumentTheme());
  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  const attributeFilter = ['class', ...THEME_ATTRIBUTE_NAMES];

  const observer = new MutationObserver(() => emit());
  observer.observe(document.documentElement, { attributes: true, attributeFilter });
  if (document.body) {
    observer.observe(document.body, { attributes: true, attributeFilter });
  }

  const handleMediaChange = () => emit();
  mediaQuery?.addEventListener?.('change', handleMediaChange);

  return () => {
    observer.disconnect();
    mediaQuery?.removeEventListener?.('change', handleMediaChange);
  };
}
