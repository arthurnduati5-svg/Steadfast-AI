// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Provider Contracts v1
// Provider abstraction for video metadata sources
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata, VideoProvider } from './videoRecommendationContracts';

export type VideoProviderSearchInput = {
  query: string;
  language?: string | null;
  maxResults: number;
  regionCode?: string | null;
  safeSearch?: 'none' | 'moderate' | 'strict';
};

export interface VideoProviderAdapter {
  provider: VideoProvider;
  isConfigured(): boolean;
  search(input: VideoProviderSearchInput): Promise<VideoCandidateInput[]>;
  getMetadata(candidates: VideoCandidateInput[]): Promise<VideoMetadata[]>;
}

// ── Default/Null provider — always available, no credentials needed ──
export class NullVideoProviderAdapter implements VideoProviderAdapter {
  provider: VideoProvider = 'unknown';
  isConfigured(): boolean { return false; }
  async search(_input: VideoProviderSearchInput): Promise<VideoCandidateInput[]> { return []; }
  async getMetadata(_candidates: VideoCandidateInput[]): Promise<VideoMetadata[]> { return []; }
}
