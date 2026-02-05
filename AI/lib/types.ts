import { z } from 'zod';

export const VideoDataSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  channel: z.string().optional(),
  channelTitle: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  videoId: z.string().optional(),
});

export const ImageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
});

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'model']),
  content: z.string(),
  timestamp: z.date().optional(),
  videoData: VideoDataSchema.optional(),
  image: ImageSchema.optional(),
  isError: z.boolean().optional(),
  sources: z.array(z.any()).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const DailyObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  completed: z.boolean(),
});
export type DailyObjective = z.infer<typeof DailyObjectiveSchema>;

export const ConversationStateSchema = z.object({
  researchModeActive: z.boolean().default(false),
  lastSearchTopic: z.array(z.string()).optional(),
  awaitingPracticeQuestionInvitationResponse: z.boolean().default(false),
  activePracticeQuestion: z.string().optional(),
  awaitingPracticeQuestionAnswer: z.boolean().default(false),
  validationAttemptCount: z.number().default(0),
  lastAssistantMessage: z.string().optional(),
  sensitiveContentDetected: z.boolean().default(false),
  videoSuggested: z.boolean().default(false),
  usedExamples: z.array(z.string()).optional(),
});
export type ConversationState = z.infer<typeof ConversationStateSchema>;

export const ChatSessionSchema = z.object({
  id: z.string(),
  title: z.string().optional(), // Marking as optional since backend uses 'topic'
  topic: z.string().nullable().optional(),
  messages: z.array(MessageSchema).optional(),
  createdAt: z.string(), // Expecting string from API
  updatedAt: z.string(), // Expecting string from API
  metadata: z.any().optional(),
  conversationState: ConversationStateSchema.optional(), // Added conversationState
});
export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const UserProfileSchema = z.object({
  userId: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  gradeLevel: z.string().nullable().optional(),
  preferredLanguage: z.string().nullable().optional(),
  interests: z.array(z.string()).optional(), // Changed from topInterests
  profileCompleted: z.boolean().optional(),
  // The 'preferences' field can still exist if the backend sends a more complex object,
  // but for direct access in frontend components, 'preferredLanguage' and 'interests' are now direct properties.
  preferences: z.any().optional(),
  favoriteShows: z.any().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export type UserIntent = 'Accept' | 'Decline' | 'NewTopic' | 'Search' | 'GeneralResponse' | 'ExitResearch' | 'Answer' | 'Clarify' | 'ConfirmAccept' | 'ConfirmDecline' | 'Curious' | 'Unsure' | 'RandomSilly' | 'InsultAngry' | 'VideoRequest';
