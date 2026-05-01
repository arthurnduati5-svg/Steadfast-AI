"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schoolAuthMiddleware_1 = require("../middleware/schoolAuthMiddleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const redis_1 = require("../lib/redis");
const vectorClient_1 = __importDefault(require("../lib/vectorClient"));
const openai_1 = require("openai");
const workers_1 = require("../workers");
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const flow_1 = require("@genkit-ai/flow");
// ✅ IMPORT THE BRAIN & PREFERENCE SERVICE
const aiPreferenceService_1 = require("../services/aiPreferenceService");
const voiceLedgerService_1 = require("../services/voiceLedgerService");
const revisionLearningService_1 = require("../services/revisionLearningService");
const studySupportService_1 = require("../services/studySupportService");
const researchModeService_1 = require("../services/researchModeService");
const videoRecommendationService_1 = require("../services/videoRecommendationService");
const learningEffectivenessService_1 = require("../services/learningEffectivenessService");
const constitutionHealthService_1 = require("../services/constitutionHealthService");
const founderTruthService_1 = require("../services/founderTruthService");
const metacognitionService_1 = require("../services/metacognitionService");
const practicePadService_1 = require("../services/practicePadService");
const revisionService_1 = require("../services/revisionService");
const logger_1 = require("../utils/logger");
const express_rate_limit_1 = require("express-rate-limit");
const safetyRiskService_1 = require("../services/safetyRiskService");
const safetyNotifier_1 = require("../services/safetyNotifier");
const rbac_1 = require("../lib/rbac");
const latencyService_1 = require("../services/latencyService");
const emotional_ai_copilot_attachments_js_1 = require("../../../AI/ai/flows/emotional-ai-copilot.attachments.js");
const get_youtube_transcript_1 = require("../../../AI/ai/flows/get-youtube-transcript");
const source_trust_1 = require("../../../AI/lib/research/source-trust");
const router = (0, express_1.Router)();
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = vectorClient_1.default ? vectorClient_1.default.Index(process.env.PINECONE_INDEX || '') : null;
let emotionalAICopilotModulePromise = null;
let ensureCopilotPreferencesMetadataPromise = null;
async function getEmotionalAICopilot() {
    if (!emotionalAICopilotModulePromise) {
        emotionalAICopilotModulePromise = Promise.resolve().then(() => __importStar(require('../../../AI/ai/flows/emotional-ai-copilot')));
    }
    const module = await emotionalAICopilotModulePromise;
    return module.emotionalAICopilot;
}
const uploadDir = process.env.STEADFAST_UPLOAD_DIR
    ? path_1.default.resolve(process.env.STEADFAST_UPLOAD_DIR)
    : path_1.default.join(os_1.default.tmpdir(), 'steadfast-ai', 'uploads');
// Configure multer for audio uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
            const safeOriginalName = path_1.default
                .basename(file.originalname || 'audio.webm')
                .replace(/[^a-zA-Z0-9._-]/g, '_');
            cb(null, `audio-${Date.now()}-${safeOriginalName}`);
        }
    }),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only audio files are allowed.'));
        }
    }
});
// 📉 SPECIALIZED RATE LIMITERS (Limited Per Student ID, not IP, to support School NAT)
const aiLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 1 * 60 * 1000,
    max: 30, // 30 requests per minute per student
    keyGenerator: (req) => (req.user?.id || req.ip || 'anon').toString(),
    message: { message: 'AI processing limit reached. Please wait a minute.' },
    validate: { default: false }
});
const sttLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 1 * 60 * 1000,
    max: 15,
    keyGenerator: (req) => (req.user?.id || req.ip || 'anon').toString(),
    message: { message: 'Too many voice-to-text requests. Please slow down.' },
    validate: { default: false }
});
const ttsLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 1 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => (req.user?.id || req.ip || 'anon').toString(),
    message: { message: 'Too many text-to-voice requests. Please slow down.' },
    validate: { default: false }
});
const DEFAULT_CONVERSATION_STATE = {
    researchModeActive: false,
    lastSearchTopic: [],
    awaitingPracticeQuestionInvitationResponse: false,
    activePracticeQuestion: undefined,
    awaitingPracticeQuestionAnswer: false,
    validationAttemptCount: 0,
    lastAssistantMessage: undefined,
    sensitiveContentDetected: false,
    videoSuggested: false,
    usedExamples: [],
};
const MAX_MESSAGE_CHARS = 4000;
const MAX_TTS_CHARS = 4000;
const MAX_HISTORY_MESSAGES = 24;
const MAX_HISTORY_CHARS = 14000;
const MAX_INTERESTS = 30;
const CACHE_VERSION = 'v2';
const MAX_TUTOR_ARTIFACT_PREVIEW_CHARS = 1400;
const VALID_TUTOR_ACTIONS = new Set([
    'ask',
    'hint',
    'breakdown',
    'summarize',
    'practice',
    'save',
]);
const MAX_VOICE_SESSIONS_PER_DAY = 3;
const MAX_VOICE_SECONDS_PER_SESSION = 180;
const MAX_VOICE_BALANCE_SPEND_SECONDS = 240;
const MAX_VOICE_SECONDS_PER_DAY = MAX_VOICE_SESSIONS_PER_DAY * MAX_VOICE_SECONDS_PER_SESSION;
const MAX_DOCUMENT_UPLOADS_PER_24H = 2;
const DOCUMENT_UPLOAD_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TTS_VOICE = 'alloy';
const DEFAULT_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'tts-1';
const ALLOWED_TTS_VOICES = new Set(['alloy', 'sage', 'ash', 'verse', 'coral']);
const createLatencyTurnId = () => `backend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const safeString = (value) => (typeof value === 'string' ? value : '');
const asRecord = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    return value;
};
const toPrismaNestedJson = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        return value;
    if (typeof value === 'bigint')
        return value.toString();
    if (value instanceof Date)
        return value.toISOString();
    if (Array.isArray(value)) {
        return value.map((item) => {
            const normalized = toPrismaNestedJson(item);
            return normalized === undefined ? null : normalized;
        });
    }
    if (typeof value === 'object') {
        const record = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            const normalized = toPrismaNestedJson(nestedValue);
            if (normalized !== undefined) {
                record[key] = normalized;
            }
        }
        return record;
    }
    return safeString(value);
};
const toPrismaMetadata = (value) => {
    const normalized = toPrismaNestedJson(value);
    if (normalized === undefined)
        return undefined;
    if (normalized === null)
        return client_1.Prisma.JsonNull;
    if (!Array.isArray(normalized) && typeof normalized === 'object' && Object.keys(normalized).length === 0) {
        return undefined;
    }
    return normalized;
};
const normalizeCacheText = (value) => safeString(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const limitText = (value, maxChars = MAX_TUTOR_ARTIFACT_PREVIEW_CHARS) => {
    const clean = safeString(value).replace(/\s+/g, ' ').trim();
    if (!clean)
        return '';
    return clean.length <= maxChars ? clean : `${clean.slice(0, maxChars - 3).trimEnd()}...`;
};
function extractQuestionLikeLines(text) {
    return safeString(text)
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .filter((line) => /^\d+[\).:-]\s+/.test(line) || /[?]$/.test(line))
        .slice(0, 6);
}
function extractTopicHints(text) {
    const cleaned = safeString(text)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleaned)
        return [];
    const stopWords = new Set([
        'about', 'after', 'again', 'also', 'because', 'below', 'between', 'clear', 'clearly',
        'document', 'equation', 'explain', 'from', 'have', 'image', 'into', 'lesson', 'make',
        'notes', 'page', 'pdf', 'photo', 'please', 'question', 'questions', 'school', 'solve',
        'student', 'study', 'summary', 'teacher', 'text', 'that', 'this', 'those', 'these',
        'video', 'watch', 'with', 'worksheet'
    ]);
    const counts = new Map();
    for (const token of cleaned.split(' ')) {
        if (token.length < 4 || stopWords.has(token))
            continue;
        counts.set(token, (counts.get(token) || 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 6)
        .map(([token]) => token);
}
function extractHeadingLikeLines(text) {
    return safeString(text)
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .filter((line) => /^#{1,6}\s+/.test(line) ||
        /^[A-Z0-9][A-Z0-9\s:,-]{5,}$/.test(line) ||
        /^(section|topic|chapter|lesson|surah|ayah|question|part)\s*[:\-]/i.test(line))
        .map((line) => line.replace(/^#{1,6}\s+/, ''))
        .slice(0, 6);
}
function extractActionableTasks(text) {
    return safeString(text)
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .filter((line) => /^\d+[\).:-]\s+/.test(line) ||
        /^(solve|find|calculate|explain|define|compare|describe|list|write|state|prove|show|simplify|factor|differentiate|integrate|translate|summarize|summarise|analyse|analyze)\b/i.test(line))
        .slice(0, 8);
}
function inferSubjectFromTopic(topic) {
    const lower = safeString(topic).toLowerCase();
    if (!lower)
        return 'General';
    if (/\b(quran|surah|ayah|hadith|fiqh|seerah|sirah|tajweed|dua|salah|wudu|wudhu|akhlaq|aqeedah|islam)\b/.test(lower))
        return 'Islamic Studies';
    if (/\b(algebra|equation|fraction|ratio|geometry|trigonometry|simultaneous|calculus|math|mathematics|percentage|probability)\b/.test(lower))
        return 'Mathematics';
    if (/\b(chemistry|atom|molecule|acid|base|reaction|periodic)\b/.test(lower))
        return 'Chemistry';
    if (/\b(physics|force|motion|electric|velocity|acceleration|energy)\b/.test(lower))
        return 'Physics';
    if (/\b(biology|cell|photosynthesis|genetics|ecosystem|respiration)\b/.test(lower))
        return 'Biology';
    if (/\b(english|grammar|comprehension|essay|poem|literature)\b/.test(lower))
        return 'English';
    if (/\b(history|government|geography|map|climate|population)\b/.test(lower))
        return 'Humanities';
    return 'General';
}
function inferArtifactType(args) {
    const file = safeString(args.fileName).toLowerCase();
    const text = `${safeString(args.extractedText)} ${safeString(args.summary)}`.toLowerCase();
    if (args.kind === 'image' && /\b(graph|diagram|chart|table)\b/.test(text))
        return 'visual-study-material';
    if (/\b(question|answer all questions|marks|attempt|worksheet|revision)\b/.test(text) || /\bworksheet|assignment|revision\b/.test(file))
        return 'worksheet';
    if (/\b(notes?|summary|summaries|key points|lesson)\b/.test(text) || /\bnotes?\b/.test(file))
        return 'study-notes';
    if (/\b(exam|paper|kcse|quiz|test)\b/.test(text) || /\bexam|test|quiz|paper\b/.test(file))
        return 'assessment';
    if (/\b(surah|ayah|hadith|fiqh|tajweed|dua)\b/.test(text))
        return 'islamic-study-material';
    if (/\b(table|data|figure)\b/.test(text))
        return 'reference-sheet';
    return args.kind === 'pdf' ? 'document' : args.kind === 'text' ? 'text-notes' : 'image-material';
}
function deriveLearnerStage(args) {
    const activeTopic = safeString(args.activeTopic).toLowerCase();
    const progress = Array.isArray(args.memory?.progress) ? args.memory.progress : [];
    const mistakes = Array.isArray(args.memory?.mistakes) ? args.memory.mistakes : [];
    const topicProgress = progress.find((entry) => safeString(entry?.topic).toLowerCase() === activeTopic);
    const topicMistake = mistakes.find((entry) => safeString(entry?.topic).toLowerCase() === activeTopic);
    const mastery = Number(topicProgress?.mastery || 0);
    const attempts = Number(topicMistake?.attempts || 0);
    if (attempts >= 3 || mastery < 35)
        return 'support';
    if (mastery >= 75 && attempts <= 1)
        return 'secure';
    if (activeTopic && !topicProgress && topicMistake)
        return 'support';
    if (activeTopic && topicProgress)
        return 'developing';
    return undefined;
}
function deriveRecommendedMode(stage) {
    if (stage === 'support')
        return 'guided';
    if (stage === 'secure')
        return 'challenge';
    if (stage === 'developing')
        return 'practice';
    return undefined;
}
function extractTeacherCorrections(messages) {
    const corrections = [];
    for (const message of messages) {
        if (message.role !== 'model')
            continue;
        const content = safeString(message.content).replace(/\s+/g, ' ').trim();
        if (!content)
            continue;
        const ruleMatches = [
            ...content.matchAll(/\b(?:remember|key rule|important|definition|means|formula)\b[:\-]?\s*([^.?!\n]{8,180})/gi),
            ...content.matchAll(/\b(?:always|never|do not|don't)\b[^.?!\n]{8,180}/gi),
        ];
        for (const match of ruleMatches) {
            const candidate = limitText(match[1] || match[0] || '', 180);
            if (!candidate)
                continue;
            if (!corrections.includes(candidate))
                corrections.push(candidate);
            if (corrections.length >= 6)
                return corrections;
        }
    }
    return corrections;
}
function extractStudentPreferenceSignals(messages) {
    const preferences = [];
    const pushPreference = (value) => {
        const cleaned = limitText(value, 160);
        if (!cleaned)
            return;
        if (!preferences.includes(cleaned))
            preferences.push(cleaned);
    };
    for (const message of messages) {
        if (message.role !== 'user')
            continue;
        const content = safeString(message.content).replace(/\s+/g, ' ').trim();
        if (!content)
            continue;
        const directMatches = [
            content.match(/\bi prefer\s+([^.?!\n]+)/i)?.[1],
            content.match(/\bplease\s+(?:use|speak in|explain in)\s+([^.?!\n]+)/i)?.[1],
            content.match(/\bremember(?: this)?[:\-]\s*([^.?!\n]+)/i)?.[1],
            content.match(/\bmy weak topic is\s+([^.?!\n]+)/i)?.[1],
        ].filter(Boolean);
        for (const candidate of directMatches) {
            pushPreference(candidate);
            if (preferences.length >= 6)
                return preferences;
        }
    }
    return preferences;
}
function extractEvidenceReferences(messages) {
    const refs = [];
    const pushRef = (value) => {
        const cleaned = limitText(value, 140);
        if (!cleaned)
            return;
        if (!refs.includes(cleaned))
            refs.push(cleaned);
    };
    for (const message of messages) {
        const sources = Array.isArray(message.metadata?.sources) ? message.metadata.sources : [];
        for (const source of sources) {
            const name = safeString(source?.sourceName).trim();
            const url = safeString(source?.url).trim();
            if (name || url)
                pushRef([name, url].filter(Boolean).join(' - '));
            if (refs.length >= 6)
                return refs;
        }
        const content = safeString(message.content);
        for (const match of content.matchAll(/\b(?:surah|sura|ayah|hadith|bukhari|muslim|tirmidhi|ab[uū]\s*dawud|ibn\s*majah|nasai|fiqh)\b[^.?!\n]{0,80}/gi)) {
            pushRef(match[0]);
            if (refs.length >= 6)
                return refs;
        }
    }
    return refs;
}
function buildSemanticSessionSnapshot(messages) {
    const studentPreferences = extractStudentPreferenceSignals(messages);
    const teacherCorrections = extractTeacherCorrections(messages);
    const evidenceReferences = extractEvidenceReferences(messages);
    const semanticParts = [];
    if (studentPreferences.length > 0) {
        semanticParts.push(`Student preferences and constraints: ${studentPreferences.join(' | ')}`);
    }
    if (teacherCorrections.length > 0) {
        semanticParts.push(`Teacher corrections and key rules: ${teacherCorrections.join(' | ')}`);
    }
    if (evidenceReferences.length > 0) {
        semanticParts.push(`Evidence anchors already in this session: ${evidenceReferences.join(' | ')}`);
    }
    return {
        semanticMemory: semanticParts.join('\n').trim() || undefined,
        teacherCorrections: teacherCorrections.length > 0 ? teacherCorrections : undefined,
        studentPreferences: studentPreferences.length > 0 ? studentPreferences : undefined,
        evidenceReferences: evidenceReferences.length > 0 ? evidenceReferences : undefined,
    };
}
function mergeUniqueTextLists(...groups) {
    const merged = [];
    for (const group of groups) {
        if (!Array.isArray(group))
            continue;
        for (const value of group) {
            const cleaned = limitText(String(value || '').replace(/\s+/g, ' ').trim(), 180);
            if (!cleaned)
                continue;
            if (!merged.includes(cleaned))
                merged.push(cleaned);
            if (merged.length >= 8)
                return merged;
        }
    }
    return merged.length > 0 ? merged : undefined;
}
function buildVideoTranscriptFallbackSummary(args) {
    const title = safeString(args.title).trim();
    const topic = safeString(args.topic).trim();
    const whyRecommended = limitText(safeString(args.whyRecommended).trim(), 240);
    const concepts = extractTopicHints(`${title} ${topic} ${whyRecommended}`);
    const summary = [
        title ? `Current study video: ${title}.` : '',
        topic ? `Use it as support for ${topic}.` : '',
        whyRecommended ? whyRecommended : '',
    ].filter(Boolean).join(' ');
    return {
        activeVideoSummary: summary || undefined,
        activeVideoConcepts: concepts.length > 0 ? concepts : undefined,
        activeVideoWhyRecommended: whyRecommended || undefined,
        transcriptAvailable: false,
    };
}
async function getOrBuildVideoTutorSnapshot(args) {
    const videoId = safeString(args.videoData?.id).trim();
    if (!videoId)
        return {};
    if (args.priorTutorState?.activeVideoId === videoId &&
        (args.priorTutorState.activeVideoSummary || args.priorTutorState.activeVideoConcepts?.length)) {
        return {
            activeVideoSummary: args.priorTutorState.activeVideoSummary,
            activeVideoConcepts: args.priorTutorState.activeVideoConcepts,
            activeVideoWhyRecommended: safeString(args.whyRecommended).trim() || args.priorTutorState.activeVideoWhyRecommended,
            evidenceReferences: args.priorTutorState.evidenceReferences,
        };
    }
    const redis = await (0, redis_1.getRedisClient)();
    const cacheKey = `video:tutor-snapshot:${videoId}`;
    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                return {
                    activeVideoSummary: safeString(parsed?.activeVideoSummary).trim() || undefined,
                    activeVideoConcepts: Array.isArray(parsed?.activeVideoConcepts)
                        ? parsed.activeVideoConcepts.map((item) => safeString(item).trim()).filter(Boolean).slice(0, 8)
                        : undefined,
                    activeVideoWhyRecommended: safeString(args.whyRecommended).trim() || safeString(parsed?.activeVideoWhyRecommended).trim() || undefined,
                    evidenceReferences: Array.isArray(parsed?.evidenceReferences)
                        ? parsed.evidenceReferences.map((item) => safeString(item).trim()).filter(Boolean).slice(0, 8)
                        : undefined,
                    transcriptAvailable: typeof parsed?.transcriptAvailable === 'boolean' ? parsed.transcriptAvailable : undefined,
                };
            }
        }
        catch (error) {
            logger_1.logger.warn({ error: String(error), videoId }, '[VideoTutorSnapshot] Cache read failed.');
        }
    }
    const fallback = buildVideoTranscriptFallbackSummary({
        title: args.videoData?.title,
        channel: args.videoData?.channel || args.videoData?.channelTitle,
        topic: args.activeTopic,
        whyRecommended: args.whyRecommended,
    });
    let transcriptExcerpt = '';
    try {
        const transcript = await (0, flow_1.runFlow)(get_youtube_transcript_1.getYoutubeTranscriptFlow, { videoId });
        if (typeof transcript === 'string' && transcript.trim() && !transcript.startsWith('Could not')) {
            transcriptExcerpt = transcript.slice(0, 12000);
        }
    }
    catch (error) {
        logger_1.logger.warn({ error: String(error), videoId }, '[VideoTutorSnapshot] Transcript fetch failed.');
    }
    if (!transcriptExcerpt) {
        if (redis) {
            try {
                await redis.set(cacheKey, JSON.stringify(fallback), { EX: 60 * 60 * 24 * 14 });
            }
            catch {
                // best effort cache
            }
        }
        return fallback;
    }
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.1,
            response_format: { type: 'json_object' },
            max_tokens: 350,
            messages: [
                {
                    role: 'system',
                    content: 'Summarize the educational video transcript into durable tutor memory. Return strict JSON with keys summary, concepts, evidenceReferences. summary should be concise, grounded, and useful for follow-up tutoring. concepts should be a short array of 3 to 6 concepts. evidenceReferences should list any specific named references only if clearly present.',
                },
                {
                    role: 'user',
                    content: [
                        `Active study topic: ${safeString(args.activeTopic) || 'Unknown topic'}`,
                        `Video title: ${safeString(args.videoData?.title) || 'Suggested video'}`,
                        args.videoData?.channel || args.videoData?.channelTitle
                            ? `Channel: ${safeString(args.videoData?.channel || args.videoData?.channelTitle)}`
                            : '',
                        args.whyRecommended ? `Why recommended: ${args.whyRecommended}` : '',
                        '',
                        'Transcript excerpt:',
                        transcriptExcerpt,
                    ].filter(Boolean).join('\n'),
                },
            ],
        });
        const parsed = JSON.parse(String(completion.choices?.[0]?.message?.content || '{}'));
        const snapshot = {
            activeVideoSummary: limitText(safeString(parsed?.summary).trim(), 420) || fallback.activeVideoSummary,
            activeVideoConcepts: mergeUniqueTextLists(Array.isArray(parsed?.concepts) ? parsed.concepts.map((item) => safeString(item).trim()) : undefined, fallback.activeVideoConcepts),
            activeVideoWhyRecommended: safeString(args.whyRecommended).trim() || fallback.activeVideoWhyRecommended,
            evidenceReferences: mergeUniqueTextLists(Array.isArray(parsed?.evidenceReferences)
                ? parsed.evidenceReferences.map((item) => safeString(item).trim())
                : undefined),
            transcriptAvailable: true,
        };
        if (redis) {
            try {
                await redis.set(cacheKey, JSON.stringify(snapshot), { EX: 60 * 60 * 24 * 14 });
            }
            catch {
                // best effort cache
            }
        }
        return snapshot;
    }
    catch (error) {
        logger_1.logger.warn({ error: String(error), videoId }, '[VideoTutorSnapshot] Summary generation failed.');
        return fallback;
    }
}
async function invalidateStudentMemoryCache(studentId) {
    const redis = await (0, redis_1.getRedisClient)();
    if (!redis)
        return;
    try {
        await redis.del(`memory:${studentId}`);
    }
    catch (error) {
        logger_1.logger.warn({ err: error, studentId }, '[TutorMemory] Cache invalidate failed; continuing.');
    }
}
async function applyDeterministicMasteryUpdate(args) {
    const topic = safeString(args.topic || args.nextState.lastStudyTopic || args.priorState.lastStudyTopic).trim();
    if (!topic || topic.length < 3)
        return;
    if (/\b(new topic|another topic|different topic|change topic|switch topic|instead)\b/i.test(args.userMessage))
        return;
    const wasAwaiting = Boolean(args.priorState.awaitingPracticeQuestionAnswer);
    const isAwaiting = Boolean(args.nextState.awaitingPracticeQuestionAnswer);
    const prevAttempts = Number(args.priorState.validationAttemptCount || 0);
    const nextAttempts = Number(args.nextState.validationAttemptCount || 0);
    if (!wasAwaiting)
        return;
    const subject = inferSubjectFromTopic(topic);
    if (!isAwaiting) {
        const existing = await prismaClient_1.default.progress.findFirst({
            where: { studentId: args.studentId, topic: { equals: topic, mode: 'insensitive' } },
        });
        const currentMastery = Number(existing?.mastery || 0);
        const increment = prevAttempts >= 2 ? 7 : prevAttempts === 1 ? 10 : 12;
        const mastery = Math.min(100, currentMastery + increment);
        if (existing) {
            await prismaClient_1.default.progress.update({
                where: { id: existing.id },
                data: { mastery, subject },
            });
        }
        else {
            await prismaClient_1.default.progress.create({
                data: {
                    studentId: args.studentId,
                    subject,
                    topic,
                    mastery: Math.max(5, increment),
                },
            });
        }
        if (mastery >= 80) {
            await prismaClient_1.default.mistake.deleteMany({
                where: { studentId: args.studentId, topic: { equals: topic, mode: 'insensitive' } },
            });
        }
        await invalidateStudentMemoryCache(args.studentId);
        return;
    }
    if (nextAttempts > prevAttempts) {
        const conciseError = limitText(args.aiResponse, 220) || 'Needs another scaffolded explanation.';
        const existingMistake = await prismaClient_1.default.mistake.findFirst({
            where: { studentId: args.studentId, topic: { equals: topic, mode: 'insensitive' } },
        });
        if (existingMistake) {
            await prismaClient_1.default.mistake.update({
                where: { id: existingMistake.id },
                data: {
                    attempts: { increment: 1 },
                    error: conciseError,
                    lastSeen: new Date(),
                },
            });
        }
        else {
            await prismaClient_1.default.mistake.create({
                data: {
                    studentId: args.studentId,
                    topic,
                    error: conciseError,
                    attempts: 1,
                },
            });
        }
        const existingProgress = await prismaClient_1.default.progress.findFirst({
            where: { studentId: args.studentId, topic: { equals: topic, mode: 'insensitive' } },
        });
        if (existingProgress) {
            await prismaClient_1.default.progress.update({
                where: { id: existingProgress.id },
                data: { mastery: Math.max(0, Number(existingProgress.mastery || 0) - 6) },
            });
        }
        await invalidateStudentMemoryCache(args.studentId);
        return;
    }
}
function sanitizeSources(sources) {
    if (!Array.isArray(sources))
        return [];
    const seen = new Set();
    const cleaned = [];
    for (const source of sources) {
        const url = safeString(source?.url).trim();
        const sourceName = safeString(source?.sourceName).trim() || 'Source';
        if (!url || /example\.com/i.test(url))
            continue;
        if (!(0, source_trust_1.isTrustedSource)(url))
            continue;
        if (seen.has(url))
            continue;
        seen.add(url);
        const trustTier = safeString(source?.trustTier).trim();
        cleaned.push({
            sourceName,
            url,
            domain: safeString(source?.domain).trim() || null,
            sourceType: safeString(source?.sourceType).trim() || null,
            trustTier: ['high', 'medium', 'limited'].includes(trustTier) ? trustTier : null,
            relevanceReason: limitText(safeString(source?.relevanceReason).trim(), 180) || null,
            recencyReason: limitText(safeString(source?.recencyReason).trim(), 180) || null,
            educationalFit: limitText(safeString(source?.educationalFit).trim(), 180) || null,
        });
    }
    return cleaned;
}
function buildScopedChatCacheKey(args) {
    const payload = {
        v: CACHE_VERSION,
        studentId: safeString(args.studentId),
        sessionId: safeString(args.sessionId),
        message: normalizeCacheText(args.message),
        preferredLanguage: safeString(args.preferredLanguage).toLowerCase(),
        gradeLevel: safeString(args.gradeLevel).toLowerCase(),
        activeTopic: normalizeCacheText(args.activeTopic || ''),
        forceWebSearch: Boolean(args.forceWebSearch),
        includeVideos: Boolean(args.includeVideos),
        tutorActionId: safeString(args.tutorActionId),
        tutorActionSourceMessageId: safeString(args.tutorActionSourceMessageId),
        tutorActionSelectedText: normalizeCacheText(args.tutorActionSelectedText || ''),
        tutorActionLinkedArtifactId: safeString(args.tutorActionLinkedArtifactId),
    };
    const digest = (0, crypto_1.createHash)('sha256').update(JSON.stringify(payload)).digest('hex');
    return `ai_cache:${digest}`;
}
function parseTutorAction(raw) {
    const record = asRecord(raw);
    if (!record)
        return undefined;
    const rawId = safeString(record.id);
    const id = (rawId === 'explain' ? 'breakdown' : rawId);
    if (!VALID_TUTOR_ACTIONS.has(id))
        return undefined;
    return {
        id,
        sourceMessageId: safeString(record.sourceMessageId).trim() || undefined,
        sourceText: safeString(record.sourceText).trim() || undefined,
        selectedText: safeString(record.selectedText).trim() || undefined,
        sourceVideoId: safeString(record.sourceVideoId).trim() || undefined,
        sourceVideoTitle: safeString(record.sourceVideoTitle).trim() || undefined,
        sourceArtifactLabel: safeString(record.sourceArtifactLabel).trim() || undefined,
        sourceArtifactSummary: safeString(record.sourceArtifactSummary).trim() || undefined,
        invokedFrom: ['assistant_card', 'selection_menu', 'composer'].includes(safeString(record.invokedFrom))
            ? safeString(record.invokedFrom)
            : undefined,
        selectionSourceKind: ['assistant_message', 'user_message', 'artifact', 'video_summary', 'study_material'].includes(safeString(record.selectionSourceKind))
            ? safeString(record.selectionSourceKind)
            : undefined,
        inputOrigin: ['text', 'pasted_question', 'worksheet_followup', 'camera_capture', 'file_upload'].includes(safeString(record.inputOrigin))
            ? safeString(record.inputOrigin)
            : undefined,
        composerIntent: safeString(record.composerIntent).trim() || undefined,
        linkedArtifactId: safeString(record.linkedArtifactId).trim() || undefined,
    };
}
function getTutorStateFromMetadata(metadata) {
    const record = asRecord(metadata);
    const nested = asRecord(record?.tutorState);
    return (nested || {});
}
function getTutorArtifactsFromMetadata(metadata) {
    const record = asRecord(metadata);
    const raw = Array.isArray(record?.tutorArtifacts) ? record?.tutorArtifacts : [];
    return raw;
}
function getTutorRevisionNotesFromMetadata(metadata) {
    const record = asRecord(metadata);
    const raw = Array.isArray(record?.tutorRevisionNotes) ? record?.tutorRevisionNotes : [];
    return raw;
}
function buildTutorActionUiMeta(args) {
    if (!args.tutorAction?.id)
        return undefined;
    const topic = safeString(args.activeTopic).trim() || 'this topic';
    switch (args.tutorAction.id) {
        case 'ask':
            return {
                actionId: 'ask',
                statusLine: 'Focused follow-up',
                nextStep: `Keep going on ${topic}, or try one short practice question next.`,
            };
        case 'hint':
            return {
                actionId: 'hint',
                statusLine: 'Socratic hint',
                nextStep: `Use the hint, try the next step on ${topic}, then send what you get.`,
            };
        case 'breakdown':
            return {
                actionId: 'breakdown',
                statusLine: 'Step breakdown',
                nextStep: 'Start with the first step, then use Hint if you get stuck.',
            };
        case 'summarize':
            return {
                actionId: 'summarize',
                statusLine: 'Revision summary',
                nextStep: 'Use this short recap, then choose Save or Practice next.',
            };
        case 'practice':
            return {
                actionId: 'practice',
                statusLine: 'Practice question',
                nextStep: 'Try the question yourself first, then send your answer for feedback.',
            };
        case 'save':
            return {
                actionId: 'save',
                statusLine: 'Saved to revision',
                nextStep: 'You can revise this later, or ask for one practice question now.',
                savedRevisionNote: args.savedRevisionNote,
            };
        default:
            return undefined;
    }
}
function createSystemNotice(code, message, severity = 'info') {
    return { code, message, severity };
}
function sanitizeSystemNotices(notices) {
    const cleaned = [];
    const seen = new Set();
    for (const notice of notices) {
        if (!notice)
            continue;
        const code = safeString(notice.code).trim();
        const message = safeString(notice.message).trim();
        const severity = safeString(notice.severity) || 'info';
        if (!code || !message)
            continue;
        const key = `${code}:${message}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        cleaned.push({ code, message: limitText(message, 220), severity });
    }
    return cleaned;
}
function getSystemNoticesFromMetadata(metadata) {
    const record = asRecord(metadata);
    const raw = Array.isArray(record?.systemNotices) ? record.systemNotices : [];
    return sanitizeSystemNotices(raw);
}
function getMessageEditMetaFromMetadata(metadata) {
    const record = asRecord(metadata);
    const nested = asRecord(record?.edit);
    return nested ? nested : undefined;
}
function buildArtifactSystemNotices(args) {
    const notices = [];
    const truncatedAttachment = args.attachments.find((attachment) => Boolean(attachment?.truncated));
    if (truncatedAttachment) {
        notices.push(createSystemNotice('partial_file_parse', 'Some uploaded material was trimmed for speed. Ask about a specific section if anything important seems missing.', 'warning'));
    }
    const weakArtifact = args.artifacts.find((artifact) => artifact.ocrConfidence === 'low');
    if (weakArtifact) {
        notices.push(createSystemNotice('weak_extraction_confidence', `The text extraction for ${weakArtifact.label || 'this material'} was uncertain, so the tutor may need a more focused follow-up question.`, 'warning'));
    }
    const partialArtifact = args.attachments.find((attachment, index) => {
        const artifact = args.artifacts[index];
        const kind = safeString(attachment?.kind || artifact?.kind).toLowerCase();
        if (!['pdf', 'image', 'text'].includes(kind))
            return false;
        const hasExtractedText = Boolean(safeString(artifact?.extractedText).trim());
        const hasSummary = Boolean(safeString(artifact?.summary).trim());
        return !hasExtractedText && !hasSummary;
    });
    if (partialArtifact) {
        notices.push(createSystemNotice('partial_file_parse', 'Part of the uploaded material could only be read partially. The tutor will still help, but a clearer scan or a specific question may work better.', 'warning'));
    }
    return sanitizeSystemNotices(notices);
}
function looksLikeContextDependentFollowUp(text) {
    const raw = safeString(text).toLowerCase().trim();
    if (!raw)
        return false;
    if (raw.split(/\s+/).length > 18)
        return false;
    return /\b(this|that|it|same|the video|the image|the file|the worksheet|the notes|the text above)\b/.test(raw);
}
function deriveMessagePresentation(args) {
    const baseArtifactLabel = safeString(args.tutorAction?.sourceArtifactLabel ||
        args.artifacts[0]?.label ||
        args.tutorState.activeArtifactLabels?.[0] ||
        '').trim() || undefined;
    const baseVideoTitle = safeString(args.tutorAction?.sourceVideoTitle ||
        args.videoData?.title ||
        args.tutorState.activeVideoTitle ||
        '').trim() || undefined;
    const awaitingStudentAttempt = Boolean(args.tutorState.awaitingStudentAttempt) || args.tutorAction?.id === 'practice';
    const limitedSupport = args.systemNotices.some((notice) => ['limited_source_support', 'transcript_unavailable', 'partial_file_parse', 'weak_extraction_confidence'].includes(notice.code));
    let cardKind = 'guided_step';
    let uiTone = 'calm';
    let suggestedActions = ['hint', 'breakdown', 'summarize', 'practice', 'save'];
    switch (args.tutorAction?.id) {
        case 'hint':
            cardKind = 'hint';
            uiTone = 'encouraging';
            suggestedActions = ['breakdown', 'practice', 'save'];
            break;
        case 'breakdown':
            cardKind = 'breakdown';
            uiTone = 'calm';
            suggestedActions = ['hint', 'practice', 'summarize', 'save'];
            break;
        case 'summarize':
            cardKind = 'summary';
            uiTone = 'reflective';
            suggestedActions = ['practice', 'save', 'breakdown'];
            break;
        case 'ask':
            cardKind = 'explanation';
            uiTone = 'calm';
            suggestedActions = ['hint', 'breakdown', 'practice', 'save'];
            break;
        case 'practice':
            cardKind = 'practice';
            uiTone = 'encouraging';
            suggestedActions = ['hint', 'breakdown', 'save'];
            break;
        case 'save':
            cardKind = 'summary';
            uiTone = 'reflective';
            suggestedActions = ['practice', 'summarize'];
            break;
        default:
            if (args.sources.length > 0) {
                cardKind = 'source_supported';
            }
    }
    if (awaitingStudentAttempt) {
        suggestedActions = suggestedActions.filter((action) => action !== 'summarize');
    }
    return {
        cardKind,
        nextStepPrompt: args.tutorUi?.nextStep,
        suggestedActions,
        awaitingStudentAttempt,
        basedOnArtifactLabel: baseArtifactLabel,
        basedOnVideoTitle: baseVideoTitle,
        sourceConfidence: limitedSupport ? 'limited' : args.sources.length > 1 ? 'high' : args.sources.length === 1 ? 'medium' : undefined,
        uiTone,
    };
}
function buildSessionSummaryMeta(args) {
    const latestAssistant = [...args.messages].reverse().find((message) => message.role === 'model' && safeString(message.content).trim());
    const latestUser = [...args.messages].reverse().find((message) => message.role === 'user' && safeString(message.content).trim());
    const hadArtifacts = args.tutorArtifacts.length > 0 ||
        args.messages.some((message) => Array.isArray(asRecord(message.metadata)?.attachments) && (asRecord(message.metadata)?.attachments).length > 0);
    const hadVideo = Boolean(args.tutorState.activeVideoId) ||
        args.messages.some((message) => Boolean(deriveVideoDataFromMessage({ metadata: message.metadata })));
    const summary = limitText(safeString(latestAssistant?.content || latestUser?.content || args.topic || '').trim(), 220) || null;
    const lastTutorFocus = safeString(args.tutorState.visibleFocusLabel ||
        args.tutorState.activeTopic ||
        args.tutorState.masteryFocus?.[0] ||
        args.tutorState.misconceptionFocus?.[0] ||
        '').trim() || null;
    const learningMode = safeString(args.tutorState.currentStudyMode || args.tutorState.recommendedMode || '').trim() || null;
    const continuationStatus = args.tutorState.awaitingStudentAttempt
        ? 'awaiting_attempt'
        : args.tutorRevisionNotes.length > 0
            ? 'saved_revision_available'
            : 'ready_to_continue';
    return {
        summary,
        lastTutorFocus,
        learningMode,
        hadArtifacts,
        hadVideo,
        continuationStatus,
        recentArtifactLabel: args.tutorState.activeArtifactLabels?.[0] || args.tutorArtifacts[0]?.label || null,
        revisionCount: args.tutorRevisionNotes.length,
    };
}
function buildChatSystemNotices(args) {
    const notices = [...args.attachmentNotices];
    if (args.hasVideo && args.videoSnapshot?.transcriptAvailable === false) {
        notices.push(createSystemNotice('transcript_unavailable', 'The video transcript was unavailable, so the tutor relied on the title, topic, and recommendation context.', 'info'));
    }
    if (args.forceWebSearch && args.safeSources.length === 0) {
        notices.push(createSystemNotice('limited_source_support', 'No strong external sources were available for this turn, so the tutor fell back to general guidance.', 'warning'));
    }
    else if (args.forceWebSearch && args.safeSources.length === 1) {
        notices.push(createSystemNotice('limited_source_support', 'This answer is supported by a limited number of sources. You can ask for another source or a cross-check.', 'info'));
    }
    if (!args.hasVideo && looksLikeContextDependentFollowUp(args.userText) && (args.tutorState.activeArtifactSummary || args.tutorState.activeVideoTitle)) {
        notices.push(createSystemNotice('recovered_from_context_gap', 'The tutor recovered the answer from the current study context instead of treating the follow-up as a new topic.', 'info'));
    }
    return sanitizeSystemNotices(notices);
}
function mapSessionMessagePayload(message) {
    return {
        ...message,
        timestamp: message?.timestamp instanceof Date ? message.timestamp.toISOString() : safeString(message?.timestamp),
        videoData: deriveVideoDataFromMessage(message),
        sources: extractSources(message?.metadata),
        image: deriveImageFromMessage(message),
    };
}
function buildSessionResponsePayload(session) {
    const tutorState = getTutorStateFromMetadata(session.metadata);
    const tutorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
    const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(session.metadata);
    const summaryMeta = buildSessionSummaryMeta({
        topic: session.topic,
        messages: session.messages || [],
        tutorState,
        tutorArtifacts,
        tutorRevisionNotes,
    });
    return {
        ...session,
        title: resolveSessionTitle(session.topic, session.messages || []),
        messages: (session.messages || []).map(mapSessionMessagePayload),
        createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : safeString(session.createdAt),
        updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : safeString(session.updatedAt),
        conversationState: (session.metadata || DEFAULT_CONVERSATION_STATE),
        tutorState,
        summary: summaryMeta.summary,
        lastTutorFocus: summaryMeta.lastTutorFocus,
        learningMode: summaryMeta.learningMode,
        hadArtifacts: summaryMeta.hadArtifacts,
        hadVideo: summaryMeta.hadVideo,
        continuationStatus: summaryMeta.continuationStatus,
        recentArtifactLabel: summaryMeta.recentArtifactLabel,
        revisionCount: summaryMeta.revisionCount,
    };
}
function mergeSessionMetadata(args) {
    const existing = asRecord(args.existing) || {};
    const mergedNotices = sanitizeSystemNotices([
        ...getSystemNoticesFromMetadata(existing),
        ...(Array.isArray(args.systemNotices) ? args.systemNotices : []),
    ]);
    return {
        ...existing,
        ...args.conversationState,
        tutorState: {
            ...getTutorStateFromMetadata(existing),
            ...(args.tutorState || {}),
            ...(mergedNotices.length > 0 ? { systemNotices: mergedNotices } : {}),
        },
        tutorArtifacts: Array.isArray(args.tutorArtifacts)
            ? args.tutorArtifacts
            : getTutorArtifactsFromMetadata(existing),
        tutorRevisionNotes: Array.isArray(args.tutorRevisionNotes)
            ? args.tutorRevisionNotes
            : getTutorRevisionNotesFromMetadata(existing),
        ...(mergedNotices.length > 0 ? { systemNotices: mergedNotices } : {}),
    };
}
async function getStudentMemoryPayload(studentId) {
    const redis = await (0, redis_1.getRedisClient)();
    if (redis) {
        try {
            const cached = await redis.get(`memory:${studentId}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                return {
                    progress: Array.isArray(parsed?.progress) ? parsed.progress : [],
                    mistakes: Array.isArray(parsed?.mistakes) ? parsed.mistakes : [],
                };
            }
        }
        catch (error) {
            logger_1.logger.warn({ err: error, studentId }, '[TutorMemory] Cache read failed; falling back to database.');
        }
    }
    const [progress, mistakes] = await Promise.all([
        prismaClient_1.default.progress.findMany({ where: { studentId } }),
        prismaClient_1.default.mistake.findMany({ where: { studentId } }),
    ]);
    if (redis) {
        try {
            await redis.set(`memory:${studentId}`, JSON.stringify({ progress, mistakes }), { EX: 3600 });
        }
        catch (error) {
            logger_1.logger.warn({ err: error, studentId }, '[TutorMemory] Cache write failed; continuing without cache.');
        }
    }
    return { progress, mistakes };
}
function buildLearnerTutorState(args) {
    const strongestProgress = Array.isArray(args.memory?.progress)
        ? args.memory.progress
            .slice()
            .sort((a, b) => Number(b?.mastery || 0) - Number(a?.mastery || 0))
            .slice(0, 3)
            .map((entry) => safeString(entry?.topic || entry?.subject).trim())
            .filter(Boolean)
        : [];
    const misconceptionFocus = Array.isArray(args.memory?.mistakes)
        ? args.memory.mistakes
            .slice()
            .sort((a, b) => new Date(b?.lastSeen || 0).getTime() - new Date(a?.lastSeen || 0).getTime())
            .slice(0, 4)
            .map((entry) => safeString(entry?.topic || entry?.error).trim())
            .filter(Boolean)
        : [];
    const artifactLabels = (args.artifacts || []).map((artifact) => artifact.label).filter(Boolean);
    const artifactSummary = (args.artifacts || []).map((artifact) => artifact.summary).filter(Boolean).join(' ');
    const activeTopic = safeString(args.topic || args.state.lastStudyTopic || args.priorTutorState.activeTopic).trim() || undefined;
    const learnerStage = deriveLearnerStage({ memory: args.memory, activeTopic });
    const recommendedMode = deriveRecommendedMode(learnerStage);
    const recentGoals = (args.artifacts || [])
        .flatMap((artifact) => Array.isArray(artifact.actionableTasks) ? artifact.actionableTasks : [])
        .filter(Boolean)
        .slice(0, 4);
    const islamicContext = /\b(quran|surah|ayah|hadith|fiqh|seerah|sirah|tajweed|dua|salah|wudu|wudhu|akhlaq|aqeedah|islam)\b/i
        .test(`${activeTopic || ''} ${artifactSummary}`)
        ? 'Islamic studies context is active. Keep wording respectful, educational, and age-appropriate.'
        : args.priorTutorState.islamicContext;
    let evidenceReferences = mergeUniqueTextLists(args.semanticSnapshot?.evidenceReferences, args.videoSnapshot?.evidenceReferences, args.priorTutorState.evidenceReferences);
    if (!evidenceReferences && islamicContext) {
        evidenceReferences = [
            "Qur'an text or paraphrase clearly marked as paraphrase",
            'Hadith authenticity only when known',
            'Trusted scholarly explanation with brief note on valid differences',
        ];
    }
    const mergedSystemNotices = sanitizeSystemNotices([
        ...(args.priorTutorState.systemNotices || []),
        ...(args.systemNotices || []),
    ]);
    const visibleFocusLabel = safeString(artifactLabels[0] ||
        activeTopic ||
        misconceptionFocus[0] ||
        strongestProgress[0] ||
        '').trim() || undefined;
    const visibleStageLabel = learnerStage === 'support'
        ? 'Needs guided help'
        : learnerStage === 'developing'
            ? 'Building confidence'
            : learnerStage === 'secure'
                ? 'Ready for challenge'
                : undefined;
    const currentStudyMode = args.state.researchModeActive
        ? 'research'
        : args.state.awaitingPracticeQuestionAnswer
            ? 'practice'
            : recommendedMode || 'guided';
    return {
        ...args.priorTutorState,
        activeTopic,
        activeArtifactLabels: artifactLabels.length > 0
            ? artifactLabels
            : args.priorTutorState.activeArtifactLabels,
        activeArtifactSummary: artifactSummary || args.state.lastAttachmentContextSummary || args.priorTutorState.activeArtifactSummary,
        activeVideoId: safeString(args.videoData?.id || args.state.lastSuggestedVideo?.id || args.priorTutorState.activeVideoId).trim() || undefined,
        activeVideoTitle: safeString(args.videoData?.title || args.state.lastSuggestedVideo?.title || args.priorTutorState.activeVideoTitle).trim() || undefined,
        lastIntent: safeString(args.lastIntent || args.priorTutorState.lastIntent).trim() || undefined,
        misconceptionFocus: misconceptionFocus.length > 0 ? misconceptionFocus : args.priorTutorState.misconceptionFocus,
        masteryFocus: strongestProgress.length > 0 ? strongestProgress : args.priorTutorState.masteryFocus,
        learnerStage: learnerStage || args.priorTutorState.learnerStage,
        recommendedMode: recommendedMode || args.priorTutorState.recommendedMode,
        recentGoals: recentGoals.length > 0 ? recentGoals : args.priorTutorState.recentGoals,
        islamicContext,
        activeVideoSummary: args.videoSnapshot?.activeVideoSummary || args.priorTutorState.activeVideoSummary,
        activeVideoConcepts: args.videoSnapshot?.activeVideoConcepts || args.priorTutorState.activeVideoConcepts,
        activeVideoWhyRecommended: args.videoSnapshot?.activeVideoWhyRecommended || args.priorTutorState.activeVideoWhyRecommended,
        semanticMemory: args.semanticSnapshot?.semanticMemory || args.priorTutorState.semanticMemory,
        teacherCorrections: args.semanticSnapshot?.teacherCorrections || args.priorTutorState.teacherCorrections,
        studentPreferences: args.semanticSnapshot?.studentPreferences || args.priorTutorState.studentPreferences,
        evidenceReferences,
        visibleFocusLabel,
        visibleStageLabel,
        awaitingStudentAttempt: Boolean(args.state.awaitingPracticeQuestionAnswer),
        currentStudyMode,
        systemNotices: mergedSystemNotices.length > 0 ? mergedSystemNotices : undefined,
        sessionLanguageState: args.sessionLanguageState || args.priorTutorState.sessionLanguageState,
        metacognitiveState: (0, metacognitionService_1.mergeMetacognitiveSnapshot)(args.priorTutorState.metacognitiveState, args.metacognitiveState),
        preferredSupportPatterns: Array.isArray(args.preferredSupportPatterns) && args.preferredSupportPatterns.length > 0
            ? args.preferredSupportPatterns
            : args.priorTutorState.preferredSupportPatterns,
        updatedAt: new Date().toISOString(),
    };
}
async function buildTutorArtifactsFromUploads(args) {
    const artifacts = [];
    for (let index = 0; index < args.attachments.length; index += 1) {
        const attachment = args.attachments[index];
        const kind = safeString(attachment?.kind || 'image').toLowerCase();
        const fileName = safeString(attachment?.fileName).trim() || `Attachment ${index + 1}`;
        let extractedText = '';
        let summary = '';
        if (kind === 'text') {
            extractedText = safeString(attachment?.text).trim();
            summary = (0, emotional_ai_copilot_attachments_js_1.buildAttachmentPromptSummary)({
                kind: 'text',
                fileName,
                extractedText,
                truncated: Boolean(attachment?.truncated),
            });
        }
        else if (kind === 'pdf') {
            const parsed = await (0, emotional_ai_copilot_attachments_js_1.extractTextFromPdfWithOcrFallback)(safeString(attachment?.base64));
            extractedText = parsed.text;
            summary = (0, emotional_ai_copilot_attachments_js_1.buildAttachmentPromptSummary)({
                kind: 'pdf',
                fileName,
                extractedText,
                truncated: parsed.truncated,
                note: parsed.text
                    ? parsed.usedOcr
                        ? 'OCR fallback was used because this PDF appears scanned or image-heavy.'
                        : undefined
                    : 'Text extraction was limited for this PDF.',
            });
        }
        else {
            const mimeType = safeString(attachment?.mimeType || attachment?.type || 'image/jpeg');
            let ocrConfidence;
            let denseText = false;
            if ((0, emotional_ai_copilot_attachments_js_1.isLikelyDenseTextRequest)(args.userText || '', fileName, mimeType, false)) {
                const ocr = await (0, emotional_ai_copilot_attachments_js_1.runImageOcrAssist)(safeString(attachment?.base64), mimeType);
                extractedText = safeString(ocr?.extractedText).trim();
                ocrConfidence = ocr?.confidence;
                denseText = Boolean(ocr?.dense);
                summary = (0, emotional_ai_copilot_attachments_js_1.buildAttachmentPromptSummary)({
                    kind: 'image',
                    fileName,
                    extractedText,
                    confidence: ocr?.confidence,
                    dense: ocr?.dense,
                    note: extractedText
                        ? 'OCR preview extracted from the uploaded image.'
                        : 'Use the visible layout, labels, and figures as context.',
                });
            }
            if (!summary) {
                summary = (0, emotional_ai_copilot_attachments_js_1.buildAttachmentPromptSummary)({
                    kind: 'image',
                    fileName,
                    note: 'Use the visible layout, labels, and figures as context.',
                });
            }
            const headings = extractHeadingLikeLines(extractedText || summary);
            const topics = extractTopicHints(extractedText || summary);
            const questions = extractQuestionLikeLines(extractedText);
            const actionableTasks = extractActionableTasks(extractedText || summary);
            const artifactType = inferArtifactType({ kind, fileName, extractedText, summary });
            const subject = inferSubjectFromTopic(`${topics.join(' ')} ${summary} ${fileName}`);
            artifacts.push({
                id: `artifact-${Date.now()}-${index}`,
                kind,
                label: fileName,
                summary: limitText(summary),
                extractedText: extractedText ? limitText(extractedText) : undefined,
                questions,
                topics,
                headings,
                keywords: topics,
                actionableTasks,
                subject,
                artifactType,
                denseText,
                ocrConfidence,
                createdAt: new Date().toISOString(),
            });
            continue;
        }
        const headings = extractHeadingLikeLines(extractedText || summary);
        const topics = extractTopicHints(extractedText || summary);
        const questions = extractQuestionLikeLines(extractedText);
        const actionableTasks = extractActionableTasks(extractedText || summary);
        const artifactType = inferArtifactType({ kind, fileName, extractedText, summary });
        const subject = inferSubjectFromTopic(`${topics.join(' ')} ${summary} ${fileName}`);
        artifacts.push({
            id: `artifact-${Date.now()}-${index}`,
            kind,
            label: fileName,
            summary: limitText(summary),
            extractedText: extractedText ? limitText(extractedText) : undefined,
            questions,
            topics,
            headings,
            keywords: topics,
            actionableTasks,
            subject,
            artifactType,
            denseText: false,
            ocrConfidence: undefined,
            createdAt: new Date().toISOString(),
        });
    }
    return artifacts;
}
const isDefaultConversationStatePayload = (value) => {
    const state = asRecord(value);
    if (!state)
        return false;
    const activePracticeQuestion = safeString(state.activePracticeQuestion);
    const lastAssistantMessage = safeString(state.lastAssistantMessage);
    const validationAttemptCount = Number(state.validationAttemptCount || 0);
    const hasSearchTopic = Array.isArray(state.lastSearchTopic) && state.lastSearchTopic.length > 0;
    const hasUsedExamples = Array.isArray(state.usedExamples) && state.usedExamples.length > 0;
    return (Boolean(state.researchModeActive) === false &&
        hasSearchTopic === false &&
        Boolean(state.awaitingPracticeQuestionInvitationResponse) === false &&
        activePracticeQuestion.length === 0 &&
        Boolean(state.awaitingPracticeQuestionAnswer) === false &&
        validationAttemptCount === 0 &&
        lastAssistantMessage.length === 0 &&
        Boolean(state.sensitiveContentDetected) === false &&
        Boolean(state.videoSuggested) === false &&
        hasUsedExamples === false);
};
const buildEffectiveConversationState = (persistedState, incomingState) => {
    const merged = { ...DEFAULT_CONVERSATION_STATE };
    const persisted = asRecord(persistedState);
    if (persisted)
        Object.assign(merged, persisted);
    const incoming = asRecord(incomingState);
    if (incoming && !isDefaultConversationStatePayload(incoming)) {
        Object.assign(merged, incoming);
    }
    return merged;
};
const normalizeVoiceLanguageMode = (value) => {
    const raw = safeString(value).toLowerCase();
    if (raw.includes('arabic_english') || raw.includes('ar_en'))
        return 'arabic_english';
    if (raw.includes('arabic + english') || raw.includes('arabic+english'))
        return 'arabic_english';
    if (raw.includes('arab'))
        return 'arabic';
    if (raw.includes('swahili'))
        return 'swahili';
    if (raw.includes('english + swahili') || raw.includes('english+swahili'))
        return 'english_sw';
    if (raw.includes('english_sw') || raw.includes('mix'))
        return 'english_sw';
    return 'english';
};
const normalizeSupportedLearningLanguage = (value) => {
    const raw = safeString(value).toLowerCase();
    if (raw.includes('arab'))
        return 'arabic';
    if (raw.includes('swahili') || raw === 'sw')
        return 'swahili';
    return 'english';
};
const normalizeLearningSupportMode = (value) => {
    const raw = safeString(value).toLowerCase();
    if (raw === 'bilingual_support')
        return 'bilingual_support';
    if (raw === 'translation_support')
        return 'translation_support';
    if (raw === 'learner_choice')
        return 'learner_choice';
    return 'strict_single_language';
};
const normalizeSimplicityLevel = (value) => {
    const raw = safeString(value).toLowerCase();
    if (raw === 'very_simple')
        return 'very_simple';
    if (raw === 'standard')
        return 'standard';
    return 'simple';
};
const toSupportedLanguageFromVoiceMode = (mode) => {
    if (mode === 'arabic' || mode === 'arabic_english')
        return 'arabic';
    if (mode === 'swahili')
        return 'swahili';
    return 'english';
};
const toBilingualSupportLanguage = (mode) => {
    if (mode === 'arabic_english')
        return 'english';
    if (mode === 'english_sw')
        return 'swahili';
    return null;
};
const buildDefaultSessionLanguageState = (preferredLanguage) => {
    const preferredLanguageMode = normalizeVoiceLanguageMode(preferredLanguage);
    return {
        preferredResponseLanguage: toSupportedLanguageFromVoiceMode(preferredLanguageMode),
        learningSupportMode: preferredLanguageMode === 'english_sw' || preferredLanguageMode === 'arabic_english'
            ? 'bilingual_support'
            : 'strict_single_language',
        simplicityLevel: 'simple',
        voiceOutputLanguage: toSupportedLanguageFromVoiceMode(preferredLanguageMode),
        bilingualSupportLanguage: toBilingualSupportLanguage(preferredLanguageMode),
        lastDetectedInputLanguage: null,
        preferredLanguageMode,
    };
};
const normalizeSessionLanguageState = (raw, preferredLanguage, fallbackDetectedLanguage) => {
    const base = buildDefaultSessionLanguageState(preferredLanguage);
    const record = asRecord(raw);
    const preferredLanguageMode = normalizeVoiceLanguageMode(record?.preferredLanguageMode || preferredLanguage);
    return {
        preferredResponseLanguage: normalizeSupportedLearningLanguage(record?.preferredResponseLanguage || base.preferredResponseLanguage),
        learningSupportMode: normalizeLearningSupportMode(record?.learningSupportMode || base.learningSupportMode),
        simplicityLevel: normalizeSimplicityLevel(record?.simplicityLevel || base.simplicityLevel),
        voiceOutputLanguage: normalizeSupportedLearningLanguage(record?.voiceOutputLanguage || base.voiceOutputLanguage),
        bilingualSupportLanguage: record && Object.prototype.hasOwnProperty.call(record, 'bilingualSupportLanguage')
            ? (safeString(record.bilingualSupportLanguage).trim()
                ? normalizeSupportedLearningLanguage(record.bilingualSupportLanguage)
                : null)
            : base.bilingualSupportLanguage,
        lastDetectedInputLanguage: (safeString(record?.lastDetectedInputLanguage).trim() || fallbackDetectedLanguage || null),
        preferredLanguageMode,
    };
};
const detectInputLanguage = (text) => {
    const raw = safeString(text).trim();
    if (!raw)
        return 'unknown';
    const lower = raw.toLowerCase();
    const hasArabic = /[\u0600-\u06FF]/.test(raw);
    const swahiliScore = [
        /\b(na|kwa|katika|ni|ya|za|hii|hapo|kwenye|tafadhali|swali|hesabu|somo|mwalimu|nisaidie|eleza)\b/g,
    ].reduce((total, pattern) => total + ((lower.match(pattern) || []).length), 0);
    const englishScore = [
        /\b(the|and|what|why|how|please|question|solve|explain|student|lesson|because)\b/g,
    ].reduce((total, pattern) => total + ((lower.match(pattern) || []).length), 0);
    if (hasArabic && (swahiliScore > 0 || englishScore > 0))
        return 'mixed';
    if (hasArabic)
        return 'arabic';
    if (swahiliScore > 0 && englishScore > 0)
        return 'mixed';
    if (swahiliScore > englishScore)
        return 'swahili';
    if (englishScore > 0)
        return 'english';
    return 'unknown';
};
const buildMessageLanguageMetadata = (args) => ({
    detectedInputLanguage: args.detectedInputLanguage || detectInputLanguage(args.text),
    preferredResponseLanguageAtTurn: args.sessionLanguageState.preferredResponseLanguage,
    learningSupportModeAtTurn: args.sessionLanguageState.learningSupportMode || null,
    generatedLanguage: args.sessionLanguageState.preferredResponseLanguage,
    sourceInputLanguage: args.detectedInputLanguage || detectInputLanguage(args.text),
    voiceOutputLanguageAtTurn: args.sessionLanguageState.voiceOutputLanguage || null,
    simplicityLevelAtTurn: args.sessionLanguageState.simplicityLevel || null,
    preferredLanguageModeAtTurn: args.sessionLanguageState.preferredLanguageMode || null,
});
const parseMaybeJsonRecord = (value) => {
    if (typeof value === 'string') {
        try {
            return asRecord(JSON.parse(value));
        }
        catch {
            return null;
        }
    }
    return asRecord(value);
};
const buildReflectionPresentationPatch = (prompt) => {
    if (!prompt?.text)
        return {};
    return {
        reflectionPrompt: prompt.text,
        reflectionPromptType: prompt.type,
        confidenceCheckSuggested: prompt.type === 'check_confidence',
        errorCheckSuggested: prompt.type === 'locate_error',
        transferCheckSuggested: prompt.type === 'transfer_learning' || prompt.type === 'explain_success',
        strategyCheckSuggested: prompt.type === 'inspect_step' || prompt.type === 'choose_support',
    };
};
const toWhisperLanguage = (mode) => {
    if (mode === 'arabic' || mode === 'arabic_english')
        return 'ar';
    if (mode === 'swahili')
        return 'sw';
    return 'en';
};
const buildSttPrompt = (mode) => {
    if (mode === 'arabic' || mode === 'arabic_english') {
        return '\u0641\u0631\u0651\u063a \u0627\u0644\u0643\u0644\u0627\u0645 \u0628\u062f\u0642\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0643\u0645\u0627 \u0642\u064a\u0644\u060c \u0648\u0644\u0627 \u062a\u0642\u0645 \u0628\u0627\u0644\u062a\u0631\u062c\u0645\u0629.';
    }
    if (mode === 'swahili') {
        return 'Transcribe clearly in Kiswahili exactly as spoken. Usitafsiri.';
    }
    return 'Transcribe clearly in English exactly as spoken. Do not translate.';
};
const sanitizeTtsInput = (raw, mode) => {
    let out = safeString(raw)
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/[`*_#>~]/g, '')
        .replace(/\s*\n+\s*/g, ' ')
        .replace(/([.!?]){2,}/g, '$1')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .trim();
    if (mode === 'arabic' || mode === 'arabic_english') {
        out = out.replace(/\?/g, '\u061f').replace(/;/g, '\u061b').replace(/,/g, '\u060c');
    }
    return out;
};
const buildTtsInstruction = (mode) => {
    if (mode === 'arabic') {
        return '\u062a\u062d\u062f\u062b \u0643\u0645\u0639\u0644\u0645 \u0647\u0627\u062f\u0626 \u0644\u0637\u0627\u0644\u0628 \u0648\u0627\u062d\u062f \u0628\u0644\u063a\u0629 \u0637\u0628\u064a\u0639\u064a\u0629 \u0633\u0644\u0633\u0629 \u0628\u062f\u0648\u0646 \u0648\u0642\u0641\u0627\u062a \u0637\u0648\u064a\u0644\u0629.';
    }
    if (mode === 'swahili') {
        return 'Ongea kama mwalimu mwenye upole kwa mtiririko laini bila mapumziko marefu.';
    }
    if (mode === 'english_sw') {
        return 'Speak in natural English and Swahili mix as a warm teacher with smooth pacing.';
    }
    if (mode === 'arabic_english') {
        return 'Speak naturally as a bilingual Arabic-English teacher with smooth transitions.';
    }
    return 'Speak like a warm teacher talking to one student with smooth pacing and short pauses.';
};
async function ensureCopilotPreferencesMetadataColumn() {
    if (!ensureCopilotPreferencesMetadataPromise) {
        ensureCopilotPreferencesMetadataPromise = prismaClient_1.default.$executeRawUnsafe(`ALTER TABLE "CopilotPreferences" ADD COLUMN IF NOT EXISTS "metadata" JSONB NULL;`).then(() => undefined).catch((error) => {
            ensureCopilotPreferencesMetadataPromise = null;
            throw error;
        });
    }
    return ensureCopilotPreferencesMetadataPromise;
}
async function getCopilotPreferencesMetadata(userId) {
    await ensureCopilotPreferencesMetadataColumn();
    const [row] = await prismaClient_1.default.$queryRawUnsafe(`SELECT "metadata" FROM "CopilotPreferences" WHERE "userId" = $1 LIMIT 1`, userId);
    return asRecord(row?.metadata) || {};
}
async function updateCopilotPreferencesMetadata(userId, metadata) {
    await ensureCopilotPreferencesMetadataColumn();
    await prismaClient_1.default.$executeRawUnsafe(`UPDATE "CopilotPreferences" SET "metadata" = CAST($2 AS JSONB) WHERE "userId" = $1`, userId, JSON.stringify(metadata));
}
const extractVideoData = (metadata) => {
    if (!metadata || typeof metadata !== 'object')
        return null;
    return metadata.videoData || metadata.video || null;
};
const VIDEO_RECOMMENDATION_INTENTS = new Set([
    'concept_explainer',
    'worked_example',
    'revision_recap',
    'visual_animation',
    'exam_help',
    'beginner_friendly',
    'misconception_fix',
    'language_support',
]);
function normalizeVideoRecommendationIntent(value) {
    const normalized = safeString(value).trim();
    return VIDEO_RECOMMENDATION_INTENTS.has(normalized)
        ? normalized
        : null;
}
const extractSources = (metadata) => {
    if (!metadata || typeof metadata !== 'object')
        return undefined;
    return sanitizeSources(Array.isArray(metadata.sources) ? metadata.sources : undefined);
};
const extractAttachmentSummaries = (metadata) => {
    if (!metadata || typeof metadata !== 'object')
        return undefined;
    return Array.isArray(metadata.attachments) ? metadata.attachments : undefined;
};
const deriveImageFromMessage = (msg) => {
    const metadata = msg?.metadata;
    if (!metadata || typeof metadata !== 'object')
        return undefined;
    const image = metadata.image;
    if (image && typeof image === 'object') {
        const src = safeString(image.src);
        if (src) {
            return {
                src,
                alt: safeString(image.alt) || 'Uploaded study material',
            };
        }
    }
    const rawFileData = metadata.fileData;
    const attachments = Array.isArray(rawFileData) ? rawFileData : rawFileData ? [rawFileData] : [];
    const imageAttachment = attachments.find((attachment) => safeString(attachment?.kind || 'image') === 'image');
    if (!imageAttachment)
        return undefined;
    const base64 = safeString(imageAttachment?.base64);
    if (!base64)
        return undefined;
    return {
        src: `data:${safeString(imageAttachment?.mimeType || imageAttachment?.type || 'image/jpeg')};base64,${base64}`,
        alt: safeString(imageAttachment?.fileName) || 'Uploaded study material',
    };
};
const extractYoutubeVideoIdFromText = (text) => {
    const raw = String(text || '');
    const longMatch = raw.match(/(?:youtube\.com\/watch\?[^)\s]*v=)([A-Za-z0-9_-]{6,15})/i);
    if (longMatch?.[1])
        return longMatch[1];
    const shortMatch = raw.match(/(?:youtu\.be\/)([A-Za-z0-9_-]{6,15})/i);
    if (shortMatch?.[1])
        return shortMatch[1];
    return null;
};
const deriveVideoDataFromMessage = (msg) => {
    const stored = extractVideoData(msg?.metadata);
    if (stored?.id || stored?.videoId) {
        const videoId = safeString(stored?.id || stored?.videoId).trim();
        if (videoId) {
            const trustTier = safeString(stored?.trustTier).trim();
            return {
                ...stored,
                id: videoId,
                videoId,
                title: safeString(stored?.title).trim() || 'Recommended video',
                channel: safeString(stored?.channel).trim() || undefined,
                channelTitle: safeString(stored?.channelTitle).trim() || undefined,
                thumbnailUrl: safeString(stored?.thumbnailUrl).trim() || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                whyRecommended: limitText(safeString(stored?.whyRecommended).trim(), 220) || null,
                trustTier: ['high', 'medium', 'limited'].includes(trustTier) ? trustTier : null,
                transcriptAvailable: typeof stored?.transcriptAvailable === 'boolean' ? stored.transcriptAvailable : null,
                language: safeString(stored?.language).trim() || null,
                intent: normalizeVideoRecommendationIntent(stored?.intent),
            };
        }
    }
    const fallbackId = extractYoutubeVideoIdFromText(msg?.content);
    if (!fallbackId)
        return null;
    return {
        id: fallbackId,
        videoId: fallbackId,
        title: 'Recommended video',
        thumbnailUrl: `https://img.youtube.com/vi/${fallbackId}/hqdefault.jpg`,
    };
};
function buildStoredMessageMetadata(message) {
    const base = asRecord(message?.metadata) || {};
    const videoData = deriveVideoDataFromMessage({ metadata: { ...base, videoData: message?.videoData || message?.video || base.videoData || base.video } });
    const sources = sanitizeSources(Array.isArray(message?.sources)
        ? message.sources
        : Array.isArray(base.sources)
            ? base.sources
            : undefined);
    return {
        ...base,
        ...(videoData ? { videoData, video: videoData } : {}),
        ...(sources.length > 0 ? { sources } : {}),
        ...(message?.image && typeof message.image === 'object' ? { image: message.image } : {}),
    };
}
const HIGH_RISK_SEVERITIES = new Set(['high', 'critical']);
const prismaAny = prismaClient_1.default;
async function logSafetyAuditEvent(args) {
    if (!prismaAny?.safetyEventAudit)
        return;
    try {
        await prismaAny.safetyEventAudit.create({
            data: {
                actorId: args.actorId,
                actorRole: String(args.actorRole || 'student'),
                action: args.action,
                targetType: args.targetType,
                targetId: args.targetId || null,
                metadata: args.metadata || null,
            },
        });
    }
    catch (error) {
        logger_1.logger.warn({ error: String(error), action: args.action }, '[SafetyAudit] Failed to write audit event.');
    }
}
async function createSafetyAlertIfNeeded(args) {
    if (!prismaAny?.safetyAlert)
        return null;
    const assessment = (0, safetyRiskService_1.detectSafetyRisk)(args.text);
    if (!assessment.flagged || !assessment.severity || !assessment.category)
        return null;
    try {
        const created = await prismaAny.safetyAlert.create({
            data: {
                studentId: args.studentId,
                sessionId: args.sessionId || null,
                messageId: args.messageId || null,
                category: assessment.category,
                severity: assessment.severity,
                confidence: assessment.confidence,
                riskScore: assessment.riskScore,
                excerptRedacted: assessment.excerptRedacted,
                status: 'open',
                metadata: {
                    source: args.source,
                    reasons: assessment.reasons,
                },
            },
        });
        const shouldNotify = HIGH_RISK_SEVERITIES.has(assessment.severity) && assessment.needsCounselorReport;
        if (shouldNotify) {
            const notified = await (0, safetyNotifier_1.notifyCounselor)({
                alertId: created.id,
                studentId: created.studentId,
                sessionId: created.sessionId || null,
                messageId: created.messageId || null,
                category: created.category,
                severity: created.severity,
                confidence: created.confidence,
                excerptRedacted: created.excerptRedacted,
                createdAt: created.createdAt.toISOString(),
            });
            if (notified) {
                await prismaAny.safetyAlert.update({
                    where: { id: created.id },
                    data: {
                        counselorNotified: true,
                        counselorNotifiedAt: new Date(),
                    },
                });
            }
        }
        return created;
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), source: args.source }, '[SafetyAlert] Failed to create alert.');
        return null;
    }
}
const HISTORY_RECENT_WINDOW = 10;
const HISTORY_ANCHOR_WINDOW = 8;
function scoreHistoryMessageImportance(message) {
    const content = safeString(message.content).replace(/\s+/g, ' ').trim().toLowerCase();
    const metadata = message.metadata || {};
    let score = message.role === 'user' ? 1 : 0.5;
    if (message.image?.src)
        score += 4;
    if (message.videoData?.id)
        score += 4;
    if (Array.isArray(metadata?.attachments) && metadata.attachments.length > 0)
        score += 4;
    if (Array.isArray(metadata?.sources) && metadata.sources.length > 0)
        score += 3;
    if (Array.isArray(metadata?.tutorArtifacts) && metadata.tutorArtifacts.length > 0)
        score += 4;
    if (safeString(metadata?.attachmentContextSummary).trim())
        score += 3;
    if (/\b(remember|i prefer|my weak topic|exam|timeline|teacher correction|key rule|definition|means|formula)\b/.test(content))
        score += 3;
    if (/\b(always|never|do not|don't|important|surah|ayah|hadith|bukhari|muslim)\b/.test(content))
        score += 2;
    return score;
}
const trimHistoryForModel = (messages) => {
    const bounded = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
        ...m,
        content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }));
    const recent = bounded.slice(-HISTORY_RECENT_WINDOW);
    const recentIds = new Set(recent.map((message) => message.id));
    const anchors = bounded
        .filter((message) => !recentIds.has(message.id))
        .map((message, index) => ({
        message,
        score: scoreHistoryMessageImportance(message),
        index,
    }))
        .filter((entry) => entry.score >= 3)
        .sort((a, b) => b.score - a.score || b.index - a.index)
        .slice(0, HISTORY_ANCHOR_WINDOW)
        .map((entry) => entry.message);
    const prioritized = [...anchors, ...recent]
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .filter((message, index, all) => all.findIndex((candidate) => candidate.id === message.id) === index);
    let runningChars = 0;
    const kept = [];
    for (let i = prioritized.length - 1; i >= 0; i -= 1) {
        const next = prioritized[i];
        if (runningChars + next.content.length > MAX_HISTORY_CHARS && kept.length > 0) {
            break;
        }
        runningChars += next.content.length;
        kept.push(next);
    }
    return kept.reverse();
};
const ensureVoiceTimeAvailable = async (studentId, res) => {
    const remainingSeconds = await (0, voiceLedgerService_1.getVoiceBalanceSeconds)(studentId);
    if (remainingSeconds > 0)
        return true;
    res.status(402).send({
        reason: 'time_exhausted',
        remainingSeconds: 0,
        message: 'Voice time finished'
    });
    return false;
};
const readVoiceSessionUsageId = (req) => {
    const headerValue = req.headers['x-voice-session-id'];
    const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const normalizedHeader = safeString(fromHeader);
    if (normalizedHeader)
        return normalizedHeader;
    return safeString(req.body?.sessionUsageId);
};
const ensureActiveVoiceSession = async (studentId, sessionUsageId, res) => {
    if (!sessionUsageId) {
        res.status(400).send({ message: 'sessionUsageId is required.' });
        return false;
    }
    const authorization = await (0, voiceLedgerService_1.authorizeVoiceSession)({ studentId, sessionUsageId });
    if (authorization.allowed)
        return true;
    const status = authorization.reason === 'time_exhausted'
        ? 402
        : authorization.reason === 'session_not_found'
            ? 404
            : 409;
    res.status(status).send({
        reason: authorization.reason,
        remainingSeconds: authorization.remainingSeconds,
        message: authorization.reason === 'time_exhausted'
            ? 'Voice time finished'
            : 'Voice session is not active.'
    });
    return false;
};
const getVoiceQuotaKey = (studentId) => {
    const dayKey = new Date().toISOString().slice(0, 10);
    return `voice:quota:${studentId}:${dayKey}`;
};
const getDocumentQuotaKey = (studentId) => `doc:quota:${studentId}`;
const isDocumentKind = (kind) => {
    const raw = safeString(kind).toLowerCase();
    return raw === 'text' || raw === 'pdf';
};
const getDocumentQuotaState = async (studentId) => {
    const redis = await (0, redis_1.getRedisClient)();
    if (!redis) {
        return {
            allowed: true,
            count: 0,
            remaining: MAX_DOCUMENT_UPLOADS_PER_24H,
            retryAfterSec: 0,
            windowSeconds: Math.floor(DOCUMENT_UPLOAD_WINDOW_MS / 1000),
            maxPerWindow: MAX_DOCUMENT_UPLOADS_PER_24H,
        };
    }
    const key = getDocumentQuotaKey(studentId);
    const now = Date.now();
    const windowStart = now - DOCUMENT_UPLOAD_WINDOW_MS;
    await redis.zRemRangeByScore(key, 0, windowStart);
    const count = await redis.zCard(key);
    const remaining = Math.max(0, MAX_DOCUMENT_UPLOADS_PER_24H - count);
    let retryAfterSec = 0;
    if (count >= MAX_DOCUMENT_UPLOADS_PER_24H) {
        const oldest = await redis.zRangeWithScores(key, 0, 0);
        if (oldest?.[0]?.score) {
            const retryMs = Math.max(0, Math.floor(oldest[0].score + DOCUMENT_UPLOAD_WINDOW_MS - now));
            retryAfterSec = Math.ceil(retryMs / 1000);
        }
    }
    return {
        allowed: count < MAX_DOCUMENT_UPLOADS_PER_24H,
        count,
        remaining,
        retryAfterSec,
        windowSeconds: Math.floor(DOCUMENT_UPLOAD_WINDOW_MS / 1000),
        maxPerWindow: MAX_DOCUMENT_UPLOADS_PER_24H,
    };
};
const consumeDocumentQuota = async (studentId, amount = 1) => {
    const state = await getDocumentQuotaState(studentId);
    if (!state.allowed)
        return state;
    if (amount <= 0)
        return state;
    if (state.count + amount > MAX_DOCUMENT_UPLOADS_PER_24H) {
        return {
            ...state,
            allowed: false,
            remaining: Math.max(0, MAX_DOCUMENT_UPLOADS_PER_24H - state.count),
        };
    }
    const redis = await (0, redis_1.getRedisClient)();
    if (!redis)
        return state;
    const now = Date.now();
    const key = getDocumentQuotaKey(studentId);
    await redis.zAdd(key, Array.from({ length: amount }, (_, index) => ({
        score: now + index,
        value: `${now + index}:${Math.random().toString(36).slice(2, 8)}`,
    })));
    await redis.pExpire(key, DOCUMENT_UPLOAD_WINDOW_MS * 2);
    const refreshed = await getDocumentQuotaState(studentId);
    return refreshed;
};
const consumeVoiceQuota = async (studentId, durationSec) => {
    const redis = await (0, redis_1.getRedisClient)();
    if (!redis)
        return { allowed: true };
    const key = getVoiceQuotaKey(studentId);
    const [countRaw, secondsRaw] = await redis.hmGet(key, ['count', 'seconds']);
    const count = parseInt(countRaw || '0', 10);
    const seconds = parseInt(secondsRaw || '0', 10);
    if (count >= MAX_VOICE_SESSIONS_PER_DAY) {
        return { allowed: false, message: 'Daily voice session limit reached.' };
    }
    if (seconds + durationSec > MAX_VOICE_SECONDS_PER_DAY) {
        return { allowed: false, message: 'Daily voice time limit reached.' };
    }
    const multi = redis.multi();
    multi.hIncrBy(key, 'count', 1);
    multi.hIncrBy(key, 'seconds', durationSec);
    multi.expire(key, 60 * 60 * 24);
    await multi.exec();
    return { allowed: true };
};
const getVoiceDayRange = () => {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
};
const getDailyVoiceUsage = async (studentId) => {
    const { start, end } = getVoiceDayRange();
    const sessions = await prismaClient_1.default.voiceUsage.findMany({
        where: { studentId, startedAt: { gte: start, lte: end } },
        orderBy: { startedAt: 'asc' },
    });
    const count = sessions.length;
    const seconds = sessions.reduce((sum, s) => sum + (s.durationSec || 0), 0);
    const bonusSeconds = sessions
        .slice(MAX_VOICE_SESSIONS_PER_DAY)
        .reduce((sum, s) => sum + (s.durationSec || 0), 0);
    return { sessions, count, seconds, bonusSeconds };
};
const computeVoiceQuota = (usage) => {
    const remainingSeconds = Math.max(0, MAX_VOICE_SECONDS_PER_DAY - usage.seconds);
    const bonusRemaining = Math.max(0, MAX_VOICE_BALANCE_SPEND_SECONDS - usage.bonusSeconds);
    const message = "You've used today's voice time. Try again tomorrow.";
    if (remainingSeconds <= 0) {
        return { allowed: false, message, remainingSeconds, bonusRemaining, maxSessionSeconds: 0 };
    }
    if (usage.count < MAX_VOICE_SESSIONS_PER_DAY) {
        return {
            allowed: true,
            remainingSeconds,
            bonusRemaining,
            maxSessionSeconds: Math.min(MAX_VOICE_SECONDS_PER_SESSION, remainingSeconds),
        };
    }
    if (bonusRemaining <= 0) {
        return { allowed: false, message, remainingSeconds, bonusRemaining, maxSessionSeconds: 0 };
    }
    return {
        allowed: true,
        remainingSeconds,
        bonusRemaining,
        maxSessionSeconds: Math.min(remainingSeconds, bonusRemaining),
    };
};
const isPlaceholderTitle = (title) => {
    const raw = (title || '').trim();
    if (!raw)
        return true;
    if (raw === 'New Chat' || raw === 'New Study Session' || raw === 'Study Session')
        return true;
    return /^study session\b/i.test(raw);
};
const TITLE_FORBIDDEN = new Set([
    'new chat',
    'new study session',
    'study session',
    'untitled',
    'general discussion',
    'conversation',
    'chat session',
    'understood',
    'okay',
    'ok',
    'yes',
    'sure',
]);
const TITLE_STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'so', 'of', 'to', 'for', 'in', 'on', 'at', 'by', 'with',
    'from', 'into', 'about', 'over', 'under', 'after', 'before', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'it', 'this', 'that', 'these', 'those', 'as', 'can', 'could', 'should', 'would', 'will', 'may', 'might', 'do',
    'does', 'did', 'done', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'they', 'their', 'he', 'she', 'his', 'her',
    'who', 'what', 'when', 'where', 'why', 'how', 'please', 'help', 'explain', 'tell', 'learn', 'understand',
]);
const cleanTitleText = (value) => String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const extractKeywordTitle = (text, maxWords = 5) => {
    const cleaned = cleanTitleText(text).replace(/[^A-Za-z0-9\u0600-\u06FF\s-]/g, ' ');
    const words = cleaned.split(/\s+/).filter(Boolean);
    const keywords = words.filter((word) => {
        const lower = word.toLowerCase();
        if (lower.length < 3)
            return false;
        if (TITLE_STOPWORDS.has(lower))
            return false;
        return true;
    });
    const selected = (keywords.length > 0 ? keywords : words).slice(0, maxWords);
    if (selected.length === 0)
        return '';
    const joined = selected.join(' ');
    return joined.charAt(0).toUpperCase() + joined.slice(1);
};
const fallbackTitleFromSource = (sourceText) => {
    const candidate = extractKeywordTitle(sourceText) || 'Learning Topic';
    return TITLE_FORBIDDEN.has(candidate.toLowerCase()) ? 'Learning Topic' : candidate;
};
const normalizeTitleCandidate = (candidate, sourceText) => {
    let title = cleanTitleText(candidate)
        .replace(/^title\s*:\s*/i, '')
        .split('\n')[0]
        .replace(/[.!?]+$/g, '')
        .trim();
    if (!title || TITLE_FORBIDDEN.has(title.toLowerCase())) {
        return fallbackTitleFromSource(sourceText);
    }
    if (title.includes(',') || title.split(/\s+/).length > 7) {
        title = title.split(',')[0].trim();
    }
    title = title.replace(/\b(and|or|but|because|which|that|to|for|with|it)\b$/i, '').trim();
    if (/^(it|this|that|there|here)\b/i.test(title)) {
        title = fallbackTitleFromSource(sourceText);
    }
    if (!title || TITLE_FORBIDDEN.has(title.toLowerCase())) {
        return fallbackTitleFromSource(sourceText);
    }
    return title;
};
const deriveTitleFromText = (text) => normalizeTitleCandidate(text, text);
const deriveTitleFromSessionMessages = (messages = []) => {
    const firstUser = messages.find((m) => m.role === 'user' && String(m.content || '').trim().length > 0);
    const firstModel = messages.find((m) => m.role === 'model' && String(m.content || '').trim().length > 0);
    const preferredSource = String(firstUser?.content || firstModel?.content || '').trim();
    if (!preferredSource)
        return '';
    return normalizeTitleCandidate(preferredSource, preferredSource);
};
const isWeakTitleCandidate = (title) => {
    const raw = String(title || '').trim();
    if (!raw)
        return true;
    if (isPlaceholderTitle(raw))
        return true;
    const lower = raw.toLowerCase();
    if (TITLE_FORBIDDEN.has(lower))
        return true;
    if (raw.includes(',') || raw.split(/\s+/).length > 7)
        return true;
    if (/^(it|this|that|there|here)\b/i.test(raw))
        return true;
    if (/\b(and|or|but|because|which|that|to|for|with|it)\b$/i.test(raw))
        return true;
    return false;
};
const resolveSessionTitle = (currentTitle, messages = []) => {
    const rawTitle = String(currentTitle || '').trim();
    if (!isWeakTitleCandidate(rawTitle)) {
        return normalizeTitleCandidate(rawTitle, rawTitle);
    }
    const fromMessages = deriveTitleFromSessionMessages(messages);
    if (fromMessages)
        return fromMessages;
    return normalizeTitleCandidate(rawTitle, rawTitle);
};
// --- HELPER: BACKGROUND TOPIC GENERATOR ---
const generateTopicInBackground = async (sessionId, firstMessage) => {
    try {
        const topicCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Summarize this in 3-5 words for a title (no quotes): "${firstMessage}"` }],
            temperature: 0.3,
            max_tokens: 15,
        });
        const suggestedTopic = topicCompletion.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '');
        if (suggestedTopic) {
            await prismaClient_1.default.chatSession.update({
                where: { id: sessionId },
                data: { topic: normalizeTitleCandidate(suggestedTopic, firstMessage) }
            });
        }
    }
    catch (error) {
        console.error(`[Background] Topic generation failed for ${sessionId}`, error);
    }
};
// ✅ ROBUST PROFILE GETTER (UPSERT)
const getOrCreateStudentProfile = async (studentId) => {
    try {
        const redis = await (0, redis_1.getRedisClient)();
        const cacheKey = `profile:${studentId}`;
        if (redis) {
            try {
                const cachedProfile = await redis.get(cacheKey);
                if (cachedProfile)
                    return JSON.parse(cachedProfile);
            }
            catch (err) {
                console.warn('[Profile] Redis read failed', err);
            }
        }
        const profile = await prismaClient_1.default.studentProfile.upsert({
            where: { userId: studentId },
            update: {},
            create: {
                userId: studentId,
                name: 'Student',
                email: `${studentId}@school.com`,
                gradeLevel: 'Primary',
                profileCompleted: false,
                preferences: {},
                favoriteShows: [],
                topInterests: [],
            },
        });
        if (redis)
            await redis.set(cacheKey, JSON.stringify(profile), { EX: 86400 });
        return profile;
    }
    catch (dbError) {
        console.error(`[Profile] CRITICAL DB ERROR for ${studentId}:`, dbError);
        throw dbError;
    }
};
// ============================================================================
// 1. PRELOAD LOGIC (GET /preload)
// ============================================================================
router.get('/preload', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    logger_1.logger.info({ userId: req.user?.id }, '[API] /preload hit');
    try {
        const studentUserId = req.user.id;
        console.log(`[/preload] Step 1: Fetching profile for student ${studentUserId}`);
        await getOrCreateStudentProfile(studentUserId);
        console.log(`[/preload] Step 2: Fetching sessions for student ${studentUserId}`);
        const [lastSession, history, revisionOverviewBase] = await Promise.all([
            prismaClient_1.default.chatSession.findFirst({
                where: { studentId: studentUserId, messages: { some: {} } },
                orderBy: { updatedAt: 'desc' },
                include: { messages: { orderBy: { timestamp: 'desc' }, take: 12 } },
            }),
            prismaClient_1.default.chatSession.findMany({
                where: { studentId: studentUserId, messages: { some: {} } },
                take: 10,
                orderBy: { updatedAt: 'desc' },
                include: { messages: { orderBy: { timestamp: 'asc' }, take: 3 } },
            }),
            (0, revisionService_1.getRevisionOverview)({ userId: studentUserId, limit: 8 }),
        ]);
        const revisionOverview = await (0, revisionLearningService_1.buildExtendedRevisionOverview)(studentUserId, revisionOverviewBase);
        console.log(`[/preload] Step 3: Mapping data. LastSession found: ${!!lastSession}, History count: ${history.length}`);
        const filteredHistory = history.filter(h => h.id !== lastSession?.id);
        const safeToISOString = (date) => {
            try {
                return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
            }
            catch (e) {
                console.warn('[Preload] Invalid date encountered during mapping:', date);
                return new Date().toISOString();
            }
        };
        let resolvedLastSession = null;
        if (lastSession) {
            const resolvedPayload = buildSessionResponsePayload(lastSession);
            const resolvedTitle = resolvedPayload.title;
            if (resolvedTitle && resolvedTitle !== String(lastSession.topic || '').trim()) {
                prismaClient_1.default.chatSession.update({
                    where: { id: lastSession.id },
                    data: { topic: resolvedTitle }
                }).catch(() => { });
            }
            resolvedLastSession = {
                ...resolvedPayload,
                topic: resolvedTitle || lastSession.topic,
                messages: [...(resolvedPayload.messages || [])].reverse(),
            };
        }
        res.status(200).send({
            ready: true,
            studentId: studentUserId,
            lastSession: resolvedLastSession,
            revisionOverview,
            history: filteredHistory.map((session) => {
                const title = resolveSessionTitle(session.topic, session.messages || []);
                const tutorState = getTutorStateFromMetadata(session.metadata);
                const tutorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
                const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(session.metadata);
                const summaryMeta = buildSessionSummaryMeta({
                    topic: session.topic,
                    messages: session.messages || [],
                    tutorState,
                    tutorArtifacts,
                    tutorRevisionNotes,
                });
                if (title && title !== String(session.topic || '').trim()) {
                    prismaClient_1.default.chatSession.update({
                        where: { id: session.id },
                        data: { topic: title }
                    }).catch(() => { });
                }
                return {
                    id: session.id,
                    title,
                    createdAt: safeToISOString(session.createdAt),
                    updatedAt: safeToISOString(session.updatedAt),
                    firstMessage: session.messages ? (session.messages[0]?.content || null) : null,
                    summary: summaryMeta.summary,
                    lastTutorFocus: summaryMeta.lastTutorFocus,
                    learningMode: summaryMeta.learningMode,
                    hadArtifacts: summaryMeta.hadArtifacts,
                    hadVideo: summaryMeta.hadVideo,
                    continuationStatus: summaryMeta.continuationStatus,
                    recentArtifactLabel: summaryMeta.recentArtifactLabel,
                    revisionCount: summaryMeta.revisionCount,
                };
            })
        });
        console.log(`[/preload] Success: Data sent.`);
    }
    catch (error) {
        console.error('[Backend] CRITICAL 500 in /preload:', error);
        res.status(500).send({ message: 'Internal server error', details: String(error) });
    }
});
// ============================================================================
// 2. NEW SESSION (POST /new-session)
// ============================================================================
router.post('/new-session', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        await getOrCreateStudentProfile(studentUserId);
        try {
            await prismaClient_1.default.chatSession.updateMany({
                where: { studentId: studentUserId, isActive: true },
                data: { isActive: false },
            });
        }
        catch (e) {
            console.warn('[New Session] Archive warning:', e);
        }
        const newSession = await prismaClient_1.default.chatSession.create({
            data: {
                studentId: studentUserId,
                topic: null,
                isActive: true,
                metadata: DEFAULT_CONVERSATION_STATE,
            },
        });
        res.status(200).send({
            sessionId: newSession.id,
            topic: newSession.topic,
            createdAt: newSession.createdAt.toISOString(),
            updatedAt: newSession.updatedAt.toISOString(),
            conversationState: DEFAULT_CONVERSATION_STATE,
            tutorState: {},
        });
    }
    catch (error) {
        console.error('[Backend] Error in /new-session:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
// ============================================================================
// 3. CHAT ROUTE (POST /chat) - VIDEO & TITLE PERSISTENCE
// ============================================================================
router.post('/chat', schoolAuthMiddleware_1.schoolAuthMiddleware, aiLimiter, async (req, res) => {
    const isStreaming = req.query.stream === 'true';
    logger_1.logger.info({ userId: req.user?.id, sessionId: req.body.sessionId, isStreaming }, '[API] /chat hit');
    const routeStartedAt = Date.now();
    try {
        const studentId = req.user.id;
        const messageRaw = safeString(req.body?.message);
        const rawFileData = req.body?.fileData;
        const attachmentList = Array.isArray(rawFileData)
            ? rawFileData.filter((item) => Boolean(item) && typeof item === 'object')
            : rawFileData && typeof rawFileData === 'object'
                ? [rawFileData]
                : [];
        const fileData = attachmentList.length <= 1 ? attachmentList[0] : attachmentList;
        const sessionId = safeString(req.body?.sessionId || req.body?.currentSessionId);
        const latencyTurnId = safeString(req.body?.turnId) || createLatencyTurnId();
        const responseModeRaw = safeString(req.body?.responseMode || (isStreaming ? 'streaming' : 'default')) || 'default';
        const editedMessageId = safeString(req.body?.editedMessageId).trim() || undefined;
        const parsedTutorAction = parseTutorAction(req.body?.tutorAction);
        const requestedPersistUserMessage = req.body?.persistUserMessage !== false;
        const inputOrigin = ['text', 'pasted_question', 'worksheet_followup', 'camera_capture', 'file_upload'].includes(safeString(req.body?.inputOrigin))
            ? safeString(req.body?.inputOrigin)
            : undefined;
        const composerIntent = safeString(req.body?.composerIntent).trim() || undefined;
        const linkedArtifactId = safeString(req.body?.linkedArtifactId).trim() || undefined;
        const tutorAction = parsedTutorAction
            ? {
                ...parsedTutorAction,
                ...(parsedTutorAction.inputOrigin ? {} : inputOrigin ? { inputOrigin } : {}),
                ...(parsedTutorAction.composerIntent ? {} : composerIntent ? { composerIntent } : {}),
                ...(parsedTutorAction.linkedArtifactId ? {} : linkedArtifactId ? { linkedArtifactId } : {}),
            }
            : undefined;
        const latencyContext = req.body?.latencyContext && typeof req.body?.latencyContext === 'object'
            ? req.body.latencyContext
            : null;
        const latencySttMs = Number.isFinite(Number(latencyContext?.sttMs)) ? Math.floor(Number(latencyContext.sttMs)) : undefined;
        const latencyTtsStartMs = Number.isFinite(Number(latencyContext?.ttsStartMs)) ? Math.floor(Number(latencyContext.ttsStartMs)) : undefined;
        const latencyLanguageMode = String(latencyContext?.languageMode || req.body?.languageMode || req.body?.preferredLanguage || '').trim().slice(0, 64);
        const conversationState = req.body?.conversationState;
        const hasFilePayload = attachmentList.some((attachment) => attachment?.kind === 'text'
            ? safeString(attachment?.text).length > 0
            : safeString(attachment?.base64).length > 0);
        const shouldPersistUserMessage = requestedPersistUserMessage || hasFilePayload || Boolean(editedMessageId);
        const documentUploadCount = attachmentList.filter((attachment) => {
            const hasPayload = attachment?.kind === 'text'
                ? safeString(attachment?.text).length > 0
                : safeString(attachment?.base64).length > 0;
            return hasPayload && isDocumentKind(attachment?.kind);
        }).length;
        const effectiveMessage = messageRaw.trim() || 'Please analyze the attached file and break it into clear steps.';
        const isRevisionSaveAction = tutorAction?.id === 'save';
        if (!sessionId)
            return res.status(400).send({ message: 'Session ID is required.' });
        if (!messageRaw.trim() && !hasFilePayload)
            return res.status(400).send({ message: 'Message or file is required.' });
        if (messageRaw.length > MAX_MESSAGE_CHARS) {
            return res.status(413).send({ message: `Message too long (max ${MAX_MESSAGE_CHARS} characters).` });
        }
        if (documentUploadCount > 0) {
            const quota = await consumeDocumentQuota(studentId, documentUploadCount);
            if (!quota.allowed) {
                return res.status(429).send({
                    message: 'Daily document limit reached (2 per 24 hours).',
                    ...quota,
                });
            }
        }
        await getOrCreateStudentProfile(studentId);
        const [session, preferences, preferenceMetadata] = await Promise.all([
            prismaClient_1.default.chatSession.findUnique({
                where: { id: sessionId },
                include: {
                    student: { select: { name: true, gradeLevel: true, userId: true } },
                    messages: { orderBy: { timestamp: 'asc' }, take: 80 }
                }
            }),
            (0, aiPreferenceService_1.getOrCreateCopilotPreferences)(studentId),
            getCopilotPreferencesMetadata(studentId),
        ]);
        if (!session || session.student.userId !== studentId) {
            return res.status(404).send({ message: 'Session not found.' });
        }
        const existingEditedUserMessage = editedMessageId
            ? session.messages.find((message) => message.id === editedMessageId)
            : undefined;
        if (editedMessageId && !existingEditedUserMessage) {
            return res.status(404).send({ message: 'Edited message not found.' });
        }
        if (existingEditedUserMessage && existingEditedUserMessage.role !== 'user') {
            return res.status(400).send({ message: 'Only student messages can be edited.' });
        }
        const existingEditedMetadata = asRecord(existingEditedUserMessage?.metadata) || {};
        const existingEditedAttachments = Array.isArray(existingEditedMetadata.attachments)
            ? existingEditedMetadata.attachments
            : [];
        if (existingEditedUserMessage && (existingEditedAttachments.length > 0 || deriveImageFromMessage(existingEditedUserMessage))) {
            return res.status(409).send({ message: 'Messages with attachments cannot be edited in place yet.' });
        }
        if (existingEditedUserMessage && hasFilePayload) {
            return res.status(400).send({ message: 'Cannot attach new files while regenerating an edited message.' });
        }
        const priorSessionMessages = existingEditedUserMessage
            ? session.messages.filter((message) => message.id !== existingEditedUserMessage.id)
            : session.messages;
        const effectiveConversationState = buildEffectiveConversationState(session.metadata, conversationState);
        const studentMemory = await getStudentMemoryPayload(studentId);
        const detectedInputLanguage = detectInputLanguage(effectiveMessage);
        const sessionLanguageState = normalizeSessionLanguageState(req.body?.sessionLanguageState || preferenceMetadata.sessionLanguageState, preferences.preferredLanguage, detectedInputLanguage);
        const incomingMetacognitiveState = (asRecord(req.body?.metacognitiveState) || null);
        const metacognitiveProfile = await (0, metacognitionService_1.getMetacognitiveProfile)(studentId);
        const mergedMetacognitiveState = (0, metacognitionService_1.mergeMetacognitiveSnapshot)(metacognitiveProfile.recentSnapshot, incomingMetacognitiveState);
        const redis = await (0, redis_1.getRedisClient)();
        const cacheKey = buildScopedChatCacheKey({
            studentId,
            sessionId,
            message: effectiveMessage,
            preferredLanguage: sessionLanguageState.preferredLanguageMode || preferences.preferredLanguage,
            gradeLevel: session.student.gradeLevel || undefined,
            activeTopic: safeString(effectiveConversationState?.lastStudyTopic ||
                effectiveConversationState?.lastTopic ||
                effectiveConversationState?.lastSearchTopic?.[0] ||
                session.topic ||
                ''),
            forceWebSearch: Boolean(req.body?.forceWebSearch),
            includeVideos: Boolean(req.body?.includeVideos),
            tutorActionId: tutorAction?.id,
            tutorActionSourceMessageId: tutorAction?.sourceMessageId,
            tutorActionSelectedText: tutorAction?.selectedText,
            tutorActionLinkedArtifactId: tutorAction?.linkedArtifactId,
        });
        if (redis && !isStreaming && !hasFilePayload && !isRevisionSaveAction) {
            const cachedResponse = await redis.get(cacheKey);
            if (cachedResponse) {
                logger_1.logger.info({ userId: studentId, sessionId, cacheKey }, '[Cache] HIT - Returning scoped response');
                const parsed = JSON.parse(cachedResponse);
                return res.status(200).send({
                    ...parsed,
                    cached: true
                });
            }
        }
        const parsedArtifacts = hasFilePayload
            ? await buildTutorArtifactsFromUploads({
                attachments: attachmentList,
                userText: effectiveMessage,
            })
            : [];
        const attachmentNotices = buildArtifactSystemNotices({
            attachments: attachmentList,
            artifacts: parsedArtifacts,
        });
        const priorTutorState = getTutorStateFromMetadata(session.metadata);
        const effectiveArtifacts = parsedArtifacts.length > 0
            ? parsedArtifacts
            : getTutorArtifactsFromMetadata(session.metadata);
        const userMessageMetadata = {
            ...(inputOrigin ? { inputOrigin } : {}),
            ...(composerIntent ? { composerIntent } : {}),
            ...(linkedArtifactId ? { linkedArtifactId } : {}),
            ...(tutorAction ? { tutorAction } : {}),
            language: buildMessageLanguageMetadata({
                text: effectiveMessage,
                sessionLanguageState,
                detectedInputLanguage,
            }),
            metacognition: mergedMetacognitiveState,
            ...(attachmentNotices.length > 0 ? { systemNotices: attachmentNotices } : {}),
            ...(hasFilePayload
                ? {
                    fileData,
                    attachments: attachmentList.map((attachment, index) => ({
                        name: safeString(attachment?.fileName) || `Attachment ${index + 1}`,
                        kind: safeString(attachment?.kind || 'image') || 'image',
                        mimeType: safeString(attachment?.mimeType || attachment?.type || ''),
                        truncated: Boolean(attachment?.truncated),
                    })),
                    image: attachmentList.length === 1 && safeString(attachmentList[0]?.kind || 'image') === 'image'
                        ? {
                            src: `data:${safeString(attachmentList[0]?.mimeType || attachmentList[0]?.type || 'image/jpeg')};base64,${safeString(attachmentList[0]?.base64)}`,
                            alt: safeString(attachmentList[0]?.fileName) || 'Uploaded study material',
                        }
                        : undefined,
                    tutorArtifacts: parsedArtifacts,
                }
                : {}),
        };
        const preAiSemanticSnapshot = buildSemanticSessionSnapshot([
            ...priorSessionMessages.map((message) => ({
                role: message.role,
                content: message.content,
                metadata: message.metadata,
            })),
            {
                role: 'user',
                content: effectiveMessage,
                metadata: userMessageMetadata,
            },
        ]);
        const resolvedTurnIntent = hasFilePayload
            ? 'attachment_analysis'
            : tutorAction?.id
                ? `tutor_action_${tutorAction.id}`
                : Boolean(req.body?.forceWebSearch)
                    ? 'web_research'
                    : Boolean(req.body?.includeVideos)
                        ? 'video_enabled_study_turn'
                        : inputOrigin === 'worksheet_followup'
                            ? 'worksheet_followup'
                            : inputOrigin === 'camera_capture'
                                ? 'camera_capture'
                                : inputOrigin === 'pasted_question'
                                    ? 'pasted_question'
                                    : inputOrigin === 'file_upload'
                                        ? 'file_upload'
                                        : composerIntent
                                            ? `composer_${composerIntent}`
                                            : 'study_turn';
        const provisionalTutorState = buildLearnerTutorState({
            priorTutorState,
            state: effectiveConversationState,
            topic: safeString(effectiveConversationState?.lastStudyTopic ||
                effectiveConversationState?.lastTopic ||
                session.topic ||
                effectiveMessage).trim() || undefined,
            artifacts: effectiveArtifacts,
            lastIntent: resolvedTurnIntent,
            memory: studentMemory,
            semanticSnapshot: preAiSemanticSnapshot,
            systemNotices: attachmentNotices,
            sessionLanguageState,
            metacognitiveState: mergedMetacognitiveState,
            preferredSupportPatterns: metacognitiveProfile.preferredSupportPatterns || undefined,
        });
        const savedUserMessage = existingEditedUserMessage || (shouldPersistUserMessage
            ? await prismaClient_1.default.chatMessage.create({
                data: {
                    sessionId,
                    role: 'user',
                    content: effectiveMessage,
                    timestamp: new Date(),
                    messageNumber: priorSessionMessages.length + 1,
                    metadata: toPrismaMetadata(userMessageMetadata),
                },
            })
            : null);
        if (savedUserMessage) {
            await createSafetyAlertIfNeeded({
                studentId,
                sessionId,
                messageId: savedUserMessage.id,
                text: effectiveMessage,
                source: 'chat_route',
            });
        }
        if (isStreaming) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
        }
        let fullAiResponse = '';
        let firstTokenAt = null;
        const aiStartedAt = Date.now();
        const trimmedHistory = trimHistoryForModel(priorSessionMessages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            image: deriveImageFromMessage(m),
            videoData: deriveVideoDataFromMessage(m) || undefined,
            metadata: (m.metadata ?? null),
        })));
        const emotionalAICopilot = await getEmotionalAICopilot();
        const aiResult = await emotionalAICopilot({
            text: effectiveMessage,
            fileData: fileData,
            chatHistory: trimmedHistory,
            state: effectiveConversationState,
            tutorState: provisionalTutorState,
            studentProfile: {
                name: session.student.name || 'Student',
                gradeLevel: session.student.gradeLevel || 'Primary'
            },
            preferences: {
                preferredLanguage: preferences.preferredLanguage,
                interests: preferences.interests
            },
            sessionLanguageState,
            metacognitiveState: mergedMetacognitiveState,
            memory: studentMemory,
            currentTitle: session.topic || undefined,
            tutorAction,
            onToken: isStreaming ? (token) => {
                if (!firstTokenAt)
                    firstTokenAt = Date.now();
                fullAiResponse += token;
                res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
            } : undefined
        });
        // If it was streaming, the fullAiResponse will be populated via onToken
        // If it wasn't, we use aiResult.processedText
        const finalContent = isStreaming ? fullAiResponse : aiResult.processedText;
        const aiDoneAt = Date.now();
        const safeSources = sanitizeSources(aiResult.sources);
        const tutorArtifacts = effectiveArtifacts;
        const resolvedTopicForTurn = safeString(aiResult.topic || aiResult.suggestedTitle || session.topic).trim() || undefined;
        const sourceContextMessage = tutorAction?.sourceMessageId
            ? priorSessionMessages.find((message) => message.id === tutorAction.sourceMessageId)
            : undefined;
        let savedRevisionNote;
        if (tutorAction?.id === 'save') {
            try {
                const revisionSave = await (0, revisionService_1.saveRevisionItem)({
                    userId: studentId,
                    sessionId,
                    sourceMessageId: tutorAction.sourceMessageId,
                    sourceMessage: sourceContextMessage
                        ? {
                            id: sourceContextMessage.id,
                            content: sourceContextMessage.content,
                            metadata: (asRecord(sourceContextMessage.metadata) || {}),
                            videoData: deriveVideoDataFromMessage(sourceContextMessage),
                        }
                        : null,
                    tutorActionId: tutorAction.id,
                    targetContent: safeString(sourceContextMessage?.content).trim() ||
                        safeString(tutorAction.selectedText || tutorAction.sourceText || '').trim() ||
                        finalContent ||
                        safeString(effectiveMessage),
                    selectedText: tutorAction.selectedText,
                    topic: resolvedTopicForTurn,
                    subject: safeString(tutorArtifacts[0]?.subject).trim() || undefined,
                    tutorState: provisionalTutorState,
                    tutorArtifacts,
                    sources: safeSources,
                    videoData: aiResult.videoData || deriveVideoDataFromMessage(sourceContextMessage),
                });
                savedRevisionNote = revisionSave.tutorRevisionNote;
            }
            catch (error) {
                logger_1.logger.warn({ userId: studentId, sessionId, error: String(error) }, '[Revision] Save action failed');
            }
        }
        const tutorRevisionNotes = savedRevisionNote
            ? [savedRevisionNote, ...getTutorRevisionNotesFromMetadata(session.metadata)].slice(0, 30)
            : getTutorRevisionNotesFromMetadata(session.metadata);
        const videoSnapshot = await getOrBuildVideoTutorSnapshot({
            videoData: aiResult.videoData,
            activeTopic: safeString(aiResult.topic || aiResult.suggestedTitle || session.topic).trim() || undefined,
            whyRecommended: finalContent,
            priorTutorState,
        });
        const systemNotices = buildChatSystemNotices({
            attachmentNotices,
            safeSources,
            forceWebSearch: Boolean(req.body?.forceWebSearch),
            hasVideo: Boolean(aiResult.videoData?.id),
            videoSnapshot,
            userText: effectiveMessage,
            tutorState: provisionalTutorState,
        });
        const tutorUi = buildTutorActionUiMeta({
            tutorAction,
            activeTopic: resolvedTopicForTurn,
            savedRevisionNote,
        });
        const reflectionPrompt = (0, metacognitionService_1.chooseMetacognitivePrompt)({
            userText: effectiveMessage,
            tutorActionId: tutorAction?.id,
            awaitingStudentAttempt: Boolean(aiResult.state?.awaitingPracticeQuestionAnswer ||
                provisionalTutorState.awaitingStudentAttempt),
            afterMistake: Boolean(mergedMetacognitiveState?.errorType ||
                /\b(incorrect|not quite|mistake|wrong step|check that step)\b/i.test(finalContent)),
            afterSuccess: /\b(well done|good work|that is right|you got it|correct)\b/i.test(finalContent),
            currentErrorType: mergedMetacognitiveState?.errorType || null,
        });
        const basePresentation = deriveMessagePresentation({
            tutorAction,
            tutorUi,
            tutorState: provisionalTutorState,
            artifacts: tutorArtifacts,
            videoData: aiResult.videoData,
            sources: safeSources,
            systemNotices,
        });
        const presentation = (basePresentation || reflectionPrompt)
            ? {
                ...(basePresentation || {}),
                ...buildReflectionPresentationPatch(reflectionPrompt),
            }
            : undefined;
        const aiAssistantMetadata = asRecord(aiResult.assistantMetadata) || {};
        const assistantMetadata = {
            ...aiAssistantMetadata,
            ...(tutorUi ? { tutorUi: { ...(asRecord(aiAssistantMetadata.tutorUi) || {}), ...tutorUi } } : {}),
            ...(presentation ? {
                presentation: {
                    ...(asRecord(aiAssistantMetadata.presentation) || {}),
                    ...presentation,
                },
            } : {}),
            language: {
                ...buildMessageLanguageMetadata({
                    text: effectiveMessage,
                    sessionLanguageState,
                    detectedInputLanguage,
                }),
                generatedLanguage: sessionLanguageState.preferredResponseLanguage,
            },
            metacognition: mergedMetacognitiveState,
            systemNotices: sanitizeSystemNotices([
                ...(Array.isArray(aiAssistantMetadata.systemNotices) ? aiAssistantMetadata.systemNotices : []),
                ...systemNotices,
            ]),
            ...(savedRevisionNote ? { savedRevisionNote } : {}),
        };
        const postAiSemanticSnapshot = buildSemanticSessionSnapshot([
            ...priorSessionMessages.map((message) => ({
                role: message.role,
                content: message.content,
                metadata: message.metadata,
            })),
            {
                role: 'user',
                content: effectiveMessage,
                metadata: userMessageMetadata,
            },
            {
                role: 'model',
                content: finalContent,
                metadata: {
                    sources: safeSources,
                    videoData: aiResult.videoData,
                    tutorArtifacts,
                    ...assistantMetadata,
                },
            },
        ]);
        const tutorState = buildLearnerTutorState({
            priorTutorState,
            state: aiResult.state,
            topic: safeString(aiResult.topic || aiResult.suggestedTitle || session.topic).trim() || undefined,
            artifacts: tutorArtifacts,
            videoData: aiResult.videoData,
            lastIntent: resolvedTurnIntent,
            memory: studentMemory,
            semanticSnapshot: postAiSemanticSnapshot,
            videoSnapshot,
            systemNotices,
            sessionLanguageState,
            metacognitiveState: mergedMetacognitiveState,
            preferredSupportPatterns: metacognitiveProfile.preferredSupportPatterns || undefined,
        });
        try {
            await updateCopilotPreferencesMetadata(studentId, {
                ...preferenceMetadata,
                sessionLanguageState: {
                    ...sessionLanguageState,
                    lastDetectedInputLanguage: detectedInputLanguage,
                },
            });
        }
        catch (error) {
            logger_1.logger.warn({ userId: studentId, error: String(error) }, '[LanguageState] Preference metadata update failed');
        }
        if (savedUserMessage &&
            hasFilePayload &&
            (aiResult.state?.lastAttachmentContextSummary || aiResult.state?.lastAttachmentLabels?.length)) {
            try {
                await prismaClient_1.default.chatMessage.update({
                    where: { id: savedUserMessage.id },
                    data: {
                        metadata: {
                            ...(savedUserMessage.metadata || {}),
                            attachmentContextSummary: aiResult.state?.lastAttachmentContextSummary,
                            attachmentLabels: aiResult.state?.lastAttachmentLabels || [],
                            tutorArtifacts: parsedArtifacts,
                        },
                    },
                });
            }
            catch (e) {
                logger_1.logger.warn({ messageId: savedUserMessage.id, error: String(e) }, '[Backend] User attachment context metadata update failed');
            }
        }
        await (0, latencyService_1.recordTurnLatency)({
            studentId,
            sessionId,
            turnId: latencyTurnId,
            responseMode: responseModeRaw,
            route: 'backend_chat',
            forceWebSearch: Boolean(req.body?.forceWebSearch),
            languageMode: latencyLanguageMode || undefined,
            source: 'backend_route',
            sttMs: latencySttMs,
            ttsStartMs: latencyTtsStartMs,
            firstTokenMs: firstTokenAt ? Math.max(0, firstTokenAt - aiStartedAt) : undefined,
            doneMs: Math.max(0, aiDoneAt - aiStartedAt),
            aiMs: Math.max(0, aiDoneAt - aiStartedAt),
            totalMs: Math.max(0, aiDoneAt - routeStartedAt),
            inputChars: effectiveMessage.length,
            outputChars: String(finalContent || '').length,
            metadata: {
                isStreaming,
            },
        });
        // Write AI Response with Metadata
        const savedAiMsg = await prismaClient_1.default.chatMessage.create({
            data: {
                sessionId,
                role: 'model',
                content: finalContent,
                timestamp: new Date(),
                messageNumber: priorSessionMessages.length + (savedUserMessage ? 2 : 1),
                metadata: toPrismaMetadata({
                    videoData: aiResult.videoData,
                    video: aiResult.videoData,
                    sources: safeSources,
                    suggestedTitle: aiResult.suggestedTitle,
                    tutorArtifacts,
                    videoContextSummary: videoSnapshot.activeVideoSummary,
                    videoConcepts: videoSnapshot.activeVideoConcepts,
                    videoWhyRecommended: videoSnapshot.activeVideoWhyRecommended,
                    ...assistantMetadata,
                }),
            }
        });
        // 4. Update Session Metadata & Title (CRITICAL FIX)
        try {
            const rawSuggested = aiResult.suggestedTitle?.trim() || '';
            const suggested = rawSuggested ? normalizeTitleCandidate(rawSuggested, effectiveMessage) : '';
            const derived = suggested || deriveTitleFromText(effectiveMessage || finalContent);
            if (derived && isPlaceholderTitle(session.topic)) {
                await prismaClient_1.default.chatSession.update({
                    where: { id: sessionId },
                    data: {
                        topic: derived,
                        updatedAt: new Date(),
                        metadata: mergeSessionMetadata({
                            existing: session.metadata,
                            conversationState: aiResult.state,
                            tutorState,
                            tutorArtifacts,
                            tutorRevisionNotes,
                            systemNotices,
                        }),
                    }
                });
            }
            else {
                await prismaClient_1.default.chatSession.update({
                    where: { id: sessionId },
                    data: {
                        updatedAt: new Date(),
                        metadata: mergeSessionMetadata({
                            existing: session.metadata,
                            conversationState: aiResult.state,
                            tutorState,
                            tutorArtifacts,
                            tutorRevisionNotes,
                            systemNotices,
                        }),
                    }
                });
            }
        }
        catch (e) {
            logger_1.logger.warn({ sessionId, error: String(e) }, '[Backend] Session metadata update failed');
        }
        try {
            await applyDeterministicMasteryUpdate({
                studentId,
                priorState: effectiveConversationState,
                nextState: aiResult.state,
                topic: safeString(aiResult.topic || tutorState.activeTopic || session.topic).trim() || undefined,
                userMessage: effectiveMessage,
                aiResponse: finalContent,
            });
        }
        catch (e) {
            logger_1.logger.warn({ studentId, sessionId, error: String(e) }, '[Backend] Deterministic mastery update failed');
        }
        // 5. CACHE STORE
        if (redis && !hasFilePayload && !isRevisionSaveAction && finalContent.length > 10 && finalContent.length < 2000) {
            const cacheData = {
                response: finalContent,
                sessionId: session.id,
                topic: aiResult.suggestedTitle || session.topic,
                conversationState: aiResult.state,
                videoData: aiResult.videoData,
                sources: safeSources,
                tutorState,
                assistantMetadata,
            };
            await redis.set(cacheKey, JSON.stringify(cacheData), { EX: 86400 }); // Cache for 24h
        }
        if (isStreaming) {
            res.write(`data: ${JSON.stringify({
                type: 'done',
                metadata: {
                    messageId: savedAiMsg.id,
                    sessionId: session.id,
                    topic: aiResult.suggestedTitle || session.topic,
                    state: aiResult.state,
                    video: aiResult.videoData,
                    sources: safeSources,
                    tutorState,
                    assistantMetadata,
                }
            })}\n\n`);
            res.end();
            return;
        }
        res.status(200).send({
            response: aiResult.processedText,
            messageId: savedAiMsg.id,
            sessionId: session.id,
            topic: aiResult.suggestedTitle || session.topic,
            conversationState: aiResult.state,
            videoData: aiResult.videoData,
            sources: safeSources,
            tutorState,
            assistantMetadata,
        });
        // Background Tasks
        if (session.messages.length === 0 && isPlaceholderTitle(session.topic)) {
            generateTopicInBackground(sessionId, effectiveMessage);
        }
        if (pineconeIndex) {
            (0, workers_1.runEmbeddingTask)(sessionId, studentId, effectiveMessage, aiResult.processedText);
        }
        (0, workers_1.runPersonalizationTask)(studentId, effectiveMessage, aiResult.processedText);
    }
    catch (error) {
        console.error('[Backend] Error in /chat:', error);
        try {
            const studentId = req.user?.id;
            if (studentId) {
                await (0, latencyService_1.recordTurnLatency)({
                    studentId,
                    sessionId: safeString(req.body?.sessionId || req.body?.currentSessionId),
                    turnId: safeString(req.body?.turnId) || createLatencyTurnId(),
                    responseMode: safeString(req.body?.responseMode || 'default') || 'default',
                    route: 'backend_chat',
                    forceWebSearch: Boolean(req.body?.forceWebSearch),
                    source: 'backend_route',
                    totalMs: Math.max(0, Date.now() - routeStartedAt),
                    inputChars: safeString(req.body?.message).length,
                    metadata: { failed: true, error: String(error) },
                });
            }
        }
        catch {
            // no-op
        }
        res.status(500).send({ message: 'Internal server error', details: String(error) });
    }
});
// --- HELPER ROUTES ---
router.post('/message', schoolAuthMiddleware_1.schoolAuthMiddleware, rateLimiter_1.rateLimiter, async (req, res) => {
    try {
        const message = req.body?.message;
        const sessionId = safeString(req.body?.sessionId || req.body?.currentSessionId);
        const conversationState = req.body?.conversationState;
        if (!sessionId)
            return res.status(400).send({ message: 'Session ID required.' });
        if (!message || (message.role !== 'user' && message.role !== 'model')) {
            return res.status(400).send({ message: 'Invalid message payload.' });
        }
        if (typeof message.content !== 'string' || !message.content.trim()) {
            return res.status(400).send({ message: 'Message content required.' });
        }
        if (message.content.length > MAX_MESSAGE_CHARS) {
            return res.status(413).send({ message: `Message too long (max ${MAX_MESSAGE_CHARS} characters).` });
        }
        const session = await prismaClient_1.default.chatSession.findUnique({
            where: { id: sessionId },
            select: { id: true, studentId: true, topic: true, metadata: true },
        });
        if (!session || session.studentId !== req.user.id) {
            return res.status(404).send({ message: 'Session not found.' });
        }
        const count = await prismaClient_1.default.chatMessage.count({ where: { sessionId } });
        let fallbackTitle = null;
        if (message?.role === 'model') {
            if (isPlaceholderTitle(session.topic)) {
                const derived = deriveTitleFromText(message?.content || '');
                fallbackTitle = derived || null;
            }
        }
        const savedMessage = await prismaClient_1.default.chatMessage.create({
            data: {
                sessionId,
                role: message.role,
                content: message.content,
                timestamp: (() => {
                    const ts = message.timestamp ? new Date(message.timestamp) : new Date();
                    return isNaN(ts.getTime()) ? new Date() : ts;
                })(),
                messageNumber: count + 1,
                metadata: toPrismaMetadata(buildStoredMessageMetadata(message)),
            },
        });
        if (message.role === 'user') {
            await createSafetyAlertIfNeeded({
                studentId: req.user.id,
                sessionId,
                messageId: savedMessage.id,
                text: message.content,
                source: 'message_route',
            });
        }
        const nextConversationState = {
            ...DEFAULT_CONVERSATION_STATE,
            ...(asRecord(session.metadata) || {}),
            ...(asRecord(conversationState) || {}),
        };
        await prismaClient_1.default.chatSession.update({
            where: { id: sessionId },
            data: {
                metadata: toPrismaMetadata(mergeSessionMetadata({
                    existing: session.metadata,
                    conversationState: nextConversationState,
                })),
                updatedAt: new Date(),
                ...(fallbackTitle ? { topic: fallbackTitle } : {})
            },
        });
        console.log('[Backend] Message saved', { sessionId, role: message.role });
        res.status(200).send({ message: 'Message saved', savedMessage: mapSessionMessagePayload(savedMessage) });
    }
    catch (error) {
        console.error('[Backend] Error saving message:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/messages/:id/edit', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const nextContent = safeString(req.body?.content).trim();
        if (!nextContent)
            return res.status(400).send({ message: 'Edited content is required.' });
        if (nextContent.length > MAX_MESSAGE_CHARS) {
            return res.status(413).send({ message: `Message too long (max ${MAX_MESSAGE_CHARS} characters).` });
        }
        const targetMessage = await prismaClient_1.default.chatMessage.findUnique({
            where: { id: req.params.id },
            include: {
                chatSession: {
                    include: {
                        messages: {
                            orderBy: { messageNumber: 'asc' },
                        },
                    },
                },
            },
        });
        if (!targetMessage || targetMessage.chatSession.studentId !== studentUserId) {
            return res.status(404).send({ message: 'Message not found.' });
        }
        if (targetMessage.role !== 'user') {
            return res.status(400).send({ message: 'Only student messages can be edited.' });
        }
        const targetMetadata = asRecord(targetMessage.metadata) || {};
        const existingAttachments = Array.isArray(targetMetadata.attachments) ? targetMetadata.attachments : [];
        if (existingAttachments.length > 0 || deriveImageFromMessage(targetMessage)) {
            return res.status(409).send({ message: 'Messages with attachments cannot be edited in place yet.' });
        }
        if (nextContent === safeString(targetMessage.content).trim()) {
            return res.status(200).send(buildSessionResponsePayload(targetMessage.chatSession));
        }
        const session = targetMessage.chatSession;
        const targetIndex = session.messages.findIndex((message) => message.id === targetMessage.id);
        if (targetIndex < 0) {
            return res.status(404).send({ message: 'Message not found in session.' });
        }
        const laterUserTurnExists = session.messages
            .slice(targetIndex + 1)
            .some((message) => message.role === 'user');
        if (laterUserTurnExists) {
            return res.status(409).send({ message: 'Only the latest student turn can be edited safely.' });
        }
        const priorTutorState = getTutorStateFromMetadata(session.metadata);
        const tutorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
        const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(session.metadata);
        const preservedNotices = getSystemNoticesFromMetadata(session.metadata);
        const studentMemory = await getStudentMemoryPayload(studentUserId);
        const now = new Date();
        const nowIso = now.toISOString();
        const existingEditMeta = getMessageEditMetaFromMetadata(targetMessage.metadata) || {};
        const updatedMessageMetadata = {
            ...targetMetadata,
            edit: {
                edited: true,
                editedAt: nowIso,
                originalContent: existingEditMeta.originalContent || targetMessage.content,
                editHistory: [
                    ...(Array.isArray(existingEditMeta.editHistory) ? existingEditMeta.editHistory : []),
                    { content: targetMessage.content, editedAt: nowIso },
                ].slice(-12),
            },
        };
        const semanticSnapshot = buildSemanticSessionSnapshot([
            ...session.messages.slice(0, targetIndex).map((message) => ({
                role: message.role,
                content: message.content,
                metadata: message.metadata,
            })),
            {
                role: 'user',
                content: nextContent,
                metadata: updatedMessageMetadata,
            },
        ]);
        const nextTutorState = buildLearnerTutorState({
            priorTutorState,
            state: DEFAULT_CONVERSATION_STATE,
            topic: safeString(session.topic || nextContent).trim() || undefined,
            artifacts: tutorArtifacts,
            lastIntent: 'message_edit_reset',
            memory: studentMemory,
            semanticSnapshot,
            systemNotices: preservedNotices,
        });
        const mergedMetadata = mergeSessionMetadata({
            existing: session.metadata,
            conversationState: DEFAULT_CONVERSATION_STATE,
            tutorState: nextTutorState,
            tutorArtifacts,
            tutorRevisionNotes,
            systemNotices: preservedNotices,
        });
        const updatedSession = await prismaClient_1.default.$transaction(async (tx) => {
            await tx.chatMessage.update({
                where: { id: targetMessage.id },
                data: {
                    content: nextContent,
                    timestamp: now,
                    metadata: toPrismaMetadata(updatedMessageMetadata),
                },
            });
            await tx.chatMessage.deleteMany({
                where: {
                    sessionId: session.id,
                    messageNumber: { gt: targetMessage.messageNumber },
                },
            });
            await tx.chatSession.update({
                where: { id: session.id },
                data: {
                    metadata: toPrismaMetadata(mergedMetadata),
                    updatedAt: now,
                },
            });
            return tx.chatSession.findUnique({
                where: { id: session.id },
                include: {
                    messages: { orderBy: { timestamp: 'asc' } },
                },
            });
        });
        if (!updatedSession) {
            return res.status(500).send({ message: 'Could not rebuild the edited session.' });
        }
        return res.status(200).send(buildSessionResponsePayload(updatedSession));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), messageId: req.params.id }, '[Backend] Message edit failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
// ✅ SESSION PATCH (HARD DEBUG VERSION WITH DETAILED LOGS)
router.patch('/session/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    const curSessionId = req.params.id;
    try {
        const studentUserId = req.user.id;
        const { title } = req.body;
        logger_1.logger.info({ sessionId: curSessionId, userId: studentUserId, title }, '[BACKEND PATCH] Starting Title Update');
        // 1. Verify Session Exists & Belongs to User
        const existingSession = await prismaClient_1.default.chatSession.findFirst({
            where: { id: curSessionId, studentId: studentUserId }
        });
        if (!existingSession) {
            logger_1.logger.error({ sessionId: curSessionId, userId: studentUserId }, '[BACKEND PATCH] ERROR: Session NOT FOUND or NOT OWNED');
            return res.status(404).send({ message: 'Session not found.' });
        }
        logger_1.logger.info({ sessionId: curSessionId, userId: studentUserId, title }, '[BACKEND PATCH] ✅ Session found. Current Title: "' + existingSession.topic + '". Attempting DB Write...');
        // 2. Perform Update (Hard Error if fails)
        const safeTitle = normalizeTitleCandidate(safeString(title), existingSession.topic || '');
        const updated = await prismaClient_1.default.chatSession.update({
            where: { id: curSessionId },
            data: { topic: safeTitle, updatedAt: new Date() },
        });
        logger_1.logger.info({ sessionId: curSessionId, newTitle: updated.topic }, '[BACKEND PATCH] ✅ Success! DB Updated');
        res.status(200).json({ message: 'Session updated', session: updated });
    }
    catch (error) {
        logger_1.logger.error({ sessionId: curSessionId, error: String(error) }, '[BACKEND PATCH] 💥 CRITICAL DB ERROR');
        res.status(500).send({ message: 'Internal server error', error: String(error) });
    }
});
router.get('/history', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const { page = '1', limit = '10', search } = req.query;
        const pageNum = parseInt(page), limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = { studentId: studentUserId, messages: { some: {} } };
        if (search) {
            whereClause.OR = [
                { topic: { contains: search, mode: 'insensitive' } },
                { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
            ];
        }
        const [total, history] = await Promise.all([
            prismaClient_1.default.chatSession.count({ where: whereClause }),
            prismaClient_1.default.chatSession.findMany({
                where: whereClause, skip, take: limitNum, orderBy: { updatedAt: 'desc' },
                include: { messages: { orderBy: { timestamp: 'asc' }, take: 3 } }
            })
        ]);
        // SELF-HEALING HISTORY: Rename old placeholder sessions using background summarization
        const sessionsWithTitles = await Promise.all(history.map(async (s) => {
            const currentTitle = String(s.topic || '').trim();
            let title = resolveSessionTitle(currentTitle, s.messages || []);
            if (title && title !== currentTitle) {
                (0, workers_1.runSummarizationTask)(s.id, studentUserId);
                prismaClient_1.default.chatSession.update({
                    where: { id: s.id },
                    data: { topic: title }
                }).catch(() => { });
            }
            const tutorState = getTutorStateFromMetadata(s.metadata);
            const tutorArtifacts = getTutorArtifactsFromMetadata(s.metadata);
            const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(s.metadata);
            const summaryMeta = buildSessionSummaryMeta({
                topic: s.topic,
                messages: s.messages || [],
                tutorState,
                tutorArtifacts,
                tutorRevisionNotes,
            });
            return {
                id: s.id,
                title: title,
                updatedAt: s.updatedAt.toISOString(),
                createdAt: s.createdAt.toISOString(),
                firstMessage: s.messages[0]?.content || null,
                summary: summaryMeta.summary,
                lastTutorFocus: summaryMeta.lastTutorFocus,
                learningMode: summaryMeta.learningMode,
                hadArtifacts: summaryMeta.hadArtifacts,
                hadVideo: summaryMeta.hadVideo,
                continuationStatus: summaryMeta.continuationStatus,
                recentArtifactLabel: summaryMeta.recentArtifactLabel,
                revisionCount: summaryMeta.revisionCount,
            };
        }));
        res.status(200).send({
            sessions: sessionsWithTitles,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/session/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        prismaClient_1.default.chatSession.updateMany({
            where: { studentId: studentUserId, isActive: true, id: { not: req.params.id } },
            data: { isActive: false },
        }).catch(e => { });
        const session = await prismaClient_1.default.chatSession.update({
            where: { id: req.params.id, studentId: studentUserId },
            data: { isActive: true },
            include: { messages: { orderBy: { timestamp: 'asc' } } },
        });
        if (!session)
            return res.status(404).send({ message: 'Session not found.' });
        return res.status(200).send(buildSessionResponsePayload(session));
        res.status(200).send({
            ...session,
            messages: session.messages.map((msg) => ({
                ...msg,
                timestamp: msg.timestamp.toISOString(),
                // ✅ RETURN SAVED VIDEO DATA
                videoData: deriveVideoDataFromMessage(msg),
                sources: extractSources(msg.metadata),
                image: deriveImageFromMessage(msg),
            })),
            conversationState: (session.metadata || DEFAULT_CONVERSATION_STATE),
            tutorState: getTutorStateFromMetadata(session.metadata),
        });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/session/:id/tutor-state', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const session = await prismaClient_1.default.chatSession.findFirst({
            where: { id: req.params.id, studentId: studentUserId },
            include: {
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 8,
                },
            },
        });
        if (!session)
            return res.status(404).send({ message: 'Session not found.' });
        const tutorState = getTutorStateFromMetadata(session.metadata);
        const tutorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
        const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(session.metadata);
        return res.status(200).send({
            tutorState,
            artifacts: tutorArtifacts,
            systemNotices: getSystemNoticesFromMetadata(session.metadata),
            revisionCount: tutorRevisionNotes.length,
            updatedAt: session.updatedAt.toISOString(),
        });
    }
    catch (error) {
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.put('/session/:id/tutor-state', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const session = await prismaClient_1.default.chatSession.findFirst({
            where: { id: req.params.id, studentId: studentUserId },
            select: { id: true, metadata: true, updatedAt: true },
        });
        if (!session)
            return res.status(404).send({ message: 'Session not found.' });
        const incoming = asRecord(req.body?.tutorState) || {};
        const nextTutorState = {
            ...getTutorStateFromMetadata(session.metadata),
            ...incoming,
            updatedAt: new Date().toISOString(),
        };
        const mergedMetadata = mergeSessionMetadata({
            existing: session.metadata,
            conversationState: buildEffectiveConversationState(session.metadata, null),
            tutorState: nextTutorState,
        });
        const updated = await prismaClient_1.default.chatSession.update({
            where: { id: session.id },
            data: { metadata: mergedMetadata, updatedAt: new Date() },
        });
        return res.status(200).send({
            tutorState: getTutorStateFromMetadata(updated.metadata),
            updatedAt: updated.updatedAt.toISOString(),
        });
    }
    catch (error) {
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/revision', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const baseOverview = await (0, revisionService_1.getRevisionOverview)({
            userId: studentUserId,
            search: safeString(req.query?.search).trim() || undefined,
            limit: Number(req.query?.limit) || undefined,
        });
        const overview = await (0, revisionLearningService_1.buildExtendedRevisionOverview)(studentUserId, baseOverview);
        return res.status(200).send(overview);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision overview failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/revision', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const sourceMessageId = safeString(req.body?.sourceMessageId).trim() || undefined;
        const requestedSessionId = safeString(req.body?.sessionId).trim() || undefined;
        const selectedText = safeString(req.body?.selectedText).trim() || undefined;
        const collectionId = safeString(req.body?.collectionId).trim() || undefined;
        const overrideTitle = safeString(req.body?.title).trim() || undefined;
        const overrideSummary = safeString(req.body?.summary).trim() || undefined;
        const studentNote = safeString(req.body?.studentNote).trim() || undefined;
        const saveMode = safeString(req.body?.saveMode).trim() || undefined;
        const contentType = safeString(req.body?.contentType).trim() || undefined;
        const needsPractice = typeof req.body?.needsPractice === 'boolean' ? Boolean(req.body.needsPractice) : undefined;
        const isMistakeBased = typeof req.body?.isMistakeBased === 'boolean' ? Boolean(req.body.isMistakeBased) : undefined;
        const examPriority = typeof req.body?.examPriority === 'boolean' ? Boolean(req.body.examPriority) : undefined;
        const reflection = (asRecord(req.body?.reflection) || null);
        const sourceMessageRecord = sourceMessageId
            ? await prismaClient_1.default.chatMessage.findUnique({
                where: { id: sourceMessageId },
                include: {
                    chatSession: {
                        select: { id: true, studentId: true, metadata: true },
                    },
                },
            })
            : null;
        if (sourceMessageRecord && sourceMessageRecord.chatSession.studentId !== studentUserId) {
            return res.status(404).send({ message: 'Source message not found.' });
        }
        const sessionId = requestedSessionId || sourceMessageRecord?.chatSession?.id || undefined;
        const session = sessionId
            ? await prismaClient_1.default.chatSession.findFirst({
                where: { id: sessionId, studentId: studentUserId },
                select: { id: true, metadata: true },
            })
            : null;
        if (sessionId && !session) {
            return res.status(404).send({ message: 'Session not found.' });
        }
        const sourceMessage = sourceMessageRecord
            ? {
                id: sourceMessageRecord.id,
                content: sourceMessageRecord.content,
                metadata: (asRecord(sourceMessageRecord.metadata) || {}),
                videoData: deriveVideoDataFromMessage(sourceMessageRecord),
            }
            : null;
        const tutorState = {
            ...getTutorStateFromMetadata(session?.metadata),
            ...(asRecord(req.body?.tutorState) || {}),
        };
        const bodyArtifacts = Array.isArray(req.body?.tutorArtifacts) ? req.body.tutorArtifacts : [];
        const tutorArtifacts = bodyArtifacts.length > 0 ? bodyArtifacts : getTutorArtifactsFromMetadata(session?.metadata);
        const sources = Array.isArray(req.body?.sources) ? sanitizeSources(req.body.sources) : extractSources(sourceMessageRecord?.metadata) || [];
        const topic = safeString(req.body?.topic).trim() ||
            safeString(tutorState.activeTopic).trim() ||
            undefined;
        const subject = safeString(req.body?.subject).trim() ||
            safeString(tutorArtifacts[0]?.subject).trim() ||
            undefined;
        const targetContent = safeString(req.body?.content).trim() ||
            safeString(sourceMessage?.content).trim() ||
            safeString(selectedText).trim() ||
            safeString(overrideSummary).trim();
        if (!targetContent) {
            return res.status(400).send({ message: 'Revision content is required.' });
        }
        const saved = await (0, revisionService_1.saveRevisionItem)({
            userId: studentUserId,
            sessionId,
            sourceMessageId,
            sourceMessage,
            targetContent,
            selectedText,
            topic,
            subject,
            overrideTitle,
            overrideSummary,
            collectionId,
            tutorState,
            tutorArtifacts,
            sources,
            studentNote,
            saveMode: saveMode,
            contentType: contentType,
            needsPractice,
            isMistakeBased,
            examPriority,
            reflection,
            videoData: req.body?.videoData && typeof req.body.videoData === 'object'
                ? req.body.videoData
                : deriveVideoDataFromMessage(sourceMessageRecord),
        });
        return res.status(201).send(saved);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision save failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/revision/collections', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const overview = await (0, revisionService_1.getRevisionOverview)({
            userId: studentUserId,
            search: safeString(req.query?.search).trim() || undefined,
            limit: Number(req.query?.limit) || undefined,
        });
        return res.status(200).send({
            collections: overview.collections,
            totalCollections: overview.totalCollections,
            totalItems: overview.totalItems,
            ungroupedCount: overview.ungroupedCount,
        });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision collections failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/revision/collections', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const title = safeString(req.body?.title).trim();
        if (!title) {
            return res.status(400).send({ message: 'A revision list title is required.' });
        }
        const collection = await (0, revisionService_1.createRevisionCollection)({
            userId: studentUserId,
            title,
            subject: safeString(req.body?.subject).trim() || null,
            topic: safeString(req.body?.topic).trim() || null,
            description: safeString(req.body?.description).trim() || null,
        });
        return res.status(201).send(collection);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision collection create failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/revision/collections/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const details = await (0, revisionService_1.getRevisionCollectionDetails)({
            userId: studentUserId,
            collectionId: req.params.id,
            search: safeString(req.query?.search).trim() || undefined,
        });
        if (!details) {
            return res.status(404).send({ message: 'Revision list not found.' });
        }
        return res.status(200).send(details);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Revision collection detail failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.patch('/revision/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const item = await (0, revisionLearningService_1.updateRevisionItem)({
            userId: req.user.id,
            itemId: req.params.id,
            patch: {
                title: typeof req.body?.title === 'string' ? req.body.title : undefined,
                summary: typeof req.body?.summary === 'string' ? req.body.summary : undefined,
                content: typeof req.body?.content === 'string' ? req.body.content : undefined,
                collectionId: Object.prototype.hasOwnProperty.call(req.body || {}, 'collectionId') ? (safeString(req.body?.collectionId).trim() || null) : undefined,
                studentNote: Object.prototype.hasOwnProperty.call(req.body || {}, 'studentNote') ? (safeString(req.body?.studentNote).trim() || null) : undefined,
                isPinned: typeof req.body?.isPinned === 'boolean' ? req.body.isPinned : undefined,
                mastery: Object.prototype.hasOwnProperty.call(req.body || {}, 'mastery') ? (safeString(req.body?.mastery).trim() || null) : undefined,
                needsPractice: typeof req.body?.needsPractice === 'boolean' ? req.body.needsPractice : undefined,
                isMistakeBased: typeof req.body?.isMistakeBased === 'boolean' ? req.body.isMistakeBased : undefined,
                saveMode: Object.prototype.hasOwnProperty.call(req.body || {}, 'saveMode') ? (safeString(req.body?.saveMode).trim() || null) : undefined,
                contentType: typeof req.body?.contentType === 'string' ? req.body.contentType : undefined,
                examPriority: typeof req.body?.examPriority === 'boolean' ? req.body.examPriority : undefined,
                reflection: Object.prototype.hasOwnProperty.call(req.body || {}, 'reflection')
                    ? (asRecord(req.body?.reflection) || null)
                    : undefined,
            },
        });
        if (!item)
            return res.status(404).send({ message: 'Revision item not found.' });
        return res.status(200).send({ item, message: 'Revision item updated.' });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.id }, '[Backend] Revision item update failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/revision/:id/action', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const actionType = safeString(req.body?.actionType).trim();
        const normalizedActionType = actionType === 'explain' ? 'breakdown' : actionType;
        if (!['quiz', 'breakdown', 'similar_question'].includes(normalizedActionType)) {
            return res.status(400).send({ message: 'A valid revision action is required.' });
        }
        const result = await (0, revisionLearningService_1.runRevisionItemAction)({
            userId: req.user.id,
            itemId: req.params.id,
            actionType: normalizedActionType,
        });
        if (!result)
            return res.status(404).send({ message: 'Revision item not found.' });
        return res.status(200).send(result);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.id }, '[Backend] Revision action failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/revision/queue', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send(await (0, revisionLearningService_1.getRevisionQueue)(req.user.id, Number(req.query?.limit) || undefined));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision queue failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/revision/progress', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send(await (0, revisionLearningService_1.getRevisionProgressOverview)(req.user.id));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision progress failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/revision/:id/review-event', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const eventType = safeString(req.body?.eventType).trim();
        if (!eventType)
            return res.status(400).send({ message: 'eventType is required.' });
        const result = await (0, revisionLearningService_1.recordRevisionReviewEvent)({
            userId: req.user.id,
            itemId: req.params.id,
            sessionId: safeString(req.body?.sessionId).trim() || null,
            eventType: eventType,
            outcome: (safeString(req.body?.outcome).trim() || null),
            metadata: asRecord(req.body?.metadata) || {},
        });
        if (!result)
            return res.status(404).send({ message: 'Revision item not found.' });
        return res.status(201).send(result);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.id }, '[Backend] Revision review event failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/revision/group-suggestions', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send({ suggestions: await (0, revisionLearningService_1.getRevisionGroupingSuggestions)(req.user.id) });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision group suggestions failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/revision/group-suggestions/:id/apply', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const result = await (0, revisionLearningService_1.applyRevisionGroupingSuggestion)(req.user.id, req.params.id);
        if (!result)
            return res.status(404).send({ message: 'Revision grouping suggestion not found.' });
        return res.status(200).send(result);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id, suggestionId: req.params.id }, '[Backend] Revision grouping apply failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/revision/audio-recap', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const sourceType = safeString(req.body?.sourceType).trim();
        if (!['collection', 'item', 'queue'].includes(sourceType)) {
            return res.status(400).send({ message: 'A valid audio recap source is required.' });
        }
        return res.status(200).send(await (0, revisionLearningService_1.generateRevisionAudioRecap)({
            userId: req.user.id,
            sourceType: sourceType,
            collectionId: safeString(req.body?.collectionId).trim() || undefined,
            itemId: safeString(req.body?.itemId).trim() || undefined,
        }));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision audio recap failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/revision-mode/start', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const sourceType = safeString(req.body?.sourceType).trim() || 'queue';
        const result = await (0, revisionLearningService_1.startRevisionMode)({
            userId: req.user.id,
            sourceType: sourceType,
            collectionId: safeString(req.body?.collectionId).trim() || undefined,
            itemIds: Array.isArray(req.body?.itemIds) ? req.body.itemIds.map((item) => safeString(item).trim()).filter(Boolean) : undefined,
            examFocus: Boolean(req.body?.examFocus),
        });
        if (!result)
            return res.status(404).send({ message: 'No revision items were available for that revision mode.' });
        return res.status(200).send(result);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision mode start failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/revision/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const item = await (0, revisionService_1.getRevisionItemDetails)({
            userId: studentUserId,
            itemId: req.params.id,
        });
        if (!item) {
            return res.status(404).send({ message: 'Revision item not found.' });
        }
        return res.status(200).send(item);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.id }, '[Backend] Revision item detail failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/metacognition/event', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const eventType = safeString(req.body?.eventType).trim();
        if (!eventType) {
            return res.status(400).send({ message: 'eventType is required.' });
        }
        const event = await (0, metacognitionService_1.recordMetacognitiveEvent)({
            userId: studentUserId,
            sessionId: safeString(req.body?.sessionId).trim() || null,
            revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
            sourceMessageId: safeString(req.body?.sourceMessageId).trim() || null,
            eventType: eventType,
            confidence: (safeString(req.body?.confidence).trim() || null),
            problemFraming: (safeString(req.body?.problemFraming).trim() || null),
            errorType: (safeString(req.body?.errorType).trim() || null),
            strategyPreference: (safeString(req.body?.strategyPreference).trim() || null),
            transferReadiness: (safeString(req.body?.transferReadiness).trim() || null),
            note: safeString(req.body?.note).trim() || null,
            metadata: asRecord(req.body?.metadata) || null,
        });
        const profile = await (0, metacognitionService_1.getMetacognitiveProfile)(studentUserId);
        return res.status(201).send({
            event,
            profile,
            snapshot: (0, metacognitionService_1.mergeMetacognitiveSnapshot)(profile.recentSnapshot, {
                confidence: event.confidence || null,
                problemFraming: event.problemFraming || null,
                errorType: event.errorType || null,
                strategyPreference: event.strategyPreference || null,
                transferReadiness: event.transferReadiness || null,
                studentReflectionNote: event.note || null,
            }),
        });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Metacognition event failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/metacognition/profile', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send(await (0, metacognitionService_1.getMetacognitiveProfile)(req.user.id));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Metacognition profile failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/metacognition/prompt', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send({
            prompt: (0, metacognitionService_1.chooseMetacognitivePrompt)({
                userText: safeString(req.query?.message).trim(),
                tutorActionId: safeString(req.query?.tutorActionId).trim() || undefined,
                isRevision: req.query?.isRevision === 'true',
                isPracticePad: req.query?.isPracticePad === 'true',
                awaitingStudentAttempt: req.query?.awaitingStudentAttempt === 'true',
                afterMistake: req.query?.afterMistake === 'true',
                afterSuccess: req.query?.afterSuccess === 'true',
                currentErrorType: (safeString(req.query?.currentErrorType).trim() || null),
            }) || null,
        });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Metacognition prompt failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/practice-pad/check-step', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const result = await (0, practicePadService_1.checkPracticePadStep)({
            userId: req.user.id,
            payload: {
                sessionId: safeString(req.body?.sessionId).trim() || null,
                prompt: safeString(req.body?.prompt).trim() || null,
                workText: safeString(req.body?.workText),
                selectedStep: safeString(req.body?.selectedStep).trim() || null,
                topic: safeString(req.body?.topic).trim() || null,
                subject: safeString(req.body?.subject).trim() || null,
                supportChoice: (safeString(req.body?.supportChoice).trim() || null),
                stepFocus: (safeString(req.body?.stepFocus).trim() || null),
                reflection: (asRecord(req.body?.reflection) || null),
                sourceMessageId: safeString(req.body?.sourceMessageId).trim() || null,
            },
        });
        return res.status(200).send(result);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Practice Pad check-step failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/study-plans', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(201).send(await (0, studySupportService_1.createStudyPlan)({
            userId: req.user.id,
            scope: (safeString(req.body?.scope).trim() || 'weekly'),
            subject: safeString(req.body?.subject).trim() || null,
            topic: safeString(req.body?.topic).trim() || null,
            subjects: Array.isArray(req.body?.subjects) ? req.body.subjects.map((item) => safeString(item).trim()).filter(Boolean) : null,
            examFocus: Boolean(req.body?.examFocus),
        }));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Study plan create failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/study-plans', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const scopes = Array.isArray(req.query?.scope)
            ? req.query.scope.map((value) => safeString(value).trim()).filter(Boolean)
            : safeString(req.query?.scope).trim()
                ? [safeString(req.query?.scope).trim()]
                : undefined;
        return res.status(200).send({ plans: await (0, studySupportService_1.getStudyPlans)(req.user.id, scopes) });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Study plans failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/study-plans/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const details = await (0, studySupportService_1.getStudyPlanDetails)(req.user.id, req.params.id);
        if (!details)
            return res.status(404).send({ message: 'Study plan not found.' });
        return res.status(200).send(details);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id, planId: req.params.id }, '[Backend] Study plan detail failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/study-goals', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send({ goals: await (0, studySupportService_1.getStudyGoals)(req.user.id) });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Study goals failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.patch('/study-goals/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const goal = await (0, studySupportService_1.updateStudyGoal)({
            userId: req.user.id,
            goalId: req.params.id,
            patch: {
                status: safeString(req.body?.status).trim() ? req.body.status : undefined,
                currentCount: typeof req.body?.currentCount === 'number' ? req.body.currentCount : undefined,
            },
        });
        if (!goal)
            return res.status(404).send({ message: 'Study goal not found.' });
        return res.status(200).send({ goal });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id, goalId: req.params.id }, '[Backend] Study goal update failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/progress-summary', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const audience = safeString(req.query?.audience).trim() === 'teacher' ? 'teacher' : 'parent';
        return res.status(200).send(await (0, studySupportService_1.getSafeProgressSummary)(req.user.id, audience, safeString(req.query?.subject).trim() || undefined));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Progress summary failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/weak-topics', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send({ topics: await (0, studySupportService_1.getWeakTopics)(req.user.id, safeString(req.query?.subject).trim() || undefined) });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Weak topics failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/learning-profile', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send(await (0, studySupportService_1.getLearningProfile)(req.user.id));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Learning profile failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/academic-memory', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send({ entries: await (0, studySupportService_1.getAcademicMemory)(req.user.id) });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Academic memory failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/concept-dependencies', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send({
            dependencies: await (0, studySupportService_1.getConceptDependencies)(safeString(req.query?.subject).trim() || undefined, safeString(req.query?.topic).trim() || undefined),
        });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Concept dependencies failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/intervention-suggestions', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send({
            suggestions: await (0, studySupportService_1.getTutorInterventionSuggestions)(req.user.id, safeString(req.query?.subject).trim() || undefined, safeString(req.query?.topic).trim() || undefined),
        });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Intervention suggestions failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/tutor-policy', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send(await (0, studySupportService_1.getTutorPolicyDecision)(req.user.id, safeString(req.query?.subject).trim() || undefined, safeString(req.query?.topic).trim() || undefined));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Tutor policy failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/why-this-next', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send(await (0, studySupportService_1.getWhyThisNext)(req.user.id, safeString(req.query?.subject).trim() || undefined, safeString(req.query?.topic).trim() || undefined));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Why-this-next failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/intervention-effect', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(201).send(await (0, studySupportService_1.recordInterventionEffect)({
            userId: req.user.id,
            sessionId: safeString(req.body?.sessionId).trim() || null,
            subject: safeString(req.body?.subject).trim() || null,
            topic: safeString(req.body?.topic).trim() || null,
            interventionType: safeString(req.body?.interventionType).trim(),
            relatedRevisionItemId: safeString(req.body?.relatedRevisionItemId).trim() || null,
            outcome: (safeString(req.body?.outcome).trim() || null),
            metadata: asRecord(req.body?.metadata) || {},
        }));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Intervention effect record failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/intervention-effectiveness', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send({ summaries: await (0, studySupportService_1.getInterventionEffectiveness)(req.user.id) });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Intervention effectiveness failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/semester-plan', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(201).send(await (0, studySupportService_1.createSemesterPlan)({
            userId: req.user.id,
            scope: (safeString(req.body?.scope).trim() || 'semester'),
            subject: safeString(req.body?.subject).trim() || null,
            subjects: Array.isArray(req.body?.subjects) ? req.body.subjects.map((item) => safeString(item).trim()).filter(Boolean) : null,
            examFocus: Boolean(req.body?.examFocus),
        }));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Semester plan create failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/semester-plans', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send({ plans: await (0, studySupportService_1.getSemesterPlans)(req.user.id) });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Semester plans failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/semester-plans/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const details = await (0, studySupportService_1.getSemesterPlanDetails)(req.user.id, req.params.id);
        if (!details)
            return res.status(404).send({ message: 'Semester plan not found.' });
        return res.status(200).send(details);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id, planId: req.params.id }, '[Backend] Semester plan detail failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/mastery-pathway', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send(await (0, studySupportService_1.getMasteryPathway)(req.user.id, safeString(req.query?.subject).trim() || undefined, safeString(req.query?.topic).trim() || undefined));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Mastery pathway failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/school-safe-report', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        return res.status(200).send(await (0, studySupportService_1.getSchoolSafeReport)(req.user.id, safeString(req.query?.subject).trim() || undefined));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] School-safe report failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/research', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const query = safeString(req.body?.query || req.body?.message).trim();
        if (!query) {
            return res.status(400).send({ message: 'A research query is required.' });
        }
        const sessionId = safeString(req.body?.sessionId).trim() || null;
        let activeTopic = safeString(req.body?.topic).trim() || null;
        if (sessionId && !activeTopic) {
            const session = await prismaClient_1.default.chatSession.findFirst({
                where: { id: sessionId, studentId: studentUserId },
                select: { topic: true, metadata: true },
            });
            activeTopic =
                safeString(session?.topic).trim() ||
                    safeString(getTutorStateFromMetadata(session?.metadata).activeTopic).trim() ||
                    null;
        }
        const chatHistory = Array.isArray(req.body?.chatHistory)
            ? req.body.chatHistory
                .map((entry) => ({
                role: safeString(entry?.role).trim() || 'user',
                content: safeString(entry?.content),
            }))
                .filter((entry) => Boolean(entry.content.trim()))
                .slice(-24)
            : [];
        const response = await (0, researchModeService_1.runResearchMode)({
            query,
            activeTopic,
            forceWebSearch: req.body?.forceWebSearch === true,
            chatHistory,
        });
        if (sessionId) {
            const session = await prismaClient_1.default.chatSession.findFirst({
                where: { id: sessionId, studentId: studentUserId },
                select: { id: true, metadata: true },
            });
            if (session) {
                const conversationState = buildEffectiveConversationState(session.metadata, null);
                const tutorState = getTutorStateFromMetadata(session.metadata);
                const topVideo = response.recommendedVideo;
                const mergedMetadata = mergeSessionMetadata({
                    existing: session.metadata,
                    conversationState: {
                        ...conversationState,
                        researchModeActive: response.mode === 'web_research',
                        lastStudyTopic: activeTopic || conversationState.lastStudyTopic || query,
                        lastSearchTopic: response.mode === 'web_research'
                            ? [query, ...(conversationState.lastSearchTopic || [])].filter(Boolean).slice(0, 6)
                            : conversationState.lastSearchTopic,
                    },
                    tutorState: {
                        ...tutorState,
                        activeTopic: activeTopic || tutorState.activeTopic,
                        activeVideoId: topVideo?.videoId || tutorState.activeVideoId,
                        activeVideoTitle: topVideo?.title || tutorState.activeVideoTitle,
                        activeVideoWhyRecommended: topVideo?.whyRecommended || tutorState.activeVideoWhyRecommended,
                        updatedAt: new Date().toISOString(),
                    },
                    systemNotices: response.notices.map((notice) => createSystemNotice(notice.code, notice.message, notice.severity === 'warning' ? 'warning' : 'info')),
                });
                await prismaClient_1.default.chatSession.update({
                    where: { id: session.id },
                    data: { metadata: mergedMetadata, updatedAt: new Date() },
                });
            }
        }
        return res.status(200).send(response);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Research mode route failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/video-recommend', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const sessionId = safeString(req.body?.sessionId).trim() || null;
        const requestedTopic = safeString(req.body?.topic).trim() || null;
        const response = await (0, videoRecommendationService_1.recommendEducationalVideos)({
            query: safeString(req.body?.query || req.body?.message).trim() || null,
            topic: requestedTopic,
            subject: safeString(req.body?.subject).trim() || null,
            intent: (safeString(req.body?.intent).trim() || null),
            limit: Number(req.body?.limit || 3),
        });
        if (sessionId && response.videos.length > 0) {
            const session = await prismaClient_1.default.chatSession.findFirst({
                where: { id: sessionId, studentId: studentUserId },
                select: { id: true, metadata: true },
            });
            if (session) {
                const conversationState = buildEffectiveConversationState(session.metadata, null);
                const tutorState = getTutorStateFromMetadata(session.metadata);
                const topVideo = response.videos[0];
                const mergedMetadata = mergeSessionMetadata({
                    existing: session.metadata,
                    conversationState: {
                        ...conversationState,
                        videoSuggested: true,
                        lastStudyTopic: requestedTopic || conversationState.lastStudyTopic || topVideo.title,
                    },
                    tutorState: {
                        ...tutorState,
                        activeVideoId: topVideo.videoId,
                        activeVideoTitle: topVideo.title,
                        activeVideoWhyRecommended: topVideo.whyRecommended || tutorState.activeVideoWhyRecommended,
                        updatedAt: new Date().toISOString(),
                    },
                    systemNotices: (response.notices || []).map((notice) => createSystemNotice(notice.code, notice.message, notice.severity === 'warning' ? 'warning' : 'info')),
                });
                await prismaClient_1.default.chatSession.update({
                    where: { id: session.id },
                    data: { metadata: mergedMetadata, updatedAt: new Date() },
                });
            }
        }
        return res.status(200).send(response);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Video recommendation route failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/video/:id/context', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const videoId = safeString(req.params?.id).trim();
        if (!videoId) {
            return res.status(400).send({ message: 'A video id is required.' });
        }
        const sessionId = safeString(req.query?.sessionId).trim() || null;
        const fallbackTitle = safeString(req.query?.title).trim() || null;
        const fallbackTopic = safeString(req.query?.topic).trim() || null;
        const fallbackWhy = safeString(req.query?.whyRecommended).trim() || null;
        let sessionMetadata = null;
        let sessionTopic = null;
        if (sessionId) {
            const session = await prismaClient_1.default.chatSession.findFirst({
                where: { id: sessionId, studentId: studentUserId },
                select: { topic: true, metadata: true },
            });
            sessionMetadata = session?.metadata ?? null;
            sessionTopic = safeString(session?.topic).trim() || null;
        }
        const tutorState = getTutorStateFromMetadata(sessionMetadata);
        const response = await (0, videoRecommendationService_1.getVideoContextSummary)({
            videoId,
            title: fallbackTitle ||
                (safeString(tutorState.activeVideoId).trim() === videoId
                    ? safeString(tutorState.activeVideoTitle).trim()
                    : '') ||
                null,
            topic: fallbackTopic || safeString(tutorState.activeTopic).trim() || sessionTopic,
            whyRecommended: fallbackWhy || safeString(tutorState.activeVideoWhyRecommended).trim() || null,
        });
        if (sessionId && sessionMetadata) {
            const session = await prismaClient_1.default.chatSession.findFirst({
                where: { id: sessionId, studentId: studentUserId },
                select: { id: true, metadata: true },
            });
            if (session) {
                const conversationState = buildEffectiveConversationState(session.metadata, null);
                const existingTutorState = getTutorStateFromMetadata(session.metadata);
                const mergedMetadata = mergeSessionMetadata({
                    existing: session.metadata,
                    conversationState,
                    tutorState: {
                        ...existingTutorState,
                        activeVideoId: videoId,
                        activeVideoTitle: response.title || existingTutorState.activeVideoTitle,
                        activeVideoSummary: response.summary || existingTutorState.activeVideoSummary,
                        activeVideoConcepts: response.concepts.length > 0 ? response.concepts : existingTutorState.activeVideoConcepts,
                        activeVideoWhyRecommended: response.whyRecommended || existingTutorState.activeVideoWhyRecommended,
                        updatedAt: new Date().toISOString(),
                    },
                    systemNotices: (response.notices || []).map((notice) => createSystemNotice(notice.code, notice.message, notice.severity === 'warning' ? 'warning' : 'info')),
                });
                await prismaClient_1.default.chatSession.update({
                    where: { id: session.id },
                    data: { metadata: mergedMetadata, updatedAt: new Date() },
                });
            }
        }
        return res.status(200).send(response);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Video context route failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/learning-effect-event', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const eventType = safeString(req.body?.eventType).trim();
        if (!eventType) {
            return res.status(400).send({ message: 'eventType is required.' });
        }
        const event = await (0, learningEffectivenessService_1.recordLearningEffectEvent)({
            userId: req.user.id,
            sessionId: safeString(req.body?.sessionId).trim() || null,
            subject: safeString(req.body?.subject).trim() || null,
            topic: safeString(req.body?.topic).trim() || null,
            revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
            messageId: safeString(req.body?.messageId).trim() || null,
            eventType,
            outcome: safeString(req.body?.outcome).trim() || null,
            metadata: asRecord(req.body?.metadata) || null,
        });
        return res.status(201).send({ event });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Learning effect event route failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/effectiveness-summary', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        if (!(0, rbac_1.requireRole)(req, res, ['admin']))
            return;
        const days = Math.max(1, Math.min(Number(req.query?.days || 30), 180));
        const targetUserId = safeString(req.query?.studentId).trim() || req.user.id;
        return res.status(200).send(await (0, learningEffectivenessService_1.getLearningEffectivenessSummary)({ userId: targetUserId, days }));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Effectiveness summary route failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/constitution-health', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        if (!(0, rbac_1.requireRole)(req, res, ['admin']))
            return;
        const days = Math.max(1, Math.min(Number(req.query?.days || 30), 180));
        const targetUserId = safeString(req.query?.studentId).trim() || req.user.id;
        return res.status(200).send(await (0, constitutionHealthService_1.getProductConstitutionHealth)({ userId: targetUserId, days }));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Constitution health route failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/founder-truth', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        if (!(0, rbac_1.requireRole)(req, res, ['admin']))
            return;
        const days = Math.max(1, Math.min(Number(req.query?.days || 30), 180));
        const targetUserId = safeString(req.query?.studentId).trim() || req.user.id;
        return res.status(200).send(await (0, founderTruthService_1.getFounderTruthSummary)({ userId: targetUserId, days }));
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Founder truth route failed');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/artifacts/parse', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const rawFileData = req.body?.fileData;
        const attachments = Array.isArray(rawFileData) ? rawFileData.filter(Boolean) : rawFileData ? [rawFileData] : [];
        if (attachments.length === 0) {
            return res.status(400).send({ message: 'fileData is required.' });
        }
        const artifacts = await buildTutorArtifactsFromUploads({
            attachments,
            userText: safeString(req.body?.prompt || req.body?.message || ''),
        });
        const systemNotices = buildArtifactSystemNotices({ attachments, artifacts });
        if (safeString(req.body?.sessionId)) {
            const studentUserId = req.user.id;
            const session = await prismaClient_1.default.chatSession.findFirst({
                where: { id: safeString(req.body.sessionId), studentId: studentUserId },
                select: { id: true, metadata: true },
            });
            if (session) {
                const mergedMetadata = mergeSessionMetadata({
                    existing: session.metadata,
                    conversationState: buildEffectiveConversationState(session.metadata, null),
                    tutorArtifacts: artifacts,
                    tutorState: {
                        ...getTutorStateFromMetadata(session.metadata),
                        activeArtifactLabels: artifacts.map((artifact) => artifact.label),
                        activeArtifactSummary: artifacts.map((artifact) => artifact.summary).join(' '),
                        updatedAt: new Date().toISOString(),
                    },
                    systemNotices,
                });
                await prismaClient_1.default.chatSession.update({
                    where: { id: session.id },
                    data: { metadata: mergedMetadata, updatedAt: new Date() },
                });
            }
        }
        return res.status(200).send({ artifacts, systemNotices });
    }
    catch (error) {
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/safety/alerts', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const viewerRole = (0, rbac_1.requireRole)(req, res, ['admin', 'counselor']);
        if (!viewerRole)
            return;
        if (!prismaAny?.safetyAlert) {
            return res.status(503).send({ message: 'Safety alerts are not configured yet.' });
        }
        const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
        const status = safeString(req.query.status);
        const severity = safeString(req.query.severity);
        const studentIdFilter = viewerRole === 'admin' ? safeString(req.query.studentId) : '';
        const where = {};
        if (status)
            where.status = status;
        if (severity)
            where.severity = severity;
        if (studentIdFilter)
            where.studentId = studentIdFilter;
        if (viewerRole === 'counselor') {
            where.severity = { in: ['high', 'critical'] };
        }
        const alerts = await prismaAny.safetyAlert.findMany({
            where,
            orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
            take: limit,
        });
        await logSafetyAuditEvent({
            actorId: req.user.id,
            actorRole: viewerRole,
            action: 'safety_alerts_list',
            targetType: 'safety_alert',
            metadata: { count: alerts.length },
        });
        return res.status(200).send({ viewerRole, alerts });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error) }, '[Safety] Failed to fetch alerts list.');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/safety/alerts/:id', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const viewerRole = (0, rbac_1.requireRole)(req, res, ['admin', 'counselor']);
        if (!viewerRole)
            return;
        if (!prismaAny?.safetyAlert) {
            return res.status(503).send({ message: 'Safety alerts are not configured yet.' });
        }
        const alert = await prismaAny.safetyAlert.findUnique({ where: { id: req.params.id } });
        if (!alert)
            return res.status(404).send({ message: 'Alert not found.' });
        if (viewerRole === 'counselor' && !HIGH_RISK_SEVERITIES.has(String(alert.severity || ''))) {
            return res.status(403).send({ message: 'Forbidden' });
        }
        let contextMessages = [];
        if (alert.sessionId) {
            if (alert.messageId) {
                const anchor = await prismaClient_1.default.chatMessage.findUnique({
                    where: { id: alert.messageId },
                    select: { messageNumber: true, sessionId: true },
                });
                if (anchor?.messageNumber) {
                    contextMessages = await prismaClient_1.default.chatMessage.findMany({
                        where: {
                            sessionId: alert.sessionId,
                            messageNumber: {
                                gte: Math.max(1, anchor.messageNumber - 4),
                                lte: anchor.messageNumber + 8,
                            },
                        },
                        orderBy: { messageNumber: 'asc' },
                    });
                }
            }
            if (contextMessages.length === 0) {
                contextMessages = await prismaClient_1.default.chatMessage.findMany({
                    where: { sessionId: alert.sessionId },
                    orderBy: { timestamp: 'desc' },
                    take: 20,
                });
                contextMessages = [...contextMessages].reverse();
            }
        }
        await logSafetyAuditEvent({
            actorId: req.user.id,
            actorRole: viewerRole,
            action: 'safety_alerts_view',
            targetType: 'safety_alert',
            targetId: alert.id,
            metadata: { sessionId: alert.sessionId || null },
        });
        return res.status(200).send({
            viewerRole,
            alert,
            contextMessages: contextMessages.map((msg) => ({
                ...msg,
                timestamp: msg.timestamp?.toISOString ? msg.timestamp.toISOString() : msg.timestamp,
                videoData: deriveVideoDataFromMessage(msg),
                sources: extractSources(msg.metadata),
            })),
        });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), alertId: req.params.id }, '[Safety] Failed to fetch alert detail.');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.patch('/safety/alerts/:id/status', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const viewerRole = (0, rbac_1.requireRole)(req, res, ['admin', 'counselor']);
        if (!viewerRole)
            return;
        if (!prismaAny?.safetyAlert) {
            return res.status(503).send({ message: 'Safety alerts are not configured yet.' });
        }
        const nextStatus = safeString(req.body?.status).toLowerCase();
        const allowedStatus = new Set(['open', 'reviewing', 'resolved', 'dismissed']);
        if (!allowedStatus.has(nextStatus)) {
            return res.status(400).send({ message: 'Invalid status' });
        }
        const updated = await prismaAny.safetyAlert.update({
            where: { id: req.params.id },
            data: {
                status: nextStatus,
                metadata: {
                    updatedBy: req.user.id,
                    updatedByRole: viewerRole,
                    note: safeString(req.body?.note),
                },
            },
        });
        await logSafetyAuditEvent({
            actorId: req.user.id,
            actorRole: viewerRole,
            action: 'safety_alerts_status_update',
            targetType: 'safety_alert',
            targetId: req.params.id,
            metadata: { status: nextStatus },
        });
        return res.status(200).send({
            message: 'Safety alert updated.',
            alert: updated,
        });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), alertId: req.params.id }, '[Safety] Failed to update alert status.');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/safety/chats', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const viewerRole = (0, rbac_1.requireRole)(req, res, ['admin']);
        if (!viewerRole)
            return;
        const sessionId = safeString(req.query.sessionId);
        const studentId = safeString(req.query.studentId);
        const query = safeString(req.query.q);
        const limit = Math.max(1, Math.min(200, Number(req.query.limit || 100)));
        if (sessionId) {
            const session = await prismaClient_1.default.chatSession.findFirst({
                where: { id: sessionId, ...(studentId ? { studentId } : {}) },
                include: { messages: { orderBy: { timestamp: 'asc' } } },
            });
            if (!session)
                return res.status(404).send({ message: 'Session not found.' });
            await logSafetyAuditEvent({
                actorId: req.user.id,
                actorRole: viewerRole,
                action: 'safety_chats_session_view',
                targetType: 'chat_session',
                targetId: session.id,
            });
            return res.status(200).send({
                viewerRole,
                session: {
                    id: session.id,
                    studentId: session.studentId,
                    topic: session.topic,
                    createdAt: session.createdAt.toISOString(),
                    updatedAt: session.updatedAt.toISOString(),
                },
                messages: session.messages.map((msg) => ({
                    ...msg,
                    timestamp: msg.timestamp.toISOString(),
                    videoData: deriveVideoDataFromMessage(msg),
                    sources: extractSources(msg.metadata),
                    image: deriveImageFromMessage(msg),
                })),
            });
        }
        const where = {};
        if (query)
            where.content = { contains: query, mode: 'insensitive' };
        if (studentId)
            where.chatSession = { studentId };
        const messages = await prismaClient_1.default.chatMessage.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit,
            include: {
                chatSession: {
                    select: { id: true, studentId: true, topic: true, updatedAt: true },
                },
            },
        });
        await logSafetyAuditEvent({
            actorId: req.user.id,
            actorRole: viewerRole,
            action: 'safety_chats_list',
            targetType: 'chat_message',
            metadata: { count: messages.length, query: query || null, studentId: studentId || null },
        });
        return res.status(200).send({
            viewerRole,
            messages: messages.map((msg) => ({
                id: msg.id,
                sessionId: msg.sessionId,
                role: msg.role,
                content: msg.content,
                messageNumber: msg.messageNumber,
                timestamp: msg.timestamp.toISOString(),
                studentId: msg.chatSession?.studentId,
                sessionTopic: msg.chatSession?.topic || '',
                videoData: deriveVideoDataFromMessage(msg),
                sources: extractSources(msg.metadata),
                image: deriveImageFromMessage(msg),
            })),
        });
    }
    catch (error) {
        logger_1.logger.error({ error: String(error) }, '[Safety] Failed to fetch chat viewer data.');
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/session/:id/delete', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const { count } = await prismaClient_1.default.chatSession.deleteMany({
            where: { id: req.params.id, studentId: req.user.id }
        });
        if (count === 0)
            return res.status(404).send({ message: 'Session not found' });
        res.status(200).send({ message: 'Session deleted' });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/search', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { q: query, mode = 'hybrid' } = req.query;
        if (!query)
            return res.status(400).send({ message: 'Query required' });
        let results = [];
        const promises = [];
        if (mode === 'keyword' || mode === 'hybrid') {
            promises.push(prismaClient_1.default.chatSession.findMany({
                where: {
                    studentId,
                    messages: { some: {} },
                    OR: [
                        { topic: { contains: query, mode: 'insensitive' } },
                        { messages: { some: { content: { contains: query, mode: 'insensitive' } } } }
                    ]
                },
                select: { id: true, topic: true, updatedAt: true },
                take: 10
            }).then(sess => sess.map(s => ({ ...s, source: 'keyword', relevance: 0.5 }))));
        }
        if ((mode === 'semantic' || mode === 'hybrid') && pineconeIndex) {
            promises.push(openai.embeddings.create({ model: 'text-embedding-ada-002', input: query })
                .then(async (emb) => {
                const vec = emb.data[0].embedding;
                const matches = await pineconeIndex.query({
                    vector: vec, topK: 10, filter: { studentId: { $eq: studentId } }
                });
                const ids = matches.matches?.map(m => m.id) || [];
                if (ids.length === 0)
                    return [];
                const sessions = await prismaClient_1.default.chatSession.findMany({ where: { id: { in: ids } }, select: { id: true, topic: true, updatedAt: true } });
                return sessions.map(s => ({ ...s, source: 'semantic', relevance: 0.8 }));
            }));
        }
        const searchResults = await Promise.all(promises);
        const unique = Array.from(new Map(searchResults.flat().map(item => [item.id, item])).values());
        res.status(200).send(unique.slice(0, 10));
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/preferences', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    logger_1.logger.debug({ userId: req.user?.id }, '[API] /preferences hit');
    try {
        const [prefs, metadata] = await Promise.all([
            (0, aiPreferenceService_1.getOrCreateCopilotPreferences)(req.user.id),
            getCopilotPreferencesMetadata(req.user.id),
        ]);
        const preferredLanguage = normalizeVoiceLanguageMode(prefs?.preferredLanguage);
        const interests = Array.isArray(prefs?.interests)
            ? prefs.interests.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
            : [];
        const sessionLanguageState = normalizeSessionLanguageState(metadata.sessionLanguageState, preferredLanguage);
        res.status(200).json({
            ...prefs,
            preferredLanguage,
            interests,
            sessionLanguageState,
        });
    }
    catch (error) {
        res.status(500).send({ message: 'Error fetching preferences', details: String(error) });
    }
});
router.post('/preferences/update', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const preferredLanguage = normalizeVoiceLanguageMode(req.body?.preferredLanguage);
        const interestsRaw = Array.isArray(req.body?.interests) ? req.body.interests : [];
        const interests = interestsRaw
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, MAX_INTERESTS);
        const existingMetadata = await getCopilotPreferencesMetadata(studentId);
        const sessionLanguageState = normalizeSessionLanguageState(req.body?.sessionLanguageState, preferredLanguage, existingMetadata.sessionLanguageState?.lastDetectedInputLanguage || null);
        const saved = await prismaClient_1.default.copilotPreferences.upsert({
            where: { userId: studentId },
            update: { preferredLanguage, interests: interests },
            create: { userId: studentId, preferredLanguage, interests: interests },
        });
        await updateCopilotPreferencesMetadata(studentId, {
            ...existingMetadata,
            sessionLanguageState,
        });
        const redis = await (0, redis_1.getRedisClient)();
        if (redis)
            await redis.del(`copilot:preferences:${studentId}`);
        res.status(200).json({
            message: 'Preferences updated',
            preferredLanguage: normalizeVoiceLanguageMode(saved.preferredLanguage),
            interests: Array.isArray(saved.interests) ? saved.interests : [],
            lastUpdatedAt: saved.lastUpdatedAt,
            sessionLanguageState,
        });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/memory/student', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const memory = await getStudentMemoryPayload(studentId);
        res.status(200).send(memory);
    }
    catch (error) {
        logger_1.logger.error({ err: error, userId: req.user?.id }, '[API] /memory/student failed');
        res.status(500).send({ message: 'Error' });
    }
});
router.post('/memory/update', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const type = safeString(req.body?.type);
        const data = req.body?.data;
        const studentId = req.user.id;
        if (!data || (type !== 'progress' && type !== 'mistake')) {
            return res.status(400).send({ message: 'Invalid memory update payload' });
        }
        if (type === 'progress') {
            await prismaClient_1.default.progress.upsert({ where: { id: data.id || 'new' }, create: { ...data, studentId }, update: data });
        }
        else if (type === 'mistake') {
            await prismaClient_1.default.mistake.create({ data: { ...data, studentId } });
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (redis)
            await redis.del(`memory:${studentId}`);
        res.status(200).send({ message: 'Updated' });
    }
    catch (e) {
        res.status(500).send({ message: 'Error' });
    }
});
router.post('/memory/mastery/upsert', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const subject = safeString(req.body?.subject).trim();
        const topic = safeString(req.body?.topic).trim();
        const misconception = safeString(req.body?.misconception).trim();
        const mastery = Math.max(0, Math.min(100, Number(req.body?.mastery || 0)));
        if (!subject || !topic) {
            return res.status(400).send({ message: 'subject and topic are required.' });
        }
        const existingProgress = await prismaClient_1.default.progress.findFirst({
            where: { studentId, subject, topic },
            orderBy: { updatedAt: 'desc' },
        });
        const progress = existingProgress
            ? await prismaClient_1.default.progress.update({
                where: { id: existingProgress.id },
                data: { mastery },
            })
            : await prismaClient_1.default.progress.create({
                data: { studentId, subject, topic, mastery },
            });
        let mistake = null;
        if (misconception) {
            const existingMistake = await prismaClient_1.default.mistake.findFirst({
                where: { studentId, topic, error: misconception },
                orderBy: { lastSeen: 'desc' },
            });
            mistake = existingMistake
                ? await prismaClient_1.default.mistake.update({
                    where: { id: existingMistake.id },
                    data: { attempts: { increment: 1 }, lastSeen: new Date() },
                })
                : await prismaClient_1.default.mistake.create({
                    data: { studentId, topic, error: misconception, attempts: 1 },
                });
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (redis) {
            await redis.del(`memory:${studentId}`);
        }
        return res.status(200).send({ progress, mistake });
    }
    catch (error) {
        return res.status(500).send({ message: 'Error' });
    }
});
// ============================================================================
// 🎙️ VOICE USAGE QUOTA (DB-Backed)
// ============================================================================
router.get('/document/quota', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const quota = await getDocumentQuotaState(studentId);
        return res.status(200).send(quota);
    }
    catch {
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/document/consume', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const kind = safeString(req.body?.documentKind || req.body?.kind).toLowerCase();
        if (!isDocumentKind(kind)) {
            return res.status(400).send({ message: 'Unsupported document kind.' });
        }
        const quota = await consumeDocumentQuota(studentId);
        if (!quota.allowed) {
            return res.status(429).send({
                message: 'Daily document limit reached (2 per 24 hours).',
                ...quota,
            });
        }
        return res.status(200).send({
            message: 'Document quota consumed.',
            ...quota,
        });
    }
    catch {
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/voice/balance', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const summary = await (0, voiceLedgerService_1.getVoiceBalanceSummary)(studentId);
        res.status(200).send({
            studentId: summary.studentId,
            remainingSeconds: summary.remainingSeconds,
            remainingMinutesRoundedDown: summary.remainingMinutesRoundedDown,
            display: summary.display,
        });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/voice/session/start', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const chatSessionId = safeString(req.body?.chatSessionId || '') || null;
        const metadata = req.body?.metadata;
        const started = await (0, voiceLedgerService_1.startVoiceSession)({ studentId, chatSessionId, metadata });
        if (!started.allowed) {
            return res.status(402).send({
                allowed: false,
                reason: started.reason,
                remainingSeconds: started.remainingSeconds,
                message: 'Voice time finished'
            });
        }
        return res.status(200).send({
            allowed: true,
            sessionUsageId: started.sessionUsageId,
            mode: started.mode,
            remainingSeconds: started.remainingSeconds,
        });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/voice/session/stop', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const sessionUsageId = safeString(req.body?.sessionUsageId);
        if (!sessionUsageId) {
            return res.status(400).send({ message: 'sessionUsageId is required.' });
        }
        const result = await (0, voiceLedgerService_1.stopVoiceSession)({
            studentId,
            sessionUsageId,
            stopReason: safeString(req.body?.stopReason),
            listeningSecondsUsed: Number(req.body?.listeningSecondsUsed || 0),
            ttsSecondsUsed: Number(req.body?.ttsSecondsUsed || 0),
            metadata: req.body?.metadata,
        });
        return res.status(200).send({
            sessionUsageId: result.sessionUsageId,
            billedSeconds: result.billedSeconds,
            remainingSeconds: result.remainingSeconds,
            reason: result.stopReason,
            mode: result.mode,
        });
    }
    catch (error) {
        const message = String(error?.message || '');
        if (message.includes('Voice session not found')) {
            return res.status(404).send({ message: 'Voice session not found.' });
        }
        return res.status(500).send({ message: 'Internal server error' });
    }
});
router.get('/voice/quota', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { start, end } = getVoiceDayRange();
        const [summary, dailySessions] = await Promise.all([
            (0, voiceLedgerService_1.getVoiceBalanceSummary)(studentId),
            prismaClient_1.default.voiceSessionUsage.findMany({
                where: { studentId, startedAt: { gte: start, lte: end } },
                select: { billedSeconds: true },
                orderBy: { startedAt: 'asc' }
            })
        ]);
        const count = dailySessions.length;
        const seconds = dailySessions.reduce((sum, s) => sum + (s.billedSeconds || 0), 0);
        const bonusSeconds = dailySessions
            .slice(MAX_VOICE_SESSIONS_PER_DAY)
            .reduce((sum, s) => sum + (s.billedSeconds || 0), 0);
        const quota = computeVoiceQuota({ count, seconds, bonusSeconds });
        res.status(200).send({
            date: new Date().toISOString().slice(0, 10),
            count,
            seconds,
            bonusSeconds,
            remainingBalanceSeconds: summary.remainingSeconds,
            ...quota,
        });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
router.post('/voice/usage', schoolAuthMiddleware_1.schoolAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const durationRaw = Number(req.body?.durationSec);
        if (!Number.isFinite(durationRaw) || durationRaw <= 0) {
            return res.status(400).send({ message: 'Duration required.' });
        }
        const durationSec = Math.ceil(durationRaw);
        const startedAtRaw = req.body?.startedAt;
        const startedAt = startedAtRaw ? new Date(startedAtRaw) : new Date();
        const sessionId = safeString(req.body?.sessionId || '') || null;
        const source = safeString(req.body?.source || '');
        const started = await (0, voiceLedgerService_1.startVoiceSession)({
            studentId,
            chatSessionId: sessionId,
            metadata: { source: source || 'legacy-usage', startedAt: Number.isNaN(startedAt.getTime()) ? new Date().toISOString() : startedAt.toISOString() }
        });
        if (!started.allowed || !started.sessionUsageId) {
            return res.status(429).send({ message: "You've used today's voice time. Try again tomorrow." });
        }
        const stopped = await (0, voiceLedgerService_1.stopVoiceSession)({
            studentId,
            sessionUsageId: started.sessionUsageId,
            stopReason: 'user_stop',
            listeningSecondsUsed: durationSec,
            ttsSecondsUsed: 0,
            metadata: { source: source || 'legacy-usage' }
        });
        res.status(200).send({ ok: true, recordId: stopped.sessionUsageId, billedSeconds: stopped.billedSeconds, remainingSeconds: stopped.remainingSeconds });
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});
// ============================================================================
// 🎯 CONVERSATIONAL VOICE ENDPOINT (STT -> AI STREAM -> SENTENCE TTS)
// ============================================================================
router.post('/voice-chat', schoolAuthMiddleware_1.schoolAuthMiddleware, sttLimiter, upload.single('audio'), async (req, res) => {
    logger_1.logger.info({ userId: req.user?.id }, '[API] /voice-chat hit');
    if (!req.file)
        return res.status(400).send({ message: 'Audio required' });
    const audioFilePath = req.file.path;
    try {
        const studentId = req.user.id;
        if (!(await ensureVoiceTimeAvailable(studentId, res)))
            return;
        const { sessionId, conversationState } = req.body;
        const incomingVoiceConversationState = parseMaybeJsonRecord(conversationState);
        const incomingVoiceLanguageState = parseMaybeJsonRecord(req.body?.sessionLanguageState);
        const incomingVoiceMetacognitiveState = (parseMaybeJsonRecord(req.body?.metacognitiveState) || null);
        const requestVoiceMode = normalizeVoiceLanguageMode(incomingVoiceLanguageState?.preferredLanguageMode || req.body?.languageMode);
        // 1. STT - Transcribe User Audio
        const transcription = await openai.audio.transcriptions.create({
            file: fs_1.default.createReadStream(audioFilePath),
            model: 'whisper-1',
            language: toWhisperLanguage(requestVoiceMode),
            prompt: buildSttPrompt(requestVoiceMode),
            temperature: 0,
        });
        fs_1.default.unlinkSync(audioFilePath);
        const userText = transcription.text;
        const detectedInputLanguage = detectInputLanguage(userText);
        logger_1.logger.info({ userText }, '[VoiceChat] User Transcribed');
        const [session, preferences, preferenceMetadata] = await Promise.all([
            prismaClient_1.default.chatSession.findUnique({
                where: { id: sessionId },
                include: {
                    student: { select: { name: true, gradeLevel: true, userId: true } },
                    messages: { orderBy: { timestamp: 'asc' }, take: 60 }
                }
            }),
            (0, aiPreferenceService_1.getOrCreateCopilotPreferences)(studentId),
            getCopilotPreferencesMetadata(studentId),
        ]);
        if (!session)
            throw new Error('Session not found');
        const effectiveVoiceSessionLanguageState = normalizeSessionLanguageState(incomingVoiceLanguageState || preferenceMetadata.sessionLanguageState, preferences?.preferredLanguage, detectedInputLanguage);
        const effectiveVoiceMode = normalizeVoiceLanguageMode(effectiveVoiceSessionLanguageState.preferredLanguageMode || preferences?.preferredLanguage || req.body?.languageMode);
        const effectiveVoiceState = buildEffectiveConversationState(session.metadata, incomingVoiceConversationState);
        const studentMemory = await getStudentMemoryPayload(studentId);
        const priorTutorState = getTutorStateFromMetadata(session.metadata);
        const priorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
        const metacognitiveProfile = await (0, metacognitionService_1.getMetacognitiveProfile)(studentId);
        const mergedMetacognitiveState = (0, metacognitionService_1.mergeMetacognitiveSnapshot)(metacognitiveProfile.recentSnapshot, incomingVoiceMetacognitiveState);
        // 2. Prep Stream
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        // Send original transcription to UI
        res.write(`data: ${JSON.stringify({
            type: 'transcription',
            content: userText,
            detectedInputLanguage,
            preferredResponseLanguage: effectiveVoiceSessionLanguageState.preferredResponseLanguage,
        })}\n\n`);
        const preAiSemanticSnapshot = buildSemanticSessionSnapshot([
            ...session.messages.map((message) => ({
                role: message.role,
                content: message.content,
                metadata: message.metadata,
            })),
            {
                role: 'user',
                content: userText,
                metadata: {
                    language: buildMessageLanguageMetadata({
                        text: userText,
                        sessionLanguageState: effectiveVoiceSessionLanguageState,
                        detectedInputLanguage,
                    }),
                    metacognition: mergedMetacognitiveState,
                },
            },
        ]);
        const provisionalTutorState = buildLearnerTutorState({
            priorTutorState,
            state: effectiveVoiceState,
            topic: safeString(effectiveVoiceState?.lastStudyTopic ||
                effectiveVoiceState?.lastTopic ||
                session.topic ||
                userText).trim() || undefined,
            artifacts: priorArtifacts,
            lastIntent: 'voice_study_turn',
            memory: studentMemory,
            semanticSnapshot: preAiSemanticSnapshot,
            sessionLanguageState: effectiveVoiceSessionLanguageState,
            metacognitiveState: mergedMetacognitiveState,
            preferredSupportPatterns: metacognitiveProfile.preferredSupportPatterns || undefined,
        });
        let fullAiResponse = '';
        let sentenceBuffer = '';
        let streamedVoiceChunkCount = 0;
        const FIRST_VOICE_CHUNK_MIN = 24;
        const FIRST_VOICE_CHUNK_MAX = 170;
        const NEXT_VOICE_CHUNK_MIN = 70;
        const NEXT_VOICE_CHUNK_MAX = 280;
        let ttsDispatchChain = Promise.resolve();
        // Function to Synthesize and Stream Audio Chunk
        const synthAndStream = async (text) => {
            try {
                const mp3 = await openai.audio.speech.create({
                    model: DEFAULT_TTS_MODEL,
                    voice: DEFAULT_TTS_VOICE,
                    input: sanitizeTtsInput(text, effectiveVoiceMode),
                    instructions: buildTtsInstruction(effectiveVoiceMode),
                    response_format: 'mp3',
                });
                const buffer = Buffer.from(await mp3.arrayBuffer());
                res.write(`data: ${JSON.stringify({ type: 'audio', content: buffer.toString('base64') })}\n\n`);
            }
            catch (e) {
                logger_1.logger.error({ error: String(e) }, '[VoiceChat] TTS Chunk Error');
            }
        };
        const pickWhitespaceCut = (source, maxChars, minChars) => {
            const capped = source.slice(0, maxChars);
            const whitespaceCut = Math.max(capped.lastIndexOf(' '), capped.lastIndexOf('\n'));
            return whitespaceCut >= minChars ? whitespaceCut : capped.length;
        };
        const popSpeakableChunk = (forceTail = false) => {
            const source = sentenceBuffer;
            if (!source.trim())
                return null;
            if (forceTail) {
                sentenceBuffer = '';
                return source.trim();
            }
            const isFirst = streamedVoiceChunkCount === 0;
            const minChars = isFirst ? FIRST_VOICE_CHUNK_MIN : NEXT_VOICE_CHUNK_MIN;
            const maxChars = isFirst ? FIRST_VOICE_CHUNK_MAX : NEXT_VOICE_CHUNK_MAX;
            const capped = source.slice(0, maxChars);
            const sentenceRegex = /[^.!?\u061F]+[.!?\u061F]+(?:\s+|$)/g;
            let selectedEnd = 0;
            let match = null;
            while ((match = sentenceRegex.exec(capped)) !== null) {
                const end = (match.index || 0) + match[0].length;
                if (end >= minChars)
                    selectedEnd = end;
            }
            if (selectedEnd <= 0) {
                if (!isFirst || source.trim().length < 120)
                    return null;
                selectedEnd = pickWhitespaceCut(source, maxChars, minChars);
            }
            while (selectedEnd < source.length && /\s/.test(source[selectedEnd] || '')) {
                selectedEnd += 1;
            }
            const chunk = source.slice(0, selectedEnd).trim();
            sentenceBuffer = source.slice(selectedEnd).trimStart();
            return chunk || null;
        };
        const queueSynthChunk = (chunk) => {
            if (!chunk)
                return;
            streamedVoiceChunkCount += 1;
            ttsDispatchChain = ttsDispatchChain
                .then(() => synthAndStream(chunk))
                .catch((error) => {
                logger_1.logger.error({ error: String(error) }, '[VoiceChat] queued TTS chunk failed');
            });
        };
        // 3. AI Stream + Sentence Buffer TTS
        const emotionalAICopilot = await getEmotionalAICopilot();
        const aiResult = await emotionalAICopilot({
            text: userText,
            chatHistory: trimHistoryForModel(session.messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
                image: deriveImageFromMessage(m),
                videoData: deriveVideoDataFromMessage(m) || undefined,
                metadata: (m.metadata ?? null),
            }))),
            state: effectiveVoiceState,
            tutorState: provisionalTutorState,
            studentProfile: { name: session.student.name || 'Student', gradeLevel: session.student.gradeLevel || 'Primary' },
            preferences: { preferredLanguage: preferences.preferredLanguage, interests: preferences.interests },
            sessionLanguageState: effectiveVoiceSessionLanguageState,
            metacognitiveState: mergedMetacognitiveState,
            memory: studentMemory,
            currentTitle: session.topic || undefined,
            onToken: (token) => {
                fullAiResponse += token;
                sentenceBuffer += token;
                // Push token to UI for text rendering
                res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
                while (true) {
                    const nextChunk = popSpeakableChunk(false);
                    if (!nextChunk)
                        break;
                    queueSynthChunk(nextChunk);
                }
            }
        });
        // Handle remaining sentence
        if (sentenceBuffer.trim().length > 0) {
            const tailChunk = popSpeakableChunk(true);
            if (tailChunk)
                queueSynthChunk(tailChunk);
        }
        await ttsDispatchChain;
        // 4. Persistence (Post-Stream)
        const savedVoiceUserMessage = await prismaClient_1.default.chatMessage.create({
            data: {
                sessionId,
                role: 'user',
                content: userText,
                timestamp: new Date(),
                messageNumber: session.messages.length + 1,
                metadata: toPrismaMetadata({
                    language: buildMessageLanguageMetadata({
                        text: userText,
                        sessionLanguageState: effectiveVoiceSessionLanguageState,
                        detectedInputLanguage,
                    }),
                    metacognition: mergedMetacognitiveState,
                }),
            }
        });
        await createSafetyAlertIfNeeded({
            studentId,
            sessionId,
            messageId: savedVoiceUserMessage.id,
            text: userText,
            source: 'voice_chat',
        });
        const safeSources = sanitizeSources(aiResult.sources);
        const systemNotices = buildChatSystemNotices({
            attachmentNotices: [],
            safeSources,
            forceWebSearch: false,
            hasVideo: Boolean(aiResult.videoData?.id),
            videoSnapshot: undefined,
            userText,
            tutorState: provisionalTutorState,
        });
        const postAiSemanticSnapshot = buildSemanticSessionSnapshot([
            ...session.messages.map((message) => ({
                role: message.role,
                content: message.content,
                metadata: message.metadata,
            })),
            { role: 'user', content: userText },
            {
                role: 'model',
                content: fullAiResponse || aiResult.processedText,
                metadata: {
                    sources: safeSources,
                    videoData: aiResult.videoData,
                    tutorArtifacts: priorArtifacts,
                    language: buildMessageLanguageMetadata({
                        text: userText,
                        sessionLanguageState: effectiveVoiceSessionLanguageState,
                        detectedInputLanguage,
                    }),
                    metacognition: mergedMetacognitiveState,
                },
            },
        ]);
        const videoSnapshot = await getOrBuildVideoTutorSnapshot({
            videoData: aiResult.videoData,
            activeTopic: safeString(aiResult.topic || session.topic || userText).trim() || undefined,
            whyRecommended: fullAiResponse || aiResult.processedText,
            priorTutorState,
        });
        const tutorState = buildLearnerTutorState({
            priorTutorState,
            state: aiResult.state,
            topic: safeString(aiResult.topic || aiResult.suggestedTitle || session.topic).trim() || undefined,
            artifacts: priorArtifacts,
            videoData: aiResult.videoData,
            lastIntent: 'voice_study_turn',
            memory: studentMemory,
            semanticSnapshot: postAiSemanticSnapshot,
            videoSnapshot,
            systemNotices,
            sessionLanguageState: effectiveVoiceSessionLanguageState,
            metacognitiveState: mergedMetacognitiveState,
            preferredSupportPatterns: metacognitiveProfile.preferredSupportPatterns || undefined,
        });
        const reflectionPrompt = (0, metacognitionService_1.chooseMetacognitivePrompt)({
            userText,
            awaitingStudentAttempt: Boolean(aiResult.state?.awaitingPracticeQuestionAnswer ||
                provisionalTutorState.awaitingStudentAttempt),
            afterMistake: Boolean(mergedMetacognitiveState?.errorType ||
                /\b(incorrect|not quite|mistake|wrong step|check that step)\b/i.test(fullAiResponse || aiResult.processedText)),
            afterSuccess: /\b(well done|good work|that is right|you got it|correct)\b/i.test(fullAiResponse || aiResult.processedText),
            currentErrorType: mergedMetacognitiveState?.errorType || null,
        });
        const presentation = {
            ...buildReflectionPresentationPatch(reflectionPrompt),
            ...(priorTutorState.awaitingStudentAttempt ? { awaitingStudentAttempt: true } : {}),
        };
        const assistantMetadata = {
            ...(Object.keys(presentation).length > 0 ? { presentation } : {}),
            language: {
                ...buildMessageLanguageMetadata({
                    text: userText,
                    sessionLanguageState: effectiveVoiceSessionLanguageState,
                    detectedInputLanguage,
                }),
                generatedLanguage: effectiveVoiceSessionLanguageState.preferredResponseLanguage,
            },
            metacognition: mergedMetacognitiveState,
            systemNotices,
        };
        await prismaClient_1.default.chatMessage.create({
            data: {
                sessionId,
                role: 'model',
                content: fullAiResponse || aiResult.processedText,
                timestamp: new Date(),
                messageNumber: session.messages.length + 2,
                metadata: toPrismaMetadata({
                    videoData: aiResult.videoData || null,
                    video: aiResult.videoData || null,
                    sources: safeSources,
                    tutorArtifacts: priorArtifacts,
                    videoContextSummary: videoSnapshot.activeVideoSummary,
                    videoConcepts: videoSnapshot.activeVideoConcepts,
                    videoWhyRecommended: videoSnapshot.activeVideoWhyRecommended,
                    ...assistantMetadata,
                }),
            }
        });
        await prismaClient_1.default.chatSession.update({
            where: { id: sessionId },
            data: {
                topic: isPlaceholderTitle(session.topic)
                    ? (normalizeTitleCandidate(aiResult.suggestedTitle || '', userText) || deriveTitleFromText(userText) || session.topic)
                    : session.topic,
                updatedAt: new Date(),
                metadata: toPrismaMetadata(mergeSessionMetadata({
                    existing: session.metadata,
                    conversationState: aiResult.state,
                    tutorState,
                    tutorArtifacts: priorArtifacts,
                    systemNotices,
                })),
            },
        });
        try {
            await updateCopilotPreferencesMetadata(studentId, {
                ...preferenceMetadata,
                sessionLanguageState: {
                    ...effectiveVoiceSessionLanguageState,
                    lastDetectedInputLanguage: detectedInputLanguage,
                },
            });
        }
        catch (error) {
            logger_1.logger.warn({ userId: studentId, error: String(error) }, '[VoiceChat] Failed to persist language state');
        }
        try {
            await applyDeterministicMasteryUpdate({
                studentId,
                priorState: effectiveVoiceState,
                nextState: aiResult.state,
                topic: safeString(aiResult.topic || tutorState.activeTopic || session.topic).trim() || undefined,
                userMessage: userText,
                aiResponse: fullAiResponse || aiResult.processedText,
            });
        }
        catch (error) {
            logger_1.logger.warn({ studentId, sessionId, error: String(error) }, '[VoiceChat] Deterministic mastery update failed');
        }
        res.write(`data: ${JSON.stringify({
            type: 'done',
            state: aiResult.state,
            metadata: {
                tutorState,
                video: aiResult.videoData,
                sources: safeSources,
                assistantMetadata,
            }
        })}\n\n`);
        res.end();
    }
    catch (error) {
        if (fs_1.default.existsSync(audioFilePath))
            fs_1.default.unlinkSync(audioFilePath);
        logger_1.logger.error({ error: String(error) }, '[VoiceChat] Fatal Error');
        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
        else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Voice processing failed' })}\n\n`);
            res.end();
        }
    }
});
router.post('/stt', schoolAuthMiddleware_1.schoolAuthMiddleware, sttLimiter, upload.single('audio'), async (req, res) => {
    logger_1.logger.info({ userId: req.user?.id }, '[STT BACKEND] 🎤 STT request');
    try {
        if (!req.file) {
            logger_1.logger.error('[STT BACKEND] ❌ No audio file provided in request');
            return res.status(400).send({ message: 'No audio file provided' });
        }
        const studentId = req.user.id;
        const sessionUsageId = readVoiceSessionUsageId(req);
        if (!(await ensureActiveVoiceSession(studentId, sessionUsageId, res)))
            return;
        const preferenceMetadata = await getCopilotPreferencesMetadata(studentId);
        const requestedLanguageState = normalizeSessionLanguageState(parseMaybeJsonRecord(req.body?.sessionLanguageState) || preferenceMetadata.sessionLanguageState, req.body?.preferredLanguage || req.body?.languageMode || 'english');
        const requestedMode = normalizeVoiceLanguageMode(requestedLanguageState.preferredLanguageMode || req.body?.languageMode || req.body?.preferredLanguage);
        const audioFilePath = req.file.path;
        logger_1.logger.debug({ path: audioFilePath, size: req.file.size, mimetype: req.file.mimetype }, '[STT BACKEND] 📁 Audio file received');
        try {
            // Use OpenAI Whisper to transcribe the audio
            logger_1.logger.debug('[STT BACKEND] 📡 Sending to OpenAI Whisper...');
            const transcription = await openai.audio.transcriptions.create({
                file: fs_1.default.createReadStream(audioFilePath),
                model: 'whisper-1',
                language: toWhisperLanguage(requestedMode),
                prompt: buildSttPrompt(requestedMode),
                temperature: 0,
            });
            logger_1.logger.info({ transcriptionText: transcription.text }, '[STT BACKEND] ✅ Transcription success');
            // Clean up the uploaded file
            fs_1.default.unlinkSync(audioFilePath);
            const detectedInputLanguage = detectInputLanguage(transcription.text);
            try {
                await updateCopilotPreferencesMetadata(studentId, {
                    ...preferenceMetadata,
                    sessionLanguageState: {
                        ...requestedLanguageState,
                        lastDetectedInputLanguage: detectedInputLanguage,
                    },
                });
            }
            catch (persistError) {
                logger_1.logger.warn({ userId: studentId, error: String(persistError) }, '[STT BACKEND] Failed to persist session language metadata');
            }
            res.status(200).json({
                text: transcription.text,
                detectedInputLanguage,
                preferredResponseLanguage: requestedLanguageState.preferredResponseLanguage,
            });
        }
        catch (error) {
            // Clean up the file if transcription fails
            if (fs_1.default.existsSync(audioFilePath)) {
                fs_1.default.unlinkSync(audioFilePath);
            }
            logger_1.logger.error({ error: error.response?.data || error.message }, '[STT BACKEND] ❌ Transcription error');
            res.status(500).send({ message: 'Failed to transcribe audio' });
        }
    }
    catch (error) {
        logger_1.logger.error({ error: String(error) }, '[STT BACKEND] Error:');
        res.status(500).send({ message: 'Internal server error', details: String(error) });
    }
});
// ============================================================================
// TEXT-TO-SPEECH ENDPOINT (OpenAI TTS with "alloy" voice)
// ============================================================================
router.post('/tts', schoolAuthMiddleware_1.schoolAuthMiddleware, ttsLimiter, async (req, res) => {
    logger_1.logger.info({ userId: req.user?.id }, '[TTS BACKEND] TTS request');
    try {
        const studentId = req.user.id;
        const sessionUsageId = readVoiceSessionUsageId(req);
        if (!(await ensureActiveVoiceSession(studentId, sessionUsageId, res)))
            return;
        const preferenceMetadata = await getCopilotPreferencesMetadata(studentId);
        const requestedLanguageState = normalizeSessionLanguageState(req.body?.sessionLanguageState, req.body?.preferredLanguage || req.body?.languageMode || preferenceMetadata.sessionLanguageState || 'english');
        const requestedMode = normalizeVoiceLanguageMode(requestedLanguageState.preferredLanguageMode || req.body?.languageMode || req.body?.preferredLanguage);
        const text = sanitizeTtsInput(safeString(req.body?.text), requestedMode);
        const requestedVoice = safeString(req.body?.voice).toLowerCase();
        const voice = ALLOWED_TTS_VOICES.has(requestedVoice) ? requestedVoice : DEFAULT_TTS_VOICE;
        const speedRaw = Number(req.body?.speed ?? 1.2);
        const speed = Number.isFinite(speedRaw) ? Math.min(1.25, Math.max(0.95, speedRaw)) : 1.2;
        logger_1.logger.debug({ textLength: text?.length }, '[TTS BACKEND] Request body');
        if (!text || typeof text !== 'string') {
            logger_1.logger.error('[TTS BACKEND] Invalid text parameter');
            return res.status(400).send({ message: 'Text is required' });
        }
        if (text.length > MAX_TTS_CHARS) {
            return res.status(413).send({ message: `Text too long (max ${MAX_TTS_CHARS} characters).` });
        }
        logger_1.logger.debug('[TTS BACKEND] Sending request to OpenAI TTS...');
        let mp3;
        try {
            mp3 = await openai.audio.speech.create({
                model: DEFAULT_TTS_MODEL,
                voice: voice,
                input: text,
                speed,
                instructions: buildTtsInstruction(requestedMode),
                response_format: 'mp3',
            });
        }
        catch {
            mp3 = await openai.audio.speech.create({
                model: 'tts-1',
                voice: DEFAULT_TTS_VOICE,
                input: text,
                speed,
                response_format: 'mp3',
            });
        }
        logger_1.logger.debug('[TTS BACKEND] Received response from OpenAI');
        const buffer = Buffer.from(await mp3.arrayBuffer());
        logger_1.logger.debug({ bufferSize: buffer.length }, '[TTS BACKEND] Buffer created');
        if (buffer.length === 0) {
            logger_1.logger.error('[TTS BACKEND] Generated audio buffer is empty');
            return res.status(500).send({ message: 'Generated empty audio' });
        }
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length,
            'Cache-Control': 'no-store',
            'X-TTS-Voice': voice,
        });
        res.send(buffer);
    }
    catch (error) {
        console.error('[TTS BACKEND] Error in TTS endpoint:', error);
        res.status(500).send({ message: 'Failed to generate speech', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map