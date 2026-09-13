// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Metadata Service v1
// Accepts manual candidates, enriches with provider metadata
// if available. Never fabricates missing metadata.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata, VideoProvider } from './videoRecommendationContracts';
import type { VideoProviderAdapter } from './videoProviderContracts';
import { NullVideoProviderAdapter } from './videoProviderContracts';

function nowISO(): string {
  return new Date().toISOString();
}

const FALLBACK_METADATA_CONFIDENCE = 0.15;

export class VideoMetadataService {
  private providerAdapters: Map<VideoProvider, VideoProviderAdapter> = new Map();

  constructor() {
    // Register default null provider
    this.registerProvider(new NullVideoProviderAdapter());
  }

  registerProvider(adapter: VideoProviderAdapter): void {
    this.providerAdapters.set(adapter.provider, adapter);
  }

  getProvider(provider: VideoProvider): VideoProviderAdapter {
    return this.providerAdapters.get(provider) || new NullVideoProviderAdapter();
  }

  isProviderConfigured(provider: VideoProvider): boolean {
    return this.getProvider(provider).isConfigured();
  }

  /**
   * Enrich candidates with metadata. Never fabricates missing data.
   * Returns enriched metadata array parallel to input.
   */
  async enrichMetadata(candidates: VideoCandidateInput[]): Promise<VideoMetadata[]> {
    const results: VideoMetadata[] = [];

    for (const candidate of candidates) {
      const metadata = await this.enrichSingle(candidate);
      results.push(metadata);
    }

    return results;
  }

  private async enrichSingle(candidate: VideoCandidateInput): Promise<VideoMetadata> {
    const provider = this.getProvider(candidate.provider);

    // If provider is configured and can enrich, use it
    if (provider.isConfigured()) {
      try {
        const enriched = await provider.getMetadata([candidate]);
        if (enriched.length > 0) {
          return enriched[0];
        }
      } catch {
        // Fall through to manual candidate metadata
      }
    }

    // Build from manual candidate data — never fabricate
    const metadata: VideoMetadata = {
      provider: candidate.provider,
      providerVideoId: candidate.providerVideoId || '',
      canonicalUrl: candidate.url || null,
      title: candidate.title || 'Unknown Video',
      description: candidate.description || null,
      channelTitle: candidate.channelTitle || null,
      durationSeconds: candidate.durationSeconds || null,
      defaultLanguage: candidate.language || null,
      captionAvailable: null,   // Unknown — never fabricate
      embeddable: null,          // Unknown
      madeForKids: null,         // Unknown
      regionAllowed: [],
      regionBlocked: [],
      contentRatings: {},
      statistics: {},
      thumbnailUrls: candidate.thumbnailUrl ? [candidate.thumbnailUrl] : [],
      fetchedAt: nowISO(),
      metadataConfidence: FALLBACK_METADATA_CONFIDENCE,
    };

    return metadata;
  }

  /**
   * Normalize duration to seconds. Returns null if unknown.
   */
  normalizeDuration(seconds?: number | null): number | null {
    if (typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0) {
      return Math.round(seconds);
    }
    return null;
  }
}

export const videoMetadataService = new VideoMetadataService();
