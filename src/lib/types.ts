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
  id: z.string(), // Added id
  role: z.enum(['user', 'model']),
  content: z.string(),
  videoData: VideoDataSchema.optional(), // Added videoData
  image: ImageSchema.optional(), // Added image
});
export type Message = z.infer<typeof MessageSchema>;

export const DailyObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  completed: z.boolean(),
});
export type DailyObjective = z.infer<typeof DailyObjectiveSchema>;

export const ChatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  messages: z.array(MessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const ConversationStateSchema = z.object({
  researchModeActive: z.boolean().default(false),
  lastSearchTopic: z.array(z.string()).optional(),
  awaitingPracticeQuestionInvitationResponse: z.boolean().default(false),
  activePracticeQuestion: z.string().optional(),
  awaitingPracticeQuestionAnswer: z.boolean().default(false),
  validationAttemptCount: z.number().default(0),
  lastAssistantMessage: z.string().optional(),
  sensitiveContentDetected: z.boolean().default(false), 
  videoSuggested: z.boolean().default(false), // New state for video suggestion
});
export type ConversationState = z.infer<typeof ConversationStateSchema>;

export type UserIntent = 'Accept' | 'Decline' | 'NewTopic' | 'Search' | 'GeneralResponse' | 'ExitResearch' | 'Answer' | 'Clarify' | 'ConfirmAccept' | 'ConfirmDecline' | 'Curious' | 'Unsure' | 'RandomSilly' | 'InsultAngry' | 'VideoRequest'; // Added VideoRequest
