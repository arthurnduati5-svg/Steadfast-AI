import { describe, expect, it } from 'vitest';
import {
  THEMES,
  getThemeEntry,
  getAvailableThemes,
  isValidThemeId,
} from '@/lib/theme-registry';

describe('theme-registry', () => {
  it('exports exactly 8 themes', () => {
    expect(THEMES).toHaveLength(8);
  });

  it('includes steadfast-default as the only available theme', () => {
    const available = getAvailableThemes();
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe('steadfast-default');
    expect(available[0].isAvailable).toBe(true);
  });

  it('marks all other themes as unavailable', () => {
    const unavailable = THEMES.filter((t) => !t.isAvailable);
    expect(unavailable).toHaveLength(7);
    for (const theme of unavailable) {
      expect(theme.futureFlag).toBeTruthy();
    }
  });

  it('getThemeEntry returns the correct entry', () => {
    const entry = getThemeEntry('midnight-scholar');
    expect(entry).toBeDefined();
    expect(entry!.label).toBe('Midnight Scholar');
    expect(entry!.tone).toBe('dark');
  });

  it('getThemeEntry returns undefined for unknown ids', () => {
    expect(getThemeEntry('nonexistent' as any)).toBeUndefined();
  });

  it('isValidThemeId validates correctly', () => {
    expect(isValidThemeId('steadfast-default')).toBe(true);
    expect(isValidThemeId('ocean-glass')).toBe(true);
    expect(isValidThemeId('invalid')).toBe(false);
  });

  it('every theme has a unique id', () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
