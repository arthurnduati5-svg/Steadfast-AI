// STREAM-14 — provider operations: bounding, timeouts, fanout, deterministic
// settled collection, operational observations. No business logic, no rights,
// no ranking, no classification.

import type {
  MediaProviderAdapter,
  MediaProviderRegistry,
  ProviderDiscoveryCandidate,
  ProviderDiscoveryRequest,
  ProviderDiscoveryResult,
  ProviderDiscoveryStatus,
  ProviderRefreshRequest,
  ProviderRefreshResult,
} from './mediaProviderPort';
import {
  DISCOVERY_TIMEOUT_MS,
  MAX_CANDIDATES_PER_PROVIDER,
  MAX_DISCOVERY_PROVIDERS,
  MAX_MERGED_CANDIDATES,
  REFRESH_TIMEOUT_MS,
} from './mediaProviderPort';

export type ProviderOperationKind = 'DISCOVERY' | 'REFRESH' | 'PLAYBACK';

export type ProviderOperationOutcome =
  | 'SUCCESS'
  | 'EMPTY'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'INVALID'
  | 'FAILED'
  | 'UNCONFIGURED';

export interface MediaProviderOperationEvent {
  providerKey: string;
  operation: ProviderOperationKind;
  outcome: ProviderOperationOutcome;
  durationMs: number;
  candidateCount?: number;
}

export type OperationObserver = (event: MediaProviderOperationEvent) => void;

export interface BoundedDiscoveryOptions {
  maxProviders?: number;
  maxPerProvider?: number;
  maxMerged?: number;
  timeoutMs?: number;
  observer?: OperationObserver | null;
  now?: () => number;
}

export interface PerProviderDiscoveryOutcome {
  providerKey: string;
  status: ProviderDiscoveryStatus | 'TIMEOUT' | 'FAILED';
  durationMs: number;
  candidateCount: number;
  candidates: ProviderDiscoveryCandidate[];
}

export interface BoundedDiscoveryResult {
  merged: ProviderDiscoveryCandidate[];
  providers: PerProviderDiscoveryOutcome[];
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error('[MEDIA_PROVIDER_TIMEOUT] provider call timed out.'));
      }, timeoutMs);
      if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') {
        (timer as unknown as { unref: () => void }).unref();
      }
      work.then(
        (value) => {
          if (timer) clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          if (timer) clearTimeout(timer);
          reject(error);
        },
      );
    });
  } catch (error) {
    if (timer) clearTimeout(timer);
    throw error;
  }
}

function discoveryStatusToOutcome(status: PerProviderDiscoveryOutcome['status']): ProviderOperationOutcome {
  if (status === 'READY') return 'SUCCESS';
  if (status === 'EMPTY') return 'EMPTY';
  if (status === 'UNCONFIGURED') return 'UNCONFIGURED';
  if (status === 'TIMEOUT') return 'TIMEOUT';
  if (status === 'FAILED') return 'FAILED';
  return 'UNAVAILABLE';
}

// Deterministic merge: providerKey sort order is fixed before any network
// call; Promise.allSettled timing never affects ordering. Within a provider,
// original candidate order is preserved; identity dedupe keeps the first.
export function mergeDiscoveryCandidates(
  perProvider: PerProviderDiscoveryOutcome[],
  maxMerged: number,
): ProviderDiscoveryCandidate[] {
  const seen = new Set<string>();
  const merged: ProviderDiscoveryCandidate[] = [];
  const ordered = [...perProvider].sort((a, b) => (a.providerKey < b.providerKey ? -1 : 1));
  for (const entry of ordered) {
    for (const candidate of entry.candidates) {
      const key = `${entry.providerKey}:${candidate.providerResourceId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(candidate);
      if (merged.length >= maxMerged) return merged;
    }
  }
  return merged;
}

export async function executeBoundedDiscovery(
  registry: MediaProviderRegistry,
  request: ProviderDiscoveryRequest,
  options: BoundedDiscoveryOptions = {},
): Promise<BoundedDiscoveryResult> {
  const maxProviders = Math.min(
    Math.max(1, options.maxProviders ?? MAX_DISCOVERY_PROVIDERS),
    MAX_DISCOVERY_PROVIDERS,
  );
  const maxPerProvider = Math.min(
    Math.max(1, options.maxPerProvider ?? MAX_CANDIDATES_PER_PROVIDER),
    MAX_CANDIDATES_PER_PROVIDER,
  );
  const maxMerged = Math.min(Math.max(1, options.maxMerged ?? MAX_MERGED_CANDIDATES), MAX_MERGED_CANDIDATES);
  const timeoutMs = Math.max(1, options.timeoutMs ?? DISCOVERY_TIMEOUT_MS);
  const now = options.now ?? Date.now;
  const observer = options.observer ?? null;

  const adapters: MediaProviderAdapter[] = registry
    .listDiscoveryCapable()
    .slice(0, maxProviders);

  const startedAt = adapters.map(() => now());
  const calls = adapters.map((adapter, index) =>
    (async (): Promise<PerProviderDiscoveryOutcome> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') {
        (timer as unknown as { unref: () => void }).unref();
      }
      const started = startedAt[index];
      try {
        const result: ProviderDiscoveryResult = await withTimeout(
          adapter.discover!(request, { signal: controller.signal }),
          timeoutMs,
        );
        const candidates = (result.candidates ?? []).slice(0, maxPerProvider);
        const status: PerProviderDiscoveryOutcome['status'] =
          result.status === 'READY' || result.status === 'EMPTY' || result.status === 'UNAVAILABLE' || result.status === 'UNCONFIGURED'
            ? result.status
            : 'FAILED';
        const outcome: PerProviderDiscoveryOutcome = {
          providerKey: adapter.providerKey,
          status,
          durationMs: Math.max(0, now() - started),
          candidateCount: candidates.length,
          candidates,
        };
        observer?.({
          providerKey: adapter.providerKey,
          operation: 'DISCOVERY',
          outcome: candidates.length > 0 && status === 'READY' ? 'SUCCESS' : discoveryStatusToOutcome(status),
          durationMs: outcome.durationMs,
          candidateCount: candidates.length,
        });
        return outcome;
      } catch (error) {
        const timedOut =
          error instanceof Error &&
          (error.message.includes('MEDIA_PROVIDER_TIMEOUT') || error.name === 'AbortError');
        const outcome: PerProviderDiscoveryOutcome = {
          providerKey: adapter.providerKey,
          status: timedOut ? 'TIMEOUT' : 'FAILED',
          durationMs: Math.max(0, now() - started),
          candidateCount: 0,
          candidates: [],
        };
        observer?.({
          providerKey: adapter.providerKey,
          operation: 'DISCOVERY',
          outcome: timedOut ? 'TIMEOUT' : 'FAILED',
          durationMs: outcome.durationMs,
          candidateCount: 0,
        });
        return outcome;
      } finally {
        clearTimeout(timer);
      }
    })(),
  );

  // allSettled-equivalent isolation: one rejection can never kill siblings.
  const settled = await Promise.all(calls.map((call) => call.catch((): PerProviderDiscoveryOutcome | null => null)));
  const perProvider: PerProviderDiscoveryOutcome[] = [];
  adapters.forEach((adapter, index) => {
    const outcome = settled[index];
    if (outcome) {
      perProvider.push(outcome);
      return;
    }
    perProvider.push({
      providerKey: adapter.providerKey,
      status: 'FAILED',
      durationMs: 0,
      candidateCount: 0,
      candidates: [],
    });
  });
  // Stable provider ordering regardless of completion timing.
  perProvider.sort((a, b) => (a.providerKey < b.providerKey ? -1 : 1));
  return { merged: mergeDiscoveryCandidates(perProvider, maxMerged), providers: perProvider };
}

export interface BoundedRefreshOptions {
  timeoutMs?: number;
  observer?: OperationObserver | null;
  now?: () => number;
}

// ONE remote attempt per refresh execution. STREAM-12 owns all retry timing.
export async function executeBoundedRefresh(
  adapter: MediaProviderAdapter,
  request: ProviderRefreshRequest,
  options: BoundedRefreshOptions = {},
): Promise<ProviderRefreshResult> {
  const timeoutMs = Math.max(1, options.timeoutMs ?? REFRESH_TIMEOUT_MS);
  const now = options.now ?? Date.now;
  const started = now();
  const observer = options.observer ?? null;
  if (typeof adapter.refreshResource !== 'function') {
    observer?.({ providerKey: adapter.providerKey, operation: 'REFRESH', outcome: 'INVALID', durationMs: 0 });
    return { status: 'MALFORMED', providerStatus: 'refresh_unsupported', metadataPatch: null };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') {
    (timer as unknown as { unref: () => void }).unref();
  }
  try {
    const result = await withTimeout(
      adapter.refreshResource({ providerResourceId: clean(request.providerResourceId) }, { signal: controller.signal }),
      timeoutMs,
    );
    const outcome: ProviderOperationOutcome =
      result.status === 'AVAILABLE' ? 'SUCCESS'
      : result.status === 'NOT_FOUND' ? 'UNAVAILABLE'
      : result.status === 'UNCONFIGURED' ? 'UNCONFIGURED'
      : result.status === 'MALFORMED' ? 'INVALID'
      : result.status === 'TRANSIENT' ? 'UNAVAILABLE'
      : 'FAILED';
    observer?.({
      providerKey: adapter.providerKey,
      operation: 'REFRESH',
      outcome,
      durationMs: Math.max(0, now() - started),
    });
    return result;
  } catch (error) {
    const timedOut =
      error instanceof Error && (error.message.includes('MEDIA_PROVIDER_TIMEOUT') || error.name === 'AbortError');
    observer?.({
      providerKey: adapter.providerKey,
      operation: 'REFRESH',
      outcome: timedOut ? 'TIMEOUT' : 'FAILED',
      durationMs: Math.max(0, now() - started),
    });
    return { status: 'TRANSIENT', providerStatus: timedOut ? 'timeout' : 'refresh_failed', metadataPatch: null };
  } finally {
    clearTimeout(timer);
  }
}

// Privacy allowlist for discovery: neutral search context only.
const DISCOVERY_ALLOWED_KEYS = new Set(['query', 'subject', 'topic', 'language', 'schoolLevel', 'learningNeed', 'limit']);

export function assertDiscoveryRequestPrivacy(request: Record<string, unknown>): void {
  for (const key of Object.keys(request)) {
    if (!DISCOVERY_ALLOWED_KEYS.has(key)) {
      throw new Error(`[MEDIA_PROVIDER_PRIVACY] Discovery request carries forbidden field: ${key}.`);
    }
  }
}

export const OPERATIONS_BOUNDS = {
  MAX_DISCOVERY_PROVIDERS,
  MAX_CANDIDATES_PER_PROVIDER,
  MAX_MERGED_CANDIDATES,
  DISCOVERY_TIMEOUT_MS,
  REFRESH_TIMEOUT_MS,
} as const;
