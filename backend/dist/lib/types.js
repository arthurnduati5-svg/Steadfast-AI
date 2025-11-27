"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationStateSchema = exports.ChatSessionSchema = exports.DailyObjectiveSchema = exports.MessageSchema = exports.ImageSchema = exports.VideoDataSchema = exports.UserProfileSchema = void 0;
const zod_1 = require("zod");
exports.UserProfileSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    name: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().nullable().optional(),
    gradeLevel: zod_1.z.string().nullable().optional(),
    preferredLanguage: zod_1.z.string().nullable().optional(),
    profileCompleted: zod_1.z.boolean().optional(),
    preferences: zod_1.z.any().optional(),
    favoriteShows: zod_1.z.any().optional(),
});
exports.VideoDataSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().optional(),
    channel: zod_1.z.string().optional(),
    channelTitle: zod_1.z.string().optional(),
    thumbnailUrl: zod_1.z.string().optional(),
    videoId: zod_1.z.string().optional(),
});
exports.ImageSchema = zod_1.z.object({
    src: zod_1.z.string(),
    alt: zod_1.z.string().optional(),
});
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string(), // Added id
    role: zod_1.z.enum(['user', 'model']),
    content: zod_1.z.string(),
    timestamp: zod_1.z.date().optional(), // Added timestamp
    videoData: exports.VideoDataSchema.optional(), // Added videoData
    image: exports.ImageSchema.optional(), // Added image
});
exports.DailyObjectiveSchema = zod_1.z.object({
    id: zod_1.z.string(),
    description: zod_1.z.string(),
    completed: zod_1.z.boolean(),
});
exports.ChatSessionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    topic: zod_1.z.string().nullable().optional(),
    messages: zod_1.z.array(exports.MessageSchema).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    metadata: zod_1.z.any().optional(),
    student: exports.UserProfileSchema,
});
exports.ConversationStateSchema = zod_1.z.object({
    researchModeActive: zod_1.z.boolean().default(false),
    lastSearchTopic: zod_1.z.array(zod_1.z.string()).optional(),
    awaitingPracticeQuestionInvitationResponse: zod_1.z.boolean().default(false),
    activePracticeQuestion: zod_1.z.string().optional(),
    awaitingPracticeQuestionAnswer: zod_1.z.boolean().default(false),
    validationAttemptCount: zod_1.z.number().default(0),
    lastAssistantMessage: zod_1.z.string().optional(),
    sensitiveContentDetected: zod_1.z.boolean().default(false),
    videoSuggested: zod_1.z.boolean().default(false),
    usedExamples: zod_1.z.array(zod_1.z.string()).optional(),
});
//# sourceMappingURL=types.js.map