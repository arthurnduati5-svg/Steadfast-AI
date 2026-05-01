import { describe, expect, it } from 'vitest';
import { isTrustedSource } from '../../lib/research/source-trust';
import { heuristicResearchIntent } from '../flows/intent-detector';

describe('Research mode trust policy', () => {
  it('accepts trusted institutional domains', () => {
    expect(isTrustedSource('https://www.nasa.gov/mission_pages')).toBe(true);
    expect(isTrustedSource('https://biology.mit.edu/resource')).toBe(true);
  });

  it('rejects untrusted or unsafe hostnames', () => {
    expect(isTrustedSource('https://random-blog.example.com/post')).toBe(false);
    expect(isTrustedSource('http://localhost:3000/test')).toBe(false);
    expect(isTrustedSource('ftp://nasa.gov/file')).toBe(false);
  });
});

describe('Research intent fallback', () => {
  it('detects greeting and continuation intents', () => {
    expect(heuristicResearchIntent('hello there')).toBe('greeting');
    expect(heuristicResearchIntent('okay continue')).toBe('dialogue_continuation');
  });

  it('distinguishes current lookups from normal tutoring asks', () => {
    expect(heuristicResearchIntent('who is the current UN secretary general')).toBe('latest_info_request');
    expect(heuristicResearchIntent('i want to learn about plate tectonics')).toBe('clarification');
  });

  it('maps follow-up references to clarification', () => {
    expect(heuristicResearchIntent('can you explain it again', 'photosynthesis')).toBe('clarification');
  });
});
