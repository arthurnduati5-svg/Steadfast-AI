import type { SubjectValidationMode, ModuleToTutorDirective } from './subjectModuleContracts';
import type {
  CurriculumContextPacket,
  CurriculumResolveInput,
  CurriculumConfidence,
  CurriculumSourceConfidence,
  DeenSensitivityLevel,
} from './curriculumRuntimeContracts';
import { resolveCurriculumTrack } from './curriculumTrackResolver';
import { FutureCurriculumAdapterRegistry } from './futureCurriculumAdapterRegistry';
import { getPrerequisiteHints } from './prerequisiteMapService';
import { getCommonMistakeHints } from './commonMistakeMapService';
import { resolveSubjectModule } from './subjectModuleResolver';
import { buildAdaptiveDirective } from './adaptiveLearningDirectiveService';
import type { AdaptiveDirectiveResult } from './adaptiveLearningDirectiveService';
import { buildModuleDirective } from './subjectModuleDirectiveService';
import { resolveGradeBand } from './gradeBandResolver';

function getDefaultModuleDirective(): ModuleToTutorDirective {
  return {
    moduleId: 'unknown',
    subjectName: 'Unknown',
    responseToneRules: ['clear', 'patient', 'helpful'],
    teachingMethodRules: ['teach step by step', 'validate understanding'],
    validationModes: ['no_strict_validation'],
    vocabularyRules: ['use clear language'],
    exampleRules: ['use simple examples'],
    endingRule: 'End with a question.',
    pacingDirective: 'unknown',
    maxIdeaCount: 3,
    maxQuestionCount: 3,
    shouldUseEmoji: false,
    shouldUseKenyanExamples: false,
    shouldUseArabicScript: false,
    shouldAvoidRomanization: false,
    shouldAvoidLatex: false,
    shouldAvoidSyntaxDumping: false,
    deenSourceHandling: 'not_deen',
    disallowedBehaviors: [],
  };
}

export function resolveCurriculumContext(
  input: CurriculumResolveInput,
  registry: FutureCurriculumAdapterRegistry,
): CurriculumContextPacket {
  if (!input || !input.requestId) {
    return buildEmptyFallback(input);
  }

  const gradeBand = resolveGradeBand(input.learnerGrade);
  const trackResolution = resolveCurriculumTrack(input);
  const { curriculumTrack } = trackResolution;

  const moduleResolution = resolveSubjectModule(input);
  const selectedModule = moduleResolution.selectedModule;

  let adaptiveDirective: AdaptiveDirectiveResult = { pacingDirective: 'balanced', rules: [], confidence: 'low' };
  let moduleDirective = getDefaultModuleDirective();

  if (selectedModule) {
    adaptiveDirective = buildAdaptiveDirective({
      module: selectedModule,
      learnerAdaptiveSnapshot: input.learnerAdaptiveSnapshot,
    });
    moduleDirective = buildModuleDirective({
      module: selectedModule,
      adaptiveDirective,
    });
  }

  if (curriculumTrack === 'unknown' && !selectedModule) {
    return {
      requestId: input.requestId,
      curriculumTrack: 'unknown',
      primaryCategory: 'unknown',
      learnerGrade: input.learnerGrade,
      learnerAge: input.learnerAge,
      curriculumConfidence: 'low',
      sourceConfidence: 'unknown',
      deenSensitivityLevel: 'none',
      prerequisiteHints: [],
      commonMistakeHints: [],
      validationModes: ['no_strict_validation'],
      teachingMethodRules: [],
      moduleDirective,
      recommendedTutorModeHint: moduleResolution.status === 'ambiguous' || moduleResolution.status === 'clarify_first'
        ? 'clarify_first'
        : 'normal_tutor',
      safeClarifyingQuestion: moduleResolution.safeClarifyingQuestion || 'I\'m not sure what you\'d like to learn about. Could you tell me if you need help with a school subject like Mathematics or English, or something Islamic like Arabic or Qur\'an?',
      unresolvedReason: moduleResolution.unresolvedReason || 'Input could not be classified into any curriculum track',
    };
  }

  if (curriculumTrack === 'mixed_academic_deen') {
    return buildMixedContext(input, registry, moduleResolution, adaptiveDirective, moduleDirective);
  }

  const adapter = registry.getAdapter(curriculumTrack);

  if (!adapter && curriculumTrack !== 'general_enrichment') {
    return {
      requestId: input.requestId,
      curriculumTrack,
      primaryCategory: 'unknown',
      subjectModule: selectedModule || undefined,
      moduleGroup: selectedModule?.group,
      moduleStatus: selectedModule?.status,
      learnerGrade: input.learnerGrade,
      learnerAge: input.learnerAge,
      curriculumConfidence: selectedModule ? 'high' : 'low',
      sourceConfidence: selectedModule?.sourceConfidence || 'unknown',
      deenSensitivityLevel: selectedModule?.deenSensitivityLevel || 'none',
      prerequisiteHints: [],
      commonMistakeHints: [],
      validationModes: moduleDirective.validationModes,
      teachingMethodRules: moduleDirective.teachingMethodRules,
      moduleDirective,
      recommendedTutorModeHint: selectedModule?.group === 'kindergarten'
        ? 'kindergarten_playful'
        : selectedModule?.curriculumTrack === 'general_enrichment'
          ? 'enrichment_coaching'
          : selectedModule?.curriculumTrack === 'madrasa_deen'
            ? 'deen_learning'
            : 'clarify_first',
      safeClarifyingQuestion: moduleResolution.status === 'ambiguous' || moduleResolution.status === 'clarify_first'
        ? moduleResolution.safeClarifyingQuestion
        : 'I see what you mean, but I need a bit more context to help effectively.',
      unresolvedReason: moduleResolution.unresolvedReason || `No adapter found for track: ${curriculumTrack}`,
    };
  }

  let basePacket: Partial<CurriculumContextPacket> = {};
  if (adapter) {
    basePacket = adapter.buildContext(input);
  }

  const topicId = basePacket.topic?.topicId;
  const subjectId = basePacket.subject?.subjectId;

  const prerequisiteHints = topicId
    ? getPrerequisiteHints({ curriculumTrack, subjectId, topicId, learnerGrade: input.learnerGrade })
    : [];

  const commonMistakeHints = topicId
    ? getCommonMistakeHints({ curriculumTrack, subjectId, topicId, learnerGrade: input.learnerGrade })
    : [];

  return {
    requestId: input.requestId,
    curriculumTrack,
    primaryCategory: basePacket.primaryCategory || 'unknown',
    subject: basePacket.subject,
    topic: basePacket.topic,
    subjectModule: selectedModule || undefined,
    moduleGroup: selectedModule?.group,
    moduleStatus: selectedModule?.status,
    learnerGrade: input.learnerGrade,
    learnerAge: input.learnerAge,
    curriculumConfidence: selectedModule ? 'high' : (basePacket.subject ? 'medium' : 'low'),
    sourceConfidence: selectedModule?.sourceConfidence || basePacket.sourceConfidence || 'unknown',
    deenSensitivityLevel: selectedModule?.deenSensitivityLevel || basePacket.deenSensitivityLevel || 'none',
    prerequisiteHints,
    commonMistakeHints,
    validationModes: moduleDirective.validationModes,
    teachingMethodRules: moduleDirective.teachingMethodRules,
    moduleDirective,
    recommendedTutorModeHint: selectedModule?.group === 'kindergarten'
      ? 'kindergarten_playful'
      : selectedModule?.curriculumTrack === 'general_enrichment'
        ? 'enrichment_coaching'
        : selectedModule?.curriculumTrack === 'madrasa_deen'
          ? 'deen_learning'
          : basePacket.recommendedTutorModeHint || 'normal_tutor',
    safeClarifyingQuestion: moduleResolution.status === 'ambiguous' || moduleResolution.status === 'clarify_first'
      ? moduleResolution.safeClarifyingQuestion
      : basePacket.safeClarifyingQuestion,
    unresolvedReason: moduleResolution.unresolvedReason || basePacket.unresolvedReason,
  };
}

function buildMixedContext(
  input: CurriculumResolveInput,
  registry: FutureCurriculumAdapterRegistry,
  moduleResolution: ReturnType<typeof resolveSubjectModule>,
  adaptiveDirective: ReturnType<typeof buildAdaptiveDirective>,
  moduleDirective: ModuleToTutorDirective,
): CurriculumContextPacket {
  const primaryAdapter = registry.getAdapter('cambridge_academic');
  const deenAdapter = registry.getAdapter('madrasa_deen');

  const primaryPacket = primaryAdapter?.buildContext(input);
  const deenPacket = deenAdapter?.buildContext(input);

  const subject = primaryPacket?.subject || deenPacket?.subject || undefined;
  const topic = primaryPacket?.topic || deenPacket?.topic || undefined;

  const selectedModule = moduleResolution.selectedModule;

  const curriculumConfidence: CurriculumConfidence = topic ? 'medium' : 'low';

  return {
    requestId: input.requestId,
    curriculumTrack: 'mixed_academic_deen',
    primaryCategory: 'mixed',
    subject,
    topic,
    subjectModule: selectedModule || undefined,
    moduleGroup: selectedModule?.group,
    moduleStatus: selectedModule?.status,
    learnerGrade: input.learnerGrade,
    learnerAge: input.learnerAge,
    curriculumConfidence,
    sourceConfidence: selectedModule?.sourceConfidence || 'draft_seed',
    deenSensitivityLevel: selectedModule?.deenSensitivityLevel || 'basic',
    prerequisiteHints: topic?.prerequisites || [],
    commonMistakeHints: topic?.commonMistakes || [],
    validationModes: moduleDirective.validationModes,
    teachingMethodRules: moduleDirective.teachingMethodRules,
    moduleDirective,
    recommendedTutorModeHint: 'deen_learning',
    safeClarifyingQuestion: moduleResolution.status === 'ambiguous' || moduleResolution.status === 'clarify_first'
      ? moduleResolution.safeClarifyingQuestion
      : subject
        ? undefined
        : 'I see you are combining academic and Islamic topics. Could you tell me more about what you need?',
    unresolvedReason: moduleResolution.unresolvedReason || (subject ? undefined : 'Mixed context detected but no specific subject resolved'),
  };
}

function buildEmptyFallback(input: CurriculumResolveInput): CurriculumContextPacket {
  return {
    requestId: input?.requestId || 'unknown',
    curriculumTrack: 'unknown',
    primaryCategory: 'unknown',
    curriculumConfidence: 'unknown',
    sourceConfidence: 'unknown',
    deenSensitivityLevel: 'none',
    prerequisiteHints: [],
    commonMistakeHints: [],
    validationModes: ['no_strict_validation'],
    teachingMethodRules: [],
    moduleDirective: getDefaultModuleDirective(),
    recommendedTutorModeHint: 'clarify_first',
    safeClarifyingQuestion: 'I\'m not sure what you\'d like to learn about. Could you tell me more?',
    unresolvedReason: 'Empty or invalid input',
  };
}
