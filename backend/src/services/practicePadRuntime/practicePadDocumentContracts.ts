// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-03: PracticeDocument contracts
//
// RAW LEARNER WORK IS AUTHORITATIVE. Interpretation, misconception
// labels and AI reasoning are DERIVED from it and must never be
// stored as authoritative truth inside a revision.
//
// One PracticeDocument per PracticeAttempt owns the learner's
// submitted working. Each saved work state is an immutable
// PracticeDocumentRevision identified by (attemptId, version).
// PracticePadWorkVersion remains the canonical monotonic head;
// this module never introduces a competing counter.
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';

// ── Structured work snapshot (future-compatible, minimal) ──

export type PracticeWorkBlockKind = 'TEXT' | 'EQUATION' | 'HANDWRITING' | 'DRAWING' | 'IMAGE' | 'IMAGE_REF';

export interface PracticeWorkBlock {
  blockId: string;
  kind: PracticeWorkBlockKind;
  /** Raw learner content for TEXT / EQUATION. Never interpreted here. */
  content?: string | null;
  /** Governed scoped reference for DRAWING / IMAGE / IMAGE_REF. Never interpreted. */
  ref?: string | null;
  /**
   * PP-08: learner-produced vector ink for HANDWRITING. Authoritative raw
   * evidence — ordering (stroke order, point order) is preserved exactly.
   * Never overwritten by interpretation.
   */
  ink?: PracticeInkStroke[] | null;
  order: number;
}

// ── PP-08: raw ink vector semantics (authoritative, never guessed) ──

export interface PracticeInkPoint {
  x: number;
  y: number;
  /** Milliseconds since the start of the containing stroke. */
  timestampOffsetMs: number;
  pressure?: number | null;
  pointerType?: string | null;
  tiltX?: number | null;
  tiltY?: number | null;
}

export interface PracticeInkStroke {
  strokeId: string;
  points: PracticeInkPoint[];
}

export interface PracticeWorkSnapshot {
  blocks: PracticeWorkBlock[];
}

// ── Bounds (conservative, product-sized) ──

export const PRACTICE_WORK_MAX_BLOCKS = 50;
export const PRACTICE_WORK_MAX_TEXT_PER_BLOCK = 4000;
export const PRACTICE_WORK_MAX_SERIALIZED_BYTES = 32768;
export const PRACTICE_WORK_MAX_BLOCK_ID_LENGTH = 64;
export const PRACTICE_WORK_MAX_REF_LENGTH = 512;

// ── PP-08: bounded raw ink (explicit rejection, never silent truncation) ──

export const PRACTICE_WORK_MAX_HANDWRITING_BLOCKS = 8;
export const PRACTICE_WORK_MAX_STROKES_PER_BLOCK = 64;
export const PRACTICE_WORK_MAX_POINTS_PER_STROKE = 512;
export const PRACTICE_WORK_MAX_POINTS_PER_SNAPSHOT = 4096;
export const PRACTICE_WORK_MAX_MEDIA_REFS = 8;
export const PRACTICE_WORK_MAX_COORDINATE_ABS = 100000;
export const PRACTICE_WORK_MAX_STROKE_ID_LENGTH = 64;

const BLOCK_KINDS: ReadonlySet<string> = new Set(['TEXT', 'EQUATION', 'HANDWRITING', 'DRAWING', 'IMAGE', 'IMAGE_REF']);

/**
 * PP-08 media law: raster/image work is a governed scoped reference, never
 * arbitrary URL authority and never raw binary in JSON. Allowlisted schemes
 * are the canonical scoped forms; any other URI scheme (http, https, data,
 * blob, ftp, …) or protocol-relative authority is rejected. Plain opaque
 * tokens without a scheme remain accepted for PP-03 back-compat.
 */
const GOVERNED_REF_SCHEMES: ReadonlySet<string> = new Set(['ppmedia', 'artifact', 'object']);
const URI_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/;

export function isGovernedMediaRef(ref: string): boolean {
  const value = ref.trim();
  if (!value || value.length > PRACTICE_WORK_MAX_REF_LENGTH) return false;
  if (value.startsWith('//')) return false;
  const schemeMatch = value.match(URI_SCHEME_PATTERN);
  if (!schemeMatch) return true;
  const scheme = schemeMatch[0].slice(0, -1).toLowerCase();
  return GOVERNED_REF_SCHEMES.has(scheme);
}

// ── PP-08 scoped media authority ──
//
// A protected PP-08 DRAWING / IMAGE / IMAGE_REF reference is valid only
// when it names the exact (schoolId, studentId, attemptId) it belongs
// to. Canonical scoped form:
//
//   <scheme>:<schoolId>/<studentId>/<attemptId>/<opaque-id>
//
// where <scheme> is a governed scheme (ppmedia, artifact, object).
// A string merely being non-HTTP is NOT governance: unschemed opaque
// tokens, wrong-scope refs, and malformed refs are all rejected on the
// protected path. References are never fetched and no media database
// is invented here — scope is verified structurally only.

export interface PracticeMediaScope {
  schoolId: string;
  studentId: string;
  attemptId: string;
}

export interface ParsedScopedMediaRef extends PracticeMediaScope {
  scheme: string;
  opaqueId: string;
}

export function parseScopedMediaRef(ref: string): ParsedScopedMediaRef | null {
  const value = String(ref ?? '').trim();
  if (!value || value.length > PRACTICE_WORK_MAX_REF_LENGTH) return null;
  if (value.startsWith('//')) return null;
  const schemeMatch = value.match(URI_SCHEME_PATTERN);
  if (!schemeMatch) return null;
  const scheme = schemeMatch[0].slice(0, -1).toLowerCase();
  if (!GOVERNED_REF_SCHEMES.has(scheme)) return null;
  const body = value.slice(schemeMatch[0].length);
  if (!body || body.startsWith('/')) return null;
  const segments = body.split('/');
  if (segments.length < 4) return null;
  const [schoolId, studentId, attemptId, ...rest] = segments;
  const opaqueId = rest.join('/');
  if (!schoolId.trim() || !studentId.trim() || !attemptId.trim() || !opaqueId.trim()) return null;
  for (const segment of [schoolId, studentId, attemptId, opaqueId]) {
    if (/[\s]/.test(segment)) return null;
  }
  return { scheme, schoolId, studentId, attemptId, opaqueId };
}

/** True only when the ref is scoped to exactly this school/learner/attempt. */
export function isScopedMediaRefForScope(ref: string, scope: PracticeMediaScope): boolean {
  const parsed = parseScopedMediaRef(ref);
  if (!parsed) return false;
  return (
    parsed.schoolId === scope.schoolId &&
    parsed.studentId === scope.studentId &&
    parsed.attemptId === scope.attemptId
  );
}

// ── Failure codes (§15) ──

export type PracticeDocumentFailureCode =
  | 'DOCUMENT_NOT_FOUND'
  | 'DOCUMENT_FORBIDDEN'
  | 'REVISION_NOT_FOUND'
  | 'VERSION_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INVALID_WORK_SNAPSHOT'
  | 'WORK_TOO_LARGE'
  | 'PERSISTENCE_FAILED';

export class PracticeDocumentError extends Error {
  readonly code: PracticeDocumentFailureCode;

  constructor(code: PracticeDocumentFailureCode, message: string) {
    super(message);
    this.name = 'PracticeDocumentError';
    this.code = code;
  }
}

// ── Deterministic canonicalization + hashing (§13) ──

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Collapse incidental whitespace so equivalent learner work hashes equally. */
export function normalizeWorkContent(value: unknown): string {
  return String(value ?? '')
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

interface NormalizedBlock {
  blockId: string;
  kind: PracticeWorkBlockKind;
  content: string;
  ref: string;
  ink: string;
  order: number;
}

function normalizeInkForHash(ink: PracticeInkStroke[] | null | undefined): string {
  if (!ink || ink.length === 0) return '';
  // Stroke order AND point order are authoritative: serialized in order.
  return stableStringify(
    ink.map((s) => ({
      strokeId: s.strokeId,
      points: s.points.map((p) => ({
        x: p.x,
        y: p.y,
        timestampOffsetMs: p.timestampOffsetMs,
        pressure: p.pressure ?? null,
        pointerType: p.pointerType ?? null,
        tiltX: p.tiltX ?? null,
        tiltY: p.tiltY ?? null,
      })),
    })),
  );
}

export function normalizeSnapshotForHash(snapshot: PracticeWorkSnapshot): NormalizedBlock[] {
  const normalized = snapshot.blocks.map((b) => ({
    blockId: b.blockId,
    kind: b.kind,
    content: b.kind === 'TEXT' || b.kind === 'EQUATION' ? normalizeWorkContent(b.content ?? '') : '',
    ref: b.kind === 'DRAWING' || b.kind === 'IMAGE' || b.kind === 'IMAGE_REF' ? String(b.ref ?? '') : '',
    ink: b.kind === 'HANDWRITING' ? normalizeInkForHash(b.ink) : '',
    order: b.order,
  }));
  normalized.sort((a, b) => (a.order - b.order) || (a.blockId < b.blockId ? -1 : a.blockId > b.blockId ? 1 : 0));
  return normalized;
}

/** Stable content hash for ONE raw block — binds an interpretation to its exact source. */
export function blockContentHash(block: PracticeWorkBlock): string {
  return createHash('sha256')
    .update(
      stableStringify({
        blockId: block.blockId,
        kind: block.kind,
        content: block.kind === 'TEXT' || block.kind === 'EQUATION' ? normalizeWorkContent(block.content ?? '') : '',
        ref: block.kind === 'DRAWING' || block.kind === 'IMAGE' || block.kind === 'IMAGE_REF' ? String(block.ref ?? '') : '',
        ink: block.kind === 'HANDWRITING' ? normalizeInkForHash(block.ink) : '',
        order: block.order,
      }),
    )
    .digest('hex');
}

/** Stable content hash: key ordering and incidental whitespace cannot fork it. */
export function snapshotContentHash(snapshot: PracticeWorkSnapshot): string {
  return createHash('sha256').update(stableStringify(normalizeSnapshotForHash(snapshot))).digest('hex');
}

/**
 * PP-08: strict ink validation. Stroke order and point order are preserved
 * exactly as supplied (cross-outs/new strokes included). Any invalid or
 * oversized ink fails explicitly — mathematical work is never truncated.
 */
export function validateInkStrokes(
  input: unknown,
  blockId: string,
): { ok: true; strokes: PracticeInkStroke[]; points: number } | { ok: false; code: 'INVALID_WORK_SNAPSHOT' | 'WORK_TOO_LARGE'; message: string } {
  if (!Array.isArray(input) || input.length < 1) {
    return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} handwriting requires at least one stroke.` };
  }
  if (input.length > PRACTICE_WORK_MAX_STROKES_PER_BLOCK) {
    return {
      ok: false,
      code: 'WORK_TOO_LARGE',
      message: `Block ${blockId} exceeds the stroke limit (${PRACTICE_WORK_MAX_STROKES_PER_BLOCK}).`,
    };
  }
  const strokes: PracticeInkStroke[] = [];
  const seenStroke = new Set<string>();
  let points = 0;
  for (let s = 0; s < input.length; s += 1) {
    const raw = input[s];
    if (!isRecord(raw)) {
      return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} stroke ${s} must be an object.` };
    }
    const strokeId = typeof raw.strokeId === 'string' ? raw.strokeId.trim() : '';
    if (!strokeId || strokeId.length > PRACTICE_WORK_MAX_STROKE_ID_LENGTH) {
      return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} stroke ${s} has an invalid strokeId.` };
    }
    if (seenStroke.has(strokeId)) {
      return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} has a duplicate strokeId: ${strokeId}.` };
    }
    seenStroke.add(strokeId);
    if (!Array.isArray(raw.points) || raw.points.length < 1) {
      return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} stroke ${strokeId} requires at least one point.` };
    }
    if (raw.points.length > PRACTICE_WORK_MAX_POINTS_PER_STROKE) {
      return {
        ok: false,
        code: 'WORK_TOO_LARGE',
        message: `Block ${blockId} stroke ${strokeId} exceeds the point limit (${PRACTICE_WORK_MAX_POINTS_PER_STROKE}).`,
      };
    }
    const cleanPoints: PracticeInkPoint[] = [];
    for (let p = 0; p < raw.points.length; p += 1) {
      const rp = raw.points[p];
      if (!isRecord(rp)) {
        return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} stroke ${strokeId} point ${p} must be an object.` };
      }
      const x = rp.x;
      const y = rp.y;
      const t = rp.timestampOffsetMs;
      if (
        typeof x !== 'number' || typeof y !== 'number' || typeof t !== 'number' ||
        !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(t) ||
        Math.abs(x) > PRACTICE_WORK_MAX_COORDINATE_ABS || Math.abs(y) > PRACTICE_WORK_MAX_COORDINATE_ABS ||
        t < 0 || !Number.isInteger(t)
      ) {
        return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} stroke ${strokeId} point ${p} has invalid coordinates or timestamp.` };
      }
      let pressure: number | null = null;
      if (rp.pressure !== undefined && rp.pressure !== null) {
        if (typeof rp.pressure !== 'number' || !Number.isFinite(rp.pressure) || rp.pressure < 0 || rp.pressure > 1) {
          return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} stroke ${strokeId} point ${p} has invalid pressure.` };
        }
        pressure = rp.pressure;
      }
      const pointerType = typeof rp.pointerType === 'string' && rp.pointerType ? rp.pointerType.slice(0, 32) : null;
      let tiltX: number | null = null;
      let tiltY: number | null = null;
      for (const [key, slot] of [['tiltX', 'tx'], ['tiltY', 'ty']] as const) {
        const v = (rp as Record<string, unknown>)[key];
        if (v !== undefined && v !== null) {
          if (typeof v !== 'number' || !Number.isFinite(v) || v < -90 || v > 90) {
            return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} stroke ${strokeId} point ${p} has invalid ${key}.` };
          }
          if (slot === 'tx') tiltX = v;
          else tiltY = v;
        }
      }
      cleanPoints.push({ x, y, timestampOffsetMs: t, pressure, pointerType, tiltX, tiltY });
    }
    points += cleanPoints.length;
    strokes.push({ strokeId, points: cleanPoints });
  }
  return { ok: true, strokes, points };
}

// ── Validation (§16: explicit failure, never silent truncation) ──

export type SnapshotValidation =
  | { ok: true; snapshot: PracticeWorkSnapshot }
  | { ok: false; code: 'INVALID_WORK_SNAPSHOT' | 'WORK_TOO_LARGE'; message: string };

export function validateWorkSnapshot(input: unknown): SnapshotValidation {
  if (!isRecord(input) || !Array.isArray(input.blocks)) {
    return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: 'Work snapshot must be an object with a blocks array.' };
  }
  const { blocks } = input as { blocks: unknown[] };
  if (blocks.length < 1) {
    return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: 'Work snapshot must contain at least one block.' };
  }
  if (blocks.length > PRACTICE_WORK_MAX_BLOCKS) {
    return {
      ok: false,
      code: 'WORK_TOO_LARGE',
      message: `Work snapshot exceeds the block limit (${PRACTICE_WORK_MAX_BLOCKS}).`,
    };
  }
  const seen = new Set<string>();
  const clean: PracticeWorkBlock[] = [];
  let handwritingBlocks = 0;
  let mediaRefs = 0;
  let totalPoints = 0;
  for (let i = 0; i < blocks.length; i += 1) {
    const raw = blocks[i];
    if (!isRecord(raw)) {
      return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${i} must be an object.` };
    }
    const blockId = typeof raw.blockId === 'string' ? raw.blockId.trim() : '';
    if (!blockId || blockId.length > PRACTICE_WORK_MAX_BLOCK_ID_LENGTH) {
      return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${i} has an invalid blockId.` };
    }
    if (seen.has(blockId)) {
      return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Duplicate blockId: ${blockId}.` };
    }
    seen.add(blockId);
    const kind = typeof raw.kind === 'string' ? raw.kind : '';
    if (!BLOCK_KINDS.has(kind)) {
      return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} has an unsupported kind.` };
    }
    const order = raw.order;
    if (typeof order !== 'number' || !Number.isInteger(order) || order < 0) {
      return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} has an invalid order.` };
    }
    if (kind === 'TEXT' || kind === 'EQUATION') {
      const content = typeof raw.content === 'string' ? raw.content : '';
      if (content.length > PRACTICE_WORK_MAX_TEXT_PER_BLOCK) {
        return {
          ok: false,
          code: 'WORK_TOO_LARGE',
          message: `Block ${blockId} exceeds the per-block text limit (${PRACTICE_WORK_MAX_TEXT_PER_BLOCK}).`,
        };
      }
      clean.push({ blockId, kind: kind as PracticeWorkBlockKind, content, ref: null, order });
    } else if (kind === 'HANDWRITING') {
      // PP-08: vector ink is authoritative raw evidence. Validated strictly;
      // oversized/invalid ink is rejected explicitly, never truncated.
      handwritingBlocks += 1;
      if (handwritingBlocks > PRACTICE_WORK_MAX_HANDWRITING_BLOCKS) {
        return {
          ok: false,
          code: 'WORK_TOO_LARGE',
          message: `Work snapshot exceeds the handwriting block limit (${PRACTICE_WORK_MAX_HANDWRITING_BLOCKS}).`,
        };
      }
      const inkValidation = validateInkStrokes(raw.ink, blockId);
      if (!inkValidation.ok) return inkValidation;
      totalPoints += inkValidation.points;
      if (totalPoints > PRACTICE_WORK_MAX_POINTS_PER_SNAPSHOT) {
        return {
          ok: false,
          code: 'WORK_TOO_LARGE',
          message: `Work snapshot exceeds the total ink point limit (${PRACTICE_WORK_MAX_POINTS_PER_SNAPSHOT}).`,
        };
      }
      clean.push({ blockId, kind: 'HANDWRITING', content: null, ref: null, ink: inkValidation.strokes, order });
    } else {
      // DRAWING / IMAGE / IMAGE_REF: governed scoped reference only.
      // Never interpreted; never arbitrary URL authority; never fetched.
      const ref = typeof raw.ref === 'string' ? raw.ref.trim() : '';
      if (!ref || ref.length > PRACTICE_WORK_MAX_REF_LENGTH) {
        return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} requires a governed media ref.` };
      }
      if (!isGovernedMediaRef(ref)) {
        return { ok: false, code: 'INVALID_WORK_SNAPSHOT', message: `Block ${blockId} media ref is not a governed scoped reference.` };
      }
      mediaRefs += 1;
      if (mediaRefs > PRACTICE_WORK_MAX_MEDIA_REFS) {
        return {
          ok: false,
          code: 'WORK_TOO_LARGE',
          message: `Work snapshot exceeds the media reference limit (${PRACTICE_WORK_MAX_MEDIA_REFS}).`,
        };
      }
      clean.push({ blockId, kind: kind as PracticeWorkBlockKind, content: null, ref, order });
    }
  }
  const snapshot: PracticeWorkSnapshot = { blocks: clean };
  const serializedBytes = Buffer.byteLength(stableStringify(normalizeSnapshotForHash(snapshot)), 'utf8');
  if (serializedBytes > PRACTICE_WORK_MAX_SERIALIZED_BYTES) {
    return {
      ok: false,
      code: 'WORK_TOO_LARGE',
      message: `Work snapshot exceeds the serialized size limit (${PRACTICE_WORK_MAX_SERIALIZED_BYTES} bytes).`,
    };
  }
  return { ok: true, snapshot };
}

// ── Back-compat projection (§6, §11) ──

/** Represent legacy `workText` as one TEXT block. Empty work stays representable. */
export function snapshotFromWorkText(workText: string): PracticeWorkSnapshot {
  return {
    blocks: [{ blockId: 'b1', kind: 'TEXT', content: typeof workText === 'string' ? workText : '', ref: null, order: 0 }],
  };
}

/** Canonical learner-work projection derived from a stored revision. */
export function snapshotToWorkText(snapshot: PracticeWorkSnapshot): string {
  return snapshot.blocks
    .filter((b) => b.kind === 'TEXT' || b.kind === 'EQUATION')
    .sort((a, b) => (a.order - b.order) || (a.blockId < b.blockId ? -1 : a.blockId > b.blockId ? 1 : 0))
    .map((b) => String(b.content ?? ''))
    .join('\n');
}

/**
 * Selected step is a VIEW into the stored revision (§12). True when the
 * selection is empty, matches a blockId, or is contained in the stored
 * canonical work. Never fabricates content.
 */
export function snapshotContainsSelection(snapshot: PracticeWorkSnapshot, selectedStep: string | null | undefined): boolean {
  if (selectedStep === null || selectedStep === undefined) return true;
  const needle = normalizeWorkContent(selectedStep);
  if (!needle) return true;
  if (snapshot.blocks.some((b) => b.blockId === selectedStep.trim())) return true;
  const haystack = normalizeWorkContent(snapshotToWorkText(snapshot)).toLowerCase();
  return haystack.includes(needle.toLowerCase());
}
