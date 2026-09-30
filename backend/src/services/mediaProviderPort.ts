// STREAM-4 — provider-neutral media provider port + adapter registry.
// Providers supply metadata, identity, playback capability, playback
// resolution, and operational status. They own NOTHING about recommendation,
// ranking, learner state, mastery, rights, school authorization, safety, or
// Deen policy. Adapters resolve playback only AFTER Steadfast eligibility
// permits the requested operation (enforced by the orchestrator, not here).

import type { MediaPlaybackMode } from '../contracts/mediaPlaybackContracts';

// Minimal privacy-safe adapter input: only what resolution requires.
export interface ProviderPlaybackRequest {
  providerResourceId: string;
  mode: MediaPlaybackMode;
}

export interface ProviderPlaybackContext {
  territory: string | null;
  signal: AbortSignal | null;
}

export type ProviderPlaybackUnavailableReason =
  | 'NOT_FOUND'
  | 'REGION_BLOCKED'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'UNSUPPORTED';

export type ProviderPlaybackResult =
  | {
      status: 'READY';
      mode: MediaPlaybackMode;
      url: string;
      expiresAt?: string | null;
      attribution?: string | null;
    }
  | {
      status: 'UNAVAILABLE';
      reason: ProviderPlaybackUnavailableReason;
    };

export interface MediaProviderAdapter {
  readonly providerKey: string;
  readonly playbackCapabilities: readonly MediaPlaybackMode[];
  // STREAM-13 additive supply capability. All optional: existing
  // playback-only adapters (incl. focused-test fakes) keep compiling.
  readonly supplyClass?: MediaProviderSupplyClass;
  readonly discoverySupported?: boolean;
  readonly refreshSupported?: boolean;
  resolvePlayback(
    request: ProviderPlaybackRequest,
    context: ProviderPlaybackContext,
  ): Promise<ProviderPlaybackResult>;
  discover?(
    request: ProviderDiscoveryRequest,
    context: ProviderDiscoveryContext,
  ): Promise<ProviderDiscoveryResult>;
  refreshResource?(
    request: ProviderRefreshRequest,
    context: ProviderRefreshContext,
  ): Promise<ProviderRefreshResult>;
}

// STREAM-13/14 — provider supply + operations contract (additive).
// One registry owns playback + discovery + refresh capability registration.

export type MediaProviderSupplyClass = 'PUBLIC' | 'LICENSED';

export interface ProviderDiscoveryRequest {
  query: string | null;
  subject: string | null;
  topic: string | null;
  language: string | null;
  schoolLevel: string | null;
  learningNeed: string | null;
  limit: number;
}

export interface ProviderDiscoveryContext {
  signal: AbortSignal | null;
}

export interface ProviderRightsEvidence {
  evidenceRef: string;
  source: 'PROVIDER_TERMS' | 'DIRECT_LICENSE' | 'OPEN_LICENSE' | 'PUBLIC_DOMAIN';
  permissions: string[];
  territories: string[];
  scope: 'GLOBAL' | 'REQUESTING_SCHOOL';
  validFrom: string | null;
  validUntil: string | null;
  attributionRequired: boolean;
  attributionText: string | null;
}

export interface ProviderAvailabilityEvidence {
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
  providerStatus: string | null;
}

export interface ProviderDiscoveryCandidate {
  providerResourceId: string;
  mediaKind: string;
  title: string;
  description: string | null;
  summary: string | null;
  subject: string | null;
  topic: string | null;
  subtopic: string | null;
  language: string | null;
  tags: string[];
  sourceUrl: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
  sourceTrust: string | null;
  safetyStatus: string | null;
  metadata: Record<string, unknown>;
  playbackModes: MediaPlaybackMode[];
  rightsEvidence: ProviderRightsEvidence | null;
  availabilityEvidence: ProviderAvailabilityEvidence | null;
}

export type ProviderDiscoveryStatus = 'READY' | 'EMPTY' | 'UNAVAILABLE' | 'UNCONFIGURED';

export interface ProviderDiscoveryResult {
  status: ProviderDiscoveryStatus;
  candidates: ProviderDiscoveryCandidate[];
  providerStatus: string | null;
}

export interface ProviderRefreshRequest {
  providerResourceId: string;
}

export interface ProviderRefreshContext {
  signal: AbortSignal | null;
}

export type ProviderRefreshStatus = 'AVAILABLE' | 'NOT_FOUND' | 'TRANSIENT' | 'MALFORMED' | 'UNCONFIGURED';

export interface ProviderRefreshResult {
  status: ProviderRefreshStatus;
  providerStatus: string | null;
  metadataPatch: Record<string, unknown> | null;
}

export type MediaProviderErrorCode =
  | 'UNCONFIGURED'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'NOT_FOUND'
  | 'MALFORMED'
  | 'INVALID_RIGHTS_EVIDENCE'
  | 'PROVIDER_INTERNAL_FAILURE';

// STREAM-14 frozen operational budgets.
export const MAX_DISCOVERY_PROVIDERS = 4;
export const MAX_CANDIDATES_PER_PROVIDER = 25;
export const MAX_MERGED_CANDIDATES = 50;
export const DISCOVERY_TIMEOUT_MS = 6000;
export const REFRESH_TIMEOUT_MS = 5000;
// PLAYBACK_TIMEOUT_MS remains the STREAM-4 5000 (DEFAULT_PROVIDER_RESOLUTION_TIMEOUT_MS).

function normalizeProviderKey(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function fail(code: string, message: string): never {
  throw new Error(`[${code}] ${message}`);
}

// ONE adapter registry. Keys normalized consistently; duplicates rejected
// immediately; no dynamic imports; no network discovery.
export class MediaProviderRegistry {
  private readonly adapters = new Map<string, MediaProviderAdapter>();

  register(adapter: MediaProviderAdapter): void {
    const key = normalizeProviderKey(adapter?.providerKey);
    if (!key) fail('MEDIA_PROVIDER_INVALID_KEY', 'Adapter providerKey is required.');
    if (this.adapters.has(key)) {
      fail('MEDIA_PROVIDER_DUPLICATE', `Provider already registered: ${key}.`);
    }
    this.adapters.set(key, adapter);
  }

  get(providerKey: string): MediaProviderAdapter | null {
    return this.adapters.get(normalizeProviderKey(providerKey)) ?? null;
  }

  has(providerKey: string): boolean {
    return this.adapters.has(normalizeProviderKey(providerKey));
  }

  // STREAM-13: idempotent registration for bootstrap (no throw on repeat).
  registerIfAbsent(adapter: MediaProviderAdapter): void {
    const key = normalizeProviderKey(adapter?.providerKey);
    if (!key) fail('MEDIA_PROVIDER_INVALID_KEY', 'Adapter providerKey is required.');
    if (!this.adapters.has(key)) this.adapters.set(key, adapter);
  }

  // STREAM-13: stable providerKey-sorted snapshot for deterministic fanout.
  listAdapters(): MediaProviderAdapter[] {
    return [...this.adapters.values()].sort((a, b) =>
      normalizeProviderKey(a.providerKey) < normalizeProviderKey(b.providerKey) ? -1 : 1,
    );
  }

  listDiscoveryCapable(): MediaProviderAdapter[] {
    return this.listAdapters().filter((adapter) => adapter.discoverySupported === true && typeof adapter.discover === 'function');
  }
}

// Production registry instance. Initially empty; provider activation
// registers concrete adapters later. Tests instantiate isolated registries.
export const mediaProviderRegistry = new MediaProviderRegistry();
