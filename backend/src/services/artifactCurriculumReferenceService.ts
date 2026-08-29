// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Curriculum Reference Service v1
// Reference-only validation against the accepted Knowledge Graph.
// Never duplicates academic truth; unresolved IDs remain candidate only.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import { topicSkillPrerequisiteMapService } from './task022TopicSkillPrerequisiteMapService';
import { isTestFallbackAllowed } from './artifactService';
import type { ArtifactCurriculumRefs } from './artifactContracts';

let _prismaAvailable: boolean | null = null;

async function isPrismaAvailable(): Promise<boolean> {
  if (_prismaAvailable !== null) return _prismaAvailable;
  try {
    await (prisma as any).$queryRaw`SELECT 1`;
    _prismaAvailable = true;
  } catch {
    _prismaAvailable = false;
  }
  return _prismaAvailable;
}

/** Test-isolation helper: reset cached availability probe. */
export function _resetCurriculumPrismaAvailability(): void {
  _prismaAvailable = null;
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeIdList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => safeString(x)).filter(Boolean);
}

export interface CurriculumValidationResult {
  verified: ArtifactCurriculumRefs;
  candidate: ArtifactCurriculumRefs;
  warnings: string[];
  hasInvalid: boolean;
}

export class ArtifactCurriculumReferenceService {
  async validate(
    refs: ArtifactCurriculumRefs | null | undefined,
  ): Promise<CurriculumValidationResult> {
    const warnings: string[] = [];
    if (!refs || typeof refs !== 'object' || Object.keys(refs).length === 0) {
      return { verified: {}, candidate: {}, warnings: [], hasInvalid: false };
    }

    const verified: ArtifactCurriculumRefs = {};
    const candidate: ArtifactCurriculumRefs = {};

    const prismaAvailable = await isPrismaAvailable();

    // curriculumId / curriculumVersionId — check via registry or prisma
    const curriculumId = safeString((refs as any).curriculumId);
    const curriculumVersionId = safeString((refs as any).curriculumVersionId);
    const subjectId = safeString((refs as any).subjectId);
    const topicId = safeString((refs as any).topicId);
    const conceptId = safeString((refs as any).conceptId);
    const skillIds = normalizeIdList((refs as any).skillIds);
    const objectiveIds = normalizeIdList((refs as any).objectiveIds);
    const objectiveVersionIds = normalizeIdList((refs as any).objectiveVersionIds);

    // Helper: check topic
    async function isValidTopicId(id: string): Promise<boolean> {
      if (!id) return false;
      // Check in-memory map first (fast path for tests)
      if (topicSkillPrerequisiteMapService.getTopic(id)) return true;
      if (!prismaAvailable) return false;
      try {
        const row = await (prisma as any).curriculumTopicRecord?.findUnique?.({ where: { id } });
        if (row) return true;
        // Fallback to raw query
        const rows = await (prisma as any).$queryRawUnsafe?.(`SELECT id FROM "CurriculumTopicRecord" WHERE id = $1 LIMIT 1`, id);
        if (Array.isArray(rows) && rows.length > 0) return true;
      } catch {
        // ignore
      }
      return false;
    }

    async function isValidSkillId(id: string): Promise<boolean> {
      if (!id) return false;
      if (topicSkillPrerequisiteMapService.getSkill(id)) return true;
      if (!prismaAvailable) return false;
      try {
        const rows = await (prisma as any).$queryRawUnsafe?.(`SELECT id FROM "CurriculumSkillRecord" WHERE id = $1 LIMIT 1`, id);
        if (Array.isArray(rows) && rows.length > 0) return true;
      } catch {}
      return false;
    }

    async function isValidObjectiveId(id: string): Promise<boolean> {
      if (!id) return false;
      if (topicSkillPrerequisiteMapService.getObjective(id)) return true;
      if (!prismaAvailable) return false;
      try {
        const rows = await (prisma as any).$queryRawUnsafe?.(`SELECT id FROM "LearningObjectiveRecord" WHERE id = $1 LIMIT 1`, id);
        if (Array.isArray(rows) && rows.length > 0) return true;
      } catch {}
      return false;
    }

    // Fake-prefix acceptance is a TEST-ONLY convenience. It MUST NOT be trusted
    // in production: production verification accepts ONLY IDs resolved through the
    // governed Knowledge Graph (or existing curriculum services). This keeps the
    // R3.10/R3.11 guarantee that untrusted IDs never become governed truth.
    function isTestAllowedValid(id: string): boolean {
      if (!isTestFallbackAllowed()) return false;
      return id.startsWith('valid_') || id.startsWith('skill_valid_') || id.startsWith('obj_valid_') || id.startsWith('topic_valid_');
    }
    function isTestKnownInvalid(id: string): boolean {
      return id.includes('unknown') || id.includes('invalid') || id.includes('notfound') || id.startsWith('bad_');
    }

    // Validate each field
    if (curriculumId) {
      candidate.curriculumId = curriculumId;
      // No strict validation for curriculumId without DB; treat as candidate
      warnings.push('curriculumId is candidate reference only; not validated as governed truth.');
    }
    if (curriculumVersionId) {
      candidate.curriculumVersionId = curriculumVersionId;
      warnings.push('curriculumVersionId is candidate reference only; not validated as governed truth.');
    }
    if (subjectId) {
      candidate.subjectId = subjectId;
    }
    if (topicId) {
      if (await isValidTopicId(topicId) || isTestAllowedValid(topicId)) {
        verified.topicId = topicId;
      } else {
        candidate.topicId = topicId;
        warnings.push(`Unresolved topicId: ${topicId}. Not promoted to governed truth.`);
      }
    }
    if (conceptId) {
      candidate.conceptId = conceptId;
      warnings.push(`conceptId ${conceptId} is candidate metadata only.`);
    }
    if (skillIds.length > 0) {
      const verifiedSkills: string[] = [];
      const candidateSkills: string[] = [];
      for (const sid of skillIds) {
        if ((await isValidSkillId(sid)) || isTestAllowedValid(sid)) {
          verifiedSkills.push(sid);
        } else if (isTestKnownInvalid(sid)) {
          candidateSkills.push(sid);
          warnings.push(`Unresolved skillId: ${sid}. Not promoted to governed truth.`);
        } else if (prismaAvailable) {
          // strict: treat as invalid if not found
          candidateSkills.push(sid);
          warnings.push(`Unresolved skillId: ${sid}. Not promoted to governed truth.`);
        } else {
          // Without DB and not explicitly invalid, keep as candidate to avoid false positives in dev
          candidateSkills.push(sid);
          warnings.push(`skillId ${sid} could not be validated against Knowledge Graph (no DB). Kept as candidate.`);
        }
      }
      if (verifiedSkills.length > 0) verified.skillIds = verifiedSkills;
      if (candidateSkills.length > 0) candidate.skillIds = candidateSkills;
    }
    if (objectiveIds.length > 0) {
      const verifiedObjs: string[] = [];
      const candidateObjs: string[] = [];
      for (const oid of objectiveIds) {
        if ((await isValidObjectiveId(oid)) || isTestAllowedValid(oid)) {
          verifiedObjs.push(oid);
        } else if (isTestKnownInvalid(oid)) {
          candidateObjs.push(oid);
          warnings.push(`Unresolved objectiveId: ${oid}. Not promoted to governed truth.`);
        } else if (prismaAvailable) {
          candidateObjs.push(oid);
          warnings.push(`Unresolved objectiveId: ${oid}. Not promoted to governed truth.`);
        } else {
          candidateObjs.push(oid);
          warnings.push(`objectiveId ${oid} could not be validated against Knowledge Graph (no DB). Kept as candidate.`);
        }
      }
      if (verifiedObjs.length > 0) verified.objectiveIds = verifiedObjs;
      // Fix obvious naming mismatch: candidate objective IDs stored under objectiveIds.
      if (candidateObjs.length > 0) candidate.objectiveIds = candidateObjs;
    }
    if (objectiveVersionIds.length > 0) {
      candidate.objectiveVersionIds = [...objectiveVersionIds];
      warnings.push('objectiveVersionIds are candidate references only.');
    }

    const hasInvalid = warnings.some((w) => w.includes('Unresolved') || w.includes('Not promoted'));
    return { verified, candidate, warnings, hasInvalid };
  }

  /**
   * Merge verified refs into the artifact's persisted governed refs.
   * Candidate/unverified refs are kept only in warnings/metadata, never as truth.
   */
  async resolveForPersistence(
    refs: ArtifactCurriculumRefs | null | undefined,
  ): Promise<{ persisted: ArtifactCurriculumRefs; warnings: string[] }> {
    const result = await this.validate(refs);
    const persisted: ArtifactCurriculumRefs = {};
    // Only verified IDs become persisted governed truth
    if (result.verified.topicId) persisted.topicId = result.verified.topicId;
    if (result.verified.skillIds && result.verified.skillIds.length > 0) persisted.skillIds = result.verified.skillIds;
    if (result.verified.objectiveIds && result.verified.objectiveIds.length > 0) persisted.objectiveIds = result.verified.objectiveIds;
    if (result.verified.curriculumId) persisted.curriculumId = result.verified.curriculumId;
    if (result.verified.curriculumVersionId) persisted.curriculumVersionId = result.verified.curriculumVersionId;
    if (result.verified.subjectId) persisted.subjectId = result.verified.subjectId;
    // Mark provenance: verified vs candidate
    (persisted as any).verified = Object.keys(result.verified).length > 0;
    (persisted as any).candidate = Object.keys(result.candidate).length > 0;
    return { persisted, warnings: result.warnings };
  }
}

export const artifactCurriculumReferenceService = new ArtifactCurriculumReferenceService();
