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
import { madrasaDeenSubjectSeeds } from './curriculumSeeds/madrasaDeenSubjectSeeds';
import { madrasaDeenTopicSeeds } from './curriculumSeeds/madrasaDeenTopicSeeds';
import { matchSubject, matchTopic, findSubjectById } from './subjectTopicMapper';

export class MadrasaDeenCurriculumAdapter implements CurriculumAdapter {
  readonly track: CurriculumTrack = 'madrasa_deen';

  canHandle(input: CurriculumResolveInput): boolean {
    if (input.curriculumTrackHint === 'madrasa_deen') return true;
    const subject = matchSubject({
      text: input.messageText,
      subjectHint: input.subjectHint,
      curriculumTrack: 'madrasa_deen',
    });
    if (subject) return true;
    const topic = matchTopic({
      text: input.messageText,
      topicHint: input.topicHint,
      curriculumTrack: 'madrasa_deen',
    });
    return topic !== null;
  }

  resolveSubject(input: CurriculumResolveInput): CurriculumSubjectContext | null {
    const direct = matchSubject({
      text: input.messageText,
      subjectHint: input.subjectHint,
      curriculumTrack: 'madrasa_deen',
    });
    if (direct) return direct;

    const topic = matchTopic({
      text: input.messageText,
      topicHint: input.topicHint,
      curriculumTrack: 'madrasa_deen',
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
      curriculumTrack: 'madrasa_deen',
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

    const sourceConfidence: CurriculumSourceConfidence =
      topic?.sourceConfidence === 'founder_provided_school_subject'
        ? 'founder_provided_school_subject'
        : topic?.sourceConfidence === 'future_source_required'
          ? 'future_source_required'
          : topic?.sourceConfidence === 'approved_seed'
            ? 'approved_seed'
            : 'draft_seed';

    const deenSensitivityLevel: DeenSensitivityLevel =
      topic?.deenSensitivityLevel || (subject ? 'basic' : 'none');

    const category: CurriculumCategory = subject?.category === 'language' ? 'language' : 'deen';

    const prerequisites = topic?.prerequisites || [];
    const commonMistakes = topic?.commonMistakes || [];

    const recommendedTutorModeHint = topic
      ? deenSensitivityLevel === 'basic'
        ? 'deen_learning'
        : 'deep_explanation'
      : subject?.category === 'language'
        ? 'arabic_learning'
        : 'clarify_first';

    return {
      requestId: input.requestId,
      curriculumTrack: 'madrasa_deen',
      primaryCategory: category,
      subject: subject || undefined,
      topic: topic || undefined,
      learnerGrade: input.learnerGrade,
      learnerAge: input.learnerAge,
      curriculumConfidence,
      sourceConfidence,
      deenSensitivityLevel,
      prerequisiteHints: prerequisites,
      commonMistakeHints: commonMistakes,
      recommendedTutorModeHint,
      safeClarifyingQuestion: !subject
        ? 'Would you like to learn about Arabic, Qur\'an, Hadith, Seerah, Fiqh, or Islamic character?'
        : !topic
          ? `I see you are interested in ${subject.name}. What specific topic would you like to learn about?`
          : undefined,
      unresolvedReason: !subject
        ? 'Could not resolve Madrasa/Deen subject from input'
        : !topic
          ? 'Subject resolved but topic not matched'
          : undefined,
    };
  }
}
