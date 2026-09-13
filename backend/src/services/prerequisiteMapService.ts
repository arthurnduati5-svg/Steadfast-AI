import type { CurriculumTrack } from './schoolAuthBridgeContracts';
import { cambridgeTopicSeeds } from './curriculumSeeds/cambridgeTopicSeeds';
import { madrasaDeenTopicSeeds } from './curriculumSeeds/madrasaDeenTopicSeeds';

const allTopicSeeds = [...cambridgeTopicSeeds, ...madrasaDeenTopicSeeds];

export function getPrerequisiteHints(input: {
  curriculumTrack: CurriculumTrack;
  subjectId?: string;
  topicId?: string;
  learnerGrade?: string;
}): string[] {
  const { subjectId, topicId } = input;

  if (topicId) {
    const topic = allTopicSeeds.find(t => t.topicId === topicId);
    if (topic && topic.prerequisites.length > 0) {
      return [...topic.prerequisites];
    }
  }

  if (subjectId) {
    const subjectTopics = allTopicSeeds.filter(t => t.subjectId === subjectId);
    const allPrereqs = new Set<string>();
    for (const t of subjectTopics) {
      for (const p of t.prerequisites) {
        allPrereqs.add(p);
      }
    }
    return Array.from(allPrereqs).slice(0, 5);
  }

  return [];
}
