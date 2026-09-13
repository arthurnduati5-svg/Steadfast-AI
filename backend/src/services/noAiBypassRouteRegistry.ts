import type { NoAiBypassRouteRegistration, NoAiBypassRouteCategory, NoAiBypassProviderBoundaryStatus } from '../contracts/noAiBypassContracts';

const routeRegistry: Map<string, NoAiBypassRouteRegistration> = new Map();

function registerRoute(reg: NoAiBypassRouteRegistration): void {
  routeRegistry.set(reg.routeId, reg);
}

registerRoute({
  routeId: 'copilot-chat',
  path: '/api/copilot/chat',
  methods: ['POST'],
  category: 'learner_conversation',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: false,
  requiresSourceTruth: false,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'tutorConversationApiRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-message',
  path: '/api/copilot/message',
  methods: ['POST'],
  category: 'learner_conversation',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: false,
  requiresSourceTruth: false,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'tutorConversationApiRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-research',
  path: '/api/copilot/research',
  methods: ['POST'],
  category: 'learner_conversation',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: false,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'researchRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-tutor-turn',
  path: '/api/copilot/tutor-turn',
  methods: ['POST'],
  category: 'tutor_turn',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'tutorTurnRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-learning-sessions',
  path: '/api/copilot/learning-sessions',
  methods: ['GET', 'POST', 'PATCH'],
  category: 'learning_session',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: false,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'studentLearningSessionRuntime',
  providerBoundaryStatus: 'no_provider_needed',
});

registerRoute({
  routeId: 'copilot-learning-mode',
  path: '/api/copilot/learning-mode',
  methods: ['POST', 'GET'],
  category: 'learning_mode',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'learningModeRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-focus-mode',
  path: '/api/copilot/focus-mode',
  methods: ['POST', 'GET'],
  category: 'focus_mode',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'focusModeRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-exam-mode',
  path: '/api/copilot/exam-mode',
  methods: ['POST', 'GET'],
  category: 'exam_mode',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'examModeRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-quiz-mode',
  path: '/api/copilot/quiz-mode',
  methods: ['POST', 'GET'],
  category: 'quiz_mode',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'quizModeRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-teach-back-mode',
  path: '/api/copilot/teach-back-mode',
  methods: ['POST', 'GET'],
  category: 'teach_back_mode',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'teachBackModeRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-revision-mode',
  path: '/api/copilot/revision-mode',
  methods: ['POST', 'GET'],
  category: 'revision_mode',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'revisionModeRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-growth',
  path: '/api/copilot/growth',
  methods: ['GET', 'POST'],
  category: 'growth_action',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: false,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'growthActionRuntime',
  providerBoundaryStatus: 'no_provider_needed',
});

registerRoute({
  routeId: 'copilot-learning-evidence',
  path: '/api/copilot/learning-evidence',
  methods: ['GET', 'POST'],
  category: 'safe_evidence',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'safeLearningEvidenceRuntime',
  providerBoundaryStatus: 'no_provider_needed',
});

registerRoute({
  routeId: 'copilot-teacher-insights',
  path: '/api/copilot/teacher-insights',
  methods: ['GET'],
  category: 'teacher_safe_insight',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: false,
  requiresSessionScope: false,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'teacherSafeInsightRuntime',
  providerBoundaryStatus: 'no_provider_needed',
});

registerRoute({
  routeId: 'copilot-learner-transparency',
  path: '/api/copilot/learner-transparency',
  methods: ['GET'],
  category: 'learner_transparency',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: false,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'learnerTransparencyRuntime',
  providerBoundaryStatus: 'no_provider_needed',
});

registerRoute({
  routeId: 'copilot-adaptive-recommendations',
  path: '/api/copilot/adaptive-recommendations',
  methods: ['GET', 'POST'],
  category: 'adaptive_recommendation',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'adaptiveRecommendationRuntime',
  providerBoundaryStatus: 'no_provider_needed',
});

registerRoute({
  routeId: 'copilot-adaptive-challenges',
  path: '/api/copilot/adaptive-challenges',
  methods: ['GET', 'POST'],
  category: 'adaptive_challenge',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'adaptiveChallengeRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'copilot-remediation',
  path: '/api/copilot/remediation',
  methods: ['GET', 'POST'],
  category: 'remediation',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'remediationRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'learner-recommendations',
  path: '/api/learner/recommendations',
  methods: ['GET'],
  category: 'adaptive_recommendation',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: false,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'learnerRecommendationRuntime',
  providerBoundaryStatus: 'no_provider_needed',
});

registerRoute({
  routeId: 'learner-preferences',
  path: '/api/learner/preferences',
  methods: ['GET', 'PATCH'],
  category: 'learner_conversation',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: false,
  requiresSourceTruth: false,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: false,
  requiresSafeguardingBoundary: false,
  allowedRuntimeService: 'learnerPreferenceRuntime',
  providerBoundaryStatus: 'no_provider_needed',
});

registerRoute({
  routeId: 'learner-sessions',
  path: '/api/learner/sessions',
  methods: ['GET', 'POST'],
  category: 'learning_session',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: false,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'studentLearningSessionRuntime',
  providerBoundaryStatus: 'no_provider_needed',
});

registerRoute({
  routeId: 'tutor-conversations',
  path: '/api/tutor/conversations',
  methods: ['POST'],
  category: 'tutor_conversation',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: true,
  requiresSourceTruth: true,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: true,
  requiresDeenBoundary: true,
  requiresSafeguardingBoundary: true,
  allowedRuntimeService: 'tutorConversationApiRuntime',
  providerBoundaryStatus: 'provider_gateway_only',
});

registerRoute({
  routeId: 'legacy-ai-route',
  path: '/api/copilot/*',
  methods: ['ALL'],
  category: 'legacy_ai',
  requiresSchoolAuth: true,
  requiresVerifiedSchoolContext: true,
  requiresLearnerScope: true,
  requiresSessionScope: false,
  requiresSourceTruth: false,
  requiresPrivacyGuard: true,
  requiresAnswerProtection: false,
  requiresDeenBoundary: false,
  requiresSafeguardingBoundary: false,
  allowedRuntimeService: 'legacyAiRuntime',
  providerBoundaryStatus: 'provider_blocked',
});

export function getRouteRegistration(routeId: string): NoAiBypassRouteRegistration | undefined {
  return routeRegistry.get(routeId);
}

export function getRouteRegistrationByPath(path: string): NoAiBypassRouteRegistration | undefined {
  for (const reg of routeRegistry.values()) {
    if (path.startsWith(reg.path)) return reg;
  }
  return undefined;
}

export function getAllRouteRegistrations(): NoAiBypassRouteRegistration[] {
  return Array.from(routeRegistry.values());
}

export function getRoutesByCategory(category: NoAiBypassRouteCategory): NoAiBypassRouteRegistration[] {
  return Array.from(routeRegistry.values()).filter(r => r.category === category);
}
