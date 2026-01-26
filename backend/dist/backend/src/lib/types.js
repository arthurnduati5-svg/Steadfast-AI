import { z } from 'zod';
export const UserProfileSchema = z.object({
    userId: z.string(),
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    gradeLevel: z.string().nullable().optional(),
    preferredLanguage: z.string().nullable().optional(),
    profileCompleted: z.boolean().optional(),
    preferences: z.any().optional(),
    favoriteShows: z.any().optional(),
});
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
    timestamp: z.date().optional(), // Added timestamp
    videoData: VideoDataSchema.optional(), // Added videoData
    image: ImageSchema.optional(), // Added image
});
export const DailyObjectiveSchema = z.object({
    id: z.string(),
    description: z.string(),
    completed: z.boolean(),
});
export const ChatSessionSchema = z.object({
    id: z.string(),
    topic: z.string().nullable().optional(),
    messages: z.array(MessageSchema).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    metadata: z.any().optional(),
    student: UserProfileSchema,
});
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
//# sourceMappingURL=types.js.map