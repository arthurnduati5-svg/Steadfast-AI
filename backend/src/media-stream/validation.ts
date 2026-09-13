// ─── Validation, Type-Guard & Parse Helpers ────────────────────────
// Extracted from backend/src/routes/ai.ts inline helpers.

import type {
  TutorActionRequest,
  TutorActionId,
  TutorState,
  TutorArtifact,
  TutorRevisionNote,
  MediaAsset,
  MediaStreamNoticePayload,
  VALID_TUTOR_ACTIONS,
} from './types.js';

export const safeString = (value: unknown) => (typeof value === 'string' ? value : '');

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

export function parsePositiveInt(value: unknown, fallback: number, min = 1, max = 100): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

export const toPrismaNestedJson = (value: unknown): any => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => {
      const normalized = toPrismaNestedJson(item);
      return normalized === undefined ? null : normalized;
    });
  }
  if (typeof value === 'object') {
    const record: Record<string, any> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      const normalized = toPrismaNestedJson(nestedValue);
      if (normalized !== undefined) {
        record[key] = normalized;
      }
    }
    return record;
  }
  return safeString(value);
};

export const toPrismaMetadata = (value: unknown): any => {
  const normalized = toPrismaNestedJson(value);
  if (normalized === undefined) return undefined;
  if (normalized === null) return { PrismaJsonNull: true };
  if (!Array.isArray(normalized) && typeof normalized === 'object' && Object.keys(normalized).length === 0) {
    return undefined;
  }
  return normalized;
};

export const normalizeCacheText = (value: string) =>
  safeString(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function isCreativeExternalVideoAsset(asset: MediaAsset): boolean {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const provider = safeString(asset.videoProvider || metadata.externalProvider || metadata.externalSourceType).trim().toLowerCase();
  const sourceUrl = safeString(asset.sourceUrl).trim().toLowerCase();
  const videoKind = getMediaKindGroup(asset) === 'video';
  if (!videoKind) return false;
  if (!sourceUrl && !provider) return false;
  if (provider.includes('youtube') || provider.includes('vimeo')) return true;
  if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be') || sourceUrl.includes('vimeo.com')) return true;
  return false;
}

export function isEducationSafeImagePrompt(prompt: string): boolean {
  const clean = safeString(prompt).trim();
  if (!clean) return false;
  const { EDUCATIONAL_IMAGE_BLOCKLIST, EDUCATIONAL_IMAGE_ALLOWLIST } = require('./types.js');
  if (EDUCATIONAL_IMAGE_BLOCKLIST.test(clean)) return false;
  return EDUCATIONAL_IMAGE_ALLOWLIST.test(clean);
}

export const isDefaultConversationStatePayload = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    record.researchModeActive === false &&
    record.researchReady === false &&
    record.awaitingPracticeQuestionInvitationResponse === false &&
    record.awaitingPracticeQuestionAnswer === false &&
    record.sensitiveContentDetected === false &&
    record.videoSuggested === false
  );
};

export function parseTutorAction(raw: unknown): TutorActionRequest | undefined {
  const record = asRecord(raw);
  if (!record) return undefined;
  const rawId = safeString(record.id);
  const id = (rawId === 'explain' ? 'breakdown' : rawId) as TutorActionId;
  const { VALID_TUTOR_ACTIONS } = require('./types.js');
  if (!VALID_TUTOR_ACTIONS.has(id)) return undefined;
  const selectionRangeRecord = asRecord(record.selectionRange);
  const parsedStartOffset = Number(selectionRangeRecord?.startOffset);
  const parsedEndOffset = Number(selectionRangeRecord?.endOffset);
  const parsedLength = Number(selectionRangeRecord?.length);
  const selectionRange =
    selectionRangeRecord &&
    (Number.isFinite(parsedStartOffset) || Number.isFinite(parsedEndOffset) || Number.isFinite(parsedLength))
      ? {
          ...(Number.isFinite(parsedStartOffset) && parsedStartOffset >= 0
            ? { startOffset: Math.floor(parsedStartOffset) }
            : {}),
          ...(Number.isFinite(parsedEndOffset) && parsedEndOffset >= 0 ? { endOffset: Math.floor(parsedEndOffset) } : {}),
          ...(Number.isFinite(parsedLength) && parsedLength > 0 ? { length: Math.floor(parsedLength) } : {}),
        }
      : undefined;
  return {
    id,
    sourceMessageId: safeString(record.sourceMessageId).trim() || undefined,
    sourceText: safeString(record.sourceText).trim() || undefined,
    selectedText: safeString(record.selectedText).trim() || undefined,
    sourceVideoId: safeString(record.sourceVideoId).trim() || undefined,
    sourceVideoTitle: safeString(record.sourceVideoTitle).trim() || undefined,
    sourceArtifactLabel: safeString(record.sourceArtifactLabel).trim() || undefined,
    sourceArtifactSummary: safeString(record.sourceArtifactSummary).trim() || undefined,
    invokedFrom: ['assistant_card', 'selection_menu', 'composer'].includes(safeString(record.invokedFrom))
      ? (safeString(record.invokedFrom) as TutorActionRequest['invokedFrom'])
      : undefined,
    selectionSourceKind: ['assistant_message', 'user_message', 'artifact', 'video_summary', 'study_material'].includes(safeString(record.selectionSourceKind))
      ? (safeString(record.selectionSourceKind) as TutorActionRequest['selectionSourceKind'])
      : undefined,
    sourceType: safeString(record.sourceType).trim() || undefined,
    sourceDocumentId: safeString(record.sourceDocumentId).trim() || undefined,
    selectionRange:
      selectionRange &&
      (selectionRange.startOffset !== undefined ||
        selectionRange.endOffset !== undefined ||
        selectionRange.length !== undefined)
        ? selectionRange
        : undefined,
    inputOrigin: ['text', 'pasted_question', 'worksheet_followup', 'camera_capture', 'file_upload'].includes(safeString(record.inputOrigin))
      ? (safeString(record.inputOrigin) as TutorActionRequest['inputOrigin'])
      : undefined,
    composerIntent: safeString(record.composerIntent).trim() || undefined,
    linkedArtifactId: safeString(record.linkedArtifactId).trim() || undefined,
  };
}

export function getTutorStateFromMetadata(metadata: unknown): TutorState {
  const record = asRecord(metadata);
  const nested = asRecord(record?.tutorState);
  return (nested || {}) as TutorState;
}

export function getTutorArtifactsFromMetadata(metadata: unknown): TutorArtifact[] {
  const record = asRecord(metadata);
  const raw = Array.isArray(record?.tutorArtifacts) ? record?.tutorArtifacts : [];
  return raw as TutorArtifact[];
}

export function getTutorRevisionNotesFromMetadata(metadata: unknown): TutorRevisionNote[] {
  const record = asRecord(metadata);
  const raw = Array.isArray(record?.tutorRevisionNotes) ? record?.tutorRevisionNotes : [];
  return raw as TutorRevisionNote[];
}

export function getMediaKindGroup(asset: MediaAsset): 'audio' | 'video' | 'image' | 'explainer' | 'collection' | 'document' {
  const kind = safeString(asset.assetKind).toLowerCase();
  if (kind === 'audio_recap') return 'audio';
  if (kind === 'video_recap') return 'video';
  if (kind === 'generated_image' || kind === 'annotated_image') return 'image';
  if (kind === 'visual_explainer' || kind === 'worksheet_explainer' || kind === 'media_card') return 'explainer';
  if (kind === 'media_collection_item') return 'collection';
  return 'document';
}
