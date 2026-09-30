/**
 * STDF-REAL-CHAT-BACKEND-INTEGRATION-024
 * Canonical durable conversation contract helpers.
 *
 * Single owner for:
 * - relation normalization (messages vs ChatMessage)
 * - session projection (Recent Study)
 * - separate clocks (lastMessageAt / updatedAt / lastOpenedAt / createdAt)
 * - title versioning (titleVersion, displayTitle)
 * - cursor encode/decode (lastMessageAt + id)
 * - turn fingerprinting
 * - tenant scope resolution (schoolId + studentId)
 *
 * Read-pure: no DB, no AI, no side effects.
 */
import { createHash } from 'crypto';

export const CHAT_HISTORY_DEFAULT_LIMIT = 30;
export const CHAT_HISTORY_MAX_LIMIT = 100;
export const CHAT_TRANSCRIPT_DEFAULT_LIMIT = 60;
export const CHAT_TRANSCRIPT_MAX_LIMIT = 100;
export const CHAT_PREVIEW_MAX_CHARS = 280;

export type CanonicalChatMessage = {
  id: string;
  sessionId?: string;
  role: string;
  content: string;
  timestamp?: string | Date;
  messageNumber: number;
  turnId?: string | null;
  metadata?: unknown;
};

/** Defect A fix: never depend on caller naming the relation messages vs ChatMessage. */
export function getSessionMessages(session: any): CanonicalChatMessage[] {
  if (!session || typeof session !== 'object') return [];
  const raw = Array.isArray((session as any).ChatMessage)
    ? (session as any).ChatMessage
    : Array.isArray((session as any).messages)
      ? (session as any).messages
      : [];
  return raw
    .filter((m: any) => m && typeof m.id === 'string')
    .map((m: any) => ({
      id: String(m.id),
      sessionId: typeof m.sessionId === 'string' ? m.sessionId : session.id,
      role: String(m.role || 'user'),
      content: typeof m.content === 'string' ? m.content : '',
      timestamp: m.timestamp,
      messageNumber: Number.isFinite(Number(m.messageNumber)) ? Number(m.messageNumber) : 0,
      turnId: typeof m.turnId === 'string' ? m.turnId : null,
      metadata: m.metadata,
    }))
    .sort((a: CanonicalChatMessage, b: CanonicalChatMessage) => {
      if (a.messageNumber !== b.messageNumber) return a.messageNumber - b.messageNumber;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}

/** Strip duplicate internal relation fields from public JSON (defect: ChatMessage vs messages). */
export function stripDuplicateRelationFields<T extends Record<string, any>>(payload: T): T {
  const out: Record<string, any> = { ...payload };
  // Canonical public field is `messages`. Remove raw Prisma `ChatMessage` alias.
  if (Array.isArray(out.messages)) {
    delete out.ChatMessage;
  } else if (Array.isArray(out.ChatMessage)) {
    out.messages = out.ChatMessage;
    delete out.ChatMessage;
  }
  return out as T;
}

export function clampPreviewText(input: unknown, max = CHAT_PREVIEW_MAX_CHARS): string | null {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return null;
  const singleLine = raw.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= max) return singleLine;
  return singleLine.slice(0, max - 1).trimEnd() + '…';
}

/** Literal learner-visible preview: latest user/model message content, never summary/checkpoint. */
export function deriveLatestVisiblePreview(messages: CanonicalChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const role = String(messages[i]?.role || '').toLowerCase();
    if (role === 'user' || role === 'assistant' || role === 'model') {
      const preview = clampPreviewText(messages[i]?.content);
      if (preview) return preview;
    }
  }
  return null;
}

export function isPlaceholderTitle(topic: unknown): boolean {
  const t = typeof topic === 'string' ? topic.trim().toLowerCase() : '';
  if (!t) return true;
  return t === 'new study session' || t === 'new session' || t === 'untitled' || t === 'untitled session';
}

export function resolveDisplayTitle(topic: unknown, messages: CanonicalChatMessage[]): string {
  const direct = typeof topic === 'string' ? topic.trim() : '';
  if (direct && !isPlaceholderTitle(direct)) return direct.slice(0, 120);
  const firstUser = messages.find((m) => String(m.role).toLowerCase() === 'user' && m.content.trim());
  if (firstUser) {
    const words = firstUser.content.replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' ');
    if (words) return words.slice(0, 120);
  }
  return 'New study session';
}

export type ChatSessionProjection = {
  id: string;
  title: string;
  displayTitle: string;
  titleVersion: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  lastOpenedAt: string | null;
  latestVisibleMessagePreview: string | null;
  messageCount: number;
};

const toISO = (v: unknown): string | null => {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string' && v) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return v;
  }
  return null;
};

/** ONE canonical Recent Study projection (defects G/H + §8). No summary/checkpoint preview. */
export function buildChatSessionProjection(session: any, messages?: CanonicalChatMessage[]): ChatSessionProjection {
  const msgs = Array.isArray(messages) ? messages : getSessionMessages(session);
  const now = new Date().toISOString();
  const createdAt = toISO(session?.createdAt) || now;
  const updatedAt = toISO(session?.updatedAt) || now;
  const lastMessageAt = toISO(session?.lastMessageAt) || toISO(msgs[msgs.length - 1]?.timestamp) || null;
  const lastOpenedAt = toISO(session?.lastOpenedAt) || null;
  const title = typeof session?.topic === 'string' && session.topic.trim() ? session.topic.trim() : resolveDisplayTitle(session?.topic, msgs);
  return {
    id: String(session?.id || ''),
    title,
    displayTitle: title,
    titleVersion: Number.isFinite(Number(session?.titleVersion)) ? Number(session.titleVersion) : 0,
    createdAt,
    updatedAt,
    lastMessageAt,
    lastOpenedAt,
    latestVisibleMessagePreview:
      typeof session?.latestVisibleMessagePreview === 'string' && session.latestVisibleMessagePreview.trim()
        ? clampPreviewText(session.latestVisibleMessagePreview)
        : deriveLatestVisiblePreview(msgs),
    messageCount: Number.isFinite(Number(session?.messageCount)) ? Number(session.messageCount) : msgs.length,
  };
}

/** Stable cursor: lastMessageAt + id. Opaque base64url JSON. */
export function encodeHistoryCursor(lastMessageAt: string | null, id: string): string {
  const payload = JSON.stringify({ t: lastMessageAt || '', id: String(id || '') });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeHistoryCursor(cursor: unknown): { lastMessageAt: string | null; id: string } | null {
  if (typeof cursor !== 'string' || !cursor.trim()) return null;
  try {
    const json = Buffer.from(cursor.trim(), 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { t?: unknown; id?: unknown };
    if (typeof parsed.id !== 'string' || !parsed.id) return null;
    const t = typeof parsed.t === 'string' && parsed.t ? parsed.t : null;
    if (t) {
      const d = new Date(t);
      if (Number.isNaN(d.getTime())) return null;
    }
    return { lastMessageAt: t, id: parsed.id };
  } catch {
    return null;
  }
}

export function normalizeHistoryLimit(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return CHAT_HISTORY_DEFAULT_LIMIT;
  return Math.min(Math.max(Math.floor(n), 1), CHAT_HISTORY_MAX_LIMIT);
}

export function normalizeTranscriptLimit(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return CHAT_TRANSCRIPT_DEFAULT_LIMIT;
  return Math.min(Math.max(Math.floor(n), 1), CHAT_TRANSCRIPT_MAX_LIMIT);
}

/** Stable turn fingerprint over immutable turn input. */
export function fingerprintTurnInput(args: { sessionId: string; message: string; editedMessageId?: string }): string {
  return createHash('sha256')
    .update(`${args.sessionId}\n${args.message}\n${args.editedMessageId || ''}`)
    .digest('hex');
}

/**
 * Identity contradiction gate (§5).
 * Canonical auth (schoolAuthMiddleware) proves req.user.id is extracted from a
 * globally-verified JWT subject (userId/studentId/id/sub), NOT scoped per school.
 * Global uniqueness of the subject itself is NOT provable from the token alone
 * (two schools could theoretically mint colliding subjects on different issuers).
 * DECISION: conversation ownership MUST use schoolId + studentId; new ChatSession
 * rows MUST store schoolId; null-school legacy rows are never exposed in strict live.
 */
export const STUDENT_ID_GLOBAL_UNIQUENESS: {
  globallyUnique: false;
  evidence: string;
  decision: string;
} = {
  globallyUnique: false,
  evidence: 'schoolAuthMiddleware.verifyToken accepts userId|studentId|id|sub from multiple issuers (JWT_SECRET, COPILOT_JWT_SECRET, COPILOT_PUBLIC_KEY); no cross-school uniqueness registry exists.',
  decision: 'Use schoolId + studentId for all live conversation ownership; store schoolId on new ChatSession rows; hide null-school legacy rows in strict-live.',
};

export function resolveTenantScope(req: any): { studentId: string; schoolId: string | null } {
  const studentId = String(req?.user?.id || '').trim();
  const schoolId =
    String(req?.verifiedSchoolIdentity?.schoolId || req?.schoolId || req?.user?.schoolId || '').trim() || null;
  return { studentId, schoolId };
}

/** Strict-live: both studentId and verified schoolId required; legacy null-school hidden. */
export function requireStrictLiveTenantScope(scope: { studentId: string; schoolId: string | null }): { ok: boolean; code?: string } {
  if (!scope.studentId) return { ok: false, code: 'AUTH_REQUIRED' };
  if (!scope.schoolId) return { ok: false, code: 'SCHOOL_CONTEXT_REQUIRED' };
  return { ok: true };
}

/** Session where-clause that can never expose cross-school rows. */
export function scopedSessionWhere(scope: { studentId: string; schoolId: string | null }, sessionId: string): Record<string, unknown> {
  if (scope.schoolId) return { id: sessionId, studentId: scope.studentId, schoolId: scope.schoolId };
  return { id: sessionId, studentId: scope.studentId };
}

/** Title-only mutation must not move recency: caller must not set lastMessageAt. */
export function assertTitleMutationPreservesRecency(data: Record<string, unknown>): void {
  if ('lastMessageAt' in data) {
    throw new Error('TITLE_MUTATION_MUST_NOT_TOUCH_LAST_MESSAGE_AT');
  }
}
