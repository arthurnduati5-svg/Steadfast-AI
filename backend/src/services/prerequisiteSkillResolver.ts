import { getPrerequisiteHints } from './prerequisiteMapService';
import type { PrerequisiteSkillResult } from './task015Contracts';

export class PrerequisiteSkillResolver {
  resolvePrerequisites(input: {
    subject: string;
    topic?: string;
    skillTag?: string;
    blockingSkillTag?: string | null;
  }): PrerequisiteSkillResult {
    const { subject, topic, skillTag, blockingSkillTag } = input;

    const hints = getPrerequisiteHints({
      curriculumTrack: 'cambridge_academic' as const,
      subjectId: subject,
      topicId: topic ?? undefined,
    });

    if (hints.length > 0) {
      return {
        blockingSkill: blockingSkillTag ?? null,
        prerequisiteSkills: hints,
        prerequisiteLabels: hints,
        confidence: 0.7,
        source: 'curriculum',
        blockedBySkill: null,
      };
    }

    if (blockingSkillTag) {
      return {
        blockingSkill: blockingSkillTag,
        prerequisiteSkills: [blockingSkillTag],
        prerequisiteLabels: [blockingSkillTag],
        confidence: 0.5,
        source: 'inferred',
        blockedBySkill: blockingSkillTag,
      };
    }

    return {
      blockingSkill: null,
      prerequisiteSkills: [],
      prerequisiteLabels: [],
      confidence: 0.3,
      source: 'safe_fallback',
      blockedBySkill: null,
    };
  }
}

export const prerequisiteSkillResolver = new PrerequisiteSkillResolver();
