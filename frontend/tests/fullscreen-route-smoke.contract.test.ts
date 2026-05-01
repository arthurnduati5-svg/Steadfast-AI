import { describe, expect, it } from 'vitest';
import {
  mapDestinationToLegacyTab,
  shouldResetFullscreenPlusAction,
} from '@/lib/fullscreen-workspace-context';

describe('Fullscreen destination transition smoke contract', () => {
  it('maps destination changes without unintended redirects', () => {
    expect(mapDestinationToLegacyTab('new_session', 'history')).toBe('chat');
    expect(mapDestinationToLegacyTab('search', 'chat')).toBe('history');
    expect(mapDestinationToLegacyTab('revision', 'chat')).toBe('revision');
    expect(mapDestinationToLegacyTab('exam', 'chat')).toBe('chat');
    expect(mapDestinationToLegacyTab('focus', 'chat')).toBe('chat');

    // Media and Growth should keep current context tab instead of forcing Revision/Search.
    expect(mapDestinationToLegacyTab('media', 'chat')).toBe('chat');
    expect(mapDestinationToLegacyTab('media', 'history')).toBe('history');
    expect(mapDestinationToLegacyTab('media', 'revision')).toBe('revision');
    expect(mapDestinationToLegacyTab('growth', 'chat')).toBe('chat');
    expect(mapDestinationToLegacyTab('growth', 'history')).toBe('history');
    expect(mapDestinationToLegacyTab('growth', 'revision')).toBe('revision');
  });

  it('only resets plus action outside New Study Session destination', () => {
    expect(shouldResetFullscreenPlusAction('new_session')).toBe(false);
    expect(shouldResetFullscreenPlusAction('search')).toBe(true);
    expect(shouldResetFullscreenPlusAction('revision')).toBe(true);
    expect(shouldResetFullscreenPlusAction('media')).toBe(true);
    expect(shouldResetFullscreenPlusAction('growth')).toBe(true);
    expect(shouldResetFullscreenPlusAction('exam')).toBe(true);
    expect(shouldResetFullscreenPlusAction('focus')).toBe(true);
  });
});
