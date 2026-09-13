import type { LearnerPrivacyVisibilitySummary } from './learnerTransparencyContracts';

export function buildLearnerPrivacyVisibility(): LearnerPrivacyVisibilitySummary {
  return {
    studentVisibleExplanation:
      'You can see your own learning progress, recommendations, and evidence summaries. Your private chat conversations are not shown in these summaries.',
    teacherVisibleSummaryExplanation:
      'Your teacher can see safe learning progress summaries, including which skills need review and your overall growth trends. Your teacher cannot see your private chat conversations or raw answers by default.',
    privateConversationBoundary:
      'Your conversations with the tutor are private. Teachers do not see the content of your chats unless there is a specific learning concern that follows school policy.',
    safeguardingExceptionExplanation:
      'If there is a serious safety concern, authorized safeguarding personnel may be informed following school safeguarding policy. Ordinary learning mistakes are not safeguarding issues.',
    dataUseSummary:
      'Your learning data is used to personalize your tutoring experience, recommend next steps, and provide teachers with safe progress summaries. Your data is not shared outside of your school.',
    teacherSafe: true,
    rawChatExcluded: true,
    privateMemoryExcluded: true,
    safeguardingBoundaryApplied: true,
    deenSensitiveHandled: true,
    redactionApplied: false,
    redactionReasons: [],
  };
}

export function buildPrivacyVisibilityForDeenTopic(): LearnerPrivacyVisibilitySummary {
  return {
    ...buildLearnerPrivacyVisibility(),
    deenSensitiveHandled: true,
    studentVisibleExplanation:
      'You can see your learning progress for this topic. Private Deen-related questions are handled with extra care and are not exposed in standard progress reports.',
    teacherVisibleSummaryExplanation:
      'Your teacher can see that you are working on a Deen-related topic but not the specific private questions or personal reflections. Source-sensitive topics may need direct teacher guidance.',
    privateConversationBoundary:
      'Your conversations about Deen topics are private. They are handled with extra sensitivity and are not included in standard learning summaries.',
  };
}

export function buildPrivacyVisibilitySummary(
  deenSensitive?: boolean,
): LearnerPrivacyVisibilitySummary {
  return deenSensitive
    ? buildPrivacyVisibilityForDeenTopic()
    : buildLearnerPrivacyVisibility();
}
