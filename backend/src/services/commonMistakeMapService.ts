import type { CurriculumTrack } from './schoolAuthBridgeContracts';
import { cambridgeTopicSeeds } from './curriculumSeeds/cambridgeTopicSeeds';
import { madrasaDeenTopicSeeds } from './curriculumSeeds/madrasaDeenTopicSeeds';

const allTopicSeeds = [...cambridgeTopicSeeds, ...madrasaDeenTopicSeeds];

export function getCommonMistakeHints(input: {
  curriculumTrack: CurriculumTrack;
  subjectId?: string;
  topicId?: string;
  learnerGrade?: string;
}): string[] {
  const { subjectId, topicId } = input;

  if (topicId) {
    const topic = allTopicSeeds.find(t => t.topicId === topicId);
    if (topic && topic.commonMistakes.length > 0) {
      return [...topic.commonMistakes];
    }
  }

  if (subjectId) {
    const subjectTopics = allTopicSeeds.filter(t => t.subjectId === subjectId);
    const allMistakes = new Set<string>();
    for (const t of subjectTopics) {
      for (const m of t.commonMistakes) {
        allMistakes.add(m);
      }
    }
    return Array.from(allMistakes).slice(0, 5);
  }

  return [];
}
