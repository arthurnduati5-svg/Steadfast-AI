import type {
  AssistantMessageEnvelope,
  MessageLanguageMetadata,
  MessageMetadata,
  MessagePresentationMeta,
  MetacognitiveStateSnapshot,
  SystemNotice,
  TutorActionUiMeta,
  TutorRevisionNote,
} from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asSystemNotices(value: unknown): SystemNotice[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const record = asRecord(entry);
      if (!record) return null;
      const code = String(record.code || '').trim();
      const message = String(record.message || '').trim();
      const severity = String(record.severity || 'info').trim() as SystemNotice['severity'];
      if (!code || !message) return null;
      return {
        code,
        message,
        severity:
          severity === 'warning' || severity === 'error' || severity === 'info'
            ? severity
            : 'info',
      } satisfies SystemNotice;
    })
    .filter(Boolean) as SystemNotice[];
}

function asTutorRevisionNote(value: unknown): TutorRevisionNote | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const id = String(record.id || '').trim();
  const text = String(record.text || '').trim();
  const createdAt = String(record.createdAt || '').trim();
  if (!id || !text || !createdAt) return undefined;
  return {
    ...(record as Partial<TutorRevisionNote>),
    id,
    text,
    createdAt,
  } as TutorRevisionNote;
}

export type CanonicalAssistantMetadata = {
  envelope: AssistantMessageEnvelope | null;
  tutorUi?: TutorActionUiMeta;
  presentation?: MessagePresentationMeta;
  systemNotices: SystemNotice[];
  language?: MessageLanguageMetadata;
  metacognition?: MetacognitiveStateSnapshot | null;
  savedRevisionNote?: TutorRevisionNote;
};

export function resolveAssistantEnvelopeMetadata(
  metadata: MessageMetadata | Record<string, unknown> | null | undefined
): CanonicalAssistantMetadata {
  const metaRecord = asRecord(metadata) || {};
  const envelopeRecord = asRecord(metaRecord.assistantEnvelope);
  const envelope = (envelopeRecord || null) as AssistantMessageEnvelope | null;

  const tutorUi = (asRecord(envelopeRecord?.tutorUi) || asRecord(metaRecord.tutorUi) || undefined) as
    | TutorActionUiMeta
    | undefined;
  const presentation = (asRecord(envelopeRecord?.presentation) || asRecord(metaRecord.presentation) || undefined) as
    | MessagePresentationMeta
    | undefined;
  const language = (asRecord(envelopeRecord?.language) || asRecord(metaRecord.language) || undefined) as
    | MessageLanguageMetadata
    | undefined;
  const metacognition =
    (envelopeRecord?.metacognition as MetacognitiveStateSnapshot | null | undefined) ??
    (metaRecord.metacognition as MetacognitiveStateSnapshot | null | undefined);
  const savedRevisionNote =
    asTutorRevisionNote(envelopeRecord?.savedRevisionNote) ||
    asTutorRevisionNote(tutorUi?.savedRevisionNote) ||
    undefined;
  const systemNotices = asSystemNotices(envelopeRecord?.systemNotices || metaRecord.systemNotices);

  return {
    envelope,
    tutorUi,
    presentation,
    systemNotices,
    language,
    metacognition,
    savedRevisionNote,
  };
}
