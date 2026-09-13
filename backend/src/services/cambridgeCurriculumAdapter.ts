import type { CurriculumTrack } from './schoolAuthBridgeContracts';
import type {
  CurriculumContextPacket,
  CurriculumResolveInput,
  CurriculumSubjectContext,
  CurriculumTopicContext,
  CurriculumCategory,
  CurriculumConfidence,
  CurriculumSourceConfidence,
  DeenSensitivityLevel,
} from './curriculumRuntimeContracts';
import type { CurriculumAdapter } from './curriculumAdapterContracts';
import { cambridgeSubjectSeeds } from './curriculumSeeds/cambridgeSubjectSeeds';
import { cambridgeTopicSeeds } from './curriculumSeeds/cambridgeTopicSeeds';
import { matchSubject, matchTopic, findSubjectById } from './subjectTopicMapper';

export class CambridgeCurriculumAdapter implements CurriculumAdapter {
  readonly track: CurriculumTrack = 'cambridge_academic';

  canHandle(input: CurriculumResolveInput): boolean {
    if (input.curriculumTrackHint === 'cambridge_academic') return true;
    const subject = matchSubject({
      text: input.messageText,
      subjectHint: input.subjectHint,
      curriculumTrack: 'cambridge_academic',
    });
    if (subject) return true;
    const topic = matchTopic({
      text: input.messageText,
      topicHint: input.topicHint,
      curriculumTrack: 'cambridge_academic',
    });
    return topic !== null;
  }

  resolveSubject(input: CurriculumResolveInput): CurriculumSubjectContext | null {
    const direct = matchSubject({
      text: input.messageText,
      subjectHint: input.subjectHint,
      curriculumTrack: 'cambridge_academic',
    });
    if (direct) return direct;

    const topic = matchTopic({
      text: input.messageText,
      topicHint: input.topicHint,
      curriculumTrack: 'cambridge_academic',
    });
    if (topic) {
      return findSubjectById(topic.subjectId);
    }

    return null;
  }

  resolveTopic(input: CurriculumResolveInput): CurriculumTopicContext | null {
    const subject = this.resolveSubject(input);
    return matchTopic({
      text: input.messageText,
      topicHint: input.topicHint,
      subjectId: subject?.subjectId,
      curriculumTrack: 'cambridge_academic',
    });
  }

  buildContext(input: CurriculumResolveInput): CurriculumContextPacket {
    const subject = this.resolveSubject(input);
    const topic = this.resolveTopic(input);

    const curriculumConfidence: CurriculumConfidence = topic
      ? 'high'
      : subject
        ? 'medium'
        : 'unknown';

    const sourceConfidence: CurriculumSourceConfidence = subject
      ? 'founder_provided_school_subject'
      : 'draft_seed';

    const category: CurriculumCategory = 'academic';

    const prerequisites = topic?.prerequisites || [];
    const commonMistakes = topic?.commonMistakes || [];

    const recommendedTutorModeHint = topic
      ? 'normal_tutor'
      : subject
        ? 'deep_explanation'
        : 'clarify_first';

    return {
      requestId: input.requestId,
      curriculumTrack: 'cambridge_academic',
      primaryCategory: category,
      subject: subject || undefined,
      topic: topic || undefined,
      learnerGrade: input.learnerGrade,
      learnerAge: input.learnerAge,
      curriculumConfidence,
      sourceConfidence,
      deenSensitivityLevel: 'none',
      prerequisiteHints: prerequisites,
      commonMistakeHints: commonMistakes,
      recommendedTutorModeHint,
      safeClarifyingQuestion: !subject
        ? 'Which Cambridge subject would you like to study? For example: Mathematics, English, or Science.'
        : !topic
          ? `I see you are interested in ${subject.name}. Which topic would you like to explore?`
          : undefined,
      unresolvedReason: !subject
        ? 'Could not resolve Cambridge subject from input'
        : !topic
          ? 'Subject resolved but topic not matched'
          : undefined,
    };
  }
}
