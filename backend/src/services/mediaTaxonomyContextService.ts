// ─────────────────────────────────────────────────────────────────────────────
// Steadfast AI — Closed Taxonomy Context Supplier (R4)
// TASK: STEADFAST-BACKEND-MEDIA-AI-HANDOFF-01
//
// Produces a bounded CLOSED set of canonical taxonomy IDs and labels for the
// AI engine, composed from existing canonical curriculum/content-governance
// sources:
//   - task022CurriculumRegistryService (canonical CurriculumTopic / Skill /
//     Objective / Subject identities)
//   - task022ContentGovernanceContracts shapes (task022 family, versioned)
//
// LAWS:
// - No invented taxonomy identifiers. Every node id/label comes from a
//   canonical task022 record.
// - Free-text MediaAsset tags are NEVER promoted into this context.
// - Canonical taxonomy being unavailable is a TYPED state, never a silent
//   empty set that looks like a real closed context.
// - Payload is bounded per category.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ClosedTaxonomyContext,
  MediaTaxonomyCategory,
  MediaTaxonomyContextByCategory,
  MediaTaxonomyNode,
} from '../contracts/mediaAiHandoffContracts';
import { curriculumRegistryService } from './task022CurriculumRegistryService';
import type {
  CurriculumFamily,
  CurriculumTopic,
  CurriculumSkill,
  LearningObjective,
  CurriculumSubject,
} from './task022ContentGovernanceContracts';

const NODES_PER_CATEGORY_MAX = 50;
const LABEL_MAX = 240;
const DESCRIPTION_MAX = 600;

const ALL_CATEGORIES: MediaTaxonomyCategory[] = [
  'subjects',
  'topics',
  'concepts',
  'skills',
  'objectives',
];

function emptyByCategory(): MediaTaxonomyContextByCategory {
  return { subjects: [], topics: [], concepts: [], skills: [], objectives: [] };
}

function toNode(id: string, label: string, description?: string | null): MediaTaxonomyNode {
  return {
    id,
    label: label.trim().slice(0, LABEL_MAX),
    description: description && description.trim() ? description.trim().slice(0, DESCRIPTION_MAX) : null,
  };
}

/**
 * Build the closed taxonomy context for one canonical curriculum family using
 * the existing task022 curriculum registry as the canonical source.
 *
 * `concept` has no dedicated task022 entity; the canonical concept surface is
 * the topic-level identity, so concepts mirror canonical topics explicitly
 * labeled as such (same canonical IDs — no invention).
 */
export function buildClosedTaxonomyContext(args: {
  curriculumFamily: CurriculumFamily;
  versionId?: string;
}): ClosedTaxonomyContext {
  const resolvedAt = new Date().toISOString();

  let curriculumMap: ReturnType<typeof curriculumRegistryService.getCurriculumMap>;
  try {
    curriculumMap = curriculumRegistryService.getCurriculumMap(
      args.curriculumFamily,
      args.versionId,
    );
  } catch (error) {
    return {
      availability: 'UNAVAILABLE_SOURCE_ERROR',
      nodes: emptyByCategory(),
      sourceDescription: `task022CurriculumRegistryService:${args.curriculumFamily}`,
      unavailableReason:
        error instanceof Error ? `Taxonomy source error: ${error.message}` : 'Taxonomy source error.',
      resolvedAt,
    };
  }

  if (!curriculumMap) {
    return {
      availability: 'UNAVAILABLE_SOURCE_ERROR',
      nodes: emptyByCategory(),
      sourceDescription: `task022CurriculumRegistryService:${args.curriculumFamily}`,
      unavailableReason: `No curriculum map available for family '${args.curriculumFamily}'${args.versionId ? ` at version '${args.versionId}'` : ''}.`,
      resolvedAt,
    };
  }

  const nodes = emptyByCategory();

  const subjects: CurriculumSubject[] = [];
  const seenSubjectIds = new Set<string>();
  for (const topic of curriculumMap.topics) {
    const subjectName = topic.subject;
    if (!seenSubjectIds.has(subjectName)) {
      seenSubjectIds.add(subjectName);
      subjects.push({
        subjectId: `${args.curriculumFamily}:${subjectName}`,
        name: subjectName,
        normalizedName: subjectName.toLowerCase().trim(),
        curriculumFamily: args.curriculumFamily,
      });
    }
  }

  nodes.subjects = subjects
    .slice(0, NODES_PER_CATEGORY_MAX)
    .map((s) => toNode(s.subjectId, s.name));

  nodes.topics = (curriculumMap.topics as CurriculumTopic[])
    .filter((t) => t.status === 'active' || t.status === 'approved')
    .slice(0, NODES_PER_CATEGORY_MAX)
    .map((t) => toNode(t.topicId, t.title, t.descriptionSafe));

  // Canonical concept surface: topic identity, explicitly labeled.
  nodes.concepts = nodes.topics.map((t) => ({
    ...t,
    description: t.description ? `[concept] ${t.description}` : '[concept]',
  }));

  nodes.skills = (curriculumMap.skills as CurriculumSkill[])
    .filter((s) => s.status === 'active' || s.status === 'approved')
    .slice(0, NODES_PER_CATEGORY_MAX)
    .map((s) => toNode(s.skillId, s.title, s.studentSafeDescription));

  nodes.objectives = (curriculumMap.objectives as LearningObjective[])
    .filter((o) => o.status === 'active' || o.status === 'approved')
    .slice(0, NODES_PER_CATEGORY_MAX)
    .map((o) => toNode(o.objectiveId, o.title, o.studentSafeDescription));

  const total = ALL_CATEGORIES.reduce((sum, c) => sum + nodes[c].length, 0);

  return {
    availability: total > 0 ? 'AVAILABLE' : 'EMPTY',
    nodes,
    sourceDescription: `task022CurriculumRegistryService:${args.curriculumFamily}${args.versionId ? `@${args.versionId}` : ''}`,
    unavailableReason: null,
    resolvedAt,
  };
}

/**
 * Deterministic check: is a taxonomy ID inside the supplied closed set?
 * Governance uses this so an invented ID can never pass.
 */
export function isTaxonomyIdInClosedSet(
  context: ClosedTaxonomyContext,
  taxonomyId: string,
): boolean {
  if (!taxonomyId) return false;
  return ALL_CATEGORIES.some((category) =>
    context.nodes[category].some((node) => node.id === taxonomyId),
  );
}
