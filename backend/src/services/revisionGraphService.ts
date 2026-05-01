import { randomUUID } from 'crypto';
import prisma from '../utils/prismaClient';
import type {
  RevisionConnectedNoteGraph,
  RevisionConnectedNoteLink,
  RevisionConnectionCategory,
  RevisionConnectionExplainability,
  RevisionConnectionField,
  RevisionConnectionStrength,
  RevisionItem,
  RevisionTagSuggestion,
} from '../lib/types';

type GraphItem = {
  id: string;
  title: string;
  summary?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  subject?: string | null;
  tags?: string[];
  saveType?: string | null;
  contentType?: string | null;
  isMistakeBased?: boolean;
  collectionId?: string | null;
  updatedAt?: string | null;
};

type NormalizedGraphItem = GraphItem & {
  normalizedTopic: string;
  normalizedSubtopic: string;
  normalizedSubject: string;
  tagKeys: string[];
  tagLabelByKey: Map<string, string>;
  titleTokens: string[];
  contentTypeKey: string;
  saveTypeKey: string;
  tagSuggestions: RevisionTagSuggestion[];
};

const MAX_LINKS_PER_ITEM = 8;
const MIN_RELATION_SCORE = 9;
const MAX_ITEMS_FOR_PRECOMPUTE = 260;

const TAG_TYPO_MAP: Record<string, string> = {
  eqaution: 'equation',
  equaiton: 'equation',
  equatoin: 'equation',
  algerba: 'algebra',
  trignometry: 'trigonometry',
  simultanous: 'simultaneous',
  simulteneous: 'simultaneous',
  grammer: 'grammar',
  litrature: 'literature',
  biology: 'biology',
  physcis: 'physics',
  chemisrty: 'chemistry',
};

const TAG_SYNONYM_MAP: Record<string, string> = {
  maths: 'math',
  mathematics: 'math',
  equations: 'equation',
  workedstep: 'worked step',
  'worked steps': 'worked step',
  formulae: 'formula',
  correction: 'mistake fix',
  corrections: 'mistake fix',
  misconception: 'mistake fix',
  misconceptions: 'mistake fix',
  practical: 'application',
  practicals: 'application',
  'real life': 'application',
  'real world': 'application',
  scenario: 'application',
  scenarios: 'application',
  procedures: 'procedure',
  methods: 'procedure',
};

const APPLICATION_CUE_TAGS = new Set([
  'application',
  'real world',
  'word problem',
  'case study',
  'scenario',
  'experiment',
]);

const PROCEDURE_CUE_CONTENT_TYPES = new Set([
  'worked_step',
  'formula',
  'practice_tip',
  'correction',
  'exam_trap',
]);

const PROCEDURE_CUE_SAVE_TYPES = new Set([
  'worked_step',
  'formula',
  'practice_item',
  'mistake_to_fix',
]);

const TITLE_STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'and',
  'are',
  'back',
  'been',
  'before',
  'both',
  'from',
  'have',
  'into',
  'just',
  'more',
  'note',
  'notes',
  'only',
  'over',
  'same',
  'step',
  'that',
  'than',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'through',
  'very',
  'with',
  'your',
]);

let ensureRevisionGraphTablesPromise: Promise<void> | null = null;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeKey(value: unknown): string {
  return safeString(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => safeString(entry).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((entry) => entry.replace(/^"+|"+$/g, '').trim())
      .filter(Boolean);
  }
  return [];
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function toTagLabel(key: string): string {
  return key
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractGraphTagCandidates(item: GraphItem): string[] {
  return [
    ...(item.tags || []),
    safeString(item.topic).trim(),
    safeString(item.subtopic).trim(),
    safeString(item.subject).trim(),
    safeString(item.saveType).replace(/_/g, ' ').trim(),
    safeString(item.contentType).replace(/_/g, ' ').trim(),
  ].filter(Boolean);
}

function normalizeGraphTags(rawTags: string[]): { tagKeys: string[]; labelByKey: Map<string, string>; suggestions: RevisionTagSuggestion[] } {
  const tagKeys: string[] = [];
  const labelByKey = new Map<string, string>();
  const suggestions: RevisionTagSuggestion[] = [];
  const seen = new Set<string>();

  for (const rawTag of rawTags) {
    const original = safeString(rawTag).trim();
    if (!original) continue;
    let key = normalizeKey(original);
    if (!key) continue;

    if (TAG_TYPO_MAP[key]) {
      const next = TAG_TYPO_MAP[key];
      suggestions.push({
        from: original,
        to: toTagLabel(next),
        reason: 'Typo corrected to a canonical term.',
        kind: 'fix_spelling',
      });
      key = next;
    }

    if (TAG_SYNONYM_MAP[key]) {
      const next = TAG_SYNONYM_MAP[key];
      suggestions.push({
        from: original,
        to: toTagLabel(next),
        reason: 'Synonym mapped to a single canonical tag.',
        kind: 'mapped_synonym',
      });
      key = next;
    }

    const label = toTagLabel(key);
    if (seen.has(key)) {
      suggestions.push({
        from: original,
        to: label,
        reason: 'Duplicate merged into one canonical tag.',
        kind: 'merge_duplicate',
      });
      continue;
    }
    seen.add(key);
    tagKeys.push(key);
    labelByKey.set(key, label);
  }

  return { tagKeys: tagKeys.slice(0, 14), labelByKey, suggestions };
}

function extractComparableTokens(value: string): string[] {
  const keys = normalizeKey(value).split(' ').filter(Boolean);
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    if (key.length < 4) continue;
    if (TITLE_STOP_WORDS.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(key);
  }
  return unique;
}

function normalizeGraphItem(item: GraphItem): NormalizedGraphItem {
  const normalizedTags = normalizeGraphTags(extractGraphTagCandidates(item));
  return {
    ...item,
    normalizedTopic: normalizeKey(item.topic),
    normalizedSubtopic: normalizeKey(item.subtopic),
    normalizedSubject: normalizeKey(item.subject),
    tagKeys: normalizedTags.tagKeys,
    tagLabelByKey: normalizedTags.labelByKey,
    titleTokens: extractComparableTokens([item.title, item.summary, item.topic, item.subtopic].filter(Boolean).join(' ')),
    contentTypeKey: normalizeKey(item.contentType),
    saveTypeKey: normalizeKey(item.saveType),
    tagSuggestions: normalizedTags.suggestions.slice(0, 8),
  };
}

function intersect(left: string[], right: string[]): string[] {
  if (!left.length || !right.length) return [];
  const rightSet = new Set(right);
  const shared: string[] = [];
  for (const value of left) {
    if (rightSet.has(value)) shared.push(value);
  }
  return shared;
}

function classifyLinkCategory(args: {
  source: NormalizedGraphItem;
  target: NormalizedGraphItem;
  sharedTagKeys: string[];
  sharedTitleTokens: string[];
}): RevisionConnectionCategory {
  const mistakeBridge = Boolean(args.source.isMistakeBased || args.target.isMistakeBased);
  if (mistakeBridge) return 'recovery';

  const hasProcedureCue =
    PROCEDURE_CUE_CONTENT_TYPES.has(args.source.contentTypeKey) ||
    PROCEDURE_CUE_CONTENT_TYPES.has(args.target.contentTypeKey) ||
    PROCEDURE_CUE_SAVE_TYPES.has(args.source.saveTypeKey) ||
    PROCEDURE_CUE_SAVE_TYPES.has(args.target.saveTypeKey) ||
    args.sharedTagKeys.some((tag) => tag === 'procedure' || tag === 'worked step');

  const hasApplicationCue =
    args.sharedTagKeys.some((tag) => APPLICATION_CUE_TAGS.has(tag)) ||
    args.sharedTitleTokens.some((token) => token === 'application' || token === 'scenario' || token === 'example');

  if (hasApplicationCue && !hasProcedureCue) return 'application';
  if (hasProcedureCue) return 'procedure';
  if (hasApplicationCue) return 'application';
  return 'theory';
}

function getConnectionStrength(score: number): RevisionConnectionStrength {
  if (score >= 24) return 'strong';
  if (score >= 15) return 'moderate';
  return 'light';
}

function buildCategoryActionStep(category: RevisionConnectionCategory, targetTitle: string): string {
  if (category === 'procedure') {
    return `Solve one fresh question using "${targetTitle}" step by step without looking at your notes.`;
  }
  if (category === 'application') {
    return `Connect "${targetTitle}" to one real-world scenario, then map each action to the matching theory rule.`;
  }
  if (category === 'recovery') {
    return `Compare your previous mistake with "${targetTitle}" and write one correction rule to reuse next time.`;
  }
  return `Teach "${targetTitle}" in two short lines, then restate it with one technical term.`;
}

function buildWhyConnected(args: {
  source: NormalizedGraphItem;
  target: NormalizedGraphItem;
  sharedTagKeys: string[];
  sharedTitleTokens: string[];
}): { whyConnected: string; whySignals: string[]; explainability: RevisionConnectionExplainability; sharedTagLabels: string[] } {
  const fields: RevisionConnectionField[] = [];
  const whySignals: string[] = [];

  const sharedTagLabels = args.sharedTagKeys
    .map((key) => args.source.tagLabelByKey.get(key) || args.target.tagLabelByKey.get(key) || toTagLabel(key))
    .slice(0, 4);
  if (sharedTagLabels.length) {
    fields.push('tags');
    whySignals.push(`Shared tags: ${sharedTagLabels.join(', ')}`);
  }

  const sameTopic = Boolean(args.source.normalizedTopic && args.source.normalizedTopic === args.target.normalizedTopic);
  if (sameTopic) {
    fields.push('topic');
    whySignals.push('Same topic focus');
  }

  const sameSubtopic = Boolean(args.source.normalizedSubtopic && args.source.normalizedSubtopic === args.target.normalizedSubtopic);
  if (sameSubtopic) {
    fields.push('subtopic');
    whySignals.push('Same subtopic detail');
  }

  const sameSubject = Boolean(args.source.normalizedSubject && args.source.normalizedSubject === args.target.normalizedSubject);
  if (sameSubject) {
    fields.push('subject');
    whySignals.push('Same subject context');
  }

  const mistakeBridge = Boolean(args.source.isMistakeBased || args.target.isMistakeBased);
  if (mistakeBridge) {
    fields.push('mistake_history');
    whySignals.push('Mistake history bridge');
  }

  const sharedTitleTokens = args.sharedTitleTokens.slice(0, 3);
  if (sharedTitleTokens.length) {
    fields.push('title_tokens');
    whySignals.push(`Shared terms: ${sharedTitleTokens.map(toTagLabel).join(', ')}`);
  }

  const uniqueFields = [...new Set(fields)];
  const whyConnected =
    whySignals.length > 0
      ? whySignals.join('; ')
      : 'Related through overlapping topic and terminology signals from saved notes.';

  return {
    whyConnected,
    whySignals,
    sharedTagLabels,
    explainability: {
      fields: uniqueFields,
      sharedTags: sharedTagLabels,
      sharedTitleTokens,
      sameTopic,
      sameSubtopic,
      sameSubject,
      mistakeBridge,
    },
  };
}

function scoreLink(args: {
  source: NormalizedGraphItem;
  target: NormalizedGraphItem;
  sharedTagKeys: string[];
  sharedTitleTokens: string[];
}): number {
  let score = 0;
  score += Math.min(18, args.sharedTagKeys.length * 5);
  if (args.source.normalizedTopic && args.source.normalizedTopic === args.target.normalizedTopic) score += 12;
  if (args.source.normalizedSubtopic && args.source.normalizedSubtopic === args.target.normalizedSubtopic) score += 7;
  if (args.source.normalizedSubject && args.source.normalizedSubject === args.target.normalizedSubject) score += 5;
  if (args.source.isMistakeBased || args.target.isMistakeBased) score += 4;
  if (args.source.collectionId && args.source.collectionId === args.target.collectionId) score += 2;
  if (args.source.saveTypeKey && args.source.saveTypeKey === args.target.saveTypeKey) score += 1;
  score += Math.min(6, args.sharedTitleTokens.length * 2);
  return score;
}

function buildConnectionLink(source: NormalizedGraphItem, target: NormalizedGraphItem): RevisionConnectedNoteLink | null {
  const sharedTagKeys = intersect(source.tagKeys, target.tagKeys);
  const sharedTitleTokens = intersect(source.titleTokens, target.titleTokens);
  const score = scoreLink({ source, target, sharedTagKeys, sharedTitleTokens });
  if (score < MIN_RELATION_SCORE) return null;

  const category = classifyLinkCategory({ source, target, sharedTagKeys, sharedTitleTokens });
  const reason = buildWhyConnected({ source, target, sharedTagKeys, sharedTitleTokens });
  const targetTitle = safeString(target.title).trim() || 'Related note';

  return {
    targetItemId: target.id,
    targetTitle,
    score,
    category,
    strength: getConnectionStrength(score),
    whyConnected: reason.whyConnected,
    whySignals: reason.whySignals,
    sharedTags: reason.sharedTagLabels,
    explainability: reason.explainability,
    actionStep: buildCategoryActionStep(category, targetTitle),
  };
}

function buildGraphSummaryLines(sourceTitle: string, links: RevisionConnectedNoteLink[]): string[] {
  if (!links.length) return [];
  const topLinks = links.slice(0, 3);
  const focusTagFrequency = new Map<string, number>();
  for (const link of topLinks) {
    for (const tag of link.sharedTags) {
      const key = normalizeKey(tag);
      if (!key) continue;
      focusTagFrequency.set(tag, (focusTagFrequency.get(tag) || 0) + 1);
    }
  }
  const focusTags = [...focusTagFrequency.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      return left[0].localeCompare(right[0]);
    })
    .slice(0, 3)
    .map(([tag]) => tag);
  const firstLink = topLinks[0];
  const route = [sourceTitle, ...topLinks.map((link) => link.targetTitle)].slice(0, 4).join(' -> ');
  const bridgeLabel =
    firstLink.category === 'recovery'
      ? 'Recovery bridge'
      : firstLink.category === 'procedure'
        ? 'Procedure bridge'
        : firstLink.category === 'application'
          ? 'Application bridge'
          : 'Theory bridge';

  return [
    `Revision route: ${route}.`,
    `${bridgeLabel}: move from "${sourceTitle}" to "${firstLink.targetTitle}" first.`,
    focusTags.length
      ? `Focus tags for this graph: ${focusTags.join(', ')}.`
      : 'Focus tags for this graph: use clearer topic and subtopic tags to improve link quality.',
    `How to apply: ${firstLink.actionStep}`,
  ];
}

export function buildConnectedNoteGraphForSource(source: GraphItem, candidates: GraphItem[]): RevisionConnectedNoteGraph {
  const normalizedSource = normalizeGraphItem(source);
  const links = candidates
    .filter((candidate) => candidate.id && candidate.id !== source.id)
    .map((candidate) => buildConnectionLink(normalizedSource, normalizeGraphItem(candidate)))
    .filter((candidate): candidate is RevisionConnectedNoteLink => Boolean(candidate))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.targetTitle.localeCompare(right.targetTitle);
    })
    .slice(0, MAX_LINKS_PER_ITEM);

  return {
    generatedAt: new Date().toISOString(),
    totalLinks: links.length,
    links,
    summaryLines: buildGraphSummaryLines(source.title || 'This note', links),
    tagSuggestions: normalizedSource.tagSuggestions,
  };
}

function mapGraphItemRow(row: any): GraphItem {
  return {
    id: safeString(row.id),
    title: safeString(row.title),
    summary: safeString(row.summary).trim() || null,
    topic: safeString(row.topic).trim() || null,
    subtopic: safeString(row.subtopic).trim() || null,
    subject: safeString(row.subject).trim() || null,
    tags: parseStringArray(row.tags),
    saveType: safeString(row.saveType).trim() || null,
    contentType: safeString(row.contentType).trim() || null,
    isMistakeBased: Boolean(row.isMistakeBased),
    collectionId: safeString(row.collectionId).trim() || null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

export async function ensureRevisionGraphTables(): Promise<void> {
  if (!ensureRevisionGraphTablesPromise) {
    ensureRevisionGraphTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RevisionNoteLink" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "sourceItemId" TEXT NOT NULL,
          "targetItemId" TEXT NOT NULL,
          "score" INTEGER NOT NULL,
          "category" TEXT NOT NULL,
          "strength" TEXT NOT NULL,
          "whyConnected" TEXT NOT NULL,
          "whySignals" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "sharedTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "explainability" JSONB NOT NULL DEFAULT '{}'::jsonb,
          "actionStep" TEXT NOT NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RevisionNoteLink_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "StudentProfile"("userId")
            ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "RevisionNoteLink_sourceItemId_fkey"
            FOREIGN KEY ("sourceItemId") REFERENCES "RevisionItem"("id")
            ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "RevisionNoteLink_targetItemId_fkey"
            FOREIGN KEY ("targetItemId") REFERENCES "RevisionItem"("id")
            ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "RevisionNoteLink_user_source_target_uidx" ON "RevisionNoteLink" ("userId", "sourceItemId", "targetItemId");`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RevisionNoteLink_user_source_score_idx" ON "RevisionNoteLink" ("userId", "sourceItemId", "score" DESC, "updatedAt" DESC);`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RevisionNoteLink_user_target_idx" ON "RevisionNoteLink" ("userId", "targetItemId");`
      );
    })().catch((error) => {
      ensureRevisionGraphTablesPromise = null;
      throw error;
    });
  }

  return ensureRevisionGraphTablesPromise;
}

export async function refreshRevisionGraphForUser(userId: string): Promise<{ itemCount: number; linkCount: number }> {
  await ensureRevisionGraphTables();

  const items = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        "id",
        "title",
        "summary",
        "topic",
        "subtopic",
        "subject",
        "tags",
        "saveType",
        "contentType",
        "isMistakeBased",
        "collectionId",
        "updatedAt"
      FROM "RevisionItem"
      WHERE "userId" = $1
      ORDER BY "updatedAt" DESC
      LIMIT $2
    `,
    userId,
    MAX_ITEMS_FOR_PRECOMPUTE
  );

  const graphItems = items.map(mapGraphItemRow).filter((item) => item.id);
  const inserts: Array<{
    sourceItemId: string;
    link: RevisionConnectedNoteLink;
  }> = [];

  for (const source of graphItems) {
    const graph = buildConnectedNoteGraphForSource(
      source,
      graphItems.filter((candidate) => candidate.id !== source.id)
    );
    for (const link of graph.links) {
      inserts.push({ sourceItemId: source.id, link });
    }
  }

  const statements = [
    prisma.$executeRawUnsafe(`DELETE FROM "RevisionNoteLink" WHERE "userId" = $1`, userId),
    ...inserts.map((entry) =>
      prisma.$executeRawUnsafe(
        `
          INSERT INTO "RevisionNoteLink" (
            "id",
            "userId",
            "sourceItemId",
            "targetItemId",
            "score",
            "category",
            "strength",
            "whyConnected",
            "whySignals",
            "sharedTags",
            "explainability",
            "actionStep",
            "metadata",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            CAST($9 AS JSONB),
            $10::text[],
            CAST($11 AS JSONB),
            $12,
            CAST($13 AS JSONB),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `,
        randomUUID(),
        userId,
        entry.sourceItemId,
        entry.link.targetItemId,
        Math.max(0, Math.round(entry.link.score)),
        entry.link.category,
        entry.link.strength,
        entry.link.whyConnected,
        JSON.stringify(entry.link.whySignals),
        entry.link.sharedTags,
        JSON.stringify(entry.link.explainability),
        entry.link.actionStep,
        JSON.stringify({ engine: 'revision_note_graph_v1' })
      )
    ),
  ];

  await prisma.$transaction(statements);
  return { itemCount: graphItems.length, linkCount: inserts.length };
}

export async function getConnectedNoteGraphMap(args: {
  userId: string;
  itemIds: string[];
  refreshIfMissing?: boolean;
}): Promise<Map<string, RevisionConnectedNoteGraph>> {
  await ensureRevisionGraphTables();

  const uniqueItemIds = [...new Set(args.itemIds.map((itemId) => safeString(itemId).trim()).filter(Boolean))];
  if (!uniqueItemIds.length) return new Map<string, RevisionConnectedNoteGraph>();

  if (args.refreshIfMissing !== false) {
    const [countRow] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS "linkCount" FROM "RevisionNoteLink" WHERE "userId" = $1`,
      args.userId
    );
    if (Number(countRow?.linkCount || 0) === 0) {
      await refreshRevisionGraphForUser(args.userId);
    }
  }

  const sourceRows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        "id",
        "title",
        "summary",
        "topic",
        "subtopic",
        "subject",
        "tags",
        "saveType",
        "contentType",
        "isMistakeBased",
        "collectionId"
      FROM "RevisionItem"
      WHERE "userId" = $1
        AND "id" = ANY($2::text[])
    `,
    args.userId,
    uniqueItemIds
  );

  const linkRows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        l.*,
        COALESCE(t."title", 'Related note') AS "targetTitle"
      FROM "RevisionNoteLink" l
      LEFT JOIN "RevisionItem" t
        ON t."id" = l."targetItemId"
        AND t."userId" = l."userId"
      WHERE l."userId" = $1
        AND l."sourceItemId" = ANY($2::text[])
      ORDER BY l."sourceItemId" ASC, l."score" DESC, l."updatedAt" DESC
    `,
    args.userId,
    uniqueItemIds
  );

  const linksBySourceId = new Map<string, RevisionConnectedNoteLink[]>();
  const generatedAtBySourceId = new Map<string, string>();

  for (const row of linkRows) {
    const sourceItemId = safeString(row.sourceItemId).trim();
    if (!sourceItemId) continue;
    const links = linksBySourceId.get(sourceItemId) || [];
    const parsedExplainability = parseJsonValue<RevisionConnectionExplainability | null>(row.explainability, null);
    const link: RevisionConnectedNoteLink = {
      targetItemId: safeString(row.targetItemId).trim(),
      targetTitle: safeString(row.targetTitle).trim() || 'Related note',
      score: Number(row.score || 0),
      category: (safeString(row.category).trim() || 'theory') as RevisionConnectionCategory,
      strength: (safeString(row.strength).trim() || 'light') as RevisionConnectionStrength,
      whyConnected: safeString(row.whyConnected).trim(),
      whySignals: parseJsonValue<string[]>(row.whySignals, []),
      sharedTags: parseStringArray(row.sharedTags),
      explainability:
        parsedExplainability ||
        ({
          fields: [],
          sharedTags: [],
          sharedTitleTokens: [],
          sameTopic: false,
          sameSubtopic: false,
          sameSubject: false,
          mistakeBridge: false,
        } satisfies RevisionConnectionExplainability),
      actionStep: safeString(row.actionStep).trim(),
    };
    links.push(link);
    linksBySourceId.set(sourceItemId, links);

    const generatedAt = row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString();
    if (!generatedAtBySourceId.has(sourceItemId)) {
      generatedAtBySourceId.set(sourceItemId, generatedAt);
    }
  }

  const map = new Map<string, RevisionConnectedNoteGraph>();
  for (const sourceRow of sourceRows) {
    const source = mapGraphItemRow(sourceRow);
    const links = (linksBySourceId.get(source.id) || []).slice(0, MAX_LINKS_PER_ITEM);
    const normalizedSource = normalizeGraphItem(source);
    map.set(source.id, {
      generatedAt: generatedAtBySourceId.get(source.id) || new Date().toISOString(),
      totalLinks: links.length,
      links,
      summaryLines: buildGraphSummaryLines(source.title || 'This note', links),
      tagSuggestions: normalizedSource.tagSuggestions,
    });
  }

  return map;
}

export async function attachConnectedGraphToRevisionItems(args: {
  userId: string;
  items: RevisionItem[];
  refreshIfMissing?: boolean;
}): Promise<RevisionItem[]> {
  const cleanItems = Array.isArray(args.items) ? args.items.filter((item) => item?.id) : [];
  if (!cleanItems.length) return cleanItems;

  const graphById = await getConnectedNoteGraphMap({
    userId: args.userId,
    itemIds: cleanItems.map((item) => item.id),
    refreshIfMissing: args.refreshIfMissing,
  });

  return cleanItems.map((item) => ({
    ...item,
    connectedGraph: graphById.get(item.id) || null,
  }));
}

export async function attachConnectedGraphToRevisionItem(args: {
  userId: string;
  item: RevisionItem | null;
  refreshIfMissing?: boolean;
}): Promise<RevisionItem | null> {
  if (!args.item) return null;
  const [itemWithGraph] = await attachConnectedGraphToRevisionItems({
    userId: args.userId,
    items: [args.item],
    refreshIfMissing: args.refreshIfMissing,
  });
  return itemWithGraph || args.item;
}

export async function getRevisionGraphAnalytics(args: {
  userId: string;
  windowDays?: number;
}): Promise<{
  windowDays: number;
  totalRevisionItems: number;
  graphOpenCount: number;
  uniqueGraphOpenedItems: number;
  openRate: number;
  summaryGeneratedCount: number;
  summaryCompletionRate: number;
  quizAttemptsAfterGraphOpen: number;
  quizCorrectAfterGraphOpen: number;
  retentionLiftProxy: number;
}> {
  const windowDays = Math.max(1, Math.min(90, Math.round(Number(args.windowDays || 30))));
  const windowStartIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const [totalItemsRow] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COUNT(*)::int AS "totalItems" FROM "RevisionItem" WHERE "userId" = $1`,
    args.userId
  );
  const [reviewTableRow] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT to_regclass('"RevisionReviewEvent"') IS NOT NULL AS "hasTable"`
  );
  const hasReviewTable = Boolean(reviewTableRow?.hasTable);
  if (!hasReviewTable) {
    const totalRevisionItems = Number(totalItemsRow?.totalItems || 0);
    return {
      windowDays,
      totalRevisionItems,
      graphOpenCount: 0,
      uniqueGraphOpenedItems: 0,
      openRate: 0,
      summaryGeneratedCount: 0,
      summaryCompletionRate: 0,
      quizAttemptsAfterGraphOpen: 0,
      quizCorrectAfterGraphOpen: 0,
      retentionLiftProxy: 0,
    };
  }

  const openedRows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        "revisionItemId",
        MIN("createdAt") AS "firstOpenedAt",
        COUNT(*)::int AS "openCount"
      FROM "RevisionReviewEvent"
      WHERE "userId" = $1
        AND "createdAt" >= $2::timestamp
        AND "eventType" = 'source_opened'
        AND COALESCE("metadata"->>'surface', '') = 'connected_note_graph'
      GROUP BY "revisionItemId"
    `,
    args.userId,
    windowStartIso
  );

  const [summaryRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT COUNT(*)::int AS "summaryGeneratedCount"
      FROM "RevisionReviewEvent"
      WHERE "userId" = $1
        AND "createdAt" >= $2::timestamp
        AND "eventType" = 'review_completed'
        AND COALESCE("metadata"->>'surface', '') = 'connected_note_graph'
        AND COALESCE("metadata"->>'action', '') = 'summary_generated'
    `,
    args.userId,
    windowStartIso
  );

  const [quizAfterOpenRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      WITH "opened" AS (
        SELECT
          "revisionItemId",
          MIN("createdAt") AS "firstOpenedAt"
        FROM "RevisionReviewEvent"
        WHERE "userId" = $1
          AND "createdAt" >= $2::timestamp
          AND "eventType" = 'source_opened'
          AND COALESCE("metadata"->>'surface', '') = 'connected_note_graph'
        GROUP BY "revisionItemId"
      )
      SELECT
        COUNT(*) FILTER (WHERE e."eventType" = 'quiz_answered')::int AS "quizAttemptsAfterOpen",
        COUNT(*) FILTER (
          WHERE e."eventType" = 'quiz_answered'
            AND COALESCE(e."outcome", '') = 'correct'
        )::int AS "quizCorrectAfterOpen"
      FROM "RevisionReviewEvent" e
      INNER JOIN "opened" o
        ON o."revisionItemId" = e."revisionItemId"
      WHERE e."userId" = $1
        AND e."createdAt" >= $2::timestamp
        AND e."createdAt" >= o."firstOpenedAt"
    `,
    args.userId,
    windowStartIso
  );

  const totalRevisionItems = Number(totalItemsRow?.totalItems || 0);
  const graphOpenCount = openedRows.reduce((total, row) => total + Number(row.openCount || 0), 0);
  const uniqueGraphOpenedItems = openedRows.length;
  const summaryGeneratedCount = Number(summaryRow?.summaryGeneratedCount || 0);
  const quizAttemptsAfterGraphOpen = Number(quizAfterOpenRow?.quizAttemptsAfterOpen || 0);
  const quizCorrectAfterGraphOpen = Number(quizAfterOpenRow?.quizCorrectAfterOpen || 0);

  const openRate = totalRevisionItems > 0 ? uniqueGraphOpenedItems / totalRevisionItems : 0;
  const summaryCompletionRate = uniqueGraphOpenedItems > 0 ? summaryGeneratedCount / uniqueGraphOpenedItems : 0;
  const retentionLiftProxy =
    quizAttemptsAfterGraphOpen > 0 ? quizCorrectAfterGraphOpen / quizAttemptsAfterGraphOpen : 0;

  return {
    windowDays,
    totalRevisionItems,
    graphOpenCount,
    uniqueGraphOpenedItems,
    openRate,
    summaryGeneratedCount,
    summaryCompletionRate,
    quizAttemptsAfterGraphOpen,
    quizCorrectAfterGraphOpen,
    retentionLiftProxy,
  };
}

export const __revisionGraphTestUtils = {
  normalizeGraphTags,
  buildConnectedNoteGraphForSource,
  classifyLinkCategory,
};
