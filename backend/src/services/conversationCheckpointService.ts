// ─────────────────────────────────────────────────────────────
// Steadfast AI — Conversation Checkpoint / Continuity Service v1
// (STEADFAST-CHAT-BACKEND-DURABILITY-V1)
//
// Builds the exact as-of-turn checkpoint persisted on ChatTurn.checkpoint
// when a turn completes, and the bounded rolling continuity summary that
// ChatSession.summarization carries. This is historical state AS OF that
// assistant response — never a replacement for the current TutorState,
// StudentLearningSession or learner-memory owners.
//
// Capture rule: only fields already legitimately available at that turn;
// nothing is manufactured. Never stored: chain of thought, hidden
// reasoning, system prompts, provider raw payloads, API secrets,
// teacher-only answer keys, unrelated learner history, raw safeguarding
// disclosures.
// ─────────────────────────────────────────────────────────────

export const CHAT_TURN_CHECKPOINT_SCHEMA_VERSION = 1;

const MAX_CONTINUITY_SUMMARY_CHARS = 1200;
const MAX_SUMMARY_ITEM_CHARS = 240;
const MAX_SUMMARY_ITEMS = 8;
const MAX_REF_ITEMS = 10;
const MAX_REF_CHARS = 200;

function truncate(value: unknown, maxChars: number): string {
  const raw = typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value);
  const trimmed = raw.trim();
  return trimmed.length <= maxChars ? trimmed : `${trimmed.slice(0, Math.max(0, maxChars - 1))}…`;
}

function boundedStringArray(value: unknown, maxItems: number, maxChars: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => truncate(entry, maxChars))
    .filter((entry) => entry.length > 0)
    .slice(0, maxItems);
}

interface SafeRecord {
  [key: string]: unknown;
}

function asSafeRecord(value: unknown): SafeRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as SafeRecord) : {};
}

function pick(value: unknown, keys: string[]): SafeRecord {
  const source = asSafeRecord(value);
  const out: SafeRecord = {};
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) out[key] = source[key];
  }
  return out;
}

function safeNumber(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

// ── Exact as-of-turn checkpoint ──

export interface TurnCheckpointInput {
  conversationState?: unknown;
  tutorState?: unknown;
  learningSessionRef?: unknown;
  activeSubject?: unknown;
  activeTopic?: unknown;
  studyMode?: unknown;
  languageState?: unknown;
  misconceptionFocus?: unknown;
  masteryRecoveryState?: unknown;
  metacognitiveState?: unknown;
  artifacts?: unknown;
  videoData?: unknown;
  sources?: unknown;
  evidenceRefs?: unknown;
  learnerStage?: unknown;
  recommendedMode?: unknown;
}

export interface TurnCheckpoint extends SafeRecord {
  schemaVersion: number;
  checkpointKind: 'exact';
  conversationState: SafeRecord;
  tutorState: SafeRecord;
  learningSession: SafeRecord;
  activeSubject?: string;
  activeTopic?: string;
  studyMode?: string;
  languageState: SafeRecord;
  misconceptionFocus: SafeRecord;
  masteryRecoveryState: SafeRecord;
  metacognitiveState: SafeRecord;
  artifactContext: SafeRecord;
  videoContext: SafeRecord;
  evidenceRefs: string[];
  sourceRefs: string[];
  learnerStage?: string;
  recommendedMode?: string;
  continuitySummary?: string;
}

/**
 * Versioned exact checkpoint built from state that already exists at the
 * moment the assistant response is accepted. Bounded and safe for durable
 * storage and branch reconstruction.
 */
export function buildExactTurnCheckpoint(input: TurnCheckpointInput): TurnCheckpoint {
  const tutorStateSource = asSafeRecord(input.tutorState);
  const checkpoint: TurnCheckpoint = {
    schemaVersion: CHAT_TURN_CHECKPOINT_SCHEMA_VERSION,
    checkpointKind: 'exact',

    conversationState: pick(input.conversationState, [
      'lastStudyTopic',
      'lastTopic',
      'awaitingPracticeQuestionAnswer',
      'lastPracticeQuestion',
      'mistakeCount',
      'successCount',
      'currentMasteryLevel',
      'identifiedWeakAreas',
      'sessionGoals',
      'examPrepMode',
      'focusMode',
    ]),

    tutorState: {
      ...pick(tutorStateSource, [
        'stateVersion',
        'activeSubject',
        'activeTopic',
        'currentStudyMode',
        'recommendedNextAction',
        'learnerStage',
        'awaitingStudentAttempt',
        'lastIntent',
        'reflectionSignal',
        'topicMastery',
        'weakTopicRecovery',
        'preferredSupportPatterns',
        'activeVideoSummary',
        'activeVideoTitle',
      ]),
      ...(safeNumber(tutorStateSource.stateVersion) !== undefined
        ? { stateVersion: safeNumber(tutorStateSource.stateVersion) }
        : {}),
    },

    learningSession: asSafeRecord(input.learningSessionRef),

    activeSubject: truncate(input.activeSubject, MAX_REF_CHARS) || undefined,
    activeTopic: truncate(input.activeTopic, MAX_REF_CHARS) || undefined,
    studyMode: truncate(input.studyMode, MAX_REF_CHARS) || undefined,

    languageState: pick(input.languageState, [
      'preferredLanguageMode',
      'preferredResponseLanguage',
      'lastDetectedInputLanguage',
    ]),

    misconceptionFocus: pick(input.misconceptionFocus, ['topic', 'concept', 'severity', 'evidenceSummary']),
    masteryRecoveryState: pick(input.masteryRecoveryState, ['state', 'stage', 'topic', 'reasonCode']),
    metacognitiveState: pick(input.metacognitiveState, [
      'confidenceLevel',
      'errorType',
      'readinessLevel',
      'focusLevel',
      'reflectionPrompt',
    ]),

    artifactContext: {
      ids: boundedStringArray(
        (Array.isArray(input.artifacts) ? input.artifacts : []).map(
          (artifact: any) => artifact?.id ?? artifact?.artifactId,
        ),
        MAX_REF_ITEMS,
        MAX_REF_CHARS,
      ),
      labels: boundedStringArray(
        (Array.isArray(input.artifacts) ? input.artifacts : []).map(
          (artifact: any) => artifact?.label ?? artifact?.title ?? artifact?.fileName,
        ),
        MAX_REF_ITEMS,
        MAX_REF_CHARS,
      ),
      summaries: boundedStringArray(
        (Array.isArray(input.artifacts) ? input.artifacts : []).map(
          (artifact: any) => artifact?.summary ?? artifact?.contextSummary,
        ),
        MAX_REF_ITEMS,
        MAX_SUMMARY_ITEM_CHARS,
      ),
    },

    videoContext: (() => {
      const video = asSafeRecord(input.videoData);
      if (!video.id && !video.title) return {};
      return {
        id: truncate(video.id, MAX_REF_CHARS) || undefined,
        title: truncate(video.title, MAX_REF_CHARS) || undefined,
        summary: truncate(video.summary ?? video.activeVideoSummary, MAX_SUMMARY_ITEM_CHARS) || undefined,
      };
    })(),

    evidenceRefs: boundedStringArray(input.evidenceRefs, MAX_REF_ITEMS, MAX_REF_CHARS),
    sourceRefs: boundedStringArray(
      (Array.isArray(input.sources) ? input.sources : []).map(
        (source: any) => source?.url || source?.title || source?.link,
      ),
      MAX_REF_ITEMS,
      MAX_REF_CHARS,
    ),

    learnerStage: truncate(input.learnerStage, MAX_REF_CHARS) || undefined,
    recommendedMode: truncate(input.recommendedMode, MAX_REF_CHARS) || undefined,
  };

  checkpoint.continuitySummary = deriveContinuitySummaryFromCheckpoint(checkpoint);
  return checkpoint;
}

// ── Rolling continuity summary (bounded) ──

/**
 * Derives the bounded rolling conversation-continuity summary carried by
 * ChatSession.summarization and embedded in the checkpoint. Respects the
 * context budget: never exceeds MAX_CONTINUITY_SUMMARY_CHARS.
 */
export function deriveContinuitySummaryFromCheckpoint(checkpoint: unknown): string {
  const source = asSafeRecord(checkpoint);
  const lines: string[] = [];

  const topic = truncate(source.activeTopic, MAX_SUMMARY_ITEM_CHARS);
  const subject = truncate(source.activeSubject, MAX_REF_CHARS);
  if (subject || topic) lines.push(`Focus: ${[subject, topic].filter(Boolean).join(' — ')}`);

  const studyMode = truncate(source.studyMode, MAX_REF_CHARS);
  if (studyMode) lines.push(`Mode: ${studyMode}`);

  const conversation = asSafeRecord(source.conversationState);
  if (conversation.lastStudyTopic || conversation.lastTopic) {
    lines.push(`Recent topic: ${truncate(conversation.lastStudyTopic ?? conversation.lastTopic, MAX_SUMMARY_ITEM_CHARS)}`);
  }
  if (conversation.awaitingPracticeQuestionAnswer === true) {
    lines.push('Awaiting the learner\'s practice answer.');
  }

  const video = asSafeRecord(source.videoContext);
  if (video.title) lines.push(`Active video: ${truncate(video.title, MAX_SUMMARY_ITEM_CHARS)}`);

  const artifactIds = boundedStringArray(asSafeRecord(source.artifactContext).ids, 3, MAX_REF_CHARS);
  if (artifactIds.length > 0) lines.push(`Active artifacts: ${artifactIds.join(', ')}`);

  const misconception = asSafeRecord(source.misconceptionFocus);
  if (misconception.topic || misconception.concept) {
    lines.push(`Misconception focus: ${truncate(misconception.concept ?? misconception.topic, MAX_SUMMARY_ITEM_CHARS)}`);
  }

  const metacognitive = asSafeRecord(source.metacognitiveState);
  if (metacognitive.confidenceLevel || metacognitive.errorType) {
    lines.push(
      `Learner state: ${[metacognitive.confidenceLevel, metacognitive.errorType]
        .filter(Boolean)
        .map((entry) => truncate(entry, 60))
        .join(', ')}`,
    );
  }

  const language = asSafeRecord(source.languageState);
  if (language.preferredResponseLanguage || language.preferredLanguageMode) {
    lines.push(`Language: ${truncate(language.preferredResponseLanguage ?? language.preferredLanguageMode, 60)}`);
  }

  if (typeof source.learnerStage === 'string' && source.learnerStage) {
    lines.push(`Stage: ${truncate(source.learnerStage, MAX_REF_CHARS)}`);
  }

  let summary = lines.join('\n');
  if (summary.length > MAX_CONTINUITY_SUMMARY_CHARS) {
    summary = `${summary.slice(0, Math.max(0, MAX_CONTINUITY_SUMMARY_CHARS - 1))}…`;
  }
  return summary;
}

// ── Legacy reconstruction (branch/continue from pre-durability history) ──

export interface LegacyCheckpointMessage {
  id?: string;
  role?: string;
  content?: string;
  metadata?: unknown;
}

/**
 * Deterministic reconstruction from information at or before the selected
 * point only: transcript prefix, message-local metadata, artifact/source/
 * video metadata in the prefix. Fields that cannot be reconstructed safely
 * are omitted rather than importing future knowledge.
 */
export function reconstructLegacyCheckpoint(args: {
  sessionTopic?: unknown;
  messagesUpToPoint: LegacyCheckpointMessage[];
}): SafeRecord {
  const prefix = Array.isArray(args.messagesUpToPoint) ? args.messagesUpToPoint : [];

  const artifacts: SafeRecord[] = [];
  const sources: unknown[] = [];
  let video: SafeRecord = {};
  let lastStudyTopic = truncate(args.sessionTopic, MAX_REF_CHARS) || '';
  let awaitingPracticeQuestionAnswer: boolean | undefined;

  for (const message of prefix) {
    const metadata = asSafeRecord(message.metadata);

    if (Array.isArray(metadata.tutorArtifacts)) {
      for (const artifact of metadata.tutorArtifacts.slice(0, MAX_REF_ITEMS)) {
        const safeArtifact = asSafeRecord(artifact);
        if (safeArtifact.id || safeArtifact.title || safeArtifact.fileName) {
          artifacts.push({
            id: truncate(safeArtifact.id ?? safeArtifact.artifactId, MAX_REF_CHARS),
            label: truncate(safeArtifact.title ?? safeArtifact.label ?? safeArtifact.fileName, MAX_REF_CHARS),
            summary: truncate(safeArtifact.summary ?? safeArtifact.contextSummary, MAX_SUMMARY_ITEM_CHARS),
          });
        }
      }
    }
    if (Array.isArray(metadata.sources)) {
      for (const source of metadata.sources.slice(0, MAX_REF_ITEMS)) {
        const safeSource = asSafeRecord(source);
        const ref = safeSource.url || safeSource.title || safeSource.link;
        if (ref) sources.push(String(ref));
      }
    }
    const videoData = asSafeRecord(metadata.videoData ?? metadata.video);
    if (videoData.id || videoData.title) {
      video = {
        id: truncate(videoData.id, MAX_REF_CHARS) || undefined,
        title: truncate(videoData.title, MAX_REF_CHARS) || undefined,
        summary: truncate(videoData.summary, MAX_SUMMARY_ITEM_CHARS) || undefined,
      };
    }
    const messageTopic = metadata.lastStudyTopic ?? metadata.lastTopic ?? (asSafeRecord(metadata.tutorState).activeTopic);
    if (messageTopic) lastStudyTopic = truncate(messageTopic, MAX_REF_CHARS);

    const conversation = asSafeRecord(metadata.conversationState);
    if (conversation.awaitingPracticeQuestionAnswer === true) {
      awaitingPracticeQuestionAnswer = true;
    }
  }

  // Later-knowledge guards: only prefix-derived values are used above.
  const checkpoint: SafeRecord = {
    schemaVersion: CHAT_TURN_CHECKPOINT_SCHEMA_VERSION,
    checkpointKind: 'reconstructed',
    conversationState: {
      ...(lastStudyTopic ? { lastStudyTopic } : {}),
      ...(awaitingPracticeQuestionAnswer === true ? { awaitingPracticeQuestionAnswer: true } : {}),
    },
    tutorState: {
      ...(lastStudyTopic ? { activeTopic: lastStudyTopic } : {}),
    },
    learningSession: {},
    artifactContext: {
      ids: artifacts.map((artifact) => artifact.id).filter(Boolean).slice(0, MAX_REF_ITEMS),
      labels: artifacts.map((artifact) => artifact.label).filter(Boolean).slice(0, MAX_REF_ITEMS),
      summaries: artifacts.map((artifact) => artifact.summary).filter(Boolean).slice(0, MAX_REF_ITEMS),
    },
    videoContext: video,
    sourceRefs: boundedStringArray(sources, MAX_REF_ITEMS, MAX_REF_CHARS),
    evidenceRefs: [],
    languageState: {},
    misconceptionFocus: {},
    masteryRecoveryState: {},
    metacognitiveState: {},
  };

  checkpoint.continuitySummary = deriveContinuitySummaryFromCheckpoint(checkpoint);
  return checkpoint;
}
