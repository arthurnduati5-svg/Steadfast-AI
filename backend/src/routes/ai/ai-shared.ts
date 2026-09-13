/**
 * AI Route Shared — types, constants, and pure helpers
 *
 * Extracted from backend/src/routes/ai.ts for reuse across domain route modules.
 * Only pure/low-side-effect utilities belong here.
 */

export const safeString = (value: unknown): string => typeof value === 'string' ? value : '';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clampMediaText = (value: string, maxChars = 1200) => {
  const normalized = safeString(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length <= maxChars ? normalized : `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
};

export function parsePositiveInt(value: unknown, fallback: number, min = 1, max = 100): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
}

export function parseQueryBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return undefined;
}

export function parseQueryList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => safeString(entry).split(','))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeTopicLike(value?: string | null): string {
  return safeString(value).trim().toLowerCase();
}

export function parseNumericSignal(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

// ── Media helpers ──

export type MediaKind = 'audio' | 'video' | 'image' | 'explainer' | 'collection' | 'document';

export function getMediaKindGroup(asset: { assetKind?: string }): MediaKind {
  const kind = safeString(asset.assetKind).toLowerCase();
  if (kind === 'audio_recap') return 'audio';
  if (kind === 'video_recap') return 'video';
  if (kind === 'generated_image' || kind === 'annotated_image') return 'image';
  if (kind === 'visual_explainer' || kind === 'worksheet_explainer' || kind === 'media_card') return 'explainer';
  if (kind === 'media_collection_item') return 'collection';
  return 'document';
}

export function getRecencyBoost(updatedAt?: string | null): number {
  const date = parseIsoDate(updatedAt);
  if (!date) return 0;
  const days = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  return Math.max(0, Math.round(22 * Math.exp(-days / 18)));
}

export function getMediaSourceTrustBoost(sourceTrust: string, streamMode: 'study' | 'creative'): number {
  const normalized = sourceTrust.toLowerCase();
  if (normalized.includes('internal')) return streamMode === 'study' ? 16 : 10;
  if (normalized.includes('verified') || normalized.includes('high')) return 14;
  if (normalized.includes('trusted') || normalized.includes('medium')) return 10;
  if (normalized.includes('low')) return 2;
  return 6;
}

export function getKindPreferenceBoost(
  kind: ReturnType<typeof getMediaKindGroup>,
  preferredRecapType?: string | null
): number {
  const preferred = safeString(preferredRecapType).trim().toLowerCase();
  if (!preferred || preferred === 'mixed') return 0;
  if (preferred === 'audio') return kind === 'audio' ? 14 : -2;
  if (preferred === 'video') return kind === 'video' ? 14 : -2;
  if (preferred === 'visual') return kind === 'image' || kind === 'explainer' ? 14 : -2;
  return 0;
}

// ── Error response helpers ──

export function makeErrorResponse(message: string, status = 500) {
  return { message, status };
}
