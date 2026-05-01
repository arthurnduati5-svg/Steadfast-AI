import fs from 'node:fs';
import path from 'node:path';

export type BackendCandidate = {
  url: string;
  source: 'configured' | 'discovered' | 'default';
};

const DEFAULT_BACKEND_URLS = ['http://127.0.0.1:8080', 'http://localhost:8080'];
const DISCOVERY_RELATIVE_PATHS = [
  path.join('frontend', '.next-dev', 'backend-url.json'),
  path.join('.next-dev', 'backend-url.json'),
  path.join('..', 'frontend', '.next-dev', 'backend-url.json'),
];

function normalizeBackendUrl(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function readDiscoveredBackendUrl(): string {
  for (const relativePath of DISCOVERY_RELATIVE_PATHS) {
    const candidatePath = path.resolve(process.cwd(), relativePath);
    try {
      const raw = fs.readFileSync(candidatePath, 'utf8');
      const parsed = JSON.parse(raw);
      const url = normalizeBackendUrl(parsed?.url);
      if (url) return url;
    } catch {
      // Try the next possible cwd layout.
    }
  }
  return '';
}

export function getBackendCandidates(): BackendCandidate[] {
  const configured = normalizeBackendUrl(
    process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL
  );
  if (configured) {
    return [{ url: configured, source: 'configured' }];
  }

  const seen = new Set<string>();
  const candidates: BackendCandidate[] = [];
  const discovered = readDiscoveredBackendUrl();

  for (const candidate of [
    discovered ? { url: discovered, source: 'discovered' as const } : null,
    ...DEFAULT_BACKEND_URLS.map((url) => ({ url, source: 'default' as const })),
  ]) {
    if (!candidate || seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    candidates.push(candidate);
  }

  return candidates;
}

export async function isUsableBackendCandidate(candidate: BackendCandidate): Promise<boolean> {
  if (candidate.source === 'configured') return true;

  try {
    const response = await fetch(`${candidate.url}/api/health`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) return false;
    const payload = await response.json().catch(() => null);
    return payload?.status === 'ok';
  } catch {
    return false;
  }
}
